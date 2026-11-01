# Review: design-sales.md and design-marketing.md

Reviewer pass, Nov 1, 2026, of the Oct 31, 2026 drafts. Checked against research-sales.md, research-marketing.md, design-crosscut.md, Commons/Comms, the core-app designs, design-doc-guide.md §11, active Mantle XML and the reference apps. Paths are relative to the mr-moqui repository root unless the report gives a shorthand; reference-app paths are under `~/work/moquiwork/3p_other/`. The coordinated decisions and dispositions are in [review-suite-apps.md](../review-suite-apps.md); this file is the reviewer's report as delivered.

1. **Summary**

- **The storeless premise is not true in Mantle (blocker).** Sales says it runs "without Commerce or a ProductStore", but order tax, shipping, promotions and confirmation emails only work through a store today. A storeless quote is untaxed, and the invoice made from it stays untaxed (the invoice tax code skips order-billed invoices). Marketing's paid tickets inherit the same problem.
- **`orderRevision` is the wrong basis for binding quotes.** The counter goes up on almost any change: storing the issued PDF as OrderContent, a file added through RecordFiles, an OrderNote, a rep reassigned through OrderPartParty, and every OrderPart status change. Binding approvals, customer links and change proposals to it makes them invalidate themselves. Customer Service's change proposal has the same problem.
- **Existing behaviour and permissions conflict with the designs.**
  - A customer declining a quote calls `reject#Order`, but Mantle allows no OrderProposed→OrderRejected transition, and the framework enforces transitions.
  - Releasing a Change hold and approving an order both need `ORDER_APPROVE`. The same permission releases Purchase and Manual holds, so Sales' boundary ("never releases another domain's hold") cannot hold as written.
- **Both automation registers are incomplete (checklist item 9).**
  - Sales leaves out the five Order revision EECAs, `OrderPreApproveCredit`, `ShipmentShippedFinalizeInvoices` and the two Request EECAs that fire on RFQs.
  - Marketing describes the paid-ticket rules only generically and designs no SMTP bounce intake.
- **Four contracts have only one side.**
  - Nobody writes `TrackingCodeVisit`, `TrackingCodeOrder` or the attribution record when an order is placed.
  - Marketing's first release needs a lead-intake service that Sales schedules as "later" and puts in the wrong package.
  - Commission payout has no matching input on the People or Accounting side.
  - Agreement statuses are seeded by both Sales and Purchasing, with different IDs, and each has its own AgreementDetail.
