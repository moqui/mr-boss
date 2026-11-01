# IronStone BOSS — Suite-app design review

Nov 1, 2026 — review findings and the decisions the fix pass applies

This reviews the Oct 31 drafts of [People](design-people.md), [Maintenance](design-maintenance.md),
[Commerce](design-commerce.md), [Sales](design-sales.md), [Marketing](design-marketing.md),
[Admin](design-admin.md) and [Insights](design-insights.md), and the PASS
[Shop](../../mr-pass/plan/design-shop.md) design. Each design was checked against:
- its `research-*.md`;
- the [design-doc-guide.md](design-doc-guide.md) checklist;
- active Mantle, framework, BOSS and PASS sources;
- the other designs it hands work to;
- the reference apps in `~/work/moquiwork/3p_other`.

The model is the Oct 28 [core-app review](review-core-apps.md). The two reviews look for the same
kinds of problems, and this one also looks for leverage of the mr-moqui stack.

**How it was done.** A script first checked that every relative link and anchor in the eight files
resolves (§8). Four reviewers then each took a pair of files: People and Maintenance, Commerce and
Shop, Sales and Marketing, Admin and Insights. Each covered:
- research coverage and the checklist;
- internal consistency;
- Mantle and framework names;
- existing automation;
- its side of each interface;
- reference features, easy wins and stack leverage;
- the Open list.

A handoff reviewer walked the customer-side flows across the files and tried to refute fifteen of
the cross-app findings. A leverage reviewer built an inventory of what the stack offers apps and
checked the designs and the needs roll-up against it. The two blockers' code claims were checked by
hand.

**How to read it.**
- §2 is the patterns behind most findings.
- §3 is the cross-app decisions.
- §4 is the steps that now have one owner.
- §5 is the findings by file.
- §6 is the reference features.
- §7 is the verdicts on each Open list.
- §9 is the findings the handoff review narrowed.

**What happens next.** The fix pass:
- applies §3 and every finding in §5;
- adds the easy wins and the S-sized leverage rows to the designs;
- moves M and L reference features into each file's Open list with a recommendation, or into a `later` row.

One editor per pair of design files applies these. A single editor applies the crosscut,
Commons and core-design changes, then the inventories, and the checks in §8 run again. The two
code defects behind Y1 and Y2 are fixed in Mantle and BOSS in the same pass, with specs.


## 1. Counts

| File | Blocker | Major | Minor | Nit | Easy wins | Leverage | Reference features |
| --- | --- | --- | --- | --- | --- | --- | --- |
| People | 0 | 12 | 8 | 3 | 7 | 6 | 9 |
| Maintenance | 1 | 4 | 10 | 1 | 6 | 7 | 6 |
| Commerce | 0 | 3 | 12 | 3 | 6 | 3 | 4 |
| Shop | 0 | 7 | 9 | 3 | 6 | 4 | 3 |
| Sales | 1 | 8 | 8 | 2 | 6 | 6 | 8 |
| Marketing | 0 | 7 | 7 | 2 | 3 | 4 | 5 |
| Admin | 0 | 9 | 13 | 1 | 7 | 4 | 7 |
| Insights | 0 | 3 | 12 | 1 | 4 | 4 | 5 |
| Customer handoffs | 0 | 11 | 5 | 0 | — | — | — |
| Stack leverage | — | — | — | — | 10 | 12 | 20 needs fixes |
| **All** | **2** | **64** | **84** | **16** | **55** | **50** | **47** |

The handoff review confirmed ten of the fifteen findings it re-checked and found five only partly
right; none was refuted (§9). Two were understated:
- `ExternalAccess.js` `invite` refuses any party that is not an organization, so a consumer can never reach PASS Billing, Sales or Support.
- The manual `approve#Order` never calls `check#OrderPreApprove`, so Purchasing's D8 approval hook is skipped as well.


## 2. What the findings have in common

Research coverage is good. Every research open question in the eight files is answered. The
crosscut needs roll-ups (§7.5–§7.11) match each file's table exactly. All 34 ProductStore and the
Vendor and Gateway baseline forms are now mapped. Nearly every load-bearing Mantle and framework
name exists. As on Oct 28, the findings are about depth.

1. **Existing names used as the wrong basis.**
   - A storeless sales order gets no tax, shipping, promotions or confirmation: `handle#OrderMajorChange` and `calculate#OrderSalesTax` need a store, and the invoice skips order-billed tax (R-SAL-01, blocker).
   - `orderRevision` increments on notes, files, the stored quote PDF and status-only changes, so anything bound to it invalidates itself (R-SAL-02).
   - `reject#Order` has no transition from OrderProposed (R-SAL-03).
   - `clone#Order` copies payments as Promised, which `OrderPlacedAuthorizePayments` then charges (R-SHP-04).
   - PartySkill, EmplPositionClassSkill and WorkEffortSkillStandard lack levels, dates and evidence (R-PPL-08).
   - EmplPosition has no department, and `create#Employment` refuses a position whose organization is not the employer (R-PPL-09).
   - Insights' scope policy reinvents `rowFilterService` (R-INS-03).
   - `PublicShopPage` duplicates `PublicSitePage` (R-COM-03).
2. **Existing automation the designs never mention.**
   - The CalDAV PUT writes `WorkEffort` rows with `row.update()`, so a phone task app can complete a guarded maintenance work order or a protected HR task, and an event PUT can move a booked event, with no service check (R-MNT-01, blocker; R-PPL-02; R-LV-02). This is a defect in built code as well.
   - `RequestTriageNotice` sends confidential grievance names to triage parties (R-PPL-01).
   - Also unnamed:
     - the order revision EECAs, `OrderPreApproveCredit`, `ShipmentShippedFinalizeInvoices`, and the shipment and invoice email SECAs (R-SAL-06, R-COM-10, R-SHP-12);
     - `WorkEffortPartyAssignedNotify` and `WorkEffortStartCompleteDates` (R-PPL-14, R-MNT-10);
     - the framework and Forum EECAs on Admin's write paths (R-ADM-11).
3. **Contracts with only one side.**
   - Tracking and attribution writer: R-MKT-01.
   - Lead intake timing: R-SAL-08.
   - Commission payout: R-SAL-14.
   - People→Admin provisioning call: R-ADM-05.
   - Payroll-origin restriction and maintenance cost policy in Accounting: R-PPL-07, R-MNT-05.
   - Manufacturing downtime vs ResourceUnavailability: R-MNT-02.
   - Paid-access configuration editor: R-COM-01.
   - Commerce metrics for Insights: R-COM-02.
   - Refund or chargeback to access revocation: R-SC-04.
   - Insights dataset indexing: R-INS-02.
4. **New stores that duplicate built or shared ones.**
   - Four durable delivery ledgers besides Forum's built one: R-MKT-02, R-SHP-07.
   - Shop tokens beside `ExternalAccessServices`: R-SHP-01.
   - Shop return and support intake beside Customer Service Support: R-SHP-03, R-SC-06.
   - Three unsubscribe/preference pages: R-MKT-09, R-SC-11.
   - Two survey publication models: R-MKT-08.
   - Import wizards beside Admin `Shared/DataImport`, which no app mounts: R-ADM-06, R-PPL-12, R-MNT-08.
   - Admin re-specifying Tools screens: R-ADM-L01.
   - A new flow-map store beside report Definitions: R-INS-L02.
