# IronStone BOSS — Customer Service implementation

Nov 5, 2026 — built: P0–P16 done (§3), what is left is §7. Nov 5, 2026 — P0 done (F45–F73), build started. Nov 1, 2026 — plan; P0 partly done (F1–F44, found while writing it); the phase order and the open questions decided
(§4), on the shared party-role and effective-date rules and the Mantle boundary (impl-drawers-commons §4); the
customer pages as a PASS app in mr-pass (§4); consistency pass: brought in line with the Accounting and Warehouse
builds and the Nov 1 decisions

How [design-customer-service.md](design-customer-service.md) gets built, in phases from the foundation to the Support
app, each ending tested and usable. This file is kept at a high level, as [impl-products.md](impl-products.md),
[impl-accounting.md](impl-accounting.md), [impl-warehouse.md](impl-warehouse.md),
[impl-manufacturing.md](impl-manufacturing.md) and [impl-purchasing.md](impl-purchasing.md) are: each phase names its
scope by the design's sections and §12 needs rather than restating them, and the design stays the place for screen and
record detail. During the build this file is the log: phase status and what each built, the decisions made, open
questions, findings against the code, and what is deferred.

Today `screen/CustomerService/` holds eight flat placeholders, and the root mounts only Chatter and RecordFiles. The
`BOSS_CUSTOMER_SERVICE` admin authz is live (F1); P1 adds the root user group and the ordinary groups. None of the
design's proposed services, entities, fields or status items exist in Mantle or BOSS beyond what the five apps built
before it provide. Customer Service is the last of the six core apps, built after Manufacturing and then Purchasing
(§4), so these are there to extend, and P0 checks that each landed:
- from Products: Product360 with its substitutes (PatEquivalent, PatReplacement) and `check#ProductUsable` on both
  order-entry paths (P2); `store#ProductPrice`, the resolver with its trace and `Shared/PriceExplain` (P5);
  `Shared/InventoryAvailability` (P7);
- from Accounting: the AR, treasury, approve and read groups (P1); the CX-POSTING operation record (P2);
  `Shared/Customer360`, InvoiceDetail's receivables context and `send#Invoice` (P4); `Shared/ShipmentDetail` and the
  Approvals mount (P6); CX-ORDER-HOLD's `hold#Order` and `release#OrderHold`, and `CreditServices` with
  `evaluate#OrderCredit`, `get#CustomerCreditStatus` and Customer360's Credit tab (P10); `receive#ReturnItems`, the
  conditioned return SECAs, `preview#ReturnSettlement` and `settle#Return`, `release#ShipmentDraftInvoice`,
  `refund#OrderPayment` and `Shared/ReturnDetail` (P17); CX-PORTALS' `ExternalAccessServices`, the invoice's pay link,
  and the PASS Billing and Supplier apps, the first beyond Forum, which settle how a PASS app registers (P18);
- from Warehouse: the receive, inspect and quality-manager groups (P1); CX-QUALITY with `Shared/QualityInspection` and
  the disposition vocabulary (P8); `record#ShortPick` with ShipmentPickException, and the cancelled balance's
  `ShipmentItemSource.putBackQuantity` (P11);
  ReopenPackage (P12); WH-LABEL and its test gateway (P13); ReturnReceipt, `request#ReturnLabel` and ReturnContent (P14);
  `Shared/StockAtDate` with `get#InventoryAtDate` (P17);
- from Manufacturing: the maintenance request and AssetMaintenance on EquipmentDetail (P11), beside which a warranty
  repair sits;
- from Purchasing: the approval decision pattern with its stale-revision refusal (P3, P4); supplier returns (P8), which
  a customer case links to; CX-REQUEST's type check in `complete#RequestFromWork` and RequestDetail's Items tab in
  every context (P10); agreement statuses (P13);
- from Projects: `Shared/RequestDetail`, `Shared/WorkItemDetail`, `Shared/OrderDetail`, `Shared/InvoiceDetail`,
  `complete#RequestFromWork`, and the intake settings and tokens;
- from Commons: notification topics with approve and refuse services, Notifications, Chatter, RecordFiles, Compose with
  its text-block picker, Knowledge with WikiPageReview, the working hours of Preferences, and the palette, quick-create,
  Today and record-link providers;
- from PASS (mr-pass), where the customer pages go as a new app (§4): its public shell, sites with their host and app
  mounts, public accounts and invitations, the `pass.Facade` operations with Mantle's PassApi routes for a remote
  frontend, media staging and scanning, and the forum's case services.

**Inputs.**
- Designs:
  - [design-customer-service.md](design-customer-service.md)
  - [design-crosscut.md](design-crosscut.md) §1.3 (the automation register), §1.4, §3.1, §3.2, §3.5–§3.8, §3.11,
    §3.12, §3.15, §3.16, §3.18, §3.19, §3.26, §4.4, §5, §5.1, §7.1 (CX-ACCESS, CX-REQUEST, CX-AVAILABILITY,
    CX-QUALITY, CX-CREDIT, CX-POSTING, CX-APPROVAL, CX-PRICING, CX-LABELS, CX-RETURNS, CX-ORDER-CHANGE, CX-PORTALS),
    §8 (the survey builder) and §9
  - [design-projects.md](design-projects.md) §6 Requests
  - [design-drawers-commons.md](design-drawers-commons.md) §4, §6, §7, §10 and §15
  - [design-accounting.md](design-accounting.md): AC-02, AC-11, InvoiceCorrection and the ReturnDetail settlement
  - [design-warehouse.md](design-warehouse.md): §9 (the short pick), §11 returns and §14 StockAtDate
  - [design-products.md](design-products.md): Product360 and PRD-PRICE
  - `mr-pass/plan/design-forum.md`: §1 (the public shell and app mounts), §4 (deployment, the authority boundary and
    the request contract), §5 (identity, membership and invitations), §13.1 (the shared foundation) and §13.4 (the
    forum's case escalation)
- Plans:
  - [impl-products.md](impl-products.md): the pattern; P2, P5 and P7.
  - [impl-accounting.md](impl-accounting.md): P4, P6, P10, P17 and P18, its rule flags, operation record and pack
    invoice (§4), and its §7 list of Customer Service's contexts and callers.
  - [impl-warehouse.md](impl-warehouse.md): P8, P11, P13, P14 and P17, and its §7 list.
  - [impl-purchasing.md](impl-purchasing.md): P3, P4, P8, P10 and P13, and its §7 list.
  - [impl-manufacturing.md](impl-manufacturing.md): P11.
  - [impl-projects.md](impl-projects.md): P5 (requests and intake), P8 (OrderDetail and InvoiceDetail) and P10 (client
    access).
  - [impl-drawers-commons.md](impl-drawers-commons.md): M2 (topics), M6 (requests), M7 (calendar), M9 (knowledge).
  - `mr-pass/plan/implementation-forum.md`, `mr-pass/docs/Deployment.md` and the mr-pass README's development checks:
    what PASS built, its local and remote deployments, and how its specs run.
- The design review: [review-core-apps.md](review-core-apps.md) (D1–D28) and
  [review-core-apps/customer-service.md](review-core-apps/customer-service.md), which explain the design's D- and R- IDs.
- Guides and rules: [design-doc-guide.md](design-doc-guide.md), [style-guide.md](style-guide.md) §8, and
  [impl-drawers-commons.md](impl-drawers-commons.md) §4 (the shared rules, with the party-role and effective-date rules).
- Inventories: [ss-inventory.md](ss-inventory.md) and [usl-inventory.md](usl-inventory.md), which already carry the
  design §10 **Designed in** paths.
- mr-moqui: `plans/Remaining-Work.md` and `docs/Build-Test.md`.

Framework paths are under the mr-moqui checkout (`crates/`, `runtime/components/base/`), Mantle paths under
`runtime/components/addon/mr-mantle/`, PASS paths under `runtime/components/addon/mr-pass/`.

Sections: [1 scope](#1-scope-and-order) · [2 rules](#2-ground-rules) · [3 phases](#3-phases) ·
[4 decisions](#4-decisions) · [5 open](#5-open-questions) · [6 findings](#6-findings) · [7 later](#7-later) ·
[8 verification](#8-verification)

---

## 1. Scope and order

- **Repositories.** Each is its own git repo:
  - `mr-moqui` (`crates/`, `runtime/components/base`)
  - `runtime/components/addon/mr-mantle`
  - `runtime/components/addon/mr-boss`, the internal app
  - `runtime/components/addon/mr-pass`, the customer pages as its Support app (§4)

  `runtime/components/addon/mr-marble` is read only, for the baseline Request, Return, Customer, Order and Survey screens that
  design §10 maps. Framework work is limited to what P0 finds CS-FORM-ELEMENTS needs (P5, P7), DbForm's dated, audit-logged
  fields (P7), and a record viewers topic if P0 finds it cheap (P5).
- **Scope.**
  - Every `parity` and `new` row of design §2, and the §12 needs they use, except ChannelAutomation.
  - The design reshaped by the shared rules (§2, §4): queues, service-level policies, status mappings, assignment
    rules, templates, return policies and defaults are effective-dated rows with their key fields audit-logged, not
    versions; a case, episode, return or invitation keeps the row it was evaluated against, and the time; a case's
    organization and people are RequestParty roles; order changes and warranty claims are their Requests, and case
    templates DbForms (§4).
  - The parts of other apps' needs that Customer Service still depends on (§4):
    - CX-REQUEST: the case rules of D23 on every Request entry point, and the support-case rule in
      `complete#RequestFromWork` beside Purchasing's type check;
    - Commons: a team's working hours, the business-time service, and the survey builder (crosscut §8);
    - crosscut §3.2: Customer360's CustomerServiceStatistics, ServiceAgreements and DeliveredItems forms;
    - Mantle's forum services: a queue route for `create#CaseFromTopic` (F12).
  - Shared screens: the survey builder's four screens (crosscut §2) and `Shared/OrderChangeDetail`, which Sales also
    mounts, with the Customer Service context only. Customer Service's
    context on the fourteen shared screens other apps built:
    - Products' Product360 and InventoryAvailability;
    - Projects' RequestDetail, WorkItemDetail, OrderDetail and InvoiceDetail;
    - Accounting's Customer360, ShipmentDetail and ReturnDetail;
    - Warehouse's QualityInspection and StockAtDate;
    - Commons' contact record (ContactDetail), Knowledge, and Notifications as Approvals (crosscut §3.15).
  - The customer pages of design §8 as a new PASS app, Support, in mr-pass (§4): its own app mount beside Forum, the
    Mantle services it calls through PASS's facade, and their routes for a remote frontend. It replaces design §8's
    `screen/ServicePortal.xml` root and its `BOSS_SERVICE_PORTAL` group for Customer Service's pages (F42).
  - The callers the other plans leave to Customer Service (their §7): `authorize#Return`, `apply#OrderChange` (the
    cancelled balance and the substitute on a short pick), Issue return label, and its CX-APPROVAL topics on
    Purchasing P4's decision pattern.
  - §7 holds the `later` rows and needs, and the rest of the other apps' needs.
- **Order** (decided Oct 28, 2026), the case spine first, then the order-side work on what the other apps built:
  1. the foundation;
  2. cases and queues, with the case rules on every entry point;
  3. customers and orders, the records a case links;
  4. service levels;
  5. assignment and saved replies;
  6. channels;
  7. case templates;
  8. merge, split and closing;
  9. returns;
  10. order changes;
  11. warranty;
  12. knowledge;
  13. feedback;
  14. reports;
  15. the Support app in mr-pass;
  16. the finish.

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

  The walks are on Products' pattern (impl-products §2): one golden-path walk in `test/client/`, the rest acceptance
  tests.
- **Service rows through services.** Under the organization filters (impl-drawers-commons §4), Party, OrderPart, Shipment, ReturnHeader and Invoice
  are filtered, but not Request, RequestCategory, OrderHeader, OrderItem, CommunicationEvent or the Request joins (F2).
  Customer Service reads and writes them only through services: `ironstone.customerservice.AccessServices` checks the
  organization, the customer, the queue and team, the record and the capability, then the screen calls the Mantle
  service, which checks its own permission (P1) and the organization by party relationship
  (`get#PartyOrganizationInfo`). No same-named `ironstone` pass-through is built.
  - `entity` in a design form summary means that guarded path, never a bare entity form.
  - Grants are checked in the services, so they hold for exports, search, the palette, notifications and shared
    mounts. The `BOSS_CUSTOMER_SERVICE_*` groups get no artifact authorization for the raw Mantle request, return and
    order mutators or their REST paths.
- **Public pages in mr-pass, internal ones in mr-boss** (§4). The customer pages are the PASS Support app, on PASS's
  foundation (design-forum §1, §4, §5):
  - PASS's public shell and its host and app-mount routing, with Support as an app beside Forum; server-rendered HTML
    with qvue enhancement, working at 390 px. PASS has no terminal UI yet, so design §8's terminal equivalents wait
    for it (§7).
  - Public accounts hold only `ALL_USERS`; PASS roles live in its membership records. A customer contact reaches a
    customer's records through Mantle's checks of the contact's customer relationship and of
    `ExternalAccessCapability`, never through a UserGroup, so `BOSS_SERVICE_PORTAL` is not used here.
  - The app reaches the authority only through `pass.Facade.call#Operation`: each operation is in PASS's
    `Schema.js`, its route in `Routes.js`, and Mantle's PassApi servlet serves it to a remote frontend. The same pages
    work with a local Mantle or a remote authority with only framework, webroot and PASS installed. BOSS is not a PASS
    runtime dependency, so no `ironstone.*` service, BOSS screen or BOSS group is called.
  - PASS's request contract: allow-listed projections with capabilities and revisions, opaque cursors, operation IDs
    on creates, `expectedRevision` on changes, and its HTTP result kinds (design-forum §4.3).
  - A bearer link (an RMA, a feedback invitation, a queue's public form) is a page of the app that takes its token, as
    PASS's Unsubscribe does, checked by Mantle's `check#AccessToken`, not a BOSS `<token-route>`.
  - Uploads go through PASS's media staging and scanning, finalized into the record's content.
- **What Mantle runs is Mantle's** (F41; impl-drawers-commons §4, §4 here). The Request rules, the jobs, the Support
  app and the BOSS screens call the same Mantle services, in the package of the records they change:
  - `mantle.request.SupportCaseServices`: the case core (`ensure#CaseProfile`, `assign#Case`, the case's create,
    update, transition, call log, merge and split, saved-reply apply, the template checks, closing), the saves of
    queues, teams, types, status mappings, workflows, defaults, assignment rules, routes and templates, and the
    customer services;
  - `mantle.order.OrderChangeServices`, `mantle.request.KnowledgeServices` and `mantle.request.CaseFeedbackServices`,
    beside the design's ReturnPolicyServices, SlaServices and WarrantyServices.

  Their records are `mantle.request.support` and `mantle.order.return` entities, never BOSS `entity/`, and the topics
  they send on are seeded in mr-mantle with Mantle handlers, BOSS setting the links (F44). Mantle specs grant the
  permissions to spec-local groups, never a `BOSS_*` group. `ironstone.customerservice` keeps AccessServices, the
  screens' reads, settings forms and reports, and calls the Mantle services.
- **Audience on the server.** Every message, file, link, status label, count and print is customer-visible or internal
  by a server rule, never by a hidden field. A customer contact, a customer-visible print and a customer notice get
  outward messages, approved shared files and customer labels only; no internal note, internal file, staff detail,
  other customer, cost or supplier value. A service leaves out of its answer any cost, supplier price, credit fact or
  financial amount the user may not read (in Mantle by `ACCOUNTING_VIEW`, `PRODUCT_COST_VIEW`, `SUPPLIER_PRICE_VIEW`
  and `CUSTOMER_CREDIT_VIEW`); it is omitted or said to be withheld, never shown as zero (design §1).
- **Service records follow the shared rules** (impl-drawers-commons §4; §4 here):
  - Parties by role: a case's organization is a RequestParty in the OrgInternal role, as Purchasing's request is
    (impl-purchasing §4); its customer, contact and assignee are RequestParty rows in the Customer, Reporter and
    Assignee roles; a team member is a dated PartyRelationship from the agent to the team; a return's assignee is a dated
    ReturnParty row (F24). The fields Mantle keys by stay: Request's filer, ReturnHeader's customer and vendor. A queue's
    organization is an owner field on RequestCategory (F6), as Products P3 gave feature groups one.
  - Policies and settings are effective-dated rows with their key fields audit-logged: the queue settings, ServicePolicy,
    ServiceLevelPolicy and its targets, CaseStatusMapping, ServiceAssignmentRule, team participation, ReturnPolicy,
    ServiceKnowledgeSource and the feedback delivery policy. A draft is a row with no from date; Publish sets it and ends
    the row it replaces. A case, episode, return or invitation keeps the row it was evaluated against, and the time.
  - The audit log on the key fields a phase locks: Request's type, category, priority, due date and resolution (status
    is logged already), ReturnHeader's new fields, and the order-change and warranty fields of P10 and P11.
  - Records of their own stay where a fact has its own identity, and the phase says why: the SLA episode and its events
    (measurements, like postings), a case relation (merge, split, follow-up), the order-change and warranty decisions
    (as PurchaseApprovalDecision), the return authorization decision, article feedback, the feedback invitation, and the
    assignment cursor.
  - Prints take an effective date and time. A key revision stores its PDF on its record: the RMA authorization as
    ReturnContent, an applied order change and the order confirmation as OrderContent, a resolved case's summary as
    RequestContent when sent.
- **One case clock** (D23). A case's status changes, messages and linked work, from any screen or service, reach the
  SLA through Mantle's Request rules, not through Customer Service's screens alone. Every path that changes a case's
  status, due date or resolution outside Customer Service (F8) either records through the rule or refuses with the reason
  and a link to CaseDetail. `Request.responseRequiredDate` on a case is written by SlaServices only.
- **Revisions and operations.** Every authorization, application, decision, settlement call, bulk action, saved-reply
  apply, send and Support app submission names its source revision and an operation identity. A retry answers the first
  result, and a stale revision is refused naming the current one. The operation record is Accounting P2's
  CX-POSTING record (impl-accounting §4). A batch names each failure and goes on: cases, replies, returns,
  invitations, feedback reviews. One merge, split, authorization or application with its links commits atomically.
- **Shared screens.** Customer Service builds only the survey builder's four screens and `Shared/OrderChangeDetail`
  (§4). It adds its context to the
  shared screens of §1, each taking `appRoot` and server-derived capabilities on `Shared/RequestDetail`'s pattern, and
  its context adds no right a borrowed capability does not give: W and F act from Customer Service's mounts without the
  Warehouse or Accounting root, and A sees what they do read only (design §1).
- **Owner contracts.** A contract built here for another app follows that app's design: its package, its record and
  service names, its permissions, its Shared screen and its capability groups. A change found while building it is
  written into the owner's design. The owner's own screens stay with the owner.
- **Mantle rule changes keep Mantle's default.** Each new rule or refusal in Mantle acts only on a case (a request in a
  service queue), a queue route or a feedback invitation, which exist only where Customer Service is configured, and
  ships with a test of its condition and of its unchanged default (crosscut §7.1). The return and pack-invoice rules
  are Accounting's, behind their flags (impl-accounting §4); Customer Service's own are ServicePolicy flags. A
  permission check goes on a new Mantle service only; an existing one gains a refusal only behind its flag.
- **Mantle callers stay compatible.** Existing callers of these keep working:
  - `create#Request` from Comms, Chat, Commons QuickRequest, Projects NewRequest, `create#RequestFromEmail`,
    `create#IntakeRequest` and the forum's `create#CaseFromTopic`;
  - `complete#RequestFromWork` for Projects' types, and a project's intake token and mail rule;
  - `find#EmailTextBlocks` and Comms TextBlocks;
  - `create#ReturnFromOrder`, `request#Return`, `approve#Return` and `cancel#OrderItem`;
  - the framework FormResponse services for responses with no invitation;
  - PASS's Forum, Account, Members and Sites apps, its site and mount configuration, and its operation catalogue.

  Mantle's WorkProjectRequests, RecordVisibility, RecordLinks, WorkProjectClients, CommonsToday, OrderToCashBasicFlow,
  ReturnToResponseBasicFlow, ShipmentReturnMisc and WorkPlanToCashBasicFlow specs, PASS's specs (Forum, ForumAccess,
  PublicIdentity, Integrations, RemoteFixtures, and ForumHttp and RemoteHttp in the browser) and mr-marble's render
  specs pass unchanged, and so does the earlier apps' BOSS regression suite.
- **Done for a phase** means all of these:
  - impl-projects §2 "Done":
    - cargo tests for the touched crates, with goldens reviewed;
    - the regression tests for the rules the phase adds passing: Mantle's in mr-mantle, BOSS's in mr-boss;
    - the regression suites of mr-mantle and mr-boss passing within their budget;
    - `moqui lint --screens` clean for BOSS with the Debug binary;
    - the inventories' **Implemented in** columns;
  - an access rule the phase adds checked in `CustomerServiceAccess` (one holder and one non-holder on one verb, and
    another organization's record refused), not every service and mount; ProjectsAccess passing with the new
    package (F17);
  - for a phase that touches the Support app (P13, P15): the same for mr-pass, and lint clean for PASS;
  - its row and **Built** note here.

  No route fixtures: a screen sweep is an acceptance test, one per app per mode (F20). The phase's "usable when" and
  its §8 scenario are acceptance tests to write (`test/acceptance/CustomerService/`, `test/acceptance/client/CustomerService/`;
  for the Support app, the remote pair on RemoteFixtures' pattern and a browser walk on ForumHttp's and RemoteHttp's in
  mr-pass `test/acceptance/`), named in the phase; running them is not part of Done.

## 3. Phases

| Phase | Repos | Screens | Status |
| --- | --- | --- | --- |
| P0 Checks | all (read) | — | done Nov 5 (§6 F1–F73) |
| P1 Foundation | Mantle, BOSS | the Customer Service root and menu, Home | built Nov 5, 2026 |
| P2 Cases and queues | Mantle, BOSS | Cases, NewCase, CaseDetail, WorkItemDetail, Settings, Queues, AgentTeams, CaseTypes, StatusCategories, ServiceDefaults | built Nov 5, 2026 |
| P3 Customers and orders | Mantle, BOSS | Customers, Customer360, ContactDetail, Orders, OrderDetail, ShipmentDetail, InvoiceDetail, InventoryAvailability, StockAtDate, Product360 | built Nov 5, 2026 |
| P4 Service levels | Mantle, BOSS | ServiceLevelPolicies, CaseAnalytics, CaseDetail's clocks | built Nov 5, 2026 |
| P5 Assignment and saved replies | mr-moqui (P0), Mantle, BOSS | AssignmentRules, SavedReplies, AgentTeams' participation | built Nov 5, 2026 |
| P6 Channels | Mantle, BOSS | ChannelRouting, ChannelSessions | built Nov 5, 2026 |
| P7 Case templates | mr-moqui, Mantle, BOSS | CaseTemplates, NewCase's template step | built Nov 5, 2026 |
| P8 Merge, split and closing | Mantle, BOSS | MergeCases, SplitCase | built Nov 5, 2026 |
| P9 Returns | Mantle, BOSS | Returns, NewReturn, ReturnDetail, QualityInspection, ReturnPolicies, Approvals | built Nov 5, 2026 |
| P10 Order changes | Mantle, BOSS | OrderChanges, OrderChangeDetail | built Nov 5, 2026 |
| P11 Warranty | Mantle, BOSS | WarrantyClaims, WarrantyAssessment, Customer360's Delivered items | built Nov 5, 2026 |
| P12 Knowledge | Mantle, BOSS | Knowledge, ArticleFeedback, CaseToArticle, KnowledgeSources | built Nov 5, 2026 |
| P13 Feedback | Mantle, mr-pass, BOSS | FeedbackForms, FeedbackFormDetail, SatisfactionResults, ResponseDetail; the Support app with its Feedback page | built Nov 5, 2026 |
| P14 Reports | Mantle (views), BOSS | Reports, ServiceLevelCompliance, ResponseTimes, CaseVolumes, ReturnAnalysis, Customer360's Service tab | built Nov 5, 2026 |
| P15 Support app | Mantle, mr-pass, BOSS | Support's SupportHome, MyCases, NewCustomerCase, CustomerCase, MyReturns, RequestReturn, CustomerReturn and CustomerArticle; ContactDetail's invitation | built Nov 5, 2026 |
| P16 Finish | Mantle, mr-pass, BOSS | CaseSummary; the twins, the server-static sweep and the access walks | built Nov 5, 2026 |

### P0 — Checks

Verify the design's riskiest assumptions against the code before building. Each result is a row in §6 and, where it
changes the design, an edit there. F1–F44 were found on Oct 28 while writing this plan. The design edits that §4's
decisions call for (the case's organization and people as RequestParty roles, the effective-dated policies, which
requests are cases, the queue intake in place of ProjIntake's triaged types, the forum service names, the order-change,
warranty and template models, the Mantle case core, and design §14's answers, with crosscut's customer accounts)
were made in the Oct 28 design sweep. The Support app's are made when P0 closes: design §2 and §8 point to a new
`mr-pass/plan/design-support.md` holding §8's pages on PASS's shell, identity and request contract, and design-forum
§1 and §13 gain the app. Still to check:

- **The other apps' state.** Answered Nov 1 for Accounting and Warehouse, which built their Customer Service parts:
  `get#CustomerCreditStatus` (F36), `ExternalAccessServices` (F17), the borrowed groups (F19), ReturnContent in
  RecordFiles (F24), the Change hold reason (OhtChange), the cancelled balance (`ShipmentItemSource.putBackQuantity`),
  `mantle.shipment.WarehouseTaskServices.request#ReturnLabel` (F37), `Shared/OrderDetail`'s Accounting and Warehouse
  branches (F35) and the PASS Billing and Supplier apps (F42). Still to check, since Manufacturing and then Purchasing
  are built before Customer Service, that each piece this plan relies on landed as its plan says: Purchasing P3 and
  P4's approval decision pattern with its stale-revision refusal, P8's supplier returns, P10's RequestItem unit, its
  type check in `complete#RequestFromWork` and RequestDetail's Items tab, and P13's agreement statuses; Manufacturing
  P11's maintenance request and AssetMaintenance; the RequestDetail contexts that Purchasing P10, Warehouse P15 and
  Manufacturing P11 add (F7); which of Products P2, P5 and P7 are built; and whether InvoiceDetail still needs a
  project link (F35).
- **PASS for a new app** (F43), as Accounting P18 settled it for Billing and Supplier, and what Support adds. How an
  app beyond Forum, Account, Members and Sites registers: its `PublicSiteApp`
  mount and target, navigation, readiness and operator configuration; the facade's operation and route catalogues and
  Mantle's PassApi route table; PASS invitations with organization grants, for a customer contact; media staging
  finalized into a record's content; the site pages' wiki binding, for published help articles; and the URLs Mantle
  builds for notices to a site's members.
- **Accounting's §5 answers.** The rule flags (its §4); the CX-POSTING record; the pack invoice, decided: behind D3's flag it is
  finalized at ship, so an order change between pack and ship releases it (impl-accounting §4, F26). The Approvals filter is decided: the topic list (impl-accounting §4, F14).
- **Which requests are cases** (F5, §4). Each entry point's type, category, parties and status at create, against the
  service-queue rule, and what Commons Today and the request lists show for a case.
- **The paths around a case** (F8). For each path that changes a request's status, due date or resolution, whether the
  Request status rule records it or the path must refuse a case.
- **Business time** (F13). Projects' business-day helpers (`set#TaskDates`, `get#WeekDays`), `get#NextBusinessDay`
  and Manufacturing P3's work-center calendar, for one Mantle business-time service.
- **Client content** (F18). Whether a client's file list of a visible request includes RqCntInternal content, and what
  Chatter shows a client of a request with no project.
- **Form engine** (F16, §4). Whether the dynamic form renders a DbForm in xml, html, the terminal and PASS's pages at
  390 px, for P7's templates and P13's feedback forms, and how a dependency row shows or requires a field there;
  whether an editable `form-list` with dependent options and a terminal row twin covers the condition rows of
  AssignmentRules and CaseTemplates, or CS-FORM-ELEMENTS needs a framework element under style-guide §8.1.
- **Approval handlers.** What Commons passes to a topic's approve and refuse services, against a decision bound to the
  return's or proposal's revision, as Purchasing P0 checks.
- **Reservations on a partial cancel** (F28). Run `cancel#OrderItem` with a partial quantity and read the reservations
  left, before P10 relies on `reduce#AssetReservation`.
- **Warranty repair.** Manufacturing P11's `EquipmentServices.create#AssetMaintenance` against the design's
  `WepMaintenance` work effort, for one repair record on a sold serial's Asset (F33).
- **Who is viewing** (§4). Whether the Dev AIDE presence (`set#Presence`, DevPresence) generalizes to a record topic
  at small cost; if it does, P5 builds the viewers and the warning before Send, and if not they stay in §7.
- **Demo data** (F34). What the earlier apps' demo data leaves: delivered sales orders with invoices and payments,
  returns, serialized sales, customers with contacts; and what P1 must make through services.

### P1 — Foundation

- **CX-ACCESS** (design §1, crosscut §1.4).
  - The groups of design §1: `BOSS_CUSTOMER_SERVICE_AGENT`, `_MANAGER`, `_ORDER_DESK`, `_RETURN_AUTHORIZER`,
    `_KNOWLEDGE` and `_ADMIN`, composed as Products' are, with `BOSS_CUSTOMER_SERVICE` as the root user group beside the
    artifact group of that name (§4, F3). W and F are the owners' groups (crosscut §1.4). C, the customer contact, is
    a PASS public account with no group (§2).
  - The root's admin authz is live (`ADMIN` and `BOSS_CUSTOMER_SERVICE_ADMIN`, with `MANTLE_ACTIVE_ORG` and
    `MANTLE_PRIVATE_CONTACT`; F1). P1 adds the root user group and the ordinary groups' authz with the organization
    filters of impl-drawers-commons §4 (`MANTLE_USER_ORG` and `MANTLE_PRIVATE_CONTACT`), and the service checks of §2.
  - `ironstone.customerservice.AccessServices`: the user's service organizations, their capabilities, own and borrowed,
    the queues and teams they work, and the customers they may serve: a Customer-role party whose owner passes the
    active or available organization filter, as Purchasing's supplier scope. Every later Customer Service service and
    shared mount calls it. A supplied organization, customer, case, order, return or invitation is checked against it.
    An agent sees the cases of their teams' queues and those assigned to them; a manager the teams they manage.
  - No artifact authorization for the raw Mantle request, return and order mutators or their REST paths. The client
    deny pattern's service pattern gains `ironstone.customerservice`, and ProjectsAccess its new verbs (F17).
  - The permissions Customer Service's Mantle services check (§2, §4): mr-mantle seeds its eleven new `UserPermission`
    rows beside `ORDER_APPROVE` in `MantleSetupData.xml` (`RETURN_AUTHORIZE` is Purchasing's, `CUSTOMER_CREDIT_VIEW`
    Accounting's), and BossSetupData grants them with `UserGroupPermission` rows:
    - `_AGENT`: `SUPPORT_CASE_EDIT`, `ORDER_CHANGE_REQUEST` and `CUSTOMER_CREDIT_VIEW`;
    - `_MANAGER`: `SUPPORT_CASE_EDIT`, `SUPPORT_CASE_MANAGE`, `RETURN_EXCEPTION_APPROVE`, `ORDER_CHANGE_APPROVE`,
      `WARRANTY_APPROVE` and `SUPPORT_CONTACT_INVITE` (the `support` app kind's permission, P13);
    - `_ORDER_DESK`: `ORDER_CHANGE_APPLY` and X4's `ORDER_CHANGE_HOLD_RELEASE`; `_RETURN_AUTHORIZER`:
      `RETURN_AUTHORIZE`; `_KNOWLEDGE`: `SUPPORT_KNOWLEDGE_EDIT`;
    - `_ADMIN`: all of these, with `SUPPORT_POLICY_EDIT` and `RETURN_POLICY_EDIT`.

    X4's seed change, if it has not landed: `ORDER_CHANGE_HOLD_RELEASE` seeded, and OhtChange's `enumCode` moved to it
    from `ORDER_APPROVE` (`OrderHoldEntities.xml`; crosscut CX-ORDER-AUTHORITY).

    W and F hold their owners' grants (`STOCK_RECEIVE`, `QUALITY_*`, `RECEIVABLE_EDIT`, `PAYMENT_EDIT`,
    `RETURN_CREDIT_APPROVE`).
- **The Customer Service root.**
  - The menu of design §1: Cases, Orders, Returns and Availability as menu groups holding their lists, Customers,
    Knowledge and Settings from the placeholders, and Approvals and Reports added (F1). Each area shows for its groups
    only.
  - `<shell-providers>` (CS-PROVIDERS): the palette types, quick create, Today sources and notification topics grow
    phase by phase, as their records are built.
  - The `customerservice` key scope.
  - `ironstone.commons.PaletteServices.get#RecordLink` opens cases, customers, orders, returns and warranty claims
    under Customer Service for its users; Projects and Commons keep their requests (F9).
- **Home** (design §3): ServiceMetrics over `ironstone.customerservice.ReportingServices.get#ServiceDashboard`, each
  measure of a later phase "Not configured"; the other panels arrive with their phases; panels by role.
- **Customer Service demo data.**
  - `BossCustomerServiceDemoData.xml` with ORG_ZIZI_RETAIL as the service organization and POPC_DEFAULT's products. It
    builds on Mantle's CustJqp, JoeDist and ORG_ACME customers, and through a demo service (Mantle has no seeded sales
    orders, F34) places, ships, invoices and pays orders for them: a delivered order with a serialized item, an order
    awaiting pick, and a packed order. Queues, teams, cases, returns and contacts are added as the phases need them.
  - `BossUsersDemoData.xml` gains a user per group, an agent who also holds Warehouse's receive and inspect groups, a
    return authorizer who also holds `BOSS_ACCOUNTING_AR`, and a service reader with no other launcher. P15 adds
    customer contacts.
- **Specs.**
  - `CustomerServiceShell`: the menu per group, the palette, record links, quick create.
  - `CustomerServiceAccess`: the app's one access spec, about seven features run once with authorization on:
    organization, customer and queue scope and the groups through the services, each group's permissions, and the
    refused REST paths. A later phase adds a case only for an access rule it adds.
- **Usable when** (an acceptance test to write): the menu renders for each group, and quick create offers only what the
  group may create. An agent finds their organization's customers and orders through the palette but not another
  organization's, and a forged customer or order ID is refused. A Projects client contact is refused the root and every
  `ironstone.customerservice` service.

**Built Nov 5 (P1).**
- Mantle: `MantleSetupData.xml` seeds `SUPPORT_CASE_EDIT`, `SUPPORT_CASE_MANAGE`, `SUPPORT_POLICY_EDIT`,
  `SUPPORT_KNOWLEDGE_EDIT`, `SUPPORT_CONTACT_INVITE`, `ORDER_CHANGE_REQUEST`, `ORDER_CHANGE_APPROVE`, `ORDER_CHANGE_APPLY`,
  `ORDER_CHANGE_HOLD_RELEASE`, `RETURN_EXCEPTION_APPROVE`, `RETURN_POLICY_EDIT` and `WARRANTY_APPROVE` beside
  `ORDER_APPROVE`, each with its ADMIN grant (none existed; `RETURN_AUTHORIZE` and `CUSTOMER_CREDIT_VIEW` did).
  X4: `OrderHoldEntities.xml`'s OhtChange takes `ORDER_CHANGE_HOLD_RELEASE`; `test/order/PurchaseHoldPermission` checks
  the Change hold's new permission and that `ORDER_APPROVE` no longer places or releases it, and `PurchaseRevisions`' gate
  feature releases with the new permission (the only caller that released a Change hold under `ORDER_APPROVE`).
- BOSS access (`data/BossSetupData.xml`): the groups `BOSS_CUSTOMER_SERVICE` (root user group), `_AGENT`, `_MANAGER`,
  `_ORDER_DESK`, `_RETURN_AUTHORIZER` and `_KNOWLEDGE`; the root authz `BOSS_CUSTOMER_SERVICE_ROOT` (`MANTLE_USER_ORG`,
  `MANTLE_PRIVATE_CONTACT`) and the `ironstone\.customerservice\..*` service pattern on the `BOSS_CUSTOMER_SERVICE`
  artifact group; `customerservice` in the client deny pattern (its fourth row split in two, F75); the area groups
  `BOSS_CS_RETURNS` and `BOSS_CS_REPORTS` (agent, manager, return authorizer, admin), `BOSS_CS_APPROVALS` (manager,
  return authorizer, admin) and `BOSS_CS_SETTINGS` (admin), each denying the root user group; the record link group
  `BOSS_CS_RECORD_LINK`; the `UserGroupPermission` grants of the list above. No authz for the raw Mantle request, return
  and order mutators or their REST paths.
- `ironstone.customerservice.AccessServices` (`get#SharedContext`, `check#Record`, `get#Choices`, `search#Records`) over
  `CustomerService.js`, whose tables later phases extend: `capabilityPermissions` (own, and the borrowed `receive`,
  `inspect`, `dispose`, `invoiceCredit`, `paymentRefund`, `returnCredit`), `areas` (returns, approvals, reports,
  settings), `recordKinds` (order, customer; a `destination` once a screen is built), `searchFinds` (sales orders,
  customers), `choiceSources` (customers, organizations) and `linkPaths`; the scope's `queueIds` and `teamIds` are empty
  until P2. A customer is a Customer-role party, not internal, not another user's private contact, owned by one of the
  user's organizations or shared (`_NA_`); a sales order's selling organizations must be the user's and its customers ones
  they serve. `ReportingServices.get#ServiceDashboard` (every measure not configured, the period, and the panels by role).
- The root (`screen/CustomerService.xml`): the menu of design §1 (Home, Cases, Customers, Orders, Returns, Approvals,
  Availability, Knowledge, Reports, Settings; Approvals and Reports added, the placeholders renamed and re-indexed, each
  comment naming its phase and groups), `<shell-providers>` with the palette source and the `customerservice` keymap;
  Home (`CustomerService/Home.xml`: the KPI strip, each "Not configured", with its period and time, and the record
  lookup); `PaletteServices.get#RecordLink` opens a sales order under Customer Service (Home's lookup until P3 sets
  OrderDetail) and a customer once Customer360 is built (F77).
- Demo: `BossCustomerServiceDemoData.xml` (the warranted, serialized thermostat `BOSS_CS_THERMOSTAT` with its
  `BOSS_CS_WARRANTY_12` PftWarranty feature and serials CS-THERMO-1001/1002, the stocked filter `BOSS_CS_FILTER`, both
  Retail's at ZIRET_WH; Ziziwork Services' customer `BOSS_CS_CUST_OTHER` and open order `BOSS_CS_SO_OTHER`) and
  `BossZCustomerServiceDemoData.xml`, which runs `ironstone.customerservice.DemoServices.load#CustomerServiceDemo`
  (`Demo.js`, each order in its own transaction, F76): `BOSS_CS_SO_DELIVERED` to CustJqp (paid by check, the payment posted to Undeposited Receipts 112000000 so
  Retail's cash account 111100000 keeps the balances Mantle's AccountingActivities checks; shipped,
  invoiced at ship and delivered; the thermostat's Asset is the customer's, AstDelivered, with its AssetIssuance),
  `BOSS_CS_SO_PICK` to JoeDist (approved and reserved, awaiting pick) and `BOSS_CS_SO_PACKED` to JoeDist (packed).
  BossUsersDemoData's `customerservice.*` users: agent, manager, orderdesk, returns, knowledge, admin (in
  `BOSS_CUSTOMER_SERVICE_ADMIN` alone), agentwh (with `BOSS_WAREHOUSE_RECEIVE` and `_INSPECT`, no Warehouse launcher),
  returnsar (with `BOSS_ACCOUNTING_AR`), read (the root user group alone) and services (Ziziwork Services' agent).
- Specs: `test/CustomerService/CustomerServiceSpecLib.js` (ids, users, `shell`, `page`, `routeFixtures`) and
  `CustomerServiceAccess` (8 features, about 3 s: the context and its refusals, a Projects client's among them; the menu,
  providers and launcher per group; Home's one qvt render; the capabilities per group; customer scope in choices and the
  palette; the record check with another organization's and forged ids and a capability on a record; record links; the
  guarded areas, REST and raw mutators refused). No separate Shell spec (impl-purchasing F44). Acceptance:
  `test/acceptance/CustomerService/CustomerServiceFoundationWalk` (the usable-when: every area per group, the palette and
  record links of the agent and the other organization, forged ids on check#Record and Home's lookup, a Projects client
  refused the root and every `ironstone.customerservice` service; the demo orders' state), and `AppStructure` renders
  Customer Service's built screens (CustomerServiceSpecLib.routeFixtures; the placeholder count is now 54, the floor stays
  53). ProjectsAccess walks the new package with the deny pattern.
- Inventories: no ss-inventory or usl-inventory row is implemented by P1 (Home's request lists are P2's).
- Tests run: CustomerServiceAccess (8), ProjectsAccess, PurchasingAccess, PurchasingRevisions, PurchasingOrders,
  WarehouseAccess, WarehousePicking, WarehousePacking, WarehouseShipping, WarehouseReports, WarehouseInventory,
  AccountingReceivables, AccountingAccess, AppOrganizationFilters, Contacts, Inbox, CommsHome, ProductsAccess,
  ManufacturingAccess (BOSS, all pass); PurchaseHoldPermission, PurchaseRevisions, PurchaseOrders, OrderToCashBasicFlow,
  ReturnToResponseBasicFlow, ShipmentReturnMisc, AccountingCredit, SupplierPortal, WorkProjectRequests, RecordLinks
  (Mantle, all pass); acceptance CustomerServiceFoundationWalk (5) and AppStructure (18), all pass. `moqui lint
  --screens`: no idiom or hazard site in the Customer Service screens.
- Decisions:
  - The areas by group: Home, Cases, Customers, Orders, Availability and Knowledge for every Customer Service user (the
    service reader reads them, each list and record limited by AccessServices); Returns and Reports for the agent,
    manager and return authorizer; Approvals for the manager and return authorizer; Settings for the administrator. A
    later phase opens a settings page to the manager, authorizer or author with its own authz row. The order desk and the
    knowledge author see the reader's menu until their phases (P10, P12) add their areas.
  - Cases, Orders, Returns and Availability stay single placeholder screens until their phases make them menu groups
    holding their lists (P2, P3, P9).
  - The demo uses its own products (as Accounting's `BOSS_ACCT_SUPPLY`), so its orders change no other product's
    availability; POPC_DEFAULT is the orders' store.
  - No quick create, Today source or notification topic in P1: the phases that build their records add them.
- Findings (provisional):
  - **F74** `mantle.party.Party.ownerPartyId` defaults to `_NA_`, so Mantle's ORG_ACME and ORG_BLUTH, which the data
    gives no owner, are shared parties (P0's F73 reads them as unowned): ORG_ACME is a shared customer in every
    organization's Customer Service scope, as ZiddlemanInc is a shared supplier in Purchasing's. The demo leaves it so;
    CustomerServiceAccess checks that both organizations serve it.
  - **F75** Adding `customerservice` to the client deny pattern took its fourth row (post … reply) past the 255
    characters of `artifactName`; it is split into two rows. The next app package will need the same check.
  - **F76** A data file loads in one transaction, so a demo service that makes each record in a transaction of its own
    (for failure tolerance) cannot see the rows of its own file: the products and stock are in
    `BossCustomerServiceDemoData.xml` and the service call in `BossZCustomerServiceDemoData.xml`, loaded after.
  - **F77** A customer's record link stays the Commons contact until P3 builds Customer360 under Customer Service
    (`hasScreen('customer')`), as Purchasing left requests to their other apps until its screens were built; a sales order,
    which had no link (impl-purchasing F46), opens Customer Service's Home lookup now.
  - **F78** Crosscut X4's table also names `BOSS_PURCHASING_BUYER` (a PO revision) and `BOSS_SALES_CHANGE` for
    `ORDER_CHANGE_HOLD_RELEASE`. P1 grants neither: a purchase revision's Change hold is released by its approval or
    cancel (`PurchaseRevisions.releaseRevisionHold`), not by `release#OrderHold`, and no Purchasing group held
    `ORDER_APPROVE`, so nothing it did is refused; Sales has no group yet. For the lead to decide with X4.

**Review Nov 5 (P1).** Checked the Mantle and BOSS diffs against this section, §2, design §1, AGENTS.md and
Practices-App-Dev:
- Record links: a sales order went to Purchasing's branch before (`orderKind` answers `order` for any order, and its
  `readOrder` refuses one whose customer is not internal), so it had no link for anyone; now a Customer Service user in
  scope gets Home's lookup and every other user (Accounting, Warehouse, Commons, Purchasing) still gets none. A purchase
  order fails `isSalesOrder` and stays Purchasing's; a party keeps Commons until `hasScreen('customer')`.
- Shared customers: a `_NA_` customer passes `customerOf` for every organization, as the Party filter passes it, but a
  sales order is checked by its selling organizations (`readOrder`'s owners, every one the user's) as well as its
  customers, so another organization's order of a shared customer is refused; the palette's order find is limited to the
  user's vendors in the query.
- Demo data: the orders use their own products, so DEMO_* stock, availability and projections are unchanged. Ran besides
  the worker's list (all pass): Mantle SalesReports, ProductStockTotals, ReportLookups, MantleSearch, CrmMiscServices,
  OrderBulk, ShipmentLoads, WarehousePicking, ShipmentPick, InvoiceOrderApply, FinancialAccountServices,
  AssetReservationMisc, OrderLifecycle, OrderToCashTime, WarehousePacking; BOSS ProductsInventory, ProductsAccess,
  ProductsSharedContext, ProductsVariants, ProductsSuppliers, ProductsTaxonomy, ProductsPricing, ProductsPriceLists,
  WarehousePolicies, WarehouseReturns, WarehouseMoves, WarehouseCounts, WarehouseAdjustments, WarehousePutaway,
  Accounting Payables, Valuation, Reporting, PeriodClose, Collections, Matching, Payments, Settlement,
  ProductionCostClose, ManufacturingPlanning, Materials, Methods, PurchasingAccess, PurchasingReplenishment.
- X4: no Mantle, BOSS or PASS code or spec released a Change hold under `ORDER_APPROVE` other than PurchaseRevisions'
  gate feature (updated); Purchasing approves or cancels a revision through `releaseRevisionHold`, which checks no hold
  permission, and its OrderDetail release is of Purchase holds by `PURCHASE_HOLD_RELEASE`.
- CustomerServiceAccess: 8 features, about 3 s.
- Fixes: **R1** (low) `get#Choices` carried four in-parameters copied from Purchasing (receipt, supplier, return receipt,
  agreement choices Customer Service does not have); removed.
- For the lead: `ORDER_CHANGE_HOLD_RELEASE` now places and releases a Change hold on any order through `hold#Order` and
  `release#OrderHold`, which check no organization or direction (a purchase revision's hold included); P10's release
  must check the hold's order through `check#Record` first, as Purchasing's `releaseHold` transition does. P3's
  Customer360 of a shared customer must list only the user's organizations' orders, cases, returns and invoices.

- **Wave 1 suites (Nov 5, on master after P1 merged; the framework worker's Rust build ran at the same time, so the
  times measure the load):** standalone mr-mantle 1,655 passed, 2 failed (the baseline WorkTimeEntries and
  WorkTimesheets), 11 skipped; `./moq test-apps` 2,925 server features passed, 3 failed (AccountingActivities: the
  demo's check payment posted to ORG_ZIZI_RETAIL's cash account in the month the spec checks; fixed in 4e23c37 by
  posting it to Undeposited Receipts, and the three features pass with mr-boss loaded), and 11 client features passed
  with the mr-mantle/mr-marble server's setup failing on the same check; `moqui lint --screens` clean. The load put
  mr-boss at 339.5 s, mr-pass at 16.8 s and AccountingAccess at 15.2 s; later waves measure with nothing running.

### P2 — Cases and queues

Design §3 Home, Cases, NewCase, CaseDetail and WorkItemDetail; §9 Settings, Queues, AgentTeams, CaseTypes,
StatusCategories and ServiceDefaults; CS-QUEUE, CS-SETTINGS, CX-REQUEST, CS-STACK (the skills).

- **CS-QUEUE, the case.**
  - A case is a request in a service queue (§4, F5). CaseTypes' service-enabled flag says which types a queue offers,
    and puts a request of that type with a Customer RequestParty and no category into the type's default queue.
  - `mantle.request.support.CaseProfile` (PK requestId): the ServicePolicy row and status mapping it was opened under,
    the template (P7), the accepted intake time, `closedDate` (P8), and the originating communicationEventId or
    emailMessageId. Its organization, customer, contact and assignee are RequestParty rows (§2); the channel is
    `Request.salesChannelEnumId`.
  - The queue: a RequestCategory with an owner field (F6) and effective-dated `mantle.request.support.ServiceQueue`
    rows: offered types, visibility, responsible team, default rule, SLA, template and fallback assignee, active dates.
  - The case rules (D23): a Request create entity ECA rule beside `RequestTriageNotice`, and the same on a move into a
    service queue, calls Mantle's `mantle.request.SupportCaseServices.ensure#CaseProfile` (F41), so Comms, Chat,
    Commons, Projects, email, the public form, the forum and the Support app keep calling `create#Request`. P4 adds the
    episode, P5 the assignment.
  - `mantle.request.SupportCaseServices` (`SUPPORT_CASE_EDIT`): `create#Case` (wrapping `create#Request`,
    `replace#RequestParty` and `link#RequestRecord` atomically with the profile), `update#Case` (queue, priority and
    assignee under the queue's policy, another agent's case with `SUPPORT_CASE_MANAGE`; crosscut's CaseServiceFacts)
    and `transition#Case` (status by the mapping; required resolution; reopen).
  - `ironstone.customerservice.CaseServices`, scoped by AccessServices: `prepare#Case`, `find#Cases` with the Recent
    cases read, `get#QueueCounts`, `apply#CaseBatch` over the Mantle services with a result per case (`StaleCase`,
    `AssigneeUnavailable`, `Forbidden`), and `find#ServiceCustomers`, finding by email and phone (F30).
  - `mantle.request.RequestTag`, dated, over the EnumerationType `RequestTag`.
  - Seeds: `ReqWaitingCustomer` and `ReqOnHold` with their transitions (F4); the priority bands of ServicePolicy.
  - Interim privacy cases (design §8, Admin Open 5): the `RqtPrivacy` type, service-enabled only in a restricted Privacy
    queue whose only members are `BOSS_ADMIN_PRIVACY`. Other agents, general triage and Customer360's counts never see
    it; its verification evidence is protected case files, and each provider's preview and disposition a linked work
    item. When Admin's PrivacyRequests ships, each open case is recorded there with the case as its source (§7).
- **CS-SETTINGS:** `mantle.request.SupportCaseServices` `save#ServiceQueue`, `save#ServiceRequestType`,
  `save#CaseStatusMapping`, `save#CaseWorkflow` and `save#ServiceDefaults` (`SUPPORT_POLICY_EDIT`), and
  `save#ServiceTeamMember` (`SUPPORT_CASE_MANAGE`), over effective-dated rows: `mantle.request.support.ServicePolicy` by
  organization (enabled types, default queue, priority bands, unknown-sender policy, reopen window, auto-close delay,
  required resolution, support-work completion, and `customerImmediateCancel`, off by default, for P10), and
  `CaseStatusMapping` by workflow and status (agent and customer labels, category, pause reasons, order).
  `ironstone.customerservice.ConfigurationServices` keeps `find#ServiceQueues` and `get#ServiceTeam` for the settings
  forms. The default mapping of design StatusCategories is seeded.
- **CX-REQUEST.**
  - `complete#RequestFromWork`: a case only notifies its assignee, beside Purchasing P10's type check; Projects' types
    complete as today.
  - The paths around a case (F8): Projects' and Commons' RequestDetail hide Complete and Cancel on a case for a user
    without `SUPPORT_CASE_EDIT` and link CaseDetail; `triage#Request`, `set#RequestStatus`, `bulk#Requests` and
    `ClientServices.cancel#ClientRequest` refuse a case's resolution or route it through Mantle's `transition#Case`.
  - The audit log on Request's type, category, priority, due date and resolution.
- **Screens:**
  - Cases: CaseFind, CaseList with the saved views of design Cases (SLA risk from P4), the board by status category
    with an equivalent row action, and BulkCaseAction for assign, status and tags (reply in P5).
  - NewCase: CaseIdentity, CaseDescription and SubmitCase, with the duplicate warning over Recent cases. Template fields
    come in P7, knowledge suggestions in P12.
  - CaseDetail: Projects' `Shared/RequestDetail` with the Customer Service row of crosscut §3.11 (F7): Conversation
    first, Overview with the customer and people, linked records, Work, Files, Items when present, and the Recent cases
    pane. Reply and notes through Chatter; assign, priority and queue through `update#Case`; resolve and reopen through
    `transition#Case`; link records; make or link work. Later phases add the clocks (P4), saved replies (P5), merge and
    split (P8), the RMA, order-change and warranty actions (P9–P11) and Knowledge (P12).
  - WorkItemDetail: `Shared/WorkItemDetail` at `CustomerService/Cases/WorkItemDetail` with the row of crosscut §3.12.
  - Settings: SettingLinks with readiness; Queues (QueueList as a tree with a table, QueueEdit); AgentTeams
    (TeamMembers, with participation in P5); CaseTypes (ServiceTypes); StatusCategories (CaseStatusMap,
    CaseTransitionPolicy); ServiceDefaults (ServicePolicy; FeedbackDeliveryPolicy in P13).
  - Home: MyCases, TeamQueues and the New case shortcut.
- **Shell:** the case palette type; quick create New case; the assignment and customer-reply notification topics; the
  Today source of own due and overdue cases, in place of Commons Today's request rows for a case (F9).
- **Assist** (CS-STACK, L1; design §1 Stack contributions): the case-reply and case-summary procedure skills in mr-boss
  `skill/` with their `screens:`, `skill/aliases.json` and `test/skill-retrieval.json`.
- **Usable when:**
  - an agent creates a case for CustJqp in the Support queue from NewCase, sees CustJqp's other open case as a possible
    duplicate, and opens it in CaseDetail with the customer, queue and priority band;
  - a request a customer contact files through Chat into the Support queue becomes a case with its profile; an
    employee's Commons QuickRequest stays a plain request;
  - a manager moves a case to Waiting for customer on the board and by the row action, and the customer label differs
    from the agent label;
  - a bulk assignment of three cases, one of another organization, names it Forbidden and assigns the other two;
  - completing a case's linked work notifies its assignee and leaves it open; a Projects request completes from its
    work as before;
  - Commons' Resolve on a case is hidden for a user without `SUPPORT_CASE_EDIT`;
  - a privacy request filed as a case lands in the Privacy queue, and a general agent sees neither it nor its count.

**Built Nov 5 (P2).**
- Mantle entities (`entity/SupportCaseEntities.xml`): `mantle.request.support.CaseProfile` (policy and workflow opened
  under, intake queue and time, the originating message, template and close date for later phases), `ServiceQueue`,
  `ServiceRequestType`, `ServicePolicy`, `CaseStatusMapping` and `CaseTransition` (each effective-dated, key fields
  audit-logged; a draft has no from date), `mantle.request.RequestTag`, and the views `CaseRequest` and
  `CaseRequestParty`; `RequestCategory.ownerPartyId` (F6); the audit log (on update) on Request's type, category,
  priority, due date and resolution. Seeds: `ReqWaitingCustomer` and `ReqOnHold` with their Default-flow transitions,
  `RqtPrivacy`, the `CaseWorkflow` (`CwfDefault`), `CaseStatusCategory`, `CasePriorityBand` (1–2 Urgent, 3–4 High, 5–6
  Normal, 7–9 Low), `ServiceQueueVisibility` (organization, team and managers, team only), `ServiceUnknownSender` and
  `RequestTag` enumerations and `PrtServiceTeam`; `MantleSetupData.xml` seeds the default workflow's mappings (agent and
  customer labels, categories) and moves, and the topics `SupportCaseAssigned` and `SupportCaseCustomerReply`.
- Mantle services (`service/mantle/request/SupportCaseServices.xml`, `SupportCases.js`): the case rule `ensure#CaseProfile`
  (F62: submitted and not closed; a served Customer party, or the filer when it is a customer or its contact, F79; an
  organization with a current ServicePolicy, found as the OrgInternal party, the queue's owner, the customer's owner, the
  filer's organization or the project's owner; in one of its service queues, or of a service-enabled type with no
  category, moved into the type's queue; a project's request too), run after the commit by `queue#CaseProfile` from the
  rules `SupportCaseRule` (Request made, or its status, type or category changed) and `SupportCaseCustomerRule`
  (a Customer RequestParty made) in `entity/Request.eecas.xml`, a no-op with no ServicePolicy; `get#CaseState`,
  `get#CaseStatusMappings`; `create#Case`, `update#Case`, `transition#Case` and `set#CaseTags` (SUPPORT_CASE_EDIT,
  SUPPORT_CASE_MANAGE for another agent's case or a manager's move; STALE_CASE by `caseRevision`); the saves
  `save#ServiceQueue`, `save#ServiceRequestType`, `save#CaseStatusMapping`, `save#CaseWorkflow`, `save#ServiceDefaults`,
  `save#ServiceTeam` (SUPPORT_POLICY_EDIT) and `save#ServiceTeamMember` (SUPPORT_CASE_MANAGE and the team's manager, or
  SUPPORT_POLICY_EDIT); `notify#CaseCustomerReply` from the rule `SupportCaseCustomerReply` (RequestCommEvent made).
- Mantle changes for CX-REQUEST: `update#Request` refuses on a case a due date, resolution or close (CASE_MANAGED, F64,
  F83); `complete#RequestFromWork` never moves a case (a project's too) and tells only its assignee when a linked item
  is done or cancelled (F48; the RequestUpdate message carries `isCase`); `get#UserTodayRequests` leaves cases out (F63);
  `get#ClientRecordVisibility` leaves out cases with no project (F68, F81); record visibility shows a restricted
  queue's case only to its team (and its filer).
- BOSS reads (`service/ironstone/customerservice/`): `CaseServices.xml` over `Cases.js` (`find#Cases` with the saved
  views and the Recent cases read, `get#QueueCounts`, `find#ServiceCustomers` by name, id, email and phone, `prepare#Case`,
  `get#CaseDetail`, `apply#CaseBatch` with Done, StaleCase, AssigneeUnavailable, Forbidden or Failed per case and an
  operation key, `get#TodayItems`); `ConfigurationServices.xml` over `Configuration.js` (`find#ServiceQueues`,
  `get#ServiceTeam`, `get#ServiceSettings` with the readiness); `CaseGuard.js`, the paths around a case (F64) that
  Commons' `set#RequestStatus` (cancel), `update#MyRequest` (due) and `raise#Request` (due on a would-be case),
  Projects' `triage#Request` (resolve, cancel, reopen and due; so `bulk#Requests`) and `update#ProjectRequest` (due), and
  `ClientServices.cancel#ClientRequest` call: a holder of SUPPORT_CASE_EDIT is routed through `transition#Case`, anyone
  else refused (CASE_IN_CUSTOMER_SERVICE, CASE_DUE_DATE). `CustomerService.js`: the scope's teams and queues (a team's
  queues, organization-visible ones, team queues for managers and the administrator, a restricted queue for its team
  only), the case record kind (destination CaseDetail; a case of the user's queues or assigned to them), cases in the
  palette, the choices queues, teams, agents, caseTypes, tags and contacts; `get#RecordLink` opens a case in CaseDetail
  for a user who sees it. `ReportingServices.get#ServiceDashboard` counts open, overdue and unassigned cases.
- Screens: `CustomerService/Cases.xml` a menu group with `Cases/Cases` (CaseFind and CaseList in a header dialog, the saved
  views, the board by status in the workflow's order and the row's Change status, both through `transition#Case`, and
  BulkCaseAction's Assign, Set status and Tag) and `Cases/NewCase` (customer and type, the duplicate warning, the case;
  `create#Case`), with `Cases/CaseDetail` (Shared/RequestDetail; its Customer Service branch is
  `template/CustomerServiceCaseDetail.xml`: header, moves, Assign, priority, queue, tags, Conversation first, Overview,
  Work, Files and the Recent cases pane) and `Cases/WorkItemDetail` (Shared/WorkItemDetail's Customer Service branch: a
  case's work on the Commons task rule, the way back to its case); `CustomerService/Settings.xml` a menu group with
  `Settings/SettingsHome`, `Queues`, `AgentTeams`, `CaseTypes`, `StatusCategories` and `ServiceDefaults`; Home's My cases,
  Team queues and New case; `template/CustomerServiceParts.xml` (choices, customerSearch, bulkCases). Shared/RequestDetail's
  Projects and Commons contexts hide Resolve and Complete or Cancel of a case from a user without SUPPORT_CASE_EDIT and
  link CaseDetail (F8, F49).
- Shell: cases in the palette; quick create Case (`Cases/NewCase`, for the agent, manager and administrator by the
  `BOSS_CS_NEW_CASE` authz); the Today source `CaseServices.get#TodayItems`; the topics `SupportCaseAssigned` and
  `SupportCaseCustomerReply` with BossSetupData's links to CaseDetail, and RequestUpdate's link to CaseDetail for a case.
  `BOSS_CS_SETTINGS_MANAGER` opens Settings to the manager.
- Assist: `skill/case-reply.md`, `skill/case-summary.md`, `skill/aliases.json` and `test/skill-retrieval.json`.
- Demo: `BossCustomerServiceDemoData.xml` (Retail's Support team, Privacy team and Services' team; the Support (team),
  Privacy (restricted, RqtPrivacy only) and Services support queues; Retail's and Services' service policies; RqtSupport
  service-enabled into Support and RqtPrivacy into Privacy for Retail only, F82); `BossYCustomerServiceCasesDemoData.xml`
  (new, after the users: the team members and the requests `BOSS_CS_CASE_THERMO`, `_FILTERS`, `_PICK`, `_PRIVACY` and
  `_OTHER`); `BossZCustomerServiceDemoData.xml` runs `DemoServices.load#CaseDemo` (`Demo.js loadCases`: ensure#CaseProfile
  for each, each on its own, F76). The demo payment stays on Undeposited Receipts (W1).
- Specs: Mantle `test/request/SupportCases` (11 features, about 4 s: the default with no policy, the saves and their
  refusals, the rule on every path, create/update/transition/tags with their refusals, update#Request's guard and its
  unchanged default, a case's work, Today, the client, the restricted queue). BOSS `CustomerServiceAccess` (+1 feature:
  the case's scope, a holder, a non-holder, another organization's and the restricted queue's; menu rows with quick create
  and topics, the administrator's queues, the manager's Settings) and `CustomerServiceCases` (7 features, about 2 s: the
  demo cases, find#Cases and the counts by scope, the batch with Forbidden and a retry, Today, the paths around a case,
  the settings reads, CaseDetail's and NewCase's one qvt render). Acceptance `test/acceptance/CustomerService/CustomerServiceCasesWalk`
  (the usable-when, 7 features), `CustomerServiceFoundationWalk` (quick create now offers a case to its groups; the client
  refused the case services) and `AppStructure` (the case and settings routes, the placeholder floor 52).
- Tests run (all pass): Mantle SupportCases, WorkProjectRequests, RecordVisibility, RecordLinks, WorkProjectClients,
  CommonsToday, OrderToCashBasicFlow, ReturnToResponseBasicFlow, ShipmentReturnMisc, WorkPlanToCashBasicFlow (154
  features); BOSS CustomerServiceAccess, CustomerServiceCases, Requests, ProjectRequests, ProjectsAccess, QuickCreate,
  TodayPanel, WorkItemDetail, Chatter, RecordFiles, Notifications, Chat, Code, CommsHome, EventDetail, Files,
  ManufacturingDowntime, MergeRequests, PurchasingAccess, PurchasingRequests, PurchasingSourcing, Tasks,
  WarehouseTransfers, Inbox, Contacts, AppOrganizationFilters, WorkItems, ProjectDetail; acceptance
  CustomerServiceCasesWalk, CustomerServiceFoundationWalk and AppStructure (30 features). `moqui lint --screens`: 136
  flagged sites, as master; none in the Customer Service screens.
- Inventories: ss-inventory's request forms of CaseDetail, NewCase, Cases and Home; usl-inventory's RequestServices that
  the case services and CaseDetail call.
- Decisions:
  - ~~The rule counts any open status, not only Submitted~~ (review R1: Submitted, per §4's Nov 5 row; a request already in
    progress becomes a case only by a move into a service queue); a draft is never one.
  - A team is an OrgTeam party owned by the organization; a member is a dated `PrtServiceTeam` relationship (Agent, or
    Manager for one who manages the team).
  - Workflows (`CaseStatusMapping`, `CaseTransition`) are shared settings, as status flows are; an organization picks
    one in its policy (an own copy would need an owner on the workflow enumeration).
  - Settings opens to the service manager (`BOSS_CS_SETTINGS_MANAGER`), who reads every page and changes the members of
    the teams they manage; the other saves are the administrator's (SUPPORT_POLICY_EDIT), each form shown only to a user
    who may save it.
  - A case's revision is the later of the request's last update and its assignee rows' (STALE_CASE).
  - "Needs response" lists the new (Submitted) cases until P4 and P5 record replies; "SLA risk" is empty until P4.
- Findings (provisional):
  - **F79** A customer contact's own request (Chat's, Commons' `raise#Request`, the forum's) has no Customer
    RequestParty, so F62's rule made none a case, while the usable-when needs Chat's to be one. The rule takes the filer
    when it is a Customer-role party, else the customer parties the filer is a current contact of, and ensure adds the
    Customer party (design §3 NewCase changed).
  - **F80** `BOSS_ADMIN_PRIVACY` does not exist (Admin is not built). The Privacy queue is restricted
    (`SqvRestricted`): its cases are seen only by its team, in Customer Service's scope and in Mantle's record visibility
    (Commons, Chatter, record links). The demo's Privacy team is customerservice.admin; Admin's privacy group joins it
    when it ships (§7).
  - **F81** F68's exclusion hid a project's case from its own Projects client (ProjectsAccess's client upload on its
    request on project ACME, whose customer is shared, failed), against §4's Nov 5 row that a project's case stays visible
    in Projects. `get#ClientRecordVisibility` leaves out only cases with no project.
  - **F82** The test runtime loads BOSS's demo data under Mantle's specs, which file RqtSupport requests as john.doe
    (an agent of ORG_ZIZI_SERVICES) for shared customers: a Services policy service-enabling RqtSupport made
    WorkPlanToCashBasicFlow's request a case (its close refused, CASE_MANAGED). The Services demo policy enables no type;
    a later phase's demo must not service-enable a type for ORG_ZIZI_SERVICES.
  - **F83** F64's "not from SlaServices/SupportCaseServices" is not a caller check (Practices-App-Dev §4: no
    authorization by caller): the case services write the Request entity (`update#mantle.request.Request`), as
    `complete#RequestFromWork` does, and `update#Request` refuses on a case; P4's SlaServices writes the due date the
    same way.
  - **F84** The rule runs after the commit on the service pool (`registerOnCommit` is asynchronous), so a request's
    profile is there a moment after its create returns; a spec of the rule waits for it, and a screen that makes a case
    calls `create#Case`, which makes the profile in its own transaction.

**Review Nov 5 (P2).** Checked the diff of both repos against this section, §4's Nov 5 rows and F45–F78: the case rule
against the Nov 5 decision; the after-commit ensure (two triggers of one create, e.g. create#Request with a customer, make
one profile: ensure locks the request and the profile's key is the request, no error logged; a failing ensure is caught and
logged by queue#CaseProfile or the pool and never fails the caller; readers right after a create (raise#Request's due date)
ask get#CaseState's wouldBeCase rather than the profile); update#Request's CASE_MANAGED guard and its callers (a field not
passed is not in the context, so a case with a due date takes other changes; mr-marble's EditRequest posting an unchanged
due date or resolution passes; make#RequestWorkItem, convert#RequestToProject, create#RequestFromEmail, InventoryRequests
and the forum's create#CaseFromTopic set no due date, resolution or close of a case); access (find#Cases, get#CaseDetail,
apply#CaseBatch's Forbidden, the palette and get#RecordLink through recordOf; the restricted queue out of the scope's
queueIds and so out of get#QueueCounts and the dashboard); the Settings narrowing; F82 (no other demo policy
service-enables a type for ORG_ZIZI_SERVICES); regression leanness (SupportCases 3.5 s, CustomerServiceCases about 1 s;
CaseDetail and NewCase render once, in qvt; the settings and case route fixtures are acceptance-only).
- **R1 (medium, Mantle)** The rule inferred a filer's customer from any relationship to a Customer-role party and took a
  staff person with the Customer role as a customer, so an employee's or agent's own request (Commons QuickRequest, a
  Projects internal request) could become a case. A filer who works for an internal organization is never a customer
  side; a contact is a PrtContact or PrtEmployee of the customer; an explicit Customer party who works for an internal
  organization is not a served customer. The rule also made a case of any open request, so a ServicePolicy set up later,
  or a Customer party added to a request in progress, converted it mid-flight (a Projects request triaged to In Progress
  became a case, and its resolve was then refused): a request becomes a case when Submitted, one in progress only by a
  move into a service queue. Specs: a staff customer-contact's request and an in-progress request given a customer stay
  plain.
- **R2 (medium, Mantle)** `save#ServiceTeamMember` took any person, so a team's manager could add a customer's contact
  or another organization's agent, who then saw the restricted Privacy queue's cases through Mantle's record visibility.
  A member works for the team's organization. Specs: a manager of another team and an outside member refused.
- Specs run, all passing (with mr-boss loaded): Mantle SupportCases, CrmMiscServices, WorkTimeEntries, WarehouseTransfers,
  WorkProjectRequests, CommonsToday, WorkPlanToCashBasicFlow, RecordVisibility, RecordLinks, WorkProjectClients; BOSS
  CustomerServiceCases, CustomerServiceAccess, Requests, ProjectRequests, Chat, QuickCreate (238 features); mr-pass
  Forum Integrations (create#CaseFromTopic, 6 features).
- Left for the lead: Projects' create of a request with a due date and a customer (and email intake) can make a case that
  carries the due date given at create (only Commons' raise#Request refuses it, by wouldBeCase); P4's service level
  replaces it. The acceptance walk CustomerServiceCasesWalk was not rerun (no acceptance spec changed).

- **Wave 2 suites (Nov 5, on master after P2 and the framework part of P7 merged, the binary rebuilt, nothing else
  running):** standalone mr-mantle 1,666 passed, 2 failed (the baseline), 11 skipped; `./moq test-apps` 2,947 server and
  14 client features passed, none failed, within every budget (server: mr-mantle 293.9 of 335 s, mr-boss 214.7 of 245 s,
  mr-pass 12.6 of 15 s; client: mr-boss 41.7 of 44 s); `moqui lint --screens` clean.

### P3 — Customers and orders

Design §4 and §6's Availability mounts; CS-SHARED. Customer Service's context on screens other apps built.

- **Reads.**
  - `CaseServices.find#ServiceOrders`: an exact ID, display ID or external ID first, then customer, email, phone,
    product and date; a missing and a forbidden ID give the same answer (F30).
  - The customer's credit status through Accounting's built `mantle.account.CreditServices.get#CustomerCreditStatus`
    (AC-11, F36), which answers the hold and its reason only to a holder of `CUSTOMER_CREDIT_VIEW`.
  - Resend the original confirmation (F29): the order's confirmation PDF stored as OrderContent at placement, sent
    through `send#EmailDraft` to a checked recipient, recording the recipient, the version and the result; an order with
    none renders as of its placed revision and stores it.
- **Screens** (design §4, §6):
  - Customers: CustomerFind and CustomerList, with the hold reason read only.
  - Customer360: Accounting's `Shared/Customer360` with the Customer Service row of crosscut §3.2: Overview and
    contacts, Cases, Orders and shipments, Activities, Files, and the permitted billing summary; Shipping defaults with
    party authority. Later phases add Returns (P9), Delivered items (P11) and Service (P14, with ServiceAgreements).
    PaymentDetails stays hidden; PartyIdentifications and TaxRegistrations are read only.
  - ContactDetail: the Commons contact record with the row of crosscut §3.1. Its Support invitation comes in P15, for
    a holder of `SUPPORT_CONTACT_INVITE` only.
  - Orders: OrderLookup and OrderResults.
  - OrderDetail: `Shared/OrderDetail` with a Customer Service branch beside its Accounting and Warehouse ones (F35)
    and the Customer Service row of crosscut §3.6: Header, Items,
    Fulfillment and tracking, permitted money, History, Cases; new linked case and resend; the hold and its reason read
    only. Returns (P9) and changes (P10) come with their phases.
  - ShipmentDetail: Accounting's `Shared/ShipmentDetail` with the row of crosscut §3.8; copy tracking link and send an
    update; no stock action.
  - InvoiceDetail: Projects' `Shared/InvoiceDetail` with the row of crosscut §3.16; send a copy through Accounting's
    `send#Invoice`, with its pay link; no correction.
  - InventoryAvailability: Products' screen with the row of crosscut §3.7 for customer-serving facilities; a projection
    that is not ready shows unknown, never zero (F31).
  - StockAtDate: Warehouse's `Shared/StockAtDate` with the row of crosscut §3.26; its forms are in design-warehouse
    §14.
  - Product360: Products' screen with the row of crosscut §3.5: no cost or supplier price.
  - CaseDetail's linked records list orders, shipments and invoices, each opening the Customer Service mount.
- **Palette:** customers by name, email and phone, and orders by ID, through the scoped reads.
- **Usable when:**
  - an agent finds CustJqp by email, opens Customer360 and sees the open case and the orders, with no payment details,
    and a held order's reason read only;
  - an order ID of another organization and a missing ID give the same answer;
  - from OrderDetail the agent links the delivered order to a case and resends its confirmation; the send records the
    recipient and the confirmation's version, and a second resend is a second record, not a re-render;
  - InventoryAvailability for a product whose projection is not ready says unknown;
  - StockAtDate answers the quantity at a past cut-off for ZIRET_WH;
  - Product360 shows no cost or supplier price, and a reader without price read sees no PriceExplain.

**Built Nov 5 (P3).**
- Mantle (`entity/OrderConfirmationEntities.xml`, `service/mantle/order/OrderConfirmationServices.xml`,
  `OrderConfirmations.js`, `template/order/OrderConfirmation.print.html.fancy`; `OctOrderConfirmation` in
  `MantleSetupData.xml`): `get#OrderConfirmationPrint` (a placed sales order as placed: its lines read back from the audit log
  at the placed time), `store#OrderConfirmation` (the PDF stored once as OrderContent under the order's lock) and
  `resend#OrderConfirmation` (the stored PDF to a checked recipient, an address of the customer or of a current contact,
  employee or representative of it, as a mail client draft of an account the user sends from, through `send#EmailDraft` filed
  on the order; an OrderEmailMessage with the recipient's party and `orderContentId`, the version, new on OrderEmailMessage;
  the operation key answers a retry). Each requires SUPPORT_CASE_EDIT or ORDER_APPROVE and an order of the user's
  organizations; refusals RECORD_UNAVAILABLE (missing, another organization's or a purchase order alike), ORDER_NOT_PLACED,
  RECIPIENT_REQUIRED, RECIPIENT_INVALID, RECIPIENT_UNCHECKED, SEND_ACCOUNT_REQUIRED.
- BOSS reads (`service/ironstone/customerservice/`): `CaseServices.find#ServiceOrders` over `Orders.js` (an exact order id,
  external id or customer reference first, then the order name and the customers of find#ServiceCustomers, narrowed by
  customer, product, status and dates; a missing and another organization's id answer "No order matches" alike, F30);
  `OrderServices.xml` over `Orders.js` (`get#OrderDetail`, `get#ShipmentDetail`, `get#InvoiceDetail`); `CustomerServices.xml`
  over `Customers.js` (`find#Customers`, `get#Customer360`, `check#ServiceContact`); `AvailabilityServices.get#StockAtDate`
  (Mantle's get#InventoryAtDate at the customer-serving facilities). `CustomerService.js`: the order's and customer's
  destinations (OrderDetail, Customer360; F77, so `get#RecordLink` opens them here), the shipment and invoice record kinds, the
  palette's customers by email and phone, the choices `products`, `facilities` and `customerCases`, the P3 linkPaths and
  `servingFacilities`. `Cases.js`: CaseDetail's linked records name their kind and open the Customer Service screen of an
  order, shipment, invoice, customer or case the user may work with; find#ServiceCustomers' phone search also matches the
  number as typed.
- Products' `SharedContext.js` Customer Service branch (F52): read only, the tabs Summary, Identifiers, Dimensions, Stock,
  Documents and Prices (a price reader only), cost, supplier price, margin, method and stock policy off, the customer-serving
  facilities (the user's organizations' stores' inventory and store facilities, else their warehouses); `Inventory.js` takes
  them as Warehouse's facilities; InventoryAvailability's Projection says "Projected availability is unknown, not zero" when it
  cannot be read (F31, every context) and its Policy tab is not shown here; PriceExplain is refused here without price read and
  explains the sales direction only.
- Screens: `CustomerService/Customers.xml` a menu group with `Customers/Customers` (CustomerFind, CustomerList with the hold
  reason, a credit hold's for a credit reader only), `Customers/Customer360` (Shared/Customer360: its Customer Service branch
  reads in always-actions, `template/CustomerServiceCustomer360.xml` the header and key numbers, the tabs
  `Shared/Customer360/ServiceOverview`, `ServiceCases`, `ServiceOrders` and `ServiceBilling` with Files; Accounting's seven tabs
  are kept to Accounting) and `Customers/ContactDetail` (the Commons ContactRecordSection for a served customer's contact);
  `CustomerService/Orders.xml` a menu group with `Orders/Orders` (OrderLookup, OrderResults) and the mounts OrderDetail
  (`template/CustomerServiceOrderDetail.xml`: header, holds read only, items, shipments and tracking, invoices, cases,
  confirmation and its sends, history; New case through NewCase with the order, Link to case, Resend confirmation and the
  stored PDF), ShipmentDetail (`template/CustomerServiceShipmentDetail.xml`, read only, with the delivery update to copy) and
  InvoiceDetail (`template/CustomerServiceInvoiceDetail.xml`, F53: amounts for a receivables reader, Send a copy through
  `send#Invoice` for RECEIVABLE_EDIT, no correction); `CustomerService/Availability.xml` a menu group with
  `Availability/Products` (the product lookup), StockAtDate (Shared/StockAtDate with `template/CustomerServiceAvailability.xml`'s
  find: product, facility, days) and the mounts InventoryAvailability, Product360 and PriceExplain. NewCase takes an `orderId`
  and links the order through create#Case; the root's keymap gains Customers and Orders.
- Grants and demo: `BossSetupData.xml` PRODUCT_CATALOG_VIEW for the root user group and the administrator, PRICE_VIEW for the
  agent, manager, order desk and administrator; `BossZCustomerServiceDemoData.xml` Retail's shared service mailbox
  `BOSS_CS_SERVICE_MAIL` (local sink) for the agent, manager and administrator; `Demo.js` the held order `BOSS_CS_SO_HELD` (Joe
  Q Public, a manual hold with its reason).
- Specs: Mantle `test/order/OrderConfirmations` (3 features, about 1.7 s: the first resend renders as placed, stores once and
  sends to the checked address with the PDF; a retry and a second resend of one stored version; the refusals). BOSS
  `CustomerServiceOrders` (6 features, about 1 s: the lookup's exact id and the missing and other organization's alike;
  Customer360 of the shared ORG_ACME per organization, F74; the §2 audience; CaseDetail's linked order; Products' Customer
  Service context; OrderDetail's and Customer360's one qvt render) and `CustomerServiceAccess` (+1 feature: the shipment,
  invoice and contact checks and the resend's capability; the palette and record-link features now expect OrderDetail and
  Customer360, F77). Acceptance `test/acceptance/CustomerService/CustomerServiceOrdersWalk` (the usable-when, 6 features),
  `CustomerServiceFoundationWalk` (customers open Customer360; the client refused the P3 services) and `AppStructure` (the P3
  routes and mounts, the placeholder floor 49).
- Tests run (all pass): Mantle OrderConfirmations, OrderToCashBasicFlow, ReturnToResponseBasicFlow, ShipmentReturnMisc,
  PurchaseOrders, PurchaseRevisions, RecordLinks, RecordVisibility, SupportCases, AccountingCredit (133 features); BOSS
  CustomerServiceAccess, CustomerServiceCases, CustomerServiceOrders, AccountingReceivables, AccountingCollections,
  AccountingAccess, AccountingOutputs, WarehouseShipping, WarehouseReports, WarehouseInventory, WarehouseReturns,
  WarehouseReceiving, ProductsInventory, ProductsSharedContext, ProductsPricing, ProductsAccess, PurchasingOrders,
  PurchasingBills, PurchasingReceiving, PurchasingAccess, PurchasingReplenishment, Billing, ClientBilling, ProjectsAccess,
  ManufacturingSubcontracting, ManufacturingAccess, QuickCreate, Contacts, CommsHome, Inbox, Requests (288 features);
  acceptance CustomerServiceOrdersWalk (6), CustomerServiceFoundationWalk (5), CustomerServiceCasesWalk and AppStructure.
  `moqui lint --screens`: 136 flagged sites, as master; none in the new screens.
- Inventories: ss-inventory's FindCustomer, CustomerData, FindOrder OrderList and OrderDetail forms; usl-inventory's
  availability, credit, send#Invoice, send#EmailDraft and link#RequestRecord rows, and a P3 table for the confirmation
  services and get#InventoryAtDate.
- Decisions:
  - F55 (placement): no placement rule. The confirmation is stored by the first store or resend, rendered as of the order's
    placed time from the audit log (OrderItem's product, quantity, unit price and required date are audit-logged on create
    and update), so the stored file is the order as placed; Mantle's placement path is unchanged, with no PDF render (and
    Chromium) on every order and no organization flag to set. A later resend attaches that file, never a new render.
  - The resend is a mail client send (`send#EmailDraft`, as the plan names), so it needs an account the user may send from:
    the organization's shared service mailbox (the demo's `BOSS_CS_SERVICE_MAIL`), chosen in the dialog.
  - Money (§2): invoice amounts, balances and payments for ACCOUNTING_VIEW or RECEIVABLE_VIEW (Accounting's AR group holds the
    second); an order's line prices and total for every Customer Service user (they are on the customer's own confirmation);
    payment details never. (Review R2: an order's prices, total and stored confirmation for PRICE_VIEW, ACCOUNTING_VIEW or
    RECEIVABLE_VIEW, so the service reader, who holds no price read, sees them withheld.) A credit hold's reason, and the credit status, for CUSTOMER_CREDIT_VIEW only.
  - Customer360 in Customer Service has its own tabs (Overview and contacts, Cases, Orders and shipments, Billing, Files):
    Accounting's tabs read Accounting's context and are kept to it; PaymentDetails (Finance details) never shows here; the
    identifications and tax registrations are read only on Overview. Returns (P9), Delivered items (P11) and Service (P14)
    come with their phases.
  - Availability is a menu group whose default is a product lookup (InventoryAvailability and Product360 need a product);
    StockAtDate is in its menu.
  - ShipmentDetail's "send update" is the delivery text copied into the case's reply (a shipment has no channel of its own).
- Findings (provisional):
  - **F85** `org.moqui.mail.EmailClientServices.save#Draft` refuses an attachment outside the account's own mail files
    unless authorization is disabled; Mantle's resend attaches the stored OrderContent PDF that way, after its own checks.
  - **F86** Accounting's receivables groups hold RECEIVABLE_VIEW, not ACCOUNTING_VIEW, so §2's "financial amount by
    ACCOUNTING_VIEW" would withhold invoice amounts from an AR user; Customer Service reads either (§2 should say so).
  - **F87** Customer Service users held no catalog read: Products' shared screens refuse without PRODUCT_CATALOG_VIEW. P3
    grants it to the root group and PRICE_VIEW to the agent, manager, order desk and administrator; the service reader has no
    price read, so Product360 has no Prices tab for it and PriceExplain, which checked catalog read only, is refused it here.
  - **F88** Shared/Customer360 is Accounting's: its header and every tab read `get#CustomerContext` and its capabilities;
    the Customer Service branch reads in always-actions (a tab renders alone), adds its own tabs and a conditional default,
    and keeps Accounting's tabs to Accounting by a condition on each.
  - **F89** find#ServiceCustomers' phone search (P2) matched the digits alone, which miss a number kept with its separators
    ("234-5678"); it and the palette now match the number as typed too.
  - **F90** A credit hold is placed only by the credit policy (`hold#Order`), so the demo's held order is a manual hold
    with its reason; a credit hold's reason is withheld from a user without CUSTOMER_CREDIT_VIEW (checked on Customers and
    OrderDetail by the code path, not by demo data).
  - **F91** Customer creation (FindCustomer's create forms) is not in Customer Service: the Commons contact record and
    Sales create parties; ss-inventory marks them so.
  - **F92** CustomerService.js's `partyName` leaves out a middle name ("Joe Public") where Mantle's `partyNames` keeps it
    ("Joe Q Public", CaseDetail); P16 may align them.
  - **F93** A shared screen's service (`CatalogServices.get#SharedContext`) is authorized through the mounting root's
    inherited authorization, so a spec calls it as a Customer Service user with authorization off, as Warehouse's do.

**Review Nov 5 (P3).** Checked against §2, design §4 and crosscut §3.2, §3.5–§3.8, §3.16, §3.26: the scoped reads and
AccessServices on every mount, F30, F74 (orders, invoices and cases of a shared customer by the user's organizations), the
resend's recipient check (the customer's or a current contact's address only), its operation key, the save#Draft bypass of
F85 (the attachment is only the order's own OctOrderConfirmation OrderContent, outside the mailbox's files, so a mailbox
delete leaves it), F31 and the Customer360 tab conditions in other apps (AccountingReceivables, AccountingCollections,
ProductsInventory, ProductsSharedContext, WarehouseReports, WarehouseInventory, PurchasingReplenishment,
ManufacturingMaterials pass), F77 (another app's user keeps a customer's Commons link) and the acceptance walk (the six
usable-when, passing). Fixes:
- R1 (high, Mantle) The confirmation as placed: a deleted OrderItem is not audit-logged, and handle#OrderMajorChange deletes
  and recreates a placed store order's promotion, shipping and tax lines on any change, so the first store could print an
  order without lines it had when placed. A store order with a line created after placement, or a line number created
  again, is now refused (ORDER_CHANGED_SINCE_PLACED); valueAt reads the last value at or before the placed time.
- R2 (high) §2 money: an order's line prices, amounts, total and stored PDF now need PRICE_VIEW, ACCOUNTING_VIEW or
  RECEIVABLE_VIEW (OrderDetail, OrderResults, Customer360's orders, the confirmation file), withheld otherwise, so the service
  reader without price read sees none; Mantle's get#OrderConfirmationPrint needs PRICE_VIEW, ACCOUNTING_VIEW or ORDER_APPROVE.
- R3 (medium) A credit hold's type and reason are withheld on OrderDetail from a user without CUSTOMER_CREDIT_VIEW.
- R4 (medium, Mantle; the lead's follow-up) F55: `PartyAcctgPreference.orderConfirmationOnPlace` (off by default, beside
  the organization's other order and invoice flags) and the OrderPlacedStoreConfirmation rule (tx-commit on a sales order's
  placement) store the confirmation at placement through the internal store#PlacedOrderConfirmation, in a transaction of
  its own, a failure logged and never failing the place; orders placed before the flag keep the first-resend store. Not
  async: an async call runs as the placing user and updates their UserAccount when it ends, which deadlocked against the
  BOSS demo loader holding that row. storeOf renders before taking the order's lock. The BOSS demo leaves the flag off for
  ORG_ZIZI_RETAIL: turned on, the demo load hit statement timeouts (the slower placements overlapping the Accounting demo
  worker) and OrderToCashBasicFlow and OrderProcureToPayBasicFlow failed, with about 2 s more across those five specs.
- R5 (medium) Customer360's Activities tab in Customer Service (`Shared/Customer360/ServiceActivities.xml`,
  CustomerServices.get#CustomerActivities): the customer's and its contact people's communication events on a case the user
  sees or with the user's organizations (and on no case hidden from them; F74), and the activities on the customer whose
  owner or assignee is of the user's organizations; read only, no body.
- R6 (low, Mantle) A resend whose send fails (ES_READY with a sendError) is cancelled by the OrderConfirmationSendFailed rule
  (cancel#FailedConfirmationSend), so its PDF is not left editable in the shared mailbox's Outbox.
- Specs after R4–R6: Mantle OrderConfirmations (4 features), OrderToCashBasicFlow, ReturnToResponseBasicFlow (with the BOSS
  demo); BOSS CustomerServiceOrders, CustomerServiceAccess, AccountingReceivables, AccountingCollections; acceptance
  AppStructure; lint as before.
- Left for the lead: the flag has no field on Accounting's organization settings yet (SetupServices' flag list), and the
  demo load's contention with an on flag (R4) is the demo loader's, worth a look before a demo turns it on.

### P4 — Service levels

Design §3 CaseDetail's clocks, §7 CaseAnalytics, §9 ServiceLevelPolicies; CS-SLA and CS-JOBS.

- **Business time** (F13), Commons' contract:
  - a team's weekly working hours as a `WetAvailable` work effort of the team party, by dated rows, stored through
    `mantle.work.CalendarServices.store#WorkingHours` for a person or a team; the team's manager edits them on
    AgentTeams through Commons' `store#WorkingHours`, which keeps its forms and calls it;
  - `mantle.work.CalendarServices.get#BusinessTimeDue` and `get#BusinessTimeElapsed`, to the minute in the schedule's
    time zone, less the organization's `WepHoliday` days, reusable by Projects and Manufacturing.
- **CS-SLA.**
  - `mantle.request.support.ServiceLevelPolicy` and `ServiceLevelTarget`, effective-dated rows by organization with
    their key fields audit-logged: conditions (queue, type, customer, agreement), precedence, calendar, targets per
    priority band, warning offsets, pauses and the reopen policy. No version record (§2).
  - `CaseSlaEpisode` and `CaseSlaEvent`, records of their own because they are measurements: the policy row and
    calendar used, start, due and actual times, pauses with reasons, breaches, and reasoned corrections that keep the
    earlier figure. A holiday edit changes no stored deadline.
  - `mantle.request.SlaServices`: `find#Policies`, `save#Policy` (`SUPPORT_POLICY_EDIT`), `simulate#Policy`,
    `start#CaseEpisode` (from `ensure#CaseProfile`), `record#CaseEvent`, `correct#CaseSla` (`SUPPORT_CASE_MANAGE`),
    `get#CaseSlaHistory` and `scan#CaseSla`.
  - The D23 rules: a Request status entity ECA rule records every status change of a case, and a RequestCommEvent create
    rule records an outward response or a customer reply. A sent external reply fulfills first response once the channel
    accepts it; an acknowledgement, a note or a failed send does not. Making or linking work is an event.
  - Policy selection at intake by §4's precedence, refusing equally ranked published overlaps; the row is bound to the
    episode, and a later publish does not re-select it.
  - `responseRequiredDate` mirrors the current resolution due date, and only SlaServices writes it on a case (F8).
  - Pause and resume with a reason, resolve, and reopen as a new resolution episode, through `transition#Case`; first
    response never restarts.
  - The agreement condition reads a service agreement type seeded here (F32).
- **CS-JOBS:** the warning and breach scan, a ServiceJob over a bounded batch, a failing case logged with its ID and the
  rest going on, idempotent by case and episode; the SLA warning and breach notification topics.
- **Screens:** ServiceLevelPolicies (SlaPolicyList, SlaPolicyEdit, SlaSimulation); CaseDetail's clocks beside the
  header and its SLA tab; CaseAnalytics (CaseMetrics); Cases' SLA risk view; Home's SLA compliance, first response and
  resolution measures; AgentTeams' working hours.
- **Usable when** (design §10, case intake to resolution):
  - a case received Friday 16:30 on a queue with a Monday-to-Friday 9:00–17:00 team and a holiday Monday is due for
    first response on Tuesday, as SlaSimulation said;
  - an internal note does not meet first response; a sent reply does; a failed send does not;
  - waiting for the customer pauses resolution, and an internal hold does not;
  - a status change made through Projects' `triage#Request` on a case records its event, and Commons' due-date edit is
    refused on it;
  - a reopen starts a new resolution episode and keeps the first breach;
  - a policy row started from a date leaves an open case on the row it began with;
  - a scan with one failing case names it and warns the rest.

**Built Nov 5 (P4).**
- Business time (Mantle, F13, F65): `service/mantle/work/BusinessTime.js`, the shared module: the interval functions
  (`merge`, `subtract`, `intersect`, `length`, `hoursOf`), `dayStartIn` and a calendar-based `calendarOf(ctx, schedule, from,
  thru)` moved from `ProductionCalendar.js`, which now calls them (its own `calendarOf` passes the work center's calendar,
  zone and organization); `dueAfter` and `elapsedMinutes` on a schedule (a Calendar with its zone, else around the clock,
  `configured` false); a party's schedule calendar (a `CalkResource` calendar it owns); and the working hours store and read.
  `mantle.work.CalendarServices` gains `get#BusinessTimeDue`, `get#BusinessTimeElapsed` (with pauses), `store#WorkingHours`
  and `get#WorkingHours` (the `define#Schedule` interface: calendarId, partyId, organizationPartyId, timeZone). The holiday
  convention is one: an all-day `WepHoliday` work effort owned by the organization (`allDayStart`), as `get#NextBusinessDay`
  and Manufacturing read it; a `WepHoliday` event in the schedule's own calendar counts for that calendar (kept for
  ProductionCalendar); holiday categories are not read. `store#WorkingHours`: the user's own (a `WetAvailable` of the user's
  party, named by `sourceReferenceId`), or a party's or calendar's on its schedule calendar, made on first use; from a date
  it ends the open series by its rule's `UNTIL` and starts another (dated rows), without one it changes the open series in
  place. Another party's hours need edit on its calendar, to manage the party (a current relationship in the Manager role),
  or the new `WORKING_HOURS_EDIT` (ADMIN, and BOSS_CUSTOMER_SERVICE_ADMIN). BOSS's `ironstone.commons.CalendarServices.store#WorkingHours`
  keeps its forms (no party: the user's Preferences, `BossWorkingHours`) and calls it, with a party for AgentTeams.
- CS-SLA (Mantle): `entity/SupportSlaEntities.xml`: `ServiceLevelPolicy` (conditions queue, type, customer, service agreement;
  calendar or zone; whether an internal hold pauses; the longest pause before a warning; the reopen policy `SlaReopen`;
  `previousPolicyId`; dated, key fields audit-logged), `ServiceLevelTarget` (per `CasePriorityBand`: first response,
  resolution and warning in business minutes, dated with its row), `CaseSlaEpisode` (per clock `SlaClock`, a resolution
  episode per opening; the policy row, target, calendar, zone and organization bound at start; start, due, warning, actual,
  pause running and paused minutes, warned and breached; state `CaseSlaState`) and `CaseSlaEvent` (`CaseSlaEventType`; the
  earlier and new due date, the reason, who; unique `eventKey`); seeds `AgrService` (F32, F50) and the purpose
  `CpAcknowledgement`. `service/mantle/request/SlaServices.xml` over `Sla.js`: `start#CaseEpisode` (from `ensure#CaseProfile`),
  `record#CaseEvent` (status, message, work; failure logged), `get#CaseSlaHistory`, `correct#CaseSla` (SUPPORT_CASE_MANAGE),
  `find#Policies`, `save#Policy` (SUPPORT_POLICY_EDIT), `simulate#Policy`, `scan#CaseSla` and `mark#CaseSlaEpisode` (each clock
  in its own transaction). The rules in `entity/Request.eecas.xml`: `SupportCaseSlaRule` (one after rule on Request's status,
  due date and resolution, get-original-value; F64, F83), `SupportCaseSlaMessage` (RequestCommEvent made) and
  `SupportCaseSlaWork` (RequestWorkEffort made). `SupportCases.js`: `ensure` starts the clocks (a failure logged, never the
  case's), `transition` puts its reason on the clocks' events. `MantleSetupData.xml`: `WORKING_HOURS_EDIT`, the topics
  `SupportCaseSlaWarning` and `SupportCaseSlaBreach`, the ServiceJob `scan_CaseSla` (every five minutes, 200 a batch).
- CS-JOBS: `scan#CaseSla` records a breach (at its due time) or a warning once per episode by its event key and tells the
  case's assignee, else the queue team's managers; a pause past the policy's longest records `SetPauseLimit`; a clock that
  fails is logged with its case and named in `failedList`, the rest go on.
- BOSS: `Settings/ServiceLevelPolicies.xml` (SlaPolicyList as a box per policy with its conditions, rank, calendar, period,
  state and targets; New policy and Change from a date over `save#Policy`, End; SlaSimulation over `simulate#Policy` with a
  queue and one pause) and `ConfigurationServices.get#ServiceLevelSettings` (calendars with their hours, service agreements,
  bands, reopen policies); `Settings/AgentTeams.xml` shows each team's hours and Working hours (from a date) for the team's
  manager and the administrator; `template/CustomerServiceCaseDetail.xml` the clocks beside the header and the Service level
  tab (clocks with policy and calendar, a manager's Correct over `correct#CaseSla`, the events); `Reports.xml` a menu group
  with `Reports/ReportsHome` (P14's placeholder) and `Reports/CaseAnalytics` (CaseMetrics: clock cards and the event table
  over `get#CaseSlaHistory` after `check#Record`); Cases' SLA risk view (a running clock warned, due or breached), Needs
  response (first response running, or new with no clock) and each row's clock due first (`Cases.js`); Home's SLA compliance,
  first response and resolution (`Cases.js slaMeasures`, the share of clocks decided in the period met on time, with its
  denominator and change) and Team queues' breached count; SettingsHome's Service levels readiness; `BossSetupData.xml` the
  topics' links (CaseDetail's Service level tab) and `WORKING_HOURS_EDIT` for the administrator; the topics in the root's
  shell providers.
- Demo (Retail only, F82): `BossCustomerServiceDemoData.xml` the policies `BOSS_CS_SLA_RETAIL` (the default, four bands) and
  `BOSS_CS_SLA_PRIVACY` (the Privacy queue, around the clock); `BossXCustomerServiceHoursDemoData.xml` (new) runs
  `DemoServices.load#WorkingHoursDemo` (the Support team Monday to Friday 9:00-17:00, America/Chicago) before
  `BossYCustomerServiceCasesDemoData.xml`'s requests become cases, so their clocks count on the hours.
- Specs: Mantle `test/work/BusinessTime` (3 features, 0.2 s: a team's hours by its manager and refused to another; minutes
  due past a weekend and a holiday, elapsed less a pause, around the clock; hours from a date leaving the days before) and
  `test/request/SupportSla` (8 features, 1.3 s: no policy no clocks; the policy saves and refusals with the overlap;
  precedence; Friday 16:30 on the team's hours with a holiday Monday; note, failed send and sent reply; pause, hold and
  another path's move; reopen keeping the first breach and a later policy row; correction; the scan naming a failing clock
  and warning once). BOSS `CustomerServiceAccess` (+1 feature: save#Policy for the administrator, not the manager; another
  organization's policies and case clocks refused; ServiceLevelPolicies' one qvt render) and `CustomerServiceCases` (the
  team's hours and the levels readiness on the settings feature; the clocks and tab on CaseDetail's one render). Acceptance
  `test/acceptance/CustomerService/CustomerServiceSlaWalk` (the usable-when, 7 features, all pass), and `AppStructure`'s fixtures
  for ServiceLevelPolicies and CaseAnalytics (the placeholder count unchanged: Reports' placeholder moved to ReportsHome).
- Tests run (all pass): Mantle BusinessTime, SupportSla, SupportCases, WorkCenters, ProductionSchedule, ProductionReports,
  CalendarServices, SupplyPlanning, ProductionShopFloor, ProductionSubcontract, WorkResources, Dav, CalendarChanges,
  WorkProjectRequests, RecordVisibility, RecordLinks, WorkProjectClients, CommonsToday, OrderToCashBasicFlow,
  ReturnToResponseBasicFlow, ShipmentReturnMisc, WorkPlanToCashBasicFlow; BOSS CustomerServiceAccess, CustomerServiceCases,
  CalendarSettings, ManufacturingWorkCenters, ManufacturingSchedule, ManufacturingPlanning, ManufacturingDowntime,
  ManufacturingReports, Requests, ProjectRequests, Chat, QuickCreate, TodayPanel, Chatter, Inbox; mr-pass Integrations and
  Forum; acceptance CustomerServiceSlaWalk, AppStructure, CustomerServiceFoundationWalk and CustomerServiceCasesWalk.
  `moqui lint --screens`: 136 flagged sites, as master; none in the Customer Service screens.
- Inventories: no ss-inventory or usl-inventory row is designed for P4's screens or new services (the SLA forms and
  services are new; Commons' working hours row is BOSS's).
- Decisions:
  - The business-time services read only working times and take no permission; the SLA reads and saves check theirs.
  - A policy's precedence is its rank, computed from its conditions (agreement 8, customer 4, queue 2, type 1), not a stored
    number (F94); the list shows it.
  - The scan runs every five minutes over at most 200 clocks.
  - A first response clock still running when the case resolves closes as unmet, never met; a breach it had stays.
  - While resolution is paused the case's due date is empty (no current due date); after a resolve it keeps the last one.
- Findings (provisional):
  - **F94** Design ServiceLevelPolicies' "precedence" is not a field: the most specific condition ranks the policy, and
    two rows of one rank can both hold for a case only when their conditions are equal, so the refused overlap is two
    published rows with the same conditions over overlapping dates (EQUAL_RANK_OVERLAP); a replacement names its row and
    ends it.
  - **F95** The case rule makes the profile after the commit (F84), so loaded data gets its clocks then: the demo team's
    hours are stored by a demo file that loads before the requests (BossX before BossY). A request made before any policy
    started (a backfill) takes the row in effect now.
  - **F96** A declared in-parameter not passed arrives as null, so save#Policy reads null as "unchanged" and an empty
    string (a form's cleared field) as "none".
  - **F97** Ending a weekly working-hours series from a date needs no new field: its RRULE's `UNTIL` (RFC 5545) ends it
    for get#EventInstances, get#FreeBusy and business time alike.
  - **F98** A sent mail is filed on its case (RequestCommEvent) only once it is ES_SENT (file#SentEmail), so the
    RequestCommEvent rule sees a send the channel accepted; a failed send waits in the Outbox unfiled. Projects' intake
    confirmation is a RequestEmailMessage with no CommunicationEvent and never reaches the rule; `CpAcknowledgement` marks
    any other automatic message.
  - **F99** BOSS's settings organization choice (every internal organization for the administrator) can be one Mantle's
    scope refuses (`get#PartyOrganizationInfo`; the administrator's first option ORG_ZIZI_CORP): ServiceLevelPolicies then
    says the organization's levels are not available. P2's settings saves have the same mismatch. Fixed in review (R3).
  - **F100** CaseAnalytics (design §2: `CustomerService/Reports/CaseAnalytics`) made Reports a menu group before P14:
    Reports' placeholder is now `Reports/ReportsHome`.
  - **F101** F50: P4 seeds `AgrService` and builds no store or expiry for service agreements; a policy's agreement
    condition reads an Agreement of that type between the organization and the customer, active by its dates and, when it
    has a status, AgmStActive. The purchase agreement services still refuse it. P11 builds the store.
  - **F102** A customer's reply while the case waits for them is recorded (`SetCustomerReply`) but does not resume the
    clock: design ServiceDefaults' "customer reply before close reopens via policy" is P8's. Review: the wait is P4's
    (a resolved case's reopen stays P8's), fixed (R2).

**Review Nov 5 (P4).** Checked both repos' diffs against this section, §2, design §3 CaseDetail, §7, §9
ServiceLevelPolicies, D23, AGENTS.md and Practices-App-Dev: business time (the interval functions moved unchanged, the
production calendar reading them with its own key; due and elapsed across both daylight saving changes in
America/Chicago, now in BusinessTime; organization holidays by `allDayStart` in the schedule's zone; minutes; pauses);
the rules (first response only by an outward message the channel accepted, ES_SENT for a mail; a note, an acknowledgement,
a waiting or failed send none; the customer wait pausing and a hold only by the policy; a reopen's new episode on the
earlier row, the first breach kept; no re-selection; a correction's event keeping the earlier due; the rules a no-op on a
request that is not a case; `responseRequiredDate` written by SlaServices only, its own write recognized by the rule);
idempotency (event keys for intake, responses, replies, work, breach, warning, the pause limit; the scan per episode in
its own transaction, a failing one named); store#WorkingHours (the user's own unchanged, CalendarSettings passing; another
party's by calendar edit, a Manager relationship to it, or WORKING_HOURS_EDIT within the user's organizations); access
(the screens' check#Record before get#CaseSlaHistory and correct#CaseSla; save#Policy SUPPORT_POLICY_EDIT and the
organization); leanness (BusinessTime 0.3 s, SupportSla 1.7 s; the usable-when is acceptance's CustomerServiceSlaWalk,
seven features, not rerun as it is unchanged).
- **R1 (medium, Mantle)** The scan's query took every paused clock, ordered by due date, so paused cases (most with no
  longest pause, or already recorded) could fill the batch of 200 on every run and the due and warned clocks were never
  reached. The due and warned clocks come first; the rest of the batch takes paused clocks whose policy has a longest pause,
  paused that long by the wall clock and not yet recorded for this pause.
- **R2 (medium, Mantle; F102)** A customer's reply left a case waiting for the customer paused for good. The reply now
  ends the wait: the case moves back by its workflow (a move needing no resolution or reason) to the open status it waited
  from, else In progress, and the status rule resumes the clock, the status event's reason "The customer replied".
  SupportSla resumes by the reply, and gained the default (a plain request's status, due date and sent mail record
  nothing) and an acknowledgement that is no response.
- **R3 (low, BOSS; F99)** The settings' organization choice and default are the service organizations Mantle's saves
  take (FacilityScope), so the administrator is no longer offered ORG_ZIZI_CORP; CustomerServiceAccess checks every one
  offered against find#Policies (it fails without the fix).
- Left for the lead: Cases' Needs response and SLA risk views read the clock table's request IDs (up to 5000) into an
  `in`/`not-in` list, which wants a join or subquery once cases number in the thousands; a clock that keeps failing in the
  scan (named each run) still takes a slot of every batch; a person's hours stored by someone else (partyId a person) go on
  the person's schedule calendar, not the personal series free/busy reads.
- Specs run (all pass): Mantle BusinessTime, SupportSla, SupportCases, WorkCenters, ProductionSchedule,
  ProductionShopFloor, CalendarServices, WorkProjectRequests, CommonsToday, ReturnToResponseBasicFlow; BOSS
  CustomerServiceAccess, CustomerServiceCases, CalendarSettings, ManufacturingWorkCenters, ManufacturingSchedule. `moqui
  lint --screens`: 136 flagged sites, as master.

- **Wave 3 suites (Nov 5, on master after P3, P4 and P12 merged, nothing else running):** standalone mr-mantle 1,688
  passed, 2 failed (the baseline), 11 skipped; `./moq test-apps` 2,981 server features passed and 1 failed
  (CustomerServiceOrders' email lookup paged past the demo orders behind other specs' orders for Joe Q Public; the
  lookups are narrowed to the demo's products, passing with the order flow specs run first), 14 client features passed;
  within every budget (server: mr-mantle 300.9 of 335 s, mr-boss 218.2 of 245 s, mr-pass 12.4 of 15 s; client: mr-boss
  41.7 of 44 s); `moqui lint --screens` clean.

### P5 — Assignment and saved replies

Design §9 AgentTeams, AssignmentRules and SavedReplies; Cases' bulk reply; CS-ASSIGNMENT, CS-REPLIES,
CS-FORM-ELEMENTS (the condition rows).

- **CS-ASSIGNMENT.**
  - Team participation: effective-dated rows by team and agent (eligibility, maximum active cases, substitute) beside
    P2's membership.
  - `mantle.request.support.ServiceAssignmentRule`, effective-dated rows with their key fields audit-logged: queue,
    priority, typed conditions (allowlisted field, operator and value), distribution (manual, round robin, least open),
    eligible team or users, schedule and maximum load, fallback. One winning rule, then the fallback.
  - The assignment cursor, a record of its own, locked with the assignment so two intakes cannot take the same slot.
  - `mantle.request.SupportCaseServices`: `assign#Case` evaluates the rules, called from `ensure#CaseProfile` and
    `update#Case` (F41); `save#AssignmentRule` (`SUPPORT_POLICY_EDIT`) and `preview#Assignment`, the preview through
    the same evaluator. `ironstone.customerservice.AssignmentServices.find#Rules` lists them for AssignmentRules.
    Reassignment never resets the clock; no eligible agent leaves the case unassigned and notifies the manager.
    Presence is a hint; the schedule is P4's.
- **The condition rows** (CS-FORM-ELEMENTS): an editable `form-list` with a terminal twin, or the framework element P0
  calls for, under style-guide §8.1.
- **Who is viewing** (§4), only if P0 found the Dev AIDE presence generalizes at small cost: a record viewers topic on
  the notification WebSocket in the framework, CaseDetail's viewers, and a warning before Send when another agent is
  composing a reply to the same case. Commons presence stays user status only.
- **CS-REPLIES.**
  - A saved reply is a Comms text block (D24): personal by its owner, team by the team's UserGroup, which AgentTeams
    keeps in step with the membership (F3), global by the root user group.
  - `mantle.request.support.SavedReplyAction` rows and the language and variables extension, keyed by
    `emailTextBlockId`.
  - `mantle.request.SupportCaseServices` `preview#SavedReply` and `apply#SavedReply` (`SUPPORT_CASE_EDIT`), reading
    the framework's EmailTextBlock; `ironstone.customerservice.ReplyServices.save#SavedReplyAction` for SavedReplies,
    which saves the text through Comms' `org.moqui.comms.MailSettingsServices.store#TextBlock`. An unsupported variable
    is an error, not an empty value. The case changes commit per case; the message keeps a durable pending or failed
    state by its message ID.
- **Screens:** AgentTeams' TeamParticipation; AssignmentRules (AssignmentRuleList, AssignmentRuleEdit,
  AssignmentPreview); SavedReplies (ReplyList, ReplyEdit, ReplyPreview); CaseDetail's CaseReplyAction, the Compose
  picker's text then the actions previewed and applied on confirmation; BulkCaseAction's reply, with recipients
  previewed per case.
- **Usable when:**
  - round robin between two eligible agents skips the one outside their hours; two concurrent intakes take two slots;
  - a rule with no eligible agent leaves the case unassigned and notifies the manager; a reassignment keeps the clock;
  - a team reply with a tag and a set-status action is previewed and applied on confirmation; a personal reply is seen
    by its owner only; Comms TextBlocks still lists the user's own and shared blocks;
  - a bulk reply to three customers' cases mails each customer on their own thread, and a failed delivery retries by its
    message ID without a second reply.

**Built Nov 5 (P5).** No framework change (F71: the condition rows are a non-multi editable form-list; who is viewing stays
later, §4 Nov 5).
- Mantle entities (`entity/SupportAssignmentEntities.xml`): `ServiceTeamParticipation` (eligible, most open cases, substitute,
  calendar; dated, key fields audit-logged), `ServiceAssignmentRule` (queue, name, order, distribution `AdManual`,
  `AdRoundRobin`, `AdLeastOpen`, team and named agents, working hours, most open cases, fallback; dated with `previousRuleId` and
  `rootRuleId`, key fields audit-logged), its typed `ServiceAssignmentCondition` rows (fields `AcfType`, `AcfBand`, `AcfPriority`,
  `AcfChannel`, `AcfTag`, `AcfCustomer`; operators `AcoIs`, `AcoIsNot`, `AcoAtMost`, `AcoAtLeast`, `AcoHas`, `AcoHasNot`),
  `ServiceAssignmentCursor` (by the rule's first row: round robin's last agent, the last result), `SavedReply` (by
  `emailTextBlockId`: organization, language, subject, variables, offered) and `SavedReplyAction` (`SraSetStatus`, `SraAddTag`,
  `SraAssign`, `SraAssignSelf`, `SraSetPriority`, `SraAddNote`); CaseProfile gains the rule, outcome (`AssignmentOutcome`) and
  reason, audit-logged; `UgtServiceTeam`. `MantleSetupData.xml`: the topic `SupportCaseUnassigned`.
- Mantle services (`SupportCaseServices.xml`, appended; `Assignment.js`, `SavedReplies.js`): `assign#Case` (from
  `ensure#CaseProfile` for a new unassigned case, skipped when `create#Case` names an assignee, and from `update#Case` on a queue
  move with no assignee given; the queue's rules in order, the first whose conditions all hold; its team's agents (managers only
  when named) eligible by participation, load and, when the rule respects hours, P4's business time now on the participation's
  calendar, else the agent's schedule calendar, else the team's; an agent out of hours gives the round robin turn to an
  eligible substitute; the rule's, then the queue's fallback; else unassigned and the queue team's managers told; every rule
  cursor of the queue locked before the evaluation; no clock touched), `preview#Assignment` (the same evaluator, nothing written),
  `save#AssignmentRule` (SUPPORT_POLICY_EDIT; a draft in place, a published change a new row ending the old; conditions as a list
  or one row added, changed or removed, each typed value checked), `sync#ServiceTeamGroup` (the team's group `SVT_<team>` in step
  with its members; `save#ServiceTeam` and `save#ServiceTeamMember` run it), `save#ServiceTeamMember`'s participation
  (`participation` true and its fields from `participationFromDate`), `preview#SavedReply` and `apply#SavedReply`
  (SUPPORT_CASE_EDIT; `{{name}}` variables from an allowlist, an unknown one UNSUPPORTED_VARIABLE and one with no value
  UNRESOLVED_VARIABLE; the recipient the case's non-staff contact, else its customer; the actions checked by the case services'
  rules, one refused refusing all; the actions and the draft in one transaction, the reply sent by `send#EmailDraft` on the case's
  latest readable mail thread and filed once ES_SENT; required operation key, a retry answering the first result and sending a
  failed message again by its ID).
- BOSS (`service/ironstone/customerservice/`): `AssignmentServices.xml` over `Assignment.js` (`find#Rules`, `get#TeamParticipation`,
  `get#RuleChoices`: a field's operators and values, a team's members, calendars), `ReplyServices.xml` over `Replies.js`
  (`find#SavedReplies` on Comms' rule kept to service replies of the user's organizations, `save#SavedReplyAction` through Comms'
  `store#TextBlock` then the facts and actions, the owner only, `preview#BulkReply` per case with each applied case's message
  state); `apply#CaseBatch` operation `reply` (per case `apply#SavedReply` by the batch key plus the case id; Done,
  ReplyDeliveryPending, ReplyDeliveryFailed besides the others; no batch record, so a retry re-runs each case's key).
- Screens: `Settings/AssignmentRules.xml` (AssignmentRuleList, AssignmentRuleEdit with the ConditionList form-list whose operator
  and value options depend on the row's field, an add-row form, End; AssignmentPreview), `Settings/SavedReplies.xml` (ReplyList,
  ReplyEdit with its ordered actions, ReplyPreview on a chosen case), `Settings/AgentTeams.xml`'s Participation dialog and column,
  SettingsHome's Assignment and replies links, `Cases/BulkReply.xml` (each case's recipient and actions, Send, then each
  reply's state and Retry of the ones not delivered) with Cases' Reply row-selection action, CaseDetail's Saved reply tab
  (`template/CustomerServiceReplies.xml`: pick, preview, edit the text, apply on confirmation; RequestDetail includes its three
  transitions) and the shared preview display `template/CustomerServiceReplyPreview.xml`; BossSetupData links
  `SupportCaseUnassigned` to CaseDetail.
- Demo: the Support queue's manual rule `BOSS_CS_RULE_SUPPORT` (demo and other specs' cases keep their assignees); the team group
  `SVT_BOSS_CS_TEAM_SUPPORT` with the manager's team reply "Need more details" (tag Follow up, wait for the customer), the manager's
  service-wide "Filters ship soon" (assign to me) and the agent's personal "Thanks for your patience"; BossZ syncs the three demo
  teams' groups.
- Specs: Mantle `test/request/SupportAssignment` (7 features, 1.7 s: no rule assigns nothing; the saves and typed refusals, draft
  and replacement; round robin skipping the agent outside their hours, no eligible agent telling the manager; a condition and a
  fallback; two parallel intakes taking two slots; a move reassigning and keeping the clocks; participation refusals and the team
  group) and `test/request/SupportReplies` (5 features, 0.9 s: the preview's values, recipient, action checks and variable errors;
  personal and team replies and Comms' list; apply, filing and retry; a failed delivery retried by its message ID; refusals).
  BOSS `CustomerServiceAccess` (+1: rules the administrator's, previews and replies a case editor's of the organization, a reply's
  change its owner's) and `CustomerServiceAssignment` (4 features, 1.2 s: the reads and each user's replies, the save through
  Comms, the bulk preview, and the one qvt render of AssignmentRules, SavedReplies, AgentTeams and BulkReply). Acceptance
  `test/acceptance/CustomerService/CustomerServiceAssignmentWalk` (the usable-when, 4 features, pass) and AppStructure's fixtures for the
  three new screens.
- Tests run (all pass): Mantle SupportAssignment, SupportReplies, SupportCases, SupportSla, SupportKnowledge, BusinessTime,
  OrderConfirmations, WorkProjectRequests, RecordVisibility, RecordLinks, WorkProjectClients, CommonsToday, OrderToCashBasicFlow,
  ReturnToResponseBasicFlow, ShipmentReturnMisc, WorkPlanToCashBasicFlow (188 features); BOSS CustomerServiceAssignment,
  CustomerServiceAccess, CustomerServiceCases, CustomerServiceKnowledge, CustomerServiceOrders, MailSettings and Compose (Comms'
  text blocks), Requests, ProjectRequests, Chat, QuickCreate (114 features); acceptance CustomerServiceAssignmentWalk, AppStructure,
  CustomerServiceFoundationWalk, CustomerServiceCasesWalk, CustomerServiceSlaWalk. `moqui lint --screens`: 136 flagged sites, as
  master; none in the Customer Service screens.
- Inventories: no ss-inventory or usl-inventory row is designed for P5's screens (saved replies are framework text blocks).
- Decisions:
  - A rule belongs to its queue by `requestCategoryId` and order; ServiceQueue's `assignmentRuleId` (P2) stays unused and
    save#ServiceQueue is unchanged (no field added: F127 does not meet P5).
  - A rule distributes among the team's agents; a Manager-role member only when the rule names them.
  - The case changes of a saved reply run through the case services (transition, tags, update), so a reply never does what the
    agent could not do by hand; one refused action refuses the reply, named in the preview.
- Findings (provisional):
  - **F114** Compose's text-block picker inserts text in the browser and cannot preview or run a reply's case actions, so
    CaseReplyAction is CaseDetail's Saved reply tab, offering the same text blocks by Comms' rule, the text editable before the
    apply. Design CaseDetail and SavedReplies changed.
  - **F115** SavedReplies sits under Settings, whose area denies the agent (BOSS_CS_SETTINGS), so it is the manager's and
    administrator's; an agent makes personal replies in Comms TextBlocks (one library, D24) and uses them on CaseDetail. Opening
    the page to agents needs an ALWAYS authz on a child of a denied area, for the lead.
  - **F116** The service-wide group is the root user group, which spans organizations (Ziziwork Services' agent is in it); a
    global reply keeps to its organization by SavedReply's organization in Customer Service, while Comms TextBlocks lists it to
    every member. The administrator, in BOSS_CUSTOMER_SERVICE_ADMIN alone, cannot share a reply with the root group (Comms requires
    the author to be a member).
  - **F117** An agent's own Preferences hours are a personal series on no calendar, which business time does not read, and
    store#WorkingHours does not let an administrator keep a person's schedule calendar (WORKING_HOURS_EDIT checks the party's
    owner, `_NA_` for a person): a participation names an organization's or team's calendar for the agent's hours (F112).
  - **F118** BusinessTime's `calendarOf` says `configured` only when its window holds working time, so "in hours now" reads the
    week ahead to tell a schedule with hours on other days from one with none.
  - **F119** A team's group is `SVT_<team>` of type `UgtServiceTeam`, found by the team's id with no new record; the demo's
    data names it and BossZ fills it.

**Review Nov 5 (P5).** Checked the Mantle and BOSS diffs against CS-ASSIGNMENT and CS-REPLIES: the cursor lock (a mutation
without `forUpdate` fails the two-intakes spec, so the lock does serialize; ensure#CaseProfile and update#Case lock the request
before the cursors, the least-open counts are read after the cursors), business hours, apply#SavedReply's transaction, retry and
recipients, the variable allowlist (the case's own customer, contact, subject, queue, organization, agent and the customer label
of its status; nothing internal or of another customer), the bulk reply's per-case key, thread and named outcomes, access, Comms'
visibility of shared blocks, and the acceptance walk (its four features are the usable-when).
- R1 (medium) An agent whose hours start later (more than a week on) or a two-weekly series in its off week read as around the
  clock (F118): `inHours` now takes hours as set when get#WorkingHours finds a series in effect or to come, and then needs an
  occurrence at the instant; SupportAssignment checks hours that start in two weeks.
- R2 (low) assign#Case locks a queue's cursors in the order of their ids, not the rules' order, which a concurrent save can change.
- R3 (high) apply#SavedReply's retry held the case's lock and locked the message while the sent message's filing held the
  message and wrote the case's RequestCommEvent: the two waited until the statement timeout (SupportReplies failed about one run in
  three after 60 s). The retry reads the message; the case's lock serializes retries.
- R4 (medium, F116) A service-wide reply shared with BOSS_CUSTOMER_SERVICE was listed by Comms TextBlocks and Compose to every
  organization's Customer Service users (Retail's "Filters ship soon" to Ziziwork Services' agent). It is now shared with the
  organization's group `SVO_<organization>` (`UgtServiceOrganization`), which sync#ServiceTeamGroup keeps with the members of all
  the organization's teams, and is that organization's (save#SavedReplyAction sets and checks it). A Customer Service user on no
  team (order desk, returns, knowledge, the administrator) no longer sees service-wide replies.
- R5 (medium, F115) The agent opens SavedReplies (design §9: A and S): BossSetupData `BOSS_CS_SAVED_REPLIES` grants
  BOSS_CUSTOMER_SERVICE_AGENT the one Settings child always (the framework checks a screen path's parents without requiring
  them, so the root group's Settings deny stays for the other pages), and CaseDetail's Saved reply links it. Sharing narrowed with
  it: a team's group only for the team's manager or a service manager, an organization's only for a service manager.
- Specs run (pass): Mantle SupportAssignment, SupportReplies (four runs), SupportCases; BOSS CustomerServiceAccess,
  CustomerServiceAssignment, CustomerServiceCases, MailSettings, Compose. `lint --screens`: nothing new. Acceptance not run (none
  changed).
- For the lead: the administrator still cannot share a service-wide reply (not a team member; F116); Comms TextBlocks lets any
  group member share a block with a team's group, which Customer Service then lists as a team reply without actions.

### P6 — Channels

Design §3 ChannelSessions, §9 ChannelRouting, CaseDetail's Reply publicly in forum; CS-CHANNELS, CS-STACK (the Comms
hooks).

- **CS-CHANNELS.**
  - Mail: the `ErActCreateRequest` rule value names a queue as well as a project (F10). `create#RequestFromEmail`
    files into the queue, the accepted intake time is `EmailMessage.receivedDate`, and threading follows verified
    message references before case tokens.
  - Auto-generated mail (an Auto-Submitted header other than no, Precedence bulk, junk or auto_reply, X-Autoreply) is
    ignored or attached to an existing case only, per route, and never acknowledged.
  - Organization intake goes through the queue route, not ProjIntake's triaged types (F11); the design changes.
  - The public form: a queue's form is the Support app's NewCustomerCase (P15), not BOSS's RequestIntake, which stays
    Projects' form at `/r/<token>` for a project. Here `create#IntakeToken` and `remove#IntakeToken` take a queue, the
    token held as Accounting P18's ExternalAccessCapability on the RequestCategory, and `create#IntakeRequest`'s
    limits apply per queue (F10).
  - ExternalAccess record kinds: Accounting P18 built Invoice and Order (with the `billing` and `supplier` app kinds),
    so `ExternalAccess.js` gains RequestCategory with an intake scope, for a queue's token, and Request, a case its
    customer's contacts read (P15).
  - Chat and calls: the `ScChat` seed; Chat's create files into a queue; `mantle.request.SupportCaseServices`
    `log#CaseCall` (`SUPPORT_CASE_EDIT`).
  - The forum (F12): a route from a PASS site and category to a queue, type and template; Mantle's
    `mantle.forum.ForumServices.create#CaseFromTopic` files a Submitted case into it with the channel, and the case's
    Reply publicly in forum previews and posts through `preview#CaseReply` and `publish#CaseReply`, for a user with
    forum posting rights. No private note is copied.
  - `mantle.request.SupportCaseServices` `save#ServiceRoute` (`SUPPORT_POLICY_EDIT`) and `preview#ServiceRoute`, the
    routes `create#RequestFromEmail` and `create#CaseFromTopic` read; `ironstone.customerservice.ChannelServices`
    `find#ServiceRoutes` for ChannelRouting; acknowledgements through `send#IntakeConfirmation` with the route's
    template.
- **Comms hooks** (CS-STACK, L8): Create case from a mail, chat message or voicemail through `create-from` and
  `ext-action`s in `message-actions`, `chat-message-actions` and `voicemail-actions`, and a `call-context` provider
  answering with the caller's open cases the user may see; mail intake stays the existing `createRequest` action.
- **Screens:** ChannelRouting (IntakeRoutes, RouteEdit, RouteTest); ChannelSessions (SessionFind, SessionList, LogCall)
  over `find#PartyCommunicationEvents` with the service audience filter.
- **Usable when:**
  - mail to the support address makes a case in the Support queue, timed by its received date, with one
    acknowledgement; a reply in the thread files on the case;
  - an Auto-Submitted reply attaches to the case, sends nothing and makes no case; an unknown sender is held for review;
  - a queue's intake token can be issued and revoked, and a project's token still makes a project request through
    RequestIntake; the queue's public form is P15's;
  - a chat message becomes a case with `ScChat`; an agent logs a call on a case;
  - a forum topic escalated through PASS lands in the queue; the agent's previewed public reply posts with no private
    note.

**Built Nov 5 (P6).**
- Mantle entity (`entity/SupportChannelEntities.xml`, new): `mantle.request.support.ServiceRoute`, effective-dated with its key
  fields audit-logged: a queue's route by channel (`ServiceRouteChannel`: SrcEmail, SrcWebForm, SrcForum, SrcChat), for mail
  its account (empty: any account whose rule names the queue), for the forum its PASS site and category, the type, priority
  and template, the unknown-sender rule (empty: the ServicePolicy's), the automatic-mail rule (`ServiceAutoGenerated`:
  SagAttach, SagIgnore), acknowledge, its text block and reply identity, the form's hourly limit, the token's days and the
  last error. Seeds: the `ScChat` and `ScForum` sales channels, the purpose `CpServiceInternal` (a call logged as internal),
  `CaseCallOutcome` (reached, follow-up, no answer, voicemail).
- Mantle services (`service/mantle/request/Channels.js`, new; appended to `SupportCaseServices.xml`): `save#ServiceRoute`
  (SUPPORT_POLICY_EDIT; CHANNEL_INVALID, ACCOUNT_UNAVAILABLE, SITE_REQUIRED, FORUM_CATEGORY_UNAVAILABLE, ROUTE_EXISTS for a
  site and category another queue takes, TYPE_NOT_OFFERED, PRIORITY_INVALID, TEXT_BLOCK_UNAVAILABLE, IDENTITY_UNAVAILABLE),
  `preview#ServiceRoute` (SUPPORT_POLICY_EDIT or SUPPORT_CASE_MANAGE; the dry run: route, join by reference or token,
  automatic, sender kind, outcome), `log#CaseCall` (SUPPORT_CASE_EDIT; a Phone event filed on the case, CpCustomerService,
  CpServiceInternal when internal; SUMMARY_REQUIRED, CONTACT_UNAVAILABLE, DATE_INVALID, DURATION_INVALID, OUTCOME_INVALID)
  and `review#HeldRequest` (SUPPORT_CASE_EDIT; accept, the sender or a chosen customer the customer, or dismiss; NOT_HELD,
  CUSTOMER_REQUIRED, CUSTOMER_UNAVAILABLE).
- Mantle changes to existing services, each acting only on a service queue's rule value, token or route (§2):
  - `create#RequestFromEmail`: a value naming a service queue (not a project) runs Channels.js `mailIntake`: verified
    references first, then a `[Request n]` token only for the case's customer, reporter or a contact of its customer; an
    automatic message (Auto-Submitted other than no, Precedence bulk/junk/list/auto_reply, X-Autoreply, a system sender)
    ignored or attached only (with CpAcknowledgement, so it is no reply and no response), never a case, never
    acknowledged; a customer's or contact's mail a Submitted ScEmail case dated by its received date; staff, another party
    and an unknown sender (a person made with no Customer role) held for review (a plain request in the queue with a note),
    or nothing by the unknown-sender rule; one acknowledgement of a new case through `send#IntakeConfirmation` with the
    route's text block and identity. A rule files into a queue when the route names its account or its owner (or the
    account's owner) works for the queue's organization; otherwise as for no project.
  - `file#RequestEmail` gains `automatic`; `send#IntakeConfirmation` gains `emailTextBlockId` and `emailIdentityId` and marks
    a queue's acknowledgement Auto-Submitted.
  - `create#IntakeToken`/`remove#IntakeToken` take `requestCategoryId`: an ExternalAccessCapability (scope CaseIntake, the
    earlier tokens revoked, the web form route's days else 60). `create#IntakeRequest` takes a queue's token (Channels.js
    `formTarget`, through `ExternalAccess.check`) with its limits per queue (the route's hourly limit else 30, the
    address's 5): a served customer's form a case, anyone else held. Projects' tokens and `/r/<token>` are unchanged.
  - `ExternalAccess.js` gains the record kinds RequestCategory (scope CaseIntake, SUPPORT_POLICY_EDIT, party-less: a token
    only, never a contact grant; F61) and Request (scope CaseView, SUPPORT_CASE_EDIT, the case's customer; for P15).
  - The forum's `createCaseFromTopic` (ForumIntegration.js) files a Submitted ScForum case in the route's queue with its type
    and priority when the topic's site and category have a route, the poster its customer (given the Customer role; an
    internal poster stays a plain request); with no route, as before (mr-pass Integrations unchanged).
  - `create#RecordFromChatMessage` puts a request on ScChat, with `requestCategoryId` and `customerPartyId`.
  - `find#PartyCommunicationEvents` gains `audience` (customer: no Comment, Message, StatusUpdate or internal call).
  - `ensure#CaseProfile` takes the given `emailMessageId`'s received date as the intake time (F84: before the mail is filed).
  - `Sla.js` and the customer-reply notice ignore CpAcknowledgement and CpServiceInternal events, and a call that reached no
    one (no answer, voicemail) is no response.
- BOSS (`service/ironstone/customerservice/ChannelServices.xml` over `Channels.js`, new): `find#ServiceRoutes` (the
  organization's queues' routes, the Comms rules whose createRequest names a queue, each queue's token state, the held
  requests, the forms' options; the administrator and the manager), `find#ChannelSessions` (a customer's and its contacts'
  calls, chats and mail through `find#PartyCommunicationEvents` with the customer audience, else those on the user's cases;
  by channel, agent, period, linked), `get#CallContext` (the root's `call-context` provider `boss.cases`: the caller's open
  cases the user sees; Comms' own provider answers the contacts), `create#CaseFromMessage` (a mail, chat message or
  voicemail of a customer the user serves; ALREADY_FILED, CUSTOMER_UNAVAILABLE) and `get#CaseForumTopic`.
  `CustomerService.js`: the `cases` choice and the linkPaths; `Configuration.js` exports its settings organization helpers.
- Screens: `Settings/ChannelRouting.xml` (IntakeRoutes: the routes with Add route, Edit and End; the Comms mail rules; the
  public form's Turn on, New link and Turn off; Held for review with Accept and Dismiss; RouteTest), `Cases/ChannelSessions.xml`
  (SessionFind, SessionList, Log a call), `template/CustomerServiceCallLog.xml` (LogCall),
  `template/CustomerServiceChannels.xml` (CaseDetail's Log a call and Reply publicly in forum: Preview through
  `preview#CaseReply`, Post publicly through `publish#CaseReply` with the preview hash; only the reply is posted), included
  from CaseDetail's Conversation with `Shared/RequestDetail`'s transition-includes; SettingsHome's Channels box. Comms hooks:
  Chat's `boss.createCase` ext-action (kind case through the `create-from` provider, `ChatServices.create#FromChat`),
  Voicemail's `screen-extend` (Create a case), MessageDetail's `screen-extend` (Create a case beside Link to a record, for
  SUPPORT_CASE_EDIT).
- Which path makes a channel case (the lead's note for P7): every channel path makes its case through `create#Request` and
  `ensure#CaseProfile` (mail, the form, the forum and chat by the case rule after commit; `review#HeldRequest` and the Comms
  hooks' `create#CaseFromMessage` calling `ensure#CaseProfile` at once, F84), never `create#Case`, so P7's template check
  refuses no channel intake; the route's `templateFormId` is stored for the values to be collected later.
- Demo (`data/BossZZCustomerServiceChannelDemoData.xml`, new, after BossZ): the text block `BOSS_CS_ACK_SUPPORT` (shared with
  `BOSS_CUSTOMER_SERVICE`), Retail's mail route `BOSS_CS_ROUTE_MAIL` (the service mailbox, acknowledged) and form route
  `BOSS_CS_ROUTE_FORM` into Support; nothing for ORG_ZIZI_SERVICES (F82).
- Specs: Mantle `test/request/SupportChannels` (9 features, about 2.8 s: the route saves and refusals; mail from a contact a
  case timed by its received date, its first response clock from then, acknowledged once and no response; reply by
  references, a verified token, a stranger's token refused; an automatic reply attached as no reply, one on no case nothing;
  unknown and staff senders held, accepted and dismissed, with refusals; the dry run and an ignoring route; the queue token
  issued, used, limited per queue and revoked, its contact path refused; a logged call meeting first response and an
  internal one not; the forum route). BOSS `CustomerService/CustomerServiceChannels` (4 features, about 0.6 s: ChannelRouting's
  read, a case from a mail and staff's refused, ChannelSessions with its one qvt render, the call-context provider),
  `CustomerServiceAccess` (+1: route save and reads, another organization's refused, ChannelRouting's one qvt render),
  `CustomerServiceCases` (CaseDetail's render shows Log a call). Acceptance `test/acceptance/CustomerService/CustomerServiceChannelsWalk`
  (the usable-when, 5 features, all pass) and `AppStructure` (the two routes in the fixtures; 18 features pass).
- Tests run (all pass): Mantle SupportChannels, SupportCases, SupportSla, SupportKnowledge, WorkProjectRequests,
  RecordVisibility, RecordLinks, WorkProjectClients, CommonsToday, OrderToCashBasicFlow, ReturnToResponseBasicFlow,
  ShipmentReturnMisc, WorkPlanToCashBasicFlow, ChatRecords, CrmMiscServices, InboxThreads, InternalMessages, Mailboxes,
  SupplierPortal, WorkProjectHub; BOSS CustomerServiceChannels, CustomerServiceAccess, CustomerServiceCases, Chat, CommsHome,
  Inbox, Requests, ProjectRequests (RequestIntake at /r/<token>), ProjectsAccess, QuickCreate, TodayPanel, Chatter,
  CustomerServiceKnowledge, CustomerServiceOrders, WorkItemDetail, EventDetail, Contacts; mr-pass Integrations and Forum
  (18). `moqui lint --screens`: 136 flagged sites, as master; none in the new screens.
- Inventories: usl-inventory's `find#PartyCommunicationEvents`, `create#IntakeToken` and `remove#IntakeToken` implemented in
  ChannelSessions and ChannelRouting; no ss-inventory row is P6's.
- Decisions:
  - A held request is a plain Submitted request in the queue with no Customer party (the case rule leaves it), listed in
    ChannelRouting for the manager and the administrator; Accept makes the sender (or a chosen customer) the customer.
  - A forum route's poster becomes the case's customer (the Customer role added): escalation is a moderator's deliberate act,
    not an unverified message. (Replaced in review, R2: only a served customer's poster; anyone else is held.)
  - An acknowledgement goes only for a new case, never for a held request, a reply or an automatic message; with no route a
    queue's mail makes cases unacknowledged and attaches automatic mail.
  - ChannelSessions is every Customer Service user's (the Cases area); Log a call needs SUPPORT_CASE_EDIT.
- Findings (provisional):
  - **F120** Design ChannelRouting said it "extends what exists instead of adding a route table", but RouteEdit's fields
    (sender and automatic-mail rules, the acknowledgement and its text, reply identity, the form's limit, the token's days, a
    forum site and category) have no holder in EmailRule, PartySetting or ServiceQueue: P6 adds the dated `ServiceRoute`; the
    mail itself stays the Comms rule and the token an ExternalAccessCapability. Design ChannelRouting changed.
  - **F121** BasicComms' Inbox renders no `message-actions` slot (only Chat's `chat-message-actions`, `voicemail-actions` and
    `call-actions`), so Create a case from a mail is a `widgets-extend` on MessageDetail; an Inbox slot is framework work (§7).
  - **F122** An `ext-action` with a transition target shows to every user of the screen (only a `screen` target is left out
    for a user who may not view it): Chat's and Voicemail's Create a case show to users without Customer Service and are
    refused by `create#CaseFromMessage`. Chat's `createFrom` calls every `create-from` provider and takes the first answer, so
    a second provider would break it: the case kind is in BOSS's one provider.
  - **F123** (F76 again) Rows in a demo file that the same file's demo service then locks against (a text block's group, a
    route's queue and organization, by foreign key) made that file's own-transaction order loads time out: the channel demo
    is a file of its own after BossZ.
  - **F124** §2 and design §8 say a bearer link is checked by `check#AccessToken`; per F61 the queue's token is checked by
    `ExternalAccess.check` (`formTarget`); design §8 NewCustomerCase changed.
- Left undone: the route's notification recipients (a held request waits in ChannelRouting and tells no one; a case is told
  through its own topics); chat bridges and CTI (ChannelAutomation, §7); a per-language acknowledgement; the public form page
  itself (P15); an Inbox message-actions slot (F121).

**Review Nov 5 (P6).** Checked both diffs against this section, §2, §4's Nov 5 rows, F10–F12, F61, F62, F79, F84 and the
lead's list: mail threading and spoofed senders, automatic-mail detection and acknowledgement loops, the party-less
RequestCategory kind, the forum poster under the case rule, the Comms hooks' visibility (F122), held requests' reach and
Accept, and leanness. Kept as built: the token join (the sender must be the case's customer side, and only the queue
organization's cases); the party-less kind (`check` refuses it to a signed-in contact, a token reaches only scope
CaseIntake and the form, which reads nothing back; a new token and Turn off revoke the earlier ones; Projects' `/r/<token>`
unchanged); detection (Auto-Submitted other than no, Precedence bulk/junk/list/auto_reply, X-Autoreply, a system sender);
the acknowledgement only for a new case (never a join, a held or an automatic message) and itself Auto-Submitted;
`publish#CaseReply` (posting rights through the forum's `caseStaff` and `canReply`, the preview hash, only the reply body
posted, no private comment). A forged From of a real customer makes a case of that customer whose acknowledgement goes only
to the customer's own address (`emailContactMechId` is the matched party's), echoing the subject; nothing is sent to the
forger. Fixes:
- R1 (high, Mantle) Threading by references trusted any sender: a Message-ID is known to every recipient, so a stranger's
  forged In-Reply-To or References joined their mail to another customer's case (and its customer-visible conversation).
  A reference join now needs the sender to be an address the referenced message was from or to (To, Cc), the request's
  customer side, or staff of the queue's organization; otherwise the message goes on as its own sender's (SupportChannels).
- R2 (high, Mantle) The forum route gave any poster the Customer role, so every escalated public topic became a case, against
  the Nov 5 rule and F79. The poster's served customer side (itself, or the customer it is a contact of) is the customer;
  any other poster (a public member, staff) leaves a request held for review in the queue, the poster its Customer party as
  with no route; Accept (`review#HeldRequest`) gives the poster the Customer role by the agent's decision, taking a held
  request's Customer party as its sender and keeping one Customer party. ChannelRouting's held list names the poster. The
  Built decision "a forum route's poster becomes the case's customer" is replaced by this.
- R3 (medium, Mantle and BOSS) A request in a service queue (held, or a case) with no project and a type an organization
  triages in Projects was visible to all its users through RecordVisibility's ProjIntake rule, told to every intake
  organization's triage assignee, and listed in Projects' requests; all three now leave out a request in a current service
  queue. A request held in a restricted queue is its team's only, as its cases are. Commons Today lists only assigned
  requests, so a held one (no assignee) is in no one's.
- R4 (medium, Mantle) Acknowledgement loops: an autoresponder that marks nothing and starts a new thread made a case and an
  acknowledgement per message; a queue's mail now acknowledges one address at most three times an hour (logged).
- Specs: Mantle SupportChannels (10 features, 3.2 s: forged references, the held forum poster accepted, the limit),
  SupportCases, WorkProjectRequests, RecordVisibility, CommonsToday, InboxThreads; BOSS CustomerServiceChannels,
  CustomerServiceAccess, ProjectRequests, Requests; mr-pass Forum, Integrations (as master's runtime links it); acceptance
  CustomerServiceChannelsWalk (5 features, the forum feature now holds and accepts). All pass.
- Left for the lead: F122 stays: an `ext-action`'s `condition` tests only the item's fields and `hook` only whether some
  app answers it, so hiding Chat's and Voicemail's Create a case from users without Customer Service needs framework support
  (a permission or app-root test on an ext-action, or a `screen` target the user may not view); the server refusal is the
  guard meanwhile. A case from a forged customer From is unavoidable without sender authentication (DKIM/DMARC results are
  not stored on EmailMessage); worth a later flag to hold mail failing DMARC. Cases with no project and a triaged type
  were in Projects' lists since P2 (R3 fixes them too).

### P7 — Case templates

Design §3 NewCase's CaseDescription, §9 CaseTemplates; CS-TEMPLATES, CS-FORM-ELEMENTS (the template fields).

- **CS-TEMPLATES** on DbForm (§4):
  - a template is a DbForm with dependency rows (source field, operator and value; target field; show or require) and
    an audience per field;
  - a template changes by effective-dated rows (§4), which P13's feedback forms reuse (F16): the framework's
    DbFormField and DbFormFieldOption gain `fromDate` and `thruDate` with their key fields audit-logged, and the
    dependency rows are effective-dated with theirs. A draft field has no from date and Publish starts it; an answered
    field or option is ended, never deleted; label, required and option edits are audit-logged; a field whose type or
    meaning changes, or a change set for a later date, is a successor field from that date. The form renders as of a
    date, now by default, and a FormResponse reads it as of its response time. No DbForm is cloned for a version;
  - a case's values are a FormResponse linked to the case;
  - `mantle.request.SupportCaseServices` `save#CaseTemplate` (`SUPPORT_POLICY_EDIT`) and `validate#CaseTemplate`, and
    the values checked by `validate#TemplateValues`, which NewCase and the Support app share (F41);
    `ironstone.customerservice.TemplateServices.find#Templates` for CaseTemplates.
    Conditions use a typed allowlist and refuse cycles; the server re-evaluates hidden and required fields; no scripts.
- **The template fields** (CS-FORM-ELEMENTS): rendered from the form in xml, html and the terminal, or the framework
  element P0 calls for.
- **Screens:** CaseTemplates (TemplateList, TemplateEdit, TemplatePreview for desktop, phone and terminal); NewCase's
  template step; CaseDetail's Overview with the values as submitted.
- **Usable when:**
  - a "Defective product" template requires a serial when the product is equipment, and the server refuses a submit
    without it;
  - an internal field never reaches the customer-visible variant;
  - a template changed from a date leaves an earlier case's values readable as submitted, with the form as it was
    then;
  - a dependency cycle is refused.

- **Built (framework), Nov 5, 2026** (mr-moqui, merged from cs/fw): dated DbForm rows (F70): `DbForm.isDated`, non-key
  `fromDate` and `thruDate` on DbFormField and DbFormFieldOption (and `replacesFieldName`), key fields audit-logged; on a
  dated form a draft is a row with no fromDate; a form is read as of a date (`dbFormAsOfDate`, `dbFormIncludeDrafts` for
  previews; `ec.screen.getFormNode(loc, asOf, drafts)`), and `get#FormResponse` reads it as of the response's date.
  `DbFormFieldDependency` (F69: source, operator equals, not-equals, empty or not-empty, value, target, effect show or
  require, dated, audit-logged) renders as `visible-when` (with a new `operator`) and the new `require-when` in qvt,
  qvt-static, html (the self-hosted `/js/moqui-form-when.js`, CSP-safe; a PASS page loads it itself) and tui. Services
  in `org.moqui.impl.ScreenServices` (`DbForms.js`): `set#DbFormDated`, `publish#DbForm`, `end#DbFormField`,
  `end#DbFormFieldOption`, `delete#DbFormFieldOption`, `create#DbFormFieldSuccessor`, `store#DbFormFieldDependency`,
  `end#DbFormFieldDependency` and `evaluate#DbFormDependencies`, which `validate#TemplateValues` calls. Undated forms keep
  the delete-and-recreate `update#DbFormField`. F71 fixed (qvt multi `depends-on` row suffix). Docs `docs/ui/Db-Forms.md`;
  specs framework `DbForms` and Rust `screen::tests::db_forms`; the gallery's Widgets "Field rules" form.
- **Review (framework), Nov 5:** qvt rules trim values and match multiple fields as html, tui and the server do; equals
  or not-equals with no value refused; a dated `update#DbFormField` cannot change dates or `replacesFieldName`; cycle and
  duplicate checks at every date; forms extending a DbForm not cached; a field with no type left out, not fatal; dead
  code removed; the gallery form; `moqui-form-when.js` drops removed boxes; publish, successor, dependency and end
  changes start or end now or later, never in the past, and a published dependency is ended and replaced, never edited.
  `./moq test-framework`'s failures were the load (three moqui-host tests pass by name) and two ConfReload features that
  need mr-mantle's demo user in an empty worktree runtime. Left: qvt `require-when` covers text-line, password and
  date-time only (§7).

**Built Nov 5 (P7, Mantle and BOSS).**
- Mantle entities (`entity/SupportTemplateEntities.xml`, new): `DbForm.ownerPartyId` (the organization whose template it is,
  audit-logged; purpose `DbfpCaseTemplate`) and `DbFormField.audienceEnumId` (`CaseFieldAudience`: `CfaCustomer`,
  `CfaInternal`; empty is internal; audit-logged), both on the framework's rows (F125); `CaseProfile.formResponseId` (the
  case's values) beside the existing `templateFormId`.
- Mantle services (`service/mantle/request/SupportCaseServices.xml`, appended; `CaseTemplates.js`, new): `save#CaseTemplate`
  (a new dated DbForm of the organization, its name and notes; Publish from a date, refused while `validate#CaseTemplate` finds a
  problem, TEMPLATE_INVALID; a queue's use of it from now, a new ServiceQueue row, TEMPLATE_NOT_PUBLISHED before it is published),
  `save#CaseTemplateField` (a draft; a draft changed in place; a published field's label, help, required flag, order and options
  in place from now; a new type or audience, or a change from a later date, a successor field through
  `create#DbFormFieldSuccessor`), `save#CaseTemplateCondition` (a condition row over `store#DbFormFieldDependency`: equals and
  not-equals only on a choice field and one of its options, empty or not-empty on any, CONDITION_AUDIENCE for a customer field
  on an internal one, CONDITION_CYCLE and CONDITION_DUPLICATE from the framework), `end#CaseTemplatePart` (a field, option or
  condition ended at a date, a draft deleted), all SUPPORT_POLICY_EDIT and the template's organization; `validate#CaseTemplate`
  (the problems, and sample values checked for both audiences; SUPPORT_POLICY_EDIT or SUPPORT_CASE_EDIT), `validate#TemplateValues`
  (`evaluate#DbFormDependencies` re-evaluating shown and required fields, a hidden field's value dropped, each value of its type, a
  customer's value for an internal field refused, FIELD_NOT_OFFERED; with refuse, TEMPLATE_VALUES_INVALID), `get#CaseTemplate`
  (the agent's form, with its drafts the editor's rows; the customer's projection: customer-visible fields and the rules among
  them only, never a draft, needing no permission) and `get#CaseTemplateValues` (a case's values with the form as of the
  response date, the customer's audience leaving out every internal field). The typed allowlist: short and long text, choice list,
  choice buttons, checkboxes and a date; no `${` in a label, help, option or value (NO_EXPRESSIONS); a field name never one of the
  case's own fields (FIELD_NAME_INVALID, F129). `create#Case` takes `templateFormId` (one of the organization's, else the queue's)
  and `templateValues`, checks them before anything is made and keeps them as a FormResponse linked from the profile;
  `save#ServiceQueue` keeps the row's template (F127).
- BOSS (`service/ironstone/customerservice/TemplateServices.xml` and `Templates.js`, new): `find#Templates` (TemplateList),
  `get#CaseTemplateChoice` (NewCase's step) and `get#ConditionValues` (a condition row's values); `Configuration.js` exports its
  settings organization. Screens: `Settings/CaseTemplates.xml` (new): TemplateList with New template; with formId TemplateEdit
  (the record header with Publish and More: Use for a queue, Rename; the problems; Fields with Add field, Edit and End, each with
  its audience chip; Conditions as a non-multi editable form-list, a row per condition and a blank one to add, the value options
  following the source field by `depends-on`, F71) and TemplatePreview (the agent's form with its drafts, `dbFormIncludeDrafts`,
  as NewCase renders it, in qvt for desktop and phone and tui for the terminal; the customer's fields; a check of sample values
  for both audiences); `Cases/NewCase.xml` the template step (a Template choice in the first step, the queue's by default; SubmitCase
  `dynamic="true"` extending the DbForm, its fields with `fields-not-referenced`; createCase passes the values to create#Case);
  `template/CustomerServiceTemplates.xml` (new) CaseDetail's Overview values (as submitted, each with its audience) included by
  `template/CustomerServiceCaseDetail.xml`; SettingsHome's Case templates link.
- Demo (`BossCustomerServiceDemoData.xml`): Retail's "Defective product" template `BOSS_CS_TPL_DEFECTIVE` (what kind of product,
  customer-visible; the serial number, shown and required when the product is equipment; when the problem started, a date; the
  agent's first assessment, internal), published from the start and used by the Support queue. Nothing is required by default,
  so a case of the queue with no values (the earlier walks', P5's and P6's) is made as before.
- Specs: Mantle `test/request/SupportTemplates` (4 features, 1.5 s: the fields, options and conditions with the allowlist's
  refusals, Publish and the queue's use kept by save#ServiceQueue; validate#TemplateValues' hidden, required, choice and audience
  checks; create#Case's refusal without the serial, the values kept and the customer's projection, a queue with no template
  unchanged; a change from a date leaving an earlier case's values as submitted). BOSS `CustomerServiceTemplates` (2 features,
  0.3 s: find#Templates and NewCase's choice; TemplateEdit's one qvt render with the preview's check), `CustomerServiceAccess`
  (+1 feature: the administrator saves a template and the manager may not; another organization's template and case values
  refused; NewCase offers another organization's template to no one) and `CustomerServiceCases` (NewCase's one render shows the
  template step). Acceptance `test/acceptance/CustomerService/CustomerServiceTemplatesWalk` (the usable-when, 5 features: the
  serial refused and the values kept and shown on CaseDetail's Overview; no internal field in the customer's projections; a
  template built in CaseTemplates with its cycle refused; a change from a date leaving the earlier case's values with the old
  label and options; TemplatePreview in qvt and tui), all pass, and `AppStructure` (the CaseTemplates route), passing.
- Tests run (all pass): Mantle SupportTemplates, SupportCases, SupportSla, SupportKnowledge, WorkProjectRequests,
  RecordVisibility, RecordLinks, WorkProjectClients, CommonsToday, OrderToCashBasicFlow, ReturnToResponseBasicFlow,
  ShipmentReturnMisc, WorkPlanToCashBasicFlow (173 features); BOSS CustomerServiceTemplates, CustomerServiceAccess,
  CustomerServiceCases, CustomerServiceOrders, CustomerServiceKnowledge; acceptance CustomerServiceTemplatesWalk and AppStructure.
  `moqui lint --screens`: 136 flagged sites, as master; none in the Customer Service screens.
- Inventories: usl-inventory's P7 table (the Mantle template services and the framework DbForm services they call);
  ss-inventory's NewRequestForm row (NewCase's template step). CaseTemplates is new (design §2): no baseline form maps to it.
- Decisions:
  - The audience lives on the field's own row (`DbFormField.audienceEnumId`, a Mantle extension), not in a DbFormFieldAttribute
    or a Mantle record by formId and fieldName (F125).
  - A case takes the template chosen in NewCase's first step, else its queue's; `ServiceRequestType.templateFormId` is not read
    (a type's template waits for a type that needs one, P11's warranty claim).
  - Published changes of label, help, required, order and options apply from now, in place and audit-logged; Publish starts the
    drafts; a later date or a new kind or audience is a successor field.
  - The customer's projection of a template, and of a case's values, checks the user's organization until P15 adds the
    contact's path (ExternalAccessContact) (Review R5).
- Findings (provisional):
  - **F125** The audience: a DbFormFieldAttribute is neither dated nor audit-logged and goes onto the rendered widget as an XML
    attribute, and a Mantle record by formId and fieldName would be a second dated row to keep in step with every successor.
    `DbFormField.audienceEnumId`, extended by Mantle as F6 gave RequestCategory its owner, is dated and audit-logged with the
    field, so a response reads the audience it was submitted under; a published field's audience changes only by a successor, so
    an internal answer never becomes customer-visible. The template's organization is `DbForm.ownerPartyId` the same way.
  - **F126** `create#DbFormFieldSuccessor` copies a fixed list of DbFormField fields, so an extension field (the audience) is not
    copied; `save#CaseTemplateField` sets it on the successor. The suspicion that the framework's `update#DbFormField` (or the
    entity-auto `update#DbForm`) clears the non-key fields it is not given is false (Review: checked by a call with the title
    only, the audience, required flag, help, type, order and `ownerPartyId` kept).
  - **F127** `save#ServiceQueue` (P2) made each row from its parameters, so any queue save dropped the row's `templateFormId`
    (and would drop P5's `assignmentRuleId`); it now keeps the template unless one is given. P5 must carry its rule the same way.
  - **F128** qvt's browser `require-when` covers text-line, password and date-time only (§7): the demo's serial (a text line)
    gets the browser's hint; a required choice or checkbox is the server's check alone, which NewCase reports on submit.
  - **F129** NewCase's SubmitCase extends the template's DbForm, so one submit carries the case's fields and the template's: a
    template field never takes the name of a create#Case parameter or Request field (reserved in Mantle), and createCase passes
    the request's parameters, of which Mantle keeps the template's fields only.
  - **F130** A condition on a text or date field by value (equals) is refused (a typed allowlist: values compare only against a
    choice's options), so a condition's value is always one the source offers and can be checked when the source's options
    change.
- **Review (P7), Nov 5:** checked the audience on every read (the customer's projection and case values at any date, drafts
  and successors), validate#TemplateValues against evaluate#DbFormDependencies, create#Case's check before any write,
  NewCase's and CaseDetail's forms as of now and of the response date, the organization on every read, and F126 (false, see
  there). Fixes:
  - R1 (high) A published change could leave the form breaking its own rules with no check: `create#DbFormFieldSuccessor`
    copies the old field's conditions, so a field made internal from a date kept a customer field depending on it (the server
    then hid the customer's answer by an internal value), a new kind kept a by-value condition on a field no longer a choice,
    and ending an option (in place or by End) left a condition comparing it. Now `keepValid`: a successor from a date, an
    in-place change and an ended option are refused, nothing changed, when they add a problem as of then (TEMPLATE_INVALID),
    and `validate#CaseTemplate` names a by-value condition on a field that is not a choice (CONDITION_OPERATOR).
  - R2 (medium) A text value holding `${` was taken, though the allowlist refuses it: now NO_EXPRESSIONS.
  - R3 (low) A multiple choice submitted as a list (a host List) was read as one text: values are read as lists.
  - R4 (low) NewCase sets `dbFormAsOfDate` and `dbFormIncludeDrafts` itself: db_form reads them from the context, which holds
    the request's parameters, so `?dbFormIncludeDrafts=true` rendered a template's drafts.
  - Left for the lead: (a) framework: any screen extending a DbForm takes `dbFormIncludeDrafts`/`dbFormAsOfDate` from request
    parameters (a PASS customer page would show drafts and internal drafts); db_form should read them only from actions or an
    attribute. (b) Marble's Survey screens (`SimpleScreens/Survey/Fields.xml`, `EditSurvey.xml`) edit any DbForm by formId,
    a case template among them, past Mantle's allowlist (`${` in a label, the audience); they should refuse a form with a
    purpose other than a survey's. (c) The customer projection (`get#CaseTemplate`, `validate#TemplateValues` customer)
    checked no organization (fixed, R5). (d) A queue whose template requires a field refuses a create#Case with no values:
    P6's channel intake must not go through create#Case's template check, or pass `templateValues`. (e) fixed, R6.
  - R5 (medium) `get#CaseTemplate` and `validate#TemplateValues` with the customer audience now need the template's
    organization, as the agent's reads (RECORD_UNAVAILABLE); P15 adds the contact's path.
  - R6 (medium) NewCase built its template step for the type's queue, so a queue changed in step two to one with another
    template had that template's required fields demanded unseen: createCase now refuses a queue whose template is not the one
    shown (the step's queue in a hidden `templateQueueId`), naming the template to choose in step one.

- **Wave 4 suites (Nov 5, on master after P5, P6 and P7 merged and the framework's drafts fix, the binary rebuilt,
  nothing else running):** standalone mr-mantle 1,714 passed, 2 failed (the baseline), 11 skipped; `./moq test-apps`
  3,020 server features passed and 1 failed (ProjectsSettings found "Support" in Projects' QuickCreate: the project
  that Mantle's SupportCases spec makes and never removed, in the same worker; SupportCases now cleans it up, and
  CustomerServiceAccess compares only the demo's queues, which SupportCases' team queues had also met), 14 client
  features passed; within every budget (server: mr-mantle 309.4 of 335 s, mr-boss 221.6 of 245 s, mr-pass 11.9 of 15
  s; client: mr-boss 41.5 of 44 s); `moqui lint --screens` clean. The framework suite met BasicComms' user search
  failing on `_agent`: `search#Users` put the term into LIKE unescaped, so the `customerservice.agent*` demo users
  matched; the term's `%`, `_` and `\` are escaped now (mr-moqui 1916b57f).

### P8 — Merge, split and closing

Design §3 MergeCases and SplitCase, §9 StatusCategories' closing and ServiceDefaults' auto-close; CS-MERGE and
CS-JOBS.

- **CS-MERGE.**
  - `mantle.request.support.CaseRelation`, a record of its own because it is lineage: source and target, merge, split or
    follow-up, actor, time, reason, evidence references and the SLA obligations carried.
  - `mantle.request.SupportCaseServices`: `preview#MergeCases` and `merge#Cases` (`SUPPORT_CASE_MANAGE`; same customer
    and organization; every case locked; the survivor's clock kept, the sources' obligations and breaches carried; a
    source non-actionable with a redirect); `preview#SplitCase` and `split#Case` (`SUPPORT_CASE_EDIT`; selected
    messages referenced within their audience; the clock from the issue's receipt, or a manager's reason).
- **Closing.** The reopen window from ServicePolicy (§4: 14 days); a reply after it, or after auto-close, makes a
  follow-up case linked by CaseRelation; a cancelled case is only followed up. The auto-close job (CS-JOBS),
  `SupportCaseServices.close#ResolvedCases`, sets `CaseProfile.closedDate`, keeps `ReqCompleted` and is idempotent.
- **Screens:** MergeCases (MergeSelection, MergePreview, MergeConfirm); SplitCase (SplitSelection, SplitNewCase);
  CaseDetail's lineage and a merged source's redirect.
- **Usable when:**
  - merging two of CustJqp's cases keeps both histories with their audiences, the survivor's clock and the source's
    breach; merging cases of two customers is refused;
  - a message split into a new case starts its clock at that message's receipt, and the source stays open;
  - a reply 20 days after resolution makes a linked follow-up case; one within 14 days reopens;
  - auto-close sets the closed date, and a rerun changes nothing.

**Built Nov 5 (P8).**
- Mantle entities (`entity/SupportRelationEntities.xml`, new): `mantle.request.support.CaseRelation` (from and to case, type
  `CaseRelationType` CrtMerge, CrtSplit, CrtFollowUp, organization, user, date, reason, operation key, the source's revision)
  and `CaseRelationItem` (`CaseRelationItemType`: a message with its mail, a file, a linked record, a work item or a clock the
  merge carried with its copy; the audience `CaseFieldAudience` as on the source; `toRequestId`, the case it was referenced
  on); `CaseSlaEpisode` gains `carriedFromEpisodeId` and `caseRelationId`; the view `CaseRequestOrganization`.
  `MantleSetupData.xml`: the state `SlsMerged`, the events `SetMerged` and `SetCarried`, the ServiceJob `close_ResolvedCases`
  (hourly, 200 a batch).
- Mantle services (`service/mantle/request/CaseRelations.js`, new; appended to `SupportCaseServices.xml`):
  `preview#MergeCases` and `merge#Cases` (SUPPORT_CASE_MANAGE; the cases of the user's organizations, locked in id order; one
  customer and organization, CUSTOMER_MISMATCH and ORGANIZATION_MISMATCH naming the case; none closed, cancelled or merged,
  the kept case open, TARGET_NOT_OPEN; at most 10, SAME_CASE; a reason; STALE_CASE by the previewed revisions; the operation
  key answering a retry), `preview#SplitCase` and `split#Case` (SUPPORT_CASE_EDIT, another agent's case SUPPORT_CASE_MANAGE;
  an open case not merged, CASE_NOT_OPEN; the messages, records, work and files chosen, EVIDENCE_UNAVAILABLE for one not on
  it; the clock from the earliest chosen message's receipt, or a manager's start with START_REASON_REQUIRED and DATE_INVALID;
  the queue's rules assign it unless an assignee is given; no template values unless given; operation key and revision),
  `create#FollowUpCase` (an agent's follow-up of a closed or cancelled case or one past its window; CASE_OPEN,
  CASE_REOPENABLE), the internal `make#FollowUpCase` (after the commit of a reply), `get#CaseLineage` (the case's relations
  with their items and audiences, its redirect, closed, reopenable, follow-up) and `close#ResolvedCases` with the internal
  `close#ResolvedCase` (each organization's current autoCloseDays; a case with a clock still running refused, CLOCK_OPEN,
  and named; idempotent). A merge references the source's messages on the kept case (RequestCommEvent, each
  CommunicationEvent as it was), links its records and work, lists its files, carries each open clock as an obligation
  (`Sla.js carryOnMerge`, F137) and leaves the source cancelled as a duplicate when open (RrDuplicate) and closed.
- Mantle changes to existing code: `SupportCases.js` refuses an update, move or tags of a merged case naming the kept one
  (CASE_MERGED) and `notify#CaseCustomerReply` skips a message a merge or split referenced; `Sla.js`: a case's own clocks and
  the carried ones (`openEpisode` own only; a response meets both, a pause, resume, resolve or cancel acts on both, a reopen
  starts from the own clock; `get#CaseSlaHistory` labels a carried clock with its case and lists it before the own one),
  a referenced message records nothing, and a customer reply goes on, beside P4's `endCustomerWait`, to
  `CaseRelations.js replyArrived` (a merged case: the message referenced on the kept case; resolved within the reopen window:
  reopened by the workflow's move back to an open status, the status rule starting the new resolution episode; past it, closed
  or cancelled: the follow-up after the commit, or the open follow-up it has; a message older than the resolution nothing);
  `Channels.js resolveMail` (P6's threading, after R1's sender checks): a mail answering a merged case joins the kept case,
  the customer side's own mail to a closed or cancelled case or one past its window makes its follow-up (`followUp`, in the
  intake's transaction, acknowledged as a new case) or joins the open one, `preview#ServiceRoute` showing it.
- BOSS: `Cases/MergeCases.xml` (MergeSelection: the kept case from CaseDetail and the customer's other open cases; MergePreview:
  the cases side by side, the clocks carried, the problems; MergeConfirm: the reason, the revisions and an operation key;
  check#Record caseManage on each case) and `Cases/SplitCase.xml` (SplitSelection: the messages oldest first with their
  audience, the records, work and files; SplitNewCase: subject, type, queue, priority, assignee, description, a manager's
  start and its reason), both out of the menu; `template/CustomerServiceLineage.xml` (new: a merged case's redirect and a
  closed case's note above the header, Open a follow-up case as a closed or cancelled case's primary action, Merge cases and
  Split into a new case in More, Overview's Lineage box; `followUpCase` included by Shared/RequestDetail), included by
  `template/CustomerServiceCaseDetail.xml`; `CaseServices.get#CaseDetail` (`Cases.js`) reads the lineage (Mantle's
  get#CaseLineage), gives no moves or edits to a merged or closed case and says `canMerge`, `canSplit` and `canFollowUp`;
  `CustomerService.js` linkPaths `Cases/MergeCases` and `Cases/SplitCase`.
- Demo: none; the demo cases stay as they are (the walk makes its own).
- Specs: Mantle `test/request/SupportRelations` (5 features, about 2.4 s: the merge keeping the kept case's clock and
  carrying the source's breach, its messages referenced as no reply, the source no longer worked, a retry and the refusals;
  the split's clock from the message's receipt, the source open, a manager's start and the refusals; a reply reopening within
  the window, making follow-ups after it and to a cancelled case, going to the kept case of a merged one, and nothing on a plain
  request; auto-close with a failing case named and a rerun changing nothing, a reply after it a follow-up; mail threading to
  the kept case and a closed case's follow-up) and `test/request/SupportSla` (its status events read in order, F142). BOSS
  `CustomerService/CustomerServiceRelations` (2 features, about 0.3 s: CaseDetail's merge and split by capability; MergeCases'
  and SplitCase's one qvt render) and `CustomerServiceAccess` (+1 feature: merge the manager's and not the agent's, split a case
  editor's and not the reader's, another organization's case and lineage refused). Acceptance
  `test/acceptance/CustomerService/CustomerServiceRelationsWalk` (the usable-when, 4 features, all pass) and `AppStructure`'s
  fixtures for the two screens (18 features pass).
- Tests run (all pass): Mantle SupportRelations, SupportSla, SupportCases, SupportChannels, SupportAssignment,
  SupportReplies, SupportTemplates, SupportKnowledge, WorkProjectRequests, RecordVisibility, RecordLinks, WorkProjectClients,
  CommonsToday, OrderToCashBasicFlow, ReturnToResponseBasicFlow, ShipmentReturnMisc, WorkPlanToCashBasicFlow (200 features;
  SupportSla failed once there before F142, and passed alone and after); BOSS CustomerServiceRelations,
  CustomerServiceAccess, CustomerServiceCases, CustomerServiceChannels, CustomerServiceAssignment, CustomerServiceTemplates,
  CustomerServiceKnowledge, CustomerServiceOrders, Requests, ProjectRequests, MergeRequests, WorkItemDetail (85 features);
  acceptance CustomerServiceRelationsWalk (4) and AppStructure (18). `moqui lint --screens`: 136 flagged sites, as master;
  none in the new screens.
- Inventories: usl-inventory's Customer Service P8 table; no ss-inventory row is designed for MergeCases or SplitCase (new in
  design §2, no baseline form).
- Decisions:
  - The source of a merge is closed (`CaseProfile.closedDate`) and, when open, cancelled with the resolution Duplicate, so it
    leaves every open list and view; a resolved source keeps ReqCompleted. Its CaseDetail stays readable with the redirect,
    which opens the kept case through CaseDetail's own check.
  - A merge references messages (the same CommunicationEvent on both cases, so a customer-visible one stays so and a note stays a
    note) and links records and work; files stay on the source and are listed in the lineage (re-authorized, never copied).
  - A reply reopens only from the customer side (the case's customer, reporter or a contact of its customer) and only when it
    is newer than the resolution; staff mail and automatic mail to a closed case join it as before.
  - The kept case must be open, the sources open or resolved (not closed, cancelled or merged); merge is offered from the kept
    case's CaseDetail (More), over the customer's open cases.
  - Auto-close runs hourly; with no `autoCloseDays` in an organization's policy (the demo's), nothing closes there.
- Findings (provisional):
  - **F135** No request merge exists in Commons or Projects to keep: BOSS's MergeRequests spec is Projects Code's git merge
    requests (`moqui.resource.GitMergeRequest`), untouched by case merges (it passes).
  - **F136** ServicePolicy already had `reopenWindowDays` and `autoCloseDays` (P2), and `transition#Case` already refused a
    reopen past the window (REOPEN_WINDOW_PASSED) or of a closed case (CASE_CLOSED); P8 adds the customer's reply path, the
    follow-up and the job that sets the closed date.
  - **F137** "Obligations carried" needs a record of each: a merge copies each open clock of the source onto the kept case
    (`CaseSlaEpisode.carriedFromEpisodeId`, its start, due, pauses and breach kept), which then follows the kept case's own clock
    of its kind, and the source's own clock ends `SlsMerged` with its figures. So compliance counts the copy and never the
    Merged clock, and a breach is never counted twice; Home's measures already read only met, missed, running, paused and unmet
    clocks, and P14's reports must too. Design MergeCases changed.
  - **F138** A message referenced on another case (RequestCommEvent) fires that case's RequestCommEvent rules as a new
    response or customer reply; the CaseRelationItem is written before the link, and `Sla.js recordMessage` and
    `notify#CaseCustomerReply` skip a message referenced there. `delete#RequestComment` on either case deletes the comment from
    both (§7).
  - **F139** The follow-up of a reply that is not mail runs after the commit (`make#FollowUpCase` by `registerOnCommit`): the
    reply's transaction is its caller's (Chatter, a filing) and a failed insert would abort it on PostgreSQL. A mail's follow-up
    is made in the intake's own transaction (`resolveMail`). The after-commit call runs on the real clock, not a spec's effective
    time, so SupportRelations makes the cases it follows up in the past and moves ahead only for the mail and the job.
  - **F140** `close#ResolvedCases` takes a batch by `lastUpdatedStamp` before the cutoff (resolving is an update, so the
    stamp is at or after it; the per-case check reads the status audit log), so cases of organizations without auto-close or
    resolved recently never fill the batch. `lastUpdatedStamp` is the transaction's real start time, not the effective time.
  - **F141** A second reply to a closed case would make a second follow-up; it joins the follow-up still open instead (mail
    and other replies alike).
  - **F142** SupportSla's status-event check read events with no order, which a longer run returned out of order (the
    table's order after updates); it sorts them by id.

**Review Nov 5 (P8).** Checked against design §3 MergeCases/SplitCase, §9 and §2. Merge: one transaction, the cases locked
(FOR UPDATE) in id order with nothing locked before them, so two merges, a merge and a split, and a merge beside update#Case or
transition#Case (one request each) cannot deadlock on requests; a reply racing a merge waits on the source's lock (its
RequestCommEvent's key share on PostgreSQL) and then goes to the kept case by `replyArrived`. Audience: referenced messages are
the same CommunicationEvent, so a note stays a note on the kept case and on a split case; items are written before the link, so
`recordMessage` and `notify#CaseCustomerReply` count none; a redirected or follow-up reply has no item and counts once where it
lands. SLA: a running clock is copied with its due and breach and the source's ends Merged (never counted), an ended breach
stays on the source, so a breach counts once; split's clock from the earliest chosen message's receipt or a manager's start with
its reason; a reopen within the window is the status rule's new episode, the first breach kept; `endCustomerWait` acts only on a
paused case and `replyArrived` only on a resolved or cancelled one, never both. Threading: the merged-source redirect comes
after P6's `senderOnRequest`/`tokenCase` checks on the source, and the kept case has the same customer; staff and automatic mail
to a closed case join it. Access: the new transitions call AccessServices.check#Record for each case and the Mantle services
check their permission and organization. F139: the after-commit follow-up is dated by the reply's receipt; no effective-time
spec depends on it. Fixes:
- **R1 (medium)** `delete#RequestComment` on either case deleted a referenced comment from both (F138): `check#RequestComment`
  refuses deleting a comment a CaseRelationItem references, naming the other case (acts only on a case relation);
  SupportRelations asserts it.
- **R2 (medium)** `close#ResolvedCases` reads oldest first by `lastUpdatedStamp`, so resolved cases with a clock still running
  (CLOCK_OPEN) stayed first every run and could fill the batch for good; they are named without taking a place in it (a window
  of 5x the limit is read). It takes `requestIds`, and the acceptance walk and SupportRelations close only their own cases (the
  walk had closed every resolved Retail case in the shared acceptance database). The stamp pre-filter skips no case for good: a
  resolved case's stamp is at or after its resolution and ages past the cutoff.
- **R3 (medium)** `scan#CaseSla`'s `mark` locked an episode, then inserted a CaseSlaEvent (a key share on the request), while
  update#Case, transition#Case and merge#Cases lock the request FOR UPDATE, then write its episodes: a deadlock on PostgreSQL
  (since P4; the merge added a path of that shape). `mark`, `correct#CaseSla` and record#CaseEvent's message rule (Sla.js
  `lockRequest`) now lock the request FOR UPDATE first, then the episode. The status rule runs after its request's update
  (request first already); the work rule writes no episode.
- Left for the lead: P14's reports must read only met, missed, running, paused and unmet clocks, never SlsMerged (F137).
- Specs run: Mantle SupportRelations (5), SupportSla (8), SupportCases (11), SupportChannels (10), RecordNotes (7),
  CrmMiscServices (7); acceptance CustomerServiceRelationsWalk (4); all pass.


### P9 — Returns

Design §5 Returns, NewReturn, ReturnDetail, QualityInspection and Approvals, §9 ReturnPolicies; CS-RETURN-POLICY,
CX-RETURNS, CX-APPROVAL. On Accounting P17's settlement and receipt and Warehouse P8 and P14 (F25).

- **CS-RETURN-POLICY**, the CX-RETURNS policy records Accounting §7 leaves here.
  - `mantle.order.return.ReturnPolicy`, effective-dated rows by organization with their key fields audit-logged:
    store or customer group, product category, window from shipment or delivery, authorization validity, self-service,
    reasons and remedies, proof, destination, exception approver, receiptless eligibility, advance replacement or
    instant credit, restock fee rule and cap, instructions; and return reason rows over the ReturnReason enums.
  - ReturnHeader's `customerReference` and authorization expiry, audit-logged; the assignee as a dated ReturnParty row
    (F24). `externalId` and `originId` stay integration keys.
  - The authorization decision, a record of its own (as PurchaseApprovalDecision): the return and its revision, the
    policy row, the actor, the time and any exception.
  - `mantle.order.ReturnPolicyServices`: `find#Policies`, `save#Policy` (`RETURN_POLICY_EDIT`),
    `evaluate#ReturnPolicy`, `find#ServiceReturns`, `find#ReturnApprovals`, `submit#CustomerReturn` (over
    `update#ReturnItem` and `request#Return`), `authorize#Return` (`RETURN_AUTHORIZE`; wrapping `approve#Return`;
    `responseImmediate` N unless the policy allows it and the actor holds `RECEIVABLE_EDIT` for a credit or
    `PAYMENT_EDIT` for a refund; no settlement; the RMA PDF stored as ReturnContent), `close#ReturnRemainder`, and
    `decide#ReturnException` (`RETURN_EXCEPTION_APPROVE`).
  - Eligibility under a lock per source order item, against shipped and invoiced quantities less earlier returns,
    including drafts; `update#ReturnItem` from BOSS goes through the same check (F21). Unreferenced goods only by a
    manager's exception. No fee without a published rule, and with no matching policy the return goes to manual review
    (§4).
  - Cancel before any effect cancels the return shipment approval made (F22); Mantle's `add#ReturnToShipment` field fix
    if Warehouse P14 has not made it (F23).
  - The RMA link: `ExternalAccess.js` gains the ReturnHeader record kind with an RMA scope, the token
    CustomerReturn takes (P15).
  - The `ReturnExceptionApproval` topic, seeded in mr-mantle with approve and refuse handlers over
    `decide#ReturnException` on Purchasing P4's decision pattern (F44).
- **Screens:**
  - Returns: ReturnFind and ReturnList with the views of design Returns; batch authorize and cancel, a result per
    return.
  - NewReturn: ReturnSource, ReturnableLines and ReturnRequest, with the policy preview.
  - ReturnDetail: Accounting's `Shared/ReturnDetail` with the Customer Service row of crosscut §3.18: authorize, Issue
    return label through Warehouse P14's `request#ReturnLabel`, close a remainder, cancel before any effect; receive
    in this context through Warehouse's `receive#ReturnItems` for W, and preview and settle through Accounting P17 for
    F; Files on ReturnContent.
  - QualityInspection: Warehouse's `Shared/QualityInspection` at `CustomerService/Returns/QualityInspection` with the
    Customer Service row: read for A and R, inspect and dispose for W (F38).
  - ReturnPolicies: ReturnPolicyList, ReturnPolicyEdit, ReturnReasons and ReturnPolicyPreview.
  - Approvals: Commons Notifications at `CustomerService/Approvals`, filtered to the service topics, the topic list
    Accounting P6 builds (impl-accounting §4; F14).
  - Home's AwaitingReturns and ApprovalsWaiting and the Request return shortcut; CaseDetail's request RMA; Customer360's
    Returns tab; OrderDetail's create return.
- **Shell:** the return palette type; quick create Request return; the return-decision notification topic.
- **Outputs:** the RMA authorization and instructions with the label, by email and `html-print`; the credit, refund or
  replacement notice through Accounting's `send#Invoice`, pending until Accounting says otherwise.
- **Usable when** (design §10, case to RMA to credit):
  - authorizing an RMA for two units of the delivered order creates the return shipment and no credit or replacement;
  - Issue return label returns the label from the test gateway, and a retry answers the same label;
  - the W agent receives one unit with a second rejected at the dock, then the last unit in a second box; inspection
    releases one unit to a waiting order and scraps another;
  - the AR return authorizer credits only what was received; a second credit beyond eligibility is refused; a
    receiptless credit needs `RETURN_CREDIT_APPROVE`, which `BOSS_ACCOUNTING_APPROVE` holds;
  - two drafts cannot together return more than was shipped; with no policy the return goes to manual review;
  - an agent with the A, R, W and F groups does all of this from Customer Service without the Warehouse or Accounting
    root; an agent alone sees disposition and credit read only.

**Built Nov 5 (P9).**
- Mantle entities (`entity/ReturnPolicyEntities.xml`, new): `mantle.order.return.ReturnPolicy` (dated, key fields audit-logged:
  store, customer group (PartyClassification), product category, window days from shipment or delivery (`ReturnWindowFrom`),
  authorization days, self-service, reasons and remedies allowed, proof, destination facility, the exception group,
  receiptless, advance replacement, instant credit, restocking fee percent and cap, instructions, `previousPolicyId`),
  `ReturnReasonPolicy` (dated rows over the ReturnReason enums: customer label, customer-visible, evidence, suggested remedy,
  inspection), ReturnHeader's `customerReference`, `authorizationExpireDate`, `returnPolicyId`, `policyEvaluatedDate` and
  `manualReview` (audit-logged), the dated `ReturnParty` (Assignee, F24) and `ReturnAuthorizationDecision` (PurchaseApprovalDecision's
  fields, F45; `ReturnDecision` enums RdAuthorized, RdExceptionRequested/Approved/Refused, RdCancelled, RdRemainderClosed).
- Mantle services (`service/mantle/order/ReturnPolicyServices.xml` over `ReturnPolicies.js`, new): `find#Policies`, `save#Policy`
  (RETURN_POLICY_EDIT; EQUAL_RANK_OVERLAP, STORE_UNAVAILABLE...), `save#ReturnReason`, `evaluate#ReturnPolicy` (per line: ordered,
  shipped, invoiced, on other returns not cancelled, drafts included, eligible; the policy by rank category > customer group >
  store > default; window, reason, remedy and unreferenced exceptions; the expiry, fee, instructions; outcome Eligible,
  ManualReview, ExceptionRequired, NotEligible), `save#ReturnItem` (F21: under locks on the return and the source order line;
  BOSS writes lines only through it), `assign#Return`, `submit#CustomerReturn` (operation key; case linked by
  `link#RequestRecord` on ReturnHeader, F47; the policy kept on the return; the label's carrier and service; requested unless a
  draft; the exception sent), `authorize#Return` (RETURN_AUTHORIZE; STALE_REVISION, EXCEPTION_REQUIRED, REASON_REQUIRED for
  manual review; responseImmediate N unless asked, allowed by the policy and RECEIVABLE_EDIT, PAYMENT_EDIT for a refund; the
  expiry; `approve#Return`, no settlement; the decision; the RMA PDF as ReturnContent RtcntAuthorization, a render failure
  logged; ReturnDecision to the assignee), `request#ReturnException`, `decide#ReturnException` (RETURN_EXCEPTION_APPROVE) with the
  topic handlers `approve#ReturnException`/`refuse#ReturnException` (recordEntityName, recordId, message, notificationMessageId,
  reason; the message's revision, REVISION_REQUIRED with none, STALE_REVISION, F46), `cancel#CustomerReturn` (RETURN_HAS_EFFECT),
  `close#ReturnRemainder`, `find#ServiceReturns` (views, the credited amount for PRICE_VIEW, ACCOUNTING_VIEW or RECEIVABLE_VIEW
  only), `find#ReturnApprovals`, `get#ReturnState`, `get#ReturnAuthorizationPrint` and `send#ReturnAuthorization`
  (`template/order/ReturnAuthorization.print.html.fancy`; OrderConfirmations.js's checked recipients and sender, `senderAccount`
  now exported). Mantle changes: `cancel#Return` cancels its return shipment when nothing was received on it and it carries only
  that return (F22); `add#ReturnToShipment` no longer sets the non-field `ReturnItemBilling.shipmentId` (F23; Warehouse P14 had not
  fixed it); `ExternalAccess.js` ReturnHeader kind (scope ReturnRma, RETURN_AUTHORIZE or SUPPORT_CASE_EDIT, vendor and customer,
  the Support app's CustomerReturn page, F61); `MantleSetupData.xml` the `ReturnExceptionApproval` (approve/refuse handlers,
  refuse reason required) and `ReturnDecision` topics.
- BOSS (`service/ironstone/customerservice/ReturnServices.xml` over `Returns.js`, new): `find#Returns`, `apply#ReturnBatch` (Done,
  Forbidden, Refused with Mantle's code, Failed per return, each in its own transaction), `prepare#Return`, `get#ReturnDetail`,
  `get#InspectionDetail`, `check#ReturnInspection`, `get#AwaitingReturns`, `get#CustomerReturns`, `get#ReturnPolicySettings`.
  `CustomerService.js`: the `return` record kind (ReturnDetail), returns in the palette, the choices returnReasons,
  returnResponses, returnOrders, returnAssignees, returnStores, returnCategories, returnCustomerGroups, returnFacilities, the P9
  linkPaths, and **`approvalTopics`, the one list of Approvals' topics** (ReturnExceptionApproval and OrderChangeApproval;
  get#SharedContext returns it; Approvals and Home read it, so P10 adds nothing there). Orders.js exports its recipient and sender
  options.
- Screens: `CustomerService/Returns.xml` a menu group with `Returns/Returns` (views, find, list, batch Authorize and Cancel),
  `Returns/NewReturn` (source, returnable lines as a multi form, the request with the policy preview, the label's carrier;
  submit#CustomerReturn), `Returns/ReturnAuthorization` (the RMA as html-print) and the mounts ReturnDetail
  (`template/CustomerServiceReturnDetail.xml`, Shared/ReturnDetail's Customer Service branch: Authorize, Request and Decide
  exception, Issue return label with weight and unit, Close remainder, Send and Print RMA, Assign, Cancel, line changes, Receive for
  W through `receive#ReturnItems`, Settle for F through `settle#Return`, shipment and label, inspections, settlement, decisions,
  cases, Files, Conversation) and QualityInspection (Shared/QualityInspection's Customer Service branch; WarehouseInspectionParts'
  inspect and dispose transitions check `check#ReturnInspection` here, F145); `Settings/ReturnPolicies` (list, New policy and
  Change from a date, End, reasons, preview); `Approvals.xml` the Commons Notifications mount; Home's Returns awaiting approval,
  Approvals waiting and Request return; CaseDetail's Request RMA (More); `Shared/Customer360/ServiceReturns` (Returns tab);
  OrderDetail's Create return. Shell: quick create `customerServiceReturn` (Returns area's groups), the two topics, `g r`.
  BossSetupData: the topics' links to ReturnDetail. Demo: Retail's policy `BOSS_CS_RPOL_RETAIL` (a year from delivery, defect,
  damage or wrong item; did-not-want needs an exception) and two reason rows.
- Specs: Mantle `test/order/ReturnPolicies` (8 features, about 2.5 s); BOSS `CustomerServiceReturns` (5 features, about 2 s: the
  scope, the reader refused, NewReturn and a return under Retail's policy, the batch with Forbidden, ReturnDetail's audience, the
  one qvt render of Returns, NewReturn and ReturnDetail; its returns cancelled at the end) and `CustomerServiceAccess` (+1 feature;
  the menu feature's quick creates and topics). Acceptance `CustomerServiceReturnsWalk` (the usable-when, 5 features: case to RMA,
  authorize with no credit, the test carrier's label and its retry, two boxes with a dock rejection, F credits only what was
  received and a second credit refused, release and scrap, the agent alone read only, two drafts over the shipped quantity, a
  receiptless credit refused without RETURN_CREDIT_APPROVE), `CustomerServiceFoundationWalk` (Request return in quick create; the
  client refused the return services), `AppStructure` (the P9 routes and mounts; placeholders 46).
- Tests run (all pass): Mantle ReturnPolicies, ReturnToResponseBasicFlow, ShipmentReturnMisc, OrderToCashBasicFlow,
  OrderProcureToPayBasicFlow, AccountingReturns, PurchaseReturns, SupportChannels, AccountingPortals (117 features); BOSS
  CustomerServiceReturns, CustomerServiceAccess, CustomerServiceOrders, CustomerServiceCases, WarehouseReturns,
  WarehouseInspections, PurchasingReturns, AccountingAccess, WarehouseAccess, PurchasingAccess, Notifications, ProjectsAccess,
  QuickCreate, AccountingReceivables; acceptance CustomerServiceReturnsWalk, CustomerServiceFoundationWalk, AppStructure. `moqui
  lint --screens`: 136 sites, as master. Mantle's WarehouseReturns spec was not rerun (no Warehouse Mantle service changed).
- Not done: ReturnAnalysis (P14); the credit, refund or replacement notice through send#Invoice (pending Accounting); the RMA mail
  takes a link but issues no Support capability itself (P15 builds the page); NewReturn's reasons show the enum names, not the
  organization's reason labels; SettingsHome has no Returns readiness row.
- Findings (provisional):
  - **F143** ReturnHeader has no revision field; a return's revision is the latest `lastUpdatedStamp` of its header, items and
    ReturnParty rows (ReturnPolicies.js `revisionOf`), which every path (Warehouse's receipt, settlement) moves.
  - **F144** ORG_ZIZI_RETAIL settles returns at Mantle's default (`returnSettlementRequired` N, which Mantle's return flows
    need), so Warehouse's `receive#ReturnItems` refuses its returns (RETURN_SETTLEMENT_OFF): ReturnDetail offers Receive only where
    the organization settles separately and says Mantle receives at delivery otherwise; the walk turns the flag on and restores it.
    For the lead: whether the Customer Service demo needs its own organization with the flag (as Warehouse's BOSS_WH_RETURNS).
  - **F145** Warehouse's inspection transitions checked Warehouse's scope, refusing a borrowed W without the Warehouse root
    (WAREHOUSE_UNAVAILABLE); WarehouseInspectionParts gains a Customer Service branch (`check#ReturnInspection`). Verification
    stays the quality verifier's (a different user, Warehouse); the inspection drop-downs are still Warehouse's choices.
  - **F146** A customer return shipment has no store and comes from the customer, so `request#ReturnLabel` finds no gateway
    unless its route segment names one (no organization default is read), and the test carrier needs a weight and unit
    (WEIGHT_REQUIRED): NewReturn takes the label's carrier and service, Issue return label the weight and unit, and the walk sets
    TEST_SHIPPING on the segment. For Warehouse (design-warehouse ReturnReceipt): the vendor's default gateway for a return.
  - **F147** With no policy the return is manual review: authorization needs a reason (recorded on the decision), not an
    exception; an exception (outside the window, a reason or remedy not allowed, goods with no order line) needs a manager's
    approval at the return's current revision first. Goods with no order line are entered with a description of the goods and
    ownership and always need the exception.
  - **F148** Under the default flag an immediate response is processed by Mantle at approval, as the acting user; the credit
    memo's Incoming to Approved transition needs `INVOICE_APPROVE` (StatusFlowTransition.userPermissionId), so an authorizer
    without it failed the whole authorization. Not a fresh-organization effect: any organization at the default flag hits it
    (review R1: an immediate credit or refund there also needs `INVOICE_APPROVE`, else it waits for receipt). The same
    transition runs in Mantle's own receipt at delivery (`respond#ReturnItems` as the receiving user) — for the lead.
  - **F149** F22 changes an existing Mantle service's behaviour (not a refusal): `cancel#Return` now cancels its unreceived
    return shipment; the compatibility specs pass.

**Review Nov 5 (P9).** Checked against the phase, §2 and the brief's points: eligibility and its locks, `authorize#Return`
and F25, F22, F145, audience, F144's walk cleanup, merge-friendliness, tests. Specs run (all pass): Mantle ReturnPolicies (9 features),
ReturnToResponseBasicFlow, WarehouseReturns, ShipmentReturnMisc, AccountingReturns, PurchaseReturns, OrderToCashBasicFlow;
BOSS CustomerServiceReturns, WarehouseInspections, WarehouseReturns, AccountingReceivables; acceptance
CustomerServiceReturnsWalk.
- R1 (high) An immediate credit or refund at authorization in an organization at the default flag (Retail's) failed the
  whole authorization for an authorizer without `INVOICE_APPROVE` (F148 restated). `immediateAllowed` needs it where Mantle
  answers at approval; the Mantle spec now runs at Mantle's default flag with a RECEIVABLE_EDIT-only authorizer (no
  immediate, no credit) and an `INVOICE_APPROVE` one (the credit made at approval).
- R2 (medium) `add#OrderItemToReturn` locks its order line: Warehouse's addReturnItem (Warehouse context only) adds customer
  return lines without `save#ReturnItem`, so two at once could exceed what is returnable; Mantle's own check (invoiced less
  every return not cancelled, drafts included) now runs under the same lock `save#ReturnItem` takes. Lock order: return then
  order line (`save#ReturnItem`, `authorize#Return`); receipt and settlement lock shipment then return and never the order
  line; P10 locks shipments, parts, order — no cycle.
- R3 (medium) The walk's last `then` had been joined by Prettier into one call expression (`a.includes(x)(b).includes(y)`);
  split. The walk adds the usable-when "with no policy the return goes to manual review" (Retail's order evaluated before its
  policy took effect).
- R4 (medium) The walk's cleanup restores Retail's `returnSettlementRequired` first, each step on its own (a failed cancel or
  grant end no longer skips it); its returns cancelled quietly. Workers run on their own database copy, so no other walk sees
  the flag mid-run.
- R5 (low) Merge-friendliness: ExternalAccess.js's Prettier churn of untouched lines reverted; OrderConfirmations.js's
  `senderAccount` export made identical to P10's on master.
- Checked, no change: F22 cancels only a ShipInput or ShipScheduled return shipment with no AssetReceipt that carries only
  this return (and `cancel#ReturnItem` refuses received items first); Mantle's callers pass. F145: the branch is
  `appRoot == 'CustomerService'` only, Warehouse's users unchanged (WarehouseInspections), the borrowed W acts only on
  inspections of returns of its organizations and customers (`recordOf`), `verifyInspection` has no Customer Service branch
  and `canVerify` is false. Audience: credited amounts for PRICE_VIEW, ACCOUNTING_VIEW or RECEIVABLE_VIEW (the agent reads
  credit, the usable-when), the settlement preview only for F; the RMA print carries no amount, cost or note; the ReturnHeader
  link kind resolves the customer and refuses a cancelled return.
- R6 (high, F25) Where the organization does not settle returns separately (Retail's default), Mantle's approval places a
  replacement order for every RrspReplace item whatever responseImmediate says (`respond#ReturnItems`; Mantle offers no
  per-item deferral). `authorize#Return` now refuses such a return (REPLACEMENT_AFTER_RECEIPT, naming the organization and the
  items) unless the line's policy allows an advance replacement, which is then the intended one; Mantle's own callers are
  unchanged. Spec: at flag N refused with no order, then authorized with the replacement order once the policy allows it.
- For the lead: (a) Warehouse's addReturnItem still checks invoiced, not shipped, and no policy;
  routing it through `save#ReturnItem` needs SUPPORT_CASE_EDIT or RETURN_AUTHORIZE, which W lacks. (b) Merging master
  (P10) conflicts in append points: MantleSetupData.xml, CustomerService.js, CaseDetail, CustomerServiceAccess.spec.js,
  CustomerServiceSpecLib.js, this plan.

### P10 — Order changes

Design §4 OrderChanges, OrderChangeDetail and OrderDetail's actions, §6 Product360's substitute; CS-ORDER-CHANGE,
CX-ORDER-CHANGE. On Accounting P10 and P17 and Warehouse P11 and P12.

- **CS-ORDER-CHANGE** on the change Request (§4):
  - the `RqtOrderChange` type; the proposal is the change Request, its lines RequestItems linked to their order items by
    RequestItemOrder (product, quantity, Purchasing P10's unit, ship date as `requiredByDate`), with the line action
    and proposed unit price RequestItem lacks; its key fields audit-logged, and its revision the time of the last
    key-field change. The design's OrderChange, OrderChangeLine and application records are not built;
  - `mantle.request.support.OrderChangeDecision`, a record of its own (as PurchaseApprovalDecision): the proposal and
    its revision, the approver, the decision, the reason, the time and the expiry;
  - `mantle.order.OrderChangeServices`: `save#OrderChange` and `preview#OrderChange` (`ORDER_CHANGE_REQUEST`; Products
    P5's resolver, availability, and the reserved, issued, shipped, billed and paid quantities), `decide#OrderChange`
    (separation by policy) and `apply#OrderChange`, each checking the permission of the change's kind:
    `ORDER_CHANGE_APPROVE` and `ORDER_CHANGE_APPLY` for cancel and substitute, Sales' `SALES_APPROVE` and
    `SALES_ORDER_CHANGE` for the commercial kinds (design §4, design-sales §6); and `find#OrderChanges` for
    OrderChanges and Sales' ChangeList;
  - the commercial revision (design §4, X2): the proposal binds `expectedOrderRevision`, the order's `orderRevision`
    narrowed to commercial changes, `increment#OrderRevision` no longer counting OrderContent, OrderNote and status-only
    part updates behind its crosscut CX-AUTOMATION flag, or `get#OrderCommercialSnapshot` if the flag is refused. P0
    checks whether Sales or Purchasing built it; if not, P10 builds it as Mantle's contract (crosscut
    CX-ORDER-AUTHORITY);
  - the customer cancel (design §4 Customer cancellation, X7): Shop's order page and the Support app (P15) file a
    cancel-kind proposal through `save#OrderChange` with `customerConsentRef` and the store's queue. Under
    ServicePolicy's `customerImmediateCancel` (P2, off by default), while nothing on the lines is reserved, picked,
    shipped or invoiced and the order is not approved, it is applied at once through `apply#OrderChange` with the
    policy as the recorded decision; otherwise the customer sees "Cancellation requested" and an agent decides.
- **`apply#OrderChange`** (D9, D7):
  - the order held through Accounting P10's `hold#Order` with the Change reason and released through
    `release#OrderHold` (F27); every check repeated under the lock. The order desk places the Change hold under
    `ORDER_CHANGE_APPLY` and releases it under X4's `ORDER_CHANGE_HOLD_RELEASE`: Purchasing P3 changes `hold#Order` so
    placing needs the order's change permission, not the release permission (crosscut §1.4), and P0 checks it landed;
  - the cancel kind: `cancel#OrderItem` for the open remainder, which re-reserves the line's remainder on its picked
    stock (Warehouse F262) and sets `ShipmentItemSource.putBackQuantity` where the line drops below what was picked,
    and `reduce#AssetReservation` (F28);
  - the substitution kind, on Warehouse P11's ShipmentPickException: the approved substitute line (a PatEquivalent or
    PatReplacement of the product, passing `check#ProductUsable`, with the customer's consent), the short remainder
    cancelled, and Warehouse picking it;
  - after pack and before ship, since the pack invoice is finalized only at ship (impl-accounting §4; F26), the path
    Warehouse built (WarehouseImplementation P12): the package reopened through `reopen#ShipmentPackage`, which
    releases the in-process invoice lines through `release#ShipmentInvoiceLines` with no RECEIVABLE_EDIT check
    (impl-warehouse F275); the line reduced through `cancel#OrderItem`; and the stock put back through `reverse#Pick`.
    The order desk holds no `SHIPMENT_PACK`, so P10 splits the reopen's work out of `reopen#ShipmentPackage` into an
    internal Mantle service that apply calls under `ORDER_CHANGE_APPLY` and the order's organization; it skips the
    `SHIPMENT_PACK` and user-facility checks, as the reopen skips RECEIVABLE_EDIT on `release#ShipmentInvoiceLines`,
    and keeps the state, confirmation and reason checks. Apply never calls `release#ShipmentDraftInvoice` or
    `refund#OrderPayment`, which need the RECEIVABLE_EDIT and PAYMENT_EDIT the order desk lacks; a refund of a
    captured payment stays an F action. After ship the change is `AlreadyShipped`, and a return handles it;
  - the named failures `StaleOrder`, `StockChanged`, `AlreadyShipped`, `BillingConflict`, `ApprovalExpired`,
    `Forbidden` and `ClosedPeriod`, each leaving the order unchanged;
  - price, quantity increase, ship date, address, ship method and carrier are filed here and routed to the order
    owner, which decides and applies them under its `SALES_*` permissions, never here (§7).
- **Shell:** the `OrderChangeApproval` topic; OrderChanges in the palette; the order-change confirmation email.
- **Screens:** OrderChanges (ChangeFind, ChangeList); OrderChangeDetail, the canonical `Shared/OrderChangeDetail` that
  Sales also mounts (crosscut §2), with ChangeProposal, ChangeImpact, ChangeDecision and ApplyChange, the applied
  change stored as OrderContent; OrderDetail's propose change; Product360's substitute; CaseDetail's request order
  change.
- **Usable when** (design §10, order to short pick):
  - a picker short-picks a line of the order awaiting pick; the agent proposes a substitute with the customer's
    consent, a manager approves, and the order desk applies it: the substitute is priced and reserved, the remainder
    cancelled, and Warehouse picks it;
  - a concurrent pick makes apply answer `StockChanged`, with the order unchanged;
  - cancelling the open remainder of a line releases its reservation and leaves the shipped part;
  - on the packed order, the package is reopened, the line reduced and the stock put back, and the shipment's invoice
    and payment are right afterwards;
  - a customer's cancel before approval with nothing reserved applies at once only with `customerImmediateCancel` on;
  - an approved price change cannot be applied here; a stale proposal names the current revision;
  - a Credit hold placed by Accounting stays when the Change hold is released.

**Built Nov 5 (P10).**
- Mantle entities (`entity/SupportOrderChangeEntities.xml`, named to load after RequestEntities and OrderEntities, whose
  enumeration types its seeds use): the proposal's fields on Request (`orderId`, `orderChangeKindEnumId`,
  `expectedOrderRevision`, `customerConsentRef`, `cancellationReason`, `addressContactMechId`, `shipmentMethodEnumId`,
  `carrierPartyId`, all audit-logged; `caseRequestId`, `changeAppliedDate`) and on RequestItem (`changeActionEnumId`,
  `proposedUnitAmount`, audit-logged; `pickExceptionId`); `mantle.request.support.OrderChangeDecision` (PurchaseApprovalDecision's
  fields: the request and its revision, the order and its revision, the organization, decision, date, user and party,
  reason, `expireDate`, the ServicePolicy row, `operationKey`, `supersededDate`); ServicePolicy's `orderChangeSelfApproval`
  and `orderChangeApprovalDays` (7 when empty); PartyAcctgPreference's `salesCommercialRevisionOnly` (off). Seeds:
  `RqtOrderChange`, OrderChangeKind (cancel and substitute `applied`, price, quantity increase, ship date, address, ship
  method and carrier `owner`), OrderChangeAction, OrderChangeDecision and `OctOrderChangeApplied`.
- Mantle services (`service/mantle/order/OrderChangeServices.xml` over `OrderChanges.js`): `save#OrderChange`
  (ORDER_CHANGE_REQUEST; a customer contact's own cancel without it; the applied kinds' lines checked when filed:
  ALREADY_SHIPPED, BILLING_CONFLICT, SUBSTITUTE_INVALID, PRODUCT_NOT_USABLE, CONSENT_REQUIRED; STALE_ORDER; a resave moves
  the revision and supersedes the decisions; the OrderChangeApproval notice to the approvers of its kind; under
  `customerImmediateCancel` a customer's cancel of an order not approved with nothing reserved, picked, shipped or invoiced
  applied at once with the policy as its decision, else "Cancellation requested"), `withdraw#OrderChange`, `get#OrderChange`,
  `preview#OrderChange` (each line's reserved, picked, packed, shipped and billed quantities, a substitute's association,
  usability, resolver price (`get#OrderProductPrice`) and ATP, the conflicts, the order's paid amount for a finance reader,
  `previewVersion`), `decide#OrderChange` (ORDER_CHANGE_APPROVE, or SALES_APPROVE for the commercial kinds;
  REVISION_REQUIRED, STALE_REVISION naming the current revision, STALE_ORDER, SELF_APPROVAL, REASON_REQUIRED; a refusal closes
  the proposal Rejected), `approve#OrderChangeMessage` and `refuse#OrderChangeMessage` (the topic's handlers at the message's
  `sourceRevision`, refusing none: F45, F46), `apply#OrderChange` (ORDER_CHANGE_APPLY; FORBIDDEN for a commercial kind; every
  check under the order's lock: STALE_REVISION, STALE_ORDER, NOT_APPROVED, APPROVAL_EXPIRED, CLOSED_PERIOD, ALREADY_SHIPPED,
  BILLING_CONFLICT, STOCK_CHANGED against the preview; then a packed quantity off its package, the Change hold, the lines
  (cancel#OrderItem, no reduce#AssetReservation, F66; a substitute through create#OrderItem, the short remainder cancelled,
  the short pick SpresSubstitute), the hold released (another hold kept), the substitute added to the short pick's shipment,
  the request Completed and its PDF stored as OrderContent; one transaction, so a failure leaves the order as it was),
  `send#OrderChangeConfirmation` (the stored PDF to a checked recipient from a mailbox the user sends from, as P3's resend;
  `OrderConfirmations.js` exports `senderAccount`) and `find#OrderChanges` (by order, customer, organization, requester,
  approver, case, state and period). The print `template/order/OrderChangeApplied.print.html.fancy`; the topic
  `OrderChangeApproval` in `MantleSetupData.xml`.
- Mantle changes: `increment#OrderRevision` counts a sales part's commercial changes only when the seller's preference
  (find#PartyAcctgPreference, the parent organization's when it has none) sets `salesCommercialRevisionOnly` (F55);
  `reopen#ShipmentPackage`'s checks and writes are `Packing.js` `reopenCheck` and `reopenWork`, shared with the new internal
  `WarehouseTaskServices.reopen#ShipmentPackageForChange`, which apply calls under ORDER_CHANGE_APPLY with the order's
  organization in place of the user's facilities and SHIPMENT_PACK, keeping the confirmation, reason and state checks.
- BOSS: `CustomerService.js` the `orderChange` record kind (destination OrderChangeDetail), order changes in the palette,
  the choices `customerOrders`, `orderLines`, `shortPicks` and `substitutes` (get#Choices takes `orderId` and
  `orderItemSeqId`) and the links `Orders/OrderChanges` and `Orders/OrderChangeDetail`; `screen/CustomerService/Orders/OrderChanges.xml`
  (Changes: ChangeFind and ChangeList over find#OrderChanges, states as chips); `screen/Shared/OrderChangeDetail.xml` (the
  canonical shared screen, Customer Service context only: a new proposal's ChangeProposal; a proposal's record header with
  Decide, Apply or Send confirmation by state, Edit, the applied PDF, the case and Withdraw in More; Proposal, Decisions and
  Impact with its conflicts; every transition after check#Record), mounted at `CustomerService/Orders/OrderChangeDetail`;
  OrderDetail's More gains Propose change and Order changes (`template/CustomerServiceOrderDetail.xml`); CaseDetail's More
  gains Request order change for the case's linked order (`template/CustomerServiceCaseDetail.xml`); Product360 in Customer
  Service shows Associations (the substitutes, read only; Products' `SharedContext.js`); Shared/RequestDetail's Items tab
  covers RqtOrderChange with a link to its detail (F49); the root's `OrderChangeApproval` topic and BossSetupData's link to
  OrderChangeDetail. Demo: the filter's equivalent `BOSS_CS_FILTER_PLUS` (stocked, priced 16) and ORG_ZIZI_CORP's
  `salesCommercialRevisionOnly` (Retail inherits it).
- Specs: Mantle `test/order/OrderChanges` (6 features, about 4.5 s: the commercial revision and its default; the substitute
  with its refusals, the topic's revision, the confirmation's recipient check; STOCK_CHANGED then the cancel with the
  reservation rows; the reopen between pack and ship and the invoice after pack and ship, ALREADY_SHIPPED after; the
  customer's cancel with the flag off and on; the price change, the list, another organization, STALE_ORDER,
  APPROVAL_EXPIRED, SELF_APPROVAL and the Credit hold kept). BOSS `CustomerServiceAccess` (+1: the record kind's
  capability for the order desk and the agent, another organization's record, Mantle's read and the order lines; the menu
  feature expects OrderChangeApproval) and `CustomerServiceOrderChanges` (1 feature: OrderChangeDetail's and OrderChanges'
  one qvt render). Acceptance `test/acceptance/CustomerService/CustomerServiceOrderChangesWalk` (the usable-when, 5 features,
  through OrderChangeDetail's transitions) and AppStructure's fixtures (OrderChanges, OrderChangeDetail).
- Tests run (all pass): Mantle OrderChanges, OrderToCashBasicFlow, AssetReservationMisc, AssetReservationMultipleThreads,
  WarehousePicking, WarehousePacking, AccountingCredit, PurchaseRevisions, PurchaseHoldPermission, PurchaseOrders,
  PurchaseApprovals, OrderLifecycle, ReturnToResponseBasicFlow, ShipmentReturnMisc, SupportCases, OrderConfirmations,
  ShipmentPick, OrderBulk, WorkPlanToCashBasicFlow, OrderProcureToPayBasicFlow, WorkProjectRequests, RecordVisibility,
  RecordLinks, WorkProjectClients, CommonsToday, SupplierPortal (250 features); BOSS CustomerServiceAccess,
  CustomerServiceOrders, CustomerServiceCases, CustomerServiceOrderChanges, WarehousePicking, WarehousePacking,
  WarehouseShipping, WarehouseInventory, PurchasingRevisions, PurchasingRequests, PurchasingOrders, PurchasingAccess,
  ProductsSharedContext, ProductsAccess, Requests, ProjectRequests, AccountingReceivables, AccountingCollections,
  AccountingAccess, ProjectsAccess, Notifications (166 features); acceptance CustomerServiceOrderChangesWalk (5),
  CustomerServiceFoundationWalk, CustomerServiceOrdersWalk and AppStructure (34 features). `moqui lint --screens`: 136
  flagged sites, as master; none in the new or changed screens.
- Inventories: usl-inventory's hold#Order, release#OrderHold, create#OrderItem, cancel#OrderItem, increment#OrderRevision,
  reduce#AssetReservation (not called, F66) and add#OrderPartToShipment, and a P10 table for the OrderChangeServices and the
  internal reopen. No ss-inventory row is designed into OrderChanges or OrderChangeDetail (they have no mr-marble form).
- Decisions:
  - The named failures are Mantle reason codes (STALE_ORDER, STOCK_CHANGED, ALREADY_SHIPPED, BILLING_CONFLICT,
    APPROVAL_EXPIRED, FORBIDDEN, CLOSED_PERIOD), the form `lib.reasonCode` reads; FORBIDDEN is a kind applied by the order's
    owner, PERMISSION_DENIED a missing permission. Each is an error of the one apply transaction, so the order is unchanged.
  - The proposal's states are read, not stored: Requested and Needs information (Submitted, Waiting for customer), Approved
    (a current, unexpired approval), Applied (Completed), Rejected (Cancelled, RrRejected), Cancelled (withdrawn, RrWontFix)
    and Stale (the order's revision moved).
  - An applied kind's conflicts are refused when filed as well as at apply; the approval binds the proposal's revision and
    refuses a moved order (STALE_ORDER); the separation is ServicePolicy's (another approver unless orderChangeSelfApproval).
  - OrderChangeDetail's ChangeProposal files one line per proposal (the Mantle service takes several).
  - The applied PDF renders inside apply's transaction; a render that fails is logged and the change stays (no PDF, so no
    confirmation to send). The confirmation is sent by the order desk or an agent from the service mailbox, as P3's resend.
  - A customer contact (the customer itself, or a current contact or employee of it) may file a cancel of their own order
    through save#OrderChange; P15's `request#CustomerCancel` calls it.
- Findings (provisional):
  - **F150** An entity file's seed data loads in file order, so the proposal's seeds failed in `OrderChangeEntities.xml`
    (RequestType and OrderContentType not loaded yet) and the whole file was skipped; the file is
    `SupportOrderChangeEntities.xml`, after them, its seeds in an entity's `seed-data` (not an extend-entity's).
  - **F151** Ziziwork's organizations have no PartyAcctgPreference of their own and inherit ORG_ZIZI_CORP's
    (find#PartyAcctgPreference): a demo row for ORG_ZIZI_RETAIL replaced the inherited one (WarehousePacking's
    kitCostFromComponents failed), so the sales flag is read through find#PartyAcctgPreference and set on ORG_ZIZI_CORP.
  - **F152** Retail finalizes its pack invoice at pack (no D3 flag), so the demo packed order's change is BILLING_CONFLICT
    when filed; the walk's reopen is its own order, packed while the company finalizes at ship. The demo order becomes
    reopenable when Accounting turns salesInvoiceFinalizedAtShip on for Ziziwork, which also changes Mantle's flows that run
    with the BOSS demo; for the lead.
  - **F153** pack#Shipment completes a fully packed order part (OrderCompleted), and hold#Order refuses a completed order:
    save and apply accept a completed order, refuse only what shipped, and reopen the package (back to Approved) before the
    Change hold.
  - **F154** Mantle reserves at placement by default (AsResAutoPlaced, an ad hoc asset when out of stock), so
    customerImmediateCancel's "nothing reserved" holds only for an order part that reserves at approval; the condition stays
    as designed.
  - **F155** The stock put back after a reduced packed line is Warehouse's: cancel#OrderItem flags putBackQuantity and
    Warehouse's reverse#Pick (SHIPMENT_PICK, which the order desk lacks) moves it, as design §4's receiving sides say; apply
    does not call reverse#Pick.
  - **F156** This runtime's entity find is consumed by `condition()`: a find built across statements must reassign it
    (`query = query.condition(...)`), or its `list()` fails "entity find was already used".
  - **F157** F78: apply places and releases its own Change hold in one transaction (a failed apply rolls it back), so P10
    builds no manual release of a Change hold; one left by another path is released through release#OrderHold with
    ORDER_CHANGE_HOLD_RELEASE, which a later screen must put behind check#Record.
  - **F158** No BOSS group holds SALES_APPROVE or SALES_ORDER_CHANGE (Sales is not built): a commercial kind is filed and
    routed, and no one in BOSS decides it until Sales grants them (§7).
  - **F159** Approvals (P9's screen) should pass the OrderChangeApproval topic; until then the notice is decided from
    Notifications or OrderChangeDetail.

**Review Nov 5 (P10).** Checked both repos' diffs against this section, §2, design §4, AGENTS.md and Practices-App-Dev:
apply's atomicity (every named failure is a `denied` or a nested service error of the one apply transaction; the checks
come before the first write, and the writes after them, the reopen, the Change hold, the lines, the pick exception, the
release, the substitute's shipment and the PDF, roll back together); the reopen split (`reopen#ShipmentPackage` keeps its
operation, SHIPMENT_PACK, user facility, confirmation and reason checks and writes as before; the internal
`reopen#ShipmentPackageForChange` is allow-remote false, keeps the confirmation, reason, state, package and
INVOICE_FINALIZED checks, scopes the shipment to the order's organization, and neither it nor apply calls
release#ShipmentDraftInvoice or refund#OrderPayment); F153's re-approval (a reopen's Completed to Approved and every
Change hold's release run Mantle's OrderApproved rules again, as a Credit hold's release does: the store's approval email is
not sent twice (send#OrderStoreEmail skips a type already sent), subscriptions fulfil an item once, reserve#AssetsForOrder
reserves only the unreserved remainder, the drop-ship rule answers a line already on a purchase order; the high-priority
notice repeats and an EDI order records its next 855, which an applied change warrants); F151 and F55 (the flag on
ORG_ZIZI_CORP merges into its demo preference and is read through find#PartyAcctgPreference, so Retail keeps the
inherited kitCostFromComponents; no Mantle or BOSS spec asserts a Ziziwork sales order's revision moving on a note, file
or status); permissions by kind, FORBIDDEN for the commercial kinds, the Credit hold kept, the topic handlers at the
message's revision, the customer's cancel only under customerImmediateCancel on an order not approved with nothing
reserved, picked, shipped or invoiced; the walk restores salesInvoiceFinalizedAtShip and customerImmediateCancel in
`finally`.
- **R1 (high, Mantle)** A pick locks its shipment, its line and the asset, never the order, so apply's checks "under the
  order's lock" did not serialize with a pick; and apply held the order while its reopen waited on the shipment, the
  reverse of Warehouse's lock order (F294: the shipment, then the order parts and header), a deadlock against a pack or
  reopen of the same order. `orderOf` with a lock now locks the order's shipments (by its ShipmentItemSources, in id order)
  before the order, so a concurrent pick, pack or reopen either commits before the checks, which then answer
  STOCK_CHANGED, or waits for the change.
- **R2 (medium, Mantle; at the lead's request)** `hold#Order` and `release#OrderHold` locked the order header, then the
  part, the reverse of Warehouse's `lockOrders` (F294: the parts, then the header), so a Credit or Change hold could
  deadlock against a pack or reopen of the order. Both now lock the order's parts (the one named, else all, in sequence)
  before the header, their behaviour otherwise unchanged; apply's `orderOf` takes the parts after the shipments, so the
  hold it places inside apply takes nothing new. AccountingCredit, PurchaseHoldPermission, PurchaseRevisions, OrderChanges,
  WarehousePacking, WarehousePicking and OrderToCashBasicFlow pass (84 features).
- Left for the lead: F156 is the framework's design, not a P10 bug: `HostFind`'s chain methods
  (`crates/moqui-core/src/script/runtime/entities.rs`, `take_find`) take the inner find and return a new object, so
  Java-style `q.condition(...); q.list()` fails loudly ("entity find was already used") where Java's mutable EntityFind
  works; returning the same object with the find changed in place would make both styles work. Callers that lock the
  order header themselves before hold#Order (PurchaseOrders.js `purchaseOrder(orderId, true)` for the purchase revisions,
  several OrderServices verbs) still take the header first. A customer filer's `get#OrderChange` is scoped to the user's
  organizations and shows the decisions' reasons and approvers; P15's Support app needs its own audience read.

- **Wave 5 suites (Nov 5, on master after P8, P9 and P10 merged, nothing else running):** standalone mr-mantle 1,734
  passed, 2 failed (the baseline), 11 skipped; `./moq test-apps` 3,052 server and 14 client features passed, none failed,
  within every budget (server: mr-mantle 318.9 of 335 s, mr-boss 229.2 of 245 s, mr-pass 13.0 of 15 s; client: mr-boss
  41.5 of 44 s); `moqui lint --screens` clean.

### P11 — Warranty

Design §5 WarrantyClaims and WarrantyAssessment, crosscut §3.2 DeliveredItems; CS-WARRANTY.

- **CS-WARRANTY** on the claim's case (§4):
  - the `RqtWarranty` type; the claim is the case, its product a RequestItem, its asset, order, invoice and agreement
    RequestRecord links. The design's WarrantyClaim record is not built;
  - `mantle.request.support.WarrantyDecision`, a record of its own: the terms and their source, covered, partial,
    rejected or goodwill, the approver, and for a chargeable repair the charge estimate and the customer's consent; the
    sales quote waits for Sales (§4, §7);
  - the coverage basis, by the hierarchy of §4: the agreement first, then the product's warranty at sale, a serial or
    lot traced through AssetIssuance to its order, customer and ship
    date, the term from the product's `PftWarranty` feature, and the coverage end with its source; then goodwill. A
    manual override needs a reason. Products' contract: editing `PftWarranty` on Product360, if Products has not;
  - `mantle.request.WarrantyServices`: `find#WarrantyClaims`, `save#WarrantyClaim`, `get#WarrantyCoverage`,
    `decide#WarrantyClaim` (`WARRANTY_APPROVE` for a rejection override or goodwill) and `link#WarrantyWork`: a
    maintenance-purpose work item (or Manufacturing P11's AssetMaintenance, as P0 settles) linked to the case and the
    asset; finishing it notifies the agent and resolves nothing.
- **Screens:** WarrantyClaims (WarrantyFind, WarrantyList); WarrantyAssessment (WarrantyEvidence, WarrantyDecision,
  RepairLinks); NewCase's warranty template; Customer360's Delivered items (crosscut §3.2 DeliveredItems), opening a
  claim from a row.
- **Usable when:**
  - a claim for the serial of the delivered order shows coverage from its ship date plus the product's 12-month term,
    with the source;
  - an expired claim is rejected, or approved as goodwill with the approver;
  - the repair work finishing notifies the agent and leaves the claim's case open; a replacement goes through a return
    (P9).

**Built Nov 5 (P11).**
- Mantle entities (`entity/SupportWarrantyEntities.xml`, new, named to load after the entity files whose enumeration types its
  seeds use, F150): `Request.claimRevision` (audit-logged: the claim's evidence revision, counted once by each change of its
  product, asset, order, invoice or agreement); `mantle.request.support.WarrantyDecision` (PurchaseApprovalDecision's fields,
  F45: the request and its revision, the organization, decision, date, user and party, reason, `operationKey`,
  `supersededDate`; and the coverage decided on: basis, terms and their source, agreement, coverage end and its source, the
  override's reason, the approver of a goodwill or override, the charge estimate and its currency, the customer's consent,
  the next due date). Seeds: `RqtWarranty`, `WarrantyDecision` (WdCovered, WdPartial, WdRejected, WdGoodwill),
  `WarrantyCoverageBasis` (WcbAgreement, WcbProductWarranty, WcbNone), the term type `TtWarranty` and the maintenance type
  `MntTpWarranty`; `MantleSetupData.xml` the topic `WarrantyRepairFinished`. `entity/SupportWarranty.eecas.xml` (new): the rule
  `WarrantyWorkFinished` on AssetMaintenance's status to AsMntCompleted, by any path.
- Mantle services (`service/mantle/request/WarrantyServices.xml` over `Warranty.js`, new): `find#WarrantyClaims` (the user's
  organizations' claims by customer, product, serial, order, agreement, state, assignee and date, and with `queueIds` an app's
  own case scope; states read: Needs evidence, Assessment, Approved repair or replacement, Rejected, Customer follow-up,
  Closed), `get#WarrantyClaim` (WarrantyAssessment's read: evidence, prior claims on the serial, coverage, decisions, repairs
  with their tasks, returns, and what the user may do), `save#WarrantyClaim` (SUPPORT_CASE_EDIT: a new RqtWarranty case through
  `create#Case`, or a case of another type made a claim; the product a RequestItem, the serial by id or serial number, the
  order (the serial's sale when not given), the invoice (the sale line's billing) and the agreement as RequestRecord links;
  ASSET_UNAVAILABLE, ASSET_PRODUCT_MISMATCH, ORDER_UNAVAILABLE, INVOICE_UNAVAILABLE, AGREEMENT_UNAVAILABLE, STALE_REVISION; a
  change counts the revision and supersedes the decisions), `get#WarrantyCoverage` (§4's hierarchy: a current AgrService
  agreement with a TtWarranty term for the product, then the product's warranty at sale, the serial or lot traced through
  AssetIssuance to its sales order, customer and ship date, the PftWarranty feature's number and time unit, the end and its
  source, else WcbNone; each step in the trace), `decide#WarrantyClaim` (SUPPORT_CASE_EDIT at the claim's revision,
  REVISION_REQUIRED, STALE_REVISION; NOT_COVERED, OVERRIDE_REASON_REQUIRED, goodwill and a rejection override with
  WARRANTY_APPROVE, REASON_REQUIRED, CHARGE_NOT_ALLOWED, CHARGE_INVALID, CURRENCY_REQUIRED; the case is not resolved),
  `link#WarrantyWork` (F67: an AssetMaintenance on the sold serial through `EquipmentServices.create#AssetMaintenance`, its
  WepMaintenance task in `taskWorkEffortId`, or an open one of the serial, linked to the case; the organization (the facility's
  owner or the sale's vendor) and the customer (the asset's owner or the sale's customer) checked here, F51; NOT_DECIDED,
  NOT_APPROVED, CONSENT_REQUIRED, ASSET_REQUIRED, WORK_REQUIRED, ASSIGNEE_UNAVAILABLE, MAINTENANCE_UNAVAILABLE),
  `update#WarrantyWork` (in process, finished with its result, cancelled before it starts, the task following; STATUS_INVALID),
  `notify#WarrantyWorkFinished` (the rule's: the claim's assignee, else the agent who linked it; resolves nothing),
  `store#ServiceAgreement` (SUPPORT_POLICY_EDIT: the customer's AgrService agreement with its TtWarranty term and the product's
  item, F50, F101) and `find#DeliveredItems` (crosscut §3.2: the serials and lots the user's organizations delivered to a
  customer, with their coverage and open claim). Mantle changes: `create#Case` takes the type's template before the queue's
  (`CaseTemplates.forCase`, ServiceRequestType.templateFormId, which P7 left unread), and `save#ServiceRequestType` keeps the
  row's template (as F127 for queues).
- BOSS: `CustomerService.js` the links `Returns/WarrantyClaims` and `Returns/WarrantyAssessment` and the choices
  `customerAssets` (a customer's delivered serials and lots), `serviceAgreements` and `customerInvoices`; `Templates.js`
  NewCase's choice takes the type's template; screens `Returns/WarrantyClaims.xml` (the Warranty tab: WarrantyFind and
  WarrantyList over find#WarrantyClaims, the user's queues and assigned claims, New claim to NewCase with the type) and
  `Returns/WarrantyAssessment.xml` (the record header with one primary by state, Record evidence, Decide, Add repair, More's
  Record consent, Request return and Open the case; Evidence with the coverage and its trace; Decisions; Repairs and returns
  with Update repair; every transition after `check#Record`); `Shared/Customer360/ServiceDeliveredItems.xml` (the Delivered
  items tab, New claim from a row or its open claim); NewCase's warranty claim path (`assetId`, the type's template, then
  `save#WarrantyClaim` with the serial or the template's serial number, the sale and the fault, opening WarrantyAssessment);
  CaseDetail's More gains Warranty assessment; Shared/RequestDetail's Items tab covers RqtWarranty with a link to the
  assessment (F49); the root's `WarrantyRepairFinished` topic and BossSetupData's link. Demo (`BossCustomerServiceDemoData.xml`):
  Retail's "Warranty claim" template `BOSS_CS_TPL_WARRANTY` (serial number, fault and use for the customer, the condition on
  inspection internal) and the RqtWarranty type service-enabled into the Support queue with it; no demo claim (the walks make
  their own).
- Specs: Mantle `test/request/SupportWarranty` (3 features, about 1.6 s: the delivered serial covered from its ship date plus
  the 12-month term with its source, the type's template and its resave, the checks, an agreement covering first, the
  delivered items and the list; an expired claim refused as covered, rejected, goodwill by the WARRANTY_APPROVE holder and its
  approver, the revisions, the override's reason, a change superseding the decision, the charge needing consent; the repair
  with its task, its completion telling the agent and leaving the case open, a maintenance no claim links telling no one).
  BOSS `CustomerServiceWarranty` (1 feature, about 0.9 s: WarrantyAssessment's and WarrantyClaims' one qvt render,
  Delivered items' one html render (a tab alone), NewCase's template choice by type) and `CustomerServiceAccess` (+1 feature:
  the claim's check for the agent and the reader, another organization's agent refused it, its read and the customer's
  serials). Acceptance `test/acceptance/CustomerService/CustomerServiceWarrantyWalk` (the usable-when, 3 features, through
  Customer360, NewCase and WarrantyAssessment's transitions) and AppStructure's fixtures (WarrantyClaims, WarrantyAssessment,
  Delivered items), both passing.
- Tests run (all pass): Mantle SupportWarranty, SupportCases, SupportTemplates, SupportRelations, SupportChannels,
  WorkProjectRequests, RecordVisibility, RecordLinks, WorkProjectClients, CommonsToday, OrderToCashBasicFlow,
  ReturnToResponseBasicFlow, ShipmentReturnMisc, WorkPlanToCashBasicFlow (176 features); BOSS CustomerServiceWarranty,
  CustomerServiceAccess, CustomerServiceCases, CustomerServiceTemplates, CustomerServiceOrders, CustomerServiceReturns,
  CustomerServiceOrderChanges, Requests, ProjectRequests, PurchasingRequests, ProjectsAccess (76 features); acceptance
  CustomerServiceWarrantyWalk (3) and AppStructure (18). `moqui lint --screens`: 136 flagged sites, as master; none in the new or
  changed screens.
- Inventories: usl-inventory's P11 table (the WarrantyServices and create#AssetMaintenance). No ss-inventory row is designed
  into WarrantyClaims, WarrantyAssessment or Delivered items (they have no mr-marble form).
- Decisions:
  - Agreement first (F50, F101): a store, `store#ServiceAgreement`, of the customer's AgrService agreement with a warranty term
    (TtWarranty; its text the terms, an item for the product it covers, none for every product), on P13's agreement statuses;
    no expiry job, as the lookup reads the agreement's and term's dates and an Active status. Its screen is Customer360's
    ServiceAgreements form (P14); P4's service level condition reads the same agreements.
  - A rejection override is covering (covered or partly) a claim the lookup found expired, through a coverage end set with its
    reason, by a WARRANTY_APPROVE holder recorded as the approver; goodwill needs the same holder and a reason; rejecting needs
    a reason only.
  - A chargeable repair is a partly covered or rejected decision with a charge estimate; its consent is recorded by deciding
    again (More's Record consent), a new decision at the same revision; the repair is linked only with it.
  - A claim is a case: its record link and the palette open CaseDetail, which links the assessment (More); WarrantyClaims
    and the topic open WarrantyAssessment. Product360's warranty editing is Products' (F164).
- Findings (provisional):
  - **F164** Products already edits a warranty: a PftWarranty feature's number and time unit on Products/Features
    (NewFeature, FeatureDetail Summary) and its application to a product on Product360's Features tab, so Products' contract
    needed nothing here; Customer Service's Product360 context does not show the term (its tabs are P3's), a P16 polish.
  - **F165** P4 built no store for service agreements (F101); P11 adds `store#ServiceAgreement` with the TtWarranty term
    and reads Agreement rows by type, organization, customer, dates and status.
  - **F166** `link#RequestRecord` asks the user's record visibility (get#RecordLinkInfo), which refuses an invoice to an
    agent who reads no finance records, though the invoice is evidence of the sale: WarrantyServices writes the claim's
    RequestRecord rows itself after its own organization and customer checks.
  - **F167** Nothing in BOSS finished an AssetMaintenance (Manufacturing's EquipmentDetail only requests one), so
    `update#WarrantyWork` moves a claim's repair through the AssetMaintenance status flow (its task following), and the
    completion notice is a rule on AssetMaintenance's status, so a Maintenance app's own path tells the agent too.
  - **F168** Shipment has no shipped date; the ship date is the AssetIssuance's issue date (a sales order's stock is issued
    when it ships), as crosscut DeliveredItems reads.
  - **F169** "WARRANTY_APPROVE for a rejection override" is read as covering a claim the lookup found expired (a coverage
    end set with its reason); design WarrantyAssessment says so.
  - **F170** ServiceRequestType.templateFormId was not read (P7) and `save#ServiceRequestType` dropped it on a resave (as
    F127 for queues): `create#Case` and NewCase take the type's template before the queue's, and the save keeps it.
  - **F171** A case's revision moves with every update of the request (status, due date), so a claim's revision is its own
    counter (`Request.claimRevision`), moved only by its evidence; a status change does not stale a decision.
  - **F172** Delivered items lists serials and lots only: an issued asset with neither (the demo's filters) is stock, not a
    delivered item, and a claim on it names its product and sale.

**Review Nov 5 (P11).** Checked both diffs against this section, §2, §4, design §5 and crosscut §3.2: the coverage hierarchy
(the agreement by type, organization, customer, product item, dates and Active status; the sale through AssetIssuance to a
sales part of the organization to the customer; the PftWarranty term; goodwill), the services' own organization and customer
checks, F166 (the claim's RequestRecord rows are written after checks that match Customer Service's own invoice, order and
asset scope; CaseDetail shows a linked invoice by id, customer and status only, and Shared/RequestDetail still hides a record
get#RecordLinkInfo refuses), the WarrantyWorkFinished rule (it acts only on a maintenance an RqtWarranty case links; no
Manufacturing path completes an AssetMaintenance; ProductionDowntime, ManufacturingDowntime and ManufacturingWorkCenters pass),
WARRANTY_APPROVE and the approver, the revision (F171), consent before the repair, the demo's RqtWarranty type (Retail only,
F82; no Mantle spec files an RqtWarranty request outside SupportWarranty; P2's case rule unchanged), P7's templates (the
type's template is read only where a type row names one: only the warranty demo and spec) and the walk (the usable-when).
Fixes:
- R1 (medium) Coverage dates were reckoned in UTC from the issue instant: the ship day and the end now are days in the
  organization's time zone (its working-hours calendar's, `BusinessTime.scheduleOf`, else the user's; there is no other
  organization zone), the end the start of the day the term after the ship day, a month kept on its day or the month's last
  (Jan 31 plus a month is Feb 28, not Mar 3); the texts are days in that zone.
- R2 (medium) A serial returned (received as a new asset with the same serial number) and sold again to another customer
  stayed the first customer's: the old asset still traced to its own sale, so the first customer could claim it and Delivered
  items listed it. A serial's sale is now its latest sale by the organization over every asset of its product with that serial
  number; it decides the customer (before the asset's owner, which counts only with no sale) and the asset the claim and its
  repair are on.
- R3 (low) Delivered items showed another customer's open claim on a serial; it shows the customer's own only, and leaves out
  a serial sold again to someone else.
- R4 (low) `notify#WarrantyWorkFinished` runs in the update that completed the repair: its errors are now kept in their own
  message frame, so a failed notice cannot fail that update.
- Spec: SupportWarranty gains the organization's zone (a ship half an hour into its day), another organization's serial, the
  serial sold again, and a decision after an evidence change (stale at the old revision, covered at the new one).
Left for the lead: evidence changed outside `save#WarrantyClaim` (Shared/RequestDetail's unlink of a claim's asset or order
record, a RequestItem edited directly) does not move `claimRevision`; NewCase's warranty path refuses the whole case when the
template's typed serial is not the customer's (the agent clears it and records the serial on WarrantyAssessment), and its
`customerAssets` choice still lists a serial sold again to another customer (save refuses it).

### P12 — Knowledge

Design §3 CaseDetail's Knowledge tab, §6 Knowledge, ArticleFeedback and CaseToArticle, §9 KnowledgeSources;
CS-KNOWLEDGE.

- **CS-KNOWLEDGE.**
  - `ServiceKnowledgeSource`, effective-dated rows: space, audience, language, product or category mapping, priority,
    review team and default draft space. Wiki spaces only; indexing never widens page access.
  - `ArticleFeedback`, records of their own: page and version, helpful, comment, case, review decision.
  - `mantle.request.KnowledgeServices`: `save#ServiceKnowledgeSource` (`SUPPORT_POLICY_EDIT`),
    `find#ArticleSuggestions` (the requester's locale first, then the space's language), `review#ArticleFeedback`
    (`SUPPORT_KNOWLEDGE_EDIT`; a task made or linked) and `create#ArticleFromCase` (`SUPPORT_KNOWLEDGE_EDIT`; a
    redacted draft with WikiPageRequest); `ironstone.customerservice.KnowledgeServices` `find#ArticleFeedback` and
    `prepare#ArticleFromCase` for the screens.
  - Suggest edit (F15): an editor saves a draft revision and asks for its review through `request#WikiPageReview`;
    another agent files a task on the page for the space's review team.
  - Send to customer: Compose with the published URL, the Support app's CustomerArticle once P15 builds it and the
    space's `publicPageUrl` before; a draft is refused.
- **Screens:** Knowledge, Commons Knowledge with the Customer Service row; CaseDetail's Knowledge tab; NewCase's
  suggestions; KnowledgeSources (ServiceKnowledgeSources); ArticleFeedback (FeedbackFind, FeedbackList, FeedbackReview);
  CaseToArticle (AnswerSelection, ArticleDraft).
- **Usable when:**
  - a case's subject suggests a published article in the requester's language first; the agent links it and sends it;
    sending a draft is refused;
  - CaseToArticle makes a redacted draft in the service space, unpublished;
  - a reviewed feedback makes a task and leaves the article unchanged;
  - an internal article is never suggested on a customer-visible surface.

**Built Nov 5 (P12).**
- Mantle entities (`entity/SupportKnowledgeEntities.xml`): `mantle.request.support.ServiceKnowledgeSource` (effective-dated,
  key fields audit-logged: organization, space and the part of it by `pagePathPrefix` (F103), audience `SkaInternal`,
  `SkaCustomer`, `SkaPublic`, language, the queue and product category it is first for, priority, allow suggestions, review
  team, draft space and parent path) and `ArticleFeedback` (page and version, helpful, plain-text comment, case,
  organization and source, agent or customer, `AfbSubmitted`/`AfbReviewed` with `AfdImprove`, `AfdNoChange`, `AfdDismissed`,
  note, reviewer, task).
- Mantle services (`service/mantle/request/KnowledgeServices.xml`, `Knowledge.js`): `save#ServiceKnowledgeSource`
  (SUPPORT_POLICY_EDIT and the organization; a space the user may read, never an internal source in a space with a public
  address, F104; dated by SupportCases.js's `startRow`, now exported), `find#ArticleSuggestions` (the subject's words in the
  pages' paths, F107; the requester's language first, then the case's queue or product category, words matched and the
  source's priority; an agent's surface needs the organization and offers only pages the wiki lets the user view, drafts and
  internal articles flagged; `customerVisible` only published, unrestricted pages of customer and public sources), F59's
  `get#PublishedArticle` (the exact published version through `get#PublishedWikiPageText` with no version asked, checked
  against the page's, cleaned with `StringUtilities.cleanHtml`, as Forum.js's site pages; for P15), `get#ArticlePublicLink`
  (Send to customer: refuses a draft, ARTICLE_NOT_PUBLISHED, and an internal or unsourced article, ARTICLE_INTERNAL; the
  space's `publicPageUrl`, made absolute on the server, F105), `record#ArticleFeedback` (SUPPORT_CASE_EDIT, F109),
  `review#ArticleFeedback` (SUPPORT_KNOWLEDGE_EDIT; each feedback in its own transaction, Done, Forbidden, AlreadyReviewed or
  Failed named per id; one task per article made by `make#ArticleTask`, a WikiPageWorkEffort for the source's review team, or
  the task given linked; the article never changed; an operation key answers a retry), `suggest#ArticleEdit` (F15: a task on
  the page for the review team, linked to the case) and `create#ArticleFromCase` (SUPPORT_KNOWLEDGE_EDIT, the case of the
  user's organization, a draft space of its sources the user may update; the chosen outward and customer emails, an internal
  note or message refused, INTERNAL_MESSAGE; the case's customer and contact names, emails, phones, street addresses and
  linked orders and returns, and email- and phone-shaped text, replaced; a new unpublished page linked by WikiPageRequest;
  `preview` answers the redacted text and writes nothing).
- BOSS reads (`service/ironstone/customerservice/KnowledgeServices.xml`, `Knowledge.js`): `get#KnowledgeContext` (the
  Customer Service row of Commons Knowledge: the sources' spaces, the case and what the user may do), `get#CaseKnowledge`
  (the Knowledge tab), `prepare#ArticleSend` (the Comms Compose address for the case's contact, else its customer, with the
  case as the mail's record), `find#ArticleFeedback` (for SUPPORT_KNOWLEDGE_EDIT or SUPPORT_CASE_MANAGE; the case only when
  the user sees it), `prepare#ArticleFromCase` (the answers with their audience, internal notes counted and never offered,
  the personal data found, the draft spaces and the redacted preview) and `find#KnowledgeSources`.
- Screens: `CustomerService/Knowledge.xml` a menu group (always-use-full-path) holding `Knowledge` (Commons Knowledge mounted
  with the Customer Service row: `Commons/Knowledge.xml`'s setup asks get#KnowledgeContext when `inCustomerService`, and its
  transitions `linkCaseArticle`, `sendArticle` and `suggestArticleEdit`; `Knowledge.qvue` shows the case banner, Send to
  customer, Link to case and Suggest edit, keeps `requestId` on every request, and finds its path by the last `Knowledge`;
  `KnowledgeTui` lists the sources' spaces too), the hidden `KnowledgeTui`, `Knowledge/ArticleFeedback` (FeedbackFind,
  FeedbackList, FeedbackReview as a row-selection action, `BOSS_CS_ARTICLE_FEEDBACK` for the knowledge author, manager and
  administrator) and `Knowledge/CaseToArticle` (AnswerSelection, ArticleDraft; `BOSS_CS_CASE_TO_ARTICLE` for the author and
  administrator); CaseDetail's Knowledge tab (`template/CustomerServiceKnowledge.xml`: linked and suggested articles, the
  search, Link, Unlink, Send to customer, Helpful?, Suggest edit, Open knowledge, Make an article; its transitions included
  by Shared/RequestDetail; CustomerServiceCaseDetail.xml adds the tab after the others); NewCase's "What is it about?" in
  CaseIdentity and its suggestions box (the subject becomes the case's); `Settings/KnowledgeSources`
  (ServiceKnowledgeSources: Add source, Edit from now, End) linked from SettingsHome's Knowledge and feedback box. `linkPaths`
  gains the four routes.
- Demo: `KnowledgeDemo.js` (`DemoServices.load#KnowledgeDemo` from BossZCustomerServiceDemoData.xml after the cases, each
  step in its own transaction through the wiki's and Mantle's services): in ZZW_RETAIL (F34) the published
  `help/Thermostat reads the wrong temperature` and `help/Replacement filter schedule`, the draft `help/Thermostat battery
  replacement` and the Spanish `help/es/Thermostat temperatura incorrecta`; the new internal space ZZW_SVC with the published
  `Thermostat calibration offset` and `drafts/`; Retail's sources (help/ customers en, help/es/ customers es, both reviewed by
  the Support team with drafts in ZZW_SVC; ZZW_SVC agents en); two agents' feedback on the thermostat article from Joe's case.
  BossYCustomerServiceCasesDemoData: the knowledge author in the Support team (F110), and on Joe's thermostat case the
  agent's outward email (his name and the order to take out) and an internal note.
- Specs: Mantle `test/request/SupportKnowledge` (6 features, about 1.5 s: the sources' save and refusals, suggestions in the
  requester's language first and on both surfaces, the exact published version and the public link's refusals, the feedback
  batch with its failures named and one task, Suggest edit, the article from a case redacted and its refusals). BOSS
  `CustomerServiceKnowledge` (4 features, about 0.7 s: the tab's read and the mount's context, Send to customer and its
  refusals, ArticleFeedback's one qvt render, CaseToArticle's one qvt render) and `CustomerServiceAccess` (+1 feature: the
  feedback for the author and manager and not an agent, CaseToArticle for the author on their organization's case, both
  screens refused the agent). Acceptance `test/acceptance/CustomerService/CustomerServiceKnowledgeWalk` (the usable-when, 4
  features); `AppStructure` (the four routes, `fullPathOnly` for the Knowledge group, F106; the placeholder floor 51) and
  `CustomerServiceFoundationWalk` (Knowledge opens in tui; Send to customer's parameter for the client sweep).
- Tests run (all pass): Mantle SupportKnowledge, SupportCases; BOSS CustomerServiceKnowledge, CustomerServiceAccess,
  CustomerServiceCases, Knowledge, KnowledgeReview, Notes, ProjectsAccess; acceptance CustomerServiceKnowledgeWalk,
  AppStructure, CustomerServiceFoundationWalk. `moqui lint --screens`: 136 flagged sites, as master; none in the screens
  changed.
- Inventories: ss-inventory's EditWikiPages AddWprForm and DeleteWprForm (CaseDetail's Knowledge tab, the Knowledge mount);
  usl-inventory's link#RequestRecord and unlink#RequestRecord rows and a Customer Service P12 table of the new services.
- Decisions:
  - Knowledge is Commons Knowledge mounted with a Customer Service row (as ProjectDetail's Docs), not a second article
    reader: the qvue and its terminal twin list the sources' spaces; the case's own actions are in CaseDetail's tab too.
  - Send to customer is Comms Compose with the body, recipient and the case as the record (the sent mail is filed on the
    case); nothing is sent until the agent sends it.
  - The knowledge author drafts from a case of a team they belong to; the manager reads the feedback queue, only the author
    reviews it.
- Findings (provisional):
  - **F103** WikiPage has no language and the demo keeps English and Spanish customer articles in the one space ZZW_RETAIL,
    so a source is a space or the part of it under a page path; a page belongs to its space's source with the longest
    matching prefix. Design KnowledgeSources changed.
  - **F104** ZZW_RETAIL is the POPC store's public content space (`publicPageUrl` /popc/content/…, restrictView N): a
    published page there is public, so an internal article cannot be one of its pages. Internal articles are in ZZW_SVC, and
    save#ServiceKnowledgeSource refuses an internal source in a space with a public address (INTERNAL_PUBLIC_SPACE). Design
    changed.
  - **F105** ZZW_RETAIL's `publicPageUrl` is relative; get#ArticlePublicLink makes it absolute on the webroot's URL when
    there is a web request (a send from a job would keep it relative). P15's CustomerArticle builds the link with
    `PublicApps.pageUrl` instead.
  - **F106** Commons Knowledge renders in vue, qvue and tui only, so the Customer Service Knowledge group, whose default it
    is, opens at its full path; AppStructure skips the group path (`fullPathOnly`) and renders the mount, and
    FoundationWalk opens the area in tui. Knowledge.qvue finds its own level by the last `Knowledge` of the path.
  - **F107** Without a search index `search#WikiPages` matches only a page path containing the whole text, so suggestions
    match each word of the subject (three letters or more, common words left out) in the page paths, ignoring case, in the
    query; ranking by the text through the index is later.
  - **F108** An agent who files a case is its Reporter (P2's thermostat demo case), so the customer's side of a case's
    messages and personal data is its Customer and Reporter parties that are not staff (an internal organization or someone
    who works for one).
  - **F109** The plan names four Mantle services; Send to customer, the agents' feedback, Suggest edit and F59's read need
    `get#ArticlePublicLink`, `record#ArticleFeedback`, `suggest#ArticleEdit` (with the internal `make#ArticleTask`) and
    `get#PublishedArticle`, which P15's CustomerArticle and its rating call. Design CaseDetail's Knowledge tab changed
    (Helpful?).
  - **F110** A knowledge author sees no case unless in a team of its queue (the Support queue is SqvTeam); the demo
    author joined the Support team.

**Review Nov 5 (P12).** Checked both repos' diffs against this section, §2, design §3, §6 and §9, AGENTS.md and
Practices-App-Dev: the audience of each customer-visible read (find#ArticleSuggestions with customerVisible,
get#PublishedArticle by id or by space and path, get#ArticlePublicLink), the exact published version, the wiki's view rule
on the agent's reads, create#ArticleFromCase's redaction, message audience and checks, the Commons Knowledge mount for
non-Customer Service users, review#ArticleFeedback's failure tolerance and operation key, and the acceptance walk against
the usable-when (it covers all four).
- R1 (high) find#ArticleSuggestions found a page's source among the suggested sources only, so a part of a space kept
  internal and not suggested (allowSuggestions N) fell to the broader customer source and its pages were suggested on a
  customer-visible surface. A page's source is found among all current sources, and of two equal ones the internal source
  wins (also for get#PublishedArticle across organizations). Mantle SupportKnowledge feature.
- R2 (medium) CaseDetail's Knowledge tab listed every linked page with its title and path, whether or not the wiki let the
  agent view it (a link widened page access). It lists only pages of the user's view scope (get#WikiViewScope).
  CustomerServiceKnowledge case.
- R3 (medium) create#ArticleFromCase took any email not from the customer as "our reply (customer-visible)", so a staff
  email or one to a supplier could go into an article; now outward is an email of the service desk to the customer or
  contact, anything else internal (INTERNAL_MESSAGE). Redaction missed the first name alone ("Thanks, Ana"), and an email
  address lost its name before its shape was matched; it now takes out first names and nicknames, party ids, address2, every
  linked record but products and categories, the customer's own orders, returns and invoices (the latest 200 each), and the
  parties of the case's emails, emails by shape first. Mantle spec cases.
- R4 (medium) review#ArticleFeedback made the task and reviewed the feedback in two transactions, so a failed review left a
  task behind; each feedback is one transaction (the internal review#ArticleFeedbackItem, as PurchaseRequests' groups).
- R5 (low) Send to customer addressed the case's Reporter even when an agent filed the case (F108); a staff party is
  skipped for the customer.
- R6 (low) get#PublishedArticle accepted an answer with no version; the version read must be the page's published one.
- Checked and kept: get#PublishedArticle refuses a page of an internal source, of no source, a draft or a restricted page
  whatever id or path is guessed, and reads the published version with no version asked; Commons Knowledge's own behaviour
  is unchanged outside Customer Service (`inCustomerService` only narrows the spaces, and its transitions check the case);
  the operation key answers a retry; the feedback list's comments are of the user's organizations. Left: a retry with an
  operation key after the batch committed and before the key was recorded reviews nothing again (AlreadyReviewed), as other
  batches.
- Specs (pass): Mantle SupportKnowledge (7), SupportCases; BOSS CustomerServiceKnowledge, CustomerServiceAccess,
  CustomerServiceCases, Commons Knowledge, KnowledgeReview, Notes. Acceptance not rerun (not changed).

### P13 — Feedback

Design §7 SatisfactionResults and ResponseDetail, §8 Feedback, §9 FeedbackForms, FeedbackFormDetail and
FeedbackDeliveryPolicy; CS-FEEDBACK, CS-JOBS.

- **The survey builder** (Commons', crosscut §8; §4): the four shared screens of crosscut §2, `Shared/SurveyForms`,
  `SurveyFormDetail`, `SurveyResponses` and `SurveyResponseDetail`, with the Customer Service context, mounted as
  FeedbackForms, FeedbackFormDetail, SatisfactionResults and ResponseDetail; Marketing mounts all four. A form changes
  by P7's dated fields and options (F16), and a response reads the form as of its time. The rating options' key is the
  score.
- **CS-FEEDBACK.**
  - The invitation is Commons' FormPublication and FormInvitation (`mantle.party.FormPublicationServices`; design
    X16) with the case's resolution episode as its context, built here under the owner-contract rule (§2) if Commons
    or Marketing has not: case, episode, form, delivery state and response; its token an ExternalAccessCapability of
    the form-invitation record kind registered in `ExternalAccess.js`. No CaseSurveyInvitation is built.
  - The delivery policy: effective-dated rows (eligible types and queues, delay, frequency, form, channel, token
    expiry, reminder cap, low-score follow-up team).
  - `mantle.request.CaseFeedbackServices`: `save#InvitationPolicy`, `create#FeedbackForm` and `publish#FeedbackForm`
    (`SUPPORT_POLICY_EDIT`), `create#Invitation`, `submit#CaseFeedback` (one durable response; a repeat answers the
    first) and `record#FeedbackFollowUp`; `ironstone.customerservice.FeedbackServices.find#CaseResponses` for
    SatisfactionResults.
  - The guard: `update#FormResponse` and `delete#FormResponse` refuse a response linked to an invitation (an entity ECA
    rule or an authorization rule, as P0 settles).
  - `CaseFeedbackServices.get#Invitation` for the page: the form version and the case's customer label only, never
    the case.
  - CS-JOBS: invitation send and reminders, bounded and idempotent by invitation. The link is the Support app's
    Feedback page for the case's site.
- **The Support app in mr-pass, its first page** (§2, §4):
  - `screen/Support.xml` under PASS's `Pass.xml`, the `support` app of `PublicSiteApp` with the service organization
    as its target, mounted at `/support` by default; its navigation, readiness and operator configuration on the
    pattern of Accounting P18's Billing and Supplier apps (F43);
  - the `support` app kind in `ExternalAccess.js` `appKinds`, with `SUPPORT_CONTACT_INVITE` (P1) as its permission,
    for P15's invitations;
  - Feedback: the invitation's page, taking its token as PASS's Unsubscribe does; `check#AccessToken` checks it, a GET
    shows the form and never submits, and PASS's throttling limits the posts;
  - the operations `getCaseFeedbackInvitation` and `submitCaseFeedback` in `Schema.js` and `Routes.js`, served by
    Mantle's PassApi for a remote frontend;
  - the `SupportAccess` spec, local and remote.
  - A low score makes an assigned follow-up notification. Comments are private to service management and the
    customer-authorized follow-up, under the shared retention policy (§4); there is no agent leaderboard.
- **Screens:** FeedbackForms (FeedbackFormList, NewFeedbackForm); FeedbackFormDetail (FeedbackFormHeader, FormAccess,
  FormFields, FieldOptions, FormPreview); ServiceDefaults' FeedbackDeliveryPolicy; the Support app's Feedback
  (CaseFeedback, at 390 px); SatisfactionResults (CsatFind, CsatResponseList, CsatStats); ResponseDetail
  (ResponseDetails, FeedbackFollowUp); Home's CSAT measure.
- **Usable when:**
  - resolving a case sends one invitation after the delay; the customer rates 2 with a comment, and a repeat answers
    the first;
  - a mail scanner's GET submits nothing; an expired, revoked or foreign token shows only guidance;
  - the low score makes a follow-up; the framework services cannot edit or delete the response;
  - an answered field is ended, never edited; a changed question is a successor field from a date;
    SatisfactionResults compares one effective period at a time;
  - the same rating through a remote PASS frontend, with only framework, webroot and PASS installed, records one
    response at the authority.

**Built Nov 5 (P13).**
- Commons' form publication (built here under the owner-contract rule, F173): Mantle `entity/FormPublicationEntities.xml`
  `mantle.party.FormPublication` (a DbForm offered for a purpose by an organization: context, site, open and close, access,
  repeat) and `FormInvitation` (recipient and address, context record and the record holding it, the app's policy row, the
  once-key, schedule, expiry, delivery state, sends, reminders, the one response and its score), with their enumerations
  (`FppCaseFeedback`, `FpaInvited`, `FprOnce`, `FinScheduled` … `FinRevoked`) and the DbForm purpose `DbfpCaseFeedback`;
  `service/mantle/party/FormPublication.js` (`publicationFor`, `guardResponse`) and `FormPublicationServices.guard#FormResponse`;
  the guard as run-before entity ECA rules (`entity/FormPublication.eecas.xml`: FormResponse update and delete, FormResponseAnswer
  create, update and delete refuse RESPONSE_LOCKED for a response linked from an invitation; F174). `ExternalAccess.js` gains
  the `FormInvitation` record kind (scope `CaseFeedback`, the Support app's `/Feedback?token=`) and the `support` app kind with
  `SUPPORT_CONTACT_INVITE` (F57); `PublicApps.js` the `support` app (target organization, readiness
  `CaseFeedbackServices.check#SupportAppReadiness`).
- Case feedback (Mantle `entity/SupportFeedbackEntities.xml`: the dated, audit-logged `FeedbackDeliveryPolicy` and
  `FeedbackFollowUp`; `service/mantle/request/CaseFeedbackServices.xml`, `CaseFeedback.js`): `create#FeedbackForm` (the default
  required rating 1–5 or 1–3 with an optional reason, comment and consent, or a copy of a published form), `publish#FeedbackForm`
  (refused while the form has a problem or no rating), `save#FeedbackFormField`, `save#FeedbackFormCondition`,
  `end#FeedbackFormPart`, `rename#FeedbackForm`, `get#FeedbackForm` (through P7's template rules, F177), `save#InvitationPolicy`
  (SUPPORT_POLICY_EDIT; a published form of the organization, its types and queues, delay, frequency, channel email, link days,
  reminders, low score, follow-up team and days; dated by `startRow`; `end`), `queue#Invitation` and `create#Invitation` (the
  `SupportCaseFeedbackInvitation` rule after the commit of a case's resolution: the policy then, its types and queues, the case's
  customer at a customer reporter's email else the customer's, the latest resolution episode as context, once per case or per
  resolution; F175), `send#Invitations` (the `send_CaseFeedbackInvitations` job every 15 minutes, `data/CaseFeedbackSetupData.xml`:
  bounded, each in its own transaction, a reopened case not sent, a send with no Support site or no mail tried three
  times, reminders, expiry; each send its own capability, F176) and `send#Invitation`, `get#Invitation` and
  `submit#CaseFeedback` (the page's operations: the support mount's target, `ExternalAccess.check`, the form as of now, the
  customer's label and never the case; the answer checked by P7's `checkValues` with the form's rules again, one FormResponse, a
  repeat answering the first, posts throttled 30 in ten minutes per requester beside the token lookups' 100, F180; a score at
  or under the low score makes a `FeedbackFollowUp` assigned to the follow-up team's first manager, else the queue team's, told on
  the new `CaseFeedbackFollowUp` topic, which names no comment), `record#FeedbackFollowUp` (a manager, or a member of the
  follow-up team) and `check#SupportAppReadiness`. `CaseTemplates.js` takes a feedback form in `templateOf` and exports `formAt`
  and `problemsOf`. The email template `MANTLE_CASE_FEEDBACK_EMAIL`.
- PASS (mr-pass): the Support app, `screen/Support.xml` (`passApp` support, default Feedback) and `screen/Support/Feedback.xml`
  with `Feedback.html.fancy` (CaseFeedback: a GET only reads; Send my answer posts `submit`; the receipt; guidance for a bad
  link; the rules as `data-visible-when`/`data-require-when` with `/js/moqui-form-when.js` loaded by the page); registered in
  `service/pass/Apps.js`, `screen/Pass.xml`, `screen/Shared/Header.html.fancy` (the Support header), `Schema.js` and `Routes.js`
  (`getCaseFeedbackInvitation` GET `support/feedback`, `submitCaseFeedback` POST `support/feedback/response`) with Mantle's mirrors
  `forum/ForumSchema.js` and `script/PassRoutes.js`, `TOKEN_WRITES` in `Transport.js`, `PassApi.js` and `PassAuthority.js`, and
  `test/MoquiConf.xml`'s `/support` mount; docs/Deployment.md's Support section and the README.
- BOSS (`service/ironstone/customerservice/FeedbackServices.xml`, `Feedback.js`): `find#FeedbackForms`, `get#FeedbackPolicy`,
  `find#CaseResponses` (service management; one form and one effective period at a time, F179; queue, team, customer, score and
  state; the counts on the raw scale), `get#CaseResponse` (the answers as of the response, text answers for managers and, with
  the customer's consent, the follow-up team, F182) and Home's CSAT (`csatMeasure`, the top two scores' share with the change,
  in `get#ServiceDashboard`). The survey builder's four shared screens with the Customer Service context only:
  `Shared/SurveyForms.xml` (FeedbackFormList, NewFeedbackForm) and `Shared/SurveyFormDetail.xml` (FeedbackFormHeader, FormFields,
  FieldOptions, the rules, FormPreview with drafts, FormAccess read only, F178) mounted as `Settings/FeedbackForms` and
  `Settings/FeedbackFormDetail`; `Shared/SurveyResponses.xml` (CsatFind, CsatStats, CsatResponseList) and
  `Shared/SurveyResponseDetail.xml` (ResponseDetails, FeedbackFollowUp) mounted as `Reports/SatisfactionResults` and
  `Reports/ResponseDetail`. ServiceDefaults' FeedbackDeliveryPolicy (Save from a date, Stop asking, the earlier rows); SettingsHome's
  Feedback forms link; the `CaseFeedbackFollowUp` topic's link and the root's notification topic; `linkPaths`.
- Demo: Accounting's portal demo mounts the Support app on ZIZI_PORTAL for ORG_ZIZI_RETAIL; `FeedbackDemo.js`
  (`DemoServices.load#FeedbackDemo`, `data/BossZZCustomerServiceFeedbackDemoData.xml`): Retail's "Retail case feedback" form,
  published, its policy (an hour after resolving, once per case, one reminder, a score of 2 or less followed up by the Support
  team), and Joe Q Public's "Replacement filter arrived damaged" case, resolved and rated 4 through the page's operation.
- Specs: Mantle `test/request/CaseFeedback` (5 features, 1.2 s: the form and policy with their refusals; the rule's one
  invitation and NO_POLICY; the job's one send with its Support link and a rerun's none; the page's read, a forged token's
  NotFound, the refused submits, a 2 with a comment kept once, the follow-up and its notice without the comment; the follow-up
  recorded and refused; update#FormResponse and delete#FormResponse refused for the invited response and unchanged for a plain
  one). mr-pass `test/Support/SupportAccess` (2 features, 0.1 s: the page with its rules and script, never the case, a GET
  answering nothing, three bad links' guidance; an answer through the facade with the comment rule, a repeat, the receipt) and
  `Portals` (the targeted apps now billing, supplier and support). BOSS `CustomerServiceFeedback` (2 features, 0.9 s:
  FeedbackFormDetail and ServiceDefaults rendered once in qvt; SatisfactionResults' read and one qvt render; ResponseDetail's
  read; Home's CSAT), `CustomerServiceAccess` (+1 feature: forms the administrator's, answers the manager's, the agent and Services
  refused; Home's measures all configured now). Acceptance: BOSS `CustomerServiceFeedbackWalk` (5 features: the usable-when
  through FeedbackForms, FeedbackFormDetail, ServiceDefaults, the rule, the job after the delay, the page operations,
  ResponseDetail's follow-up in qvt, the guard, a successor question from a date and one period at a time) and `AppStructure`
  (the four mounts' routes); mr-pass `test/acceptance/SupportFixtures` (PASS_HTTP's support mount and two invitations),
  `test/acceptance/client/SupportFeedbackHttp` (2 features: a scanner's two GETs answer nothing; at 390 px the comment shows and is
  required for a 2, the answer, the receipt, a repeat post; bad links) and `RemoteHttp` (+1 feature: the same rating through the
  frontend, one response at the authority).
- Tests run (all pass): Mantle CaseFeedback, SupportTemplates, SupportCases, SupportSla, SupportRelations, WorkProjectRequests,
  RecordVisibility, RecordLinks, WorkProjectClients, CommonsToday, OrderToCashBasicFlow, ReturnToResponseBasicFlow,
  ShipmentReturnMisc, WorkPlanToCashBasicFlow, AccountingPortals, SupplierPortal (192 features); mr-pass SupportAccess, Forum,
  ForumAccess, Portals, SupplierPages, PublicIdentity, Integrations; BOSS CustomerServiceFeedback, CustomerServiceAccess,
  CustomerServiceTemplates, CustomerServiceCases, CustomerServiceRelations, CustomerServiceKnowledge; acceptance
  CustomerServiceFeedbackWalk, AppStructure, SupportFeedbackHttp and RemoteHttp (local authority; the remote pair of
  docs/Deployment.md "Reproducing the remote check" not run here). `moqui lint --screens`: 136 flagged sites, as master; none in
  the screens added or changed.
- Inventories: ss-inventory's Survey forms (all 14); usl-inventory's Customer Service P13 table.
- Decisions:
  - The rating is the form's first choice (buttons or list) whose option values are all whole numbers, and the value chosen is
    the score; a successor rating keeps the rule.
  - The page asks the form as of now and a response reads it as of its time; the invitation keeps its form and policy row.
  - The invitation goes to a customer reporter (not a staff one) with an email, else the customer; it names the case's customer.
  - Comments are service management's; the follow-up team reads text answers only with the customer's consent (the seeded
    "You may contact me"). No agent ranking is built.
  - SatisfactionResults and ResponseDetail are checked in their services, not by an artifact group on the shared screen files,
    which Marketing will mount too (F183).
- Findings (provisional):
  - **F173** Commons' FormPublication and FormInvitation (design-drawers-commons §19, X16) did not exist; built in
    `mantle.party` with the Commons names, the case's context on the invitation (contextEntityName and contextId: the resolution
    CaseSlaEpisode, else the Request) and the record holding it (recordEntityName and recordId), so Marketing's publications use
    the same rows. Design-drawers-commons §19 changed.
  - **F174** P0 left the guard to an entity ECA rule or an authorization rule: an authorization rule would bind only artifact
    calls, and the framework services run their entity writes with the caller's authorization, so the guard is a run-before
    entity ECA rule on FormResponse and FormResponseAnswer, which every path (the services, entity-auto, a data load) meets; a
    response with no invitation is untouched.
  - **F175** A resolution episode exists only where a service level policy applies (P4's start#CaseEpisode records
    NO_POLICY and makes none), so a case with no SLA has no episode to bind: its invitation's context is the Request, and once per
    resolution keys it by the request's update stamp at resolution.
  - **F176** An ExternalAccessCapability keeps only its token's digest, so the job cannot mail the same link twice: each send
    and reminder makes its own capability ending at the invitation's expiry, every one opening the one invitation.
  - **F177** A feedback form is edited by P7's template rules (successor fields, ended options, rules, problems) with every
    field customer-visible: `CaseTemplates.js` `templateOf` takes the purpose `DbfpCaseFeedback`; Mantle's raw messages say
    "template" there.
  - **F178** Design FormAccess grants author and read access by DbFormUserGroup, but DbFormUserGroup modifies a screen form
    for a user group and grants nothing on a survey; access is the permissions Mantle checks, so FormAccess shows who may change
    and read the form, read only. Design FeedbackFormDetail changed.
  - **F179** DbForm has no version; SatisfactionResults' "version" is an effective period of the form, from each date its
    fields, options or rules start or end, and an invitation counts in the period it was made in.
  - **F180** "PASS's throttling" is two limits in Mantle: ExternalAccess's token lookups (100 in ten minutes per requester) and
    the feedback posts (30 in ten minutes), both by the framework's sign-in limits.
  - **F181** The Support app's readiness service is `CaseFeedbackServices.check#SupportAppReadiness` while Feedback is its only
    page (organization, service policy, feedback policy, canonical host); P15 may move it to SupportCaseServices.
  - **F182** The plan's "comments private to service management and the customer-authorized follow-up": the consent is a
    checkbox answer Y on the form (the default's contactOk); an agent of the follow-up team reads text answers only with it.
  - **F183** The four survey screens are shared files Marketing will mount, so a DENY of the Customer Service root group on a
    file would follow a user into Marketing; their reads check the capability instead, and an agent opening CSAT results is told
    it is not available.
  - **F184** In a client acceptance spec an array answered by `when()` reached `then()` without its array methods, and a
    session's `get` called from an array's `map` callback failed ("not a function"), so the walks answer objects and counts.

**Review Nov 5 (P13).** Checked the three repos' diffs against this section, §2, design §7–§9, crosscut X16 and
design-forum §4.1/§4.3: the token (`ExternalAccess.check` with the FormInvitation kind's scope, the capability's thruDate at the
invitation's expiry, revocation, an invitation no longer reachable, the mount's target as the organization), a GET that only
reads, the bad links' guidance with nothing of the customer, get#Invitation's projection (the form as of now, the organization's
and customer's names, the receipt), the post's limit per requester (a registered deployment's browser address, F180),
submit's checkValues with the customer audience and evaluate#DbFormDependencies (a value for a name not on the form dropped,
an internal field refused), one response under the invitation's row lock (a concurrent second post waits, then answers the
first); PASS's operations (allow-listed fields, HTTP kinds NotFound, Unprocessable, Tarpit; the invitation is the operation's
identity, so `operationId` is carried but a repeat with another payload answers the first rather than conflicting, as this
section asks); no `ironstone.*` in mr-pass or in Mantle's new code; the guard EECAs on FormResponse and FormResponseAnswer (every
write path, the bulk ones row by row; the framework DbForms spec passes with them loaded); the Request EECA (a transition into
ReqCompleted only, queued after the commit, the unique invitationKey); the job (bounded, a new transaction each, locked and
re-checked so a rerun or a second run sends nothing twice, three tries, reminders capped by the policy row and the expiry);
comments (SatisfactionResults' list for service management only, ResponseDetail's text answers for the follow-up team only with
consent, the notice naming no comment); no per-agent ranking; leanness.
- R1 (low) `CaseTemplates.templateOf` now takes feedback forms, so `save#CaseTemplate` could make one a queue's case template,
  which create#Case then ignored: `useForQueue` refuses it (TEMPLATE_UNAVAILABLE); CaseFeedback checks it.
- R2 (low, test) A good link on another organization's Support site was not checked: CaseFeedback reads and answers it there
  (NotFound, both).
- R3 (trivial) Reports.xml named an artifact group BOSS_CS_SATISFACTION that does not exist.
- Ran: Mantle CaseFeedback, SupportTemplates, SupportCases, SupportSla, SupportRelations, WorkProjectRequests, CommonsToday (with
  BOSS's demo loaded, its Retail policy active) and the framework DbForms spec; mr-pass SupportAccess, Portals; BOSS
  CustomerServiceFeedback, CustomerServiceTemplates; all pass. The true remote pair of docs/Deployment.md "Reproducing the
  remote check": the authority (this runtime, `--acceptance --spec ClientFixtures,PortalFixtures,SupplierPortalFixtures,
  SupportFixtures --serve`), a scratch frontend runtime of framework, webroot, tools and mr-pass only (RemoteFixtures passes: no
  Mantle catalog) with `pass_backend_url` over REST, and RemoteHttp through it: 8 features pass, the Support feature's rating 2,
  its receipt, and a repeat's 5 answering "2 of 5".
- Left for the lead: (1) the CSAT results tab shows to an agent, who is then told it is not available (F183); a menu item is
  hidden only by artifact authorization, which the shared file cannot carry, so hiding it needs P14's catalogue (the tab
  `menu-include="false"`, a link for managers) or a framework `hide-when`. (2) P15's privacy anonymization needs a way past
  the guard: a Mantle service `FormPublicationServices.redact#FormResponse` (a privacy permission and the organization, blanking
  text answers and logging who and why), with `guardResponse` letting a write through only while that service is on the
  artifact execution stack, never by a context flag a caller could set. Both go to P14 and P15.
- R4 (medium) The guard keyed on FormInvitation.formResponseId, so an entity-level write that unlinked it or deleted the
  invitation took the response past it: run-before EECAs on FormInvitation refuse a change of a set formResponseId and a
  delete of an invitation with a response (RESPONSE_LOCKED); CaseFeedback checks both.
- R5 (low) A link the job could not make (no Support site for the organization) left the invitation Not delivered at once; it
  is tried again on the next runs as an unsent mail is, up to three tries. The expiry sweep marks each row in its own catch,
  naming a failing invitation and going on. CaseFeedback reran with BOSS loaded, and SupportAccess: pass.

- **Wave 6 suites (Nov 5, on master after P11 and P13 merged, nothing else running):** standalone mr-mantle 1,741
  passed, 3 failed, 11 skipped: the baseline WorkTimeEntries and WorkTimesheets (they read mr-boss demo data, IRON-3 and
  the BOSS demo's line manager, so they fail where mr-mantle runs alone and pass with mr-boss), and ProductionShopFloor,
  whose reopen check read its labor events with no order (now by id; mr-mantle 5270735f); `./moq test-apps` 3,066 server
  features passed and 1 failed (AccountingPayables expected ZIZI_PORTAL's mounts and links before P13 added the Support
  mount and the demo's feedback link; mr-boss a14bd353), 14 client features passed; within every budget (server:
  mr-mantle 323.1 of 335 s, mr-boss 230.7 of 245 s, mr-pass 12.3 of 15 s; client: mr-boss 41.9 of 44 s); `moqui lint
  --screens` clean.

### P14 — Reports

Design §7; CS-REPORTING, CS-STACK (the dataset). Reads of what the phases before recorded.

- **CS-REPORTING:** `ironstone.customerservice.ReportingServices` `get#ServiceDashboard` (complete),
  `get#SlaCompliance`, `get#ResponseTimes`, `get#CaseVolumes`, `get#ReturnAnalysis` and
  `get#CustomerServiceStatistics`: the access filters of P1, an as-of time, time zone and currency, bounded grouping and
  CSV under the same permissions with the export audited. Home reads no unbounded scan.
- **Insights** (design §7, Z10): each report registered with the Insights catalog with Customer Service as its one
  owner; Insights lists and schedules them under this app's authorization and adds no second calculation.
- **Shipped reports** (CS-STACK, L6): a service dataset in `report/*.json` with an SLA-breach alert template over P4's
  breaches, which Insights admits.
- **Screens:** Reports (ReportCatalogue); ServiceLevelCompliance (SlaFind, SlaResults); ResponseTimes (ResponseFind,
  ResponseResults); CaseVolumes (VolumeFind, VolumeResults); ReturnAnalysis (ReturnAnalysisFind,
  ReturnAnalysisResults); Customer360's Service tab (CustomerServiceStatistics, ServiceAgreements); Home's measures with
  the previous period and the My and Team split.
- **Usable when:**
  - compliance leaves cancellations out of the rate and shows them apart, and open cases past due stay counted;
  - response times show median and p90 in business and elapsed time with their counts;
  - a merged case counts once in the backlog;
  - ReturnAnalysis shows amounts per currency and counts an open return as requested;
  - a manager of one team sees only its queues, and the CSV has the same rows.

**Built Nov 5 (P14).**
- Mantle (views only, `entity/SupportReportEntities.xml`, new): `mantle.request.support.CaseClockRequest` (a clock with its
  case's queue, type, channel, priority and status) and `CaseRequestClock` (a case with each of its clocks, join-optional, so a
  case with none is one row with no clock). No Mantle service or rule changed.
- BOSS `service/ironstone/customerservice/Reporting.js` (new) and `ReportingServices.xml` (appended): the reports' scope (the
  Reports area's grant; the user's organizations, one asked for refused when not theirs; the queues of the teams they report
  on: an administrator every queue they see, a manager the queues of the teams they manage, anyone else their own teams'
  queues; a queue or team asked for outside it refused RECORD_UNAVAILABLE), the period (days in the user's zone, at most two
  years) with an as-of time (now, or earlier: the facts recorded by then by their dates), the frame every answer carries (as
  of, period and time zone, filters and queues, what was left out), bounded reads (5,000 rows, 2,000 timed clocks, 200
  groups, each named when reached) and the export (output csv: the frame then the same rows, formula-like text guarded, audited
  through `org.moqui.report.ReportServices.audit#Export` as `CustomerService.<report>`). Services: `define#ReportParameters`,
  `get#ReportCatalogue`, `get#SlaCompliance` (clocks started in the period as they stood at the as-of time: met, missed, closed
  without it, open past due, open within target; the rate met over the decided and the open past due; cancelled apart, never
  in the rate; never an SlsMerged clock, its carried copy on the kept case counted; by queue, team, band, policy row and
  calendar, channel or clock; paused business time), `get#ResponseTimes` (first response or each resolution episode done in
  the period: count, median, p90 and mean in business time on the clock's calendar less its pauses, BusinessTime.js
  `elapsedMinutes`, and in elapsed time; the open clocks and their median age), `get#CaseVolumes` (received, of which split
  off, resolved, reopened and cancelled from the status audit log, merged apart from the cancellations, assignments, and the
  backlog open at the as-of time; by queue, team, type, channel, day, week or month), `get#ReturnAnalysis` (the organizations'
  customer returns of served customers entered in the period, cancelled ones apart: returns, open returns, items, requested
  (an open return counted as requested), received, accepted, rejected (receipts by then), replaced, credited (billing links
  settled by then), and the requested, credited and open amounts per currency, withheld without PRICE_VIEW, ACCOUNTING_VIEW
  or RECEIVABLE_VIEW; by reason, product, response, customer, received status or month), `get#CustomerServiceStatistics`
  (crosscut §3.2: open cases, failed service levels, mean first response and resolution in business time, the answers' mean
  score and count, no comment, each with its denominator) and `get#ServiceAgreements` (the customer's AgrService agreements
  with the user's organizations: period, status, covers now, products, warranty terms; whether the user may store one).
  `get#ServiceDashboard` is complete: the My and Team split (`splitRows`: the user's own cases' open, overdue and service
  levels beside their queues' for a case editor in queues) beside each rate's change against the previous period.
- `Cases.js` (F112): Needs response and SLA risk read `CaseRequestClock` with the case fields distinct (no id list read
  first); `get#QueueCounts` counts open, assigned, overdue and breached per queue in the query (no case list read);
  `slaMeasures` counts over `CaseClockRequest` (no 20,000-id list), and with `myOnly` the user's own; `myCounts` (new).
  `CustomerService.js`: the choices `reportQueues` and `reportTeams` (Reporting.js `reportQueues`), and the link paths.
- Screens: `Reports/ReportsHome.xml` (ReportCatalogue, replacing the placeholder: each report the user may read with what it
  shows, its filters and its export, CSAT results for service management only), `Reports/ServiceLevelCompliance.xml` (SlaFind,
  SlaResults with a queue's row opening its cases), `Reports/ResponseTimes.xml` (ResponseFind, ResponseResults),
  `Reports/CaseVolumes.xml` (VolumeFind, VolumeResults), `Reports/ReturnAnalysis.xml` (ReturnAnalysisFind,
  ReturnAnalysisResults, the amounts per currency), each with its totals and an exportCsv transition;
  `template/CustomerServiceReportParts.xml` (ReportFrame, ReportMissing); `Reports.xml` takes SatisfactionResults out of the
  menu (`menu-include="false"`, F186); `Shared/Customer360/ServiceStatistics.xml` (the Service tab: CustomerServiceStatistics
  with its period and ServiceAgreements with New agreement and Change over `mantle.request.WarrantyServices.store#ServiceAgreement`
  after `check#Record`, for SUPPORT_POLICY_EDIT); `Home.xml` each rate's change (`delta`) and the My and Team split.
- Shipped reports (CS-STACK, L6): `data/BossCustomerServiceReportData.xml` (the DataDocument `BossServiceClock` over
  CaseSlaEpisode with its case's queue, type, channel and status, the push feed `BossServiceClocks`, granted to ADMIN),
  `report/boss-service-clocks.json` and `report/boss-service-breaches.json` (datasets by start and by breach) and
  `report/boss-service-sla-breach.json` (the alert template: cases breached in the last hour by queue, above 0, to the
  service managers on ReportAlert; it runs once saved as a copy).
- Specs: regression `test/CustomerService/CustomerServiceReports` (2 features, 1.4 s: compliance with a merged, a cancelled,
  an open past-due and a met clock; the export's rows; response times; return amounts for the manager and withheld from the
  return authorizer; the catalogue's CSAT entry for the manager only; the shipped definitions; the views by clock and the
  queue counts; one qvt render of ReportsHome, the four reports and Customer360's Service tab) and `CustomerServiceAccess`
  (+1 feature, 0.2 s: the manager reads the Support queue and is refused Privacy's; the reader refused; Services' agent refused
  Retail and Retail's customer). Acceptance `test/acceptance/CustomerService/CustomerServiceReportsWalk` (4 features, the
  usable-when: a cancelled case's clocks apart, the kept case's open past-due clocks counted, the merged source's never, three
  received, one merged, one cancelled, the backlog once; a resolution timed in business and elapsed time; an open return
  requested with amounts per currency; the manager's queues against the administrator's, and the CSV's rows), `AppStructure`
  (the five report routes; the placeholder floor 45).
- Tests run (all pass): BOSS CustomerServiceReports, CustomerServiceAccess, CustomerServiceCases, CustomerServiceFeedback,
  CustomerServiceRelations, CustomerServiceWarranty; acceptance CustomerServiceReportsWalk, AppStructure. `moqui lint
  --screens`: 136 flagged sites, as master; none in the new or changed screens. No Mantle service or rule changed, so the
  Mantle compatibility specs were not rerun.
- Inventories: usl-inventory's store#ServiceAgreement row (Customer360's ServiceAgreements). No ss-inventory row is designed
  into the reports (they have no mr-marble form).
- Decisions:
  - The reports' queues are the teams the user reports on (above), not every queue they may list: a queue shown to the whole
    organization (SqvOrganization) is in Cases for every agent but in the reports of its team, its managers and the
    administrator only.
  - The compliance cohort is the clocks started in the period (a case's receipt, a reopen's clock), each read at the as-of
    time; closed without it (unmet) counts as missed in the rate.
  - The customer's satisfaction on Customer360 is the answers' mean score with its count for every Customer Service user; the
    comments stay service management's (P13).
- Findings (provisional):
  - **F189** Insights' catalog (`ironstone.insights.ReportCatalogEntry`, INS-02) is not built and no app registers with it
    yet (Purchasing P15 built none; Manufacturing F143 waits): Customer Service's entries are `Reporting.js`
    `catalogueEntries` in design-insights §6.1's contract (entry id, the one owner, title, description, route, parameters,
    the read capability, export), served by `get#ReportCatalogue` for ReportsHome, for Insights' registry to read when built.
  - **F190** A dataset has one time field, so the shipped service data is two datasets over one DataDocument (by the clock's
    start and by its breach); the breach alert reads the second. Insights' admission (design-insights §5) is not built: the
    framework loads `report/*.json` read-only, and the alert template runs only as a saved copy, as Mantle's sales one.
  - **F191** A report dataset is not filtered by the viewer's organizations at query time, so `BossServiceClock` is granted
    to ADMIN only, as Mantle's sales datasets are, until Insights' admission applies the organization filter.
  - **F192** Home's open, overdue and unassigned are counts now: their previous period needs the statuses at its start
    (the audit log), which nothing keeps as a measure; the change shows on the rates (SLA compliance, first response,
    resolution, CSAT).
  - **F193** Design ResponseTimes' "next response" has no record: P4 keeps one first-response clock per case, never
    restarted, and no clock per later reply, so ResponseTimes measures first response and each resolution episode. Design
    ResponseTimes changed; a next-response clock is §7's.
  - **F194** Design ReportCatalogue's "last run" and "favorite saved find" have no source (a report is a read, not a stored
    run); the catalogue shows what each report shows, its filters and its export. Design Reports changed.
  - **F195** ReturnAnalysis' return rate against the quantity shipped and the refunded amounts (ReturnItem's refund
    payment) are not read: the rate needs the organizations' shipped quantity per product in the period, and a refund is a
    payment, not a ReturnItemBilling link; the credited amount is the billing links'. Left for P16 or §7.
  - **F196** The as-of time reads each fact by its own date (a clock's actual, due and breach; a receipt's received date; a
    billing link's settled date; the audit log's change date); a clock's cancellation has no date of its own, so a cancelled
    clock counts cancelled at any as-of time.
  - **F197** F112 answered: the views by clock and Home's counts read the case with its clocks in one query; Mantle's
    `Sla.js` `riskRequestIds` and `awaitingResponseIds` (2,000 ids) are no longer used by BOSS and stay for Mantle callers.
  - **F198** F186 answered: SatisfactionResults is out of the Reports menu, and the catalogue offers it to
    SUPPORT_CASE_MANAGE holders, who alone may read it.
  - **F199** The export audit is a log line on `moqui.report.audit` (`audit#Export`: user, kind, definition, rows), not a
    record; a report export appears there as `CustomerService.<report>`.
  - **F200** AppStructure's placeholder floor is now 45 (ReportsHome built); P15 may lower it too.

**Review Nov 5 (P14).** Checked each measure against its definition (compliance: cancellations apart, open past due in the
rate, SlsMerged never, the carried copy once; response times: business time on the clock's calendar less its pauses, which
Sla.js keeps in business minutes; volumes: a merged source cancelled, never in the backlog; returns: an open return requested,
amounts per currency from ReturnItemBilling's unit amount, withheld as text without the amounts rule); the scope (the area's
grant, organizations, the reported teams' queues; the same rows in the CSV, whose transition is on the report's screen); the
formula guard (=, +, -, @, tab, CR; numbers in number columns kept) and audit#Export; no comment on Customer360 or the reports;
Customer360's Service tab only with appRoot CustomerService, store#ServiceAgreement checking SUPPORT_POLICY_EDIT, the
organization and the agreement's own organization and customer; the dataset granted to ADMIN, and report queries gated by
DataDocumentUserGroup; F112's views (no id list; distinct counts are a sub-select) with CustomerServiceCases and SupportSla.
- R1 (medium, correctness and performance) `get#CaseVolumes` read every request's status changes in the period from the audit
  log (other organizations', RFQs and purchase requests), capped at 5,000, before filtering by queue: another organization's
  activity could fill the cap and undercount resolved, reopened and cancelled, over an index-less date scan. Mantle's new view
  `CaseStatusChange` (EntityAuditLog joined to its Request) filters by the scope's queues, type and channel in the query.
- R2 (medium, performance) `CaseSlaEpisode` had no index on the dates the reports' cohorts and Home's counts read by period:
  `CASE_SLA_EP_START`, `CASE_SLA_EP_ACTUAL` and `CASE_SLA_EP_BREACH` (an extend-entity in SupportReportEntities.xml).
- R3 (medium, access) the shipped SLA-breach alert template's contact point was BOSS_CUSTOMER_SERVICE_MANAGER, so a saved copy
  would notify every organization's service managers of all organizations' breaches by queue; it is ADMIN, as Mantle's sales
  alert is (F191), and a saved copy sets its own.
- R4 (low, test) CustomerServiceReports computes response times by hand on a spec calendar (Mon-Fri 9-17 Chicago): three clocks
  across a weekend, with a pause and within a day, and a merged one never timed: median 120, p90 420, mean 190 business minutes,
  median 480 and p90 3,960 elapsed. The spec is 1.5 s.
- Left for the lead: CaseVolumes' backlog "open at the as-of time" uses the cases' current status, so an earlier as-of time
  counts a case resolved since as closed (the statuses at a past time need the audit log, as F192); a viewer-scoped dataset
  could use Insights' `contextFilters` on organizationPartyId when admission is built (F191). Acceptance
  CustomerServiceReportsWalk was not rerun after R1 (its volumes feature covers it); the new view was checked against the
  audit log filtered by hand in a throwaway feature.

### P15 — Support app

The rest of the customer pages, in the PASS Support app P13 started (§2, §4), on CX-PORTALS' capability service.
Design §8; CS-PORTAL.

- **CS-PORTAL, the Mantle side** (F41). `mantle.request.SupportCaseServices` customer services, each checking the
  contact's customer relationship or `check#AccessCapability` first and answering allow-listed projections with
  capabilities and revisions: `get#SupportHome`, `find#CustomerCases`, `create#CustomerCase` (with
  `validate#TemplateValues` and the queue's defaults; nothing internal accepted from the page), `get#CustomerCase`
  (outward messages and approved shared files only), `reply#CustomerCase`, `request#CaseReopen` and
  `cancel#CustomerCase`; `mantle.order.ReturnPolicyServices` `find#CustomerReturns`, `request#CustomerReturn`,
  `get#CustomerReturn`, `add#ReturnEvidence` and `withdraw#CustomerReturn`; `mantle.order.OrderChangeServices`
  `request#CustomerCancel`, a cancel-kind proposal through `save#OrderChange` (P10); and
  `mantle.request.KnowledgeServices`' help reads and `rate#Article` over the Support mount's knowledge sources (P12).
- **CS-PORTAL, the PASS side.** Each of those as an operation in `Schema.js` and `Routes.js` (`requestOrderCancel` for
  the cancel), served by Mantle's
  PassApi to a remote frontend, and called from the app's pages through `pass.Facade.call#Operation`. Every operation
  maps to a Mantle service; none to an `ironstone.*` one (§2).
- **Customer identity** (§4). A contact is a PASS public account. An internal user holding `SUPPORT_CONTACT_INVITE`
  (P1) invites them from ContactDetail through a PASS invitation bound to the Support app and the customer
  (`invite#Contact`, which takes an organization only); redeeming it makes the contact relationship Mantle checks. A
  customer administrator, a role on that relationship, gives a contact the organization's cases. Domain matching grants
  site membership only, never a customer relationship (design-forum §5.1). A signed-in account whose own party, with a
  verified email, is the case's or return's customer reaches its own cases and returns with no invitation, through the
  self relationship P15 adds to ExternalAccess `check` (design §8 Access, X6); a Shop buyer's account is the same
  account, and the PASS Account hub links MyCases and MyReturns.
- **Shop** (X7): Shop's "Get help" calls `create#CustomerCase` with the store's queue, its "Request return"
  `request#CustomerReturn`, and its cancel P10's cancel-kind proposal; Commerce's Requests and Returns are
  store-filtered views of these.
- **Privacy** (CS-PRIVACY, X15): the privacy provider registered with Admin's proposed PrivacyServices,
  `SupportCaseServices.preview#PersonalData` and `apply#PersonalDataDisposition` over cases, conversations, case files,
  returns, evidence, feedback responses and channel sessions, anonymizing where financial or stock audit stays, once
  Admin's provider contract is built. Until the PASS Account privacy page and PrivacyRequests ship, P2's interim
  privacy cases take the requests (§7).
- **Links and files.** CustomerReturn takes the RMA's token and NewCustomerCase a queue's intake token (P6), as
  Feedback does, through `check#AccessToken`. Evidence and case files go through PASS's media staging and scanning
  into RequestContent or ReturnContent of a customer-visible type. The return label downloads through the facade,
  streamed by a remote frontend.
- **Help.** SupportHome and CustomerArticle read the published pages of the Support mount's knowledge spaces through
  the site pages' exact wiki binding (F15, F43), with helpful feedback under a per-page nonce and rate limit, and
  Create case citing the article.
- **Notices.** Case replies, return decisions and labels mailed to a contact link to the Support app's pages of the
  case's site, from the URLs Mantle builds for its members.
- The outside-working-hours notice from the queue team's schedule (P4).
- **Screens** (design §8), under `screen/Support/`: SupportHome (HelpSearch, HelpResults), MyCases (MyCaseFind,
  MyCaseList), NewCustomerCase (with OrderCancelRequest for a selected order), CustomerCase, MyReturns (MyReturnFind,
  MyReturnList), RequestReturn, CustomerReturn and CustomerArticle, at 390 px and on the desktop. BOSS gains
  ContactDetail's Invite to support and the Support mount's settings in ServiceDefaults (its queues, intake types and
  knowledge spaces).
- **Demo:** a PASS site for ORG_ZIZI_RETAIL with the Support mount, a JoeDist contact and a JoeDist administrator as
  invited PASS accounts, CustJqp's own account through the self relationship (CustJqp is a person, which
  `invite#Contact` refuses), and token fixtures for the specs.
- **Usable when:**
  - the JoeDist contact redeems the invitation, signs in, sees their cases and replies; an internal note and an
    internal file never show; a colleague's case shows only with the administrator's organization-wide visibility;
  - CustJqp signs in with no invitation and sees only their own cases and returns;
  - a cancel request for an approved order shows "Cancellation requested" and files a proposal in OrderChanges;
  - the contact requests a return of the delivered order's eligible lines, and the server picks the facility and the
    window;
  - the RMA link shows the label; the contact withdraws before receipt, and after it is told to ask an agent;
  - an anonymous sender files a case through the queue's form and gets no case read until verified;
  - a forged, expired or revoked token shows nothing about the customer or the record; an anonymous reader sees
    published help only;
  - the same walk passes through a remote PASS frontend with only framework, webroot and PASS installed;
  - the regression suites of mr-pass and mr-boss pass unchanged.

**Built Nov 5 (P15).**
- Mantle, the customer side (CS-PORTAL; F41): `service/mantle/request/SupportPortal.js` (SupportHome, help, cases),
  `service/mantle/order/CustomerReturns.js` (returns) and `service/mantle/order/CustomerOrders.js` (the cancel request), each
  operation finding the support mount's organization (a published site, an internal target with a service policy) and the
  asker first: a bearer link through `ExternalAccess.check` (a case's CaseView, a queue's CaseIntake, an RMA's ReturnRma), or a
  signed-in account acting for a customer of the organization (`ExternalAccess.actingParties`: its contact grants, with the
  administrator flag, and its own party through the self relationship), each a customer the organization serves. Services
  appended to their packages: `SupportCaseServices` get#SupportHome, find#CustomerCases, get#CaseIntake, create#CustomerCase,
  get#CustomerCase, reply#CustomerCase, request#CaseReopen, cancel#CustomerCase, get#CaseFile, save#SupportAppSetting,
  get#SupportAppSetting, get#CaseCustomerLink; `KnowledgeServices` get#CustomerArticle and rate#Article; `ReturnPolicyServices`
  find#CustomerReturns, get#ReturnableOrder, request#CustomerReturn, get#CustomerReturn, add#ReturnEvidence,
  withdraw#CustomerReturn, get#ReturnLabel; `OrderChangeServices` request#CustomerCancel, get#CustomerCancel,
  withdraw#CustomerCancel. The projections: a case's customer status label (the mapping's customerLabel, else the customer's
  words), its outward messages only (no Comment, Message, StatusUpdate, CpServiceInternal call, cancelled or bounced message;
  a staff mail once ES_SENT; a staff sender shown as the organization), files of the new customer-shared type only, the
  customer-visible template values (P7's contact path: `CaseTemplates.customerProjection`), the customer's own order and return
  links, its revision and what the page may do; a return in the customer's words with quantities, remedy, what was issued
  (never an amount), expiry, instructions, tracking and evidence.
- Mantle, the writes: create#CustomerCase files into one of the mount's queues and types (the queue's priority, assignment and
  SLA through `ensure#CaseProfile`; P7's `checkValues` with the customer audience; the order and the cited article linked, the
  article named in the description; a file staged and scanned into RequestContent RqCntCustomerShared), or with a queue's
  token create#IntakeRequest's public form (its limits; an unknown sender held; the answer reads no case); a reply is a WebSite
  message from the customer's side filed on the case, so P4's and P8's rules record it (the clocks, the assignee's notice, a
  reopen within the window or a follow-up); request#CaseReopen a reply with the reason within the window; cancel#CustomerCase
  the workflow's move to Cancelled at the shown revision, resolved RrWithdrawn. A return request is `submit#CustomerReturn` on
  the Support claim (`ReturnPolicies.js asCustomer`; F204) for the customer's eligible lines only (a self-service policy,
  in its window, at most what is left), customer-visible reasons and the policy's remedies, the server choosing the facility
  and keeping the policy, no assignee; withdraw#CustomerReturn is `cancel#CustomerReturn` on the claim before any effect,
  after it "ask an agent"; evidence a scanned file as ReturnContent RtcntCustomerEvidence; the label `labelImage` kept once as
  RtcntReturnLabel. requestOrderCancel is P10's `save#OrderChange` cancel kind on the claim (`OrderChanges.js customerSide`),
  "Cancellation requested" unless customerImmediateCancel; the customer's read (F162) names its state and lines, no decision
  reason or approver; withdraw#OrderChange takes the filer unscoped. Posts throttled per requester (the framework's sign-in
  limits); creates, replies, evidence and withdrawals keyed by the page's operationId (CX-POSTING's operation record).
- Mantle, the rest: `entity/SupportPortalEntities.xml` (`SupportAppSetting`, dated and audit-logged: the mount's queues, types
  and knowledge spaces; `ExternalAccessContact.administrator`; `ArticleFeedback.nonceDigest`; the seeds RqCntCustomerShared,
  RtcntCustomerEvidence, RtcntReturnLabel, RrWithdrawn). `ExternalAccess.js`: `selfOf` and `actingParties`, the Request and
  ReturnHeader kinds' `self`, the Request kind's `contactAllows` (a contact's own case, else a customer administrator), the
  support app kind taking a person customer (F57) and a Customer role, `invite#Contact`'s `administrator`. `party/PortalMedia.js`,
  Accounting's `Portal.js stage` moved to a shared module (F58; Portal.js delegates). `send#ReturnAuthorization` makes the RMA
  link when none is given (F60). Help: the mount's customer and public sources (an anonymous reader public ones only), searched
  by `find#ArticleSuggestions`' customer-visible rule, read by `get#PublishedArticle` (F59), the link by `PublicApps.pageUrl`
  (F105), rated once per view's nonce (30 in ten minutes per requester) as an AfsCustomer ArticleFeedback for P12's review.
  The outside-working-hours notice from the queue team's schedule calendar (BusinessTime.js, P4).
- PASS (mr-pass): `screen/Support/` SupportHome (HelpSearch, HelpResults), MyCases (MyCaseFind, MyCaseList), NewCustomerCase
  (with OrderCancelRequest; the type's template fields with `/js/moqui-form-when.js`; the queue form's sender fields and
  honeypot), CustomerCase (reply, reopen, cancel, files), MyReturns (MyReturnFind, MyReturnList), RequestReturn, CustomerReturn
  (evidence, withdraw, label) and CustomerArticle (Was this helpful?), each `.xml` with its `.html.fancy`, and `Support.js`
  (a parameter, the notice across a post's redirect, a post, a download); `Support.xml` defaults to SupportHome; the Support
  header's Help, My cases, My returns and Contact support; Account Settings' Support links (the hub). The 21 operations in
  `Schema.js` and `Routes.js` (`support/...`) with Mantle's mirrors; TOKEN_WRITES (createCustomerCase, replyCustomerCase,
  requestCaseReopen, cancelCustomerCase, rateArticle, addReturnEvidence, withdrawCustomerReturn) in `Transport.js`, `PassApi.js`
  and `PassAuthority.js`; downloads through the facade (`Facade.downloadFile`, `Transport.downloadOperation`, PassAuthority's
  DOWNLOADS: getCaseFile, getReturnLabel; F208). No `ironstone.*` call in mr-pass.
- BOSS: `service/ironstone/customerservice/SupportAppServices.xml`, `SupportApp.js` (get#SupportInvite, create#SupportInvitation,
  get#SupportMountSettings); ContactDetail's Invite to support (`template/CustomerServiceSupportInvite.xml`: SUPPORT_CONTACT_INVITE
  holders, the contact's own addresses only, the customer administrator choice); ServiceDefaults' Support app section (its
  sites, queues, case types and knowledge spaces from a date).
- Demo: `data/BossZZZCustomerServiceSupportDemoData.xml`, `SupportDemo.js` (`DemoServices.load#SupportDemo`): Retail's Support
  mount settings (the Support queue, ZZW_RETAIL), Joe's Distributing's contact dana@joesdist.example.com and customer
  administrator morgan@joesdist.example.com as invited and redeemed PASS accounts, CustJqp's own account (joe@public.com) with its
  address verified (the self relationship), a case the contact filed through the app, and the Support queue's public form token
  (`SupportDemo.js SUPPORT_TOKENS`); demo password moqui.
- Specs: Mantle `test/request/SupportPortal` (5 features, 1.6 s: the contact's, administrator's, own account's, unverified
  and uninvited accounts' cases, a hidden queue refused; outward messages and shared files only, a reply, a stale and a good
  cancel; a queue token's request with no case read and a forged one; a return of eligible lines with the policy and facility,
  its RMA link, a contact of no grant refused, the withdrawal; a cancel request filed, read and withdrawn). mr-pass
  `test/Support/SupportAccess` (+1 feature, 0.12 s: MyCases and CustomerCase rendered once each for the contact; a colleague's,
  another customer's and an uninvited account's refused; the case link signed out), `SupportFixtures.js contacts`. BOSS
  `CustomerServiceAccess` (+1 feature, 0.19 s: Invite to support for the manager, refused the agent and another organization's
  user, an address not the contact's refused). Acceptance: mr-pass `test/acceptance/SupportFixtures` (+1 feature),
  `test/acceptance/client/SupportPagesHttp` (2 features: at 390 px the contact's cases, reply and new request, a colleague's case;
  on the desktop the case link, the RMA link and its withdrawal, a visitor and a forged link) and `RemoteHttp` (+1 feature);
  BOSS `test/acceptance/CustomerService/CustomerServiceSupportWalk` (3 features on the demo: JoeDist's contact and administrator, Joe's
  own account; Retail's help read and rated once per view, none for a visitor; the queue form token; Invite to support;
  ServiceDefaults' settings read).
- Tests run (all pass): Mantle SupportPortal, AccountingPortals, SupplierPortal, ReturnPolicies, OrderChanges, CaseFeedback,
  SupportCases, SupportKnowledge, WorkProjectRequests, RecordVisibility, RecordLinks, WorkProjectClients, CommonsToday,
  OrderToCashBasicFlow, ReturnToResponseBasicFlow, ShipmentReturnMisc, WorkPlanToCashBasicFlow; mr-pass SupportAccess, Forum,
  ForumAccess, PublicIdentity, Integrations, Portals, SupplierPages, Media, Transport; BOSS CustomerServiceAccess,
  CustomerServiceFeedback, CustomerServiceReturns, CustomerServiceOrderChanges, CustomerServiceKnowledge, CustomerServiceCases;
  acceptance CustomerServiceSupportWalk, SupportPagesHttp and RemoteHttp against the local authority, and the remote pair of
  docs/Deployment.md "Reproducing the remote check" over REST (a scratch frontend runtime of framework, webroot and mr-pass only;
  RemoteFixtures passes): RemoteHttp's 9 features and SupportPagesHttp's 2 through the frontend. `moqui lint --screens`: 136
  flagged sites, as master; none in the screens added or changed.
- Findings (provisional):
  - **F201** ExternalAccessContact had no role for "a customer administrator, a role on that relationship": it gains
    `administrator` (audit-logged), set from the invitation's scope on redeem; a contact's case is one it filed or reports (or
    is the Customer party of) unless it is an administrator (the Request kind's `contactAllows`, inside `ExternalAccess.check`).
  - **F202** "A verified email" is a framework `VerifiedAddress` row of the account; the self relationship holds only for an
    account whose party is the record's outside party, not internal and working for no internal organization, on the kinds that
    allow it (Request, ReturnHeader), and the own account sees all of its own cases.
  - **F203** The Support mount's settings (design ServiceDefaults' "the Support mount's queues, intake types and knowledge
    spaces") have no field: `save#ServiceDefaults` starts each ServicePolicy row from its own fields, so new fields there would be
    dropped by every other save. They are a dated `SupportAppSetting` row of their own, saved by save#SupportAppSetting. Design
    ServiceDefaults changed.
  - **F204** A public account holds no Mantle permission, so the customer writes run on a Support claim in
    `ec.context.sharedMap` (`SupportCustomerClaim`, set only by CustomerReturns.js and CustomerOrders.js after ExternalAccess),
    as Purchasing's supplier claim: ReturnPolicies.js honours it for the lists naming SUPPORT_CASE_EDIT (and RETURN_AUTHORIZE only
    for a withdrawal) with the claim's organization and customer in place of the facility scope, and leaves the return
    unassigned; OrderChanges.js's `customerSide` takes it. Cases are written by SupportPortal.js through create#Request, the
    parties and ensure#CaseProfile rather than create#Case, which is an agent's (SUPPORT_CASE_EDIT, the queue's assignee).
  - **F205** "Approved shared files" had no type: RequestContent RqCntCustomerShared ("Shared with the customer"); RecordFiles
    keeps its internal default (RqCntInternal), so an agent shares a file by choosing the type; customer files land in it.
  - **F206** P9's ReturnHeader kind resolves no cancelled return, so a withdrawn return's page closes for its link and its
    contact alike: the withdrawal's receipt says so and MyReturns lists a withdrawn return without a link.
  - **F207** The rating's per-page nonce is a random value issued with the article; Mantle has no server secret to sign it,
    so it proves one rating per view (its digest unique on ArticleFeedback), not that the server issued it; the requester's
    limit (30 in ten minutes) bounds the rest.
  - **F208** PASS's file downloads were Forum's and exports only: PassAuthority's DOWNLOADS list, `Facade.downloadFile` and
    `Transport.downloadOperation` (REST: the operation's GET route with its input as the query; gRPC: the operation) stream a
    Support file; the label image is kept once as ReturnContent so the transports stream a location.
  - **F209** BOSS's client deny pattern names the write verbs of ironstone services; `invite` is none of them, so BOSS's
    service is `create#SupportInvitation`.
  - **F210** Shop does not exist (mr-pass has only plan/design-shop.md and impl-shop.md; BOSS Commerce is placeholders): X7's
    Get help, Request return and cancel wait for Shop, which calls create#CustomerCase, request#CustomerReturn and
    request#CustomerCancel; the store's queue and the SalesOrder OrderView token (impl-shop F27) are not built.
  - **F211** Admin's privacy provider contract (`org.moqui.admin.PrivacyServices`) does not exist, so CS-PRIVACY's provider
    and F187's `redact#FormResponse` wait for it; P2's interim privacy cases take the requests (§7).
- Not done: F181's readiness stays in CaseFeedbackServices. (The notices, the cursors and the label and immediate cancel
  specs were finished in the review.)

**Review Nov 5 (P15).** Checked against design §8, design-forum §4.3 and §5, AGENTS.md and the Practices: isolation
(ExternalAccess `check`/`actingParties`: a contact's own cases unless a customer administrator, the customer's returns and
orders only, another customer's record and an uninvited same-domain account NotFound, forged, expired and revoked tokens
NotFound with nothing of the record, an anonymous reader public help sources only), audience (outward messages only, staff
as the organization, RqCntCustomerShared files only, P7's customer projection, no internal template field accepted, the
cancel read without decision reasons or approvers), the PASS contract (allow-listed projections with capabilities and
revisions, operation IDs on creates, error kinds, no `ironstone.*` from mr-pass or Mantle, files through staging and the
scanner with type, signature and size), BOSS's Invite to support and ServiceDefaults. Fixes:
- **R1 (high)** A case file or return label in the database resource store (the default content root) never downloaded:
  `Facade.downloadFile` and `PassApi`'s download read the location as the public account after writing the headers, the
  read was refused, and the page answered a 302 carrying the PDF's headers. Both now read the file with authorization off
  (the authority checked the asker) before writing anything.
- **R2 (medium)** The self relationship held for any verified address of the account: after an email change to an
  unverified address the account still reached its party's cases and returns. `selfOf` now needs the account's current
  address verified (as Forum and Account.js read it).
- **R3 (medium)** A retried `request#CustomerReturn` re-checked eligibility before reaching submit's operation record, so
  a retry of a request for everything left was refused instead of answering the first; a retry now passes its lines
  through to the first result (a different payload is a Conflict).
- **R4 (medium)** `cancel#CustomerCase`, `withdraw#CustomerReturn` and `withdraw#CustomerCancel` took a change with no
  `expectedRevision`; each now requires it and a stale one is a Conflict naming the revision seen and the current one
  (`SupportPortal.requireRevision`); the cancel request's read carries its revision (`withdrawOrderCancel` takes
  `expectedRevision`). An operation ID reused for another payload is a Conflict (409), not Unprocessable. Replies,
  reopen requests and evidence are appends keyed by their operation ID, not edits, so they take no revision.
- **R5 (low)** `get#CaseCustomerLink` made a capability even when the organization has no Support site; now none.
- Gaps finished: **notices** (F60): `service/mantle/request/SupportNotices.js`. An agent's mail on a case through
  `send#EmailDraft` (P5's apply#SavedReply, CaseDetail's Chatter through Comms Compose) gains the case's CustomerCase link
  (`caseLink`: ExternalAccess.create on `PublicApps.sitesFor`/`pageUrl`) when every recipient is an address of the case's
  customer side and the sender holds SUPPORT_CASE_EDIT; with no Support site it goes without and the omission is logged;
  never thrown. `authorize#Return` and `decide#ReturnException` queue `send#ReturnDecisionNotice` for their commit: the
  customer's mail (MANTLE_RETURN_DECISION_EMAIL) with the return's ReturnRma link, never the reason, only where Customer
  Service is set up (a service policy) and for a return the customer sees; without a site it goes without the link,
  logged. **Cursors**: MyCases and MyReturns (find#CustomerCases, find#CustomerReturns) page 30 rows (at most 100) newest
  first with the ID as tie-breaker after an opaque cursor (`SupportPortal.listPage`: the last row's time and ID, signed
  with the list, its filters, the site and the account; another list's, account's or an altered cursor Unprocessable),
  with Older and Newest links; `cursor` and `limit` in Schema.js and its Mantle mirror.
- Specs: Mantle `SupportPortal` (+2 features, 2.9 s: the cursor and its refusals, a changed email ending the self
  relationship, the stale cancel naming the current revision, a retried return request answering the first and a
  different payload conflicting, the withdrawals' required revision, the authorization's notice with the return's
  link); `SupportReplies` (the reply's Support link with a site, none without). Acceptance: mr-mantle
  `test/acceptance/order/SupportImmediateCancelWalk` (customerImmediateCancel on, a placed order with nothing reserved
  cancelled at once through the Support app, an approved one requested; the flag put back off in cleanup); mr-pass
  `SupportFixtures.contacts` gains an authorized return with its label and RMA link, `SupportPagesHttp` and `RemoteHttp`
  download the label through the facade (a forged link gets no file).
- Run (all pass): Mantle SupportPortal, ReturnPolicies, OrderChanges, SupportReplies; mr-pass SupportAccess, Forum,
  Portals, Media, Transport (server feature time well under 15 s; client unchanged); BOSS CustomerServiceAccess,
  CustomerServiceReturns, CustomerServiceAssignment; acceptance SupportImmediateCancelWalk, SupportPagesHttp and RemoteHttp
  against the local authority, and the remote pair (authority serving the fixtures on 18091, a frontend runtime of
  framework, webroot, tools and mr-pass only on 18092 over REST; RemoteFixtures passes): RemoteHttp 9 and SupportPagesHttp
  2 through the frontend. `lint --screens`: nothing in the Support screens.
- Left: the saved reply preview does not yet say the mail will carry the Support link (BOSS's ReplyPreview template);
  the label is served as a PDF whatever the carrier's labelFileType; MyCases reads all of a customer's case ids before
  paging (fine at portal sizes; a join with the cursor in the query if customers get large).

- **Wave 7 suites (Nov 5, on master after P14 and P15 merged, nothing else running):** standalone mr-mantle 1,749
  passed, 2 failed (the baseline), 11 skipped; `./moq test-apps` 3,078 server features passed and 2 failed
  (CustomerServiceChannels and AccountingPayables expected no Support queue form token, which P15's demo issues; both
  updated), 14 client features passed; within every budget (server: mr-mantle 326.7 of 335 s, mr-boss 227.6 of 245 s,
  mr-pass 12.2 of 15 s; client: mr-boss 41.7 of 44 s, mr-pass 4.2 of 6 s); `moqui lint --screens` clean.

### P16 — Finish

- The terminal twins, and the server-static sweep, an acceptance test.
- The design §10 end-to-end review, acceptance tests. A Customer Service user with no other launcher is refused cost,
  finance, stock posting and other organizations' records, through URLs, shared contexts, exports, the palette, search
  and notifications. With the W and F groups, the same user works from the shared mounts without the Warehouse or
  Accounting root. A customer contact reaches nothing in BOSS, and nothing of another customer in the Support app.
- The §11 outputs not built earlier: the case summary print, customer-visible and internal.
- The inventories' **Implemented in** columns, the design's Impl column, and Remaining-Work; the mr-pass README and
  `docs/Deployment.md` for the Support mount.
- The open items earlier phases left for P16 (§6): F111, F131, F185, and F164 (Product360's warranty term).

**Built Nov 5 (P16).**
- **Terminal twins and server-static.** `test/acceptance/TuiRender.spec.js` now renders every Customer Service screen and its
  shared mounts on their route fixtures (CustomerServiceSpecLib), with Customer360's six service tabs and Knowledge's
  terminal twin (Commons' KnowledgeTui, which the qvue screen's tui names as a dynamic container; the fixture's `tuiText`),
  checks each fixture's text in the twin, and fails a Customer Service route fixture no screen renders. No Customer Service
  screen lacked a usable twin. `test/acceptance/CustomerService/CustomerServiceServerStatic.spec.js` (one per app per mode, on
  ServerStaticLib): the full static report of the Customer Service XML screens on their route fixtures; the two the report
  found clean, SplitCase and StatusCategories, are marked `server-static="qvt"` and render their static qvt page without an
  error. The others keep a list's condition outside its form-list or request data in a text, as the other apps' do.
- **Design §10 "unauthorized actions and standalone use"**, `test/acceptance/CustomerService/CustomerServiceAccessWalk.spec.js`
  (7 features, about 35 s with its start), with artifact authorization on, on PurchasingAccessWalk's pattern. Each side,
  Retail and Ziziwork Services, keeps its demo case, customer and order, and the walk adds an internal note with a secret
  text to each side's case, and Retail's thermostat a standard cost and a supplier price with odd amounts. Then:
  - every Customer Service demo user (the W agent and the F authorizer included) and Services' agent open Customer Service
    and none of eight other roots;
  - 25 routes per side (the case, its summary, merge and split, the customer's 360 and tabs and contact, the order, the
    lists, Chatter and RecordFiles, analytics, CaseToArticle, Approvals, Retail's return and its RMA print), html and for a
    reader also tui: the other side's users see none of a side's records, while its own user or john.doe sees them on
    CaseDetail, CaseSummary, Customer360's Cases tab and OrderDetail;
  - the reports' CSV exports (case volumes by queue, SLA compliance, response times, return analysis) and the case summary
    print hold only the user's side (john.doe's internal summary of each side is the control);
  - the palette (by ids and text), record links, the customer and organization drop-downs and the case notices (each case
    assigned through Mantle and back, its SupportCaseAssigned notices checked) keep each side to its records, each side's
    own user finding its order and link;
  - no Customer Service user sees the standard cost or the supplier price on Product360, Products, InventoryAvailability or
    OrderDetail (john.doe sees the cost under Products), and approve#Payable, release#InvoiceHold (a real hold on a bill the
    walk makes) and receive#ShipmentStock refuse each Retail user without the group (nothing received, the hold kept);
  - the W agent and the F authorizer open neither the Warehouse nor the Accounting root and work from Customer Service's
    ReturnDetail and InvoiceDetail; their receipt, inspection and settlement are CustomerServiceReturnsWalk's;
  - a Support customer account (dana@joesdist, morgan@joesdist, joe@public.com) opens no app root but Commons and Comms
    (F216), sees there no case of either side but Joe his own as one of its people (never its internal note), has no
    other launcher entry, and is refused the Customer Service services and the staff case print.
  The Customer Service administrator is left out of the isolation sweeps: its MANTLE_ACTIVE_ORG grant works in every
  organization when none is active, by design (CustomerService.js grants; impl-purchasing F185). Universal search has no
  index in a test runtime (impl-purchasing F187); the palette with its own-side control is the search check.
  `mr-pass/test/acceptance/SupportIsolation.spec.js`: a contact invited for one customer gets nothing of another customer of the
  same organization, through the facade by the other case's or return's id (read, reply, reopen, cancel, file, withdraw),
  by naming that customer in MyCases or MyReturns, or by the case page; its own case and return stay readable.
- **§11 outputs.** Built earlier: the acknowledgement and outward reply (P2, P6), the RMA print, stored PDF and email (P9),
  the order-change confirmation (P10), the reports' CSVs (P14), the knowledge draft (P12) and the CSAT invitation (P13); the
  credit memo and refund notice stay Accounting's `send#Invoice`. Built here: the **case summary**. Mantle
  `mantle.request.SupportCaseServices.get#CaseSummaryPrint` (`CaseSummary.js`, `template/request/CaseSummary.print.html.fancy`):
  a case as of the print time in a labeled variant, the customer copy (the default) from SupportPortal.js's projections
  (the customer label of the status, the resolution, the customer's template values, outward messages, files shared with
  the customer and the customer's own order and return links; SupportPortal.js now exports them) or the internal summary
  (queue, type, priority, assignee, due date, every message and note with its kind, every file and link); neither holds a
  cost or amount; SUPPORT_CASE_EDIT or SUPPORT_CASE_MANAGE and the case's organization. `send#CaseSummary` stores the
  customer copy's PDF as the case's RequestContent (new type RqCntCaseSummary, never a shared file) before it mails it to a
  checked address of the customer or its contacts, as a mail client draft filed on the case; a retry of the operation
  answers the first. BOSS `screen/CustomerService/Cases/CaseSummary.xml` (html-print; Customer copy / Internal summary,
  Print, Send to the customer through `sendSummary`), linked from CaseDetail's More menu (`Cases/CaseSummary` in the
  shared links). Regression: mr-mantle SupportPortal (the variants, AUDIENCE_INVALID, PERMISSION_DENIED); acceptance:
  `CustomerServiceSummaryWalk` (both variants, the print without controls, the twin, another organization's agent refused,
  the send stored once and mailed once on a retry, RECIPIENT_UNCHECKED, a reader refused).
- **F111** (Mantle AccountingSetup.js `preferenceFields`, SetupServices.xml `store#Preferences`' flags; BOSS
  Accounting/Settings/AccountingPreferences): `orderConfirmationOnPlace` is an organization's flag on Accounting's
  preferences ("Order confirmations: stored when sent / stored at placement"); the demo still leaves it off. Regression:
  mr-mantle AccountingControls (the flag read back and an invalid value refused).
- **F131** (Mantle Assignment.js `syncTeamGroup`): the organization's SVO_ group holds its teams' members and the users who
  hold SUPPORT_CASE_MANAGE or SUPPORT_POLICY_EDIT through a current group and work for the organization, so the service
  administrator on no team shares a service-wide reply. Regression: mr-mantle SupportAssignment (the administrator in,
  another organization's out), BOSS CustomerServiceAssignment (the demo administrator sees Retail's service-wide reply).
  Comms' own sharing with a team's SVT_ group is left as Comms'.
- **F185** (Mantle `mantle.request.WarrantyServices.link#ClaimEvidence` and `unlink#ClaimEvidence`, Warranty.js
  `moveRevision`): a claim's serial, order, invoice or agreement linked or taken off on its own, checked as
  save#WarrantyClaim checks it, moves claimRevision and supersedes the claim's decisions; refuses NOT_EVIDENCE,
  EVIDENCE_LINKED (a second record of a kind), CASE_CLOSED, NOT_A_CLAIM and a stale revision. BOSS: ironstone.commons
  RequestServices' `link#RequestRecord` and `unlink#RequestRecord` route those records of an RqtWarranty request to them,
  so RequestDetail's links in every context move the revision. Item edits: no RequestDetail path edits a claim's
  RequestItem (Purchasing's item verbs refuse any other type), so none was needed. Regression: mr-mantle SupportWarranty
  (the revision, the refusals, another organization), BOSS CustomerServiceWarranty (CaseDetail's unlink). Not done (§7):
  NewCase's warranty path refusing the whole case for a serial that is not the customer's, and its customerAssets choice
  listing a resold serial.
- **F164**: Product360 in Customer Service shows the product's warranty at sale under its name ("Warranty: 12 months from
  delivery (BOSS_CS_WARRANTY_12)", the PftWarranty feature WarrantyAssessment counts from), checked in
  CustomerServiceOrdersWalk.
- **ReturnAuthorization**: an ignored `check#Record` refusal leaves no message, so the print took another organization's
  return for the user's and said "not authorized yet"; the answer's record decides now, as CaseSummary does.
- **Inventories and design.** ss-inventory: the eight forms whose Designed in names CustomerService/Cases/CaseDetail and
  had no Customer Service cell; usl-inventory: the ten services whose Designed in names a Customer Service or Support path
  and had none; every other Customer Service cell was filled by its phase. design-customer-service §2's Impl names the
  building phase (and the built path where it differs) for every row, ChannelAutomation `later`; §11's case summary row
  names the built screen and services.
- Specs run (this runtime; no full suite): acceptance TuiRender (3), CustomerServiceServerStatic (1),
  CustomerServiceAccessWalk (7), CustomerServiceSummaryWalk (2), CustomerServiceOrdersWalk (6), mr-pass SupportIsolation
  (1), all pass; regression mr-mantle AccountingControls (34), SupportAssignment (7), SupportWarranty (4), SupportPortal
  (8, with `mail_capture_sends=true`, as the wave runs set it), and the §2 compatibility specs with Forum, ForumAccess,
  PublicIdentity, Integrations and SupportAccess (238 features), pass; BOSS CustomerServiceAssignment (4),
  CustomerServiceWarranty (1), CustomerServiceReturns (5), CustomerServiceRelations, pass. `moqui lint --screens`: no
  parse failure, no new flagged site, no Customer Service TUI worklist item.
- Findings (provisional):
  - **F215** The Customer Service administrator (BOSS_CUSTOMER_SERVICE_ADMIN, MANTLE_ACTIVE_ORG) reaches every
    organization's cases, customers, orders, palette rows, links, choices and report rows when no organization is active
    (by design, CustomerService.js; impl-purchasing F185); the isolation sweeps leave it out.
  - **F216** Commons and Comms are authorized for ALL_USERS (design-drawers-commons §2), so a PASS public account (a
    Support contact, which holds no group) opens both BOSS roots and its launcher lists them; Joe Q Public's own account
    reads his own case in Commons Requests as one of its people (its title, status and conversation as Commons shows a
    request's people, not its internal notes). Design §8 says a customer contact reaches nothing in BOSS; Projects denies
    its client contacts Commons and Comms through BOSS_PROJECT_CLIENT, and a public account has no group to deny. Left for
    the lead (§7): a deny for public accounts on the BOSS roots (a framework or PASS marker of a public account, or a
    Commons and Comms grant narrowed to internal users).
  - **F217** `ignore-error` on a screen's service-call leaves no error message, so `!ec.message.hasError()` after it
    says nothing; ReturnAuthorization took another organization's return for the user's (fixed here); other screens that
    test hasError after an ignored call may say "not authorized" or "empty" where "not available" is meant (none leaked a
    record in the walk).
  - **F218** CaseDetail has no Items tab (design CaseDetail: "Items only when present"); a claim's product and an order
    change's lines show on WarrantyAssessment and OrderChangeDetail (§7).
  - **F219** The case summary's internal variant shows the template's customer-visible answers only; an internal field's
    answer stays on CaseDetail (CaseTemplates.js has no staff projection of a response to reuse).

**Review Nov 5 (P16).** Checked the three repos' diffs against this section, §2, design §10 and §11, AGENTS.md and the
Practices. The case summary: the customer copy is built only from SupportPortal.js' customer projections (outward messages,
RqCntCustomerShared files, customer status labels, customer-visible template answers, the customer's own orders and
returns; a staff sender shows as the organization, no assignee, queue, cost or amount); the internal copy needs
SUPPORT_CASE_EDIT or SUPPORT_CASE_MANAGE and a case of the user's organization (caseOf), and the screen checks the case
through AccessServices first; `.html.fancy` escapes every value; send#CaseSummary refuses an address outside the
customer and its current contacts, keys the operation before it stores, and stores one RqCntCaseSummary PDF per send
(a retry answers the first). F185's branch acts only on an RqtWarranty request's asset, order, invoice or agreement;
every other request's link and unlink is unchanged. F131's managers are the holders of SUPPORT_CASE_MANAGE or
SUPPORT_POLICY_EDIT whose party works for that organization (organizationsOf, employment-type relationships), never
another organization's; they join at the next team sync. The regression additions are one feature each (SupportPortal,
SupportWarranty, SupportAssignment, AccountingControls, CustomerServiceAssignment, CustomerServiceWarranty).
- **R1** (minor, defensive) Settings/SavedReplies previewed a saved reply on the case named by `previewRequestId` when
  `!ec.message.hasError()` after an ignored check#Record, which is always true (F217); Mantle's preview#SavedReply
  refuses another organization's case itself, so nothing leaked, but the screen now previews only when the check answers
  the case, and says "Case … is not available" or that the reply cannot be previewed instead of an empty problem text.
  The other Customer Service screens that read hasError after an ignored call only lose the refusal's text (ReturnPolicies,
  ChannelRouting, ChannelSessions, NewReturn, SplitCase, MergeCases, the four reports, CaseSummary's print error,
  CustomerServiceReplies, CustomerServiceChannels): their data comes from the call's answer, so none can show a refused
  record; their error labels stay blank (F217, §7).
- **F216, for the lead.** BossSetupData grants BOSS_COMMONS and BOSS_COMMS to ALL_USERS (AUTHZT_ALLOW, MANTLE_USER_ORG
  and MANTLE_PRIVATE_CONTACT filters). A public account is an ordinary UserAccount with no group: framework
  `org/moqui/public/Account.js` beginRegistration creates it through create#UserAccount with no group; invitations
  (ExternalAccess.js) bind a party, not a group; the demo's joe@public.com is a Mantle demo UserAccount. So nothing in data
  tells it from staff today, and either fix is wider than this phase:
  - (a) a deny group, as BOSS_PROJECT_CLIENT already denies Commons and Comms to project clients (BOSS_COMMONS_CLIENT,
    BOSS_COMMS_CLIENT): a framework-seeded group (say PUBLIC_ACCOUNT) that Account.js adds an account it creates to (a
    framework change), that Mantle's invitation acceptance adds a new account to, and that the demo gives Joe, Dana and
    Morgan; BOSS adds AUTHZT_DENY on BOSS_COMMONS and BOSS_COMMS for it. Narrow, but a staff member who is also a customer
    contact must never be put in the group (only an account born public), since a deny outranks ALLOW.
  - (b) grant Commons and Comms to a staff group instead of ALL_USERS: about 90 demo accounts in BOSS and Mantle data, the
    users specs make, and every provisioning path would need it; a much wider change and against design-drawers-commons
    §2's "every user".
  - (c) a root-screen check in Commons.xml and Comms.xml (the user's party works for an internal organization, as
    Knowledge.js isStaff decides): no data change, but a heuristic that a contractor or a spec user without employment
    fails.
  Recommended: (a). Not changed here; the AccessWalk keeps asserting today's behaviour (Commons and Comms open, no case
  record but Joe's own as one of its people).
  - Resolved Nov 5 (the user's call): neither (a) nor a heuristic, but (b) as a rule: every BOSS app requires a UserGroup,
    and `ALL_USERS` grants none. Commons, Comms and the Records drive are granted to `BOSS_USERS`, the group of every
    internal user, and basic-comms' root to `BASIC_COMMS_USERS`; a public account holds neither, so the AccessWalk now
    asserts a Support contact is refused Commons and Comms and has no tile for them. The finding, the decision and how
    design-drawers-commons §2's "everyone who signs in" came about are impl-drawers-commons R29 (design-crosscut §1.4).

- **Final suites (Nov 5, on master after P16 merged, nothing else running):** standalone mr-mantle 1,751 passed, 2
  failed (the baseline WorkTimeEntries and WorkTimesheets, which need mr-boss's demo data), 11 skipped; `./moq test-apps`
  3,080 server features passed and 1 failed (SupportPortal read the return-decision notice's draft before its body was
  written; it now waits past the draft, mr-mantle 397650d0, passing 8 of 8 and 33 of 33 with its neighbours), 14 client
  features passed; no spec over 15 s; `moqui lint --screens` clean. The golden-path client walk §2 calls for,
  CustomerServiceCasesWalk, was added after the run (mr-boss 26a41de1; 4.8 s; it found F220).
- **Budgets (the user's agreement at the start: raise by Customer Service's measured share).** Customer Service's
  regression specs took, in the final apps run: mr-boss 18.2 s server (the CustomerService* specs) and 4.8 s client
  (CustomerServiceCasesWalk, measured alone); mr-mantle 34.2 s (its fifteen new specs); mr-pass 0.3 s (SupportAccess).
  The budgets are now mr-boss 264 server (from 245) and 49 client (from 44), and mr-mantle 370 (from 335); mr-pass stays
  15.
- **Acceptance:** not run at the finish, at the user's call (Nov 5) to stop refining the tests; each phase ran the
  acceptance specs it added or changed once, passing.

## 4. Decisions

These are made before and during the build. Each one that changes the design is also written into
design-customer-service.md, or into the owner's design.

| Date | Decision | Notes |
| --- | --- | --- |
| Oct 28, 2026 | Customer Service is built last, after Products, Accounting, Warehouse, Manufacturing and Purchasing. It adds its context and callers to what they built for it | The user's call; the five plans assume it. Nov 1: Manufacturing, then Purchasing, then Customer Service; P0 checks that the Manufacturing and Purchasing pieces it relies on landed |
| Oct 28, 2026 | The shared rules of impl-drawers-commons §4, parties by role and changes by effective date and the audit log, apply; Mantle's existing uses of both are kept | The user's call, in the Purchasing plan review (impl-purchasing §4). Applied here in §2 |
| Oct 28, 2026 | A case's organization is a RequestParty in the OrgInternal role, its customer, contact and assignee RequestParty rows; a team member is a dated PartyRelationship; a queue's organization an owner field | Follows from impl-purchasing §4 (answer 7) and the owner rule; the design's CaseProfile organization field is dropped |
| Oct 28, 2026 | Policies, settings, mappings, rules and templates are effective-dated rows with audit-logged key fields; the design's versions and "publish a version" become a row started from a date. Episodes, events, case relations, decisions, article feedback, invitations and the assignment cursor stay records of their own | The plan's choice under the rule above; each phase says why a record stays |
| Oct 28, 2026 | The root group and filter sets as Products and Purchasing: `BOSS_CUSTOMER_SERVICE` as root user group and artifact group, with service checks. Its groups take `MANTLE_USER_ORG` and `MANTLE_PRIVATE_CONTACT`, and `BOSS_CUSTOMER_SERVICE_ADMIN`, with all authz on the root, `MANTLE_ACTIVE_ORG` and `MANTLE_PRIVATE_CONTACT` (impl-drawers-commons §4). The root user group is also the global saved replies' group | Follows from impl-products §4 and impl-purchasing §4; F3. The filters revised in the core-app question review, for every BOSS root |
| Oct 28, 2026 | Customer Service builds the parts of other needs it still depends on: CX-REQUEST's case rules and the support-case rule (P2, P4); the team working hours and business time (P4, Commons' contract); the survey builder (P13, Commons'); Customer360's service and delivered-items forms (P11, P14, crosscut §3.2); the forum queue route (P6). These keep the owner's names, packages and Shared screens | The plan's choice, as the other five plans decided for theirs. Nov 1: the customer credit-status read is built (F36) |
| Oct 28, 2026 | Customer Service builds the survey builder's four shared screens of crosscut §2, `Shared/SurveyForms`, `SurveyFormDetail`, `SurveyResponses` and `SurveyResponseDetail` (P13), and the canonical `Shared/OrderChangeDetail`, which Sales also mounts (P10), each with its context only; the survey names go into design-drawers-commons when its survey pass is written. Otherwise it adds its context to the fourteen shared screens the other apps built | Commons owns the builder (crosscut §8), whose screens no plan builds. The four survey screens and OrderChangeDetail as crosscut's registry has them (Nov 1) |
| Oct 28, 2026 | Internal entry first: agents enter cases and returns for customers from P2 and P9; the customer pages come in P15, except the feedback page in P13 | The plan's choice, as Purchasing's; the design's internal paths are complete without the customer pages |
| Oct 28, 2026 | Public-facing applications are in mr-pass and internal ones in mr-boss. The customer pages of design §8 are a new PASS app, Support (`screen/Support.xml`, the `support` mount), not `screen/ServicePortal.xml` in BOSS; P13 starts it with Feedback, P15 builds the rest. It follows PASS's foundation: its shell and mounts, public accounts with no UserGroup (so no `BOSS_SERVICE_PORTAL`), the facade with Mantle's PassApi for local and remote authorities, PASS invitations, media and request contract (§2) | The user's call, Oct 28. It reverses crosscut D5's ServicePortal root for Customer Service's pages. The same rule moved Accounting P18's InvoicePay and BillUpload into the PASS Billing and Supplier apps and Purchasing P16's pages into Supplier (their §4); the built public pages are later moves (F42) |
| Oct 28, 2026 | What Mantle's Request rules, the jobs and the Support app call is Mantle's: `mantle.request.SupportCaseServices` holds `ensure#CaseProfile`, `assign#Case`, `validate#TemplateValues`, the closing job and the customer services; `ironstone.customerservice` keeps the BOSS screens' reads, settings forms and reports, and calls them | The plan's choice; F41. Mantle never calls BOSS, and a PASS deployment may have no BOSS. Widened by the Q2 row below to every case, policy and order rule |
| Oct 28, 2026 | Customers read cases and returns through the Support app's Mantle projections, so Projects' client checks (ChatterServices, RecordFilesServices, ClientServices) are not generalized here | Follows from the Support app decision; design §8's generalization drops (F18) |
| Oct 28, 2026 | A queue's intake token is an ExternalAccessCapability on its RequestCategory, not a PartySetting | F10: PartySetting is keyed by party and type and cannot hold a token per queue |
| Oct 28, 2026 | The order confirmation resent is the stored one: its PDF kept as OrderContent at placement, as the shared rule keeps a key revision's PDF | F29: Mantle's store email re-renders the current order and needs a store email row |
| Oct 28, 2026 | Phase order as §1: the case spine first (cases, customers and orders, service levels, assignment, channels, templates, merge), then returns, order changes and warranty, then knowledge, feedback, reports and the portal | The user's call (answer 1). The alternative was the order side (returns, order changes) right after P3; the case spine gives each later phase its case |
| Oct 28, 2026 | A case is a request in a service queue: a RequestCategory with a current ServiceQueue row. CaseTypes' service-enabled flag says which types a queue offers, and puts a request of that type with a Customer RequestParty and no category into the type's default queue. `RqtSupport` alone makes no case, so an employee's Commons request stays plain (P2) | The user's call (answer 2); F5. The design's "every service-enabled type" would have made every Commons request a case |
| Oct 28, 2026 | An order change is its `RqtOrderChange` Request, its lines RequestItems linked to their order items by RequestItemOrder (product, quantity, unit from Purchasing P10, ship date as `requiredByDate`), with the line action and proposed unit price added and the key fields audit-logged, and an OrderChangeDecision record. The design's OrderChange, OrderChangeLine and application records are dropped (P10) | The user's call (answer 3); F4. One document, as Purchasing made a quote its PO |
| Oct 28, 2026 | A warranty claim is its `RqtWarranty` case: the product a RequestItem, the asset, order, invoice and agreement RequestRecord links, and a WarrantyDecision record. The design's WarrantyClaim record is dropped (P11) | The user's call (answer 4) |
| Oct 28, 2026 | A case template is a DbForm with dependency rows, and a case's values a FormResponse linked to it. Its fields, options and dependency rows are effective-dated with audit-logged key fields, and a response reads the form as of its time; no DbForm is cloned for a version, and P13's feedback forms work the same way. The design's CaseTemplate, Field, Dependency and Value records are dropped (P7) | The user's call (answer 5), with dated rows over a cloned DbForm per version (design sweep review); F16. One form engine with the feedback forms (D24's reuse) |
| Oct 28, 2026 | Design §14's policy items as it recommends: SLA policy by the most specific of customer agreement, customer, queue or type, and organization default, equal ranks refused, bound at intake (P4); a 14-day reopen window as a ServicePolicy field, then a follow-up case (P8); a merge keeps the sources' SLA evidence and deadlines as obligations (P8); warranty coverage by agreement, then the product's warranty at sale through the coverage lookup, then goodwill (P11); return validity set by organization, no fee without a published rule, manual review with no policy (P9); feedback comments private to service management, shared retention, invitation-linked responses immutable (P13) | The user's call (answer 6) |
| Oct 28, 2026 | A signed-in customer contact is the UserAccount of the contact's party, the identity PASS public accounts will use, so the customer pages are not a third identity surface (P15) | The user's call (answer 7); written into crosscut §8 in the Oct 28 design sweep. With the Support app in mr-pass the contact is a PASS public account itself |
| Oct 28, 2026 | Chargeable repair: P11 records the charge estimate and the customer's consent on the warranty decision; the sales quote waits for Sales (§7) | The user's call (answer 8) |
| Oct 28, 2026 | Who is viewing or typing on a case is later (§7), unless P0 finds the Dev AIDE presence (`set#Presence`) generalizes to a record topic at small cost; then it joins P5, beside the reply | The user's call (answer 9) |
| Oct 28, 2026 | The user's call (plan review Q2): Mantle stands without BOSS, and business logic leans to Mantle (impl-drawers-commons §4). No Mantle service, rule, job, script, data file or spec calls `ironstone.*`, reads a BOSS screen, entity or setting, or names a BOSS group; Mantle checks Moqui permissions that BOSS grants its groups. Moved: to `mantle.request.SupportCaseServices` the case's create, update, transition, call log, merge, split and saved-reply apply, and the queue, team, type, mapping, workflow, defaults, assignment-rule, route and template saves and checks; to `mantle.order.OrderChangeServices` the order change; to `mantle.request.KnowledgeServices` the knowledge sources, suggestions, feedback review, article from a case and the Support app's help; to `mantle.request.CaseFeedbackServices` the feedback forms and follow-up; to `mantle.work.CalendarServices.store#WorkingHours` a team's dated hours. `ironstone.customerservice` keeps AccessServices, the `find#` and `get#` reads, `prepare#Case`, `apply#CaseBatch`, `save#SavedReplyAction`, `prepare#ArticleFromCase` and ReportingServices, and a screen calls the Mantle name after AccessServices. P1 grants `SUPPORT_CASE_EDIT`, `SUPPORT_CASE_MANAGE`, `SUPPORT_POLICY_EDIT`, `SUPPORT_KNOWLEDGE_EDIT`, `ORDER_CHANGE_REQUEST`, `ORDER_CHANGE_APPROVE`, `ORDER_CHANGE_APPLY`, `RETURN_AUTHORIZE`, `RETURN_EXCEPTION_APPROVE`, `RETURN_POLICY_EDIT`, `WARRANTY_APPROVE` and `CUSTOMER_CREDIT_VIEW` | Widens the F41 row above. The contracts take the shared names: `mantle.account.CreditServices.get#CustomerCreditStatus` (P3, F36), `mantle.order.ReturnServices.preview#ReturnSettlement`, `mantle.shipment.WarehouseTaskServices.request#ReturnLabel` (F37) and `ironstone.commons.PaletteServices.get#RecordLink`, BOSS's, for routing (P1). The owner designs' names follow in the design sweep |
| Nov 5, 2026 | Which requests are cases (F62): a request becomes a case when it is Submitted (a Draft when it is submitted), has a Customer RequestParty that is a Customer-role party of the service organization (never an internal party), and has a service-enabled type with no category, or is moved into a service queue; a request with a project and such a customer is a case too, and stays visible in Projects. The rule runs after commit and fires on a Customer RequestParty create and on a type, category or status change | The user's call (P0 review), choosing to include project requests; P2 |
| Nov 5, 2026 | Who is viewing a case stays later (§7): the framework presence frame F72 costs is not built in P5 | The user's call (P0 review), under the Oct 28 row's condition |
| Nov 5, 2026 | P0's other answers as F45–F73 resolve them: bearer links through `ExternalAccess.check`, not `check#AccessToken` (F61); a signed-in contact through ExternalAccessContact (F57); P13 registers the whole Support app (F56); P7's framework work is dated DbForm fields and a dependency entity rendered as `visible-when` and a require form of it, with no new element for condition rows (F69–F71); P10 builds the sales commercial revision behind a flag and calls no `reduce#AssetReservation` (F55, F66); P4 shares Manufacturing's calendar functions (F65); P11's repair is an AssetMaintenance (F67) | The plan's choices on P0's findings |

## 5. Open questions

| Question | Decides | Notes |
| --- | --- | --- |
| Further issues discovered during implementation | the affected phase | Record findings and decisions here; the open questions of the plan as written are decided in §4 |

The design's other §14 items are decided in §4; ChannelAutomation and Log time are `later` there and in §7.

## 6. Findings

Design assumptions found wrong or unstated in the code, with the resolution. Where a resolution changes the design, it
is written there too.

| # | Finding | Resolution |
| --- | --- | --- |
| F1 | P0: `screen/CustomerService/` has eight flat placeholders: Home, Cases, Orders ("Order lookup & changes"), Returns ("Returns / RMA"), Availability ("Availability lookup"), Customers ("Customer 360"), Knowledge ("Knowledge base") and Settings. There are no Cases, Orders, Returns or Availability directories, and no Approvals or Reports; the root mounts only Chatter and RecordFiles and has no `<shell-providers>`. The `BOSS_CUSTOMER_SERVICE` authz is in BossSetupData's commented block (`ADMIN` always, with `MANTLE_ACTIVE_ORG` and `MANTLE_PRIVATE_CONTACT`). There is no `screen/ServicePortal.xml` | Nov 1: the admin authz is live (BossSetupData, with the `BOSS_CUSTOMER_SERVICE_ADMIN` group); P1 adds the root user group and the ordinary groups. The customer pages are the PASS Support app (§4; P13, P15) |
| F2 | P0: `MANTLE_ACTIVE_ORG` filters Party by owner and OrderPart, Shipment, ReturnHeader and Invoice by party, and nothing filters Request, RequestCategory, OrderHeader or OrderItem (impl-purchasing F2) | Service rows through services (§2) |
| F3 | P0: `BOSS_CUSTOMER_SERVICE` exists only as an artifact group. `EmailTextBlock.userGroupId` is a foreign key to UserGroup, and creating a shared block requires the author to be a member of that group | The root user group (P1); a UserGroup per service team, kept in step by AgentTeams (P5) |
| F4 | P0: Request's statuses are Draft, Submitted, Reviewed, InProgress, Completed and Cancelled; Cancelled has no outgoing transition, Completed goes only to InProgress ("Re-open"). Its types include RqtSupport, RqtInformation and RqtContact, not RqtOrderChange or RqtWarranty. The sales channels are ScWeb, ScPhone and ScEmail. There is no request tag. RequestItem and RequestItemOrder exist; RequestItem has product, quantity, required date, maximum amount and supplier | Seeds in P2, P6, P10, P11; RequestTag (P2); an order change's lines as RequestItems (§4, P10) |
| F5 | P0: RqtSupport is the default type of `create#Request`, Commons QuickRequest, Chat's create, the intake form and the forum's case | §4 (P2): a case is a request in a service queue |
| F6 | P0: RequestCategory has parent, responsible party and description, and no organization. Categories are global, and Projects' intake settings already store them (`store#RequestCategory`) | P2: an owner field, and ServiceQueue rows marking a service queue |
| F7 | P0: `Shared/RequestDetail` takes `requestId` and `tab` only; its context is Projects when `appRoot` is Projects, else Commons, with Projects and Commons links hardcoded. `Shared/WorkItemDetail` is the same. Purchasing P10, Warehouse P15 and Manufacturing P11 add their contexts first | P2 adds the Customer Service context on what they leave |
| F8 | P0: outside Customer Service a request's status, due date or resolution changes through Projects' `triage#Request` (moves and due), `update#ProjectRequest`, Commons' `set#RequestStatus`, `update#MyRequest` and the Edit dialog's "Response wanted by", `make#RequestWorkItem` (which copies the due date), `convert#RequestToProject`, `ClientServices.cancel#ClientRequest`, `bulk#Requests` and `complete#RequestFromWork`, called by the `WorkEffortRequestFromWork` rule | The status rule records every change (P4); resolution and cancel refused or routed on a case (P2); the due date written by SlaServices only (P4) |
| F9 | P0: the RequestTriage and RequestUpdate topic links open Projects' RequestDetail, `get#RecordLink` sends a request with no project to Commons, and Commons Today already lists assigned requests with a due date | P1 routes cases to Customer Service; P2's Today source replaces Commons' rows for a case |
| F10 | P0: the intake token is the `WstIntakeToken` WorkEffortSetting of a WetProject; `create#IntakeRequest` limits by project (30 an hour) and by address (5); `ErActCreateRequest`'s value is a project or empty for the plus tag. PartySetting is keyed by party and type, its value 255 characters | P6: a queue destination for the mail rule and the token, the token an ExternalAccessCapability (§4); the queue's form is the Support app's (P15) |
| F11 | P0: adding RqtSupport to ProjIntake's triaged types puts every case with no project into Projects' triage list, shows it to all of the organization's users through `get#RecordLinkInfo`, and fires Projects' triage notice | P6: organization intake through the queue route; the design changes |
| F12 | P0: the forum's case services are `mantle.forum.ForumServices.create#CaseFromTopic`, `preview#CaseReply` and `publish#CaseReply` (a matching `previewHash`), in ForumIntegration.js; the design's `I.` (IntegrationServices) does not exist. PASS's `createCaseFromTopic` operation already passes a `requestCategoryId`. A case from a topic is ReqDraft, RqtSupport, with no channel, so RequestTriageNotice does not fire, and it is linked by RequestCommEvent and PublicDiscussionLink, not RequestRecord | P6; the design's names and link change |
| F13 | P0: working hours are the user's own WetAvailable (`store#WorkingHours`); there is no team or organization schedule and no holiday editor. `get#NextBusinessDay` and `get#FutureBusinessDay` count whole days less WepHoliday; nothing computes business minutes | P4: a team schedule and a Mantle business-time service |
| F14 | P0: the approvals list is a section of Commons Notifications, filtered by `appName` only; a topic is an approval by its `approveServiceName` and `refuseServiceName`; `get#UserNotifications` accepts a topic | P9, on Accounting's filter answer (its F43) |
| F15 | P0: WikiPageReview approves a page version before publishing; it is not a suggestion. `publicPageUrl` is a WikiSpace URL template, and BOSS has no public help-centre page | P12's Suggest edit; P15's CustomerArticle |
| F16 | P0: DbForm has no version, name or title field (description and purpose only); DbFormFieldOption has no score; FormResponse is nontransactional; `update#FormResponse` and `delete#FormResponse` exist | P7: templates on DbForm (§4) and the dated, audit-logged fields in the framework; P13: the option key as score, the guard |
| F17 | P0: no `ExternalAccessServices` exists (Accounting P18). EXTERNAL_USER is a permission. The client deny pattern's service pattern names `ironstone.(commons\|comms\|projects\|products\|shared)` and a fixed verb list, and ClientWrites walks every ironstone service file | Answered Nov 1: Accounting P18 built `mantle.party.ExternalAccessServices`, and the deny pattern now names accounting and warehouse too (BossSetupData); P1 adds `customerservice` and its verbs; customers never reach BOSS (§4) |
| F18 | P0: client checks are bound to projects: `get#ClientWriteContext` refuses a request with no project, Chatter's client mode comes from PROJECT_CLIENT, and `get#ClientRecordVisibility` shows a request the client filed or one of a client project. A client's file list may include RqCntInternal content (P0 confirms) | Customers read through the Support app's Mantle projections, outward messages and approved files only (§4, P15), so these stay as they are; P0 confirms the internal-content question for Projects' own clients |
| F19 | P0: the borrowed groups (`BOSS_ACCOUNTING_AR`, `_TREASURY`, `_APPROVE`, Warehouse's receive, inspect and quality manager) do not exist yet | Answered Nov 1: `BOSS_ACCOUNTING_AR`, `_TREASURY` and `_APPROVE` and `BOSS_WAREHOUSE_RECEIVE`, `_INSPECT` and `_QUALITY_MANAGER` exist |
| F20 | P0: AppStructure's built-root list (Commons, Comms, Insights, Projects, Products) and TuiRender's (Commons, Comms, Insights, Products) leave out Customer Service | None: no route fixtures; the sweep is an acceptance test (§2 Done) |
| F21 | P0: `find#ReturnableOrderItems` measures invoiced quantity less non-cancelled returns; nothing locks eligibility across drafts; `update#ReturnItem` can raise `returnQuantity` at any status without the ceiling | P9: eligibility under a lock, shipped and invoiced, every BOSS write checked |
| F22 | P0: `cancel#Return` cancels the items and header but not the return shipment approval made | P9 |
| F23 | P0: `add#ReturnToShipment` sets `ReturnItemBilling.shipmentId`, which is not a field | P9's Mantle fix, unless Warehouse P14 made it |
| F24 | P0: ReturnHeader has no assignee, expiry or customer reference, and Mantle has no ReturnParty. ReturnContent is a TODO, which Warehouse P14 adds; RecordFiles does not cover returns yet | P9: the fields audit-logged and a dated ReturnParty, a new role association on the rule's pattern. Answered Nov 1: ReturnContent is built and registered for RecordFiles |
| F25 | P0: approval runs `process#ReturnItemResponses`, which makes a replacement order for RrspReplace whatever `responseImmediate` says; receipt cuts `returnQuantity` to the quantity received, ignores rejected units and runs once when the shipment is Delivered. ReturnToResponseBasicFlow asserts all of it | Accounting P17's conditioned rules and `receive#ReturnItems`, behind their flags; P9 builds on them |
| F26 | P0: the invoice made at pack is finalized, posted and mailed, not a draft (impl-accounting F25); no plan builds InvoiceCorrection | Decided: finalized at ship behind D3's flag (impl-accounting §4); P10 releases it before ship |
| F27 | P0: OrderHold is an existing order status, reachable from Open, Placed, Processing and Approved but not Sent; mr-marble holds through `update#OrderStatus`; releasing to Approved fires the OrderApproved rules again (the email, deduplicated by type, reservations, subscriptions, notify) | Accounting P10's `hold#Order`; P0 checks the release; P10 |
| F28 | P0, read not run: `cancel#OrderItem` has no order-status guard and on a partial cancel relies on a rule; `reserve#AssetForOrderItem` returns before its over-reserved branch, so excess reservations may stay | P10's explicit `reduce#AssetReservation`; P0 runs it. Nov 1: Warehouse F262 makes `cancel#OrderItem` re-reserve the remainder on the picked stock and F277 keeps the rest of a partly cancelled line packable; `reduce#AssetReservation` is unchanged |
| F29 | P0: `send#OrderStoreEmail` renders the order as it is now, and sends nothing without a store and a ProductStoreEmail row; POPC_DEFAULT has none, and store-less orders never send | P3 resends the stored confirmation (§4) |
| F30 | P0: `find#Party` has no customer scope, so empty criteria page through every visible party; Mantle has no order find service | P2 `find#ServiceCustomers`, P3 `find#ServiceOrders` |
| F31 | P0: `get#InventoryProjectedInfo` returns an empty map with a message when search is off, sums AstAvailable assets only, has no incoming purchase supply and does not split purchase lines from demand; the ATP reads return one number | Products P7 and Warehouse P4 own the reads; P3 shows unknown, never zero |
| F32 | P0: Agreement has no statuses (Purchasing P13 adds them), no service or warranty type, and no SLA or warranty term type | P4 seeds a service agreement type for the SLA condition; P11 |
| F33 | P0: PatEquivalent and PatReplacement are seeded and edited on Product360, with no demo; PftWarranty is seeded and ProductFeature has `numberSpecified` and `numberUomId`, with no demo; WepMaintenance is seeded and unused; AssetIssuance has `assetMaintenanceId` | P10 and P11 demo data; P0 settles the repair record |
| F34 | P0: Mantle seeds no sales orders, shipments, invoices, payments or returns; they come from the spec chain (OrderToCashBasicFlow, ReturnToResponseBasicFlow). The customers are CustJqp, JoeDist, ORG_ACME and ORG_BLUTH; ZiddlemanInc is a supplier; EQUIP_AB4_1 and _2 are internally owned serials; POPC_DEFAULT belongs to ORG_ZIZI_RETAIL with ZIRET_WH and wiki space ZZW_RETAIL | P1's demo service places, ships, invoices and pays the orders |
| F35 | P0: `Shared/OrderDetail` reads through Projects' `BillingServices.get#OrderDetail`, which needs a project link, and InvoiceDetail is Projects-only; Accounting P4 and P6 and Warehouse P11 generalize them | Answered Nov 1 for OrderDetail: it has Accounting and Warehouse branches, and P3 adds a Customer Service branch beside them; P0 checks InvoiceDetail |
| F36 | P0: no plan builds `mantle.account.CreditServices.get#CustomerCreditStatus`; Accounting P10 builds the policy, holds and Customer360's Credit tab with no read service named | Answered Nov 1: built (`CreditServices.xml`, under `CUSTOMER_CREDIT_VIEW`, which `BOSS_ACCOUNTING_AR` already holds); P3 calls it |
| F37 | P0: impl-warehouse P14 writes `request#ReturnLabel` bare, under Purchasing's contract; the designs name `mantle.shipment.WarehouseTaskServices.request#ReturnLabel`. `create#ReturnShipment` already makes the route segment, so the label needs a package | Answered Oct 28: `mantle.shipment.WarehouseTaskServices.request#ReturnLabel`, the shared name (§4, the Q2 row); P9 calls it |
| F38 | P0: impl-warehouse P8 defines what Release and Scrap do, not the other five dispositions, Return to customer among them | P9 writes what a customer return needs into design-warehouse |
| F39 | P0: no plan builds the survey builder, minute business time, D23's Request rules or the support-case rule in `complete#RequestFromWork`; Purchasing P10's type check covers RqtPurchase and RqtInventory | P13, P4, P2 (§4) |
| F40 | P0: Manufacturing P11 makes maintenance an AssetMaintenance through `EquipmentServices.create#AssetMaintenance`, with `RqtMaintenance` and a Request linked by `link#RequestRecord`; the design's warranty repair is a WepMaintenance work effort | P0 settles one repair record (P11) |
| F41 | P0: the design runs the case rules from Mantle's Request entity rules but names BOSS services for them (`ironstone.customerservice.CaseServices.ensure#CaseProfile`, AssignmentServices, TemplateServices). Mantle never calls BOSS, and a PASS deployment may have Mantle and no BOSS | §4: `mantle.request.SupportCaseServices` (P2, P5, P7, P8, P15), widened by §4's Q2 row to the settings, assignment, reply, route and template rules (P2, P5–P7), with `mantle.order.OrderChangeServices`, `mantle.request.KnowledgeServices` and `mantle.request.CaseFeedbackServices` (P10, P12, P13); the design's §12 namespaces change in the design sweep |
| F42 | P0: public-facing pages are planned or built in mr-boss elsewhere. Planned: crosscut §5 and D5 put `screen/ServicePortal.xml` and `screen/SupplierPortal.xml` in BOSS with the `BOSS_SERVICE_PORTAL` and `BOSS_SUPPLIER_PORTAL` groups; impl-accounting P18 builds both roots, `ironstone.accounting.PortalServices`, InvoicePay, SupplierBillUpload and the `pay` and `/po/<token>` routes in BOSS's MoquiConf; impl-purchasing P16 builds the supplier home, QuoteResponse, OrderAcknowledgement, `ironstone.purchasing.PortalServices` and `/rfq/<token>` there; impl-manufacturing §7's subcontract view and impl-warehouse §7's owner-stock portals would follow them. Built in BOSS: Projects' RequestIntake (`/r/<token>`), Commons' PublicShare (`/s/<token>`), Unsubscribe (`/u/<token>`) and PublishedCalendar (`/cal/<token>`); Projects' clients sign in to BOSS's Projects screens | Customer Service's pages are the Support app (§4). On Oct 28 impl-accounting P18 and impl-purchasing P16 moved theirs to the PASS Billing and Supplier apps, over `mantle.account.PortalServices` and `mantle.order.SupplierPortalServices`, impl-projects §9 plans the Client app for Projects' clients and its public request form, and impl-drawers-commons §6 lists Commons' built pages as later moves; the crosscut and app designs change when each plan's P0 closes |
| F43 | P0: PASS's root `Pass.xml` resolves a site from its host and mounts the Forum, Account, Members and Sites apps from `mantle.public.PublicSiteApp` (app, path prefix, enabled, target); screens call `pass.Facade.call#Operation`, whose `Schema.js` maps an operation to a Mantle service and its fields, and whose `Routes.js` gives the remote path Mantle's PassApi servlet serves at `/rest/s1/pass/v1/sites/*`. Public accounts hold only `ALL_USERS`, PASS roles are PublicSiteParty rows, invitations are PublicSiteInvitation, and site pages bind exact wiki pages (PublicSitePage). PASS has no terminal UI | The Support app on these (§2; P13, P15); P0 checks how a new app registers |
| F44 | P0: Mantle seeds the NotificationTopic rows its services send on, with no link and with Mantle approve and refuse services (`RequestTriage`, `RequestUpdate`, `TimesheetApproval` in MantleSetupData); BossSetupData sets each `linkTemplate` to a BOSS screen | The topics Customer Service's Mantle services send on (assignment, customer reply, SLA warning and breach, return decision, `ReturnExceptionApproval`, `OrderChangeApproval`, the low-score follow-up) are seeded in mr-mantle with Mantle handlers; each phase's Shell entry is BOSS's link to CaseDetail, ReturnDetail, OrderChangeDetail or ResponseDetail (§2) |
| F45 | P0: Purchasing's decision pattern is built: `mantle.order.purchase.PurchaseApprovalDecision` (mr-mantle entity/PurchaseOrderEntities.xml:22, `supersededDate` in PurchaseApprovalEntities.xml:91) holds source entity, id and revision, organization, decision, date, user, reason, policy row and step, and `operationKey`. `decide#PurchaseApproval` (service/mantle/order/PurchaseServices.xml:312) refuses STALE_REVISION naming the current revision (PurchaseOrders.js:508-509), but only when a revision is passed. The purchase topics use `approve#PurchaseSource` and `refuse#PurchaseSource` (PurchaseServices.xml:539, :558) | P9, P10, P11: the return authorization decision, OrderChangeDecision and WarrantyDecision copy the record's fields; their decide services require the revision on a topic path rather than defaulting to the current one |
| F46 | P0: Commons calls only `approve#NotificationMessage(notificationMessageId)` (mr-boss screen/Commons/Notifications.xml:57); the framework's `decide#NotificationMessage` (components/base/framework/service/org/moqui/ui/NotificationServices.xml:261-305) checks the recipient, parses `messageJson`, and calls the topic service with `recordEntityName`, `recordId`, `message`, `notificationMessageId` and `reason`. Purchasing writes `sourceRevision` into the message (PurchaseApprovals.js:295) | P9, P10: the Mantle handlers take those five parameters, read the revision from `message`, and refuse a message with none; no Commons or framework change |
| F47 | P0: supplier returns are built: `authorize#SupplierReturn` (ReturnServices.xml:1826, `ReturnHeader.supplierRmaId`), `create#ReplacementOrder` (:1846, `ReturnItem.replacementOrderId`); Shared/ReturnDetail's Purchasing branch (template/PurchasingReturnDetail.xml). Nothing links a customer return to a supplier return | P9: a case links a supplier return or replacement order by `link#RequestRecord` on ReturnHeader; no new entity |
| F48 | P0: Purchasing P10 is built: `RequestItem.quantityUomId` and `costCenterId`, audit-logged (PurchaseRequestEntities.xml:22-28). `complete#RequestFromWork` (RequestServices.xml:1357) skips RqtPurchaseRfq and RqtInventory (:1388), RqtPurchase with an OrgInternal party (:1391), and anything with no project (:1395) | P2: the support-case rule goes beside :1388-1395; P10's lines use `quantityUomId` |
| F49 | P0: Shared/RequestDetail.xml:262-320 branches on Projects, Manufacturing (:269), Warehouse (:273), Purchasing (:290, section-include :429), else Commons; its RequestNotFound condition (:430) names those; the Items tab outside Projects is gated to RqtPurchase (:312-320). Shared/WorkItemDetail has Projects, Manufacturing (:415) and Commons, and its transitions hardcode `'projects' : 'commons'` (:68-201) | P2: a Customer Service branch of the same shape and a key in WorkItemDetail's transitions; P10 and P11 widen the Items gate to RqtOrderChange and RqtWarranty |
| F50 | P0: Agreement statuses AgmStDraft, Active, Expired, Closed and Cancelled are built (PurchaseAgreementEntities.xml:102-118) on the audit-logged `Agreement.statusId`, but the services refuse anything not AgrPurchase (PurchaseAgreements.js:130, :144, `expire#PurchaseAgreements` :1314). AgreementType has no service or warranty type | P4 and P11: reuse the status flow, seed a service agreement type, and give it its own store and expiry or generalize the purchase ones behind their default |
| F51 | P0: Manufacturing P11 is built: `EquipmentServices.create#AssetMaintenance` (product/EquipmentServices.xml:79) has no permission, organization or owner check; `request#ProductionMaintenance` (ProductionServices.xml:1218) refuses an asset outside the organization's facilities and inventory types (ProductionDowntime.js:25, :50-59) | P11: not reused; see F67 |
| F52 | P0: Products P2, P5 and P7 are built: `check#ProductUsable` (ProductServices.xml:17) through `check#OrderProductUsable` (:36) from `create#OrderItem` and `add#OrderProductQuantity`; `get#ProductPrice` with `explain` and `priceTrace`; Shared/PriceExplain and Shared/InventoryAvailability, routed through `ironstone.products.CatalogServices.get#SharedContext`, whose SharedContext.js knows Products, Warehouse (:87), Manufacturing (:138) and Purchasing (:207) | P3: a Customer Service entry in SharedContext.js; P10's substitute lines get the usability check through the order services |
| F53 | P0: Shared/InvoiceDetail.xml:90-112 branches on Purchasing and Warehouse; any other app root falls to Projects' `get#InvoiceDetail` (:113), which needs a project link | P3: a Customer Service branch with a customer-scoped read, amounts withheld by §2; closes F35 |
| F54 | P0: `hold#Order` (OrderServices.xml:1285; PurchaseOrders.js `holdAllowed` :458-470) places a hold under its type's enumCode permission, or for OhtChange and OhtPurchase under the direction's change permission (PURCHASE_ORDER_EDIT, ORDER_CHANGE_APPLY or SALES_ORDER_CHANGE); `release#OrderHold` (:1366) takes the enumCode permission only. OhtChange's enumCode is ORDER_APPROVE (OrderHoldEntities.xml:43-52); ORDER_CHANGE_HOLD_RELEASE exists nowhere, and ORDER_CHANGE_APPLY and SALES_ORDER_CHANGE are checked but not seeded | P1 seeds the order-change permissions with ORDER_CHANGE_HOLD_RELEASE and makes X4's enumCode change, keeping existing releasers working; P10 places the Change hold under ORDER_CHANGE_APPLY |
| F55 | P0: sales orders have no commercial revision: `increment#OrderRevision` (OrderServices.xml:2890-2940) counts commercial changes only for a purchase part whose PurchasePolicy sets `commercialRevisionOnly`; `get#OrderCommercialSnapshot` does not exist | P10 builds it as Mantle's contract (crosscut CX-ORDER-AUTHORITY): commercial-only counting for sales parts behind an organization flag, default unchanged, with a test |
| F56 | P0: a PASS app registers in mr-pass `service/pass/Apps.js:7-14`, `screen/Pass.xml:26-27`, an app root with `.xml` and `.html.fancy` pages, `screen/Shared/Header.html.fancy:4-5` navigation, `Schema.js:926-1035`, `Routes.js:165-183`, `Transport.js:25-33` TOKEN_WRITES and `test/MoquiConf.xml:18-25`; in mr-mantle `public/PublicApps.js:7-29` (target and readiness, used by Forum.js :2035-2160), the mirrors `forum/ForumSchema.js` and `script/PassRoutes.js` (kept identical by mr-pass Forum.spec.js:381-385), TOKEN_WRITES in `PassApi.js:6-14` and `PassAuthority.js:9-17`, and a readiness branch like `account/Portal.js:583-594`. No PublicSiteApp rows are seeded; Accounting's Demo.js (:1620-1651, site ZIZI_PORTAL) makes them; mr-pass docs/Deployment.md:171-178 lists the places | P13 registers the whole `support` app (both catalogue mirrors, the three TOKEN_WRITES lists, Header, a readiness service, the demo mount on ZIZI_PORTAL and the BOSS grants); P15 adds pages and operations |
| F57 | P0: `invite#Contact` (ExternalAccessServices.xml:121-138; ExternalAccess.js :256-288) checks the app against `appKinds` (billing, supplier), requires a non-internal PtyOrganization and a published site for the organization, writes PublicSiteInvitation; redeeming writes `mantle.party.ExternalAccessContact` (ExternalAccessEntities.xml:49-67) and skips an app not in `appKinds` | P13 adds `support` to `appKinds` with SUPPORT_CONTACT_INVITE; P15 allows a PtyPerson customer under it. A signed-in contact is checked by ExternalAccessContact, a bearer link by ExternalAccessCapability (§2 reads so) |
| F58 | P0: media staging is Accounting's `Portal.js stage` (:479-508: PDF, PNG or JPEG, 10 MB, scanned), finalized by `Payables.js attachStaged` into InvoiceContent and `SupplierPortal.js keepFile` into OrderContent; nothing finalizes into RequestContent or ReturnContent | P15: a `support` noun and a copier into RequestContent and ReturnContent of a customer-visible type, `stage` moved to a shared Mantle module |
| F59 | P0: PublicSitePage (PublicEntities.xml:89-97) binds exact wiki versions for the roles `guidelines` and `about` only (Forum.js :1949-1978, :3173-3209), served by `get#PublishedWikiPageText` cleaned | P12, P15: KnowledgeServices serves published articles by the same exact-version rule, reusing `get#PublishedWikiPageText` and its cleaning, as a Support operation; not PublicSitePage |
| F60 | P0: `PublicApps.pageUrl(siteId, app, path)` (:47-56) and `sitesFor(app, targetId)` (:58-82) build notice URLs; `send#Invoice` sends without the link and logs when there is no site (InvoiceServices.xml:4076-4085) | P13, P15: case, RMA and feedback notices use them the same way |
| F61 | P0: ExternalAccess.js `records` (:25-63) has Invoice, Order and Quote kinds with scopes, permissions and `resolve`; `check#AccessToken` (ExternalAccessServices.xml:81-99) only looks a token up, with no scope, organization or record check; pages use `ExternalAccess.check` (:174-205) | §2 and P9, P13, P15: bearer links are checked by `ExternalAccess.check` (`check#AccessCapability`), not `check#AccessToken`; record kinds ReturnHeader (RMA) and the form invitation; a queue's public form needs a party-less kind (P6, with F10's queue token) |
| F62 | P0: `create#Request` (RequestServices.xml:17-56) writes RequestParty rows after the Request, defaulting to ReqDraft, RqtSupport, no category and no channel. Entry points (type / category / customer / status / channel): Comms and Commons quick create (mr-boss QuickCreateServices.xml:292-325) RqtSupport / none / the matched sender or context party, possibly internal / Submitted / none; Chat (CommunicationServices.xml:4359) no customer, Submitted; Commons `raise#Request` (commons/RequestServices.xml:268-294) customer optional, Draft or Submitted, with a due date; `convert#TaskToRequest` Draft; Projects `create#ProjectRequest` and the client portal with a project, Submitted; `create#RequestFromEmail` sender as customer, Submitted, ScEmail; `create#IntakeRequest` writes the entity directly and sets channel and project in a second update, ScWeb; the forum's `create#CaseFromTopic` (ForumIntegration.js:505-530) the only one with a category, Draft | P2: the case rule runs after commit (as `queue#RequestTriage`, :1234-1253) and fires on a Customer RequestParty create and on a type, category or status change, not only on Request create; decisions in §4 (Nov 5) |
| F63 | P0: Commons Today's `get#UserTodayRequests` (commons/RequestServices.xml:292-349) lists every open assigned request due by day's end with no type filter; `find#RequestRows` (:82-175) any request of a party role, filer or follower; Projects' `find#ProjectRequests` visible projects plus no-project requests of the triaged types | P2: `get#UserTodayRequests` leaves out cases, which P2's Today source lists; the Commons lists keep cases and link CaseDetail (F9) |
| F64 | P0: every path ends in an update of Request, most through `update#Request` (RequestServices.xml:140-172). RequestTriageNotice is in mr-mantle entity/Request.eecas.xml:19-24; an after rule has `originalValue` (crates/moqui-core/src/service/eca.rs:86-108). Only `statusId` is audit-logged. Refuse or route on a case: `triage#Request` (ProjectRequestServices.xml:365-462) and `bulk#Requests`; `update#ProjectRequest` (:516-581, missing from F8); Commons `set#RequestStatus` cancel and `update#MyRequest` due (commons/RequestServices.xml:423-489); `raise#Request`'s due; `ClientServices.cancel#ClientRequest` (:599-620). Record only: `make#RequestWorkItem`, `link#RequestWorkItem` (missing from F8), `convert#RequestToProject`, `complete#RequestFromWork`. mr-marble's EditRequest screens write status, due and resolution through raw `update#Request` | P2: the refusals in those services, and in Mantle `update#Request` a due date or resolution on a case from anywhere but SlaServices and SupportCaseServices (covering marble); the audit log on category, type, priority, due date and resolution. P4: one after EECA on status, due date and resolution of a case records every path |
| F65 | P0: `get#NextBusinessDay` and `get#FutureBusinessDay` (EventServices.xml:2250, :2318) count whole UTC days; holidays come three ways (organization `allDayStart`, categories, calendar members); `store#WorkingHours` is BOSS's `ironstone.commons.CalendarServices` (current user, one undated WetAvailable). Manufacturing's `ProductionCalendar.js` already computes minutes on a `mantle.work.calendar.Calendar` with a time zone (`calendarOf` :135-200, `endAfter` :370-385, `intersect` and `hoursOf` :398) | P4: those functions pulled into a shared Mantle module that ProductionCalendar calls, business-time due and elapsed on it; a team's schedule a Calendar owned by the team party; Mantle `store#WorkingHours` new, Commons' service calling it; one holiday convention |
| F66 | P0, read not run: a partial `cancel#OrderItem` (OrderServices.xml:1882) lowers quantity and ShipmentItemSource (`putBackQuantity`) and removes reservations only on a full cancel; the SECA OrderItemUpdateCheckReserve (ProductAsset.secas.xml:37) re-reserves `quantity − issued` afresh through `reserve#AssetForOrderItem` (removing all first, AssetServices.xml:847), so no excess stays. Its over-reserved branch is dead (returns at `<= 0`, :878, before `< 0`, :880) | P10 calls no `reduce#AssetReservation` after `cancel#OrderItem` (it would under-reserve) and asserts the rows; supersedes F28 |
| F67 | P0: AssetMaintenance (ProductAssetEntities.xml:730) has audit-logged status, `taskWorkEffortId`, content and order items, `assetMaintenanceId` on AssetIssuance, and is RecordFiles-registered; WepMaintenance is unused. A sold serial is AstDelivered, owned by the customer, and keeps its facility, so Manufacturing's checks refuse it. No entity filter covers Asset, AssetMaintenance or WorkEffort | P11: one AssetMaintenance per repair on the sold serial's Asset through `create#AssetMaintenance`, its work a WepMaintenance task in `taskWorkEffortId`, parts by AssetIssuance, linked to the case by `link#RequestRecord`; WarrantyServices checks organization and customer itself; finishing is AsMntCompleted. Closes F33 and F40 |
| F68 | P0: `RecordFilesServices.get#RecordFiles` (mr-boss shared/RecordFilesServices.xml:111-260) and Chatter's `forFiles` give a PROJECT_CLIENT user every file of a request, RqCntInternal included; `get#ClientRecordVisibility` (CommunicationServices.xml:1859-1960) shows a no-project request to the client who filed it, with internal status labels | P2: `get#ClientRecordVisibility` leaves out cases, so customers read cases only through Support. The Projects leak of internal files is a Projects bug, written into impl-projects |
| F69 | P0: DbForm, DbFormField, DbFormFieldOption and FormResponse are in components/base/framework/entity/ScreenEntities.xml:402-575 with no dependency entity and no dates; `db_form_node` (crates/moqui-core/src/screen/form.rs:447-576) reads through the cache with no date. Only `dynamic="true"` forms go through `assemble_dynamic` (:354), which renders in html, qvt and tui; qvt-static writes a note and xml ignores form-single. `visible-when` exists in qvt, qvt-static and tui but not in ScreenHtml.js; there is no require-when. PASS pages can embed an html form-single but load no framework scripts (CSP `script-src 'self'`) | P7 framework: a dated DbFormField dependency entity mapped by `db_form_node` to `visible-when` and a require form of it, under style-guide §8.1 with the html fallback; templates are dynamic forms; P13 and P15 use the html fallback on PASS with server re-evaluation; `validate#TemplateValues` checks on the server |
| F70 | P0: the audit log works on any entity (crates/moqui-entity/src/entity/field_rw.rs:318-360); changing DbFormField's key would break its options, attributes and FormResponseAnswer | P7 framework (about 100-200 lines plus specs): non-key `fromDate` and `thruDate` on DbFormField, DbFormFieldOption and the dependency entity, key fields audit-logged, an as-of date read by `db_form_node`, `assemble_dynamic`, `getFormNode` (tools_host.rs:620-628) and `get#FormResponse` (the response's date), drafts excluded; the delete-and-recreate `update#DbFormField` retired for dated rows |
| F71 | P0: `dynamic-options depends-on` works in qvt, html and tui, and per row in a non-multi editable form-list, whose tui row forms are the twin; in a qvt `multi="true"` list `dependsOn` is not suffixed `_N` (ScreenQvt.js:272 vs :322), not verified | P5 and P7: no new framework element; the condition rows are a non-multi editable form-list with dependent operator and value options, typed values checked on the server. CS-FORM-ELEMENTS reduces to F69 |
| F72 | P0: Dev AIDE presence (components/dev/dev-aide/src/notify.rs:114-170) is an in-memory per-node map broadcast to fixed groups and not cleared on close, so it does not generalize; the notification WebSocket's `notws/collab.rs` has per-document members tied to the socket (join with an access check, leave on close, cluster topic), bound to Yjs and wiki pages (crates/moqui-collab/src/lib.rs:445) | Who is viewing costs about 200-300 lines of Rust on collab's pattern plus a qvt component: decided in §4 (Nov 5) |
| F73 | P0: ORG_ACME and ORG_BLUTH have no owner; CustJqp and JoeDist are owned by ORG_ZIZI_RETAIL. BossWarehouseDemoData.xml has entity rows to CustJqp that Warehouse's walks rely on (BOSS_WH_SO*, BOSS_WH_RETURN, BOSS_WH_RMA, serials SCN-1001 to 1003); Accounting's Demo.js makes returns and invoices for BOSS_ACCT_ORG. Nothing makes a delivered serialized sale, a PftWarranty feature or a paid Ziziwork sales order | P1: a demo loader on Demo.js's pattern with its own IDs, the Warehouse rows untouched: a serialized product with PftWarranty sold, delivered, invoiced and paid; an order awaiting pick; a packed order; for CustJqp and JoeDist |
| F74 | P1: `Party.ownerPartyId` defaults to `_NA_`, so ORG_ACME and ORG_BLUTH are shared parties, not unowned as F73 read them; ORG_ACME is a shared customer in every organization's scope, as ZiddlemanInc is Purchasing's shared supplier | Kept; CustomerServiceAccess checks both organizations serve it. P3: Customer360 of a shared customer lists only the user's organizations' orders, cases, returns and invoices |
| F75 | P1: adding `customerservice` took a row of the client deny pattern past `artifactName`'s 255 characters | Split into two rows; the next package added there needs the same check |
| F76 | P1: a data file loads in one transaction, so a demo service that commits each record on its own cannot see its own file's rows | The service call is in a later-loading `BossZCustomerServiceDemoData.xml` |
| F77 | P1: a customer's record link stays Commons' until Customer360 is under Customer Service; a sales order, which had no link, opens Customer Service's Home lookup | P3 moves both to Customer360 and OrderDetail |
| F78 | P1: crosscut X4 also names `BOSS_PURCHASING_BUYER` and `BOSS_SALES_CHANGE` for `ORDER_CHANGE_HOLD_RELEASE`; neither is granted, since a purchase revision's Change hold is released by its approval or cancel and Sales has no group. `hold#Order` and `release#OrderHold` check neither the organization nor the order's direction, so the holder may release any order's Change hold | P10's release checks the order through AccessServices `check#Record` first, as Purchasing's `releaseHold` does; the Sales grant comes with Sales |
| F79 | P2: a customer contact's own request (Chat, Commons `raise#Request`, the forum) has no Customer RequestParty, so the Nov 5 rule made none a case | The rule takes the filer as the customer when the filer is a served customer, or the customer the filer is a contact of (PrtContact or PrtEmployee); never a filer working for an internal organization (P2 review R1) |
| F80 | P2: `BOSS_ADMIN_PRIVACY` does not exist (Admin is not built) | The Privacy queue is restricted to its team, whose members must work for the team's organization (P2 review R2); the demo team is the Customer Service admin; Admin's group joins when Admin is built |
| F81 | P2: leaving every case out of `get#ClientRecordVisibility` (F68) hid a project's case from its own Projects client, against the Nov 5 decision that project cases stay in Projects | Only cases with no project are left out; a project's client still sees its internal files through Projects' bug (impl-projects F159) |
| F82 | P2: Mantle's specs run with BOSS's demo data loaded, so a demo ServicePolicy that service-enables a type for an organization a Mantle flow uses turns its requests into cases (WorkPlanToCashBasicFlow with ORG_ZIZI_SERVICES) | The Services demo enables no type; no later phase service-enables a type for ORG_ZIZI_SERVICES |
| F83 | P2: F64's "not from SlaServices or SupportCaseServices" is not done as a caller check (Practices-App-Dev §4) | The case services write the Request entity themselves, and `update#Request` refuses a due date, resolution or close on a case (CASE_MANAGED); P4's SlaServices writes the same way |
| F84 | P2: the case rule runs after commit on the service pool, so a request's CaseProfile appears a moment after `create#Request` returns | Specs wait for it; NewCase and the Support app call `create#Case`, and `get#CaseState`'s `wouldBeCase` answers before the profile exists |
| F85 | P3: `org.moqui.mail.EmailClientServices.save#Draft` refuses an attachment outside the account's own mail files unless authorization is disabled; Mantle's resend attaches the stored OrderContent PDF that way, after its own checks. | See P3 |
| F86 | P3: Accounting's receivables groups hold RECEIVABLE_VIEW, not ACCOUNTING_VIEW, so §2's "financial amount by ACCOUNTING_VIEW" would withhold invoice amounts from an AR user; Customer Service reads either (§2 should say so). | See P3 |
| F87 | P3: Customer Service users held no catalog read: Products' shared screens refuse without PRODUCT_CATALOG_VIEW. P3 grants it to the root group and PRICE_VIEW to the agent, manager, order desk and administrator; the service reader has no price read, so Product360 has no Prices tab for it and PriceExplain, which checked catalog read only, is refused it here. | See P3 |
| F88 | P3: Shared/Customer360 is Accounting's: its header and every tab read `get#CustomerContext` and its capabilities; the Customer Service branch reads in always-actions (a tab renders alone), adds its own tabs and a conditional default, and keeps Accounting's tabs to Accounting by a condition on each. | See P3 |
| F89 | P3: find#ServiceCustomers' phone search (P2) matched the digits alone, which miss a number kept with its separators ("234-5678"); it and the palette now match the number as typed too. | See P3 |
| F90 | P3: A credit hold is placed only by the credit policy (`hold#Order`), so the demo's held order is a manual hold with its reason; a credit hold's reason is withheld from a user without CUSTOMER_CREDIT_VIEW (checked on Customers and OrderDetail by the code path, not by demo data). | See P3 |
| F91 | P3: Customer creation (FindCustomer's create forms) is not in Customer Service: the Commons contact record and Sales create parties; ss-inventory marks them so. | See P3 |
| F92 | P3: CustomerService.js's `partyName` leaves out a middle name ("Joe Public") where Mantle's `partyNames` keeps it ("Joe Q Public", CaseDetail); P16 may align them. | §7: kept (the specs and fixtures read "Joe Public"); a change of CustomerService.js partyName to Mantle's partyNames with them |
| F93 | P3: A shared screen's service (`CatalogServices.get#SharedContext`) is authorized through the mounting root's inherited authorization, so a spec calls it as a Customer Service user with authorization off, as Warehouse's do. | See P3 |
| F94 | P4: Design ServiceLevelPolicies' "precedence" is not a field: the most specific condition ranks the policy, and two rows of one rank can both hold for a case only when their conditions are equal, so the refused overlap is two published rows with the same conditions over overlapping dates (EQUAL_RANK_OVERLAP); a replacement names its row and ends it. | See P4 |
| F95 | P4: The case rule makes the profile after the commit (F84), so loaded data gets its clocks then: the demo team's hours are stored by a demo file that loads before the requests (BossX before BossY). A request made before any policy started (a backfill) takes the row in effect now. | See P4 |
| F96 | P4: A declared in-parameter not passed arrives as null, so save#Policy reads null as "unchanged" and an empty string (a form's cleared field) as "none". | See P4 |
| F97 | P4: Ending a weekly working-hours series from a date needs no new field: its RRULE's `UNTIL` (RFC 5545) ends it for get#EventInstances, get#FreeBusy and business time alike. | See P4 |
| F98 | P4: A sent mail is filed on its case (RequestCommEvent) only once it is ES_SENT (file#SentEmail), so the RequestCommEvent rule sees a send the channel accepted; a failed send waits in the Outbox unfiled. Projects' intake confirmation is a RequestEmailMessage with no CommunicationEvent and never reaches the rule; `CpAcknowledgement` marks any other automatic message. | See P4 |
| F99 | P4: BOSS's settings organization choice (every internal organization for the administrator) can be one Mantle's scope refuses (`get#PartyOrganizationInfo`; the administrator's first option ORG_ZIZI_CORP): ServiceLevelPolicies then says the organization's levels are not available. P2's settings saves have the same mismatch. Fixed in review (R3). | See P4 |
| F100 | P4: CaseAnalytics (design §2: `CustomerService/Reports/CaseAnalytics`) made Reports a menu group before P14: Reports' placeholder is now `Reports/ReportsHome`. | See P4 |
| F101 | P4: F50: P4 seeds `AgrService` and builds no store or expiry for service agreements; a policy's agreement condition reads an Agreement of that type between the organization and the customer, active by its dates and, when it has a status, AgmStActive. The purchase agreement services still refuse it. P11 builds the store. | See P4 |
| F102 | P4: A customer's reply while the case waits for them is recorded (`SetCustomerReply`) but does not resume the clock: design ServiceDefaults' "customer reply before close reopens via policy" is P8's. Review: the wait is P4's (a resolved case's reopen stays P8's), fixed (R2). | See P4 |
| F103 | P12: WikiPage has no language and the demo keeps English and Spanish customer articles in the one space ZZW_RETAIL, so a source is a space or the part of it under a page path; a page belongs to its space's source with the longest matching prefix. Design KnowledgeSources changed. | See P12 |
| F104 | P12: ZZW_RETAIL is the POPC store's public content space (`publicPageUrl` /popc/content/…, restrictView N): a published page there is public, so an internal article cannot be one of its pages. Internal articles are in ZZW_SVC, and save#ServiceKnowledgeSource refuses an internal source in a space with a public address (INTERNAL_PUBLIC_SPACE). Design changed. | See P12 |
| F105 | P12: ZZW_RETAIL's `publicPageUrl` is relative; get#ArticlePublicLink makes it absolute on the webroot's URL when there is a web request (a send from a job would keep it relative). P15's CustomerArticle builds the link with `PublicApps.pageUrl` instead. | See P12 |
| F106 | P12: Commons Knowledge renders in vue, qvue and tui only, so the Customer Service Knowledge group, whose default it is, opens at its full path; AppStructure skips the group path (`fullPathOnly`) and renders the mount, and FoundationWalk opens the area in tui. Knowledge.qvue finds its own level by the last `Knowledge` of the path. | See P12 |
| F107 | P12: Without a search index `search#WikiPages` matches only a page path containing the whole text, so suggestions match each word of the subject (three letters or more, common words left out) in the page paths, ignoring case, in the query; ranking by the text through the index is later. | See P12 |
| F108 | P12: An agent who files a case is its Reporter (P2's thermostat demo case), so the customer's side of a case's messages and personal data is its Customer and Reporter parties that are not staff (an internal organization or someone who works for one). | See P12 |
| F109 | P12: The plan names four Mantle services; Send to customer, the agents' feedback, Suggest edit and F59's read need `get#ArticlePublicLink`, `record#ArticleFeedback`, `suggest#ArticleEdit` (with the internal `make#ArticleTask`) and `get#PublishedArticle`, which P15's CustomerArticle and its rating call. Design CaseDetail's Knowledge tab changed (Helpful?). | See P12 |
| F110 | P12: A knowledge author sees no case unless in a team of its queue (the Support queue is SqvTeam); the demo author joined the Support team. | See P12 |
| F111 | P3 review: an organization's `orderConfirmationOnPlace` flag (PartyAcctgPreference) has no field on Accounting's organization settings; with it on for the Retail demo, the demo load met statement timeouts against the Accounting demo's background loader, so the demo leaves it off | Done P16: the field on AccountingPreferences (Mantle's preference fields and flags); the demo leaves it off (see P16) |
| F112 | P4 review: Cases' Needs response and SLA risk views pass up to 5000 request IDs from the clock table as an `in` list; a clock that keeps failing in the scan is named on every run and keeps a slot in each batch; working hours stored for another person go on that person's schedule calendar, not the personal series free/busy reads | P14 (a join or subquery for the views when reports are built); §7 for the others |
| F113 | P12 review: an operation key reused after a feedback batch committed but before the key was recorded answers AlreadyReviewed per item, not the first result; redaction from up to 200 orders, returns and invoices can over-redact a short numeric ID, which the author sees in the preview; the ArticleFeedback list shows page titles to authors and managers without the per-page wiki check | Kept: the same window as the other batches; the preview; the organization's own articles |
| F114 | P5: Compose's text-block picker inserts text in the browser and cannot preview or run a reply's case actions, so CaseReplyAction is CaseDetail's Saved reply tab, offering the same text blocks by Comms' rule, the text editable before the apply. Design CaseDetail and SavedReplies changed. | See P5 |
| F115 | P5: SavedReplies sits under Settings, whose area denies the agent (BOSS_CS_SETTINGS), so it is the manager's and administrator's; an agent makes personal replies in Comms TextBlocks (one library, D24) and uses them on CaseDetail. Opening the page to agents needs an ALWAYS authz on a child of a denied area, for the lead. | See P5 |
| F116 | P5: The service-wide group is the root user group, which spans organizations (Ziziwork Services' agent is in it); a global reply keeps to its organization by SavedReply's organization in Customer Service, while Comms TextBlocks lists it to every member. The administrator, in BOSS_CUSTOMER_SERVICE_ADMIN alone, cannot share a reply with the root group (Comms requires the author to be a member). | See P5 |
| F117 | P5: An agent's own Preferences hours are a personal series on no calendar, which business time does not read, and store#WorkingHours does not let an administrator keep a person's schedule calendar (WORKING_HOURS_EDIT checks the party's owner, `_NA_` for a person): a participation names an organization's or team's calendar for the agent's hours (F112). | See P5 |
| F118 | P5: BusinessTime's `calendarOf` says `configured` only when its window holds working time, so "in hours now" reads the week ahead to tell a schedule with hours on other days from one with none. | See P5 |
| F119 | P5: A team's group is `SVT_<team>` of type `UgtServiceTeam`, found by the team's id with no new record; the demo's data names it and BossZ fills it. | See P5 |
| F120 | P6: Design ChannelRouting said it "extends what exists instead of adding a route table", but RouteEdit's fields (sender and automatic-mail rules, the acknowledgement and its text, reply identity, the form's limit, the token's days, a forum site and category) have no holder in EmailRule, PartySetting or ServiceQueue: P6 adds the dated `ServiceRoute`; the mail itself stays the Comms rule and the token an ExternalAccessCapability. Design ChannelRouting changed. | See P6 |
| F121 | P6: BasicComms' Inbox renders no `message-actions` slot (only Chat's `chat-message-actions`, `voicemail-actions` and `call-actions`), so Create a case from a mail is a `widgets-extend` on MessageDetail; an Inbox slot is framework work (§7). | See P6 |
| F122 | P6: An `ext-action` with a transition target shows to every user of the screen (only a `screen` target is left out for a user who may not view it): Chat's and Voicemail's Create a case show to users without Customer Service and are refused by `create#CaseFromMessage`. Chat's `createFrom` calls every `create-from` provider and takes the first answer, so a second provider would break it: the case kind is in BOSS's one provider. | See P6 |
| F123 | P6: (F76 again) Rows in a demo file that the same file's demo service then locks against (a text block's group, a route's queue and organization, by foreign key) made that file's own-transaction order loads time out: the channel demo is a file of its own after BossZ. | See P6 |
| F124 | P6: §2 and design §8 say a bearer link is checked by `check#AccessToken`; per F61 the queue's token is checked by `ExternalAccess.check` (`formTarget`); design §8 NewCustomerCase changed. | See P6 |
| F125 | P7: The audience: a DbFormFieldAttribute is neither dated nor audit-logged and goes onto the rendered widget as an XML attribute, and a Mantle record by formId and fieldName would be a second dated row to keep in step with every successor. `DbFormField.audienceEnumId`, extended by Mantle as F6 gave RequestCategory its owner, is dated and audit-logged with the field, so a response reads the audience it was submitted under; a published field's audience changes only by a successor, so an internal answer never becomes customer-visible. The template's organization is `DbForm.ownerPartyId` the same way. | See P7 |
| F126 | P7: `create#DbFormFieldSuccessor` copies a fixed list of DbFormField fields, so an extension field (the audience) is not copied; `save#CaseTemplateField` sets it on the successor. The suspicion that the framework's `update#DbFormField` (or the entity-auto `update#DbForm`) clears the non-key fields it is not given is false (Review: checked by a call with the title only, the audience, required flag, help, type, order and `ownerPartyId` kept). | See P7 |
| F127 | P7: `save#ServiceQueue` (P2) made each row from its parameters, so any queue save dropped the row's `templateFormId` (and would drop P5's `assignmentRuleId`); it now keeps the template unless one is given. P5 must carry its rule the same way. | See P7 |
| F128 | P7: qvt's browser `require-when` covers text-line, password and date-time only (§7): the demo's serial (a text line) gets the browser's hint; a required choice or checkbox is the server's check alone, which NewCase reports on submit. | See P7 |
| F129 | P7: NewCase's SubmitCase extends the template's DbForm, so one submit carries the case's fields and the template's: a template field never takes the name of a create#Case parameter or Request field (reserved in Mantle), and createCase passes the request's parameters, of which Mantle keeps the template's fields only. | See P7 |
| F130 | P7: A condition on a text or date field by value (equals) is refused (a typed allowlist: values compare only against a choice's options), so a condition's value is always one the source offers and can be checked when the source's options change. | See P7 |
| F131 | P5 review: the Customer Service administrator, on no team, cannot share a service-wide reply (Comms requires the author to be a member of the `SVO_<organization>` group); any Comms user can share a text block with a team's `SVT_` group from Comms TextBlocks, which Customer Service then lists as a team reply with no actions | Done P16: `sync#ServiceTeamGroup` keeps the organization's SUPPORT_CASE_MANAGE and SUPPORT_POLICY_EDIT holders in its SVO_ group; the Comms path left as Comms' own sharing (see P16) |
| F132 | P6 review: Chat's and Voicemail's Create a case ext-actions show to every Comms user (an ext-action's condition tests only the item's fields); mail forging a real customer's From makes a case for that customer, the acknowledgement going only to the customer's stored address (EmailMessage keeps no DKIM or DMARC result) | The server refusal in `create#CaseFromMessage` guards the first; §7 for a permission test on ext-actions and a hold on mail failing DMARC |
| F133 | P7 review: the framework read `dbFormIncludeDrafts` and `dbFormAsOfDate` from the render context, request parameters included, so a URL could show a dated DbForm's drafts on any screen extending it | Fixed in the framework at the W4 boundary (mr-moqui 8939cb46): the as-of date and drafts are the form element's `db-form-as-of` and `db-form-include-drafts` attributes, expressions in the screen's context, the outermost form in an extends chain deciding; with neither, a form reads as of now without drafts. TemplatePreview sets `db-form-include-drafts`; NewCase sets neither |
| F134 | P7 review: mr-marble's SimpleScreens Survey `Fields.xml` and `EditSurvey.xml` edit any DbForm by formId, case templates included, past Mantle's allowlist (a `${` label the renderer expands, the audience) | mr-marble is read only here and the screens are ADMIN's; §7: Marble's survey screens refuse a form whose purpose is not a survey |
| F135 | P8: No request merge exists in Commons or Projects to keep: BOSS's MergeRequests spec is Projects Code's git merge requests (`moqui.resource.GitMergeRequest`), untouched by case merges (it passes). | See P8 |
| F136 | P8: ServicePolicy already had `reopenWindowDays` and `autoCloseDays` (P2), and `transition#Case` already refused a reopen past the window (REOPEN_WINDOW_PASSED) or of a closed case (CASE_CLOSED); P8 adds the customer's reply path, the follow-up and the job that sets the closed date. | See P8 |
| F137 | P8: "Obligations carried" needs a record of each: a merge copies each open clock of the source onto the kept case (`CaseSlaEpisode.carriedFromEpisodeId`, its start, due, pauses and breach kept), which then follows the kept case's own clock of its kind, and the source's own clock ends `SlsMerged` with its figures. So compliance counts the copy and never the Merged clock, and a breach is never counted twice; Home's measures already read only met, missed, running, paused and unmet clocks, and P14's reports must too. Design MergeCases changed. | See P8 |
| F138 | P8: A message referenced on another case (RequestCommEvent) fires that case's RequestCommEvent rules as a new response or customer reply; the CaseRelationItem is written before the link, and `Sla.js recordMessage` and `notify#CaseCustomerReply` skip a message referenced there. `delete#RequestComment` on either case deletes the comment from both (§7). | See P8 |
| F139 | P8: The follow-up of a reply that is not mail runs after the commit (`make#FollowUpCase` by `registerOnCommit`): the reply's transaction is its caller's (Chatter, a filing) and a failed insert would abort it on PostgreSQL. A mail's follow-up is made in the intake's own transaction (`resolveMail`). The after-commit call runs on the real clock, not a spec's effective time, so SupportRelations makes the cases it follows up in the past and moves ahead only for the mail and the job. | See P8 |
| F140 | P8: `close#ResolvedCases` takes a batch by `lastUpdatedStamp` before the cutoff (resolving is an update, so the stamp is at or after it; the per-case check reads the status audit log), so cases of organizations without auto-close or resolved recently never fill the batch. `lastUpdatedStamp` is the transaction's real start time, not the effective time. | See P8 |
| F141 | P8: A second reply to a closed case would make a second follow-up; it joins the follow-up still open instead (mail and other replies alike). | See P8 |
| F142 | P8: SupportSla's status-event check read events with no order, which a longer run returned out of order (the table's order after updates); it sorts them by id. | See P8 |
| F143 | P9: ReturnHeader has no revision field; a return's revision is the latest `lastUpdatedStamp` of its header, items and ReturnParty rows (ReturnPolicies.js `revisionOf`), which every path (Warehouse's receipt, settlement) moves. | See P9 |
| F144 | P9: ORG_ZIZI_RETAIL settles returns at Mantle's default (`returnSettlementRequired` N, which Mantle's return flows need), so Warehouse's `receive#ReturnItems` refuses its returns (RETURN_SETTLEMENT_OFF): ReturnDetail offers Receive only where the organization settles separately and says Mantle receives at delivery otherwise; the walk turns the flag on and restores it. For the lead: whether the Customer Service demo needs its own organization with the flag (as Warehouse's BOSS_WH_RETURNS). | See P9 |
| F145 | P9: Warehouse's inspection transitions checked Warehouse's scope, refusing a borrowed W without the Warehouse root (WAREHOUSE_UNAVAILABLE); WarehouseInspectionParts gains a Customer Service branch (`check#ReturnInspection`). Verification stays the quality verifier's (a different user, Warehouse); the inspection drop-downs are still Warehouse's choices. | See P9 |
| F146 | P9: A customer return shipment has no store and comes from the customer, so `request#ReturnLabel` finds no gateway unless its route segment names one (no organization default is read), and the test carrier needs a weight and unit (WEIGHT_REQUIRED): NewReturn takes the label's carrier and service, Issue return label the weight and unit, and the walk sets TEST_SHIPPING on the segment. For Warehouse (design-warehouse ReturnReceipt): the vendor's default gateway for a return. | See P9 |
| F147 | P9: With no policy the return is manual review: authorization needs a reason (recorded on the decision), not an exception; an exception (outside the window, a reason or remedy not allowed, goods with no order line) needs a manager's approval at the return's current revision first. Goods with no order line are entered with a description of the goods and ownership and always need the exception. | See P9 |
| F148 | P9: Under the default flag an immediate response is processed by Mantle at approval, as the acting user; the credit memo's Incoming to Approved transition needs `INVOICE_APPROVE` (StatusFlowTransition.userPermissionId), so an authorizer without it failed the whole authorization. Not a fresh-organization effect: any organization at the default flag hits it (review R1: an immediate credit or refund there also needs `INVOICE_APPROVE`, else it waits for receipt). The same transition runs in Mantle's own receipt at delivery (`respond#ReturnItems` as the receiving user) — for the lead. | See P9 |
| F149 | P9: F22 changes an existing Mantle service's behaviour (not a refusal): `cancel#Return` now cancels its unreceived return shipment; the compatibility specs pass. | See P9 |
| F150 | P10: An entity file's seed data loads in file order, so the proposal's seeds failed in `OrderChangeEntities.xml` (RequestType and OrderContentType not loaded yet) and the whole file was skipped; the file is `SupportOrderChangeEntities.xml`, after them, its seeds in an entity's `seed-data` (not an extend-entity's). | See P10 |
| F151 | P10: Ziziwork's organizations have no PartyAcctgPreference of their own and inherit ORG_ZIZI_CORP's (find#PartyAcctgPreference): a demo row for ORG_ZIZI_RETAIL replaced the inherited one (WarehousePacking's kitCostFromComponents failed), so the sales flag is read through find#PartyAcctgPreference and set on ORG_ZIZI_CORP. | See P10 |
| F152 | P10: Retail finalizes its pack invoice at pack (no D3 flag), so the demo packed order's change is BILLING_CONFLICT when filed; the walk's reopen is its own order, packed while the company finalizes at ship. The demo order becomes reopenable when Accounting turns salesInvoiceFinalizedAtShip on for Ziziwork, which also changes Mantle's flows that run with the BOSS demo; for the lead. | See P10 |
| F153 | P10: pack#Shipment completes a fully packed order part (OrderCompleted), and hold#Order refuses a completed order: save and apply accept a completed order, refuse only what shipped, and reopen the package (back to Approved) before the Change hold. | See P10 |
| F154 | P10: Mantle reserves at placement by default (AsResAutoPlaced, an ad hoc asset when out of stock), so customerImmediateCancel's "nothing reserved" holds only for an order part that reserves at approval; the condition stays as designed. | See P10 |
| F155 | P10: The stock put back after a reduced packed line is Warehouse's: cancel#OrderItem flags putBackQuantity and Warehouse's reverse#Pick (SHIPMENT_PICK, which the order desk lacks) moves it, as design §4's receiving sides say; apply does not call reverse#Pick. | See P10 |
| F156 | P10: This runtime's entity find is consumed by `condition()`: a find built across statements must reassign it (`query = query.condition(...)`), or its `list()` fails "entity find was already used". | See P10 |
| F157 | P10: F78: apply places and releases its own Change hold in one transaction (a failed apply rolls it back), so P10 builds no manual release of a Change hold; one left by another path is released through release#OrderHold with ORDER_CHANGE_HOLD_RELEASE, which a later screen must put behind check#Record. | See P10 |
| F158 | P10: No BOSS group holds SALES_APPROVE or SALES_ORDER_CHANGE (Sales is not built): a commercial kind is filed and routed, and no one in BOSS decides it until Sales grants them (§7). | See P10 |
| F159 | P10: Approvals (P9's screen) should pass the OrderChangeApproval topic; until then the notice is decided from Notifications or OrderChangeDetail. | See P10 |
| F160 | P10 review: `hold#Order` and `release#OrderHold` now lock an order's parts before its header, as Warehouse's `lockOrders` does, and apply locks the proposal, the order's shipments, its parts and its header; callers that lock the header themselves before calling `hold#Order` still take it first: Purchasing's `PurchaseOrders.js` `purchaseOrder(orderId, true)` (the purchase revisions) and several OrderServices verbs, which can deadlock against purchase receiving locking a part | Purchasing's code: §7, to bring those callers to the parts-then-header order |
| F161 | P10 review (F156): the script runtime's entity find chain methods (`condition`, `orderBy`, `limit` and the others; crates/moqui-core/src/script/runtime/entities.rs `take_find`) take the inner find and return a new one, so Java-style `q.condition(...); q.list()` fails loudly with "entity find was already used"; Java's EntityFind changes in place | By design and loud; §7: a framework choice to change the find in place and return it, and a line in the script docs |
| F162 | P10 review: a customer who filed a change reads it through the organization-scoped `get#OrderChange`, which shows decisions' reasons and approvers | P15: a customer-facing read and withdraw of a cancel request |
| F163 | P9 review: at Mantle's default (`returnSettlementRequired` N), Mantle's own receipt at delivery (`respond#ReturnItems` as the receiving user) needs INVOICE_APPROVE for an immediate credit memo's Incoming to Approved, as authorization did (R1); Warehouse's `addReturnItem` checks invoiced quantity, not shipped, and no policy (routing it through `save#ReturnItem` needs SUPPORT_CASE_EDIT or RETURN_AUTHORIZE, which W users lack) | Mantle's and Warehouse's: §7 |
| F164 | P11: Products already edits a warranty: a PftWarranty feature's number and time unit on Products/Features (NewFeature, FeatureDetail Summary) and its application to a product on Product360's Features tab, so Products' contract needed nothing here; Customer Service's Product360 context does not show the term (its tabs are P3's), a P16 polish. | Done P16: Product360's header in Customer Service shows the term (see P16) |
| F165 | P11: P4 built no store for service agreements (F101); P11 adds `store#ServiceAgreement` with the TtWarranty term and reads Agreement rows by type, organization, customer, dates and status. | See P11 |
| F166 | P11: `link#RequestRecord` asks the user's record visibility (get#RecordLinkInfo), which refuses an invoice to an agent who reads no finance records, though the invoice is evidence of the sale: WarrantyServices writes the claim's RequestRecord rows itself after its own organization and customer checks. | See P11 |
| F167 | P11: Nothing in BOSS finished an AssetMaintenance (Manufacturing's EquipmentDetail only requests one), so `update#WarrantyWork` moves a claim's repair through the AssetMaintenance status flow (its task following), and the completion notice is a rule on AssetMaintenance's status, so a Maintenance app's own path tells the agent too. | See P11 |
| F168 | P11: Shipment has no shipped date; the ship date is the AssetIssuance's issue date (a sales order's stock is issued when it ships), as crosscut DeliveredItems reads. | See P11 |
| F169 | P11: "WARRANTY_APPROVE for a rejection override" is read as covering a claim the lookup found expired (a coverage end set with its reason); design WarrantyAssessment says so. | See P11 |
| F170 | P11: ServiceRequestType.templateFormId was not read (P7) and `save#ServiceRequestType` dropped it on a resave (as F127 for queues): `create#Case` and NewCase take the type's template before the queue's, and the save keeps it. | See P11 |
| F171 | P11: A case's revision moves with every update of the request (status, due date), so a claim's revision is its own counter (`Request.claimRevision`), moved only by its evidence; a status change does not stale a decision. | See P11 |
| F172 | P11: Delivered items lists serials and lots only: an issued asset with neither (the demo's filters) is stock, not a delivered item, and a claim on it names its product and sale. | See P11 |
| F173 | P13: Commons' FormPublication and FormInvitation (design-drawers-commons §19, X16) did not exist; built in `mantle.party` with the Commons names, the case's context on the invitation (contextEntityName and contextId: the resolution CaseSlaEpisode, else the Request) and the record holding it (recordEntityName and recordId), so Marketing's publications use the same rows. Design-drawers-commons §19 changed. | See P13 |
| F174 | P13: P0 left the guard to an entity ECA rule or an authorization rule: an authorization rule would bind only artifact calls, and the framework services run their entity writes with the caller's authorization, so the guard is a run-before entity ECA rule on FormResponse and FormResponseAnswer, which every path (the services, entity-auto, a data load) meets; a response with no invitation is untouched. | See P13 |
| F175 | P13: A resolution episode exists only where a service level policy applies (P4's start#CaseEpisode records NO_POLICY and makes none), so a case with no SLA has no episode to bind: its invitation's context is the Request, and once per resolution keys it by the request's update stamp at resolution. | See P13 |
| F176 | P13: An ExternalAccessCapability keeps only its token's digest, so the job cannot mail the same link twice: each send and reminder makes its own capability ending at the invitation's expiry, every one opening the one invitation. | See P13 |
| F177 | P13: A feedback form is edited by P7's template rules (successor fields, ended options, rules, problems) with every field customer-visible: `CaseTemplates.js` `templateOf` takes the purpose `DbfpCaseFeedback`; Mantle's raw messages say "template" there. | See P13 |
| F178 | P13: Design FormAccess grants author and read access by DbFormUserGroup, but DbFormUserGroup modifies a screen form for a user group and grants nothing on a survey; access is the permissions Mantle checks, so FormAccess shows who may change and read the form, read only. Design FeedbackFormDetail changed. | See P13 |
| F179 | P13: DbForm has no version; SatisfactionResults' "version" is an effective period of the form, from each date its fields, options or rules start or end, and an invitation counts in the period it was made in. | See P13 |
| F180 | P13: "PASS's throttling" is two limits in Mantle: ExternalAccess's token lookups (100 in ten minutes per requester) and the feedback posts (30 in ten minutes), both by the framework's sign-in limits. | See P13 |
| F181 | P13: The Support app's readiness service is `CaseFeedbackServices.check#SupportAppReadiness` while Feedback is its only page (organization, service policy, feedback policy, canonical host); P15 may move it to SupportCaseServices. | See P13 |
| F182 | P13: The plan's "comments private to service management and the customer-authorized follow-up": the consent is a checkbox answer Y on the form (the default's contactOk); an agent of the follow-up team reads text answers only with it. | See P13 |
| F183 | P13: The four survey screens are shared files Marketing will mount, so a DENY of the Customer Service root group on a file would follow a user into Marketing; their reads check the capability instead, and an agent opening CSAT results is told it is not available. | See P13 |
| F184 | P13: In a client acceptance spec an array answered by `when()` reached `then()` without its array methods, and a session's `get` called from an array's `map` callback failed ("not a function"), so the walks answer objects and counts. | See P13 |
| F185 | P11 review: evidence changed outside `save#WarrantyClaim` (unlinking the claim's asset or order through Shared/RequestDetail, editing its RequestItem) does not move `claimRevision`; NewCase's warranty path refuses the whole case when the template's serial is not the customer's; NewCase's `customerAssets` choice lists a serial resold to another customer, which saving refuses | Done P16 for RequestDetail's links (link#ClaimEvidence, unlink#ClaimEvidence; no RequestDetail path edits a claim's item); §7 for NewCase's two (see P16) |
| F186 | P13 review: the CSAT results tab shows to agents, who are then told it is not available; a menu item is hidden only by artifact authorization, which the shared survey screen cannot carry | P14: the Reports catalogue (ReportsHome) offers SatisfactionResults to managers, the tab not in the menu |
| F187 | P13 review: P15's privacy anonymization needs a way past the response guard | P15: a `mantle.party.FormPublicationServices.redact#FormResponse` service checking a privacy permission and the organization, blanking text answers and logging who and why, the guard letting a write through only while that service is on the artifact execution stack |
| F188 | P13 review: the true remote pair ran (an authority serving the acceptance fixtures, a frontend with only framework, webroot, tools and mr-pass): RemoteHttp 8 of 8, a rating of 2 kept as 2 of 5 on a repeat posting 5 | None |
| F189 | P14: Insights' catalog (`ironstone.insights.ReportCatalogEntry`, INS-02) is not built and no app registers with it yet (Purchasing P15 built none; Manufacturing F143 waits): Customer Service's entries are `Reporting.js` `catalogueEntries` in design-insights §6.1's contract (entry id, the one owner, title, description, route, parameters, the read capability, export), served by `get#ReportCatalogue` for ReportsHome, for Insights' registry to read when built. | See P14 |
| F190 | P14: A dataset has one time field, so the shipped service data is two datasets over one DataDocument (by the clock's start and by its breach); the breach alert reads the second. Insights' admission (design-insights §5) is not built: the framework loads `report/*.json` read-only, and the alert template runs only as a saved copy, as Mantle's sales one. | See P14 |
| F191 | P14: A report dataset is not filtered by the viewer's organizations at query time, so `BossServiceClock` is granted to ADMIN only, as Mantle's sales datasets are, until Insights' admission applies the organization filter. | See P14 |
| F192 | P14: Home's open, overdue and unassigned are counts now: their previous period needs the statuses at its start (the audit log), which nothing keeps as a measure; the change shows on the rates (SLA compliance, first response, resolution, CSAT). | See P14 |
| F193 | P14: Design ResponseTimes' "next response" has no record: P4 keeps one first-response clock per case, never restarted, and no clock per later reply, so ResponseTimes measures first response and each resolution episode. Design ResponseTimes changed; a next-response clock is §7's. | See P14 |
| F194 | P14: Design ReportCatalogue's "last run" and "favorite saved find" have no source (a report is a read, not a stored run); the catalogue shows what each report shows, its filters and its export. Design Reports changed. | See P14 |
| F195 | P14: ReturnAnalysis' return rate against the quantity shipped and the refunded amounts (ReturnItem's refund payment) are not read: the rate needs the organizations' shipped quantity per product in the period, and a refund is a payment, not a ReturnItemBilling link; the credited amount is the billing links'. Left for P16 or §7. | §7: the return rate against shipped quantity and the refunded amounts |
| F196 | P14: The as-of time reads each fact by its own date (a clock's actual, due and breach; a receipt's received date; a billing link's settled date; the audit log's change date); a clock's cancellation has no date of its own, so a cancelled clock counts cancelled at any as-of time. | See P14 |
| F197 | P14: F112 answered: the views by clock and Home's counts read the case with its clocks in one query; Mantle's `Sla.js` `riskRequestIds` and `awaitingResponseIds` (2,000 ids) are no longer used by BOSS and stay for Mantle callers. | See P14 |
| F198 | P14: F186 answered: SatisfactionResults is out of the Reports menu, and the catalogue offers it to SUPPORT_CASE_MANAGE holders, who alone may read it. | See P14 |
| F199 | P14: The export audit is a log line on `moqui.report.audit` (`audit#Export`: user, kind, definition, rows), not a record; a report export appears there as `CustomerService.<report>`. | See P14 |
| F200 | P14: AppStructure's placeholder floor is now 45 (ReportsHome built); P15 may lower it too. | See P14 |
| F201 | P15: ExternalAccessContact had no role for "a customer administrator, a role on that relationship": it gains `administrator` (audit-logged), set from the invitation's scope on redeem; a contact's case is one it filed or reports (or is the Customer party of) unless it is an administrator (the Request kind's `contactAllows`, inside `ExternalAccess.check`). | See P15 |
| F202 | P15: "A verified email" is a framework `VerifiedAddress` row of the account; the self relationship holds only for an account whose party is the record's outside party, not internal and working for no internal organization, on the kinds that allow it (Request, ReturnHeader), and the own account sees all of its own cases. | See P15 |
| F203 | P15: The Support mount's settings (design ServiceDefaults' "the Support mount's queues, intake types and knowledge spaces") have no field: `save#ServiceDefaults` starts each ServicePolicy row from its own fields, so new fields there would be dropped by every other save. They are a dated `SupportAppSetting` row of their own, saved by save#SupportAppSetting. Design ServiceDefaults changed. | See P15 |
| F204 | P15: A public account holds no Mantle permission, so the customer writes run on a Support claim in `ec.context.sharedMap` (`SupportCustomerClaim`, set only by CustomerReturns.js and CustomerOrders.js after ExternalAccess), as Purchasing's supplier claim: ReturnPolicies.js honours it for the lists naming SUPPORT_CASE_EDIT (and RETURN_AUTHORIZE only for a withdrawal) with the claim's organization and customer in place of the facility scope, and leaves the return unassigned; OrderChanges.js's `customerSide` takes it. Cases are written by SupportPortal.js through create#Request, the parties and ensure#CaseProfile rather than create#Case, which is an agent's (SUPPORT_CASE_EDIT, the queue's assignee). | See P15 |
| F205 | P15: "Approved shared files" had no type: RequestContent RqCntCustomerShared ("Shared with the customer"); RecordFiles keeps its internal default (RqCntInternal), so an agent shares a file by choosing the type; customer files land in it. | See P15 |
| F206 | P15: P9's ReturnHeader kind resolves no cancelled return, so a withdrawn return's page closes for its link and its contact alike: the withdrawal's receipt says so and MyReturns lists a withdrawn return without a link. | See P15 |
| F207 | P15: The rating's per-page nonce is a random value issued with the article; Mantle has no server secret to sign it, so it proves one rating per view (its digest unique on ArticleFeedback), not that the server issued it; the requester's limit (30 in ten minutes) bounds the rest. | See P15 |
| F208 | P15: PASS's file downloads were Forum's and exports only: PassAuthority's DOWNLOADS list, `Facade.downloadFile` and `Transport.downloadOperation` (REST: the operation's GET route with its input as the query; gRPC: the operation) stream a Support file; the label image is kept once as ReturnContent so the transports stream a location. | See P15 |
| F209 | P15: BOSS's client deny pattern names the write verbs of ironstone services; `invite` is none of them, so BOSS's service is `create#SupportInvitation`. | See P15 |
| F210 | P15: Shop does not exist (mr-pass has only plan/design-shop.md and impl-shop.md; BOSS Commerce is placeholders): X7's Get help, Request return and cancel wait for Shop, which calls create#CustomerCase, request#CustomerReturn and request#CustomerCancel; the store's queue and the SalesOrder OrderView token (impl-shop F27) are not built. | See P15 |
| F211 | P15: Admin's privacy provider contract (`org.moqui.admin.PrivacyServices`) does not exist, so CS-PRIVACY's provider and F187's `redact#FormResponse` wait for it; P2's interim privacy cases take the requests (§7). | See P15 |
| F212 | P14 review: CaseVolumes' open-at-the-as-of-time count uses each case's current status, so a case open at an earlier as-of time and resolved since is not counted; the clocks dataset could be granted beyond ADMIN once Insights' admission filters it by `organizationPartyId` | §7, with the statuses at a past time from the audit log (as F192) |
| F213 | P15 review: the saved-reply preview does not say the mail will carry the Support link; the return label is always served as a PDF whatever the carrier returned; MyCases reads all of a customer's case ids before paging, fine at portal sizes | §7 |
| F214 | P15 review: `send#EmailDraft` gains a hook adding the CustomerCase link to an agent's mail filed on a case when every recipient is on the case's customer side and the sender holds SUPPORT_CASE_EDIT; `authorize#Return` and `decide#ReturnException` now mail the customer a decision notice (no reason) where the organization has a service policy, so Retail's demo authorizations mail the customer | Kept: both act only on cases and service-policy returns (§2's Mantle rule changes) |
| F215 | P16: The Customer Service administrator (BOSS_CUSTOMER_SERVICE_ADMIN, MANTLE_ACTIVE_ORG) reaches every organization's cases, customers, orders, palette rows, links, choices and report rows when no organization is active (by design, CustomerService.js; impl-purchasing F185); the isolation sweeps leave it out. | See P16 |
| F216 | P16: Commons and Comms are authorized for ALL_USERS (design-drawers-commons §2), so a PASS public account (a Support contact, which holds no group) opens both BOSS roots and its launcher lists them; Joe Q Public's own account reads his own case in Commons Requests as one of its people (its title, status and conversation as Commons shows a request's people, not its internal notes). Design §8 says a customer contact reaches nothing in BOSS; Projects denies its client contacts Commons and Comms through BOSS_PROJECT_CLIENT, and a public account has no group to deny. | Resolved Nov 5 (the user's call): every BOSS app requires a UserGroup; Commons, Comms and the Records drive are granted to `BOSS_USERS` (internal users), not ALL_USERS (impl-drawers-commons R29). See P16 |
| F217 | P16: `ignore-error` on a screen's service-call leaves no error message, so `!ec.message.hasError()` after it says nothing; ReturnAuthorization took another organization's return for the user's (fixed here); other screens that test hasError after an ignored call may say "not authorized" or "empty" where "not available" is meant (none leaked a record in the walk). | See P16 |
| F218 | P16: CaseDetail has no Items tab (design CaseDetail: "Items only when present"); a claim's product and an order change's lines show on WarrantyAssessment and OrderChangeDetail (§7). | See P16 |
| F219 | P16: The case summary's internal variant shows the template's customer-visible answers only; an internal field's answer stays on CaseDetail (CaseTemplates.js has no staff projection of a response to reuse). | See P16 |
| F220 | Final: `<conditional-response condition="...">` is not read by the framework, which reads only a `<condition>` child (crates/moqui-core/src/screen/definition.rs `ResponseDef::of`, about line 220), so such a response always applies; NewCase sent every new case to WarrantyAssessment (fixed with a `<condition>` child). The same attribute form is in template/ContactRecord.xml, Commons/Contacts/Compare.xml, Commons/Calendar/EventDetail.xml, Commons/Requests/List.xml, Projects/Projects/MilestoneDetail.xml, Projects/Projects/NewProject/Start.xml, Projects/Code/Compare.xml, Projects/Requests/List.xml, Projects/Billing/Unbilled.xml, Projects/Billing/Unbilled/CreateInvoice.xml and Shared/WorkItemDetail.xml | §7, the user's call: the framework reads the attribute (as it does for another element, definition.rs about line 571), or those files are rewritten |

## 7. Later

Designed, not in this build:

- **The design's `later` rows:** ChannelAutomation (scripted chat, chatbot steps, telephony adapters), and Log time on a
  case through Projects' time services (R-CS-22).
- **Other design items:**
  - external knowledge sources (product documents, the forum, an external knowledge API);
  - the chargeable repair's sales quote and the on-site intervention report (design §14), with Sales and Maintenance
    (the quote picked up in impl-sales P8; the report, with the repair as a managed work order, built in impl-maintenance P12:
    RepairLinks' Send intervention report and the managed repair's summary, an owner contract; with the organization's
    Maintenance policy off the warranty services are as P11 built them);
  - who is viewing or typing on a case (design §14), unless P0 brings it into P5 (§4);
  - the Support app's terminal pages (design §8), when PASS gains a terminal UI;
  - Admin's PrivacyRequests and the PASS Account privacy page (Admin's `later`), which take over P2's interim privacy
    cases.
- **Framework:** qvt's browser-side `require-when` on drop-down, text-area, radio and check, which need a `required` prop
  on their `m-*` components; the server check (`evaluate#DbFormDependencies`) refuses a missing value meanwhile.
- **Other apps' contexts:** the Sales rows of the screens Customer Service mounts; Marketing's and People's mounts of
  the survey builder (picked up in impl-marketing P12 and impl-people P16).
- **Other apps' callers:** the order owner (Sales) applying the order-change kinds Customer Service only approves:
  price, quantity increase, ship date, address, ship method and carrier (picked up in impl-sales P14).
- **The rest of the other apps' needs:** crosscut's CX-AVAILABILITY projection beyond what Products P7 and Warehouse P4
  built (incoming purchase supply, held and inspection stock apart; F31); NCR and CAPA in the shared quality model.
- **Found during the build** (§6; reviewed at P16, each row's resolution names §7):
  - Customer Service: Cases' Needs response and SLA risk views over the clock table without the `in` list of request IDs,
    a clock failing on every scan, working hours stored for another person (F112); CustomerService.js `partyName` with
    Mantle's middle name (F92); knowledge suggestions ranked by a search index (F107); a next-response clock for
    ResponseTimes (F193); ReturnAnalysis' return rate against shipped quantity and the refunded amounts (F195);
    CaseVolumes' open count at a past as-of time from the audit log, and the clocks dataset beyond ADMIN (F212); the
    saved-reply preview naming the Support link, the label's content type, MyCases paging before reading all ids (F213);
    NewCase's warranty path refusing the whole case for a serial not the customer's, and its customerAssets choice listing
    a resold serial (F185); CaseDetail's Items tab when present (F218); the internal case summary's internal template
    answers (F219).
  - Access: screens that test `hasError` after an ignored service-call (F217).
  - Comms and channels: an Inbox `message-actions` slot (F121); a permission test on Chat's and Voicemail's ext-actions and
    a hold on mail failing DMARC (F132).
  - Other components: mr-marble's survey screens refusing a form that is not a survey (F134); Purchasing's callers of
    `hold#Order` locking parts before the header (F160); the script runtime's find chain changing in place, or a line in the
    script docs (F161); Mantle's receipt at delivery needing INVOICE_APPROVE at the default, and Warehouse's
    `addReturnItem` checking shipped quantity and the policy (F163); Admin's privacy provider (F211, above).

## 8. Verification

- **Per phase,** the "Done" rule of §2.
- **End to end,** run `./moq run`, sign in as `john.doe` and as each demo service user, and walk each built phase's
  "usable when" in order; sign in to the demo PASS site as the demo customer contacts for the Support app's, locally
  and through a remote frontend.
- **Design §10 end-to-end review,** scenario by phase, each an acceptance test (`./moq accept mr-boss`, when asked):

| Scenario | Phase |
| --- | --- |
| Product, supplier price, PO, partial receipt and inspection, bill and payment | P3 (customer-safe Product360 and availability); the rest is Purchasing's, Warehouse's and Accounting's |
| Shortage, buy, make or transfer, partial completion | P3 (availability read, with provenance as the owners built it); Manufacturing's and Purchasing's |
| Order, reservation, pick shortfall, pack, ship, invoice and payment | P10 (substitution and the change after pack), on Warehouse P11–P13 and Accounting P17 |
| Case, RMA, partial receipt, failed inspection, credit or refund | P9; a supplier return linked from the case is Purchasing P8's |
| Count with an intervening movement | Warehouse's P10; Customer Service reads availability (P3) |
| Case intake, assignment, pause and reopen, resolution, CSAT | P2, P4, P5, P6, P8 and P13; a customer's own intake and reply in the Support app, P15 |
| Unauthorized actions, cancellations, closed period and standalone use | `CustomerServiceAccess` for each access rule a phase adds; P9 and P10 (cancel and ClosedPeriod); P16: `CustomerServiceAccessWalk` (isolation, cost and finance, standalone W and F, the customer contact in BOSS) and mr-pass `SupportIsolation` (the customer contact in the Support app) |
| Independent failures, atomic inner operations | Every phase: P2 (bulk), P4 (the SLA scan), P5 (bulk reply), P9 (batch authorize), P12 (feedback review), P13 (invitations) |

- **Walks.** One golden-path client walk for the app in the regression suite; the others, and the Support app's at
  phone and desktop widths in mr-pass, are acceptance tests. No screenshots.
