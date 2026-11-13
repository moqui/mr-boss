# IronStone BOSS — Marketing implementation

Nov 13, 2026 — P0 done: the checks left after the plan's review, F64–F89 (§6), against master as People, Maintenance,
Admin P17–P19, Insights P11–P12, Admin's "screens down", Sales P1–P4 and the runtime/components/{base,addon,dev,test}
layout left it. §1 "Expected of the earlier apps" now says what Sales P1–P4 and People built: Sales' mount row admits
Marketing for Leads and LeadSources only, so P3 adds Accounts (at Marketing/Leads/Accounts, F64), widens LeadList's
row selection to the audience editor and resolves each lead's contact (F65), and points the Commons contact record's
Consent link at Marketing's mount (F67); handoff counts are Marketing's own captures, `find#Opportunities` needing a
Sales read (F66); `store#LeadIntake` is checked at P13 against Sales P5 as merged (F68). Marketing's setup and demo go
in files of their own (F69). P12 registers in the survey builder's two registries and builds on People's
`open#Publication` (F70); P21 seeds a CalendarProjection (F71) and rests on Sales P6's user-facts provider (F86). P6
reads bounces on both the VERP and the edge path and stores template bodies as `.html.fancy-locked` resources (F76,
F78); P9 passes the profile's site to the unsubscribe token (F75); P1's list check is the non-mailbox branch of the
list access (F77); P15's scripts are registered by a MoquiConf.xml of mr-pass's own and reach the authority by two
operations (F79); P12 and P17 add ExternalAccess scopes and a kind (F80); P2 names the cost sources (F81); P19
follows Sales P3's merge pattern and keeps a withdrawal on a collision (F82); P18 registers the door tablet now that
Admin P18 is built (F83); P20 writes the campaign-sent annotation as a Mantle business event (F85); P22's consent
provider, receipts and day limit need the framework or the user's call (F72–F74). P1–P3, P6, P9, P12, P13, P15 and
P17–P22 changed in place; the design's §§2, 3, 9, 10 and 13.1 changed. The build order and the suites' runs in §4.
Nov 11, 2026 — the open questions answered (§4): the budgets may rise by the plan's estimates as its phases land, the
audience import names `MARKETING_AUDIENCE_IMPORT`, a one-person team may self-approve and dispatch under 500
recipients by a policy flag that is off by default, SMS is in this build, last, and a ticket order of a seller whose
Sales approval setting is on stays placed until it is approved, the registration and ticket following the approval;
tickets are sold on PASS Register only, a ticket in a Shop cart being later.
Nov 11, 2026 — reconciled with impl-people, impl-maintenance and impl-sales: the survey builder's generalization and
the form definition services are People's P16, and P12 adds Marketing's registration, the public purposes and the
publication services (the review line below said P12 did it all); X1's storeless order tax is not built and is Sales'
P7, on which P17's ticket order rests (F30); every placement is `place#Order`; the deny pattern's long rows are split
by Maintenance's P1 (F58); and the audience import target names no Admin permission (§4, §5 Q5).
Nov 11, 2026 — plan, before Marketing starts. P0 partly done: F1–F52 found while writing it, from the code as Admin
P16 and Insights P10 left it (mr-moqui 16828c5f, mr-boss f1bf2a95, mr-mantle 0048667f, mr-pass 4a93c4d) (§6). People,
Maintenance, Sales and Marketing are the next four apps, built in that order, each with its own plan (§4); Marketing
is last, so this plan builds every connection Marketing has to the other three, and picks up what the built apps left
waiting on Marketing. The PASS Marketing participation app (design §13) is planned here too, in mr-pass (§4). Admin
P17–P19 and Insights P11–P12 are not built; what depends on them is planned from their designs and checked again when
they land (P0). The plan's open questions are in §5, each with its recommended answer.
Nov 11, 2026 — reviewed against the design, the code and the other three plans: Sales' names and paths as its plan
has them, the survey builder's second context built here (People adds a branch only), Marketing's own readiness
provider and lifecycle participant as Sales and People register theirs, the ledger's profile and content parts moved
to the phases that first send with them (P6, P8), the tracking scripts placed in mr-pass, and the merge guards,
retention, public-endpoint and Attack-Surface work given phases; four open questions became decisions (§4, §5; F53–F63).

How [design-marketing.md](design-marketing.md) gets built, in phases from the foundation to SMS, each ending tested
and usable. This file is kept at a high level, as [impl-admin.md](impl-admin.md) and
[impl-commerce.md](impl-commerce.md) are: each phase names its scope by the design's sections and §19 needs rather
than restating them, and the design stays the place for screen and record detail. During the build this file is the
log: phase status and what each built, the decisions made, open questions, findings against the code, and what is
deferred.

Today `screen/Marketing/` holds nine flat placeholders (Home; Campaigns; Segments "Segments & lists"; Newsletters
"Email & newsletters"; Promotions "Promotions & coupons"; Content; Surveys; Reports "Campaign analytics"; Settings),
and the root mounts only Chatter and RecordFiles. The `BOSS_MARKETING` artifact group is live for `ADMIN` and
`BOSS_MARKETING_ADMIN` (F1); P1 adds the root user group and the ordinary groups. Mantle has the campaign, list,
segment and tracking entities and `ContactListServices`, and no campaign, send, segment, tracking or registration
service family (F3–F8, F31, F33). Marketing is built on what is there (as found in the code, §6):
- from the framework: `send#EmailTemplate` and `send#Email` with their retryable, permanent and uncertain outcomes,
  the edge relay's VERP sender and DSN reader, plus-tag delivery to hosted accounts, email ECAs, the mail queue and
  its outcome owners (Admin P12), `SmsServices.send#SmsMessage` on C4-SMS with its `sms-consent` hook, dated DbForm
  fields and dependencies, WikiServices (pages, review, `create#WikiBlog`, `update#WikiBlog`), token routes, web
  scripts, `fancy-locked-html`, `scan-input`, the barcode helper, `org.moqui.admin.DataTransferServices` with its
  transfer targets, and the job, topic and recovery registrations of `OperationServices`;
- from Mantle: `ContactListServices` and `ConsentServices` (lists, members, the list send, consent history,
  unsubscribe tokens), Comms' delivery ledger (`mantle.party.MessageServices`), FormPublication and FormInvitation,
  ExternalAccess capabilities, `ContactImportServices`, `EventServices`, the store promotion services, the site page
  services, `PortalPaymentAttempt` with its `PapEventRegistration` purpose, and the PASS app registry; not the
  storeless order tax (X1), which Sales' plan builds (F30);
- from the built apps: Commerce's shared promotion and page screens, its checkout opt-ins and cart recovery policy;
  Customer Service's survey builder screens; Commons' Calendar, Knowledge, Notifications (approvals), Chatter,
  RecordFiles and contact import; Comms' Consent screens and the public Unsubscribe page; Accounting's and Customer
  Service's Customer360; Admin's registries (settings, readiness, capabilities, import targets, jobs, topics,
  recovery) and `Shared/DataImport`; Insights' report catalog, metrics, attention providers, flow targets, dataset
  classes and alert templates;
- from PASS: the facade and operation registry, the Account app with its Email preferences page, the shared page
  renderer of Shop, and the hosted payment step of Shop's checkout;
- from the three apps built before it (§1 "Expected of the earlier apps"): People's survey builder for any app and
  its projected calendar kind (built); Sales' leads, accounts and lead sources for a second mount (P2–P4, built), and
  its lead intake (P5), storeless order tax (P7), approvals (P9, P11) and user-facts provider (P6), being built.