5. **Security boundaries.**
   - The CalDAV bypass (above).
   - `TIME_ENTRY_RATE`, granted to `BOSS_PROJECT_MANAGER`, shows employees' pay rates (R-PPL-03).
   - `ORDER_APPROVE` releases every hold type (R-SAL-04).
   - `MANTLE_USER_ORG` has no filter rows for CRM and marketing records (R-SAL-09, R-MKT-06).
   - Admin's relay list covers personal mailbox servers (R-ADM-01).
   - Changing a connection endpoint keeps its stored secret (R-ADM-02).
   - The new Admin permissions are not sealed (R-ADM-03).
6. **Stack capability not used.** No design contributes:
   - an Assist skill, prompt or tool exposure;
   - a Comms hook;
   - a Sync collection;
   - a mail-intake action;
   - a meeting call link;
   - shipped report definitions.
   All of these are built (R-LV-01..12). The suite has no rule for how an app plugs into them beyond palette, Today and quick create.
7. **Registry and Open lists.**
   - Per-app context rows are missing in crosscut for People, Maintenance, Sales, Marketing and Insights mounts.
   - Approval topics are unseeded in Commons §4.
   - The Shop and Marketing PASS apps are missing from crosscut §5.
   - Every Open list says nothing is open, while six to ten real choices remain in each.
   - The status lines carry implementation disclaimers instead of guide §3's form.


## 3. Cross-app decisions

These choices span files. The fix pass applies each recommendation. It writes them as dated rows
"(Nov 1, 2026)" in crosscut §8, citing the ID here, and adds them to each listed file's Decided.
The user decided three points on Nov 1:
- **People payroll.** The native payroll engine stays in the first release, in preview mode. Live finalization is gated on a chosen localization and on Y7.
- **Marketing blog posts** are designed now (R-MKT-04).
- **Code defects.** The CalDAV write path and the employee pay-rate exposure are fixed in code in this pass (Y1, Y2).

### 3.1 Customer side

