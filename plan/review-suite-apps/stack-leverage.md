# Review: stack leverage across the eight designs

Reviewer pass, Nov 1, 2026, of the Oct 31, 2026 drafts. Built an inventory of what mr-moqui, mr-mantle, mr-boss and mr-pass provide to apps, then checked the eight designs and the crosscut needs roll-up against it. Paths are relative to the mr-moqui repository root unless the report gives a shorthand; reference-app paths are under `~/work/moquiwork/3p_other/`. The coordinated decisions and dispositions are in [review-suite-apps.md](../review-suite-apps.md); this file is the reviewer's report as delivered.

1. **Summary**

- The designs use little of what the stack offers. The framework already has Assist and MCP, CalDAV/CardDAV, WebRTC call links, SIP with IVR and voicemail, transcription, AI tasks, Web Push, shipped report definitions with alert rules, `scan-input` with handheld density, locked templates, iMIP invitations and QR barcodes. None of the eight designs registers an Assist skill, an `assist-prompt` provider or an `AgentToolExposure` row. The grep counts are 0 in every file. Assist is mentioned only as a place data might leak (design-people.md:34, design-commerce.md:102). mr-boss has no `skill/` directory, and its `shell-providers` declare no `assist-prompt`, `response-action` or `page-action`.
- The suite has no rule for how an app plugs into the stack beyond palette, Today and quick create (CX-SHELL, design-crosscut.md:2587). Nothing says how an app contributes Assist/MCP tools, Sync collections, mail intake actions, delivery, shared-device sessions or shipped report definitions. Admin §14 "Shared registration contracts" (design-admin.md:784-799) is the natural place to add them, and §6 below drafts the crosscut text.
- **Sync write guard (verified).** Two CalDAV write paths change records without going through services:
  - A to-do changed from a phone sets `WorkEffort.statusId` directly (mr-mantle CalendarDavServices.xml:292-298).
  - An event changed from a phone is written directly too (CalendarServices.xml:888-893, cancel at :945). No booking check runs on that path.
  - The Tasks collection holds every assigned `WetTask` with no purpose or template filter (CalendarDavServices.xml:116-121). Maintenance steps and templates would therefore be editable from a phone.
  - One suite rule is needed before Maintenance or People ship.
- **Several needs proposed as new already exist:**
  - email intake actions (`EmailRuleAction`, MantleSetupData.xml:354-356);
  - a lazy tree view, which covers People's OrgChart (`view-tree`, xml-form-3.xsd:333);
  - `scan-input` and `density="handheld"` (built; crosscut still says "proposed");
  - `run#Extract`, which covers Sales QuoteExtraction;
  - the `fancy-locked-html` renderer, which covers Marketing's template needs;
  - QR SVGs from the barcode helper;
  - iMIP invitations and `.ics` export.
- **First-release screens depend on framework work that nobody has named or gated:**
  - SMS in Marketing's first release needs Comms C1 and C4-SMS, neither built.
  - People's ClockingKiosk needs a device credential that can sign a browser in, and app passwords never sign in to the web (Sync.md:27).
  - Marketing CheckIn's "optional camera" has no camera scanning in the framework.
  - People's promise that Assist cannot leak protected data needs a per-field AI opt-out.
  - Assist needs the Mantle provider that tells it the active organization.
- **Remaining-Work.md does not link the BOSS roll-up**, although design-doc-guide.md:205-208 says it does. It is also stale on Comms: it says "None of it is implemented yet" at :57-58, while Comms-Framework.md:3-6 lists most of it as built. And crosscut §7.4–§7.11 are index tables with no Kind column, so the framework items cannot be picked out of them.
- **Two groups of duplicate designs should each share one contract:**
  - Four offline or kiosk designs (Maintenance, Marketing, People, Shop POS) should share one offline approach on moqui-browser.
  - The five delivery ledgers should share one delivery record built on the framework's own delivery machinery.
- Ten small suite-level additions in §5 are nearly free with what is built.

2. **Capability inventory**