**Inputs.**
- Designs:
  - [design-marketing.md](design-marketing.md), with [research-marketing.md](research-marketing.md)
  - [design-crosscut.md](design-crosscut.md) §1.3's automation register (Marketing's rows), §1.4 (capability groups),
    §1.5 (CX-ASSIST, CX-SYNC, CX-DELIVERY, CX-DEVICE, CX-OPS-REPORTS), §3.1–§3.2 (Contact record, Customer360), §3.13
    (Calendar), §3.15 (Approvals), §3.28–§3.29 (promotions and the Marketing shared surfaces), §4.8 (X8–X11, X15) and
    §7.9 (Marketing's needs)
  - [design-drawers-commons.md](design-drawers-commons.md) §4 (approval topics), §6 (contact import), §7 (events),
    §10 (Knowledge), §16 (consent and unsubscribe), §19 (form publication)
  - [design-commerce.md](design-commerce.md) §5 (Pages), §7 (promotions), §8 (cart recovery), and
    [design-shop](../../mr-pass/plan/design-shop.md) §6 and §9 (the checkout opt-ins and Email preferences)
  - [design-sales.md](design-sales.md) §3 (Leads, the bulk "Add to list (evidenced)"), §9 (LeadSources, UtmSourceMap),
    §11 (LeadIntakeForms and `store#LeadIntake`)
  - [design-customer-service.md](design-customer-service.md) §7 and §9 (the survey builder and responses)
  - [design-accounting.md](design-accounting.md) (the payment-attempt coordinator, budgets and cost sources)
  - [design-admin.md](design-admin.md) §6 (Devices), §10 (Jobs, Topics, MailQueue), §11 (import targets), §14 and
    §14.2 (the registries, Marketing's settings row)
  - [design-insights.md](design-insights.md) (the catalog, metrics, alerts, flow maps and the funnel)
  - [design-people.md](design-people.md) (its mount of Shared/SurveyForms) and
    [design-forum](../../mr-pass/plan/design-forum.md) §13 (how a PASS app registers)
- Plans:
  - [impl-admin.md](impl-admin.md): the pattern; its §7 rows for Marketing (the audience import target, the settings
    row, readiness provider, CheckIn route group, privacy provider, topic audiences) and the Built notes of P2, P9,
    P12–P16.
  - [impl-insights.md](impl-insights.md) §7 (the metrics, catalog entries, annotation and funnel that wait on
    Marketing) and the Built notes of P3, P4, P5, P8 and P9.
  - [impl-commerce.md](impl-commerce.md) §7 and F24, F28, F95, F132, and [impl-shop](../../mr-pass/plan/impl-shop.md)
    §7 and P6 (the ledger, Email preferences, the opt-ins).
  - [impl-customer-service.md](impl-customer-service.md) P13 and F183 (the survey builder, form publication).
  - [impl-drawers-commons.md](impl-drawers-commons.md) §4 (the shared rules) and M11 (consent and unsubscribe).
  - [impl-people.md](impl-people.md), [impl-maintenance.md](impl-maintenance.md) and [impl-sales.md](impl-sales.md),
    written beside this plan and read at its review (§1 "Expected of the earlier apps"; F53, F54, F58, F59).
- The suite-app design review, which explains the design's X, Z, L and R-MKT IDs, was removed from the tree (mr-boss
  bd74564); read it with `git show bd74564^:plan/review-suite-apps.md`.
- Guides and rules: [design-doc-guide.md](design-doc-guide.md), [style-guide.md](style-guide.md) §8,
  mr-moqui `docs/dev/Practices-App-Dev.md`, `docs/Build-Test.md`, `docs/security/Attack-Surface.md`,
  `docs/interfaces/SMS.md`, `docs/interfaces/Web-Scripts.md`, and mr-pass `README.md` and `docs/Deployment.md`.
- Inventories: [ss-inventory.md](ss-inventory.md) (the ProductStore/Promotion, Survey, Wiki and Calendar rows) and
  [usl-inventory.md](usl-inventory.md), which carry the design's **Designed in** paths; design §16.2 traces the
  baseline forms.
- mr-moqui: `plans/Remaining-Work.md` ("IronStone framework asks") and `plans/archive/Comms-Framework.md` §7.4 (C1 and C4-SMS
  as built).

Framework paths are under the mr-moqui checkout (`crates/`, `runtime/components/base/`), Mantle paths under
`runtime/components/addon/mr-mantle/`, PASS paths under `runtime/components/addon/mr-pass/`.

Sections: [1 scope](#1-scope-and-order) · [2 rules](#2-ground-rules) · [3 phases](#3-phases) ·
[4 decisions](#4-decisions) · [5 open](#5-open-questions) · [6 findings](#6-findings) · [7 later](#7-later) ·
[8 verification](#8-verification)

---

## 1. Scope and order

- **Repositories.** Each is its own git repo:
  - `mr-moqui` (`crates/moqui-mail`, `runtime/components/base`): a subject and a bounce address given to one
    `send#EmailTemplate` call (F17) and the ARF reader beside the DSN reader (F18). Nothing else in code: the
    framework's mail, SMS, forms, wiki, web-script and transfer pieces are used as built, and no framework file names
    a Mantle service. `docs/security/Attack-Surface.md` gains PASS Marketing's operations and the tracking routes,
    and `plans/Remaining-Work.md` Marketing's row.
  - `runtime/components/addon/mr-mantle`: `mantle.marketing` (CampaignServices, AudienceServices, SegmentServices,
    CampaignSendServices, AutomationServices, MarketingContentServices, TrackingServices, MarketingFormServices,
    MarketingReportServices, MarketingWorkspaceServices, MarketingPortalServices) and its entities;
    `mantle.work.EventRegistrationServices`; Comms' additions to `mantle.party.MessageServices` (templates, sending
    profiles, suppressions, delivery reports, the ledger's extensions) and to `FormPublicationServices`; the
    organization scope of `ContactListServices` and `ConsentServices`; the `marketing` PASS app in the registry and
    the authority's operations; the storeless mount of the site page services; the seed rows of the Mantle services'
    registrations (import target, jobs, topics, recovery, delivery sources).
  - `runtime/components/addon/mr-boss`: the Marketing app, `ironstone.marketing.ContextServices`, Marketing's context on
    the shared screens it mounts, `Shared/CampaignDelivery`, `Shared/MessageTemplates`, `MessageTemplateDetail`,
    `SendingProfiles` and `Suppressions`, the bulk action on Sales' Leads and Accounts, Marketing's rows in Admin's
    and Insights' registries, and its `report/` and `skill/` files.
  - `runtime/components/addon/mr-pass`: the Marketing app (`screen/Marketing.xml` and its pages), its operations in the
    facade's schema, Marketing's context on Account's Email preferences page, the tracking redirect and pixel web
    scripts (P15, F55), its mount in the test runtime, and `docs/Deployment.md`'s Marketing section.

  `runtime/components/addon/mr-marble` is read only, for the baseline ProductStore/Promotion, Survey, Wiki and Calendar
  forms that ss-inventory maps.
- **Scope.**
  - Every `parity` and `new` row of design §2, BOSS and PASS, and the §19 needs they use, as changed by §6. Design
    §17's stages M0–M8 are all in: M3 and M8 are no longer gated on framework work (F12, F19).
  - The connections to the three apps built before Marketing (§4, the user's call: a connection is built in the plan
    of the app built later). Marketing builds all of these; the other plans list them in their §7 as picked up here:
    - Sales (impl-sales §7 lists each as picked up here): the lead handoff (LeadRules, MarketingLeadCapture and the
      capture job calling Sales' `store#LeadIntake`), the one public lead page (PASS SubmitForm with the lead
      purpose), Marketing's mounts of Sales' Leads and LeadSources, the bulk "Add to list (evidenced)" on Sales'
      LeadList and AccountList, the campaign and tracking-code choices on a lead, Marketing's vocabulary as the
      choices of Sales' UtmSourceMap, the Consent link on Sales' ContactDetail, the segment projections over Sales
      records, campaign attribution of an opportunity and of every placed order (`OrderPlacedRecordAttribution`),
      and the visits metric that Sales' PipelineAnalysis funnel and Insights' funnel read for their visit step (P3,
      P5, P13, P20).
    - People (impl-people §7 lists both as picked up here): Marketing's part of the survey builder. impl-people P16
      makes the four shared survey screens read a per-app context registration and moves the form definition
      services to `mantle.party.FormDefinitionServices`; Marketing adds its registration, the lead and registration
      purposes and the publication services here (P12, F53). The campaign calendar registers on the projected
      calendar kind of impl-people P12 (P21).
    - Maintenance: none in the designs (impl-maintenance §7).

    What this plan expects those three to have built is under "Expected of the earlier apps" below.
  - What the built apps left waiting on Marketing:
    - Admin (impl-admin §7): the audience import target (P4), Marketing's settings row and readiness provider (P1,
      growing by phase), its capability bundles (P1), its lifecycle participant (P2), its job, topic and recovery
      registrations (P2, P6, P9, P11, P13, P17, P20), the CheckIn route group (P18, on Admin P18) and the privacy
      provider (§7, on Admin's PrivacyServices). A Marketing send
      registers no mail outcome owner of its own: it is a delivery of the ledger, which is one (F15).
    - Insights (impl-insights §7): the visits and attribution metrics, the four catalog entries, the campaign-sent
      annotation, Marketing's datasets, alert templates, digest, attention providers and flow targets (P20). The
      funnel stays Insights' later work, over these.
    - Commerce and Shop (impl-commerce §7, impl-shop §7): Marketing's mounts of the promotion screens and Pages
      (P19, P14), tracking, visits and conversion on Commerce's Home and OnlineSales (P15, P20), attribution at
      placement (P20), the automation sender in RecoveryPolicy (P11), and the checkout opt-in recorded through
      `request#Subscriptions` (P7).
    - Customer Service (impl-customer-service §7): Marketing's mount of the survey builder and responses (P12).
    - Commons and Comms (impl-drawers-commons M11): Marketing's send over the list and consent services (P8, P9),
      and the template, sending-profile and suppression surfaces Comms owns and Marketing first builds (P3, P6).
  - Shared screens: Marketing builds `Shared/CampaignDelivery` (its own), and for Comms `Shared/Suppressions` (P3),
    `Shared/MessageTemplates`, `MessageTemplateDetail` and `SendingProfiles` (P6), each with Marketing's mount; the
    Comms mounts wait for a Comms settings area (§7, F16).
  - §7 holds the design's later capabilities (§17, §21), the privacy provider, and the parts waiting on Admin P18.
- **Expected of the earlier apps** (checked against their plans at the review, F53 and F54, and against the code on
  Nov 13, F64–F71, F86; what is not yet merged is checked by the phase that needs it, against the Sales phase as
  merged):
  - Sales, as built (P1–P4 on master):
    - `ironstone.sales` Sales.js `mountRoots` (:30-33) admits the Marketing root for `Pipeline/Leads` (→
      `Marketing/Leads`) and `Settings/LeadSources` (→ `Marketing/Settings/LeadSources`) only; its `sharedLinks` hold
      just those two, so a lead shows unlinked under Marketing and every transition stays Sales' guarded service.
      P3 adds `Accounts/Accounts` (→ `Marketing/Leads/Accounts`), P19 `Accounts/Customer360` (→
      `Marketing/Customers/Customer360`) (F64).
    - LeadList has row selection (Assign, Disqualify) for a Sales editor only (`condition="canEdit"`), its key
      `id@revision`, and a row names its account and no contact; AccountList has none (F65).
    - `find#Opportunities` filters by one campaign and one source (`marketingCampaignId`, `dataSourceId`) and needs
      a Sales read (F66); SalesAccess.js decides the scope, with `defaultOrganization`.
    - Consent is read only on Sales' ContactDetail through the Commons contact record's Consent tab, whose link goes
      to Comms' Consent for a contact administrator only (F67).
    - Sales' setup is `data/BossSetupSalesData.xml` and its demo `BossYSalesAccountsDemoData.xml` and
      `BossZSalesDemoData.xml`; the deny pattern's longest row is 244, 254 with `marketing` (F69).
  - Sales, by its plan's phases (not merged; each checked at the Marketing phase named, F68):
    - impl-sales P5: `mantle.sales.OpportunityServices.store#LeadIntake`, a validated submission with its source
      kind and identity, campaign, tracking code, UTM source and medium, team queue and operation key; it writes
      SalesLeadIntake, applies the duplicate policy and the lead-source map (`store#LeadSourceMapping`), sets the
      opportunity's campaign and SalesOpportunityTracking, and answers the first result for a repeated key (at
      Marketing P13, against Sales P5 as merged); UtmSourceMap on LeadSources (P5).
    - impl-sales P6: Mantle's active-organization user-facts provider (impl-sales F65), which P21's exposures use.
    - impl-sales P10, P11 and P13 (its §2): every placement, an acceptance by staff or on PASS and a direct order
      alike, through `mantle.order.OrderServices.place#Order`, the status change Shop's checkout makes, so one
      SECA sees every placement.
    - impl-sales P7: X1, the storeless order tax in `calculate#OrderSalesTax`, which is not built today (F30) and
      which P17's ticket order rests on.
    - impl-sales P9 and P11: the seller's SalesPolicy approval setting, off by default, checked in
      `mantle.order.OrderServices.autoApprove#Order`, Sales' pre-approval warnings, which stop that service as the
      built ones do, and `SALES_ORDER_APPROVE` with Sales' Awaiting approval list (its §4), which P17's ticket
      order meets as every sales order does.

    impl-sales names each of these in the phase given and in its §2 and §7, under these names.
  - People, as built:
    - impl-people P16: the four survey screens read the mounting app's row of mr-boss
      `service/ironstone/shared/SurveyApps.js` `apps` (purposes, services, capabilities, links, words; Customer
      Service's and People's), and each purpose is registered in Mantle's `mantle.party.FormPurpose` (edit and view
      permissions, scope service, publication access kinds, own services; FormPublicationEntities.xml:72-104);
      `mantle.party.FormDefinitionServices` has `create#`, `get#`, `find#Forms`, `rename#Form`, `save#FormField`,
      `save#FormCondition`, `end#FormPart` and `publish#Form`, and `FormPublicationServices` `guard#FormResponse` and
      `open#Publication`; no option score (F70).
    - impl-people P12: the projected calendar kind, a `mantle.work.calendar.CalendarProjection` row seeded by its
      owner naming a service on `define#ProjectionOwner` (P21, F71).
  - Maintenance: nothing.
- **Order.** One order for this plan, in the design's stages (§17), each ending at a gate. Mantle, framework and
  PASS work goes in the phase that first needs it; a phase marked PASS is built in mr-pass over that phase's Mantle
  services.

  | # | Phase | Stage |
  | --- | --- | --- |
  | 1 | P1 Foundation | M0, M1 |
  | 2 | P2 Campaigns and approvals | |
  | 3 | P3 Lists, consent and suppressions | |
  | 4 | P4 Audience import and merge | |
  | 5 | P5 Segments and audience preview | gate 1: campaigns and audiences |
  | 6 | P6 Templates, sending profiles and bounce intake | M2 |
  | 7 | P7 PASS Marketing: the app, subscription and preferences | gate 2: email readiness and public subscription |
  | 8 | P8 Sends and the composer | M3 |
  | 9 | P9 Dispatch and delivery | |
  | 10 | P10 Experiments | gate 3: durable sends |
  | 11 | P11 Automation | gate 4 (M4): drip sequences |
  | 12 | P12 Surveys and form publication, with PASS SubmitForm | M5 |
  | 13 | P13 Leads and the Sales handoff | |
  | 14 | P14 Content, blog posts and landing pages | |
  | 15 | P15 Tracking links and capture | gate 5: public forms and campaign content |
  | 16 | P16 Events and registration setup, with the PASS Event page | M6 |
  | 17 | P17 Registrations, tickets and payment, with PASS Register and Registration | |
  | 18 | P18 Check-in | gate 6: events |
  | 19 | P19 Promotions, Customer360 and engagement | M7 |
  | 20 | P20 Attribution, reports and Insights | |
  | 21 | P21 Calendar, shell providers and Assist | gate 7: Marketing's first release (M0–M7) |
  | 22 | P22 SMS | gate 8 (M8): SMS |
  | 23 | P23 Finish | Marketing built |

  Each phase starts after the one above it, except these, which run side by side because neither uses the other's
  work: P4 beside P5; P10 beside P11; P13 beside P14 and then P15, once P12 is merged (P15 follows P14, whose
  landing pages carry its codes); P19 beside P20. The dependencies that fix the rest: every phase uses P1's scope
  and context; P3's `request#Subscriptions` is what P4, P7, P12 and the Sales bulk action file; P5's eligibility is
  what P8 prepares and P11 admits with; P6's profile is what a delivery is sent from, and its readiness gates P9's
  release; P7's app and operations carry P12's, P14's, P16's and P17's pages; P9's recipient hand-off is what P10's
  variants, P11's send steps, P12's invitations and P17's notices use; P12's publication is P13's lead form and
  P16's registration questions; P15's events are what P20 attributes; P20's SECA handler is first made in P11, for
  the order-placed trigger (§4). Marketing's BOSS setup goes in a file of its own, `data/BossSetupMarketingData.xml`,
  and its demo in `data/BossZZMarketingDemoData.xml`, loading after Sales' demo, as Sales' and Maintenance's did, so
  its appends and Sales' track do not meet; only the deny pattern's rows are edited in BossSetupData.xml (P1; F69). A
  phase of a side-by-side pair that appends to the same file as the other (Marketing's setup or demo file, Mantle's
  MarketingEntities.xml) rebases on it before merging; so does a Marketing phase touching a file a Sales phase changes
  (Sales.js, Leads.xml, Accounts.xml).

  Nothing is sent to a real recipient before its guards exist: P3 builds evidenced membership and the ledger's
  suppression refusal, P6 the profile, its readiness and the bounce intake, P7 sends only a rate-limited
  verification message, P8 only a test to the policy's allowlist, and P9's release is the first promotional
  hand-off, behind P2's approval, P5's eligibility and all of those.

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
  - organization filters;
  - changes by effective date and the audit log;
  - demo data;
  - builds and commits.

  The walks are on Commerce's pattern: one golden-path walk in `test/client/Marketing/`, `MarketingSendWalk` (P9),
  registered in `test/client/suite.js`; the others are acceptance tests.
- **Layers, as design §14 places them.**
  - Mantle `mantle.marketing.*` and `mantle.work.EventRegistrationServices`: every business rule, each checking its
    own permission and the record's organization, whoever calls. `mantle.party.MessageServices` and
    `FormPublicationServices` are Comms' and Commons' (owner contracts below).
  - BOSS `ironstone.marketing.ContextServices` only: `get#SharedContext` (capabilities from the permissions, the
    organizations the user may work in, `appRoot`, `sharedLinks`), `check#Record`, `get#Choices` and
    `search#Records`, over one module `Marketing.js`. Design §14.2 names no other `ironstone.marketing` service, and
    no same-named pass-through over a Mantle service is built.
  - PASS: pages that call `pass.Facade.call#Operation`; each operation maps to one
    `mantle.marketing.MarketingPortalServices` service, which derives the organization, site, form fields, campaign
    and destination from its publication or credential, never from the request.
- **Permissions, not group names.** Mantle services check `ec.user.hasPermission` (the `MARKETING_*` and
  `MESSAGE_*` permissions of design §1.1) and scope, never a BOSS group name, a calling screen or a supplied
  `appRoot`; a write permission is not a view permission. Mantle seeds the permissions; BossSetupData grants them to
  the groups of design §1.1. Mantle specs grant them to spec-local groups, never a `BOSS_*` group.
- **Scope through services, with the X12 filters behind them.** MarketingCampaign, MarketSegment and ContactList are
  filtered by organization in `MANTLE_USER_ORG` and `MANTLE_ACTIVE_ORG` (P1); their children (sends, recipients,
  enrollments, tracking codes, registrations) are reached only through services that check the parent's
  organization. The `BOSS_MARKETING_*` groups get no artifact authorization for the raw Mantle marketing, consent or
  list mutators or their REST paths. An unassigned (`_NA_` or empty owner) legacy list or segment is not writable
  until an administrator assigns it (P1).
- **Consent is never implied.** An import, a segment match, a lead, a registration, a list's public flag or a typed
  address is not consent. Every promotional hand-off rechecks topic membership, purpose and address consent and
  suppression at dispatch; a withdrawal or suppression always wins; an administrator cannot relax either. Tracking
  needs its own purpose (`PcpTracking`); a recipient without it gets direct links and no pixel.
- **Intent here, delivery in the ledger** (X8). CampaignSend and CampaignRecipient are the intent and the selection;
  every attempt, receipt, retry and uncertain outcome is a row of Comms' ledger. Marketing keeps no attempt store,
  retries nothing itself, and reconciles an uncertain outcome through the ledger.
- **Staff and public apart.** No authoring, approval, dispatch or audience operation is in PASS's operation
  registry. A public record needs an explicit publication with a site and an opening interval. A bearer GET changes
  nothing; public responses collapse private distinctions into NotAvailable or a neutral receipt. PASS Marketing
  runs over Mantle with no BOSS at runtime: a remote frontend needs only framework, webroot and PASS.
- **Public endpoints are bounded** (design §13.1). Each operation is a row of the facade's allowlisted schema with
  its fields and sizes; subscribe, verify, form submit, reserve, payment start and cancel take PASS's request key
  and its rate limits by site, address and client, and the verification mail its own limit per address; the
  tracking redirect and pixel are limited and take no destination from the request. A refusal by a limit is the
  same neutral answer. The phase that adds an endpoint adds it to mr-moqui `docs/security/Attack-Surface.md` and
  mr-pass `docs/Deployment.md`, and its PASS spec holds one refused case for it.
- **Secrets stay on the server.** Tokens (subscription, invitation, registration, entry credential, personalized
  link) are stored hashed and never listed, logged, exported, put in shell context or given to Assist; a recipient
  address is masked for a reader without `MARKETING_AUDIENCE_VIEW`; a sending profile shows readiness, never a host
  or credential.
- **Records follow the shared rules** (impl-drawers-commons §4; design §14.1):
  - policies, vocabularies, associations, template bindings, automation steps and explicit segment members are dated
    rows, ended, never deleted;
  - the audit log on the key fields the build adds or uses: a campaign's organization, dates, budget and status; a
    send's subject, body reference, sender, schedule and state; a list's owner and policy; a segment's owner;
  - records of their own where a fact has its own identity, each named in design §14.1: a decision, a send and its
    recipients, an experiment and its assignment, an enrollment and its step executions, a subscription request, an
    import batch and its rows, a suppression, a tracking event, an outcome link, a registration and its actions, a
    lead capture;
  - a prepared send keeps its rendered body as a resource; prints and exports take an effective date and time.
- **Revisions and operations.** Every write names the revision it read (`lastUpdatedStamp`, ContactListParty's
  `revision`) and is refused naming the current one when stale; a release, a winner release, a registration, a
  payment start, a capture and an enrollment step carry a natural effect key or an operation key, so a retry answers
  the first result. A batch (an import, a merge, a dispatch page, a bulk cancel, a capture run) names each failure
  and goes on.
- **Owner contracts.** What is built here for another owner follows that owner's design and is written into it: Comms'
  template, profile, suppression and delivery-report services and the ledger's extensions; Commons' form publication
  services; Commerce's promotion and page screens and site page services gaining a second context, and its
  RecoveryPolicy a second sender; Shop's checkout opt-in recorded through the audience service; the four shared survey
  screens gaining Marketing's registration; Sales' LeadList and AccountList gaining the bulk action and AccountList its
  row selection, its lead forms the campaign choices and its ContactDetail the Consent link; Admin's and Insights'
  registry rows. The owner's screens and services stay the owner's; a mount or a registration names them and adds no
  right, and the owner's specs pass unchanged except where the phase names the case it adds to one.
- **Existing callers stay compatible.** MAILBOX lists, the Forum's list visibility SECAs and delivery preferences;
  `send#ContactListEmail` and its callers; the consent, token and one-click paths and both unsubscribe pages; the
  ledger's built sources (Shop's download notice and renewal notices, Commerce's review requests and cart recovery)
  and its mail-queue ownership; Commerce's checkout opt-ins and built-in cart recovery; Customer Service's feedback
  forms, invitations and results; Shop's and Commerce's site pages; Products' and Commerce's use of MarketSegment.
  Mantle's `ContactListSend`, `Consent`, `DeliveryLedger` and Forum specs, mr-pass's suite and the earlier apps'
  BOSS regression suite pass unchanged.
- **Done for a phase** means all of these:
  - impl-drawers-commons §4 "Done":
    - cargo tests for the touched crates, with goldens reviewed;
    - the regression tests for the rules the phase adds passing: Mantle's in mr-mantle (`test/marketing/`,
      `test/party/`, `test/work/`), BOSS's in mr-boss (`test/Marketing/`), PASS's in mr-pass (`test/Marketing/`), the
      framework's in `runtime/components/base/framework/test`;
    - `./moq test-apps`, and `./moq test-framework` for a phase that touches `crates/` or a base component, each
      suite within its budget, raised by the phase's measured share up to the plan's estimate for the suite, which
      the user approved (§4), a raise beyond the estimate needing the user's agreement again, and no spec over 15
      seconds: a longer one is an acceptance test;
    - `moqui lint --screens` clean for BOSS and PASS with the Debug binary;
    - the inventories' **Implemented in** columns;
  - an access rule the phase adds checked in `MarketingAccess` (one holder and one non-holder on one verb, and
    another organization's record refused), not every service and mount; ProjectsAccess and the other apps' access
    specs passing with the new package;
  - a screen rendered at most once in each mode across the suite, with all of its checks on that render, and in a
    second mode only where it has its own qvt or tui template;
  - its row and **Built** note here.

  No route fixtures: a screen sweep is an acceptance test, one per app per mode. The phase's "usable when" and its §8
  scenario are acceptance tests to write (`test/acceptance/Marketing/`, `test/acceptance/client/Marketing/`, and in mr-pass
  `test/acceptance/`), named in the phase; running them is not part of Done.

## 3. Phases

| Phase | Repos | Screens | Status |
| --- | --- | --- | --- |
| P0 Checks | all (read) | — | done Nov 13 (§6 F1–F89) |
| P1 Foundation | Mantle, BOSS | the Marketing root and menu, Home, Settings | — |
| P2 Campaigns and approvals | Mantle, BOSS | Campaigns, CampaignDetail, Approvals, CampaignDefaults, Vocabularies | — |
| P3 Lists, consent and suppressions | Mantle, BOSS | Lists, ListDetail, MemberDetail, Consent, ConsentDetail, Suppressions; Sales' Leads and Accounts bulk action | — |
| P4 Audience import and merge | Mantle, BOSS | AudienceImport, AudienceMerge | — |
| P5 Segments and audience preview | Mantle, BOSS | Segments, SegmentDetail, AudiencePreview | — |
| P6 Templates, sending profiles and bounce intake | mr-moqui, Mantle, BOSS | MessageTemplates, MessageTemplateDetail, SendingProfiles | — |
| P7 PASS Marketing: the app, subscription and preferences | Mantle, PASS, BOSS | PASS Subscribe, VerifySubscription, EmailPreferences' Marketing context; ListDetail's public offer | — |
| P8 Sends and the composer | Mantle, BOSS | Sends, SendDetail, Compose | — |
| P9 Dispatch and delivery | Mantle, BOSS | SendDetail's control, CampaignDelivery, RecipientDetail | — |
| P10 Experiments | Mantle, BOSS | ExperimentDetail | — |
| P11 Automation | Mantle, BOSS | Automations, AutomationDetail, EnrollmentDetail; Commerce's RecoveryPolicy | — |
| P12 Surveys and form publication | Mantle, BOSS, PASS | Surveys, SurveyDetail, SurveyDistribution, Responses, ResponseDetail; PASS SubmitForm | — |
| P13 Leads and the Sales handoff | Mantle, BOSS, PASS | Leads, LeadRules, LeadSources; PASS SubmitForm's lead purpose | — |
| P14 Content, blog posts and landing pages | Mantle, BOSS, PASS | Content, ContentDetail, BlogPosts, BlogPostDetail, LandingPages, PageDetail, Knowledge; PASS pages | — |
| P15 Tracking links and capture | Mantle, BOSS, PASS | TrackingLinks, TrackingLinkDetail; CampaignDetail's Tracking links tab | — |
| P16 Events and registration setup | Mantle, BOSS, PASS | Events, EventDetail, RegistrationSetup; PASS Event | — |
| P17 Registrations, tickets and payment | Mantle, BOSS, PASS | Registrations, RegistrationDetail; PASS Register, Registration | — |
| P18 Check-in | Mantle, BOSS | CheckIn | — |
| P19 Promotions, Customer360 and engagement | Mantle, BOSS | Promotions, PromotionDetail, PromoCodes, PromoCodeDetail, Customer360, ContactDetail | — |
| P20 Attribution, reports and Insights | Mantle, BOSS | Reports, CampaignPerformance, DeliveryAnalysis, AudienceGrowth, Attribution | — |
| P21 Calendar, shell providers and Assist | Mantle, BOSS | Calendar, QuickCreate | — |
| P22 SMS | Mantle, BOSS, PASS | the SMS channel of Sends, Compose, AutomationDetail, SendingProfiles; PASS EmailPreferences' SMS scope | — |
| P23 Finish | all | the sweeps and the review walks (acceptance) | — |

### P0 — Checks

Verify the design's riskiest assumptions against the code before building. Each result is a row in §6 and, where it
changes the design, an edit there. F1–F52 were found on Nov 11 while writing this plan; the design edits they call
for in design-marketing were made then, and those in shared files are listed for the review. The checks below were done
Nov 13, 2026 (F64–F89), against master; those on Sales phases not yet merged are named in the Marketing phase that needs
them (F68):

- **The three earlier apps, when built** (§1 "Expected of the earlier apps"): `store#LeadIntake`'s parameters, what
  it answers for a duplicate and for a repeated key, and whether it takes a campaign and tracking code;
  `find#Opportunities`' campaign and source filters; how Sales' Leads and LeadSources take a second app root's
  context and its lists a bulk action; how Sales places an order from a quote, and that X1 taxes a storeless
  order (F30); the survey builder's context registration and `FormDefinitionServices` as People built them (F53);
  each plan's §7 rows naming this plan.
- **SMS for a campaign** (F57): how an `sms-consent` provider is registered by a component with no app root; what
  the bridge reports for a direct text after its hand-off, by its `messageId`; and which day limit a promotional
  text from a profile's number counts against (the system's `smsSystemMaxPerDay` would stop a campaign), for P22.
- **The unsubscribe link's site** (F56): that `create#UnsubscribeToken` takes the sending organization's site, for
  a recipient who belongs to no PASS site, for P9.
- **Admin P17 and P18, when built:** how a device route group is registered and what a device's requests run as
  (impl-admin P18's display account), for CheckIn (P18); which administrative events P17's audit evidence expects an
  owner to write, for approvals, releases and consent changes.
- **The list services' scope:** which `ContactListServices` and `ConsentServices` verbs check the list's
  `ownerPartyId` for a list that is not a mailbox (`get#ContactListAccess` is the mailbox model), and what the
  Forum and Comms callers pass, before P1 adds the organization check to each.
- **A stored body through `fancy-locked-html`:** the renderer's interface for a body that is data, not a file
  (`crates/moqui-core/src/script/template.rs`), its variable allowlist and what it does with an unknown variable,
  for P6's templates and P8's prepared body.
- **Web scripts** (F55): a web script is a component's script on a `servlet` element of its conf, as Mantle's
  `PassApi` is (mr-mantle MoquiConf.xml:11). To check for P15: where mr-pass registers one (it has no conf of its
  own outside `test/`), how the script reaches the authority from a remote frontend, how it is rate limited and
  kept out of the session, and whether it may set a first-party cookie for the visitor key
  (`docs/interfaces/Web-Scripts.md`).
- **ExternalAccess capabilities:** the kinds seeded today and whether one carries an action scope (read a
  registration, cancel it), for P12's invitations and P17's registration links.
- **The bounce account:** who makes the hosted account a profile's VERP address reaches (Admin's MailRelays or
  Comms' account wizard), how the plus-tag lookup finds it, and what an edge relay does to the envelope sender of a
  campaign email (F18), for P6.
- **Accounting's cost sources:** which records a CampaignCost row may cite (an invoice item, a ledger entry), the
  permission that reads them, and whether a budget of Accounting's applies (design §3), for P2.
- **Party merges:** which Marketing records `DuplicateServices.merge#Parties` must move or refuse (membership,
  consent, recipients, enrollments, registrations, captures), and where its guard list is extended (X15).
- **The Assist prerequisite:** whether the Mantle active-organization user-facts provider exists (design §1.3), for
  P21's exposures.
- **The projected calendar:** what an owner service answers for the projected kind People adds to
  `mantle.work.CalendarDavServices.get#DavCollections` (impl-people P12; CX-SYNC), for P21.
- **Business annotations:** who may write one (BossSetupData gives `create#Annotation` to Tools' report
  administration only), for the campaign-sent annotation of P20.
- **The native tracking joins:** whether anything writes TrackingCodeVisit, TrackingCodeOrder or
  TrackingCodeOrderReturn today (the design says nothing does), before P15 and P20 write them.
- **The demo:** which demo organizations, PASS site and mounts the Marketing demo data builds on (ORG_ZIZI_RETAIL,
  ORG_ZIZI_SERVICES, the ZIZI_SHOP site), and whether the demo instance can capture mail for the walks.

### P1 — Foundation

Design §1.1, §1.2, §3 Home (its frame), §12 Settings, §15.4 (adoption); MKT-ACCESS, MKT-SHELL, MKT-CONSENT (its
seeds); stage M0.

- **Access** (design §1.1).
  - The groups of design §1.1 on Commerce's pattern: `BOSS_MARKETING` as the root user group beside the artifact
    group of that name, and `_AUTHOR`, `_AUDIENCE`, `_APPROVER`, `_DISPATCH`, `_EVENTS`, `_ANALYST` and `_READ`;
    `BOSS_MARKETING_ADMIN` keeps its row (F1). An area only some groups see is an artifact group that denies the
    root group and allows its capability groups.
  - The permissions, seeded by Mantle: `MARKETING_VIEW`, `MARKETING_CAMPAIGN_EDIT`, `MARKETING_SEND_EDIT`,
    `MARKETING_CONTENT_EDIT`, `MARKETING_AUDIENCE_VIEW`, `_EDIT`, `_IMPORT`, `_EXPORT`, `MARKETING_CONSENT_EDIT`,
    `MARKETING_APPROVE`, `MARKETING_DISPATCH`, `MARKETING_EVENT_MANAGE`, `MARKETING_REPORT_VIEW` and
    `MARKETING_CONFIGURE`, and Comms' `MESSAGE_TEMPLATE_VIEW`, `_EDIT`, `MESSAGE_SENDING_CONFIGURE` and
    `MESSAGE_SUPPRESSION_REVIEW`; BossSetupData grants them by design §1.1's table. `MARKETING_AUDIENCE_IMPORT` is
    the app's own import permission, which the audience import target names (P4; §4); it is granted to
    `BOSS_MARKETING_AUDIENCE`, who run the import, and is in that group's bundle.
  - The ordinary groups' authz on the root with `MANTLE_USER_ORG` and `MANTLE_PRIVATE_CONTACT`, the
    `ironstone\.marketing\..*` service pattern on the artifact group, and `marketing` added to each row of the
    client deny pattern (as Admin P1 did, impl-admin F14), on the rows as the three earlier apps left them; a row
    that would pass the field's 255 characters is split by verb, which none should after Maintenance's P1 split
    the two long ones (the longest is 254 with `marketing`), ProjectsAccess checking every write verb is still
    denied (F58).
  - The capability registry rows of each group (`moqui.security.CapabilityBundle` and its artifact binding, as
    Commerce's at BossSetupData.xml:2728-2770), so an access administrator can assign them.
- **Organization scope** (X12; F3, F4, F45).
  - `MarketingCampaign.organizationPartyId`, audit-logged, kept equal to the effective `MarketingOrganization`
    MarketingCampaignParty row by CampaignServices (P2 writes it; P1 adds the field, the role and the rule).
  - MarketSegment keeps its existing `ownerPartyId` as the filter field (§4); ContactList its `ownerPartyId`.
  - Filter rows for the three in `MANTLE_USER_ORG` and `MANTLE_ACTIVE_ORG` (MantleSetupData.xml:253), an unowned or
    `_NA_` row readable only to the app administrator.
  - The organization check added to the list and consent services for a list that is not a mailbox (F77), so a
    direct call is refused as a mount is: in `get#ContactListAccess`'s non-mailbox branch (ContactListServices.xml
    :116-119, today header and post for anyone), which `update#`, `find#ContactLists`, `find#ContactListParties`,
    `join#`, `add#`, `remove#`, `decline#ContactListParty` and `set#ContactListPartyDelivery` already ask, and an owner
    of the caller's organizations required by `create#ContactList` (:197, :220); a contact administrator and `ADMIN`
    keep every list, for Comms' Consent screens; the internal services Shop and the list send call are unchanged.
- **Adoption** (design §15.4): `mantle.marketing.CampaignServices.preview#Adoption` and `apply#Adoption`: the
  campaigns, lists and segments with no owner, each assigned to an organization the administrator may work in, one
  result per record; nothing unowned is sendable or editable before it. Unknown historical consent stays unknown.
- **Consent seeds** (F10): `PcpTracking` (PartyConsentPurpose) and `PcsCheckout` (PartyConsentSource).
- **`ironstone.marketing.ContextServices`** (§2) and `Marketing.js`, whose tables later phases extend (capability
  permissions, areas, record kinds, choice sources, link paths).
- **The Marketing root** (design §1.2): the areas Home and Settings; the other areas are added by the phases that
  build them, and nothing unbuilt is in the menu. The nine placeholders are removed; `Marketing/Segments` and
  `Marketing/Newsletters` stay as redirects, to Audiences and Sends once those exist (F2); the stale grant comment
  fixed (F1). `<shell-providers>` with the `marketing` keymap; the palette, quick create and Today sources arrive
  with their records.
- **Home** (design §3): its frame with HomeScope, MarketingCards, Upcoming and Attention over
  `mantle.marketing.MarketingWorkspaceServices.get#Home`, `get#Upcoming` and `get#Attention`, each source answering
  by name and showing "Not available" until its phase; a failing source is named and the others shown.
- **Settings** (design §12): SettingsIndex over `get#Settings`, listing the entries built so far; Marketing's row in
  Admin's settings index (`moqui.server.SettingsEntry`, the framework's since Nov 11, 2026, impl-admin §9; as
  Commerce's row in BossSetupData.xml), group
  Applications, scope organization, `MARKETING_CONFIGURE`, naming the readiness provider below.
- **Readiness** (§4; F59): `MarketingWorkspaceServices.get#Readiness`, the checks of what is built, each with its
  fix link, and the provider `marketing.setup` in the readiness registry (`moqui.server.ReadinessProvider`, the
  framework's since Nov 11, 2026; as Products' row in BossSetupData.xml), scope organization,
  `MARKETING_CONFIGURE`, fix place Marketing/Settings as a `fixRoute` key of Admin's mount. P1
  answers unowned lists and segments awaiting adoption; later phases add theirs (no policy, P2; no ready sending
  profile, P6; a mount with nothing published, P7; failed jobs and captures, P9–P17).
- **Demo data.** Marketing's demo file (F69) gains a user per group (`marketing.author`, `.audience`, `.approver`,
  `.dispatch`, `.events`, `.analyst`, `.reader`, `.admin`), each a member of ORG_ZIZI_RETAIL, and one author of
  ORG_ZIZI_SERVICES only, for the isolation scenarios.
- **Specs.**
  - `test/Marketing/MarketingSpecLib.js` (ids, users, `shell`, `page`).
  - BOSS `MarketingAccess`: the app's one access spec, about six features with authorization on: each group's
    permissions, the menu and providers per group, a foreign organization's campaign refused through the context
    service, the refused raw mutators, and Home's one qvt render. A later phase adds a case only for an access rule
    it adds.
  - Mantle `test/marketing/MarketingScope`: the filters (a campaign, a list and a segment of another organization
    not found; an unowned list not writable; a mailbox unaffected), and adoption applied once per record.
  - `AppOrganizationFilters` gains the three entities.
- **Usable when** (an acceptance test to write, `test/acceptance/Marketing/MarketingFoundationWalk`): the menu renders
  for each group; `marketing.reader` opens Home and no settings; the ORG_ZIZI_SERVICES author sees none of
  ORG_ZIZI_RETAIL's campaigns, lists or segments by URL, choice, palette or direct service; the administrator adopts
  a legacy list and it becomes editable; a Projects client and a PASS public account are refused the root and every
  `ironstone.marketing` service.

### P2 — Campaigns and approvals

Design §3 Campaigns, CampaignDetail and Approvals, §12 CampaignDefaults and Vocabularies, §14.3 (Chatter and
RecordFiles hosts), §18 (the campaign plan print); MKT-CAMPAIGN, MKT-APPROVAL, MKT-COLLAB.

- **Mantle `mantle.marketing.CampaignServices`** (design §14.2 C): `find#Campaigns`, `create#Campaign`,
  `store#Campaign`, `get#Campaign`, `store#CampaignParty` (dated role rows; the organization row mirrored to
  `organizationPartyId`), `store#CampaignBudget`, `store#CampaignCost` and `find#CampaignCosts` (CampaignCost: a
  manual cost or an Accounting source line, never both, corrected by reversal: a purchase invoice item or an
  AcctgTransEntry of the campaign's organization, read with the caller's `ACCOUNTING_VIEW`, or `PAYABLE_VIEW` for a
  payable; no Accounting budget applies, F81),
  `store#CampaignAssociation` (CampaignAssociation: a typed, dated link to a list, segment, promotion, event, form
  or page of the same organization), the transitions over the native status flow (approve, start, complete with
  pending-work counts, cancel), `duplicate#Campaign`, `store#MarketingPolicy` and `preview#MarketingPolicy`
  (MarketingPolicy, dated per organization), `store#Vocabulary` and `find#Vocabulary` (MarketingVocabulary: dated
  organization bindings of ContactListType and TrackingCodeType values and the UTM source, medium and content
  values).
- **Approvals** (design §3; F42): MarketingDecision and `request#MarketingApproval`, `decide#MarketingApproval`
  (against the target's stamp; a second decision of one draft refused; the separation policy), `get#Decisions`; a
  material change of the target ends its approval. MarketingPolicy carries the one-person-team flag, off by default
  (§4): with it on, an author may approve their own send to fewer than 500 recipients, and the decision is recorded
  as a self-approval; at 500 or more, and with the flag off, the author never decides their own. The topics
  MarketingCampaignApproval, MarketingSendApproval and MarketingAutomationApproval, with their
  `moqui.server.TopicRegistration` rows naming `MARKETING_APPROVE` as the
  audience (as the framework's at AdminConfigurationData.xml:407); push titles name the campaign or send only.
- **Hosts** (design §14.3): MarketingCampaign as a Chatter and RecordFiles host with the organization check
  (CampaignAsset for its files); the native MarketingCampaignNote rows shown read only in Activity.
- **The lifecycle participant** (§4; F59): `marketing.campaigns` in Admin's registry
  (`ironstone.admin.LifecycleParticipant`, as Projects' at BossSetupData.xml:4060), over
  `CampaignServices.find#OwnedCampaignRoles` and `transfer#CampaignRole`: a departing user's manager and
  contributor rows on campaigns not completed or cancelled, ended and given to the named successor from that date.
  Approvals go to holders of the permission, not a person, and a scheduled send keeps its own approval, so neither
  is moved.
- **Screens:** Campaigns (CampaignFind, CampaignList with its board by status, NewCampaign); CampaignDetail (the
  record header, Summary and budget with CampaignHeader, CampaignParties, Budget and CostEntries, Decisions and
  Activity; the other tabs are added by their phases); Approvals, Commons' Notifications mounted as Customer Service
  mounts it (screen/CustomerService/Approvals.xml:31); CampaignDefaults (MarketingPolicy, PolicyPreview);
  Vocabularies. The palette's campaigns source and QuickCampaign; Home's campaigns and approvals cards.
- **Outputs:** the campaign plan, budget and approval history as an html-print with an effective date and time.
- **Assist:** `skill/marketing-campaign-summary.md` and CampaignDetail's "Summarize this campaign's results" prompt
  (its results arrive in P20).
- **Demo data:** two campaigns of ORG_ZIZI_RETAIL (one approved and running with a child, one planned), one of
  ORG_ZIZI_SERVICES, a policy with separation on.
- **Specs:** Mantle `test/marketing/Campaigns` (the native transitions and their refusals; a stale write; the
  organization mirror; a link to another organization's record refused; a cost reversed, a source line never counted
  twice; completion refused with pending work); `test/marketing/MarketingApprovals` (a changed target ends the
  approval; self-approval refused under the policy, and with the flag on admitted under 500 recipients, recorded
  as a self-approval, and refused at 500; one decision per draft); BOSS `MarketingCampaigns`
  (CampaignDetail's one qvt render).
- **Usable when** (`test/acceptance/Marketing/MarketingCampaignsWalk`): `marketing.author` plans a campaign with a budget
  and a manager, `marketing.approver` approves it from Approvals, the author's later budget change returns it to
  review, a cost linked to an Accounting line shows in actual cost once, and the ORG_ZIZI_SERVICES author can open
  none of it.

### P3 — Lists, consent and suppressions

Design §4 Lists, ListDetail, MemberDetail, Consent and ConsentDetail, Suppressions; §10 Leads' bulk action and
ContactDetail's Add to list; MKT-AUDIENCE, MKT-CONSENT (the suppression and scope parts).

- **Mantle `mantle.marketing.AudienceServices`** (design §14.2 L): `store#SubscriptionPolicy` (a list's public
  offer, confirmation requirement, purpose and evidence text; new dated fields, F6), `request#Subscriptions` (the
  one evidenced path to membership: selected parties or addresses, channel, purpose, evidence source, date and
  text; pending until confirmed, or accepted by the audited evidence path; it never clears a withdrawal or a
  suppression), `get#Member`, `store#ContactListEmail` (dated template bindings), `archive#List`, and the single-use
  reservation (reserved by the first released send, P9).
- **The list and consent services, extended** (owner contract, Commons and Comms): `find#ContactLists` and
  `find#ContactListParties` take Marketing's status filters and exclude mailboxes for Marketing; `create#ContactList`
  subscribes no one for a list that is not a mailbox; `PartyConsent.organizationPartyId` (nullable: a row without
  one stays global, and a scoped grant never undoes a global withdrawal; F9); `get#PartyConsentState` and
  `find#Consents` answer by organization.
- **Suppressions** (Comms', in `mantle.party.MessageServices`; F16): MessageSuppression and `find#Suppressions`,
  `store#Suppression` (add with evidence; end only with `MESSAGE_SUPPRESSION_REVIEW` and new evidence); the ledger's
  attempt refuses a suppressed destination (F13).
- **Screens:** Lists (ListFind, ContactLists, NewList), ListDetail (ListHeader, SubscriptionPolicy, Members,
  AddMembers, ListTemplates), MemberDetail (Membership, SubscriptionAction, ConsentHistory); Consent and
  ConsentDetail, Comms' Consent/List and Consent/Contact mounted with Marketing's organizations and
  `MARKETING_CONSENT_EDIT` (their `ironstone.comms.ConsentServices` is for contact administrators today, F50);
  `Shared/Suppressions` mounted at Audiences/Suppressions. QuickList; Home's audience card; the palette's lists
  source.
- **Sales** (§1, the connection built here; owner contract): the bulk "Add to list (evidenced)" on Sales' LeadList and
  AccountList (`Sales/Pipeline/Leads`, `Sales/Accounts/Accounts`), shown only with `MARKETING_AUDIENCE_EDIT`, filing
  `request#Subscriptions` per selected contact, each on its own (F64, F65):
  - Sales.js `mountRoots`' Marketing row gains `Accounts/Accounts` → `Leads/Accounts`, mounted at
    `Marketing/Leads/Accounts` (design §2), so the action is offered under both roots;
  - LeadList's `row-selection` admits the audience editor too, its Assign and Disqualify actions taking
    `condition="canEdit"` and the new action the audience capability (xml-form-3.xsd :177-182); AccountList gains row
    selection for it; both render in qvt and tui only, as row selection does;
  - a lead row names no contact (SalesOpportunities.js :841-884), so the action resolves each selected lead's current
    contact rows and an account's contacts through Sales' services under the caller's Sales read, a lead with no
    contact or address named as that item's failure.

  The Commons contact record's Consent tab (template/ContactRecord.xml:876-889, owner contract Commons), which every
  app's ContactDetail includes and which links to Comms' Consent for a contact administrator only, links a holder of
  `MARKETING_CONSENT_EDIT` to this Consent mount; Sales' ContactDetail gets it so (F67). Marketing's own ContactDetail
  and its Add to list are P19's.
- **Demo data:** a newsletter and an announcement list of ORG_ZIZI_RETAIL with accepted, pending, unsubscribed and
  unevidenced legacy members, a single-use list, and two suppressions (a hard bounce, a complaint).
- **Specs:** Mantle `test/marketing/Audiences` (a request is pending without confirmation; an accepted one needs
  evidence; a later withdrawal is not regranted by a retry; list creation subscribes no staff; a mailbox behaves as
  before); `test/party/Suppressions` (a suppressed destination refused at the ledger's attempt; a new subscription
  does not end it; ending needs the review permission); the Consent spec's scoped grant against a global
  withdrawal; BOSS `MarketingLists` (ListDetail's one qvt render; the Sales bulk action refused without the
  permission, on the context service, with no second render of Sales' lists); Sales' specs unchanged but
  `SalesAccess`' Marketing links case, which gains `Leads/Accounts`.
- **Usable when** (`test/acceptance/Marketing/MarketingAudienceWalk`; design §16.3 scenario 2): `marketing.audience`
  makes a list, adds three contacts with evidence and two without, sees two pending; a salesperson without the
  audience permission sees no bulk action and one with it files requests that arrive pending; a complaint
  suppression stays after the contact resubscribes; the Forum's and Comms' mailboxes behave as before.

### P4 — Audience import and merge

Design §4 AudienceImport and AudienceMerge, §18 (the import preview, error rows and membership export);
MKT-AUDIENCE.

- **Mantle AudienceServices** `preview#AudienceImport`, `apply#AudienceImport`, `get#AudienceImport` and
  `find#AudienceImportRuns` over `ContactImportServices.parse#ContactFile`, `preview#Contacts` and `import#Contacts`
  behind the organization check (no second parser or party merger); AudienceImport and its item results (the staged
  file by reference and hash, the mapping, the evidence classification, an expiry); each row applied once under its
  import and row identity, through `request#Subscriptions`; `preview#ListMerge` and `merge#Lists` (membership links
  only, never a party merge, never a promotion of pending or withdrawn membership).
- **The import target** (impl-admin §7; design-admin §11.1): a Mantle seed row `moqui.server.TransferTarget`
  `marketingAudience`, direction import, mode wizard, with `findService` the runs finder and `ownerRoute`
  `marketingAudienceImport`, as Commerce's channel orders are registered
  (mr-mantle data/StoreChannelSetupData.xml:59-64); the route key added to `ironstone/shared/DataImport.js`'s
  `ownerRoutes` (:18-27). Admin's Imports then lists Marketing's runs; nothing is staged through Admin. Like the
  other wizard targets it names no Admin permission. Its import permission is `MARKETING_AUDIENCE_IMPORT`, which
  `preview#AudienceImport` and `apply#AudienceImport` check beside `MARKETING_AUDIENCE_EDIT` and the organization,
  and its runs finder answers by `MARKETING_AUDIENCE_VIEW` and the organization (§4).
- **The membership export** (design §18): a `TransferTarget` of direction export, mode rows, with
  `MARKETING_AUDIENCE_EXPORT` as its export permission and the address a field of its own permission (Admin P16's
  contract), so an export is recorded and bounded as the others are.
- **Screens:** AudienceImport (ImportFile, ImportEvidence, ImportMatches, ImportResults with the error-row download
  and retry of failures); AudienceMerge (MergeSelection, MergePreview, ApplyMerge).
- **Specs:** Mantle `test/marketing/AudienceImport` (a holder of `MARKETING_AUDIENCE_EDIT` without
  `MARKETING_AUDIENCE_IMPORT` refused; a bad row fails alone; a restart applies each good row once; a
  withdrawal after the preview survives the apply; a private contact of another user never matched; a list supplies
  no evidence); `test/marketing/ListMerge` (no party merged; pending stays pending; consent of another topic not
  carried); BOSS `MarketingImport` (the wizard's one qvt render; the target listed in Admin's Imports with its runs).
- **Usable when** (`test/acceptance/Marketing/MarketingImportWalk`; scenario 4): a CSV of six contacts, one malformed and
  one already unsubscribed, imports four as pending or accepted by their evidence and names the two; the run shows
  in Admin's Imports for a data operator who also holds `MARKETING_AUDIENCE_VIEW`, as a summary with no row or
  address; two lists merge with their histories kept.

### P5 — Segments and audience preview

Design §4 Segments, SegmentDetail and AudiencePreview; MKT-SEGMENT, MKT-ACCESS; gate 1.

- **Mantle `mantle.marketing.SegmentServices`** (design §14.2 Q): `find#Segments`, `store#Segment`,
  `store#SegmentRules` (the native classification, geography and dimension rows), `store#SegmentFilter` (a typed,
  bounded predicate tree stored as data over registered projections only: party, contact, purchase, engagement,
  registration, and Sales' lead and opportunity facts, §1; no entity name, SQL or script), `store#SegmentMember`
  (MarketSegmentParty gains dates and an include or exclude kind, F5), `evaluate#Segment` (bounded, paged, with the
  matched rule and exclusion reason), and `preview#Audience` (lists and segments with a topic, channel and purpose,
  as of a time: deduplicated by normalized destination within the organization, the mutually exclusive buckets of
  design §4 in their precedence, the tracking flag, and a preview identity P8 prepares from).
- **The projections' registry:** a small table in the segment module naming each source, its fields and the
  permission that reads it; a caller without a source's permission cannot build or evaluate a predicate on it, and
  a missing value never matches through negation.
- **Screens:** Segments (SegmentFind, SegmentList, NewSegment); SegmentDetail (SegmentHeader, NativeRules,
  SavedFilter, ExplicitMembers, Evaluation); AudiencePreview (AudienceSelection, Eligibility, RecipientPreview with
  addresses for `MARKETING_AUDIENCE_VIEW` only). SegmentDetail's "Explain this segment" prompt and
  `skill/marketing-audience-check.md`.
- **Specs:** Mantle `test/marketing/Segments` (parent intersection and a cycle refused; an exclusion wins; unit
  bounds inclusive; an unauthorized projection refused; evaluation subscribes no one); `test/marketing/Eligibility`
  (the buckets sum to the matched total and are exclusive; a duplicate destination chosen deterministically; an
  untracked recipient stays eligible; no count of a source the caller cannot read); BOSS `MarketingSegments`
  (SegmentDetail's one qvt render).
- **Usable when** (`test/acceptance/Marketing/MarketingAudiencePreviewWalk`; scenario 3): a preview over two lists and a
  segment with missing addresses, a duplicate, a pending and an unsubscribed member, a suppression and a tracking
  refusal shows bucket totals that sum exactly, with addresses masked for `marketing.author`.

### P6 — Templates, sending profiles and bounce intake

Design §5 MessageTemplates and MessageTemplateDetail, §12 SendingProfiles, §15.1 (`DeliveryReportIntake`), §15.2
(receipts); MKT-TEMPLATE, MKT-TRANSPORT; stage M2.

- **Framework** (F17, F18): `send#EmailTemplate` and `send#Email` take a `subject` and a `bounceAddress` for one
  call, over the template's; the ARF reader (RFC 5965) beside the DSN reader of `moqui-mail`, both callable for a
  stored message.
- **Comms' `mantle.party.MessageServices`** (design §14.2 G; owner contract):
  - MessageTemplate (organization, channel, purpose, locale, dated content with declared variables and fallbacks,
    its EmailTemplate for email) and `find#Templates`, `create#Template`, `store#Template`, `store#TemplateContent`,
    `preview#Template`, `publish#Template`, `end#Template`; content rendered with `fancy-locked-html` (F78): the
    renderer renders only by location, so each dated content is a `dbresource://` file named `.html.fancy-locked`,
    rendered through `ec.resource.template(location, map)` with a map of the declared variables and their fallbacks
    only; an unknown name renders empty (null), so an undeclared variable is refused when the content is stored, by
    the template service's own parse, not at render.
  - MessageSendingProfile (organization, channel, the infrastructure binding chosen from what Admin approved, sender
    and reply-to, purpose, throttle, quiet hours and zone, tracking policy, bounce domain, dates) and
    `find#SendingProfiles`, `store#SendingProfile`, `check#SendingProfile` (the readiness of design §12: sender and
    domain verification as Admin's relay and DKIM checks report it, transport available, the bounce account, the
    unsubscribe endpoint, the permitted site).
  - A delivery of the ledger may name a sending profile (F13): its attempt then sends from the profile's server,
    sender and reply-to, within its throttle and quiet hours, with the per-call bounce address
    `bounces+<delivery key>@` the profile's domain. A delivery that names none is sent as today.
  - The ledger's receipts (F14): a delivery keeps its hand-off outcome and, apart from it, the later facts
    (delivered, soft bounce, hard bounce, complaint), each recorded once and never moving an earlier fact back.
  - `process#DeliveryReport` and the email ECA `DeliveryReportIntake` on the bounce accounts: the VERP key finds the
    delivery; a permanent failure or a complaint becomes a receipt fact and one MessageSuppression; a transient one a
    soft failure; an unknown key or an unreadable report is logged and left, and the rest go on (F76). The bounce
    account is a hosted account made in Comms' account wizard (basic-comms Settings/MailAccounts/Add), which the
    plus-tag lookup finds with the tag stripped (moqui-mail delivery.rs:66-104); the profile's readiness checks it
    exists. Through an edge relay with `edge_mail_bounce_domain` set the edge replaces the envelope sender with its
    own (edge_mail.rs:621-627) and marks the EmailMessage `ES_BOUNCED` itself (:1047-1085), so the per-call VERP
    address is lost there: an EmailMessage turning `ES_BOUNCED` reaches `process#DeliveryReport` too, matched to its
    delivery by `providerMessageId` (F18).
- **Registrations:** Marketing's readiness (P1) gains the organization's sending profiles, read through
  `check#SendingProfile` as the viewer, with Settings/SendingProfiles as the fix; a provider of Comms' own waits
  for Comms' settings area (§7). The intake is a registered recovery (`moqui.server.RecoveryDescriptor`, as
  mr-mantle data/StoreChannelSetupData.xml:42) for the reports it could not read, and the intake's poll a job with
  `operation` and `operation-ref`.
- **Screens:** `Shared/MessageTemplates` (TemplateFind, TemplateList, NewTemplate), `Shared/MessageTemplateDetail`
  (TemplateHeader, TemplateContent with the Compose editor's inline text actions, TemplatePreview, TemplateRelease)
  and `Shared/SendingProfiles` (Profiles, SendingProfile, SenderReadiness), mounted at Sends/MessageTemplates and
  Settings/SendingProfiles; Settings gains Templates, Consent and Suppressions links.
- **Demo data:** two published templates (a newsletter, a subscription confirmation), one draft, and a sending
  profile of ORG_ZIZI_RETAIL ready on the demo's mail capture, one of ORG_ZIZI_SERVICES not ready.
- **Specs:** framework: the mail crate's tests for the per-call subject and bounce address and for an ARF report;
  Mantle `test/party/MessageTemplates` (an undeclared variable refused; a script or unsafe HTML refused; a
  published template's change is a new dated content); `test/party/DeliveryReports` (a hard bounce and a complaint
  each suppress once; a duplicate report changes nothing; a soft bounce suppresses nothing; an unknown key logged
  and the next report processed); `test/party/SendingProfiles` (not ready without a bounce account; no host or
  credential in any answer; a delivery naming a profile goes out with its sender and bounce address, and one naming
  none as before); BOSS `MarketingTemplates` (MessageTemplateDetail's one qvt render).
- **Usable when** (`test/acceptance/Marketing/MarketingReadinessWalk`; scenario 17): the administrator binds a profile
  and sees it ready; a template editor publishes a template with a fallback variable; a DSN and an ARF report sent
  to the VERP address of a transactional delivery that names the profile each suppress the destination once and
  show on the delivery; a profile with no
  bounce account reads not ready with its reason and a link to Admin.

### P7 — PASS Marketing: the app, subscription and preferences

Design §13.1, §13 Subscribe and VerifySubscription, EmailPreferences (Marketing's context), §4 ListDetail's public
offer; MKT-PUBLIC, MKT-AUDIENCE, MKT-CONSENT; gate 2.

- **The app** (F24): `marketing` in Mantle's PASS app registry with an organization target and a readiness service
  (`mantle/public/PublicApps.js`, as `support` at :24-28), and in mr-pass `service/pass/Apps.js` (:15) with
  `screen/Marketing.xml`; the operations `marketing.getPublication`, `marketing.requestSubscription` and
  `marketing.verifySubscription` in the facade's schema (as mr-pass service/pass/Schema.js:1037-1042), each mapped
  to a `mantle.marketing.MarketingPortalServices` service; the site's readiness names a mount with no published
  record.
- **Mantle MarketingPortalServices** (design §14.2 P): `get#Publication`, `request#Subscription` (SubscriptionRequest
  with a hashed, expiring token; a party made or matched without disclosing which, and a pending membership, F43; a
  neutral receipt whatever happened; rate limited verification mail sent as a transactional delivery of the ledger, from
  the organization's sending profile and a published confirmation template of P6), `get#SubscriptionRequest` and
  `verify#Subscription` (a POST only; grants exactly the requested topics for that address; a replay answers the first
  result and regrants nothing after a withdrawal).
- **Publication of a list:** ListDetail's SubscriptionPolicy gains the site and opening interval of its public
  offer; `ContactList.isPublic` alone publishes nothing.
- **PASS pages:** Subscribe (SubscriptionRequest, SubscriptionReceipt) and VerifySubscription (VerifyIntent), plain
  accessible HTML without JavaScript, locally and through a remote frontend.
- **Email preferences** (owner contract, Comms; F25): the Account page's Marketing context: the sending
  organization's published topics by channel with the recipient's state, unsubscribe from one or all, change topics,
  and the opt-out reason kept in the withdrawal's `PartyConsent.comments`; the consent services' scope extended by
  organization, topic and channel without ending a legacy token. The BOSS `/u/` page stays as it is for an instance
  with no PASS Account mount (§4).
- **The checkout opt-in** (impl-shop §7; F26): Shop's store-news choice is recorded through `request#Subscriptions`
  with source `PcsCheckout`; the receipt's confirmation link stays its verification, and a verified account is
  accepted at once.
- **Specs:** Mantle `test/marketing/Subscriptions` (a GET changes nothing; a confirm grants only the requested topic
  and address; a replay after a withdrawal regrants nothing; an expired or foreign token discloses nothing; no
  address echoed); PASS `test/Marketing/MarketingAccess` (the operations refused for a site without the mount and
  for an unpublished list; a request over the address's limit answered with the same receipt and no mail); the
  ShopCheckout and Consent specs unchanged.
- **Docs:** Attack-Surface gains the app's first three operations and the verification mail's limits; mr-pass
  Deployment its Marketing section (the mount, the readiness service, the sending profile it needs).
- **Usable when** (mr-pass `test/acceptance/MarketingSubscribeHttp`, and `MarketingRemoteHttp` through a remote
  frontend; scenario 5): a visitor subscribes to one of two published topics, a scanner's GET of the link changes
  nothing, the confirm button grants that topic alone, the preferences page withdraws it with a reason, and a
  mailbox membership is untouched throughout.

### P8 — Sends and the composer

Design §5 Sends, SendDetail (its Summary, Content, Audience, Schedule and Decision) and Compose, §18 (the email,
its text alternative and the test message); MKT-SEND, MKT-TEMPLATE, MKT-APPROVAL; stage M3.

- **Mantle `mantle.marketing.CampaignSendServices`** (design §14.2 D): CampaignSend (the proposed states of design
  §5 as a status flow of its own) and `find#Sends`, `create#Send`, `get#Send`, `store#SendContent`,
  `store#SendAssets` (CampaignSendContent; an asset checked for the caller's and the public's access),
  `preview#Send` (a sample recipient for `MARKETING_AUDIENCE_VIEW`, synthetic values otherwise), `test#Send` (to
  the bounded test allowlist of the policy, marked TEST, never in a live count), `prepare#Send` (CampaignRecipient
  rows from P5's preview identity; the rendered body kept as a resource; the content and policy time recorded),
  `schedule#Send`, and the approval through P2's decision (any change of subject, body, sender, audience or schedule
  ends it). An approved campaign and a ready profile are required for a promotional send.
- **The ledger, extended** (Comms', owner contract; F13): a delivery source's build may answer the subject, body
  and text alternative, handed to `send#EmailTemplate` over the template's (P6's framework change). `test#Send` is
  the first such delivery: a ledger delivery of a test source of its own that names the profile, so a suppressed
  test address is refused as any other is. The existing sources are unchanged.
- **Hosts:** CampaignSend as a Chatter and RecordFiles host.
- **Screens:** Sends (SendFind, SendList with its board by state, NewSend); SendDetail with the tabs Summary,
  Content preview, Audience (SendAudience with the AudiencePreview link), Schedule (SendSchedule) and Activity, and
  SendDecision; Compose (MessageContent, MessageAssets, MessagePreview, TestSend) in XML, its terminal fields with
  the same validation; CampaignDetail's Sends tab; QuickSend; the palette's sends source; "Use" on a template makes
  a draft send. `skill/marketing-prepare-send.md`.
- **Demo data:** a draft, an approved and a scheduled send of the running campaign.
- **Specs:** Mantle `test/marketing/Sends` (a content, sender, audience or schedule change ends the approval; a
  required unknown variable blocks preparation; an empty eligible audience cannot be approved for release; a test
  enters no count; the prepared body is what a later read returns after the template changes);
  `test/party/DeliveryLedger` gains the source-given subject and body; BOSS
  `MarketingSends` (SendDetail's and Compose's one qvt render each).
- **Usable when** (`test/acceptance/Marketing/MarketingComposeWalk`; scenario 10): `marketing.author` writes a send from
  a template, is refused a script and an unapproved private file, tests it to an allowed address, prepares it and
  asks for approval; `marketing.approver` sees the count and approves; the author's edit of the subject returns it
  to review.

### P9 — Dispatch and delivery

Design §5 SendDetail's control, CampaignDelivery and RecipientDetail, §15.2, §15.3 (the dispatch and reconciliation
jobs), §18 (the delivery report); MKT-SEND, MKT-TRANSPORT; CX-DELIVERY.

- **The ledger, extended** (Comms', owner contract; F13), over P6's profile and P8's content: a delivery carries
  its organization; consent is checked for a purpose on a topic's list within the organization;
  `resolve#Delivery`'s permission is granted to the dispatch group by BossSetupData, and the service checks the
  delivery's organization; the existing sources are unchanged.
- **CampaignSendServices** `release#Send` (needs `MARKETING_DISPATCH`, a current approval, a ready profile; reserves
  a single-use list; under P2's one-person-team flag the author of a self-approved send may release it while its
  recipients, counted at the release, are fewer than 500, §4), the due worker `run#DueSends` (claims a bounded page
  of recipients under a lease, rechecks
  the campaign and send state, membership, consent, suppression, the destination against the one approved, caps and
  readiness, and queues each as a delivery of source `MdsrcCampaignSend` keyed by the recipient's execution key; one
  recipient's failure never stops the next), `pause#Send`, `cancel#Send` (in-flight counts shown), `find#Recipients`,
  `get#Recipient`, `retry#Recipients` (asks the ledger to try its known retryable failures again) and
  `reconcile#Recipient` (records the outcome on the uncertain delivery, as the mail queue does). Each recipient's
  message carries the List-Unsubscribe headers and link, its token made by `create#UnsubscribeToken` with `siteId` the
  sending profile's permitted site, which names that site's Email preferences page whatever sites the recipient
  belongs to (ConsentServices.xml:1166-1180, :1225-1237; F56, F75); ContactListCommStatus and the CommunicationEvent are linked
  as the list send links them, with the approved subject on both (F8). A retry of the worker after a stop queues
  nothing twice: the ledger answers the delivery it already holds for the key, and an uncertain one is never sent
  again.
- **Registrations:** the dispatch job with `operation` and `operation-ref`, registered for Admin's Jobs
  (`moqui.server.JobRegistration`, as AdminConfigurationData.xml:376); uncertain campaign deliveries are already in
  Admin's MailQueue through the ledger's ownership (F15), and CampaignDelivery links there for an operator.
- **Screens:** SendDetail's Delivery tab and SendControl; `Shared/CampaignDelivery` (DeliveryFind, DeliveryRows,
  RetryRecipients) mounted at Sends/CampaignDelivery; RecipientDetail (Recipient, Attempts from the ledger,
  ResolveDelivery); Home's due and failed cards and the Attention source; the Today source of due sends.
- **Outputs:** the delivery and reconciliation report as CSV and html-print, addresses masked by permission.
- **Specs:** Mantle `test/marketing/Dispatch` (a release needs dispatch, approval and readiness, each alone refused; a
  self-approved send released by its author under the flag and refused at 500 recipients or with the flag off; a
  withdrawal, a new suppression or a changed address after preparation removes that recipient and the others send; a new
  segment match is never added; a second release answers the first; a single-use list cannot be claimed twice; cancel
  stops new claims; a page claimed twice after a lease expires queues each recipient once); `test/party/DeliveryLedger`
  gains the organization and the topic's consent; BOSS `MarketingDelivery` (CampaignDelivery's one qvt render; addresses
  masked for the dispatcher without the audience permission); the golden walk `MarketingSendWalk` (make a send from a
  template, approve it, release it, see it delivered).
- **Usable when** (`test/acceptance/Marketing/MarketingDispatchScenario`; scenarios 6 and 7): author, approver and
  dispatcher each do only their part; a send to forty recipients survives a stop after hand-off and before
  recording with one uncertain delivery, which the dispatcher reconciles and nothing resends; a duplicate bounce
  report changes no count; the email carries the unsubscribe header and link.

### P10 — Experiments

Design §5 ExperimentDetail; MKT-EXPERIMENT; gate 3.

- **CampaignSendServices** `store#Experiment`, `store#ExperimentVariant`, `get#Experiment`,
  `choose#ExperimentWinner` and `release#ExperimentWinner` over CampaignExperiment and CampaignExperimentVariant:
  one stable assignment per normalized recipient at preparation, two variants with equal samples, the remainder
  disjoint; a sample too small refused; each variant approved as content of the send; the winner chosen by a person
  with a reason after the observation period; one winner release whatever key repeats it; a remainder recipient
  withdrawn or suppressed since is dropped at dispatch.
- **Screens:** ExperimentDetail (ExperimentSetup, Variants, ExperimentResults with their denominators and tracking
  coverage, ReleaseWinner); SendDetail's Experiment tab. Click and conversion counts read "not available" until P15
  and P20.
- **Specs:** Mantle `test/marketing/Experiments` (samples and remainder disjoint and stable across a retry; no
  recipient gets two variants; a second winner release answers the first; a test send enters no result; a tie stays
  undecided).
- **Usable when** (`test/acceptance/Marketing/MarketingExperimentScenario`; scenario 8): a two-variant send to a 20%
  sample goes out, a retry reassigns no one, the dispatcher releases the chosen winner to the remainder once, and a
  recipient who unsubscribed in between is not sent.

### P11 — Automation

Design §6 Automations, AutomationDetail and EnrollmentDetail, §15.3 (the admission and step jobs); MKT-AUTOMATION;
gate 4 (M4).

- **Mantle `mantle.marketing.AutomationServices`** (design §14.2 N): MarketingAutomation and its dated
  MarketingAutomationStep rows (Send email, Wait, Condition; a bounded step count from the policy; no loop or jump),
  AutomationEnrollment and AutomationStepExecution; `find#Automations`, `create#Automation`, `store#EnrollmentRule`,
  `store#Steps`, `preview#Automation` (a dry run that sends nothing), `activate#`, `pause#`, `end#Automation`,
  `find#Enrollments`, `get#Enrollment`, `stop#Enrollment`; the admission job (a cursor over source events and the
  segment difference scan; one enrollment per automation, party and trigger identity) and the step job (bounded due
  work; consent, suppression, goal and campaign state rechecked before every effect; waits as elapsed time or
  business days in the rule's zone; quiet hours and caps postpone, never skip consent). A send step makes an
  ordinary CampaignSend recipient hand-off under the automation's approval (P2's decision), not a decision per
  participant; a change outside the decision pauses the step.
- **Triggers:** confirmed subscription (P7), newly eligible segment member (P5), staff enrollment with evidence, and
  the two commerce triggers: order placed, from the Mantle SECA `OrderPlacedRecordAttribution` (tx-commit on the
  OrderHeader placement) calling `mantle.marketing.TrackingServices.handle#OrderPlaced`, which in this phase files
  the admission event only (§4; P20 adds the attribution); and cart abandoned, from the event Commerce's recovery
  reads. Form submission, registration and attendance triggers are added by P12 and P17.
- **Commerce** (impl-commerce §7, F132; F27): RecoveryPolicy's sender gains "A Marketing automation" beside the
  built-in recovery (`recoverySender` in StoreAdmin.js:790), offered when an active automation of the store's
  organization has the cart trigger; the ledger's key by cart and recipient keeps one recovery mail per cart.
- **Registrations:** the two jobs with `operation` and `operation-ref` and their `JobRegistration` rows; the
  SECA's row in crosscut §1.3's register.
- **Screens:** Automations (AutomationFind, AutomationList, NewAutomation); AutomationDetail (EnrollmentRule, Steps,
  Simulation, EnrollmentList, AutomationControl); EnrollmentDetail (Enrollment, StepHistory, StopEnrollment);
  CampaignDetail's Automation tab.
- **Demo data:** a three-step welcome sequence on the newsletter's confirmed subscription, active, with enrollments
  at each step.
- **Specs:** Mantle `test/marketing/Automations` (a duplicate admission event enrolls once; a completed send step
  is not replayed after a restart; a withdrawal stops the enrollment and a channel withdrawal only that channel; a
  goal met ends it; a stopped enrollment does not resume; a wait across a daylight-saving gap lands on the next
  valid instant); `test/order/CartRecovery` gains the one-sender rule; BOSS `MarketingAutomations` (AutomationDetail's
  one qvt render).
- **Usable when** (`test/acceptance/Marketing/MarketingAutomationScenario`; scenario 9): the welcome sequence is
  approved and activated, a new subscriber gets step one once though the event arrives twice, a pause holds a due
  step and resume sends it within the cap, an unsubscribe ends the enrollment, and a store set to the automation
  sender sends one cart recovery, not two.

### P12 — Surveys and form publication, with PASS SubmitForm

Design §10 Surveys and SurveyDetail, SurveyDistribution, Responses and ResponseDetail, §13 SubmitForm, §18 (the
survey invitation and results); MKT-FORMS, MKT-PUBLIC; stage M5.

- **Commons' form publication** (owner contract; F20, F70): in `mantle.party.FormPublicationServices`, beside
  People's `open#Publication` (which offers a published form by an access kind its purpose admits) and extending it
  rather than a second publishing verb, `store#Publication` (the site, opening interval and context),
  `preview#Publication`, `close#Publication`, `create#Invitations` and `accept#Submission` over the built
  FormPublication and FormInvitation, with FormSubmission (the request identity,
  the response, the verified party if any, the status of its effects); the public purposes lead and registration
  beside survey, case feedback and People's private ones; a published anonymous response guarded as an invited one
  is. The form definition services are not here: they are `mantle.party.FormDefinitionServices`, moved there by
  impl-people P16, and are used as built.
- **The survey builder for Marketing** (owner contract, Commons and Customer Service; F21, F53): impl-people P16
  made the four shared survey screens (`Shared/SurveyForms`, `SurveyFormDetail`, `SurveyResponses`,
  `SurveyResponseDetail`) read their context from the mounting app's registration. This phase adds to that and
  changes nothing of the generalization:
  - Marketing's row in mr-boss `service/ironstone/shared/SurveyApps.js` `apps`, the third after Customer Service's
    and People's: the survey, lead and registration purposes, `FormDefinitionServices`' `find#Forms`, `create#Form`
    and the rest as its services, Marketing's response services, the capability from Marketing's context that shows
    the edit actions, its routes and words (F70);
  - three `mantle.party.FormPurpose` rows in Mantle seed data, with their DbFormPurpose and FormPublicationPurpose
    enumerations (`FppSurvey` exists; the lead and registration ones are new): edit `MARKETING_CONTENT_EDIT`, view
    `MARKETING_AUDIENCE_VIEW,MARKETING_REPORT_VIEW`, a Marketing scope service answering the organizations, and the
    access kinds each admits, so `FormDefinitionServices` admits a Marketing editor for these purposes and no other,
    and no case or People response is ever in reach;
  - option scores for a summary (design §10) on the shared definition: People did not add them (F70).
- **Mantle `mantle.marketing.MarketingFormServices`** (design §14.2 F): thin wrappers adding the campaign link and
  the promotional eligibility of invitations: `store#Publication`, `publish#Publication`, `create#Invitations` (a
  send of P9 to an audience, each invitation an ExternalAccess capability of the FormInvitation kind, which gains a
  Marketing scope beside `CaseFeedback` with the purpose's issuer permission, ExternalAccess.js :131-145; F80), `find#Responses`, `get#Response`,
  `get#ResponseStats`.
- **PASS** (operations `marketing.getForm`, `marketing.submitForm`): MarketingPortalServices `get#Form` and
  `submit#Form` (the publication's effective form rendered on the server; hidden and unknown fields refused; the
  repeat policy and request identity; the consent choices recorded apart through `request#Subscriptions`; a neutral
  receipt); the SubmitForm page (PublicForm, FormReceipt), embeddable in a page by the publication's ID (P14).
- **Automation:** the form-submission trigger of P11.
- **Screens:** Surveys and SurveyDetail (the shared builder mounted); SurveyDistribution (FormPublication,
  FormSharing with the link and QR, PublishForm, Invitations); Responses and ResponseDetail (the shared response
  screens with publication scope).
- **Demo data:** a published anonymous survey and an invited one with responses before and after a changed option.
- **Specs:** Mantle `test/party/FormPublications` (a hidden or unknown field refused; a changed payload under one
  request key refused and the same one answered; an invited form answers once; a response reads its form as of
  submission); `test/marketing/MarketingForms` (an invitation needs promotional eligibility; a Marketing reader reads no
  case feedback of the same form); PASS `test/Marketing/SubmitForm` (an unpublished or closed publication not available;
  an oversized or over-limit submission refused with the neutral receipt); BOSS `MarketingSurveys` (SurveyDistribution's
  one qvt render; the builder's Marketing context checked on the context service, with no second render of the shared
  screens); CaseFeedback's, Customer Service's and People's specs, `test/party/FormDefinitions` among them, unchanged.
  Attack-Surface gains the two operations.
- **Usable when** (`test/acceptance/Marketing/MarketingSurveyWalk` and mr-pass `test/acceptance/MarketingFormHttp`; scenarios
  11 (its form half) and 12): an author publishes a survey to a campaign's list, a recipient answers from the
  invitation once, an anonymous visitor answers the public form, a later change of an option leaves both responses
  reading as submitted, and the same form's case responses stay out of Marketing.

### P13 — Leads and the Sales handoff

Design §10 Leads and LeadRules, §12 LeadSources, §13 SubmitForm (its lead purpose), §15.3 (the capture job);
MKT-LEAD; SAL-CRM. Every part of this phase is a connection to Sales (§1).

- **Mantle MarketingFormServices** `find#LeadRules`, `store#LeadRule`, `preview#LeadRule` and `process#LeadCaptures`
  over MarketingLeadRule (a dated source, trigger, allowed field mapping, Sales source and team queue) and
  MarketingLeadCapture (one per rule and source event, with the opportunity or the error): an accepted submission
  (P12), and later a registration or attendance (P17), is handed to Sales'
  `mantle.sales.OpportunityServices.store#LeadIntake` with the campaign, the tracking code when there is one, the
  mapped published fields only and the capture's operation key; a failed handoff leaves the response intact and is
  retried by the capture job or ReprocessCapture; a duplicate becomes Sales' review item; nothing here subscribes
  anyone.
- **The one public lead page:** a publication of purpose lead on PASS SubmitForm (P12's page) with its default
  source and team queue, published from SurveyDistribution; design-sales §11's LeadIntakeForms stays Sales' later
  screen (§4; impl-sales §5 Q9 agrees).
- **Screens:** Leads, Sales' `Sales/Pipeline/Leads` mounted with Marketing's campaign and source filters over
  `find#Opportunities` (one campaign and one source a call) and the user's own Sales visibility; `MARKETING_VIEW`
  alone gives handoff counts, no pipeline, counted from Marketing's own MarketingLeadCapture rows, since
  `find#Opportunities` needs a Sales read (F66); the campaign column (an id today, Leads.xml:186) shows its name; LeadRules (LeadRuleList, LeadRule, LeadRulePreview, ReprocessCapture); LeadSources, Sales'
  `Sales/Settings/LeadSources` mounted, its UtmSourceMap offering Marketing's vocabulary (P2) for source and medium;
  CampaignDetail's Results tab gains handoff counts.
- **Sales' lead forms** (owner contract; impl-sales §7): NewLead and the lead's header offer the campaign and its
  tracking codes as choices, from `CampaignServices.find#Campaigns` and `TrackingServices.find#TrackingLinks` (the
  codes from P15) under the user's Marketing scope; a user without `MARKETING_VIEW` sees the stored value only.
- **Registrations:** the capture job with `operation` and `operation-ref` and its `JobRegistration`; failed captures
  as a registered recovery (`RecoveryDescriptor`) so an operator sees them in Admin beside the others.
- **Checked first** (F68): `store#LeadIntake`'s parameters, its answer for a duplicate and a repeated key, and its
  campaign and tracking code, against Sales P5 as merged; this phase's text changes where they differ.
- **Specs:** Mantle `test/marketing/LeadCapture` (one capture per rule and source event through a resubmission and
  a job retry; a failed handoff keeps the response and retries into one lead; an unpublished field never reaches
  Sales; a capture grants no consent); BOSS `MarketingLeads` (LeadRules' one qvt render; the Leads mount refused
  without a Sales reader's permission); Sales' specs unchanged.
- **Usable when** (`test/acceptance/Marketing/MarketingLeadScenario`; scenario 11): a visitor's lead form on the PASS
  site becomes one lead in Sales' queue with the campaign as its source though the form is posted twice; with Sales'
  intake failing the response is kept and the retry makes one lead; the visitor is on no list.

### P14 — Content, blog posts and landing pages

Design §8 Content, ContentDetail, BlogPosts, BlogPostDetail, LandingPages and PageDetail, Knowledge, §18 (the blog
post); MKT-CONTENT, MKT-COLLAB, MKT-PUBLIC.

- **Mantle `mantle.marketing.MarketingContentServices`** (design §14.2 T): CampaignContent and
  `find#CampaignContent`, `store#CampaignContent`, `get#CampaignContent` (a campaign's dated link to a wiki page,
  blog post, site page or file, with the owner's publication state read only); `find#BlogPosts` over
  WikiBlogFindView in the spaces `get#UserWikiSpaces` answers; `add#BlogCategory` and `remove#BlogCategory`,
  checking write access to the post's space before the entity write. `create#WikiBlog` and `update#WikiBlog` are
  called as built.
- **Storeless site pages** (owner contract, Commerce; F23): the site page services take a site's `marketing` mount
  with its organization as scope, and `MARKETING_CONTENT_EDIT` to edit and publish there, beside the `shop` mount
  and store they take today; themes stay Commerce's. `Shared/Pages` and `Shared/PageDetail` take their context from
  the mounting app (F22). A page embeds a published list, form or event by its registered ID.
- **PASS:** the Marketing app serves its mount's published pages through the shared page renderer, with the
  embedded Subscribe and SubmitForm components (the Event component arrives with P16); no store is needed.
- **Newsletter assembly:** a send's content may take the approved posts of a list's blog category as of
  preparation, keeping their version references; a send sets neither `WikiBlog.publishDate` nor a page's published
  version, and `WikiBlogCategory.sentDate` is not the record of it.
- **Screens:** Content (ContentFind, CampaignContent, LinkContent); ContentDetail (ContentLink,
  PublicationReadiness, Distribution with "create draft send"); BlogPosts (BlogPostFind, BlogPostList, NewBlogPost,
  NewBlogPostFromPage); BlogPostDetail (BlogPost, BlogPostBody on the Knowledge editor, AddCategory, Categories,
  CampaignUse); LandingPages and PageDetail (the shared screens mounted); Knowledge, Commons' screen mounted as
  Customer Service mounts it (screen/CustomerService/Knowledge.xml:29); CampaignDetail's Content tab.
- **Demo data:** a blog space with three posts in a category, a campaign landing page on the demo site's Marketing
  mount with an embedded subscribe component.
- **Specs:** Mantle `test/marketing/MarketingContent` (a link publishes nothing; a category write refused without
  space write access; a send leaves `publishDate` and the published version alone); `test/public/SitePages` gains
  the storeless mount (a page of another organization's mount refused; a Commerce designer cannot edit it and a
  Marketing author cannot edit a shop's); BOSS `MarketingContent` (BlogPostDetail's one qvt render); Commerce's
  page specs and Shop's page rendering unchanged; PASS
  `test/Marketing/MarketingPages` (a published page served with no store; an unpublished one not available).
- **Usable when** (`test/acceptance/Marketing/MarketingContentWalk` and mr-pass `test/acceptance/MarketingPagesHttp`;
  scenarios 10 (its page half) and 19): an author writes a post with text and one from a page, adds and removes a
  category, links it to a campaign and drafts a newsletter from it; a storeless landing page is published and a
  visitor subscribes from it; a private draft linked to a campaign is not public.

### P15 — Tracking links and capture

Design §8 TrackingLinks and TrackingLinkDetail (with "Capture on the authority"), §18 (the tracking URL and QR);
MKT-TRACKING, MKT-CONSENT; gate 5.

- **Mantle `mantle.marketing.TrackingServices`** (design §14.2 K): TrackingCode extended with its organization
  through the campaign, typed UTM source, medium and content, and a registered destination (F31);
  `find#TrackingLinks`, `store#TrackingLink` (HTTPS destinations on the site's hosts or the privileged external
  allowlist only), `get#TrackingLink` (the public URL and its QR from the barcode helper), and `record#TrackingEvent`
  (MarketingTrackingEvent: the code, an opaque visitor key, the site, the kind, the recipient only with
  `PcpTracking`, and what marks a known automated fetch); TrackingCodeVisit written too when the request has a local
  visit.
- **The public handlers** (F55, F79): the redirect and the pixel as web scripts of mr-pass, registered by `servlet`
  elements in a `MoquiConf.xml` of mr-pass's own (its first outside `test/`, loaded on the authority and on a remote
  frontend alike), with a `<rate-limit>` for their paths as mr-boss MoquiConf.xml:29-33 sets one. They decline the
  session (`ec.web.declineSession()`), run as the anonymous request (no `runAsSystem` in a web script), set the visitor
  key by a `Set-Cookie` header, and reach the authority through PASS's `Transport.js` `call()` (in process, REST or
  gRPC) with two schema operations, `marketing.resolveTrackingLink` and `marketing.recordTrackingEvent`, whose only
  fields are the code or token, the visitor key, the site and the kind, mapped to `TrackingServices`, so a remote
  frontend records there with no Mantle of its own; the destination comes only from the authority. They are not
  offered to pages, and each is added to the three `TOKEN_WRITES` lists if it writes under a token (impl-sales F73). Each is rate limited by client and code, sets
  nothing but the visitor key, and answers the redirect or the image even when recording fails. A disabled or expired
  link answers its configured safe destination or a neutral page, never a caller's URL. A send's links are rewritten at
  preparation to personalized opaque tokens only for a recipient with `PcpTracking`; the others get direct links and no
  pixel. PASS Marketing pages carrying a tracking code call the same operation.
- **Commerce** (impl-commerce §7, F28): Home's and OnlineSales' visits read Marketing's events for the store's
  sites; conversion follows in P20.
- **Screens:** TrackingLinks (LinkFind, LinkList, NewLink); TrackingLinkDetail (LinkDefinition, LinkOutput,
  LinkObservations); CampaignDetail's Tracking links tab; ExperimentDetail's click counts; the tracking-code choice
  of Sales' lead forms (P13).
- **Specs:** Mantle `test/marketing/Tracking` (an unregistered destination refused; no event with a recipient
  without `PcpTracking`; a link token expires and is in no log line; a scanner's fetch is marked and is no
  conversion; the redirect of a disabled link takes no URL from the request); PASS
  `test/Marketing/MarketingTracking` (an event recorded through the two routes with a visitor key and no party; a
  request with a destination of its own refused; a client over its limit still redirected and not recorded).
  Attack-Surface gains the two routes.
- **Usable when** (`test/acceptance/Marketing/MarketingTrackingScenario` and mr-pass `test/acceptance/MarketingTrackingHttp`):
  a campaign link's QR opens the landing page and counts one visit by visitor key, locally and through a remote
  frontend; a consenting recipient's click shows on the send and a refusing one's does not; Commerce's Home shows
  the store's visits.

### P16 — Events and registration setup, with the PASS Event page

Design §9 Events, EventDetail and RegistrationSetup, §13 Event; MKT-EVENT (its offer part), MKT-FORMS; stage M6.

- **Mantle `mantle.work.EventRegistrationServices`** (design §14.2 E): EventRegistrationPolicy (one occurrence's
  dated offer: window, seats, hold duration, waitlist, cancellation terms, site, an optional store),
  EventTicketType (a ticket product through WorkEffortProduct, its price source, capacity, sales dates and
  per-order limit), the registration form (a publication of purpose registration, P12) and
  EventCommunicationSchedule; `find#Events`, `store#RegistrationPolicy`, `store#TicketType`,
  `store#RegistrationForm`, `store#CommunicationSchedule`, `publish#Registration` (readiness: an occurrence, seats,
  a ready profile for the notices, a payment gateway of the organization when a ticket has a price). A recurring
  series registers per chosen occurrence.
- **PASS** (operation `marketing.getEvent`): `get#Event` and the Event page (PublicEvent: the approved description,
  dates and zone, location, ticket prices and advisory availability, terms); no attendee, resource or budget is
  public. The Event component a landing page embeds (P14).
- **Screens:** Events (EventFind, EventList, NewEvent through `EventServices.create#Event` and a campaign
  association); EventDetail, Commons' EventDetail included with the campaign fixed and the tabs Registration setup,
  Registrations and Check in linking P17's and P18's screens; RegistrationSetup (RegistrationPolicy, TicketTypes,
  RegistrationQuestions, EventCommunications, PublishRegistration); CampaignDetail's Events tab; QuickEvent; the
  video link of an online occurrence through EventDetail's "Add video call".
- **Demo data:** a free published webinar with a video link and a paid workshop with two ticket types and twelve
  seats, both of ORG_ZIZI_RETAIL.
- **Specs:** Mantle `test/work/EventRegistrationSetup` (capacity below held and confirmed refused; a paid ticket
  unpublished without a gateway; one occurrence's seats are not another's; another organization's event refused);
  BOSS `MarketingEvents` (RegistrationSetup's one qvt render); PASS `test/Marketing/MarketingEvents` (an unpublished
  or closed offer not available; no internal field in the answer).
- **Usable when** (`test/acceptance/Marketing/MarketingEventSetupWalk`): `marketing.events` makes an event with a
  campaign, sets two ticket types and questions, publishes it, and the PASS Event page shows the offer; the
  calendar's own permissions still decide who edits the event.

### P17 — Registrations, tickets and payment, with PASS Register and Registration

Design §9 RegistrationSetup's order rules, Registrations and RegistrationDetail, §13 Register and Registration,
§15.3 (the expiry, waitlist and notice jobs), §18 (the receipt, ticket and notices); MKT-EVENT, MKT-PUBLIC.

- **EventRegistrationServices**: EventRegistration (one per attendee; buyer, ticket, hold and state, the order,
  item and payment references, the campaign, the response, the entry credential's digest and revision) and
  EventRegistrationAction; `reserve#Registration` (occurrence and ticket capacity taken together under a lock, or a
  waitlist place that takes no seat), `confirm#Registration`, `complete#Registration` (answers per attendee and the
  accepted terms), `start#RegistrationPayment`, `find#Registrations`, `get#Registration`, `change#Registrations`,
  `cancel#Registration` (capacity released once; a refund handed to Accounting and shown pending), and
  `correct#Registration` (substitution revokes the old credential).
- **The ticket order** (X1, X9; F28–F30): a storeless sales order of the event's organization, taxed through the
  organization's gateway by X1, which impl-sales P7 builds in `calculate#OrderSalesTax` and this phase rests on (it is
  not built today, F30), or a store order when the policy names a store; either is placed through
  `mantle.order.OrderServices.place#Order`, as every order is; `start#RegistrationPayment` makes the
  `PapEventRegistration` attempt for the held order and answers the hosted payment step; the attempt's verified result,
  not the browser's return, confirms the held place, and its own authorization is what approves a storeless order (the
  placement SECA authorizes only store orders), through `mantle.order.OrderServices.autoApprove#Order` and never a
  status write of its own; a success after the hold expired becomes paid-unallocated review, never a seat. The order
  rules of design §9's table are checked one by one on a ticket order.
- **Where the seller's approval setting is on** (§4; impl-sales P9, P11): the organization's SalesPolicy is
  respected for a ticket order as for every sales order, so the paid order is not auto-approved: it stays placed,
  in Sales' Awaiting approval list, until a holder of `SALES_ORDER_APPROVE` approves it. The registration and the
  ticket follow the approval, not the payment: the verified payment keeps the held place, which no longer expires,
  and the registration stays pending; RegistrationReceipt and MyRegistration show it as pending, payment received
  and awaiting the organizer's confirmation, with the receipt and with no ticket, entry QR or event link. The
  order's approval confirms the registration and sends the ticket and its notice, once; an order cancelled instead
  cancels the registration, releases its capacity once and hands the refund to Accounting, shown pending. A free
  registration places no order and confirms as before. With the setting off, its default, the attempt's
  authorization approves and confirms at once, unless the order carries a pre-approval warning, which stops the
  auto-approval as for any order (impl-sales P9): the registration then waits for the approval in the same way.
  With the setting on the warnings are shown to the approver only.
- **Jobs:** hold expiry and FIFO waitlist offers; the event communications (one delivery per registration, schedule
  and trigger, transactional or promotional by its kind, through the ledger); each with `operation`,
  `operation-ref` and a `JobRegistration`. The registration and attendance triggers of P11 and the lead rules'
  registration trigger of P13.
- **PASS** (operations `marketing.reserveRegistration`, `completeRegistration`, `startRegistrationPayment`,
  `getRegistration`, `cancelRegistration`): Register (RegistrationChoice, RegistrationAnswers, RegistrationPayment
  on the hosted step Shop's checkout uses, RegistrationReceipt) and Registration (MyRegistration with the ticket and
  entry QR, CancelRegistration), by verified account or a registration-scoped capability: an ExternalAccess kind
  `EventRegistration` in ExternalAccess.js `records` with the scopes `RegistrationView` and `RegistrationCancel`,
  issued by the registration services (F80).
- **Hosts:** EventRegistration as a Chatter and RecordFiles host (EventRegistrationContent).
- **Demo data:** ORG_ZIZI_RETAIL's `PartyAcctgPreference.taxGatewayConfigId` set to `LOCAL`, so the storeless paid
  workshop is taxed by X1 (none is set today; the store's LOCAL is its own, F88).
- **Screens:** Registrations (RegistrationFind, Attendees, StaffRegistration, RegistrationBatch); RegistrationDetail
  (Registration, Answers, Attendance, RegistrationChange); Home's registrations card.
- **Specs:** Mantle `test/work/EventRegistrations` (two reservations of the last seat: one held, one waitlisted; a
  hold expires once and the first waiting place is offered; a late payment after expiry is review, not a seat; a
  duplicate payment result confirms once; a cancellation releases capacity once; a calendar RSVP is no seat; a
  storeless ticket order is taxed and approved with no store; with the seller's approval setting on a paid ticket
  order stays placed, its registration pending with its place held and no ticket, until the order is approved,
  which confirms it once, and a cancelled one releases the place); PASS `test/Marketing/MarketingRegistration` (a
  capability reads only its registration; a buyer does not read another attendee's answers; reservations over a
  client's limit refused and holding no seat); BOSS
  `MarketingRegistrations` (RegistrationDetail's one qvt render). Attack-Surface gains the Event and registration
  operations and the entry credential.
- **Usable when** (`test/acceptance/Marketing/MarketingRegistrationScenario` and mr-pass
  `test/acceptance/MarketingRegisterHttp`; scenario 13): a visitor registers free for the webinar and gets the video
  link; two visitors race for the workshop's last seat and one is waitlisted; a paid registration confirms on the
  gateway's result with tax from the organization's gateway and no store; a cancellation promotes the waitlisted
  attendee and its refund shows pending from Accounting; and for an organization whose Sales approval setting is
  on, a paid registration shows pending with its place held until the order is approved from Sales' Awaiting
  approval list, and then shows its ticket.

### P18 — Check-in

Design §9 CheckIn; MKT-EVENT; CX-DEVICE; gate 6. Admin P18's shared devices are built (F83).

- **EventRegistrationServices** `preview#CheckIn` and `checkIn#Registration`: the entry credential or an attendee
  lookup, the eligibility in words (confirmed, paid, used, cancelled, wrong event), one attendance fact per
  registration with the first result answered to a repeat, a manager's override with a reason that never invents a
  payment.
- **Screens:** CheckIn (EntryLookup with `scan-input` on a `density="handheld"` screen, EntryDecision, RecordEntry),
  online only, its terminal twin taking a typed or scanned code; RegistrationDetail's Attendance.
- **The shared door tablet** (F83; §4), on People's clocking kiosk (BossSetupData.xml:5672-5700): an artifact group
  `BOSS_DEV_MKT_CHECKIN` holding CheckIn and its transitions alone; the `moqui.security.DeviceRouteGroup`
  `MARKETING_CHECKIN` (owner Marketing, home `/apps/Marketing/Events/CheckIn`, parameter the event occurrence); and a
  display group `BOSS_MARKETING_CHECKIN_DEVICE` holding a new `MARKETING_CHECKIN` permission and a bundle opening
  CheckIn, its transitions and the two services alone, which `preview#CheckIn` and `checkIn#Registration` accept
  beside `MARKETING_EVENT_MANAGE` for the device's occurrence only. Staff still check in under their own sign-in.
- **Specs:** Mantle `test/work/EventCheckIn` (a second scan answers the first; a cancelled, unconfirmed or
  wrong-event ticket refused; a substituted attendee's old credential refused; an override recorded with its
  reason; a `MARKETING_CHECKIN` holder refused another occurrence); BOSS `MarketingAccess` gains the device group's
  case (CheckIn admitted, every other Marketing screen refused).
- **Usable when** (`test/acceptance/client/Marketing/MarketingCheckInWalk`, at 390 px; scenario 14): `marketing.events`
  checks in an attendee by code and another by name on a phone without horizontal scrolling, a repeat shows the
  first time, a cancelled ticket is refused, and cancelling the event stops its pending reminders.

### P19 — Promotions, Customer360 and engagement

Design §7, §10 Customer360 and ContactDetail; MKT-CAMPAIGN (associations), MKT-REPORT (engagement); stage M7.

- **The promotion mounts** (owner contract, Commerce; F22): `Shared/Promotions`, `PromotionDetail`, `PromoCodes` and
  `PromoCodeDetail` take their context from the mounting app; Marketing's gives the user's permitted stores, the
  selected campaign and a return link, and the Commerce promotion permissions still decide every read and write. A
  campaign-link section on PromotionDetail through `store#CampaignAssociation`; CampaignDetail's Promotions tab. The
  menu entry shows only when a store is configured.
- **Engagement:** `MarketingWorkspaceServices.get#Engagement`: a party's campaigns, memberships, sends and observed
  engagement, submissions, registrations, promotion use and consent, each source answered only with its own
  permission and omitted without it.
- **Party merges** (X15; design §10; F82), on Sales P3's pattern: a refusal with its reason code in mr-mantle
  PartyMerge.js `rules()` and a move block in DuplicateServices.xml `merge#Parties` (as :1114-1123). ContactListParty,
  PartyConsent and ContactListToken are moved today, but a ContactListParty key collision keeps the surviving party's
  row (:1022), so a withdrawal on the merged party is lost: the collision keeps the more restrictive state (a
  withdrawal or unsubscription wins). MarketSegmentParty, MessageSuppression, SubscriptionRequest and CampaignRecipient
  are moved; an enrollment or a registration that is not ended refuses the merge, naming it; captures are moved.
- **Screens:** Promotions and the three others at design §2's paths; Customer360 with Marketing's Engagement tab
  primary (the crosscut context Commerce and Customer Service mount, screen/Commerce/Customers.xml:27);
  ContactDetail, Commons' contact form mounted with Add to list (P3) and the Consent link.
- **Specs:** Mantle `test/marketing/Engagement` (a source without its permission omitted, never zero);
  `test/party/ContactBooks`, which covers `merge#Parties`, gains the Marketing guards (a merged party's withdrawal
  survives; a held registration refuses the merge or moves, as decided); BOSS `MarketingPromotions` (PromotionDetail's
  one qvt render in Marketing's context with the campaign link; a store of another organization not offered); the
  Commerce promotion specs unchanged.
- **Usable when** (`test/acceptance/Marketing/MarketingPromotionsWalk`): an author with Commerce's promotion permission
  links a store promotion to a campaign and generates codes from Marketing; one without it sees the link read only;
  Customer360 shows a contact's sends and registrations and no order to a user without the Sales reader's right.

### P20 — Attribution, reports and Insights

Design §11, §15.3 (the attribution and reporting jobs), §18 (the reports, the digest and the alerts);
MKT-TRACKING (attribution), MKT-REPORT.

- **Attribution** (X10): `TrackingServices.record#OrderAttribution`, added to P11's `handle#OrderPlaced`: for every
  placed sales order, the most recent eligible consented tracking event of the order's visitor key or party within
  the code's trackable lifetime, else the source opportunity's campaign; it writes TrackingCodeOrder (one row per
  order and type, as its key allows) and MarketingOutcomeLink (the one primary campaign of an outcome with its
  evidence time); a failure is logged and retried by the attribution job, never undoing the placement; a staff
  correction is a successor decision with a reason. Opportunities take their primary campaign at capture (P13).
- **Mantle `mantle.marketing.MarketingReportServices`** (design §14.2 R): `get#ReportCatalog`,
  `get#CampaignPerformance`, `get#DeliveryAnalysis`, `get#AudienceGrowth`, `get#Attribution` and
  `get#TrackingLinkResults`, each with its denominators, freshness and exclusions; `numSent` and
  `qualifiedLeadCount` kept as derived summaries; orders and invoiced revenue read from Sales' and Accounting's
  registered metrics (F34), never redefined.
- **Jobs** (design §15.3): the attribution retry, the incremental aggregation with its watermark, and retention
  (expired import files and rows, unconfirmed subscription requests, tracking events and link tokens past the
  policy's days, each item on its own; nothing a financial record needs), each with `operation`, `operation-ref`
  and a `JobRegistration`. Anonymizing on a person's request waits for the privacy provider (§7).
- **Insights** (impl-insights §7; owner contracts): the metrics `Marketing.Visits` and `Marketing.AttributedOrders`
  (`ironstone.insights.MetricRegistration`, as BossSetupData.xml:3741); the four catalog entries
  (`ReportCatalogEntry`, as Commerce's at :3483-3489); `report/boss-marketing-deliveries.json` and
  `boss-marketing-audience.json` with their BusinessDataset admission, dataset class, index readiness and refresh
  rows; a campaign dashboard; alert templates (a failure or complaint spike, a bounce rate over a threshold,
  uncertain deliveries older than N hours); the weekly campaign digest; attention providers (sends awaiting
  approval, failed and uncertain deliveries, held registrations); flow targets for the customer map's Marketing
  steps; the campaign-sent business annotation, a Mantle business event `CampaignSent` added to the fixed table of
  mr-mantle BusinessEvents.js and registered by `release#Send` and the winner release, since `create#Annotation`'s
  business source needs `REPORT_BUSINESS_ADMIN`, which only `ADMIN` holds, and `record#BusinessEvent` writes after
  the commit with authorization off (BusinessEventServices.xml:17-30; F85). The funnel stays Insights' (§7): `Marketing.Visits` is the
  visit step it and Sales' PipelineAnalysis read.
- **Commerce** (impl-commerce §7): conversion on Home and OnlineSales from the attribution rows.
- **Screens:** Reports (ReportCatalog, ReportDefaults) and CampaignPerformance, DeliveryAnalysis, AudienceGrowth and
  Attribution, each with its CSV and html-print from the same query; CampaignDetail's Results tab; ExperimentDetail's
  conversions; Home's cards complete.
- **Assist:** `AgentToolExposure` rows for `get#CampaignPerformance` and `preview#Audience`'s aggregates (Assistant
  Y, MCP N); nothing for dispatch, consent or addresses.
- **Specs:** Mantle `test/marketing/Attribution` (one decision per order from a Shop checkout, a Sales acceptance, a
  direct order and a ticket; a failed call leaves the order placed and the job writes one row; a later link edit
  changes no accepted outcome; an unknown identity is unattributed); `test/marketing/MarketingReports` (recipient
  and variant counts reconcile; accepted is not delivered; an untracked recipient is in no rate's denominator; a
  parent counts a descendant once; ROI unavailable without cost; two currencies not summed);
  `test/marketing/MarketingRetention` (an expired request and import removed once, a confirmed one kept, one
  failure named and the rest done); BOSS
  `MarketingReports` (CampaignPerformance's one qvt render; the catalog entries hidden without the report
  permission).
- **Usable when** (`test/acceptance/Marketing/MarketingReportsScenario`; scenarios 15 and 18): the four reports of the
  demo campaign reconcile to its recipients, events and orders; an order from the campaign's link through a remote
  PASS is attributed once; a partial refund reduces attributed revenue once; an Insights reader opens
  CampaignPerformance from the catalog and a user without Marketing's report permission does not see it.

### P21 — Calendar, shell providers and Assist

Design §3 Calendar, §1.3 (CX-ASSIST, CX-SYNC, the Comms hooks), §14.3 (Today, palette, notifications), QuickCreate;
MKT-SHELL, MKT-SYNC, MKT-ASSIST; gate 7.

- **Calendar:** Commons' Calendar component mounted (as Projects mounts it,
  screen/Projects/Projects/ProjectDetail/Plan/Calendar.xml:127) with the events of authorized campaigns and the
  read-only items of `MarketingWorkspaceServices.get#CalendarItems` (campaign windows, scheduled sends, sequence
  milestones, approved publication dates); only an event is dragged, through `update#EventOccurrence`; a send opens
  SendDetail; the terminal twin is the dated agenda. The read-only projected CalDAV collection "Campaign calendar": a
  Mantle seed row `mantle.work.calendar.CalendarProjection` `MarketingCampaigns` whose `ownerServiceName` is
  `MarketingWorkspaceServices.get#CampaignCalendar`, implementing `define#ProjectionOwner` (`admitted` for a holder
  of `MARKETING_VIEW`; the event maps of the authorized campaigns' windows, sends and milestones; F71).
- **Shell:** QuickCreate (QuickCampaign, QuickSend, QuickList and QuickEvent as mounts of their forms); the Today
  and palette sources complete, each failing by name alone; `record-lookup` for MarketingCampaign, CampaignSend and
  EventRegistration and `call-context` with the caller's upcoming registrations; the "Log as note" and "Send as
  message" response actions.
- **Assist:** the exposures rest on Mantle's active-organization user-facts provider, which Sales P6 builds (F86);
  the three skills with `screens:`, `skill/aliases.json` (campaign, send, list, segment) and
  `test/skill-retrieval.json` cases; SendDetail's "Why were recipients excluded?" prompt.
- **Specs:** BOSS `MarketingShell` (a failing provider named and the rest answered; no address or token in any
  shell row; Calendar's one qvue render); Mantle `test/work/CalendarDav` gains the projected collection (a device
  write refused).
- **Usable when** (`test/acceptance/client/Marketing/MarketingCalendarWalk`): the calendar shows a campaign's window, a
  scheduled send and an event; dragging the event moves it and the send cannot be dragged; a phone subscribed to the
  collection lists the same items read only; the palette finds a campaign and a send by name.

### P22 — SMS

Design §5 (the SMS channel of Sends and Compose), §6 (the Send SMS step), §12 SendingProfiles (SMS readiness), §13
EmailPreferences (SMS scope); MKT-TRANSPORT (its SMS part); gate 8 (M8). The framework channel it waited for is
built (F19). SMS is in this build, last, after the first release's gate (§4).

- **The ledger's SMS channel** (Comms', owner contract): `MdcSms`, handing a delivery to
  `org.moqui.SmsServices.send#SmsMessage` with `isPromotional`, from the profile's number; its answer is the
  delivery's hand-off outcome, and an uncertain text is never sent again. The framework keeps no row for such a
  text and reports nothing after the hand-off (F57): a receipt for a direct text reaches `note#DeliveryReceipt`,
  which finds no ChatBridgeDelivery row and drops it (F73), so DeliveryAnalysis shows hand-off outcomes for SMS and the
  receipt is a framework ask (§7).
- **The framework, first** (F72–F74; §5 Q6, the user's call): an `sms-consent` provider is declared only in an app
  root's `<shell-providers>` and asked of the apps the current user may open (moqui-core screen/shell.rs:172-187,
  :466-491, :521-563), so Mantle cannot register one and a dispatch running as the system may find none and be
  refused; and a text with no user counts against `smsSystemMaxPerDay` (500 a day, shared with sign-in codes), one
  with a user against that user's 200 and the 2000 of everyone, and needs the number granted to the user (call/Sms.js
  :36, :301-340). The recommended answer: a conf-level `sms-consent` provider a component registers (Mantle's), asked
  whoever sends, and a day limit per sending number for a promotional text, in mr-moqui in this phase.
- **Mantle's `sms-consent` answer** (F57): the hook gives only the two numbers, so the topic is not its to check.
  The ledger's attempt checks `PcpSms` consent on the topic and the suppression, as for email, before the call;
  the provider answers yes only for a number whose party holds `PcpSms` consent with the organization that owns
  the sending number and no suppression, and no otherwise. A STOP the framework keeps becomes a `PcpSms`
  withdrawal and a suppression, and a START ends neither without new evidence.
- **Profiles and content:** an SMS sending profile bound to one of the organization's messaging numbers, ready only
  with a messaging bridge; an SMS body with its encoding, segment count and the configured cost estimate shown
  before approval; phone numbers normalized from the contact's own country.
- **Screens:** the SMS channel offered in NewSend, Compose and SendDetail once a profile is ready; the Send SMS step
  in AutomationDetail; DeliveryAnalysis without an open rate for SMS; PASS Email preferences' SMS topics.
- **Specs:** Mantle `test/marketing/SmsSends` (no text without `PcpSms` on the topic; a STOP withdraws and
  suppresses once; an uncertain text not resent; no SMS choice without a ready profile; the provider answers no
  for a number with consent to another organization only), on the channel crate's test provider.
- **Usable when** (`test/acceptance/Marketing/MarketingSmsScenario`; scenario 7's SMS half): a text send to consenting
  members goes out with its segment estimate shown at approval, a member's STOP removes them from the next send,
  and an organization with no messaging number sees SMS not ready while its email sends work.

### P23 — Finish

- The tui and server-static screen sweeps of Marketing, one acceptance test per mode (each screen's twin is built in
  its phase), and the PASS pages' accessibility check at 390 px (scenario 16).
- The design §16.3 review, acceptance tests (§8): a user of each Marketing group with no other launcher is refused
  other organizations' campaigns, audiences, sends, registrations and reports, and every address without the
  audience permission, through URLs, transitions, imports, exports, the palette, choices, Assist tools, the PASS
  operations and direct services.
- The §18 outputs not built earlier.
- Attack-Surface read against the built endpoints (the eleven operations, the two tracking routes, the bounce
  accounts, the CheckIn route group if Admin P18 has landed), and the owners' designs against what was built for
  them (§2 owner contracts).
- The inventories' **Implemented in** columns, the design's Impl column, crosscut §1.3's register and §2's registry
  rows, Remaining-Work; the mr-boss and mr-pass READMEs' Marketing lines and mr-pass `docs/Deployment.md`'s
  Marketing app section.

## 4. Decisions

These are made before and during the build. Each one that changes the design is also written into
design-marketing.md or the owner's design.

| Date | Decision | Notes |
| --- | --- | --- |
| Nov 11, 2026 | People, Maintenance, Sales and Marketing are the next four apps, built in that order, each with its own plan and order; Marketing is last | The user's call (the planning request). Unlike Admin and Insights, which shared one order |
| Nov 11, 2026 | A connection between two of the four is built in the plan of the app built later; the earlier app's plan lists it in its §7, naming the plan that picks it up. This plan builds every Marketing connection to Sales, People and Maintenance (§1) | The user's call. §1 "Expected of the earlier apps" says what this plan needs them to have built |
| Nov 11, 2026 | PASS Marketing (design §13) is planned in this file, with mr-pass among the repositories and its pages as parts of the phases at the design's stages (P7, P12–P17, P22); there is no mr-pass plan for it | The user's call. Shop has its own design and plan; PASS Marketing has only design §13. It runs over Mantle with no BOSS at runtime |
| Nov 11, 2026 | This plan picks up everything the built apps left waiting on Marketing, each in the phase where its records exist (§1 scope) | The user's call |
| Nov 11, 2026 | Scope is every `parity` and `new` row of design §2 and the needs they use; `later` rows and later capabilities go to §7 | The user's call |
| Nov 11, 2026 | The order of §1 follows design §17's stages M0–M8, with these changes: M3 is not gated (the ledger is built); M8 is not gated (C1 and C4-SMS are built) and is the last stage, after the first release; the shell's frame is in P1 and each §1.3 contribution arrives with its records, the calendar, the remaining providers and Assist completing in P21 (design M1 names them at once); the privacy provider of M7 waits for Admin (below). The eight gates are M1, M2, M3, M4, M5, M6, the first release (M7) and M8, each a point where what is built is usable by itself: gate 2 has no promotional send yet, only templates, a ready profile, bounce intake and public subscription | The plan's choice; F12, F19. Design §17 and §21 changed |
| Nov 11, 2026 | MarketSegment's existing `ownerPartyId` is its X12 filter field; no `organizationPartyId` is added to it. MarketingCampaign gains `organizationPartyId` as designed | The plan's choice; F4. Design §1.1, §14.1, §19 and §20 changed; crosscut §1.4 changed |
| Nov 11, 2026 | The Comms ledger is extended for a campaign, not wrapped: the attempt refuses a suppressed destination (P3); a delivery may name a sending profile, and receipts are facts apart from the hand-off outcome (P6); a source may give the subject and body (P8, for the test message); a delivery carries its organization and its topic's consent (P9). These are Comms' changes, each in the phase that first sends with it | The plan's choice; F13, F14; placed at the review (F60). An owner contract, written into design-drawers-commons |
| Nov 11, 2026 | A Marketing send registers no mail outcome owner: it is a delivery of the ledger, which is registered | The plan's choice; F15 (impl-admin F163 expected a registration) |
| Nov 11, 2026 | Registry rows of a Mantle service are Mantle seed data (the import target, jobs, topics, recovery descriptors, delivery sources); rows of BOSS registries (settings, readiness, capability bundles, Insights' catalog, metrics, attention, flow targets) are BossSetupData | The plan's choice, as Commerce's channel import and recovery are registered (F35) |
| Nov 11, 2026 | One Mantle SECA, `OrderPlacedRecordAttribution`, and its handler `TrackingServices.handle#OrderPlaced` are made in P11 for the order-placed trigger; P20 adds `record#OrderAttribution` to the handler | The plan's choice: design §6 takes the trigger from that event, and automation (M4) is built before attribution (M7) |
| Nov 11, 2026 | A public subscriber is a Party from the request: `request#Subscription` makes or matches one without disclosing which, with a pending membership | The plan's choice; F43. ContactListParty and the ledger are keyed by party |
| Nov 11, 2026 | The BOSS `/u/` page stays; a list email's links name the PASS Account Email preferences page when the organization's site mounts Account, as built | The plan's choice; F25. Design §13 said `/u/` redirects |
| Nov 11, 2026 | Marketing's privacy provider waits for Admin's PrivacyServices, which is Admin's `later` (§7) | The plan's choice, as Customer Service's (impl-customer-service F211) |
| Nov 11, 2026 | CheckIn is built for a staff sign-in in P18; its device route group is registered when Admin P18 lands | The plan's choice; F36. Admin P18 is not built |
| Nov 11, 2026 | Marketing has no BOSS entity and no `ironstone.marketing` service but ContextServices | Design §14.1 and §14.2; Practices-App-Dev (BOSS entities are rare) |
| Nov 11, 2026 | The templates, sending profiles and suppressions screens are `Shared/` files Marketing builds for Comms, with Marketing's mounts only; Comms' own mounts wait for a Comms settings area | The plan's choice; F16 |
| Nov 11, 2026 (review) | Marketing registers its own readiness provider, `marketing.setup` over `MarketingWorkspaceServices.get#Readiness`, from P1 and growing by phase, as People's `people.setup` and Sales' `get#SalesReadiness` are; sending-profile readiness is one of its checks from P6. A provider owned by Comms waits for Comms' settings area | Was an open question recommending a Comms-owned provider. F49, F59; design-admin §14.2's Marketing row to change |
| Nov 11, 2026 (review) | Marketing registers a lifecycle participant in P2 for a departing user's campaign manager and contributor rows; approvals and scheduled sends are not a person's and are not moved | Was an open question. F59: Sales and People register theirs; neither design named Marketing's: design-marketing §14.3 changed, and design-admin §14 gains it |
| Nov 11, 2026 (reconciled) | The survey builder's generalization is People's: impl-people P16 makes the four shared screens read a per-app context registration and moves the form definition services to `mantle.party.FormDefinitionServices`, with Customer Service's behavior and specs unchanged. P12 adds Marketing's registration, its public purposes (lead, registration), option scores if People did not need them, and the publication services (`store#`, `publish#` and `close#Publication`, `create#Invitations`, `accept#Submission`, FormSubmission) in `mantle.party.FormPublicationServices` | The rule of the second row: People is built before Marketing and is the second app to mount the builder. The review had P12 do the generalization, reading an impl-people that added a branch to the form list only (F53) |
| Nov 11, 2026 | The audience import target (`marketingAudience`) names the app's own import permission, `MARKETING_AUDIENCE_IMPORT`, and no `ADMIN_*` permission: a wizard target whose wizard services check it beside `MARKETING_AUDIENCE_EDIT`, its runs finder answering by `MARKETING_AUDIENCE_VIEW` and the organization; the membership export asks `MARKETING_AUDIENCE_EXPORT` alone. Mantle seeds the permission, BossSetupData grants it to `BOSS_MARKETING_AUDIENCE`, and it is in that group's capability bundle (P1, P4) | The user's call, one answer for the four apps (impl-sales §4): each app has an import permission of its own. A target's permissions are all required (framework service/org/moqui/admin/DataTransferImports.js:37-41, DataTransferBatch.js:82), so `ADMIN_TRANSFER_RUN` beside Marketing's would shut its own users out; Admin's Imports lists a run for a data operator who also holds `MARKETING_AUDIENCE_VIEW` |
| Nov 11, 2026 (review) | P13 builds the PASS lead page and the lead rules only; SurveyDistribution with the lead purpose is the publishing screen, and Sales' LeadIntakeForms stays `later` | Was an open question. design-sales §2 marks it `later`; impl-sales §5 Q9 and §7 agree |
| Nov 11, 2026 (review) | The tracking redirect and pixel are web scripts of mr-pass, not framework files: the framework names no Mantle service | F55. Design §13.1's "framework web scripts" means the framework's web-script mechanism |
| Nov 11, 2026 | The regression budgets may be raised by this plan's estimates as its phases land, each raise by the phase's measured share: about 60 s on mr-mantle, 20 s on mr-boss's server budget and 8 s on its client budget, and on mr-pass the measured cost of its eight specs, a large share of that suite's 20 s. A raise beyond an estimate needs the user's agreement again. No spec may pass 15 seconds, as before | The user's call (AGENTS.md: a budget is raised only with the user's agreement). The estimate: about thirty Mantle specs, eighteen BOSS specs, eight PASS specs, the mail crate's tests and one client walk, at the earlier apps' measure (about two seconds a Mantle spec, about 20 s of server budget and 5 to 8 s of client budget an app). Today's budgets are mr-boss 264 s server and 57 s client, mr-mantle 393 s and mr-pass 20 s and 9 s (F38), before the three earlier apps' shares. A phase that would pass an estimate cuts a duplicate or moves a scenario to acceptance |
| Nov 11, 2026 | A one-person team may self-approve and dispatch a send to fewer than 500 recipients, by a MarketingPolicy flag that is off by default; the decision is recorded as a self-approval (P2, P9) | The user's call, as recommended (design §21.5). It relaxes the separation of approval and dispatch only under the flag and the limit; at 500 recipients or more the normal separation holds |
| Nov 11, 2026 | SMS is in this build, last (P22, gate 8), after the first release's gate. The phase order of §1 stands as written | The user's call, as recommended: nothing gates it, and its specs run on the channel's test provider. A deployment still needs a messaging bridge. Two P0 checks may send part of it back to the framework: a receipt after the hand-off, and the day limit a campaign's texts count against (F57) |
| Nov 11, 2026 | Store-sold tickets are later: this build sells tickets on PASS Register only, storeless unless the event's policy names a store (P17); a ticket in a Shop cart with other products is not built (§7) | The user's call, as the design recommended (design §21.4): it waits for a later Shop design; X9 settles payment either way |
| Nov 11, 2026 | The seller's SalesPolicy approval setting is respected for a ticket order: where it is on, the paid order is not auto-approved and stays placed until a holder of `SALES_ORDER_APPROVE` approves it; the registration and the ticket follow the approval, and the registrant sees the registration pending, payment received, with no ticket meanwhile (P17). A pre-approval warning stops the order's auto-approval as built, with the setting off too, and the registration then waits in the same way; with the setting on the warnings are shown on the approver's screen only (corrected by the user the same day) | The user's call (impl-sales §4, its P9 and P11): the setting is respected globally, whichever app placed the order. The ticket order is approved through `autoApprove#Order`, where Sales' rule is, so with the setting off, its default, the attempt's authorization approves and confirms at once |
| Nov 13, 2026 | The build order: Sales P1–P6 first, then Marketing as a second track beside Sales. Marketing P13 waits for Sales P5, Marketing P17 for Sales P7, P9 and P11, and Marketing P20 for Sales P19. At most three phase workers run at once; each phase is reviewed by a fresh agent and merged on its focused specs | The user's call; the same row is in impl-sales §4. Marketing keeps its own order (§1) and side-by-side pairs; a Marketing phase touching a file a Sales phase changes rebases on it (§1) |
| Nov 13, 2026 | The full suites run once at the end of the build, then Sales' and Marketing's acceptance tests once | The user's call, as People's and Maintenance's builds did; a phase's Done (§2) is its focused specs and their suites' budgets, and its acceptance tests are written, not run |
| Nov 13, 2026 | CheckIn's shared door tablet is built in P18, Admin P18 being built: a device route group, a display group and a `MARKETING_CHECKIN` permission on People's clocking kiosk pattern. This replaces the Nov 11 row that waited for Admin P18 | The user's call (Nov 13, as recommended). The plan's choice (F83); the new permission is §5 Q7, the user's call |
| Nov 13, 2026 | Sales' Accounts is mounted at `Marketing/Leads/Accounts` (P3) for the bulk action, beside Leads; design §2 gains the row | The user's call (Nov 13, as recommended). The plan's choice (F64): Sales' mount row admits Leads and LeadSources only, and impl-sales §4 (Nov 11) has Marketing mount Accounts; the design had no path for it |
| Nov 13, 2026 | Marketing's BOSS setup and demo go in files of their own (`data/BossSetupMarketingData.xml`, `data/BossZZMarketingDemoData.xml`), as Sales' and Maintenance's do | The plan's choice (F69), so Marketing's track and Sales' do not meet in one file |
| Nov 13, 2026 | §5 Q6 answered as recommended: P22 adds framework support in mr-moqui, a conf-level `sms-consent` provider a component such as Mantle registers, and a per-number day limit for promotional texts apart from `smsSystemMaxPerDay`; a campaign text is sent by the system, not as the releasing user | The user's call; F72, F74. P22 works in an mr-moqui worktree |

## 5. Open questions

| Question | Decides | Notes |
| --- | --- | --- |
| Q4. (answered Nov 11, §4) Store-sold tickets (design §21.4) | P17 | Later: tickets are sold on PASS Register only in this build; a ticket in a Shop cart is in §7. Nothing is open |
| Q5. (answered Nov 11, §4) Who may run the audience import? | P4 | A holder of `MARKETING_AUDIENCE_IMPORT` with the audience edit permission. Nothing is open |
| Q6. (answered Nov 13, §4) Before P22: how does a campaign text pass the framework's SMS consent hook and day limit? | P22 | The hook is declared only by an app root and asked of the apps the sending user may open, and a text with no user counts against the system's 500 a day (F72, F74). Recommended: in P22, a conf-level `sms-consent` provider a component registers (Mantle's), asked whoever sends, and a per-number day limit for promotional texts, in mr-moqui. The alternative, sending as the releasing user, spends that user's 200 a day and needs the number granted to them |
| Q7. (answered Nov 13, §4) Before P18: the new `MARKETING_CHECKIN` permission for a door tablet's display account | P18 | Recommended: yes, held by a display group alone, as People's `PEOPLE_KIOSK_PUNCH` (F83); without it the tablet waits (§7) and CheckIn runs under a staff sign-in |
| Further issues discovered during implementation | the affected phase | Record findings and decisions here |

## 6. Findings

Design assumptions found wrong or unstated in the code, with the resolution. Where a resolution changes the design,
it is written there too. F1–F52 were found on Nov 11, 2026, while writing this plan; F53–F63 at its review the same
day, against the code and the other three plans; F64–F89 by the rest of P0 on Nov 13, against master.

| # | Finding | Resolution |
| --- | --- | --- |
| F1 | P0: `screen/Marketing.xml` mounts only Chatter and RecordFiles and has no `<shell-providers>`. Its comment (Marketing.xml:15-17) says the grant is commented out; in fact `BOSS_MARKETING` (BossSetupData.xml:138-145) gives `ADMIN` and `BOSS_MARKETING_ADMIN` (:24) `AUTHZT_ALWAYS` on the root with `MANTLE_ACTIVE_ORG` and `MANTLE_PRIVATE_CONTACT`. There is no root user group or other Marketing group | P1 |
| F2 | P0: `screen/Marketing/` has nine flat placeholders (Home, Campaigns, Segments, Newsletters, Promotions, Content, Surveys, Reports, Settings), each a label; design §1.2 keeps `Marketing/Segments` and `Marketing/Newsletters` as redirects | P1 removes them and keeps the two redirects |
| F3 | P0: MarketingCampaign (MarketingEntities.xml:29-46) has no organization field and audit-logs only `statusId`; `convertedLeads` is type `id` (:42) as the design says; MarketingCampaignParty is dated (:74-83); the status flow is as design §14.1 lists it (:55-65) | P1 adds `organizationPartyId`; P2 the audit log on dates, budget and parties |
| F4 | P0: MarketSegment has an owner field, `ownerPartyId`, default `_NA_`, audit-logged on update (MarketingEntities.xml:301), which the contact merge already knows (ContactBookServices.xml:1184). Design §1.1, §14.1 and §19 say it has none and propose `organizationPartyId` | §4: `ownerPartyId` is the filter field. Design §1.1, §14.1, §19 and §20 changed |
| F5 | P0: MarketSegmentParty has no dates and no include or exclude kind (MarketingEntities.xml:341-348); the classification, geography and dimension rows are undated (:316-340) | P5 adds the dates and kind to MarketSegmentParty; the native rule rows change under the audit log |
| F6 | P0: ContactList has `ownerPartyId`, `isPublic`, `singleUse` and `archivedDate` (MarketingEntities.xml:97-112) and the legacy `verifyEmail*` and `optOutScreen` fields (:102-106), and no purpose, confirmation requirement, evidence text or publication interval; ContactListParty has a `revision` (:186) and the seven statuses of design §14.1 (:208-214) | P3 adds the policy fields, dated; P7 the publication |
| F7 | P0: `ContactListServices`' access model is the mailbox's (`get#ContactListAccess` :35, `get#UserMailboxAccess` :148); `create#ContactList` takes an `ownerPartyId` (:197) | P1 adds the organization check per verb, after P0's list of them |
| F8 | P0: `send#ContactListEmail` (ContactListServices.xml:659-690) skips a member only for a refused solicitation, a withdrawn consent, no address, a repeat or a disabled party, so unspecified consent sends; its `subject` is the CommunicationEvent's only, the email's being the template's | P9 sends through prepared recipients, never this loop; the approved subject on both |
| F9 | P0: PartyConsent has no organization (PartyEntities.xml:356-368); Commons M11 built consent as not per organization, "all marketing email" withdrawing for every organization | P3 adds a nullable `organizationPartyId`; a row without one stays global |
| F10 | P0: the consent purposes are PcpMarketingEmail, PcpSms, PcpPhone and PcpDataProcessing (PartyEntities.xml:382-385) and Commerce's PcpCartReminder and PcpReviewRequest (AccountHubSetupData.xml:7, :16), which the design does not list; the sources are PcsForm, PcsImport, PcsEmailLink, PcsStaff and PcsApi (:389-393). There is no PcpTracking or PcsCheckout | P1 seeds both; the store purposes stay Commerce's topics and are not Marketing topics |
| F11 | P0: Commerce's shared screens say Marketing mounts them later (Promotions.xml, Pages.xml headers); Customer Service's survey screens say the same (SurveyForms.xml header) | P12, P14, P19 |
| F12 | P0: the Comms delivery ledger is built (mr-pass impl-shop P6): MessageDelivery with its unique event, recipient, channel and template key (MessageDeliveryEntities.xml:11, :51-56), the six states (:63-68), the email channel only (:70), and `queue#`, `attempt#`, `record#DeliveryReceipt`, `run#Deliveries` and `resolve#Delivery` (MessageServices.xml:6, :42, :52, :65, :81). Design §17 gates M3 on it and §21.1 asks when | M3 is not gated (§4). Design §17 and §21 changed |
| F13 | P0: the ledger as built does not carry a campaign: its recipient is a required party (MessageDeliveries.js:35) and its key is by party, not destination; it sends `send#EmailTemplate` with the template key and body parameters only (:196-202), so no subject, body, sender, server or bounce address per delivery; consent is one purpose, or one list's latest row (:111-143); there is no suppression check, organization or per-profile throttle (tries 5, batch 200, :22); `resolve#Delivery` needs `MESSAGE_DELIVERY_REVIEW`, which only `ADMIN` holds (MessageServices.xml:81-83) | §4: extended in P3 (suppression), P6 (the profile, receipts), P8 (content) and P9 (organization, topic consent, the permission) |
| F14 | P0: a receipt is recorded as an attempt's outcome on the one state (MessageDeliveries.js:251-268), so a permanent report after Sent makes the delivery Failed; there is no delivered, bounced or complaint fact apart from the hand-off | P6 adds receipt facts that never move an earlier one back |
| F15 | P0: the ledger is registered as an owner of mail outcomes (`moqui.server.MailOutcomeOwner` `mantleDeliveryLedger`, mr-mantle data/ShopFulfillmentSetupData.xml:23-25; `find#MailOutcomeOwners` and `recover#OwnedMailOutcome`, MessageServices.xml:99, :109) | §4: a Marketing send needs no registration of its own |
| F16 | P0: MessageSuppression, MessageTemplate and MessageSendingProfile exist nowhere; `mantle.party.MessageServices` exists and holds the ledger's services, so design §14.2's G services are added to it; Comms has no settings area (`screen/Comms/` holds Consent and Moderation only) | P3, P6; Comms' mounts later (§4, §7) |
| F17 | P0: `send#EmailTemplate`'s interface takes no subject, sender or bounce address (the parameters of `org.moqui.EmailServices.send#EmailTemplate`); the bounce address is the template's (BasicEntities.xml:1266; moqui-mail implementation.rs:165); `send#Email` and `send#EmailTemplate` take a `body` and `bodyText` (mail/EmailServices.xml:23-38) | P6: a `subject` and `bounceAddress` per call (framework) |
| F18 | P0: the framework already reads bounces for mail an edge node relays: a VERP sender `bounce+<item id>@` the edge's bounce domain (moqui-mail edge_mail.rs:27, :90), a DSN reader (:118) and a template's message marked `ES_BOUNCED` (:1081); the edge replaces any other envelope sender with its own (:622). Hosted accounts take a plus tag (delivery.rs:22, :85). Nothing reads an ARF report. Design's starting point says nothing reads bounces | P6 takes both paths into `process#DeliveryReport` and adds the ARF reader. Design's starting point changed |
| F19 | P0: SMS is built, not a stub: `org.moqui.SmsServices.send#SmsMessage` on C4-SMS (SmsServices.xml:19-24; plans/archive/Comms-Framework.md:6), refusing a promotional text unless an `sms-consent` provider says yes (call/Sms.js:278-288; ProviderInterfaces.xml:149); no Mantle provider answers it; a system text keeps no delivery row and is not retried (docs/interfaces/SMS.md "The system's texts"); STOP and START are the framework's | M8 is not gated; P22. Design's starting point, §17 and §21 changed |
| F20 | P0: FormPublication and FormInvitation are built in `mantle.party` (FormPublicationEntities.xml:27, :72; impl-customer-service P13) with the purposes case feedback and survey (:58-59), three access kinds (:61-63) and a context entity and ID (:36-37) in place of a campaign field; the only shared service is `guard#FormResponse` (FormPublicationServices.xml:20), which guards an invited response alone; there is no FormSubmission and no publication or invitation service outside `CaseFeedbackServices` | P12 builds Commons' services, FormSubmission and the lead and registration purposes |
| F21 | P0: the four survey screens are shared files with Customer Service's context only, calling `ironstone.customerservice.FeedbackServices` and `mantle.request.CaseFeedbackServices` (`create#FeedbackForm` :24, `publish#FeedbackForm` :40, `save#FeedbackFormField` :53); another app root sees "not available". The dated fields, successors and dependencies the builder needs are the framework's (ScreenServices.xml:429-525). DbForm has no organization (ScreenEntities.xml:419-434) and an option no score (:522-531) | impl-people P16 (the context registration, `FormDefinitionServices`); P12 adds Marketing's registration and the scores (§4; F53) |
| F22 | P0: the shared promotion and page screens call `ironstone.commerce.ContextServices.get#SharedContext`, which refuses another app root (Promotions.xml, Pages.xml, PageDetail.xml always-actions) | P14 and P19: the context comes from the mounting app |
| F23 | P0: X14's extension is built: PublicSitePage has `appMountId`, `routePath`, `locale` and dates (PublicEntities.xml:104-115). But the page services are bound to the `shop` mount and its store (SitePages.js:183, :336, :452, :689) and to `COMMERCE_*` permissions (:21) | P14: a `marketing` mount with an organization and `MARKETING_CONTENT_EDIT` |
| F24 | P0: a PASS app is registered in Mantle's `PublicApps.js` (:8-38; `support` with an organization target and a readiness service, :24-28), in mr-pass `service/pass/Apps.js` (:15) and by its operations in `service/pass/Schema.js` (:1037-1042), answered by mr-mantle `script/PassAuthority.js`. There is no `marketing` app | P7 |
| F25 | P0: the PASS Account Email preferences page is built (mr-pass screen/Account/EmailPreferences.xml; impl-shop P6), and `create#UnsubscribeToken` names it when the site it is given, or else a PASS site the recipient belongs to, mounts Account; otherwise the BOSS `/u/` page (ConsentServices.xml:1227-1237). The BOSS page (screen/Unsubscribe.xml) is still its own page, not a redirect | §4: both stay. Design §13 changed; F56 for the site |
| F26 | P0: the checkout opt-in is built without `request#Subscription` (impl-commerce §4, Nov 6): the buyer's choices on StoreCheckout (StoreOptInEntities.xml:8-19), granted or left pending through the consent services and confirmed by the receipt's link (StoreTopics.js:303-370) | P7 records the store-news choice through `request#Subscriptions`; the receipt link stays its verification |
| F27 | P0: cart recovery's sender choice is the built-in one only (`recoverySender`, StoreAdmin.js:790), and a store set otherwise is refused as OTHER_SENDER (CartRecovery.js:172) | P11 |
| F28 | P0: `PapEventRegistration` is seeded (AccountingPortalEntities.xml:92) and known to the coordinator (PaymentAttempts.js:25), whose attempt takes an order and a site with no store (:38-56); no worker selects the purpose (ShopCheckout.secas.xml:12 selects Shop's) | P17 |
| F29 | P0: `authorize#OrderPayments`, which `OrderPlacedAuthorizePayments` calls (AccountingPayment.secas.xml:17-20), returns at once for an order with no store (PaymentServices.xml:1614-1615); design §9's table says the rule authorizes a ticket order's payment. `OrderPlacedStoreConfirmation` (OrderReturn.secas.xml:27) is not in the table | P17: the attempt's own authorization approves a storeless order, through `autoApprove#Order`, so a seller's approval setting, or a pre-approval warning, holds it placed (§4). Design §9 changed |
| F30 | P0, corrected in the reconciliation: X1 is not built for an order. `calculate#OrderSalesTax` finds its gateway through the store alone and returns when there is none (mr-mantle service/mantle/other/TaxServices.xml:94-98); the fallback to the organization's gateway in `SalesTax.js` `gateway()` (:192-197) serves an invoice's tax and the rate sample, not an order's (impl-sales F8, F47) | impl-sales P7 builds X1; P17's ticket order rests on it (§1 "Expected of the earlier apps") |
| F31 | P0: TrackingCode has no organization, UTM or registered-destination field (MarketingEntities.xml:354-366); TrackingCodeOrder is keyed by order and type (:386-388), TrackingCodeVisit by a visit (:415-418) | P15, P20 as designed |
| F32 | P0: SalesOpportunity has `marketingCampaignId` and `dataSourceId` (SalesEntities.xml:40-41) and SalesOpportunityTracking exists (:91-96); `mantle.sales` holds only AccountServices and SalesReportServices | §1: OpportunityServices and `store#LeadIntake` are Sales' build |
| F33 | P0: `EventServices` has the verbs design §9 names (`create#Event` :542, `check#EventAccess` :585, `update#EventOccurrence` :745, `cancel#EventOccurrence` :1092, `respond#EventInvitation` :1356, `send#EventInvitations` :1510, `book#Resource` :1896); WorkEffortProduct (WorkEffortEntities.xml:912), OrderItemWorkEffort (OrderEntities.xml:675), ProductDbForm (ProductDefinitionEntities.xml:383) and OrderItemFormResponse (OrderEntities.xml:498) exist; there is no registration record or service | P16–P18 as designed |
| F34 | P0: the registered metric IDs are `Sales.Orders`, `Sales.OrderValue` and `Accounting.InvoicedRevenue` (BossSetupData.xml:3741, :3755, :3768), not the `orders.placed` and `revenue.invoicedNet` design §11 cites | P20 cites the registered IDs and registers `Marketing.Visits` and `Marketing.AttributedOrders`; design §11, §16.1, §19 and §20 changed |
| F35 | P0: the registries as built, and how an app registered: a settings entry and a readiness provider (`ironstone.admin`, AdminEntities.xml:21, :79; Commerce's rows BossSetupData.xml:2569-2575); capability bundles (`moqui.security.CapabilityBundle`, Commerce's :2728-2770); an owner-wizard import target with its runs finder (mr-mantle data/StoreChannelSetupData.xml:59-64) and its route key (ironstone/shared/DataImport.js:18-27); a recovery descriptor (StoreChannelSetupData.xml:42); job and topic registrations (AdminConfigurationData.xml:376, :407); Insights' catalog entry, metric, attention provider, flow target, dataset class and dataset admission (BossSetupData.xml:3483, :3741, :3863, :4545, :4786, :3280) | Each in its phase (§1 scope) |
| F36 | P0: Admin P17 (audit evidence) and P18 (the device credential and route groups) are not built; impl-admin P18 proposes a display account for a device | P18 here is planned from the design; P0 checks again |
| F37 | P0: Admin's PrivacyServices and request page are Admin's `later` (impl-admin §7); design §10 has Marketing register a privacy provider | §4, §7 |
| F38 | P0: the regression budgets are mr-boss 264 s server and 57 s client, mr-mantle 393 s, mr-pass 20 s and 9 s (each `test/budget`) | §4: the user approved raises up to the plan's estimates |
| F39 | P0: Mantle has `test/marketing/ContactListSend`, `test/party/Consent` and `test/party/DeliveryLedger`; mr-boss has no `test/Marketing/` | The three pass unchanged (§2); P1 starts `test/Marketing/` |
| F40 | P0: `create#WikiBlog`, `update#WikiBlog` and `get#UserWikiSpaces` exist (WikiServices.xml:3106, :3139, :3010), and the baseline WikiBlogs and EditWikiBlog forms (mr-marble SimpleScreens/Wiki) | P14 as designed |
| F41 | P0: the baseline promotion, promo code and survey forms design §16.2 maps exist (mr-marble SimpleScreens/ProductStore/Promotion, Survey) | P12, P19 as designed |
| F42 | P0: the built apps mount Commons' Notifications for approvals (screen/CustomerService/Approvals.xml:31) and seed their approval topics in BossSetupData (:523, :1571), not in a Commons file as design §3 says of Marketing's three | P2 seeds the three with Marketing's data |
| F43 | P0: ContactListParty is keyed by party (MarketingEntities.xml:182-184) and a ledger delivery needs one (F13), so a pending public subscription cannot be an address alone; design §14.1 allows a "provisional address" | §4: a Party from the request |
| F44 | P0: the email ECA and filing rules design §15.1 keeps exist: `ListUnsubscribeMailto` (MantleConsent.emecas.xml:18) and `EmailMessageFiling` (EmailMessage.eecas.xml:21) | Kept as designed |
| F45 | P0: `MANTLE_USER_ORG` (MantleSetupData.xml:253-265) has no row for a marketing entity | P1 |
| F46 | P0: mr-boss `report/` holds the built apps' dataset definitions (`boss-commerce-*.json`, `boss-service-*.json`) and `skill/` their skills with `aliases.json` | P20 and P2, P5, P8 follow them |
| F47 | P0: Commons' Calendar is mounted by other apps as a component (screen/Projects/Projects/ProjectDetail/Plan/Calendar.xml:127) and its Knowledge as a subscreen (screen/CustomerService/Knowledge.xml:29) | P21, P14 |
| F48 | P0: Customer360 is one shared screen with four mounts (CustomerService/Customers.xml:22, Commerce/Customers.xml:27, Accounting/Receivables.xml:17, Insights/Records.xml:37) | P19 adds Marketing's |
| F49 | P0: design-admin §14.2's Marketing row names its settings path and `MARKETING_CONFIGURE` and no readiness provider, while impl-admin §7 lists one as waiting | §4: Marketing's own provider (F59) |
| F50 | P0: Comms' Consent screens (screen/Comms/Consent/List.xml, Contact.xml) are built with `ironstone.comms.ConsentServices`, for contact administrators only (impl-drawers-commons M11) | P3: the mount's reads and writes go by `MARKETING_CONSENT_EDIT` and organization |
| F51 | P0: `ExternalAccessServices` has `create#`, `check#` and `revoke#AccessCapability` (ExternalAccessServices.xml:19, :51, :100); FormInvitation is over it for case feedback | P12, P17; the kinds are P0's to check |
| F52 | P0: no People, Maintenance or Sales service or screen this plan uses exists yet; `screen/Sales/`, `People/` and `Maintenance/` are placeholders | §1 "Expected of the earlier apps"; P0 checks when they are built |
| F53 | P0 (review), corrected in the reconciliation: the review read an impl-people whose P16 added an `appRoot` branch to `Shared/SurveyForms` alone, and so made P12 do the generalization. impl-people P16 makes all four survey screens read a per-app context registration and moves the form definition services from `mantle.request.CaseFeedbackServices` (F21) to `mantle.party.FormDefinitionServices`, with People's purposes private to assigned respondents (its F51) | P12 adds Marketing's registration, the public purposes, the publication services and option scores (§4); P0 reads what People built |
| F54 | P0 (review): Sales' names differ from the ones this plan used: the screens are `Sales/Pipeline/Leads`, `Sales/Accounts/Accounts` and `Sales/Settings/LeadSources` (design-sales §2), built in impl-sales P4, P3 and P2 with UtmSourceMap in P5; `store#LeadIntake` is P5's and `find#Opportunities` P4's; every placement goes through `mantle.order.OrderServices.place#Order` (its §2; `place#SalesOrder` in its P11 is Sales' guard over it). impl-sales §7 also leaves "the campaign and tracking choices on a lead" to this plan, which had no phase for it. Its phases now name the campaign input of `store#LeadIntake` (P5), the campaign and source filters of `find#Opportunities` (P4) and what makes Leads, Accounts and LeadSources mountable (its §2) | §1 and P3, P13 use Sales' names; P13 and P15 build the choices |
| F55 | P0 (review): a web script is a component's script registered by a `servlet` element of a conf (`docs/interfaces/Web-Scripts.md`; mr-mantle MoquiConf.xml:11 registers `PassApi`), not a route in mr-moqui; mr-pass has no conf outside `test/`. This plan put the redirect and pixel routes and their test in the framework, which would name a Mantle service there | P15: mr-pass scripts and a PASS spec; nothing in mr-moqui; P0 checks the registration (§4) |
| F56 | P0 (review): `create#UnsubscribeToken` picks the PASS page of the site it is given, else of a site the recipient is a party of (ConsentServices.xml:1232-1234), never of the sending organization. A subscriber who belongs to no PASS site would get the BOSS `/u/` link though the organization's site mounts Account | P9 makes each token for the sending organization's site; P0 checks the parameter. Design §13 corrected |
| F57 | P0 (review): the `sms-consent` hook carries the two numbers only (ProviderInterfaces.xml:148-153) and is asked through `call#Providers`, so it cannot check a topic; a system text keeps no delivery row, is not retried, and counts against `smsSystemMaxPerDay` when no user is given (`docs/interfaces/SMS.md` "The system's texts"). P22 had the hook checking the topic and the provider's receipts recorded | P22: the ledger checks the topic; the hook answers for the number and organization; receipts and the day limit are P0 checks (§5 Q3) |
| F58 | P0 (review): the client deny pattern's longest row is 237 characters of a 255-character field (BossSetupData.xml:445, :459). People's P1 takes it to 244; `maintenance` would take it to 256 and the next longest to 252, so impl-maintenance P1 splits both rows as it adds its name; impl-sales P1 adds `sales` and splits none (its F25) | P1 adds `marketing` to the rows as it finds them and splits any that would pass 255, which none should: the longest is 254 with `marketing` |
| F59 | P0 (review): Sales and People each register their own readiness provider (`get#SalesReadiness`, impl-sales P2; `people.setup`, impl-people P1) and a lifecycle participant (impl-sales P6; impl-people P5), on the built contracts (AdminEntities.xml:21, :225; BossSetupData.xml:2559, :4060). This plan proposed a Comms-owned provider with its fix in Marketing's settings, and left the participant open | §4: Marketing's own provider in P1 and participant in P2 |
| F60 | P0 (review): two phases sent before the ledger could: P6's walk needs a delivery with a VERP address, and P8's test message a delivery with its own subject and body, both of which this plan built in P9 | The profile on a delivery moved to P6 and source-given content to P8 (§4) |
| F61 | P0 (review): three things design names had no phase: the merge guards of X15 (design §10; only a P0 check), the retention part of design §15.3's "Reporting and retention" job, and a job registration for the attribution retry | P19 (guards), P20 (jobs) |
| F62 | P0 (review): no phase planned abuse handling of the public endpoints beyond the verification mail's limit, or the update of `docs/security/Attack-Surface.md` | §2 "Public endpoints are bounded"; P7, P12, P15, P17 and P23 |
| F63 | P0 (review): P15's walk opens P14's landing page and its PASS pages carry its codes, so P15 does not run beside P14; P14 named an Event component that P16 builds; P3 named Marketing's ContactDetail, which is P19's | §1 order; P14, P16, P3 corrected |
| F64 | P0 (Nov 13): Sales' mount row (mr-boss service/ironstone/sales/Sales.js:30-33) admits the Marketing root for `Pipeline/Leads` → `Leads` and `Settings/LeadSources` → `Settings/LeadSources` only, and its `sharedLinks` hold just those two (:184-188), so a lead shows unlinked under Marketing and every transition stays Sales' guarded service; Accounts is not admitted (impl-sales F110), and design §2 had no Marketing path for it | P3 adds `Accounts/Accounts` → `Leads/Accounts` (Marketing/Leads/Accounts; §4, design §§2, 10), P19 `Accounts/Customer360` → `Customers/Customer360`. §1, P3 changed |
| F65 | P0 (Nov 13): LeadList's row selection (screen/Sales/Pipeline/Leads.xml:90-128) is shown only with `canEdit` (SALES_OPPORTUNITY_EDIT) and its two actions carry no condition; row selection takes a condition per action and renders in qvt and tui only (framework xsd/xml-form-3.xsd:161, :177-182); its key is `id@revision` and a row names its account but no contact (mr-mantle SalesOpportunities.js:841-884). AccountList (screen/Sales/Accounts/Accounts.xml) has no row selection | P3: the selection admits the audience editor, Sales' actions take `canEdit`, Marketing's the audience capability; each selected lead's contacts are resolved through Sales' services, one with none named as its failure; AccountList gains its selection. P3 changed |
| F66 | P0 (Nov 13): `find#Opportunities` (mr-mantle service/mantle/sales/OpportunityServices.xml:262-300) filters by one `marketingCampaignId` and one `dataSourceId` and refuses a caller with no Sales read (PERMISSION_DENIED); LeadList shows the campaign as its id (Leads.xml:186) and takes the campaign as a parameter (:35, :50) | P13: handoff counts for a `MARKETING_VIEW` holder come from Marketing's own MarketingLeadCapture rows; the campaign column shows its name. P13 changed |
| F67 | P0 (Nov 13): consent on Sales' ContactDetail is the Commons contact record's Consent tab (mr-boss template/ContactRecord.xml:876-889, included by every app's ContactDetail), read only through `ironstone.comms.ConsentServices.get#ContactConsent` (template/ConsentRecord.xml:55-75), its link going to `/qapps/Comms/Consent/Contact` for a contact administrator (`isConsentAdmin`) only | P3: the tab links a holder of `MARKETING_CONSENT_EDIT` to Marketing's Consent mount (owner contract, Commons), which Sales' ContactDetail then shows. P3 changed |
| F68 | P0 (Nov 13): Sales' P5 (`store#LeadIntake`, SalesLeadIntake, the lead-source map, UtmSourceMap), P6 (user facts), P7 (X1), P9 and P11 (the approval setting, `place#Order` from a quote) are not on master; nothing writes SalesLeadIntake or SalesOpportunityTracking yet (F87). impl-sales P5 names the inputs this plan expects (organization, source kind and id, name, email, phone, UTM source and medium, campaign, tracking code, default source, team queue, operation key; one lead per source identity; a repeated key answers the first result) | Checked by the phase that needs each, against the Sales phase as merged: `store#LeadIntake` at Marketing P13 against Sales P5; X1 and the placement at P17 against Sales P7, P9 and P11; the user facts at P21 against Sales P6. §1, P13 changed |
| F69 | P0 (Nov 13): Sales' setup is `data/BossSetupSalesData.xml` and its demo `BossYSalesAccountsDemoData.xml` and `BossZSalesDemoData.xml`, as Maintenance's is in its own file; the deny pattern's fifteen rows in BossSetupData.xml now name `sales`, the longest 244 characters, 254 with `marketing` | §4: Marketing's setup in `BossSetupMarketingData.xml` and demo in `BossZZMarketingDemoData.xml`; P1 adds `marketing` to the rows with no split, as F58 expected. §1, P1 changed |
| F70 | P0 (Nov 13): People's survey builder as built: the four shared screens read the mounting app's row of mr-boss `service/ironstone/shared/SurveyApps.js` `apps` (Customer Service's, People's; :1-60), and each purpose is a `mantle.party.FormPurpose` row (mr-mantle entity/FormPublicationEntities.xml:72-104: edit and view permissions, scope service, access kinds, own services; People's in data/PeopleRecruitingSetupData.xml:59-70); `FormDefinitionServices` has `create#`, `get#`, `find#Forms`, `rename#Form`, `save#FormField`, `save#FormCondition`, `end#FormPart` and `publish#Form` (FormDefinitionServices.xml:24-147), and `FormPublicationServices` `guard#FormResponse` and `open#Publication` (:20, :28); `FppSurvey` is seeded (:59), no lead or registration purpose, no option score | P12 adds Marketing's SurveyApps row and three FormPurpose rows, builds on `open#Publication`, and adds the scores. §1, P12 changed |
| F71 | P0 (Nov 13): the projected calendar kind: a `mantle.work.calendar.CalendarProjection` row (projectionId, title, `ownerServiceName`; mr-mantle entity/WorkEffortEntities.xml:153-158) seeded by its owner, the owner service implementing `CalendarDavServices.define#ProjectionOwner` (`checkOnly`, `start`, `end` → `admitted`, `eventList` of ICalendar maps; CalendarDavServices.xml:158-174), a write refused 403 (:399-400); People's and Maintenance's rows (data/PeopleLeaveSetupData.xml:35, MaintenanceStackData.xml:19-22) | P21 seeds `MarketingCampaigns` over `get#CampaignCalendar`. P21 changed |
| F72 | P0 (Nov 13): an `sms-consent` provider is declared only in an app root's `<shell-providers>` (crates/moqui-core/src/screen/shell.rs:172-187, :357-368) and asked of the apps the current user may open (:466-491, :521-563), each in its own transaction, one "no" vetoing and none refusing (base/framework call/Sms.js:279-319); none is registered today. Mantle, with no screen, cannot declare one, and a dispatch running as the system may find none | §5 Q6, the user's call before P22: recommended a conf-level provider in mr-moqui in P22. P22 changed |
| F73 | P0 (Nov 13): `send#SmsMessage` answers `successful`, `messageId` and `reasonCode` (SmsServices.xml:36-41); a direct text goes through `send#BridgeDirect`, which keeps no row (chat/ChatBridgeServices.xml:716-720), and a provider receipt reaching `note#DeliveryReceipt` (moqui-channels webhook.rs:280-318) finds no ChatBridgeDelivery row and is dropped (ChatBridgeServices.xml:679-713) | P22: hand-off outcomes only for SMS; the receipt a framework ask (§7). P22 changed |
| F74 | P0 (Nov 13): SMS day limits (call/Sms.js:36, :301-340): with no `userId` a text counts against `smsSystemMaxPerDay` (500, shared with sign-in codes); with one, against that user's 200 and everyone's 2000, and the from-number must be granted to the user; the from-number sets no limit | §5 Q6 with F72. P22 changed |
| F75 | P0 (Nov 13): `create#UnsubscribeToken` takes `siteId` (mr-mantle ConsentServices.xml:1166-1180) and, given one, names that site's Account Email preferences page without checking the recipient's membership; without it, a `baseUrl` gives `/u/`, else the recipient's first PASS site mounting Account, else `/u/` (:1225-1237) | F56 settled: P9 passes the sending profile's permitted site. P9 changed |
| F76 | P0 (Nov 13): the bounce account is a hosted account made in Comms' account wizard (base/basic-comms screen Settings/MailAccounts/Add/Address.xml:37-43; MailSettingsServices.xml:552-631); Admin's MailRelays make none; the plus tag is stripped to find it (crates/moqui-mail/src/delivery.rs:66-104). The edge replaces any envelope sender with `bounce+<item id>@` its bounce domain when `edge_mail_bounce_domain` is set (edge_mail.rs:621-627), matches a DSN by the queue item and marks the EmailMessage `ES_BOUNCED` (:1047-1085); `send#EmailTemplate` takes no subject or bounce address (framework service/org/moqui/EmailServices.xml:17-58), the subject being the template's expanded with `bodyParameters` (implementation.rs:480-487) | P6: the VERP path on a hosted bounce account the readiness checks, and on the edge path an EmailMessage turning `ES_BOUNCED` matched to its delivery by `providerMessageId`; F17's per-call subject and bounce address stand. P6 changed |
| F77 | P0 (Nov 13): the list services' access is the mailbox model: for any other list `get#ContactListAccess` answers header and post for anyone (mr-mantle ContactListServices.xml:116-119), and `update#`, `find#ContactLists`, `find#ContactListParties`, `join#`, `add#`, `remove#`, `decline#ContactListParty` and `set#ContactListPartyDelivery` restrict only a mailbox (:253-646); `create#ContactList` takes any owner (:197, :220); the list sends are `allow-remote="false"` with no check. Consent checks only a private contact. Callers: the Forum on mailboxes (Forum.js:743, :3063, :3148); Comms' Consent through `check#ConsentAdmin` (mr-boss service/ironstone/comms/ConsentServices.xml:31); Shop's store topics through the internal `set#ContactListPartySubscription` on lists its store's organization owns (StoreTopics.js:104, :263, :274) | P1: the check in the non-mailbox branch and on `create#ContactList`'s owner, a contact administrator and ADMIN keeping every list; internal services unchanged. P1 changed |
| F78 | P0 (Nov 13): `fancy-locked-html` renders only by location with an explicit map (impl-sales F70; crates/moqui-core/src/script/host/globals.rs:697-711), a location may be `dbresource://` (context/resource.rs:464, :507), and a name the map lacks reads null, rendering empty with no error (script/template.rs:1440-1446); the renderer keeps no allowlist: the map is it | P6: a template's content is a `dbresource://` `.html.fancy-locked` file rendered with a map of its declared variables, an undeclared one refused at store by the template service. P6 changed |
| F79 | P0 (Nov 13): mr-pass has no conf outside `test/MoquiConf.xml`; a remote frontend loads framework, webroot and PASS only (mr-pass README.md:12-14, docs/Deployment.md:3-11) and reaches the authority through `service/pass/Transport.js` `call()` (:599; in process, REST to Mantle's PassApi, gRPC); a web script runs as the request's user, may not `runAsSystem`, declines the session with `ec.web.declineSession()` and sets a cookie only by a `Set-Cookie` header (docs/interfaces/Web-Scripts.md:110-122, :167-181); the framework has no per-servlet limit but a component's `<rate-limit>` (mr-boss MoquiConf.xml:29-33) | P15: a MoquiConf.xml of mr-pass's own with the two servlets and their limit, two allowlisted operations to the authority. Design §13.1 changed. P15 changed |
| F80 | P0 (Nov 13): ExternalAccess kinds are code, mr-mantle service/mantle/party/ExternalAccess.js `records` (:25-150), each with its issuer permissions and scopes, and the scope is the action scope (one per check, :301-316; revoked per scope, :376-381); FormInvitation's kind has the scope `CaseFeedback` and issuer `SUPPORT_CASE_MANAGE` (:131-145); tokens are stored as a digest (:222) | P12: the FormInvitation kind gains Marketing's scope; P17: a kind `EventRegistration` with `RegistrationView` and `RegistrationCancel`. P12, P17 changed |
| F81 | P0 (Nov 13): no InvoiceItem, AcctgTransEntry, Budget or BudgetItem carries a campaign (mr-mantle AccountingAccountEntities.xml:654, AccountingLedgerEntities.xml:820, AccountingOtherEntities.xml:26, :67); both lines carry a cost center; Accounting's budgets are by GL account and period, their organization through the TimePeriod (BudgetServices.xml:108, :429); a ledger read is ACCOUNTING_VIEW, GL_POST or ADMIN, a payable read adds PAYABLE_VIEW (InvoiceWorkflow.js:102, :412; InvoiceServices.xml:4403) | P2: a CampaignCost cites a purchase invoice item or a ledger entry of the campaign's organization under the reader's own permission; no Accounting budget applies. Design §3 changed. P2 changed |
| F82 | P0 (Nov 13): `merge#Parties` (mr-mantle DuplicateServices.xml:792) guards through PartyMerge.js `rules()` (:59-88) and moves WorkEffortParty, CommunicationEventParty, ContactListParty, PartyConsent and ContactListToken (:1039-1052), a ContactListParty key collision keeping the surviving party's row (:1022), so a merged party's unsubscription is lost; MarketSegmentParty, MessageDelivery, FormInvitation and ExternalAccessCapability are not touched. Sales P3 added a refusal in `rules()` and a move block (:1114-1123) | P19 on that pattern, the collision keeping the more restrictive state; the ledger's, Commons' and ExternalAccess' rows are their owners' (§7). P19 changed |
| F83 | P0 (Nov 13): Admin P18 is built: `moqui.security.DeviceRouteGroup` (framework entity/SecurityEntities.xml:472-498) with its artifact group, home path and parameter; a device's request runs as the credential's display account, which may hold no privileged group or sealed permission (crates/moqui-core/src/user/device.rs:398, :589-600), and passes only what the route group's artifact group admits (:770-822); People's clocking kiosk registers one with a display group holding `PEOPLE_KIOSK_PUNCH` alone (mr-boss data/BossSetupData.xml:5672-5700) | §4: P18 builds the door tablet; `MARKETING_CHECKIN` is §5 Q7. Design §9 changed. P18 changed |
| F84 | P0 (Nov 13): Admin P17's audit is read only: `find#Changes` over EntityAuditLog through `moqui.server.AuditProjection` rows (framework AuditServices.xml:15-104; ServerEntities.xml:818-848), registered by the framework and mr-mantle data/PartyAuditData.xml only; no service records an administrative event; PartyConsent's audited status has no projection | Marketing registers no projection, as Sales (impl-sales F57); Admin's F257 is the user's call (§7) |
| F85 | P0 (Nov 13): `org.moqui.report.ReportServices.create#Annotation` with the business source needs `org.moqui.report.annotation.business` (crates/moqui-report/src/annotations.rs:13-29), held by `REPORT_BUSINESS_ADMIN`, which only ADMIN has (base/tools data/MonitoringSecurityData.xml:43-50); Mantle's `BusinessEventServices.record#BusinessEvent` writes one after the commit with authorization off, for the fixed events of BusinessEvents.js (:21-46, :65, :99) | P20: a `CampaignSent` business event registered by the release. P20 changed |
| F86 | P0 (Nov 13): no component registers a `user-facts` provider (framework conf/MoquiDefaultConf.xml:1058-1060 is a commented example); Sales P6 builds Mantle's (impl-sales F65) | P21's exposures rest on it; Sales P6 is before Marketing's track (§4). P21 changed |
| F87 | P0 (Nov 13): nothing writes TrackingCodeVisit, TrackingCodeOrder, TrackingCodeOrderReturn or SalesOpportunityTracking in any component or crate; only their definitions exist (mr-mantle MarketingEntities.xml:354-418, SalesEntities.xml:188) | P15 and P20 as designed; Sales P5 writes SalesOpportunityTracking |
| F88 | P0 (Nov 13): the demo: ORG_ZIZI_RETAIL owns POPC_DEFAULT (its store's tax gateway LOCAL, mr-mantle data/ZcaProductDemoData.xml:196) and the gateways TEST_APPROVE and BOSS_COM_HOSTED (mr-boss data/BossCommerceDemoData.xml:74-90), and the PASS site ZIZI_SHOP, made by Commerce's demo service, disabled until published, with Account, Billing, Support and Shop mounts (BossZCommerceDemoData.xml:15-19; service/ironstone/commerce/Demo.js:16); ORG_ZIZI_SERVICES owns BOSS_COM_DIGITAL and ZIZI_DIGITAL; no organization has a seller tax preference (impl-sales F62). A run captures mail with `mail_capture_sends=true` (docs/dev/JS-Testkit.md:341-346) | P1's users of ORG_ZIZI_RETAIL and ORG_ZIZI_SERVICES as written; P7 adds the Marketing mount to ZIZI_SHOP; P17 sets ORG_ZIZI_RETAIL's tax preference. P17 changed |
| F89 | P0 (Nov 13): the earlier plans' §7 rows naming this plan: impl-sales §7 (P3, P5, P11, P13, P15, P17, P20, under the names §1 uses), impl-people §7 (P12, P21, CheckIn's route group), impl-maintenance §7 (none) | Consistent with §1, but for Accounts' mount (F64), which impl-sales F110 already names |

## 7. Later

Designed, not in this build:

- **The design's later capabilities** (§17, §21): cross-store promotion programs, loyalty and referrals; the
  Publishing app's editorial workflow, taxonomy and public blog rendering; social and channel campaign sync; a
  branching journey canvas; multi-touch attribution; conference tracks and booths; attendance from call legs; camera
  and offline check-in; certification, timed exams and live quizzes; a block email builder (§21.3); campaign stages
  and tags on a generic record tag (§21.7); tickets in a Shop cart (§21.4; later by the user's call, §4); more than
  two experiment variants; WhatsApp and the other C4 channels.
- **The privacy provider** (§4): Marketing's find, export and anonymize of consent and membership history,
  suppressions, recipients, tracking events, submissions and registrations, when Admin's PrivacyServices and the
  PASS Account privacy page are built.
- **What waits on Admin P18:** nothing since it is built (F83), unless §5 Q7 is answered no: then CheckIn's device
  route group and a door tablet's credential.
- **Audit projections** (F84): Marketing registers no `moqui.server.AuditProjection`; its audited fields show in its
  own History panels, as Sales' and People's do. Whether a business entity belongs in Admin's AuditChanges is Admin's
  F257, the user's call.
- **Comms' own mounts** of MessageTemplates, SendingProfiles, Suppressions and CampaignDelivery, with a Comms
  settings area and a readiness provider of its own; moving the store emails and the Forum's notices onto sending
  profiles.
- **Insights':** the campaign to revenue funnel over Marketing's visits and attribution; multi-touch over the same
  events.
- **Sales':** LeadIntakeForms as Sales' own publishing screen; rule-based lead assignment.
- **Owners' later work found here:** a retry of a failed ledger delivery by its owner's operator beyond the
  ledger's own five tries; receipts for direct texts, which the bridge drops today (F57, F73); the edge relay keeping
  an app's VERP envelope sender, so a bounce through the edge needs no EmailMessage match (F76); the merge moving
  MessageDelivery, FormInvitation and ExternalAccessCapability rows, which stay on the merged party today (F82; Comms'
  and Commons').

## 8. Verification

- **Per phase,** the "Done" rule of §2.
- **End to end,** run `./moq run`, sign in as each demo Marketing user, and walk each built phase's "usable when" in
  order; open the demo site's Marketing pages as an anonymous visitor and a signed-in account, locally and through
  a remote frontend with only framework, webroot and PASS installed.
- **Design §16.3 scenarios,** each an acceptance test (`./moq accept mr-boss`, `./moq accept mr-pass`, when asked):

| Scenario | Phase |
| --- | --- |
| 1. Organization and private contacts | P1, P3, P5; P23's review walk |
| 2. Adoption and mailbox compatibility | P1 (adoption), P3 |
| 3. Audience explanation | P5; P8 (a prepared send gains no recipient) |
| 4. Import and merge | P4 |
| 5. Subscription and unsubscribe | P7 |
| 6. Approval and dispatch | P2, P8, P9 |
| 7. Transport recovery | P9; P6 (reports); P22 (SMS opt-out) |
| 8. A/B isolation | P10 |
| 9. Automation | P11 |
| 10. Content safety | P8 (variables, HTML, attachments), P14 (drafts, storeless pages) |
| 11. Public forms and Sales | P12 (forms), P13 (the handoff) |
| 12. Historical responses | P12 |
| 13. Event capacity and payment | P17 |
| 14. Check-in and notices | P18; P17 (notices) |
| 15. Report reconciliation | P20 |
| 16. Devices and surfaces | each phase's walk (actions present for its role and absent for a reader); P23's sweeps and the 390 px checks of P18 and P23 |
| 17. Bounces and complaints | P6 |
| 18. Attribution at placement | P20; P15 (the remote visit) |
| 19. Blog posts | P14 |

- **Walks.** One golden-path client walk for Marketing in the regression suite (MarketingSendWalk, from P9); the
  others are acceptance tests. No screenshots.