| # | Decision | Recommendation | Files that change | From |
| --- | --- | --- | --- | --- |
| X1 | Storeless order effects | Mantle `calculate#OrderSalesTax` resolves its gateway as SalesTax.js `gateway(organization, store)` does (the PartyAcctgPreference fallback). `handle#OrderMajorChange` runs its tax step without a store; promotions stay store-only. Sales owns a storeless placed/approved confirmation over the delivery ledger (X8). Crosscut §3.6 stops saying `send#OrderStoreEmail` covers sales mail. Marketing paid tickets inherit the fix. | crosscut §3.6, CX-PRICING; Sales §5, §13; Accounting §15; Marketing §9 | R-SAL-01, R-MKT-05 |
| X2 | Commercial revision | `increment#OrderRevision` counts only commercial changes: OrderContent, OrderNote and status-only part updates stop incrementing, behind a CX-AUTOMATION flag. Sales quote issue and approval, the shared ChangeProposal and Purchasing's D8 approval bind to that one counter. Fallback, if the flag is refused: one Mantle `get#OrderCommercialSnapshot` hash used by all three. | crosscut §1.3, §4.7; Sales SAL-QUOTE; Customer Service §4; Purchasing | R-SAL-02 |
| X3 | Quote decline | The customer's decline and the seller's withdrawal use `cancel#Order` through the existing Cancel Quote transition, with the reason on SalesQuoteResponse. No OrderProposed→OrderRejected transition is added; OrderRejected means rejected by the vendor. | Sales §5, §10; usl-inventory | R-SAL-03 |
| X4 | Approval and hold authority | Seed a release permission per hold type through `Enumeration.enumCode`: OhtChange and OhtPurchase get their own, OhtManual keeps ORDER_APPROVE, and a new OhtPayment is released by an Accounting payment operator. There is no OhtStock; stock after placement is Warehouse's reservation fact. `approve#Order` checks direction (sales or purchase approve permission) and runs `check#OrderPreApprove`, refusing on a warning unless the owning app recorded a decision. | crosscut §3.6, §1.4; Sales §1.1, §6; Purchasing §6; Accounting AC-11; Shop §7–§8; Commerce §11 | R-SAL-04, R-SHP-06 |
| X5 | Recurring model | A RecurringTemplate value of Sales' `orderPurposeEnumId` marks base orders. CreditOpenOrderSum, the approved-email and reservation SECAs, and the Commerce, Warehouse and Insights order queries exclude them. Renewals clone with `copyPayment=false`; the payment attempt charges only with recorded off-session consent. Owners: Sales (worker guards and recurrence fields), Shop (dispatch), Accounting (monitoring, auto-invoice right). Dunning skips invoices of a renewal still in retry. A Mantle SECA on refund and return settlement calls Shop's `reconcile#RefundedItem`, and chargeback intake does the same. | crosscut §1.3, §3.6; Sales §7; Shop §10; Commerce §6, §8; Accounting §5, §14; Warehouse; Insights | R-SHP-04, R-SC-01..04, R-SAL-13 |
| X6 | One customer account | Add a self relationship to ExternalAccess `check`: the record's party is the signed-in user's party with a verified email. `appKinds` gains support and sales. One customer-direction record kind (`SalesOrder`) serves Sales QuoteView/QuoteRespond and Shop OrderView/Download/RenewalAction links. Cart access stays session-bound StoreCartAccess and reuses the capability digest and throttle. "My account" is a PASS Account hub; Shop AccountOverview is one card in it. Crosscut §5 gains Shop and Marketing PASS rows. | crosscut §5, §5.1; Sales §10; Shop §4, §7, §9, §10; Customer Service §8; Accounting InvoicePay; Forum §13.1 | R-SHP-01, R-SHP-02, R-SC-15 |
| X7 | Customer requests go through Customer Service | A Shop return calls `ReturnPolicyServices.request#CustomerReturn`. A question calls `SupportCaseServices.create#CustomerCase` with the store's queue. A cancellation files an `OrderChangeServices.save#OrderChange` cancel proposal with customer consent; immediate cancel only by a Customer Service policy flag. Commerce Requests and Returns become store-filtered views. Commerce §11.1 takes the D11 verdicts. | Shop §9; Commerce §6, §11.1; Customer Service §4, §8, §9; usl-inventory | R-SHP-03, R-SHP-11, R-COM-04, R-SC-05, R-SC-06, R-SC-08 |
| X8 | One outbound delivery ledger | Comms owns one Mantle delivery attempt and receipt ledger (event, recipient, channel and template key, consent snapshot, outcome), generalized from Forum's ForumDelivery. It is built on `send#EmailMessage`'s retryable, permanent and uncertain outcomes and the SystemMessage retry jobs, and aligned with Comms C1 so SMS and bridges join later. Marketing keeps CampaignSend and CampaignRecipient as intent and selection. Shop notices, cart recovery, event notices and Sales reminders are its sources. Commons §17 stops calling durable delivery Marketing-owned. | Commons §17; Marketing §14; Shop §11, §14; Commerce §6, §14; Sales §13; Forum | R-MKT-02, R-SHP-07, R-LV-05 |
| X9 | One payment-attempt coordinator | Accounting owns the typed PortalPaymentAttempt coordinator, with purposes invoice, shopCheckout, shopRenewal and eventRegistration. The attempt key is `PaymentGatewayResponse.operationKey`; webhooks land as SystemMessage receipts. Shop cites `mr-mantle/plan/payments-shipping-edi.md` and names the first adapter that does hosted checkout plus off-session charges; Shop S3 is gated on it. Marketing's registration payment is a thin wrapper. | Accounting AC-02; Shop §8, §17; Marketing §13 | R-MKT-05, R-SHP-05, R-SHP-08, R-SHP-10 |
| X10 | Tracking and attribution | Tracking is captured on the authority through the PASS facade, with the tracking code and an opaque visitor key rather than `moqui.server.Visit`. A Mantle SECA `OrderPlacedRecordAttribution` (tx-commit) calls Marketing's `record#OrderAttribution`, registered in crosscut §1.3. Sales maps UTM source and medium to the lead DataSource at intake. | Marketing §8, §11; crosscut §1.3, §4.8; Shop §7; Sales §5, §9; Commerce §1.2 | R-MKT-01, R-SC-13, R-SAL-15 |
| X11 | Metric owners | Each metric is defined once with an owner: Sales orders (placed, excluding open, proposed and templates), Accounting invoiced revenue, Marketing visits and attribution, Insights the funnel. Commerce gains a Reports area over `SalesReportServices` (`productStoreIds`) and registers it. | Insights §6.2, §12; Sales §8; Commerce; Marketing §11 | R-SC-14, R-COM-02 |
| X12 | Organization scoping | A denormalized, audited `organizationPartyId` on SalesOpportunity, MarketingCampaign and MarketSegment, kept equal to the effective role row. MANTLE_USER_ORG and MANTLE_ACTIVE_ORG filter rows for those plus SalesForecast, Agreement and ContactList. | Sales §1.1; Marketing §1.1, §14; crosscut CX-ACCESS | R-SAL-09, R-MKT-06 |
| X13 | Agreement states | One Mantle AgmSt* seed (Purchasing's five states and transitions); Sales adopts it. Sharing header, terms and items forms between the two AgreementDetail screens is optional. | Sales §7; Purchasing | R-SAL-05 |
| X14 | Public site pages | Extend `PublicSitePage` and `get#SitePage`/`publish#SitePage` with mount, route, locale and publication window (role optional). No `PublicShopPage`. Pages and PageDetail become `Shared/` screens with registry rows and Commerce and Marketing contexts. | Commerce §5; Shop §11, §14; Marketing §8; crosscut §2 | R-COM-03, R-COM-09 |
| X15 | Identity hygiene | Merge guards live inside Mantle `merge#Parties` (Commons owns it); Sales MergeAccounts mounts the Commons wizard. One privacy intake: a PASS Account page calls Admin `create#Request`, and each customer-side design registers a privacy provider. One PASS Account "Email preferences" page combines list unsubscribe, topics and the Forum opt-out; `/u/` redirects to it. The checkout opt-in records through Marketing `request#Subscription`. One public lead page; Sales LeadIntake is a context of it. | Commons §6, §16; Admin §12; Sales §4, §11; Marketing §10, §13; Shop §4, §6; Commerce; Customer Service; Forum | R-SC-09..12, R-SC-16, R-MKT-09 |
| X16 | Smaller ownership calls | Commerce Product360 context owns the `ProductSubscriptionResource` editor (Products gives up the claim). One Mantle store reservation service, the built `WarehousePolicyServices.update#StoreReservation` (Warehouse P3); the Warehouse form edits it and Commerce shows it read-only. Lead intake is a `mantle.sales` service in Sales S1, with fixed-queue routing. One FormPublication and FormInvitation over ExternalAccess, owned by Commons. A sales commission is a People PayrollInputSource type, and partner commissions go to Accounting payable intake. | Commerce; Products; Warehouse §14; Sales; Marketing; Customer Service; Commons; People; Accounting | R-COM-01, R-COM-05, R-SAL-08, R-SAL-14, R-MKT-08 |

### 3.2 People, Maintenance and the core apps

| # | Decision | Recommendation | Files that change | From |
| --- | --- | --- | --- | --- |
| Y1 | Sync writes go through services | CalDAV VTODO PUT updates a task through `TaskServices.update#Task` and `set#TaskStatus`, so status follows the task's flow. An event PUT that moves an event holding a resource booking passes the booking check first. Managed process roots and steps, templates and protected People tasks are read-only or left out of the Tasks collection. Built-code fix in this pass. | crosscut §1.3, §1.5; Commons Sync; Maintenance §13; People PE-01 | R-MNT-01, R-PPL-02, R-LV-02, R-LV-N15 |
| Y2 | Pay rate vs labor costing | Reading an employee's pay rate (the vendor rate on a time entry of a worker who was an employee on the entry's date or is one now, a staffing candidate's cost rate, and a person's worker RateAmount) needs PAYROLL_VIEW; setting it needs PAYROLL_EDIT. `TIME_ENTRY_RATE` keeps client rates, contractor rates and project money. Labor cost in reports moves to class and work-type costing rates (RateAmount by `emplPositionClassId` and `workTypeEnumId`); until then project money totals keep today's basis. The masking is a built-code fix in this pass. | crosscut §1.4; People §6, PE-01; Projects §8, §10; Maintenance §8, MT-08; Manufacturing | R-PPL-03, R-MNT-03 |
| Y3 | One equipment outage fact | Manufacturing's `store#ProductionDowntime` with an equipment-fault reason creates or links one ResourceUnavailability in the same transaction; Maintenance owns restoration through `end#ResourceUnavailability` | Manufacturing M6/D24; Maintenance §7.1; crosscut §4.6 | R-MNT-02 |
| Y4 | Team model | A team is an Organization with the OrgTeam role and PrtMember relationships, written by People OrganizationServices. Maintenance Teams and Projects read it and add dispatch defaults. | People §4; Maintenance §9; Projects | R-MNT-15 |
| Y5 | Checklist engine | People lifecycle checklists are template WorkEffort trees instantiated by `ProcessServices.instantiate#WorkProcess` (MT-03) with a People policy. The root is a lifecycle event with purpose WepPrOrgMgmt and no documentation space. | People §12, PE-02; Maintenance §4; crosscut §4.6 | R-PPL-05 |
| Y6 | Separation and equipment | Employee360 gets an AssignedEquipment region. Separation raises one return task per current AssetPartyAssignment; the custodian ends it with `replace#AssetPartyAssignment` from EquipmentDetail. | People §4; Maintenance §6; crosscut §3.4, §3.10 | R-PPL-04 |
| Y7 | Accounting retrofits | Two Accounting needs. The first restricts payroll-origin invoices, payments and ledger lines on the built finance screens, search and exports; payroll finalize stays off until it lands. The second routes maintenance expense with facility, cost-centre and project dimensions, and returns at original cost. | Accounting needs; People §8.3; Maintenance MT-09; crosscut §7 | R-PPL-07, R-MNT-05 |
| Y8 | Technician qualification and availability | Maintenance assignment calls `ResourceServices.find#StaffingCandidates` and `get#PartyCapacity`; assignment and start warn (policy: block) when `DevelopmentServices.check#Qualifications` returns missing or expired. People lists Maintenance as a consumer. | People §6, §10; Maintenance §3, §10 | R-MNT-04 |
| Y9 | HR files | A content entity per HR host (application, employment, leave request, payslip, qualification, review), registered in `get#RecordLinkInfo` with a protected purpose | People PE-01; crosscut §3.14 | R-PPL-13 |

