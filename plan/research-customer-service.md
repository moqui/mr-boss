# IronStone BOSS — Customer Service app research

Oct 18, 2026

Reviewed against sources Oct 18, 2026; follows [research-crosscut.md](research-crosscut.md).

Deeper research pass on the **IronStone Customer Service** app (Cases (Requests), order
lookup & changes, returns/RMA, availability lookup, Customer 360, knowledge-base links),
cataloguing every relevant screen/page found in the reference apps. Companion to
[3p-app-reference.md](3p-app-reference.md); feeds the Customer Service row in
[initial-design.md](initial-design.md). Customer Service includes the reused **Request /
case** screen (here: intake form, queues, SLA) and the reused return screens (here: RMA
authorization, reasons, case link); its versions of the reused **Customer 360** and
**Order detail** screens emphasize cases, returns and service actions, and its versions of
**Inventory availability** and **Shipment detail** are read-only. It also includes
knowledge-base articles (search, suggest, link to case; the authoring screen is reused
from Commons) and survey forms for CSAT.

**Organization.** Sorted by functional area (not by app): all case queues together, all
case-detail surfaces together, etc. Within each area, sub-tables per reference app.
Style mirrors [research-drawers-commons.md](research-drawers-commons.md) and
[research-accounting.md](research-accounting.md).

**Scope.** Business UI only: queues, case forms, conversations, SLA displays, customer
records, order lookup, return flows, availability views, knowledge-base screens. Backend
models are noted only where they shape a screen (status categories, SLA clocks,
returnable-quantity caps, allocation of stock).

**Path conventions.** Every backticked path resolves against the checkout for its prefix
below (per [research-crosscut.md](research-crosscut.md) §1). All checkouts are under
`/home/jonesde/work/moquiwork/`. A bare tail in a table cell is relative to the directory
named earlier in the same cell or row.

| Prefix | Checkout | Paths start with |
| --- | --- | --- |
| **Frappe Helpdesk** | `3p_other/frappe/helpdesk` | `desk/src/…` (agent and customer SPA, Vue 3 + frappe-ui); backend `helpdesk/helpdesk/doctype/…`, web forms `helpdesk/helpdesk/web_form/…`; API `helpdesk/api/…`, search `helpdesk/search.py`, email templates `helpdesk/templates/…`, ERPNext sync `helpdesk/integrations/…` |
| **ERPNext** | `3p_other/frappe/erpnext` | `erpnext/<module>/…` (support in `erpnext/support/`, sidebars in `erpnext/workspace_sidebar/`, portal pages in `erpnext/templates/pages/`, doctypes in `erpnext/{selling,stock,accounts}/doctype/`) |
| **Frappe framework** | `3p_other/frappe/frappe` | `frappe/<area>/…` (Help Article/Category in `frappe/website/doctype/`, Assignment Rule in `frappe/automation/doctype/`) |
| **Frappe Wiki** | `3p_other/frappe/wiki` | `frontend/src/…`, backend `wiki/wiki/doctype/…` |
| **Odoo** | `3p_other/odoo` | `odoo/addons/<addon>/…` (views in `<addon>/views/`, OWL in `<addon>/static/src/`) |
| **Dolibarr** | `3p_other/dolibarr` | `htdocs/<module>/…` (shared ticket form `htdocs/core/class/html.formticket.class.php`, third-party tabs `htdocs/core/lib/company.lib.php`) |
| **Carbon** | `3p_other/carbon` | `apps/erp/app/{modules,routes}/…` (route files under `apps/erp/app/routes/x+/`), schema `packages/database/supabase/migrations/…` |
| **AureusERP** | `3p_other/aureuserp` | `plugins/webkul/<plugin>/src/Filament/…` |
| **Akaunting** | `3p_other/akaunting` | `resources/views/…`, `app/…` |
| **Twenty** | `3p_other/twenty` | `packages/twenty-front/src/…` |
| **metasfresh** | `3p_other/metasfresh` | `frontend/src/…`, `backend/de.metas.<module>/…` |
| **Ever Gauzy** | `3p_other/ever-co/ever-gauzy` | `apps/gauzy/src/app/pages/…`, `packages/…` |
| **Nextcloud** | `3p_other/nextcloud` | `<app>/src/…` (Collectives: `collectives/src/`) |
| **Redmine** | `3p_other/redmine` | `app/{views,controllers,models}/…` |
| **Moqui Sales**, **Moqui WorkManagement** | `3p_moqui/{Sales,WorkManagement}` | `screen/…` (XML screens with paired QVue components) |
| **Moqui baseline** | `mr-moqui-base/runtime` | `component/mr-marble/screen/SimpleScreens/…`, `component/mr-marble/screen/MyAccount/…`, `component/mr-marble/screen/…`, `component/mr-mantle/{entity,data}/…`, `component/mr-mantle/service/mantle/…`, `component/mr-mantle/entity/…`, `components/base/framework/{entity,service}/…`, `component/mr-boss/screen/…` |

Not used here: Signal ships nothing relevant. Zimbra's admin `helpdesk/` folder
(`zm-admin-console/WebRoot/js/zimbraAdmin/helpdesk/`) is the admin console's help view,
not a case desk. Twenty's `packages/twenty-front/src/modules/support/` only embeds the
vendor's own support chat. OpenProject, the other Frappe apps, and the Moqui components
other than Sales and WorkManagement have no case, return or KB screens; ridgecrest only
files `Request` records from its storefront contact form
(`mantle.request.RequestServices.create#ContactRequestReCaptcha`) and for retailer
sign-up (custom type `RqtRetailer`). Nextcloud and Zimbra groupware screens are covered
by [research-drawers-commons.md](research-drawers-commons.md).

