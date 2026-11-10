# Products implementation

The Products build covers catalog masters and Product360, taxonomy and features, selected variants, dated sales and supplier prices, stock policy, manufacturing methods, standard estimates, documents and translations, units, packaging, identifiers and labels, durable imports, catalog checks, and authorized outputs.

Business rules and record guards are native Mantle services, including the organization catalog and variant settings, reviewed bulk price changes and stock totals. BOSS owns app capabilities (derived from the Moqui permissions Mantle checks), screen context and forms; its service scripts share `service/ironstone/products/ProductsLib.js`. Mantle boots and tests without BOSS, checks shared Moqui permissions, and has no BOSS group or `ironstone.*` references. BOSS group permission assignments are in `data/BossSetupData.xml`.

The P8/P9 review decisions are implemented:

- BOM inspection retains the full tree. Planning requirements and buildable quantity stop at stocked, non-phantom subassemblies; phantoms include their routing. `fullBlowThrough` retains the alternative for authorized callers.
- Cost roll-up uses approved subassembly estimates or computes them in low-level order. By-products use allocation shares, falling back to quantities. Overhead applies to material plus conversion once per level, the BOM base quantity defines the lot, and the total is rounded once.
- Standard estimates are dated records with audited amounts. Approval alone makes no stock or ledger posting. Customer order lines snapshot a standard only when the customer is not an internal organization.
- Accounting revaluation changes on-hand `Asset.acquireCost` forward and splits a partly issued asset. It never reposts historical movements. One balanced accounting transaction records the on-hand difference with asset links and the revaluation offset account type. It rejects negative stock, future dates and dates before the last posted movement. `PartyAcctgPreference.inventoryRevaluationEnabled` defaults off; native authorization, mappings and fiscal-period checks still apply when enabled.

Imports stage actor-private CSV and keep mapping, preview and row outcomes durably. Apply rechecks inputs, commits independent rows separately, keeps product-plus-identifiers atomic, skips completed rows on retry and provides results/error CSV. A source is limited to 2 MiB and 5,000 rows. Price changes use the native price writer; a validated import sends one aggregate result notice.

Effective price outputs use `mantle.product.PriceServices.get#EffectivePriceList`. The selected published list, date, quantity, quantity unit and counterparties define the output. Missing prices remain blank; an independent resolution failure is named and does not stop other rows. Products outside the user's owner scope never enter the rows or document. The screen exports CSV/XLSX and opens matching printable HTML/PDF. One output accepts up to 1,000 products; filter by product IDs for a larger catalog.

Shared catalog contexts are implemented for Products, Warehouse, Manufacturing, Purchasing, Customer Service and Commerce; Accounting has its own Product360 presentation. Their boundaries and extension procedure are in [ProductsSharedScreens.md](ProductsSharedScreens.md). Configurable products, change notices and other deferred Products features remain separate work.

Construction history and past verification are recorded in [the implementation plan](../plan/impl-products.md). Current activity coverage, findings and verification belong to [the Products UI review](../plan/ui-review-products.md); historical test results do not establish current review coverage.