### 3.3 Admin and Insights

| # | Decision | Recommendation | Files that change | From |
| --- | --- | --- | --- | --- |
| Z1 | Admin security | A mail relay is an EmailServer that no EmailAccount owns; account servers stay in Comms MailAccounts. Changing an endpoint, host, URL, port or auth type clears or requires re-entry of the stored secret, and the connection stays disabled until a test against the new endpoint passes. ADMIN_BACKUP_DOWNLOAD, ADMIN_IDENTITY_GLOBAL and ADMIN_ACCESS_MANAGE go into `sealed-permissions`, and BOSS_ADMIN_ACCESS, BOSS_ADMIN_BACKUP and BOSS_ADMIN_ADMIN into `privileged-groups`, in mr-boss MoquiConf. Staff invitations get an AcceptInvitation route on EmailType `EMT_ACCOUNT_INVITE`. The reset text says what `reset#Password` mails. | Admin §1, §4, §8, §9, §14, §17; crosscut §1.4 | R-ADM-01..04, R-ADM-12 |
| Z2 | Import orchestration | Generalize the built Products stage, configure, validate, apply and result import into Shared/DataImport. Each domain import is a registered target that keeps its own batch entity or wizard. There is no new TransferBatch where an owner batch exists. Admin §11 lists the targets. | Admin §11; Products; People §12; Maintenance §6; Marketing; Sales; Commerce; Accounting; crosscut §4.9, §6.4 | R-ADM-06, R-PPL-12, R-MNT-08 |
| Z3 | Account lifecycle | People's hire and employment-change services call `ironstone.admin.LifecycleServices.request#Provisioning` and `request#AccessEnd` after commit, keyed by party, organization, employment and operation key. The IT checklist task carries the operation ID. Insights adds admin-callable `pause#OwnedSchedules` and `transfer#DefinitionOwner` for ownership transfer. | People §4, §13; Admin §4, §14; Insights §7; crosscut §4.9 | R-ADM-05, R-ADM-19 |
| Z4 | Connection configuration ownership | Admin Connections owns gateway, remote and OAuth configuration records (endpoints, service names, credentials). Accounting, Warehouse and Commerce own bindings and selection, including tax gateway selection. Commerce offers the store organization's enabled PaymentGatewayOrganization rows only. OrganizationAvailability covers PaymentGatewayOrganization only in the first release. | crosscut §5; Accounting Tax; Admin §8; Commerce §8 | R-ADM-09, R-ADM-10, R-COM-08 |
| Z5 | Admin phasing and placement | First release: Users, Groups, Sessions, Invitations, the Settings index, Health, and the Tools System screens mounted for ADMIN. Later: AccessInspector, Webhooks, MailDomains, Retention, PrivacyRequests, backup archive download and EventSubscription. Organization-scoped identity services go in Mantle; the framework keeps only generic guards. The agent editor, A2A tasks and gateway keys shown once become ADM-AGENTS framework needs, linked from mr-moqui Remaining-Work. | Admin §2, §13, §16; crosscut §7.10; Remaining-Work | R-ADM-07, R-ADM-08, R-ADM-18, R-ADM-L01 |
| Z6 | Smaller Admin calls | Comms creates mail aliases, and Admin verifies them through `check#AddressClaim`. One sessions service over HttpSession and Visit serves Commons self-service and Admin. Organizations lists OrgInternal parties only; departments and teams stay with People. Admin gets a Settings registry seed table. | Admin §4, §7, §9; Commons §11, §17; People §4 | R-ADM-13, R-ADM-15..17 |
| Z7 | Insights first-release delivery | Personal schedules and alerts are in the first release. Group delivery runs only when a check shows that each recipient's grants and row filters equal the owner's, and it is sent as separate messages. Full recipient execution is later. Renders are reused per definition version, scope fingerprint and locale, with caps. | Insights §7, §8, §17; crosscut §4.9; Admin §15 | R-INS-01 |
| Z8 | Dataset admission | A dataset is admitted only when its feed is registered and the index is built; the steward can reindex. A scope policy is a registered `rowFilterService` (proposed `PartyServices.get#OrganizationRowFilter` with MANTLE_USER_ORG semantics). The shipped mantle_sales and mantle_inventory datasets get filters first. | Insights §5; crosscut §3.17 | R-INS-02, R-INS-03 |
| Z9 | Readiness, refresh and attention | One Admin §14 readiness provider contract with a freshness facet, plus a refresh-operation contract. An AttentionProvider registration feeds Insights Home. Commerce `check#StoreReadiness` and `retry#StoreMessages` register with them. | Admin §14; Insights §3, §11; Commerce §3, §9 | R-INS-09, R-INS-10, R-COM-13 |
| Z10 | Registry and report owners | Employee360 drops its Admin row and adds Insights. Each owner table gets a read-only Insights row. Each catalog report has one owner: SalesAnalysis goes to Sales, and Accounting's becomes a mount. Customer Service, Commerce, Products, Manufacturing and Marketing register their reports with Insights. Pins are a UserPreference. | crosscut §3.x; People §4; Insights §6; Accounting; Sales; Customer Service; Products; Manufacturing; Marketing | R-ADM-14, R-INS-04..07, R-INS-11 |
| Z11 | Flow maps on report Definitions | Flow maps are stored as a `moqui.report.Definition` type (versions, shipped read-only with save-as-copy, git sync), not new records. Evaluate the node-graph panel before a bespoke `.qvue`. | Insights §9, §15 | R-INS-L02, R-INS-L04 |

### 3.4 How every app plugs into the stack

Crosscut gains **§1.5 Stack capabilities and app contributions**: a matrix of app against
contribution, and the contracts below. Each design names its entries in its §1 and lists anything
not yet built in its needs table.

