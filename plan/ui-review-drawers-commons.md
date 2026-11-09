# IronStone BOSS — UI review: drawers, Commons and Comms

Contents: [scope and sources](#1-purpose-scope-and-sources) · [method](#2-review-method-and-refinement-criteria) ·
[screen inventory](#3-screen-and-surface-inventory) · [activities](#4-end-to-end-activities) ·
[verification](#5-existing-checks-and-future-verification) · [running record](#6-coverage-findings-and-running-record) ·
[decisions](#7-decisions).

## 1. Purpose, scope and sources

Review and refine the implemented BOSS experience through complete user activities, beginning with the suite shell,
drawers, Commons and Comms. The audience is internal staff using these shared tools beside their role applications,
or as their main workspace in a small organization. Include today's Calls, moderation and Assist surfaces. Aim for
a workspace that is comfortable for daily use: readable density, coherent grouping, clear actions and trustworthy
feedback. Substantial layout and navigation refinements are allowed where they improve workflows.

This is the first **`ui-review-*.md`** record, following the area suffix of `impl-*`. Research records references,
design specifies behavior, implementation records construction, and UI review records activities, findings,
refinements and verification. This file remains the active record through the review; append findings and bounded
batch notes as work happens rather than scattering the results into new status files.

**Execution:** Waves 1–3 (DC-01–10) are authorized for delegated browser review, correction, independent retest and
local commits after each verified batch. The initial inventory was established from source, not browser activity;
the coverage ledger and batch record below distinguish current observations from untested leads.

### Inputs and reference patterns

- [Framework UI refinement](../../../../plans/UI-Refinement.md): the earlier activity-based review, coverage ledger,
  findings and lessons. Its historical environments, delegation arrangements and execution permissions do not carry
  over to this review.
- [Reusable UI review guide](../../../../docs/dev/UI-Review.md): environment, activity/evidence method and established
  interaction patterns; [application practices](../../../../docs/dev/Practices-App-Dev.md) and
  [style guide](style-guide.md): architecture, archetypes, widgets, vocabulary and render modes.
- [Implementation](impl-drawers-commons.md), [design](design-drawers-commons.md),
  [research](research-drawers-commons.md), [crosscut design](design-crosscut.md) and
  [crosscut research](research-crosscut.md): intended behavior, reusable screens and the earlier reference survey.
- [Comms framework plan](../../../../plans/Comms-Framework.md), current `Commons.xml` / `Comms.xml`, component
  configuration, theme/provider registrations, `screen-extend/basic-comms` and `screen-extend/webroot` (the launcher):
  current ownership and mounts take precedence over historical inventories when deciding what can be reviewed.

Use the existing research as a comparison lens: Nextcloud and Zimbra for contact/calendar/mail/file workflows;
Twenty and Frappe for palette and panel transitions; OpenProject and Odoo for personal work, notifications and record
activity; Nextcloud Talk and Signal for chat/call continuity; Nextcloud Text/Collectives and Frappe Wiki for editing,
history and review. These are catalogued patterns, not new claims about current third-party products. Do not restart
third-party research or copy a reference application's feature inventory into this phase.

### Ownership and boundaries

| Surface | Owner and review boundary |
| --- | --- |
| Commons | BOSS screens, screen context and app services (`service/ironstone/commons/`: palette, Today, quick-create, contacts, drives, calendar publication, knowledge); business rules and business record services in Mantle; file and public-share token services in the framework (`org.moqui.impl.FileServices`) |
| Comms | BasicComms screens mounted under `/qapps/Comms`, with BOSS extensions (`screen-extend/basic-comms`) and providers for internal mailboxes, record context and calls; BOSS's own Consent and Moderation screens under `screen/Comms/`; BOSS app services in `service/ironstone/comms/`; fix generic mail/chat/call behavior in BasicComms (framework work, §5) |
| Task and request detail | BOSS `Shared/WorkItemDetail.xml` and `Shared/RequestDetail.xml`, mounted by Commons; inspect the consuming context rather than creating copies |
| Header, drawer frames, shared controls, Assist, live call | Framework webroot/client and framework services; BOSS supplies providers, theme destinations and the launcher's suite grouping and templates (`screen-extend/webroot`, `template/AppList.*.fancy`) |
| Chatter and RecordFiles | Shared BOSS screens mounted under authorized app roots, backed by Mantle/framework services |
| Public share, unsubscribe, published calendar | Currently BOSS token routes; review existing behavior without relocating them to PASS |
| Guest call | Framework BasicComms token route, reached from the inherited Calls flow |

A fix to a shared screen reaches every consumer; retest at least one consumer outside Commons/Comms:

- `Shared/WorkItemDetail.xml`: Commons Tasks, Projects WorkItems, Customer Service Cases, Manufacturing WorkCenters.
- `Shared/RequestDetail.xml`: Commons Requests, Projects, Customer Service Cases, Commerce Customers, Purchasing,
  Warehouse Transfers, Manufacturing WorkCenters.
- `Shared/Chatter.xml` and `Shared/RecordFiles.xml`: all 16 BOSS app roots.
- Commons Knowledge components: also Customer Service Knowledge, Projects ProjectDetail and `Shared/PageDetail`.
- Six BasicComms `.qvue` files (Panel/ChatPanel, Chat, Inbox/Mail, Inbox/Compose, Calls/Call, Calls/Dialer) are also
  shown by the desktop client's shell (`crates/moqui-desktop/shell/bundled-screens.txt`), which also answers their
  transitions offline. The desktop shell is not reviewed separately, but a change to one of these screens is carried
  into its desktop variants (§5).

Preserve established routes, bookmarks, saved-find/column preferences, service/entity contracts and authorization.
Record an unavoidable compatibility change and its handling before implementing it. Keep Mantle independent of
BOSS and enforce data visibility in services, including indirect paths through search, pickers, drawers and files.

Use adjacent apps only for representative record context, Chatter, attachments, approvals and return navigation.
Full reviews of Projects, Marketing, People, Admin, PASS and other applications belong in their own `ui-review-*`
files. Do not build absent design features, change protocols or expand administration scope to make a journey pass.

## 2. Review method and refinement criteria

### Environment and fixtures

Use an isolated runtime and fresh disposable database with BOSS, Mantle, required framework components and only
fixture dependencies needed for a selected activity. Copy mutable configuration and keep databases, uploaded files,
wiki resources, drives and scratch Git repositories separate from working data and source checkouts. A separate HTTP
port alone is not isolation. Record runtime, free listener ports, hostname, loaded components and binary revision
in the first execution batch. One lifecycle owner starts and stops the runtime; keep process visibility consistent.

The guide's bootstrap is framework-only and leaves `component/` empty. For this review, also link `mr-mantle` and
`mr-boss` into the review runtime's `component/`. Add `mr-pass` only for the Wave 7 batch that runs DC-20, whose
moderation outcome shows on a PASS forum page; every other activity runs on Mantle and BOSS data, including the
demo public account. Serve it with the fixture runner as BOSS's client suite does: `moqui test mr-boss --spec
<fixtures> --db fresh --serve <host>:<port>` on `conf/MoquiDevConf.xml` with `mail_capture_sends=true`. BOSS has no
Commons/Comms fixture spec yet (its client suite loads only `AccountingClientFixtures`, `InsightsClientFixtures`
and `AdminClientFixtures`). The first batch (§6) starts on the demo data and writes a `CommonsClientFixtures` spec
only for roles the demo data lacks, recording which.

Reuse the existing suitable binary for XML/QVue/CSS/script changes. Follow the repository's building skill when a
rebuild is required, including embedded renderer changes. Check that browser assets are current before diagnosing a
stale-template problem. Use separate browser profiles or hostnames for identities; cookies are not isolated by port.

Prepare these named fixture roles; record actual IDs and permissions in execution evidence, never credentials. Start
from the existing demo users and groups (`data/BossUsersDemoData.xml`, `data/BossSetupData.xml`) and record each gap
that needs a new fixture:

- **Staff A / Staff B:** two internal `BOSS_USERS` members (`BOSS_USERS` opens Commons, Comms and the Records drive;
  demo: john.doe, Joe Developer, Bob Developer) with distinct personal contacts, mail, notes and calendars; shared
  fixtures with explicit owner/editor/reader roles.
- **Other-org staff:** an internal user with no membership in the first organization's restricted records.
- **Specialists:** contact administrator, knowledge reviewer, authorized approver, internal forum moderator and a
  configuration administrator, each with only the needed grants (the app groups are `BOSS_COMMONS_ADMIN` and
  `BOSS_COMMS_ADMIN`; narrower roles are permissions or record roles to identify); use unrestricted ADMIN only for
  fixture setup or a deliberately administrative activity.
- **Public account:** signed in with no BOSS membership (demo: joe@public.com), plus a representative restricted
  project-client identity (demo: sheldon.acme or gob.bluth).
- **Anonymous recipient:** token-only browser session for file, calendar, unsubscribe and guest-call cases.

Include populated and empty lists, long/localized names, missing/deleted records, invalid inputs, two timezone
preferences, a DST-crossing event, and shared/revoked resources. Capture mail locally; use local hosted/remote mail
fixtures, local chat/call participants, fake media and a deterministic local Assist fixture where available. Do not
send review messages to real recipients. A missing successful external-provider/device fixture is recorded as blocked
or unverified, never as successful integration coverage.

### Visual and interaction review

- Use **1920×1080** for primary design decisions and comparable before/after evidence in default light and dark.
  Add targeted 1280px, 390px, actual 200% browser zoom and keyboard-only checks. Do not multiply every screen by every
  environment combination; select the layouts and controls that differ.
- Inspect the embedded TUI, fresh light/dark launches and switches in both directions, and functional custom twins.
  A text-only placeholder or non-error render does not prove equivalent TUI functionality.
- The review is of the UI under `/qapps`. Give Standard `/apps` only a brief functional check on each activity's main
  screens (the page opens and its primary action works), with no visual refinement there. Check print and export
  output where it is part of an activity.
- Check purpose, titles, section grouping, meaningful names instead of codes, metadata hierarchy, and one clear
  primary action per form/dialog. Use width deliberately without stretching readable forms across the canvas.
- Measure actual composited colors: ordinary text **4.5:1**, qualifying large text **3:1**, meaningful control/state
  indicators **3:1**. Inspect secondary text, chips, selection, focus, disabled and loading states in both themes.
  Use semantic theme roles and shared controls, not per-screen color patches.
- Make list filtering, sorting, saved-find create/update/default/reset, columns, pagination and export distinct.
  Preserve selection and filters when opening a detail, using Back, reopening a dialog or changing view.
- Verify accessible names, keyboard paths for drag actions, natural tab order, Escape/Enter, reachable dialog actions
  and focus restoration. Test native typing and blur/change before classifying an automation-input failure as a bug.
- Preserve drafts, undo state, scroll context and current selection across navigation, asynchronous saves and errors.
  A successful save acknowledges its submitted snapshot, not edits made while it was pending. Retain inputs on refusal
  and show a useful retry, correction or cancellation path.
- Inspect simultaneous app drawer, tray, Assist and live-call states. Confirm ownership of shortcuts, context changes,
  loading indicators and focus; prevent stale responses from updating a newly selected record or destination screen.
- Distinguish empty data, no matches, no access, unavailable providers and failed loading. Counts, read markers, status
  labels and success messages must describe the persisted outcome, including pending sends and partial failures.
- Show dates in the user's zone with enough timezone context; preserve raw values for operations and exports. Check
  long content, attachments, safe message rendering, privacy and permission-sensitive record cards.
- Fix shared causes first, use the framework guide's established patterns, demonstrate new reusable controls in Gallery
  when needed, and retest with actual BOSS content. Independent provider/import failures should name the failed item
  and leave unrelated results usable; security and token checks remain strict.

### Waves

| Wave | Activities | Focus |
| --- | --- | --- |
| 1. Shell and drawers | DC-01–04 | Baseline, navigation, contextual creation, work/notification trays, Assist and combined layout |
| 2. Shared record surfaces | DC-05, DC-06 | Task and request detail, Chatter, RecordFiles and activities, through Commons and one other consuming app; Today continuity |
| 3. Contacts and calendar | DC-07–10 | Recipient foundations, import/merge, scheduling, RSVP, publication and device-access settings |
| 4. Files, knowledge and notes | DC-11–14 | Resource lifecycle, sharing, public links, co-editing, review and recovery |
| 5. Mail | DC-15–17 | Account setup, personal and internal/shared messages, Files attachments and filing on records |
| 6. Chat and calls | DC-18, DC-19, DC-02's live-call repeat | Synchronous collaboration, record context, media, and the live call beside drawers and Assist |
| 7. Consent, moderation and settings | DC-20, DC-21 | Consent and unsubscribe, internal moderation, personal settings and verification |
| 8. Integration and remaining coverage | DC-22 and pending variants | Cross-app/access walks, responsive/keyboard/TUI completion and shared-fix retests |

DC IDs follow the wave order. The shared record surfaces come early because they are mounted across all BOSS app
roots, and each later wave builds on the surfaces before it. Three steps reach ahead:

- DC-02's repeat with a live call needs the call fixtures of Wave 6 and runs there. Its ledger row stays partial
  until then.
- DC-03's Email and Chat message entries, and DC-06's linked mail/chat, use Compose, Mail and Chat as entry and
  return paths only. Record what they find, but correct and retest it in Waves 5 and 6.

Each batch follows observe → prioritize → refine → rerun affected activities → compare evidence → verify → update
this record. Once the user has authorized execution and commits, end each batch as the guide does: run the required
checks (§5), then commit the source changes with their notes in each owning repository. Writing or updating this
plan does not itself authorize application changes, commits, pushes or acceptance runs.

## 3. Screen and surface inventory

Routes are relative to `/qapps/` unless an absolute token route is shown. Source aliases below are relative to the
mr-moqui repository: **B** = `runtime/component/mr-boss/screen/`; **C** =
`runtime/base-component/basic-comms/screen/`; **W** = `runtime/base-component/webroot/screen/webroot/`;
**T** = `runtime/base-component/tools/screen/System/Security/UserAccount/UserAccountDetail/`.
Every source in the inventory is an existing definition; effective runtime reachability remains to be exercised.

`XML` means framework-rendered widgets; `inline qvt/tui` identifies custom render sections, not a claim of feature
parity. Template references and hidden TUI XML routes are recorded explicitly. A twin is supporting coverage for
the same activity, not an additional app or a second reason to render the screen in regression. Container rows need
navigation/default-child inspection. Surface rows below cover dialogs and panels that have no independent URL.

For **every inventory row**, initial review status is **pending**, with evidence **—**. This applies to every render
variant named in that row; split a row's execution notes by mode when outcomes differ. DC-22 samples the access
boundaries across the whole inventory in addition to the primary activity IDs listed. The inventory holds the
status of each screen and mode; the §6 ledger holds the only status of each activity.

### Commons routes

| Route | Source / owner | Activities | Render variants / role | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| `Commons` | `B Commons.xml` | DC-01 | XML widgets (browser/TUI) | pending | — |
| `Commons/Calendar/EventDetail` | `B Commons/Calendar/EventDetail.xml` | DC-09 | XML + custom sections; inline qvt; inline tui | pending | — |
| `Commons/Calendar/Schedules/ResourceDetail` | `B Commons/Calendar/Schedules/ResourceDetail.xml` | DC-09 | XML + custom sections; inline qvt; inline tui | pending | — |
| `Commons/Calendar/Schedules` | `B Commons/Calendar/Schedules.xml` | DC-09 | XML + custom sections; qvue: `B Commons/Calendar/Schedules.qvue`; inline tui; inline html,qvt | pending | — |
| `Commons/Calendar/SchedulesTui` | `B Commons/Calendar/SchedulesTui.xml` | DC-09 | Hidden XML TUI helper | pending | — |
| `Commons/Calendar` | `B Commons/Calendar.xml` | DC-09, DC-19 | XML + custom sections; qvue: `B Commons/Calendar.qvue`; inline tui; inline html,qvt | pending | — |
| `Commons/CalendarTui` | `B Commons/CalendarTui.xml` | DC-09 | Hidden XML TUI helper | pending | — |
| `Commons/Contacts/Compare` | `B Commons/Contacts/Compare.xml` | DC-08 | XML + custom sections; inline qvt; inline tui | pending | — |
| `Commons/Contacts/ContactDetail` | `B Commons/Contacts/ContactDetail.xml` | DC-07, DC-08 | XML + custom sections; inline html-print | pending | — |
| `Commons/Contacts/Duplicates` | `B Commons/Contacts/Duplicates.xml` | DC-08 | XML widgets (browser/TUI) | pending | — |
| `Commons/Contacts/Import/Mapping` | `B Commons/Contacts/Import/Mapping.xml` | DC-08 | XML widgets (browser/TUI) | pending | — |
| `Commons/Contacts/Import/Options` | `B Commons/Contacts/Import/Options.xml` | DC-08 | XML widgets (browser/TUI) | pending | — |
| `Commons/Contacts/Import/Preview` | `B Commons/Contacts/Import/Preview.xml` | DC-08 | XML widgets (browser/TUI) | pending | — |
| `Commons/Contacts/Import/Result` | `B Commons/Contacts/Import/Result.xml` | DC-08 | XML + custom sections; inline qvt; inline tui | pending | — |
| `Commons/Contacts/Import/Source` | `B Commons/Contacts/Import/Source.xml` | DC-08 | XML widgets (browser/TUI) | pending | — |
| `Commons/Contacts/Import` | `B Commons/Contacts/Import.xml` | DC-08 | XML widgets (browser/TUI) | pending | — |
| `Commons/Contacts/ImportProgress` | `B Commons/Contacts/ImportProgress.xml` | DC-08 | XML + custom sections; qvue: `B Commons/Contacts/ImportProgress.qvue`; tui: `B Commons/Contacts/ImportProgress.tui.json` | pending | — |
| `Commons/Contacts/List` | `B Commons/Contacts/List.xml` | DC-07 | XML + custom sections; inline html-print; inline qvt; inline tui | pending | — |
| `Commons/Contacts` | `B Commons/Contacts.xml` | DC-07 | XML widgets (browser/TUI) | pending | — |
| `Commons/Files/DriveSettings` | `B Commons/Files/DriveSettings.xml` | DC-10–12 | XML widgets (browser/TUI) | pending | — |
| `Commons/Files/Drives` | `B Commons/Files/Drives.xml` | DC-11, DC-12 | XML widgets (browser/TUI) | pending | — |
| `Commons/Files/Shares` | `B Commons/Files/Shares.xml` | DC-11, DC-12 | XML widgets (browser/TUI) | pending | — |
| `Commons/Files` | `B Commons/Files.xml` | DC-11, DC-12 | XML + custom sections; qvue: `B Commons/Files.qvue`; inline tui; inline html,qvt | pending | — |
| `Commons/FilesTui` | `B Commons/FilesTui.xml` | DC-11, DC-12 | Hidden XML TUI helper | pending | — |
| `Commons/Home` | `B Commons/Home.xml` | DC-01 | XML + custom sections; inline qvt; inline tui | pending | — |
| `Commons/Knowledge/Review` | `B Commons/Knowledge/Review.xml` | DC-13 | XML widgets (browser/TUI) | pending | — |
| `Commons/Knowledge/SpaceDetail` | `B Commons/Knowledge/SpaceDetail.xml` | DC-13 | XML widgets (browser/TUI) | pending | — |
| `Commons/Knowledge/Spaces` | `B Commons/Knowledge/Spaces.xml` | DC-13 | XML widgets (browser/TUI) | pending | — |
| `Commons/Knowledge` | `B Commons/Knowledge.xml` | DC-13 | XML + custom sections; qvue: `B Commons/Knowledge.qvue`; inline tui | pending | — |
| `Commons/KnowledgeTui` | `B Commons/KnowledgeTui.xml` | DC-13 | Hidden XML TUI helper | pending | — |
| `Commons/Notes` | `B Commons/Notes.xml` | DC-14 | XML + custom sections; qvue: `B Commons/Notes.qvue`; inline tui | pending | — |
| `Commons/NotesTui` | `B Commons/NotesTui.xml` | DC-14 | Hidden XML TUI helper | pending | — |
| `Commons/Notifications` | `B Commons/Notifications.xml` | DC-04 | XML + custom sections; inline qvt; inline tui | pending | — |
| `Commons/Panel/Notifications` | `B Commons/Panel/Notifications.xml` | DC-02, DC-04 | XML + custom sections; inline qvt; inline tui | pending | — |
| `Commons/Panel/Today` | `B Commons/Panel/Today.xml` | DC-02, DC-04, DC-05 | XML + custom sections; inline qvt; inline tui | pending | — |
| `Commons/Panel` | `B Commons/Panel.xml` | DC-02, DC-04 | XML widgets (browser/TUI) | pending | — |
| `Commons/QuickCreate` | `B Commons/QuickCreate.xml` | DC-03, DC-14 | XML + custom sections; inline qvt; inline tui | pending | — |
| `Commons/Requests/List` | `B Commons/Requests/List.xml` | DC-05, DC-06 | XML + custom sections; inline qvt; inline tui | pending | — |
| `Commons/Requests` | `B Commons/Requests.xml` | DC-05, DC-06 | XML widgets (browser/TUI) | pending | — |
| `Commons/Search` | `B Commons/Search.xml` | DC-01 | XML widgets (browser/TUI) | pending | — |
| `Commons/Settings/Account` | `B Commons/Settings/Account.xml` | DC-21 | XML + custom sections; inline qvt; inline tui | pending | — |
| `Commons/Settings/Calendars` | `B Commons/Settings/Calendars.xml` | DC-09, DC-10 | XML + custom sections; inline qvt; inline tui | pending | — |
| `Commons/Settings/ContactBooks` | `B Commons/Settings/ContactBooks.xml` | DC-07, DC-10 | XML widgets (browser/TUI) | pending | — |
| `Commons/Settings/Index` | `B Commons/Settings/Index.xml` | DC-21 | XML + custom sections; inline qvt; inline tui | pending | — |
| `Commons/Settings/Notifications` | `B Commons/Settings/Notifications.xml` | DC-04, DC-21 | XML widgets (browser/TUI) | pending | — |
| `Commons/Settings/Preferences` | `B Commons/Settings/Preferences.xml` | DC-21 | XML widgets (browser/TUI) | pending | — |
| `Commons/Settings/Sync` | `B Commons/Settings/Sync.xml` | DC-10 | XML widgets (browser/TUI) | pending | — |
| `Commons/Settings` | `B Commons/Settings.xml` | DC-21 | XML widgets (browser/TUI) | pending | — |
| `Commons/Tasks/List` | `B Commons/Tasks/List.xml` | DC-05, DC-06 | XML + custom sections; inline qvt; inline tui | pending | — |
| `Commons/Tasks` | `B Commons/Tasks.xml` | DC-05, DC-06 | XML widgets (browser/TUI) | pending | — |
| `Commons/Tasks/TaskDetail` | `B Shared/WorkItemDetail.xml` | DC-05, DC-06 | XML + custom sections; inline qvt; inline tui | pending | — |
| `Commons/Requests/RequestDetail` | `B Shared/RequestDetail.xml` | DC-05, DC-06 | XML + custom sections; inline qvt; inline tui | pending | — |
| `Commons/Settings/Account/VerifyEmail` | `T VerifyEmail.xml` | DC-21 | XML widgets (browser/TUI) | pending | — |
| `Commons/Settings/Account/VerifySms` | `T VerifySms.xml` | DC-21 | XML widgets (browser/TUI) | pending | — |
| `Commons/Settings/Account/VerifyTotp` | `T VerifyTotp.xml` | DC-21 | XML widgets (browser/TUI) | pending | — |

### Comms routes

All C routes below are mounted through BOSS Comms. BOSS extends Home, Chat, Inbox/Mail, Inbox/Compose,
Inbox/MessageDetail, Calls/Voicemail and Settings/Index in `screen-extend/basic-comms`; review the effective
combined screen and its providers. Rows marked **+ B ext** have that extension at
`runtime/component/mr-boss/screen-extend/basic-comms/screen/` plus the same path; their variants include what the
extension adds. The
BasicComms root is hidden in the BOSS launcher. Consent and Moderation are BOSS's own screens under `B Comms/`.

| Route | Source / owner | Activities | Render variants / role | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| `Comms` | `B Comms.xml` | DC-01 | XML widgets (browser/TUI) | pending | — |
| `Comms/Calls/Call` | `C BasicComms/Calls/Call.xml` | DC-19 | XML + custom sections; qvue: `C BasicComms/Calls/Call.qvue`; tui: `C BasicComms/Calls/Call.tui.json` | pending | — |
| `Comms/Calls/CallTui` | `C BasicComms/Calls/CallTui.xml` | DC-19 | Hidden XML TUI helper | pending | — |
| `Comms/Calls/Dialer` | `C BasicComms/Calls/Dialer.xml` | DC-19 | XML + custom sections; qvue: `C BasicComms/Calls/Dialer.qvue`; tui: `C BasicComms/Calls/Dialer.tui.json` | pending | — |
| `Comms/Calls/DialerTui` | `C BasicComms/Calls/DialerTui.xml` | DC-19 | Hidden XML TUI helper | pending | — |
| `Comms/Calls/History` | `C BasicComms/Calls/History.xml` | DC-19 | XML widgets (browser/TUI) | pending | — |
| `Comms/Calls/Queues` | `C BasicComms/Calls/Queues.xml` | DC-19 | XML widgets (browser/TUI) | pending | — |
| `Comms/Calls/Recordings` | `C BasicComms/Calls/Recordings.xml` | DC-19 | XML + custom sections; qvue: `C BasicComms/Calls/Recordings.qvue`; tui: `C BasicComms/Calls/Recordings.tui.json` | pending | — |
| `Comms/Calls/RecordingsTui` | `C BasicComms/Calls/RecordingsTui.xml` | DC-19 | Hidden XML TUI helper | pending | — |
| `Comms/Calls/Voicemail` | `C BasicComms/Calls/Voicemail.xml` + B ext | DC-19 | XML + custom sections; qvue: `C BasicComms/Calls/Voicemail.qvue`; tui: `C BasicComms/Calls/Voicemail.tui.json` | pending | — |
| `Comms/Calls/VoicemailTui` | `C BasicComms/Calls/VoicemailTui.xml` | DC-19 | Hidden XML TUI helper | pending | — |
| `Comms/Calls` | `C BasicComms/Calls.xml` | DC-19 | XML widgets (browser/TUI) | pending | — |
| `Comms/Chat` | `C BasicComms/Chat.xml` + B ext | DC-18 | XML + custom sections; qvue: `C BasicComms/Chat.qvue`; tui: `C BasicComms/Chat.tui.json` | pending | — |
| `Comms/ChatTui` | `C BasicComms/ChatTui.xml` | DC-18 | Hidden XML TUI helper | pending | — |
| `Comms/Home` | `C BasicComms/Home.xml` + B ext | DC-16, DC-17, DC-19 | XML + custom sections; inline qvt; inline tui | pending | — |
| `Comms/Inbox/Compose` | `C BasicComms/Inbox/Compose.xml` + B ext | DC-03, DC-16, DC-17 | XML + custom sections; qvue: `C BasicComms/Inbox/Compose.qvue`; tui: `C BasicComms/Inbox/Compose.tui.json` | pending | — |
| `Comms/Inbox/ComposeTui` | `C BasicComms/Inbox/ComposeTui.xml` | DC-16, DC-17 | Hidden XML TUI helper | pending | — |
| `Comms/Inbox/Mail` | `C BasicComms/Inbox/Mail.xml` + B ext | DC-16, DC-17 | XML + custom sections; qvue: `C BasicComms/Inbox/Mail.qvue`; tui: `C BasicComms/Inbox/Mail.tui.json`; inline html,qvt | pending | — |
| `Comms/Inbox/MailTui` | `C BasicComms/Inbox/MailTui.xml` | DC-16, DC-17 | Hidden XML TUI helper | pending | — |
| `Comms/Inbox/MessageDetail` | `C BasicComms/Inbox/MessageDetail.xml` + B ext | DC-16, DC-17 | XML + custom sections; inline qvt; inline tui; inline html,text | pending | — |
| `Comms/Inbox` | `C BasicComms/Inbox.xml` | DC-16, DC-17 | XML widgets (browser/TUI) | pending | — |
| `Comms/Panel/Chat` | `C BasicComms/Panel/Chat.xml` | DC-02, DC-03, DC-18 | XML + custom sections; qvue: `C BasicComms/Panel/ChatPanel.qvue`; tui: `C BasicComms/Panel/Chat.tui.json` | pending | — |
| `Comms/Panel/Dialer` | `C BasicComms/Panel/Dialer.xml` | DC-02, DC-19 | XML + custom sections; qvue: `C BasicComms/Calls/Dialer.qvue`; tui: `C BasicComms/Panel/Dialer.tui.json` | pending | — |
| `Comms/Panel` | `C BasicComms/Panel.xml` | DC-02, DC-18, DC-19 | XML widgets (browser/TUI) | pending | — |
| `Comms/Settings/CallHandling` | `C BasicComms/Settings/CallHandling.xml` | DC-19 | XML + custom sections; qvue: `C BasicComms/Settings/CallHandling.qvue`; tui: `C BasicComms/Settings/CallHandling.tui.json` | pending | — |
| `Comms/Settings/CallHandlingTui` | `C BasicComms/Settings/CallHandlingTui.xml` | DC-19 | Hidden XML TUI helper | pending | — |
| `Comms/Settings/Calls` | `C BasicComms/Settings/Calls.xml` | DC-19 | XML + custom sections; qvue: `C BasicComms/Settings/Calls.qvue`; tui: `C BasicComms/Settings/Calls.tui.json` | pending | — |
| `Comms/Settings/Chat` | `C BasicComms/Settings/Chat.xml` | DC-18 | XML widgets (browser/TUI) | pending | — |
| `Comms/Settings/ChatApps` | `C BasicComms/Settings/ChatApps.xml` | DC-18 | XML widgets (browser/TUI) | pending | — |
| `Comms/Settings/Devices` | `C BasicComms/Settings/Devices.xml` | DC-18 | XML + custom sections; qvue: `C BasicComms/Settings/Devices.qvue`; tui: `C BasicComms/Settings/Devices.tui.json` | pending | — |
| `Comms/Settings/DevicesTui` | `C BasicComms/Settings/DevicesTui.xml` | DC-18 | Hidden XML TUI helper | pending | — |
| `Comms/Settings/Identities` | `C BasicComms/Settings/Identities.xml` | DC-15, DC-16 | XML widgets (browser/TUI) | pending | — |
| `Comms/Settings/Index` | `C BasicComms/Settings/Index.xml` + B ext | DC-15, DC-18, DC-19, DC-21 | XML widgets; + B ext: inline qvt; inline tui | pending | — |
| `Comms/Settings/MailAccounts/Account` | `C BasicComms/Settings/MailAccounts/Account.xml` | DC-15 | XML + custom sections; inline qvt; inline tui | pending | — |
| `Comms/Settings/MailAccounts/Add/Address` | `C BasicComms/Settings/MailAccounts/Add/Address.xml` | DC-15 | XML widgets (browser/TUI) | pending | — |
| `Comms/Settings/MailAccounts/Add/Connect` | `C BasicComms/Settings/MailAccounts/Add/Connect.xml` | DC-15 | XML + custom sections; inline qvt; inline tui | pending | — |
| `Comms/Settings/MailAccounts/Add/Finish` | `C BasicComms/Settings/MailAccounts/Add/Finish.xml` | DC-15 | XML widgets (browser/TUI) | pending | — |
| `Comms/Settings/MailAccounts/Add/Options` | `C BasicComms/Settings/MailAccounts/Add/Options.xml` | DC-15 | XML widgets (browser/TUI) | pending | — |
| `Comms/Settings/MailAccounts/Add/Test` | `C BasicComms/Settings/MailAccounts/Add/Test.xml` | DC-15 | XML + custom sections; inline qvt; inline tui | pending | — |
| `Comms/Settings/MailAccounts/Add` | `C BasicComms/Settings/MailAccounts/Add.xml` | DC-15 | XML widgets (browser/TUI) | pending | — |
| `Comms/Settings/MailAccounts/List` | `C BasicComms/Settings/MailAccounts/List.xml` | DC-15 | XML + custom sections; inline qvt; inline tui | pending | — |
| `Comms/Settings/MailAccounts/Removed` | `C BasicComms/Settings/MailAccounts/Removed.xml` | DC-15 | XML + custom sections; qvue: `C BasicComms/Settings/MailAccounts/Removed.qvue`; tui: `C BasicComms/Settings/MailAccounts/Removed.tui.json` | pending | — |
| `Comms/Settings/MailAccounts/SignIn` | `C BasicComms/Settings/MailAccounts/SignIn.xml` | DC-15 | XML + custom sections; qvue: `C BasicComms/Settings/MailAccounts/SignIn.qvue`; tui: `C BasicComms/Settings/MailAccounts/SignIn.tui.json` | pending | — |
| `Comms/Settings/MailAccounts/SyncProgress` | `C BasicComms/Settings/MailAccounts/SyncProgress.xml` | DC-15 | XML + custom sections; qvue: `C BasicComms/Settings/MailAccounts/SyncProgress.qvue`; tui: `C BasicComms/Settings/MailAccounts/SyncProgress.tui.json` | pending | — |
| `Comms/Settings/MailAccounts` | `C BasicComms/Settings/MailAccounts.xml` | DC-15 | XML widgets (browser/TUI) | pending | — |
| `Comms/Settings/OutOfOffice` | `C BasicComms/Settings/OutOfOffice.xml` | DC-15 | XML + custom sections; inline qvt,html,html-print; inline tui | pending | — |
| `Comms/Settings/Phone` | `C BasicComms/Settings/Phone.xml` | DC-19 | XML + custom sections; qvue: `C BasicComms/Settings/Phone.qvue`; tui: `C BasicComms/Settings/Phone.tui.json` | pending | — |
| `Comms/Settings/PhoneDevices` | `C BasicComms/Settings/PhoneDevices.xml` | DC-19 | XML + custom sections; qvue: `C BasicComms/Settings/PhoneDevices.qvue`; tui: `C BasicComms/Settings/PhoneDevices.tui.json` | pending | — |
| `Comms/Settings/PhoneDevicesTui` | `C BasicComms/Settings/PhoneDevicesTui.xml` | DC-19 | Hidden XML TUI helper | pending | — |
| `Comms/Settings/PhoneTui` | `C BasicComms/Settings/PhoneTui.xml` | DC-19 | Hidden XML TUI helper | pending | — |
| `Comms/Settings/Rules` | `C BasicComms/Settings/Rules.xml` | DC-15 | XML + custom sections; qvue: `C BasicComms/Settings/Rules.qvue`; tui: `C BasicComms/Settings/Rules.tui.json` | pending | — |
| `Comms/Settings/RulesTui` | `C BasicComms/Settings/RulesTui.xml` | DC-15 | Hidden XML TUI helper | pending | — |
| `Comms/Settings/TextBlocks` | `C BasicComms/Settings/TextBlocks.xml` | DC-15, DC-16 | XML widgets (browser/TUI) | pending | — |
| `Comms/Settings` | `C BasicComms/Settings.xml` | DC-15, DC-18, DC-19, DC-21 | XML widgets (browser/TUI) | pending | — |
| `Comms/Consent/Contact` | `B Comms/Consent/Contact.xml` | DC-20 | XML widgets (browser/TUI) | pending | — |
| `Comms/Consent/List` | `B Comms/Consent/List.xml` | DC-20 | XML + custom sections; inline qvt; inline tui | pending | — |
| `Comms/Consent` | `B Comms/Consent.xml` | DC-20 | XML widgets (browser/TUI) | pending | — |
| `Comms/Moderation/Queue` | `B Comms/Moderation/Queue.xml` | DC-20 | XML widgets (browser/TUI) | pending | — |
| `Comms/Moderation/Review` | `B Comms/Moderation/Review.xml` | DC-20 | XML + custom sections; inline qvt; inline tui | pending | — |
| `Comms/Moderation` | `B Comms/Moderation.xml` | DC-20 | XML widgets (browser/TUI) | pending | — |

### Shared and public routes

| Route | Source / owner | Activities | Render variants / role | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| `Commons/Chatter` | `B Shared/Chatter.xml` | DC-06 | XML + custom sections; qvue: `B Shared/Chatter.qvue`; inline tui; inline html,qvt | pending | — |
| `Commons/Chatter/ChatterTui` | `B Shared/ChatterTui.xml` | DC-06 | Hidden XML TUI helper, loaded by Chatter | pending | — |
| `Commons/RecordFiles` | `B Shared/RecordFiles.xml` | DC-06, DC-11 | XML + custom sections; qvue: `B Shared/RecordFiles.qvue`; inline tui; inline html,qvt | pending | — |
| `Commons/RecordFiles/RecordFilesTui` | `B Shared/RecordFilesTui.xml` | DC-06, DC-11 | Hidden XML TUI helper, loaded by RecordFiles | pending | — |
| `Comms/Chatter` | `B Shared/Chatter.xml` | DC-06 | XML + custom sections; qvue: `B Shared/Chatter.qvue`; inline tui; inline html,qvt | pending | — |
| `Comms/Chatter/ChatterTui` | `B Shared/ChatterTui.xml` | DC-06 | Hidden XML TUI helper, loaded by Chatter | pending | — |
| `Comms/RecordFiles` | `B Shared/RecordFiles.xml` | DC-06, DC-11 | XML + custom sections; qvue: `B Shared/RecordFiles.qvue`; inline tui; inline html,qvt | pending | — |
| `Comms/RecordFiles/RecordFilesTui` | `B Shared/RecordFilesTui.xml` | DC-06, DC-11 | Hidden XML TUI helper, loaded by RecordFiles | pending | — |
| `/s/<token>` | `B PublicShare.xml` | DC-12 | XML + custom sections; qvue: `B PublicShare.qvue`; tui: `B PublicShare.tui.json`; inline html,qvt | pending | — |
| `/u/<token>` | `B Unsubscribe.xml` | DC-20 | XML + custom sections; qvue: `B Unsubscribe.qvue`; tui: `B Unsubscribe.tui.json`; inline html,qvt | pending | — |
| `/cal/<token>` | `B PublishedCalendar.xml` | DC-10 | XML + custom sections; qvue: `B PublishedCalendar.qvue`; tui: `B PublishedCalendar.tui.json`; inline html,qvt | pending | — |
| `/call/<token>` | `C CallGuest.xml` | DC-19 | XML + custom sections; qvue: `C CallGuest.qvue`; inline tui | pending | — |

Shared XML TUI helpers support the same DC-06/DC-11 activities. Each parent mounts its helper as a hidden child;
inspect both the helper controls and the parent inline TUI loader through the actual host app.

### Embedded surfaces and dialogs

| Route / surface | Source / owner | Activities | Variants and inspection | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| All BOSS apps: launcher | W `apps/AppList.xml` / framework shell; BOSS app registrations, suite groups in `runtime/component/mr-boss/screen-extend/webroot/screen/webroot/apps/AppList.xml` and templates `runtime/component/mr-boss/template/AppList.{html,qvt,tui}.fancy` | DC-01, DC-22 | BOSS html, qvt and tui templates; authorized destinations, group order and the trailing More group, active app, empty permissions | pending | — |
| All BOSS apps: app navigation and breadcrumbs | W / framework shell | DC-01, DC-02 | Browser/TUI, sibling menus, keyboard and Back | pending | — |
| Saved finds and list controls | Shared framework widgets; consuming lists | DC-01, DC-05 | Find Options, sort, save/update/default/reset, columns, pagination, export | pending | — |
| Palette | W / shell; Commons and Comms providers | DC-01, DC-22 | Recent, Screens, Actions, Saved finds, Records/ID, People, Pages/files, Events, Messages/rooms | pending | — |
| Quick-create menu | W / shell; BOSS root providers | DC-03 | Contextual kinds, record-required activity, cancellation and focus return | pending | — |
| Header badges | W / shell; BOSS theme/count providers | DC-04, DC-17–19 | Mail versus internal messages, unread/mentions, Today, notifications, missed calls | pending | — |
| Account/presence menu | W / shell; BOSS account destinations | DC-01, DC-21 | Profile, status/presence, theme, preferences, re-login/logout, keyboard | pending | — |
| Tray frame and tabs | W / shell with B/C panel content | DC-02–04, DC-18, DC-19 | Today, Chat, Notifications, Dialer; cross-navigation, resize, overlay, focus | pending | — |
| Assist drawer | W `assist.xml`, `js/WebrootAssist.js`, canvas/sandbox clients / framework | DC-02, DC-22 | Available chat/history/context/rules/canvas controls, run state, cancellation/approval, provider unavailable; record unsupported TUI behavior | pending | — |
| Live-call mini-window | W call client `js/WebrootCall.js` / framework | DC-02, DC-19 | Incoming/active state, navigate away, return, end call, narrow combined layout | pending | — |
| Contacts: contact methods, books/groups, recipient cards | B Contacts screens; Mantle contact services | DC-07, DC-08, DC-16 | Add/edit/remove, selected labels, privacy, merge comparison, print/export | pending | — |
| Calendar: quick event, recurrence, invite and booking controls | B Calendar/Schedules QVue and EventDetail | DC-09, DC-10 | Drag and keyboard alternatives, conflict feedback, attendee/room selectors, publication | pending | — |
| Files: browser and details pane | B `Commons/Files.qvue` | DC-11, DC-12 | Upload/progress, preview, rename/move, share/link, versions/compare/restore, trash, narrow selected file | pending | — |
| Attach from Files / Save to Files | B and C file-picker transitions; Compose/Mail/Chat/RecordFiles consumers | DC-06, DC-11, DC-16, DC-18 | Authorized drive/folder selection, upload failures, cancel/reopen, correct destination | pending | — |
| Knowledge: tree/editor/history/review dialogs | B `Commons/Knowledge.qvue` and child screens | DC-13 | Co-edit, save/version, compare/restore, duplicate/move, review/publish; text fallback | pending | — |
| Notes: editor and note navigation | B `Commons/Notes.qvue` | DC-14 | Private note selection, saved/dirty state, search, recovery, text fallback | pending | — |
| Inbox: accounts/folders/Internal mailboxes | C Inbox with B Home/Mail/MessageDetail extensions and providers | DC-16, DC-17 | Thread/list selection, labels, assignment where offered, drafts/outbox, file-on-record/create-from actions; mailbox browse/join/leave, new mailbox and members dialogs | pending | — |
| Compose: recipients, attachments, send/draft controls | C Compose with B picker/provider additions | DC-03, DC-16 | Identity, recipient lookup/chips, text blocks, pending send, schedule, retry/cancel | pending | — |
| Chat: room and message actions | C Chat and tray with B record providers | DC-06, DC-18 | Threads, Files, members, mentions, reactions, polls, forward, encryption/devices, record/create actions | pending | — |
| Calls: lobby, incoming/active call and meeting join | C Calls and W call client; B calendar/contact providers | DC-19 | Local media, dial/search/transfer targets where offered, call-link/guest handoff, permission refusal | pending | — |
| Record cards, Chatter and activity dialogs | B shared detail/Chatter screens; Mantle | DC-03, DC-06, DC-22 | Note/reply/edit/delete, mention, follow, activity, record visibility, mounted context | pending | — |
| Account verification dialogs | B Account and mounted T screens | DC-21 | Email/SMS/TOTP configured fixtures, validation, cancellation and safe recovery | pending | — |

### Design-to-code reconciliation

These rows are planning discrepancies or scope boundaries, not observed UI defects. Recheck mounts at the start of
execution and update this table if the implementation has moved. Do not add an imagined URL to the reachable inventory.

| Design/history item | Current source finding | Review treatment |
| --- | --- | --- |
| People self-service under Commons | No `Commons/People/SelfService` definition or root mount in the inspected tree | Track as unmounted proposal; People implementation/review owns delivery |
| Comms Delivery/Campaigns, MessageTemplates/MessageTemplateDetail, SendingProfiles, Suppressions | Proposed in the design; no such descendants or explicit mounts in current Comms/BasicComms roots and BOSS extensions | Existing Consent remains in scope; do not invent delivery/template/suppression pages |
| Shared survey/form builder | Implemented as `Shared/SurveyForms`, `SurveyFormDetail`, `SurveyResponses` and `SurveyResponseDetail`, mounted from `CustomerService/Settings.xml`; not mounted in Commons | Owned by the Customer Service (and later Marketing) reviews; inspect only a link that reaches it from a Commons/Comms activity |
| Event registration additions | Crosscut/Marketing design work, not present in the inspected Commons tree | Separate implementation scope; inspect links only if an actual integration appears |
| `Comms/Calls/LiveCall` (design §4 LiveCall) | No such route: the call window is the framework's `js/WebrootCall.js`, shown on any screen during a call | Review it as the Live-call mini-window surface above; do not look for a route |
| Calls and Assist listed as later in old implementation notes | Calls is mounted from BasicComms and Assist exists in webroot | Review current controls; do not carry historical deferred status forward |
| Sync and co-editing listed as later in early milestones | Commons Settings/Sync and editor integrations exist | Include settings, save/recovery and two-user activities; distinguish UI from external protocol proof |
| Public pages proposed to move to PASS | BOSS configuration still mounts `/s`, `/u`, `/cal` | Review current routes; relocation is outside this phase |
| TaskDetail and RequestDetail absent from local child directories | Explicit mounts use Shared/WorkItemDetail and Shared/RequestDetail | Review through Commons; keep one implementation and identify shared findings |
| Older TUI/static/browser findings and test names | Implementation history predates subsequent framework fixes and suite moves | Reproduce before reporting; use current test locations in §5 |
| Unavailable integration or operation mentioned in a journey | Capability may depend on configuration, role or completed implementation | Inspect its availability/error UX; record unsupported or blocked steps without claiming successful completion |

## 4. End-to-end activities

Each activity's status and evidence are in the §6 ledger, not here. Execute visible controls and inspect intermediate screens, confirmations,
resulting records and the second user's view where relevant. Fixture setup may use services; it must not replace the
user's steps. An activity is not passed merely because its landing page renders or a service call succeeds.

Modes below use **browser** for Material in both default themes, **TUI** for functional supported equivalents, and
**targeted** for the responsive/keyboard/zoom cases selected by §2. Record unsupported operations explicitly.

### DC-01 — Start and navigate a workday

- **Actor/start:** Staff A, signed out, with assigned work, saved finds and searchable permitted records.
- **Objective/steps:** sign in → launcher → Commons Home → palette groups/prefixes and ID lookup → selected record →
  Back; open an existing saved find and follow a Home counter to its filtered list.
- **Expected:** permitted apps and useful work appear; destination, record identity and filters agree; Back retains
  useful context; unavailable apps are absent without preventing permitted navigation.
- **Recovery:** no matches, empty workday, missing/deleted ID, inaccessible recent item and a failing palette source.
- **Screens/modes:** shell, Commons/Home/Search, representative detail/list; browser, TUI, targeted keyboard/narrow.

### DC-02 — Work with drawers and Assist

- **Actor/start:** Staff A on a disposable record, with tray data and a local Assist fixture; Staff B for the live-call repeat.
- **Objective/steps:** open app drawer, tray and Assist → switch tray tabs → change record → inspect Assist context and
  available history/rules/canvas controls → run/cancel a safe fixture and exercise its approval/refusal UI →
  resize/close/reopen; in Wave 6, repeat while a local call mini-window is present.
- **Expected:** current context is accurate; panels preserve appropriate state, never expose the previous record's
  private content, and leave the main task and controls usable; cancellations and approvals have explicit outcomes.
- **Recovery:** missing provider, rejected approval, failed run, stale response, navigation during loading, Escape.
- **Screens/modes:** framework shell/Assist, Commons/Panel, Comms/Panel, live call; browser, targeted keyboard/zoom/narrow;
  TUI shell/panel equivalents, with unsupported Assist/media operations recorded separately.

### DC-03 — Create work in context

- **Actor/start:** Staff A on permitted contact/task/request records, then on a context-free landing page.
- **Objective/steps:** quick-create task, activity, event, note, contact and request → validate → save → open result;
  repeat cancel/reopen; use email and chat quick-create entries.
- **Expected:** contextual defaults and linked record are visible and correct; activity is offered only with its
  required context; successful creation appears once in its destination and personal lists.
- **Recovery:** blank/invalid input, denied target, dirty cancellation, failed save, changing record before reopening.
- **Screens/modes:** shell menu, Commons/QuickCreate, resulting details/Notes, Comms/Inbox/Compose and Panel/Chat;
  browser, TUI where supported, targeted keyboard/narrow dialog checks.

### DC-04 — Triage the day and notifications

- **Actor/start:** Staff A and a minimally authorized approver; overdue/today/later work, mentions and disposable approvals.
- **Objective/steps:** Today → complete/snooze → follow event/reminder → notifications → open mention → approve one
  request and refuse another with a reason → full notification center → mark read/filter → topic preferences.
- **Expected:** source records, tray entries, badges and full center agree; decision scope is clear; other users'
  read state is unaffected and approval outcomes persist.
- **Recovery:** empty category, stale/already-decided approval, denied action, failed source and failed state update.
- **Screens/modes:** Commons/Panel/Today, Panel/Notifications, Notifications, Settings/Notifications and one existing
  approval detail mount; browser/TUI, targeted keyboard/zoom.

### DC-05 — Complete assigned work

- **Actor/start:** Staff A/B with assigned and watched tasks/requests, permitted transitions and linked records.
- **Objective/steps:** filter task list → board/calendar view → shared task detail → assign/update/comment/attach →
  complete → Today; Requests → shared detail → respond/transition → return to filtered list.
- **Expected:** assignment, status, attachments and related work persist; list variants and Today agree; primary actions
  reflect state; context and filters survive detail navigation.
- **Recovery:** invalid transition, removed assignee, no matching work, denied record, failed move/save and stale detail.
- **Screens/modes:** Commons/Tasks/List/TaskDetail, Requests/List/RequestDetail, shared panels, Today; browser/TUI,
  targeted keyboard board/calendar alternatives and narrow detail.

### DC-06 — Collaborate on a business record

- **Actor/start:** Staff A/B with shared task/request and a representative permitted business record; author and
  nonauthor notes, attachment and other-organization record fixtures.
- **Objective/steps:** detail → note/mention/follow → second-user notification → reply → schedule/complete activity →
  attach file → linked mail/chat → return; edit/delete an authored note and attempt a refused action as nonauthor.
- **Expected:** one coherent timeline preserves record identity and chronology; notifications and linked communication
  return to the authorized mount; follow/activity/files changes persist and authorship rules remain intact.
- **Recovery:** missing/deleted record, invalid mention, stale activity, failed attachment, denied author action and
  cross-organization direct panel request.
- **Screens/modes:** shared WorkItemDetail/RequestDetail, Chatter/RecordFiles under Commons/Comms and representative
  role-app mounts; browser/TUI, targeted keyboard/zoom and narrow timeline.

### DC-07 — Manage contacts

- **Actor/start:** Staff A/B, private/shared contact books, directory contacts; contact administrator for directory edits.
- **Objective/steps:** create private contact → edit primary email/phone/address → add to book/group → find as recipient
  → inspect related work/messages → export vCard/CSV and print card/contact sheet where offered.
- **Expected:** human-readable contact identity and primary methods agree across detail, picker and outputs; sharing
  grants the intended access; private contacts remain private; directory edits require the proper permission.
- **Recovery:** invalid method, empty book, removed member, denied directory edit and duplicate name selection.
- **Screens/modes:** Commons/Contacts/List/ContactDetail, Settings/ContactBooks, recipient card/picker; browser/TUI,
  targeted split-view phone/keyboard and actual print/download inspection.

### DC-08 — Import and deduplicate contacts

- **Actor/start:** Staff A with disposable CSV/vCard files containing valid, malformed and duplicate rows; contact admin
  with a duplicate pair carrying linked work, messages and book membership; a large fixture for job progress.
- **Objective/steps:** Source → Mapping → Options → Preview → import → Result/ImportProgress → correct/retry failed
  input → Duplicates → Compare → merge one pair and mark another as not duplicate.
- **Expected:** mapping/policy are understandable, preview predicts results, partial failures identify rows, progress
  and completion agree, and merge preserves intended relationships and the surviving contact's identity.
- **Recovery:** invalid file/mapping, duplicate policy refusal, cancellation/back, stopped job, retry and stale pair.
- **Screens/modes:** all Contacts import steps, ImportProgress, Duplicates/Compare and ContactDetail; browser/TUI,
  targeted keyboard/zoom wizard, inspect exported error/result data if offered.

### DC-09 — Arrange a meeting

- **Actor/start:** Staff A organizer/B invitee, shared calendars, bookable room/equipment, conflicting booking and two zones.
- **Objective/steps:** create event → attendees/free-busy → resource booking → invitation → second-user RSVP → change
  time/recurrence → reschedule/cancel → inspect invitation/export and calendar results.
- **Expected:** time, zone, recurrence scope, RSVP and room/equipment state are clear and consistent; calendar and Today
  reflect the persisted change; captured invitation content matches the meeting.
- **Recovery:** conflict, invalid range, DST boundary, declined attendee, denied calendar, canceled/rejected drag.
- **Screens/modes:** Commons/Calendar, EventDetail, Schedules/ResourceDetail, Settings/Calendars and invitation reader;
  browser/TUI, targeted keyboard/narrow, inspect `.ics` output.

### DC-10 — Manage calendars and device access

- **Actor/start:** Staff A/B with owner/member calendars and contact books, anonymous recipient, disposable device entry.
- **Objective/steps:** configure/share calendar and book → inspect CalDAV/CardDAV/drive addresses → publish calendar →
  anonymous view → create app password → inspect one-time display → revoke → revisit publication after revocation.
- **Expected:** ownership, visibility, timezone and address scope are clear; secrets are displayed only as designed;
  revoked credentials/publication cannot retain access. Inspect a local sync client only when a fixture is available.
- **Recovery:** wrong role, invalid/expired publication token, failed credential creation, unsupported device setup.
- **Screens/modes:** Commons/Settings/Calendars/ContactBooks/Sync, Files/DriveSettings, PublishedCalendar; browser/TUI
  and public shell, targeted keyboard; external-device success is separate evidence.

### DC-11 — Collaborate on files

- **Actor/start:** Staff A owner/B collaborator, DB and scratch versioned drives, allowed/denied Records drive folders.
- **Objective/steps:** upload → browse/search/preview → rename/move → share → second-user edit/upload revision →
  compare/restore → trash/recover → revoke share; inspect the same attachment through its business record.
- **Expected:** selected path, revision, ownership and access are visible; actions persist in the intended drive;
  history and related-record attachments remain consistent; revocation removes access.
- **Recovery:** failed/partial upload, filename conflict, unavailable preview, denied path, deleted selection and canceled move.
- **Screens/modes:** Commons/Files, Drives/DriveSettings/Shares, Shared/RecordFiles and pickers; browser/TUI,
  targeted narrow selected-file pane/keyboard; inspect downloaded content.

### DC-12 — Use a public file link

- **Actor/start:** Staff A and anonymous recipient, disposable file/folder, read/download and upload-capable link fixtures.
- **Objective/steps:** create restricted public link → anonymous open → password if configured → permitted download/upload
  → owner verifies result → expire/revoke → revisit link and direct operation.
- **Expected:** link purpose and allowed operations are clear; output/upload is correct; unrelated resources are absent;
  revocation and expiry prevent subsequent access with understandable feedback.
- **Recovery:** wrong password, malformed/expired token, missing file, upload failure and attempts beyond granted scope.
- **Screens/modes:** Files sharing/Shares, `/s/<token>`; browser/public shell, targeted phone/keyboard, inspect the public
  TUI representation without equating a fallback message with full functionality.

### DC-13 — Author and publish knowledge

- **Actor/start:** Staff A/B editors, separate reviewer/reader, disposable DB and scratch Git-backed wiki spaces.
- **Objective/steps:** create space/page → two-user co-edit → save version/note → history/compare → restore → request
  review → reviewer decision → publish → inspect reader view → duplicate/move page and child pages.
- **Expected:** draft, saved, historical and published content are distinguishable; co-edit and explicit version saves
  retain edits; approval/publish scope is clear; reader visibility and duplicated content match selected options.
- **Recovery:** disconnect, failed save, concurrent change, denied publish, stale review, canceled restore, editor unavailable.
- **Screens/modes:** Commons/Knowledge, Spaces/SpaceDetail/Review and editor/tree dialogs; browser/TUI, targeted
  keyboard/zoom/narrow; inspect saved resource/history, not merely a success toast.

### DC-14 — Capture and recover personal notes

- **Actor/start:** Staff A with no notes space initially, Staff B as privacy countercheck, disposable note content.
- **Objective/steps:** quick note → Notes → edit → search/switch note → reopen → inspect history/recovery controls;
  compare automatic persistence with explicit Save/Done behavior.
- **Expected:** note creation initializes only the intended personal space; saved/dirty status is accurate and content
  survives supported navigation/recovery; another user cannot discover the private note.
- **Recovery:** failed save, disconnect, navigation during save, dirty close, missing note and editor-library fallback.
- **Screens/modes:** Commons/QuickCreate, Notes/NotesTui and palette/search; browser/TUI, targeted keyboard/narrow.

### DC-15 — Configure mail

- **Actor/start:** Staff A with local hosted and remote mail fixtures, captured outbound mail and configured auth failures.
- **Objective/steps:** add-account wizard → connect/options/test/finish → sync progress/account status → identity/signature
  → rules/text blocks/out-of-office → re-sign-in → remove/restore where offered.
- **Expected:** hosted delivery and remote sync are distinguished; account identity follows every link; tests and sync
  status describe real results; settings round-trip and account removal states are clear.
- **Recovery:** connection/authentication refusal, interrupted wizard, invalid settings, failed sync/test, missing OAuth
  provider and canceled removal. Use local credentials only; successful external OAuth remains conditional.
- **Screens/modes:** Comms/Settings mail-account descendants, Identities/Rules/OutOfOffice/TextBlocks; browser/TUI,
  targeted keyboard/narrow/zoom on wizard and settings.

### DC-16 — Receive, answer and file mail

- **Actor/start:** Staff A, local mail account, safe/hostile HTML and plain-text messages, permitted contacts/files/record.
- **Objective/steps:** Inbox → thread → expand history/recipients → remote-image choice → reply/forward with identity,
  recipients and Files attachment → draft/reopen → captured send → sent/outbox status → file on record → follow-up work.
- **Expected:** message body/metadata are readable and safe; selected recipients/attachments and record association
  persist; pending versus sent is truthful; captured delivery and resulting record links agree.
- **Recovery:** draft-save/send failure, retry without duplicate delivery, missing attachment, invalid recipient,
  remote-image failure, selection change during load and canceled record picker.
- **Screens/modes:** Comms/Home, Inbox/Mail/Compose/MessageDetail, Files pickers and record panels; browser/TUI,
  targeted keyboard/phone/zoom; inspect captured message and attachment bytes.

### DC-17 — Handle internal and shared mailboxes

- **Actor/start:** Staff A/B mailbox members, nonmember countercheck, internal message with multiple participants.
- **Objective/steps:** second-user message → Internal inbox/mailbox → label/triage/assignment where offered → mark read
  → reply → file on record → compare each member's view and header counts → remove membership.
- **Expected:** personal read state and shared mailbox state are distinguishable; replies reach intended participants;
  record filing is authorized; counts avoid duplicate recipient-role inflation; removed members lose access.
- **Recovery:** missing mailbox, denied member, concurrent state change, failed reply and inaccessible filed record.
- **Screens/modes:** Comms/Home, Inbox/Mail/Compose/MessageDetail plus BOSS providers and badges; browser/TUI,
  targeted keyboard and compact mailbox navigation.

### DC-18 — Collaborate in chat

- **Actor/start:** Staff A/B in permitted direct, group and record rooms; restricted room and encryption/device fixtures.
- **Objective/steps:** tray → room/direct message → mention/thread/attachment/reaction/poll → forward → create linked
  task/request/event → full Chat → Files/Threads panes → disconnect/reconnect → inspect device/encryption recovery.
- **Expected:** tray/full-screen continuity, unread/mention counts and membership agree; pending/sent/failed status is
  accurate; reconnect posts once; record creation keeps the intended source link and access.
- **Recovery:** offline send, repeated retry, upload failure, removed membership, inaccessible record, unverified or
  missing key/device and unavailable bridge/app. External bridge success needs its own fixture.
- **Screens/modes:** Comms/Panel/Chat, Chat/ChatTui, Settings/Chat/ChatApps/Devices and linked details; browser/TUI,
  targeted keyboard message actions, narrow composer and zoom.

### DC-19 — Call and follow up

- **Actor/start:** Staff A/B, local call/media fixtures, a calendar meeting, voicemail/recording/history fixtures,
  guest link and a permitted queue/handling configuration.
- **Objective/steps:** contact/calendar/tray → dial/join → lobby → two-user call → navigate with mini-window → return/end
  → history → voicemail/recording → record follow-up; inspect queue state, phone devices and handling settings;
  join a disposable call as a guest through the issued link.
- **Expected:** caller/target, media and connection state remain clear; controls act on the right call; history,
  voicemail, recordings and record links reflect the outcome; restricted targets/recordings remain inaccessible.
- **Recovery:** denied microphone/camera, missed call, disconnect, unavailable provider/device, revoked guest link,
  failed playback, canceled transfer and invalid handling setting. No real PSTN calls are needed.
- **Screens/modes:** Comms/Calls descendants, Panel/Dialer, call/phone settings, Calendar and `/call/<token>`;
  browser/public shell, targeted keyboard/narrow, TUI lists/settings and explicit media limitations.

### DC-20 — Manage consent and moderation

- **Actor/start:** contact/consent administrator, anonymous subscription recipient, internal forum moderator and
  nonmoderator; disposable subscriptions and review queue items with necessary forum fixtures.
- **Objective/steps:** inspect consent/history → change subscription → anonymous unsubscribe → revisit; separately,
  queue → review item/context → approve/refuse appropriate fixture → verify queue, persisted outcome and the public
  forum page (mr-pass loaded for this activity, §2).
- **Expected:** consent scope and history are explicit; unsubscribe is truthful/idempotent; moderation decisions affect
  the selected item and require internal role access even if a public account moderates a public site.
- **Recovery:** invalid/expired token, insufficient role, already-unsubscribed/already-handled item and failed decision.
- **Screens/modes:** Comms/Consent/List/Contact, Moderation/Queue/Review, `/u/<token>`; browser/TUI and public shell,
  targeted keyboard/phone. Full PASS forum review remains out of scope.

### DC-21 — Manage personal settings

- **Actor/start:** Staff A with recorded original preferences and local email/SMS/TOTP verification fixtures.
- **Objective/steps:** profile/photo → theme/timezone/preferences → topic settings → configured verification method →
  reopen/re-login and inspect resulting shell/account behavior; restore original harmless preferences.
- **Expected:** profile/photo are the selected user's, settings round-trip, scope is personal unless explicitly stated,
  verification and cancellation states are clear, and dates/theme reflect saved choices.
- **Recovery:** invalid field/photo/code, expired verification, failed save, cancel, unavailable configured sender.
- **Screens/modes:** Commons/Settings/Index/Account/Preferences/Notifications and VerifyEmail/VerifySms/VerifyTotp;
  browser/TUI, targeted keyboard/zoom/narrow and theme switching with open dialogs.

### DC-22 — Verify access and cross-app continuity

- **Actor/start:** Staff A/B, other-org staff, least-privilege specialists, restricted project client, public account
  without BOSS membership and anonymous recipient; positive fixtures paired with refused attempts.
- **Objective/steps:** repeat representative launcher/direct route, palette, quick-create, tray, shared detail/panels,
  recipient/file pickers and public-token paths → follow cross-app links → Back → revoke membership/share → retry.
- **Expected:** Commons and Comms require `BOSS_USERS` and each other app root its own app group (or an explicit
  administrative grant); permissions and record visibility apply to indirect reads/writes; permitted users can finish the paired operation; return navigation keeps context.
- **Recovery:** expired session, inaccessible/deleted link, wrong organization, revoked grant/token and unavailable
  neighboring app. Confirm refusal is due to access, not missing required parameters.
- **Screens/modes:** representative inventory entries from every ownership boundary; browser/TUI/public shell,
  targeted keyboard/phone/zoom. This is an acceptance/manual walk, not a regression route-by-role matrix.

## 5. Existing checks and future verification

The following is an available-test map, not a passing-results ledger. Paths are relative to each named component;
spec names omit `.spec.js`. Inspect current assertions before extending coverage or choosing a targeted run.

| Component / suite | Existing specs | Relevant activities / limits |
| --- | --- | --- |
| mr-boss regression, `test/Commons/` | TodayPanel, Notifications, QuickCreate | DC-01–04; screen/provider/rule checks do not prove live drawer continuity |
| mr-boss regression, `test/Commons/` | Contacts, ContactImport, ContactsDuplicates, ContactBookSettings | DC-07, DC-08; supplement with complete import/merge and output inspection |
| mr-boss regression, `test/Commons/` | Tasks, Requests, Calendar, EventDetail, Schedules, CalendarSettings, SyncSettings | DC-05, DC-09, DC-10; external devices, responsive scheduling and two-user RSVP need activity evidence |
| mr-boss regression, `test/Commons/` | Files, FileShares, Knowledge, KnowledgeReview, Notes | DC-11–14; resource/public/co-edit recovery and visual editors need activity evidence |
| mr-boss regression, `test/Commons/` | CommonsSettings | DC-21; account verification also depends on mounted framework screens |
| mr-boss regression, `test/Comms/` | MailAccounts, MailSignIn, MailSettings, Compose, Inbox, InboxMailboxes, CommsHome | DC-15–17; BOSS provider and mount behavior, not successful external mail proof |
| mr-boss regression, `test/Comms/` | Chat, ChatPanel, ChatSettings, CallTarget | DC-18, DC-19; record hooks/access, not complete local media or encrypted recovery |
| mr-boss regression, `test/Comms/` | Consent, CommsModeration | DC-20, DC-22; anonymous and role-boundary walks remain separate |
| mr-boss regression, `test/Shared/` | Chatter, RecordFiles | DC-06, DC-11; panel rules and access under an app root, not the timeline/files experience across mounts |
| mr-boss regression, `test/` | PublicShare, PublishedCalendar, Unsubscribe | DC-12, DC-10 and DC-20 in that order; token-route rules, not the anonymous browser walk |
| mr-boss regression, `test/` | AppOrganizationFilters | DC-22; root groups and organization filters, not the access walk |
| mr-boss acceptance | AppStructure, ServerStatic, TuiRender | Supporting structure/render coverage; no new duplicate sweep and no usability claim |
| mr-mantle regression | party/Consent, party/Contacts, party/ContactBooks, party/ContactAddresses, party/InboxThreads, party/InternalMessages, party/InternalLabels, party/RecordNotes, party/RecordVisibility, party/RecordLinks, party/ChatRecords; work/CalendarServices, work/CalendarChanges, work/CommonsToday, work/Dav; forum/Mailboxes | Business rules behind DC-04–10, DC-17, DC-18, DC-20 and DC-22; a rule fix and its test stay in Mantle |
| basic-comms regression | BasicComms, BasicCommsInbox, BasicCommsComposeRef, BasicCommsFiles, BasicCommsSync, BasicCommsTexts, BasicCommsChat, BasicCommsChatChanges, BasicCommsBridges, BasicCommsEncrypted, BasicCommsCalls; client ShellSync and CryptoFlow | Shared Comms behavior; BOSS mount/extension outcomes require separate review evidence |
| basic-comms acceptance, `acceptance/client/` | CallFlow, CallGuestFlow, EncryptedCallFlow, EncryptedChatFlow | Existing local media/guest/encryption journeys; prerequisites and actual mount must be checked |
| webroot regression, `test/client/` | WebrootVue.qvt, WebrootVue.qvt.shell, WebrootVue.qvt.layout, WebrootVue.qvt.records, WebrootVue.qvt.static, WebrootVue.qvt.views, WebrootVue.qvt.markdown, WebrootAssist, WebrootChat, WebrootTerminal, WebrootPublic.qvt, QvtKeys, Keys | Shared shell/control behavior; fixes belong in existing focused specs where applicable |
| webroot regression, `test/` | QvtConfig | The shell restoring a saved dark/light/automatic choice and a forced or locked appearance policy taking precedence (DC-21 theme) |
| webroot acceptance, `acceptance/client/` | ThemeLayout | Offline measured theme and geometry checks of shared components (`./moq accept` runs it with `--offline`); the place for a reusable contrast/geometry check found here |

No Commons/Comms-specific browser journey files were present under BOSS `test/client/` or `acceptance/client/` at
inventory time. Do not imply a BOSS golden path already exists from the presence of server specs or BasicComms walks.
Adding a golden-path walk for each app is a remaining item in
[impl-drawers-commons.md](impl-drawers-commons.md#9-addendum-nov-8-2026-remaining-items), outside this review.
Resolve coverage gaps when implementing the relevant batch; this documentation change adds no tests.

### Verification rules for later refinements

- Read the repository's [testing skill](../../../../.agents/skills/testing/SKILL.md) before writing/running tests.
  Run the affected regression specs with the existing binary unless a rebuild is required, for example
  `./moq test mr-boss --spec QuickCreate --nobuild`, and for client specs `./moq test-client mr-boss --serve --spec
  <name>`. Commands run from the mr-moqui root.
- Before application implementation commits run `./moq test-apps`; when framework changes are part of a batch,
  run `./moq test-framework` for that work as well. Do not run framework tests or `cargo test` merely for BOSS changes.
  Do not run `test-all` or `accept-all` by default. A fix in BasicComms or webroot is framework work (AGENTS.md),
  even when found through a BOSS mount.
- The desktop client's shell is not reviewed separately. When a batch changes one of its six bundled BasicComms
  screens (§1), carry the change into the desktop variants as the change needs, in the same commit:
  - **Precompiled copy:** always regenerate `crates/moqui-desktop/shell/js/bundled-screens.js`
    (`UPDATE_GOLDEN=1 cargo test -p moqui-core --lib bundled_screens_are_precompiled`) and inspect its diff.
  - **Offline answers and outbox:** when the request parameters or JSON answer of a transition the shell keeps change
    (Chat's `chatData`, `rooms`, `roomView`, `room` and `timeline`; Mail's `inboxData`, `threads` and `thread`;
    Compose's `composeData`), make the same change where `crates/moqui-client/src/offline.rs` builds that answer
    from the store, with its tests. A change to a chat send, read, edit, reaction or deletion, or to a mail send or
    state change, goes into the outbox (`moqui_client::sync::outbox` and `flush`).
  - **Shell wrappers:** when a screen's name, route or title changes, or a screen joins or leaves the set, update (under
    `crates/moqui-desktop/`) `shell/bundled-screens.txt`, `shell/js/shell.js` (`BUNDLED_COMMS`), `shell/screens/Root.qvue` (`SHELL_ROUTES`,
    `VIEW_PATHS`, `VIEW_TITLES` and its Comms menu) and `src/client/windows.rs` (`SHELL_SCREENS`). Keep
    `Root.qvue`'s own chat card, empty states and outbox labels consistent with a refined pattern they share.
  - **Checks:** `./moq test-framework` (its `cargo test --workspace` includes the golden and `moqui-client`'s offline
    and outbox tests), plus `./moq test-client basic-comms --offline --spec ShellSync`, which `test-framework` does
    not run. A change inside `crates/moqui-desktop`, which is outside the workspace, also runs that crate's tests
    (`cd crates/moqui-desktop && CARGO_TARGET_DIR=../../target cargo test`).
- Lint changed screens using the screen lint's **report-file** argument, never a screen path (it writes that file).
  Respect regression budgets: a spec over 15 seconds must be reduced/moved, not accommodated by an unapproved increase.
- Keep focused bug/rule checks in regression and Mantle rule checks in Mantle. Render a screen at most once per mode
  across regression, combining its checks; use a second mode only for its own custom template. No regression sweeps.
- Complete journeys, responsive/access walks and sweeps belong in acceptance. Preserve the one golden-path regression
  client walk per app policy and use existing coverage rather than duplicating it. A newly automated journey must name
  its acceptance spec and mapped DC IDs in the batch plan before writing it.
- **Run acceptance only when explicitly requested or when adding/changing an acceptance test.** In the latter case run
  that test and its component's acceptance suite as required. A plan entry, shared-code change or phase completion
  does not independently authorize an acceptance run.
- Capture and inspect manual screenshots at important states, compare like-for-like before/after, and retain console/
  network errors, relevant DOM observations and persisted outcomes. Do not add screenshot baseline suites. Keep local
  evidence outside tracked source (for example the framework's ignored `plans/ui-refinement-evidence/` with a dedicated
  BOSS subdirectory), and record relative evidence references with the review context.
- Re-run affected activities after corrections. Record unavailable external services, automation limitations and
  pre-existing failures separately; neither silent skips nor source inspection close those gaps.

## 6. Coverage, findings and running record

### Activity coverage ledger

Status meanings: **pending** = not reviewed; **inspected** = source/render/visual inspection only; **exercised** = steps
executed with an explicit pass/fail/partial outcome; **blocked** = prerequisite prevents execution; **deferred** =
deliberately postponed with reason and follow-up. Exercised does not mean passed. Every row also records recovery and
mode gaps, so a successful wide-browser happy path cannot close untested TUI or refusal behavior.

| Activity | Status | Outcome / recovery / mode gaps | Evidence / findings |
| --- | --- | --- | --- |
| DC-01 | exercised | Partial: John/Joe login and Home; palette People/ID/missing ID, destination and Back; Projects Open bugs saved find and detail/Back; browser light/dark, phone and embedded TUI navigation. Source-failure/inaccessible-recent recovery remains; actual 200% zoom unavailable in current browser API. | Batch 1; DC-UI-003 |
| DC-02 | exercised | Partial: app drawer, Today tray and Assist coexist on the disposable task in light/dark; failed Assist conversation can be reopened and retried with an explicit reason after correction. Successful model run, safe cancellation/approval and canvas remain blocked by the missing usable model/fixture. Live-call repeat remains Wave 6. Actual 200% zoom and complete TUI equivalents remain unverified. | Batch 2; DC-UI-006/007/008; combined-drawers-error light/dark after images, Assist reopened/retry snapshots |
| DC-03 | exercised | Partial: task/event/note/contact/request/activity created and persisted; contact/request and request/activity context retained; cancel/focus return, required input, Email/Chat entry-return, phone dialog, TUI keyboard save and Standard task create. Rebuilt browser/TUI selected-name fixes retested as ordinary staff; TUI record-context creation is unsupported, and denied/failed-save variants remain. | Batch 1; DC-UI-001/002/004/005 |
| DC-04 | exercised | Partial: Today completion/snooze, persisted task states, personal-user isolation, two separately addressed approval decisions and refusal reason were exercised. Request conversation records both outcomes; notifications move to Earlier. Record-specific row actions and correct-row Reschedule were retested. Topic-preference round trip, stale/refused actions, independent-source failure and full TUI/Standard variants remain. | Batch 2; today/completed/snoozed/approval snapshots; named-today-actions-after.dom, reschedule-named-correct-row.dom |
| DC-05 | pending | Not executed; all planned variants remain | — |
| DC-06 | pending | Not executed; all planned variants remain | — |
| DC-07 | pending | Not executed; all planned variants remain | — |
| DC-08 | pending | Not executed; all planned variants remain | — |
| DC-09 | pending | Not executed; all planned variants remain | — |
| DC-10 | pending | Not executed; all planned variants remain | — |
| DC-11 | pending | Not executed; all planned variants remain | — |
| DC-12 | pending | Not executed; all planned variants remain | — |
| DC-13 | pending | Not executed; all planned variants remain | — |
| DC-14 | pending | Not executed; all planned variants remain | — |
| DC-15 | pending | Not executed; all planned variants remain | — |
| DC-16 | pending | Not executed; all planned variants remain | — |
| DC-17 | pending | Not executed; all planned variants remain | — |
| DC-18 | pending | Not executed; all planned variants remain | — |
| DC-19 | pending | Not executed; all planned variants remain | — |
| DC-20 | pending | Not executed; all planned variants remain | — |
| DC-21 | pending | Not executed; all planned variants remain | — |
| DC-22 | pending | Not executed; all planned variants remain | — |

### Findings register

Allocate **DC-UI-001** onward when evidence exists. Label static suspicions and design judgments separately from
observed defects. Use P1 for blocked work, data/privacy risk or essential unreadability;
P2 for substantial friction/misleading behavior; P3 for localized refinement. A confirmed security/data defect takes
priority over visual polish and is routed to the owning layer.

| ID / kind / severity | Activity and step | Route, actor, theme / viewport / input | Reproduction and impact | Evidence | Owner | Correction / decision | Retest / remaining gap |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DC-UI-001 / observed / P2 | DC-03: open Task/Activity or contact-linked Request | Commons quick-create; John, light/dark and phone; TUI Task | Selected remote values show IDs (`EX_JOHN_DOE`, contact ID) instead of the supplied authorized display name. Empty remote search itself is intentional until typing. | `batch-1/quick-task-dark-before.jpg`, `quick-request-before.dom.txt`, `tui-task-create.jpg` | Framework static QVT/TUI generators | Preserve `current-description` as the initial selected option label without changing submitted IDs or overriding existing option labels. | Fresh-origin Joe browser and rebuilt TUI show Joe Developer; independent browser evidence review passed. TUI Alt+Enter saved a task whose detail confirms Joe as assignee. |
| DC-UI-002 / observed / P3 | DC-03: submit blank Task title | Quick-create Task; John, dark | Missing authored required flag allows a request that returns a technical service/field error. Inputs remain available. | `batch-1/quick-task-required-pre-restart.dom.txt` | BOSS | Mark Task title required; extend the existing render check. | Fresh-origin Joe gets inline Required, focus remains on Task, dialog is retained. Quasar rules do not require a native HTML required attribute. |
| DC-UI-003 / observed / P2 | DC-01: follow Home task counters | Commons/Home to Tasks/List; John, light/dark | Mixed Today-source count links to a task-only list (Home 8/9 versus list 3; Overdue 1 versus 7). | `batch-1/home-light.dom.txt`, `today-counter-list.dom.txt` | BOSS Home | Use the destination Task service's counts; label cards Tasks today and Overdue tasks. Mixed-source Today strip remains. | Independent browser-evidence retest confirms 3 to 3 and 7 to 7. Before/after data differs by the recorded disposable task; shortened label avoids truncation. |
| DC-UI-004 / observed / P2 | DC-03: immediately open a saved note | Home quick-note success notification; John/Joe | Open appears while the modal is closing; clicking then twice leaves Home, although the note persists. Waiting for the dialog to close works. | `batch-1/note-early-open-before.dom.txt`, `note-early-open-after.dom.txt` | Framework client | Publish actionable success messages after quick-create's actual on-hide event; keep refusals immediate. Regenerate existing component renders. | Fresh-origin Joe: Open appears with no dialog, immediately reaches the selected Notes record and exact body. Independent evidence review passed. |
| DC-UI-005 / observed / P2 | DC-03: TUI Home → F6 → Activity | Embedded TUI; Joe | Context-free menu offers Activity, then only an explanatory placeholder with no Schedule action. The TUI shell does not carry record context. | `batch-1/tui-contextless-create-menu.dom.txt`, `tui-contextless-activity.jpg` | Framework host TUI adapter | Omit record-required creation entries from the context-free adapter; do not add a new TUI record-context API in this UI review. | Rebuilt live menu retains Task/Event/Note/Contact/Request and omits Activity; independent evidence review passed. Contextual TUI Activity remains explicitly unsupported. |

| DC-UI-006 / observed / P2 | DC-02/04: identify tray actions | Commons Today/notification tray; ordinary staff, desktop/phone | Icon-only actions and tray close lacked useful accessible names; repeated actions did not identify their record. | `batch-2/today-tray-before.dom.txt`, `named-today-actions-after.dom`, `reschedule-named-correct-row.dom` | Framework QVT generators/client; BOSS Today labels | Derive icon-only link names from authored tooltips; name dialog/tray controls; include the affected record in Today actions. Preserve visible labels. | Fresh-origin AX exposes Complete/Snooze/Reschedule plus record titles and Close tray; correct-row Reschedule was exercised. Do not use older-origin anonymous-control snapshots to reopen the corrected finding. |
| DC-UI-007 / observed / P2 | DC-02: send/open a run that fails before answering | Assist on disposable shared task; John, desktop light/dark | Tasks reports missing usable model, while the original/reopened chat showed only the user prompt and no failure or retry. | `batch-2/assist-failed-task.dom.txt`, `assist-open-failed-thread.dom.txt`, `assist-reopened-error-after.dom`, `assist-retry-error-after.dom` | Framework Assist client | Render terminal feedback after a user-only run; refresh persisted failure details/tasks when the turn already ended. | Fresh-origin reopen shows exact provider reason and Retry; retry produces explicit failure feedback. Successful provider execution remains blocked, not passed. |
| DC-UI-008 / observed / P2 | DC-02/04: use the phone tray | Commons notification/Today tray; phone viewport with scrollbar | Tray width exceeded the available layout; left edges of Notifications/Earlier/Open in Commons were clipped. | `batch-2/notifications-phone-before.jpg`, `tray-phone-width-after.jpg`, `tray-phone-width-after.dom` | Framework shell CSS | Constrain tray/sticky width to its containing layout, including scrollbar-reduced space. | Coordinator measured bounds 0..375 after correction; screenshot content fits. Component containment regression checks close/resize/reopen. Actual 200% zoom is still blocked. |

### Static leads

Static suspicions from source inspection while planning. These are not findings: reproduce each one in its activity,
then allocate a DC-UI ID or close it here with the reason.

| Lead | Source | Activity | Suspicion |
| --- | --- | --- | --- |
| Comms menu order | `B Comms/Moderation.xml` (`default-menu-index="6"`) and `B Comms.xml` (Settings `menu-index="6"`) | DC-01, DC-20 | Moderation and Settings share an index, so their order in the Comms menu is not decided |
| Stale Calls card | `runtime/component/mr-boss/screen-extend/basic-comms/screen/BasicComms/Settings/Index.xml` | DC-19, DC-21 | BOSS's Calls card on the Comms settings index says camera, microphone and ringtone are "coming with calls", but `Comms/Settings/Calls` provides them |
| No Call handling card | `C BasicComms/Settings/Index.xml` | DC-19 | The settings index has cards for Phone and Desk and soft phones but none for Call handling, which is reached only from the Settings menu |

### Bounded batch record

The first batch is **DC-01 and DC-03** on the demo users: browser light and dark at
1920×1080, the embedded TUI, and one targeted keyboard pass. It exercises the shell, palette, quick-create and
fixture setup that later waves reuse, and measures the effort per activity before the rest of Wave 1.

#### Waves 1–3 execution environment

- Coordinator owns runtime lifecycle, finding IDs, this record and commits; delegated workers rotate through
  browser testing, fixes and independent verification. Shared browser control and shared-file edits are serialized.
- Bootstrap runtime: `/private/tmp/boss-ui-review-m6x4q4px`; initial runner scratch runtime:
  `/tmp/mt-55471-b6ee910`; HTTP `127.0.0.1:18090`. Mutable configuration is copied; base/dev components are linked
  individually, and only Mantle and BOSS are linked as addons. No working database/resources or PASS are linked.
- Initial revisions: framework `8d22dddc`, BOSS `58cffc1f`; existing release binary reused. The framework
  `ClientFixtures` bootstrap passed 16 features and serves fresh demo data with `mail_capture_sends=true`.
- Local evidence: framework `plans/ui-refinement-evidence/boss-waves-1-3/` (ignored), including `environment.json`.
  Built-in in-app browser tab opened successfully at the isolated login page; no activity is closed by that check.
- Bootstrap logged the expected missing Commerce starter because PASS is deliberately absent, plus existing
  independent demo-load warnings. These do not establish Commons activity outcomes.
- Five bounded batches: DC-01/03, DC-02/04, DC-05/06, DC-07/08, DC-09/10. Full application commit gates use the
  normal component inventory with runtime overrides cleared, so the isolated runtime does not narrow the gate.

#### Batch 1 — navigation and contextual creation (verified with mode gaps)

- Browser control is coordinator-proxied: child agents cannot access the chat-scoped in-app browser; their native
  Chrome fallback timed out. Testing agents specify steps and inspect saved DOM/screenshots; fixing and independent
  evidence verification are delegated. No successful direct child browser navigation is claimed.
- Important states and persisted outcomes are under `batch-1/`. The standard `/apps/Commons/QuickCreate` primary
  action created a disposable task and returned its JSON result. Email/Chat checks cover entry and return only.
- The debug binary was rebuilt for the embedded generators, then refreshed after both generator changes. Client
  component renders were regenerated with the existing golden test; its diff changes only quick-create's on-hide hook.
  A fresh localhost origin was necessary to avoid the old 127.0.0.1 client's cached templates. The rebuild restarted
  on fresh fixtures at `/tmp/mt-78536-19743c40` with `--keep`; pre-rebuild disposable creations are evidence, not current rows.
- Focused framework ScreenQvt: 17/17; offline client WebrootVue.qvt: 34/34; selected TUI Rust test and component
  precompile golden passed. Initial new-test stub/selector failures were corrected. BOSS CommonsSettings passed;
  QuickCreate's corrected compiled-output assertion passed all 19 features without another screen render.
- Adding CommonsClientFixtures required BOSS acceptance: 520/520 server features (97 specs), 172/172 client
  features (67 specs), both passed. These checks do not substitute for the manual DC activity outcomes.
- The first full application gate was invalidated when a process with different sandbox visibility treated live
  workers as stale and removed their scratch files. Its failures are infrastructure corruption, not application
  results. All subsequent test/runtime commands have one coordinator and consistent process visibility; the normal release gate subsequently passed.
- Required behavior checks and independent evidence review passed; the activity ledger preserves untested variants. Actual 200%
  browser zoom is blocked: IAB exposes viewport/visibility, and native control is unavailable; no CSS zoom substitute.
- Subsequent ordinary-staff checks: Joe's TUI task selected label is Joe Developer; Alt+Enter saved `UI review TUI
  task`, closed the dialog, and its browser detail confirms title, Today due date and Joe as assignee. The invalid
  Activity menu entry is DC-UI-005. Existing Projects Open bugs saved find retained Bug Fix and the same IRON-9 row
  after detail/Back. Updated QuickCreate compiled-template assertion now passes all 19 features.
- The kept debug database survived a later stale-run cleanup stopping its Postgres (the retained path still named
  the original, exited runner PID). After stopping the runner, the entire kept runtime was moved to
  `/private/tmp/boss-ui-review-data` and served with `--db existing`; rows were retained. Subsequent restarts use
  this stable path, not a PID-named scratch directory. The reusable UI review guide records this lifecycle detail.
- Full Debug checks passed behavior but exceeded the normal timing budgets; no budgets were raised. The expected
  TUI generator golden changed only its selected-description fallback and was regenerated/rechecked. Normal release
  gates were repeated sequentially. A pre-existing SupportAssignment fixture created date-effective settings
  after its Sunday 03:00 scenario: its setup and parallel clocks are now pinned to Nov 2, and the targeted 7 features pass.
- A direct ordinary-staff Activity submission against the other-organization fixture was refused with Work Effort
  not found; the provided summary/date remained for correction, and the private task title was not shown.
- Final normal application gate: 3394/3394 server and 19/19 client features passed within budgets. Full framework
  gate passed with `RUST_TEST_THREADS=4`, including Cargo workspace and every framework/client phase. An accidental
  global mail-capture override explained earlier local SMTP failures; an unbounded runtime-memory test flake cleared
  with bounded concurrency. Screen lint passed with zero parse failures; existing idiom warnings remain in its report.
- Local prerequisite commit: Mantle `da9ed876` pins SupportAssignment fixture clocks. Framework batch commit:
  `78875383` preserves selected labels, actionable modal completion and the context-free TUI action boundary.
  Evidence includes `test-apps-final.log`, `framework-bounded-concurrency.log` and the independent review notes.

#### Batch 2 — drawers, Assist, Today and notifications

- Used the isolated runtime and separate ordinary-staff identity sessions, with coordinator-owned built-in browser control and delegated step design/evidence inspection. No direct child browser navigation succeeded.
- Compared app drawer/main record/tray/Assist in wide light/dark; phone tray exposed the containment defect. Today completion/snooze and separately addressed approve/refuse fixtures produced source-record/timeline outcomes, rather than relying on toasts alone.
- Corrected DC-UI-006–008 in shared causes. Fresh origin was required for current browser assets. The component precompile golden was regenerated and its test passed (`precompile-batch-2-regenerated.log`). Earlier source-review notes describe their then-pending state and are superseded by the fresh after evidence.
- Assist has no usable provider model name in this review configuration. Failure/retry feedback is exercised; successful run, stop/approval and canvas are blocked/deferred. The live-call combination remains Wave 6.
- Regression assertions target user-only terminal failure, generated accessible names, the existing Today render and scrollbar/container geometry. No new screenshot baseline or application route sweep was added. Full framework gate passed with bounded Rust test concurrency; all 3404 application server features and 19 client features passed within budgets. Screen lint passed with zero parse failures.

- Current evidence includes `fresh-phone-names-width-after.dom/.jpg`, the named correct-row reschedule dialog, and independently inspected light/dark Assist failure/retry images. Full gates: `framework-bounded-concurrency.log`, `apps-batch-2.log`; local BOSS batch 1 commit `b9d79880`.

For each batch record:

1. Intent, selected DC activities/screens, fixtures, environment and source/binary revisions.
2. Observations, finding IDs, design decisions, before/after evidence and owning repositories.
3. Changes made, compatibility implications and whether shared guide/design/implementation notes need updating.
4. Activities rerun, actual actor/mode/state, expected versus observed result and recovery outcome.
5. Verification commands/results, local evidence references and any commits made; no secrets or personal fixture data.
6. Pending/blocked/deferred work, prerequisite and next bounded review choice.

### Completion

Close an activity only with an observed completion and relevant recovery outcome, or an explicit blocked/deferred
disposition. An inventory row, success toast, render or automated check alone does not prove usability. Close a wave
when its mapped surfaces have an outcome, findings are corrected and retested or explicitly deferred, and required
checks for its changes have passed. Report unresolved coverage rather than describing a bounded pass as complete
coverage of the entire design.

The final phase record includes refined behavior, screen/activity coverage, resolved and outstanding findings,
verification results, selected before/after evidence, compatibility decisions and reusable patterns for later
`ui-review-*` files. Feed general patterns back into the framework UI review guide; keep BOSS-specific findings here.

## 7. Decisions

Decided for this review; add later decisions here, and put a question still open under an **Open** heading with the
choice this plan would make.

- **Waves and DC IDs** follow dependency and blast radius (§2): the shared record surfaces come second, and mail,
  chat and calls follow the surfaces they use. The IDs were renumbered to match before any evidence cited them.
- **Status:** each activity's status is only in the §6 ledger; each screen's and mode's status is in the §3 inventory.
- **Golden-path walks** for Commons and Comms are a remaining item in
  [impl-drawers-commons.md](impl-drawers-commons.md#9-addendum-nov-8-2026-remaining-items), not part of this review.
- **Desktop client shell:** not reviewed separately. A change to one of its six bundled Comms screens is carried into
  the desktop variants (precompiled copy, offline answers and outbox, shell wrappers) as §5 describes.
- **Standard `/apps`:** a brief functional check only; the UI review is of `/qapps` (§2).
- **mr-pass:** loaded only for the Wave 7 batch that runs DC-20 (§2).
- **First batch:** DC-01 and DC-03 (§6).
