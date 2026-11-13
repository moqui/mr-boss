# IronStone BOSS — Commerce implementation

Nov 6, 2026 — built: P0–P15 with IronStone Shop's P1–P9 in the one build order of §1 (stages C1/S1–C4/S4), each phase
reviewed by a fresh agent and its fixes committed apart, merged in waves with the full regression suites after each
(the Wave lines under the phases). What remains is §7 and the open findings of §6 (mr-moqui `plans/Remaining-Work.md`).
Nov 5, 2026 — plan, before Commerce starts. P0 partly done: F1–F36 found while writing it, F37–F45 from Customer
Service's finished code (§6); design-commerce, design-shop and the crosscut rows they touch brought in line with them.
The plan's open questions answered (§4: the owners' contracts built here, Accept Hosted, gift cards and click and
collect later, budgets raised per phase, no checkout opt-in), and the review of Nov 5 decided (§4: Support linked from
Shop, promotion limits on every store order, recovery consent by a preferences topic, review images). Customer Service
is done; Commerce is built next, with IronStone Shop in one build order (§1); Shop's phases are in
[impl-shop.md](../../mr-pass/plan/impl-shop.md).

How [design-commerce.md](design-commerce.md) gets built, in phases from the foundation to the channel feeds, each ending
tested and usable. This file is kept at a high level, as [impl-customer-service.md](impl-customer-service.md),
[impl-purchasing.md](impl-purchasing.md) and the other core-app plans are: each phase names its scope by the design's
sections and §14 needs rather than restating them, and the design stays the place for screen and record detail. During
the build this file is the log: phase status and what each built, the decisions made, open questions, findings against
the code, and what is deferred.

Today `screen/Commerce/` holds six flat placeholders (Home, Stores, Merchandising, Orders, Integrations, Settings), and
the root mounts only Chatter and RecordFiles. The `BOSS_COMMERCE` admin authz is live (F1); P1 adds the root user group
and the ordinary groups. Mantle has the ProductStore records and six store services (clone, shipping options and URL
slugs) with no permission check, and no store reads or saves, publication, review, theme, page-route, channel or feed
services (F9–F21). Commerce is built after Customer Service (§4), on what the earlier apps built (as found in the
code, §6):
- from Products: Product360, CategoryContent, Documents, DocumentDetail, Prices, PriceLists, PriceListDetail, PriceExplain
  and InventoryAvailability as shared screens routed through `ironstone.products.CatalogServices.get#SharedContext`
  (F4); the price resolver with its trace (P5); `check#ProductUsable` (P2);
- from Accounting: Shared/Customer360, OrderDetail, InvoiceDetail and ShipmentDetail with their branches; PaymentMethods
  and TaxAuthorities (F6); `simulate#SalesTax`, `create#InvoiceFromSource` and `preview#Dunning`; the PASS Billing app
  with its hosted payment and `PortalPaymentAttempt` (P18); the CX-POSTING operation record (P2);
- from Warehouse: StoreReservation over `mantle.facility.WarehousePolicyServices.update#StoreReservation` (P3, X16)
  and Carriers (F6, F7);
- from Customer Service (F25, F37–F41): cases filed by `mantle.request.SupportCaseServices.create#CustomerCase` in
  one of the organization's offered queues, returns from `mantle.order.ReturnPolicyServices.request#CustomerReturn`,
  cancel proposals from `mantle.order.OrderChangeServices.request#CustomerCancel` (the `requestOrderCancel`
  operation), Shared/ReturnDetail's and RequestDetail's Customer Service branches, the PASS Support app, ExternalAccess's
  `support` app kind and self relationship (`selfOf`), the shared media stage `mantle.party.PortalMedia.js`, and the
  sales commercial revision (`PartyAcctgPreference.salesCommercialRevisionOnly`, X2);
- from Commons: the Knowledge wiki editor, mounted with a context flag as Projects and Customer Service mount it (F29);
  consent and unsubscribe tokens (M11); the palette, record links and quick create;
- from PASS: sites with hosts and targeted app mounts, public accounts, the facade with Mantle's PassApi for a remote
  frontend, media staging and scanning, and the Billing app's hosted-payment page as the pattern for Shop's.

**Inputs.**
- Designs:
  - [design-commerce.md](design-commerce.md)
  - `mr-pass/plan/design-shop.md`: the public side, which this plan builds with Shop (§4 sites and identity, §5 catalog,
    §7–§10 checkout to subscriptions, §12 themes, §13 operations, §14 records, §15 needs)
  - [design-crosscut.md](design-crosscut.md) §1.3 (the automation register and Commerce's and Shop's conditions), §1.4
    (capability groups), §1.5 (CX-ASSIST and the Comms hooks), §2 (the shared-screen registry), §3.2, §3.5–§3.7, §3.11,
    §3.18, §3.21, §3.28, §5 and §7 (CX-DELIVERY, CX-OPS-REPORTS)
  - [design-products.md](design-products.md) §5 categories, §7 prices, §9 documents and the Paid access row (X16)
  - [design-warehouse.md](design-warehouse.md): StoreReservation and WH-POLICY; Carriers
  - [design-accounting.md](design-accounting.md): AC-02 (the payment-attempt coordinator), PaymentMethods, Tax, Dunning
  - [design-customer-service.md](design-customer-service.md) §4 (customer cancellation), §5 (returns) and §8 (the Support
    pages Shop mounts)
  - [design-sales.md](design-sales.md) (RecurringTemplate, SAL-RECURRENCE, the Subscriptions mount),
    [design-marketing.md](design-marketing.md) §6–§8 (the cart-abandoned trigger, the promotion and landing-page mounts),
    [design-admin.md](design-admin.md) §11 and §14, [design-insights.md](design-insights.md)
  - `mr-pass/plan/design-forum.md` §1, §4, §5, §8 (the PASS Account foundation), §13.1 (how a PASS app registers) and
    §13.2 (Shop: `subscriptionUrl` and paid access)
- Plans:
  - [impl-customer-service.md](impl-customer-service.md): the pattern, and P9, P10, P13 and P15, whose services and pages
    Commerce shows and Shop mounts.
  - [impl-products.md](impl-products.md): the shared catalog screens and their context service; its §7 leaves Commerce
    merchandising and the Commerce rows of the price screens here.
  - [impl-accounting.md](impl-accounting.md): P2 (the operation record), P18 (Billing, the capability service), and its §7
    (chargebacks calling Shop's `reconcile#RefundedItem`).
  - [impl-warehouse.md](impl-warehouse.md) P3 (StoreReservation) and [impl-purchasing.md](impl-purchasing.md) F22 and F41
    (promotions found by the order's store).
  - [impl-shop.md](../../mr-pass/plan/impl-shop.md), its companion; `mr-pass/plan/implementation-forum.md` and
    `mr-pass/docs/Deployment.md`.
  - mr-mantle `plan/payments-shipping-edi.md`: what the gateway, carrier and EDI work built (Shop F14).
- The suite-app design review, which explains the design's X, Z, L and R-COM IDs, was removed from the tree (mr-boss
  bd74564); read it with `git show bd74564^:plan/review-suite-apps.md` (§3 decisions, §4 one owner per step).
- Guides and rules: [design-doc-guide.md](design-doc-guide.md), [style-guide.md](style-guide.md) §8,
  [impl-drawers-commons.md](impl-drawers-commons.md) §4 (the shared rules), mr-moqui `docs/dev/Practices-App-Dev.md`.
- Inventories: [ss-inventory.md](ss-inventory.md) (64 Commerce rows, every ProductStore form among them) and
  [usl-inventory.md](usl-inventory.md) (41 rows), which carry the design's **Designed in** paths.
- mr-moqui: `plans/Remaining-Work.md` and `docs/Build-Test.md`.

Framework paths are under the mr-moqui checkout (`crates/`, `runtime/components/base/`), Mantle paths under
`runtime/components/addon/mr-mantle/`, PASS paths under `runtime/components/addon/mr-pass/`.

Sections: [1 scope](#1-scope-and-order) · [2 rules](#2-ground-rules) · [3 phases](#3-phases) ·
[4 decisions](#4-decisions) · [5 open](#5-open-questions) · [6 findings](#6-findings) · [7 later](#7-later) ·
[8 verification](#8-verification)

---

## 1. Scope and order

- **Repositories.** Each is its own git repo:
  - `mr-moqui` (`crates/`, `runtime/components/base`): the theme preview's isolated origin (P5); Shop's renderer work
    is in impl-shop;
  - `runtime/components/addon/mr-mantle`: the store, merchandising, operations, promotion, theme and page, channel and
    subscription services and records;
  - `runtime/components/addon/mr-boss`: the Commerce app;
  - `runtime/components/addon/mr-pass`: Shop, under impl-shop, and the Shop pieces of Commerce's P5 (the preview host), P9
    (ProductDetail's reviews and their images), P10 (the route redeeming a recovery link) and P14 (the Shop-site feed
    destination).

  `runtime/components/addon/mr-marble` is read only, for the baseline ProductStore, promotion and promo code screens that
  ss-inventory maps (SimpleScreens `ProductStore/`).
- **Scope.**
  - Every `parity` and `new` row of design §2, and the §14 needs they use, as changed by §6 (F5, F6).
  - The design reshaped by the shared rules (§2, §4): store staff as dated ProductStoreParty rows, publication as dated
    ProductStoreProduct rows, checkout and recovery policies as dated ProductStoreSetting types, review decisions in the
    audit log; theme releases, feed builds and import batches stay records of their own.
  - The parts of other apps' needs Commerce depends on (§4): Products' CategoryDetail as a shared screen (P3);
    the store-scoped sales reads of `SalesReportServices` (P11). Shop's plan carries the others (impl-shop §1).
  - Shared screens: Commerce builds `Shared/Pages` and `Shared/PageDetail` (P4) and `Shared/Promotions`,
    `PromotionDetail`, `PromoCodes` and `PromoCodeDetail` (P7), each with Commerce's context only; Marketing mounts them
    later. Commerce's context on the shared screens other apps built:
    - Products' Product360, CategoryDetail (made shared in P3), CategoryContent, Documents, DocumentDetail, PriceLists,
      PriceListDetail, PriceExplain and InventoryAvailability (P3);
    - Accounting's OrderDetail and Customer360, and Customer Service's ReturnDetail and RequestDetail contexts (P8).
  - §7 holds the design's `later` scope, the §17 items not taken here, and the other apps' mounts.
- **Order** (decided Nov 5, §4). Commerce and Shop are built together, in the design's
  stages C1–C4 and S1–S4 (design §15, design-shop §17), each stage ending at its shared release gate. A phase lives in
  the plan of the app whose screens it builds; Mantle and framework work goes in the phase that first needs it. This
  list is the one order of both plans; impl-shop §1 points here.

  | # | Phase | Stage |
  | --- | --- | --- |
  | 1 | Commerce P1 Foundation | C1/S1 |
  | 2 | Commerce P2 Stores | |
  | 3 | Shop P1 App and mount | |
  | 4 | Commerce P3 Assortment and catalog mounts | |
  | 5 | Shop P2 Theme engine and releases | |
  | 6 | Commerce P4 Site pages and navigation | |
  | 7 | Shop P3 Catalog pages | |
  | 8 | Commerce P5 Theme editors and preview | gate C1/S1: a browseable shop, local and remote |
  | 9 | Commerce P6 Checkout settings | C2/S2 |
  | 10 | Commerce P7 Promotions | |
  | 11 | Shop P4 Cart and shopper identity | |
  | 12 | Shop P5 Checkout and payment | |
  | 13 | Shop P6 Orders, account and digital delivery | |
  | 14 | Commerce P8 Orders, carts and customers | |
  | 15 | Commerce P9 Reviews | |
  | 16 | Commerce P10 Cart recovery | |
  | 17 | Commerce P11 Reports and Home | gate C2/S2: purchases |
  | 18 | Shop P7 Prepaid and recurring access | C3/S3 |
  | 19 | Commerce P12 Paid access and subscriptions | gate C3/S3: recurring access |
  | 20 | Commerce P13 Integrations and channel import | C4/S4 |
  | 21 | Commerce P14 Feeds and channel health | |
  | 22 | Shop P8 Adoption and operations | gate C4/S4: channels and operations |
  | 23 | Commerce P15 and Shop P9 Finish | |

  Each phase starts after the one above it, except these pairs, which run side by side because neither uses the
  other's work: Shop P1 beside Commerce P3; Commerce P6 beside P7; Commerce P13 beside P14. The dependencies that fix
  the rest of the order: Shop P1 registers Commerce P2's `check#StoreReadiness`; Shop P2 renders Commerce P3's
  publication; Shop P4 and P5 use Commerce P6's settings and P7's locked limits; Commerce P8 shows Shop P5's and P6's
  orders, and P9's review request goes through Shop P6's delivery ledger. A phase of a pair that changes the same
  Mantle file as the other waits for it.

## 2. Ground rules

- **The Commons rules hold.** These are impl-drawers-commons §4:
  - failure tolerance;
  - the Mantle-free framework;
  - Mantle stands without BOSS;
  - business logic leans to Mantle;
  - the new XML element checklist of style-guide §8.1;
  - libraries through `libs/refresh.mjs`, and crates against `deny.toml`;
  - the `.qvue` gallery pattern;
  - parties by role;
  - changes by effective date and the audit log;
  - demo data;
  - builds and commits.

  The walks are on Products' and Customer Service's pattern: one golden-path walk in `test/client/`, named
  `<App><Area>Walk` and registered in `test/client/suite.js`, the rest acceptance tests (F44).
- **Service rows through services.** ProductStore is filtered by organization (the `_D` rows of the `MANTLE_USER_ORG`
  and `MANTLE_ACTIVE_ORG` filter sets), but its child records, OrderHeader, OrderItem, ProductReview,
  ProductStorePromotion, the `mantle.public` site records and SystemMessageRemote are not (F9). Commerce reads and
  writes them only through services: `ironstone.commerce.ContextServices` checks the organization, the store (and a
  store-limited staff member's stores, §4) and the capability, then the screen calls the Mantle service, which checks
  its own permission and the store's organization (`get#PartyOrganizationInfo`). No same-named `ironstone` pass-through
  is built.
  - `C.`, `M.`, `O.`, `P.`, `T.`, `I.` and `R.` in a design form summary name the guarded Mantle path of design §1.3,
    never a bare entity form. The letters are design-commerce §1.3's; design-shop §13.2 has its own (its C is
    `ShopCartServices`), so both plans write Shop's services in full.
  - Grants are checked in the services, so they hold for exports, choices, search, the palette, previews and shared
    mounts. The `BOSS_COMMERCE_*` groups get no artifact authorization for the raw Mantle store, order, promotion and
    site mutators or their REST paths (`mantle.rest.xml`'s `productStores` entity paths, F9).
- **Staff and public apart.** Commerce is BOSS, Shop is PASS (impl-shop). No authoring operation (theme, page,
  navigation, publication, preview) is in PASS's operation registry; preview is a staff capability of its own (P5). A
  published shop runs without BOSS: every rule it needs (publication, the theme release, page bindings, checkout) is
  Mantle's, and Commerce calls the same Mantle modules through their staff services (design-shop §13.2).
- **What Mantle runs is Mantle's.** The store, merchandising, operations, promotion, theme, channel and subscription
  services are Mantle's, in the packages of design §1.3 (`mantle.product.StoreAdminServices`, `StoreMerchandisingServices`,
  `StorePromotionServices`, `StoreChannelServices`, `ShopSubscriptionServices`; `mantle.order.StoreOperationsServices`;
  `mantle.public.ThemeServices`), each checking a `COMMERCE_*` permission (P1) and the store's organization, with its
  records in `mantle.product.store`, `mantle.product.subscription`, `mantle.public` and `mantle.order`, never BOSS
  `entity/`. Mantle specs grant the
  permissions to spec-local groups, never a `BOSS_*` group. `ironstone.commerce` keeps ContextServices, the screens'
  reads and shapes, the settings forms, ReportingServices and the demo, and calls the Mantle services.
- **Store records follow the shared rules** (impl-drawers-commons §4; §4 here):
  - Parties by role: a store's staff are dated ProductStoreParty rows in the `StoreStaff` role, a store group's parties
    dated ProductStoreGroupParty rows. ProductStore keeps its organization field, as Mantle keys it.
  - Effective-dated rows with their key fields audit-logged: store publication (ProductStoreProduct), settings and
    policies (ProductStoreSetting, with the checkout and recovery types), facilities, emails, categories and approval
    checks (already dated), local shipping rates, recurring offers, feeds. A change ends the current row and starts the
    next; a read takes an as-of date.
  - The audit log on the key fields a phase locks: ProductStore's policy fields, the store's payment-gateway and
    ship-option bindings (not dated in Mantle, F15), ProductReview's status and reply, promotion and code limits and
    dates.
  - Records of their own where a fact has its own identity, and the phase says why: a theme release (an immutable
    manifest), a feed build (an artifact), a channel import batch (SystemMessage), Shop's checkout and payment attempt
    (impl-shop), and Comms' delivery ledger entries.
  - Prints and exports take an effective date and time; a theme release export is its pinned manifest.
- **One publication generation.** Every publish, withdrawal, restore or scheduled change of a product, page, menu or
  theme advances the site's `PublicSite.generation` (or the store's, for a store bound to several sites) in its own
  transaction, so Shop's caches, search, sitemap and feeds drop it (design-shop §12.7). Live reads intersect current
  publication even under an old release.
- **Restricted values stay on the server.** A Commerce service leaves out what the user may not read: costs and margins
  (by `PRODUCT_COST_VIEW`), supplier prices, price traces (by `PRICE_VIEW`), gateway configuration and credentials,
  customers' private fields, raw channel and payment payloads; omitted or said to be withheld, never shown as zero.
- **Revisions and operations.** Every publication, clone, bulk action, recovery send, retry, import commit and feed
  publish names its source revision (a row's `lastUpdatedStamp`, the order's `orderRevision`, a release's revision) and
  an operation identity on the CX-POSTING record, `mantle.ledger.transaction.PostingOperation`, as Billing and Customer
  Service use it. A retry answers the first result; a stale revision is refused naming the current one. A batch names
  each failure and goes on.
- **Shared screens.** Commerce builds the six of §1 and makes Products' CategoryDetail shared (P3, F5). It adds its
  context to the shared screens of §1, each taking `appRoot` and server-derived capabilities on
  `Shared/RequestDetail`'s pattern; its context adds no right a borrowed capability does not give.
- **Owner contracts.** A contract built here or in impl-shop for another app (§4) follows that app's design: its
  package, record and service names, permissions and Shared screen. A change found while building it is written into
  the owner's design. The owner's own screens stay with the owner.
- **Mantle rule changes keep Mantle's default.** Each new condition on an existing service or rule acts only on a store
  record Commerce or Shop makes (a dated publication, a Shop checkout, a Shop-linked recurring base, a store with local
  rates) and ships with a test of its condition and of its unchanged default (crosscut §1.3). The one deliberate
  exception is the promotion use limits (P7, §4): every limit field is enforced under a lock at `place#Order` for any
  store order, with tests that an order with no limits and mr-marble's order screens are unchanged.
- **Mantle callers stay compatible.** Existing callers of these keep working: `clone#ProductStore`,
  `get#StoreShippingOptions`, `add#`/`remove#OrderPromoCode` and `apply#OrderPromotions` (mr-marble's order screens and
  `handle#OrderMajorChange`), the signature-requirement read in ShipmentServices and the Forum's product link
  (ForumIntegration.js), `get#SitePage` and `publish#SitePage` for the Forum's guidelines and about pages,
  `update#StoreReservation`, and the Billing and Supplier apps. Mantle's OrderToCashBasicFlow, ReturnToResponseBasicFlow,
  Subscriptions, AccountingPortals and PassAuthority specs, PASS's specs (Forum, ForumAccess, Integrations, Portals,
  SupplierPages, and ForumHttp, PortalHttp and RemoteHttp in the browser), mr-marble's render specs and the earlier apps'
  BOSS regression suite pass unchanged.
- **Done for a phase** means all of these:
  - impl-projects §2 "Done":
    - cargo tests for the touched crates, with goldens reviewed;
    - the regression tests for the rules the phase adds passing: Mantle's in mr-mantle, BOSS's in mr-boss, PASS's in
      mr-pass;
    - the regression suites of mr-mantle, mr-boss and mr-pass passing within their budget, each raised by the phase's
      measured share with the user's agreement (§4);
    - `moqui lint --screens` clean for BOSS (and PASS, for a phase that touches it) with the Debug binary;
    - the inventories' **Implemented in** columns;
  - an access rule the phase adds checked in `CommerceAccess` (one holder and one non-holder on one verb, and another
    organization's store refused), not every service and mount; ProjectsAccess passing with the new package (F3);
  - its row and **Built** note here.

  No route fixtures: a screen sweep is an acceptance test, one per app per mode. The phase's "usable when" and its §8
  scenario are acceptance tests to write (`test/acceptance/Commerce/`, `test/acceptance/client/Commerce/`; for a phase that
  touches Shop, mr-pass `test/acceptance/` on ForumHttp's and RemoteHttp's pattern), named in the phase; running them is not
  part of Done.

## 3. Phases

| Phase | Repos | Screens | Status |
| --- | --- | --- | --- |
| P0 Checks | all (read) | — | done Nov 5 (§6 F1–F56) |
| P1 Foundation | Mantle, BOSS | the Commerce root and menu, Home | built Nov 5, 2026 |
| P2 Stores | Mantle, BOSS | Stores, StoreDetail, StoreGroups | built Nov 5, 2026 |
| P3 Assortment and catalog mounts | Mantle, BOSS | Merchandising, StoreCategories, Product360, CategoryDetail, CategoryContent, Documents, DocumentDetail, PriceLists, PriceListDetail, PriceExplain, InventoryAvailability || built Nov 5, 2026 |
| P4 Site pages and navigation | Mantle, mr-pass (read), BOSS | Pages, PageDetail, Navigation | built Nov 6, 2026 |
| P5 Theme editors and preview | mr-moqui, Mantle, mr-pass, BOSS | Themes, ThemeDetail, ThemeEditor, TemplateEditor | built Nov 6, 2026 |
| P6 Checkout settings | Mantle, BOSS | CheckoutSettings | built Nov 6, 2026 |
| P7 Promotions | Mantle, BOSS | Promotions, PromotionDetail, PromoCodes, PromoCodeDetail | built Nov 6, 2026 |
| P8 Orders, carts and customers | Mantle, BOSS | Orders, OrderDetail, Carts, CartDetail, Returns, ReturnDetail, Customers, Customer360, Requests, RequestDetail | built Nov 6, 2026 |
| P9 Reviews | Mantle, mr-pass, BOSS | Reviews; Shop ProductDetail's reviews | built Nov 6, 2026; follow-up (review requests topic, checkout opt-ins) built Nov 6 |
| P10 Cart recovery | Mantle, mr-pass, BOSS | CartDetail's recovery, CheckoutSettings' RecoveryPolicy | built Nov 6, 2026 |
| P11 Reports and Home | Mantle, BOSS | Home, OnlineSales, CartRecovery, PromotionUse | built Nov 6, 2026 |
| P12 Paid access and subscriptions | Mantle, mr-pass, BOSS | Product360's Paid access, Subscriptions, SubscriptionDetail, CheckoutSettings' RecurringPolicy | built Nov 6, 2026 |
| P13 Integrations and channel import | Mantle, BOSS | Integrations, IntegrationDetail, ChannelImport | built Nov 6, 2026 |
| P14 Feeds and channel health | Mantle, mr-pass, BOSS | Feeds, FeedDetail, ChannelHealth | built Nov 6, 2026 |
| P15 Finish | Mantle, mr-pass, BOSS | StoreDetail's summary; the sweeps and the review walk (acceptance) | built Nov 7, 2026 |

### P0 — Checks

Verify the design's riskiest assumptions against the code before building. Each result is a row in §6 and, where it
changes the design, an edit there. F1–F36 were found on Nov 5 while writing this plan, from the code as Customer
Service P1–P8 and P12 left it, and the design edits they call for were made then (§6). The check of Customer
Service's finished pieces was done later on Nov 5 (F25, F37–F45): each landed, and what differs from what this plan
assumed is in those findings (no store queue link, the Support pages bound to the site's Support mount, no
`SalesOrder` capability, no Account hub or email preferences page). The five below were checked later on Nov 5 (F46–F56):

- **The Knowledge editor for PageDetail** (F29): it edits a wiki publishing space's pages (Customer Service's
  `inCustomerService` mount edits ZZW_RETAIL), never a `PublicSitePage`; still to check is what a version note and the
  wiki's `canUpdate` need for a Commerce designer who is not a space member, and its look without Commons navigation.
- **The Products shared contexts** (F4): for each shared catalog screen, the tabs, routes and actions SharedContext.js
  gives Customer Service and Purchasing, as the model for Commerce's; whether Products' store choice lists (Prices.js,
  Taxonomy.js) list stores outside the user's organizations.
- **The preview origin** (P5): whether the framework's public-site routing can serve a second registered host for a
  site's previews with its own CSP (`frame-ancestors` the BOSS origin only), and what the BOSS qvt shell needs to frame
  it.
- **The demo store's pages** (F17): Customer Service's CustomerArticle builds its links with `PublicApps.pageUrl`
  rather than ZZW_RETAIL's relative `/popc/content/` URL (its F105); still to check is what else reads that URL before
  Shop P3 gives the space a real address.
- **The organization filters on the new records:** that a store-limited staff member's ProductStore reads, through the
  filters and the services, see only their stores.

### P1 — Foundation

Design §1.1, §1.2 and §3 Home; COM-ACCESS.

- **Access** (design §1.1).
  - The groups of design §1.1: `BOSS_COMMERCE` as the root user group beside the artifact group of that name, and
    `_MANAGER`, `_MERCHANDISER`, `_DESIGNER`, `_THEME_DEVELOPER`, `_PUBLISHER`, `_OPERATOR`, `_CHANNEL_OPERATOR` and
    `_SUBSCRIPTION_OPERATOR`, on Customer Service's pattern (F45): groups are not nested; a Commerce user is in
    `BOSS_USERS`, `BOSS_COMMERCE` and a capability group, the administrator in `BOSS_USERS` and `BOSS_COMMERCE_ADMIN`,
    which keeps its live authz (F1); an area that only some groups see is an artifact group that denies the root group
    and allows its capability groups.
  - The ordinary groups' authz on the root with the organization filters of impl-drawers-commons §4 (`MANTLE_USER_ORG`,
    `MANTLE_PRIVATE_CONTACT`), the `ironstone\.commerce\..*` service pattern on the artifact group, and `commerce` in
    the client deny pattern, its three rows that pass 255 characters split (F3).
  - The permissions: mr-mantle seeds the twelve `COMMERCE_*` `UserPermission` rows of design §1.1 in
    `MantleSetupData.xml`, each with its ADMIN grant (F2), and BossSetupData grants them by design §1.1's table.
    Commerce users also get `PRODUCT_CATALOG_VIEW` on the root group and `PRICE_VIEW` on the manager, merchandiser and
    operator (as Customer Service F87), so the shared catalog screens open.
  - `ironstone.commerce.ContextServices` (design §1.1): `get#SharedContext` (capabilities, authorized store choices,
    `appRoot`, `sharedLinks`), `check#Record`, `get#Choices` and `search#Records`, over one module `Commerce.js` with
    tables later phases extend (capability permissions, areas, record kinds, choice sources, link paths). A store is in
    scope when its organization passes the user's organization filter; a user with a current `StoreStaff`
    ProductStoreParty row is limited to those stores (§4). A supplied store, site, order, cart or customer is checked
    against it. The `StoreStaff` RoleType is seeded in mr-mantle.
  - No artifact authorization for the raw Mantle store, order, promotion and site mutators or their REST paths.
- **The Commerce root** (design §1.2): the ten areas Home, Stores, Merchandising, Website, Orders, Customers, Promotions,
  Integrations, Reports and Settings (the six placeholders renamed and re-indexed, the other four added, each comment
  naming its phase and groups; F1), each shown for its groups; the stale grant comment fixed. `<shell-providers>` with
  the palette source for stores (orders and carts in P8) and the `commerce` keymap; quick create and Today sources arrive
  with their records. `ironstone.commons.PaletteServices.get#RecordLink` gains a Commerce module for stores; a sales
  order stays Customer Service's until P8 (F8).
- **Home** (design §3): HomeScope's store selector and period, and WorkCards and PeriodStrip each "Not configured" until
  the phases that fill them (P8, P11); the first-use state links New store.
- **Demo data** (F17).
  - `BossCommerceDemoData.xml` completes POPC_DEFAULT as the demo store of ORG_ZIZI_RETAIL: its facility row, staff,
    ship options, email bindings for the automatic types, settings, and published products in P3. A second store,
    `BOSS_COM_DIGITAL`, of ORG_ZIZI_SERVICES sells digital items and subscriptions (P6, P12) and is the other
    organization's store for isolation.
  - The demo service makes two PASS sites, disabled until published: ZIZI_SHOP (host `shop.zizi.localhost`) for
    POPC_DEFAULT and ZIZI_DIGITAL (host `digital.zizi.localhost`) for BOSS_COM_DIGITAL, each with Account, Billing and
    Support mounts (Support targeting the store's organization, F38); Shop P1 adds their Shop mounts. Two sites and two
    stores are what design-shop §18.1's "Two sites" scenario needs.
  - BossUsersDemoData gains a user per group (`commerce.manager`, `.merchandiser`, `.designer`, `.developer`,
    `.publisher`, `.operator`, `.channel`, `.subscriptions`, `.admin`), a reader with no other launcher, a store-limited
    staff member of POPC_DEFAULT only, and ORG_ZIZI_SERVICES' manager.
- **Specs.**
  - `test/Commerce/CommerceSpecLib.js` (ids, users, `shell`, `page`).
  - `CommerceAccess`: the app's one access spec, about seven features with authorization on: organization and store
    scope through the services, the store-limited staff member, each group's permissions, the menu and providers per
    group, Home's one qvt render, and the refused REST paths and raw mutators. A later phase adds a case only for an
    access rule it adds.
  - Mantle: none in P1 beyond the seed (no Mantle rule yet).
- **Usable when** (an acceptance test to write, `test/acceptance/Commerce/CommerceFoundationWalk`): the menu renders for each
  group; the reader finds POPC_DEFAULT through the palette and not BOSS_COM_DIGITAL; the store-limited member sees only
  POPC_DEFAULT; a forged store ID is refused by `check#Record` and the palette; a Projects client and a PASS public
  account are refused the root and every `ironstone.commerce` service.

**Built Nov 5 (P1).**
- Mantle (`data/MantleSetupData.xml`, appended): the twelve `COMMERCE_*` `UserPermission` rows of design §1.1
  (`COMMERCE_VIEW`, `_STORE_EDIT`, `_MERCHANDISE`, `_PUBLISH`, `_THEME_EDIT`, `_THEME_CODE`, `_THEME_PUBLISH`,
  `_ORDER_VIEW`, `_RECOVERY`, `_PROMOTION_EDIT`, `_CHANNEL_OPERATE`, `_SUBSCRIPTION_MANAGE`), each with its ADMIN grant
  (F2); the `StoreStaff` RoleType in ProductStoreParty's seed data (`entity/ProductStoreEntities.xml`). No Mantle rule,
  so no Mantle spec.
- BOSS access (`data/BossSetupData.xml`, appended but for F3's rows):
  - the groups `BOSS_COMMERCE` (root user group), `_MANAGER`, `_MERCHANDISER`, `_DESIGNER`, `_THEME_DEVELOPER`,
    `_PUBLISHER`, `_OPERATOR`, `_CHANNEL_OPERATOR` and `_SUBSCRIPTION_OPERATOR`; `BOSS_COMMERCE_ADMIN` keeps its live
    authz (F1);
  - on the `BOSS_COMMERCE` artifact group (a second element of the same id, appended): the `ironstone\.commerce\..*`
    service pattern and the root authz `BOSS_COMMERCE_ROOT` (`MANTLE_USER_ORG`, `MANTLE_PRIVATE_CONTACT`);
  - the area groups `BOSS_COM_WEBSITE`, `BOSS_COM_ORDERS` (Orders and Customers), `BOSS_COM_INTEGRATIONS`,
    `BOSS_COM_REPORTS` and `BOSS_COM_SETTINGS`, each denying the root group (F45), and the record link group
    `BOSS_COM_RECORD_LINK`;
  - the `UserGroupPermission` grants of design §1.1's table, with `PRODUCT_CATALOG_VIEW` on the root group and
    `PRICE_VIEW` on the manager, merchandiser and operator; the administrator holds all twelve and both reads;
  - the store filter `COMMERCE_STORE` (F50) on every Commerce authz row;
  - `commerce` in the client deny pattern, its three rows over 255 characters split in two (F3: now ten rows, the
    longest 253).
  No authz for the raw Mantle store, order, promotion and site mutators or the `products/stores` REST paths.
- `ironstone.commerce.ContextServices` (`get#SharedContext`, `setup#StoreScope`, `get#StoreScope`, `check#Record`,
  `get#Choices`, `search#Records`) over `Commerce.js`, whose tables later phases extend: `capabilityPermissions` (the
  twelve and the borrowed `catalogView`, `priceView`), `areas` (website, orders, customers, integrations, reports,
  settings), `recordKinds` (store, site, order, cart, customer; a store opens Home scoped to it until P2's StoreDetail),
  `searchFinds` (stores), `choiceSources` (stores, organizations) and `linkPaths`. `read` is the root grant with
  `COMMERCE_VIEW`. A store is in scope by its organization and, for a user with a current StoreStaff row, by that row;
  `storeIn`, `storeFind` and `get#StoreScope` (storeIds, storeLimited, staffStoreIds) are the scope later phases'
  services condition on.
- The root (`screen/Commerce.xml`): always-actions `setup#StoreScope` and `get#SharedContext` with `sharedLinks` (F49);
  the menu of design §1.2 (Home, Stores, Merchandising, Website, Orders, Customers, Promotions, Integrations, Reports,
  Settings: the six placeholders renamed and re-indexed, Website, Customers, Promotions and Reports added, each comment
  naming its phase and groups); the stale grant comment replaced; `<shell-providers>` with the stores palette source and
  the `commerce` keymap (g e, g s, g m). `PaletteServices.get#RecordLink` gains the Commerce store branch.
- Home (`Commerce/Home.xml`): HomeScope (the store from `get#Choices`, checked by `check#Record`, and the period of 7, 30
  or 90 days), the scope and period line, WorkCards and PeriodStrip each "Not configured", visits and conversion left out
  without tracking; the first-use state (no store in scope) with New store for a holder of `COMMERCE_STORE_EDIT`.
- Demo: `BossCommerceDemoData.xml` (POPC_DEFAULT's ZIRET_WH facility row, the three ship options of its `_NA_` carrier,
  the two ship-label settings, the five automatic email types bound to `BOSS_COM_STORE_NOTICE` on the local sink
  `BOSS_COM_DEMO_MAIL`; `BOSS_COM_DIGITAL` of ORG_ZIZI_SERVICES, no facility, no inventory) and
  `BossZCommerceDemoData.xml` (commerce.storestaff's StoreStaff row on POPC_DEFAULT, then
  `ironstone.commerce.DemoServices.load#CommerceDemo`, `Demo.js`, each site in its own transaction: ZIZI_SHOP on
  `shop.zizi.localhost` and ZIZI_DIGITAL on `digital.zizi.localhost`, state `disabled`, with `account`, `billing` and
  `support` mounts, Billing and Support targeting the store's organization). BossUsersDemoData's `commerce.*` users:
  manager, merchandiser, designer, developer, publisher, operator, channel, subscriptions, admin (in
  `BOSS_COMMERCE_ADMIN` alone), read (the root group alone, no other launcher), storestaff (a manager of Retail and
  Services limited to POPC_DEFAULT) and services (Ziziwork Services' manager).
- Specs: `test/Commerce/CommerceSpecLib.js` (ids, users, `asUser`, `system`, `refusal`, `invoke`, `page`, `shell`) and
  `CommerceAccess` (7 features, 3.3 s feature time, the slowest the menu at 1.0 s: the context and its refusals, a
  Projects client and a PASS public account among them; the menu, providers and launcher per group; Home's one qvt render;
  the capabilities per group; store scope through `get#StoreScope`, choices, the palette and the `COMMERCE_STORE` filter
  (the fixture `test/screens/CommerceStoreRows.xml`) for the reader, the other organization and the store-limited member;
  the record check of each kind with another organization's, unassigned and forged ids and a capability on a record;
  record links, the guarded areas, the REST paths and raw mutators). Acceptance:
  `test/acceptance/Commerce/CommerceFoundationWalk` (5 features, every area per user, the palette and Home of the reader, staff
  member and other organization, forged ids, a Projects client and a PASS public account refused the root and every
  `ironstone.commerce` service, the demo's state), run once: 5 passed. The mr-boss acceptance suite with it: 430
  features, 419 passed, 9 failed, 2 skipped; the same nine fail at the commit before P1 on the same runtime (425
  features, 414 passed), from F57's older framework tree (AppStructure and TuiRender: Tools/Data/Export.xml not
  found; six Customer Service and two Purchasing walks).
- Tests run, all pass (on the runtime of F57): CommerceAccess (7); ProjectsAccess, AppOrganizationFilters,
  CustomerServiceAccess (37 features); AccountingAccess, PurchasingAccess, ProductsAccess, ManufacturingAccess,
  WarehousePolicies, WarehouseReturns, CustomerServiceOrders, CustomerServiceReturns, CustomerServiceOrderChanges,
  CustomerServiceWarranty, ProductsMethods, ProductsCosts, ManufacturingWorkOrders (123 features); Mantle RestApiTests,
  ReturnPolicies, OrderToCashTime, ReturnToResponseBasicFlow, OrderToCashBasicFlow, DropShip, SalesReports, Promotions,
  AssetReservationMultipleThreads, MantleSearch, CarrierServices (118 features, the specs that use POPC_DEFAULT).
  `moqui lint --screens` (Debug binary): no idiom or hazard site in the Commerce screens (132 sites in all, none
  Commerce's). Not run: `./moq test-apps` and the budget (F57).
- Inventories: no ss-inventory or usl-inventory row is implemented by P1 (Home's period strip and work counts are P8's
  and P11's; StoreDetail's store parties P2's).
- P0 findings brought into P1 (numbered by the lead):
  - **F49** `Commerce.xml` called no app `get#SharedContext` and set no `sharedLinks`, unlike `CustomerService.xml`.
    P1's root calls `ironstone.commerce.ContextServices.get#SharedContext` in its always-actions, setting `appRoot`
    and `sharedLinks` as Customer Service's root does.
  - **F50** The organization filters cannot limit a staff member to some stores of an organization
    (`MANTLE_USER_ORG_D` filters ProductStore by organization only). P1 adds the `COMMERCE_STORE` EntityFilterSet, a
    ProductStore row on `productStoreId` in `ec.user.context.commerceStoreIds`, with `applyCond` on that being set, on
    every Commerce authz row; the root's `setup#StoreScope` sets it from the user's current StoreStaff rows (`_NA_` when
    they cannot be read) and leaves it unset for a user with none and for a system administrator, so an unlimited user
    still sees every store of their organizations (CommerceAccess checks both through the fixture). The filters miss
    child records, orders, reads with authorization disabled, REST and the search indexes, so `check#Record`,
    `get#Choices` and `search#Records` condition on the scope in the query, and `get#StoreScope` exposes it.
- Decisions:
  - The areas by group: Home, Stores, Merchandising and Promotions for every Commerce user; Website for the merchandiser
    (navigation), designer, theme developer and publisher; Orders and Customers for the store and subscription operators;
    Integrations for the channel operator; Reports for the manager and the three operators; Settings for the manager; the
    administrator every area. A later phase that opens an area to another group adds its authz row.
  - Opening Commerce needs the root grant and `COMMERCE_VIEW`, so a deployment that grants the root alone opens nothing.
  - A store-limited staff member reaches a site only through one of their stores, which only a Shop mount names (Shop
    P1), so until then they reach no site; other users reach a site by its mounts' target organizations. A
    store-limited member reaches a customer only with an order in their stores; others by the customer's owner, as
    Customer Service (P8 revisits).
  - The demo's ship options are every method of the `_NA_` carrier (pick up, ground, next day), so POPC_DEFAULT's
    options are unchanged; the store-limited member is in both demo organizations, so the limit is what keeps
    BOSS_COM_DIGITAL out.
- Findings (provisional):
  - **F57** The shared binaries (`target/debug/moqui` and `target/release/moqui`) are older than the mr-moqui
    `runtime/components/base` they run on: they lack `UserSecurityChecks.assertDocumentExpression` (4f8997c0), so every
    data file with a DataDocument field (the framework's ResourceEntities, Mantle's documents, BossSetupData's drive
    rows) fails to load, BossUsersDemoData with them, and every BOSS spec fails at sign-in (CustomerServiceAccess: 22 of
    22 on the com-p1 runtime). The tests above ran on a scratch runtime whose `components/base` and `components/dev` are
    mr-moqui 1916b57f's, the newest tree the binary matches, with the com-p1 components. A rebuilt binary is needed
    before `./moq test-apps`, the budget measure and a re-run on the com-p1 runtime.
  - **F58** Mantle has no store email templates (the PopRestStore ones were not ported), so the demo's five
    automatic types are bound to one demo template with the framework's generic body on a local sink; real store
    notices are Shop's (P6) and P8's.
  - **F59** Ending a member's last StoreStaff row widens them to every store of their organizations (§4's rule: a
    user with no current row works every store). For the lead: keep the rule, or limit a user with any StoreStaff row,
    current or past (`_NA_` once all have ended).

**Review Nov 5 (P1).** Checked the Mantle and BOSS diffs against this section, §2, §4, design §1.1, §1.2 and §3 Home,
AGENTS.md and Practices-App-Dev:
- Services only: no Commerce authz names a Mantle store, order, promotion or site service, an entity-auto mutator or a
  `mantle.rest.xml` path; the root group's rows are the root screen and `ironstone\.commerce\..*`, whose demo services
  refuse anyone but data loading and a system administrator. CommerceAccess's manager and administrator are refused the
  `products/stores` REST verbs, `update#ProductStore` and `clone#ProductStore`.
- Store scope: every Commerce read (`storeFind`, `storeIn`, `recordOf`, `customerOf`) uses authorization-disabled finds
  conditioned on the organizations and the staff stores in the query, so the scope does not depend on the
  `COMMERCE_STORE` filter or on `setup#StoreScope` having run (the palette and record links run outside the root). The
  filter set applies only while `commerceStoreIds` is in the per-request user context (the root sets it from the current
  StoreStaff rows, removes it otherwise), so an unlimited user and a system administrator are untouched; the fixture
  checks both. A forged or foreign store, site, order or customer in `check#Record`, `get#Choices`' `selected`,
  `search#Records`, `get#RecordLink` or Home's `productStoreId` is refused as missing; staff rows on a store outside the
  user's organizations limit to nothing (an empty `in` is `1 = 0`), never widen. F59: the code follows §4 (a user
  with a current row is limited to those stores, one with none works every store).
- Groups and grants: the nine groups and design §1.1's table, not nested; the area groups deny `BOSS_COMMERCE` and allow
  their capability groups with `ALWAYS`, as BOSS_CS_RETURNS (F45); the twelve permissions in MantleSetupData each with
  its ADMIN grant, `PRODUCT_CATALOG_VIEW` on the root and `PRICE_VIEW` on the manager, merchandiser and operator.
- F3: the ten client deny rows carry the same 102 verbs as the seven before, `commerce` added, the longest 253
  characters; ProjectsAccess passes. A Projects client (`PROJECT_CLIENT`) and a PASS account are refused the context and
  Home.
- Demo: POPC_DEFAULT's three ship options are the `_NA_` carrier's seeded methods with their sequence (what
  `get#StoreShippingOptions` answered before through the NA_LOCAL gateway); the PASS sites are `disabled`, each made in
  its own probe with its failure named. The Mantle commit names nothing of IronStone's; Mantle's edits and BOSS's setup,
  users and palette edits are appends (the palette's store branch is one more link of the chain), but for F3's rows.
- Fixes: **R1** (low) CommerceAccess's menu feature rendered the shell for every group (thirteen shells) and the context
  feature repeated users the capabilities feature already reads; each group's areas are its area capabilities, from the
  same authorizations, so the menu keeps the reader, the operator and the administrator, the launcher reuses the
  reader's shell, and the context feature keeps the store-limited and other-organization users and one other app's user
  (mr-boss c2ce3664). 7 features, 3.0 s, each under 0.6 s.
- Tests run on the com-p1 runtime with the rebuilt release binary (Nov 5 22:15, F57 resolved): CommerceAccess,
  ProjectsAccess, AppOrganizationFilters and CustomerServiceAccess, 44 features, all pass. In the first run, the one that
  loaded the database, CustomerServiceAccess' "Invite to support" failed once (`RECORD_UNAVAILABLE` for its spec's
  contact) while the load's background work was still running; it passed in the three runs after, and at master on a
  runtime of the master components; P1 touches nothing it reads.
- For the lead:
  - F59's widening has a second case: a member whose only StoreStaff row starts in the future works every store of
    their organizations until it starts. Both are §4's rule; a "limited by any row, current, past or future" rule closes
    both.
  - POPC_DEFAULT's five email bindings make every order placed, approved, shipped, delivered or invoiced in that store
    send an email (render and an SMTP attempt on the local sink) after commit, in the demo and in every BOSS spec that
    places a POPC_DEFAULT order; measure it in P1's `./moq test-apps` budget run.
  - `get#StoreScope`'s `storeIds` is unbounded for an administrator with no active organization; a later phase that
    puts it in an `in` condition should page or condition on the organizations instead.
  - Not run: `./moq test-apps`, the budget measure and the acceptance CommerceFoundationWalk.

- **Wave 1 suites (Nov 5, on master after P1 merged; the P2 worker and the framework worker's cargo build ran at the
  same time, so the times measure the load):** standalone mr-mantle 1,751 passed, 2 failed (the baseline
  WorkTimeEntries and WorkTimesheets), 11 skipped; `./moq test-apps` 3,089 server features passed and 1 failed
  (CommerceAccess compared an unlimited user's stores exactly, and other specs add stores to ORG_ZIZI_RETAIL in a full
  run; it now checks the demo store is held and the other organization's is not, b55cef91), 15 client features passed;
  `moqui lint --screens` clean. Under the load mr-mantle took 599.5 s, mr-boss 370.4 s and mr-pass 19.6 s; the budgets
  are measured on a quiet run before any is raised.

### P2 — Stores

Design §3 Stores, StoreDetail and StoreGroups; COM-STORE.

- **`mantle.product.StoreAdminServices`** (C; `COMMERCE_VIEW` to read, `COMMERCE_STORE_EDIT` to change):
  `find#Stores`, `get#Store`, `get#StoreSites` (the sites and mounts naming the store, read only), `store#Store` (new
  stores start without a site mount; currency and locale default from
  the organization, never hard-coded), and the dated child saves `store#StoreFacility`, `store#StoreParty` (staff roles
  only), `store#StoreEmail`, `store#StoreApproval` (registered `OrderValidate` services only), `store#StoreContentBinding`
  (registered DataDocuments and wiki spaces; a private space is refused), `store#StoreSetting` (typed per setting type;
  the checkout and recovery types arrive in P6 and P10), `find#StoreGroups` and `store#StoreGroup` with members and
  parties.
- **Clone** (`clone#Store`): a guard over Mantle's `clone#ProductStore` (F12) that previews per section, copies staff
  roles only (never a customer's ProductStoreParty), no promotions, gateways, host mount, recovery schedule, credentials
  or customer data, requires approval of copied organization-sensitive references, and starts the clone unpublished.
- **Readiness** (`check#StoreReadiness`, design §3): site, catalog, theme, payments, delivery and tax, content and the
  support queue, each finding with its fix link, filled in as the phases build what it checks (theme in Shop P2;
  payments, delivery and the site's Support mount for the store's organization in P6; the subscription address in P12).
  It only reads: it writes no setting or site field. It is StoreDetail's Readiness and the `shop` app's PASS readiness
  (Shop P1), not an Admin §14 provider until Admin builds the registry (F23, §7).
- **Seeds:** `PsetCartRecovery`, `PsetSubscriptionRenewal` and `PsetReviewRequest` email types (F16); the
  ProductStoreGroupType values (F13).
- **The audit log** on ProductStore's policy fields (organization, currency, locale, channel, approval delay, the tax
  gateway), and on the ship-option and payment-gateway bindings' key fields (F15).
- **Screens:** Stores (StoreFind, Stores, NewStore); StoreDetail with the record header and the tabs General (the
  reservation group read only, linking Warehouse's StoreReservation, F7), Sites (SiteBindings read only; host mounts stay
  the operator's `store#Mounts`), Facilities, Staff, Emails, Order checks, Search/content, Settings (TypedSettings) and
  History, with CloneStore and Readiness; StoreGroups (GroupList, GroupEdit, Members, Parties). Home's first-use state
  opens NewStore.
- **Specs:** Mantle `test/product/StoreAdmin` (the saves and their refusals, dated replacement, the clone's exclusions,
  readiness findings); BOSS `CommerceStores` (the reads by scope, StoreDetail's one qvt render).
- **Usable when:**
  - a manager creates a store for ORG_ZIZI_RETAIL with the organization's currency and no site, binds a facility from a
    date and a staff member, and readiness names what is missing;
  - cloning POPC_DEFAULT copies its categories, facilities and staff but not its customers' party rows, and the clone is
    unpublished;
  - a merchandiser reads StoreDetail but cannot save; another organization's manager is refused POPC_DEFAULT;
  - a change of the store's tax gateway is in its History with the user and reason.

**Built Nov 5 (P2).**
- Mantle:
  - `service/mantle/product/StoreAdminServices.xml` over one module `StoreAdmin.js` (operations table): `find#Stores`
    (paged, by name ignoring case, organization, channel, group; each store's sites), `get#Store` (fields with names, the
    reservation group read only, the revision, `canEdit`, and on request `include` the sections facilities, staff, emails,
    approvals, content, settings, history), `get#StoreSites` (the `shop` mounts naming the store, read only),
    `store#Store` (new: the organization's base currency and document locale unless chosen, else the user's locale, a
    facility from now, no mount; change: stale revision refused, a policy change needs its reason, the organization fixed
    once the store has orders), the dated saves `store#StoreFacility`, `store#StoreParty` (staff roles only: StoreStaff),
    `store#StoreEmail`, `store#StoreApproval` (registered OrderValidate only; typed parameters from the register's
    `configParameters`), `store#StoreContentBinding` (search documents: an indexed DataDocument over the type's entity;
    wiki spaces, never `restrictView`), `store#StoreSetting` (the `settingTypes` table with kinds), `find#StoreGroups`,
    `store#StoreGroup`, `clone#Store`, `check#StoreReadiness`, `find#StoreOptions` (each form's drop-down, the values its
    save accepts). Each checks `COMMERCE_VIEW` / `COMMERCE_STORE_EDIT`, the store's organization (FacilityScope's own
    organizations; Warehouse's `FACILITY_ALL_ORGANIZATIONS` does not widen) and a current StoreStaff row's stores (F51 also
    in Mantle). Dated replacement (`saveDated`): a row from a date ends the open one there, the same instant changes in
    place, a later-starting row is refused (`DATED_OVERLAP`); End ends the row in effect, or withdraws one not yet started.
    Tables later phases extend: `staffRoles`, `settingTypes`, `cloneLeftOutSettingTypes`, `documentTypes`,
    `readinessChecks`.
  - Clone (F12): `clone#ProductStore` called with categories and emails only (`copyParties`, `copyProducts`,
    `copyFacilities`, `copySettings` off); the guard copies the target organization's facilities, the StoreStaff rows of
    people working for it and the `settingTypes` settings, nulls the integration remote and an inventory facility of
    another organization; the preview reports each section copied and left out (customers' and other party rows,
    products, promotions, gateways and ship options, order checks, content bindings, site mounts) and the
    organization-sensitive references; the clone needs `approveReferences` (`CLONE_APPROVAL_REQUIRED`), checks the base's
    revision and keys the operation on `PostingOperation` (`StoreClone`, a retry answers the first result).
  - Readiness (read only): organization, currency, site (an enabled `shop` mount), site address, fulfillment facility (a
    warning: a digital store needs none), tax gateway, order placed email; each finding `{key, area, label, ready,
    severity, warning, message, fix}` with `fix` a section key (general, sites, facilities, emails, settings), never a BOSS
    path. For Shop P1: `check#StoreReadiness` is `authenticate="anonymous-all"`; with `input {siteId, app, targetId}` it
    answers `result {checks: [{name, ready}]}` (blocking checks only, no messages, no permission, as PublicApps' other
    readiness services), so it registers in PublicApps.js as `shop`'s `readiness` unchanged; with `productStoreId` it needs
    `COMMERCE_VIEW` and the store's scope.
  - Seeds and audit (`entity/ProductStoreEntities.xml`): `PsetCartRecovery`, `PsetSubscriptionRenewal`,
    `PsetReviewRequest` (F16); ProductStoreGroupType `PsgtReporting`, `PsgtRegion`, `PsgtBrand`, `PsgtChannel` (F13);
    `enable-audit-log` on ProductStore's organization, currency, locale, channel, approval delay and tax gateway, and on
    ProductStoreShipOption's carrier and method and ProductStorePaymentGateway's instrument and gateway (F15). store#Store
    passes each changed field's `_changeReason`.
- BOSS:
  - `screen/Commerce/Stores.xml` (the area: Stores, Store groups; StoreDetail hidden), `Stores/Stores.xml` (StoreFind,
    StoreList with phone columns and the sites chip, NewStore for a store manager not limited to stores),
    `Stores/StoreDetail.xml` (record header with the readiness chip, More: Clone store with the per-section preview,
    references and approval, Store groups; not-available state) and its tabs `StoreDetail/General.xml` (Readiness with
    each finding's Fix link to its tab, General save with the reason, Reservation read only linking Warehouse's
    StoreReservation), `Sites.xml` (read only), `Facilities.xml`, `Staff.xml`, `Emails.xml`, `OrderChecks.xml`,
    `SearchContent.xml`, `Settings.xml`, `History.xml`; `Stores/StoreGroups.xml` (GroupList, New group, GroupEdit,
    Members, Parties); `template/CommerceParts.xml` (`choices`, `storeOptions`).
  - Each screen runs after the root's `get#SharedContext`; StoreDetail's always-actions `check#Record` (store), then the
    Mantle services. Home's first-use New store opens Stores with `_openDialog=NewStore`. Commerce.js: the store kind's
    destination is `Stores/StoreDetail?productStoreId=` (palette and `get#RecordLink`), `linkPaths` gains
    `Stores/StoreDetail` and `Stores/StoreGroups`. No quick create (New store is on Stores and Home).
- Specs (feature times from runs while the lead ran the full suites, so noisy):
  - Mantle `test/product/StoreAdmin` (7 features, 2.4 s): defaults and the permission and organization refusals; the
    store-limited member; dated replacement and each save's refusals; the reason, History and a stale revision; the
    clone's sections, approval, retry and exclusions; readiness and its PASS form; store groups.
  - BOSS `CommerceStores` (2 features, 0.8 s): the reads by scope (holds the demo store and not the other organization's,
    b55cef91's pattern); StoreDetail's header and General tab, each one qvt render per user (manager with Clone and
    Save, reader without; the tab is its own level, `lastStandalone: "1"`). `CommerceAccess` gains one case (F51: the
    store-limited member refused a second Retail store in `get#Store` and `check#Record`, the reader not, Services'
    manager refused; 0.2 s; the spec makes `BOSS_COM_P2_SECOND`), and its record-link expectation now names StoreDetail.
  - Also run, all pass: Mantle RestApiTests, OrderToCashBasicFlow, ReturnToResponseBasicFlow, Promotions,
    CarrierServices, DropShip, ReturnPolicies, SalesReports (117 features with StoreAdmin); BOSS CommerceAccess,
    CommerceStores, ProjectsAccess, AppOrganizationFilters, WarehousePolicies, CustomerServiceAccess (65 features; that
    run flagged CustomerServiceAccess at 21.4 s and ProjectsAccess at 15.7 s over 15 s, under the concurrent load, files
    P2 did not change). Not run: `./moq test-apps` and the budget measure.
- Acceptance: `test/acceptance/Commerce/CommerceStoresWalk` (5 features: the new store through Stores' `createStore` with the
  organization's currency and no site, a facility from tomorrow and a staff member, readiness naming site, tax, order email
  and facility; the clone of POPC_DEFAULT through `cloneStore` with its categories, facilities and staff and no customer
  row, product, mount or promotion; the merchandiser reading StoreDetail and refused `saveStore`; Services' manager refused
  POPC_DEFAULT; the tax gateway change in History with user and reason; every Stores screen and StoreDetail tab in qvt and
  html for the manager), run once: 5 passed. CommerceFoundationWalk (its palette URL now StoreDetail's): 5 passed on its
  second run; the first failed at the PASS account's sign-in because the Customer Service Support demo's contacts were not
  made during that runtime's load (F60). The whole mr-boss acceptance suite was not run.
- Lint: `moqui lint --screens` (release binary), 132 sites, none in the Commerce screens.
- Inventories: ss-inventory's 15 Stores/StoreDetail ProductStore rows (clone, store, data documents, emails, facilities,
  parties, settings) name their built forms; usl-inventory's `clone#ProductStore` names CloneStoreForm.
- Decisions:
  - A store group belongs to the organization of its current `OrgInternal` ProductStoreGroupParty row (ProductStoreGroup
    has no organization field); members are its organization's stores; a store-limited member edits only a group whose
    members are all theirs (design §3 StoreGroups updated).
  - The Mantle services apply the StoreStaff limit too, not only ContextServices, so the rule holds without BOSS.
  - A store-limited staff member does not start stores, groups or clones (`STORE_LIMITED`): they could not see them; nor
    assign store staff (review R1).
  - TypedSettings writes only the `settingTypes` table's types (template, content and URL locations are shown, not set);
    OrderChecks' parameters come from `ServiceRegister.configParameters` (OrderManualApprove takes none).
  - The clone copies the target organization's facilities and its people's staff rows only; another organization's are
    left out and reported. Order checks and content bindings are not copied (Mantle never did).
  - Readiness fix links are section keys mapped to tabs by BOSS (design §3 StoreDetail updated); delivery facility is a
    warning, not a blocker.
  - The store module is one script module with XML service shells, as P1's ContextServices, for the shared scope,
    dated replacement and clone plan; each service sets its declared out-parameters.
- Findings (provisional):
  - **F60** On a fresh runtime load with the binary of mr-moqui d9bcc20d, `ironstone.customerservice.DemoServices`'s
    Support step failed once ("canceling statement due to user request" from a held transaction-cache write, then a
    duplicate `form_inv_key`), so `dana@joesdist.example.com` had no login and CommerceFoundationWalk's outsider feature
    failed; it passed on the next run. For the lead / TX-Cache: a data-load race, not Commerce's.
  - **F61** A delete of a ship-option or payment-gateway binding writes no audit row (the framework audits create and
    update only); CheckoutSettings (P6) records its removals itself.

**Review Nov 5 (P2).**
- Checked: `git diff master...com/p2` in mr-mantle and mr-boss against this section, design §3 and §2: every StoreAdmin
  operation checks `COMMERCE_VIEW`/`COMMERCE_STORE_EDIT`, the store's organization (FacilityScope's own organizations;
  `FACILITY_ALL_ORGANIZATIONS` does not widen) and the StoreStaff limit; a missing and a foreign store refused alike; the
  options and group reads scoped by the same query; store#Store's partial update leaves unsent fields alone, the policy
  reason and stale revision; dated replacement; clone#Store over `clone#ProductStore` with copyParties/Products/
  Facilities/Settings off, the approval, the base revision and the `PostingOperation` retry (answered before the stale
  check); the audit fields, seeds and Mantle defaults (`clone#ProductStore`'s own defaults unchanged); readiness's failure
  tolerance. The anonymous PASS form of `check#StoreReadiness` (`allow-remote="false"`, so only server code reaches it;
  Forum's `check#Readiness` passes only an enabled mount's own target) answers `{name, ready}` per blocking check, no
  message, field or id, as Portal's and Support's app readiness do for any target: nothing beyond whether a store id
  exists and its six booleans. Mantle stands without BOSS: StoreAdmin 7/7 on a runtime with mr-mantle only.
- **R1 (high)** A store-limited staff member could end or date their own StoreStaff row through `store#StoreParty` (the
  End link on Staff), which removed their limit and opened every store of the organization; or end a colleague's, or add
  a row to a manager and limit them. `store#StoreParty` now refuses a store-limited member (`STORE_LIMITED`), Staff hides
  its add and End for them, StoreAdmin's store-limited feature checks the refusal, and design §1.1 says why.
- **R2 (low)** CommerceStores rendered StoreDetail and its General tab twice each in qvt (manager and reader), against
  AGENTS.md's one render per screen per mode; it now renders each once, the manager's, and reads the reader's
  `get#Store` (`canEdit` false). The merchandiser's page stays in CommerceStoresWalk.
- Specs after the fixes (binary of 23:13): Mantle StoreAdmin 7 passed (2.6 s; also 7 passed, 2.9 s, on the Mantle-only
  runtime); BOSS CommerceStores 2 and CommerceAccess 8 passed (4.1 s). Lint: no Commerce screen flagged. Acceptance not
  rerun (unchanged).
- For the lead: (1) a change of a store's organization (no orders yet) keeps its facility and staff rows of the old
  organization; P6 or a later phase may end them or refuse the change while they exist. (2) CommerceAccess's P2 case
  makes `BOSS_COM_P2_SECOND` without cleanup, which later specs' store counts will see. (3) F61 stands: binding deletes
  are not audited by the framework. (4) The budget measure and `./moq test-apps` were not run here.

- **Wave 2 suites (Nov 5, on master after P2 and the framework branch merged and the binary rebuilt; Shop P1's and
  P3's workers ran at the same time):** `./moq test-framework` passed but for one cargo test that passes alone
  (`chat_tests::the_links_of_a_message_get_text_previews_after_the_commit`, under load; dev-aide 32.8 of 30 s and
  webroot 46.4 of 44 s client, under load); standalone mr-mantle 1,754 passed, 4 failed (the baseline WorkTimeEntries
  and WorkTimesheets, and the two below), 13 skipped; `./moq test-apps` 3,096 server features passed and 2 failed, 15
  client features passed, within every budget (server: mr-mantle 328.8 of 370 s, mr-boss 234.7 of 264 s, mr-pass 13.0 of
  15 s; client: mr-boss 46.6 of 49 s, mr-pass 4.1 of 6 s); `moqui lint --screens` clean. The two failures,
  AccountingCollections ("an instalment past due…": `overdueDays` 9, not 10) and SupportCases ("…Today leaves cases
  out…": the plain case not in Today), reproduce alone after 00:00 UTC (the run was at 05:30 UTC, still Nov 5 locally)
  and passed in Wave 1 an hour earlier: a date-boundary dependency of the specs or the code (UTC against the local or
  organization day), not Commerce's; reported to the user.

### P3 — Assortment and catalog mounts

Design §4 Merchandising, StoreCategories and Product360's merchandising facets, §10's catalog rows; COM-MERCH (the
publication part), with SHOP-CATALOG's resolver core.

- **Publication** (§4, F10, F11).
  - ProductStoreProduct becomes an effective-dated association: `fromDate` joins its key, with `thruDate`, a
    publication kind (published, or a variant's exclusion), the template key, badge text and featured rank, key fields
    audit-logged. A publication is a row from a date, a withdrawal ends it, a scheduled one starts in the future; its two
    readers (the signature requirement in ShipmentServices, the Forum's product link) read the current row.
  - Store-specific title, description and SEO text are ProductContent rows of the store (`productStoreId`), as Mantle
    already keys them; no override field.
  - `mantle.product.StoreMerchandisingServices` (M; `COMMERCE_VIEW` to read, `COMMERCE_MERCHANDISE` to change):
    `find#StoreProducts`, `store#StoreProduct`, `preview#Publication`
    (the variants a virtual product's row covers, readiness of price, content and stock policy, the affected search and
    feed generations) and `publish#StoreProducts` (`COMMERCE_PUBLISH`; per item, with a reason, advancing the generation
    in its transaction).
  - The resolver Shop's catalog uses (`get#StorePublication`, SHOP-CATALOG's core): a product is public in a store only
    by a current publication row of it or of its virtual product without an exclusion, intersected with sellability,
    the store's effective view and purchase categories and site access; an empty allow category publishes nothing.
  - The adoption proposal, `propose#StorePublication`, for a store with no publication rows: eligible products of its
    categories proposed, approved by a publisher through `publish#StoreProducts`, never published on load. Shop P8's
    legacy-store adoption preview reuses it.
- **Categories** (StoreCategories; `COMMERCE_MERCHANDISE`): `store#StoreCategory` (the store's dated category roles),
  `move#StoreCategory` and `store#CategoryMembership` over ProductStoreCategory and ProductCategoryRollup with cycle and
  date checks; a category shared with another store names every affected store in the preview; a copy of a store
  taxonomy is explicit.
- **Products' shared screens** (F4, F5):
  - a Commerce branch in Products' SharedContext.js (tabs, routes, mounts and the fixed store), so Product360,
    CategoryContent, Documents, DocumentDetail, PriceLists, PriceListDetail, PriceExplain and InventoryAvailability open
    under Commerce; writes still need the owning catalog and price permissions;
  - CategoryDetail moved from `Products/Categories/CategoryDetail` to `Shared/CategoryDetail` with Products' and
    Commerce's contexts, Products' links changed (one route per screen), its crosscut §2 registry row (already
    written) checked against what is built;
  - Product360's Commerce context: publication, store prices, availability and the review link; the Paid access pane
    comes in P12.
- **Screens:** Merchandising (AssortmentFind, Assortment, StoreProduct, PublishProducts with its preview);
  StoreCategories, a `.qvue` tree with drag ordering beside a `StoreCategoriesTui` twin of parent and sequence fields
  with Move up and Move down; the mounts above under `Commerce/Merchandising/`.
- **Specs:** Mantle `test/product/StorePublication` (the resolver: no row, a published virtual and its variants, an
  excluded variant, an empty allow category, a future row, a withdrawal; the moves' cycle and date refusals; the
  generation advanced); BOSS `CommerceAssortment` (the publication batch with a result per item, the shared-category
  preview, Product360's one qvt render under Commerce).
- **Usable when:**
  - publishing the demo's virtual product publishes its saleable variants, the preview lists them, and withdrawing one
    variant leaves the others public; another store is unchanged;
  - moving a category shared by two stores names both, a cycle is refused, and the terminal twin's moves give the same
    tree;
  - a merchandiser without `PRICE_EDIT` sees store prices on Product360 and cannot change them.

**Built Nov 5 (P3).**
- Mantle:
  - `entity/ProductStoreEntities.xml`: ProductStoreProduct is dated, `fromDate` in its key (default `ec.user.nowTimestamp`,
    so a data row or `create#` with no date still loads), with `thruDate`, `publicationKindEnumId` (seeded
    `StorePublicationKind`: `PspkPublished`, `PspkExcluded`; empty means published, the rows made before P3),
    `templateKey`, `badgeText`, `featuredRank` and `changeReason`, each audit-logged. Its two readers take the current
    row: ShipmentServices' signature requirement (a `date-filter` find, latest first) and ForumIntegration.js'
    `productPublic` (a current row that is not an exclusion). StoreAdmin.js exports `saveDated`, `dateOf`, `reason`,
    `rowDates`, `stateOf` for the store modules.
  - `service/mantle/product/StoreMerchandisingServices.xml` over `StoreMerchandising.js` (operations table):
    `get#StorePublication` (the resolver, `anonymous-view`: own row or the virtual's published row without the variant's
    exclusion, sellable by `check#ProductUsable` Sell, inside the store's current `PsctViewAllow` tree when it has one, an
    empty one showing nothing, and with `siteId` an enabled `shop` mount; purchasable adds `PsctPurchaseAllow`; each answer
    with `via`, `reasonCode` and the row's template, badge and rank; a date other than now needs `COMMERCE_VIEW` and the
    store's scope), `find#StoreProducts`, `store#StoreProduct` (a new dated row; a scheduled one changed in place),
    `preview#Publication` (allowed or refused per product with its code, readiness findings sellable/price/content/stock as
    warnings, the variants a virtual covers, the sites and their next generation), `publish#StoreProduct` (one product,
    caller's transaction) and `publish#StoreProducts` (each product through a probe in its own transaction, one reason, a
    result per product, `PostingOperation` `StorePublication` so a retry answers the first result, per-product expected
    revisions), `propose#StorePublication` (a store with no rows; never writes), `find#ProductPublications` (Product360),
    `get#StoreCategories`, `get#CategoryStores`, `store#StoreCategory` (dated roles; a one-category role ends the other
    category's row), `move#StoreCategory` (dated rollup move, or in place under the same parent: a sequence, `direction`
    up/down or `beforeCategoryId`, renumbering the siblings 10, 20, 30), `store#CategoryMembership` (bulk, a result per
    product). Permissions: `COMMERCE_VIEW` reads, `COMMERCE_MERCHANDISE` changes the assortment details and categories,
    `COMMERCE_PUBLISH` publishes; store scope through StoreAdmin.js (organization and StoreStaff limit). Every change
    advances `PublicSite.generation` of the sites whose `PublicSiteApp{app: "shop", targetId: store}` names the store, in
    the change's transaction. Category changes name the user's stores that show the category (`previewOnly`), need
    `confirmShared` when more than one does, and are refused when a store the user does not work shows it
    (`CATEGORY_SHARED_OUTSIDE`: copy the taxonomy instead); cycles (now or by a later rollup) are `CATEGORY_CYCLE`, a past
    date `VALUE_INVALID`, a later move `DATED_OVERLAP`.
- BOSS:
  - Products' shared screens (F4, F5, F46–F48): `SharedContext.js` gains the Commerce branch (tabs Summary, Features,
    Categories, Identifiers, Documents, Prices for a price reader, Stock at the user's stores' facilities, History; `read`,
    `priceRead`, `catalogEdit` and `priceEdit` passed through from `get#CatalogAccess`; cost, margin, supplier price,
    method and stock policy off; Commerce's `sharedLinks`); `get#SharedContext` declares `storeIds`; Prices.js narrows the
    store choices to them and neither lists nor changes a price of another store; Taxonomy.js (`get#CategoryOptions`,
    `store#CategoryRow` take `appRoot`) narrows its store choices and identifier stores; Documents.js links the mounting
    app's DocumentDetail; Shared/Prices.xml hides History and Review bulk change without their routes (F48).
  - CategoryDetail moved to `screen/Shared/CategoryDetail.xml` with its tabs (`Shared/CategoryDetail/`), mounted at
    `Products/Categories/CategoryDetail` (route unchanged) and `Commerce/Merchandising/CategoryDetail`; it reads
    `get#SharedContext` by `appRoot`, its parent, child and product links use `sharedLinks`; under Commerce the header
    names the user's stores that show the category (`get#CategoryStores`), and Feature defaults and Delete are left out.
  - `screen/Commerce/Merchandising.xml` (Assortment, Store categories, Documents, Price lists, Explain price; Product360,
    CategoryDetail and InventoryAvailability hidden) with `Merchandising/Assortment.xml` (AssortmentFind, the list with phone
    columns, Publish or withdraw on the selection, Storefront details per row, the adoption proposal box),
    `PublishProducts.xml` (preview, variants covered, sites' generations, the batch with effective time and reason),
    `StoreCategories.xml` + `StoreCategories.qvue` (the tree with drag onto a category or before a sibling, Move up/down,
    each move previewed and confirmed when shared; JSON `tree` and `move` transitions answering refusals in `errors`) and
    `StoreCategoriesTui.xml` (StoreRoots, CategoryTree with parent, sequence, Move up/down and Move, CategoryProducts),
    `Documents.xml` and `PriceLists.xml` wrappers. Product360 under Commerce shows "Publication in your stores"
    (`find#ProductPublications`). Commerce.js: `linkPaths` for the Merchandising routes, the `storeCategories` choice;
    CommerceParts gains `catalogChoices`. Demo: POPC_DEFAULT publishes DEMO_1_1, DEMO_1_2, DEMO_2_1, DEMO_3_1 and
    DEMO_UNIT (BossCommerceDemoData.xml); DEMO_VAR is left for the walk.
- Specs: Mantle `test/product/StorePublication` (6 features, 1.7 s: no rows and an old-shaped row; the batch's
  permission, reason, results, retry and generation, a virtual covering its variants and an exclusion; a future row, a
  withdrawal and an empty allow category; storefront details as a dated row, stale and unpublished refused; the moves'
  cycle, past date, outside and shared refusals, a reorder and Move up; membership and a one-category role). BOSS
  `CommerceAssortment` (3 features, 0.5 s: the batch with a result per product, the shared-category preview naming both
  stores, Product360's one qvt render under Commerce) and a `CommerceAccess` case (0.4 s: the store-limited member refused
  BOSS_COM_P2_SECOND's assortment and given only their store in the Commerce price store choices; Services' manager
  refused). Also run, all pass: Mantle StoreAdmin, OrderToCashBasicFlow, WarehouseShipping, ShipmentPick,
  CarrierServices, RestApiTests (109 features); BOSS CommerceAccess, ProductsAccess, ProductsDocuments, ProductsTaxonomy,
  ProductsSharedContext, ProductsPricing, ProductsPriceLists, ProductsFinish, ProductsInventory, CustomerServiceAccess,
  CustomerServiceOrders, PurchasingAccess, WarehouseAccess, ManufacturingAccess, AccountingAccess, CommerceStores,
  ProjectsAccess (166 features). Not run: `./moq test-apps` and the budget measure.
- Acceptance: `test/acceptance/Commerce/CommerceAssortmentWalk` (6 features: DEMO_VAR published through PublishProducts with
  three variants made active, the preview listing every variant, the active ones public by the virtual's row, the drafts
  not sellable, BOSS_COM_DIGITAL unchanged; one variant excluded and the others public; a move of DEMO_ONE shared with a
  second store naming both and refused unconfirmed, a cycle refused; the twin's Move down and the tree view's moves giving
  the same tree; the merchandiser seeing POPC_DEFAULT's price on Product360's Prices without New sales price or bulk change
  and refused `store#ProductPrice`; every Merchandising screen in qvt and html, StoreCategories in tui, CategoryDetail's
  stores line), run: 6 passed. Also run:
  CommerceFoundationWalk, CommerceStoresWalk and ProductsTaxonomyScreens pass; AppStructure and TuiRender failed on
  `Shared/CategoryDetail` rendered with no category, fixed by its demo parameters in both sweeps (then 21 of 21). PASS
  Integrations passes (the Forum product link on dated rows); Forum's "PASS and Mantle copies of the operation schema"
  fails on this workspace only, because its mr-pass is master with Shop P1 and its mr-mantle is com/p3 without it. The
  whole mr-boss acceptance suite was not run.
- Lint: `moqui lint --screens` (release binary), 132 sites, none in the new or changed screens.
- Inventories: ss-inventory's Commerce rows of CategoryDetail, CategoryContent, Product360, Documents and the two
  FindProductStoreCategory forms name their built paths; usl-inventory's price, price-list and slug rows with Commerce
  paths name the Commerce mounts (the two `generate#UrlSlugFrom*` rows stay unbuilt, as in Products).
- Decisions:
  - A row's reason is a `changeReason` field on ProductStoreProduct, audit-logged: the framework's `<field>_changeReason`
    did not reach the audit row of a create (design §4 updated).
  - Publishing a product is not blocked by its readiness (sellable, price, content, stock policy are warnings): the
    resolver intersects sellability, so a draft published early shows once it is active.
  - A category change that a store the user does not work would see is refused, not confirmed: another organization's or
    another staff member's store is not theirs to change; copying the taxonomy is the way (design §4 updated). No copy
    service is built in P3.
  - Store categories' role and membership forms live in the terminal twin, which the tree view opens; the tree view does
    moves and reads members.
  - Product360 under Commerce shows the publication of every store of the user's (first 50), not one fixed store; the review
    link waits for P9's Reviews.
  - CategoryDetail's route under Products is unchanged (one route per screen); only the file moved.
- Findings (provisional):
  - **F62** The table check never changes a primary key (docs/Run-Deploy.md), so an existing database keeps
    ProductStoreProduct's old key (store, product) and gains a nullable `fromDate`: reads work (an empty date is open), but a
    second dated row of a product fails on the old key. No data file of any component has ProductStoreProduct rows, so a
    new database is unaffected; an existing one with rows needs the table rebuilt on its new key (copy the rows, drop,
    let the table check create it, reload with `fromDate` set). For the lead: a migration note in the upgrade notes or a
    Mantle migration service.
  - **F63** `<field>_changeReason` in an entity-auto `create#` call's parameters does not reach the audit row (an
    `update#`'s does, as P2's History relies on); for TX/framework review.
  - **F64** The demo's DEMO_VAR variants are drafts (`createVariantProducts`), so none is saleable until a catalog editor
    activates them; the walk activates three.

**Review Nov 5 (P3).**
- Checked: `git diff master...com/p3` in mr-mantle and mr-boss against this section, §2, design §4 and §10: the resolver
  (own row, or the virtual's published row without the variant's exclusion, intersected with `check#ProductUsable` Sell,
  the view and purchase allow trees with an empty one showing nothing, the site's enabled `shop` mount; a future row not
  public, a withdrawal ending it; a date other than now needing `COMMERCE_VIEW` and the store's scope); the dated
  ProductStoreProduct with Mantle's defaults (a row with no kind or date published, ShipmentServices' signature read and
  ForumIntegration.js' `productPublic` on the current row; PASS Integrations passes); `publish#StoreProducts` (each product
  in its own transaction through `lib.probe`, a result per product, `PostingOperation` `StorePublication` answering a retry
  with the first result, the stale revision refused naming the current, `COMMERCE_PUBLISH`, the generation of the sites of
  `PublicSiteApp{app: "shop", targetId}` advanced inside each product's transaction); `move#StoreCategory`'s cycle (now and
  by later rollups), past-date and later-move refusals and `CATEGORY_SHARED_OUTSIDE`/`CATEGORY_SHARED`; Products'
  SharedContext Commerce branch (catalog and price writes by the user's own `PRODUCT_CATALOG_EDIT`/`PRICE_EDIT`, cost,
  margin, method, supplier price off; `storeIds` narrowing Prices.js and Taxonomy.js; Products' and the other apps' callers
  pass no or their own `appRoot` and are unchanged); CategoryDetail's move (route `Products/Categories/CategoryDetail`
  unchanged, every link to it in mr-boss, mr-pass and mr-marble still resolves); the store-limited member and another
  organization refused; the AppStructure and TuiRender parameters; the specs' leanness (one Product360 qvt render).
- **R1 (high)** `get#StorePublication` is `anonymous-view` and answered anyone every product id asked for with its name,
  `reasonCode` (`NOT_SELLABLE` naming a published draft, `VARIANT_EXCLUDED`, `NOT_IN_VIEW_CATEGORY`), `sellReason`, dates,
  template, badge and rank, and its list mode listed every published row, public or not. A caller without `COMMERCE_VIEW`
  in the store's scope now gets a product that is not public as `{productId, isPublic: false, purchasable: false}` only,
  and a list of the public products only (resolved, then paged). Staff answers are unchanged. StorePublication checks it
  with no one signed in. (mr-mantle fcff5e90)
- **R2 (medium)** A publication, withdrawal, exclusion and storefront change took any `fromDate`, so a past one rewrote
  what a store had shown (ending earlier rows in the past); `move#StoreCategory` already refused a past date. They now
  refuse a time more than a minute past (`VALUE_INVALID`), as do the preview and the batch per product. (fcff5e90)
- **R3 (medium)** The shared price list under Commerce (and Customer Service) showed supplier prices and cost rows to a
  user who held those permissions elsewhere, because Prices.js listed what Mantle's `find#ProductPrices` answers by the
  user's own permissions; the context's `supplierPriceRead`/`costRead`/`priceRead` now leave those rows out in every
  mounting app's context but Products'. CommerceAssortment checks a purchase agreement price Products shows the
  administrator is left out under Commerce while the store's sales price stays. (mr-boss, this commit)
- **R4 (low)** `get#CategoryStores` answered another organization's category with its stores' count; it now refuses it
  (`CATEGORY_UNAVAILABLE`). (fcff5e90)
- **F62, decided:** an upgrade note, mr-mantle `docs/Upgrading.md` (linked from its README), with the key check and the
  PostgreSQL and MySQL statements that give the old rows a start date and put the key on the three fields. A Mantle
  upgrade service was not built: the framework's `rekey_table` and `table_primary_key` are Rust only, with no service or
  script binding (ChatServices' `migrate#ChatActors` is a Rust service), and a service cannot run DDL.
- Specs after the fixes: Mantle StorePublication 6 passed (1.7 s), with StoreAdmin, OrderToCashBasicFlow and
  WarehouseShipping 65 passed; BOSS CommerceAssortment 4 and CommerceAccess 9 passed; ProductsSharedContext,
  ProductsPricing, ProductsImport, ProductsCosts, ProductsAccess, ProductsSuppliers, ProductsPriceLists, ProductsTaxonomy,
  ProductsDocuments, WarehouseReceiving, WarehouseAccess, CustomerServiceOrders, CustomerServiceAccess, PurchasingAccess
  and ManufacturingAccess 181 passed; PASS Integrations 6 passed. No screen changed; acceptance not rerun (unchanged).
- For the lead: (1) a framework service for a key rebuild (`rekey_table` behind a `migrate#...` or generic
  `rekey#EntityTable`) would let Mantle ship ProductStoreProduct's rebuild as a setup-data step like ChatActors. (2)
  `get#StorePublication` without `siteId` skips the site check, so the public can read a store with no shop site; Shop's
  catalog should always pass the site (or the service could require it of a non-staff caller), and "site access" does not
  yet read the site's own access rule. (3) The list mode for the public resolves every published product before paging
  (one `check#ProductUsable` each); Shop's catalog should use the in-process `resolve` with its own paging, or a
  sellability column, for a large store. (4) Products' writes under Commerce's CategoryDetail (parents, members) go
  through Products' services: they need only `PRODUCT_CATALOG_EDIT`, skip `move#StoreCategory`'s shared-store check and do
  not advance the store's site generation; likewise Taxonomy's and Prices.js' store narrowing holds for the Commerce mount,
  not for the same user under Products. Decide whether a StoreStaff limit and the generation reach Products. (5) F63
  stands. (6) `./moq test-apps` and the budget measure were not run.

- **Wave 3 suites (Nov 6, on master after P3, Shop P1 and the framework's root-mount fix merged, the binary rebuilt;
  Shop P2's and P7's workers ran at the same time):** standalone mr-mantle 1,765 passed, 2 failed (the baseline
  WorkTimeEntries and WorkTimesheets), 11 skipped — W2's AccountingCollections and SupportCases pass again once the
  local date rolled over; `./moq test-apps` 3,111 server features passed and 5 failed, 15 client features passed,
  within every budget (server: mr-mantle 365.2 of 370 s, mr-boss 239.8 of 264 s, mr-pass 13.9 of 15 s; client: mr-boss
  46.0 of 49 s, mr-pass 4.1 of 6 s); `moqui lint --screens` clean. All five failures (AccountingPayables' portal demo,
  CommerceAccess' context, CustomerServiceAccess' Invite to support and feedback, CustomerServiceFeedback) are F60: the
  demo load's `create#FormInvitation` hit a duplicate `form_inv_key`, so Customer Service's feedback demo and
  `dana@joesdist.example.com` were not made. It recurs on most fresh loads since mr-moqui's TX-Cache P4–P6; diagnosed
  separately and reported to the user. mr-mantle is at 365.2 of 370 s: Shop P2's and P7's specs will need a raise.

### P4 — Site pages and navigation

Design §5 site pages, Pages, PageDetail and Navigation (X14); COM-THEME's page part, SHOP-CONTENT.

- **PublicSitePage extended** (X14, Shop F11). It gains a sequenced `sitePageId` key, with the site and page role unique
  when a role is set, so the Forum's guidelines and about pages keep their lookup; and the app mount, route, locale,
  template key, publication window (`fromDate`, `thruDate`) and SEO title, description and social image, the binding's
  key fields audit-logged. `mantle.public.SiteServices.get#SitePage` reads a page by mount, route and locale as well as
  by role; `publish#SitePage` takes the window and an expected revision, keeps the exact-version rule (the version must
  be the page's published one) and advances the site's generation.
- **`PublicSiteNavigation`** (`mantle.public`): a site and mount's menus by key and locale, typed destinations (product,
  category, page, mount, external `https` only), redirects with old path, target and kind, each dated; a menu version is
  published as a dated snapshot. Validation refuses private BOSS links, other schemes, loops, reserved paths (Shop F2's
  aligned list) and a destination that is not public.
- **`mantle.public.ThemeServices`**' page and navigation part (T; the site's store in scope; `COMMERCE_THEME_EDIT` to
  edit a page, `COMMERCE_MERCHANDISE` to edit navigation and redirects, as design §1.1 gives navigation to the
  merchandiser, and `COMMERCE_PUBLISH` to publish either): `find#SitePages`, `store#SitePage` (over the framework wiki
  operations, never publishing a whole space), `get#SitePageHistory`, `store#SiteNavigation`, `publish#SiteNavigation`.
  The site owner and operator checks of the Forum code stay for Forum's own pages; Commerce's are by permission and
  store (Shop F12).
- **Scheduled publication:** a job revalidates a page, menu or redirect at its from date; a failure leaves the old
  version live and records a finding on the store's readiness.
- **Policy pages:** the delivery, returns, privacy and terms roles, version-pinned; checkout records the accepted terms
  version (Shop P5).
- **Screens:** `Shared/Pages` (PageFind, PageList, NewPage) and `Shared/PageDetail` (PageContent through the Commons
  Knowledge editor mounted with Commerce's context, F29; PageRoute; PagePublication; PageHistory), with Commerce's
  context only, their crosscut §2 rows (already written) checked against what is built; Navigation (MenuEdit,
  MenuItems with keyboard tree controls, Redirects, PublishNavigation).
- **Specs:** Mantle `test/public/SitePages`, the first spec of a new `test/public/` folder for `mantle.public` (F44;
  role lookup unchanged for Forum, the mount/route/locale binding, the
  exact-version and window rules, navigation validation, the generation); BOSS `CommerceSitePages` (Pages scoped to the
  user's stores' sites, PageDetail's one qvt render).
- **Usable when:**
  - a designer drafts a returns policy page, a publisher publishes it from a date, and the Forum's guidelines page of the
    same site reads as before;
  - a menu with a draft product is refused; a redirect onto `/api` or into a loop is refused;
  - a scheduled page whose author lost the publish grant stays unpublished, with a readiness finding.

**Built Nov 6 (P4).**
- Mantle:
  - `entity/PublicEntities.xml`: PublicSitePage keyed by a sequenced `sitePageId` (was site and role), the role optional
    and unique within a site (`PASS_PAGE_ROLE`), with `appMountId`, `routePath`, `locale`, `templateKey`, `title`, SEO
    (`seoTitle`, `seoDescription`, `socialImageUrl`), the window (`fromDate`, `thruDate`), who published it, the scheduled
    publication (`scheduledVersionName`, `scheduledFromDate`, `scheduledThruDate`, `scheduledByUserId`), its failure
    (`failureCode`, `failureMessage`, `failureDate`) and `changeReason`; role, mount, route, locale, template, wiki page,
    version, window, scheduled version and date and reason audit-logged. `docs/Upgrading.md` gains the key's rebuild
    (the check, PostgreSQL and MySQL); no shipped data file has rows. Forum.js `publishSitePage` gives a new binding its
    sequenced key; its `getSitePage`, owner and operator checks are unchanged.
  - `entity/PublicNavigationEntities.xml` (new): `PublicSiteNavigation` (a site mount's menu by key and locale, its draft
    items as JSON with stable item ids, `draftRevision`), `PublicSiteNavigationVersion` (a published snapshot from a date:
    `SitePublicationState` SpsScheduled, SpsActive, SpsFailed, SpsSuperseded, SpsWithdrawn), `PublicSiteRedirect` (an old
    path of the site, a typed destination of `SiteDestinationType` SdtProduct, SdtCategory, SdtPage, SdtMount, SdtPath,
    SdtExternal, permanent or temporary, dated, SpsDraft until published; key fields audit-logged).
  - `service/mantle/public/SitePages.js` (new module beside Shop P2's Themes.js, whose core is untouched) and its services
    appended to `ThemeServices.xml`: `find#SitePages`, `store#SitePage`, `get#SitePageHistory`, `find#SiteNavigation`,
    `store#SiteNavigation`, `publish#SiteNavigation`, the job's `run#ScheduledSitePublications` and per item
    `run#ScheduledSitePublication`. `SiteServices.get#SitePage` dispatches: the Forum's guidelines and about by role to
    Forum.js as before; a `sitePageId`, a policy role (delivery, returns, privacy, terms) or `appMountId`, `routePath` and
    `locale` (the locale's page, its language's, the page with no locale) to SitePages.js, live only in its window and only
    when the page's published wiki version is the binding's; `publish#SitePage` with a `sitePageId` (publish a version now or
    from a date, withdraw naming the menus that link to it, cancel what waits; the binding's `publicationRevision`, an
    operation key, PostingOperation `SitePagePublish`) is SitePages.js's, by permission and store. New live reads
    `SiteServices.get#SiteNavigation` and `resolve#SiteRedirect` (anonymous; a published site). Permissions: `COMMERCE_VIEW`
    reads, `COMMERCE_THEME_EDIT` edits a page, `COMMERCE_MERCHANDISE` menus and redirects, `COMMERCE_PUBLISH` publishes
    either; a site is worked through its Shop mount's store in the user's scope (StoreAdmin.js). Every publication,
    withdrawal and activation advances the site's generation in its transaction.
  - The store's page space (F52): the store's current PstFull ProductStoreWikiSpace (no locale), made on the first page
    (`SP<seq>`, `restrictUpdate=Y`, no member) when it has none; one without `restrictUpdate` is refused
    (`SPACE_NOT_RESTRICTED`). `store#SitePage` writes the wiki (`update#WikiPage`, `set#PublishedVersion`) as the user with
    a WikiSpaceUser `allowUpdate` row made for that one write and put back after it (F72).
  - Exact version: publishing makes the version the page's published wiki version and the binding's in one transaction, so
    every live read finds the binding's version published; a version saved later stays a draft (F74).
  - Navigation validation: a product public in the store (P3's resolver), a store category, a published page of the site,
    an enabled app of the site, a plain site path under one of its mounts, an https address; refused: another scheme
    (`SCHEME_REFUSED`), `/apps`, `/qapps`, `/vapps`, `/rest`, `/rpc` on any host (`PRIVATE_LINK`), a first segment of
    PublicApps.js `reservedPaths` (moved there from Forum.js `storeMounts`, which now reads it) or `api` (`PATH_RESERVED`),
    a draft product or page (`DESTINATION_NOT_PUBLIC`), a redirect off the site (`REDIRECT_OFF_SITE`), of another app's path
    or an old path redirected already (`PATH_RESERVED`, `REDIRECT_TAKEN`), into a loop through the site's redirects
    (`REDIRECT_LOOP`); a menu has at most 3 levels and 200 items, moved up, down, in and out. Each is checked on save and
    again on publish; live reads drop an item whose destination is no longer public.
  - Scheduled publication: the `run_ScheduledSitePublications` ServiceJob (MantleSetupData.xml, every minute) runs each due
    page, menu version and redirect in its own transaction, signed in as its publisher: `COMMERCE_PUBLISH` and the store
    still theirs, the version, route and destinations still valid; a refusal is recorded on the item and leaves the live
    version as it was. StoreAdmin.js readiness gains `sitePublication` (a warning listing each failed one).
  - ThemeView.js: the view's `navigation` is the site's live `main` menu; the `page` shape gains `socialImageUrl`,
    `policyRole` and `policyVersion` for Shop P3's Page.
- BOSS:
  - `screen/Commerce/Website.xml`: Pages (`Shared/Pages.xml`), Navigation (`Commerce/Website/Navigation.xml`) and
    PageDetail (`Shared/PageDetail.xml`, hidden), one route each.
  - `Shared/Pages.xml`: PageFind (site, title or route, locale, policy, state), PageList (phone columns), NewPage
    (COMMERCE_THEME_EDIT). `Shared/PageDetail.xml`: the record header (route chip, title, site, locale, policy, state chip,
    live address) and its tabs `PageDetail/PageContent.xml` (Knowledge.qvue in a Commerce mode, its transitions setup,
    page, history, diff, attachment and savePage serving the bound page only, savePage through `store#SitePage`; its twin
    `PageText.xml`), `PageRoute.xml`, `PagePublication.xml` (Publish with version, from, until and reason; Withdraw with
    the menus that link to it confirmed; Cancel what waits) and `PageHistory.xml` (versions; publication activity).
    Commerce's context only (`ironstone.commerce.ContextServices.get#SharedContext`).
  - `Commerce/Website/Navigation.xml`: the site and its menus, New menu, Rename, MenuItems with Move up, Move down, In,
    Out, Edit and Remove, Add item (destination choices by kind), PublishNavigation (each item's check, from date, reason)
    and Withdraw; Redirects with Add redirect, Publish, Withdraw and Remove a draft.
  - `Commons/Knowledge.qvue` (F53): the Commerce mode (`inCommerce` on PageDetail's PageContent): the bound page alone, no
    side pane, tree, search, Publish, rename, move, duplicate, delete, watch, Request review, editing together or the
    parts under the page; Edit by the binding's `canEdit`; save posts to PageContent's `savePage`.
  - F65: under Commerce, Shared/CategoryDetail's Parents and Products tabs hide their edits and their transitions refuse,
    naming Store categories; Products' are unchanged.
  - Commerce.js (appended): `linkPaths` Website/Pages, Website/PageDetail, Website/Navigation; choices `sites`,
    `sitePages`, `destinations`. Demo.js: ZIZI_SHOP's published Returns policy page (route `returns`, role `returns`) and
    its published `main` menu (DEMO_1_1, Returns), each a step of its own.
- Specs: Mantle `test/public/SitePages` (6 features, 2.5 s: the Forum's guidelines bound and read by role, out of Commerce's
  reach and its role reserved; a returns page by route, locale and role, its space restricted with no grant left behind,
  route and role taken, designer and other organization refused; a saved version not live, unknown and stale versions
  refused, a retry by its key, a withdrawal; a schedule activated by the job as its author, one whose author lost
  COMMERCE_PUBLISH failed with the old version live and a readiness finding; the navigation refusals; a published menu and
  redirect live, a referenced page's withdrawal confirmed, the generation +4). BOSS `CommerceSitePages` (3 features,
  0.3 s: Pages scoped to the user's stores' sites; PagePublication's one qvt render; F65's refusal) and a `CommerceAccess`
  case (0.16 s: the designer edits ZIZI_SHOP's returns page, the reader is refused, the designer is refused a page on
  Ziziwork Services' site; the `sites` choice). Also run, all pass: mr-pass Forum, ForumAccess, Operations, Integrations,
  Portals, SupplierPages, ShopAccess, ShopThemes, Transport (57 features; the Schema/Routes mirrors unchanged); Mantle
  Mailboxes, PassAuthority, ThemeReleases, StoreAdmin, StorePublication, AccountingPortals, SupportPortal (77 with
  SitePages); mr-boss Knowledge, KnowledgeReview, Notes, CustomerServiceKnowledge, CustomerServiceAccess, ProjectsAccess,
  CommerceAssortment, CommerceStores, CommerceAccess, ProductsTaxonomy, ProductsSharedContext, ProductsAccess (108 with
  CommerceSitePages). Not run: `./moq test-apps` and the budget measure.
- Acceptance: `test/acceptance/Commerce/CommerceSitePagesWalk` (4 features: the designer saves a new returns policy version in
  PageContent, not live; the publisher schedules it in PagePublication, the job shows it at its date, by role and by route
  and locale, and the Forum's guidelines page of ZIZI_SHOP reads as before; Navigation refuses a menu item of the draft
  DEMO_VAR, a redirect onto `/api` and one into a loop; a delivery page scheduled by a publisher who then loses the
  group stays unpublished with the `sitePublication` finding, then cancelled; every Website screen in qvt and html), run:
  4 passed. AppStructure, TuiRender and ServerStatic: 22 passed.
- Lint: `moqui lint --screens` (release binary), 132 sites as before, none in the new or changed screens.
- Inventories: usl-inventory's `publish#SitePage` row names Shared/PageDetail/PagePublication and Commerce/Website/PageDetail
  (`get#SitePage`'s Shop Page row is Shop P3's); ss-inventory has no rows of these screens.
- Design: design-commerce §5 has the as-built note (key, page space, exact version, schedule, navigation records) and
  PageDetail's route `Commerce/Website/PageDetail`; crosscut §3.28's row likewise.
- Decisions:
  - Pages and PageDetail are sibling routes (`Website/Pages`, `Website/PageDetail`), as Merchandising's CategoryDetail.
  - A redirect is a draft until a publisher publishes it, as a menu is; a menu's draft items are JSON on its row, its
    published versions snapshots; live reads re-check destinations.
  - PageContent has its own transitions rather than guards on Knowledge.xml's thirty (F73).
  - The demo store has a published returns policy page and main menu, for Shop P3's Page and the walks.
  - Commerce's policy roles are delivery, returns, privacy and terms; guidelines and about stay the Forum's
    (`ROLE_RESERVED`).
- Findings (provisional):
  - **F72** F52's "as no user with authorization disabled" is not available in a request: the framework has no scope
    that runs without the user, and `logoutUser` in a web request ends the session. `store#SitePage` gives the user the
    page space's update right for one write and puts the row back. For the framework, optional: a wiki parameter or
    `ec.user` scope for a checked internal write.
  - **F73** Knowledge.xml's write transitions (rename, move, duplicate, drop, delete, publish, restore, reviews, tags,
    files, follow, links) would each need a Commerce guard; PageContent serves the Commerce mode with its own six
    transitions, so no other write is reachable from the Commerce mount (F53 said Knowledge.xml).
  - **F74** The exact-version rule as built: the Forum's path still needs the version to be the wiki's published one
    beforehand (and its page is dark between the wiki publish and the binding); Commerce's publish does both in one
    transaction.
  - **F75** For the lead (mr-pass, read only here): design-shop's existing-records row ("`get#SitePage` serves the
    guidelines and about roles only") is now out of date; Shop P3's `getShopPage` reads pages through `get#SitePage`'s
    `appMountId`, `routePath`, `locale` input, the main menu through ThemeView's `navigation`, and redirects through
    `resolve#SiteRedirect`; the PASS operations for them, and their Schema/Routes mirrors, are Shop P3's.
  - **F76** ZZW_RETAIL (POPC_DEFAULT's `ProductStore.wikiSpaceId`, Customer Service's knowledge space) has no
    `restrictUpdate` and is not the store page space; Commerce made POPC_DEFAULT a page space of its own. Shop P3's move of
    ZZW_RETAIL's pages to the Shop site (F17, F56) should bind them through PublicSitePage pages of the restricted space,
    or leave them as knowledge articles.
  - **F77** The template key is checked only for its shape, not against the active release's templates; P5's editors
    or Shop P3's page render should check it.

**Review Nov 5 (P4).**
- Checked: `git diff master...com/p4` in mr-mantle and mr-boss against this section, §2 and design §5. F72's grant
  (`withSpaceUpdate`): the WikiSpaceUser row is made and put back inside the caller's transaction (`store#SitePage`,
  `publish#SitePage`, the job's item transaction), so it is never committed; a failed wiki write marks the transaction
  rollback-only (any service error does), so a skipped restore rolls back with it; `get#WikiPageAccess` reads the row
  without the entity cache and the framework's transaction cache is per thread, so a concurrent request of the same user
  (Commons Knowledge) never sees it. Kept; the framework allows only no-user internal writes, so no safer mechanism exists
  without a framework change (F72 stands). The re-key: Forum.js' `getSitePage` and `publishSitePage` find by site and
  role and give a new binding its key; Forum, ForumAccess, ShopThemes, Mailboxes and PassAuthority pass; Forum.js's
  reserved list is PublicApps.js `reservedPaths` unchanged. `publish#SitePage`: operation key before the revision check,
  `REVISION_STALE`, the exact version made the wiki's published one and the binding's in one transaction, the generation
  on publish now, withdraw and activation only. F73: PageContent mounts only Knowledge.qvue with its own six
  transitions (no Knowledge.xml under Commerce); the space's `restrictUpdate` keeps Commons Knowledge's writes out. F65,
  the live reads (published site, active versions only, destinations re-checked), store scope through StoreAdmin.js on
  pages, menus, redirects and the `sites`, `sitePages` and `destinations` choices.
- **R1 (high)** A menu's category item, and a redirect to a category, were checked through `get#StoreCategories`
  (`COMMERCE_VIEW`): an anonymous `get#SiteNavigation`, and so ThemeView's navigation on every Shop page, failed on the
  error message the refusal left. The check reads the store's tree directly (StoreMerchandising.js exports `storeTree`,
  appended), and each live item's check keeps its errors in their own frame. SitePages' menu now has a category item
  read anonymously. (mr-mantle e42c6380)
- **R2 (medium)** A scheduled publication refused with an error message (an author who can no longer sign in:
  `internalLoginUser` adds one) was never recorded, as the failure write does not run beside an error: the item was
  retried every minute with no readiness finding. The refusal clears the messages first, and the job records the failure
  in its own transaction when the item's could not commit. SitePages has the disabled author's scheduled redirect.
  (e42c6380)
- **R3 (medium)** A redirect draft saved with a from date, or a failed scheduled one, could not be published once that
  date had passed (`VALUE_INVALID`, a past start); a passed date is now. A failed menu version was never cleared, so its
  readiness finding stayed after the menu was published again; publishing a menu now ends it. (e42c6380)
- **R4 (low)** The `destinations` choice labelled any product id given as `selected` with its name; only one the store
  has. (mr-boss 9f4c949a)
- **R5 (low)** ThemeView's `navigation` shape dropped a menu's third level; the WikiSpaceUser row's `allowUpdate` is put
  back exactly (an empty one stayed `N`). (e42c6380)
- For the lead:
  - `store#SitePage` changes a published page's route, role, title, SEO and template live with `COMMERCE_THEME_EDIT`
    alone (the generation advanced, `publicationRevision` not, the stamp check optional): confirm, or make those of a
    published page wait for `COMMERCE_PUBLISH`.
  - The store page space is `restrictView N`: every Commons Knowledge user reads the pages' drafts and versions.
  - The job records a refusal that rolled its transaction back (R2) whatever its cause, so a transient one (a lock
    timeout) also needs the publisher to publish again; scheduled menus and redirects are not refused when their window
    ended before they started (pages are, `WINDOW_PASSED`).
  - `docs/Upgrading.md`'s MySQL `CREATE UNIQUE INDEX PASS_PAGE_ROLE` fails if the table check made the index already.
- Specs after the fixes: Mantle SitePages 7 passed (2.6 s), ThemeReleases, StoreAdmin, StorePublication 18, Mailboxes
  and PassAuthority 28; BOSS CommerceSitePages, CommerceAccess, CommerceAssortment 17, Knowledge and
  CustomerServiceKnowledge 25; PASS Forum, ForumAccess, ShopThemes 31. No screen changed; acceptance not rerun.

**Follow-up Nov 6 (F78).**
- `store#SitePage` (SitePages.js, `expectedRevision` added to ThemeServices.xml): a change of a published or scheduled
  page's title, route, locale, role, template or SEO is a publication: it needs `COMMERCE_PUBLISH` beside
  `COMMERCE_THEME_EDIT` (`PERMISSION_DENIED` naming it) and the binding's `publicationRevision` as read (`REVISION_STALE`
  without it), and advances that revision (and, on a published page, the site's generation). Refusing fitted the records
  better than holding a draft binding: the live reads and the job read the binding's own fields, and a held copy would
  need new fields, a merge at publication and a second schedule. A draft page's fields and every text save are as before.
  Shared/PageDetail/PageRoute: editable on such a page only with the publish permission (otherwise its values shown and
  a line naming it), saved with the page's revision.
- The job refuses a scheduled menu version or redirect whose window ended before it ran (`WINDOW_PASSED`, as pages, one
  `windowOpen` check). Found while testing it: the job's menu item read its version by a numeric from date, which
  PostgreSQL refuses, so no scheduled menu version was ever activated; it reads the key as a
  date-time now, and SitePages activates one.
- mr-mantle `docs/Upgrading.md`: the `PASS_PAGE_ROLE` index is made only when missing (PostgreSQL `IF NOT EXISTS`, as
  before, said; MySQL a query of `information_schema.STATISTICS` first, the `CREATE UNIQUE INDEX` only when it lists
  nothing).
- Specs: Mantle SitePages 9 features (was 7; 3.0 s): a published page's binding by the designer refused, without the
  revision refused, by a holder of both changed with the revision and generation +1, a draft's change as before; a passed
  window refused for a scheduled menu version and redirect, a due menu version activated. ThemeReleases 5 passed. BOSS
  CommerceSitePages 4 (PageRoute's one qvt render as the designer on the published returns page: no Save, the line);
  CommerceAccess's P4 case now: the designer and the reader refused on the published returns page, the administrator
  (both permissions) edits it, another organization's site refused (14 features with CommerceSitePages). mr-pass Forum and
  ForumAccess 27 passed. Lint: PageRoute not flagged. Acceptance not run (CommerceSitePagesWalk only renders PageRoute).

- **Wave 4 suites (Nov 6, on master after Shop P2, P7 and the F60 fix merged; P4's worker ran at the same time):**
  standalone mr-mantle 1,777 passed, 2 failed (the baseline WorkTimeEntries and WorkTimesheets), 11 skipped;
  `./moq test-apps` 3,134 server features and 15 client features passed, none failed; within every budget (server:
  mr-mantle 337.5 of 370 s, mr-boss 240.4 of 264 s, mr-pass 14.8 of 15 s; client: mr-boss 46.8 of 49 s, mr-pass 4.2 of
  6 s); `moqui lint --screens` clean. Shares so far: Commerce's BOSS specs 5.3 s, Shop's mr-pass specs 1.8 s, the new
  Mantle specs (StoreAdmin, StorePublication, StorePromotions, ThemeReleases) 9.8 s. mr-pass's budget raised by Shop's
  share to 17 s (the user's agreement, §4).

- **Waves 5–6 suites (Nov 6, on master after P4, its F78 follow-up, P6 and Shop P3 merged; P5's and Shop P4's workers
  ran at the same time):** standalone mr-mantle 1,798 passed, 2 failed (the baseline WorkTimeEntries and
  WorkTimesheets), 11 skipped; `./moq test-apps` 3,165 server features and 15 client features passed, none failed;
  `moqui lint --screens` clean. Under the two workers' load the feature times doubled (mr-mantle 576.1 s, mr-boss 388.6
  s, mr-pass 25.0 s server; client within budget), so the run fails its budget check on load alone; the budgets are
  measured on a quiet run (the gate C1/S1 run after P5) before any is raised.

### P5 — Theme editors and preview

Design §5 Themes, ThemeDetail, ThemeEditor and TemplateEditor; COM-THEME, with Shop P2's engine and releases
(SHOP-THEME) and SHOP-RENDER's preview. Ends stage C1/S1.

- **ThemeServices' authoring part** (T; `COMMERCE_THEME_EDIT` unless named), on Shop P2's records and core:
  `find#Themes`, `create#ThemeDraft` from a release (Shop P2 starts a draft from a starter), `import#Theme` (draft
  only, scanned, size and path checked; a Liquid package refused as an unsupported engine), `store#ThemeDraft`,
  `store#ThemeComposition`, `store#ThemeSettings`, `store#ThemeAsset`, `get#ThemeAssets`,
  `get#`/`store#ThemeTranslations`, `assign#ThemeTemplate`, `get#`/`store#`/`change#ThemeFile` (`COMMERCE_THEME_CODE`),
  `get#ThemeBindings`, `get#ThemeHistory` and `create#ThemePreview`. Every save checks the draft revision. The editors
  call Shop P2's `validate#Theme`, `publish#Theme` and `restore#ThemeRelease` (`COMMERCE_THEME_PUBLISH`, seeded in P1)
  and its export manifest (`export#ThemeRelease`); P5 builds none of them again.
- **Preview** (design-shop §12.6): an isolated preview host per site that frames only from the BOSS origin, serves
  noindex and no-store, sends no mail, analytics or payment, and renders the draft through the same adapter as the live
  site with synthetic private state; a short-lived preview capability for one site, mount, draft and actor; selection
  messages origin-checked and carrying section IDs only. The framework part is the public-site routing of the preview
  host and its own CSP (P0 checks it); the live shop stays unframeable.
- **Screens:** Themes (ThemeFind, ThemeList, NewTheme, ImportTheme); ThemeDetail (record header, ThemeIdentity,
  Validation, Bindings, Releases, PublishTheme, RestoreRelease, ExportTheme); ThemeEditor, a `.qvue` with the outline,
  the framed preview and the schema-generated settings panel (Composition, SectionSettings, ThemeSettings, ThemeAssets,
  UploadAsset, Translations, TemplateAssignment, PreviewContext), and its TUI twin listing sections and settings with
  reorder, save, preview link and publish; TemplateEditor, a `.qvue` over the framework editor and diff (ThemeFiles,
  Source, FileSchema, Diagnostics, RevisionDiff, FileOperation), its TUI twin on the framework text editor.
- **Specs:** Mantle `test/public/ThemeAuthoring` (stale draft refused, a script or event handler in a template refused,
  a required checkout component not removable, an export holding no secret; publish and restore with the generation are
  Shop P2's `ThemeReleases`); BOSS `CommerceThemes` (the designer cannot publish or edit source, ThemeDetail's one qvt
  render, the editors' tui twins once). The golden-path client walk, `test/client/Commerce/CommerceThemesWalk`, starts
  here: a designer opens the
  starter theme, moves a section, previews at phone width, and a publisher publishes it. Acceptance:
  `test/acceptance/client/Commerce/ThemeEditorWalk` (drag and keyboard reorder agree, the preview's origin check).
- **Usable when** (design §12.2 scenarios 5 and 6, with Shop P3, the stage gate; scenario 5's bad required checkout
  component blocking purchase is checked in Shop P5):
  - a designer copies the starter theme, rearranges the home page's sections, edits a heading and a color, previews at
    phone and desktop width, and a publisher publishes it; the Shop pages change, locally and through a remote frontend;
  - a theme developer edits a locked template; a `<script>` or an `onclick` is refused with its file and line; restoring
    the earlier release brings back its look but not a product withdrawn since;
  - the preview neither sends mail nor records a visit, and its page refuses to be framed by another origin.

- **Built (framework), Nov 5, 2026** (mr-moqui b502417e; F55): a response that sets its own CSP with `frame-ancestors`
  gets no conf `X-Frame-Options`; the desktop shell's `frame-src` lists the origins in `moqui_shell_frame_origins`
  (https, or http on localhost, no path), else stays `'none'`. No routing change was needed (F54).

**Built Nov 6 (P5)** (mr-mantle, mr-pass, mr-boss; branch `com/p5`).
- Mantle:
  - `entity/PublicThemeAuthoringEntities.xml` (new): `PublicSiteHost.hostKindEnumId` (`PublicSiteHostKind`: PshkLive,
    PshkPreview; empty is live), `PublicTheme.description`, and `PublicThemePreview` (a preview: theme, site, mount, user,
    page kind, target, locale, the draft revision, an expiry 20 minutes on, and only the SHA-256 of its token, unique).
  - `service/mantle/public/ThemeAuthoring.js` (new) and its services appended to `ThemeServices.xml`: `find#Themes`,
    `import#Theme`, `store#ThemeDraft`, `get#ThemeComposition` (added: what the editors read), `store#ThemeComposition`,
    `store#ThemeSettings`, `get#ThemeAssets`, `store#ThemeAsset`, `get#`/`store#ThemeTranslations`, `assign#ThemeTemplate`,
    `get#`/`store#`/`change#ThemeFile` (`COMMERCE_THEME_CODE`, now checked), `get#ThemeBindings`, `get#ThemeHistory`,
    `create#ThemePreview`, and the anonymous `get#PreviewHost` and `get#ThemePreviewPage` PASS calls in process. Every save
    takes `expectedRevision` (`REVISION_STALE`) and goes through `checkedSave`: the adapter checks the package with the
    change and an error in a changed file refuses it (`THEME_SOURCE_INVALID`, `file:line message`), the draft unchanged.
    Composition: stable ids, known section types (`UNKNOWN_SECTION`), a kept id keeps its type, the order names each once,
    and a section that placed a required component on its page (purchase, cart, checkout, search) is never removed or
    hidden (`REQUIRED_COMPONENT`, also for removing its file). Settings by schema (`UNKNOWN_SETTING`; null restores the
    default). Imports: a files map or a `.tar.gz` (`extractArchive`), refusing Liquid (`ENGINE_UNSUPPORTED`), scripts and
    other kinds (`FILE_KIND_REFUSED`), outside paths and bounds. Translations are `locales/<locale>.json` with fallback,
    no source permission. File operations add only the package's text kinds, keep `theme.json`, the settings and each
    page kind's template, and name dependents (`HAS_DEPENDENTS` unless confirmed).
  - Themes.js (Shop P2's core, F55): images and fonts under `assets/` (png, jpg, gif, webp, woff2) are package files
    kept as bytes (`putBytes`, versions read as streams), their package text the base64 of the bytes, digested as text,
    so releases, `getShopThemeFiles` and remote verification carry them unchanged; an upload's (and an import's) leading
    bytes must be its type's (`ASSET_TYPE_MISMATCH`), at most 384 KB, and clean by `pass_scanner_service`
    (`SCANNER_UNAVAILABLE` without one). Exports `compositionOf`, `sampleView`, `packageLimits` and the path tests.
  - F77: SitePages.js `templateOf` accepts a page's template key only when it names a page template of the site's active
    release or a draft of the store's themes (`TEMPLATE_UNKNOWN`); ShopCatalog's page view carries the key and ThemeView's
    `getShopPage` answers `template` when the active release has it (so the live page renders with it), the key never in
    the theme's view.
  - F54: PublicApps.js `pageUrl` and `sitesFor`, StoreAdmin.js readiness and `getStoreSites`, and Forum.js readiness
    skip preview hosts; `store#Mounts` binds one with `{hostname, preview: true}` (`hostKindEnumId`), never canonical
    (`PREVIEW_NOT_CANONICAL`).
- mr-pass:
  - `screen/ShopPreview.xml` (a Pass.xml subscreen) and `screen/Shop/ShopPreview.js`: on a site's preview host
    (`get#PreviewHost`, on the authority only: with `pass_backend_url` there is none) `resolve#Route` answers only
    `/preview/{token}` and `/preview/{token}/asset/{path}`, every other path Not Found, and Pass.xml skips `getSiteInfo`
    and the shell (so an unpublished site previews). The page renders the draft through `ec.resource.theme.render` with
    ShopTheme.js's trusted components, the token's view and its template; headers `no-store`, `X-Robots-Tag: noindex,
    nofollow`, `Referrer-Policy: no-referrer`, and a CSP with a nonce'd script, `connect-src 'none'`, `form-action 'none'`
    and `frame-ancestors` the origins of the new `pass_preview_frame_origins` (none: `'none'`). Its script takes one
    MessageChannel port from an allowed parent origin with the URL's nonce, answers `ready`, sends `{type: "select",
    sectionId}` on a click and shows the editor's highlight; links and forms do nothing. Assets are the draft's, no-store.
  - ShopTheme.js: `sendAsset` serves the binary types as bytes; `renderView` passes the page's `template`. The starter's
    sections carry `data-section-id="${section.id}"`. `Contracts.d.ts` ShopPage gains `template`. Test conf: ZIZI_SHOP's
    preview host `preview.shop.zizi.localhost` (mount `/`) and `pass_preview_frame_origins` `http://localhost:* http://127.0.0.1:*`.
    `docs/Deployment.md` gains the preview host's setup.
- BOSS:
  - `screen/Commerce/Website/Themes.xml` (ThemeFind, ThemeList with phone columns, NewTheme from a starter or a store
    release, ImportTheme of a `.tar.gz`), `ThemeDetail.xml` (record header with Edit theme, Edit source, Validate and the
    publisher's one primary Publish; ThemeIdentity, Validation after Validate, Where it is used with Publish here, the
    pages and products with their own template, Releases with Restore and Export, Activity; publish and restore with
    the active revision seen and an operation key), `ThemeEditor.xml` + `ThemeEditor.qvue` (template, Phone/Desktop,
    Undo/Redo, Save, the outline with drag, Move up/down and Alt+Up/Down, Duplicate, Hide, Remove, Add a section; the
    framed preview and its channel; Section, Theme (contrast feedback), Assets with upload, Texts and Pages (template
    assignment) panels; an unsaved-change warning), its twin `ThemeEditorTui.xml` (template, sections with Move up/down,
    a section's and the theme's settings, Preview link, Publish), `TemplateEditor.xml` + `TemplateEditor.qvue` (files by
    folder, the code editor with base digest, Save, Open its schema, Rename, Remove, Add file, Validate, findings with
    file and line, the release-to-draft diff) and its twin `TemplateEditorTui.xml` (the framework text editor). The JSON
    transitions call ThemeServices through `ThemeCalls.js` (probe in its own transaction, refusal in `errors`; the
    preview's address from the request's scheme and port). Website.xml lists Themes third.
  - Commerce.js (appended): `linkPaths` Website/Themes, ThemeDetail, ThemeEditor, TemplateEditor; choices `themes`,
    `themeStarters`, `storeReleases`, `themeSites`; get#Choices takes `themeId`. Demo.js: steps `theme` (POPC_DEFAULT's
    draft "Ziziwork Retail theme" from `mr-pass/starter`) and `preview` (ZIZI_SHOP's preview host).
- Specs: Mantle `test/public/ThemeAuthoring` (6 features, 4.7 s: a stale revision refused with nothing changed, a move
  and settings saved, an unknown setting and another organization refused; a `<script>` and an `onclick` refused at
  their lines, the designer refused source, a developer's edit with its history and diff; a checkout section neither
  removed nor hidden nor its file removed, Liquid and a script file refused on import; a PNG of JPEG bytes refused, no
  scanner refused, an SVG cleaned, a release with an image exported with no secret; F77's unknown and known page
  template, assignment; a preview without a preview host refused, its token's page answered only on the site's preview
  host with a synthetic cart, a forged token and another host refused). mr-pass `test/Shop/ShopPreview` (3 features,
  1.4 s: routes on the preview and live hosts; the page, its markers, nonce'd script and headers; a PNG uploaded through
  the test scanner served as bytes by the preview and, published, by the live asset route). BOSS `CommerceThemes`
  (2 features, 2.5 s: ThemeDetail's one qvt render as the designer, the four theme choices with a selected value not on
  the page and none for another organization; ThemeEditorTui and TemplateEditorTui once in tui with a move through the
  twin) and a `CommerceAccess` case (0.6 s: the developer saves a template, the designer is refused
  `COMMERCE_THEME_CODE`, another organization's manager cannot read the theme). Client: `test/client/Commerce/CommerceThemesWalk`
  in `suite.js` (1 feature, 8.0 s: from Themes the designer moves the home hero and saves, previews at phone width on
  `preview.shop.zizi.localhost` until the frame answers the channel; the publisher validates and publishes). Also run,
  all pass: Mantle ThemeReleases, SitePages, ShopCatalog, StoreAdmin, StorePublication, PassAuthority, SupportPortal,
  AccountingPortals (67 with ThemeAuthoring); mr-pass ShopThemes, ShopCatalog, ShopAccess, Forum, ForumAccess,
  Integrations, Transport, Portals, SupportAccess, SupplierPages, Operations (65 with ShopPreview); mr-boss CommerceAccess,
  CommerceSitePages, CommerceStores, CommerceAssortment, CustomerServiceKnowledge (28 with CommerceThemes). Not run:
  `./moq test-apps` and the budget measure.
- Acceptance: `test/acceptance/client/Commerce/ThemeEditorWalk` (in `test/acceptance/client/suite.js`; 3 features: a dragged section
  and the same move by Alt+Down agree and the saved draft has it; the preview answers neither a wrong nonce in the
  editor's frame nor a page of the live shop's origin with the right nonce, and its host answers the preview with
  no-store, noindex, no referrer, `frame-ancestors` the BOSS origins and no X-Frame-Options, `/`, `/account/Login` and a
  forged token Not Found; the developer's `onclick` in a section refused in TemplateEditor at its file and line, then a
  clean edit saved). Run once: 3 passed.
- Lint: `moqui lint --screens` (release binary) 132 sites as before, none in the new or changed screens.
- Inventories: no ss-inventory or usl-inventory row is of these screens or services (all new).
- Design: design-commerce §5 has the as-built note; design-shop §12.6 (the preview host) and §12.7 (binary assets).
- Decisions:
  - The preview render is not a PASS operation (§2: no authoring or preview operation in the registry): PASS calls
    `get#PreviewHost` and `get#ThemePreviewPage` in process, and only on the authority's runtime.
  - The preview always shows the current saved draft (the token binds the theme, not a revision); a site that is not
    published previews with the sample view (ShopCatalog's reads need a published site).
  - A section's settings are saved with the template's composition (one revision, one save); ThemeEditor's Save writes
    the composition, then the global settings.
  - ThemeDetail is one page of boxes; publish and restore act on the store's one Shop site from the header and per site
    from Where it is used.
  - Template assignment is the editor's Pages panel (pages); products keep Merchandising's template field, which
    `assign#ThemeTemplate` also serves.
- Findings (provisional):
  - **F86** The preview page's response still gets the framework's session cookie (an anonymous `no-store` answer),
    though the capability is the URL's token; design-shop §12.6 asks for minimal cookies. For the framework, optional: no
    session for a public-site response that declines one (as F42's `public` answers).
  - **F87** The framework's own routes (`/apps`, `/qapps`, `/rest`, `/Login`, …, public_site.rs FRAMEWORK_ROUTES)
    answer on every host, the preview host too, so a BOSS sign-in is possible on the preview origin; the isolation
    rests on the preview host being a name of its own. For the framework, optional: a `<public-site>` attribute that keeps
    the framework routes off a host.
  - **F88** A store that has not opened its site yet previews with sample products (ShopCatalog's `shopOf` needs a
    published site); a staff-authorized catalog read of an unpublished site would show its own products.
  - **F89** The adapter marks no section in its output, so selection in the preview needs the theme's sections to
    carry `data-section-id` (the starter's do); for the framework, optional: a marker in preview renders.
  - **F90** The preview's address uses the BOSS request's scheme and port (`ThemeCalls.previewUrl`); behind a proxy that
    changes them a property naming the preview origin would be needed.
  - **F91** For the lead: the mr-boss client budget (46.8 of 49 s on Nov 6) takes the walk's 8.0 s; a raise needs the
    user's agreement. mr-pass's specs are 7.8 of 17 s with ShopPreview.
  - **F92** Whether the framework writes a Visit row for the anonymous preview request was not checked; nothing in
    the preview path writes one, sends mail or calls a cart, gateway or analytics.

**Review Nov 5 (P5)** (reviewer; branch `com/p5`). Checked: the authoring services' permissions (COMMERCE_THEME_CODE on
`get#`/`store#`/`change#ThemeFile` and file text in `get#ThemeHistory`, COMMERCE_THEME_EDIT on the rest, the store's
scope through `themeOf`/`storeOf`), `expectedRevision` on every save and `checkedSave`'s file-and-line refusal, the
required components, import's path, kind, size and Liquid checks (archive entries re-checked against the package path
pattern, `..` refused, the upload staged on the server, never a caller's location), the binary assets (signatures with
WEBP's second tag, 384 KB, the scanner, bytes served with their type and nosniff, an SVG cleaned when stored and when
served, no HTML or script type in either type table), F77 (`templateOf` against the active release and the store's
drafts), readiness, `pageUrl`, `sitesFor` and `getStoreSites` skipping preview hosts; the preview: only `/preview/{token}`
and its assets route on a preview host, the token only as SHA-256, 20 minutes, its site, mount and theme bound and the
host checked on each read, so a token of store A's draft cannot show on store B's site or host; the CSP (nonce'd script,
`connect-src`/`form-action`/`base-uri` none, `frame-ancestors` from `pass_preview_frame_origins`, which only mr-pass's
test conf sets, so production frames nothing until an operator names BOSS's origin), no-store, noindex, no-referrer;
the MessageChannel on both sides (target origin, `e.source` the parent, origin list, URL nonce, one port, section ids
matched against the outline); no mail, cart, payment or analytics call. The editors' JSON transitions and TUI twins call
ThemeServices only (POST through `moqui.request`, so the session token is checked), no `v-html`. All `allow-remote="false"`.
- **R1 (high, Mantle)** `store#Mounts` with `{hostname, preview: true}` never worked: Forum.js's input check allowed only
  `hostname` and `canonical` in a host, so it refused with "Invalid configuration fields"; and once accepted, a save
  that did not name `preview` (every existing caller) would have turned a preview host live. `preview` is now an allowed
  boolean; a host named without it keeps its kind (new: live); PREVIEW_NOT_CANONICAL is checked on that kind. New
  ThemeAuthoring feature (0.2 s): canonical preview refused with no row, a live and a preview host bound, a re-save
  without `preview` keeps PshkPreview, `pageUrl` the live host, the Shop mount kept.
- **R2 (medium, Mantle)** `import#Theme` wrote the package without the adapter's check, so a draft could hold a
  `<script>` or an `onclick` (and an SVG uncleaned) though every other save refuses them. The import now cleans SVGs and
  refuses an error in any file (`THEME_SOURCE_INVALID`, file and line). ThemeAuthoring's import feature has the case.
- **R3 (low, mr-pass)** ShopPreview.js said the preview records no visit; it now says what F92 found.
- Specs: Mantle ThemeAuthoring (7 features, 3.7 s), ThemeReleases, AccountingPortals, SupplierPortal, StoreAdmin,
  SitePages (52 pass); mr-pass ShopPreview, ShopThemes, ShopAccess, Forum, Portals (26 pass); mr-boss CommerceThemes,
  CommerceAccess, CommerceStores (16 pass); client CommerceThemesWalk 7.9 s.
- **For the lead:**
  - **F92 / F86 (framework, before the gate's "records no visit" is claimed):** the preview answer sets
    `moqui.session`; the first request starts no Visit (no cookie came), but the frame's next request (its stylesheet, a
    reload, the next preview in the browser) brings the cookie back and the framework starts a Visit, whose
    `initialRequest` is the `/preview/{token}/...` path, the token in plain text for its 20 minutes. Where BOSS and the
    preview host are on different sites SameSite=Lax keeps the cookie out of the frame; on one registrable domain
    (boss.example.com, preview.shop.example.com) it is sent. The fix is the framework's: a public-site response that
    declines a session, handled as screen/mod.rs's `cacheable` (no cookie, the session discarded). Not done in the app
    (only `Cache-Control: public, no-store` would reach that path today, a trick).
  - **F87 can wait:** framework screen renders carry `frame-ancestors 'none'` and `X-Frame-Options: sameorigin`
    (factory.rs defaults), so `/Login` and `/qapps` on the preview origin cannot be framed, by BOSS or anyone; only the
    preview page names BOSS's origins. What is left is a sign-in on the preview origin, where draft markup still cannot
    run script (the adapter refuses it, the CSP allows only the nonce'd script).
  - The token checks that its actor's account is enabled, not that the actor still has a theme permission or the store;
    a revoked designer's open preview lasts until it expires (at most 20 minutes). Acceptable as the design's
    short-lived capability.
  - Shop P2's `get#ThemeDraft` with `includeText` answers every source file's text to COMMERCE_VIEW, beside P5's
    COMMERCE_THEME_CODE on `get#ThemeFile` and file text in `get#ThemeHistory`. Theme source holds no secret; decide
    whether `includeText` should need COMMERCE_THEME_CODE.
  - CommerceThemesWalk (7.9 s) has no trim that keeps the golden path: Themes to ThemeDetail to Edit theme 2.5 s, Save
    1.1 s, Phone, Preview and the channel 0.9 s, the publisher's ThemeDetail with Validate 1.2 s, Publish and Confirm
    1.5 s; the time is the server's save, validate and publish. The client budget needs its 8 s.

- **Gate C1/S1 suites (Nov 6, on master after P5 and Shop P4 merged, nothing else running):** standalone mr-mantle
  1,812 passed, 2 failed (the baseline WorkTimeEntries and WorkTimesheets), 11 skipped; `./moq test-apps` 3,187
  server features passed and 1 failed (CommercePromotions: the `customers` choice put the selected customer after the
  page it then cut, so in a full run's many customers it was lost; now first), 16 client features passed; `moqui lint
  --screens` clean. Feature time: server mr-mantle 353.4 of 370 s, mr-boss 245.4 of 264 s, mr-pass 15.7 of 17 s; client
  mr-boss 53.7 of 49 s (CommerceThemesWalk 7.6 s, the golden path), mr-pass 4.3 of 6 s. Shares so far: Commerce's BOSS
  server specs 17.6 s, Shop's mr-pass specs 5.4 s. mr-boss's client budget raised by the walk to 57 s (the user's
  agreement, §4).

### P6 — Checkout settings

Design §8 CheckoutSettings; COM-CHECKOUT, with the readiness of checkout.

- **StoreAdminServices' checkout part** (C; `COMMERCE_STORE_EDIT`): `store#CheckoutPolicy`, `store#ShippingOption`,
  `store#StoreShippingGateway`, `store#StoreShippingRate`, `store#StorePaymentGateway` and `store#StoreTax`.
- **CheckoutPolicy** as dated ProductStoreSetting types (§4, F14): guest or account checkout, destinations, the
  inventory and backorder disclosure, the terms page (a P4 policy role), the purchase contact, and the support queue,
  chosen from the store organization's offered queues (`SupportAppSetting.queueIds`, or else
  `ServicePolicy.defaultCategoryId`, F37), since `create#CustomerCase` refuses any other.
- **Shipping** (F20): ShippingOptions over `create#StoreShippingOption` and `store#ShippingOption` for its update and
  removal, ShippingGateways over ProductStoreShippingGateway, both from approved choices; `ProductStoreShippingRate`
  (dated; Geo group, weight and value bands, amount, currency, priority) and the local rating rule replacing
  `get#OrderShippingRateLocal`'s zero for a store with rules, the zero kept for one without (Mantle's default), and
  readiness blocking checkout for a store bound to the local gateway with no rule; the simulator over
  `get#PostalAddressGeoIdSet`.
- **Payment gateways** (Z4): PaymentGateways offers only the store organization's enabled, current
  `PaymentGatewayOrganization` rows, with readiness flags for each gateway's capabilities (hosted checkout, saved
  methods, off-session, from Shop P5 and P7). **TaxDisplay** binds the store's tax gateway and display, previewed with
  `simulate#SalesTax` for a sample address and cart.
- **Readiness** for purchase: payment capability, delivery and tax, terms page, support queue, and a Support mount on
  each of the store's sites targeting the store's organization, since Shop links its return, question and cancel
  requests to the site's Support pages (§4, F38).
- **Links, not mounts** (F6): CheckoutSettings shows the carriers, payment methods and tax authorities its choices come
  from, with a link to Warehouse's Carriers and Accounting's PaymentMethods and TaxAuthorities for a user who may open
  them.
- **Screens:** CheckoutSettings with its readiness strip and the groups CheckoutPolicy, ShippingOptions,
  ShippingGateways, LocalRates (with its simulator), PaymentGateways and TaxDisplay (RecoveryPolicy in P10,
  RecurringPolicy in P12).
- **Specs:** Mantle `test/product/StoreShippingRates` (band bounds, priority and date overlap refused, no rule means no
  delivery, the local gateway's default unchanged for a store with no rules); BOSS `CommerceCheckoutSettings` (a gateway
  outside the organization's enabled rows refused, the settings' one qvt render).
- **Usable when:** the demo store gets local rates for two zones, the simulator quotes a sample cart for each and none
  for a third country; binding a disabled gateway is refused; readiness lists what still blocks checkout.

**Built Nov 6 (P6).**
- Mantle:
  - `entity/ProductStoreShippingEntities.xml` (new): `ProductStoreShippingRate` (sequenced id; store, zone `geoId`, optional
    carrier and method, weight band with its unit, value band, charge, currency, priority, dates, `previousRateId`,
    `changeReason`; key fields audit-logged) and the setting types `PsstCheckoutAccount`, `PsstCheckoutDestinations`,
    `PsstCheckoutStockDisclosure`, `PsstCheckoutTerms`, `PsstCheckoutPhone`, `PsstCheckoutSupportQueue`, `PsstTaxDisplay`,
    `PsstTaxOrigin`. `entity/ProductStoreEntities.xml`: ProductStoreSetting gains `changeReason`, its value, end and reason
    audit-logged; ProductStoreShippingGateway's gateway audit-logged.
  - `service/mantle/product/StoreCheckout.js` (new) and its services appended to `StoreAdminServices.xml`:
    `get#CheckoutSettings`, `store#CheckoutPolicy` (dated, per-field kinds, a reason, an empty field ends its setting),
    `store#ShippingOption` (over `create#StoreShippingOption`; a CarrierShipmentMethod only, `METHOD_NOT_OFFERED`),
    `store#StoreShippingGateway` (the local gateway or one with a ShippingGatewayCarrier row, `GATEWAY_NOT_APPROVED`; the
    carrier account masked on read), `store#StoreShippingRate` (ordered bands `BAND_INVALID`, `RATE_OVERLAP` at one priority,
    no past start, a change of a rate in effect ends it and starts its successor, end with a reason), `simulate#StoreShipping`,
    `get#StoreShippingRateLocal` (no permission: the local gateway's rule), `store#StorePaymentGateway` (the organization's
    enabled, current PaymentGatewayOrganization rows only, `GATEWAY_NOT_ENABLED`, Z4), `store#StoreTax` (the gateway through
    `store#Store` with its reason and revision; display and origin settings), `preview#StoreTax`, `find#CheckoutOptions`.
    Each checks `COMMERCE_VIEW`/`COMMERCE_STORE_EDIT` and the store's scope through StoreAdmin.js. A removal of a ship option,
    shipping gateway or payment gateway binding needs its reason and writes an EntityAuditLog row (F61), so History shows it.
  - StoreAdmin.js (tables appended): `settingTypes` gains the eight types with kinds checked in `settingKinds`
    (choices, destinations, the support queue among `SupportPortal.offeredQueues`, a current store facility; `settingValue`
    takes the store), `cloneLeftOutSettingTypes` the queue and tax origin, `historyEntities` the settings and shipping
    gateways (a setting's row named by its type), and `readinessChecks` six purchase checks from StoreCheckout.js: Payments,
    Delivery (warning), Local rates (blocks a store on the local gateway with no rate in effect), Terms page (each Shop site's
    live `terms` page, unless the policy says buyers are not asked), Support queue (F37) and Support pages (each Shop site's
    enabled `support` mount targeting the store's organization, F38); fix `checkout`, or `sites` for the last.
  - `CarrierServices.get#OrderShippingRateLocal` (F20): for a store with a rate in effect now or later, the matching rate's
    charge (lowest priority, then latest start; the part's shipped items' value and weight, an item with no weight counting
    1 as before, units through `convert#Uom`), or no item and `rateUnavailable` with a warning when none matches; a store
    with none keeps the zero. `get#OrderShippingRatesBulk` leaves out a method with `rateUnavailable`.
  - `SalesTax.js`: `simulate` checks Accounting's read and calls the new exported `sample`, which `preview#StoreTax` calls
    after its store check.
- BOSS:
  - `screen/Commerce/Settings.xml` is the area (its placeholder replaced) with `Settings/CheckoutSettings.xml`: the store
    choice, the readiness strip, CheckoutPolicy (view and Change policy), Ship options, Shipping gateways, Local rates with
    Add, Change, End and the simulator, Payment gateways with capabilities and state, Tax with Change tax and the preview;
    removals in dialogs with their reason. A store Mantle refuses (a Commerce administrator's choice outside Mantle's scope)
    shows Not available.
  - Commerce.js (appended): `linkPaths` `Settings/CheckoutSettings`; `ownerLinks` (ContextServices `get#OwnerLinks`) gives
    Warehouse's Carriers and Accounting's PaymentMethods and TaxAuthorities to a user whose groups may open them (F6).
    StoreDetail's General maps a `checkout` fix to CheckoutSettings for a user with the Settings area.
  - Demo (`BossCommerceDemoData.xml`, appended): ORG_ZIZI_RETAIL's PaymentGatewayOrganization rows for TEST_APPROVE
    (enabled) and TEST_DECLINE (disabled); POPC_DEFAULT's support queue BOSS_CS_Q_SUPPORT. No demo rates (below).
- Specs: Mantle `test/product/StoreShippingRates` (5 features, 1.6 s: bands, overlap at one priority and dates, permission
  and organization; rated parts by zone, band, method and priority, Japan undeliverable with no item and left out of the
  bulk rates; the simulator's two zones and none for Japan; a store with no rates at zero with readiness blocking, then
  charged; a change starting a successor, an ended store back to zero) and `test/product/StoreCheckout` (4 features, 1.3 s:
  the policy's kinds, queue, reason and dated change in History; gateways enabled and approved only, removals with their
  reason in History; support queue, Support pages and Terms readiness and the PASS names; tax gateway and the reader's
  preview). BOSS `CommerceCheckoutSettings` (2 features, 0.6 s: TEST_DECLINE refused, reader and other organization, owner
  links for the administrator and not the manager; CheckoutSettings' one qvt render). `CommerceStores`' StoreDetail now
  expects things to fix and the checkout fix link. No CommerceAccess case: the rules are Mantle's permission and scope.
  Also run, all pass: Mantle StoreAdmin (7, with the new specs), and CarrierServices, OrderToCashBasicFlow, WarehouseShipping, ShipmentPick,
  ShipmentLoads, ShippoGateway, ProductCatalogServices, SitePages, AccountingPortals, AccountingSetup, AccountingCurrency,
  AccountingTax, Promotions, StorePromotions, StorePublication, ReturnToResponseBasicFlow, DropShip, RestApiTests (216
  features); mr-pass ShopAccess, Forum, Portals, ShopThemes, Integrations (29); BOSS CommerceAccess, CommerceStores,
  CommercePromotions, CommerceAssortment, CommerceSitePages, AccountingAccess, AccountingPayables, AccountingPayments,
  ProjectsAccess (62 with CommerceCheckoutSettings). Not run: `./moq test-apps` and the budget measure.
- Acceptance: `test/acceptance/Commerce/CommerceCheckoutWalk` (4 features: readiness blocking on local rates and the Terms page;
  the manager's rates for US Continental and Canada through `saveRate`, the simulator quoting 6.00 and 14.00 and nothing for
  Japan, the local rates' finding ready; TEST_DECLINE refused through `savePayment` and TEST_APPROVE kept; Services' manager
  Not available; CheckoutSettings in qvt and html), run: 4 passed; it ends its rates in cleanup. Also run: AppStructure
  (its placeholder floor 45 → 43, F82), CommerceFoundationWalk, CommerceStoresWalk, TuiRender: pass. The whole mr-boss
  acceptance suite was not run.
- Lint: `moqui lint --screens` (release binary), 132 sites, none in the Commerce screens.
- Inventories: ss-inventory's six EditProductStore ship option, shipping gateway and payment gateway rows name their forms;
  usl-inventory's `create#StoreShippingOption` and `simulate#SalesTax` rows name CheckoutSettings.
- Design: design-commerce §8's as-built note (setting types and defaults, a rate's carrier and method, when a store is
  rated, matching and overlap, no delivery, removals, the preview, capabilities, readiness).
- Decisions:
  - An absent checkout setting is its default; Shop's checkout reads the policy in process (StoreCheckout.js `settingAt`,
    `checkoutPolicy`), as `get#CheckoutSettings` is staff-only.
  - A store is rated while a rate is in effect or starts later, so ending every rate gives the default back (the walk relies
    on it); no demo rates on POPC_DEFAULT, whose orders Mantle's specs place at zero shipping.
  - A rate may name a carrier and method; overlap is checked on the same zone id only; a tie at one priority takes the latest
    start.
  - Payment readiness blocks on bindings only; capabilities inform (Shop P5 decides what checkout needs).
  - The tax preview calls the calculation factored out of `simulate#SalesTax` rather than `simulate#SalesTax` itself, whose
    Accounting read a Commerce manager need not hold.
  - The simulator takes a sample address's geos (country, state) or a contact mech id, as get#PostalAddressGeoIdSet reads them.
- Findings (provisional):
  - **F79** `calculate#OrderShipping` sums a part's missing total as 0 (`copsOut.shippingTotal ?? 0`) and
    `get#StoreShippingOptions` lists an unrated option without a total, so a store with rates and an address no rate serves
    gets no shipping charge on an order placed from the order screens (a warning message only). Shop P5 must quote through
    `get#OrderShippingRatesBulk` and refuse a part with no quote.
  - **F80** An order item's creation already runs the part's shipping calculation (Mantle's ECA), so the local rule runs
    on each cart change; for a store with no rates it is one read of the store's rates.
  - **F81** A Commerce administrator's store choices (Commerce.js: every organization) include stores Mantle's StoreAdmin
    scope refuses (FacilityScope's organizations: BOSS_ACCT_STORE for commerce.admin); StoreDetail fails for them the same
    way. CheckoutSettings shows Not available; the two scopes should agree.
  - **F82** AppStructure's placeholder floor (45) was one above master's count after P4 and P7 each replaced a
    placeholder on their own branch (44); with Settings it is 43.
  - **F83** Mantle has no record of a payment gateway's capabilities; StoreCheckout.js `gatewayCapabilities` (by gateway
    type: the test gateway hosted when its authorize service is `hostedPending`, Authorize.Net saved methods) is the place
    Shop P5 and P7 set theirs.
  - **F84** A created setting's audit rows carry no reason (F63), so its reason is the audit row of its `changeReason`
    field (History's "Reason"); an update's rows carry it.
  - **F85** The demo store's readiness now blocks (no local rate; ZIZI_SHOP has no Terms page): Shop P5's demo checkout
    needs a store Mantle's specs do not place at zero, or those specs a store of their own.

**Review Nov 6 (P6).**
- Checked: `git diff master...com/p6` in mr-mantle and mr-boss against this section, design §8 and §1.1, and §2. Each
  StoreCheckout operation takes StoreAdmin.js' scope (`COMMERCE_VIEW`/`COMMERCE_STORE_EDIT`, the store's organization, the
  StoreStaff limit) before reading or writing; a forged rate id of another store is refused like a missing one. F20: the
  local gateway rates by the store's rules only for a store with a rate in effect now or later, a store with none keeps the
  zero (CarrierServices, OrderToCashBasicFlow, WarehouseShipping and the new StoreShippingRates pass). F79 confirmed:
  a rated store's unserved address gets no shipping item and a warning only, at placement from the order screens. F80
  confirmed: the order item ECA runs the rule on every cart change. Payment gateways: only the organization's enabled,
  current PaymentGatewayOrganization rows, in the save and its choices; shipping gateways: the local one or one with a
  ShippingGatewayCarrier row. F61: each removal writes an EntityAuditLog row with the user and reason. F37/F38 readiness: the
  queue among `offeredQueues`, an enabled `support` mount targeting the store's organization on each Shop site. The tax
  preview calls SalesTax.js' calculation after the store check, with no customer, so no Accounting record beyond the rates
  and authority names a sale shows. Setting types are validated by kind (choices, geos, the offered queue, a current store
  facility); the carrier account is masked, gateway configuration never returned. Mantle defaults kept
  (`get#OrderShippingRatesBulk` drops only a method marked `rateUnavailable`).
- **R1 (medium, F81)** Commerce.js offered a Commerce administrator (MANTLE_ACTIVE_ORG grant, no active organization)
  every organization's stores while Mantle's StoreAdmin scope kept them to their own organizations, so StoreDetail and
  CheckoutSettings failed for another organization's store. As Warehouse's FACILITY_ALL_ORGANIZATIONS for its
  administrator: Mantle seeds `COMMERCE_ALL_ORGANIZATIONS` (ADMIN's) and StoreAdmin.js widens on it to every organization,
  or the active one; BOSS grants it to BOSS_COMMERCE_ADMIN; Commerce.js widens only for a MANTLE_ACTIVE_ORG grant held with
  it, so its choices never exceed Mantle's. CommerceAccess gains one case (the administrator offered and served
  BOSS_COM_DIGITAL, the manager neither); design §1.1 says so.
- **R2 (low, F80)** `get#StoreShippingRateLocal` read the ProductStore before the rates; a store with no rates now costs
  the one indexed read of its rates (PS_SHIP_RATE_STORE), and a rated store's matching reuses the rows read.
- **R3 (low)** `simulate#StoreShipping` took a `contactMechId` and answered its geos: a Commerce reader could read the
  country, state and postal code of any party's address. It takes a sample address's geos only (nothing used the id).
- **R4 (low)** Warehouse's rate shopping (Shipping.js, local rules) listed an unserved method of a rated store as a
  "Local rules" row with no total; it now leaves it out, as `get#OrderShippingRatesBulk` does.
- **R5 (F85)** The Commerce demo publishes ZIZI_SHOP's Terms of sale page (Demo.js, its own `terms` step, through
  `ThemeServices.store#SitePage` and `SiteServices.publish#SitePage` as P4's returns page). No demo local rates, so the demo
  store's readiness now blocks on Local rates alone (StoreDetail "1 thing to fix"; CommerceStores expects it, the walk's
  first feature finds the Terms page ready and its last the strip).
- Specs after the fixes: Mantle StoreShippingRates, StoreCheckout, StoreAdmin, CarrierServices, OrderToCashBasicFlow,
  WarehouseShipping, ShipmentLoads, StorePromotions, SitePages: 99 passed (21.1 s of feature time); BOSS CommerceAccess
  (12), CommerceCheckoutSettings, CommerceStores, CommerceSitePages, CommerceAssortment, CommercePromotions: 24 passed;
  acceptance CommerceCheckoutWalk (4), CommerceStoresWalk, CommerceFoundationWalk, CommerceSitePagesWalk: 18 passed. Not run:
  the whole mr-boss acceptance suite, `./moq test-apps`, lint (no screen changed).
- Commits: mr-mantle ca5b6c05; mr-boss this note's commit.
- For the lead: (1) F79 stands: placement from the order screens with a rated store and an unserved address places the
  order with no shipping charge (a warning); refusing it is a Mantle placement rule (Shop P5 or P8). (2) The same
  administrator mismatch likely exists in Customer Service and Purchasing (their app scopes widen on MANTLE_ACTIVE_ORG, their
  Mantle services keep to member organizations); Purchasing F185 records it as intended there. (3) The owner links' holder
  case is the system administrator (no Commerce user holds Warehouse or Accounting); `mayOpenScreen`'s group walk has no
  non-admin holder test. (4) `preview#StoreTax` passes any `productId` to the calculation (its tax category only).

### P7 — Promotions

Design §7 Promotions, PromotionDetail, PromoCodes and PromoCodeDetail (the shared definitions, crosscut §3.28);
COM-PROMO.

- **`mantle.product.StorePromotionServices`** (P; `COMMERCE_PROMOTION_EDIT`): `find#Promotions`, `store#Promotion`
  (a registered `ProductStorePromotion` service only; the browser never names a service),
  `store#PromotionParameters` (typed by the registration), `store#PromotionProducts`, `find#PromoCodes`,
  `store#PromoCode`, `generate#PromoCodes` (bounded count, prefix, collision preview, each code its own item),
  `store#PromoCodeParty`, `expire#PromoCode` (a redeemed code is expired, never deleted) and `find#PromotionUses`.
- **Limits at commit** (F18; §4): `check#OrderPromotionLimits` counts the placed uses of each promotion and code
  under a lock of the promotion's and code's rows, for every limit field (the code's per-code and per-customer limits
  and the promotion's `useLimitPerOrder`, `useLimitPerCustomer` and `useLimitPerPromotion`, the last two read for the
  first time), at Shop P5's freeze and at `place#Order` of any store order; a cart's preview consumes nothing. This is
  §2's one deliberate change to Mantle's default: an order whose promotions set no limit, and mr-marble's order screens
  with TEST1 and TEST2, are unchanged, each with its test. Mantle fixes: ProductStorePromoCode's `parties`
  relationship, and ProductStorePromotion's description naming `mantle.product.PromotionServices.apply#Promotion`.
- **Screens:** `Shared/Promotions`, `Shared/PromotionDetail`, `Shared/PromoCodes` and `Shared/PromoCodeDetail` with
  Commerce's context only, mounted at `Commerce/Promotions`; their crosscut §2 rows checked. Marketing's Promotions
  placeholder is left to Marketing (F24).
- **Specs:** Mantle `test/product/StorePromotions` (a service name not registered refused, the generate batch's
  collisions, two concurrent placements past a use limit: one refused, the promotion's per-customer and total limits,
  a limit-free store order placed as before); BOSS `CommercePromotions` (store scope,
  PromotionDetail's one qvt render).
- **Usable when:** a promotion manager makes a 10% code limited to one use per customer, generates 50 codes with a
  prefix, and the second placed order of the same customer with the code is refused the discount; an expired code stays
  readable in Usage.

**Built Nov 6 (P7).**
- Mantle:
  - `service/mantle/product/StorePromotionServices.xml` over one module `StorePromotions.js` (operations table):
    `find#Promotions` (the user's stores' promotions by description or id ignoring case, rule, code requirement and state,
    paged, each with its store, rule, dates, limits and placed uses), `get#Promotion` (with the rule's parameters typed by the
    registered service's in-parameters less apply#Promotion's: number, boolean, text, required, description; its products,
    code count and `canEdit`), `store#Promotion` (a registered `ProductStorePromotion` rule only, `SERVICE_NOT_REGISTERED`;
    the store and rule fixed once made; limits whole numbers of at least 1 or empty; stale revision; the reason into the audit
    log), `store#PromotionParameters` (a map of name to value, each typed, an unknown name refused, empty removes; answers the
    required ones missing), `store#PromotionProducts` (the store organization's or shared products, at most 200, include,
    exclude or remove), `find#PromoCodes`, `get#PromoCode`, `store#PromoCode` (2 to 40 letters, digits, - or _, unique
    ignoring case `CODE_TAKEN`, drawn when empty; its promotion fixed, its text once used `CODE_REDEEMED`),
    `generate#PromoCodes` (1 to 500, a prefix, random characters drawn again on a collision or numbered from a start with
    the taken ones listed; preview writes nothing; each code its own transaction through `lib.probe`, a failure named and
    the rest made; `PostingOperation` `PromoCodeBatch`, a retry answers the first result), `store#PromoCodeParty`,
    `expire#PromoCode` (never a delete; `ALREADY_EXPIRED`), `find#PromotionUses` (an order and code to a row: placed date,
    customer name only, uses, discount, status; totals), `find#PromotionOptions` (rules, promotions) and
    `check#OrderPromotionLimits`. Each maintenance service checks `COMMERCE_VIEW` / `COMMERCE_PROMOTION_EDIT` and the
    store's scope through StoreAdmin.js (`scope`, `storeOf`, `storeQuery`, `dateOf`, `rowDates`); a promotion of no store
    is refused like one outside the scope.
  - **Limits at placement (F18):** `check#OrderPromotionLimits` (authenticate false, not remote) takes the order's promotion
    items in the parts being placed (not yet placed, or the part asked for), reads the promotions and codes they use, and
    for those with a limit locks their rows (`for update`, promotions then codes, each in id order) and counts the placed uses
    again as `apply#OrderPromotions` counts them (`promoTimesUsed` of `OrderItemAndPartSummary` in the placed statuses, this
    order's other placed parts included): the code's per code and per customer, the promotion's per customer and in all,
    and per order per part (as Mantle applies it). `place#Order` calls it first, before the status changes, and refuses
    an order past a limit (`PROMOTION_LIMIT_REACHED`, each limit with what it allows, the uses and the order's); the caller
    reprices (`handle#OrderMajorChange` takes the discount off) and places again. An order of no store, with no promotion
    use or whose promotions and codes set no limit takes no lock and places as before; an order placed back (un-approve)
    consumes nothing new. With `lock: false` it is the cart's preview. Mantle's add-code and repricing checks are unchanged
    (warnings).
  - `entity/ProductStoreEntities.xml`: ProductStorePromoCode's `parties` relationship keyed on `promoCodeId` (the demo's
    nested TEST1 party loads through it); ProductStorePromotion's description names
    `mantle.product.PromotionServices.apply#Promotion`; `enable-audit-log` on the promotion's and code's dates and limits.
    `service/mantle/order/OrderServices.xml` place#Order: the one call above.
- BOSS:
  - `screen/Commerce/Promotions.xml` (the area: Promotions, the default, and Promotion codes; PromotionDetail and
    PromoCodeDetail hidden) mounting `screen/Shared/Promotions.xml` (PromotionFind, PromotionList with phone columns and the
    state chip, NewPromotion for a promotion manager), `Shared/PromotionDetail.xml` (record header with the state chip and
    More: Promotion codes; Promotion form with the limits and the reason; Rule values, each set in its row's dialog typed by
    the rule; Products with Add and Remove; Redemptions), `Shared/PromoCodes.xml` (CodeFind, CodeList, NewCode, GenerateCodes
    with its preview in the dialog and then the batch under an operation key) and `Shared/PromoCodeDetail.xml` (record header,
    More: Promotion, Expire the code; Code form; Customers through Commerce's customer check; Usage). Each reads
    `ironstone.commerce.ContextServices.get#SharedContext`, which refuses another app root (Commerce's context only), and
    calls the Mantle services; a promotion or code outside the scope shows Not available.
  - Commerce.js (appended): `linkPaths` for the four routes; the `customers` choice (Customer-role parties of the user's
    organizations or shared, each through `customerOf`). CommerceParts gains `promotionOptions`.
- Specs:
  - Mantle `test/product/StorePromotions` (6 features, 3.3 s): a rule not registered or forged refused, a zero limit, the
    reader and the other organization refused, typed parameters (a bad value, an unknown name, the missing required ones),
    a foreign product, a fixed rule, a stale revision, the reads by scope; codes taken ignoring case, a numbered batch with a
    taken code previewed and named, its retry, a random batch, a count over 500, the reader refused, an expired code still
    read with its reason in the audit log; an order with a limit-free promotion placed with no lock; the demo store's TEST2
    code added as the order screens add it and placed as before, the same customer's next cart refused the code by Mantle's
    warning; the promotion's per-customer and total limits refusing two placements, the preview naming the limit, the
    repriced order placed without the discount, the uses read back; two concurrent placements past a code's limit (real
    threads through `parallel`: the first holds its transaction 0.4 s, the second places 0.1 s in, waits for the lock and is
    refused). With the lock turned off in place#Order the last feature fails (the second places too), so it tests the lock.
  - BOSS `CommercePromotions` (2 features, 0.7 s): store scope (the manager's and reader's promotions of POPC_DEFAULT, none
    of BOSS_COM_DIGITAL; the same unchanged save allowed for the manager, `PERMISSION_DENIED` for the reader,
    `RECORD_UNAVAILABLE` for Services' manager, who is refused the promotion and its codes too; the customers choice with a
    selected customer) and PromotionDetail's one qvt render. No CommerceAccess case: the rule is the Mantle permission and
    scope, which StorePromotions checks.
  - Also run, all pass: Mantle StorePromotions, Promotions, OrderToCashBasicFlow, OrderBulk, OrderChanges, OrderLifecycle,
    OrderConfirmations, AssetReservationMultipleThreads, AssetReservationMisc, OrderToCashTime, ReturnToResponseBasicFlow,
    DropShip, Subscriptions, AccountingPortals, PassAuthority, StoreAdmin, StorePublication, RestApiTests, SalesReports
    (172 features); BOSS CommercePromotions, CommerceAccess, CommerceStores, CommerceAssortment, CustomerServiceOrders,
    CustomerServiceOrderChanges, CustomerServiceAccess, ProjectsAccess (54 features); mr-marble OrderRoleFilters and
    ProjectSummarySource (21) and its client BrowserSmoke (3: OrderDetail and PrintOrder of the flow orders). Not run:
    `./moq test-apps` and the budget measure.
- Acceptance: `test/acceptance/Commerce/CommercePromotionsWalk` (6 features: the manager's 10% promotion of POPC_DEFAULT
  through createPromotion, its three rule values and its order, a code limited to one use per customer; 50 codes with a
  prefix previewed in GenerateCodes and generated; one customer's two carts with the code, the first placed with 2.00 off
  one unit, the second refused `PROMOTION_LIMIT_REACHED`, repriced and placed without it, a third cart refused the code;
  the code expired and its PromoCodeDetail showing Ended with the order in Usage; the reader refused createPromotion and
  seeing PromotionDetail without its form, Services' manager Not available; the four screens in qvt and html), run: 6
  passed. Also run: AppStructure, TuiRender, CommerceFoundationWalk, CommerceStoresWalk and CommerceAssortmentWalk with it,
  43 passed. The whole mr-boss acceptance suite was not run.
- Lint: `moqui lint --screens` (release binary), 132 sites, none in the new screens.
- Inventories: ss-inventory's eleven EditPromotion, FindPromotion, EditPromoCode and FindPromoCode rows name their built
  forms, and the Commerce PromoCodeDetail path is `Commerce/Promotions/PromoCodeDetail` (design §2 changed); usl-inventory
  has no row the screens call (PromotionServices' services are Shop's and the order screens').
- Decisions:
  - A promotion past a limit at placement is refused, not repriced in place: the customer agreed to a total, and Shop's
    freeze must never charge more silently (design-shop §6); the caller reprices and places again.
  - The uses per order are counted per order part, as `apply#OrderPromotions` applies them, so a multi-part order places as
    before; the other limits count the order's other placed parts.
  - A promotion keeps its store and rule, a code its promotion and (once used) its text; codes are expired, never deleted;
    no delete service is built.
  - The routes are flat under the area: `Commerce/Promotions/Promotions` (the area's default) and
    `Commerce/Promotions/PromoCodeDetail` (design §2 had `Commerce/Promotions` and `PromoCodes/PromoCodeDetail`), so a
    shared list screen holds no subscreens.
  - Mantle's `store#PromoCodeParty` takes any active party that is not another user's private contact; Commerce limits
    the choice to its customers and checks the party with `check#Record` (customer) before the save.
- Findings (provisional):
  - **F66** F18 is partly wrong for the port: `apply#OrderPromotions` and `add#OrderPromoCode` do read the promotion's
    `useLimitPerCustomer` and `useLimitPerPromotion` (unlocked, as the code's limits). Design §7 corrected.
  - **F67** A promotion with no `sequenceNum` applies after the numbered ones (PostgreSQL orders nulls last), and with
    `itemsWithPromo` false the first promotion takes the units: the demo's PopcNewCustomer (99, no code) takes a new
    customer's units before an unnumbered code promotion of POPC_DEFAULT (the walk sets its promotion's order to 1).
    NewPromotion sets no order; for the lead: default a new promotion's order, or say it in the form.
  - **F68** Only `place#Order` counts the limits: a placed order that `handle#OrderMajorChange` reprices (an item added
    to a placed order) and an order set to OrderPlaced through `update#OrderStatus` directly are counted unlocked, as before.
  - **F69** An EntityFind is used up by `count()`: a second use of the same find (`lib.page(query, p, f, query.count())`)
    fails "entity find was already used"; the module builds the find twice. For the framework docs or a later fix.
  - **F70** Redemptions and Usage name the order without a link until P8 mounts Commerce's OrderDetail.

**Review Nov 5 (P7).** Checked: the diff of mr-mantle and mr-boss against the phase, §2 and §4; `check#OrderPromotionLimits`
and every caller of `place#Order` in mr-mantle, mr-boss, mr-marble and mr-pass (create#RecurringOrder(s), OrderBulk,
ReturnServices' replacement orders, DropShip, PurchaseOrders, PurchaseReturns, Awards, X12 import, the REST `place`, the
order screens, the demo services); the lock order; the no-store, no-promotion and no-limit paths (no `for update`, the
same placement); `useLimitPerOrder` per part (as `apply#OrderPromotions` passes it to the rule as `useLimit`); the
StorePromotions services' permission and scope, registered rules, typed parameters, generate's bounds and operation key,
expire not delete, store#PromoCodeParty; the four Shared screens (Commerce's context only); the audit log and reason.
- **R1 (high)** A multi-part store order whose parts share a promotion with a per-customer, total or per-code limit could
  never be placed: `apply#OrderPromotions` prices one part at a time and counted only placed parts, so each part took the
  use; `place#Order`'s recount refused the order and repricing gave the same discount again (shown by a scratch spec).
  `apply#OrderPromotions` now counts the uses of the order's other parts not yet placed (not cancelled or rejected) against
  those limits, so a repriced order places. StorePromotions gains the feature (two parts, one discounted, placed; 0.3 s);
  a single-part order prices as before (Promotions, OrderToCashBasicFlow). mr-mantle ce5f1079.
- **R2 (low)** The concurrency feature assumed the first thread takes the lock within 0.1 s; under load the second could,
  and the feature would fail though the lock held. It now asserts one placed and one refused, whichever came first (it
  still fails with no lock: both place). mr-mantle ce5f1079.
- Callers: a recurring order's clone copies product items only (no promotion items) and is placed without a lock;
  orders priced and placed in one transaction (X12 import, returns' replacements, DropShip, purchase orders, which have
  no store) are refused only when a concurrent placement takes the last use, and the X12 message's retry reprices. The
  refusal is right for a stale cart and for staff placing an old order (OrderDetail's message says to reprice).
- Lock order: within one placement, promotions then codes in id order, before update#OrderStatus' rows and the asset
  reservations; no other service locks a promotion or code row. A cycle needs one transaction placing several orders
  with different limited promotions (OrderBulk's up to 100 parts, a return's two replacement orders) against another;
  the database's deadlock detection would refuse one. Low.
- **F68** judged low: repricing a placed part (handle#OrderMajorChange) counts unlocked as Mantle always did and is
  staff-only; `update#OrderStatus` to OrderPlaced is reachable only from services (the REST `place` resource maps to
  place#Order; ProjectServices' approve#MilestoneApproval places a project's open or proposed sales orders this way, a
  staff action, unchecked; it could call place#Order instead).
- Specs run: Mantle StorePromotions (7 features; three runs, all pass), Promotions, OrderToCashBasicFlow, OrderBulk,
  OrderChanges, Subscriptions, RestApiTests, OrderLifecycle, DropShip (118 features, pass); BOSS CommercePromotions and
  CommerceAccess (11, pass); mr-marble OrderRoleFilters (20) and client BrowserSmoke (3), pass.
- For the lead:
  - OrderBulk places its parts in one transaction, so one order past a limit now rolls back the whole bulk change (as
    any placement error did before); a per-part transaction with the refused orders listed would follow AGENTS.md's
    failure tolerance.
  - generate#PromoCodes writes its PostingOperation after the codes, each made in its own transaction: two concurrent
    submissions of one key both make a batch (the second then fails on the key), and a batch interrupted before the end
    is made again in full on retry. Claiming the key first (a pending row) would need an EntityLib change.
  - Decision 5: Mantle's store#PromoCodeParty accepts any active party not another user's private contact, and
    get#PromoCode names the code's parties; both are `allow-remote="false"` and Commerce checks the customer first, but a
    later caller (Shop, Marketing) must check the party itself.
  - The TEST2 feature's discount assertion depends on how many TEST2 uses the database already holds (its code allows 5
    in all); its placement assertion is the one that always tests the unchanged default.

- **Wave 9 suites (Nov 6, on master after Shop P5 and the framework's session decline merged; Shop P6's worker ran at
  the same time):** standalone mr-mantle 1,825 passed, 2 failed (the baseline), 11 skipped; `./moq test-apps` 3,204
  server features passed and 1 failed (AccountingPayables' portal demo compared ORG_ZIZI_RETAIL's links exactly, and a
  full run issues one more acknowledgement link; it now checks each demo link is there), 17 client features passed;
  `moqui lint --screens` clean. Feature time: server mr-mantle 357.2 of 370 s, mr-boss 246.8 of 264 s, mr-pass 18.2 of
  17 s; client mr-boss 52.9 of 57 s, mr-pass 8.2 of 6 s (ShopCheckoutWalk 3.9 s). mr-pass's budgets raised by Shop's
  share to 20 s and 9 s (the user's agreement, §4).
- **Wave 10 suites (Nov 6, on master after Shop P6 merged, nothing else running):** standalone mr-mantle 1,840 passed,
  2 failed (the baseline), 11 skipped; `./moq test-apps` 3,223 server and 17 client features passed; `moqui lint --screens`
  as before. Feature time: server mr-mantle 369.8 of 370 s, mr-boss 248.2 of 264 s, mr-pass 18.1 of 20 s; client mr-boss
  53.3 of 57 s, mr-pass 8.1 of 9 s. mr-mantle's budget raised by Shop P5–P6's share (12.6 s) to 383 s (§4).

### P8 — Orders, carts and customers

Design §6 Orders, Carts, CartDetail (without recovery), Returns, Customers and Requests, and §10's order, return,
customer and request rows; COM-OPS, CX-ASSIST and the Comms hooks (design §1.4).

- **`mantle.order.StoreOperationsServices`** (O; `COMMERCE_ORDER_VIEW`): `find#StoreOrders` (submitted orders by default,
  leaving out OrderOpen, and RecurringTemplate bases once Shop P7 marks them; payment state computed, the `OhtPayment`
  hold filter, cancellation-proposal badges), `find#StoreCarts` and `get#StoreCart` (OrderOpen web orders with Shop P4's
  activity, an abandoned cart one inactive past the store's delay with no live checkout), `find#StoreReturns`
  (ReturnHeaders by their source order lines' store), `find#StoreCustomers` (customers with a permitted store order or
  cart, never a party directory) and `find#StoreRequests` (cases by `Request.productStoreId`, which Customer Service's
  `contactCase` sets from the order's store under the owner contract of Shop P6, F37, or linked to the store's orders
  or products or in its queue), and `get#StoreWorkSummary` for Home's cards.
- **Contexts** (§10):
  - Shared/OrderDetail's Commerce branch: the store's orders, the `OhtPayment` banner read only with Accounting's
    link, cancellation proposals linking Customer Service's OrderChangeDetail, and Order again through `clone#Order`
    with `copyPayment=false` into a new open order, then repriced, since the clone keeps each item's `unitAmount` (F43);
  - Shared/Customer360's Commerce branch: store relationships, the PASS account's state (verified email, self access),
    addresses and masked methods, carts, orders, subscriptions, cases and returns;
  - Shared/ReturnDetail's and RequestDetail's Commerce branches, read only (an internal note on a case), Open in
    Customer Service.
- **Shell:** stores', orders' and carts' palette types; `get#RecordLink` opens a store order or cart under Commerce for
  a Commerce user whom Customer Service's branch does not take (F8): that branch returns even when its link is null, so
  it is changed to fall through on null, with Customer Service's palette cases unchanged (F42); `call-context` with the
  caller's open store orders and carts and `record-lookup` for store orders (L8); the Assist prompts of design §1.4 and
  the store-readiness, cart-recovery and channel-retry procedure skills in `skill/` with `skill/aliases.json` and
  `test/skill-retrieval.json`.
- **Screens:** Orders (OrderFind, Orders); OrderDetail; Carts (CartFind, Carts); CartDetail (CartSummary,
  RecoveryHistory empty until P10); Returns (ReturnFind, Returns); ReturnDetail; Customers (CustomerFind, Customers);
  Customer360; Requests (RequestFind, Requests); RequestDetail; Home's RecentOrders and work cards.
- **Specs:** Mantle `test/order/StoreOperations` (carts and bases left out, the store filter of returns and requests, a
  customer list that is no directory); BOSS `CommerceOrders` (scope, the hold read only, OrderDetail's and CartDetail's
  one qvt render).
- **Usable when** (design §12.2 scenario 7's physical and digital half, 13, and 14's hold half, with Shop P5 and P6;
  the subscription and refund halves are P12's):
  - the physical, digital and mixed orders placed in Shop show in Orders with their payment and fulfillment state, and
    the same orders in Warehouse and Accounting;
  - a Shop customer's question, return request and cancel request show in Requests, Returns and the order's badge, each
    opening Customer Service, and Commerce takes none of their actions;
  - a capture failed after placement shows the `OhtPayment` hold, which a Commerce operator cannot release;
  - Order again on a past order makes a new open order at today's prices.

**Built Nov 6 (P8).**
- Mantle:
  - `service/mantle/order/StoreOperationsServices.xml` over one module `StoreOperations.js` (O): `find#StoreOrders`
    (submitted orders of the user's stores or one, never OrderOpen; by number, name or external reference, customer,
    status, placed dates; an Attention filter `paymentHold`, `hold`, `cancelRequest`, `notice` and `stuck`; a payment
    filter over the computed state, at most 500 candidates, `truncated` says so), each row with its store, channel,
    customer, placed date, status, total, computed payment state (held when an OhtPayment hold is open; paid by its
    invoices or captured payments; authorized; promised; no charge; unpaid), fulfillment state (shipments and the digital
    lines' StoreItemFulfillment: "Downloads ready", "held", "revoked", "pending") and badges (holds, the Payment hold,
    a cancellation proposal); `get#StoreOrder` (OrderDetail's Commerce branch: header, open holds, items, payments,
    shipments, invoices, open order changes, cases, returns, the order's notices on the delivery ledger with the address
    masked, its Shop checkout; an open order refused, it is a cart); `reorder#StoreOrder` (Order again, F43:
    `clone#Order` with `copyPayment` false and product items only, each part back to OrderOpen, promotion lines dropped,
    `recalc#OrderPartItemAmounts` then `handle#OrderMajorChange`; nothing placed or charged); `find#StoreCarts` and
    `get#StoreCart` (OrderOpen store orders by the shopper's activity, StoreCartAccess.lastActivityDate; states active,
    abandoned, checking out, placement waiting, made by staff; a guest shows "Guest"; recovery empty until P10);
    `find#StoreReturns` and `get#StoreReturn` (ReturnHeaders by their lines' source orders' store, Requested first; read
    only); `find#StoreCustomers` and `get#StoreCustomer` (parties with an order or a signed-in cart in the user's stores,
    never a directory; the PASS account's state as ExternalAccess.selfOf reads it, current addresses, payment methods as
    type and last four, orders, carts, cases, returns; subscriptions empty until P12); `find#StoreRequests`,
    `get#StoreRequest` and `add#StoreRequestNote` (cases, a CaseProfile, by `Request.productStoreId`, linked to a store
    order by RequestRecord, or in a store's checkout support queue; open by default; the conversation; an internal note
    through `add#RequestComment`); `find#StoreDeliveries` (the store's delivery-ledger notices, exceptions by default,
    read only, F91); `get#StoreWorkSummary` (Home: to approve, payment holds, to fulfill, unpaid, open carts, stuck
    placements, notice exceptions, each count failing alone; the recent orders for an order reader); `get#StoreCallRecords`
    (the call context's open store orders and carts of given parties). Each checks COMMERCE_VIEW, COMMERCE_ORDER_VIEW for
    the order, cart, return, customer and case reads, and StoreAdmin.js's scope (F51: a store-limited member is refused
    another store of the same organization in every one); a missing record and one outside it are RECORD_UNAVAILABLE.
  - `entity/StoreOperationsViewEntities.xml`: `mantle.order.return.StoreReturnItemView` (a return's lines with their source
    order's store) and `mantle.request.StoreRequestOrderView` (a request linked to an order, with its store), so the store's
    returns and cases are found in the query. No Mantle rule changed, so no default to test.
- BOSS:
  - Areas: `screen/Commerce/Orders.xml` (Orders, the default; Carts; Returns; OrderDetail, CartDetail and ReturnDetail
    hidden) and `screen/Commerce/Customers.xml` (Customers, the default; Requests; Customer360 and RequestDetail hidden);
    `Orders/Orders.xml` (OrderFind with Attention and Payment, the list with badges; a stuck placement opens CartDetail),
    `Orders/Carts.xml`, `Orders/CartDetail.xml` (CartSummary, the checkout box with a stuck placement's banner, an empty
    RecoveryHistory), `Orders/Returns.xml`, `Customers/Customers.xml`, `Customers/Requests.xml`.
  - Shared screens' Commerce branches (each reading the Mantle service and `get#OperationLinks`): `template/CommerceOrderDetail.xml`
    (the Payment hold banner read only with Accounting's order, other holds, cancellation proposals linking Customer
    Service's OrderChangeDetail, the cards, items, payments, shipments, invoices, cases, returns and notices; Order again
    through `commerceReorder`, which opens the new cart), `CommerceReturnDetail.xml` (read only, Open in Customer Service and
    in Accounting), `CommerceCustomer360.xml` (one page, no tabs; the Accounting tabs' prompts and actions now leave Commerce
    out), `CommerceRequestDetail.xml` (read only, Internal note, Open in Customer Service); Shared/OrderDetail,
    ReturnDetail, Customer360 and RequestDetail include them.
  - Commerce.js (appended but the palette's `recordEntity`, now per find): the order, cart and customer record kinds' screens;
    the palette's store orders and carts (`searchFinds`); the ten `linkPaths`; `operationLinks` (Customer Service's
    CaseDetail, OrderChangeDetail, OrderDetail, ReturnDetail and Customer360, Accounting's OrderDetail and ReturnDetail, each
    for a user who may open it); `callContext`. ContextServices: `get#OperationLinks`, `get#CallContext`.
  - `PaletteServices.get#RecordLink` (F8, F42): Customer Service's sales-order branch returns only with a link, so a store
    order or cart opens OrderDetail or CartDetail under Commerce for a user who works its store; Customer Service's users
    keep their link.
  - The root: `call-context` (`boss.commerce`), the Assist prompts of design §1.4 for StoreDetail, CartDetail and OrderDetail,
    keys g o, g c, g u. Home: WorkCards from `get#StoreWorkSummary` (a dash for a count that failed; each opening the scoped
    list for an order reader), Placements waiting and Notices not delivered added, Reviews and Integration errors still Not
    configured (P9, P13), RecentOrders. F70: PromotionDetail's Redemptions and PromoCodeDetail's Usage link the order for a
    user of the Orders area.
  - `skill/store-readiness.md` and `skill/cart-recovery.md`, `skill/aliases.json` (cart, store), `test/skill-retrieval.json`
    (+4 cases; recall@3 1.00, 10 of 10).
- mr-pass: `test/acceptance/ShopOrdersInCommerce.spec.js` and its README line (below).
- Specs:
  - Mantle `test/order/StoreOperations` (3 features, 1.1 s alone, 1.6 s under load): orders leave out carts, carry the Payment hold and the cancel
    request, list a stuck placement (ORDER_CHANGED), keep to the scope (the reader PERMISSION_DENIED, the other
    organization's operator, the store-limited member refused the second store, F51), the work counts; carts abandoned and
    stuck, returns and cases by their orders' store (a case of no store left out), an internal note, customers no directory
    (a Customer-role party of the organization with no order refused); Order again open at today's price (10, the clone kept
    20) with no payment, another organization's and a cart refused.
  - BOSS `test/Commerce/CommerceOrders` (2 features, 0.6 s): the demo store's held order (the operator reads the hold,
    `release#OrderHold` refused PAYMENT_HOLD_RELEASE; the reader refused; another organization's order RECORD_UNAVAILABLE);
    `get#RecordLink` under Commerce for the operator, under Customer Service for its order desk, none for the other
    organization; the palette's order and cart; OrderDetail's Commerce branch and CartDetail each rendered once (qvt). No
    CommerceAccess case: the rule is Mantle's permission and scope.
  - Also run, all pass: Mantle StoreOperations; BOSS CommerceOrders, CommercePromotions, CommerceAccess, CommerceStores,
    CommerceCheckoutSettings and the specs reading the shared screens, the palette and the shell (Accounting*, Chat, Chatter,
    ClientBilling, CommonsSettings, CommsHome, CustomerService* (9), Manufacturing* (4), Notifications, ProductsAccess,
    ProjectRequests, ProjectsAccess, Purchasing* (4), QuickCreate, Requests, TodayPanel, Warehouse* (4),
    AppOrganizationFilters): 338 features, 71.8 s; `moqui test mr-boss --skills`. Not run: `./moq test-apps` and the budget.
- Acceptance: mr-pass `test/acceptance/ShopOrdersInCommerce` (5 features, dependsOn ShopFixtures and ShopOrderScenarios; every
  feature ignored without mr-boss, so PASS stands alone): physical and digital-only Shop orders placed through a page's
  calls and approved, with ShopOrderScenarios' mixed order, in Orders with their payment and fulfillment (the digital
  "Downloads ready", the mixed "Shipped · Downloads revoked" after that spec's refund) and in Warehouse's and Accounting's
  OrderDetail; the question in Requests, the return in Returns (Requested), the cancel request's badge, the owners' links for
  a user who opens Customer Service and none for the operator, RequestDetail and ReturnDetail read only, the operator
  refused `authorize#Return`; a capture declined after placement (ZIZI_SHOP_CAPFAIL) held, listed and shown, the operator
  refused the release; Order again posted from OrderDetail, the new open order at `get#ProductPrice`'s price with no payment,
  CartDetail "Made by staff"; Home, Orders, Carts, Returns, Customers, Requests and Customer360 in qvt and Orders in html.
  `./moq accept mr-pass --spec ShopOrdersInCommerce`, run: 12 features (with its two fixtures), 12 passed; then
  `./moq accept mr-pass` once: server suite 32 features, 29 passed, 3 ignored (as before), 0 failed; client suite 41 of 41.
- Lint: `moqui lint --screens` (release binary), 132 sites as before, none in the new screens or templates.
- Inventories: usl-inventory's clone#Order names Commerce/Orders/OrderDetail's Order again; the Designed-in paths
  `Commerce/Orders/Carts/CartDetail`, `Orders/Returns/ReturnDetail` and `Customers/Requests/RequestDetail` became the flat
  built paths (design §2 changed). ss-inventory has no Commerce order row. The other usl rows naming Commerce/Orders/OrderDetail
  (place, approve, hold, release, cancel, the item mutators) stay unimplemented in Commerce: its OrderDetail is read only and
  those actions are the owners' screens' (design §10).
- Decisions (design §16 row "Orders, carts and customers as built"):
  - The detail screens are flat under their areas, as P7's.
  - A stuck Shop placement is an open order with its payment kept: it is listed by Orders' Attention filter and opens
    CartDetail, never OrderDetail; Commerce shows it read only.
  - A cart is abandoned an hour after its last shopper activity with no live checkout until P10's RecoveryPolicy sets the
    store's delay; a staff-made cart has no shopper activity and is never abandoned.
  - A case is the store's by its store, a link to a store order or the store's support queue; a product link alone is not
    (a product belongs to no one store), so design §6's "or products" is left out.
  - Order again needs COMMERCE_ORDER_VIEW (the subscription operator's too) and makes an open order only; whoever places it
    places it through the order's owner.
  - Customer360 in Commerce is one page, not tabs; its Accounting tabs stay Accounting's.
  - The P8 acceptance lives in mr-pass beside the Shop scenarios it reads (F106), not in `test/acceptance/Commerce/`.
  - Routed items: F8, F42, F43, F51 and F70 done as above. impl-shop F85: stuck placements listed (Orders' Attention, Home's
    Placements waiting, CartDetail's banner) and the OhtPayment hold shown read only. F91: a store-scoped review, read only
    (`find#StoreDeliveries`, OrderDetail's Notices, Orders' "Notice not delivered", Home's count); resolving stays
    `resolve#Delivery`'s MESSAGE_DELIVERY_REVIEW, which no Commerce group gets until Comms scopes it by store (F109).
    F86: no store default for digital-only orders here (F110).
- Findings (provisional):
  - **F106** `dependsOn` does not order a run: the named specs are added, but the run keeps component load order and then
    file names, so a spec named before its dependency runs first (mr-boss's specs run before mr-pass's, and in mr-pass
    `CommerceOrderScenarios` ran before ShopFixtures). The walk was renamed to sort after ShopOrderScenarios. For the
    framework: run a spec's dependsOn first, as the help says.
  - **F107** No Accounting screen releases a Payment hold: `release#OrderHold` with PAYMENT_HOLD_RELEASE is reachable only as a
    service (ShopPaymentScenarios calls it); Commerce links Accounting's OrderDetail, which shows no release. For Accounting.
  - **F108** A stuck placement has no resolution screen anywhere: its payment is kept and the order open, and nothing
    places it again or refunds it but the services. For Accounting and Shop (impl-shop F85's remainder).
  - **F109** F91: `resolve#Delivery` stays unscoped; a store-scoped resolve (or Comms' review screen) is needed before a
    Commerce group may resolve its notices.
  - **F110** F86 left for Sales: a store already turns PsstOrdApproveNewCust and PsstOrdApproveAddrMissing off in
    StoreDetail's approval checks; a default that skips them only for an all-digital order would be a new
    `check#OrderPreApprove` condition with its default test, Sales' approval policy rather than Commerce's. The acceptance
    approves the demo store's Shop orders by hand, as ShopOrderScenarios does.
  - **F111** Not built from the phase text: the "Log as note" response-action (no Commerce screen takes a note on an order or
    cart; a case takes one in RequestDetail), the IntegrationDetail and Product360 prompts (P13, P9) and the channel-retry
    skill (P13, no IntegrationDetail yet).
  - **F112** RecurringTemplate bases are not left out of Orders yet: `orderPurposeEnumId` does not exist until Shop P7 marks
    them; `find#StoreOrders` is where the condition goes.
  - **F113** StoreOperations scopes an order by its store alone (the store's organization), while Commerce.js's
    `check#Record` of an order also needs each part's vendor to be one of the user's organizations: a store order vended by
    another organization would be listed and then refused by the record check (and its record link). None exists in the
    demo; for the lead, whether Mantle should check the vendor too. *Review: yes, done (R2).*

**Review Nov 6 (P8).**
- Checked: `git diff $(git merge-base master com/p8)..com/p8` in mr-mantle, mr-boss and mr-pass against this section,
  §2, design §6 and §10. Each of the 15 StoreOperations operations takes StoreAdmin.js' scope (COMMERCE_VIEW, the user's
  organizations, the StoreStaff limit, F51) and all but `get#StoreWorkSummary` COMMERCE_ORDER_VIEW; a store given by the
  browser goes through `storeOf`; a forged id in `get#StoreOrder`/`get#StoreCart` (an open order as an order and back),
  `get#StoreReturn` (every source order in scope), `get#StoreRequest` and `add#StoreRequestNote` (the case checked on itself:
  its store, a store-order link or a store's queue), `get#StoreCustomer` and `reorder#StoreOrder` is RECORD_UNAVAILABLE;
  `get#StoreCallRecords` keeps to the user's stores whatever parties it is given. The Shared mounts' Commerce branches call
  only these services (no `check#Record` in front, so Mantle is the only gate there). `find#StoreCustomers` reads only
  the customers of the stores' orders and signed-in carts; Customer360 shows methods as type and last four, no password,
  impersonation or gateway data. The Payment hold is shown read only: no Commerce transition releases it and
  `release#OrderHold` refuses the operator. The internal note is a Comment (SupportPortal leaves Comments out of the
  customer's view). `find#StoreDeliveries` is scoped and read only (no screen uses it yet). F42: Customer Service's branch
  keeps its link and falls through only on null; no later branch of `get#RecordLink` takes a sales order. The mr-pass
  acceptance needs mr-boss lazily and ignores every feature without it.
- **R1 (medium)** `reorder#StoreOrder` had no operation identity: a double submit of Order again made two open orders.
  It now takes an `operationKey` (PostingOperation, type StoreReorder; a retry answers the first new order with
  `alreadyApplied`) and the order's `orderRevision` as OrderDetail showed it (stale: STALE_REVISION naming the current);
  the form sends both. A line cancelled in full is no longer ordered again, a part-cancelled one carries what was kept.
- **R2 (medium, F113)** Mantle now also requires the vendor: an order of the user's stores with a part vended by an
  organization not theirs is left out of every list, count, customer, return, case and call context and refused as a
  record, as Commerce.js' record check and Customer Service's order scope do (the shared mounts have no record check in
  front of Mantle, so without it such an order opened in OrderDetail). StoreOperations gains the case (an order of store A
  vended by organization B).
- **R3 (low)** The palette searched store orders and carts, with their customers' names, for every Commerce user, and
  `get#RecordLink` linked them for a user without COMMERCE_ORDER_VIEW. The order, cart and customer kinds now carry the
  `orderView` capability, checked in the search and the link; CommerceOrders checks the reader finds none.
- Specs after the fixes: Mantle StoreOperations 3 of 3 (1.4 s of feature time); BOSS CommerceOrders, CommerceAccess,
  CommercePromotions, CustomerServiceAccess, CustomerServiceOrders, CustomerServiceReturns, AccountingAccess,
  AccountingReceivables, Chat, Requests, ProjectRequests, WarehouseReturns, PurchasingReturns, PurchasingRequests,
  PurchasingOrders, ManufacturingWorkOrders, QuickCreate, TodayPanel: 160 of 160; acceptance mr-pass ShopOrdersInCommerce
  (with ShopFixtures, ShopOrderScenarios) 12 of 12. Lint: 132 sites as before, none in Commerce. Not run: `./moq test-apps`.
- For the lead: (1) `heldOrderIds` and `cancelRequestOrderIds` take the first 500 open holds or cancel requests of every
  store before the store filter, so with many in other stores the Attention filters and Home's Payment holds count could
  miss some; a view entity joining the order's store would fix it. (2) Customer360 shows the customer's current emails
  and full addresses to a store operator, as Customer Service does; design §10 says only the methods are masked. (3) Order
  again needs only COMMERCE_ORDER_VIEW (the worker's decision), so a read-only operator can make open orders. (4) A queue
  set as a store's checkout support queue brings every case of that queue into the store, including cases not about it.

### P9 — Reviews

Design §4 Reviews, design-shop §5 ProductDetail's PublicReviews and SubmitReview; COM-MERCH's review part, SHOP-SUPPORT.

- **ProductReview** (F19): the purchase proof (order and item) on the review, the store's reply with its author and
  time, both audit-logged with the status; the transition Approved to Pending for an author's edit. A decision is a
  status change with its reason in the audit log (§4); no decision record.
- **Mantle services:** `StoreMerchandisingServices` `find#Reviews`, and with `COMMERCE_MERCHANDISE` `moderate#Review`
  (per item, with the expected revision; the decision covers the review's images), `reply#Review` and its withdrawal;
  Shop's `ShopCatalogServices.submit#Review` (proof from the actor's own qualifying order item, the author's display
  choice, up to a few images, pending), `get#Reviews` (approved only, no private author fields, images only of an
  approved review) and the approved aggregates.
- **Review images** (§4, F41): staged through `mantle.party.PortalMedia.js` (PNG or JPEG, 10 MB, scanned, PDF not
  offered for a review), kept as the review's content under the store, served by digest only once the review is
  approved; a scan failure refuses the image and keeps the text; an author's edit that changes the images returns the
  review to pending.
- **The review request** (`PsetReviewRequest`): sent after delivery or download through Comms' delivery ledger (Shop
  P6), consent-checked, once per order item.
- **Shop pages** (mr-pass): ProductDetail's PublicReviews and SubmitReview with its image upload, and the
  `getProductReviews` and `submitProductReview` operations, local and remote (the images through the facade's media
  staging, as Support's attachments are).
- **Screens:** Reviews (ReviewFind, Reviews, ReviewDecision with the images, Reply); Product360's review link.
- **Specs:** Mantle `test/product/StoreReviews` (no proof refused, an edit back to pending, aggregates of approved only,
  an image of a pending review not served, an unscanned or wrong-type image refused, the request sent once); BOSS
  `CommerceReviews` (a bulk decision with a result per review); mr-pass `ShopReviews`.
- **Usable when** (design §12.2 scenario 10; design-shop §18.1 "Reviews and support", its review half): a buyer
  reviews a delivered item with a photo; the merchandiser approves it and replies; the public page shows the reply and
  the photo and no private identity; the buyer's edit returns it to pending and out of the average; deciding another
  review leaves this one alone.

**Built Nov 6 (P9)** (branch `com/p9`).
- Mantle:
  - Records (`entity/StoreReviewEntities.xml`, F19, F41): ProductReview extended with the purchase proof (`orderId`,
    `orderItemSeqId`), the author's public label (`displayName`) and the store's reply (`replyText`, `replyUserId`,
    `replyDate`), the proof and reply audit-logged with the status, an index by store, product and status; the status
    transition PrvwApproved to PrvwPending ("Review Edited"); `mantle.product.ProductReviewImage` (review, sequence, digest
    with a unique index, location, name, type, size). `data/StoreReviewsSetupData.xml`: the ledger source
    `MdsrcReviewRequest`. The demo's two reviews renamed DEMO_REVIEW_1 and _2 (F94).
  - `service/mantle/product/StoreReviews.js` behind `StoreMerchandisingServices` `find#Reviews`, `get#Review`,
    `get#ReviewImage` (staff, any state) with COMMERCE_VIEW, `moderate#Review` (approve or delete; `reviews`, the list rows'
    `selectionKeys` (productReviewId@revision) or one review, each at its expected revision in its own transaction through
    the internal `decide#Review`, a result per review; a delete needs its reason, which goes to the status's audit log) and
    `reply#Review` (an approved review's plain-text reply at its revision, or `withdraw`) with COMMERCE_MERCHANDISE, all in
    the store scope (StoreAdmin.js); `queue#ReviewRequests` and `build#ReviewRequest`; and `ShopCatalogServices` `get#Reviews`
    (getProductReviews), `submit#Review` (submitProductReview) and `get#ReviewImage` (getShopReviewImage). Every decision,
    reply and edit of an approved review advances the store's site generations. ShopCatalog.js' product view carries
    `product.reviews` (the first five, the summary, the visitor's own review's state and the write link), appended to
    ThemeView.js' product shape.
  - The proof: a signed-in account with its email verified (the self relationship, after Shop P6's claim of its email's
    guest purchases), and its own order line of the product or of a variant of it: an order of the store whose parts are all
    the account's (ShopCustomer.js `ownOrder`), approved, sent or completed, the line not cancelled, delivered (its shipment
    delivered, the order completed, or a current download grant). One review per account, store and product; a second is
    ALREADY_REVIEWED; an edit at the expected revision returns an approved review to pending. Photos: PNG or JPEG only, one a
    call, up to three, staged and scanned through PortalMedia.js and kept under the content root
    (`productReview/{store}/{review}/{seq}`); one refused (type, size, no scanner, scan) is named in `imageRefused` and the
    text kept.
  - The request (`service/StoreReviews.secas.xml`): ShipmentDeliveredRequestReviews (a shipment to ShipDelivered) and
    DownloadFirstRequestReview (a grant's first download) call `queue#ReviewRequests`, which queues one delivery per line
    (`reviewRequest:{order}:{line}`) only for a Shop order (a completed StoreCheckout) of a store with a current
    PsetReviewRequest email; not transactional, with PcpMarketingEmail as its consent (F95; since the follow-up below, the
    store's review requests topic); the build suppresses it once
    the buyer reviewed the product, the line was cancelled or returned, or the product is no longer public.
  - Shop's operations in Schema/Routes and their Mantle mirrors (identical), `Contracts.d.ts` and PassAuthority's DOWNLOADS:
    `getProductReviews` (GET), `submitProductReview` (POST, its `file`), `getShopReviewImage` (a GET download). None is a
    token write.
- mr-pass: `screen/Shop/Review.xml` with `Shop/ShopReviews.js` (Review?productId=: the approved reviews a page at a time and,
  for the buyer, SubmitReview with up to three photos posted one a call at the review's new revision, or the change of
  their own); `Shop.xml`'s media route serves a review image by `reviewImage`; ProductDetail's PublicReviews in the PASS shell
  (`Catalog.html.fancy`) and in the starter theme's `product-main` section; ShopAccount.js exports its page helpers.
- BOSS: `Commerce/Merchandising/Reviews.xml` (ReviewFind; Reviews with the bulk decision on selected rows, ReviewDecision with
  the text and photos, Reply and Withdraw reply), `linkPaths` "Merchandising/Reviews", Products' Commerce paths and
  Shared/Product360's Reviews link under Commerce.
- Specs (all `--nobuild`): Mantle `test/product/StoreReviews` (4 features, 0.9 s: no proof and a visitor refused, a PDF and an
  unscanned PNG refused with the text kept, a second review refused; only approved public and in the summary, a pending
  review's image not served and the approved one's served, the reader refused a decision, a stale decision named, the reply
  and the author's label without the account; the edit back to pending, out of the average, its image no longer served, a
  stale edit refused; the request queued once by the delivered shipment's SECA, suppressed without consent, its build's
  review link, suppressed once reviewed, an order Shop did not place queuing none); mr-pass `test/Shop/ShopReviews` (2
  features, 0.2 s: a scanned photo kept, local and remote reads alike, the photo served by digest only once approved, the
  product page's one shell render with the review, reply and photo and no account; the Review page's one render with the
  change form; the routes); BOSS `CommerceReviews` (2 features, 0.1 s: a bulk decision with a result per review, approved,
  stale and another organization's store's; Reviews' one qvt render). Also run, all pass: Mantle ShopCatalog,
  StoreFulfillment, DeliveryLedger, ShopCustomer, StorePublication, ThemeAuthoring, ThemeReleases, PassAuthority; mr-pass
  Transport, ShopAccess, ShopCatalog, ShopAccount, ShopThemes, ShopPreview, ShopCart; mr-boss CommerceAccess,
  CommerceAssortment, ProductsAccess. Not run: `./moq test-apps` (the brief: no whole suites).
- Acceptance: `test/acceptance/Commerce/CommerceReviewsScenario` (mr-boss, 3 features: the usable-when on POPC_DEFAULT's
  DEMO_1_1 through a spec site, the Shop operations and the Reviews transitions as commerce.merchandiser, with the reader
  refused), run once: 3 passed.
- Lint: `moqui lint --screens` 132 flagged sites as before, none in Reviews, Review or ShopReviews.
- Inventories: no ss-inventory or usl-inventory row (SimpleScreens has no review screen, mantle-usl no review service).
- Decisions: a review is one per account, store and product, its proof found from the account's own delivered line and kept
  through edits; the author's label is chosen and stored at submission ("A customer" otherwise, and for the demo's reviews);
  an image's digest is the sha-256 of the review, its sequence and the file's base64, so the same photo twice has two
  addresses; staff see a pending review's photos through Reviews' own transition; the proof refusals (PURCHASE_REQUIRED,
  VERIFY_REQUIRED) are Unprocessable so a page shows their text; an edit keeps the store's reply, shown again on
  re-approval (F98); SubmitReview is a PASS-shell page, not a theme component (a theme has no form).
- Findings (provisional):
  - **F94** The demo's ProductReview rows used ids 100001 and 100002, which the sequence hands out next, so the second
    review made on a demo database failed on its key; renamed DEMO_REVIEW_1 and _2.
  - **F95** The review request is a solicitation, so the ledger sends it only with a granted PcpMarketingEmail, which
    Shop never collects (no checkout opt-in, §4): on the demo no request goes out. For the lead: a store "review requests"
    topic on Email preferences as cart reminders have, or treat it as transactional with the preferences link it carries.
  - **F96** PASS's facade and transports take one `file` an operation, so up to three photos are three calls; and a
    FileItem in a service's parameter map loses its methods in process, so the specs add a photo through StoreReviews.js
    as the service does.
  - **F97** The request is queued at delivery or first download and sent within the job's two minutes; the ledger's
    `queue#Delivery` has no not-before date, so a store's "days after delivery" waits for one.
  - **F98** An author's edit keeps the store's reply, which shows again under the new text when it is re-approved; the
    merchandiser may withdraw it first.
  - **F99** Reviews reach a theme as `product.reviews`; the starter's product section renders them, but a release
    published before P9 (from the old starter) shows none until republished.
  - **F100** For a signed-in visitor, each product page view reads their qualifying lines to offer the write link (up to
    200 orders); a session cache would spare it. (Review R1: the lines of the product are read first, in one query.)

**Review Nov 6 (P9).** Checked `git diff master...com/p9` in mr-mantle, mr-pass and mr-boss against this section, design
§4 Reviews, design-shop §5 and §2. The proof is found from the session's account only (selfParty, OrderPart customer and
vendor, ShopCustomer `ownOrder`); no party, order or line id is taken from the request, and an edit needs the account's own
review at its revision. Public reads carry approved reviews only, the stored label, the reply's text and date (no reply
user), `verifiedPurchase` and image URLs by digest; `get#ReviewImage` rechecks the review's status (Approved only, so an
image cached from before an edit or a delete is refused), its store against the routed store and its product's
publication; the media route is no-store; the remote read cache keeps only anonymous answers, keyed by the generation that
every decision, reply and edit of an approved review advances. Images: PNG or JPEG before staging, PortalMedia's size,
sniff and scan, a refusal named with the text kept, staging removed on every path. Staff: every service through
`stores.scope` and `reviewOf` (another organization's store and a forged id refused alike), decisions each in its own
transaction with a result per review. The SECAs are tx-commit rules, which the framework runs after the commit in a
transaction of their own, so a failure cannot undo a delivery or a download; one line's failure is logged and the rest go
on. Mantle defaults: the new fields are nullable, the one new transition only widens the flow; no other ProductReview
caller in Mantle, BOSS, PASS or Marble; no reference to the old demo ids. Schema/Routes mirrors identical.
- **R1** (minor, F100) `qualifyingItems` reads the account's lines of the product and its variants in one query before
  any order, and stops at the first qualifying line for the proof and the write link: a signed-in visitor who never bought
  the product costs two queries a product page.
- **R2** (minor) The Review page (`get#Reviews`, the review request's link) did not claim the account's guest purchases, so
  a guest buyer who then made an account was told to wait for their order although `submit#Review` (which claims) would
  accept it; it now claims first, as the account pages do. The product page's view does not claim (kept cheap).
- Specs (`--nobuild`): Mantle StoreReviews, ShopCatalog, StoreFulfillment, DeliveryLedger, PassAuthority, ShopCustomer 26
  passed; mr-pass ShopReviews, ShopAccess, ShopCatalog, ShopAccount, Transport 13 passed; mr-boss CommerceReviews,
  CommerceAccess 14 passed. Acceptance not run (unchanged).
- For the lead:
  - A review staff deleted does not count for "one review per account, store and product": the author may write a new one
    (pending, throttled). Count deleted reviews too if a deletion should be final.
  - A decision or reply without an expected revision is not stale-checked (the screens always send it); require it if
    every caller should.
  - Two simultaneous first submissions could make two reviews (no unique key on account, store and product).
  - The download SECA (DownloadFirstRequestReview) and R2's claim have no spec of their own (the shipment SECA and Shop
    P6's claim have).
  - Removing a photo deletes its file before the transaction commits; a later failure leaves the row without its file.
- **Wave 11 suites (Nov 6, on master after Commerce P8 and P9 merged; the P9 follow-up's worker ran at the same
  time):** standalone mr-mantle 1,847 passed, 2 failed (the baseline), 11 skipped; `./moq test-apps` 3,236 server and 17
  client features passed; `moqui lint --screens` as before. Feature time under load: server mr-mantle 399.0 of 383 s,
  mr-boss 290.5 of 264 s (P8 and P9 add about 3 s and 1 s alone; the rest is the concurrent worker, as Shop P6's run
  showed); client mr-boss 53.4 of 57 s, mr-pass 8.2 of 9 s. Budgets measured again at the next quiet run.

**Follow-up Nov 6 (P9: review requests and checkout opt-ins)** (branch `com/p9b`; the user's decision in §4, F95). Built:
- Mantle:
  - `service/mantle/public/StoreTopics.js` (new): a store's topics, "cart reminders" (Shop P6's, moved here from AccountHub.js)
    and "review requests" (purpose `PcpReviewRequest`, list type `REVIEW_REQUEST`, store setting `PsstReviewRequestList`, the
    list made when first needed), each on for a party while its latest consent of the purpose on the list is a grant; the
    checkout's opt-ins (reviewRequests, cartReminders to a signed-in buyer with a verified account email only (review R2), news only when `PsstNewsList` names the
    store's list) offered by `PsstCheckoutOptIns` (absent: all three, so the demo stores offer the first two; `none`: none),
    each unchecked with a one-line statement of what it is and is not; recording at placement (granted for a buyer whose
    verified account email is the checkout's; else a `ContactListParty` `CLPT_PENDING` membership of the list, never sent
    to), each opt-in in a transaction of its own (`apply#CheckoutOptIn`, a failure logged and named); confirmation by the
    receipt's code (`make#OptInConfirmLink`: a new code whose digest the checkout keeps, 60 days) or, for a choice the account checked
    while signed in, by its verified sign-in (`confirmVerified`, from ShopCustomer.js' claim and the preferences page; a
    claimed guest's choice only by the link, review R1), granting only a choice still pending.
    `data/AccountHubSetupData.xml` +5 seed rows; `entity/StoreOptInEntities.xml` (StoreCheckout `optInsJson`, `optInPending`,
    `optInCodeDigest`, `optInCodeDate`, an index by customer and pending).
  - `AccountHubServices` `check#ReviewRequestConsent`, `apply#CheckoutOptIn` (internal), `make#OptInConfirmLink`; AccountHub.js'
    preferences list both topics per store (each needing a verified email to turn on, R2; turning one off ends a choice still
    pending), mark a choice waiting for confirmation, leave a pending list row alone on save, answer the receipt's
    `confirm` code read only (`mode: confirm`) and confirm it on `choices.confirm`.
  - The review request (StoreReviews.js `queue#ReviewRequests`): `PcpReviewRequest` on the store's topic list, never
    PcpMarketingEmail. The delivery ledger (MessageDeliveries.js, `queue#Delivery` `consentContactListId`): a delivery with a
    topic's list needs the recipient's latest consent of its purpose on that list; one without is unchanged.
  - Checkout (ShopCheckout.js): the view's `checkout.optIns`; `submit#Checkout` `optIns` (only those offered, kept by the
    freeze); `place` records them before `place#Order`, so the receipt finds a pending choice. `send#OrderStoreEmail`
    (OrderInfoServices.xml, PsetOrderPlaced): a Shop order with a pending choice gets `optInConfirmUrl` in its body
    parameters (its own transaction, errors ignored); any other order none.
- mr-pass: Checkout's review form shows the store's optional emails (each a separate unchecked box with its statement,
  "Already on" for an account, and "Not needed for your order: your receipt and order updates come either way") and posts the
  checked ones; Account/EmailPreferences shows the review requests topic, a choice waiting for confirmation, and the receipt
  link's page (the choices and one Confirm button posting to save). Schema `submitCheckout` +`optIns`,
  `getEmailPreferences`/`storeEmailPreferences` +`confirm` (Mantle's ForumSchema.js identical), `Contracts.d.ts`.
- Docs: design-commerce §4 Reviews (review requests their own opt-in; the message classes, instructional follow-ups
  transactional), §6 CartDetail's consent; design-shop §6 Checkout (optional emails), §9 EmailPreferences, §11 Delivery
  (message classes), §16, §19; impl-shop P6 note. No instructional message exists to reclassify (none built).
- Specs (`--nobuild`): Mantle ShopCheckout +1 feature (0.54 s: a guest offered review requests only, unchecked, with its
  statement; the choice pending, not consented; the receipt's link, its read-only page, a wrong code refused, the confirm
  granting it; nothing checked records nothing; an order with no pending choice, or no checkout, gets no link), StoreReviews'
  request feature (marketing email consent granted and still suppressed with the topic's purpose and list in the snapshot;
  the topic granted, `check#ReviewRequestConsent` true and the next attempt not suppressed), ShopCustomer (the claimed guest
  checkout's pending review requests moved to the account and still pending, an own choice confirmed by the verified sign-in
  (review R1); cart reminders offered to the verified account only (review R2); the preferences' second topic); mr-pass ShopCheckout
  (the review form's unchecked box and statement, no cart reminders for a guest) and ShopAccount (the review requests topic).
  Run, all pass: Mantle ShopCheckout, StoreReviews, ShopCustomer, DeliveryLedger, Consent, StoreFulfillment, ShopCart,
  OrderToCashBasicFlow, PassAuthority, ContactListSend (111 features); mr-pass ShopCheckout, ShopAccount, ShopAccess,
  ShopReviews, Transport (14); mr-boss CommerceReviews, Consent, Unsubscribe (22). New Mantle feature time 0.54 s (the
  ShopCheckout feature; the other additions are checks on existing features). Acceptance: none changed, none run.
- Lint: `moqui lint --screens` 132 flagged sites as before, none in the Shop or Account files.
- Decisions: the pending state is Mantle's existing list membership (`CLPT_PENDING`), since PartyConsent has none; the
  confirmation rides on the order receipt (PsetOrderPlaced) as one link to the email preferences page, read only until its
  button; cart reminders are offered only to a signed-in buyer (a guest's cart is never recovered; review R2: with a verified
  account email); a confirmation grants
  only what is still pending; the news opt-in subscribes through `ConsentServices.set#ContactListPartySubscription` until
  Marketing's `request#Subscription` exists (picked up in impl-marketing P7); a guest's confirmed review requests consent is the guest party's and moves
  with the claim.
- Findings (provisional):
  - **F118** `PsstCheckoutOptIns` and `PsstNewsList` are store settings that CheckoutSettings does not edit yet (they
    are not in StoreCheckout.js' `checkoutPolicy`, so a store sets them by data). For P10 (with RecoveryPolicy) or P15.
  - **F119** The receipt's link needs a PsetOrderPlaced store email and an Account mount on the site; without either a
    guest's choice waits until the account turns the topic on itself (review R1). The demo's generic template (ScreenRenderEmail) shows the link as an
    `optInConfirmUrl` line; a store's own template should render it as a link with its words.
  - **F120** `send#OrderStoreEmail` (Mantle's receipt) now asks `make#OptInConfirmLink` for every PsetOrderPlaced email: one
    indexed read of StoreCheckout by order, nothing for an order without a pending choice (OrderToCashBasicFlow unchanged).
  - **F121** BOSS's Comms Consent screens show the topic lists (REVIEW_REQUEST, CART_REMINDER) and a pending checkout
    choice as the list's "Pending Acceptance" member; the consent history names the checkout's order and statement.
  - **F122** The confirmation page (Account/EmailPreferences `?confirm=`) has no render spec: the screen's one html
    render is ShopAccount's account mode; its rule is Mantle's (ShopCheckout's feature).
  - **F123** A review request to a guest with confirmed consent links the Review page, which asks them to sign in (the
    review needs a verified account, and the claim then makes the guest's order theirs).

**Review Nov 6 (P9 follow-up)** (`git diff $(git merge-base master com/p9b)..com/p9b` in mr-mantle, mr-pass, mr-boss).
Checked: consent (boxes never pre-checked, the view's `chosen` only the buyer's; a forged or unoffered `optIns` entry is
dropped by `chosenFrom`, ShopCheckout's "unknown" and a guest's cartReminders; a pending choice is a `CLPT_PENDING` row, and
list sends take `CLPT_ACCEPTED` only; the receipt's code is a digest on the checkout, bound to the checkout and its site,
60 days, URL-safe; the GET only reads, the POST is the PASS form with its form token and grants only a choice still pending,
so a replay changes nothing; a topic turned on then off before the confirmation stays off; the ledger's snapshot names
`PcpReviewRequest` and the store's list); cart reminders' `check#CartReminderConsent` unchanged after the move to
StoreTopics.js; merge#Parties moves PartyConsent, ContactListParty and StoreCheckout, so a guest's confirmed consent goes with
Shop P6's claim of an anonymous guest only; the freeze keeps the offered opt-ins and placement records them before
`place#Order`, each in its own transaction (`probe`), a failure logged; send#OrderStoreEmail runs on tx-commit, so its
force-new `make#OptInConfirmLink` sees the recorded choice; a non-Shop order costs one indexed read (STORE_CHECKOUT_ORDER);
`queue#Delivery` without `consentContactListId` keeps its consentJson and consent check; Schema.js and ForumSchema.js
identical; Contracts.d.ts. Fixes:
- **R1 (medium, consent)** A verified sign-in confirmed a claimed guest checkout's pending choices: whoever checked the box
  was not signed in (anyone can type another's email at a guest checkout), and signing in is no act of consent. Now
  `confirmVerified` confirms only the account's own checkouts (`accountCheckout` Y); a claimed guest's choice moves to the
  account still pending, confirmed by the receipt's link or by the account turning the topic on. ShopCustomer checks both.
- **R2 (low, consent)** Cart reminders were offered to an unverified account, whose choice the receipt's link (to the
  checkout's address, possibly not the account's) could then grant, bypassing Shop P6 review R2's verified account address.
  Now offered only to an account checkout whose account email is verified; ShopCustomer checks the verified and unverified
  offers.
- **R3 (low, operation identity)** `submit#Checkout`'s request hash always carried `optIns` (an empty list for a submit
  without any), and the offered list, which a store's setting could change between a submit and its retry. Now the request
  carries the opt-ins as asked (sorted, once each) and only when some are; the freeze keeps the offered ones.
Docs corrected for R1/R2 (this note's Built text, design-commerce §6, design-shop §6 and §19, impl-shop's P6 note).
Specs (`--nobuild`): Mantle ShopCheckout, StoreReviews, ShopCustomer, DeliveryLedger, Consent, ShopCart, OrderToCashBasicFlow,
ContactListSend, PassAuthority 103 passed (ShopCustomer's cart reminders feature 0.47 s); mr-pass ShopCheckout, ShopAccount,
ShopAccess, ShopReviews, Transport 14 passed; mr-boss CommerceReviews, Consent, Unsubscribe 22 passed. For the lead:
- On the preferences page a pending topic shows unchecked "waiting"; saving it unchecked does not end the choice (only on
  then off does), and a pending news-list row is skipped by the save, so the account cannot withdraw a pending choice there
  except by turning it on and off. Conservative enough (nothing is sent while pending); a "decline" could end it.
- The receipt's code stays usable for its 60 days after the confirmation (harmless: it grants only what still waits); a
  resent receipt (forceByType) makes a new code and voids the earlier email's link.
- `recordCheckout`'s final StoreCheckout update runs in the placement transaction (the opt-ins themselves each in their
  own), so a database error on that one row would still fail the placement step, which the placement job retries.
- The news opt-in at placement subscribes through `set#ContactListPartySubscription`, which also re-grants a withdrawn
  PcpMarketingEmail (that service's existing rule for a subscribe).
- No spec covers an unverified account's own pending choice confirmed after it verifies (R1's own-choice check marks the
  claimed checkout as the account's to exercise `confirmVerified`).
- **Wave 11 suites again (Nov 6, quiet, after the P9 follow-up merged):** standalone mr-mantle 1,848 passed, 2 failed
  (the baseline); `./moq test-apps` 3,237 server and 17 client features passed; lint as before. Feature time: server
  mr-mantle 376.7 of 383 s, mr-boss 263.3 of 264 s (Commerce's specs 19.0 s, 1.1 s more than Wave 10), mr-pass 18.7 of
  20 s; client mr-boss 53.9 of 57 s, mr-pass 8.3 of 9 s. No budget raised.

### P10 — Cart recovery

Design §6 CartDetail's recovery and §8 RecoveryPolicy; COM-OPS' recovery, SHOP-CART's recovery token.

- **RecoveryPolicy** as dated ProductStoreSetting types (§4), saved by `StoreAdminServices.store#CartRecoveryPolicy`
  (`COMMERCE_STORE_EDIT`): enabled, inactivity delay, the sender (built-in recovery; a Marketing automation once
  Marketing exists, §7), the `PsetCartRecovery` binding, maximum sends and retention. Nothing sends until a store
  enables it.
- **Consent** (§4): only a signed-in customer holding the store's "cart reminders" consent, which they turn on in
  Shop P6's email preferences page, is eligible; a guest's cart never is. The demo seeds one consenting customer.
- **`StoreOperationsServices`**: `get#CartRecovery` (eligibility and its reason, the consent state from
  `get#PartyConsentState`, prior sends from the ledger), `send#CartRecovery` (`COMMERCE_RECOVERY`; the exact body
  previewed; a one-time recovery token of the cart's StoreCartAccess, Shop P4; an unsubscribe link to the PASS Account
  email preferences page, Shop P6), and the recovery job: one abandonment event per cart and window, one sender, each
  cart its own transaction, a completed checkout suppressing what is queued, the ledger deduplicating by cart and
  recipient.
- **The recovery link** (mr-pass): a `recoverCart` operation and its route under the Shop mount, with its Schema,
  Routes and Mantle mirrors and its entry in the three `TOKEN_WRITES` lists; it spends the one-time token of the cart's
  StoreCartAccess, rotates the cart capability into a fresh session, reprices, and names unavailable lines; a spent,
  expired or revoked token gets the not-available page.
- **Screens:** CartDetail's RecoveryHistory and RecoverCart; CheckoutSettings' RecoveryPolicy.
- **Specs:** Mantle `test/order/CartRecovery` (active, completed, suppressed and unidentified carts not sent; one
  failing send does not stop the batch; one mail per cart and window); BOSS `CommerceRecovery`.
- **Usable when** (design §12.2 scenario 9): an opted-in signed-in shopper's cart idle past the delay gets one notice,
  whose link restores the cart repriced in a fresh session; a guest's cart with no consent gets none.

**Built Nov 6 (P10)** (branch `com/p10`).
- Mantle:
  - `service/mantle/order/CartRecovery.js` (new) behind `StoreOperationsServices` `get#CartRecovery` (COMMERCE_ORDER_VIEW,
    StoreOperations.js' scope: the eligibility and its reason, the consent state, the policy, the ledger's prior sends with the
    address masked and whether the link was used; with `preview` and COMMERCE_RECOVERY the template's exact subject and body,
    the link shown as made at the send), `send#CartRecovery` (COMMERCE_RECOVERY: an eligible cart only, the refusal its reason
    code; a reason, an operation key, PostingOperation type CartRecovery, and the cart's revision), `run#CartRecovery` (the
    `run_CartRecovery` job, every ten minutes: the stores with PsstRecoveryEnabled true only, their signed-in carts idle past
    the delay within the window, each through `queue#CartRecovery` in its own transaction, a failure logged and named),
    `queue#CartRecovery` (internal: one delivery on the ledger, event `cartRecovery:{orderId}:{last activity ms}`, purpose
    PcpCartReminder on the store's cart reminders list, tried at once) and `build#CartRecovery` (the ledger's source build:
    suppressed when the cart is closed, completed, checking out, the shopper came back since the window or it is no longer
    eligible; else a new one-time token whose digest goes on StoreCartAccess `recoveryTokenDigest` until the window ends, and
    the recovery and email preferences links; a site with no Shop or preferences page fails it); `StoreAdminServices`
    `get#`/`store#CartRecoveryPolicy` (COMMERCE_VIEW / COMMERCE_STORE_EDIT, StoreCheckout.js' dated settings: PsstRecoveryEnabled,
    PsstRecoveryDelay, PsstRecoverySender, PsstRecoveryMaxSends, PsstRecoveryRetention and F118's PsstCheckoutOptIns and
    PsstNewsList, each validated by its kind in StoreAdmin.js; a field not given is left); `ShopCartServices.recover#Cart`
    (recoverCart: the signed-in account whose cart it is spends the token under the order's lock, the capability rotated with
    the activity, the lines repriced and the unavailable named; a visitor SIGN_IN_REQUIRED with the token kept; spent, expired,
    replaced, revoked or another account's NOT_AVAILABLE; its own lookup throttle).
  - Eligibility (one function for the screen, the job, the send and each attempt): recovery on, sender built-in, a current
    PsetCartRecovery email, a Shop access row with a signed-in customer (never a guest's or staff's), the order open, no
    completed or live checkout, product lines, `check#CartReminderConsent`, the account's own email verified (the P9 follow-up
    review's R2), idle past the delay and within the window, nothing in this window yet, fewer sends than the most (failed and
    suppressed ones do not count).
  - Appended: StoreAdmin.js settingTypes, settingKinds (recoveryDelay, recoveryMaxSends, recoveryRetention, recoverySender,
    checkoutOptIns, newsList) and cloneLeftOutSettingTypes (PsstRecoveryEnabled, PsstNewsList); StoreCheckout.js exports
    `settingsOf` and `storeSettings` and a `newsLists` option source; ShopCart.js exports `reprice`, `usable`, `answer`;
    StoreOperations.js exports `scope`, `storeOrder`, `deliveryRow`, names MdsrcCartRecovery's order in `deliveryOrders`, and
    takes a cart's abandonment from the store's delay (`CartRecovery.delayOf`, once a store a call; an hour by default).
  - Changed rule: MessageDeliveries.js runs a source's build in a transaction of its own (F127); DeliveryLedger unchanged.
  - Records: `entity/CartRecoveryEntities.xml` (StoreCartAccess `recoveryExpireDate`); `data/CartRecoverySetupData.xml` (the
    five setting types, the ledger source MdsrcCartRecovery), `data/CartRecoveryJobData.xml` (run_CartRecovery).
  - Shop's `recoverCart` in ForumSchema.js and PassRoutes.js (identical to PASS's), PassApi.js' and PassAuthority.js'
    TOKEN_WRITES.
- mr-pass: `screen/Shop/Recover.xml` with `Shop/ShopRecovery.js` (Recover?r= keeps the token in the session and redirects to the
  clean address; a visitor gets the sign-in link back to Recover; the shopper's Open my cart posts `Recover/restore`, which
  keeps the new capability and opens the cart with "Your cart is back, at today's prices" and the unavailable lines; a spent
  or expired link gets "This cart link is no longer available"); Schema.js and Routes.js (`POST shop/cart/recovery`),
  Transport.js' TOKEN_WRITES, Contracts.d.ts.
- BOSS: `Orders/CartDetail.xml` RecoveryHistory (the reason, consent, recipient masked, the policy line, the sends with outcome
  and "link used") and RecoverCart (a dialog with the previewed subject and body and a reason, for a user with the recovery
  capability and an eligible cart; `sendRecovery`); `Settings/CheckoutSettings.xml` Cart recovery (RecoveryPolicy's view and
  Change recovery: on/off, delay, sender, most sends, window, F118's optional emails and news list; `saveRecovery`). Demo:
  POPC_DEFAULT's PsetCartRecovery email (BossCommerceDemoData.xml) and Joe Q Public's cart reminders for it (Demo.js step
  `recovery`); the store's recovery stays off.
- Specs (all `--nobuild`):
  - Mantle `test/order/CartRecovery` (4 features, 1.4 s of feature time): nothing sent before a store enables recovery
    (RECOVERY_OFF), the policy's reason, kinds and reader refused, F118's opt-ins saved and shown; the job sends one mail to the
    opted-in idle cart and none to the active (90 minutes against the store's two hours), the guest's, the unconsented or the
    completed cart, a site without a Shop link fails its send and the batch goes on, a second run sends nothing (ALREADY_SENT),
    Carts' abandonment by the store's delay; the link: a visitor SIGN_IN_REQUIRED, another account NOT_AVAILABLE, the owner's
    cart restored with the new capability, the withdrawn line named and the old price repriced, spent and expired links
    NOT_AVAILABLE, the history's "redeemed"; a queued recovery suppressed by a completed checkout; the staff send refused without
    COMMERCE_RECOVERY or a reason, previewed, sent once per key (alreadyApplied), a second key ALREADY_SENT, a guest's cart GUEST.
  - BOSS `CommerceRecovery` (1 feature, 0.3 s): the demo's consenting customer's idle cart RECOVERY_OFF until the manager turns
    recovery on (another organization's manager RECORD_UNAVAILABLE), then previewed and sent once by the store operator; the
    subscription operator (ORDER_VIEW without RECOVERY) PERMISSION_DENIED. CommerceOrders' CartDetail render and
    CommerceCheckoutSettings' render gained their recovery checks (no new render). No CommerceAccess case: the rule is Mantle's
    permission and scope, as P8's.
  - mr-pass ShopCart +1 feature (0.05 s): the Recover page's form for the token kept, never the token; an unknown link NotFound;
    recoverCart a POST in the three lists.
  - Also run, all pass: Mantle StoreOperations, ShopCart, StoreAdmin, StoreCheckout, StoreReviews, StoreFulfillment,
    DeliveryLedger, ShopCheckout, ShopCustomer, PassAuthority, Consent; mr-pass ShopCart, ShopAccount, ShopAccess, ShopCheckout,
    Transport; mr-boss CommerceAccess, CommerceStores, CommerceCheckoutSettings, CommerceOrders, CommerceRecovery, Unsubscribe
    (124 features; mr-pass ShopCheckout's page feature fails only in that one combined run, F128, and passes with its own
    component's specs). Not run: `./moq test-apps` (the brief).
- Acceptance: `test/acceptance/Commerce/CommerceRecoveryScenario` (mr-boss, 3 features, stepwise, run once: 3 passed): a new verified
  shopper turns on POPC_DEFAULT's cart reminders through `storeEmailPreferences` and adds to a cart on a spec site; a guest adds
  another; both left two hours; the manager turns recovery on through CheckoutSettings' `saveRecovery`; the job sends the
  shopper one notice (with the preferences link) and the guest none (GUEST), a second run none; in a fresh session (no cart
  capability, signed out) `Recover?r=` keeps the token, the page asks the visitor to sign in, the shopper's page offers Open
  my cart, `Recover/restore` keeps a new capability whose cart has the line back at today's price, the link refused the second
  time; CartDetail shows the one send and "link used".
- Lint: `moqui lint --screens` (release binary) 132 flagged sites as before, none in CartDetail, CheckoutSettings, Recover or
  ShopRecovery.
- Inventories: usl-inventory's `get#PartyConsentState` row names CartDetail's RecoveryHistory, which reads the store topic's
  consent through `check#CartReminderConsent` instead; ss-inventory has no recovery row (SimpleScreens has none).
- Decisions:
  - The abandonment window is the cart's last activity: one event and mail per visit to the cart, at most the policy's sends
    across visits; the ledger's unique event, recipient and template key is the dedup by cart and recipient.
  - The token is made at each attempt by the source's build (never kept on the ledger), so a resend replaces the earlier link;
    it lives until the end of the recovery window (PsstRecoveryRetention, 7 days by default), which is also how long an idle cart
    may be reminded.
  - The recovery link needs the cart's own signed-in account (the cart is never a guest's, and Shop P4's capability of an
    account cart reaches only that account): a visitor signs in first, and the token is spent only by the Open my cart post, so
    a mail scanner's GET spends nothing. "A fresh session" is a new capability kept in the PASS session; the HTTP session itself
    is not renewed (F129).
  - A staff send needs the same eligibility as the job's (recovery on, consent, verified email, idle past the delay); it only
    sends earlier than the next job run.
  - A site without a Shop or email preferences page fails the send (the ledger's failed, an exception) rather than suppressing
    it, since the store's setup is wrong, not the event.
  - The demo store's recovery is off; Joe Q Public is the consenting customer.
  - F118 done: CheckoutSettings' Cart recovery box edits PsstCheckoutOptIns (a text of none or the ids) and PsstNewsList (a
    drop-down of the organization's lists), with the store edit permission and scope.
- Findings (provisional):
  - **F127** The delivery ledger ran a source's build in the attempt's own transaction, so a build that threw left the
    transaction rollback-only: the "message could not be made" failure was never recorded and the delivery stayed queued, tried
    again every two minutes. The build now runs in a transaction of its own (a token or link it makes commits even when the
    send then fails, which is harmless). It changes only the failure path of every source.
  - **F128** Shop P4's cart-creation throttle (30 a requester in ten minutes) is reached when many cart-making specs of mr-mantle
    and mr-pass run in one process: mr-pass ShopCheckout's page feature then renders nothing (RATE_LIMITED). Not P10's (its specs
    make carts as rows); per-component or worker runs pass. For the lead: reset the throttles between specs, or a test property.
  - **F129** Rotating the cart capability does not renew the HTTP session id (no PASS call for it); the old capability is dead,
    which is what the cart's access needs.
  - **F130** The ledger keeps no "redeemed" fact: RecoveryHistory derives it from StoreCartAccess `recoveryUsedDate` after the
    latest send. P11's CartRecovery report (recovered orders) needs the same reading, or a recovery fact of its own.
  - **F131** RecoveryPolicy's retention is the recovery window (eligibility and link life), not a purge of the ledger's rows;
    the sends' retention is Comms' ledger's and the privacy provider's (design §6).
  - **F132** The Marketing automation sender is not offered (no Marketing yet, design §8); `OTHER_SENDER` is the reason a
    store set to another sender would show.

**Review Nov 6 (P10)** (`git diff master...com/p10` in mr-mantle, mr-pass and mr-boss). Checked against this section,
design §6 CartDetail and §8 RecoveryPolicy, design-shop §13.2 and §2. Consent: only an access row's signed-in customer
(never a guest's or staff's cart) with an account, the latest PcpCartReminder consent on the store's topic list granted
(`check#CartReminderConsent`; a pending checkout choice is a CLPT_PENDING membership, never a grant) and the account's own
verified address; the ledger checks the topic again at the hand-off and the build re-runs the whole eligibility (store off,
template gone, closed, completed, checking out, the shopper back, consent off: suppressed); the mail carries the email
preferences link; the job reads only stores with PsstRecoveryEnabled true. Dedup: the event key is the cart and its last
activity, MESSAGE_DELIVERY_EVENT is unique (a concurrent run's second create fails and is named, never sent), the most
sends count only what reached someone; each cart is queued with `probe` in its own transaction. Token: 48 random
characters, only its digest kept, spent only by the POST under the order's lock and the access row re-read, bound to the
row's account (another account NOT_AVAILABLE), the site, store and currency (`usable`), expired, replaced (a resend
overwrites the digest) or revoked refused; the cart's capability is rotated (the old digest replaced). The Recover page
keeps `r` in the session and redirects at once; PASS sends `Referrer-Policy: same-origin` and no-store on every page, so
the token reaches no third party (the first GET's URL is in the server's access log, as any emailed link is). recoverCart
in Schema/ForumSchema and Routes/PassRoutes (identical) and the three TOKEN_WRITES lists. Staff: `get#`/`send#CartRecovery`
through StoreOperations' scope (store list and foreign-vendor orders), COMMERCE_RECOVERY for the preview and the send,
operation key and revision; the preview's link is `LINK-MADE-WHEN-SENT`. F127: `buildApart` changes only where a
source's build runs; the three sources (download notice, review request, recovery) read only and make a token at most, and
the attempt already ran in its own transaction, so no build saw a caller's uncommitted rows before either. F118: both
fields through `storeSettings` with COMMERCE_STORE_EDIT and the store scope; PsstCheckoutOptIns is "none" or known ids only
(StoreTopics.js reads the same form); PsstNewsList a current list of the store's organization, never a topic's list.
- **R1** (medium) The job took a store's 500 oldest idle signed-in carts in the window (`orderBy lastActivityDate`), every
  one of which is read whatever its consent or earlier send; once a store had 500 such carts in its seven-day window, the
  carts newly past the delay were never reached. It now takes the newest first (`-lastActivityDate`).
- **R2** (minor, spec) CartRecovery had no case of a queued recovery suppressed by the shopper's return or by cart
  reminders turned off before the send, nor of another organization's operator; the fourth feature now has all three
  (suppressed with "The shopper came back to the cart" and "No consent for this message"; RECORD_UNAVAILABLE for read and
  send).
- **R3** (F128, spec) mr-pass ShopCheckout's setup removes this ten-minute window's `cart-create` bucket of its
  requester before making its carts, as AccountingPortals removes its bucket; the throttle is unchanged. The combined
  run that failed (mr-mantle, mr-pass and mr-boss, 24 specs, 124 features) now passes.
- Specs (`--nobuild`): Mantle CartRecovery, StoreOperations, ShopCart, StoreAdmin, StoreCheckout, DeliveryLedger,
  StoreReviews, StoreFulfillment, ShopCustomer, Consent, PassAuthority 61 passed (CartRecovery's fourth feature 0.7 s);
  mr-pass ShopCart, ShopAccount, ShopAccess, ShopCheckout, Transport 16 passed; mr-boss CommerceRecovery, CommerceOrders,
  CommerceCheckoutSettings, CommerceAccess, Unsubscribe 25 passed; the combined set above 124 passed. Acceptance not run
  (unchanged).
- For the lead:
  - The job reads every signed-in idle cart of the window again each run (up to 500 a store, each a transaction with the
    consent, verified-address and ledger reads), most of them already handled; a "handled" mark on the access row (the
    last window sent) would let the query skip them.
  - A staff send's operation key covers the cart only: a retry with another reason answers the first send (not a
    conflict).
  - The sent mail's rendered body (with the link) is kept in EmailMessage by `send#EmailTemplate`, as the download
    notice's guest link is; whoever can read EmailMessage can use the link until it is spent or expires, though only
    from the cart's own signed-in account.
  - F129: the framework rotates the session id at a password sign-in and carries its attributes over
    (`session.rs` `rotate_on_password_login`), so the kept token survives the sign-in; the acceptance walk signs in with
    `login()`, not through the sign-in page, so that path is not walked.
- **Wave 12 suites (Nov 6, on master after Commerce P10 merged and the framework's performance rounds 16–20 pulled and
  built):** standalone mr-mantle 1,852 passed, 2 failed (the baseline); `./moq test-apps` 3,242 of 3,243 server features
  (CommerceCheckoutSettings' render, F136, fixed and checked with CarrierServices before it) and 17 client features
  passed; lint as before. Feature time: server mr-mantle 373.5 of 383 s, mr-boss 251.2 of 264 s, mr-pass 17.3 of 20 s;
  client mr-boss 52.2 of 57 s, mr-pass 8.4 of 9 s.

### P11 — Reports and Home

Design §3 Home and the Reports area, §1.4's shipped definitions; COM-REPORTS. Ends stage C2/S2.

- **Store-scoped sales reads** (F21, owner contract: Sales' and Accounting's metrics, X11): `SalesReportServices`'
  `get#SalesOrderSummary` and `get#SalesInvoiceSummary` answer a caller holding `COMMERCE_VIEW` for `productStoreIds`
  all in the caller's store scope, beside `ACCOUNTING_VIEW`; `get#SalesTopProduct` gains `productStoreIds`.
- **Commerce's metrics:** `O.get#CartRecoverySummary` and `P.get#PromotionUseSummary` (and `I.get#ChannelHealth` in
  P14), each a registered report definition: mr-boss `report/` gains the store operations dataset, the Store operations
  dashboard and the alert templates of design §1.4 (checkout failures, long-unresolved payment attempts, feed build
  failures in P14, intake error spikes in P13), loaded by the framework (F22).
- **`ironstone.commerce.ReportingServices`**: the reports' scope, as-of time, zone and currency (never summed across
  currencies), CSV under the same permissions with the export audited.
- **Home:** WorkCards from `get#StoreWorkSummary`, the PeriodStrip of orders and net sales against the previous period;
  visits and conversion hidden until Marketing's tracking exists (§4, §7).
- **Screens:** Reports (the catalog, as Customer Service's and Accounting's are), OnlineSales, CartRecovery,
  PromotionUse, each with ReportScope.
- **Specs:** Mantle `test/sales/SalesReportStoreScope` (a store outside the caller's scope refused; ACCOUNTING_VIEW's
  answers unchanged); BOSS `CommerceReports` (open carts and bases never counted; the report and Home agree).
- **Usable when** (design §12.2 scenario 15): OnlineSales for POPC_DEFAULT agrees with `get#SalesOrderSummary` and
  `get#SalesInvoiceSummary` for the same window; the reader sees only their stores; the CSV has the same rows.

**Built Nov 6 (P11)** (branch `com/p11`).
- Mantle:
  - **Store-scoped sales reads (F21, X11; a Mantle default change):** `sales/SalesAnalysis.js` `organizations` takes the
    `productStoreIds`: a user without `ACCOUNTING_VIEW` who holds `COMMERCE_VIEW` is answered for stores all in their store
    scope (StoreAdmin.js `scope`/`storeOf`: their organizations' stores, a store-limited staff member's own; one outside
    RECORD_UNAVAILABLE; none at all keeps Accounting's refusal), read as the stores' organizations (an organization named
    must be one of them, ORGANIZATION_DENIED), with `costWithheld` unless `PRODUCT_COST_VIEW`. A holder of
    `ACCOUNTING_VIEW` takes the old path whatever stores they name. `SalesReportServices` `get#SalesOrderSummary`,
    `get#SalesInvoiceSummary` and `get#SalesTopProduct` pass the stores to it, null the cost fields when withheld (never
    zero), and gain an optional `currencyUomIds` filter (empty: every currency, as before); `get#SalesTopProduct` gains
    `productStoreIds`. `get#InvoicesByCustomerClass` is unchanged.
  - **F114 fixed:** `entity/StoreOperationsViewEntities.xml` `mantle.order.StoreOrderHoldView` (a hold reason with its
    order's store) and `mantle.request.StoreOrderChangeView` (an order change request with its order's store);
    StoreOperations.js `heldOrderIds` and `cancelRequestOrderIds` put the store in the query, so the first 500 are the
    stores' own (Home's Payment holds count and the Attention filters).
  - **F112 hook:** StoreOperations.js `withoutRecurringBases(query)`, called by the order worklist's `orderQuery` and the
    cart report's order read; a no-op until Shop P7 marks a base (see F139 for the sales index).
  - `service/mantle/order/StoreReports.js` (new) behind `StoreOperationsServices.get#CartRecoverySummary` and
    `StorePromotionServices.get#PromotionUseSummary` (both COMMERCE_VIEW and StoreOperations.js' scope, F51 and F113; a
    period of at most two years, PERIOD_INVALID): the recovery funnel of the stores' Shop carts opened in the period (by
    store and currency: opened, placed, abandoned, signed in, sends with a suppressed one left out, delivered, recovered by
    F130's reading and its value; at most 5,000 carts, `truncated`), and promotion use by promotion, code and currency
    (orders, uses, discount, the orders' net sales as get#SalesOrderSummary's netSales, the uses left of a promotion's or
    code's total limit); totals one row per currency.
  - `docs/AccountingImplementation.md`: the summaries' Commerce reader and `currencyUomIds`.
- BOSS:
  - `service/ironstone/commerce/ReportingServices.xml` over `Reporting.js` (new): `get#ReportCatalogue` (Online sales, Cart
    recovery, Promotion use in Insights' catalog contract, for a user of Reports), `get#OnlineSales`, `get#CartRecovery`,
    `get#PromotionUse` (the Reports area's grant, PERMISSION_DENIED without it) and `get#HomePeriod` (every Commerce user):
    the scope (the user's stores, one asked for in it, at most 25 named as left out), a calendar period holding a day against
    the one before (OnlineSales the last 3 to 24), the currencies (the stores' defaults and their orders' and invoices' in the
    window, or the one asked for), each summary read per currency (and per store when there are several), never added
    across currencies; Home's strip and OnlineSales' totals are one function (`totalsOf`). Each answer has its as-of time,
    period, zone, filters and what it left out; output csv is the same rows, formula-like text guarded, audited through
    `audit#Export` (kind commerce, `Commerce.<Report>`).
  - Screens: `screen/Commerce/Reports.xml` (the area: ReportsHome, the default, OnlineSales, CartRecovery, PromotionUse),
    `Reports/ReportsHome.xml` (the catalogue), `Reports/OnlineSales.xml` (ReportScope; the totals by period with their
    change, by store when several, the top products), `Reports/CartRecovery.xml` (the funnel), `Reports/PromotionUse.xml`
    (by promotion and code, each opening PromotionDetail; the totals), each with exportCsv; `template/CommerceReportParts.xml`
    (ReportFrame, ReportMissing). Home: the period is Today, This week, This month (default), This quarter or This year;
    PeriodStrip per currency (Orders, Net sales with their change, Top product, and the period before in words), each card
    opening OnlineSales for a user of Reports; a strip that cannot be read says so and the work cards still count; visits and
    conversion stay hidden.
  - Commerce.js (appended): `linkPaths` Reports/OnlineSales, Reports/CartRecovery, Reports/PromotionUse.
  - `report/` (F22, design §1.4): datasets `boss-commerce-checkouts` (Shop checkouts) and `boss-commerce-payment-attempts`
    (store payment attempts), the dashboard `boss-commerce-store-operations` (orders by store and day from Mantle's
    `mantle-sales-orders`, checkouts by state and day, checkout failures by store, payment attempts by phase) and the alert
    templates `boss-commerce-checkout-failures` and `boss-commerce-payment-unresolved`; `data/BossCommerceReportData.xml`
    (new: the DataDocuments BossStoreCheckout and BossStorePaymentAttempt, the BossCommerceOperations feed, ADMIN only as
    Customer Service's and Mantle's sales datasets are).
- Specs (all `--nobuild`):
  - Mantle `test/sales/SalesReportStoreScope` (3 features, 0.68 s): spec-local organizations, stores, users and orders indexed
    by the feed; a COMMERCE_VIEW reader's summaries of store A1 (two currencies; USD alone; A1 and A2), costs withheld and kept
    for PRODUCT_COST_VIEW, the top product; refused another organization's store, a mix of in and out, the staff member's
    second store, another organization's reader, no store (ACCESS_DENIED as before) and another vendor; ACCOUNTING_VIEW
    unchanged: a store of no Commerce scope answered empty (its organization's orders only), the organization's three orders,
    the same periods, counts and net sales as the store reader's with costs kept.
  - Mantle `test/order/StoreReports` (3 features, 0.36 s): the funnel (five USD carts of A1 and an EUR one: placed 1,
    abandoned 3, signed in 2, sends 2 with the suppressed one out, delivered 2, recovered 1 and its value; an open cart's
    promotion line no use), promotion use (one order, one use, discount 2, net sales 18, uses left 4 and 2), the scope and
    period refusals.
  - BOSS `test/Commerce/CommerceReports` (3 features, 0.64 s): a placed order, an open cart and an invoice of POPC_DEFAULT in
    May 2004: OnlineSales counts the order and not the cart (1 order, 2 items, net 20, invoiced 20, the top product), Home's
    strip has the same totals for the manager and the reader (the reader's without Reports), the CSV's row; the reader refused
    the reports and given no catalogue, another organization's manager refused the store, CartRecovery's CSV and PromotionUse
    answer, the five definitions and their two documents; ReportsHome, OnlineSales, CartRecovery and PromotionUse rendered
    once each (qvt). No CommerceAccess case: the rule is Mantle's permission and scope (SalesReportStoreScope). Home's one
    render stays CommerceAccess's (unchanged, passing).
  - Also run, all pass: Mantle SalesReportStoreScope, StoreReports, SalesReports, MantleSearch, AccountingStatements,
    StoreOperations, StorePromotions, CartRecovery, StoreAdmin, Promotions (54 features, 12.0 s); BOSS CommerceReports,
    CommerceAccess, CommerceOrders, CommercePromotions, CommerceRecovery, CommerceStores, AccountingReporting,
    AccountingAccess, CustomerServiceReports (46 features, 19.1 s). Not run: `./moq test-apps` (the brief).
- Acceptance: `test/acceptance/Commerce/CommerceReportsScenario` (mr-boss, 6 features, stepwise): a placed order and its invoice of
  POPC_DEFAULT this month indexed; OnlineSales (six months, USD) equal period by period to john.doe's
  `get#SalesOrderSummary` and `get#SalesInvoiceSummary` for the same store, organization and currency (orders, gross, net,
  net invoiced); Home's strip the same totals, Home rendered; the store-limited staff member's totals POPC_DEFAULT's and
  another store refused, Services' manager reading only the digital store and refused POPC_DEFAULT in Commerce and in Mantle;
  the CSV's rows; the four Reports screens in qvt. Run: 6 of 6 passed. Then `./moq accept mr-boss` once: server 467
  features, 452 passed, 11 failed, 4 skipped; client 169 of 169. AppStructure's placeholder floor (43) no longer held once
  P8's Orders and Customers and P11's Reports replaced theirs: now 40, and AppStructure passes. The other ten failures are
  not P11's code (F143).
- Lint: `moqui lint --screens` (release binary) 132 flagged sites as before, none in Commerce's screens or templates.
- Inventories: usl-inventory's get#SalesOrderSummary, get#SalesInvoiceSummary and get#SalesTopProduct name Commerce/Home and
  Commerce/Reports/OnlineSales; ss-inventory has no report row.
- Decisions (design §16 row "Reports and Home as built"):
  - The period is a calendar period against the one before, as Mantle's summaries bucket them (`dateFormat` yyyy-MM-dd, the
    buckets matched by their start day); Home's "last 7/30/90 days" became Today to This year. No store-group filter yet.
  - Net sales on Home is Accounting's net invoiced (`get#SalesInvoiceSummary`'s netSales); OnlineSales shows the orders' net
    sales beside it.
  - A Commerce reader's sales read is the stores' organizations, so an ACCOUNTING_VIEW holder takes Accounting's path only;
    a holder of both reads as Accounting does (unchanged).
  - CartRecovery's "eligible" is "signed in" (an abandoned cart of a signed-in customer, the only kind a reminder may reach):
    consent and the verified address are per send and not historical (F141).
  - The Reports' services need the area's grant; Home's strip only COMMERCE_VIEW, as Mantle answers it (F21).
  - Routed items: F114 fixed (above); F112 the hook above and F139; F130 read as P10's RecoveryHistory reads it.
- Findings (provisional):
  - **F137** Mantle's sales summaries take ordersThis/ordersLast (and invoicesThis/Last) as the newest buckets that have
    sales: the date histogram has no bounds, so with no sale in the current period "this" is an earlier one. Commerce matches
    the buckets by their start day instead; Sales' and Accounting's screens read the out-parameters. For Sales/Accounting.
  - **F138** Without `currencyUomIds` the summaries add every currency's amounts (Accounting's and mr-marble's sales
    screens); the filter now exists for a per-currency read. For Accounting.
  - **F139** F112's other half: the sales index (MantleSalesOrderItem and its order part document) has no RecurringTemplate
    marker either, so once Shop P7 makes bases OnlineSales and Home would count them as placed orders. Shop P7 should add the
    marker to the sales documents (or a condition in the summaries) with its default test, beside `withoutRecurringBases`.
  - **F140** A dataset is one document type, so design §1.4's one store operations dataset is shipped as checkouts and
    payment attempts beside Mantle's sales orders; carts, recovery sends and promotion use (and P13/P14's messages and
    feeds) need documents of their own. The datasets read every organization's rows and are ADMIN's until Insights'
    admission applies a store scope.
  - **F141** CartRecovery's eligibility is not historical (consent and verification are read at each send), so the report
    shows signed-in abandoned carts, not the job's eligibility at the time.
  - **F142** Not built from design §3: Insights' registration of the catalogue (Z10; Insights has no catalog yet), the
    reports' graph views and ReportScope's store-group and free compare-period choices.
  - **F143** `./moq accept mr-boss` on this branch fails ten features outside P11's code: CommerceFoundationWalk (the demo
    store has 6 emails, not 5: P10's PsetCartRecovery email), CommerceSitePagesWalk (a draft product's menu item is not
    refused DESTINATION_NOT_PUBLIC), CustomerServiceCasesWalk, CustomerServiceKnowledgeWalk, CustomerServiceReportsWalk,
    CustomerServiceSupportWalk (2), PurchasingReplenishmentRoutesWalk, PurchasingReplenishmentWalk and TuiRender
    (Customer360's ServiceCases without BOSS_CS_CASE_THERMO), mostly the demo's cases and supply as earlier walks leave them.
    Not checked against master. For the lead.

**Review Nov 6 (P11)** (branch `com/p11`).
- Checked: SalesAnalysis.js `organizations` and the three summaries: an `ACCOUNTING_VIEW` holder takes the old path whatever
  stores are named, `currencyUomIds` and SalesTopProduct's `productStoreIds` are empty by default, so Accounting's,
  Sales' and mr-marble's callers (none passes the new parameters; SalesTopProduct is called without stores) get the same
  answers; a `COMMERCE_VIEW` reader is answered only for stores of their scope, and the summaries filter by
  `productStoreId` itself (both sales documents index it), so a store-limited staff member never sees another store of the
  same organization; an organization named must be the stores', empty stores keep Accounting's refusal, costs are nulled
  without `PRODUCT_COST_VIEW`. F114's views join a hold or change request to its one OrderHeader (the store is the header's),
  so an order with several parts is one row, kept distinct. StoreReports.js and Reporting.js: every read is in the store
  scope, amounts per currency (decimals added with their methods, numbers through `toNumber`), the CSV the same rows behind
  the same service and audited; open carts are not orders; Home and OnlineSales share `totalsOf`. `report/`'s two
  DataDocuments are ADMIN's only and the alerts notify ADMIN. AppStructure's floor: master has 41 placeholder screens (P8
  replaced Orders and Customers), the branch 40 (Commerce/Reports.xml), so 40 is the count, not a hidden regression.
- R1 (minor, Mantle 9181a259): with `maPeriods` the moving-average trim can leave the newest periods out of the summary list
  while `ordersThis`/`ordersLast`/`ordersPrior` (and the invoices') are still returned, with their costs, to a reader without
  `PRODUCT_COST_VIEW`; the costs are now nulled on those too. No spec: every spec order is in the current period, one bucket.
- R2 (minor, BOSS): Reporting.js `currenciesOf` returned the currency asked for even with no store in scope, so the summaries
  ran with no `productStoreIds`: an `ACCOUNTING_VIEW` holder got the organizations' sales labelled "Stores: none", another
  reader an error. No store now means no currency and no read.
- F137 left: `extended_bounds` would fix "this" for an empty current period, but it changes Accounting's and Sales'
  default answers (empty buckets, Prior Total and Average, the moving-average length) and the invoice summary's merged
  histograms; Commerce already matches buckets by their start day.
- Specs (`--nobuild`): Mantle SalesReportStoreScope, StoreReports, StoreOperations, StorePromotions, CartRecovery,
  SalesReports, AccountingStatements, MantleSearch 42 of 42; BOSS CommerceReports, CommerceAccess, CommerceOrders,
  AccountingReporting, AccountingAccess 38 of 38. mr-marble's SalesSummary render is in its acceptance SimpleScreensRender,
  which cannot run alone (it depends on AccountingActivities); its call passes no new parameter, read rather than run.
- For the lead: F137 (bounds on the summaries' date histograms) is Sales'/Accounting's call; F143's ten acceptance
  failures were not checked against master here.
- **Wave 13 suites, gate C2/S2 (Nov 6, on master after Commerce P11 merged; the acceptance fix worker ran at the same
  time):** standalone mr-mantle 1,857 passed, 3 failed: the baseline two and ThemeAuthoring's forged preview token, which
  equalled the real one when that ended in "Q" (one run in 62; the spec now picks another letter); `./moq test-apps` 3,252
  server and 17 client features passed; lint as before. Feature time: server mr-mantle 371.6 of 383 s, mr-boss 246.7 of
  264 s, mr-pass 17.4 of 20 s; client mr-boss 52.2 of 57 s, mr-pass 8.1 of 9 s. Stage C2/S2 is done; mr-boss's
  acceptance failures (F143) are being fixed apart.
- **Wave 14 suites (Nov 6, on master after Shop P7 merged, nothing else running):** standalone mr-mantle 1,868 passed,
  2 failed (the baseline); `./moq test-apps` 3,264 server and 17 client features passed; lint as before. Feature time:
  server mr-mantle 365.8 of 383 s, mr-boss 246.4 of 264 s, mr-pass 17.4 of 20 s; client mr-boss 51.7 of 57 s, mr-pass
  8.3 of 9 s.

### P12 — Paid access and subscriptions

Design §4 Product360 paid access, §6 Subscriptions and SubscriptionDetail, §8 RecurringPolicy; COM-SUBSCRIPTION, with
Shop P7's records and coordinator. Ends stage C3/S3.

- **`ShopSubscriptionServices`' staff part** (R): `store#ProductSubscriptionResource` (`COMMERCE_SUBSCRIPTION_MANAGE`;
  resources with installed handlers only, the handler names read only; a change applies to later purchases; removing
  one with live subscriptions refused naming the count), `find#StoreSubscriptions` (the store optional, for Sales'
  later mount), `get#StoreSubscription`, `cancel#RecurringContract` and `retry#Renewal` (`COMMERCE_SUBSCRIPTION_MANAGE`).
  RecurringPolicy, a CheckoutSettings group, edits offers through Shop P7's `store#RecurringOffer`
  (`COMMERCE_STORE_EDIT`), which also keeps `PublicSite.subscriptionUrl` (§4); readiness reports an outside address
  that differs.
- **Screens:** Product360's Paid access pane (PaidAccess, ResourceUse) in Commerce's context, Products showing the rows
  read only (X16); Subscriptions (SubscriptionFind, Subscriptions); SubscriptionDetail (Contract, Renewals, Access,
  CancelRenewal, RetryRenewal); CheckoutSettings' RecurringPolicy. PASS SiteDetail's subscription binding stays the
  operator's; the pane links it.
- **Specs:** BOSS `CommerceSubscriptions` (scope, a retry while unresolved refused, the pane's handler names read only).
- **Usable when** (design §12.2 scenarios 11 and 14): a subscription operator cancels a contract's renewal and the paid
  term stays; a retry resumes the failed occurrence and makes no second charge; a refund of one paid-access item revokes
  that source grant only.

**Built Nov 6 (P12)** (branch `com/p12`).
- Mantle:
  - `service/mantle/product/StoreSubscriptions.js` (new) and its services appended to `ShopSubscriptionServices.xml` (R):
    `find#StoreSubscriptions` (the store optional; by customer, product, resource, contract state and next renewal; billing
    and access apart, the latest renewal's outcome; at most 500 candidates, `truncated`), `get#StoreSubscription`
    (Contract, Renewals, Access; the method as type and last four, the consent recorded or why not; no evidence, provider
    profile or gateway), `cancel#RecurringContract` (at the revision, STALE_REVISION naming the current one; the paid term
    kept; RENEWAL_IN_PROGRESS while a payment is in flight), `retry#Renewal` (a PostingOperation `StoreRenewalRetry`: a
    double submit answers the first result; PAYMENT_UNRESOLVED while a payment is in flight, CONSENT_REQUIRED, NOTHING_TO_RETRY,
    NOT_RENEWING; then the coordinator's reopen and resume of that occurrence, each step in its own transaction, the call
    holding no lock), `get#ProductPaidAccess` (PRODUCT_CATALOG_VIEW or COMMERCE_VIEW; the rows with each resource's handler
    services read only, canEdit, the installed resources), `store#ProductSubscriptionResource` (add, change: the row in effect
    ended and its successor started, a row not yet started changed in place; end; RESOURCE_UNAVAILABLE for a resource whose
    init or any named handler is not an installed service, RESOURCE_BOUND, SUBSCRIPTIONS_LIVE naming the count) and
    `find#RecurringOffers` (RecurringPolicy's read: offers, off-session capability, the two notice emails, the subscriptions
    readiness, the paid-access products of the assortment). Reads COMMERCE_ORDER_VIEW or COMMERCE_SUBSCRIPTION_MANAGE, actions
    COMMERCE_SUBSCRIPTION_MANAGE, every one COMMERCE_VIEW and StoreAdmin.js' store scope (RECORD_UNAVAILABLE outside it; a
    product is the user's when it is in the assortment of one of their stores).
  - `ShopSubscriptions.js`: `stopRenewal` (cancel's core, now shared by cancel#Subscription, the staff cancel and the refund
    rule); Shop F112: `revokeLine` ends an automatic contract's renewal when the refund drops its paid-through (cancel-at the
    new paid-through, waiting occurrences closed, the base unscheduled; a renewal whose payment is in flight is left to
    settle); Shop F113: `run#Renewals` also claims each active contract whose renewal is due and whose period has no
    occurrence (`claimDue`, the one claim of `dispatch#Renewal`: the contract's lock and unique period, so the nightly
    hand-off and the job make one occurrence); `resumeWaiting` takes one occurrence; the staff module's helpers exported.
  - `ShopCustomer.js` (Shop F114): a card's end bumps each renewing contract's revision as it clears the consent.
  - `StoreOperations.js`: `get#StoreCustomer`'s subscriptions (Customer360) from StoreSubscriptions.js, failing alone.
- BOSS:
  - `screen/Commerce/Customers.xml`: Subscriptions (menu) and SubscriptionDetail (hidden);
    `Customers/Subscriptions.xml` (SubscriptionFind, the list with billing and access chips) and
    `Customers/SubscriptionDetail.xml` (Contract, Renewals, Access; CancelRenewal at the revision shown, RetryRenewal with
    its operation key, each only when the service says it may, and a note while a payment is in flight).
  - `screen/Shared/Product360/PaidAccess.xml` (PaidAccess with Add access, Change and End in Commerce; handlers read only;
    ResourceUse in Commerce) and its `subscreens-item` in Shared/Product360.xml; SharedContext.js gives Commerce the
    `PaidAccess` tab and the SubscriptionDetail link, and Products the tab read only (shown for a digital product).
  - `Settings/CheckoutSettings.xml`: Subscription offers (RecurringPolicy): New offer, Change, End through
    `store#RecurringOffer`, the off-session capability, the notice emails and the subscription address's readiness.
  - `template/CommerceCustomer360.xml`: the customer's subscriptions; Commerce.js `linkPaths` gains the two screens.
- Specs (all `--nobuild`):
  - Mantle `test/product/ShopSubscriptions` (11 features, 4.4 s; P12's 4 new features 1.46 s: the hourly job claims a due
    renewal, one occurrence and one declined charge with the nightly hand-off at once (F113), then the staff retry: refused
    while a payment is unresolved and for the reader, one charge, the same key answering alreadyApplied, NOTHING_TO_RETRY
    after; a refund of the latest term ends the renewal at the new paid-through and nothing is claimed again (F112); staff
    reads with the method masked (no CIM id, evidence or card number in the answer), the reader lists, another
    organization's operator and a store-limited member of the other store refused, a card's end bumping the revision (F114),
    the stale revision and the reader refused, the cancel keeping the paid term and unscheduling the base; paid access:
    installed resources only, RESOURCE_BOUND, a change starting a successor with existing subscriptions unchanged, the end
    refused SUBSCRIPTIONS_LIVE naming 5, Products' reader read only, the reader and the other organization refused).
  - BOSS `test/Commerce/CommerceSubscriptions` (2 features, 0.92 s: the operator's store-scoped list and detail, the retry
    refused PAYMENT_UNRESOLVED and the cancel RENEWAL_IN_PROGRESS while a payment is with the provider, the reader
    PERMISSION_DENIED, another organization's contract RECORD_UNAVAILABLE, the Services manager's retry PERMISSION_DENIED;
    the pane's handlers read only for the Services manager (no editor, no resources offered) and the Retail operator
    refused editing Services' product; Product360's Paid access tab and SubscriptionDetail each rendered once in qvt).
  - Also run, all pass: Mantle ShopCustomer, StoreOperations, StoreFulfillment, DunningRenewalExclusion,
    PaymentAttemptPurpose, Subscriptions, StoreAdmin, ShopCheckout (36); BOSS CommerceCheckoutSettings (its CheckoutSettings
    render now with RecurringPolicy), CommerceOrders, CommerceAccess, CommerceAssortment, CommerceStores, CommerceReports,
    CommerceRecovery, ProductsSharedContext, ProductsAccess, ProductsTools (59). Not run: `./moq test-apps` and the budget
    measure; the new feature time (Mantle about 1.5 s, BOSS 0.9 s) fits both budgets (365.8 + 1.5 of 383 s, 246.4 + 0.9 of
    264 s), so no raise is asked.
- Acceptance (usable when, design §12.2 scenarios 11 and 14): mr-pass `test/acceptance/ShopSubscriptionsInCommerce` (4 features
  on ZIZI_DIGITAL's demo offer, as ShopOrdersInCommerce needs mr-boss and ignores every feature without it; a spec-local
  subscription operator of Ziziwork Services, as the demo one works Retail): a verified buyer subscribes and the operator
  finds the contract, with Subscriptions, SubscriptionDetail and Customer360 opening for the operator in qvt; a declined
  renewal started by the hourly job is retried by the operator, one charge, the same key answering alreadyApplied; the
  operator cancels and the paid term stays; a refund of the first term revokes that source grant only (the renewed term's
  grant stays). `./moq accept mr-pass --spec ShopFixtures,ShopSubscriptionsInCommerce`: 7 of 7. Then `./moq accept mr-pass` once: server suite 40 features, 37 passed, 3 ignored (as before), 0 failed; client suite 41 of 41.
- Lint: `moqui lint --screens` (release binary), 132 sites as before, none in the new or changed screens.
- Inventories: no ss-inventory or usl-inventory row is designed for P12's screens (the staff services are new; the
  SubscriptionServices rows have no Commerce design path), so none changed.
- Design: design-commerce §2 (SubscriptionDetail's flat path), §4, §6 and §8 as-built notes; design-shop §10.2's as-built
  note (F112–F114).
- Decisions:
  - Shop F112 (the lead's decision): a refund of an automatic contract's latest term (its paid-through drops) ends the
    renewal at the new paid-through date, waiting renewals closed and the base unscheduled; a refund of an earlier term
    changes nothing else. The buyer starts again by subscribing (a new contract with its own consent); no staff restart is
    built, since staff never enter a card and the old consent belonged to the refunded term's contract.
  - Shop F113: the hourly job claims only active contracts whose period has no occurrence (a past-due one already has its
    period's), so an exhausted renewal never fills the job's batch.
  - retry#Renewal needs a recorded consent and refuses while any renewal payment is in flight or placed (the job looks it
    up); its operation is recorded only once it ran, so a refused retry may be sent again with the same key.
  - Paid access: a product is the user's when it is in the assortment of one of their stores (so a store-limited member
    edits only their stores' products); a change ends the row in effect at once (later purchases take the new terms).
    Products shows the tab only for a digital product.
  - Subscriptions is a Customers tab, SubscriptionDetail flat beside it, as P8's details are.
  - The P12 acceptance lives in mr-pass beside the Shop subscription scenarios, as P8's did (F106).
  - Shop F107 left for P15: binding the demo's access to a Forum paid category needs a Forum mount on ZIZI_DIGITAL (which
    changes CommerceFoundationWalk's expected mounts), a category made through the Forum's staff services on a site with no
    owner, `qualifyingSources` for subscriptions, the buyer's site membership and ShopSubscriptionScenarios' grant
    assertions; none of it is P12's rule work, and the site-bound grant already proves the source-bound revocation.
  - Shop F111's Commerce part is P12's editors (built); its ProductDetail subscribe action and trusted Vue enhancement are
    Shop's, Insights' exclusions Insights'.
  - No upstream fix: F112–F114 are Shop P7's own code.
- Findings (provisional):
  - **F144** A refund of a contract's latest term while a renewal payment is already with the provider leaves that
    renewal to settle: it activates and the contract's cancel-at moves to its end, so a refunded buyer can be charged once
    more in that window. Closing it needs the refund to wait for or void the in-flight attempt (Accounting's coordinator).
  - **F145** `find#StoreSubscriptions` lists store contracts only; the storeless Subscription rows of native sales orders
    for Sales' mount (design §6's Sales context) wait for Sales.
  - **F146** PASS SiteDetail's subscription binding is on each site's own host, not a BOSS route, so the Paid access pane
    names it instead of linking it.
  - **F147** Shop F114's second half stays: `dispatch#Renewal` and `run#Renewals` are anonymous-all (internal,
    allow-remote false), as the P7 review noted.

**Review Nov 6 (P12)** (branch `com/p12`). Checked against the phase, design-commerce §4/§6/§8 and impl-commerce §2: the
money paths (`retry#Renewal` through Shop P7's reopen and advance only, its PostingOperation answering a double submit,
PAYMENT_UNRESOLVED while a payment is with the provider, the coordinator's one charge per attempt; cancel at the revision,
the paid term kept, RENEWAL_IN_PROGRESS in flight; the shared `stopRenewal` taking the contract then its occurrences as the
steps do); F112 (refund), F113 (`claimDue` is the one claim, under the contract's lock and unique period) and F114; the
store scope and permissions of every new service, forged contract and product ids, Customer360's subscriptions (behind
get#StoreCustomer's COMMERCE_ORDER_VIEW); restricted values (the method as type and last four; no CIM id, evidence or
gateway); the paid-access editor (installed handlers only, successor rows, SUBSCRIPTIONS_LIVE; `activate` and the existing
ProductSubscriptionResource callers unchanged); no `valueOf` or float money in the new JS or screens; the Built note.
- **R1 (high, money)** F112 missed a refund of a past-due contract's only term: with every term revoked the paid-through
  moves to now, which is after the old paid-through, so the contract was not seen as dropped and kept renewing; the nightly
  hand-off then claimed a new period from the refund's time (a second charge of a refunded buyer) besides the waiting retry.
  `revokeLine` now counts any drop of what is still paid (nothing paid included). Spec: ShopSubscriptions "P12 review:
  refunding a past-due contract's only term ends its renewal; no new period is claimed (R1)" (fails without the fix).
- **R2 (medium, scope)** A product's paid access is the product's own, so a store-limited member (or another
  organization's operator) whose store also sells a product could change what another store's later buyers get.
  `productOf` now needs the product sold (current or coming, not excluded) only in stores the user works: PRODUCT_SHARED
  otherwise; get#ProductPaidAccess's canEdit follows. Spec: "P12 review: a product also sold in a store outside the user's
  scope is not theirs to edit (R2)".
- **R3 (low)** `store#ProductSubscriptionResource` with ended or change and no row failed with a script error (a null row);
  now RECORD_UNAVAILABLE (in the R2 feature).
- **R4 (medium, data)** PaidAccess's Change form posted only the access time and use limit and time: the successor row lost
  its thru date, sold-from/thru window and use role, and a change with a use time failed (its unit was never posted). The
  form now carries every term of the row. Checked by a one-off editor render (Commerce admin, qvt, no errors), not kept:
  the pane already renders once in CommerceSubscriptions.
- **R5 (low)** A change read the time twice, ending the row in effect and starting its successor a moment apart (a purchase
  in between found no paid access; the worker's paid-access feature failed about one run in six); one instant now.
- F144 re-checked and kept (not contained): once the provider approves a renewal asked before the refund, `applyStep`
  places it and `activate` gives that paid term (cancel-at moves to its end; nothing renews after). The buyer pays once more
  and gets the term paid for; stopping it needs a release (authorized) or refund (captured) of that payment from the
  coordinator, a gateway call outside the step's locks: Accounting's.
- Specs (`--nobuild`): Mantle ShopSubscriptions 13/13, five runs in a row (the review features 0.06 s and 0.15 s) with ShopCustomer,
  StoreOperations, StoreFulfillment, DunningRenewalExclusion, PaymentAttemptPurpose, Subscriptions, StoreAdmin, ShopCheckout:
  49/49; BOSS CommerceSubscriptions, CommerceCheckoutSettings, CommerceOrders, CommerceAccess, ProductsSharedContext,
  ProductsAccess 30/30; PASS ShopSubscriptions, ShopAccess 6/6. Acceptance not rerun (unchanged).
- For the lead: F144 as above; `run#Renewals`' due-contract batch is limited before contracts whose period already has an
  occurrence are filtered out, so more than `limits.batch` active contracts with a renewal in flight (held placements) would
  starve newly due ones until the nightly hand-off (low; filter in the query or page past them); a concurrent double submit
  of one retry key runs the coordinator twice (still one charge) and the second answers a duplicate-key error rather than
  alreadyApplied, as every `lib.operation` caller does.
- **Wave 15 suites, gate C3/S3 (Nov 6, on master after Commerce P12 merged, nothing else running):** standalone
  mr-mantle 1,874 passed, 2 failed (the baseline); `./moq test-apps` 3,271 of 3,272 server features (Commons Contacts
  read joe.developer's names from the paged "all" list, which the later apps' contacts had filled; each name is now its
  own search) and 17 client features passed; lint as before. Feature time: server mr-mantle 379.7 of 383 s, mr-boss
  256.8 of 264 s, mr-pass 18.7 of 20 s; client mr-boss 51.6 of 57 s, mr-pass 8.4 of 9 s. mr-mantle's budget raised by
  the share since Wave 10 (9.9 s) to 393 s (§4). Stage C3/S3 is done.

### P13 — Integrations and channel import

Design §9 Integrations, IntegrationDetail and ChannelImport; COM-CHANNEL.

- **`mantle.product.StoreChannelServices`** (I; `COMMERCE_CHANNEL_OPERATE`): `find#StoreIntegrations` and
  `store#StoreIntegration` over `SystemMessageRemote.productStoreId` with registered connectors and message types only
  (configuration and secrets stay the operator's); `find#StoreMessages`, `get#StoreMessage` (a safe summary, no raw
  payload or credential) and `retry#StoreMessages` (keeping the message and business identity); `prepare#`,
  `commit#` and `get#ChannelImport` over SystemMessage batches through the same connector path as API intake.
- **Deduplication:** by store, remote, message kind and external ID; a matching replay answers the original, a
  conflicting one is quarantined with its evidence.
- **EDI:** an `ScEdi` store's partner remote over the built X12 (E1) services; its rejected and quarantined
  transactions in IntegrationDetail. SPS (E2) is not built (Shop F14); a partner over it waits for it.
- **Registration later:** `retry#StoreMessages` as an Admin §14 recovery action and ChannelImport as an Admin §11 import
  target when Admin builds them (§7).
- **Screens:** Integrations (IntegrationFind, Integrations, NewBinding); IntegrationDetail (Binding, Messages,
  MessageDetail, RetryMessages, Mapping); ChannelImport (ImportSource, ImportPreview, ImportCommit, ImportResult).
- **Specs:** Mantle `test/product/StoreChannels` (dedup by the four keys, the conflicting replay quarantined, a failing
  message not stopping the batch); BOSS `CommerceChannels`.
- **Usable when** (design §12.2 scenario 12, its import half): importing a file with a duplicate and a conflicting row
  makes one order for the duplicate, quarantines the conflict, and finishes the other rows; retrying a failed message
  keeps its identity.

**Built Nov 6 (P13)** (branch `com/p13`).
- Mantle:
  - `entity/StoreChannelEntities.xml`: `mantle.product.store.StoreChannelConnector` (the registered connectors: message type,
    kind, direction, mapping version, `managedBy`, disabled); SystemMessageRemote gains `storeConnectorId`,
    `storeMappingVersion`, `storeMappingJson` (typed parameters, never credentials) and `storeDisabled`, audit-logged;
    SystemMessage gains `productStoreId`, `contentHash` and `duplicateOfMessageId` with the index of the four dedup keys
    (store, remote, `docType`, `messageId`); the import format enumeration (`SciCsv`, `SciJson`) and the SystemMessage status
    `SmsgStaged` with its transitions. `data/StoreChannelSetupData.xml`: the message types `StoreChannelOrders` (receive
    `receive#ChannelOrders`, consume `consume#ChannelOrder`) and `StoreChannelImport` (its receive refuses a post), and the two
    connectors `ChannelOrders` and `EdiX12` (the EDI administrator's).
  - `service/mantle/product/StoreChannelServices.xml` (P13's services at the top, `<!-- Feeds and channel health (P14) below
    -->` before the end) over `StoreChannels.js` (I): `find#StoreIntegrations`, `get#StoreConnectors`, `get#StoreIntegration`,
    `store#StoreIntegration` (a new binding stopped with an HMAC signature required; enabled only with an authentication
    method other than none, credentials set and the mapping complete, CREDENTIALS_REQUIRED, MAPPING_INCOMPLETE; store and
    connector fixed; EDI_MANAGED), `find#StoreMessages`, `get#StoreMessage` (the canonical fields, mapping findings, order,
    original, children, EDI documents, errors' first lines; never the text), `retry#StoreMessages` (operationKey on
    PostingOperation `StoreChannelRetry`, a reason, each item through `retry#StoreMessage` in its own transaction; a conflict
    CONFLICT_REVIEW), `receive#ChannelOrders` (the receipt kept first, each order its own message: new Received, a matching
    replay Consumed with `duplicateOfMessageId` and the original's order, a conflict Rejected with a `CONFLICT:` error naming
    what differs; the API path refuses a stopped or unauthenticated binding), `consume#ChannelOrder` (create#Order and
    create#OrderItem with the store's organization, currency and facility, the binding's customer and sales channel, the
    channel's prices, shipping and tax as items, calculations off; place#Order; a message whose order exists answers it),
    `refuse#ChannelImportPost`, `prepare#ChannelImport` (CSV or JSON, UTF-8, 2 MiB, 500 orders; a Staged batch, the same
    file answering the staged one), `get#ChannelImport` (the preview while staged, the outcomes once committed) and
    `commit#ChannelImport` (digest, reason; the orders through `receive#ChannelOrders` with the batch as parent, each consumed
    in its own transaction; PostingOperation `ChannelImport:{batch}` with the reason; a second commit answers it). Every staff
    service: COMMERCE_VIEW, COMMERCE_CHANNEL_OPERATE and StoreAdmin.js' scope (F51); RECORD_UNAVAILABLE outside it.
  - `X12.js`: `storeRetry(op, input)`, `retry#Document`'s and `retry#Receipt`'s work for a caller that checked its own
    permission and scope (StoreChannels' `retry#StoreMessage` for a store's partner), reachable from scripts only;
    `execute` keeps EDI_ADMIN.
  - `StoreOperations.js`/`StoreOperationsServices.xml`: `add#StoreOrderNote` (F111's "Log as note": an internal OrderNote on
    a store order or cart, COMMERCE_ORDER_VIEW and the scope, as `add#StoreRequestNote`).
- BOSS:
  - `screen/Commerce/Integrations.xml` became the area (Integrations, the default; ChannelImport; IntegrationDetail hidden;
    the line where P14's Feeds go); `Integrations/Integrations.xml` (IntegrationFind, the list with intake, credentials set
    or not, last success, failures, conflicts and health; NewBinding), `Integrations/IntegrationDetail.xml` (Binding,
    Mapping, the EDI partner's rejected documents and quarantined interchanges with their retry, MessageFind and Messages,
    RetryMessages with per-item results, MessageDetail), `Integrations/ChannelImport.xml` (ImportSource, ImportPreview,
    ImportCommit, ImportResult with the link to retry from IntegrationDetail).
  - F111: the root's `assist-prompt` "Group these failures by cause" (IntegrationDetail) and `response-action` "Log as note"
    (`Commerce/Orders/LogNote`, hidden in Orders: the answer's text in `noteText`, filed by `add#StoreOrderNote`);
    `skill/channel-retry.md`, `skill/aliases.json` (integration, retry), `test/skill-retrieval.json` (+4 cases; recall@3
    1.00, 14 of 14). The Product360 prompt is P15's.
  - Commerce.js: the P13 `linkPaths` (appended). Demo (BossCommerceDemoData.xml, appended): the marketplace customer
    `BOSS_COM_MARKETPLACE` and POPC_DEFAULT's binding of the same id, stopped with no credentials (an import needs none).
- Specs:
  - Mantle `test/product/StoreChannels` (3 features, 1.31 s alone: 0.44, 0.53, 0.34): binding, enabling waits for the
    operator's credentials, never returned; the reader, organization B and the store-limited staff member refused; intake
    by the four keys (a replay answers the original's order, a conflict with its `items.0.quantity 2 → 3` evidence, the same
    external ID on another binding a new order, one order per store and ID), a failing order not stopping its receipt, the
    safe summary (no extra field or text), retry after publishing keeping the message and external ID with a second submit
    answered and the conflict CONFLICT_REVIEW; a staged CSV previewed (duplicate, conflict, new, error), the same file staged
    once, an unregistered format and another digest refused, committed once (duplicate, conflict, applied, failed) with its
    reason; the EDI partner's exceptions with their first line only and its conflict NOT_RETRYABLE.
  - BOSS `test/Commerce/CommerceChannels` (2 features, 0.71 s alone, 0.37 s in a run of four specs): the channel operator's
    JSON import into the demo marketplace (new and error, applied and failed ITEM_UNKNOWN) and the one qvt render of
    IntegrationDetail with its MessageDetail and of ChannelImport's committed batch; Log as note for the store operator,
    refused the channel operator. CommerceAccess +1 feature (0.11 s): the channel operator lists the demo binding, the store
    operator is refused PERMISSION_DENIED, another organization's store's binding RECORD_UNAVAILABLE.
  - Also run, all pass: Mantle StoreChannels, EdiX12, StoreOperations (23 features), AuthorizeNetGateway, ShippoGateway,
    PayTraceGateway, StorePublication, ShopCheckout (59 features); BOSS CommerceChannels, CommerceAccess, CommerceOrders,
    CommerceSubscriptions (19 features, 5.9 s); `moqui test mr-boss --skills`. Not run: `./moq test-apps` and the budget.
- Acceptance: `test/acceptance/Commerce/CommerceChannelsScenario` (5 features), run once: 5 passed. The channel operator binds
  POPC_DEFAULT, enabled only after the operator's secret; two orders over `receive#IncomingSystemMessage` (the API path)
  made; a CSV with one of them unchanged, the other changed, a new one and an unsold product: one order for the duplicate,
  the conflict quarantined with `items.0.quantity 1 → 3`, the new order made, the failing one not stopping the rest; the
  product published and in PopcAllProducts, the retry keeps the message and external ID and makes its order once (the second
  submit answered; the item withdrawn again after); Integrations, IntegrationDetail and both ChannelImport steps in qvt
  with artifact authorization on. The mr-boss acceptance suite as a whole was not run.
- Lint: `moqui lint --screens` (release binary), 132 sites as before, none in the new screens.
- Inventories: no ss-inventory or usl-inventory row is P13's (SimpleScreens has no store integration screen; the tools'
  SystemMessage screens stay the operator's).
- Decisions (design §16 row "Integrations and channel import as built"):
  - A binding is the SystemMessageRemote with the store and a registered connector (StoreChannelConnector rows, each with a
    handler in StoreChannels.js); its mapping is a version and typed parameters (the customer orders are placed for, the
    sales channel) in `storeMappingJson`. Credentials, endpoint and authentication are set by the operator in the System
    tools; Commerce says only "Set" or "Not set".
  - A new binding starts stopped with HMAC required; enabling needs an authentication method other than none, credentials
    and a complete mapping; the API intake also refuses a binding whose authentication was later removed. A file import
    goes through a stopped binding (it needs no endpoint).
  - Dedup is by SystemMessage's store, remote, `docType` and `messageId` over the canonical order's hash (an order with no
    currency is in the store's); a replay is kept Consumed as a duplicate answering the original's order, a conflict
    Rejected with the differing fields in its error, never retried.
  - A channel order is placed, not approved (the seller's decision), at the channel's prices, with promotions, shipping and
    tax calculation off and shipping and tax as items; each line's product must be one the store sells now (the publication
    resolver); no ship-to in mapping version 1.
  - A batch is a SystemMessage of type StoreChannelImport, Staged until committed (a status of its own so no framework job
    consumes it); the commit's operation and reason are a PostingOperation `ChannelImport:{batch}`; the file is text read
    and checked (UTF-8, size, format), not a media file to scan.
  - EDI: an EDI partner is listed by its EdiConnection's store; Commerce lists its rejected documents and quarantined
    interchanges and retries them through X12.js' own retry with their identity (`storeRetry`), the channel operator's
    permission and scope standing for EDI_ADMIN's there; its connection stays the EDI administrator's.
  - Log as note is an internal OrderNote with COMMERCE_ORDER_VIEW, as P8's case note.
  - Home's Integration errors card is left to P14's integration card, so the two phases do not change Home together.
- Findings (provisional):
  - **F158** Home's "Integration errors" card is still Not configured: P14 builds Home's integration card, which can
    count `find#StoreIntegrations`' failures (or a count of StoreChannels' `failedCondition` per store).
  - **F159** P11's "intake error spikes" alert is not shipped: it needs a document over the store's channel messages
    (F140), and a feed on every SystemMessage write would index the gateways' and EDI's messages too. For Insights and the
    lead.
  - **F160** A failed channel order goes back to Received with a fail count (the framework's consume), so
    `consume#AllReceivedSystemMessages` (paused by default) would retry a business refusal such as ITEM_UNKNOWN up to three
    times before marking it Error. Harmless (identity kept, never two orders), but a consume service could end a business
    refusal in Error with `noStatusUpdate`; left as the framework's rule.
  - **F161** A replay of a failed original with other content is quarantined as a conflict: a channel that resends a
    corrected order under the same external ID has to be asked for a new one. A "replace the failed original" action (the
    original never made an order) would need its own rule and test; later.
  - **F162** The framework's SystemMessage statuses have no staged state; Mantle seeds `SmsgStaged` and three transitions
    for ChannelImport's batches. The framework could own a staged status for batches that wait for a person.
  - **F163** Mapping version 1 has no ship-to or buyer: a marketplace order is placed for the binding's customer with
    no address, so a physical marketplace order needs its address entered by its owner before shipping; a version 2 with
    an address crosswalk (as EDI's EdiLocation) is for a real channel.
  - **F164** `Commerce/Integrations.xml` is no longer a placeholder, so mr-boss's acceptance AppStructure floor of
    placeholder screens drops from 40 to 39.

**Review Nov 6 (P13).** Checked: the API intake (the framework's `/rest/sm` checks the remote's method, and an HMAC
remote with no header name or secret is refused there; `receive#ChannelOrders` also refuses a stopped binding and one whose
method is none or unset, takes the store from the remote only, and the endpoint passes no `parentMessageId`; SmatLogin stays
allowed, a logged-in user authorized for `receive#IncomingSystemMessage`); credentials and texts never returned by a service or
screen (the screens call only the services); dedup by the four keys under the remote's row lock (concurrent intakes of one
remote serialize, so no unique index is needed; replays and conflicts share the keys, so one could not be unique); orders
placed for the binding's customer at the channel's prices with decimals read by their methods; the staged batch, its digest
and PostingOperation; the file text-only decision (UTF-8, 2 MiB, a registered format; nothing is rendered or run, so no scan:
accepted); `storeRetry` (only from scripts: X12.js' `execute` passes one argument, so `checked` is never set by a service; its
caller checks COMMERCE_CHANNEL_OPERATE, the store scope of the EDI connection's store and that the document or receipt is
the binding's: kept); every staff service's scope; `add#StoreOrderNote` (COMMERCE_ORDER_VIEW, the order scope, internal);
Mantle defaults (new fields nullable, the new status and transitions unused by existing flows; EDI's retry unchanged).
- R1 (medium; mr-mantle 46b1aeeb) Two concurrent consumes of one channel order (the framework's consume job, a retry, a second commit of a batch:
  consume#ReceivedSystemMessage does not lock the message) could each make an order. `consume#ChannelOrder` now locks the
  message for its transaction, so the second finds the order and answers it.
- R2 (medium; mr-mantle 46b1aeeb) An order kept as it came because it was unreadable (an external ID too long or with control characters, not an
  object) was in error and listed as retryable; a retry consumed its raw text as if canonical, making an order with no external
  ID or dedup. Such a message is no longer retryable and `consume#ChannelOrder` refuses one without its hash and external ID
  (ORDER_UNREADABLE). StoreChannels' intake feature checks it, and the API intake's BINDING_DISABLED and
  BINDING_UNAUTHENTICATED refusals (not checked before).
- R3 (low; f284354e) CommerceAccess.spec.js had been reformatted by Prettier in four earlier features; restored to its base with the P13
  feature appended (append-only).
- Specs (`--nobuild`): Mantle StoreChannels, EdiX12, StoreOperations, ShopCheckout, AuthorizeNetGateway, ShippoGateway,
  PayTraceGateway, StorePublication (82 features, pass; StoreChannels 1.65 s); BOSS CommerceChannels, CommerceAccess,
  CommerceOrders (17 features, pass). The acceptance spec was not changed or run.
- For the lead:
  - Two concurrent `commit#ChannelImport` calls of one batch (a double submit) both pass the Staged check (the claim is not
    atomic: a lock on the batch would deadlock with the commit's own new-transaction updates of it). R1 keeps their orders
    single; the second ends with a PostingOperation key error. A claim row made first (the PostingOperation as pending) would
    answer it cleanly.
  - The commit's digest is the file's (with format, remote and mapping version), not the preview's outcomes: an order received
    between preview and commit changes an outcome without BATCH_CHANGED (dedup still holds).
  - A binding's customer may be any Customer-role party not private to another user, not only the organization's customers.
  - A replay of a failed original is kept as a duplicate with no order, and keeps none after the original is retried.
  - `importText`'s 2 MiB limit counts characters, not bytes (the file path counts bytes).

### P14 — Feeds and channel health

Design §9 Feeds and FeedDetail, §3 ChannelHealth; COM-FEED. Ends stage C4/S4 with Shop P8.

- **`ProductStoreFeed`** and its builds (`mantle.product.store`): registered formats and destinations only; a build is
  an immutable artifact over Shop's public catalog projection with its generation, rows, skips and errors; publish
  activates a complete build; a withdrawal after the build's generation blocks serving it until a rebuild without the
  item is ready; a fatal build leaves the previous artifact active.
- **StoreChannelServices** (`COMMERCE_CHANNEL_OPERATE`): `find#StoreFeeds`, `store#StoreFeed`, `build#StoreFeed`,
  `get#FeedBuild`, `publish#StoreFeed` and `get#ChannelHealth`; the feed job, each feed its own transaction.
- **Serving:** besides the pushed destinations, one registered destination kind, the store's Shop site: mr-pass serves
  the active build at a reserved feed path under the Shop mount, checked against the current generation, with its route
  in Routes.js and its path in the aligned reserved list (design-commerce §9, design-shop §13.2).
- **Screens:** Feeds (FeedFind, Feeds, NewFeed); FeedDetail (FeedConfig, FeedBuilds, FeedPreview, PublishFeed);
  ChannelHealth with ReportScope; Home's integration card.
- **Specs:** Mantle `test/product/StoreFeeds` (a withdrawn product never served, a rebuild not resurrecting it, a
  skipped product named); BOSS `CommerceFeeds`.
- **Usable when** (design §12.2 scenario 12, its feed half): a feed of POPC_DEFAULT builds and publishes; withdrawing a
  product makes the feed unavailable until the next build leaves it out.

**Built Nov 6 (P14)** (branch `com/p14`).
- Mantle:
  - `entity/StoreFeedEntities.xml` (new): `mantle.product.store.ProductStoreFeed` (store, Shop site, name, `feedKey`, a
    registered format and destination, the store's locale and currency, category scope, `includeImages`,
    `includeUnavailable`, schedule, `activeBuildId`, `fromDate`/`thruDate`, `changeReason`; key fields audit-logged) and
    `ProductStoreFeedBuild` (never changed once written: complete with its artifact, sha-256 digest, size, content type,
    the site's generation it read, row products, skips, errors and sample rows, or failed with its code and text); enums
    `StoreFeedFormat` (PsffGoogleXml, PsffCsv, PsffJson), `StoreFeedDestination` (PsfdShopSite), `StoreFeedSchedule`,
    `StoreFeedBuildStatus`.
  - `service/mantle/product/StoreChannelServices.xml` (new, only the `<!-- Feeds and channel health (P14) below -->` marker
    and P14's services, for the lead's splice with P13) over `StoreFeeds.js` (new): `find#StoreFeeds`, `get#StoreFeed`,
    `store#StoreFeed`, `build#StoreFeed`, `run#StoreFeedBuild` (the build step, its own transaction), `get#FeedBuild`,
    `publish#StoreFeed`, `get#ChannelHealth`, `run#StoreFeeds` (the job) and `get#ShopFeed` (anonymous, the PASS operation
    `getShopFeed`). Staff services: COMMERCE_CHANNEL_OPERATE with COMMERCE_VIEW in StoreAdmin.js' store scope. Only
    registered formats (`FORMAT_UNREGISTERED`) and destinations (`DESTINATION_UNREGISTERED`); the site's Shop must sell from
    the store (`SITE_INVALID`); locale and currency the store's; one current feed per site and key (`FEED_KEY_TAKEN`); a
    change at the feed's revision (`STALE_REVISION`), a change of site, key, format or category clears the active build. A
    build reads only ShopCatalog.js' projection (its exports gain `publishedIds`, `publicOf`, `cards`, `contentTexts`,
    `plainText`): the store's published candidates (in the category tree when scoped), the resolver's public ones, their
    cards and store descriptions, chunks of 100, a product the projection cannot read an error and the others go on; skips
    with their code (`NOT_SELLABLE`, `VARIANT_EXCLUDED`, `PRICE_UNAVAILABLE`, `NOT_PURCHASABLE`, `ROW_LIMIT`); rows carry only
    id, SKU, title, plain description, absolute links on the canonical host, image link, price and sale price text,
    availability and badge. A fatal problem (`SITE_UNAVAILABLE`, `HOST_REQUIRED`) is a failed build recorded outside the
    build's transaction, the active build unchanged. Publish: an operation key (`PostingOperation` StoreFeedPublish, a retry
    answers the first result), the revision, a complete build of the feed's format (`BUILD_INCOMPLETE`, `BUILD_OUTDATED`),
    every product still public (`BUILD_STALE` naming them). Serving: the active build of a current Shop-site feed by key and
    extension, at its own generation as is, after it only when every row product resolves public now (remembered in the
    `mantle.product.feedServing` cache by build and generation), else NotFound `FEED_UNAVAILABLE`. The job builds each due
    hourly or daily feed through a probe (its own transaction) and publishes a complete build with no errors; a failure is a
    failed build of that feed and the others go on. `get#ChannelHealth`: the stores' SystemMessages through
    `SystemMessageRemote.productStoreId` for a period (30 days by default, at most two years), by store, remote and type
    (received, processed, errors, retried, last success; only those fields are read, never a payload or remote secret,
    10,000 messages at most), the current feeds (last complete build, rows, skips, failed builds in the period, latest
    failure, blocked by a withdrawal) and totals.
  - `data/MantleSetupData.xml` (appended): the `run_StoreFeeds` ServiceJob (hourly, it acts only on scheduled feeds).
    `PublicApps.js` `reservedPaths` gains `feeds`. Mirrors: `forum/ForumSchema.js` and `script/PassRoutes.js` gain
    `getShopFeed` (`GET shop/feeds`), identical to mr-pass's.
- mr-pass: `service/pass/Schema.js` and `Routes.js` (appended) `getShopFeed`; `Contracts.d.ts` its input and `ShopFeed`;
  `resolve#Route` sends `feeds/{key}.{xml|csv|json}` under the Shop mount to `/Shop/feed` (anything else under `feeds/`
  Not Found); `screen/Shop.xml`'s `feed` transition over `screen/Shop/ShopFeeds.js` (new): the build's content type,
  `no-store`, `nosniff`, an ETag of the digest; 404 for a refused feed, 503 when the authority cannot answer. README's spec
  list.
- BOSS:
  - `screen/Commerce/Integrations.xml` is an area: Feeds (the default until P13's list) and FeedDetail.
    `Integrations/Feeds.xml` (FeedFind: store, site, format, state; the list with address, serving build and last build;
    NewFeed) and `Integrations/FeedDetail.xml` (header with Build now and End feed; FeedConfig; FeedBuilds; FeedPreview of
    the chosen build: sample rows, skips with product names, errors, Download; PublishFeed with the build's counts and
    generations, an operation key and the revision; the withdrawn products named when a build cannot be served).
  - `screen/Commerce/Reports/ChannelHealth.xml` (ReportScope: store, period; totals cards, Channel messages, Product feeds
    opening FeedDetail; CSV) over `ReportingServices.get#ChannelHealth` (Reporting.js `channelHealth`: Reports and
    `channelOperate`, the catalogue entry shown to a channel operator only); `Reports.xml` gains it. Home's Integration errors
    card: a channel operator's attention total of the last 30 days, opening Channel health (`—` for others).
  - Commerce.js (appended) linkPaths `Integrations/Feeds`, `Integrations/FeedDetail`, `Reports/ChannelHealth`.
  - `report/boss-commerce-feed-builds.json` (dataset) and `boss-commerce-feed-build-failures.json` (alert template, design
    §1.4's feed build failures), over the DataDocument `BossStoreFeedBuild` (metadata only, never the artifact) and its
    own feed `BossCommerceFeedBuilds` (appended to `data/BossCommerceReportData.xml`, ADMIN only).
- Specs (`--nobuild`):
  - Mantle `test/product/StoreFeeds` (4 features, 1.16 s): unregistered format and destination, another currency, a taken
    key, the reader and another organization refused, the public path; a build of two rows with the unpriced product's skip
    named, the sample's fields exactly the projection's, publish refused stale then published, a retry answered first, the
    XML escaped with the price and canonical link, another extension and an unbuilt feed Not Found; a withdrawal blocking
    serving and the old build's publication (`BUILD_STALE`), the rebuild at the next generation without it published and
    served; a fatal build (`HOST_REQUIRED`) with the active build still served, the job publishing one scheduled feed past
    another failing, channel health's message counts with no secret or payload and both failing feeds.
  - mr-pass `test/Shop/ShopFeeds` (1 feature, 0.06 s): the route (and two refused paths), the CSV through the local facade
    and a remote frontend alike, another extension and an unknown key 404, a withdrawal 404.
  - BOSS `test/Commerce/CommerceFeeds` (2 features, 0.30 s, on a spec store of Ziziwork Retail with its own site, so the
    demo store's sites stay as they are): FeedDetail (preview, publish action, a product) and Feeds rendered once each
    (qvt); Channel health for the channel operator, its catalogue entry, the merchandiser refused. `CommerceAccess` +1
    feature (0.10 s): the channel operator lists the demo store's feeds, the merchandiser is refused, another organization's
    store is refused.
  - Also run, all pass: Mantle ShopCatalog, StorePublication, SitePages, PassAuthority, StoreAdmin (37 features with
    StoreFeeds); mr-pass ShopAccess, ShopCatalog, Forum, Integrations, Portals, Transport (30 with ShopFeeds); mr-boss
    CommerceAccess, CommerceReports, CommerceStores, CommerceSitePages, CommerceRecovery, CommerceAssortment,
    CommerceSubscriptions, CommerceOrders (33 with CommerceFeeds). Not run: `./moq test-apps` and the budget measure.
- Acceptance: `test/acceptance/Commerce/CommerceFeedsWalk` (mr-boss, 3 features): the channel operator starts a Google Merchant
  feed of POPC_DEFAULT on a walk site with Shop at `/` through Feeds' and FeedDetail's transitions, builds and publishes it,
  and `/feeds/{key}.xml` routes to the feed and serves it with the product and canonical links; the publisher withdraws a
  product in it, the feed is 404, FeedDetail names the product, the old build's publication is refused, the rebuild
  published serves it without the product; Channel health (qvt), Home and Feeds (html) rendered. The walk removes its site
  and feed afterwards and puts the product back. Run once: 3 of 3 passed.
- Lint: `moqui lint --screens` (release binary), 132 flagged sites as before, none in the new or changed screens.
- Inventories: no ss-inventory or usl-inventory row is a feed or channel health form (they are new, design §2's `new C4`
  rows), so no Implemented-in column changes.
- Design: design-commerce §9 FeedDetail and design-shop §13.2 have as-built notes.
- Decisions:
  - A feed is changed in place at its revision with its key fields audit-logged and a reason, not as dated rows (§2 lists
    feeds among the dated rows): its builds and its public path hang off one identity, and ending it (`thruDate`) is its
    date. A change of site, key, format or category takes the published build down.
  - Locale and currency are the store's: Shop's projection sells in the store's only, so a feed in another is refused.
  - The serving check after the generation moves re-resolves the build's products (every publication change advances the
    generation, not only withdrawals), remembered per build and generation; serving is `no-store` so a withdrawal is
    immediate.
  - The job publishes a complete scheduled build only when it has no errors; a manual build is never published by itself.
  - A virtual product is one row at its lowest public variant price (the projection's card), not one row per variant.
  - The Shop site is the only registered destination; pushed destinations register with P13's connectors.
  - Integrations is an area with Feeds as its default until P13's Integrations list joins it (merge note below).
  - The BOSS spec runs on its own store and site: a Shop site added to the demo store changed CommerceStores' `siteText`.
- For the lead (merge with P13): splice `StoreChannelServices.xml` at the marker; `Integrations.xml` gets P13's subscreens
  (Integrations, IntegrationDetail, ChannelImport) and its default; ChannelHealth's remote rows can link P13's
  IntegrationDetail once it exists (`sharedLinks['Integrations/IntegrationDetail']`); P13's intake error spikes alert
  appends its own DataDocument to `BossCommerceReportData.xml` as this phase did.
- Findings (provisional):
  - **F150** ShopCatalog.js `publishedIds` stops at 2,000 candidates (`limits.candidates`), so a feed of a larger store
    lists at most its first 2,000 published products (the feed's own row bound is 5,000); a feed needs a paged candidate
    read of the publication rows.
  - **F151** Every publication change of a store's sites (pages, menus, themes as well as products) advances the
    generation, so a served feed is re-resolved once per generation change (cached per node). A record of each withdrawal's
    generation would let serving check only the products withdrawn after the build.
  - **F152** Prices and stock do not advance the generation (impl-shop P3 R5), so a served feed keeps its build's prices
    and availability until the next build; a scheduled feed bounds it.
  - **F153** The demo has no feed: the demo Shop sites are disabled until published (Shop P1), so a demo feed of
    POPC_DEFAULT could not build on a fresh load; the walk makes its own site.

**Review Nov 6 (P14)** (branch `com/p14`). Checked against the phase, design-commerce §9 and §3 ChannelHealth, design-shop
§13.2 and impl-commerce §2: public serving (get#ShopFeed by the host's site only, the feed's store the site's Shop's, a
disabled or unpublished site NOT_AVAILABLE and a refused feed FEED_UNAVAILABLE, both NotFound so PASS answers 404; rows
of the card's public fields only, no cost, internal id, variant or other store's data; the build's content type,
`no-store`, `nosniff` and the digest's ETag; `feeds` reserved in PublicApps.js and routed only for
`feeds/{key}.{xml|csv|json}` to `/Shop/feed`, no other Shop transition reachable); builds written once (no update of a
build anywhere), publish under the feed's lock with its operation key and revision, BUILD_INCOMPLETE/OUTDATED/STALE, a
fatal build recorded with the active build kept; the store scope and COMMERCE_CHANNEL_OPERATE in every staff service,
forged feed, build and store ids refused, channel health reading only counts and descriptions (no payload, URL or
secret); the ShopCatalog.js exports; decimals (prices are the projection's money text, no arithmetic or `+` on a decimal
in the writers, screens or Reporting.js); the Built note.
- **R1 (high, restricted values)** A manual build ran the projection as the signed-in operator: `shopOf` names the
  user's party as the customer and get#StoreProductPrice gives a customer's own price rows, so the operator's (or any
  staff member's customer-specific) price went into the public artifact. `project` now builds a visitor's projection
  (`customerPartyId` null). Spec: StoreFeeds' build feature with an operator-only mug price (fails without the fix).
- **R2 (high, serving)** A withdrawal scheduled ahead advances the generation when it is scheduled, not when it takes
  effect, so a build made in between served the product after its row ended (serving checked nothing at the build's own
  generation). `servable` now also re-resolves when a ProductStoreProduct or ProductStoreCategory row of the store started
  or ended after the build started (four one-row reads per serve), keyed by that instant. Spec: StoreFeeds' last feature
  ends the mug's row without a generation change and the feed is refused (fails without the fix); it also checks the
  site unpublished (NOT_AVAILABLE) and another site's key (FEED_UNAVAILABLE).
- **R3 (medium, F150 contained)** The build pages the store's publication rows itself (`candidatesOf`: ShopCatalog.js
  `publishedIds`' rule, 1,000 rows a read, at most 50,000 candidates, the category tree applied as it reads) instead of
  Shop's 2,000-candidate list; past the 5,000-row bound the rest are ROW_LIMIT skips without being projected. The
  `publishedIds` and `publicOf` exports, which nothing then used, are taken back out (ShopCatalog.js only adds `cards`,
  `contentTexts`, `plainText`). F150 can close.
- **R4 (medium, job)** run#StoreFeeds held one transaction for the whole run: each feed's schedule stamp and failure
  record locked that feed's row until the last feed was built (a staff edit or publish waited up to the 30-minute
  timeout), and a rollback at the end lost every failure record. The job is now `transaction="ignore"`; each build stays
  its own transaction.
- **R5 (low, scalability)** The `mantle.product.feedServing` cache had no conf entry (unbounded, one key left behind per
  generation change): mr-mantle MoquiConf.xml bounds it (2,000 entries, a day).
- Decision 1 (feeds changed in place, not dated rows) is acceptable: a feed is a binding with one identity that its builds
  and public path hang off, its key fields (and its reason) are audit-logged, ending it is its `thruDate`, and every build
  records the format, locale, currency and generation it was made with; an as-of read of a feed's settings is the audit
  log's. §2's list should name feeds among the records of their own rather than the dated rows.
- Specs (`--nobuild`): Mantle StoreFeeds 4/4 (1.27 s) with ShopCatalog, StorePublication, SitePages, PassAuthority,
  StoreAdmin: 37/37; mr-pass ShopFeeds, ShopAccess, ShopCatalog, Transport, Integrations: 15/15; BOSS CommerceFeeds,
  CommerceAccess, CommerceReports, CommerceStores, CommerceSitePages: 24/24. Acceptance not rerun (unchanged).
- For the lead: `store#StoreFeed` accepts any category id (only its existence is checked), so a feed's category name can
  be another organization's (rows stay the store's published products; low); `find#StoreFeeds` reads at most 200 feeds
  before the state filter and paging (low); a category membership change scheduled ahead (ProductCategoryMember of an
  allow list) takes effect without a generation change and is not in R2's check (low; the publication and store category
  rows are); the remote frontend carries a feed's whole artifact in one answer (5,000 rows of up to 5,000 characters of
  description can be large; a streamed or paged answer would bound it).
- **Waves 16–17 suites, gate C4/S4 (Nov 6, on master after Commerce P13 and P14 and Shop P8 merged, nothing else
  running):** standalone mr-mantle 1,888 passed, 2 failed (the baseline); `./moq test-apps` 3,295 server and 17 client
  features passed; lint as before; after the P13/P14 splice, acceptance AppStructure (floor 39), CommerceFeedsWalk and
  CommerceChannelsScenario 26 of 26. Feature time: server mr-mantle 369.8 of 393 s, mr-boss 240.8 of 264 s, mr-pass 17.0
  of 20 s; client mr-boss 51.3 of 57 s, mr-pass 8.2 of 9 s. Stage C4/S4 is done.

### P15 — Finish

- The tui and server-static screen sweeps of Commerce, one acceptance test per mode (each screen's twin is built in
  its phase).
- The design §12.2 end-to-end review, acceptance tests (§8): a Commerce user with no other launcher is refused costs,
  credentials, other organizations' stores and other stores for a store-limited member, through URLs, shared contexts,
  exports, previews, the palette, search and choices.
- The §13 outputs not built earlier: the store readiness and configuration summary (CSV and print, credentials
  redacted).
- The inventories' **Implemented in** columns, the design's Impl column, and Remaining-Work; the mr-boss README's
  Commerce line.

**Built Nov 7 (P15)** (branch `com/p15`; Shop P9 built beside it).
- Mantle:
  - `service/mantle/product/StoreSummary.js` (new) and `StoreAdminServices.get#StoreSummary` (appended): the store's readiness
    findings and grouped settings (general, sites, facilities, staff, emails, order checks, search and content, settings,
    checkout) through get#Store, get#StoreSites, check#StoreReadiness and get#CheckoutSettings, each checking COMMERCE_VIEW
    and the store's scope again; credentials redacted (no gateway configuration read, a carrier account "set, [redacted]",
    a value named as a credential `[redacted]`); a section that cannot be read named and the rest made; CSV (formula cells
    behind an apostrophe) and a printable HTML page, escaped (design §13).
  - The routed findings (§6): StoreReviews.js (F101–F105; `remove#ReviewImageFile`, appended to
    StoreMerchandisingServices.xml), AccountHub.js and StoreTopics.js (F124's `choices.decline`, `declinePending`),
    CartRecovery.js, ShopCart.js and `StoreCartAccess.recoveryHandledDate` (F133), ShopSubscriptions.js `dueContracts`
    (F148), StoreFeeds.js (F154, F156), StoreChannels.js and `claim#ChannelImport` (F165, F167–F169).
- mr-pass: Account's EmailPreferences decline box (Hub.js, F124); Shop's Review page when the store removed the buyer's
  review (ShopReviews.js, F101); ShopReviews passes the revision a decision and reply now need (F102).
- BOSS:
  - StoreDetail's More menu: Print summary and Export summary (CSV) (`printSummary`, `exportSummary`, each after
    `check#Record`).
  - Commerce.xml (appended): Product360's assist-prompt "Summarize recent reviews" (F111).
  - The demo (impl-shop F107): ZIZI_DIGITAL's Forum mount (Demo.js `ensureSite`), and its members' Forum category made
    through the Forum's staff services (`store#Category`, `set#CategoryAccess`: members of the category, published,
    subscription and manual grants qualifying) with the monthly membership's paid access bound to it
    (`store#SubscriptionBinding`), from a data file of its own, `BossZZCommerceForumDemoData.xml`
    (`DemoServices.load#CommerceForumDemo`; F171); a database loaded before has its site binding moved while no
    subscriber's grant names it.
  - CommerceSpecLib (appended): `sweepScreens` (the files under the root and each shared screen an area mounts with its
    tabs, 118 screens), `sweepParameters` and `sweepParametersOf` (the demo's records).
- Specs (regression; feature time added, all under a second):
  - Mantle: StoreReviews (5 features; the new one 0.63 s, and REVISION_REQUIRED in the approval feature), ShopCustomer
    (5; the new one 0.35 s), CartRecovery (4; the mark in the job and link features), ShopSubscriptions (14; the new one
    0.09 s), StoreFeeds (5; the new one 0.14 s), StoreChannels (4; the new one 0.39 s), StoreCheckout (5; the summary
    0.11 s). About 1.8 s in all. Also run, all pass: ShopCart, ShopCheckout, ShopOperations.
  - BOSS: CommerceAccess (15; the prompt in the menu feature), CommerceReviews (2; real revisions in its keys),
    CommerceStores, CommerceChannels, CommerceFeeds, CommerceRecovery, CommerceSubscriptions, all pass.
  - mr-pass: ShopReviews (2), ShopAccount (3), pass.
- Acceptance (written here; each run once): CommerceTui (2 features, 6.2 s: 118 screens in tui as model documents with
  no error node, as commerce.admin with authorization on; the demo has no store cart, contract, feed or store return, so
  those four detail screens render their "not available" state, F173), CommerceServerStatic (1 feature, 16.2 s: none
  marked; 10 clean, 2 stays, 102 with violations, F172), CommerceIsolationWalk (4 features, 3.4 s: design §12.2's
  review, below). Changed and run: CommerceFoundationWalk (5 of 5: the Forum mount and the members' category),
  CommerceReviewsScenario (3 of 3: revisions passed), mr-pass ShopFixtures and ShopSubscriptionScenarios (7 of 7: the
  buyer, a site member, gets the members' category and reads it, which they could not before).
  - CommerceIsolationWalk: commerce.read (Commerce alone in the launcher) gets no cost, supplier price or margin from the
    shared catalog context and nothing from Product360's cost and supplier tabs by URL; the configuration summary (CSV and
    print), checkout settings and an integration (as the channel operator, a secret set on the binding) show no
    credential; commerce.read and the store-limited commerce.storestaff are refused BOSS_COM_DIGITAL (another
    organization's store, and another store of the member's own organization) on StoreDetail and its tab,
    CheckoutSettings, Assortment, StoreCategories, its theme, another organization's Customer360, the catalog context's
    stores, the summary's CSV and print, OnlineSales' CSV, the theme preview, the palette, the order search, the store
    search, the store choices and check#Record, while their own POPC_DEFAULT opens on the same screens.
- `./moq accept mr-boss` once at the end: 85 specs, 482 features: 480 passed, 2 failed (468.9 s), all 57 Commerce features passing. The 2 are Customer Service's, run just after local midnight and reading the clock: CustomerServiceAssignmentWalk's round robin (agents' working hours: neither agent was in hours at 00:30) and CustomerServiceOrdersWalk's StockAtDate (the as-of day, local versus UTC, was a day off). Neither uses this phase's code; not rerun at another hour.
- Lint: `moqui lint --screens` (release binary), no flagged site in the new or changed screens.
- Inventories: usl-inventory's 34 rows with a Commerce or `PASS:Shop` Designed-in path and no Commerce or Shop
  Implemented-in now name the screen or page, or `—` with what Commerce or Shop does instead (Commerce's OrderDetail is
  read only); ss-inventory's Commerce rows were filled by the phases, and Shop's pages carry no staff form (impl-shop F59),
  each with a dated note. Design: §2's Impl column names each screen's phase; §4 Reviews (F101, F102) and §13 (the summary
  built); design-shop §9 EmailPreferences (F124's decline). mr-boss README: the Commerce line.
- Decisions:
  - F101: deletion is final, the conservative call: an author whose review was deleted cannot write another or edit it.
  - F103 serializes an account's submissions on its own account row (as the Forum's receipts do), not a unique key, which
    would act on every ProductReview, Commerce's or not.
  - F124 is a decline box per waiting choice, not the unchecked box: a waiting choice shows unchecked, so a save for
    another reason would end it.
  - F133 marks only outcomes that hold for the visit (queued, already sent, at the most sends); a cart refused for its
    consent or verification is read again, since the shopper may turn reminders on within the window.
  - F167: a shared (`_NA_`) customer still qualifies, as Commerce's own customer rule has it; a party's owner defaults to
    `_NA_`.
  - The summary is Mantle's (a read over the store services), StoreDetail's print is the HTML page the browser prints
    (no PDF engine needed).
  - The sweeps run over the root's files and the shared screens its areas mount with their tabs, on the demo's records
    (no route fixtures, §2); the isolation walk calls services as the screens do (artifact authorization off for the call,
    the service's own checks answering) and renders screens with it on.
- Findings (provisional):
  - **F170** The DownloadFirstRequestReview SECA queues the request after the commit, on a worker: a spec waits for it.
    CommerceReviews' selection keys carried `NaN` revisions and passed only because a missing revision was accepted (F102).
  - **F171** The Forum's writes lock the operator's account row (`lockActor`), which a data load's transaction holds once
    it signs the demo administrator in, so a demo step in a transaction of its own waits on it until the statement
    timeout; the Forum demo runs in its own data file's transaction.
  - **F172** The server-static report: no Commerce screen is marked; 10 of 114 are clean (ChannelImport, PriceLists,
    StoreCategoriesTui, LogNote, CategoryDetail's FeatureDefaults, Identifiers and Summary, InventoryAvailability's Policy
    and Projection, PageDetail's PageText), 2 stay, 102 have violations; its wrapped-ec render fails with "not a function"
    on Stores/Stores and StoreDetail/General (both render in html, qvt and tui).
  - **F173** The demo has no store cart, recurring contract, feed or return of a store order, so the sweeps render those
    detail screens on their "not available" state unless an earlier walk of the run made one.
  - **F174** Product360's tabs outside Commerce's context (Costs, Suppliers, PurchaseHistory, …) are still addressable
    under Commerce; their conditions keep them empty (the walk checks no cost or supplier price shows).
  - **F175** F165 and F103 are checked as their claim and lock, not with two threads; F148 reads at most 20 pages of the
    batch size (2,000 contracts at the default) before giving up.
- Remaining for Commerce (the lead's Remaining-Work): §7 (gift cards and store credit, click and collect, the design's
  later scope, other apps' registrations and mounts, video help, EDI over SPS); F97 (the review request's not-before
  date), F142 (Insights' catalogue registration), F151, F157, F159, F161, F163 (Later); Shop F108 (the renewal email's
  action link) and F115 (an Authorize.Net sandbox check before production); F172's marking of Commerce screens
  server-static; F173's demo cart, contract, feed and return if the sweeps should render them on records.

**Review Nov 6 (P15)** (`git diff $(git merge-base master com/p15)..com/p15` in mr-mantle, mr-pass and mr-boss).
- Checked: get#StoreSummary field by field (each section reads through get#Store, get#StoreSites, check#StoreReadiness and
  get#CheckoutSettings, so COMMERCE_VIEW and the store scope hold, and another organization's store is refused before any
  section; a payment gateway is its description and capabilities, a carrier account "set, [redacted]"; no Mantle store setting
  type carries a credential today); the CSV's formula guard (=, +, -, @, tab and CR behind an apostrophe; values trimmed first)
  and the print page's escaping; StoreDetail's transitions (check#Record first). The routed fixes: F101 (submit refused, the
  Review page says so), F102 (every caller of moderate#Review and reply#Review passes a revision: Commerce's Reviews screen
  rows, selection keys, dialogs and reply withdrawal, the BOSS, PASS and Mantle specs; mr-marble has none), F103 (the account
  row lock), F105 (the file deleted by a commit-registered service, only under the reviews' root and when no image row names
  it), F124 (the decline box ends only the party's own pending membership), F133 (every write of lastActivityDate clears the
  mark: touch, attachCart, recoverCart), F148, F154, F156, F165 (the claim in its own transaction under the batch lock), F167,
  F168, F169, each with its spec feature. F107: the separate data file sorts after BossZCommerceDemoData.xml and runs
  load#CommerceForumDemo in the file's own transaction (where the Forum's lockActor takes the signed-in administrator's row
  with nothing else holding it); it is idempotent, and a database loaded before has its site binding moved only while no
  subscription grant names the site. The sweeps are in acceptance only, one per mode; CommerceIsolationWalk walks §12.2's
  refusals as the Built note lists. Inventories: 14 Implemented-in service names checked against the Mantle service files, all
  present; design §2's Impl column checked against the screen files.
- Fixes:
  - R1 (medium, F172): Stores/Stores and StoreDetail/General failed the server-static full check with "not a function":
    their locale drop-downs called `ec.l10n.getAvailableLocales()` in the widget, and the wrapped `ec` of the full check has
    only l10n's localize and format members. The locales are now read in the screens' actions (`localeOptions`); both screens
    now finish the full check with ordinary violations and no render error (html and tui unchanged; CommerceStores passes).
  - R2 (low, F101): `ownReview` took the lowest id, so an author who wrote a review again before deletion was final (a deleted
    and a live one) was refused even the edit of the live one; the live review now comes first. A check in StoreReviews' F101
    feature.
  - R3 (low, F133): the job marked a cart from the activity it read, so a shopper back between the read and the mark left
    the new visit marked and never reminded; the mark is now made only while lastActivityDate is still the one read.
  - R4 (low, §13): the summary's credential names missed a key or PIN not named "API key"/"private key" (a webhook, signing or
    license key, `PsstWebhookKey`); it now redacts any key, PIN or CVV by word or camel case. StoreCheckout's summary feature
    checks a camel-case key redacted and a formula value behind an apostrophe in the CSV.
  - R5 (low): CommerceIsolationWalk left `isolation-walk-secret` on the demo marketplace binding; its cleanup now puts the
    secret back as it was.
  - R6 (doc): design §2's Impl column names ThemeDetail's, ThemeEditor's and TemplateEditor's real paths
    (`Commerce/Website/...`, not under Themes).
- Specs (`--nobuild`): Mantle StoreReviews, ShopCustomer, CartRecovery, ShopSubscriptions, StoreFeeds, StoreChannels,
  StoreCheckout 42 of 42 (before the fixes) and StoreReviews, CartRecovery, StoreCheckout 14 of 14 after; BOSS CommerceAccess,
  CommerceReviews, CommerceStores, CommerceChannels, CommerceFeeds, CommerceRecovery, CommerceSubscriptions 26 of 26; mr-pass
  ShopReviews, ShopAccount 5 of 5; acceptance CommerceIsolationWalk 4 of 4 (changed). CommerceServerStatic not rerun.
- For the lead:
  - F172's framework part: the full check's wrapped `ec` (crates/moqui-core/src/script/runtime.rs `WRAPPED_EC`) denies and
    records an area outside l10n, user and resource, but a member missing from an allowed area (`ec.l10n.getAvailableLocales`)
    is `undefined`, so the expression fails with "not a function" and the render stops instead of a `wrapped-ec` violation
    being recorded. Navigation, SearchContent, Shared/Pages and Shared/PageRoute call it the same way inside dialogs the check
    did not reach; they are left as they are.
  - The Built note's F172 line ("its wrapped-ec render fails ... on Stores/Stores and StoreDetail/General") is fixed by R1.
  - F124's page: a waiting topic whose own box and decline box are both checked is declined and then turned on (a granted
    consent, the address verified); a list so checked is declined. Worth a look when the page is next touched.
  - CommerceIsolationWalk makes a theme draft of BOSS_COM_DIGITAL on every run, and the draft is kept.
- **Final suites (Nov 6, on master after Commerce P15 and Shop P9 merged, nothing else running):** standalone mr-mantle
  1,895 passed, 2 failed (the baseline); `./moq test-apps` 3,302 of 3,303 server features (Commons Contacts' split
  feature read three names from the paged "all" list; the next feature already checks each scope by name, so it now
  checks only that the page has rows and no `_NA_`) and 17 client features passed; lint as before. Final feature time and
  budgets: server mr-mantle 372.2 of 393 s, mr-boss 244.6 of 264 s, mr-pass 17.2 of 20 s; client mr-boss 51.7 of 57 s,
  mr-pass 8.1 of 9 s, mr-marble 7.3 of 9 s. Over the build mr-mantle's budget went from 370 to 393 s and mr-pass's from 15
  and 6 s to 20 and 9 s, each raised by the measured share (§4); mr-boss's server budget stayed 264 s, its client 57 s.
  Acceptance: P15's full `./moq accept mr-boss` 480 of 482 and Shop P9's `./moq accept mr-pass` all passing; the two
  mr-boss failures (F178) also fail on master at 18:54 CST.

## 4. Decisions

These are made before and during the build. Each one that changes the design is also written into
design-commerce.md, design-shop.md or the owner's design.

| Date | Decision | Notes |
| --- | --- | --- |
| Nov 5, 2026 | Commerce and Shop are the next apps built, after Customer Service is done, in one build order (§1) | The user's call (the planning request). Sales, Marketing, Admin and Insights are not built first |
| Nov 5, 2026 | Two plans, one order: this file holds the order; a phase lives in the plan of the app whose screens it builds; Mantle and framework work goes in the phase that first needs it | The plan's choice |
| Nov 5, 2026 | The shared rules of impl-drawers-commons §4 apply: store staff are dated ProductStoreParty rows in a new `StoreStaff` role; a user with a current one is limited to those stores within their organizations, and a user with none works every store of their organizations; an assignment grants no permission | The plan's choice under design §1.1, which named the dated assignment but not its role or rule |
| Nov 5, 2026 | Publication is an effective-dated ProductStoreProduct (`fromDate` in its key), with the publication kind, template key, badge and featured rank on the row and its key fields audit-logged; store-specific text is the store's ProductContent rows; no "publication state", revision counter or override field (P3) | F10, F11; design §4, §14 and design-shop §14.2 changed |
| Nov 5, 2026 | CheckoutPolicy and RecoveryPolicy are dated ProductStoreSetting types validated per type by StoreAdminServices; local shipping rates and recurring offers are dated records of their own, as the design has them | F14; the existing typed-settings pattern, no new policy entity. The ship-option and payment-gateway bindings keep Mantle's undated shapes with audit-logged key fields (F15) |
| Nov 5, 2026 | A review decision is a status change of ProductReview, its reason in the audit log, and the store's reply fields are on the review; no decision record (P9) | F19; design §4 and §14, design-shop §14.2 changed |
| Nov 5, 2026 | Operation identities use the CX-POSTING record (`PostingOperation`), as Billing and Customer Service do; the Forum's receipts stay the Forum's | Design-shop §14.2's "existing PASS idempotency facility"; Shop F5 |
| Nov 5, 2026 | Products' CategoryDetail becomes `Shared/CategoryDetail` with Products' and Commerce's contexts (P3) | F5; owner contract (Products), written into design-commerce §2 and crosscut §2 |
| Nov 5, 2026 | Warehouse's Carriers and Accounting's PaymentMethods and TaxAuthorities are linked from CheckoutSettings, not mounted read only; CheckoutSettings shows the choices they supply | F6; design §1.2, §2, §8, §10 and crosscut's owner table changed |
| Nov 5, 2026 | `check#StoreReadiness` is StoreDetail's readiness and the Shop app's PASS readiness; its Admin §14 registration, `retry#StoreMessages` as a recovery action, ChannelImport as an import target and Home's Insights attention provider wait for Admin and Insights (§7). Readiness only reads: it sets no site or store field | F23, F28; Z9 and Z2 keep their contracts, which the services are written to meet |
| Nov 5, 2026 | Marketing's parts wait for Marketing (§7): visits and conversion on Home and OnlineSales are hidden, RecoveryPolicy offers built-in recovery only, the checkout opt-in is left out (impl-shop §4), and attribution at placement is Marketing's SECA | F28; the design already hides visit cards without tracking. The opt-in: the user's call (answer 5) |
| Nov 5, 2026 | The demo store is POPC_DEFAULT (ORG_ZIZI_RETAIL), completed in P1; ORG_ZIZI_SERVICES gets a digital store, `BOSS_COM_DIGITAL`, for P6 and P12 and for isolation | F17; no Customer Service service type is enabled for ORG_ZIZI_SERVICES (Customer Service F82) |
| Nov 5, 2026 | Promotion limits, every limit field of the code and the promotion, are counted under a lock at checkout's freeze and at the placement of any store order (P7), §2's one deliberate change to Mantle's default, with tests that a limit-free order and mr-marble's order screens are unchanged; Mantle's add-code and repricing checks stay as warnings | F18; the user's call in the review of Nov 5, over enforcing only at Shop's freeze. The promotion's `useLimitPerCustomer` and `useLimitPerPromotion` were never read |
| Nov 5, 2026 | Commerce and Shop build the other owners' contracts they need, under the owner-contract rule (§2): Accounting's typed payment-attempt coordinator (AC-02, X9), the `OhtPayment` hold and Dunning's renewal exclusion; Sales' RecurringTemplate marker with the recurring worker's skip (X5) and the store-scoped sales reads (X11); Comms' delivery ledger (CX-DELIVERY, X8); PASS Account's hub and email preferences page (X6, X15); ExternalAccess's `SalesOrder` kind (X6); Products' shared CategoryDetail. Marketing's, Admin's and Insights' parts wait for them (the row above and §7) | The user's call (answer 1), as Customer Service built the survey builder for Commons. Commerce P3 and P11; Shop P4–P7 |
| Nov 5, 2026 | Shop's payment page is Authorize.Net Accept Hosted, a redirect to the provider's page as Billing's hosted flow, with its saved-profile option for saved methods; PASS's CSP stays as it is, and AcceptUI is later (impl-shop §7) | The user's call (answer 2). The payments plan's P1 built AcceptUI tokens and CIM profiles, not Accept Hosted (Shop F14); Shop P5 adds it, and Billing gains a real hosted gateway |
| Nov 5, 2026 | Gift cards and store credit, and click and collect (design §17, COM-F01, COM-F02) are later, not in this build | The user's call (answer 3), against design §17's recommendation of gift cards in C2; design §16 and §17 changed. No service issues a gift card account from an order (F26) |
| Nov 5, 2026 | The regression budgets are raised per phase by its measured share, with the user's agreement each time, as Purchasing's were; each spec stays well under a second | The user's call (answer 4). mr-pass's is 15 s server and 6 s client, mr-boss's 264 s and 49 s and mr-mantle's 370 s after Customer Service (F45); Shop adds about ten rule specs and Commerce about fifteen |
| Nov 5, 2026 | No marketing opt-in at checkout until Marketing builds `request#Subscription`; the opt-in is never a prerequisite for purchase | The user's call (answer 5); design-shop §6 changed |
| Nov 5, 2026 | Shop links a customer's return, question and cancel requests to the site's own Support pages with the order, rather than mounting them inside Shop: a Shop site needs a Support mount targeting the store's organization (readiness, P6); Customer Service's customer services and Support pages admit the `SalesOrder` OrderView capability for its one order, and `contactCase` sets `Request.productStoreId` from the order's store (owner contract, Shop P6) | The user's call in the review of Nov 5. F38: the Support pages resolve their organization from the site's Support mount and redirect into it |
| Nov 5, 2026 | Cart recovery goes only to a signed-in customer who turned on the store's "cart reminders" topic on the PASS email preferences page (Shop P6); a guest's cart never gets one; the demo seeds one consenting customer | The user's call in the review of Nov 5; with no checkout opt-in, nothing else records the consent |
| Nov 5, 2026 | Reviews take images, staged and scanned through `PortalMedia.js`, moderated with the review and shown only once it is approved (P9) | The user's call in the review of Nov 5; design-shop §5 changed |
| Nov 5, 2026 | Permissions the plan had left unnamed or set apart from design §1.1: navigation and redirects `COMMERCE_MERCHANDISE` (pages `COMMERCE_THEME_EDIT`, both published with `COMMERCE_PUBLISH`); merchandising and categories `COMMERCE_MERCHANDISE`; CheckoutSettings with RecoveryPolicy and RecurringPolicy `COMMERCE_STORE_EDIT`; `reply#Review` `COMMERCE_MERCHANDISE`; feeds and ChannelHealth `COMMERCE_CHANNEL_OPERATE` | The plan's choice by design §1.1's table; design §2's Navigation and FeedDetail rows changed |
| Nov 5, 2026 | `PublicSite.subscriptionUrl` is set and cleared by `store#RecurringOffer` (Shop P7; its screen P12), never over an outside address a site owner entered; readiness only checks it | The plan's choice; design-shop §4.3, §10, §13.2 and §15 had readiness set it |
| Nov 5, 2026 | Shop P1 comes after Commerce P2, and the phases that use another's work are in sequence; only independent pairs run side by side (§1) | The review of Nov 5: Shop P1 registers Commerce P2's readiness |
| Nov 5, 2026 | One adoption proposal (`propose#StorePublication`, P3), reused by Shop P8's legacy adoption; scheduled page and menu publication is C1's (P4); a refund revokes a download from Shop P6, before paid access in P7 | The plan's choice; design-shop §17.2 changed |
| Nov 5, 2026 | Accept Hosted's form POST to the provider gets the CSP it needs: Shop's payment relay route allows `form-action` to the Authorize.Net hosted page (production and sandbox), the rest of PASS keeps its CSP (Shop F37) | The user's call during the build, refining the Accept Hosted row above; Shop P5 |
| Nov 5, 2026 | F59 (a member whose last StoreStaff row ends, or whose only row starts later, works every store of their organizations) is noted and left as §4's rule for now | The user's call during the build; revisit if store-limited staff need a stricter rule |
| Nov 6, 2026 | Review requests are their own per-store opt-in, a "review requests" topic beside cart reminders, not marketing email; checkout offers a few clearly marked opt-ins (review requests, cart reminders, the store's news when it has a list), separate, unchecked, each saying what it is and is not; receipts and order notices stay transactional, and instructional or documentation follow-ups of a purchase (how-to, download instructions, setup guides) are transactional with no topic | The user's call (F95): "do an opt-in for review requests; instructional/documentation follow-ups can be transactional but I agree review requests should be opt-in; if we have a few clearly marked opt-in options in checkout it's a good thing (well, for some corporate philosophies), options show clear distinctions and what they are and are not signing up for." P9 follow-up. Refines the Nov 5 rows: checkout now has opt-ins (the news one only when the store names its list, recorded through ConsentServices until Marketing's `request#Subscription`), and cart reminders may also be checked at checkout by a signed-in buyer. A guest's or unverified account's choice waits as a pending list membership until the receipt's link or (an account's own choice, review R1) a verified sign-in confirms it. design-commerce §4, design-shop §6, §9, §11 changed |

## 5. Open questions

| Question | Decides | Notes |
| --- | --- | --- |
| Further issues discovered during implementation | the affected phase | Record findings and decisions here; the open questions of the plan as written (Q1–Q5) were answered on Nov 5 and are in §4 |

## 6. Findings

Design assumptions found wrong or unstated in the code, with the resolution. Where a resolution changes the design, it
is written there too. F1–F36 were found on Nov 5, 2026, while writing this plan, from the code as Customer Service
P1–P8 and P12 left it; F37–F45 later on Nov 5, from Customer Service's finished code and the plan's review, which also
updated F1, F3, F4, F8, F18, F20, F22 and F25.

| # | Finding | Resolution |
| --- | --- | --- |
| F1 | P0: `screen/Commerce/` has six flat placeholders (Home; Stores "Stores & channels"; Merchandising; Orders "Online orders & carts"; Integrations; Settings), the root mounts only Chatter and RecordFiles and has no `<shell-providers>`. Its comment (Commerce.xml:15-17) says the grant is commented out; the Admin, Sales, Marketing and Insights roots say the same. In fact `BOSS_COMMERCE` (BossSetupData.xml:163-170) gives ADMIN and `BOSS_COMMERCE_ADMIN` all authz with `MANTLE_ACTIVE_ORG` and `MANTLE_PRIVATE_CONTACT`; there is no root user group, service artifact or other Commerce group. The design's menu has ten areas | P1; the other roots' comments are left to their owners |
| F2 | P0: no `COMMERCE_*` or store permission is seeded anywhere | P1 seeds twelve in MantleSetupData with ADMIN grants |
| F3 | P0: adding `commerce` to the client deny pattern (artifact group BOSS_PROJECTS_INTERNAL, now seven rows after Customer Service's split) takes three of its rows (BossSetupData.xml:437, 447, 449) past `artifactName`'s 255 characters; ProjectsAccess (ProjectsAccess.spec.js:620-660) walks every `service/ironstone/**` file and fails on a write verb the patterns do not deny | P1 splits the three rows (as Customer Service F75) |
| F4 | P0: Products' SharedContext.js `context()` throws "Shared catalog context is not available" for any app root but Products, Warehouse, Manufacturing, Purchasing and Customer Service (:308). Product360 branches on Accounting and Purchasing, PriceExplain on Purchasing and Customer Service; CategoryContent, Documents, DocumentDetail, PriceLists and PriceListDetail have no app branches and are mounted only under Products | P3 adds a Commerce branch and the mounts |
| F5 | P0: CategoryDetail is Products' own screen (`screen/Products/Categories/CategoryDetail.xml`, `CategoryServices.get#CategoryDetail`), not a shared one; the design mounts it as "Products §5" | P3 moves it to `Shared/CategoryDetail` (§4); design §2 and crosscut §2 changed |
| F6 | P0: Carriers (`Warehouse/Locations/Carriers.xml`), PaymentMethods (`Accounting/Settings/PaymentMethods.xml`) and TaxAuthorities (`Accounting/Tax/TaxAuthorities.xml`) are their owners' editors, not shared screens; there is no PaymentGateways screen | Links from CheckoutSettings (§4); design §1.2, §2, §8, §10 and crosscut's owner table changed |
| F7 | P0: Warehouse's StoreReservation (`Warehouse/Settings/ReservationPolicies/StoreReservation.xml`) over `WarehousePolicyServices.update#StoreReservation` is built (four fields, a change reason, a stale stamp refused, `STOCK_POLICY_MANAGE`), as X16 says | P2 shows the fields read only and links it |
| F8 | P0: `PaletteServices.get#RecordLink` is a chain of each app's module, not a registry; a sales order goes to Customer Service's branch (PaletteServices.xml:79-86), which returns even when its link is null (F42), and there is no store kind | P1 adds Commerce's module for stores, P8 for its orders and carts, with Customer Service's branch falling through on a null link |
| F9 | P0: ProductStore has no status, type, time zone or group field; `storeDomain` is for emails only. Mantle's StoreServices has six services (`create#StoreShippingOption`, `get#StoreShippingOptions`, `clone#ProductStore`, `format#UrlSlug`, the two slug generators) with no permission check, and no store read or save exists; `mantle.rest.xml` (:462-467) exposes raw entity CRUD on productStores. The organization filters cover ProductStore by its organization (the `_D` row of `MANTLE_USER_ORG`), not its child records, OrderHeader, ProductReview, the promotions or the site records | P2's StoreAdminServices with its checks; no artifact authz for the REST paths (§2) |
| F10 | P0: ProductStoreProduct is keyed by store and product and holds only `signatureRequiredEnumId`; it is read by ShipmentServices.xml:643 and ForumIntegration.js:383 | P3 dates it (§4) |
| F11 | P0: ProductContent, ProductCategoryContent, ProductPrice, ProductPriceList and TaxAuthorityRate already carry `productStoreId` | Store-specific text is the store's ProductContent (§4); design §14 and design-shop §14.2 changed |
| F12 | P0: `clone#ProductStore` copies categories, emails, facilities, parties of every role (a customer's CustomerBillTo row included), products and settings, unexpired; promotions, ship options and gateways, payment gateways, wiki spaces and content, approvals and group members are not copied (commented FUTURE); `deepCopyCategories` is a TODO | P2's clone guard passes staff roles only and reports what it left |
| F13 | P0: the ProductStoreGroupType enumeration has no values, and no service uses the store group entities | P2 seeds the types |
| F14 | P0: ProductStoreSetting is dated and typed (`settingTypeEnumId`, `settingValue`), with the order-approve, template, label and location types | CheckoutPolicy and RecoveryPolicy as setting types (§4) |
| F15 | P0: ProductStoreShipOption (keyed by store, carrier and method) and ProductStorePaymentGateway (keyed by store and payment instrument) are not dated | Kept; their key fields audit-logged (P2) |
| F16 | P0: `PsetCartRecovery`, `PsetSubscriptionRenewal` and `PsetReviewRequest` do not exist; `PsetPaymentRetry`, `PsetOrderChange`, `PsetBackOrder`, the return and gift-card types are seeded and marked "not currently generated"; POPC_DEFAULT has no ProductStoreEmail rows, so its store emails send nothing (Customer Service F29) | P2 seeds the three; P1's demo binds the automatic types; each sender comes with its phase |
| F17 | P0: POPC_DEFAULT is the only store in any data (ORG_ZIZI_RETAIL, ZIRET_WH, the NA_LOCAL shipping gateway, TEST_APPROVE for cards, the LOCAL tax gateway, the PopcBuyGet promotion with codes TEST1 and TEST2 and PopcNewCustomer, its categories and template spaces), with no emails, settings, facility, party, product or ship-option rows. No PopRestStore component or `/popc` mount exists, so ZZW_RETAIL's `publicPageUrl` (`/popc/content/…`) and the `/pcontact` alias point at nothing; Customer Service's knowledge links use that URL (its F104, F105) | P1 completes the store; Shop P3 serves the space's pages on the demo Shop site and moves its `publicPageUrl` there |
| F18 | P0: the promotion services are BuyGet, Flat and NewCustomer; use limits are counted over placed orders only (carts not), checked when a code is added and at each repricing, without a lock, and never at `place#Order`; PromotionServices.xml:106-152 enforces the code's per-code and per-customer limits and the promotion's `useLimitPerOrder`, but never reads the promotion's `useLimitPerCustomer` or `useLimitPerPromotion` (ProductStoreEntities.xml:299-301). ProductStorePromoCode's `parties` relationship maps `storePromotionId`, which ProductStorePromoCodeParty lacks; ProductStorePromotion's description names `StoreServices.apply#Promotion`, where the interface is `PromotionServices.apply#Promotion` | P7's locked check of every limit field (§4), relationship fix and description |
| F19 | P0: ProductReview keys its author by `userId` (a UserAccount), has no order proof, reply or title, and goes Pending to Approved or Deleted and Approved to Deleted only; no service reads or writes it | P9 (§4) |
| F20 | P0: `get#OrderShippingRateLocal` (CarrierServices.xml:1025-1026) sets the shipping total to 0 for any part with a product item, applies no rule and makes no shipping item, and POPC_DEFAULT uses its NA_LOCAL gateway; there is no shipping-rate record | P6 (design §8, as written) |
| F21 | P0: `SalesReportServices.get#SalesOrderSummary` and `get#SalesInvoiceSummary` take `productStoreIds`, `get#SalesTopProduct` does not; all three require `ACCOUNTING_VIEW` and read the `mantle_sales` search index | P11's store-scoped read (§4); design §3 changed |
| F22 | P0: the framework loads each component's `report/*.json` (moqui-report `definitions.rs`), and its dashboards and alert rules are framework features (Monitoring); mr-mantle ships its sales definitions, and mr-boss `report/` holds Customer Service's three (boss-service-breaches, -clocks, -sla-breach); Insights has no report catalog (its Reports is the ported saved-report picker), and Customer Service's and Accounting's catalogs are their own | P11 ships Commerce's definitions beside them and its own Reports catalog, with no Commerce analytics engine; registration with Insights later (§7) |
| F23 | P0: no Admin readiness or recovery registry exists; readiness today is PublicApps' per-app `readiness` service, which the Forum's `checkReadiness` runs per mount, and Accounting's `get#Readiness` | §4: `check#StoreReadiness` serves StoreDetail and Shop's PASS readiness |
| F24 | P0: Sales, Marketing, Admin and Insights are placeholders apart from Sales' ported reports and Insights' ported dashboards and builders; Marketing's Promotions placeholder ("Promotions & coupons") is the mount design-marketing §7 plans | Commerce's shared promotion screens carry its context only; Marketing mounts them later (§7) |
| F25 | P0: when this plan was first written Customer Service had built P1–P8 and P12; it is now done (P1–P16). Its pieces this plan uses are built: `mantle.request.SupportCaseServices.create#CustomerCase` (SupportCaseServices.xml:1160), `mantle.order.ReturnPolicyServices.request#CustomerReturn` (:533), `mantle.order.OrderChangeServices.request#CustomerCancel` (:274) with `customerImmediateCancel` on ServicePolicy, the `support` app (Apps.js:15, PublicApps.js:21-24), ExternalAccess's `support` app kind and self relationship, the PASS operations `createCustomerCase`, `requestCustomerReturn` and `requestOrderCancel`, and Shared/ReturnDetail's and RequestDetail's Customer Service branches (ReturnDetail.xml:73-78, RequestDetail.xml:325). What differs from this plan's assumptions is F37–F42 | F37–F42; Shared/ReturnDetail's Commerce branch is one more `if` beside the four |
| F26 | P0: FinancialAccountType has GiftCard and CustomerCredit, `authorize#FinancialAccountPayment` authorizes against a locked account, but no service issues a gift card account from an order | Later (§4, §7) |
| F27 | P0: no Mantle delivery ledger exists (Shop F24) | Shop P6 builds Comms' (§4) |
| F28 | P0: no Marketing tracking event, `record#OrderAttribution`, `request#Subscription`, Admin PrivacyServices or readiness registry exists | §4: deferred to their owners |
| F29 | P0: the Commons Knowledge editor is reused by mounting it with a context flag (Projects' Docs tab with `inProjectDetail`; Customer Service's Knowledge.xml:24-31 with `inCustomerService`, which filters the spaces to its knowledge context and allows three Customer Service transitions); it edits a wiki space's pages, including a publishing space's (ZZW_RETAIL), and never a `PublicSitePage` | P4's PageDetail mounts it with Commerce's context and binds the page through `store#SitePage`; P0 still checks `canUpdate` and the version note for a designer who is not a space member |
| F30 | P0: `merge#Parties` is Mantle's (DuplicateServices.xml:766), with no permission check of its own (BOSS's `get#ComparePair` checks the edit rights); what it moves is Shop F23 | impl-shop: each Shop record adds its move or refusal to `merge#Parties` (Shop F23) |
| F31 | P0: `get#ProductPrice`'s trace and anonymous reads (Shop F18) | Commerce's PriceExplain keeps the price permission; Shop prices as the authority for the routed store (Shop F18) |
| F32 | P0: `authorize#OrderPayments` skips Authorized, Delivered and Confirmed payments, passes no operation key, and returns early for an order with no store | Shop P5's guard (impl-shop) |
| F33 | P0: there is no `OhtPayment` hold type (Shop F15; the four types keep their release permissions in `enumCode`) | Shop P5 seeds it (§4) |
| F34 | P0: the design's links to `review-suite-apps.md` point at a file removed in bd74564 | The inputs here and in both designs say where it is |
| F35 | P0: Mantle's `MantleProduct` DataDocument is the product search index (Shop F32) | Shop P3's search filters its hits by the publication resolver; the index is a candidate source, never authorization (design-shop §5.1) |
| F36 | P0: merged into F22 on Nov 5 (the framework's report loading) | F22 |
| F37 | P0: `create#CustomerCase` takes a `requestCategoryId` only from the organization's offered queues (SupportPortal.js:149-165, 777-778: `SupportAppSetting.queueIds`, dated per organization, or else `ServicePolicy.defaultCategoryId`); `Request.productStoreId` exists (RequestEntities.xml:40) but `contactCase` never sets it (SupportPortal.js:829-839), and no Support record refers to a store (Customer Service F210) | P6 chooses the store's queue from the offered ones; Shop P6's owner contract has `contactCase` set the store from the order; P8 finds a store's cases by it |
| F38 | P0: the Support pages are bound to the site's own Support mount: every operation passes the resolved site, `served(siteId)` (SupportPortal.js:130-136) needs its enabled `support` mount with an internal target that has a ServicePolicy, `orderFor` (CustomerOrders.js:50-60) needs each order part's vendor to be that target, and the pages redirect to `passBases.support`; on a site with no Support mount every operation answers NotFound. OrderCancelRequest is NewCustomerCase's `cancelOrder` transition (NewCustomerCase.xml:41-52), shown for an `orderId`, not a page | §4: Shop links to the site's Support pages; P6's readiness requires the mount; design-shop §1, §2 and §9 changed |
| F39 | P0: ExternalAccess's record kinds are now Invoice, Order (purchase orders), Quote, RequestCategory, Request, ReturnHeader and FormInvitation; its app kinds billing, supplier and support; the self relationship is `selfOf` (ExternalAccess.js:243-265: a current verified email, no internal role); the Support pages and Customer Service's customer services admit a contact or the self relationship, never a capability; there is no `SalesOrder` kind | Shop P5 adds the kind; Shop P6's owner contract admits its OrderView capability (Shop F27) |
| F40 | P0: the sales commercial revision (X2) is `PartyAcctgPreference.salesCommercialRevisionOnly` (SupportOrderChangeEntities.xml:150-158; default N, inherited through `find#PartyAcctgPreference`, Y in the demo on ORG_ZIZI_CORP), read by `increment#OrderRevision` (OrderServices.xml:2903-2955) for OrderContent, OrderNote and status-only part changes; a part with no customer or vendor party counts every change (:2926) | Shop P4's cart part always carries a customer party, so a note leaves a frozen checkout's revision alone |
| F41 | P0: the shared media stage is `mantle.party.PortalMedia.js` (`stage`, `keep`, `unstage`; PDF, PNG or JPEG up to 10 MB, scanned under `pass_media_root`), used by Billing, Support and returns; the Forum's `stageAttachment` stays separate | P9's review images use it (§4) |
| F42 | P0: `get#RecordLink`'s Customer Service sales-order branch (PaletteServices.xml:79-86) sets the link from `recordLink('order', id)` and returns even when that is null (a user out of Customer Service's scope), so a later branch never sees a sales order or cart | P8 makes the branch fall through on null, Customer Service's cases unchanged |
| F43 | P0: `clone#Order` (OrderServices.xml:2385-2529) copies payments by default as Promised (`copyPayment`), copies each item's `unitAmount` without repricing, and makes an OrderOpen order | P8's Order again clones with `copyPayment=false` and reprices; Shop P7 clones renewals with `copyPayment=false` (Shop F17) |
| F44 | P0: no spec is named `GoldenPath`: the client walks are `test/client/<App>/<App><Area>Walk.spec.js`, registered in `test/client/suite.js` (Customer Service's golden path is CustomerServiceCasesWalk); SpecLibs are `test/<App>/<App>SpecLib.js`; Mantle's `test/` has no `public/` folder | §2; the golden walks are CommerceThemesWalk and Shop's ShopCheckoutWalk; P4 starts `test/public/` |
| F45 | P0: since BOSS_USERS (mr-boss cc38c49a), Commons and Comms open only for `BOSS_USERS`; app groups are not nested: a user is in `BOSS_USERS`, the app's root group and a capability group, the administrator in `BOSS_USERS` and the app's `_ADMIN` (BossUsersDemoData.xml:735-736); an area seen by some groups is an artifact group that denies the root group and allows them (BOSS_CS_RETURNS, BossSetupData.xml:1610-1640). The budgets after Customer Service: mr-boss 264 s and 49 s, mr-mantle 370 s, mr-pass 15 s and 6 s | P1 follows the pattern; §4's budget row updated |
| F46 | P0: every SharedContext branch but Products' forces `catalogEdit` and `priceEdit` false; Documents and DocumentDetail refuse saves without `catalogEdit` (Documents.xml:26, 42) and Prices.js reads `canEdit` from the context | P3: the Commerce branch passes `read`, `priceRead`, `catalogEdit` and `priceEdit` through from `get#CatalogAccess`, with cost, margin and method off (as Manufacturing passes its method flags, SharedContext.js:133-134) |
| F47 | P0: `get#SharedContext` returns only its declared out-parameters (CatalogServices.xml:24-38), so a store scope added in SharedContext.js is dropped; Prices.js and Taxonomy.js list the user's organizations' stores (by `ownerPartyIds`, :217-219, :800-802), with no per-store narrowing | P3 adds a `storeIds` out-parameter and narrows those store lists to it under Commerce |
| F48 | P0: Shared/Prices.xml's transitions use `sharedLinks['Prices/PriceHistory']` and `['Products/BulkPrice']` unguarded (:66, :69) | P3 maps them to Commerce routes or hides those actions |
| F49 | P0: `Commerce.xml` called no app `get#SharedContext` and set no `sharedLinks`, unlike CustomerService.xml:32-33 | P1 (built) |
| F50 | P0: the organization filters cannot limit a staff member to some stores of an organization (BOSS_COMMERCE's rows carry `MANTLE_ACTIVE_ORG`; `MANTLE_USER_ORG_D` filters ProductStore by organization only) | P1 (built): the `COMMERCE_STORE` filter set over `ec.user.context.commerceStoreIds`, filled by `setup#StoreScope`; the Commerce services condition on the scope in their queries |
| F51 | P0: store child records, orders, reviews, site records, `disableAuthz` reads (all of Products' scripts and the store choice lists), the raw REST paths and the search indexes escape any ProductStore filter | Every Commerce service conditions on its store scope (`get#StoreScope`); P2, P3 and P8 each test a store-limited user refused another store of the same organization |
| F52 | P0: ZZW_RETAIL sets no `restrictUpdate` (ZcaProductDemoData.xml:43), so every BOSS_USERS member may edit and wiki-publish its pages in Commons Knowledge (`get#WikiPageAccess`, WikiServices.xml:1711-1780); the wiki publish is what `publish#SitePage`'s exact-version rule and the help links trust | P4: store page spaces have `restrictUpdate=Y`; `store#SitePage` writes after its own permission and store check, as no user with authz off (the framework's exemption), or keeps the space's `allowUpdate` rows in step with the grants |
| F53 | P0: Commons Knowledge has no single-page mode; its modes are detected by path segment (Knowledge.qvue:680, 684), so under Commerce it would show Commons' side pane, page menu and Publish | P4 adds a Commerce mode to Knowledge.xml and Knowledge.qvue: the bound page only, no side pane, Publish, rename, move, delete or Request review, `savePage` through `store#SitePage` |
| F54 | P0: a second host of a site already routes (two `<public-site>` entries with one `site-id`; `getSiteInfo` accepts any PublicSiteHost, Forum.js:2693-2698), but a host has no kind, so a preview host would serve the live site's mounts, accounts and checkout | P5: `PublicSiteHost.hostKindEnumId` (live, preview); on a preview host Pass.xml sends `frame-ancestors` the configured BOSS origins, noindex and no-store, refuses every route but the preview render and needs the preview capability (in the URL, never a cookie); `pageUrl`, `sitesFor` and readiness skip preview hosts; previews are served by the authority's runtime |
| F55 | P0: the framework adds `X-Frame-Options: sameorigin` to every screen response lacking one (factory.rs:96, web/mod.rs:1929), and the desktop shell's CSP has `frame-src 'none'` (moqui-client assets.rs:37) | Framework (built by the framework worker for P5): X-Frame-Options left out when the response's CSP has `frame-ancestors`; the desktop shell allows configured preview origins |
| F56 | P0: ZZW_RETAIL's `/popc/content/` URL is read by CustomerArticle and also by Send to customer's `get#ArticlePublicLink` (Knowledge.js:416-444, made absolute on the BOSS webroot, asserted by CustomerServiceKnowledge.spec.js:121), the INTERNAL_PUBLIC_SPACE guard (:190), SpaceDetail and Marble's wiki links; `/pcontact` is a dead alias | Shop P3 moves `publicPageUrl` and `publicAttachmentUrl` to the Shop site's absolute page route (better, `publicLink` through `PublicApps.pageUrl`), drops `/pcontact` and updates the spec |
| F57 | P1: the shared binaries were older than components/base (no `UserSecurityChecks.assertDocumentExpression`, mr-moqui 4f8997c0), so data files with DataDocument fields failed to load and every BOSS spec failed at sign-in | The lead rebuilt `target/release/moqui` (Nov 5, from mr-moqui fff2e5f6); P1's specs rerun on it |
| F58 | P1: Mantle has no store email templates (the PopRestStore ones were not ported) | The demo binds POPC_DEFAULT's five automatic types to one demo template on the local sink; real templates come with Shop's notices |
| F59 | P1: under §4's rule, a member whose last StoreStaff row ends, or whose only row starts in the future, works every store of their organizations | Kept as §4 decides, noted and left for now (the user's call, §4); the alternative: anyone with any StoreStaff row stays limited, to nothing when none is current |
| F60 | P2: on a fresh runtime load with mr-moqui d9bcc20d's binary, Customer Service's Support demo step failed once (a held transaction-cache write cancelled, then a duplicate `form_inv_key`), so `dana@joesdist.example.com` had no login; it passed on the rerun | Fixed Nov 6 (two app races, which TX-Cache P5's held worker logins made more frequent): `create#Invitation` locks the case before its find-then-insert (mr-mantle), and the Customer Service Support and Feedback demo loads no longer log john.doe in and out inside the data file's transaction, whose UserAccount row lock each step's own login waited on until its deadline (mr-boss); 20 of 20 fresh loads clean. A framework alternative (login and logout flags written in their own transaction) is the user's call |
| F61 | P2: deleting a ship-option or payment-gateway binding writes no audit row (the framework audits creates and updates only) | P6's CheckoutSettings records a binding's removal itself (its reason and user) |
| F62 | P3: the framework's table check never changes a primary key, so an existing database keeps ProductStoreProduct's (store, product) key with a nullable `fromDate`, and a second dated row of a product fails there; no shipped data file has rows | mr-mantle `docs/Upgrading.md`: the key check and the PostgreSQL and MySQL statements; a framework service exposing `rekey_table` would let Mantle ship it as a setup step (later) |
| F63 | P3: on an entity-auto `create#`, a `<field>_changeReason` parameter does not reach the audit row (on `update#` it does) | ProductStoreProduct keeps a `changeReason` field; a framework fix later. Done Nov 6 (mr-moqui com/fw6 ced749a2): entity-auto writes record the passed change reason; Mantle passes it |
| F64 | P3: the demo's DEMO_VAR variants are drafts, so none is saleable until a catalog editor activates them | The assortment walk activates three |
| F65 | P3 review: under Commerce, CategoryDetail's parent and member writes go through Products' services (PRODUCT_CATALOG_EDIT only), so they skip the shared-store check and the site generation; the store narrowing of Prices.js and Taxonomy.js applies under Commerce's mount, not to the same user under Products | P4: under Commerce those CategoryDetail writes go through StoreMerchandisingServices (shared-store check, generation) or are hidden in favour of StoreCategories; a StoreStaff limit under Products is not added (Products is catalog-wide) |
| F66 | P7: F18 was partly wrong: `apply#OrderPromotions` and `add#OrderPromoCode` already read the promotion's `useLimitPerCustomer` and `useLimitPerPromotion`, without a lock | Design §7 corrected; P7's locked recount at `place#Order` stands |
| F67 | P7: a promotion with no `sequenceNum` applies after numbered ones (PostgreSQL sorts nulls last) | NewPromotion leaves the order to the editor; a default is for the lead later |
| F68 | P7: only `place#Order` recounts under the lock; repricing a placed order and `update#OrderStatus` to OrderPlaced (ProjectServices' `approve#MilestoneApproval`) count without it | Low (the review): staff-only paths; `approve#MilestoneApproval` could call `place#Order` (Projects' owner) |
| F69 | P7: an EntityFind can't be reused after `count()` | The module builds the find twice |
| F70 | P7: Redemptions and Usage show the order without a link until P8 mounts OrderDetail | P8 |
| F71 | P7 review: OrderBulk places up to 100 parts in one transaction, so one refused placement rolls back the whole bulk change (as any placement error did before); `generate#PromoCodes` writes its operation record after the codes, so two concurrent submissions with one key both make a batch and an interrupted batch is made again in full; Mantle's `store#PromoCodeParty` accepts any active party (Commerce checks the customer first); the TEST2 feature's discount depends on the database's earlier TEST2 uses | Left as they are for now: OrderBulk's per-part transactions are Mantle's choice, not Commerce's; the code batch's claim-first key needs an EntityLib change (later); Shop and Marketing check their own party; the TEST2 placement assertion is the default's test |
| F72 | P4: F52's "write as no user with authz off" is not possible in a web request (no run-as-nobody scope; `logoutUser` ends the session) | `store#SitePage` grants the user a WikiSpaceUser `allowUpdate` row for the one write and restores it, inside the caller's transaction (the review found it safe); a framework internal-write scope would replace it. Done Nov 6 (mr-moqui com/fw6 ced749a2, 88f3bbad): `ec.artifactExecution.runAsSystem`; SitePages writes as the system with the acting user on the wiki history |
| F73 | P4: the Commerce mode's server side is PageContent's own six transitions, not guards on Knowledge.xml's write transitions | Knowledge.xml is not mounted under Commerce (the review checked) |
| F74 | P4: Commerce's publish makes the version the wiki's published version and the binding's in one transaction; the Forum path still leaves its page dark between the wiki publish and the binding | The Forum's own (later) |
| F75 | P4: design-shop's row saying `get#SitePage` serves only the guidelines and about roles is stale; the PASS operations for pages, navigation and redirects are Shop's | Shop P3 updates design-shop and adds the operations |
| F76 | P4: ZZW_RETAIL is not restricted and is not the store's page space, so Commerce made POPC_DEFAULT a page space of its own | Shop P3 serves the store's page space; ZZW_RETAIL's move (F17, F56) is re-planned there |
| F77 | P4: a page's template key is checked for its shape only, not against the theme's templates | P5 checks it against the draft's and the active release's templates |
| F78 | P4 review: `store#SitePage` makes a published page's route, role, title, SEO and template changes live at once with `COMMERCE_THEME_EDIT`; the store page space is `restrictView N`; scheduled menus and redirects are not refused when their window ended before they start; the MySQL `PASS_PAGE_ROLE` step fails if the index exists | Resolved Nov 6 (com/p4fix, P4's Follow-up): a published or scheduled page's binding change needs `COMMERCE_PUBLISH` and the expected `publicationRevision`, which advances (refused rather than held: the binding has no draft fields); scheduled menus and redirects refused `WINDOW_PASSED` (and the job's scheduled-menu key read fixed for PostgreSQL); Upgrading.md's MySQL index step conditional, PostgreSQL's `IF NOT EXISTS` noted. Drafts readable by BOSS users through Commons is accepted (internal readers only) |
| F79 | P6: `calculate#OrderShipping` treats a part with no total as 0 and `get#StoreShippingOptions` lists a method with no rate, so a rated store's order placed from the order screens to an unserved address gets no shipping charge, only a warning | Shop P5 quotes through the bulk service and refuses a part with no quote; a Mantle placement rule for staff order entry is later |
| F80 | P6: creating an order item runs the part's shipping calculation (a Mantle ECA), so the local rule runs on every cart change | One indexed read for an unrated store (the review) |
| F81 | P6: the Commerce administrator's store choices included stores Mantle's scope refused | Fixed in the review: `COMMERCE_ALL_ORGANIZATIONS` (ADMIN, BOSS_COMMERCE_ADMIN) widens Mantle's scope as FACILITY_ALL_ORGANIZATIONS does Warehouse's; BOSS widens only with it; design §1.1. Customer Service's and Purchasing's scopes may have the same mismatch (Purchasing F185 records it as intended) |
| F82 | P6: AppStructure's placeholder floor was above master's count once P4 and P7 each replaced one on their branches | Lowered to 43 |
| F83 | P6: Mantle has no record of what a payment gateway can do | `StoreCheckout.js` `gatewayCapabilities` by gateway type, filled by Shop P5 and P7 |
| F84 | P6: a new setting's audit rows carry no reason (F63) | Its `changeReason` field's audit row shows as "Reason" in History. Done Nov 6 with F63 (com/fw6) |
| F85 | P6: the demo store's readiness blocked (no local rate, no Terms page) | The review published a Terms page on ZIZI_SHOP; local rates stay out of the demo (Mantle specs place POPC_DEFAULT orders at zero shipping), so readiness blocks on Local rates only until Shop P5's demo checkout gives a rated store |
| F86 | P5: the preview response gets the framework's session cookie; with BOSS and the preview host on one registrable domain the frame's next request brings it back and starts a Visit whose `initialRequest` holds the preview token | Fixed Nov 6: the framework's `ec.web.declineSession()` (mr-moqui, merged from com/fw4; docs/security/Attack-Surface.md "Pages without a session"): no session cookie, token or Visit for a request with no session of its own, and a Visit its cookies started taken back; ShopPreview.js's page and asset call it |
| F87 | P5: the framework's own routes (`/qapps`, `/rest`, `/Login`) answer on the preview host | Later: their default `frame-ancestors 'none'` and X-Frame-Options keep them unframeable (the review). Done Nov 6 (mr-moqui com/fw6 ced749a2, 9f508523): `<public-site host-check-service>`; Mantle `get#PreviewHost` answers restricted |
| F88 | P5: an unpublished site previews with sample products, since ShopCatalog's reads need a published site | Kept |
| F89 | P5: the adapter does not mark sections in its output, so click-to-select needs `data-section-id` in the theme | The starter has it; documented in Themes.md |
| F90 | P5: the preview address uses the BOSS request's scheme and port | Behind a proxy that changes them, configure the preview host's address (later) |
| F91 | P5: CommerceThemesWalk adds 8.0 s to mr-boss's client budget (46.8 of 49 s) | The review measured it at 7.6 s of server work it cannot trim; the client budget is raised by it at the gate (the user's agreement) |
| F92 | P5: does the anonymous preview record a Visit? | Yes, from its second request; fixed with F86 |
| F93 | P5 review: at render the preview token checks the actor's account is enabled, not their theme permission or store scope (a revoked designer's open preview lasts at most 20 minutes); Shop P2's `get#ThemeDraft` with `includeText` returns source text to any `COMMERCE_VIEW` holder | Accepted: twenty minutes at most; theme source holds no secrets |
| F94 | P9: the demo's ProductReview ids were the sequence's next values, so a second new review failed on a demo database | Renamed DEMO_REVIEW_1 and _2 |
| F95 | P9: the review request is a solicitation, sent only with a granted PcpMarketingEmail, which Shop never collects, so the demo sends none | Resolved Nov 6 (the user's call, §4): a per-store "review requests" topic (PcpReviewRequest) on Email preferences and among checkout's opt-ins; the request needs it, not marketing email (P9 follow-up) |
| F96 | P9: PASS's facade takes one file per operation, so three photos are three calls | Accepted |
| F97 | P9: the review request is sent within the ledger job's two minutes of delivery; the ledger has no not-before date for "days after delivery" | Later (the ledger's not-before) |
| F98 | P9: an author's edit keeps the store's reply, which shows again on re-approval | Accepted |
| F99 | P9: theme releases published from the old starter show no reviews until republished | Accepted |
| F100 | P9: each product page view for a signed-in visitor read their qualifying orders | Fixed in the review (R1): one query of the product's lines |
| F101 | P9 review: a review staff deleted does not count toward one review per account, store and product, so the author may write another | Done in P15: deletion is final (the conservative call): a deleted review stays the author's one review, neither edited nor written again (REVIEW_REMOVED; Shop's Review page says so). Spec: StoreReviews |
| F102 | P9 review: a decision or reply without an expected revision is not checked for staleness (the screens always send one) | Done in P15: required (REVISION_REQUIRED); CommerceReviews' keys carried no real revision and passed only for this. Spec: StoreReviews |
| F103 | P9 review: two simultaneous first submissions can make two reviews (no unique key on account, store and product) | Done in P15: submit#Review locks the account's UserAccount row first, so an account's first submissions run one after the other (no Mantle-wide unique key: it would act on reviews Commerce does not make). No spec: a race needs two threads |
| F104 | P9 review: the download SECA (DownloadFirstRequestReview) and `get#Reviews`' claim have no spec of their own | Done in P15: StoreReviews' P15 feature (a first download queues the request, after the commit; get#Reviews' claim offers the form) |
| F105 | P9 review: removing a photo deletes its file before the transaction commits | Done in P15: the file is deleted after the commit (`remove#ReviewImageFile`, registered on commit, only once no image row names it). Spec: StoreReviews |
| F106 | P8: `dependsOn` does not order a run (specs run in component load order, then by file name), so a mr-boss spec cannot depend on mr-pass specs | Framework; the P8 acceptance lives in mr-pass and sorts after ShopOrderScenarios. Done Nov 7 (mr-moqui com/fw7 2ae6a83c, b7544b74): a run orders specs after their dependsOn, across components, keeping suite chains |
| F107 | P8: no Accounting screen releases a Payment hold (`release#OrderHold` is a service only) | Accounting (later) |
| F108 | P8: a stuck placement has no resolution screen in any app | Shop P8 (operations). Done in Shop P8 (`resolve#StuckPlacement`, CartDetail) |
| F109 | P8: `resolve#Delivery` stays unscoped; Commerce has a store-scoped read-only view of delivery exceptions | Comms (a store-scoped review) |
| F110 | P8: Shop F86 (a guest's first digital order waits for approval) left for Sales; a store turns the approval checks off | Sales |
| F111 | P8: the "Log as note" response action, the IntegrationDetail and Product360 prompts and the channel-retry skill not built | Done: Log as note and IntegrationDetail's prompt in P13; Product360's "Summarize recent reviews" in P15 (CommerceAccess) |
| F112 | P8: RecurringTemplate bases are not left out of Orders until Shop P7 marks them | Resolved by Shop P7 (`withoutRecurringBases`) |
| F113 | P8: Mantle scoped a store order by its store alone, Commerce.js also by the vendor | Fixed in the review (R2): Mantle requires the vendor too |
| F114 | P8 review: `heldOrderIds` and `cancelRequestOrderIds` take the first 500 open holds or cancel requests of all stores before the store filter | P11 (a view joining the order's store) |
| F115 | P8 review: Customer360 shows a customer's current emails and addresses to a store operator, as Customer Service does; design §10 masks only payment methods | Accepted |
| F116 | P8 review: Order again needs only COMMERCE_ORDER_VIEW, so a read-only operator can make open orders | Accepted (nothing placed or charged) |
| F117 | P8 review: a store's checkout support queue brings every case of that queue into the store's cases | Accepted; a store's own queue is the deployment's choice |
| F118 | P9 follow-up: CheckoutSettings does not edit `PsstCheckoutOptIns` or `PsstNewsList`; a store sets them by data | P10 or P15 |
| F119 | P9 follow-up: the receipt's confirmation link needs an OrderPlaced store email and an Account mount on the site; the demo's generic template shows it as a plain line | Accepted; P15 for the demo template |
| F120 | P9 follow-up: every OrderPlaced receipt does one indexed StoreCheckout read for the link | Accepted |
| F121 | P9 follow-up: BOSS's Comms Consent screens show the topic lists and a pending checkout choice as a "Pending Acceptance" member | Accepted |
| F122 | P9 follow-up: the confirmation page has no render spec (EmailPreferences has its one render; the rule is tested in Mantle) | Accepted |
| F123 | P9 follow-up: a guest's review request links the Review page, which asks them to sign in (a review needs a verified account) | Accepted |
| F124 | P9 follow-up review: a pending topic saved unchecked on the preferences page does not end the choice, and a pending news choice cannot be withdrawn there | Done in P15: a decline box per waiting choice on Account's EmailPreferences (`choices.decline`), which ends the pending membership; a confirmation then grants nothing. Spec: ShopCustomer |
| F125 | P9 follow-up review: `recordCheckout`'s last StoreCheckout update runs in the placement transaction, so a database error there fails the step (the job retries) | Accepted |
| F126 | P9 follow-up review: no spec of an unverified account's own pending choice confirmed once the account verifies | Done in P15: ShopCustomer's P15 feature |
| F127 | P10: the delivery ledger ran a source's build in the attempt's transaction, so a build that threw left the delivery queued and retried every two minutes | Fixed: builds run in their own transaction |
| F128 | P10: the cart-creation throttle (30 per requester per 10 minutes) tripped when many cart-making specs ran in one process | Fixed in the review (R3): ShopCheckout's setup clears its own requester's bucket; the throttle unchanged |
| F129 | P10: "a fresh session" is a new cart capability kept in the PASS session; the HTTP session id is renewed only at a password sign-in, which carries the token over | Accepted; the sign-in page's path untested (the walk uses `login()`) |
| F130 | P10: the ledger keeps no "redeemed" fact; it is read from `recoveryUsedDate` after the latest send | P11's CartRecovery report reads the same |
| F131 | P10: the retention setting does not purge ledger rows | Comms and the privacy provider |
| F132 | P10: the Marketing automation sender is not offered | Marketing (later; picked up in impl-marketing P11) |
| F133 | P10 review: each job run re-reads every signed-in idle cart in the window (up to 500 a store, newest first), most already handled | Done in P15: `StoreCartAccess.recoveryHandledDate` marks the visit handled (queued, already sent, at the most sends); the shopper's next action clears it, and the job's query skips marked carts. Spec: CartRecovery |
| F134 | P10 review: a staff send's operation key covers only the cart, so a retry with another reason gets the first answer | Accepted |
| F135 | P10 review: the rendered recovery mail, link included, is kept in EmailMessage (as the download notice's guest link is); usable only signed in as the cart's account | Accepted |
| F136 | Wave 12: CheckoutSettings joined a ship option's decimal markup to text with `+`, which the framework's decimal refuses (valueOf); it failed only after CarrierServices gave POPC_DEFAULT a markup | Fixed: `String()` of each amount |
| F137 | P11: the sales summaries' `ordersThis`/`ordersLast` are wrong when the current period has no sales (the date histogram has no bounds) | Sales and Accounting (bounds change their default answers); Commerce matches buckets by start day |
| F138 | P11: without `currencyUomIds` the summaries still add amounts across currencies, as before (Accounting's and mr-marble's sales screens) | Accounting (later) |
| F139 | P11: the sales index has no RecurringTemplate marker, so once Shop P7 makes bases, Online sales and Home would count them | Resolved by Shop P7 (`MantleSalesOrderItem.orderPurposeEnumId`) |
| F140 | P11: each dataset is one document type, so the store operations dataset ships as checkouts and payment attempts; datasets ADMIN-only until Insights applies a store scope | Insights (later) |
| F141 | P11: cart recovery's eligibility is not historical ("signed in") | Accepted |
| F142 | P11: Insights' catalogue registration (Z10), the graph views and further ReportScope choices not built | Later |
| F143 | P11: ten mr-boss acceptance failures outside P11 (CommerceFoundationWalk, CommerceSitePagesWalk, four Customer Service walks, two Purchasing replenishment walks, TuiRender) | Fixed (Nov 6, `com/accfix`): none was a framework regression. Stale expectations (CommerceFoundationWalk after P5/P10, CustomerServiceKnowledgeWalk after Shop P3); walks sharing one database (SitePagesWalk after AssortmentWalk, SupportWalk, ReportsWalk, TuiRender); two real bugs: NewCase's duplicate warning filtered open cases after taking the newest ten, and Mantle `store#Preferences` made an organization's first own PartyAcctgPreference with only the fields passed, so it lost its inherited currency (it now starts from the inherited fields, with an AccountingSetup check). Full `./moq accept mr-boss`: 460 of 461 server (AppStructure's floor, P11's), 169 of 169 client |
| F144 | P12: a refund of the latest term while a renewal payment is with the provider lets that renewal be placed and its term granted, so the buyer pays once more but gets that term | Accounting: the coordinator releases or refunds that payment (a gateway call outside the steps' locks) |
| F145 | P12: `find#StoreSubscriptions` does not list the storeless Subscription rows of native sales orders | Sales' mount |
| F146 | P12: the Paid access pane names PASS SiteDetail's subscription binding (on each site's own host) instead of linking it | Accepted |
| F147 | P12: `dispatch#Renewal` and `run#Renewals` are anonymous-all (internal, allow-remote false) | Accepted |
| F148 | P12 review: `run#Renewals` limits its due batch (100) before leaving out contracts with an in-flight occurrence, so many in-flight renewals can delay newly due ones to the nightly hand-off | Done in P15: `dueContracts` leaves out in-flight contracts a page at a time before the batch is cut. Spec: ShopSubscriptions |
| F149 | P12 review: a concurrent double submit of one retry key gets a duplicate-key error instead of `alreadyApplied` (every `lib.operation` caller does) | Accepted (one charge either way) |
| F150 | P14: ShopCatalog's candidates stopped at 2,000, so a feed listed at most 2,000 products | Fixed in the review (R3): the build pages the store's publication rows (5,000-row feed limit, the rest ROW_LIMIT skips) |
| F151 | P14: every publication change (pages, menus, themes) advances the generation, so a served feed is re-resolved on each | Later: each withdrawal's generation recorded |
| F152 | P14: price and stock changes don't advance the generation, so a feed keeps its build's prices until the next build | Accepted (scheduled builds) |
| F153 | P14: no demo feed (the demo Shop sites are disabled until published) | Accepted |
| F154 | P14 review: `store#StoreFeed` checks only that a category exists, so a feed may name another organization's category (its rows are still the store's published products) | Done in P15: the feed's category is one the store may carry (owner the store's organization or shared). Spec: StoreFeeds |
| F155 | P14 review: `find#StoreFeeds` reads at most 200 feeds before filtering and paging | Accepted |
| F156 | P14 review: an allow-list category membership scheduled for later takes effect without a generation change, outside R2's check | Done in P15: a membership of the store's allow-list categories that started or ended counts as a change taken effect in the serving check. Spec: StoreFeeds |
| F157 | P14 review: a remote frontend receives the whole feed artifact in one answer (up to 5,000 rows) | Later (streamed) |
| F158 | P13: Home's Integration errors card was left to P14 | Built by P14 (the channel operator's attention count) |
| F159 | P13: P11's "intake error spikes" alert is not shipped (it needs a search document over SystemMessage, indexing every message write) | Later |
| F160 | P13: the paused `consume#AllReceivedSystemMessages` job, if turned on, retries business refusals (ITEM_UNKNOWN) up to three times; no second order is made | Accepted |
| F161 | P13: a corrected resend of a failed order under the same external ID is quarantined as a conflict; no "replace the failed original" action | Later |
| F162 | P13: the framework has no staged SystemMessage status, so Mantle seeds `SmsgStaged` | Accepted; framework later. Done Nov 6 (mr-moqui com/fw6 ced749a2): `SmsgStaged` is the framework's; Mantle no longer seeds it |
| F163 | P13: version 1 channel orders carry no ship-to address | Later (mapping version 2) |
| F164 | P13: AppStructure's placeholder floor drops from 40 to 39 (Integrations is no longer a placeholder) | At the merge (acceptance) |
| F165 | P13 review: two concurrent `commit#ChannelImport` calls on one batch both pass the Staged check; orders stay single (R1) but the second ends with a PostingOperation key error | Done in P15: `claim#ChannelImport` (the batch locked, in its own transaction) claims the staged batch once. Spec: StoreChannels |
| F166 | P13 review: the commit's digest covers the file, format, remote and mapping version, not the preview's outcomes | Accepted (dedup holds) |
| F167 | P13 review: a binding's customer may be any Customer-role party not private to another user, not only the organization's own | Done in P15: the store organization's own or shared (`_NA_`) customer, not internal, not disabled. Spec: StoreChannels |
| F168 | P13 review: a replay of a failed original is kept as a duplicate with no order, and still has none after the original is retried | Done in P15: when the original's order is made, its matching replays answer it. Spec: StoreChannels |
| F169 | P13 review: `importText`'s 2 MiB limit counts characters, the upload path bytes | Done in P15: the pasted text's UTF-8 bytes. Spec: StoreChannels |
| F170 | P15: the download review-request trigger queues after commit on a worker, so specs wait for it | Accepted |
| F171 | P15: Forum writes lock the operator's account row, which a data load's transaction already holds once it signs the demo administrator in; the Forum demo step is its own data file | Accepted |
| F172 | P15: the server-static sweep: 10 of 114 Commerce screens clean, none marked; Stores and StoreDetail/General failed its wrapped render ("not a function") | The two fixed in the review (R1: the locale list in actions); marking screens server-static later; framework: a missing member of the wrapped `ec`'s areas should be a recorded violation, not undefined. Framework part done Nov 7 (mr-moqui com/fw7 80674e9d, 361f0553): a missing member of the wrapped ec is a recorded wrapped-ec violation; the locale lists of Navigation, SearchContent, Pages and PageRoute moved into actions |
| F173 | P15: the demo has no store cart, recurring contract, feed or store return, so the sweeps show those detail screens "not available" | Later (demo records) |
| F174 | P15: Product360's Costs, Suppliers and PurchaseHistory tabs are reachable by URL under Commerce; their conditions keep them empty (the isolation walk checks it) | Accepted |
| F175 | P15: F165 and F103 are checked as a claim and a lock, not with concurrent threads | Accepted |
| F176 | P15 review: with a waiting topic's own box and its decline box both checked, it is declined then turned on | Accepted |
| F177 | P15 review: CommerceIsolationWalk makes a BOSS_COM_DIGITAL theme draft each run and never removes it | Later |
| F178 | Final: CustomerServiceAssignmentWalk (round robin, an agent outside their hours) and CustomerServiceOrdersWalk (StockAtDate's as-of day) fail in the evening, US Central (after 00:00 UTC): each compares a local day or hour with a UTC one | Customer Service (acceptance walks) |

## 7. Later

Designed, not in this build:

- **The design's later scope** (§15, §17): Liquid compatibility, advanced B2B purchasing, POS, a theme marketplace, the
  Publishing app, loyalty and cross-store programs, git-backed themes (R-COM-L01).
- **Gift cards and store credit, and click and collect** (design §16, the user's call of Nov 5): a gift-card product
  that issues a financial account, the store-credit refund and the payment method; a pickup option per store facility
  with its availability and ready-for-pickup notice.
- **Other apps' registrations and mounts:** Admin §14 readiness (`check#StoreReadiness`) and recovery
  (`retry#StoreMessages`), Admin §11's ChannelImport import target, Admin's privacy provider and request page with Shop's
  store provider; Insights' catalog registration of Commerce's reports and its attention provider; Marketing's mounts of
  the promotion screens and Pages with its campaign context (picked up in impl-marketing P19 and P14), its tracking,
  visits and conversion, attribution at placement (P15, P20), the automation sender in RecoveryPolicy (P11) and the
  checkout news opt-in through its subscription service (P7); Sales' mount of Subscriptions (picked up in impl-sales
  P16).
- **Video help from an order** (L7), through Customer Service and an Event with a CallLink.
- **EDI over SPS** (E2 of the payments plan), when that is built.

## 8. Verification

- **Per phase,** the "Done" rule of §2.
- **End to end,** run `./moq run`, sign in as each demo Commerce user, and walk each built phase's "usable when" in
  order; open the demo Shop site as an anonymous visitor, a guest buyer and a signed-in buyer, locally and through a
  remote frontend (impl-shop §8).
- **Design §12.2 scenarios,** each an acceptance test (`./moq accept mr-boss`, `./moq accept mr-pass`, when asked):

| Scenario | Phase |
| --- | --- |
| 1. A reader sees only permitted stores; a designer cannot publish, read credentials or change prices; another organization's store refused everywhere | P1, P5; P15's walk |
| 2. Clone a store; a digital-only store without a facility | P2; P6 for the digital store's checkout |
| 3. Publish a product with variants; withdraw it, and catalog, search, feed, cache and cart agree | P3; Shop P3, P4; P14 |
| 4. Move a shared category; impact preview, cycles and stale edits refused, the terminal twin agrees | P3 |
| 5. Theme: arrange, edit, preview, validate, publish, roll back; script and network attempts fail; a bad optional section isolated | P5; Shop P2; the required checkout component Shop P5 |
| 6. Content and navigation; scheduled publication rechecks access; a restored theme does not republish withdrawn content | P4, P5 |
| 7. A physical, digital and subscription purchase found in Commerce, Warehouse and Accounting; one event and notice of each kind | Shop P5–P7; P8 (physical and digital), P12 (subscription) |
| 8. Price, stock or address changed during checkout; a pending payment freezes the snapshot; failed capture grants no access | Shop P5, P6 |
| 9. Recovery: one notice to an opted-in inactive cart, none to the others; an unrelated failure does not stop the batch | P10 |
| 10. Review moderation: private identity omitted, an edit back to pending, decisions independent | P9 |
| 11. Renewal once per occurrence; no double charge; cancel keeps the paid term; refund keeps independent grants | Shop P7; P12 |
| 12. Channel import duplicates and conflicts; a feed never serves withdrawn items | P13, P14 |
| 13. A Shop question, return request and cancel request, worked in Customer Service and shown in Commerce | Shop P6; P8 |
| 14. A capture failure's `OhtPayment` hold, released only by Accounting; a refund revokes one source grant | Shop P5, P6 (downloads), P7; P8 (the hold), P12 (paid access) |
| 15. Reports agree with the owners' order and revenue metrics; bases and carts never counted | P11 |

- **Walks.** One golden-path client walk for Commerce in the regression suite (CommerceThemesWalk, from P5); the others,
  and Shop's at phone and desktop widths in mr-pass, are acceptance tests. No screenshots.