| # | Contract | Recommendation | Subsumes |
| --- | --- | --- | --- |
| L1 | CX-ASSIST | Each component ships `skill/*.md` procedure skills and `skill/aliases.json`. Each app root's `shell-providers` declare `assist-prompt` and `response-action`. `AgentToolExposure` rows exist only where no screen does the job, with `exposeMcp` decided by data class; HR, payroll and grievance services get N. `data-entity` patterns never name HR or payroll packages. Two prerequisites are named: a framework per-field AI opt-out for confidential text, and the Mantle active-organization user-facts provider. | R-LV-01, R-LV-N12, R-LV-N13, R-LV-W05, R-LV-W09, R-COM-L02, R-PPL-L05, R-MNT-L07, R-SAL-L02, R-MKT-L03, R-INS-L01, R-ADM-L04, R-ADM-W04 |
| L2 | CX-SYNC | Y1 as a suite rule, plus read-only projected calendar collections answered by owner services: team absence and shifts, my work orders and due PM, the campaign calendar, interviews | R-LV-02, R-LV-03, R-PPL-L01, R-PPL-L02, R-MNT-L01, R-SAL-W06 |
| L3 | CX-MAIL-INTAKE | Business mail intake is an `EmailRuleAction` whose option names the owner's service, reached by a plus-tag intake address, as Projects already does. The Forum's address-routed email ECAs are only for addresses that are the identity. Actions: createApplication, createExpenseLine, createMaintenanceRequest, createLead, createQuoteRequest. | R-LV-04, R-LV-N04, R-PPL-L04 |
| L4 | CX-DELIVERY | X8 | R-LV-05, R-LV-N09 |
| L5 | CX-DEVICE | Shared devices sign in with a revocable device credential limited to one route group, a new framework need that gates People ClockingKiosk. Each action identifies its person by badge `scan-input` and PIN, with `density="handheld"` and an idle timeout. Admin registers devices; People PE-05 owns kiosk identity. Offline is drafts only on moqui-browser, later, after its login flow and tab lock. | R-LV-06, R-LV-07, R-LV-N10, R-LV-N11, R-LV-N14, R-MNT-14, R-MNT-L06 |
| L6 | CX-OPS-REPORTS | Each app ships `report/*.json` datasets, a dashboard and alert templates, and marks long jobs with `operation` and `operation-ref`. These replace the bespoke "operational measures" lists; Insights admits them. | R-LV-10, R-LV-W07, R-COM-L03, R-SAL-W03, R-SAL-W04, R-MKT-W02, R-PPL-L06, R-MNT-L03, R-ADM-L03 |
| L7 | Meetings | A meeting is an Event with a CallLink, and outsiders are invited by iMIP; no app has its own guest-link need | R-LV-08, R-LV-W02, R-PPL-L03, R-MNT-L05, R-SAL-W05, R-MKT-L02, R-SHP-L03 |
| L8 | Comms hooks | Each app adds its records to `record-lookup` and `create-from`. It puts `ext-action`s in the chat, message, voicemail and call slots, and answers `call-context` with its open records. HR calls keep no captions or transcripts unless `speech-local` is used. | R-LV-09, R-LV-W08, R-SAL-W01, R-SAL-W02, R-MKT-R05 |
| L9 | Templates and extraction | User-written templates render with `fancy-locked-html`. Document-to-record features use `run#Extract` and return proposals that are reviewed before writes. | R-LV-11, R-LV-12, R-LV-N05, R-LV-N07, R-SAL-L03 |

**Needs dedupe and gating.**
- Cite what exists:
  - `view-tree` for the People OrgChart;
  - `scan-input` and `density="handheld"`, which crosscut still calls proposed;
  - `EmailRuleAction`, `run#Extract` and `fancy-locked-html`.
- Gate what is not built:
  - Marketing SMS waits on Comms C1 and C4-SMS: email first, SMS its own stage;
  - the kiosk device credential;
  - camera scanning, or drop it from CheckIn.
- One resource-lane timeline for the People ShiftRoster and the crosscut M11 timeline.
- Decide PE-09 now.
- Add a Kind column to crosscut §7.4–§7.11.
- mr-moqui Remaining-Work gains a table of the framework asks and an updated Chat and presence row (R-LV-N01..N20).


## 4. Steps that now have one owner

The handoff reviewer walked each customer-side flow and named one owner for every step that had
none or two. People, Maintenance and Admin steps are owned by Y and Z above.

| Flow | Step | Owner | Service (existing or proposed) | Other files |
| --- | --- | --- | --- | --- |
| Lead to order | Public lead form | Marketing (one PASS page) | `P.submit#Form` → `mantle.sales.OpportunityServices.store#LeadIntake` | Sales §11, crosscut §5 |
| Lead to order | Tax on a storeless quote or order | Mantle, Accounting gateway | `calculate#OrderSalesTax` with the `gateway()` fallback (X1) | Sales §5, §13; Marketing §9 |
| Lead to order | Customer decline, seller withdrawal | Sales | `respond#Quote` → `cancel#Order` (X3) | Sales §5, §10 |
| Lead to order | Manual approval, hold release | Mantle seed; each app by direction | `approve#Order` + `check#OrderPreApprove` (X4) | crosscut §3.6; Purchasing §6 |
| Lead to order | Storeless confirmation | Sales | `send#OrderConfirmation` over X8 | crosscut §3.6 |
| Lead to order | Attribution at placement | Marketing (Mantle service) | `OrderPlacedRecordAttribution` → `record#OrderAttribution` (X10) | crosscut §1.3; Shop §7; Sales §5 |
| Web order | Visit and event capture | Marketing | MKT-TRACKING authority event (X10) | Commerce §1.2; Shop §4; Insights §6 |
| Web order | Marketing opt-in at checkout | Marketing | `request#Subscription`, source checkout | Shop §6; Marketing §13 |
| Web order | Guest order, download and renewal links | Mantle | ExternalAccess `SalesOrder` kind (X6) | crosscut §5; Sales §10 |
| Web order | Payment attempt | Accounting | typed PortalPaymentAttempt (X9) | Shop §8; Marketing §13 |
| Web order | Exception after placement | Accounting releases | `hold#Order(OhtPayment)` (X4) | Shop §8; Commerce §11 |
| Web order | Digital-item invoice | Accounting service, Shop calls it | `InvoiceServices.create#InvoiceFromSource` (ordered basis) | Shop §8; Commerce §11; Accounting §14 |
| Web order | Support question, cancellation, return | Customer Service | `create#CustomerCase`, `save#OrderChange`, `request#CustomerReturn` (X7) | Shop §9; Commerce §6 |
| Web order | Refund → revoke access | Shop service, Mantle SECA | `reconcile#RefundedItem` (X5) | Accounting §14; crosscut §1.3 |
| Web order | Account history | PASS Account | self relationship in `check` (X6) | Shop §9; Billing; Support |
| Subscription | Template marker | Mantle (Sales field) | `orderPurposeEnumId` RecurringTemplate (X5) | Credit, SECAs, order lists |
| Subscription | Recurring worker, recurrence fields | Sales (guards), Shop (dispatch), Accounting (monitor) | `create#RecurringOrders`, SAL-RECURRENCE | crosscut §1.3, §3.6 |
| Subscription | Renewal failure notices | Accounting Dunning excludes renewals in retry; Shop sends attempt notices | `preview#Dunning` exclusion | Accounting §5; Shop §10; Commerce §8 |
| Identity | Party merge | Commons (Mantle guard) | guards in `merge#Parties` (X15) | Sales §4; Marketing §10; Shop §4 |
| Identity | Unsubscribe and preferences | Comms (one PASS page) | ConsentServices + Forum opt-out (X15) | Commons §16; Marketing §13 |
| Identity | Privacy request intake and providers | Admin, each domain | `PrivacyServices.create#Request`; registered providers (X15) | Sales, Marketing, Commerce, Shop, Customer Service, Forum |
| Measurement | Orders, revenue, visits, funnel | Sales, Accounting, Marketing, Insights | registry metric IDs (X11) | Commerce; Marketing §11; Insights §6, §12 |