| Capability | Status | Where | Apps that use it in the designs | Apps that should |
|---|---|---|---|---|
| Mail out/in, IMAP/POP sync, OAuth, SMTP listener, filing, email ECAs, account rules | built (live-account checks pending) | Mail-Inbound.md:118-133; Remaining-Work.md:27-39 | all (notices); Marketing keeps the unsubscribe emeca (design-marketing.md:1416) | People, Maintenance, Sales, Shop for intake |
| Mail rule action runs an app service (`EmailRuleAction`) | built (Projects P5) | MantleSetupData.xml:354-356; design-projects.md:2454; moqui-mail settings_tests.rs:968 | Projects only | People (applications, receipts), Maintenance (requests), Sales (RFQs, leads) |
| Address-routed inbound mail (route entity + emeca) | built (Forum) | ForumEntities.xml:426; ForumInbound.emecas.xml | Forum | only where the public route address is the identity |
| Chat, record rooms, `ext-action`/`ext-panel`, providers (`record-lookup`, `record-link`, `create-from`, `meetings-source`, `recipient-source`, `call-context`) | built (A0–A4, V5) | Comms.md:140-186; xml-screen-3.xsd:536-610; mr-boss screen/Comms.xml:44-64 | Comms (task, request and event only; screen-extend/basic-comms/screen/BasicComms/Chat.xml:19-27) | Sales, Maintenance, People, Commerce |
| `contact-card`, `invitation`, `home-source`, `external-conversation` hooks | planned (declared only) | Comms.md:177-178; xml-screen-3.xsd:599-610 | none | Sales, People, Marketing |
| WebRTC SFU, call links with guests and lobby, TURN | built (W1–W4) | WebRTC.md:50-66; Comms-Framework.md:3-6 | none | People interviews, Sales meetings, Maintenance vendor help, Marketing webinars |
| SIP trunks, IVR, queues, transfer, registrar, voicemail | built (V1–V5; Telnyx unverified) | SIP.md; Voicemail.md | none | Sales line, Commerce/CS support |
| Recording, captions, `CallTranscript`, `transcribe#Audio`; `speech-local` | built (W5, W6); speech-local is a stub | WebRTC.md:73-116; Voicemail.md:68-75; SpeechServices.xml:22 | none | Sales, Maintenance; People only with speech-local |
| SMS | stub; planned C4-SMS after C1 | SmsServices.xml:16-33; Comms-Framework.md:831-837, 1201 | Marketing (as its own adapter) | Marketing, Shop/Commerce notices |
| WhatsApp, Telegram, Slack, Matrix, XMPP | planned (C3–C6) | Comms-Framework.md:1199-1210 | none | Commerce/Shop, Marketing |
| Durable delivery: SystemMessage queue and retry jobs; `send#EmailMessage` deliveryOutcome; C1 delivery rows | built / built / planned | SystemMessageServices.xml:135; MoquiSetupData.xml:96; EmailServices.xml:56; Comms-Framework.md:383-391, 562-570 | Commerce channels | Marketing, Shop, Commerce, Sales (R-LV-05) |
| Web Push / PWA | built (P0) | SecurityEntities.xml:537-573; web_push.rs:23, 287 | implicit | all (push policy per topic) |
| CalDAV, CardDAV, WebDAV, SFTP, app passwords | built (no sync-collection, scheduling or free-busy-query) | Sync.md; Remaining-Work.md:75 | Admin links only (design-admin.md:492) | People, Maintenance, Sales, Marketing |
| Mantle calendar: iMIP invites, reminders, free/busy, resource booking, `.ics` | built | EventServices.xml:637, 1382, 1621, 1768, 2000; EventDetail.xml:196 | Maintenance (booking), Marketing (ICS) | People interviews, Sales, Maintenance due work |
| Git hosting, merge requests, gitECA → tasks | built | Git-Hosting.md:281-306 | none | Commerce themes (per-file) |
| Revisions, version notes, change sets | built | Revision-Management.md:167-212 | Shop releases (implicit) | — |
| Co-editing (`m-coedit`, yrs) | partial: `WikiPage:` records only | moqui-collab/src/lib.rs:20-23; Revision-Management.md:372-399 | none | Sales proposals, Marketing content, as wiki pages |
| Token routes (public shell) | built | Revision-Management.md:401-430; mr-boss MoquiConf.xml:15-22 | crosscut chose PASS pages instead (design-crosscut.md:2345-2347) | — |
| Datasets, Explore, dashboards (incl. funnel and node graph), `report-embed`, alert rules, report schedules (PDF/PNG/CSV/xlsx), git sync, shipped `report/*.json` | built | Monitoring.md:232-342; mr-mantle/report/*.json | Insights | every domain app ships definitions (R-LV-10) |
| Business-operation telemetry (`operation`, `operation-ref`), OTLP, scrape | built | Monitoring.md:32-40, 126-187 | none | Marketing §15.3, Commerce §11.2, Shop §8.4, Maintenance meters |
| Search: universal search, palette, file text, hybrid with `LlmEmbedder` | built; semantic partial (no live model) | Remaining-Work.md:96-101; Gateway.md:124 | all (palette) | Shop catalog |
| `html-print`, PDF, server printers | built | PrintServices.xml:17-129 | all | — |
| Barcodes, GS1, QR, DataMatrix | built | Barcodes.md:3-6 | People badge (design-people.md:1725) | Maintenance tags, Marketing QR, Sales quote QR |
| `scan-input`, `density="handheld"`, list views board/calendar/tree | built | xml-form-3.xsd:333, 490, 1312; xml-screen-3.xsd:115; Warehouse/Handheld.xml | Warehouse | People, Maintenance and Marketing kiosks; People OrgChart |
| XLSX read, images | built | SpreadsheetServices.xml:20; ImageServices.xml:20 | imports | — |
| Assist: screen/search/data tools, approvals, skills, canvases, inline text actions, dictation, response actions | built (no live-model check) | Assist.md; LLM-A2A-Assist.md:3, 699-786 | only as a leak path | all (R-LV-01) |
| AI tasks (`run#Summarize/Classify/Extract/Translate/Generate`), `propose#AiFieldValue`, `AgentTrigger` | built | Assist.md:1211-1260 | none | Sales extraction, People receipts, Maintenance triage, Insights digest |
| MCP and A2A servers and clients | built, off by default; OAuth 2.1 / OIDC planned | MCP.md:83-172, 268; A2A.md:245 | Admin links | per app through `AgentToolExposure.exposeMcp` (LLM-A2A-Assist.md:258) |
| TUI (SSH, browser terminal, agents drive it) | built | TUI.md:54, 92, 103 | all (TUI twins) | field roles over SSH |
| Wasm browser host (OPFS SQLite) | partial: no login, no tab lock, no local authority | Remaining-Work.md:150-156; archive/Wasm.md "Status", "Not in scope" | none | Maintenance MT-14, offline kiosks, check-in, POS |
| Web scripts, outbound REST | built | Web-Scripts.md:1-18, 178 | none | Marketing tracking, provider callbacks |
| Locked templates `fancy-locked(-html)` | built | crates/moqui-core/src/script/template.rs:347-356 | Shop (design-shop.md:853-856) | Marketing, Sales, People letters, Commerce emails |
| Staff SSO, PASS SSO and registration, app passwords | built | sso/AuthServices.xml:20; public/AccountServices.xml:25-124 | Admin, Shop | — |
| Commons: calendar and events, tasks, drives, Knowledge with co-edit, approvals, consent, contacts and books, DbForm, polls | built | impl-drawers-commons.md:658-680; ScreenEntities.xml:382, 533 | all | — |
| Comms: Inbox, Compose, `EmailTextBlock`; sending profiles | built; sending profiles proposed | BasicEntities.xml:1155; design-drawers-commons.md:406 | Marketing | — |
| PASS: sites, accounts, Forum, InvoicePay, `ExternalAccessCapability` | built | AccountingPortalEntities.xml; design-crosscut.md:2349-2360 | Sales portal, Shop, Marketing public | — |
| Projects: work items, time and timers, Timeline `.qvue` | built | design-crosscut.md:2638 (M11) | People, Maintenance (time) | People ShiftRoster (R-LV-N19) |

3. **Suite-level leverage decisions**

| ID | Decision | Recommendation | What users gain | Size | Files that change |
|---|---|---|---|---|---|
| R-LV-01 | **Assist/MCP contract per app** | Each app ships:<br>• `skill/*.md` procedure skills with `screens:` (they show as chips; LLM-A2A-Assist.md:788) and `skill/aliases.json`;<br>• `test/skill-retrieval.json` (LLM-A2A-Assist.md:782);<br>• `assist-prompt` and `response-action` in its root `shell-providers` (xml-screen-3.xsd:748-772);<br>• `AgentToolExposure` seed rows only for services no screen covers, each with `exposeAssistant`/`exposeMcp` decided by confidentiality class.<br>HR, payroll and grievance services get `exposeMcp=N`. `data-entity` patterns never name HR or payroll packages: the MCP/Assist `data` tool reads them with authorization off (LLM-A2A-Assist.md:714). | "Close this work order", "Explain my leave balance" and "Issue this quote" work through approvals; vetted tools for outside agents | M (S per app) | crosscut §1.3 and a new CX-ASSIST row in §7.1; Admin §14 (add "Assist registration"); each design §1 and needs table; mr-boss/skill/ |
| R-LV-02 | **Sync writes go through services** | CalDAV and CardDAV adapters write only through owner services. Managed work efforts (maintenance roots and steps, process executions, templates, protected People tasks) are read-only in the Tasks collection, or their status goes to the domain transition. An event PUT on an event with a managed resource goes through EventServices' booking guard. | Phones cannot skip lifecycle gates or bookings | S–M | crosscut §1.3 rule and §8 Decided; Maintenance §13.2 and People §16.2 list CalendarDavServices among guarded callers; mr-mantle CalendarDavServices.xml:292-298 and CalendarServices.xml:888-893, 945 (evidence); Sync.md:98-105 |
| R-LV-03 | **Domain calendars on phones without copying rows** | Add a read-only projected calendar kind to Mantle `get#DavCollections`, answered by an owner service with the owner's checks. Today the kinds are only Personal, Shared, Resource and Subscription (WorkEffortEntities.xml Calendar seed), and collections come only from Calendar rows (CalendarDavServices.xml:150-152). Uses: team absence and shifts (People TeamCalendar is a projection, design-people.md:1560), my work orders and due PM, the campaign calendar, interviews. | Leave, shifts and work in the phone's calendar | M | crosscut §3.13; Commons §7; mr-mantle CalendarDavServices; People §13, Maintenance §7, Marketing §3 |
| R-LV-04 | **One mail-intake contract** | Inbound business mail uses `EmailRuleAction` enumerations (the action names its service in `optionValue`) plus plus-tag intake addresses, as Projects does (design-projects.md:2454). Address-routed emecas (the Forum pattern) only where the route address is the identity. Name the actions: `createApplication`, `createExpenseLine`, `createMaintenanceRequest`, `createLead`, `createQuoteRequest`. | "Forward the receipt or RFQ to an address" works in every app | S per app | crosscut §4 (new "Mail intake" contract); People PE-04/PE-13; Maintenance MT-02/MT-10 (design-maintenance.md:550 has no need ID); Sales SAL-CRM/SAL-QUOTE; Mantle seed |
| R-LV-05 | **One durable delivery record** | The four outbound ledgers (MKT-SEND, SHOP-OUTBOX, COM-OPS, Sales reminders) plus Forum's ForumOutbox share one Mantle delivery record and worker. Build it on `send#EmailMessage`'s retryable/permanent/uncertain outcome (EmailServices.xml:56) and the SystemMessage retry jobs, and align it with C1's leased delivery rows (Comms-Framework.md:383-391), so SMS and bridges join without a redesign. | One delivery view, one retry rule, one uncertain-outcome screen | L | crosscut §4.8 and §7 (new CX-DELIVERY); design-marketing.md:1648; design-shop.md:1246; design-commerce.md:926; design-sales.md:1433; Comms-Framework §4.1 (consumers) |
| R-LV-06 | **Shared-device (kiosk) sessions** | One contract for People ClockingKiosk (PE-05), Maintenance TechnicianKiosk (MT-13), Marketing CheckIn and Manufacturing ShopFloor:<br>• a device credential limited to one route group;<br>• each person identified per action by a badge `scan-input` resolver plus PIN;<br>• `density="handheld"` and an idle timeout;<br>• Admin owns registration and revocation.<br>Needs framework support (R-LV-N10). | Clock in, execute work and check in on shared tablets the same way | M | crosscut §1.3 and CX-SHELL; Admin §4 and §14; People PE-05; Maintenance MT-13; Marketing CheckIn |
| R-LV-07 | **One offline contract** | Maintenance OfflineExecution (MT-14), Marketing offline check-in (design-marketing.md:1608), People offline kiosk (design-people.md:1821) and POS (design-commerce.md:861) all use moqui-browser. Drafts only, with operation-key replay (the Maintenance §10 model), consistent with "no browser-local authority" (archive/Wasm.md, "Not in scope"). Prerequisites, named once: a browser login flow and a Web Locks lock per database (Remaining-Work.md:150-156). | One offline story and one gate | L (later) | crosscut §8 and §9; Maintenance MT-14 (cite moqui-browser); Remaining-Work wasm rows name these consumers |
| R-LV-08 | **Meetings use call links on events** | A meeting is an event with a CallLink (Commons design, design-drawers-commons.md:794, 818; not built, impl-drawers-commons.md:665), and `send#EventInvitations` carries it to outsiders by iMIP (EventServices.xml:1382). People interviews, Sales meetings, Maintenance vendor help and Marketing webinars mount this. No per-app guest-link needs. | One "Add video call" everywhere; outsiders get a standard invitation | S | Commons §7 and EventDetail; crosscut §3.13; People InterviewsCalendar; Sales; Marketing Events; Maintenance |
| R-LV-09 | **Comms acts on every app's records** | Each app adds its record types to BOSS `record-lookup` and `create-from`, puts `ext-action`s in the `chat-message-actions`, `message-actions`, `voicemail-actions` and `call-actions` slots (Comms.md:181-186), and answers `call-context` with its open records. Transcripts (`CallTranscript`) are filed through the record room. Policy: HR and People calls keep no captions or transcripts unless `speech-local` is used. | "Create lead from this voicemail", "Report a problem from chat", a screen pop showing open orders and work orders | S per app | crosscut §3.14 and §4; Sales §1.3; Maintenance §1.2; People §1; Commerce §1.2; mr-boss screen-extend/basic-comms |
| R-LV-10 | **Each app ships report definitions and operational alerts** | Every domain app ships `report/*.json` (datasets, one dashboard, alert-rule templates) as mr-mantle does (Monitoring.md:315-321) and declares `operation`/`operation-ref` on long-running services (Monitoring.md:32-40). These replace the bespoke "operational measures" lists (design-marketing.md:1449-1466; design-commerce.md:821-834). Insights admits them. | Alerts on stuck sends, overdue PM, failed payroll or checkout without new code | M | each design's Reports section; crosscut §4.9; Insights §6.2 |
| R-LV-11 | **One locked engine for user-written templates** | Marketing messages (design-marketing.md:515), Sales quote text (SAL-TEMPLATE), People offer letters, Commerce store emails and Shop themes render with `fancy-locked-html` over plain snapshots, as Shop already decided (design-shop.md:853-856). | One safe-template rule and one preview behavior | S decision / M work | crosscut §4 (new row); MKT-TEMPLATE; SAL-TEMPLATE; People §15; COM-OPS |
| R-LV-12 | **Extract and review** | Document-to-record features use `AiTaskServices.run#Extract` or `ec.llm.extract` (Assist.md:1243-1255) and return proposals reviewed before writes: Sales QuoteExtraction (design-sales.md:1129-1141), People expense receipts, Purchasing and Accounting OCR (crosscut PUR-LATER). Text from the document is wrapped as untrusted. | A receipt or RFQ PDF becomes reviewed lines | M | crosscut §4; Sales §11; People §9; PUR-LATER |

4. **Needs dedupe and gating**

| ID | Need (file, ID) | Issue | Evidence | Fix |
|---|---|---|---|---|
| R-LV-N01 | BOSS roll-up ↔ Remaining-Work | Missing link | design-doc-guide.md:205-208 says Remaining-Work links the items; Remaining-Work.md:139-148 and plans/README have no crosscut link; crosscut §7.4 is "an index, not a needs table" (design-crosscut.md:2856-2857), and §7.7–§7.11 have no Kind column | Add Kind to §7.4–§7.11. Add an "IronStone framework asks" table to Remaining-Work linking each framework-kind need: N04, N08, N10–N13, INS-06/07, SHOP-THEME/RENDER, MT-14, PE-09 |
| R-LV-N02 | Remaining-Work "Chat and presence" | Stale | Remaining-Work.md:57-58 says nothing is implemented; Comms-Framework.md:3-6 lists P0, A0–A4, W1–W6 and V1–V5 as built | Rewrite the row. Designers read it as "no calls yet" |
| R-LV-N03 | People PE-20 OrgChart (qvue) | Exists | `view-tree` with lazy children, totals and a TUI twin (xml-form-3.xsd:333-345, 490-497); Commons also planned an org chart (design-drawers-commons.md:675) | Use the Commons directory with `views="tree,list"`. A graphic chart is optional and later. Drop it from PE-20 |
| R-LV-N04 | People email intake (design-people.md:484); Maintenance "type adapter is a need" (design-maintenance.md:550, no ID) | Exists | `EmailRuleAction` (MantleSetupData.xml:354-356), as built in Projects (design-projects.md:2454) | Cite it; add the actions per R-LV-04; give Maintenance a need ID |
| R-LV-N05 | Sales QuoteExtraction "operator-approved extractor" (design-sales.md:1133-1141) | Exists | `run#Extract`, `ec.llm.extract` (Assist.md:1243-1255) | Cite it; gate on a model bound to the `extract` feature |
| R-LV-N06 | crosscut CX-SHELL "proposed `density="handheld"`" and CX-LABELS "proposed `scan-input`" (design-crosscut.md:2587, 2604) | Exists (stale wording) | xml-screen-3.xsd:115; xml-form-3.xsd:1312; used in Warehouse/Handheld.xml; decided at design-crosscut.md:3131 | Mark them built. People ClockingKiosk (design-people.md:589), Marketing CheckIn (:882) and the Maintenance kiosk should cite them |
| R-LV-N07 | Marketing MKT-TEMPLATE "framework safe rendering" (design-marketing.md:1646) | Exists | template.rs:347-356 | Cite `fancy-locked-html` (R-LV-11) |
| R-LV-N08 | Marketing MKT-TRANSPORT "real SMS adapter" (design-marketing.md:1647) | Planned elsewhere, and first release not gated | C4-SMS needs C1, and Comms-Framework.md:837 names Marketing as its consumer. Marketing's "Broad first release Email/SMS" (:1665) and M2's exit condition (:1598) assume it. The C stream is "next", not built (Comms-Framework.md:3-6) | Cite C4-SMS. Gate M2's SMS on C1+C4-SMS, or ship email first with SMS behind channel readiness |
| R-LV-N09 | MKT-SEND, SHOP-OUTBOX, COM-OPS delivery | Planned elsewhere / exists | SystemMessage (built); C1 delivery rows (planned) | Per R-LV-05 |
| R-LV-N10 | People PE-05 "device grants" for ClockingKiosk (first release, design-people.md:97); Maintenance MT-13 "kiosk scope" | Unnamed framework dependency | App passwords never sign in to the web (Sync.md:27). No framework browser credential tied to a device or route exists | Name a framework need: a device session credential limited to an artifact group, revocable in Admin. Gate ClockingKiosk on it |
| R-LV-N11 | Marketing CheckIn "optional camera" (design-marketing.md:882) | Unnamed framework dependency | `scan-input` is keyboard-wedge and typed only (xml-form-3.xsd:1312-1316); no plan mentions camera decoding | Name a framework need (a camera mode on `scan-input`, for Maintenance tags, People badges and Warehouse phones), or drop "camera" |
| R-LV-N12 | People confidentiality "Assist … cannot reveal" (design-people.md:34, 1696) | Unnamed framework dependency | Inline text actions send any `m-rich-text` content to the `text-action` model, with no per-field opt-out (Assist.md:779-782; no XSD attribute) | Framework attribute to turn off text actions, dictation and Update with AI per field or screen (or route them to a local model). Add it to People's acceptance |
| R-LV-N13 | Every app's Assist use under organization scope (CX-ACCESS) | Unnamed Mantle dependency | The active-organization user-facts provider is not built (Remaining-Work.md:23; LLM-A2A-Assist.md:975) | List it as the prerequisite of R-LV-01 |
| R-LV-N14 | Maintenance MT-14 "tool" (offline) | Dependency not named | moqui-browser is partial (Remaining-Work.md:150-156) | Cite moqui-browser and its gaps (R-LV-07) |
| R-LV-N15 | Maintenance MT-07 booking guard | Unguarded alternate writer (inferred from code) | The CalDAV event PUT calls only `check#CalendarAccess` and `store#CalendarFeedEvents` (CalendarDavServices.xml:304-318), which write WorkEffort rows directly (CalendarServices.xml:888-893). MT-07's list of delegating callers (design-maintenance.md:744) omits it | Add it to MT-07 and to R-LV-02 |
| R-LV-N16 | Comms `contact-card` and `invitation` hooks | Planned, no app consumer named | Comms.md:177-178; iTIP REPLY not built (Remaining-Work.md:75) | Name Sales (sender → contact or lead card) and People (candidate replies to interview invites) as consumers |
| R-LV-N17 | Comms C4/C5 (WhatsApp, Telegram, Slack, Teams) | Planned, no consumer | No hits in the 8 designs | Keep MKT-TRANSPORT and SHOP-OUTBOX channel-agnostic, with the channel as a Comms provider |
| R-LV-N18 | `speech-local` (Whisper) | Planned, no consumer | WebRTC.md:78; Comms-Framework.md, "Left for later" | Make it the gate for any HR or interview transcription |
| R-LV-N19 | People ShiftRoster "virtualized roster grid" (design-people.md:646) vs M11 resource timeline (design-crosscut.md:2638) | Duplicate component | Both are people or resources against dates | One resource-lane timeline: ShiftRoster, ProductionSchedule, Maintenance scheduling |
| R-LV-N20 | People PE-09 decimal evaluator, framework or Mantle "after profiling" (design-people.md:1770) | Framework item left undecided | Not in Remaining-Work | Decide now; if framework, list it per N01 |

5. **Easy wins**

| ID | Addition | Uses (path) | Apps | Where it goes |
|---|---|---|---|---|
| R-LV-W01 | Call, Video and Chat buttons on the shared contact record | ContactRecord.xml:31-32 waits for "Comms calls and chat (later)", which are now built; `place#PhoneCall` (VoiceServices.xml:22); `create#CallLink` | Sales, Marketing, People, Purchasing (every mount of ContactDetail or a 360) | mr-boss template/ContactRecord.xml; crosscut §3.1 |
| R-LV-W02 | "Add video call" on EventDetail (creates a CallLink and fills `infoUrl`) | EventDetail.xml:514 (the field); `meetings-source` reads `infoUrl` (CommsHomeServices.xml:206-209) | People, Sales, Marketing, Maintenance | Commons §7 EventDetail |
| R-LV-W03 | "Add to calendar (.ics)" on any WorkEffort-backed record | EventDetail `exportIcs` (EventDetail.xml:196); `get#EventIcsMaps` (EventServices.xml:637) | Maintenance work orders and PM, People interviews, Marketing registrations, Sales activities | shared Commons transition; crosscut §3.13 |
| R-LV-W04 | Print frame with a QR of the record's link | `ec.resource.barcodeSvg('QR', …)` (Barcodes.md:3-6) | Maintenance work order (open on phone), Sales quote (accept), Marketing ticket, People badge, Commerce slip | crosscut §6.1 shared print header |
| R-LV-W05 | 3–5 `assist-prompt` chips per app on key records, plus "Log as note" and "Send as message" `response-action`s | xml-screen-3.xsd:748-772 | all | each app root `shell-providers` |
| R-LV-W06 | Push policy and lock-screen-safe titles per notification topic | `pushNotifications` (SecurityEntities.xml:537-573); the payload carries the title (web_push.rs:23, 287) | all; People, payroll and grievance topics set N or a generic title | each app's topic seed; crosscut §1.3 |
| R-LV-W07 | `operation`/`operation-ref` on domain jobs, plus one shipped alert template each | Monitoring.md:32-40, 322-337 | Marketing dispatch, Shop placement, People payroll, Maintenance PM generation | service definitions; `report/*.json` |
| R-LV-W08 | Create-from actions in the voicemail, call, chat and mail slots, and `call-context` answers | Comms.md:175-186; screen-extend/basic-comms/screen/BasicComms/Chat.xml:19-27 | Sales, Maintenance, Commerce/CS, People | mr-boss screen-extend; each app's `create-from` kinds |
| R-LV-W09 | Cite the built inline text actions (Rewrite, Shorten, Translate, Grammar) instead of new "Assist drafting" needs; one `run#Generate` "Draft from record" button where wanted | Assist.md:779-782, 1243 | Commerce product copy, Marketing content, Sales terms, People openings | those forms |
| R-LV-W10 | Palette source rows carry `recordEntity` and `recordId` | LLM-A2A-Assist.md:714, 975 (Assist `search` runs the palette sources) | all | each palette service |

6. **Proposed crosscut addition**

```
### 1.5 Stack capabilities and app contributions

Every app plugs into the framework through the contracts below. A design names its entries in its
shell section and lists anything not yet built in its needs table.

| App | Assist (skills, prompts, exposures) | Comms hooks and actions | Sync | Mail intake action | Shipped reports | Devices |
| --- | --- | --- | --- | --- | --- | --- |
| People | leave-balance, payslip-explain, hire; exposeMcp N for pay and grievance | create-from application and receipt; call link on interviews | projected: absence, shifts, interviews | createApplication, createExpenseLine | headcount dataset; payroll-exception alert | ClockingKiosk device session |
| Maintenance | report-problem, close-work-order, equipment history | Report a problem from chat or voicemail; call-context open work | projected: my work, due PM; managed tasks read only | createMaintenanceRequest | work-status dataset; overdue-PM alert | handheld; kiosk; offline later |
| Sales | issue-quote, follow-up drafts | create lead from mail, chat or voicemail; call-context opportunities | events only | createLead, createQuoteRequest | pipeline dashboard | — |
| Marketing | campaign summary | call link on webinars | projected campaign calendar | (bounce and unsubscribe emecas) | delivery dataset; bounce alert | CheckIn device session |
| Commerce/Shop | text actions for copy | call-context open orders | — | support intake | store dataset; checkout-failure alert | POS later |

Contracts:
- **CX-ASSIST.** `skill/` files, `skill/aliases.json` and `test/skill-retrieval.json` per component;
  `assist-prompt` and `response-action` in the app root's `shell-providers`; `AgentToolExposure` only
  where no screen does the job, `exposeMcp` decided by data class; `data-entity` never names HR or
  payroll packages; per-field AI opt-out on confidential text.
- **CX-SYNC.** CalDAV and CardDAV write only through owner services; managed and template work
  efforts are read only on devices; app calendars appear as projected read-only collections.
- **CX-MAIL-INTAKE.** Business intake is an `EmailRuleAction` naming the owner's service, reached by a
  plus-tag intake address; address-routed emecas only where the address is the identity.
- **CX-DELIVERY.** One Mantle delivery record and worker on the framework's send outcomes and the
  SystemMessage retry jobs, aligned with Comms C1; domain facts (sends, recoveries, reminders) link to it.
- **CX-DEVICE.** Shared devices sign in with a revocable device credential limited to one route
  group; each action identifies its person by badge scan and PIN; offline is drafts only on moqui-browser.
- **CX-OPS-REPORTS.** Each app ships `report/*.json` datasets, a dashboard and alert templates, and
  names `operation` and `operation-ref` on its jobs.
```

7. **Checked and fine**

- Every design commits to TUI twins for its custom components (PE-20, COM-THEME, MT-14, INS-08). That also makes them usable by Assist's `screen` tool, which drives the TUI (LLM-A2A-Assist.md:714).
- Palette, Today, quick create and notification topics are declared in every BOSS design over the existing `shell-providers` elements (xml-screen-3.xsd:536-571), with provider failures isolated.
- Admin reuses System/Llm and the framework tool policy rather than copying them (design-admin.md:77, 963). Insights reuses the framework report engine and cites the shipped Mantle definitions (design-insights.md:61-67, 715-716).
- Maintenance and People reuse the Projects timers and TimesheetServices (design-maintenance.md:68, 742). No design adds a second scheduler, mail transport, PDF engine or approval engine (design-people.md:1770).
- Shop correctly cites `fancy-locked`, and says plainly that it is not yet a full theme system (design-shop.md:853-858). Marketing keeps the ListUnsubscribeMailto emeca and the token unsubscribe paths (design-marketing.md:1416, 1213).
- Remaining-Work's wasm and calendar rows match the code: no login flow, no tab lock, no CalDAV scheduling or sync-collection.
