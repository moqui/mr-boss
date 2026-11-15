# IronStone BOSS — Branded product companies with outside manufacturing

Nov 14, 2026

A plan for one common customer model: a company that owns a brand and its products but has them made by contract
manufacturers, then sells them through its own web store, Amazon, wholesale resellers and major retailers. It records
what such a company needs, what BOSS, Mantle and PASS already cover (from the impl records as of this date), the gaps,
enhancements beyond what these companies usually run, and an order of work. Each work item below gets its own design
and impl record under the [document guide](design-doc-guide.md) before it is built; this file decides scope and order,
not screens.

## 1. The business model

- **Size:** 10 to 50 people, often fewer than ten in operations. The ERP is the core accounting system; there is no
  separate finance platform, and the bookkeeper or controller works in the same system as the warehouse.
- **Products:** the company owns the formulas or designs, the brand, packaging and labels, and the product data.
  Catalogs are small (tens to a few hundred SKUs), with variants by size or count, and kits or bundles. Many categories
  are regulated or shelf-life bound: dietary supplements, food and beverage, cosmetics and personal care, pet products,
  household chemicals. Lots, expiry dates, recalls and claims review matter.
- **Manufacturing:** contract manufacturers (co-packers, private-label makers) produce finished goods. The brand
  either buys finished goods on a purchase order, or supplies some components (labels, bottles, cartons, a key
  ingredient) and pays a tolling fee. Some do light kitting or relabeling in house. Some manufacturers are abroad, so
  imports, duty and freight in transit are part of the cost.
- **Fulfillment:** the company's own warehouse, a 3PL, Amazon FBA, or a mix. Parcel to consumers; cartons and pallets
  to resellers and distributors.
- **Channels:**
  - direct to consumer on the company's own store, with promotions, reviews, newsletters and often subscriptions;
  - Amazon, fulfilled by Amazon (FBA) and sometimes by the seller (MFN), and other marketplaces after it;
  - wholesale to distributors, independent retailers and online stores, on price tiers and net terms;
  - major retailers over EDI, both stocking orders to their distribution centers and drop-ship orders to consumers;
  - often a professional channel (practitioners, salons, clinics) and influencer or affiliate programs.
- **What they typically replace:** a web store platform, a small-business accounting package, a shipping tool, Seller
  Central reports in spreadsheets, an EDI provider's web portal, an email marketing service, and spreadsheets for
  inventory at the manufacturer and at Amazon. The value of one system is that orders, stock and money from every
  channel reach the same ledger without re-keying.

## 2. What is built

From the impl records; status as of Nov 14, 2026. Gaps in each area are in §3.

| Area | Built | Records |
| --- | --- | --- |
| Accounting core | GL, chart setup, period close and year end, AR with statements, dunning and credit holds, AP with 3-way match, payment runs, NACHA and Positive Pay, bank statement import (BAI2, OFX, CSV) and reconciliation, financial statements with comparisons, budgets, book fixed assets, audit and separation of duties | [impl-accounting](impl-accounting.md) |
| Costing | actual cost per receipt, revaluation, landed cost allocation of bill charges onto receipts | [impl-accounting](impl-accounting.md), [AccountingImplementation](../docs/AccountingImplementation.md) |
| Sales tax | in-house rates by authority and geography, nexus rows, a per-customer exemption flag | [impl-accounting](impl-accounting.md) P14 |
| Purchasing | POs with approvals, supplier prices, RFQs, reorder rules into supply planning, buy suggestions to draft POs, the PASS Supplier portal (quotes, PO acknowledgement, bills) | [impl-purchasing](impl-purchasing.md) |
| Contract manufacturing | subcontracting as a production run whose operation a supplier performs: components sent to a vendor-custody facility, output received and held, the service line accepted and billed | [impl-manufacturing](impl-manufacturing.md) P14 |
| Lots and quality | lot capture at receipt, expiry gate and FEFO reservation, receipt inspection into quarantine with disposition, upstream and downstream traceability | [impl-warehouse](impl-warehouse.md), [WarehouseImplementation](../docs/WarehouseImplementation.md) |
| Warehouse | bins, putaway, pick, pack and ship, batch picking, handheld screens, counts, transfers, returns with inspection, printers | [impl-warehouse](impl-warehouse.md) |
| Shipping | Shippo for rates, labels, tracking and address validation over the company's carrier accounts; local rate bands | [payments-shipping-edi](../../mr-mantle/plan/payments-shipping-edi.md) S1, [impl-commerce](impl-commerce.md) |
| Payments | Authorize.Net and PayTrace, card on file | [payments-shipping-edi](../../mr-mantle/plan/payments-shipping-edi.md) P1, P2 |
| EDI | X12 004010: 850 in; 855, 856 (with SSCC) and 810 out; 997 both ways; partner profiles and crosswalks; SFTP or REST transport | [EdiX12](../../mr-mantle/docs/EdiX12.md), payments-shipping-edi E1 |
| Web store | IronStone Shop: catalog, cart, guest and account checkout, themes, SEO pages, reviews, cart recovery, promotions and codes with limits | [design-shop](../../mr-pass/plan/design-shop.md), [impl-commerce](impl-commerce.md) |
| Channel intake | Commerce ChannelImport (file or JSON, dedup, per-item results), Google, CSV and JSON product feeds, channel health | [impl-commerce](impl-commerce.md) P13, P14 |
| B2B | price lists by classification with quantity breaks, customer agreements and prices, quotes, the PASS Sales and Billing portals | [impl-sales](impl-sales.md), [impl-products](impl-products.md) |
| Marketing | lists, consent, segments, campaigns, A/B tests, drip automations, public subscribe and preferences | [impl-marketing](impl-marketing.md) P1 to P11 |
| Service, people, insights | cases, knowledge base, returns, CSAT; HR and outside payroll import; dashboards, scheduled reports and alerts | impl-customer-service, impl-people, impl-insights |