## 5. Findings by file

Blockers and majors are listed with the decision or fix that resolves them. Minors and nits are
named; their fixes are in the detail files (§10), and the fix pass applies them as proposed there.

### 5.1 People ([detail](review-suite-apps/people-maintenance.md))

| ID | Sev | Finding | Resolution |
| --- | --- | --- | --- |
| R-PPL-01 | major | RequestTriageNotice and WorkEffortRequestFromWork run on confidential grievances | Named as conditioned: the HR-confidential type is never triaged and never completed from linked work |
| R-PPL-02 | major | CalDAV exposes and writes protected checklist and goal tasks | Y1 |
| R-PPL-03 | major | `TIME_ENTRY_RATE` on project managers shows employee pay rates | Y2 |
| R-PPL-04 | major | No owner for equipment return at separation | Y6 |
| R-PPL-05 | major | Checklists ignore the shared process engine | Y5 |
| R-PPL-06 | major | Owner tables lack People rows for grievance, payroll invoice, equipment, interview and Projects time mounts | Add the rows (crosscut, Projects, Commons) |
| R-PPL-07 | major | Payroll-origin restriction in built Accounting has no owner | Y7 |
| R-PPL-08 | major | Skill entities lack the fields the forms use | PE-14 extensions named |
| R-PPL-09 | major | A position cannot carry a department | Proposed `EmplPosition.departmentPartyId`; `hire#Employee` validates the rollup |
| R-PPL-12 | major | Import wizard duplicates Shared/DataImport | Z2 |
| R-PPL-13 | major | HR records cannot hold files | Y9 |
| R-PPL-15 | major | Native payroll screens are first-release with no localization | User decision: kept first-release in preview; live finalization gated on a localization and Y7 |

Minors and nits: R-PPL-10 (overlap check refuses contractors), -11 (expense invoice already works
without a project), -14 (task-path rules unnamed), -16 (goal type), -17 (approval topics), -18
(Commons Chatter row), -19 (Accounting claim mount), -20 (boilerplate Context), -21 (status line),
-22 (shell contributions), -23 (paths).

### 5.2 Maintenance ([detail](review-suite-apps/people-maintenance.md))

| ID | Sev | Finding | Resolution |
| --- | --- | --- | --- |
| R-MNT-01 | blocker | CalDAV task PUT bypasses the process guard | Y1, with the code fix |
| R-MNT-02 | major | Manufacturing downtime and ResourceUnavailability are two outage facts | Y3 |
| R-MNT-03 | major | Labor cost would use the person's pay rate | Y2 |
| R-MNT-04 | major | Assignment ignores People qualification and availability | Y8 |
| R-MNT-05 | major | Maintenance cost policy is not in Accounting | Y7 |

Minors and nits: R-MNT-06 (outside-service acceptance), -07 (facility guards exist), -08 (import,
Z2), -09 (registry rows), -10 (rules unnamed), -11 (Open), -12 (warranty field), -13 (corrective
approval default), -14 (kiosk identity, L5), -15 (team model, Y4), -16 (status line and paths).

### 5.3 Commerce ([detail](review-suite-apps/commerce-shop.md))

| ID | Sev | Finding | Resolution |
| --- | --- | --- | --- |
| R-COM-01 | major | No editor for paid-access configuration | X16 |
| R-COM-02 | major | No Reports area, though Insights expects store metrics | X11 |
| R-COM-03 | major | `PublicShopPage` duplicates `PublicSitePage` | X14 |

Minors and nits: R-COM-04 (returns model, X7), -05 (reservation editor, X16), -06 (store group
fields), -07 (grant state), -08 (gateway choices, Z4), -09 (Pages registry, X14), -10 (rules),
-11 (EDI owner), -12 (zones and zero-rate stub), -13 (readiness registration, Z9), -14 (variant
publication), -15 (Open and Decided), -16 (status line), -17 (menu), -18 (context table and process
notes).

### 5.4 Shop ([detail](review-suite-apps/commerce-shop.md))

| ID | Sev | Finding | Resolution |
| --- | --- | --- | --- |
| R-SHP-01 | major | Own guest, download and recovery tokens | X6 |
| R-SHP-02 | major | No single customer account | X6 |
| R-SHP-03 | major | Return and support intake duplicate Customer Service | X7 |
| R-SHP-04 | major | Renewals would charge through cloned payments | X5 |
| R-SHP-05 | major | No adapter planned for hosted plus off-session payments | X9 |
| R-SHP-06 | major | Payment exceptions after placement have no order state | X4 |
| R-SHP-07 | major | A third delivery ledger | X8 |

Minors and nits: R-SHP-08 (operationKey exists, X9), -09 (download fulfilment path), -10 (event
purpose, X9), -11 (cancellation, X7), -12 (rules), -13 (`subscriptionUrl`), -14 (availability
source), -15 (cache headers), -16 (Open), -17 (vocabulary), -18 (status line), -19 (operation
names).

### 5.5 Sales ([detail](review-suite-apps/sales-marketing.md))

| ID | Sev | Finding | Resolution |
| --- | --- | --- | --- |
| R-SAL-01 | blocker | Storeless orders get no tax, shipping, promotions or emails | X1 |
| R-SAL-02 | major | `orderRevision` binding invalidates itself | X2 |
| R-SAL-03 | major | Decline through `reject#Order` fails | X3 |
| R-SAL-04 | major | `ORDER_APPROVE` releases other domains' holds | X4 |
| R-SAL-05 | major | Agreement statuses seeded twice | X13 |
| R-SAL-06 | major | Automation register incomplete | Rows added (§1.3) |
| R-SAL-07 | major | Per-app context rows missing in crosscut | Rows added |
| R-SAL-08 | major | Lead intake for Marketing's first release has no builder | X16 |
| R-SAL-09 | major | Organization filter does not cover Sales records | X12 |

Minors and nits: R-SAL-10 (net-terms approval queue), -11 (consent read-only), -12 (quote template
as an order), -13 (subscription lists, X5), -14 (commission, X16), -15 (UTM map, X10), -16 (quote
send path), -17 (inquirer details before qualification), -18 (status line), -19 (proposed label).

### 5.6 Marketing ([detail](review-suite-apps/sales-marketing.md))