- **New stores duplicate built or planned ones.** Four delivery engines (Marketing sends, Shop's outbox, Commerce cart recovery, Sales reminders). A third preferences/unsubscribe page beside the two that exist. Two survey publication/invitation models. A third public payment entry point for event registrations.
- **Organization scoping and the registry have gaps.**
  - `MANTLE_USER_ORG` has no filter rows for SalesOpportunity, Agreement, MarketingCampaign, ContactList or MarketSegment, and SalesOpportunity and MarketingCampaign have no organization field.
  - The crosscut per-app tables lack Sales rows in §§3.1, 3.7, 3.8, 3.11, 3.12, 3.15 and 3.16, and Marketing rows in §§3.13 and 3.15; neither file's approval topics are registered, and Marketing is missing from the §5 PASS apps table.
- **Leverage left unused.** Sales could use the Comms provider hooks (call-context, create-from on chat and voicemail), the existing funnel panel and `report-embed`, alert rules and scheduled reports, WebRTC guest links, RequestIntake, the LLM gateway with call transcripts, and Assist tools. Marketing could use the planned framework SMS (C4) instead of its own adapter, and the email ECA pattern for bounces.
- **Both Open sections say nothing is open, though at least seven real choices remain in each.** The status lines also differ from guide §3.

2. **Counts**

| File | Blocker | Major | Minor | Nit | Easy wins | Leverage | Reference features |
|---|---|---|---|---|---|---|---|
| design-sales.md | 1 | 8 | 8 | 2 | 6 | 6 | 8 |
| design-marketing.md | 0 | 7 | 7 | 2 | 3 | 4 | 5 |

3. **Findings**

| ID | Sev | Type | Where | Finding | Evidence | Proposed fix | Other files |
|---|---|---|---|---|---|---|---|
| R-SAL-01 | blocker | wrong-basis | §5 OrderDetail quote context; §9 SalesDefaults; §13.1 | **Storeless sales orders are untaxed.** They also get no shipping charge, no promotions and no placed/approved email. `handle#OrderMajorChange` only runs with a store. `calculate#OrderSalesTax` finds its gateway only through the store. The invoice made from the order skips tax as `ORDER_TAX`. The design relies on "canonical tax/promotion services" and says stores are optional. | design-sales.md:7, :414-415, :453-454, :1280, :1364; OrderServices.xml:2636-2643, :2672-2675; TaxServices.xml:93-99; SalesTax.js:191-196, :244; OrderInfoServices.xml:1393-1394 | Add a Mantle extension: `calculate#OrderSalesTax` falls back to `PartyAcctgPreference.taxGatewayConfigId`, as `SalesTax.js` `gateway()` already does for invoices. Q recalculates tax and shipping on every draft change of a storeless order. Q sends order confirmation for storeless orders, or SalesDefaults sets an organization default store (`OrgInvoiceProductStoreId` precedent, InvoiceServices.xml:2940). Add tax to acceptance scenario 4 and to SAL-QUOTE. | Accounting (tax gateway owner), crosscut §4.1/§1.3, Marketing (paid tickets) |
| R-SAL-02 | major | wrong-basis | §5 send/revision/approval binding; §10 QuoteResponse; SAL-QUOTE | **Binding to `orderRevision` invalidates itself.** The revision goes up when the issued PDF is stored as OrderContent, on RecordFiles uploads, OrderNotes, OrderPartParty assignment (:88), OrderPartContactMech/Term changes and any OrderPart status change, including `propose#Order`. | design-sales.md:465-471, :487-490, :1020-1027, :1456; Order.eecas.xml:16-34; OrderServices.xml:2644-2648, :2679, :2851-2864 | SalesQuoteIssue stores a commercial snapshot hash (parts, items, terms, contact mechs, validity). Approvals, capabilities and staleness checks compare that hash, not `orderRevision`. Store the PDF before taking the hash. Name these EECAs as kept in §13.1. | Customer Service §4 ChangeProposal `expectedOrderRevision` (:306); crosscut §4.7 :2207 |
| R-SAL-03 | major | wrong-basis | §5 staff/PASS decline | **Decline calls `reject#Order`, which fails on a quote.** Mantle has no OrderProposed→OrderRejected transition (only BeingChanged, Placed or Cancelled), and the framework enforces transitions. `reject#Order` also means the vendor rejects. | design-sales.md:476-477; OrderEntities.xml:198-200; crates/moqui-core/src/service/call.rs:1486-1533; OrderServices.xml:2079; usl-inventory.md:621 | Customer decline uses "Cancel Quote" (OrderProposed→OrderCancelled) with the reason on SalesQuoteResponse, or seeds a "Quote Declined" OrderProposed→OrderRejected transition. Name the native revise path OrderProposed→OrderBeingChanged→OrderProposed; D7 forbids it only for placed orders. | usl-inventory |
| R-SAL-04 | major | security | §1.1 groups; §6 OrderDetail, OrderChangeDetail | **`ORDER_APPROVE` is too broad for the Sales boundary.** Native approval needs `ORDER_APPROVE`, and Change/Purchase/Manual holds all release with it. The Sales groups don't map it. Granting it lets a Sales approver release Purchase holds and approve POs by direct call, which contradicts ":564-565 never releases another domain's hold". | design-sales.md:74-80, :564-565, :603-604; OrderServices.xml:1233-1234, :1307-1308, :1371-1372; OrderHoldEntities.xml:44-51; MantleSetupData.xml:37-38 | Mantle work: give each hold type its own release permission (`enumCode`) and make approval direction-aware (sales vs purchase order approve). Map them in §1.1 and crosscut §1.4. | Purchasing (D8), Customer Service (D9), crosscut §1.4 |
| R-SAL-05 | major | duplicate | §7 AgreementDetail; status seed | **Agreement statuses and AgreementDetail are defined twice.** Sales seeds "Draft, Active, Expired, Cancelled". Purchasing seeds `AgmStDraft`/`Active`/`Expired`/`Closed`/`Cancelled` on the same StatusType, and both files define an AgreementDetail over the same baseline forms. | design-sales.md:640-665; design-purchasing.md:188, :1406; crosscut :375; ss-inventory.md:623-632; PartyEntities.xml:1009 | Seed one Agreement status flow once in Mantle (a crosscut need) using Purchasing's IDs. Use one Shared/AgreementDetail with sales and purchase contexts, or record two definitions in Decided with the reason. | Purchasing, crosscut §2/§7 |
| R-SAL-06 | major | checklist | §13.1 register | **SECAs and EECAs on Sales paths are missing from the register.** Missing: the `OrderPartHandleChange` and `*Revision` EECAs; `OrderPreApproveCredit`; `ShipmentShippedFinalizeInvoices`; `RequestTriageNotice` and `WorkEffortRequestFromWork` on RFQ requests and tasks; `EmailMessageFiling` on quote mail. "Keep confirmation semantics" for `OrderPlacedSendEmail` is a no-op for storeless orders. | design-sales.md:1273-1287; Order.eecas.xml:20-34; AccountingCredit.secas.xml:20; AccountingInvoice.secas.xml (`ShipmentShippedFinalizeInvoices`); Request.eecas.xml:19-23; Work.eecas.xml:39-42; EmailMessage.eecas.xml | Add rows: revision EECAs kept, per R-SAL-02. Credit SECA kept. Ship-finalize conditioned per D3. Request rules type-guarded per D23. Filing kept. State the storeless email path (R-SAL-01). | crosscut §1.3 |
| R-SAL-07 | major | checklist | §§3–7, §12.2; crosscut | **Per-app context rows are missing in crosscut.** No Sales rows in §3.1 ContactDetail, §3.7, §3.8, §3.11, §3.12, §3.15 (and its topic list) or §3.16. The §2 Notifications row lists four apps. Product360, InventoryAvailability, ShipmentDetail and InvoiceDetail have no Context-passed block in their Sales area, though §12.2 says they are "registered in crosscut". | design-sales.md:1225-1243; crosscut :386, :453-456, :821-826, :883-894, :1106-1113, :1126-1130, :1216-1239, :1290-1295 | Add the rows. Add the SalesQuoteApproval topic to the Commons §4 seed. Add short Context-passed blocks in Sales §§3 and 6. | crosscut, design-drawers-commons §4 |
| R-SAL-08 | major | unowned | §11 LeadIntake; §15; §12.1 P | **Nobody builds lead intake for Marketing's first release.** Marketing M5 needs `O.store#LeadIntake`/`P.submit#LeadIntake` now, but Sales puts intake and routing in "Later". The submit service sits in `mantle.order.SalesPortalServices`. Marketing LeadRules route to a team or queue while Sales AssignmentRules are later. | design-sales.md:1100-1125, :1087-1096, :1199, :1406; design-marketing.md:966, :976-981, :1601 | Put a service-only intake (`mantle.sales.OpportunityServices.submit#LeadIntake`) in Sales S1. First-release routing is the fixed team queue from the intake definition or rule. Name the build owner in both §15 and §17. | Marketing |
| R-SAL-09 | major | security | §1.1 scope | **The organization filter does not cover Sales records.** Sales says its ordinary groups use `MANTLE_USER_ORG`, but that filter set has no rows for SalesOpportunity, SalesForecast or Agreement. SalesOpportunity has no organization field; organization comes from a dated party role. | design-sales.md:62-64, :1453; MantleSetupData.xml:157-215; SalesEntities.xml:29-50 | Add `SalesOpportunity.organizationPartyId` (Mantle). Add filter rows for SalesOpportunity, SalesForecast and Agreement (both already have `organizationPartyId`). Keep party roles for owner and team only. | crosscut §1.4 CX-ACCESS, Marketing (R-MKT-07) |
| R-SAL-10 | minor | gap | §6 Orders/acceptance | **Net-terms orders never auto-approve.** `autoApprove#Order` needs authorized payments ≥ grandTotal, so every accepted B2B quote stays Placed. Who approves it is unstated. | design-sales.md:481-483; OrderServices.xml:1456-1466 | State the "Awaiting approval" queue owner (SALES_APPROVE). Optionally add a Sales policy that auto-approves when credit and policy pass. | Accounting (credit) |
| R-SAL-11 | minor | inconsistency | §4 ContactDetail | **Sales edits consent; Commons says Sales has it read-only.** | design-sales.md:373-374; design-drawers-commons.md:1828 | Make it read-only with a link to the Comms or Marketing consent mount, or change the Commons row. | Commons §16 |
| R-SAL-12 | minor | duplicate | §5 QuoteTemplates; SAL-TEMPLATE | **New SalesQuoteTemplate/Item tables duplicate the order line editor.** `clone#Order` exists, and the proposed `orderPurposeEnumId` already excludes recurring-base templates from fulfillment. | design-sales.md:504-519, :1456-1457, :700-701; OrderServices.xml:2345-2490 | Open item: a template is an OrderHeader with purpose SalesQuoteTemplate, copied with `clone#Order`, reusing items, pricing and PDF. | — |
| R-SAL-13 | minor | duplicate | §7 Subscriptions, RecurringOrders | **Overlapping lists.** These overlap Commerce Subscriptions and the read-only RecurringOrders form on Accounting's RecurringInvoices. | design-sales.md:689-726; design-commerce.md:553-563; design-accounting.md:551 | Mount Commerce's Subscriptions list with a Sales context. Make Sales RecurringOrders the one editor and link to it from Accounting's list. | Commerce, Accounting |
| R-SAL-14 | minor | unowned | §11 Commissions | **The commission payout contract has one side.** Sales hands to "People's approved payroll input contract" and to Accounting payable intake. Neither design names commission as a source. | design-sales.md:1066-1068; design-people.md:850; design-accounting.md (no "commission") | Open item: People PayrollInputSource type "SalesCommission"; Accounting payable intake for partners. | People, Accounting |
| R-SAL-15 | minor | inconsistency | §9 LeadSources | **No mapping from UTM source to lead source.** UTM source/medium lives in Marketing vocabularies, the lead source is a DataSource, and nothing says which DataSource a tracked-link lead gets. | design-sales.md:886-891; design-marketing.md:1131-1134, :1140-1143 | Add a LeadSources binding that maps UTM source/medium to a DataSource, applied at intake. | Marketing |
| R-SAL-16 | minor | wrong-basis | §5 Q.send#Quote; §13.2 reminders | **`send#EmailDraft` is the personal mail-client send.** It needs a draft in an email account the user may send from, so jobs, reminders and QuoteBatch on behalf of other reps cannot use it. | design-sales.md:465-467, :1295-1298; CommunicationServices.xml:2928-2999 | Staff Send opens Comms Compose with the PDF and record filing. Jobs and batch use `send#EmailTemplate` with a registered template, filed through `EmailMessageFiling`. | Commons §12 |
| R-SAL-17 | minor | gap | §3 Leads intake | **Unclear where an inquirer's details live before qualification.** No shadow fields, no "second Party", and no automatic merge; whether public or unverified submissions create Person parties is unstated. | design-sales.md:216, :269-271, :393; design-marketing.md:1232 | Hold the contact on the intake submission. Create or link a Party at qualification, or on verified email with a Prospect role. Add a spam-purge rule. | Marketing |
| R-SAL-18 | nit | style | :3; :34-39; :1053-1054; :1393-1397; §19 | **Status line and disclaimers.** The status line is not "— draft"; process disclaimers ("no slow suite is authorized", "does not claim") obscure decisions; Open says nothing is open. | design-sales.md:3, :1393-1397, :1507-1511; design-doc-guide.md:83-84 | Use "Oct 31, 2026 — draft". Drop the disclaimers. Move the cross-app items to Open (§8). | — |
| R-SAL-19 | nit | checklist | §6 warranty handoff | **`RqtWarranty` is not labelled proposed.** | design-sales.md:617; design-customer-service.md:81; RequestEntities.xml:94 | Label it "proposed (Customer Service)". | — |
| R-MKT-01 | major | unowned | §11 Attribution; §8 tracking | **Nobody writes tracking visits or order attribution.** "At order placement, choose the most recent touch …" has no owner: nothing writes `TrackingCodeVisit`/`TrackingCodeOrder`/MarketingOutcomeLink, and Shop, Sales and Commerce have no tracking step. | design-marketing.md:787-791, :1076-1092; research-marketing.md:988-992; grep of design-shop/design-sales/design-commerce (no TrackingCode) | Marketing owns `T.record#Visit` (a PASS request hook or web script) and a proposed `R.attribute#Outcome`, called by one Mantle SECA on `place#Order` (Shop checkout, Sales acceptance, direct). Sales intake writes `SalesOpportunityTracking`. Register it in crosscut §1.3. | Sales §13, Shop §8, Commerce, crosscut §1.3/§4.8 |
| R-MKT-02 | major | duplicate | §§5, 14.1, 15 MKT-SEND | **Four designs build durable outbound delivery.** Each has its own dedupe, retry and uncertain-outcome handling: CampaignRecipient/Attempt/Event and EventCommunicationSchedule (Marketing), SHOP-OUTBOX, Commerce cart recovery, and Sales reminder jobs. | design-marketing.md:1310-1312, :1322; design-shop.md:1246; design-commerce.md:519-526; design-sales.md:1295-1298 | One Comms-owned Mantle outbound delivery ledger (recipient attempt, provider ID, uncertain, receipt, suppression check). CampaignSend, Shop notices, cart recovery, event notices and Sales reminders are its sources. Add cart and order triggers to automation on top of it. | Shop, Commerce, Sales, Commons §17, crosscut |
| R-MKT-03 | major | gap | §4 Suppressions; §15.2 | **No bounce or complaint intake for direct SMTP.** Hard-bounce suppression relies on provider callbacks only. Nothing parses DSNs, although the `ES_BOUNCED` status exists and the email ECA precedent exists. | design-marketing.md:450-454, :1157-1158, :1443-1447; BasicEntities.xml:641,653; EmailClientServices.xml:4447; MantleConsent.emecas.xml:18-23 | Add to MKT-TRANSPORT: a per-execution VERP Return-Path, plus an email ECA `CampaignBounce` that parses DSN (RFC 3464) and complaint reports (RFC 5965) into CampaignDeliveryEvent → suppression. List it in §15.1. | Admin (mail domains), Commons §12 |
| R-MKT-04 | major | coverage | §8 Content | **Blog posts are deferred, though initial-design lists "Content (blogs, landing pages)".** The baseline WikiBlogs and EditWikiBlog forms stay unmapped. `create#WikiBlog`/`update#WikiBlog` exist and research calls this cheap. | initial-design.md:59; design-marketing.md:717-720, :1680; ss-inventory.md:964-972; research-marketing.md:984, :1160-1163 | Add BlogPosts and BlogPostDetail over WikiBlog with the existing WikiServices and the Knowledge body editor (S). Publishing later adds the editorial workflow. | Commons §10, crosscut §5.1 |
| R-MKT-05 | major | duplicate | §13 Register; PASS operations | **A third public payment entry point.** `marketing.startRegistrationPayment` and `getPaymentResult` sit beside Shop checkout and PASS Billing InvoicePay. Storeless paid tickets also hit R-SAL-01 tax. | design-marketing.md:1181-1182, :1255, :831-834; crosscut :2331; design-shop.md:505-529 | A paid registration places the native order and hands off to Shop checkout (store) or to InvoicePay (invoice-first). Drop the Marketing payment operations. Tax per R-SAL-01. | Shop, Accounting (Billing) |
| R-MKT-06 | major | security | §1.1 scope | **The organization filter does not cover Marketing records.** Marketing says its groups use `MANTLE_USER_ORG`, but the filter set has no rows for MarketingCampaign, ContactList, MarketSegment or TrackingCode. Campaign organization lives on a dated party role. | design-marketing.md:63-69; MantleSetupData.xml:157-215; MarketingEntities.xml:29-50 | Add `MarketingCampaign.organizationPartyId` (Mantle). Add filter rows on `ContactList.ownerPartyId`, `MarketSegment.ownerPartyId` and the campaign. Keep roles for responsibility. | crosscut §1.4, Sales R-SAL-09 |
| R-MKT-07 | major | checklist | §2; crosscut registry | **Registry rows are missing and names disagree.** No Marketing row in crosscut §3.15 (and topics), §3.13 Calendar, the §2 Notifications app list, or the §5 PASS apps table. Marketing's "Delivery … own" vs crosscut's `Shared/CampaignDelivery`, and "Templates/TemplateDetail" vs `Shared/MessageTemplates`. | design-marketing.md:132, :135, :150-153; crosscut :386, :414-418, :1142-1145, :1216-1239, :2327-2333; design-drawers-commons.md:1884 | Add the rows and seed the three topics in Commons §4. Use the registry names (CampaignDelivery, MessageTemplates) in the screen table, with the Marketing mount path. | crosscut, Commons §4 |
| R-MKT-08 | minor | duplicate | §10 SurveyDistribution | **Two survey publication/invitation models.** MarketingFormPublication/Submission plus invitations, beside Customer Service's CaseSurveyInvitation, and two public submit pages. | design-marketing.md:921-931, :1323; design-customer-service.md:940; Support/Feedback (design-customer-service.md:106) | One Mantle FormPublication and FormInvitation over `ExternalAccessCapability`, owned by Commons. Apps keep their context and response scoping. | Customer Service, Commons |
| R-MKT-09 | minor | duplicate | §13 Preferences | **A third unsubscribe/preferences surface.** It sits beside BOSS `/u/<token>` Unsubscribe and PASS Account/Unsubscribe (Forum opt-out). | design-marketing.md:197, :1211-1221; mr-boss/screen/Unsubscribe.xml; mr-boss/MoquiConf.xml:17; mr-pass/screen/Account/Unsubscribe.xml | Name one canonical page per organization. `/u/` redirects to PASS Marketing Preferences when that app is enabled. | Commons §16, Forum |
| R-MKT-10 | minor | inconsistency | §14.2 G; §14.1 | **Comms-owned configuration sits in the Marketing package.** Templates, profiles and suppressions are implemented in `mantle.marketing.MessageServices` as `MarketingSuppression`. | design-marketing.md:442, :1308-1309, :1345; crosscut :1769 | Use `mantle.party.MessageServices` and `MessageSuppression` (Comms). | Commons §17 |
| R-MKT-11 | minor | inconsistency | §17 M2 vs §15.4 | **SMS gates the M2 exit but email is said to work without it.** M2's exit requires a "real SMS adapter … both channels"; §15.4 says email works without SMS. SMS depends on the unbuilt framework C4. | design-marketing.md:1598, :1480, :1157-1161; plans/Comms-Framework.md:419, :435-436 | Split SMS into its own stage gated on framework C4-SMS. Email-only M2 can finish. | — |
| R-MKT-12 | minor | coverage | §2/§20 | **Research candidates not dispositioned.** "Campaign templates", "tags" and the campaign "tracking codes" tab are neither rows nor in Decided. | research-marketing.md:1117, :1127; design-marketing.md:240, :247 | Decided: campaign template = duplicate a campaign; tags later or dropped with the reason; add a Tracking links tab to CampaignDetail. | — |
| R-MKT-13 | minor | checklist | §15.1 | **The paid-ticket order path names no rules.** `OrderPlacedAutoApprove`, `OrderPlacedAuthorizePayments`, `OrderApprovedFulfillSubscriptions` and `OrderPlacedSendEmail` (a no-op storeless) are not named. | design-marketing.md:1422; OrderReturn.secas.xml; AccountingPayment.secas.xml; ProductSubscription.secas.xml | Name each with its verdict for ticket orders. | crosscut §1.3 |
| R-MKT-14 | minor | gap | §8 tracking consent | **There is no tracking consent purpose.** The design requires tracking consent, but PartyConsentPurpose has only MarketingEmail, Sms, Phone and DataProcessing. | design-marketing.md:785-786; PartyEntities.xml:381-385 | Add a proposed `PcpTracking` seed to MKT-CONSENT. | Commons §16 |
| R-MKT-15 | nit | style | :3; :32-36; :1470; :1481; :1535-1537; :1592; :1683; §21 | **Status line and disclaimers.** The status line is not "— draft"; disclaimers ("Documentation-only delivery", "no migration is executed") are not decisions; Open says nothing is open. | design-marketing.md:3, :1683, :1687-1695 | As R-SAL-18. | — |
| R-MKT-16 | nit | style | §2 names | **Screen names differ from their path segment with no repeat to avoid.** AudienceImport, AudienceMerge, AudiencePreview, ConsentDetail (`…/Consent/Contact`), SurveyDistribution. CampaignContent and MarketingCampaignContent are near-identical. | design-marketing.md:139-145, :177, :1316-1317; design-doc-guide.md:106 | Rename the paths or the names. Rename the asset association (e.g. CampaignAsset). | — |

4. **Easy wins**

| ID | File | Addition | Uses (existing capability, with path) | Where it goes in the design |
|---|---|---|---|---|
| R-SAL-W01 | Sales | Show the caller's open opportunities and quotes on the ring bar and in the call | Comms `call-context` provider hook (docs/tools/Comms.md:175) | §12.2 shell table; SAL-SHELL |
| R-SAL-W02 | Sales | "Create lead" from a chat message or voicemail | `create-from` hook, `chat-message-actions` and `voicemail-actions` slots (Comms.md:171, :181-185) | §3 Leads actions |
| R-SAL-W03 | Sales | Pipeline funnel and stage chart now, with no wait for SAL-ANALYTICS | Framework funnel panel (docs/tools/Monitoring.md:277); `report-embed` (xml-screen-3.xsd); design-insights.md:63 | §8 PipelineAnalysis, Home |
| R-SAL-W04 | Sales | Weekly pipeline/forecast digest; "quote expiring" and "deal stalled" alerts | Dashboards alert rules and report schedules (Monitoring.md:315-338, :464); mr-mantle/report/mantle-sales*.json | §8, §13.2 |
| R-SAL-W05 | Sales | A meeting activity gets a video link the prospect can join without an account | Commons EventDetail "video call (Comms call link)" (design-drawers-commons.md:798); WebRTC guests by link (docs/interfaces/WebRTC.md:50-61) | §3 OpportunityDetail Schedule activity |
| R-SAL-W06 | Sales | Account contacts on reps' phones | CardDAV contact books (docs/interfaces/Sync.md:82; Commons ContactBooks design-drawers-commons.md:1310) | §4 Contacts context |
| R-MKT-W01 | Marketing | Opt-out reason on Preferences and in AudienceGrowth | `PartyConsent.evidenceText`/`comments` (PartyEntities.xml:347+); Odoo mailing_subscription_optout.py | §13 Preferences; §11 AudienceGrowth |
| R-MKT-W02 | Marketing | Alerts on failure or complaint spikes; weekly campaign digest | Dashboards alert rules and report schedules (Monitoring.md:315-338) | §11, §15.3 |
| R-MKT-W03 | Marketing | "Add to list (evidenced)" bulk action on Sales Accounts and Leads lists | `L.request#Subscriptions` path already designed; Sales list bulk bar (design-sales.md:258) | §4, §10 Leads context |

5. **Stack leverage**

| ID | File | Capability (path/doc) | What users gain | Size S/M/L | Design change |
|---|---|---|---|---|---|
| R-SAL-L01 | Sales | Call recording and voicemail `CallTranscript`, plus the LLM gateway (docs/interfaces/Voicemail.md:68-75; docs/ai/Gateway.md) | Call and voicemail summaries and a next-step draft on the opportunity timeline | M | §3 Collaboration; new need SAL-AI |
| R-SAL-L02 | Sales | Assist tools and approvals, MCP (docs/ai/Assist.md; docs/ai/MCP.md:125) | "Log call, move stage, draft follow-up" by agent through the O/Q services, with approval | M | §12.1 note: O/Q verbs exposed as Assist tools |
| R-SAL-L03 | Sales | LLM gateway (Gateway.md) | RFQ line extraction sooner than "later" | M | §11 QuoteExtraction gate names the gateway |
| R-SAL-L04 | Sales | RequestIntake public form (mr-boss/screen/RequestIntake.xml:13-20; RequestServices.xml:530-541, project-bound) | A public RFQ and contact-us form in S2, with CAPTCHA, rate limit and files | M | Generalize the intake target to organization or team; RqtQuote |
| R-SAL-L05 | Sales | PublishedCalendar plus `EventServices.get#FreeBusy` (mr-boss/screen/PublishedCalendar.xml; EventServices.xml:1621) | A prospect booking link (ERPNext appointment) | M | §11 later screen or Commons extension |
| R-SAL-L06 | Sales | Co-edited documents (moqui-collab) and `html-print` | A co-authored proposal narrative bound into the quote PDF | M | §16 outputs; QuoteTemplate text |
| R-MKT-L01 | Marketing | Planned framework SMS C4 in `moqui-channels`; Telnyx messaging (plans/Comms-Framework.md:419, :435-436; docs/interfaces/SIP.md:153) | SMS without a Marketing-specific adapter; WhatsApp later (:406) | M | MKT-TRANSPORT depends on C4 rather than proposing an adapter |
| R-MKT-L02 | Marketing | WebRTC guest links (WebRTC.md:50-61) | Webinars: the registration credential is a guest link; attendance comes from call legs | M | §9 online occurrence; research §7 "webinars" |
| R-MKT-L03 | Marketing | LLM gateway | Drafts of A/B subjects and bodies, and of segment predicates, for human approval | M | §5 Compose, §4 SegmentDetail |
| R-MKT-L04 | Marketing | Web scripts and outbound REST (docs/interfaces/Web-Scripts.md:178) | The "registered HTTP handlers" for redirect, pixel and provider callbacks get a concrete home | S | §13.1, MKT-TRACKING |

6. **Reference features (M/L)**

| ID | File | Size | Sev | Feature | Reference (path) | Proposed design | Default |
|---|---|---|---|---|---|---|---|
| R-SAL-R01 | Sales | M | major | B2B customer self-service for orders, shipment tracking and invoices without Shop | odoo/addons/sale/controllers/portal.py | PASS Sales CustomerOrders/CustomerOrder projection linking to Billing InvoicePay | add |
| R-SAL-R02 | Sales | M | minor | Predictive lead scoring | odoo/addons/crm/models/crm_lead_scoring_frequency.py | Score on intake/qualification; LLM-assisted option | Open |
| R-SAL-R03 | Sales | M | minor | Recurring revenue on the opportunity | odoo/addons/crm/models/crm_recurring_plan.py | recurringAmount and plan on SalesOpportunity; Forecast shows MRR | add |
| R-SAL-R04 | Sales | M | minor | Customer blanket orders and call-offs | frappe/erpnext/erpnext/manufacturing/doctype/blanket_order | Reuse Purchasing's release pattern on AgrSales items | Open |
| R-SAL-R05 | Sales | M | minor | Lead response SLA | frappe/crm/crm/fcrm/doctype/crm_service_level_agreement | First-response target on lead queues | later |
| R-SAL-R06 | Sales | M | minor | Activity plans and cadences | odoo/addons/crm/models/mail_activity.py; Commons §15 "later" | Plan templates over WorkEffort activities | later |
| R-SAL-R07 | Sales | L | minor | Partner/reseller channel and lead forwarding | odoo/addons/website_crm_partner_assign | PrtSalesAffiliate plus routing | later |
| R-SAL-R08 | Sales | M | minor | Tags on deals | odoo/addons/sales_team/models/crm_tag.py | Generic record tag (no Mantle entity today) | Open |
| R-MKT-R01 | Marketing | L | major | Block email builder with themes | odoo/addons/mass_mailing, mass_mailing_themes | Commons editor block mode; templates stay safe HTML | Open |
| R-MKT-R02 | Marketing | M | minor | Social share cards | odoo/addons/marketing_card | Per-recipient render through html-print images | later |
| R-MKT-R03 | Marketing | M | minor | Order and cart triggers for automation | Commerce CartRecovery (design-commerce.md:511-526) | Trigger kinds on the one delivery ledger (R-MKT-02) | add |
| R-MKT-R04 | Marketing | M | minor | Campaign stages and tags | odoo/addons/utm/views/utm_stage_views.xml | Board by native status plus tags | Open |
| R-MKT-R05 | Marketing | M | minor | Live-chat-to-lead | odoo/addons/website_crm_livechat | Chat `create-from` (Comms.md:171) | later |

7. **Cross-app decisions needed**

| Decision | Recommendation | Files that change | From (IDs) |
|---|---|---|---|
| Storeless tax and notification context | Mantle order tax falls back to the organization's tax gateway; Q owns storeless recalculation and confirmation | Sales, Marketing, Accounting, crosscut §4.1 | R-SAL-01, R-MKT-05 |
| Commercial revision identity | A snapshot hash on the issue or proposal, not `orderRevision`; revision EECAs kept | Sales, Customer Service, crosscut §4.7 | R-SAL-02 |
| Order approval and hold permissions | One release permission per hold type; sales and purchase approve permissions split | Sales, Purchasing, Customer Service, crosscut §1.4 | R-SAL-04 |
| Agreement lifecycle owner | One status flow (Purchasing IDs) and one Shared/AgreementDetail with contexts | Sales, Purchasing, crosscut §2 | R-SAL-05 |
| Attribution writer | Marketing visit and attribution services; one SECA on `place#Order` | Marketing, Sales, Shop, crosscut §1.3 | R-MKT-01 |
| Durable outbound delivery | One Comms-owned Mantle ledger used by campaigns, Shop notices, cart recovery, event notices and Sales reminders | Marketing, Shop, Commerce, Sales, Commons §17 | R-MKT-02 |
| Lead intake timing and package | `mantle.sales` intake service in Sales S1; first-release routing by fixed queue | Sales, Marketing | R-SAL-08 |
| Organization scoping of CRM and marketing records | Organization fields plus `MANTLE_USER_ORG` filter rows | Sales, Marketing, crosscut CX-ACCESS | R-SAL-09, R-MKT-06 |
| Form publication and invitations | One Commons/Mantle FormPublication and FormInvitation | Marketing, Customer Service | R-MKT-08 |
| Customer PASS access | One contact invitation spanning Sales, Support and Billing; a B2B orders page | Sales, Customer Service, Accounting, Shop | R-SAL-R01 |

8. **Open-list verdicts**

**Sales (§19)**

| Open item | File's recommendation | Verdict | Reason |
|---|---|---|---|
| "No initial-release product choice remains open" | none | reject | R-SAL-01, -02, -04, -05, -08 and -12 are real choices. |
| Later capabilities need an owner or gate | keep later | agree | The gates are well specified. |

Items to add to Open:
- Storeless tax and store default (R-SAL-01).
- Quote template as an OrderHeader (R-SAL-12).
- B2B order self-service (R-SAL-R01).
- Commission payout contract (R-SAL-14).
- How strongly to authenticate high-value bearer acceptance (signed-in or one-time code above a threshold). Recommend a SalesDefaults threshold.
- Agreement status ownership (R-SAL-05).

**Marketing (§21)**

| Open item | File's recommendation | Verdict | Reason |
|---|---|---|---|
| "No blocking … decision remains" | none | reject | R-MKT-01, -02, -05 and -11 and R-MKT-R01 are open choices. |
| Deferred capabilities need later designs | later | agree | — |
| Publishing remains future | defer blogs | amend | initial-design lists blogs; add blog posts now (R-MKT-04). |

Items to add to Open:
- One delivery ledger (R-MKT-02).
- SMS stage gating (R-MKT-11).
- Block email builder (R-MKT-R01).
- Payment surface for registrations (R-MKT-05).
- Minimum approval and dispatch setup for a one-person team (design-marketing.md:79-80, :1117-1118). Recommend an organization policy that lets an author self-approve and dispatch under the audience limit.
- Attribution writer owner (R-MKT-01).

9. **Research coverage and checklist**

**Sales:** 8 candidate areas (about 35 screens) are all rows or merged; all 6 research open questions are answered in Decided.

| Item | Result | Note |
|---|---|---|
| 1 | pass | — |
| 2 | fail | R-SAL-07 |
| 3 | pass | — |
| 4 | pass | The Collaboration form names no services (design-sales.md:302). |
| 5 | pass | 16/16 needs match §7.8. |
| 6 | pass | `FindOrder CreateSalesOrder` is now mapped (ss-inventory.md:512). |
| 7 | pass | — |
| 8 | pass | — |
| 9 | fail | R-SAL-06 |

**Marketing:** 12 candidate areas. Missing: campaign templates, tags and the tracking-codes tab (R-MKT-12); blogs are deferred contrary to initial-design (R-MKT-04). All 5 research open questions are answered in Decided.

| Item | Result | Note |
|---|---|---|
| 1 | partial | R-MKT-04, R-MKT-12 |
| 2 | partial | R-MKT-07 |
| 3 | pass | — |
| 4 | pass | — |
| 5 | pass | 20/20 needs match §7.9. |
| 6 | pass | Survey, promotion, event and wiki forms are mapped; WikiBlogs are blank by decision. |
| 7 | pass | — |
| 8 | pass | — |
| 9 | partial | R-MKT-03, R-MKT-13 |

10. **Checked and fine**

These were verified and need no further check:

- **Sales services.** ExternalAccessServices with `invite#Contact`, and its scope limited to InvoicePay, BillUpload and OrderAcknowledgement (ExternalAccessServices.xml:19-30, :119; ExternalAccess.js:17, :28). PostingOperation (AssetBookEntities.xml:57). `CreditServices.evaluate#OrderCredit` and the `OrderPreApproveCredit` SECA, as Sales says (OrderServices.xml:1243). `hold#Order`/`release#OrderHold` with OrderHoldReason (D7-consistent).
- **Sales data and order flow.** The SalesOpportunity, SalesForecast and SalesForecastDetail fields as described. AgreementParty has no dates and the Agreement status type is unseeded. AccountServices are `authenticate="false"`. The PriceServices store/replace/expire/find and SalesReportServices names exist. OrderProposed→OrderPlaced exists. `update#OrderRecur` blocks billed or shipped bases.
- **Sales consistency.** Customer Service already reflects Sales' D9 ownership (design-customer-service.md:294-299). The PASS app placement follows D5.
- **Marketing services.** ContactListServices and ConsentServices names and behaviour, including the permissive list send (ContactListServices.xml:659-811). The SMS stub (SmsServices.xml:16). ContactImport, EventServices and Wiki review services exist.
- **Marketing data.** The `MKTG_CAMP_*` and `CLPT_*` IDs. `convertedLeads` is an id field. The `TrackingCodeOrder` key is orderId plus type.
- **Marketing rules and roll-ups.** The Forum, `ListUnsubscribeMailto` and `EmailMessageFiling` rule IDs are correct. Commons §16 and §17 match Marketing's shared-owner text. Both crosscut roll-ups match their files.