## 3. Gaps for this model

In rough order of how often they block a company of this kind.

### 3.1 Amazon, FBA first

Most branded product companies sell on Amazon, and most of those use FBA. Today Mantle has an Amazon sales channel
enum and ChannelImport, and nothing specific to Amazon. What a company needs:

- **Stock at Amazon.** FBA inventory is the company's stock at a facility it does not operate. The facility model for
  that ("facilities owned by a third party that hold the organization's stock", ExternalStockSync WH-SYNC) is in
  [impl-warehouse §7](impl-warehouse.md#7-later). Inbound shipments to Amazon are transfers from the company's
  warehouse (or straight from the manufacturer) with Amazon's shipment and carton identifiers; removals and disposals
  come back as transfers out or write-offs.
- **Identifiers.** SKU, ASIN and FNSKU per product, beside the GTIN; FNSKU labels when the company labels its own units.
- **Orders.** FBA orders are sales from the Amazon facility, shipped by Amazon: an order and an issued shipment with no
  pick, against a marketplace customer (buyer details are restricted and usually not needed). Seller-fulfilled orders
  need the ship-to, which is ChannelImport's F163 (mapping version 2 with an address crosswalk,
  [impl-commerce](impl-commerce.md) P13 findings), and confirming the shipment with tracking back to Amazon.
- **Settlement.** The settlement report is where Amazon's money is: per order the principal, the marketplace-facilitator
  tax Amazon collects and remits, promotions, referral and FBA fees, refunds and reimbursements, storage and inbound
  fees, advertising charges, reserves, and the deposit. It should post as a receivable from Amazon through a clearing
  account, fees as Amazon bills or direct expense by type, facilitator tax outside the company's own tax liability, and
  the deposit matched to the bank line. This is the same shape as a payment gateway's payout and a marketplace's
  payout elsewhere, and payments-shipping-edi §1 already names "provider settlement/fee reconciliation" as a later
  accounting integration: build one settlement model and use it for all of them (§5, BP1).
- **Inventory reconciliation.** Amazon's inventory and adjustment reports against Mantle's quantities at the FBA
  facility: lost, damaged, found and reimbursed units, with reimbursements tied to the settlement.
- **Shelf life.** Amazon requires expiry dates on dated products and a minimum remaining shelf life at check-in, and
  removes stock near expiry. Inbound planning should send lots that meet the rule (the thresholds are Amazon's and
  change; read them from a setting, not code).