| ID | Sev | Finding | Resolution |
| --- | --- | --- | --- |
| R-MKT-01 | major | Nobody writes visits or attribution | X10 |
| R-MKT-02 | major | Four delivery engines | X8 |
| R-MKT-03 | major | No bounce or complaint intake for direct SMTP | VERP Return-Path and a DSN/ARF email ECA in MKT-TRANSPORT |
| R-MKT-04 | major | Blog posts deferred against initial-design | User decision: BlogPosts and BlogPostDetail over WikiBlog now |
| R-MKT-05 | major | A third public payment entry point | X9 |
| R-MKT-06 | major | Organization filter does not cover Marketing records | X12 |
| R-MKT-07 | major | Registry rows missing; names disagree with the registry | Rows added; registry names used |

Minors and nits: R-MKT-08 (forms, X16), -09 (preferences, X15), -10 (package of Comms
configuration), -11 (SMS gating, §3.4), -12 (campaign templates and tags), -13 (paid-ticket rules),
-14 (tracking consent purpose), -15 (status line), -16 (names).

### 5.7 Admin ([detail](review-suite-apps/admin-insights.md))

| ID | Sev | Finding | Resolution |
| --- | --- | --- | --- |
| R-ADM-01 | major | Relay list exposes personal mailbox servers | Z1 |
| R-ADM-02 | major | Endpoint change keeps the stored secret | Z1 |
| R-ADM-03 | major | New permissions not sealed | Z1 |
| R-ADM-04 | major | Invitations have no acceptance route | Z1 |
| R-ADM-05 | major | Provisioning call named by neither side | Z3 |
| R-ADM-06 | major | Shared/DataImport has no consumers | Z2 |
| R-ADM-07 | major | Agent administration links point at screens that don't exist | Z5 |
| R-ADM-08 | major | Every row first-release, with framework work unphased | Z5 |
| R-ADM-09 | major | Gateway configuration ownership conflicts with crosscut §5 | Z4 |

Minors and nits: R-ADM-10 (organization availability), -11 (rules), -12 (reset text), -13 (aliases,
Z6), -14 (Employee360 rows, Z10), -15 (organizations vs departments), -16 (sessions), -17 (settings
registry), -18 (webhook events), -19 (ownership transfer, Z3), -20 (export surfaces), -21
(capability rows), -22 (service cells), -23 (status line), -24 (names and paths).

### 5.8 Insights ([detail](review-suite-apps/admin-insights.md))

| ID | Sev | Finding | Resolution |
| --- | --- | --- | --- |
| R-INS-01 | major | No group schedule or business alert until unsized framework work exists | Z7 |
| R-INS-02 | major | A new dataset returns nothing until a feed indexes it | Z8 |
| R-INS-03 | major | Scope policy reinvents `rowFilterService` | Z8 |

Minors and nits: R-INS-04 (two SalesAnalysis owners, Z10), -05 (pins), -06 (existing report
services), -07 (apps not registered, Z10), -08 (cash forecast owner), -09 (readiness registry, Z9),
-10 (attention providers, Z9), -11 (owner rows, Z10), -12 (editor mounting), -13 (service cells),
-14 (Assist analytics), -15 (status line), -16 (paths).

### 5.9 Customer handoffs ([detail](review-suite-apps/customer-seams.md))

| ID | Sev | Finding | Resolution |
| --- | --- | --- | --- |
| R-SC-01 | major | Nothing marks a recurring template order | X5 |
| R-SC-02 | major | Two owners of the recurring worker; recurrence fields disagree | X5 |
| R-SC-03 | major | Renewal notices clash with Dunning | X5 |
| R-SC-04 | major | Refund or chargeback does not revoke access | X5 |
| R-SC-05 | major | Shop cancellation relies on a policy no file defines | X7 |
| R-SC-06 | major | Shop questions bypass Customer Service | X7 |
| R-SC-07 | major | No invoicing service for digital items | §4 step: `create#InvoiceFromSource` |
| R-SC-09 | major | Two merge paths, the guard only in Sales | X15 |
| R-SC-10 | major | Privacy requests have two intakes and few providers | X15 |
| R-SC-13 | major | Tracking keyed on a visit a remote PASS doesn't have | X10 |
| R-SC-14 | major | Orders and revenue defined three times; no funnel owner | X11 |

Minors: R-SC-08 (Commerce verdicts, X7), -11 (preference pages, X15), -12 (checkout opt-in, X15),
-15 (crosscut §5 rows, X6), -16 (lead pages, X15).

### 5.10 Stack leverage ([detail](review-suite-apps/stack-leverage.md))

The twelve suite decisions R-LV-01..12 become L1–L9 (§3.4). The twenty needs fixes R-LV-N01..N20 are
applied to the needs tables, crosscut §7 and Remaining-Work. The ten easy wins R-LV-W01..W10 are
added to the designs:
- Call, Video and Chat on the shared contact record;
- "Add video call" on EventDetail;
- `.ics` export on WorkEffort-backed records;
- a QR of the record link in the print header;
- prompt chips and response actions per app;
- push policy and lock-screen-safe titles per topic;
- `operation` marks and alert templates on jobs;
- create-from actions in the Comms slots;
- inline text actions instead of new drafting needs;
- palette rows with record keys.


## 6. Reference features

Size: S = existing Mantle or framework plus screen, form or action additions; M = a small extension
(fields, a service, a widget); L = a new model or subsystem. The fix pass adds S features and the
"add" rows. M and L features go into the file's Open list with the recommendation, or into a
`later` row as the reviewer proposed. The full proposals are in the detail files.

| File | Add to the design | Open, with recommendation | Later |
| --- | --- | --- | --- |
| People | leave block days (F02), resume lines (F05), identity-document expiry (F08) | full and final settlement (F01), compensatory leave (F03), overtime from attendance (F04), mileage and per-diem rules (F07) | talent pool (F06), travel requests (F09) |
| Maintenance | supplier warranty (F03), repair cost to a project (F04) | customer-equipment PM under agreements (F01), category attributes (F02) | fleet logs (F05), MTBF/MTTR proxy (F06) |
| Commerce and Shop | merchant reply to reviews (COM-F03) | gift cards and store credit (COM-F01), click and collect (COM-F02), back-in-stock (SHP-F01), quote from cart (SHP-F03) | loyalty (COM-F04), recently viewed (SHP-F02) |
| Sales | B2B order self-service (R01), recurring revenue on opportunities (R03) | lead scoring (R02), blanket orders (R04), deal tags (R08) | lead SLA (R05), activity plans (R06), partner channel (R07) |
| Marketing | order and cart triggers on X8 (R03) | block email builder (R01), campaign stages and tags (R04) | share cards (R02), live chat to lead (R05) |
| Admin | new-device sign-in email (F03), quick privacy lookup (F05) | session lock per group (F02), runtime password policy (F04), export profiles (F06) | passkeys (F01), event-condition notification rules (F07) |
| Insights | — | usage analytics (F01), alerts to chat (F03) | notebooks (F02), result caching (F04), add to my dashboard (F05) |


## 7. Verdicts on the Open lists