Sections: [1 service home & queues](#1-service-home--queues) · [2 case intake & channels](#2-case-intake--channels) · [3 case detail & conversation](#3-case-detail--conversation) · [4 assignment, teams & SLA](#4-assignment-teams--sla) · [5 customer 360](#5-customer-360) · [6 order lookup & changes](#6-order-lookup--changes) · [7 returns / RMA](#7-returns--rma) · [8 availability lookup](#8-availability-lookup) · [9 knowledge base & self-service](#9-knowledge-base--self-service) · [10 feedback, reporting & settings](#10-feedback-reporting--settings) · [11 cross-app surfaces](#11-cross-app-surfaces) · [12 current Moqui baseline](#12-current-moqui-baseline-mr-marble--marbleerp--mantle) · [13 gaps & BOSS implications](#13-gaps--boss-implications)

---

## 1. Service home & queues

### Frappe Helpdesk — agent home + manager dashboard

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Agent home | Per-agent, user-arranged chart dashboard: greeting, draggable/resizable chart grid, add/remove charts, save/reset layout. Empty state offers "Add charts to get started". | `desk/src/pages/home/Home.vue`, `desk/src/pages/home/components/{AgentTicketsCard,AvgTimeMetrics,PendingTickets,RecentActivity,RecentFeedback}.vue`, `desk/src/components/frappe-ui/GridLayout` |
| Manager/agent dashboard | Date-preset filter (Today, 7/30/60/90 days, custom range), team and agent filters (managers only), "My Organization" vs "My Stats" toggle, 5 KPI cards, trend charts, master-data charts, tag charts; permission-gated by `Agent Manager` role and agent/team filter. | `desk/src/pages/dashboard/Dashboard.vue`, `helpdesk/api/dashboard.py`, `helpdesk/api/dashboard_tags.py` |
| KPI cards | Tickets created, % SLA fulfilled, Avg. First Response (hrs), Avg. Resolution (days), Avg. Feedback Rating (/5); each shows delta vs the previous equal-length period. | `helpdesk/api/dashboard.py` `get_number_card_data()` |
| Trend charts | Ticket trend (created vs resolved), feedback trend (plotted on resolution date), tickets by team/type/priority/channel, top tags and tag trend. | `helpdesk/api/dashboard.py`, `helpdesk/api/dashboard_tags.py` |
| Ticket queue (agent) | Header view switcher (standard/user/pinned/public views), create button, list builder with row-click open, saved columns, filters, sort; selection banner exposes Reply, Assign, Export, Edit for agents. | `desk/src/pages/ticket/Tickets.vue`, `desk/src/components/ListViewBuilder.vue`, `desk/src/components/view-controls/`, `desk/src/components/ticket-agent/{BulkReplyModal,BulkAssignModal,BulkEditModal}.vue` |
| Ticket queue (customer portal) | Same list component with customer-safe columns; create button routes to customer ticket form; bulk agent actions hidden. | `desk/src/pages/ticket/Tickets.vue` (`isCustomerPortal` gates) |
| Call logs | `TP Call Log` list with caller/receiver avatars, incoming/outgoing type/status, new-call-log modal and detail modal. | `desk/src/pages/call-logs/{CallLogs,CallLogModal,CallLogDetailModal}.vue` |
| Notifications | Mobile notification list; desktop uses the header notifications component. | `desk/src/pages/MobileNotifications.vue`, `desk/src/components/notifications/` |

**BOSS implications.** The references suggest the queue, not a dashboard, as the app's
default landing: Frappe separates an agent's personal chart home from the manager's
operational dashboard, and the queue is where work actually starts. One option is the
standard Moqui `form-list` + saved-find/column model for the case queue, with a small KPI
strip (open/overdue/unassigned, first-response, resolution, CSAT) on the Customer Service
landing page. Frappe's KPI delta wording ("vs prev. N days") and its split between "My
Stats" and "My Organization" are candidates; both map cleanly onto Moqui authz and the
shared Insights widgets.

### ERPNext — Support workspace + issue analytics

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Support workspace | Desk module page: "Issues Opened" chart plus Open/Overdue/Resolved issue number cards; the module sidebar links Issue, Maintenance Schedule, Maintenance Visit, Warranty Claim, a Setup group (Issue Type, Issue Priority, Service Level Agreement), the First Response Time report and Support Settings. | `erpnext/support/workspace/support/support.json`, `erpnext/workspace_sidebar/support.json` |
| Issue dashboard charts | "Issues Opened" line chart plus standard number cards; charts are Frappe Dashboard Chart records over `Issue`. | `erpnext/support/dashboard_chart/issues_opened/`, `erpnext/support/number_card/{open_issues,overdue_issues,resolved_issues}/` |
| Issue reports | Issue Summary, Issue Analytics, First Response Time for Issues, Support Hour Distribution. | `erpnext/support/report/{issue_summary,issue_analytics,first_response_time_for_issues,support_hour_distribution}/` |
| Support settings | Close issue after N days, SLA tracking toggle, allow resetting SLA, greeting title/subtitle, search sources, optional forum feed. | `erpnext/support/doctype/support_settings/support_settings.json`; `erpnext/templates/pages/help.py` |

**BOSS implications.** ERPNext is the thinner, record-first alternative: a workspace of
shortcuts and counters rather than a chart canvas. One option for BOSS pairs the
workspace pattern for the app landing page with Frappe Helpdesk's queue for the working
screen. The "Overdue" and "Resolved" number cards are the minimum KPI set worth exposing
without a full BI dependency.

### Carbon — sales/inventory workbenches, no service desk

Carbon ships no case/helpdesk module. Its nearest landing surfaces are the sales
dashboard/order tables and the inventory availability table (see §6–§8). Those are
useful layout references for dense operational lists but not for case management.

### Gaps in the other references

- **Dolibarr:** the ticket area index (`htdocs/ticket/index.php`) is a small dashboard:
  tickets-by-status chart for a chosen year, latest unread tickets, and the user's
  dashboard boxes. The module menu exposes New ticket, List, My assigned tickets,
  Statistics and Categories (`htdocs/core/modules/modTicket.class.php`). There is no
  per-agent or SLA dashboard.
- **Odoo:** no `helpdesk` addon in this community checkout (Helpdesk is Enterprise).
  Service work is split across CRM activities, Live Chat (§2), Repair, and stock returns.
- **AureusERP:** the `support` plugin is shared infrastructure (activities, calendars,
  UOM, companies), not a support desk. No ticket UI exists.
- **Akaunting / Moqui Sales / Twenty / metasfresh:** no case queue. Twenty's record
  index and Moqui's saved finds are useful list-shell references.

---

## 2. Case intake & channels

### Frappe Helpdesk — one ticket model, several entry points

| Screen/page | What it is | Key files |
| --- | --- | --- |
| New ticket (agent) | Template-aware form: template `about` text, visible custom fields (with field dependencies), subject + rich description, attachments, submit. Agent can create without the customer-portal KB search. | `desk/src/pages/ticket/TicketNew.vue`, `desk/src/components/UniInput.vue`, `desk/src/components/Settings/FieldDependency/` |
| New ticket (customer portal) | Same form, but after 3 subject characters it runs article search and shows "These articles may already cover what you are looking for" with matching article title/headings/snippet; "View All" opens the public KB; empty state suggests rephrasing. | `desk/src/pages/ticket/TicketNew.vue`, `desk/src/components/SearchArticles.vue` |
| Web form | Public `HD Ticket` web form with subject, description, priority and custom fields; separate `email_feedback` web form for feedback. | `helpdesk/helpdesk/web_form/tickets/tickets.json`, `helpdesk/helpdesk/web_form/email_feedback/` |
| Email intake | Email Account setup screens (new/edit/list, provider icons); inbound mail creates/threads tickets and outbound replies use the account. Email notifications are configured separately (acknowledgement, reply-to-agents, reply-via-agent, share-feedback). | `desk/src/components/Settings/{EmailAccountList,EmailAccountCard,EmailAdd,EmailEdit,EmailConfig}.vue`, `desk/src/components/Settings/EmailNotifications/`, `helpdesk/templates/emails/` |
| Telephony | Exotel and Twilio settings, in-ticket call UI, call actions, call log list/detail. | `desk/src/components/Settings/Telephony/`, `desk/src/components/telephony/{CallUI,ExotelCallUI,TwilioCallUI}.vue`, `desk/src/components/ticket/TicketCallActions.vue`, `desk/src/pages/call-logs/` |
| Ticket templates | Named templates with "about" copy and template fields; route accepts `templateId` so a portal/queue button can start a pre-shaped case. | `desk/src/router/index.ts` (`/tickets/new/:templateId?`), `helpdesk/helpdesk/doctype/hd_ticket_template/`, `hd_ticket_template_field` |
| Ticket field layout | Per-agent/team field layout and form scripts; customizations fetched per ticket before render. | `helpdesk/helpdesk/doctype/hd_field_layout/`, `hd_form_script/`, `helpdesk/helpdesk/doctype/hd_ticket/api.py` (`get_ticket_customizations`) |
| Customer portal notice | Banner/permission messages for portal users, including outside-working-hours warning on the customer ticket page. | `desk/src/components/banners/CustomerPortalPermissionBanner.vue`, `desk/src/pages/ticket/TicketCustomer.vue` |

**Ticket record fields (screen-shaping subset).** Subject, raised-by email, status,
priority, type, team, description, template, SLA + response/resolution due dates and
agreement status, first-response/resolution times, contact, customer, email account,
via-customer-portal flag, feedback option/rating/extra, merged/split links, last
agent/customer response, raised-outside-working-hours, and failed-by durations.
(`helpdesk/helpdesk/doctype/hd_ticket/hd_ticket.json`.)

**BOSS implications.** IronStone cases are `Request` records, which points to a
request-type-driven intake form rather than a ticket-only form: the same reused **Request
/ case** screen is also included in Projects (request intake), Commons ("requests
assigned") and the other apps in crosscut §3. Frappe's template + field-dependency model
for request types, and its article suggestions shown while the customer types the
subject, are candidates. The largest gap is channel capture: Frappe ties email accounts
and telephony directly to the ticket, which in BOSS maps onto the Comms/SystemMessage
layer, a suite used from every app; `Request.salesChannelEnumId` (Web, Phone, E-Mail, …)
can record the channel a case came in on.

### ERPNext — Issue + warranty intake

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Issue form | Subject, raised-by email, status (Open/Replied/On Hold/Resolved/Closed), priority, issue type, description, SLA link and clocks, lead/contact/customer, project, company, resolution details, opening date/time, attachment, via-customer-portal, split-from, average response/resolution, hold time. | `erpnext/support/doctype/issue/issue.json`, `issue.js` |
| Issue web form | Public issue submission form. | `erpnext/support/web_form/issues/` |
| Support portal | Public Help page: search box, "Get Started" sections from Support Settings, latest forum posts, the user's recent tickets, "See all open tickets", "Open a new ticket"; `/kb/support` and `/issues` are website routes. | `erpnext/templates/pages/help.html`, `help.py`, `erpnext/hooks.py` website route rules |
| Warranty Claim | Complaint date, serial no, customer, item, complaint/description, warranty/AMC status + expiry, resolution date/by/details, contact and service address, raised-by, company. | `erpnext/support/doctype/warranty_claim/warranty_claim.json` |
| Maintenance Visit / Schedule | Field-service visits and schedules linked from the Support workspace; useful when a case needs an on-site step. | `erpnext/maintenance/doctype/{maintenance_visit,maintenance_schedule}/` |

**BOSS implications.** ERPNext confirms that warranty/AMC is a separate record from the
case. The evidence favors a case subtype or linked record for warranty claims over adding
serial/warranty fields to every request (`Request` has no product, serial or asset field;
`RequestItem.productId` is the nearest hook). The public help page is a strong candidate
shape for a customer-facing support portal: search first, articles second, the
customer's own cases third, and a single "open a new case" action.

### Dolibarr — ticket form with knowledge suggestions

| Screen/page | What it is | Key files |
| --- | --- | --- |
| New/edit ticket | Reference, company, contact, type, category, severity, subject, message, attachments, notify third party, extra fields. The category selector triggers an AJAX knowledge-base lookup and shows matching articles for the ticket group. | `htdocs/ticket/card.php`, `htdocs/core/class/html.formticket.class.php` |
| Public ticket portal | Public index with Create Ticket / View My Ticket List / Show Ticket With Track ID; separate create/list/view pages and document download. | `htdocs/public/ticket/{index,create_ticket,list,view,document}.php` |
| Ticket list | Filters incl. company, contact, type/category/severity, assignee, status; mass actions; statistics view. | `htdocs/ticket/list.php`, `htdocs/ticket/stats/index.php` |

**BOSS implications.** Dolibarr's category→KB suggestion is a lighter alternative to
Frappe's full-text article search: when a request type/category is chosen, show the
articles linked to that category. That is cheap to implement on Mantle categories and
useful even when no free-text search service is configured.

### Dolibarr — email collector (inbound mail to tickets, events, leads)

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Email collector list/card | Per-mailbox collector (host, port, encryption, login or OAuth service, source folder, target folder after processing, max emails per collect), Test collect / Collect now buttons, last result and last OK date. | `htdocs/admin/emailcollector_list.php`, `htdocs/admin/emailcollector_card.php`, `htdocs/emailcollector/class/emailcollector.class.php` |
| Filters | Match on from, to, cc, bcc, reply-to, subject / not in subject, body / not in body, header, seen/unseen, answered/unanswered, size, with or without a Dolibarr tracking ID, is/is not an answer. | `htdocs/emailcollector/class/emailcollectorfilter.class.php`, `emailcollector.class.php` |
| Operations | Ordered actions per collector: load or create third party, load or create contact, record an agenda event, attach files, create a project/lead, create a **ticket**, create a recruitment candidature. Replies are matched to an existing ticket by the tracking ID in the Message-ID or by the stored message references. | `htdocs/emailcollector/class/emailcollectoraction.class.php`, `emailcollector.class.php` |

**BOSS implications.** This is a configurable inbound pipeline, not code: filters decide
which mails apply, and an ordered list of operations turns a mail into a party, a
contact, an event and a case. In BOSS the receive side is the Comms suite (mr-moqui
protocols, initial-design), used from every app; what is specific to Customer Service is
the "create or append to a case" operation and the mailbox-to-queue mapping.

### Redmine — mail handler (email to issue, replies threaded)

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Incoming email settings | Settings tab: body delimiters to truncate quoted replies (optionally regex), excluded attachment names, preferred body part (text/HTML), enable the incoming-mail API with a key. | `app/views/settings/_mail_handler.html.erb` |
| Mail handler | Threads a mail by In-Reply-To/References message IDs, then by a `[#123]` subject tag, else creates an issue; unknown senders are ignored, accepted as anonymous, or get a new account added to a default group; auto-generated mail is ignored by header; attributes in the body can override issue fields when allowed. | `app/models/mail_handler.rb`, `app/controllers/mail_handler_controller.rb`, `app/views/mail_handler/new.html.erb` |

**BOSS implications.** The threading order (message-ID headers, then subject tag, then
new case) and the unknown-sender policy are the two rules case email intake needs. Both
fit the Comms receive path with the case as the target record.

### Odoo — Live Chat channels, chatbots and session reporting

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Live Chat channels | Channel kanban/form: operators (join/leave), welcome message, button and window colors, session limits per operator, "no chats during call", review link, ongoing sessions, rating %; widget tab with embed script. | `odoo/addons/im_livechat/views/im_livechat_channel_views.xml`, `odoo/addons/im_livechat/models/im_livechat_channel.py` |
| Channel rules | Per URL regex and country: show/auto-open/hide the button, open timer, chatbot to run and when. | `odoo/addons/im_livechat/views/im_livechat_channel_views.xml` (`im_livechat.channel.rule.*`) |
| Chatbot scripts | Scripted steps and answers before handing to an operator. | `odoo/addons/im_livechat/views/{chatbot_script_views,chatbot_script_step_views,chatbot_script_answer_views}.xml` |
| Operator expertise | Expertise tags on operators; operator selection prefers matching language, country and expertise. | `odoo/addons/im_livechat/views/im_livechat_expertise_views.xml`, `odoo/addons/im_livechat/models/im_livechat_channel.py` |
| Session statistics | Report over sessions: channel, agent, country, day/hour, response time, messages, rated Happy/Neutral/Unhappy, escalated, not answered. | `odoo/addons/im_livechat/report/im_livechat_report_channel_views.xml`, `im_livechat_conversation_report.xml` |
| Lead from chat | `crm_livechat` adds a "Create Lead" chatbot step that creates a CRM lead for a sales team. | `odoo/addons/crm_livechat/models/chatbot_script_step.py` |

**BOSS implications.** Chat is a case channel like email: a chat session is a
`CommunicationEvent` thread handled by the Comms suite, and Customer Service would need
"create case from chat" plus routing by channel rules and agent capacity. Session limits
per agent and the "not answered / escalated" counters are the queue metrics worth
keeping.

---

## 3. Case detail & conversation

### Frappe Helpdesk — activity-centric ticket page

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Ticket header | Breadcrumb + view context, active viewers (presence avatars), custom actions, status dropdown (agent vs customer labels/colors), merge action, subject edit, kebab menu. | `desk/src/components/ticket-agent/TicketHeader.vue`, `TicketSubjectModal.vue`, `desk/src/components/ticket/TicketMergeModal.vue` |
| Activity panel | Tabs: Activity, Emails, Comments, Calls (when telephony enabled), Analytics. Each tab reuses the timeline filtered by communication type; a persistent communication area at the bottom sends email replies. | `desk/src/components/ticket-agent/TicketActivityPanel.vue`, `desk/src/components/ticket-agent/timeline/TicketTimeline.vue`, `desk/src/components/CommunicationArea.vue` |
| Timeline | Shared activity-timeline feed (`HD Ticket`, visible types), pinned-comments bar, per-row comments, reactions, email reply hooks. | `desk/src/components/ticket-agent/timeline/{TicketTimeline,TimelineCommentRow,TimelineReactions,PinnedCommentsBar}.vue`, `helpdesk/api/timeline.py` |
| Sidebar | Contact card, SLA cards, feedback block (once rated), Overview (assignee, core fields, tags), More Details (custom fields), Recent Tickets, Similar Tickets; resizable split. | `desk/src/components/ticket-agent/{TicketSidebar,TicketDetailsTab,TicketSLA,TicketContact}.vue`, `desk/src/components/customer/TicketStats.vue` |
| Communication composer | Rich text, attachments with upload tracking, Ctrl/Cmd+Enter send, email/comment modes, canned replies selector, saved-reply action chips. | `desk/src/components/{CommunicationArea,EmailEditor,CommentTextEditor,SavedRepliesSelectorModal}.vue`, `desk/src/pages/ticket/TicketTextEditor.vue`, `desk/src/components/SavedReplyActions/` |
| Split / merge | Split a ticket into a new one; merge duplicates into a target, with merged-with link and subject modal. | `desk/src/components/ticket/{TicketSplitModal,TicketMergeModal}.vue`, `hd_ticket_split_from` / `is_merged` / `merged_with` fields |
| Customer ticket page | Simpler conversation + attachments composer, Close button, Details tab on mobile, customer-side template fields, feedback dialog, outside-hours banner, customer sidebar. | `desk/src/pages/ticket/{TicketCustomer,TicketConversation,TicketCustomerTemplateFields,TicketFeedback}.vue`, `desk/src/components/ticket/TicketCustomerSidebar.vue` |
| Ticket analytics tab | Per-ticket analytics: metric cards, conversation summary, ticket timeline. | `desk/src/components/ticket-agent/analytics/{TicketAnalyticsTab,AnalyticsMetricCards,ConversationSummary,TicketTimeline}.vue` |

**BOSS implications.** This is the strongest case-detail reference in the checkout.
Its structure is the main candidate: one record header with status + assignee, one
activity timeline that can filter by channel, one fixed composer, and a right sidebar
split into customer, SLA, fields, tags and related cases. The tabs map directly onto
CommunicationEvent types (email, comment/note, call, chat), so no case-only activity
record looks necessary. The "Recent / Similar Tickets" block is cheap and valuable;
similarity can start as same-customer + same-type + recent, without any ML.

### ERPNext — Issue conversation

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Issue detail | Standard Frappe form with status/priority/type/SLA fields and the framework's timeline/comment/attachment sidebar; resolution details captured before close. | `erpnext/support/doctype/issue/issue.js`, `issue.json` |
| Issue list row | Compact portal row with subject, status and modified date. | `erpnext/templates/includes/issue_row.html` |
| Support reports | Issue Summary and Issue Analytics provide queue-level conversation/response analysis rather than per-case views. | `erpnext/support/report/issue_summary/`, `issue_analytics/` |

**BOSS implications.** ERPNext's case detail is just the generic Frappe form + timeline;
Frappe Helpdesk's layout, with the communication timeline as the primary column and
fields secondary, is the stronger option.

### Dolibarr — ticket card with message log

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Ticket card | Header with ref/status/assignee, message thread, private/public notes, linked documents, contacts, project/company links, status actions (assign, in progress, need more info, on hold, close, cancel, reopen), event log. | `htdocs/ticket/card.php`, `htdocs/ticket/messaging.php`, `htdocs/ticket/note.php`, `htdocs/ticket/document.php`, `htdocs/ticket/contact.php` |
| Ticket agenda | Events linked to the ticket. | `htdocs/ticket/agenda.php` |
| Status model | Not read → read → assigned → in progress → need more info → on hold → closed (solved) / canceled; short and long labels for each. | `htdocs/ticket/class/ticket.class.php` (`STATUS_*`) |

**BOSS implications.** Dolibarr's status ladder is a good default for a small-business
request workflow, and it separates "need more information" (waiting on customer) from
"on hold" (waiting internally). The evidence favors making both pauses explicit because
they have different SLA semantics: customer-wait normally pauses the clock, internal hold
may or may not.

### Odoo — chatter, activities and repair orders

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Chatter | Message/note/activity/attachment timeline on any record, including partners and sale orders; activity kanban/list widgets expose scheduled next actions. | `odoo/addons/mail/views/*.xml` (`<chatter/>`), `odoo/addons/mail/views/res_partner_views.xml`, `odoo/addons/sale/views/sale_order_views.xml` |
| Repair order | Repair Order list/kanban/form/graph/pivot: customer/product/lot, schedule, state (draft → confirmed → done/cancel), parts and operations, reserve/unreserve, quote/invoice actions, forecasted availability widget on parts, repair notes, Responsible/Technician, tags, late/ready filters. | `odoo/addons/repair/views/repair_views.xml`, `odoo/addons/repair/models/repair.py` |
| Repair reports | Repair quotation/order report templates (no customer portal in this addon). | `odoo/addons/repair/report/repair_reports.xml`, `repair_templates_repair_order.xml` |

**BOSS implications.** Repair is a different workflow from a case, but Customer Service
often needs it. The references keep "case" and "repair/return order" as linked records:
the case holds communication and SLA, the repair order holds parts, operations and
stock; none merges them into one form. Mantle has no repair-order record; the nearest
are a `WorkEffort` with purpose `WepMaintenance` (Maintenance's work order) linked by
`RequestWorkEffort`, and `ReturnHeader` for the goods (see Open questions).

### Carbon — operational record pages

Carbon has no case detail. Its record-page pattern (header + sidebar + route tabs) is
visible in customers and orders and is a useful shell reference; see §5–§7.

---

## 4. Assignment, teams & SLA

### Frappe Helpdesk — assignment rules, teams, agent availability

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Assignment rules list/editor | Rules have name, priority (Low → High), disabled switch, description, condition builder (assign + unassign), assignee list and schedule (assignment days). Editor shows a legacy Python condition read-only ("Old Condition") beside the structured condition builder. | `desk/src/components/Settings/Assignment Rules/{AssignmentRules,AssignmentRulesList,AssignmentRulesListView,AssignmentRuleListItem,AssignmentRuleView,AssigneeRules,AssignmentSchedule}.vue`, `desk/src/components/conditions-filter/`, `helpdesk/api/assignment_rule.py` |
| Rule distribution (Frappe framework) | Frappe core Assignment Rule modes: Round Robin, Load Balancing, Based on Field, Weighted Distribution; users table, last user, assignment days, due-date field, close condition. | `frappe/automation/doctype/assignment_rule/assignment_rule.json` |
| Teams | Team name, users (multi-select), assignment rule, "ignore restrictions" switch, disabled switch. Team modal, edit, rename, member selector. | `helpdesk/helpdesk/doctype/hd_team/`, `hd_team_member`, `desk/src/components/Settings/Teams/{TeamsList,TeamEdit,NewTeam,RenameTeamModal}.vue`, `desk/src/components/Settings/Teams/components/AgentSelector.vue` |
| Agents | Agent user link, display name, active flag, image, availability status and who/when changed. Availability options carry Active/Away/Unavailable categories, ordering and colors. | `helpdesk/helpdesk/doctype/hd_agent/`, `hd_agent_status/`, `desk/src/components/Settings/Agents.vue`, `AgentCard.vue` |
| SLA list/editor | Service level name, holiday list, start/end dates, working-hours table, per-priority response/resolution times, default SLA/priority, rank, enabled, apply-to-resolution switch, condition, reopen status, default status (both picked from statuses in the Open category); pause and fulfil behaviour comes from the status category (Open / Paused / Resolved on `HD Ticket Status`), not from per-SLA lists. | `helpdesk/helpdesk/doctype/hd_service_level_agreement/`, `hd_service_level_priority/`, `hd_service_day/`, `desk/src/components/Settings/Sla/{SlaPolicies,SlaPolicyView,SlaPolicyList,SlaPriorityList,SlaWorkDaysList,SlaHolidays,SlaStatusList,SlaAssignmentConditions}.vue` |
| SLA display | First Response and Resolution cards: fulfilled in X, due by, on-hold since, actual responded/resolved timestamps, delay in working hours and total delay; color shifts to danger on failure. | `desk/src/components/ticket-agent/TicketSLA.vue`, `desk/src/composables/useSLA.ts` |
| Holidays | Holiday list with from/to date, total, weekly-off day, generate weekly-off dates, recurring holidays, holiday rows and color; calendar and table views. | `helpdesk/helpdesk/doctype/hd_service_holiday_list/`, `hd_holiday/`, `desk/src/components/Settings/Holiday/` |

**BOSS implications.** The data model matters as much as the UI: SLA = calendar
(working hours + holidays) × per-priority response/resolution targets × statuses that
pause or fulfil the clock. BOSS already has `Request` and party/role data, so one option
is an SLA record attached to request type/customer/team that computes response/resolution
due dates server-side, with the case screen only displaying the computed clocks. The
references point to rule-based, auditable assignment: priority-ordered conditions,
explicit assign/unassign conditions, and one of round-robin / load-balancing / weighted
distribution. Agent availability fits the header presence model better than a case-only
table.

### ERPNext — Service Level Agreement + pause/fulfil status lists

| Screen/page | What it is | Key files |
| --- | --- | --- |
| SLA form | Service level name, holiday list, start/end, working hours (service days), priorities (response/resolution times), entity (Customer/Customer Group/Territory), default SLA/priority, pause-on statuses, apply-on document type, fulfilled-on statuses, apply-for-resolution, condition. | `erpnext/support/doctype/service_level_agreement/service_level_agreement.json` |
| SLA child tables | Service Day (weekday/start/end), Service Level Priority (priority, response time, resolution time, default), Pause SLA On Status, SLA Fulfilled On Status. | `erpnext/support/doctype/{service_day,service_level_priority,pause_sla_on_status,sla_fulfilled_on_status}/` |
| Issue priority/type masters | Simple name + description masters; no per-priority colour or customer label. | `erpnext/support/doctype/{issue_priority,issue_type}/` |
| Support settings | `track_service_level_agreement`, `allow_resetting_service_level_agreement`, `close_issue_after_days`. | `erpnext/support/doctype/support_settings/support_settings.json` |

**BOSS implications.** ERPNext's pause/fulfil status lists are the important detail:
SLA behaviour is driven by request status, which suggests classifying statuses once
(open/paused/resolved/closed) for every SLA and dashboard to read. One option for BOSS is
to store the category with the status, as Frappe Helpdesk does (`HD Ticket
Status.category`), and derive pause/fulfil behaviour from the category plus optional
per-SLA overrides. Moqui's `StatusItem` has no category field, so this would be a small
new mapping (§13).

### Dolibarr / Odoo / Carbon

- **Dolibarr** has no SLA engine and no assignment rules; tickets have a single assignee
  and a fixed status ladder. It is a useful example of keeping the model simple for
  small teams.
- **Odoo** community has no helpdesk SLA. Activities and teams can emulate assignment,
  but there is no response/resolution clock. Sales/repair use standard activities for
  follow-up.
- **Carbon** has no service desk or SLA; its order/return assignee fields and status
  machines are the closest analogue.

---

## 5. Customer 360

### Frappe Helpdesk — customer and contact records

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Customer page | Header with image/name/type/domain/primary contact; Edit and delete actions; ticket stats strip; tabs Tickets and Contacts with counts; ticket list filterable by contact when a customer has multiple contacts. | `desk/src/pages/customer/{Customer,Customers}.vue`, `desk/src/components/customer/{TicketsTab,CustomerContactTab,ContactCard}.vue` |
| Customer stats | Four compact charts/cards: avg. feedback received (with review count), failed SLAs, avg. first response time, avg. resolution time; scoped to the customer or contact. | `desk/src/components/customer/TicketStats.vue`, `helpdesk/api/ticket_stats.py` |
| Contact page | Contact info (email/phone/country), invitation badge/actions, ticket stats, tabs Tickets and Feedback with counts; linked customers, invite/reset-password actions. | `desk/src/pages/contact/Contact.vue`, `desk/src/components/contact/{ContactCustomers,ContactFeedback,EditContactDialog}.vue` |
| Customer/contact dialogs | New/edit customer, invite contact, revoke invite, new/edit contact; customer deletion explicitly removes references from related tickets. | `desk/src/components/customer/{NewCustomerDialog,EditCustomerDialog,InviteContactDialog,RevokeInviteButton}.vue`, `desk/src/components/DeleteWithTicketsDialog.vue`, `desk/src/components/contact/{NewContactDialog,EditContactDialog}.vue` |
| ERPNext integration (Helpdesk side) | Union-merge HD Customers with ERPNext Customers, link both directions, mirror DocShares so portal users see the same customer in both apps; sync settings with in-sync gate and "Sync now". | `helpdesk/integrations/erpnext/{api,customer,doc_share}.py`, `desk/src/components/erpnext-integration/ERPNextIntegrationSettings.vue` |

**BOSS implications.** This is almost exactly Customer Service's version of the reused
**Customer 360** (reused: Sales, Customer Service, Marketing, Accounting, Commerce), minus
orders and money. The evidence favors one party record with tabs that follow the app
context: Customer Service shows cases/contacts/feedback; Sales adds opportunities;
Accounting adds invoices/credit; Commerce adds store orders. Frappe's stats strip
suggests permission gating (a support agent sees service metrics, not receivables). The
ERPNext integration is a warning as much as a reference: a second customer master needs a
sync layer, which one `Party` read by every app that includes Customer 360 avoids.

### ERPNext — customer overview + dashboard links

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Customer form Overview tab | Period selector (Current Fiscal Year, Last 12 Months, This Quarter, Last Fiscal Year) and company selector; position KPIs (net sales + invoice count + YoY delta), sales trend chart, receivables/ageing chart, Open Pipeline stat cards (open quotations, open orders, unpaid invoices), recent transactions; sections hide when the viewer lacks accounts permissions. | `erpnext/selling/doctype/customer/customer_overview.py`, `erpnext/public/js/{party_overview,customer_overview}.js`, `erpnext/selling/doctype/customer/customer.json` (`overview_html`) |
| Customer dashboard links | Transaction groups: Pre Sales (Opportunity, Quotation), Orders (Sales Order, Delivery Note, Sales Invoice), Payments (Payment Entry, Bank Account, Dunning), Support (Issue, Maintenance Visit, Installation Note, Warranty Claim), Projects, Pricing, Subscriptions. | `erpnext/selling/doctype/customer/customer_dashboard.py` |
| Customer portal | `/orders`, `/invoices`, `/shipments`, `/issues` website routes; document detail pages render the submitted document, attachments, payment button and print action. | `erpnext/hooks.py` portal route rules, `erpnext/templates/pages/order.{html,py}`, `erpnext/controllers/website_list_for_contact.py` |

**BOSS implications.** ERPNext's Overview tab is the best evidence for how much can be
visible on Customer 360 without leaving the page: commercial position, trend,
receivables/ageing, pipeline and recent transactions. One option for BOSS is to make each
block a reusable screen/query with its own authz, so the same Customer 360 is included in
Sales, Customer Service and Accounting with different blocks. The dashboard links act as
the navigation contract: every linked document type opens the reused record screen.

### Dolibarr — third-party card as the 360 hub

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Third-party card | Header + tab strip assembled from enabled modules and permissions: Third Party, Contacts/Addresses, Prospect/Customer, Customer Prices, Supplier, Accounting, Projects, Resources, Referring Items, Bank Accounts, Web Site Accounts, Partnerships, Tickets, Event Organization, Notifications, Notes, Documents, Events. Badges show counts for contacts, projects, tickets, notes, documents. | `htdocs/societe/card.php`, `htdocs/core/lib/company.lib.php` `societe_prepare_head()` |
| Customer/prospect tab | Prospect/customer status and commercial settings; orders/invoices/proposals/contracts/interventions are added as module tabs by hooks. | `htdocs/comm/card.php`, `htdocs/societe/card.php` |
| Ticket tab | Direct link into the ticket list filtered by `socid`, with open-ticket count badge. | `htdocs/core/lib/company.lib.php`; `htdocs/ticket/list.php` |
| Notes/documents/events | Notes, attached files, agenda/events and notifications tabs on the same card. | `htdocs/societe/{note,document,agenda}.php` |

**BOSS implications.** Dolibarr shows the tabbed third-party hub works for small
businesses, with module-contributed tabs and count badges. The BOSS equivalent is the
reused Customer 360 on `Party`, with tabs contributed by each app that includes it:
Service adds Cases, Returns and Feedback, Sales adds Opportunities/Orders, Accounting adds
Invoices/Balance, Commons adds Files/Notes/Calendar. Badge counts need to stay cheap;
Dolibarr caches some counts because the card otherwise queries every module.

### Odoo — partner form, stat buttons and chatter

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Partner form | Standard contact/company form with stat buttons from installed modules: Sales (sale order count), Invoicing (total invoiced, vendor bills), stock lots/serials; sales/purchase and accounting settings pages; chatter with activities. | `odoo/addons/sale/views/res_partner_views.xml`, `odoo/addons/account/views/partner_view.xml`, `odoo/addons/stock/views/res_partner_views.xml`, `odoo/addons/mail/views/res_partner_views.xml` |
| Sale order form | Status bar, customer/address/payment/terms, order lines, delivery/invoice/pickup progress, chatter, stat buttons to deliveries/invoices. | `odoo/addons/sale/views/sale_order_views.xml` |
| Repair order partner link | Repairs are visible from the partner's repair orders; the repair form links sale order, invoice and product moves. | `odoo/addons/repair/views/{repair_views,res_partner_views}.xml` |

**BOSS implications.** Odoo's stat-button pattern is the cleanest "one record, many
apps" navigation: a count button in the header jumps to a filtered list. It is a
candidate for Customer 360 and for Order detail (cases, shipments, invoices, returns),
using the shared context plumbing so Assist and the header tray can see the current
record.

### Carbon — customer record with module tabs

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Customer record | Header with status, tags, type, contacts/phone chrome, audit log and delete; sidebar tabs: Details, Contacts, Locations, Payment, Bank Accounts, Documents, Tax, Shipping, Risks, RFQs, Quotes, Orders, Invoices (filtered lists). | `apps/erp/app/routes/x+/customer+/`, `apps/erp/app/modules/sales/ui/Customer/CustomerHeader.tsx`, `apps/erp/app/modules/sales/ui/Customer/CustomerSidebar/{CustomerSidebar,useCustomerSidebar}.tsx` |
| Customer forms | Details, contacts, locations, shipping, tax, payment, bank accounts, risk register. | `apps/erp/app/modules/sales/ui/Customer/{CustomerForm,CustomerContactForm,CustomerLocationForm,CustomerShippingForm,CustomerTaxForm,CustomerPaymentForm,CustomerBankAccountForm,CustomerRiskRegister}.tsx` |
| Customer list | Searchable/filterable table with types/statuses; create/edit routes. | `apps/erp/app/modules/sales/ui/Customers/CustomersTable.tsx`, `apps/erp/app/routes/x+/sales+/customers.tsx` |

**BOSS implications.** Carbon's sidebar suggests a good density for a 360 record: each
tab is a focused form/list, not a dashboard. For Customer Service, the equivalent tabs
would be Cases, Contacts, Orders, Returns, Invoices (read-only), Files and Notes.
Risk/credit tabs are the Accounting version's emphasis; the Customer Service version
could show them read-only when the viewer has permission.

### Twenty — configurable record page

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Record show page | Configurable page layout per object: fields, timeline, notes, tasks, emails/email thread, files, calendar, chat, call recording; header with record title/identifier bar, actions and navigation between records. | `packages/twenty-front/src/pages/object-record/{RecordShowPage,RecordShowPageShell,RecordShowPageContent}.tsx`, `packages/twenty-front/src/modules/page-layout/widgets/` |
| Timeline widget | Aggregated activity history with type filters, month grouping, linked-record metadata and diff rendering. | `packages/twenty-front/src/modules/activities/timeline-activities/{components,hooks,utils}/` |
| Company/People record pages | Standard objects use the same record shell; companies show people/opportunities, people show company/activities. | `packages/twenty-front/src/modules/{companies,people}/` |

**BOSS implications.** Twenty is the reference for user-arrangeable record pages. It
points away from a service-only customer page and toward the reused Customer 360 as a
Party record page whose widgets each including app registers and users then arrange. The
timeline widget is the same activity feed cases and orders need, which favors one
component over three.

### Akaunting / Moqui Sales — lighter customer surfaces

- **Akaunting:** customer show page is a contact card plus tabs/actions from the
  contacts module; the customer *portal* dashboard shows contact info, last payment,
  outstanding balance, latest invoices, invoice history and payment history. Useful for
  the customer-facing balance view, not for service.
- **Moqui Sales:** `ViewAccount` shows contact methods, related contacts, opportunities
  and orders in a three-column layout with a tabbed center panel; it is a working
  pattern for a Moqui-native 360 but stops short of cases, invoices or balances.

---

## 6. Order lookup & changes

### ERPNext — sales order desk + customer portal

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Sales Order list | Searchable list by customer/status/date; list settings and standard filters. | `erpnext/selling/doctype/sales_order/`, `erpnext/selling/doctype/sales_order/sales_order_list.js` |
| Sales Order form | Customer/address/contact, order date + delivery date, order lines, taxes, status, delivery/billing progress (`per_delivered`, `per_billed`, `per_picked`, `delivery_status`, `billing_status`), advance payment status, stock reservation state, delivery schedule dialog, Create buttons (Delivery Note, Sales Invoice, Payment, etc.). | `erpnext/selling/doctype/sales_order/{sales_order.json,sales_order.js}`, `erpnext/selling/doctype/sales_order/test_sales_order.py` |
| Portal order list | `/orders` route renders the customer's Sales Orders with order number, date, shipping status (pending/started/partial/full), total and status; pagination and search. | `erpnext/hooks.py` (`/orders` -> `Sales Order`), `erpnext/controllers/website_list_for_contact.py` |
| Portal order detail | `/orders/<name>` renders the submitted order: header status, customer/contact, item table, taxes, addresses, payment button when a payment request is allowed, print action, attachments, sidebar invoices. | `erpnext/templates/pages/order.{html,py}`, `erpnext/templates/includes/order/order_taxes.html`, `erpnext/hooks.py` |
| Portal invoices/shipments | `/invoices` and `/shipments` route to Sales Invoice / Delivery Note lists and detail pages with the same document shell. | `erpnext/hooks.py` portal route rules |
| Credit note / return | Sales Invoice has `Is Return (Credit Note)`, `Return Against`, `Is Rate Adjustment Entry (Debit Note)`; a submitted invoice exposes "Return / Credit Note". Delivery Note exposes "Sales Return" and carries `Is Return` + `Return Against Delivery Note`. | `erpnext/accounts/doctype/sales_invoice/{sales_invoice.json,sales_invoice.js,mapper.py}`, `erpnext/stock/doctype/delivery_note/{delivery_note.json,delivery_note.js,mapper.py}`, `erpnext/controllers/sales_and_purchase_return.py` |

**BOSS implications.** This suggests that Customer Service include the reused Order
detail with a service action set, as ERPNext reuses one Sales Order form but shows
different Create buttons by permission. The portal list shows delivery and invoice
progress at a glance; the detail shows items, addresses, tracking, invoices and returns.
Editing rules follow the order status: draft can change, submitted can only be
amended/cancelled per policy; an explicit "request change" action for service staff is
an alternative to silent edit rights.

### Odoo — portal order page + back-office sale order

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Portal order list | `/my/orders`: search, sort by order date, order number/date/shipping status/total; quotations page is the same shell. | `odoo/addons/sale/controllers/portal.py`, `odoo/addons/sale/views/sale_portal_templates.xml` (`portal_my_orders`) |
| Portal order detail | Order status, order lines, totals, delivery/invoice sidebar, addresses, payment/sign modals, "Order Again", download/print, invoice download; `sale_stock` adds delivery tracking and a Return button. | `odoo/addons/sale/views/sale_portal_templates.xml` (`sale_order_portal_template`, `sale_order_portal_content`), `odoo/addons/sale_stock/views/sale_stock_portal_template.xml`, `odoo/addons/sale_stock/controllers/portal.py` |
| Back-office sale order | Status bar, customer/address/payment terms, order lines with availability/forecast, delivery and invoice stat buttons, chatter, confirm/cancel/lock actions. | `odoo/addons/sale/views/sale_order_views.xml` |
| Order-again flow | Portal action re-adds the same lines to a new cart/order. | `odoo/addons/sale/views/sale_portal_templates.xml` |
| Repair order | For service-repair cases: draft → confirmed → done, parts/services, reserve/unreserve, quote/invoice, forecasted availability. | `odoo/addons/repair/views/repair_views.xml`, `odoo/addons/repair/models/repair.py` |

**BOSS implications.** Odoo's portal is the best customer-facing order reference:
shipping status pills, invoice sidebar, reorder, payment and a return entry point. One
option is the same read-only order view in Customer Service's version of Order detail,
with the service actions (case link, return, address change request) and without general
sales edit rights. "Order Again" fits the Sales and Commerce versions rather than the
service one.

### Dolibarr — order card and shipment tracking

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Order list | Filters by ref/customer/date/status/warehouse/project; create order; mass actions; export. | `htdocs/commande/list.php` |
| Order card | Header with ref/customer/status, lines, availability delay selector, warehouse selector, shipping method, notes, linked documents/events; actions Validate, Modify, Create Shipment, Create Bill, Classify Shipped, Close, Cancel, Reopen. | `htdocs/commande/card.php`, `htdocs/commande/class/commande.class.php` (`STATUS_*`) |
| Shipment card | Lines with qty shipped/to ship, warehouse stock warnings, tracking number and tracking URL, shipping date, signed status, documents/notes/events. | `htdocs/expedition/card.php`, `htdocs/expedition/class/expedition.class.php` |
| Customer order/shipment tabs | Customer card links to filtered orders/invoices/shipments through module tabs. | `htdocs/core/lib/company.lib.php`, `htdocs/societe/card.php` |
| Web portal | Customer login portal with lists of the customer's proposals, orders, invoices, interventions and tickets, shared documents, member and partnership cards. | `htdocs/webportal/controllers/{orderlist,invoicelist,propallist,ticketlist,ficheinterlist,shareddocuments}.controller.class.php` |

**BOSS implications.** Dolibarr's order card is a good model for the service action set:
Validate, Create Shipment, Create Bill, Classify Shipped, Close, Cancel and Reopen are
explicit buttons rather than a free-form status dropdown. For Customer Service, one
option is the read-only subset plus Cancel/Return/Address change requests. Tracking
number and tracking URL sit on the shipment, not the order.

### Carbon — order table and route-level actions

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Sales order list | Table columns: Sales Order Number, Customer, Status, Jobs, Customer PO, Order Date, Order Total, Assignee, Promised Date, Shipping Method, Location, Payment Terms, Drop Shipment, Created/Updated By/At. Favorite filter route. | `apps/erp/app/modules/sales/ui/SalesOrder/SalesOrdersTable.tsx`, `apps/erp/app/routes/x+/sales+/orders.tsx`, `apps/erp/app/routes/x+/sales-order+/orders.favorite.tsx` |
| Sales order detail routes | Shell + tabs: details, lines, line jobs, line shipment, shipment, payment, invoice summary, status, confirm, cancel preview, contract, exchange rate; delete line/order. | `apps/erp/app/routes/x+/sales-order+/` (`$orderId.*`), `apps/erp/app/modules/sales/ui/SalesOrder/` |
| Order status | Draft, In Progress (jobs incomplete), Needs Approval, To Ship and Invoice, To Ship, To Invoice, Completed, Cancelled, Closed; status badge colors and job-derived "In Progress". | `apps/erp/app/modules/sales/sales.models.ts` (`salesOrderStatusType`), `ui/SalesOrder/SalesStatus.tsx` |
| Customer portal | Portal configuration per customer (create/edit/delete) and portal line/operation progress UI; portal implementation is Enterprise (`ee`). | `apps/erp/app/routes/x+/sales+/customer-portals*.tsx`, `apps/erp/app/modules/sales/ui/CustomerPortals/*.ee.tsx`, `apps/erp/app/modules/sales/ui/CustomerPortal/` |

**BOSS implications.** Carbon's route-per-action model is a candidate: confirm,
cancel, shipment, payment and invoice are separate routes with their own permissions and
validation, not one giant form. Customer Service's version of order detail could use the
same shell and mount only the read-only tabs plus service actions; the route-level
separation makes that authz easy.

### Moqui Sales — Find/View Order (alpha)

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Find Order | Saved finds, CSV/XLSX export, selectable columns, filters by account, order ID/name, status, total range; create-order dialog (store, customer); row links to account/order. | `screen/Sales/Order/{FindOrder.xml,FindOrder.qvue}` |
| View Order | Order header (status, created, grand total, customer email), ship-to/bill-to blocks with address selection and editing, shipping method + live shipping options, payment information; menu title "View Order (alpha)" with placeholder toolbar text "Put order buttons here (change status, etc)". | `screen/Sales/Order/{ViewOrder.xml,ViewOrder.qvue}` |
| Account → orders | `ViewAccount` lists the account's orders and links each to View Order. | `screen/Sales/Account/ViewAccount.xml` |

**BOSS implications.** Moqui Sales proves the data path (Mantle order views, party
contact info, shipping options) but not the finished UI: the order screen openly lacks
status actions, shipments, invoices and returns. The Mantle lookups are reusable; the
action set is missing, which makes the alpha screen a weak base to port as-is. The fuller
baseline is
SimpleScreens `OrderDetail.xml` (status actions, shipments, invoices, Create Return; §12).

### Akaunting — invoices, not orders

Akaunting has no sales-order entity in this checkout. Its customer portal shows invoices,
payments and outstanding balance (`resources/views/portal/`), and the back office has
Sales → Customers/Invoices. It is a reference for the *billing* side of order lookup,
not for order lifecycle.

---

## 7. Returns / RMA

### Carbon — complete RMA workflow

| Screen/page | What it is | Key files |
| --- | --- | --- |
| RMA list | Table columns: RMA Number, Customer, Status, Customer Reference, Order Date, Received, Credited, Assignee, Created At; searchable/filterable. | `apps/erp/app/modules/sales/ui/SalesReturnOrders/SalesReturnOrdersTable.tsx`, `apps/erp/app/routes/x+/sales+/rmas.tsx` |
| New/edit RMA | Customer, contact, location, source sales order, RMA ID, order date, expiration, currency, status; description: "A return merchandise authorization (RMA) authorizes a customer to return goods for credit, replacement, or repair." | `apps/erp/app/modules/sales/ui/SalesReturnOrders/SalesReturnOrderForm.tsx`, `apps/erp/app/routes/x+/sales-return-order+/new.tsx` |
| Returnable lines picker | Loads delivered, returnable shipment lines; snapshots item/price/UoM/sales-order line; quantity clamped to `returnableQuantity`; submits all selected lines. | `apps/erp/app/modules/sales/ui/SalesReturnOrders/ReturnableLinesModal.tsx`, `apps/erp/app/routes/x+/sales-return-order+/returnable-lines.tsx` |
| RMA detail / summary | Header actions Confirm (draft), Cancel, Receive (To Receive), Ship and Issue Credit (once something is received), Create Replacement / Replacement Order, Reopen, Delete; line summary with ordered/received quantities, restock fee, subtotal/total. | `apps/erp/app/modules/sales/ui/SalesReturnOrders/{SalesReturnOrderHeader,SalesReturnOrderSummary,SalesReturnOrderStatus}.tsx`, `apps/erp/app/routes/x+/sales-return-order+/$id.tsx` |
| Line details | Source linkage (shipment/order/invoice line), item, return quantity, unit price, restock fee percent, return reason, disposition; "Resume/Stop Receiving". | `apps/erp/app/modules/sales/ui/SalesReturnOrders/SalesReturnOrderLineForm.tsx`, `apps/erp/app/routes/x+/sales-return-order+/$id.$lineId.details.tsx` |
| Disposition / issue | Line disposition picker: Pending, Return to Customer, Rework, Scrap, Use As Is; Scrap/Rework are set through an issue (non-conformance) escalation; receiving is opened/closed per line. | `apps/erp/app/modules/sales/sales.models.ts` (`salesReturnDispositionType`), `apps/erp/app/routes/x+/sales-return-order+/$id.$lineId.{disposition,issue,receiving}.tsx` |
| Credit | Credits received-but-not-yet-credited quantity per line; creates a credit memo; caps enforced server-side with row locking. | `apps/erp/app/modules/sales/ui/SalesReturnOrders/SalesReturnOrderCreditModal.tsx`, `apps/erp/app/routes/x+/sales-return-order+/$id.credit.tsx` |
| Replacement | Creates a replacement sales order from the RMA. | `apps/erp/app/routes/x+/sales-return-order+/$id.replacement.tsx`, `apps/erp/app/modules/sales/ui/SalesReturnOrders/SalesReturnOrderHeader.tsx` |
| Return reasons | Return reason master with "Zero Inventory Value" flag (returned goods re-enter inventory at zero value). | `apps/erp/app/modules/sales/ui/ReturnReasons/{ReturnReasonForm,ReturnReasonsTable}.tsx`, `apps/erp/app/routes/x+/sales+/return-reasons*` |
| Data model | `salesReturnOrder` (status Draft / To Receive / Completed / Cancelled, customer, contact, location, customer reference, source and replacement sales order, order and **expiration** date, internal/external notes, **assignee**); `salesReturnOrderLine` (quantity, quantity received, unit price, **restock fee percent**, reason, source sales-order / shipment / **invoice** line, **disposition**, closed-complete); tracked-entity (serial/lot) lines; credit lines per memo with restock fee; link to non-conformance. | `packages/database/supabase/migrations/20260908142501_returns-module.sql` |

**BOSS implications.** This is the reference for the RMA screens and invariants. Mantle
already has the record (`ReturnHeader` / `ReturnItem` / `ReturnItemBilling`, see §12);
what Carbon's model has that `ReturnHeader` lacks is an authorization expiration date,
an assignee, a customer reference, internal/external notes, a per-line restock fee, a
disposition (Mantle has only `ReturnItem.inventoryStatusId` for the status of received
stock), and links to the source shipment and invoice lines
(Mantle links `orderId`/`orderItemSeqId` only). Carbon's four-state flow maps onto
Mantle's longer one (Created → Requested → Approved → Shipped → Received → Completed,
plus Manual Response Required and Cancelled). Critical invariants: returnable quantity
comes from delivered lines (Mantle `find#ReturnableOrderItems`,
`calculate#OrderItemReturnable`), credit is capped by received quantity, and
cancellation releases the authorized quantities back to the source documents.

### Odoo — portal returns, stock returns and repair

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Portal return entry | `/my/order/return_data` builds returnable lines from done outgoing moves and return reasons; portal shows a Return button when `allow_spontaneous_returns` and within `return_validity_days`. | `odoo/addons/sale_stock/controllers/return_order.py`, `odoo/addons/sale_stock/models/sale_order.py` (`_is_portal_return_allowed`) |
| Return label | Downloads a PDF return label grouped by picking, logs the returned products + reason in the order chatter. | `odoo/addons/sale_stock/controllers/return_order.py`, `odoo/addons/sale_stock/views/sale_stock_portal_template.xml`, report `sale_stock.action_report_return_label` |
| Return reasons | Return reason master + settings (allow spontaneous returns, validity days, link to reasons). | `odoo/addons/sale_stock/views/return_reason_views.xml`, `odoo/addons/sale_stock/views/res_config_settings_views.xml` |
| Stock return | Delivery/picking form exposes Return and Exchange; return creates a reverse transfer linked by `return_id`; "Returns" stat button lists them; return report grouped by reason. | `odoo/addons/stock/views/stock_picking_views.xml`, `odoo/addons/stock/models/stock_picking.py` (`action_return`, `action_exchange`, `action_see_returns`), `odoo/addons/sale_stock/views/stock_picking_views.xml` |
| Repair order | Repair workflow for returned/defective goods: confirm, reserve parts, parts/services, end repair, quote/invoice, cancel/reopen. | `odoo/addons/repair/views/repair_views.xml`, `odoo/addons/repair/models/repair.py` |
| Returns reporting | Graph/pivot over incoming pickings with `return_id`, grouped by return reason. | `odoo/addons/sale_stock/views/stock_picking_views.xml` (`action_stock_picking_return_report`) |

**BOSS implications.** Odoo separates three things: a customer-initiated return request
(portal, reason, label), the physical return transfer (stock), and the
repair/replacement/credit outcome. For Customer Service, the case would link to the
return (`ReturnHeader`, in Requested/Approved status) and show its status; the physical
receipt and the credit are the emphases of the Warehouse and Accounting versions of the
reused return screens (reused: Customer Service, Warehouse, Accounting, Commerce). "Allow
spontaneous returns" and a validity window are valuable policy switches; Mantle has
neither as a setting.

### ERPNext — delivery return + credit note + warranty claim

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Sales Return from Delivery Note | Submitted Delivery Note → Create → Sales Return; creates a return Delivery Note with `is_return`, `return_against`, inverted quantities and warehouse. | `erpnext/stock/doctype/delivery_note/delivery_note.js`, `delivery_note/mapper.py` (`make_sales_return`), `erpnext/controllers/sales_and_purchase_return.py` (`make_return_doc`) |
| Return / Credit Note from Invoice | Submitted Sales Invoice → Return / Credit Note; `is_return`, `return_against`, optional debit note; updates outstanding and stock when applicable. | `erpnext/accounts/doctype/sales_invoice/sales_invoice.js`, `mapper.py` (`make_sales_return`) |
| Warranty Claim | Separate record for serialized/defective goods with warranty/AMC status, complaint, resolution, contact and service address. | `erpnext/support/doctype/warranty_claim/warranty_claim.json` |
| Return reports | Standard Accounts Receivable and stock reports reflect returns/credit notes; no dedicated RMA entity. | `erpnext/accounts/report/`, `erpnext/stock/report/` |

**BOSS implications.** ERPNext has no RMA record: returns are negative Delivery Notes
and Credit Notes. That works for accounting but loses the authorization/reason/disposition
story. Mantle already separates the two: the RMA is `ReturnHeader`/`ReturnItem`, and the
stock and money documents hang off it (sales-return `Shipment` of type
`ShpTpSalesReturn`, `AssetReceipt`, credit-memo `Invoice` through `ReturnItemBilling`,
refund `Payment`, replacement `OrderHeader`). That shape fits the reused return screens:
the Customer Service version emphasizes authorization, Warehouse's receipt and
Accounting's credit.

### Dolibarr / metasfresh / others

- **Dolibarr** has no RMA module in this checkout. Returns are handled as credit notes
  (`compta/facture` with negative lines), stock movements, and shipment corrections;
  `fichinter` covers interventions but not return authorization.
- **metasfresh** has a real service/repair domain: `de.metas.servicerepair` service
  projects, warranty cases, customer-return handling units (`HUsToReturn`), spare-parts
  return calculation and repair manufacturing orders. The UI is backend-window based,
  so it is a model reference rather than a screen reference.
- **Akaunting / AureusERP / Moqui Sales / Twenty** have no RMA UI in this
  checkout. AureusERP inventories has receipts, deliveries, dropship, internal transfers,
  replenishment and scrap but no customer-return resource.

---

## 8. Availability lookup

### Odoo — forecasted report + product/stock stat buttons

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Forecasted report | Client action with warehouse filter; header cards On Hand, Incoming, Outgoing, Forecasted; graph over `report.stock.quantity`; details table with Available, Outgoing, used-by document links, `Not Available`, and future forecast including draft transfers; Replenish and Update Quantity buttons. | `odoo/addons/stock/static/src/stock_forecasted/{stock_forecasted.xml,forecasted_header.xml,forecasted_details.xml,forecasted_graph.xml,forecasted_buttons.xml,forecasted_warehouse_filter.xml}`, `odoo/addons/stock/views/stock_forecasted.xml` |
| Product form/list | On Hand, Free to Use, Incoming, Outgoing, Forecasted; stat button to open quants/forecast; list filters "Available Products" and "Negative Forecasted Quantity"; forecast widget on lines. | `odoo/addons/stock/views/product_views.xml`, `odoo/addons/sale/views/product_views.xml`, `odoo/addons/stock/static/src/widgets/forecast_widget.xml` |
| Stock move/picking lines | `forecast_availability` widget shows availability inline on operations. | `odoo/addons/stock/views/stock_picking_views.xml` |
| Replenishment | Replenish wizard and replenishment info; used from forecast and reordering rules. | `odoo/addons/stock/wizard/{product_replenish.py,product_replenish_views.xml,stock_replenishment_info.py,stock_replenishment_info.xml}` |

**BOSS implications.** This is the strongest availability reference for Customer
Service: one product/warehouse view with On Hand, Incoming, Outgoing, Forecasted and the
list of documents consuming/producing stock, plus promise dates. Customer Service's
version of the reused Inventory availability screen would be read-only; the Purchasing
and Warehouse versions add the replenish actions. The "Forecasted with Pending"
row is important because it answers the customer's real question ("can you still ship
it?") rather than only what is physically on the shelf.

### ERPNext — Stock Balance + Item Dashboard

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Stock Balance page | Item/warehouse/item-group filters, sortable by Projected Qty, Reserved Qty, Reserved for Production/Subcontract/Production Plan, Reserved Stock, Ordered Qty, Requested Qty, Planned Qty, Actual Qty; item dashboard drill-down. | `erpnext/stock/page/stock_balance/stock_balance.js`, `erpnext/stock/dashboard/item_dashboard.py` |
| Item dashboard | Per-item warehouse breakdown with actual/projected/reserved quantities and links to stock ledger entries. | `erpnext/stock/dashboard/{item_dashboard.js,item_dashboard_list.html}`, `erpnext/stock/doctype/item/item_dashboard.py` |
| Stock projected qty report | Projected quantity report (actual + incoming − outgoing/reserved) by item/warehouse. | `erpnext/stock/report/stock_projected_qty/` |
| Stock Balance report | Detailed balance report with opening/balance/value; supports dimensions and stock ageing. | `erpnext/stock/report/stock_balance/stock_balance.py` |

**BOSS implications.** ERPNext exposes the full set of quantity buckets, which is more
than a support agent needs. For Customer Service, a candidate set is On Hand, Reserved,
Incoming, Projected and the next expected receipt date; Ordered/Requested/Planned suit
the Purchasing version. One reused screen over Mantle inventory keeps the "projected"
definition the same everywhere instead of recalculating it in a service screen.

### Carbon — inventory quantities table + item details

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Inventory table | Searchable item list with On Hand, Days (of supply remaining), Lead Time, Reorder Policy, Replenishment, Usage/Day (30d/90d), On Purchase Order, On Jobs, On Production Demand, On Sales Order, Demand Forecast, UoM, item attributes, storage types/units. | `apps/erp/app/modules/inventory/ui/Inventory/InventoryTable.tsx`, `apps/erp/app/routes/x+/inventory+/{_index,quantities}.tsx` |
| Item quantity details | Quantity panel: On Hand, On Purchase Order, On Sales Order, On Production Order, On Production Demand; storage units and ledger activity tabs. | `apps/erp/app/modules/inventory/ui/Inventory/{InventoryDetails,InventoryStorageUnits,InventoryActivity}.tsx` |
| Stock movements / traceability | Movement list and traceability graph for lot/serial and document lineage. | `apps/erp/app/modules/inventory/ui/{StockMovements,Traceability}/` |
| Replenishment | Reordering policies and replenishment system fields on the inventory table. | `apps/erp/app/modules/inventory/ui/Inventory/InventoryTable.tsx` |

**BOSS implications.** Carbon's table is excellent for a warehouse/purchasing user but
too dense for support. One option for Customer Service is the same query with a fixed
column set: On Hand, On Sales Order, On Purchase Order, On Jobs, Days, Lead time, Demand
forecast. The "Days" (supply remaining) and "Lead Time" pair is the fastest way to answer
"when can I get more?".

### Dolibarr — product stock card and stock-at-date

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Product stock card | Per-product/per-warehouse stock, alert threshold, desired stock, lot/serial detail, stock movements. | `htdocs/product/stock/product.php`, `htdocs/product/stock/class/productstockentrepot.class.php` |
| Stock list / movements | Stock by warehouse, movement list, mass stock move, valuation, lots/serials. | `htdocs/product/stock/{index,movement_list,massstockmove,valo,productlot_list}.php` |
| Stock at date | Historical stock lookup by date. | `htdocs/product/stock/stockatdate.php` |
| Replenishment | Replenishment orders and replenishment planning pages. | `htdocs/product/stock/{replenish,replenishorders}.php` |

**BOSS implications.** Dolibarr's stock-at-date is a cheap feature with high support
value ("what did we have when the order was promised?"). In Customer Service it would
be read-only, linked from the order/availability view.

### AureusERP / Moqui Sales / Akaunting

- **AureusERP** has a Quantity resource with Location, Storage Category, Product,
  Product Category, Lot, Package, Available Quantity, On Hand, UoM, Counted, Difference,
  Scheduled At and group/filter by all of those. It is an Odoo-derived inventory
  quantity view, not a customer-facing availability lookup.
- **Moqui Sales** has no availability screen in the Sales component; availability is
  expected from the Mantle/SimpleScreens inventory side (see
  [usl-inventory.md](usl-inventory.md) and [ss-inventory.md](ss-inventory.md)).
- **Akaunting** has items but no stock ledger or availability lookup in this checkout.

---

## 9. Knowledge base & self-service

### Frappe Helpdesk — article library, public KB and in-form suggestions

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Agent KB list | Knowledge Base header + Create menu (Category / Article); list builder grouped by category, row click opens article; category actions (edit, move articles, merge category, delete); article bulk actions. | `desk/src/pages/knowledge-base/KnowledgeBaseAgent.vue`, `desk/src/components/knowledge-base/{CategoryFolder,CategoryFolderContainer,CategoryModal,MoveToCategoryModal,MergeCategoryModal,ArticleCard}.vue` |
| Article view/edit | Title (inline textarea), category link, rich-text editor, Draft/Published/Archived badge, Publish/Unpublish, views, likes/dislikes, author/time, delete, discard/save. | `desk/src/pages/knowledge-base/Article.vue`, `NewArticle.vue`, `desk/src/components/editor/config.ts` |
| Public customer KB | Search popover ("Ask a question..."), category folders, article cards; article page with title, author, modified time, content and "Was this article helpful?" thumbs up/down; if not resolved, link to create a ticket. | `desk/src/pages/knowledge-base/{KnowledgeBaseCustomer,Articles,Article}.vue`, `desk/src/components/knowledge-base/ArticleFeedback.vue`, `desk/src/components/SearchPopover.vue` |
| Article search | Full-text search over published articles; results include title, matched headings and a snippet; filters stale hits whose article is no longer published; falls back through AND/OR/noun-phrase query variants. | `helpdesk/api/article.py`, `helpdesk/search.py`, `desk/src/components/SearchArticles.vue` |
| Article stats/feedback | Views, likes, dislikes and per-user article feedback; ticket rating presets live in `hd_ticket_feedback_option`. | `helpdesk/api/article.py`, `helpdesk/helpdesk/doctype/{hd_article,hd_article_feedback,hd_ticket_feedback_option}/` |
| KB settings | Workflow/Knowledgebase settings (prefer knowledge base before ticket creation), branding, ticket settings. | `desk/src/components/Settings/General/components/{WorkflowKnowledgebaseSettings,Branding,TicketSettings}.vue`, `helpdesk/api/config.py` |
| Article categories | Category name, published article count, General reserved category, merge/move actions, move guard (cannot leave a category empty). | `helpdesk/api/knowledge_base.py`, `helpdesk/helpdesk/doctype/hd_article_category/` |

**BOSS implications.** This is the closest reference for Customer Service KB links: a
category tree, full-text search, article view with helpful/not-helpful feedback, and an
inline suggestion block on case intake. The evidence favors articles stored once as wiki
content (reused: Commons, Customer Service), with a service-scoped read view in Customer
Service, over a parallel KB. The two features that stand out are (1) suggestions after the
customer types a subject, not only after submit, and (2) "if this did not help, open a
case" on every article. The `preferKnowledgeBase` switch is a useful policy knob.

### ERPNext / Frappe framework — Help Articles + support search sources

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Help Article | Title, category, published flag, author, level (Beginner/Intermediate/Expert), rich content, likes, route, helpful/not-helpful counts; web-viewable. | `frappe/website/doctype/help_article/help_article.json`, `templates/{help_article,help_article_list,help_article_row}.html` |
| Help Category | Category tree/master for articles. | `frappe/website/doctype/help_category/` |
| Support portal | Greeting title/subtitle, "Get Started" sections, favorite/most-viewed articles, help article list, latest forum posts, user's recent issues, create-ticket CTA. | `erpnext/templates/pages/help.{html,py}`, `erpnext/www/support/index.py` |
| Help search | `/search_help` search page over articles and optional external sources. | `erpnext/templates/pages/search_help.html`, `support_search_source` child table |
| Search sources | Each source has name/type (API or Link), base URL, query route, search-term parameter, response result key path, post route/keys, or a source DocType with title/preview/route fields. | `erpnext/support/doctype/support_search_source/support_search_source.json` |
| Support settings | Greeting title/subtitle, get-started sections, forum URL/query/key mapping, search APIs, SLA toggles, close-after-days. | `erpnext/support/doctype/support_settings/support_settings.json` |

**BOSS implications.** ERPNext's external search sources are directly relevant to a
business-in-a-box: the KB search can federate the wiki, product docs, forum and even an
external knowledge API without copying content. One option is one search interface
with per-source route/preview mappings. The "most viewed articles" list is a cheap
self-service default when there is no query.

### Dolibarr — knowledge records tied to ticket categories

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Knowledge list | Search/filter by question, language, category, status (Draft / Validated / Obsolete); mass actions; create. | `htdocs/knowledgemanagement/knowledgerecord_list.php` |
| Knowledge card | Question, language, categories, answer (rich text, with layout/AI fill helpers), suggested ticket category, status, notes/documents, agenda, contacts. | `htdocs/knowledgemanagement/knowledgerecord_card.php`, `htdocs/knowledgemanagement/class/knowledgerecord.class.php` |
| Ticket form integration | On selecting a ticket category, AJAX loads matching knowledge records and lists them under "Knowledge found for ticket group"; can open the article in a dialog. | `htdocs/core/class/html.formticket.class.php` |
| Knowledge dashboard | Module home with recent/draft records and quick links; no public customer portal in this checkout. | `htdocs/knowledgemanagement/knowledgemanagementindex.php` |

**BOSS implications.** Dolibarr's category→article link is the low-cost integration:
each request type/category can list relevant KB articles even without full-text search.
Its language field matters for BOSS's multilingual support; it suggests keying articles
by language and category, not just title.

### Frappe Wiki — shared knowledge source with feedback

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Wiki spaces | All Spaces list with search, restricted-access markers, create space, space details. | `frontend/src/pages/{AllSpaces,SpaceDetails}.vue`, `frontend/src/components/{SpaceSidebar,SpaceTreePanel,SpaceWelcome}.vue` |
| Wiki page editor/viewer | Rich-text editor, table of contents, version/diff viewer, contributions and review queue, assignment, page settings. | `frontend/src/components/{WikiEditor,WikiContentViewer,WikiDocumentPanel,DiffViewer,ContributionsPanel,DraftContributionPanel,SubmitForReviewButton,AssignDialog,PageSettingsPanel}.vue`, `frontend/src/pages/{Contributions,ContributionReview}.vue` |
| Command palette | Jump to pages/spaces and run actions. | `frontend/src/components/CommandPalette.vue` |
| Page feedback | Reader feedback per page: rating, Good / Ok / Bad, comment, optional email, Open / Closed triage status; settings to enable feedback and limit submissions. | `wiki/wiki/doctype/wiki_feedback/`, `frontend/src/components/WikiSettings/FeedbackPanel.vue` |
| Analytics | Views and new visitors over time, top pages, date presets. | `frontend/src/components/Analytics/{AnalyticsDashboard,TopList}.vue` |

### Nextcloud Collectives — team wiki

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Collective pages | Page tree with favorites, subpages, drag-to-move and trash; new-page dialog; landing page with recent pages and members widgets; tags; search dialog. | `collectives/src/components/PageList/`, `collectives/src/components/Page/{LandingPageWidgets,SearchDialog,PageTags,TagsModal}.vue` |
| Page sidebar | Tabs for attachments, backlinks, sharing (public links) and versions with compare and labels. | `collectives/src/components/PageSidebar/{SidebarTabAttachments,SidebarTabBacklinks,SidebarTabSharing,SidebarTabVersions,VersionComparisonDialog}.vue` |
| Page reference widget | Link preview card when a page is referenced elsewhere in Nextcloud. | `collectives/src/views/PageReferenceWidget.vue` |

Collectives is also catalogued in [research-drawers-commons.md](research-drawers-commons.md).

**BOSS implications.** The references favor authoring knowledge articles in the wiki
rather than a service-only editor; Customer Service can include the article authoring
screen reused from Commons beside a read/search surface with "link this case to this
article" and "suggest an article edit" actions. Frappe Wiki's contribution review is a
good pattern if articles are editable by many staff, and its page feedback with
Open/Closed triage is the "article did not help" loop Customer Service would feed.
Collectives' backlinks tab is a cheap way to show which cases cite an article.

### Ever Gauzy — internal Help Center

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Help Center | Knowledge bases (name, icon, color, description) and categories in a sidebar tree; article list with search by name, filter by author, draft flag, created date; add/delete article dialogs (name, description, rich body). | `apps/gauzy/src/app/pages/help-center/`, `packages/ui-core/shared/src/lib/sidebar/knowledge-base/` |

Internal only: no public portal and no link to a case.

### Moqui WorkManagement — native wiki and task surfaces

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Wiki spaces | Moqui screen rendered as a QVue app; space list/detail for wiki content. | `screen/wiki/{WikiSpaces,WikiDetail}.xml`, `screen/wiki/Wiki/{WikiSpaces,WikiDetail}.qvue` |
| Wiki blog posts | Blog-post list/detail alongside the wiki; useful when KB content is published as articles/blog entries. | `screen/wiki/WikiBlogs.xml`, `screen/wiki/WikiBlogs/` |
| Task screen | QVue task workspace: saved finds by person/role/project/status, text search, assignee/project/status/priority editing, due date, mark complete, task comments. | `screen/wm/Task.xml`, `screen/wm/Task/Task.qvue` |

**BOSS implications.** This is the Moqui-native proof that a wiki list/detail and a
task workspace can be built with screens plus QVue. Its saved-find pattern suits service
queues and its task screen suits follow-up actions created from a case. The wiki screens
are thin compared with Frappe Wiki, so the fuller KB authoring screen is the one reused
from Commons.

---

## 10. Feedback, reporting & settings

### Frappe Helpdesk — CSAT + operational analytics

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Ticket feedback | Customer "Rate this ticket" dialog: 1–5 stars, preset options filtered by rating, free-text "Tell us more"; stored on the ticket (`feedback_rating`, `feedback`, `feedback_extra`) and shown in the agent sidebar. | `desk/src/pages/ticket/TicketFeedback.vue`, `desk/src/components/ticket-agent/TicketFeedback.vue`, `hd_ticket_feedback_option`, `hd_email_feedback` |
| Feedback options | Rating, label, disabled; per-rating preset choices. | `helpdesk/helpdesk/doctype/hd_ticket_feedback_option/` |
| CSAT metrics | Avg. Feedback Rating card (/5) with delta; feedback trend chart plotted on resolution date; customer/contact stats card with review count. | `helpdesk/api/dashboard.py`, `helpdesk/api/ticket_stats.py`, `desk/src/components/customer/TicketStats.vue` |
| Operational metrics | Tickets created, % SLA fulfilled, Avg. First Response, Avg. Resolution, failed SLAs, channel/team/type/priority/tag charts. | `helpdesk/api/dashboard.py`, `dashboard_tags.py`, `ticket_analytics.py` |
| Ticket analytics tab | Per-ticket metric cards, conversation summary and timeline. | `desk/src/components/ticket-agent/analytics/` |
| Export | Queue export modal (export selected vs all) and CSV/XLSX flows. | `desk/src/pages/ticket/Tickets.vue`, `desk/src/components/ticket/ExportModal.vue` |

**BOSS implications.** The references treat CSAT as first-class on the case: rating +
preset reason + free text, captured at close and visible on the case and Customer 360.
Survey forms are reused (framework `DbForm` + `FormResponse`; reused: Marketing,
Customer Service, People), so the CSAT form can be a survey form that Customer Service
includes, sends and reads; the case would need a link to the response and a stored rating
for reporting (`FormResponse` has no record link today). Frappe reports CSAT by
resolution date, not creation date. Its minimum service dashboard is cases, SLA %, first
response, resolution and CSAT; channel/team/type/tag breakdowns are the next layer.

### Odoo — rating mixin (CSAT on any record)

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Rating request page | Public token page: pick Happy / Neutral / Unhappy, optional free-text feedback, "Thank you for your feedback!". | `odoo/addons/rating/views/rating_templates.xml`, `odoo/addons/rating/controllers/` |
| Ratings list/report | Ratings with customer, rated operator, resource and document, rating text, submitted date; filters My Ratings, Happy/Neutral/Unhappy, last 7/30/365 days; rating (/5). | `odoo/addons/rating/views/rating_rating_views.xml` |
| Rating mixin | Any model that inherits the mixin gets rating requests, rated-in-chatter messages and satisfaction percentages (used by Live Chat channels). | `odoo/addons/rating/models/{rating_mixin,rating_parent_mixin,rating}.py` |

**BOSS implications.** A three-face rating sent as a token link is the lowest-friction
CSAT; it fits the reused survey builder as a one-question form attached to the case.

### ERPNext / Dolibarr — reporting and settings

| Screen/page | What it is | Key files |
| --- | --- | --- |
| ERPNext support reports | Issue Summary, Issue Analytics, First Response Time, Support Hour Distribution; standard filters/export. | `erpnext/support/report/` |
| ERPNext support workspace | Chart, number cards and sidebar links described in §1; no per-agent home. | `erpnext/support/workspace/support/support.json` |
| Dolibarr ticket statistics | Ticket statistics page with grouping/filters; module list and dashboard. | `htdocs/ticket/stats/index.php`, `htdocs/ticket/class/ticketstats.class.php` |
| Dolibarr ticket setup | Ticket module admin (categories, types, severities, notification defaults), public portal settings, ticket email templates. | `htdocs/admin/{ticket,ticket_public,mails_ticket}.php` |

### Helpdesk settings inventory (the configuration surface to plan for)

| Area | Settings that shape screens/behaviour | Files |
| --- | --- | --- |
| General / branding | Logo, brand color/name, ticket settings (auto-close, allow anyone to create, default type, restrict by agent group, prefer KB, skip email workflow). | `desk/src/components/Settings/General/`, `helpdesk/api/config.py` |
| Agents & teams | Agents, active flag, availability, teams, team members, assignment rule per team. | `helpdesk/helpdesk/doctype/{hd_agent,hd_team}/`, `desk/src/components/Settings/Agents.vue`, `desk/src/components/Settings/Teams/` |
| Assignment rules | Priority, conditions, assign/unassign, distribution mode, users, days, close condition. | Frappe core Assignment Rule, `desk/src/components/Settings/Assignment Rules/` |
| SLA | Policies, priorities, working hours, holidays, default/reopen status; pause/fulfil from status categories. | `helpdesk/helpdesk/doctype/hd_service_level_agreement/`, `desk/src/components/Settings/Sla/` |
| Saved replies | Title, message, scope (Global/Team/Personal), teams, actions (set fields, assign, tags, comment). | `helpdesk/helpdesk/doctype/hd_saved_reply/`, `desk/src/components/Settings/SavedReplies/`, `desk/src/components/SavedReplyActions/` |
| Email | Email accounts, inbound/outbound config, notifications (acknowledgement, reply-to-agents, reply-via-agent, share-feedback). | `desk/src/components/Settings/{EmailAccountList,EmailAccountCard,EmailAdd,EmailEdit,EmailConfig}.vue`, `desk/src/components/Settings/EmailNotifications/` |
| Telephony | Exotel/Twilio credentials and call UI settings; call logs. | `desk/src/components/Settings/Telephony/`, `desk/src/pages/call-logs/` |
| Fields/templates | Ticket templates, template fields, field layout, form scripts, field dependencies. | `helpdesk/helpdesk/doctype/{hd_ticket_template,hd_ticket_template_field,hd_field_layout,hd_form_script}/`, `desk/src/components/Settings/FieldDependency/` |
| KB | Article categories, articles, article feedback, KB preference. | `helpdesk/helpdesk/doctype/{hd_article,hd_article_category,hd_article_feedback}/`, `desk/src/pages/knowledge-base/` |
| Preferences/profile | Theme, language/timezone, profile, password, user email settings. | `desk/src/components/Settings/{Preferences,Profile}/` |

**BOSS implications.** Most of this maps onto existing Moqui patterns: users/groups
for agents/teams, status/type masters for request classification, a calendar/holiday
record for SLA, saved finds for queues, content for KB, and settings records for
branding/email. The only genuinely new service-specific masters are request templates
with field dependencies, SLA policies, saved replies with actions, and assignment
rules. The evidence favors those as first-class records over JSON blobs.

---

## 11. Cross-app surfaces

App lists follow [research-crosscut.md](research-crosscut.md) §3–§4.

| Reused screen or link | Use in Customer Service | Other apps that include it | Reference evidence |
| --- | --- | --- | --- |
| **Request / case** | Intake form, queues, SLA clocks and case detail | Purchasing (`RqtPurchase`); Maintenance (maintenance requests); Projects (converts work to tasks, `RequestWorkEffort`); Sales (`RqtQuote`); Warehouse (`RqtInventory`); Commons (requests assigned to me) | Frappe Helpdesk ticket model and agent/customer views; ERPNext Issue; Dolibarr tickets; Moqui Request screens (§12) |
| **Customer 360** | Cases, returns and orders tabs; service stats strip (open cases, failed SLAs, first response, resolution, CSAT); contacts | Sales; Marketing; Accounting; Commerce | Frappe Helpdesk customer/contact pages and ticket stats; Dolibarr third-party Tickets tab with count; ERPNext customer dashboard "Support" group; Carbon customer sidebar |
| **Order detail** | Read-only order with a service action set: open case, create return, change or cancel request, resend confirmation | Sales; Purchasing; Warehouse; Accounting; Commerce | ERPNext Sales Order Create buttons; Odoo portal order with Return button; Dolibarr order card actions; Carbon route-per-action; Moqui Order detail **Create Return** |
| **Returns / RMA** | Authorize, approve or cancel, reasons, case link, response (credit, refund, replace), customer messages | Warehouse (return receipt and disposition, `ShpTpSalesReturn`); Accounting (credit and refund, `ReturnItemBilling`); Commerce (online returns) | Carbon RMA; Odoo portal return, stock return and return reasons; ERPNext return Delivery Note and Credit Note; Moqui Return screens |
| **Inventory availability** | Read-only on hand, reserved, available to promise, incoming with dates, per facility; no adjust or replenish actions | Warehouse; Purchasing; Sales; Manufacturing; Commerce | Odoo forecasted report; ERPNext Stock Balance and projected qty; Carbon inventory table; Dolibarr stock at date |
| **Shipment detail** | Tracking number and URL, ship and estimated delivery dates, return label | Warehouse; Sales; Purchasing; Commerce; Accounting | Dolibarr shipment card tracking; Odoo portal delivery tracking and return label; Moqui pack-time return labels |
| **Knowledge base articles** | Search, suggest on intake, link article to case (`WikiPageRequest`), suggest edit, "did not help" feedback; article authoring | Commons (wiki authoring) | Frappe Helpdesk KB and intake article suggestions; Dolibarr category → knowledge records; Frappe Wiki feedback and contribution review; ERPNext search sources |
| **Surveys / CSAT** | Send CSAT at close; show rating on the case and Customer 360; CSAT KPIs | Marketing (surveys); People (interview scorecards, training quizzes) | Frappe Helpdesk ticket feedback; Odoo rating mixin; Frappe Wiki page feedback |
| **Chatter & activities** | Case timeline of emails, comments, calls and chat; follow-up activities and tasks (**Task / work item**) | Every app's record screens; Task / work item also in Projects, Commons, Sales and People | Frappe Helpdesk activity panel; Odoo chatter; Twenty timeline widget |
| **Email, chat and phone channels** (Comms suite) | Mailbox-to-queue mapping, create-or-append case from mail or chat, reply from the case | Comms is used from every app; Marketing (campaign sends); Admin (relay, gateways) | Frappe Helpdesk email accounts and telephony; Dolibarr email collector; Redmine mail handler; Odoo Live Chat |
| **Customer agreements** | Read: warranty and service terms for the customer | Sales; Accounting (terms) | crosscut §4 (Customer Service: read) |
| **Dashboard widgets** | Landing-page KPIs: open, overdue, unassigned, SLA %, first response, resolution, CSAT | Insights; every app's landing page | Frappe Helpdesk dashboard KPI cards; ERPNext issue number cards |

**BOSS implications.** The case and the return screens are the reused screens where the
Customer Service version carries the most (intake, SLA, authorization); in the others the
Customer Service version is the same screen opened with a service context that limits
the action set.

---

## 12. Current Moqui baseline (mr-marble / MarbleERP / Mantle)

The baseline has the records Customer Service needs (`Request`, `ReturnHeader`,
`CommunicationEvent`, wiki pages, available-to-promise services) and generic screens for
each, but no service app: no queue per team, no SLA, no case conversation beyond nested
comments, and no link between a case and an order or return. MarbleERP
(`component/mr-marble/screen/marble.xml`) mounts the SimpleScreens `Request`, `Return`,
`Customer`, `Order`, `Party`, `Survey` and `Wiki` trees; its flow map
(`component/mr-marble/screen/marble/dashboard.xml`) shows customer request counts
(Submitted, In Progress) and links Sales Returns & RMA, Customer Return Shipments and
Customer Credit Memos. Moqui Sales (`3p_moqui/Sales`) adds `ViewAccount` and an alpha
`ViewOrder` (§5–§6).

### Screens

Paths are under `component/mr-marble/screen/SimpleScreens/` unless they start with
`component/`.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Find Request | Saved finds and selectable columns; filters party + role, priority, ID, name, store, project, facility, type, status, resolution, request and due dates, customer, assignee; defaults to open statuses (Draft, Submitted, Reviewed, In Progress). **New Request** dialog: customer, store, project, facility, assignee (defaults to current user), priority 1–9, due date, type (default Support), initial status (default Submitted), name, description | `Request/FindRequest.xml` (`mantle.request.RequestAndParty`) |
| Edit Request | Header form (ID, filed by, customer, store, project, facility, assignee, due date, type, resolution, name) and status change; nested comments (`RequestCommEventDetail`); parties with role and notify flag; notes; content attachments; linked task list | `Request/EditRequest.xml`, `Request/EditRequest/{RequestCommentNested,RequestCommentReply,RequestCommentUpdate}.xml` |
| Request tabs | Items (request items, create purchase order from items), Tasks (link or create tasks), Assignments (parties and roles), Wiki Pages (link pages through `WikiPageRequest`) | `Request/{EditRequestItems,EditTasks,EditUsers,EditWikiPages}.xml` |
| My Requests | The user's own open requests, New Request dialog (name, type, store, project, description), detail with comments; IronStone already has a copy under Base | `component/mr-marble/screen/MyAccount/User/Request/{MyRequests,EditRequest}.xml`, `component/mr-boss/screen/Base/User/Request/` |
| Find Return | Customer and supplier returns; **Create Customer Return** / **Create Supplier Return** dialogs | `Return/FindReturn.xml` |
| Edit Return | Header (customer, vendor, warehouse, shipping address and phone, shipment method, credit account), **Set Requested**, **Approve**, **Cancel**, audit log | `Return/EditReturn.xml` |
| Return items | Item, reason, response (Credit / Refund / Replace / Manual), immediate flag, return and received quantities, return price, response amount, inventory status, replacement product and order, credit memo invoice, refund payment; **Create Return Shipment**, **Receive without Shipment**, **Process Item Responses** | `Return/EditReturnItems.xml` |
| Add From Orders | Returnable items from the customer's orders within a look-back window; add to the return with reason and response | `Return/AddOrderItems.xml` |
| Order detail | Status actions, parts, items, shipments, invoices, notes, content, order emails; **Create Return** per part when no open return exists | `Order/OrderDetail.xml`, `Order/OrderDetail/ReturnItem.xml` |
| Customer find/edit | Find with new person / organization / sales account / sales contact; Edit Customer header links Requests (with count), Orders, Shipments To, Statement PDF | `Customer/{FindCustomer,EditCustomer,CustomerData}.xml` |
| Party tabs | Requests (add the party to a request), Messages, Emails | `Party/{PartyRequests,PartyMessages,PartyEmails}.xml` |
| Asset summary | On hand and available by product, facility, location, lot; no projected or promise-date view | `Asset/Asset/FindSummary.xml` (`AssetSummaryView`) |
| Return labels | Return labels can be requested with the outbound package label at pack time | `Shipping/PackShipment/PackPackages.xml` |
| Quick lookup, search | Lookup by ID (order, return, shipment, invoice, payment, party, product, asset); full-text search over Mantle documents (Request, Wiki Page, Order, Party, …) | `QuickLookup.xml`, `Search.xml` |
| Wiki | Spaces, page tree, pages with comments, attachments and categories, page history, **Page Requests** / Page Tasks lists, blog posts, compare | `Wiki/{WikiSpaces,EditWikiSpace,EditWikiPage,ViewWikiPage,WikiBlogs,WikiCompare}.xml`, `Wiki/wiki.xml` |
| Surveys | Survey (DbForm) builder, fields, responses and response stats; reused by Marketing, Customer Service and People (crosscut §4) | `Survey/{FindSurvey,EditSurvey,Fields,Responses,ResponseDetails,ResponseStats}.xml` |

### Data model available

| Entity / enum | What it gives Customer Service | Key files |
| --- | --- | --- |
| `mantle.request.Request` | Type, category, status (audit-logged), name, description, priority, request date, one due date (`responseRequiredDate`), resolution, store, **`salesChannelEnumId`** (Web, Phone, E-Mail, Fax, Postal Mail, … usable as intake channel), `emailContactMechId` (where to send results), facility, root work effort, filed-by party, visit | `component/mr-mantle/entity/RequestEntities.xml` |
| Request types | `RqtSupport`, `RqtInformation`, `RqtBugFix`, `RqtNewFeature`, `RqtProposal`, `RqtQuote`, `RqtInventory`, `RqtPurchase`, `RqtContact` | same |
| Request status and resolution | Draft → Submitted → Reviewed → In Progress → Completed, Cancelled; Re-open from Completed. Resolutions Fixed, Can't Reproduce, Won't Fix, Duplicate, Rejected, Insufficient Information, Completed, Unresolved. No waiting-on-customer or on-hold status, no status category | same |
| `RequestCategory` | Category tree (`parentCategoryId`) with **`responsiblePartyId`** (person or group): the nearest thing to a team or queue | same |
| `RequestParty` | Party + role over time with `receiveNotifications`; role group `RgpRequest`: Assignee, Manager, Reporter, Watcher, Customer, CustomerBillTo | same |
| `RequestCommEvent`, `RequestEmailMessage` | Case conversation as `CommunicationEvent` (types Email, Comment, Phone, Message, WebSite, FaceToFace, Letter, Fax, AutoEmail; purposes include `CpCustomerService`, `CpCustomerSupport`; threads via `parentCommEventId` / `rootCommEventId`) and raw `EmailMessage` with party and status | same, `component/mr-mantle/entity/PartyEntities.xml` |
| `RequestNote`, `RequestContent` | Internal notes; attachments typed Internal, User Defined, Documentation, Story, Image | `component/mr-mantle/entity/RequestEntities.xml` |
| `RequestItem`, `RequestItemOrder` | Product and quantity lines; a request item can point at an order item (used for purchase requests) | same |
| `RequestWorkEffort`, `WikiPageRequest` | Follow-up tasks; article links | same |
| `mantle.order.return.ReturnHeader` | Customer, vendor, status (Created, Requested, Approved, Shipped, Received, Completed, Manual Response Required, Cancelled; audit-logged), refund payment method, single-refund flag, financial account, entry date, postal and telecom contact, facility, ship method and carrier (for labels), `displayId` / `externalId` / `originId`, `supplierRmaId` | `component/mr-mantle/entity/OrderEntities.xml` |
| `ReturnItem` | Parent item, reason (13 seeded `Rrsn*` reasons, e.g. Damaged in Shipping, Defective, Wrong Item Shipped), response (`RrspCredit`, `RrspRefund`, `RrspReplace`, `RrspManual`), `responseImmediate`, item type, product and replacement product, order item, status, `inventoryStatusId` of received stock, `returnQuantity` vs `receivedQuantity`, return price, response amount and date, replacement order, financial-account transaction, refund payment; links to `AssetIssuance`, `AssetReceipt`, `ShipmentItemSource` | same |
| `ReturnItemBilling`, `ReturnContactMech` | Credit-memo invoice item per return item with quantity, amount and receipt; return contact mechanisms | same |
| `ProductStore` return settings | Return postal address for labels (`returnPostalContactMechId`), store setting `PsstGetReturnLabels`, store email types `PsetReturnAccepted`, `PsetReturnCompleted`, `PsetReturnCancelled`; no return window or self-service switch | `component/mr-mantle/entity/ProductStoreEntities.xml` |
| Order status `OrderBeingChanged` | Orders can be put into Being Changed for edits and placed again | same |
| `AssetSummaryView`, `ProductFacility` | On hand / available by product and facility | `component/mr-mantle/entity/ProductAssetViewEntities.xml`, `component/mr-mantle/entity/FacilityEntities.xml` |
| `moqui.resource.wiki.WikiPage`; data documents `MantleWikiPage`, `MantleRequest` | KB pages and requests indexed for full-text search | `components/base/framework/entity/ResourceEntities.xml`, `component/mr-mantle/data/{MantleDocumentData,MantleDocumentWorkData}.xml` |
| `moqui.screen.form.DbForm`, `FormResponse` | Survey forms and responses; a response records only `userId` and date, no link to a case | `components/base/framework/entity/ScreenEntities.xml` |
| Holidays | `WorkEffort` events with purpose `WepHoliday` in categories `HolidayUsaFed`, `HolidayUsaBank`; no working-hours entity | `component/mr-mantle/entity/WorkEffortEntities.xml`, `component/mr-mantle/data/HolidayUsaData.xml` |

**Missing for Customer Service:** SLA policy and targets; first-response and resolution
due dates kept separately (only one `responseRequiredDate`); first-responded and resolved
timestamps; pause time; status categories; CSAT on the case; tags; team membership and
agent availability; assignment rules; saved replies; case templates and field
dependencies; merged / split links; and any link from a `Request` to an `OrderHeader`,
`ReturnHeader`, `Shipment` or `Invoice` (only `RequestItemOrder` at item level). On the
return side: authorization expiration, assignee, notes, restock fee, disposition beyond
`inventoryStatusId`, and links to the source shipment and invoice lines.

### Services

| Service | Purpose | Key files |
| --- | --- | --- |
| `create#Request` (defaults status `ReqDraft`, priority 5, type `RqtSupport`, resolution `RrUnresolved`, filed by current user; takes `assignToPartyId`, `customerPartyId`), `update#Request`, `replace#RequestParty` | Case create, update, reassign | `component/mr-mantle/service/mantle/request/RequestServices.xml` |
| `create#ContactRequest`, `create#ContactRequestReCaptcha` | Public contact-us intake | same |
| `add#RequestComment`, `update#RequestComment`, `delete#RequestComment` | Comment as a `CommunicationEvent` (type Comment) joined by `RequestCommEvent` | same |
| `get#RequestContentLocation`, `create#RequestContent`, `update#RequestContent`, `save#RequestContentFile` | Attachments | same |
| `create#Return`, `create#ReturnFromOrder`, `find#OrderOpenReturns`, `find#ReturnableOrderItems`, `calculate#OrderItemReturnable`, `add#OrderItemToReturn` | Create returns and cap them by returnable quantity | `component/mr-mantle/service/mantle/order/ReturnServices.xml` |
| `request#Return`, `approve#Return`, `cancel#Return`, `cancel#ReturnItem`, `update#ReturnItem`, `delete#ReturnItem`, `update#ReturnStatus`, `checkUpdate#ReturnHeaderStatus` | Authorization flow | same |
| `create#ReturnShipment`, `add#ReturnToShipment`, `receive#ReturnShipmentItems`, `receive#ReturnWithoutShipment`, `receive#ReturnItem`, `complete#ReturnItem`, `process#ReturnItemResponses` | Receipt and response (credit, refund, replacement); also used by the Warehouse and Accounting versions of the return screens | same |
| `get#AvailableInventory`, `get#AvailableForOrder`, `get#AvailableInventoryMulti` (available to promise by product, facility or store); `check#AvailableInventory` on order items | Availability lookup | `component/mr-mantle/service/mantle/product/AssetServices.xml`, `component/mr-mantle/service/mantle/order/OrderServices.xml` |
| `get#InventoryProjectedInfo` | Projected inventory from asset, order item and production documents in the search index; no screen uses it yet | `component/mr-mantle/service/mantle/product/InventoryReportServices.xml` |
| `find#PartyCommunicationEvents`, `create#Message`, `reply#CommunicationEvent` | Party message history and replies | `component/mr-mantle/service/mantle/party/CommunicationServices.xml` |
| `org.moqui.resource.WikiServices` (`get#UserWikiSpaces`, `get#UserSpaceWikiPageSimpleList`, `get#PublishedWikiPageText`, …) | Article lookup for case links | `components/base/framework/service/org/moqui/resource/WikiServices.xml` |

No service creates or appends a case from inbound email or chat; that is the Comms
receive path (initial-design).

---

## 13. Gaps & BOSS implications

### Gaps in the reference set

- **One purpose-built service desk.** Frappe Helpdesk is the most complete
  agent + customer-portal + SLA + KB + reporting implementation in the checkout.
  ERPNext Support is the second, but its UI is generic Frappe forms. Dolibarr Tickets is
  a credible small-business third. Everything else is partial or absent.
- **No Odoo Helpdesk.** Helpdesk is Enterprise and is not in this community checkout.
  Odoo's service-relevant screens are CRM activities, Live Chat, the rating mixin, Repair
  and stock returns.
- **No RMA in ERPNext or Dolibarr.** Carbon is the only complete RMA screen set;
  Odoo has portal-initiated returns and stock returns; metasfresh has a backend
  service/repair domain. Mantle already has the record (`ReturnHeader`/`ReturnItem`);
  the screens and policies are open for the design pass.
- **No shared Customer 360 across service + orders + accounting** in any single app
  except ERPNext's Customer Overview, which is sales/accounts-centric and has no cases.
- **No order-change request flow.** References allow back-office edits/cancels or
  portal reorder/returns, but none model "customer asks for an address/quantity change
  and service approves it". Mantle's `OrderBeingChanged` status covers the edit, not
  the request.
- **Availability promise dates are only strong in Odoo.** ERPNext exposes projected
  quantities, Carbon exposes days of supply and lead time, Dolibarr exposes
  stock-at-date; none combines them into a customer-facing promise date as cleanly as
  Odoo's forecast.
- **No multilingual KB outside Dolibarr.** Frappe Helpdesk articles, ERPNext Help
  Articles and Frappe Wiki pages have no language field.
- **No case-to-KB authoring workflow.** Helpdesk lets agents write articles, but not
  "convert this resolved case into an article" with redaction/review.

### Notable gaps in the Moqui baseline

- **No queue or team model.** `FindRequest` is one list with saved finds; teams exist
  only as `RequestCategory.responsiblePartyId`. No agent availability, no assignment
  rules, no bulk reply/assign.
- **No SLA.** One due date, no first-response/resolution split, no business hours, no
  pause on waiting statuses, no breach display. Holidays exist as `WepHoliday` events.
- **Thin conversation.** Comments are `CommunicationEvent` rows of type Comment; there is
  no email reply from the case, no channel filter, no composer with saved replies, and no
  inbound mail to case.
- **No case ↔ order / return links.** A case cannot show the order or return it is about;
  Order detail and Edit Return cannot show their cases.
- **Returns lack authorization detail.** No expiration, assignee, notes, restock fee or
  disposition, and Edit Return has no case link or customer message.
- **No service availability view.** `FindSummary` is a warehouse list; nothing shows
  incoming stock with dates or a promise date, and `get#InventoryProjectedInfo` has no
  screen.
- **No CSAT.** Surveys exist, but a response cannot point at a case.
- **No service landing page.** MarbleERP's flow map shows two request counts only.

### What each reference contributes

| Reference | Take |
| --- | --- |
| Frappe Helpdesk | Agent queue with views and bulk actions; template-driven intake with KB suggestions after three characters; activity-centric case page with channel tabs, fixed composer and sidebar (contact, SLA, fields, related cases); status categories Open/Paused/Resolved driving SLA; SLA with working hours, holidays and per-priority targets; assignment rules and teams; saved replies with actions; CSAT with preset reasons; customer/contact pages with service stats; KPI dashboard |
| ERPNext | Workspace landing with number cards; SLA pause/fulfil status lists and entity scope; Warranty Claim as a separate record; Customer Overview blocks gated by permission; portal order/invoice/shipment/issue lists; federated help search sources |
| Dolibarr | Small-team status ladder (need more info vs on hold); category → knowledge suggestions with language; email collector (filters + ordered operations to ticket); third-party card with module tabs and count badges; web portal; stock at date |
| Odoo | Chatter and activities; portal return with reasons, validity window and label; reverse transfers and returns report; forecasted availability report; Live Chat channels, rules, chatbots and session stats; three-face rating mixin; Repair as a separate record |
| Carbon | RMA screens and invariants (returnable from delivered lines, credit capped by received, cancel releases quantities, locked statuses); per-line disposition with non-conformance escalation; restock fee; return reasons with zero-inventory-value flag; route-per-action order detail; dense customer sidebar |
| Redmine | Email threading order (message IDs, subject tag, new case) and unknown-sender policy |
| Frappe Wiki | Contribution review; page feedback with Open/Closed triage; page analytics |
| Nextcloud Collectives | Page backlinks, versions, sharing links |
| Twenty | User-arrangeable record page and timeline widget |
| metasfresh | Handling-unit-level customer returns, warranty cases and repair projects (model reference) |
| Moqui Sales / WorkManagement | Moqui-native QVue account, order and task screens with saved finds |

### Candidate screen inventory (IronStone Customer Service)

| Area | Screens |
| --- | --- |
| Home | Landing page: KPI strip (open, overdue, unassigned, SLA %, first response, resolution, CSAT; **Dashboard widgets** (reused: Insights, every app)), my cases, team queues with counts, returns awaiting approval |
| Cases | Case queue (saved finds per team/queue, selectable columns, bulk assign/reply/status, list and board by status); **Request / case** detail (reused: Purchasing, Maintenance, Projects, Sales, Warehouse, Commons) (header with status, priority, assignee, SLA; timeline of `RequestCommEvent` with email/comment/call/chat filters; composer with saved replies; sidebar with customer card, SLA cards, linked orders/returns/articles, related cases, tasks); new case form (type/category-driven fields, KB suggestions); merge and split |
| Customer 360 (reused: Sales, Marketing, Accounting, Commerce) | Service version: cases, returns, orders, contacts, service stats, CSAT |
| Orders | Order lookup (ID, customer, email, phone; Quick lookup); **Order detail** (reused: Sales, Purchasing, Warehouse, Accounting, Commerce) with the service action set (open case, create return, change or cancel request, resend confirmation); **Shipment detail** tracking (reused: Warehouse, Sales, Purchasing, Commerce, Accounting) |
| Returns / RMA (reused: Warehouse, Accounting, Commerce) | Return list (status, customer, order, assignee, expiration); new return from order with returnable-lines picker; return detail (approve, cancel, reasons, response credit/refund/replace, customer messages, label, linked case); receipt without shipment and item responses for a business without Warehouse or Accounting; disposition and credit-memo detail (the Warehouse and Accounting emphases) shown read-only |
| Availability (reused: Warehouse, Purchasing, Sales, Manufacturing, Commerce) | Product availability lookup: on hand, reserved, available to promise, incoming with dates, per facility; stock at date |
| Knowledge (reused: Commons) | Article search and read view, article authoring, link to case, suggest edit, "did not help" feedback |
| Reports | SLA compliance, first response and resolution, volume by channel/type/category/team, CSAT results (survey responses; survey forms reused: Marketing, People), per-case analytics |
| Settings | Request types and categories (queues with responsible team), statuses with category, SLA policies with working hours and holidays, assignment rules, saved replies, case templates and fields, mailbox-to-queue mapping (over Comms mail accounts), return reasons and return policy (validity window, self-service returns) |

### Data-model findings

- **Case = `Request`.** Conversation through `RequestCommEvent` / `RequestEmailMessage`,
  tasks through `RequestWorkEffort`, articles through `WikiPageRequest`, people through
  `RequestParty` (Customer, Assignee, Watcher), team through
  `RequestCategory.responsiblePartyId`, intake channel through `salesChannelEnumId`.
  Services: `mantle.request.RequestServices.create#Request` and siblings.
- **SLA fields on the case** are missing (options: on `Request` or a one-to-one
  extension): SLA policy, first-response due (could reuse `responseRequiredDate`),
  resolution due, first responded at, resolved at, on-hold since and total hold,
  agreement status, merged-into and split-from. Candidate new records: SLA policy with
  per-priority targets, a working-hours calendar that reuses `WepHoliday` events for
  holidays, assignment rule, saved reply with actions, case template with fields and
  dependencies, case tags.
- **Statuses.** Waiting-on-customer and on-hold `Request` statuses and a status category
  (Open / Paused / Resolved) for SLA and dashboards to read do not exist; `StatusItem` has
  no category field, so one option is a small mapping record.
- **Links.** No join exists between `Request` and `OrderHeader`, `ReturnHeader`,
  `Shipment` or `Invoice`; options are joins (e.g. request-order, request-return) or the
  generic record link in crosscut §8.
- **RMA = `ReturnHeader` / `ReturnItem` / `ReturnItemBilling`** with
  `mantle.order.ReturnServices` (`create#ReturnFromOrder`, `find#ReturnableOrderItems`,
  `request#Return`, `approve#Return`, `cancel#Return`, `process#ReturnItemResponses`).
  Carbon has and Mantle lacks: authorization expiration date, assignee (no return-party
  record exists), customer reference, notes, per-line restock fee, disposition (the
  Warehouse version's emphasis; today only `inventoryStatusId`), source shipment and
  invoice line links. Return reasons fit the `ReturnReason` enumerations; a
  zero-inventory-value flag would need an attribute.
- **CSAT** fits the reused survey forms (`DbForm` / `FormResponse`); it lacks a
  response-to-case link and a stored rating on the case for reporting.
- **Availability** reads `mantle.product.AssetServices.get#AvailableInventory*` and
  `InventoryReportServices.get#InventoryProjectedInfo`; no new records.

### Sequencing notes

- **Cheap from the baseline:** a case queue (`FindRequest` saved finds per category), case
  detail with the comment timeline (`RequestCommEvent`), the new case form
  (`create#Request`), manual assignment defaulting to the category's responsible party
  (`RequestCategory.responsiblePartyId`), order lookup with Create Return
  (`OrderDetail.xml`, Quick lookup), returns list and detail on `ReturnHeader` with the
  existing services, read-only availability from `get#AvailableInventory`, article search
  and link through `MantleWikiPage` and `WikiPageRequest`, and landing counts (open,
  overdue, unassigned) over `Request`.
- **Needs new records first:** SLA pause depends on the waiting/on-hold statuses and the
  status category; SLA due dates and breach flags depend on the SLA policy and a
  working-hours calendar (holidays already exist as `WepHoliday` events); showing linked
  orders and returns on the case, and cases on Order detail and Edit Return, depends on
  the case ↔ order/return links.
- **Depends on other suites or apps:** the email timeline and reply from the case depend
  on the Comms receive path; chat and telephony are Comms channels; CSAT depends on a
  survey-response-to-case link; rule-based auto-assignment depends on team membership and
  agent availability (header presence); the customer portal depends on the portal
  question in crosscut §8; analytics beyond the KPI strip depend on Insights widgets and
  the SLA timestamps.
- **No baseline support:** saved replies with actions, templates with field dependencies,
  merge/split, case-to-article, restock fees and warranty claims are all new records or
  flows.

### Open questions

- **Case ↔ order/return links:** dedicated join entities, or the generic record link
  proposed in crosscut §8?
- **Status categories:** a new mapping record, or new `Request` statuses only with the
  category hard-coded in SLA logic?
- **Customer portal:** are the portal's case and return pages (my cases, request a
  return) part of one portal shared with Commerce's store account (crosscut §3 lists
  Commerce among the apps that include Customer 360), or a separate service portal?
- **Order change requests:** a case of a new type linked to the order (approved by
  service, applied with `OrderBeingChanged`), or direct edits under a service
  permission?
- **Warranty and customer-owned equipment repair:** which records carry it (case, repair
  order, maintenance work order; research-maintenance.md asks the same)? Mantle has no
  warranty-claim record.
- **Working-hours calendar:** SLA business hours, People shift schedules and Commons
  calendars could share one record; where is it edited?
- **CSAT form:** does Customer Service include the full reused survey builder, or only a
  one-question form linked to the case?

### Checkout path quirks

- Frappe Helpdesk: the doctypes and web forms are under `helpdesk/helpdesk/`, but the
  API (`helpdesk/api/`), search (`helpdesk/search.py`), email templates
  (`helpdesk/templates/`), portal pages (`helpdesk/www/`) and ERPNext sync
  (`helpdesk/integrations/`) are one level up; `TicketTextEditor.vue` is in
  `desk/src/pages/ticket/`, not `desk/src/components/`.
- ERPNext's Support module links live in `erpnext/workspace_sidebar/support.json`; the
  workspace JSON holds only the chart and number cards.
- Odoo paths are relative to `3p_other/odoo`: `odoo/addons/<addon>/...` is
  `3p_other/odoo/odoo/addons/<addon>/`.
- Carbon route paths use React Router's `x+/` convention; `$id`/`$lineId` are route
  params, literal in file names. The favorite orders route is
  `apps/erp/app/routes/x+/sales-order+/orders.favorite.tsx`, not under `sales+/`.
- Moqui Sales `FindAccount.xml` is absent in this checkout; the account find screen is
  `FindAccount.qvue` only. `ViewAccount.xml` remains the XML reference.
- Moqui WorkManagement wiki XML screens are 20-line shells; the UI is in
  `screen/wiki/Wiki/*.qvue`.
- Dolibarr's ticket form is shared with the public portal through
  `FormTicket`; `htdocs/public/ticket/` is the customer-facing entry point.

**Bottom line.** The evidence favors cases on `Request` and returns on `ReturnHeader`,
with Frappe Helpdesk's case page, SLA and status-category model and Carbon's RMA
invariants as the main references; the gaps are the missing links (case ↔ order/return,
survey ↔ case) and SLA records, not a missing ticket or RMA table.