- **Transport.** Start from the report files (settlement and inventory) through ChannelImport, which works for any
  company with Seller Central access. Then the Selling Partner API: Login with Amazon OAuth, the Reports, Orders, FBA
  Inventory, Fulfillment Inbound, Finances, Listings and Notifications APIs, and restricted data tokens for buyer
  addresses on seller-fulfilled orders. No Amazon SDK (payments-shipping-edi §1's dependency rule). Check the current API
  versions immediately before implementation; Amazon revises them, the inbound API in particular.

Other marketplaces (Walmart, Target Plus, eBay, TikTok Shop) and wholesale marketplaces (Faire) follow the same parts:
orders, settlement, sometimes stock. Design BP1 to BP3 so that the second marketplace is a new adapter, not a new model.

### 3.2 EDI for major retailers

The X12 documents are built; the connection to retailers is not. Mantle's E2 (SPS Commerce, [payments-shipping-edi
§6](../../mr-mantle/plan/payments-shipping-edi.md#6-edi)) is the planned path and still the right one: a small brand
reaches retailers through an EDI provider, and AS2 stays a future transport. Beyond E2, what retail vendors need:

- **Retail drop-ship.** Retailers' websites send consumer orders for the brand to ship: an 850 with a consumer ship-to,
  the 856 and 810 back, and an 846 inventory advice the retailer requires on a schedule. 846 is outside the initial EDI
  scope in payments-shipping-edi; for this model it is needed early.
- **Compliance.** Routing guides (ship windows, carriers, carton and pallet labels, ASN timing), per retailer, as
  partner profile settings that Warehouse enforces at pack and ship; the 856 must match the cartons.
- **Deductions.** Retailers pay short: compliance fines, shortages, promotional allowances, returns. The 820 remittance
  and 812 adjustments should land in AR as deductions with reason codes, matched to invoices, with a dispute workflow
  that attaches the proof (ASN, proof of delivery, the routing request). Small brands lose real money here.
- **Item setup.** Retailers ask for product data sheets: GTIN, case and inner pack, dimensions and weight, pallet tie
  and high, shelf life. Most fields exist on Product and its packaging; a per-retailer export is the missing part.

### 3.3 Trade accounts and the reseller program

Wholesale to independent retailers needs a public front door that BOSS does not have:

- **Trade account application** in PASS: business name, tax and resale numbers, addresses, a resale certificate upload,
  the channel (store, online, distributor, practitioner), references or a credit application. Approval in Sales sets
  the classification (and with it the price list), terms, credit limit and tax exemption.
- **Resale and exemption certificates** as records, not a flag: state, number, expiry, document, the customer and
  authorities they cover; tax calculation reads them, and Accounting sees expiring ones. Today exemption is a
  per-customer, per-authority flag ([impl-accounting](impl-accounting.md) P14).
- **Reseller ordering** in PASS: sign in, see the reseller's prices, order by case pack with minimums enforced, reorder,
  pay on terms through Billing. Order minimums and case-pack quantities exist as data (price-row `minQuantity`,
  packaging products) but are not enforced at order entry.
- **Where to buy.** A public store locator over approved retailers who opt in, with the products each carries, kept
  current by the retailer from the portal. The brand's site sends consumers to them, which is part of what the brand
  offers its retailers.
- **Brand assets** for resellers: product images, sell sheets and shelf talkers, by product and current version, from
  the portal.

### 3.4 Recall readiness

Traceability is built (`get#Traceability`, upstream and downstream through receipts, runs, transfers, shipments and
returns). The missing part is acting on it:

- a lot hold that puts every unit of a lot, wherever it is (own warehouse, 3PL, Amazon, the co-packer), on hold in
  one action, with the off-site locations told to hold too;
- a recall record: the lots, the reason, the classification, status, and the affected customers from traceability
  (consumers, resellers, Amazon), with notices sent through Marketing or Comms and their delivery tracked;
- returns and destruction against the recall, and an effectiveness count (units recovered against units shipped);
- mock recalls: the same steps on a test lot with the elapsed time recorded, which regulated buyers and auditors ask
  for.

### 3.5 Contract manufacturer collaboration

Subcontracting is built around a production run; the manufacturer's side of it is not:

- the subcontract view in the PASS Supplier portal ([impl-manufacturing §7](impl-manufacturing.md#7-later), impl-purchasing
  F174): the job, its components on hand at the manufacturer, the schedule;
- the manufacturer reporting the run: output quantity, its own lot numbers and expiry dates, component usage and
  scrap, so the brand's stock of components at the manufacturer is right without a count;
- certificates of analysis as records with test results checked against the product's specification, not only a file
  on the inspection (Warehouse P8 attaches files);
- yield and cost variance per run against the BOM and the quoted tolling cost.

### 3.6 Physical subscriptions

Subscribe-and-save on consumables is common, especially in supplements, coffee, pet food and personal care. Shop's
subscriptions are for access only, and physical subscription orchestration is later in
[design-shop](../../mr-pass/plan/design-shop.md). Needed: a recurring order of physical products from the Shop with
the customer's skip, pause, swap and change of date, the card-on-file renewal and dunning that Shop P7 already has,
stock reservation ahead of the ship date, and a forecast of upcoming subscription demand for supply planning.

### 3.7 Smaller gaps

- **Sales tax across states.** Selling online creates economic nexus state by state. Track sales and transactions per
  state against each state's thresholds, and offer a tax service adapter (Avalara or TaxJar); tax services are outside
  the initial scope of payments-shipping-edi.
- **Freight.** Pallet orders to distributors and retailer DCs need a bill of lading, pallet build and LTL quotes; none
  is built ([impl-warehouse §7](impl-warehouse.md#7-later) has delivery trips later). Direct carrier adapters stay
  as payments-shipping-edi S2 says: when a deployment needs one.
- **Imports.** Landed cost exists; the duty and customs broker charge types are deferred
  ([impl-accounting §7](impl-accounting.md#7-later)), and goods in transit on an ocean shipment are not modelled.
- **Payments.** Stripe is the planned next adapter (payments-shipping-edi P3); PayPal is a later candidate. Many web
  stores of this kind expect both.
- **Content.** Blog and landing pages (Marketing P14) and public forms (P12) are planned; a brand's content marketing and
  sign-up forms depend on them.
- **Gift cards and store credit**, and **loyalty** ([impl-commerce §7](impl-commerce.md#7-later)).
- **1099-NEC.** Only 1099-MISC statements are produced; contractors are reported on 1099-NEC.
- **COGS method.** `cogsMethodEnumId` is chosen at accounting setup (`mantle/ledger/AccountingSetup.js`) and read by
  nothing; costing is always actual cost per receipt. Either implement average cost (the method most small companies
  use) or stop offering the choice.

## 4. Enhancements beyond the usual

What these companies rarely have, even with several tools, and what one system with every channel's data can do.

- **Contribution margin by channel, SKU and customer.** Revenue less product cost, freight in and out, marketplace and
  FBA fees, payment fees, promotions, returns, retailer deductions and advertising, per channel and per SKU. Most small
  brands cannot say whether Amazon or a given retailer is profitable after fees and chargebacks. An Insights dataset
  over the settlement model (§3.1), deductions (§3.2) and landed cost.
- **Shelf-life aware allocation.** Per customer or channel minimum remaining shelf life (retailers commonly require
  months of life at receipt, Amazon has its own rule), applied when stock is reserved; short-dated lots routed to the
  company's own store, clearance or donation before they expire. Built on the expiry gate and FEFO that exist.
- **Planning for outside manufacturing.** Supply planning that knows the manufacturer's lead time, minimum run and
  component lead times, demand from every channel (store, subscriptions, Amazon, wholesale, EDI forecasts), stock at
  every location including Amazon and in transit, and shelf life, so a run is neither late nor large enough to expire.
  Weeks of supply by SKU and location on Home.
- **Trade promotions.** Retailer and distributor promotions (off-invoice, scan-backs, slotting fees, co-op advertising)
  as programs with accruals, settled against the deductions they cause; promotion return on spend in Insights.
- **Product compliance records.** Specifications and formula versions shared with the manufacturer; label and claims
  versions with an approval step before a run uses them; certificates with expiry (organic, GMP audits of each
  manufacturer, allergen statements); safety data sheets. Each run names the versions it used, so traceability reaches
  the label as well as the lot.
- **Complaints and adverse events.** Customer Service cases that name a product and lot, trend by lot and by
  manufacturer, and, for categories with mandatory reporting (US dietary supplements and cosmetics report serious
  adverse events to FDA within set deadlines), a reportable-event flag with its deadline and the report record.
- **Manufacturer scorecards.** On-time delivery, yield, quality holds and COA failures, cost variance and responsiveness
  per manufacturer, from the records that exist.
- **Reseller price and channel monitoring.** Minimum advertised price policy per product, with reseller feeds or
  pages checked against it; unauthorized Amazon sellers on the brand's listings flagged for the brand team.
- **Sampling, influencer and professional programs.** Samples to retailers, practitioners and influencers as
  zero-price orders charged to a marketing expense, influencer codes with attribution and commission (commissions are
  deferred in [impl-sales](impl-sales.md)), and professional accounts verified like trade accounts with their own price
  list.
- **Consumer scan.** GS1 Digital Link QR codes on the package (DataMatrix and GS1-128 labels are built) that open the
  product's page, its current label and, with the lot in the code, that lot's certificate, while counting scans by lot
  and region for marketing.
- **Review requests by lot.** Ask for a review after delivery, keep the shipped lot on the review, and show quality
  trends by lot alongside complaints.
- **Packaging reporting.** Several US states and other countries have extended producer responsibility laws for
  packaging: packaging material and weight per SKU, units sold into each jurisdiction, and the report each program
  needs. Packaging products and sales by ship-to are already in the data.

## 5. Order of work

Each item is a design and impl record of its own (BP = branded product). The order puts the shared models first, so
Amazon, retailers and the reports reuse them.

| # | Item | Owner | Depends on | Notes |
| --- | --- | --- | --- | --- |
| BP1 | Settlement model: a provider payout with lines by type (sale, refund, tax collected by the provider, fee, reimbursement, reserve, adjustment), posting rules to a clearing receivable, fee bills or expense, and the deposit matched in bank reconciliation | Mantle accounting, BOSS Accounting | — | Also the payment gateways' settlement gap. First import: Amazon's settlement report through ChannelImport |
| BP2 | Facilities operated by others: the company's stock at a 3PL or Amazon, snapshot import and reconciliation, inbound and removal transfers | Mantle, BOSS Warehouse | — | impl-warehouse §7's third-party facilities and WH-SYNC; reuses subcontracting's vendor-custody facility |
| BP3 | Amazon: identifiers, FBA orders and shipments from the BP2 facility, seller-fulfilled orders with addresses (F163), report imports, then SP-API | Mantle ext, BOSS Commerce | BP1, BP2 | Start with files; SP-API after. Shelf-life rule for inbound lots |
| BP4 | Retail EDI: E2 SPS, then 846 inventory advice, retail drop-ship profiles, routing guide settings, 820 and 812 with AR deductions and disputes | Mantle EDI, BOSS Accounting, Warehouse | E2 | Deductions also feed §4's margin and trade promotions |
| BP5 | Trade accounts: the PASS application, resale certificate records used by tax, approval in Sales, reseller ordering with case packs and minimums, where-to-buy, brand assets | PASS, BOSS Sales, Mantle tax | — | Certificate records also close the exemption gap in §3.3 |
| BP6 | Recall and compliance: lot hold everywhere, recall records and notices, mock recalls, COA records with spec checks, compliance document records | Mantle, BOSS Warehouse, Products, Customer Service | BP2 for off-site holds | §4's compliance records and complaints can follow in the same app areas |
| BP7 | Manufacturer collaboration: the Supplier portal's subcontract view, run reports with the manufacturer's lots and component usage, scorecards | PASS Supplier, BOSS Manufacturing, Purchasing | — | impl-manufacturing §7, impl-purchasing F174 |
| BP8 | Physical subscriptions in Shop | PASS Shop, Mantle order | — | design-shop's later item; demand into supply planning |
| BP9 | Insights for the model: contribution margin, weeks of supply, manufacturer scorecards, shelf-life exposure | BOSS Insights | BP1, BP2, BP4 | Datasets over what the items above record |

The smaller gaps in §3.7 are scheduled where their owners' plans already are (Marketing P12 and P14, payments P3,
Commerce's later list), except 1099-NEC and the COGS method, which are small enough to do on their own. The other
enhancements in §4 wait until a deployment asks, with BP1 to BP9 recording what they need.

## 6. Open questions

- Whether BP2's facility model also covers consignment at a reseller, or that stays separate.
- Whether the first marketplace after Amazon is Walmart or a wholesale marketplace, which decides how general BP3's
  order and listing parts must be at first.
- Whether SPS, or a provider like Orderful, is the first EDI connection; payments-shipping-edi E2 asks for the choice to
  be made right before implementation, against a real retailer.
- How much of the professional channel (practitioner verification, dispensing) belongs in BP5 and how much is its own
  item.