Every Open list said nothing was open. Each now lists the choices the reviewers found, with a
recommendation. The detail files hold each reviewer's verdict on the existing items.

| File | Existing items | Items added |
| --- | --- | --- |
| People | localization and maintainer: amend (user decision: native engine in preview until chosen); external connector: amend (bank files stay Accounting's); retention: amend (Admin owns holds); agricultural scale: agree | pay-rate exposure (Y2); full and final settlement; comp time and overtime |
| Maintenance | "nothing open": reject | downtime fact (Y3); labor costing (Y2); cost policy owner (Y7); CalDAV exposure (Y1); corrective approval default; customer-equipment PM; warranty storage |
| Commerce | "nothing open": reject; configuration items and later scope: agree | paid-access owner; Reports; site pages; reservation editor; EDI owner; variant publication; gift cards; click and collect |
| Shop | "nothing open": reject; provider configuration: amend (the adapter is a dependency) | capability service; account hub; Support reuse; renewal path; payment adapter; delivery ledger; social sign-in; back-in-stock; quote from cart |
| Sales | "no choice open": reject; later gates: agree | storeless tax; quote template as an order; B2B self-service; commission; high-value acceptance authentication; agreement states |
| Marketing | "nothing blocking": reject; Publishing later: amend (blog posts now) | delivery ledger; SMS gating; block builder; registration payments; one-person approval policy; attribution writer |
| Admin | "nothing blocking": reject | phasing and placement; import strategy; agent screens owner; invitation route; webhook scope; Tools screens for ADMIN; session timeout and password policy; archive download |
| Insights | "none": reject | first-release delivery; dataset indexing owner; flow-map storage; pins; Assist analytics tools; multi-touch attribution; ownership transfer |


## 8. Mechanical checks

- **Links and anchors.** Every relative link and `#anchor` in the eight files resolves, including the `../../mr-pass/plan/` links (checked by script before the review).
- **Needs roll-up.** Each file's needs table matches its crosscut §7.x section: People §7.5, Maintenance §7.6, Commerce and Shop §7.7 (10 and 13 IDs), Sales §7.8 (16), Marketing §7.9 (20), Admin §7.10 (11), Insights §7.11 (12).
- **Inventories.**
  - All 34 ProductStore, 10 Vendor and 6 Gateway baseline forms are now mapped.
  - `FindOrder CreateSalesOrder` is mapped.
  - Gaps:
    - the WikiBlogs forms (mapped by the fix pass with R-MKT-04);
    - `EquipmentServices.create#Equipment` Designed-in;
    - the stale ServicePortal mapping of `find#ReturnableOrderItems`.
- **Names.** Screen names that differ from their path segment without the repeat guide §4 allows, in Admin, Marketing, Maintenance and People (R-ADM-24, R-MKT-16, R-MNT-16, R-PPL-23).
- **Vocabulary.** Shop's Impl `xml + html` and Scope `existing foundation S2` are outside guide §4's vocabulary (R-SHP-17).
- **Status lines.** All eight differ from guide §3's `Oct 31, 2026 — draft`.

The fix pass re-runs the link, needs, registry, inventory and name checks after its edits.

**After the fix pass (Nov 1, 2026).**
- **Links and tables.** Every relative link and anchor resolves in:
  - the 19 design files in mr-boss and mr-pass, both inventories, this review and its detail files;
  - mr-moqui `plans/Remaining-Work.md` and `docs/interfaces/Sync.md`.

  Every table row has its header's column count. The 18 broken links that design-customer-service.md already had are fixed too.
- **Needs.** Every needs ID a design cites is in its own table, and each table matches its crosscut §7.x roll-up exactly. Counts: People 24, Maintenance 16, Commerce 11, Shop 12, Sales 19, Marketing 22, Admin 15, Insights 12.
  - SHOP-OUTBOX is gone; it folded into CX-DELIVERY.
  - People PE-22 points at Admin ADM-DEVICES.
  - Accounting's cash forecast is Insights INS-12.
- **Registry.** Every `Shared/` screen the eight designs name has a crosscut §2 row. The built `Shared/ProductImport` was added, as the basis of DataImport.
- **Status lines.** The eight designs carry `Nov 1, 2026 — draft; reviewed against …`.
- **Inventories.** usl-inventory: 63 cells changed and 5 rows added. ss-inventory: 20 cells changed. The changes:
  - renamed paths;
  - `ServicePortal/*` → `PASS:Support/*`;
  - the WikiBlog forms and `create#Equipment`;
  - `find#ReturnableOrderItems`, `reject#Order` and `cancel#Order`;
  - the services newly named in form summaries.

  No Implemented-in cell changed.
- **Code (Y1, Y2).** The fixes passed these specs, with no existing expectation changed:
  - mr-mantle: Dav, WorkTimeEntries, WorkResources, CalendarChanges, HumanResServices, PayrollServices;
  - mr-boss: TimeEntries, Resources, ResourceWalk, TimeWalk, Billing, NewProject, ClientBilling, WorkItemDetail, ProjectsTui, EventDetail.

  mr-boss ClientIsolation has 4 failing features (Accounting Customer360: "The same native customer request must succeed for the AR user"). They fail the same way with the changed code reverted, so they predate this pass.


## 9. Findings narrowed by the handoff review

| Finding | Verdict | What changed |
| --- | --- | --- |
| R-SHP-04 renewal double charge | partly | A double charge needs a base order that carries a Payment. The firm risk is a renewal that charges a copied saved method without consent. Fix: `copyPayment=false` plus consent (X5). |
| R-MKT-02 four delivery ledgers | partly | Three new ledgers plus Forum's built one; Commerce cart recovery already uses Shop's. One ledger generalized from ForumDelivery (X8). |
| R-SAL-05 agreement statuses | partly | Two AgreementDetail screens are by design. Only the status seed is duplicated (X13). |
| R-COM-03 PublicShopPage | partly | PublicSitePage lacks route, mount, locale and window. Extend it rather than drop the needs (X14). |
| R-SHP-06 payment exceptions | partly | Before placement they have a state. OhtPayment is kept, and OhtStock dropped (X4). |

Recommendations the handoff review improved:
- X1 uses the tax fallback, not an organization default store.
- X2 narrows the Mantle counter rather than adding a Sales-only hash.
- X3 uses `cancel#Order`.
- X4 changes seed data only for per-type release.
- X6 puts the hub in PASS Account.
- X12 adds denormalized organization fields, because entity filters cannot follow dated role rows.


## 10. Detail files

Each reviewer's report is in `review-suite-apps/` beside this file. The reports hold the evidence
column, the fix for every minor and nit, the easy-win and leverage tables, the research-coverage
and checklist results, and what each reviewer checked and found correct:
- [people-maintenance](review-suite-apps/people-maintenance.md)
- [commerce-shop](review-suite-apps/commerce-shop.md)
- [sales-marketing](review-suite-apps/sales-marketing.md)
- [admin-insights](review-suite-apps/admin-insights.md)
- [customer-seams](review-suite-apps/customer-seams.md)
- [stack-leverage](review-suite-apps/stack-leverage.md)
