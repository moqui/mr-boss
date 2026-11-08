# IronStone BOSS — UI review: drawers, Commons and Comms

Contents: [scope and sources](#1-purpose-scope-and-sources) · [method](#2-review-method-and-refinement-criteria) ·
[screen inventory](#3-screen-and-surface-inventory) · [user processes](#4-end-to-end-activities) ·
[verification](#5-existing-checks-and-future-verification) · [running record](#6-coverage-findings-and-running-record).

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

**Initial state:** documentation planning only. All review coverage is **pending**. No browser activities, application
changes, builds or tests were performed to establish this plan. Source/mount inspection establishes the inventory,
not usability or passing behavior. Historical findings are leads to reproduce, not current defects.

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
  configuration, theme/provider registrations and `screen-extend/basic-comms`: current ownership and mounts take
  precedence over historical inventories when deciding what can be reviewed.

Use the existing research as a comparison lens: Nextcloud and Zimbra for contact/calendar/mail/file workflows;
Twenty and Frappe for palette and panel transitions; OpenProject and Odoo for personal work, notifications and record
activity; Nextcloud Talk and Signal for chat/call continuity; Nextcloud Text/Collectives and Frappe Wiki for editing,
history and review. These are catalogued patterns, not new claims about current third-party products. Do not restart
third-party research or copy a reference application's feature inventory into this phase.

### Ownership and boundaries

| Surface | Owner and review boundary |
| --- | --- |
| Commons | BOSS screens and screen context; business rules and business record services in Mantle |
| Comms | BasicComms screens mounted under `/qapps/Comms`, with BOSS extensions for internal mailboxes, record context, consent and moderation; fix generic mail/chat/call behavior in BasicComms |
| Task and request detail | BOSS `Shared/WorkItemDetail.xml` and `Shared/RequestDetail.xml`, mounted by Commons; inspect the consuming context rather than creating copies |
| Header, drawer frames, shared controls, Assist, live call | Framework webroot/client and framework services; BOSS supplies providers and theme destinations |
| Chatter and RecordFiles | Shared BOSS screens mounted under authorized app roots, backed by Mantle/framework services |
| Public share, unsubscribe, published calendar | Currently BOSS token routes; review existing behavior without relocating them to PASS |
| Guest call | Framework BasicComms token route, reached from the inherited Calls flow |

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

Reuse the existing suitable binary for XML/QVue/CSS/script changes. Follow the repository's building skill when a
rebuild is required, including embedded renderer changes. Check that browser assets are current before diagnosing a
stale-template problem. Use separate browser profiles or hostnames for identities; cookies are not isolated by port.

Prepare these named fixture roles; record actual IDs and permissions in execution evidence, never credentials:

- **Staff A / Staff B:** two internal `BOSS_USERS` members with distinct personal contacts, mail, notes and calendars;
  shared fixtures with explicit owner/editor/reader roles.
- **Other-org staff:** an internal user with no membership in the first organization's restricted records.
- **Specialists:** contact administrator, knowledge reviewer, authorized approver, internal forum moderator and a
  configuration administrator, each with only the needed grants; use unrestricted ADMIN only for fixture setup or
  a deliberately administrative activity.
- **Public account:** signed in with no BOSS membership, plus a representative restricted project-client identity.
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
  Target Standard `/apps`, print and export where a supported fallback or output is part of an activity. A text-only
  placeholder or non-error render does not prove equivalent TUI functionality.
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
| 2. Contacts and mail | DC-05–06, DC-14–16 | Recipient foundations, import/merge, account setup, personal and internal/shared messages |
| 3. Assigned work and calendar | DC-07–09 | Shared details, Today continuity, scheduling, RSVP, publication and device-access settings |
| 4. Files and knowledge | DC-10–13 | Resource lifecycle, sharing, public links, co-editing, review and recovery |
| 5. Chat, calls and user administration | DC-17–21 | Synchronous collaboration, record context, consent, moderation and personal settings |
| 6. Integration and remaining coverage | DC-22 and pending variants | Cross-app/access walks, responsive/keyboard/TUI completion and shared-fix retests |

Each batch follows observe → prioritize → refine → rerun affected activities → compare evidence → verify → update
this record. Keep source changes and their notes together in each owning repository. This plan does not itself ask
for commits, pushes, application changes or acceptance execution.

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
boundaries across the whole inventory in addition to the primary activity IDs listed.

### Commons routes

| Route | Source / owner | Activities | Render variants / role | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| `Commons` | `B Commons.xml` | DC-01 | XML widgets (browser/TUI) | pending | — |
| `Commons/Calendar/EventDetail` | `B Commons/Calendar/EventDetail.xml` | DC-08 | XML + custom sections; inline qvt; inline tui | pending | — |
| `Commons/Calendar/Schedules/ResourceDetail` | `B Commons/Calendar/Schedules/ResourceDetail.xml` | DC-08 | XML + custom sections; inline qvt; inline tui | pending | — |
| `Commons/Calendar/Schedules` | `B Commons/Calendar/Schedules.xml` | DC-08 | XML + custom sections; qvue: `B Commons/Calendar/Schedules.qvue`; inline tui; inline html,qvt | pending | — |
| `Commons/Calendar/SchedulesTui` | `B Commons/Calendar/SchedulesTui.xml` | DC-08 | Hidden XML TUI helper | pending | — |
| `Commons/Calendar` | `B Commons/Calendar.xml` | DC-08 | XML + custom sections; qvue: `B Commons/Calendar.qvue`; inline tui; inline html,qvt | pending | — |
| `Commons/CalendarTui` | `B Commons/CalendarTui.xml` | DC-08 | Hidden XML TUI helper | pending | — |
| `Commons/Contacts/Compare` | `B Commons/Contacts/Compare.xml` | DC-06 | XML + custom sections; inline qvt; inline tui | pending | — |
| `Commons/Contacts/ContactDetail` | `B Commons/Contacts/ContactDetail.xml` | DC-05 | XML + custom sections; inline html-print | pending | — |
| `Commons/Contacts/Duplicates` | `B Commons/Contacts/Duplicates.xml` | DC-06 | XML widgets (browser/TUI) | pending | — |
| `Commons/Contacts/Import/Mapping` | `B Commons/Contacts/Import/Mapping.xml` | DC-06 | XML widgets (browser/TUI) | pending | — |
| `Commons/Contacts/Import/Options` | `B Commons/Contacts/Import/Options.xml` | DC-06 | XML widgets (browser/TUI) | pending | — |
| `Commons/Contacts/Import/Preview` | `B Commons/Contacts/Import/Preview.xml` | DC-06 | XML widgets (browser/TUI) | pending | — |
| `Commons/Contacts/Import/Result` | `B Commons/Contacts/Import/Result.xml` | DC-06 | XML + custom sections; inline qvt; inline tui | pending | — |
| `Commons/Contacts/Import/Source` | `B Commons/Contacts/Import/Source.xml` | DC-06 | XML widgets (browser/TUI) | pending | — |
| `Commons/Contacts/Import` | `B Commons/Contacts/Import.xml` | DC-06 | XML widgets (browser/TUI) | pending | — |
| `Commons/Contacts/ImportProgress` | `B Commons/Contacts/ImportProgress.xml` | DC-06 | XML + custom sections; qvue: `B Commons/Contacts/ImportProgress.qvue`; tui: `B Commons/Contacts/ImportProgress.tui.json` | pending | — |
| `Commons/Contacts/List` | `B Commons/Contacts/List.xml` | DC-05 | XML + custom sections; inline html-print; inline qvt; inline tui | pending | — |
| `Commons/Contacts` | `B Commons/Contacts.xml` | DC-05 | XML widgets (browser/TUI) | pending | — |
| `Commons/Files/DriveSettings` | `B Commons/Files/DriveSettings.xml` | DC-10, DC-11 | XML widgets (browser/TUI) | pending | — |
| `Commons/Files/Drives` | `B Commons/Files/Drives.xml` | DC-10, DC-11 | XML widgets (browser/TUI) | pending | — |
| `Commons/Files/Shares` | `B Commons/Files/Shares.xml` | DC-10, DC-11 | XML widgets (browser/TUI) | pending | — |
| `Commons/Files` | `B Commons/Files.xml` | DC-10, DC-11 | XML + custom sections; qvue: `B Commons/Files.qvue`; inline tui; inline html,qvt | pending | — |
| `Commons/FilesTui` | `B Commons/FilesTui.xml` | DC-10, DC-11 | Hidden XML TUI helper | pending | — |
| `Commons/Home` | `B Commons/Home.xml` | DC-01 | XML + custom sections; inline qvt; inline tui | pending | — |
| `Commons/Knowledge/Review` | `B Commons/Knowledge/Review.xml` | DC-12 | XML widgets (browser/TUI) | pending | — |
| `Commons/Knowledge/SpaceDetail` | `B Commons/Knowledge/SpaceDetail.xml` | DC-12 | XML widgets (browser/TUI) | pending | — |
| `Commons/Knowledge/Spaces` | `B Commons/Knowledge/Spaces.xml` | DC-12 | XML widgets (browser/TUI) | pending | — |
| `Commons/Knowledge` | `B Commons/Knowledge.xml` | DC-12 | XML + custom sections; qvue: `B Commons/Knowledge.qvue`; inline tui | pending | — |
| `Commons/KnowledgeTui` | `B Commons/KnowledgeTui.xml` | DC-12 | Hidden XML TUI helper | pending | — |
| `Commons/Notes` | `B Commons/Notes.xml` | DC-13 | XML + custom sections; qvue: `B Commons/Notes.qvue`; inline tui | pending | — |
| `Commons/NotesTui` | `B Commons/NotesTui.xml` | DC-13 | Hidden XML TUI helper | pending | — |
| `Commons/Notifications` | `B Commons/Notifications.xml` | DC-04 | XML + custom sections; inline qvt; inline tui | pending | — |
| `Commons/Panel/Notifications` | `B Commons/Panel/Notifications.xml` | DC-02, DC-04 | XML + custom sections; inline qvt; inline tui | pending | — |
| `Commons/Panel/Today` | `B Commons/Panel/Today.xml` | DC-02, DC-04 | XML + custom sections; inline qvt; inline tui | pending | — |
| `Commons/Panel` | `B Commons/Panel.xml` | DC-02, DC-04 | XML widgets (browser/TUI) | pending | — |
| `Commons/QuickCreate` | `B Commons/QuickCreate.xml` | DC-03, DC-13 | XML + custom sections; inline qvt; inline tui | pending | — |
| `Commons/Requests/List` | `B Commons/Requests/List.xml` | DC-07, DC-19 | XML + custom sections; inline qvt; inline tui | pending | — |
| `Commons/Requests` | `B Commons/Requests.xml` | DC-07, DC-19 | XML widgets (browser/TUI) | pending | — |
| `Commons/Search` | `B Commons/Search.xml` | DC-01 | XML widgets (browser/TUI) | pending | — |
| `Commons/Settings/Account` | `B Commons/Settings/Account.xml` | DC-21 | XML + custom sections; inline qvt; inline tui | pending | — |
| `Commons/Settings/Calendars` | `B Commons/Settings/Calendars.xml` | DC-08, DC-09 | XML + custom sections; inline qvt; inline tui | pending | — |
| `Commons/Settings/ContactBooks` | `B Commons/Settings/ContactBooks.xml` | DC-05, DC-09 | XML widgets (browser/TUI) | pending | — |
| `Commons/Settings/Index` | `B Commons/Settings/Index.xml` | DC-21 | XML + custom sections; inline qvt; inline tui | pending | — |
| `Commons/Settings/Notifications` | `B Commons/Settings/Notifications.xml` | DC-04, DC-21 | XML widgets (browser/TUI) | pending | — |
| `Commons/Settings/Preferences` | `B Commons/Settings/Preferences.xml` | DC-21 | XML widgets (browser/TUI) | pending | — |
| `Commons/Settings/Sync` | `B Commons/Settings/Sync.xml` | DC-09 | XML widgets (browser/TUI) | pending | — |
| `Commons/Settings` | `B Commons/Settings.xml` | DC-21 | XML widgets (browser/TUI) | pending | — |
| `Commons/Tasks/List` | `B Commons/Tasks/List.xml` | DC-07, DC-19 | XML + custom sections; inline qvt; inline tui | pending | — |
| `Commons/Tasks` | `B Commons/Tasks.xml` | DC-07, DC-19 | XML widgets (browser/TUI) | pending | — |
| `Commons/Tasks/TaskDetail` | `B Shared/WorkItemDetail.xml` | DC-07, DC-19 | XML + custom sections; inline qvt; inline tui | pending | — |
| `Commons/Requests/RequestDetail` | `B Shared/RequestDetail.xml` | DC-07, DC-19 | XML + custom sections; inline qvt; inline tui | pending | — |
| `Commons/Settings/Account/VerifyEmail` | `T VerifyEmail.xml` | DC-21 | XML widgets (browser/TUI) | pending | — |
| `Commons/Settings/Account/VerifySms` | `T VerifySms.xml` | DC-21 | XML widgets (browser/TUI) | pending | — |
| `Commons/Settings/Account/VerifyTotp` | `T VerifyTotp.xml` | DC-21 | XML widgets (browser/TUI) | pending | — |

### Comms routes

All C routes below are mounted through BOSS Comms. BOSS extends Home, Chat, Inbox/Mail, Inbox/Compose,
Inbox/MessageDetail, Calls/Voicemail and Settings/Index in `screen-extend/basic-comms`; review the effective
combined screen and its providers. The BasicComms root is hidden in the BOSS launcher.

| Route | Source / owner | Activities | Render variants / role | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| `Comms` | `B Comms.xml` | DC-01 | XML widgets (browser/TUI) | pending | — |
| `Comms/Calls/Call` | `C BasicComms/Calls/Call.xml` | DC-18 | XML + custom sections; qvue: `C BasicComms/Calls/Call.qvue`; tui: `C BasicComms/Calls/Call.tui.json` | pending | — |
| `Comms/Calls/CallTui` | `C BasicComms/Calls/CallTui.xml` | DC-18 | Hidden XML TUI helper | pending | — |
| `Comms/Calls/Dialer` | `C BasicComms/Calls/Dialer.xml` | DC-18 | XML + custom sections; qvue: `C BasicComms/Calls/Dialer.qvue`; tui: `C BasicComms/Calls/Dialer.tui.json` | pending | — |
| `Comms/Calls/DialerTui` | `C BasicComms/Calls/DialerTui.xml` | DC-18 | Hidden XML TUI helper | pending | — |
| `Comms/Calls/History` | `C BasicComms/Calls/History.xml` | DC-18 | XML widgets (browser/TUI) | pending | — |
| `Comms/Calls/Queues` | `C BasicComms/Calls/Queues.xml` | DC-18 | XML widgets (browser/TUI) | pending | — |
| `Comms/Calls/Recordings` | `C BasicComms/Calls/Recordings.xml` | DC-18 | XML + custom sections; qvue: `C BasicComms/Calls/Recordings.qvue`; tui: `C BasicComms/Calls/Recordings.tui.json` | pending | — |
| `Comms/Calls/RecordingsTui` | `C BasicComms/Calls/RecordingsTui.xml` | DC-18 | Hidden XML TUI helper | pending | — |
| `Comms/Calls/Voicemail` | `C BasicComms/Calls/Voicemail.xml` | DC-18 | XML + custom sections; qvue: `C BasicComms/Calls/Voicemail.qvue`; tui: `C BasicComms/Calls/Voicemail.tui.json` | pending | — |
| `Comms/Calls/VoicemailTui` | `C BasicComms/Calls/VoicemailTui.xml` | DC-18 | Hidden XML TUI helper | pending | — |
| `Comms/Calls` | `C BasicComms/Calls.xml` | DC-18 | XML widgets (browser/TUI) | pending | — |
| `Comms/Chat` | `C BasicComms/Chat.xml` | DC-17 | XML + custom sections; qvue: `C BasicComms/Chat.qvue`; tui: `C BasicComms/Chat.tui.json` | pending | — |
| `Comms/ChatTui` | `C BasicComms/ChatTui.xml` | DC-17 | Hidden XML TUI helper | pending | — |
| `Comms/Home` | `C BasicComms/Home.xml` | DC-15, DC-16, DC-18 | XML + custom sections; inline qvt; inline tui | pending | — |
| `Comms/Inbox/Compose` | `C BasicComms/Inbox/Compose.xml` | DC-15, DC-16 | XML + custom sections; qvue: `C BasicComms/Inbox/Compose.qvue`; tui: `C BasicComms/Inbox/Compose.tui.json` | pending | — |
| `Comms/Inbox/ComposeTui` | `C BasicComms/Inbox/ComposeTui.xml` | DC-15, DC-16 | Hidden XML TUI helper | pending | — |
| `Comms/Inbox/Mail` | `C BasicComms/Inbox/Mail.xml` | DC-15, DC-16 | XML + custom sections; qvue: `C BasicComms/Inbox/Mail.qvue`; tui: `C BasicComms/Inbox/Mail.tui.json`; inline html,qvt | pending | — |
| `Comms/Inbox/MailTui` | `C BasicComms/Inbox/MailTui.xml` | DC-15, DC-16 | Hidden XML TUI helper | pending | — |
| `Comms/Inbox/MessageDetail` | `C BasicComms/Inbox/MessageDetail.xml` | DC-15, DC-16 | XML + custom sections; inline qvt; inline tui; inline html,text | pending | — |
| `Comms/Inbox` | `C BasicComms/Inbox.xml` | DC-15, DC-16 | XML widgets (browser/TUI) | pending | — |
| `Comms/Panel/Chat` | `C BasicComms/Panel/Chat.xml` | DC-02, DC-03, DC-17 | XML + custom sections; qvue: `C BasicComms/Panel/ChatPanel.qvue`; tui: `C BasicComms/Panel/Chat.tui.json` | pending | — |
| `Comms/Panel/Dialer` | `C BasicComms/Panel/Dialer.xml` | DC-02, DC-18 | XML + custom sections; qvue: `C BasicComms/Calls/Dialer.qvue`; tui: `C BasicComms/Panel/Dialer.tui.json` | pending | — |
| `Comms/Panel` | `C BasicComms/Panel.xml` | DC-02, DC-17, DC-18 | XML widgets (browser/TUI) | pending | — |
| `Comms/Settings/CallHandling` | `C BasicComms/Settings/CallHandling.xml` | DC-18 | XML + custom sections; qvue: `C BasicComms/Settings/CallHandling.qvue`; tui: `C BasicComms/Settings/CallHandling.tui.json` | pending | — |
| `Comms/Settings/CallHandlingTui` | `C BasicComms/Settings/CallHandlingTui.xml` | DC-18 | Hidden XML TUI helper | pending | — |
| `Comms/Settings/Calls` | `C BasicComms/Settings/Calls.xml` | DC-18 | XML + custom sections; qvue: `C BasicComms/Settings/Calls.qvue`; tui: `C BasicComms/Settings/Calls.tui.json` | pending | — |
| `Comms/Settings/Chat` | `C BasicComms/Settings/Chat.xml` | DC-17 | XML widgets (browser/TUI) | pending | — |
| `Comms/Settings/ChatApps` | `C BasicComms/Settings/ChatApps.xml` | DC-17 | XML widgets (browser/TUI) | pending | — |
| `Comms/Settings/Devices` | `C BasicComms/Settings/Devices.xml` | DC-17 | XML + custom sections; qvue: `C BasicComms/Settings/Devices.qvue`; tui: `C BasicComms/Settings/Devices.tui.json` | pending | — |
| `Comms/Settings/DevicesTui` | `C BasicComms/Settings/DevicesTui.xml` | DC-17 | Hidden XML TUI helper | pending | — |
| `Comms/Settings/Identities` | `C BasicComms/Settings/Identities.xml` | DC-14, DC-15 | XML widgets (browser/TUI) | pending | — |
| `Comms/Settings/Index` | `C BasicComms/Settings/Index.xml` | DC-14, DC-17, DC-18, DC-21 | XML widgets (browser/TUI) | pending | — |
| `Comms/Settings/MailAccounts/Account` | `C BasicComms/Settings/MailAccounts/Account.xml` | DC-14 | XML + custom sections; inline qvt; inline tui | pending | — |
| `Comms/Settings/MailAccounts/Add/Address` | `C BasicComms/Settings/MailAccounts/Add/Address.xml` | DC-14 | XML widgets (browser/TUI) | pending | — |
| `Comms/Settings/MailAccounts/Add/Connect` | `C BasicComms/Settings/MailAccounts/Add/Connect.xml` | DC-14 | XML + custom sections; inline qvt; inline tui | pending | — |
| `Comms/Settings/MailAccounts/Add/Finish` | `C BasicComms/Settings/MailAccounts/Add/Finish.xml` | DC-14 | XML widgets (browser/TUI) | pending | — |
| `Comms/Settings/MailAccounts/Add/Options` | `C BasicComms/Settings/MailAccounts/Add/Options.xml` | DC-14 | XML widgets (browser/TUI) | pending | — |
| `Comms/Settings/MailAccounts/Add/Test` | `C BasicComms/Settings/MailAccounts/Add/Test.xml` | DC-14 | XML + custom sections; inline qvt; inline tui | pending | — |
| `Comms/Settings/MailAccounts/Add` | `C BasicComms/Settings/MailAccounts/Add.xml` | DC-14 | XML widgets (browser/TUI) | pending | — |
| `Comms/Settings/MailAccounts/List` | `C BasicComms/Settings/MailAccounts/List.xml` | DC-14 | XML + custom sections; inline qvt; inline tui | pending | — |
| `Comms/Settings/MailAccounts/Removed` | `C BasicComms/Settings/MailAccounts/Removed.xml` | DC-14 | XML + custom sections; qvue: `C BasicComms/Settings/MailAccounts/Removed.qvue`; tui: `C BasicComms/Settings/MailAccounts/Removed.tui.json` | pending | — |
| `Comms/Settings/MailAccounts/SignIn` | `C BasicComms/Settings/MailAccounts/SignIn.xml` | DC-14 | XML + custom sections; qvue: `C BasicComms/Settings/MailAccounts/SignIn.qvue`; tui: `C BasicComms/Settings/MailAccounts/SignIn.tui.json` | pending | — |
| `Comms/Settings/MailAccounts/SyncProgress` | `C BasicComms/Settings/MailAccounts/SyncProgress.xml` | DC-14 | XML + custom sections; qvue: `C BasicComms/Settings/MailAccounts/SyncProgress.qvue`; tui: `C BasicComms/Settings/MailAccounts/SyncProgress.tui.json` | pending | — |
| `Comms/Settings/MailAccounts` | `C BasicComms/Settings/MailAccounts.xml` | DC-14 | XML widgets (browser/TUI) | pending | — |
| `Comms/Settings/OutOfOffice` | `C BasicComms/Settings/OutOfOffice.xml` | DC-14 | XML + custom sections; inline qvt,html,html-print; inline tui | pending | — |
| `Comms/Settings/Phone` | `C BasicComms/Settings/Phone.xml` | DC-18 | XML + custom sections; qvue: `C BasicComms/Settings/Phone.qvue`; tui: `C BasicComms/Settings/Phone.tui.json` | pending | — |
| `Comms/Settings/PhoneDevices` | `C BasicComms/Settings/PhoneDevices.xml` | DC-18 | XML + custom sections; qvue: `C BasicComms/Settings/PhoneDevices.qvue`; tui: `C BasicComms/Settings/PhoneDevices.tui.json` | pending | — |
| `Comms/Settings/PhoneDevicesTui` | `C BasicComms/Settings/PhoneDevicesTui.xml` | DC-18 | Hidden XML TUI helper | pending | — |
| `Comms/Settings/PhoneTui` | `C BasicComms/Settings/PhoneTui.xml` | DC-18 | Hidden XML TUI helper | pending | — |
| `Comms/Settings/Rules` | `C BasicComms/Settings/Rules.xml` | DC-14 | XML + custom sections; qvue: `C BasicComms/Settings/Rules.qvue`; tui: `C BasicComms/Settings/Rules.tui.json` | pending | — |
| `Comms/Settings/RulesTui` | `C BasicComms/Settings/RulesTui.xml` | DC-14 | Hidden XML TUI helper | pending | — |
| `Comms/Settings/TextBlocks` | `C BasicComms/Settings/TextBlocks.xml` | DC-14, DC-15 | XML widgets (browser/TUI) | pending | — |
| `Comms/Settings` | `C BasicComms/Settings.xml` | DC-14, DC-17, DC-18, DC-21 | XML widgets (browser/TUI) | pending | — |
| `Comms/Consent/Contact` | `B Comms/Consent/Contact.xml` | DC-20 | XML widgets (browser/TUI) | pending | — |
| `Comms/Consent/List` | `B Comms/Consent/List.xml` | DC-20 | XML + custom sections; inline qvt; inline tui | pending | — |
| `Comms/Consent` | `B Comms/Consent.xml` | DC-20 | XML widgets (browser/TUI) | pending | — |
| `Comms/Moderation/Queue` | `B Comms/Moderation/Queue.xml` | DC-20 | XML widgets (browser/TUI) | pending | — |
| `Comms/Moderation/Review` | `B Comms/Moderation/Review.xml` | DC-20 | XML + custom sections; inline qvt; inline tui | pending | — |
| `Comms/Moderation` | `B Comms/Moderation.xml` | DC-20 | XML widgets (browser/TUI) | pending | — |

### Shared and public routes

| Route | Source / owner | Activities | Render variants / role | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| `Commons/Chatter` | `B Shared/Chatter.xml` | DC-19 | XML + custom sections; qvue: `B Shared/Chatter.qvue`; inline tui; inline html,qvt | pending | — |
| `Commons/Chatter/ChatterTui` | `B Shared/ChatterTui.xml` | DC-19 | Hidden XML TUI helper, loaded by Chatter | pending | — |
| `Commons/RecordFiles` | `B Shared/RecordFiles.xml` | DC-10, DC-19 | XML + custom sections; qvue: `B Shared/RecordFiles.qvue`; inline tui; inline html,qvt | pending | — |
| `Commons/RecordFiles/RecordFilesTui` | `B Shared/RecordFilesTui.xml` | DC-10, DC-19 | Hidden XML TUI helper, loaded by RecordFiles | pending | — |
| `Comms/Chatter` | `B Shared/Chatter.xml` | DC-19 | XML + custom sections; qvue: `B Shared/Chatter.qvue`; inline tui; inline html,qvt | pending | — |
| `Comms/Chatter/ChatterTui` | `B Shared/ChatterTui.xml` | DC-19 | Hidden XML TUI helper, loaded by Chatter | pending | — |
| `Comms/RecordFiles` | `B Shared/RecordFiles.xml` | DC-10, DC-19 | XML + custom sections; qvue: `B Shared/RecordFiles.qvue`; inline tui; inline html,qvt | pending | — |
| `Comms/RecordFiles/RecordFilesTui` | `B Shared/RecordFilesTui.xml` | DC-10, DC-19 | Hidden XML TUI helper, loaded by RecordFiles | pending | — |
| `/s/<token>` | `B PublicShare.xml` | DC-11 | XML + custom sections; qvue: `B PublicShare.qvue`; tui: `B PublicShare.tui.json`; inline html,qvt | pending | — |
| `/u/<token>` | `B Unsubscribe.xml` | DC-20 | XML + custom sections; qvue: `B Unsubscribe.qvue`; tui: `B Unsubscribe.tui.json`; inline html,qvt | pending | — |
| `/cal/<token>` | `B PublishedCalendar.xml` | DC-09 | XML + custom sections; qvue: `B PublishedCalendar.qvue`; tui: `B PublishedCalendar.tui.json`; inline html,qvt | pending | — |
| `/call/<token>` | `C CallGuest.xml` | DC-18 | XML + custom sections; qvue: `C CallGuest.qvue`; inline tui | pending | — |

Shared XML TUI helpers support the same DC-19/DC-10 activities. Each parent mounts its helper as a hidden child;
inspect both the helper controls and the parent inline TUI loader through the actual host app.

### Embedded surfaces and dialogs

| Route / surface | Source / owner | Activities | Variants and inspection | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| All BOSS apps: launcher | W / framework shell; BOSS app registrations | DC-01, DC-22 | Browser/TUI authorized destinations, active app, empty permissions | pending | — |
| All BOSS apps: app navigation and breadcrumbs | W / framework shell | DC-01, DC-02 | Browser/TUI, sibling menus, keyboard and Back | pending | — |
| Saved finds and list controls | Shared framework widgets; consuming lists | DC-01, DC-07 | Find Options, sort, save/update/default/reset, columns, pagination, export | pending | — |
| Palette | W / shell; Commons and Comms providers | DC-01, DC-22 | Recent, Screens, Actions, Saved finds, Records/ID, People, Pages/files, Events, Messages/rooms | pending | — |
| Quick-create menu | W / shell; BOSS root providers | DC-03 | Contextual kinds, record-required activity, cancellation and focus return | pending | — |
| Header badges | W / shell; BOSS theme/count providers | DC-04, DC-16–18 | Mail versus internal messages, unread/mentions, Today, notifications, missed calls | pending | — |
| Account/presence menu | W / shell; BOSS account destinations | DC-01, DC-21 | Profile, status/presence, theme, preferences, re-login/logout, keyboard | pending | — |
| Tray frame and tabs | W / shell with B/C panel content | DC-02–04, DC-17–18 | Today, Chat, Notifications, Dialer; cross-navigation, resize, overlay, focus | pending | — |
| Assist drawer | W `assist.xml`, `js/WebrootAssist.js`, canvas/sandbox clients / framework | DC-02, DC-22 | Available chat/history/context/rules/canvas controls, run state, cancellation/approval, provider unavailable; record unsupported TUI behavior | pending | — |
| Live-call mini-window | W call client / framework | DC-02, DC-18 | Incoming/active state, navigate away, return, end call, narrow combined layout | pending | — |
| Contacts: contact methods, books/groups, recipient cards | B Contacts screens; Mantle contact services | DC-05–06, DC-15 | Add/edit/remove, selected labels, privacy, merge comparison, print/export | pending | — |
| Calendar: quick event, recurrence, invite and booking controls | B Calendar/Schedules QVue and EventDetail | DC-08–09 | Drag and keyboard alternatives, conflict feedback, attendee/room selectors, publication | pending | — |
| Files: browser and details pane | B `Commons/Files.qvue` | DC-10–11 | Upload/progress, preview, rename/move, share/link, versions/compare/restore, trash, narrow selected file | pending | — |
| Attach from Files / Save to Files | B and C file-picker transitions; Compose/Mail/Chat/RecordFiles consumers | DC-10, DC-15, DC-17, DC-19 | Authorized drive/folder selection, upload failures, cancel/reopen, correct destination | pending | — |
| Knowledge: tree/editor/history/review dialogs | B `Commons/Knowledge.qvue` and child screens | DC-12 | Co-edit, save/version, compare/restore, duplicate/move, review/publish; text fallback | pending | — |
| Notes: editor and note navigation | B `Commons/Notes.qvue` | DC-13 | Private note selection, saved/dirty state, search, recovery, text fallback | pending | — |
| Inbox: accounts/folders/Internal mailboxes | C Inbox with B Home/Mail/MessageDetail extensions and providers | DC-15–16 | Thread/list selection, labels, assignment where offered, drafts/outbox, file-on-record/create-from actions | pending | — |
| Compose: recipients, attachments, send/draft controls | C Compose with B picker/provider additions | DC-03, DC-15 | Identity, recipient lookup/chips, text blocks, pending send, schedule, retry/cancel | pending | — |
| Chat: room and message actions | C Chat and tray with B record providers | DC-17, DC-19 | Threads, Files, members, mentions, reactions, polls, forward, encryption/devices, record/create actions | pending | — |
| Calls: lobby, incoming/active call and meeting join | C Calls and W call client; B calendar/contact providers | DC-18 | Local media, dial/search/transfer targets where offered, call-link/guest handoff, permission refusal | pending | — |
| Record cards, Chatter and activity dialogs | B shared detail/Chatter screens; Mantle | DC-03, DC-19, DC-22 | Note/reply/edit/delete, mention, follow, activity, record visibility, mounted context | pending | — |
| Account verification dialogs | B Account and mounted T screens | DC-21 | Email/SMS/TOTP configured fixtures, validation, cancellation and safe recovery | pending | — |

### Design-to-code reconciliation

These rows are planning discrepancies or scope boundaries, not observed UI defects. Recheck mounts at the start of
execution and update this table if the implementation has moved. Do not add an imagined URL to the reachable inventory.

| Design/history item | Current source finding | Review treatment |
| --- | --- | --- |
| People self-service under Commons | No `Commons/People/SelfService` definition or root mount in the inspected tree | Track as unmounted proposal; People implementation/review owns delivery |
| Comms Delivery/Campaigns, MessageTemplates/MessageTemplateDetail, SendingProfiles, Suppressions | Proposed in the design; no such descendants or explicit mounts in current Comms/BasicComms roots and BOSS extensions | Existing Consent remains in scope; do not invent delivery/template/suppression pages |
| Shared survey/form builder and event registration additions | Crosscut/Marketing design work, not present in the inspected Commons tree | Separate implementation scope; inspect links only if an actual integration appears |
| Calls and Assist listed as later in old implementation notes | Calls is mounted from BasicComms and Assist exists in webroot | Review current controls; do not carry historical deferred status forward |
| Sync and co-editing listed as later in early milestones | Commons Settings/Sync and editor integrations exist | Include settings, save/recovery and two-user activities; distinguish UI from external protocol proof |
| Public pages proposed to move to PASS | BOSS configuration still mounts `/s`, `/u`, `/cal` | Review current routes; relocation is outside this phase |
| TaskDetail and RequestDetail absent from local child directories | Explicit mounts use Shared/WorkItemDetail and Shared/RequestDetail | Review through Commons; keep one implementation and identify shared findings |
| Older TUI/static/browser findings and test names | Implementation history predates subsequent framework fixes and suite moves | Reproduce before reporting; use current test locations in §5 |
| Unavailable integration or operation mentioned in a journey | Capability may depend on configuration, role or completed implementation | Inspect its availability/error UX; record unsupported or blocked steps without claiming successful completion |

## 4. End-to-end activities

All activities start **pending; evidence —**. Execute visible controls and inspect intermediate screens, confirmations,
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
- **Status/evidence:** pending / —.

### DC-02 — Work with drawers and Assist

- **Actor/start:** Staff A on a disposable record, with tray data and a local Assist fixture; Staff B for call overlap.
- **Objective/steps:** open app drawer, tray and Assist → switch tray tabs → change record → inspect Assist context and
  available history/rules/canvas controls → run/cancel a safe fixture and exercise its approval/refusal UI →
  resize/close/reopen; repeat while a local call mini-window is present.
- **Expected:** current context is accurate; panels preserve appropriate state, never expose the previous record's
  private content, and leave the main task and controls usable; cancellations and approvals have explicit outcomes.
- **Recovery:** missing provider, rejected approval, failed run, stale response, navigation during loading, Escape.
- **Screens/modes:** framework shell/Assist, Commons/Panel, Comms/Panel, live call; browser, targeted keyboard/zoom/narrow;
  TUI shell/panel equivalents, with unsupported Assist/media operations recorded separately.
- **Status/evidence:** pending / —.

### DC-03 — Create work in context

- **Actor/start:** Staff A on permitted contact/task/request records, then on a context-free landing page.
- **Objective/steps:** quick-create task, activity, event, note, contact and request → validate → save → open result;
  repeat cancel/reopen; use email and chat quick-create entries.
- **Expected:** contextual defaults and linked record are visible and correct; activity is offered only with its
  required context; successful creation appears once in its destination and personal lists.
- **Recovery:** blank/invalid input, denied target, dirty cancellation, failed save, changing record before reopening.
- **Screens/modes:** shell menu, Commons/QuickCreate, resulting details/Notes, Comms/Inbox/Compose and Panel/Chat;
  browser, TUI where supported, targeted keyboard/narrow dialog checks.
- **Status/evidence:** pending / —.

### DC-04 — Triage the day and notifications

- **Actor/start:** Staff A and a minimally authorized approver; overdue/today/later work, mentions and disposable approvals.
- **Objective/steps:** Today → complete/snooze → follow event/reminder → notifications → open mention → approve one
  request and refuse another with a reason → full notification center → mark read/filter → topic preferences.
- **Expected:** source records, tray entries, badges and full center agree; decision scope is clear; other users'
  read state is unaffected and approval outcomes persist.
- **Recovery:** empty category, stale/already-decided approval, denied action, failed source and failed state update.
- **Screens/modes:** Commons/Panel/Today, Panel/Notifications, Notifications, Settings/Notifications and one existing
  approval detail mount; browser/TUI, targeted keyboard/zoom.
- **Status/evidence:** pending / —.

### DC-05 — Manage contacts

- **Actor/start:** Staff A/B, private/shared contact books, directory contacts; contact administrator for directory edits.
- **Objective/steps:** create private contact → edit primary email/phone/address → add to book/group → find as recipient
  → inspect related work/messages → export vCard/CSV and print card/contact sheet where offered.
- **Expected:** human-readable contact identity and primary methods agree across detail, picker and outputs; sharing
  grants the intended access; private contacts remain private; directory edits require the proper permission.
- **Recovery:** invalid method, empty book, removed member, denied directory edit and duplicate name selection.
- **Screens/modes:** Commons/Contacts/List/ContactDetail, Settings/ContactBooks, recipient card/picker; browser/TUI,
  targeted split-view phone/keyboard and actual print/download inspection.
- **Status/evidence:** pending / —.

### DC-06 — Import and deduplicate contacts

- **Actor/start:** Staff A with disposable CSV/vCard files containing valid, malformed and duplicate rows; contact admin
  with a duplicate pair carrying linked work, messages and book membership; a large fixture for job progress.
- **Objective/steps:** Source → Mapping → Options → Preview → import → Result/ImportProgress → correct/retry failed
  input → Duplicates → Compare → merge one pair and mark another as not duplicate.
- **Expected:** mapping/policy are understandable, preview predicts results, partial failures identify rows, progress
  and completion agree, and merge preserves intended relationships and the surviving contact's identity.
- **Recovery:** invalid file/mapping, duplicate policy refusal, cancellation/back, stopped job, retry and stale pair.
- **Screens/modes:** all Contacts import steps, ImportProgress, Duplicates/Compare and ContactDetail; browser/TUI,
  targeted keyboard/zoom wizard, inspect exported error/result data if offered.
- **Status/evidence:** pending / —.

### DC-07 — Complete assigned work

- **Actor/start:** Staff A/B with assigned and watched tasks/requests, permitted transitions and linked records.
- **Objective/steps:** filter task list → board/calendar view → shared task detail → assign/update/comment/attach →
  complete → Today; Requests → shared detail → respond/transition → return to filtered list.
- **Expected:** assignment, status, attachments and related work persist; list variants and Today agree; primary actions
  reflect state; context and filters survive detail navigation.
- **Recovery:** invalid transition, removed assignee, no matching work, denied record, failed move/save and stale detail.
- **Screens/modes:** Commons/Tasks/List/TaskDetail, Requests/List/RequestDetail, shared panels, Today; browser/TUI,
  targeted keyboard board/calendar alternatives and narrow detail.
- **Status/evidence:** pending / —.

### DC-08 — Arrange a meeting

- **Actor/start:** Staff A organizer/B invitee, shared calendars, bookable room/equipment, conflicting booking and two zones.
- **Objective/steps:** create event → attendees/free-busy → resource booking → invitation → second-user RSVP → change
  time/recurrence → reschedule/cancel → inspect invitation/export and calendar results.
- **Expected:** time, zone, recurrence scope, RSVP and room/equipment state are clear and consistent; calendar and Today
  reflect the persisted change; captured invitation content matches the meeting.
- **Recovery:** conflict, invalid range, DST boundary, declined attendee, denied calendar, canceled/rejected drag.
- **Screens/modes:** Commons/Calendar, EventDetail, Schedules/ResourceDetail, Settings/Calendars and invitation reader;
  browser/TUI, targeted keyboard/narrow, inspect `.ics` output.
- **Status/evidence:** pending / —.

### DC-09 — Manage calendars and device access

- **Actor/start:** Staff A/B with owner/member calendars and contact books, anonymous recipient, disposable device entry.
- **Objective/steps:** configure/share calendar and book → inspect CalDAV/CardDAV/drive addresses → publish calendar →
  anonymous view → create app password → inspect one-time display → revoke → revisit publication after revocation.
- **Expected:** ownership, visibility, timezone and address scope are clear; secrets are displayed only as designed;
  revoked credentials/publication cannot retain access. Inspect a local sync client only when a fixture is available.
- **Recovery:** wrong role, invalid/expired publication token, failed credential creation, unsupported device setup.
- **Screens/modes:** Commons/Settings/Calendars/ContactBooks/Sync, Files/DriveSettings, PublishedCalendar; browser/TUI
  and public shell, targeted keyboard; external-device success is separate evidence.
- **Status/evidence:** pending / —.

### DC-10 — Collaborate on files

- **Actor/start:** Staff A owner/B collaborator, DB and scratch versioned drives, allowed/denied Records drive folders.
- **Objective/steps:** upload → browse/search/preview → rename/move → share → second-user edit/upload revision →
  compare/restore → trash/recover → revoke share; inspect the same attachment through its business record.
- **Expected:** selected path, revision, ownership and access are visible; actions persist in the intended drive;
  history and related-record attachments remain consistent; revocation removes access.
- **Recovery:** failed/partial upload, filename conflict, unavailable preview, denied path, deleted selection and canceled move.
- **Screens/modes:** Commons/Files, Drives/DriveSettings/Shares, Shared/RecordFiles and pickers; browser/TUI,
  targeted narrow selected-file pane/keyboard; inspect downloaded content.
- **Status/evidence:** pending / —.

### DC-11 — Use a public file link

- **Actor/start:** Staff A and anonymous recipient, disposable file/folder, read/download and upload-capable link fixtures.
- **Objective/steps:** create restricted public link → anonymous open → password if configured → permitted download/upload
  → owner verifies result → expire/revoke → revisit link and direct operation.
- **Expected:** link purpose and allowed operations are clear; output/upload is correct; unrelated resources are absent;
  revocation and expiry prevent subsequent access with understandable feedback.
- **Recovery:** wrong password, malformed/expired token, missing file, upload failure and attempts beyond granted scope.
- **Screens/modes:** Files sharing/Shares, `/s/<token>`; browser/public shell, targeted phone/keyboard, inspect the public
  TUI representation without equating a fallback message with full functionality.
- **Status/evidence:** pending / —.

### DC-12 — Author and publish knowledge

- **Actor/start:** Staff A/B editors, separate reviewer/reader, disposable DB and scratch Git-backed wiki spaces.
- **Objective/steps:** create space/page → two-user co-edit → save version/note → history/compare → restore → request
  review → reviewer decision → publish → inspect reader view → duplicate/move page and child pages.
- **Expected:** draft, saved, historical and published content are distinguishable; co-edit and explicit version saves
  retain edits; approval/publish scope is clear; reader visibility and duplicated content match selected options.
- **Recovery:** disconnect, failed save, concurrent change, denied publish, stale review, canceled restore, editor unavailable.
- **Screens/modes:** Commons/Knowledge, Spaces/SpaceDetail/Review and editor/tree dialogs; browser/TUI, targeted
  keyboard/zoom/narrow; inspect saved resource/history, not merely a success toast.
- **Status/evidence:** pending / —.

### DC-13 — Capture and recover personal notes

- **Actor/start:** Staff A with no notes space initially, Staff B as privacy countercheck, disposable note content.
- **Objective/steps:** quick note → Notes → edit → search/switch note → reopen → inspect history/recovery controls;
  compare automatic persistence with explicit Save/Done behavior.
- **Expected:** note creation initializes only the intended personal space; saved/dirty status is accurate and content
  survives supported navigation/recovery; another user cannot discover the private note.
- **Recovery:** failed save, disconnect, navigation during save, dirty close, missing note and editor-library fallback.
- **Screens/modes:** Commons/QuickCreate, Notes/NotesTui and palette/search; browser/TUI, targeted keyboard/narrow.
- **Status/evidence:** pending / —.

### DC-14 — Configure mail

- **Actor/start:** Staff A with local hosted and remote mail fixtures, captured outbound mail and configured auth failures.
- **Objective/steps:** add-account wizard → connect/options/test/finish → sync progress/account status → identity/signature
  → rules/text blocks/out-of-office → re-sign-in → remove/restore where offered.
- **Expected:** hosted delivery and remote sync are distinguished; account identity follows every link; tests and sync
  status describe real results; settings round-trip and account removal states are clear.
- **Recovery:** connection/authentication refusal, interrupted wizard, invalid settings, failed sync/test, missing OAuth
  provider and canceled removal. Use local credentials only; successful external OAuth remains conditional.
- **Screens/modes:** Comms/Settings mail-account descendants, Identities/Rules/OutOfOffice/TextBlocks; browser/TUI,
  targeted keyboard/narrow/zoom on wizard and settings.
- **Status/evidence:** pending / —.

### DC-15 — Receive, answer and file mail

- **Actor/start:** Staff A, local mail account, safe/hostile HTML and plain-text messages, permitted contacts/files/record.
- **Objective/steps:** Inbox → thread → expand history/recipients → remote-image choice → reply/forward with identity,
  recipients and Files attachment → draft/reopen → captured send → sent/outbox status → file on record → follow-up work.
- **Expected:** message body/metadata are readable and safe; selected recipients/attachments and record association
  persist; pending versus sent is truthful; captured delivery and resulting record links agree.
- **Recovery:** draft-save/send failure, retry without duplicate delivery, missing attachment, invalid recipient,
  remote-image failure, selection change during load and canceled record picker.
- **Screens/modes:** Comms/Home, Inbox/Mail/Compose/MessageDetail, Files pickers and record panels; browser/TUI,
  targeted keyboard/phone/zoom; inspect captured message and attachment bytes.
- **Status/evidence:** pending / —.

### DC-16 — Handle internal and shared mailboxes

- **Actor/start:** Staff A/B mailbox members, nonmember countercheck, internal message with multiple participants.
- **Objective/steps:** second-user message → Internal inbox/mailbox → label/triage/assignment where offered → mark read
  → reply → file on record → compare each member's view and header counts → remove membership.
- **Expected:** personal read state and shared mailbox state are distinguishable; replies reach intended participants;
  record filing is authorized; counts avoid duplicate recipient-role inflation; removed members lose access.
- **Recovery:** missing mailbox, denied member, concurrent state change, failed reply and inaccessible filed record.
- **Screens/modes:** Comms/Home, Inbox/Mail/Compose/MessageDetail plus BOSS providers and badges; browser/TUI,
  targeted keyboard and compact mailbox navigation.
- **Status/evidence:** pending / —.

### DC-17 — Collaborate in chat

- **Actor/start:** Staff A/B in permitted direct, group and record rooms; restricted room and encryption/device fixtures.
- **Objective/steps:** tray → room/direct message → mention/thread/attachment/reaction/poll → forward → create linked
  task/request/event → full Chat → Files/Threads panes → disconnect/reconnect → inspect device/encryption recovery.
- **Expected:** tray/full-screen continuity, unread/mention counts and membership agree; pending/sent/failed status is
  accurate; reconnect posts once; record creation keeps the intended source link and access.
- **Recovery:** offline send, repeated retry, upload failure, removed membership, inaccessible record, unverified or
  missing key/device and unavailable bridge/app. External bridge success needs its own fixture.
- **Screens/modes:** Comms/Panel/Chat, Chat/ChatTui, Settings/Chat/ChatApps/Devices and linked details; browser/TUI,
  targeted keyboard message actions, narrow composer and zoom.
- **Status/evidence:** pending / —.

### DC-18 — Call and follow up

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
- **Status/evidence:** pending / —.

### DC-19 — Collaborate on a business record

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
- **Status/evidence:** pending / —.

### DC-20 — Manage consent and moderation

- **Actor/start:** contact/consent administrator, anonymous subscription recipient, internal forum moderator and
  nonmoderator; disposable subscriptions and review queue items with necessary forum fixtures.
- **Objective/steps:** inspect consent/history → change subscription → anonymous unsubscribe → revisit; separately,
  queue → review item/context → approve/refuse appropriate fixture → verify queue and persisted/public outcome.
- **Expected:** consent scope and history are explicit; unsubscribe is truthful/idempotent; moderation decisions affect
  the selected item and require internal role access even if a public account moderates a public site.
- **Recovery:** invalid/expired token, insufficient role, already-unsubscribed/already-handled item and failed decision.
- **Screens/modes:** Comms/Consent/List/Contact, Moderation/Queue/Review, `/u/<token>`; browser/TUI and public shell,
  targeted keyboard/phone. Full PASS forum review remains out of scope.
- **Status/evidence:** pending / —.

### DC-21 — Manage personal settings

- **Actor/start:** Staff A with recorded original preferences and local email/SMS/TOTP verification fixtures.
- **Objective/steps:** profile/photo → theme/timezone/preferences → topic settings → configured verification method →
  reopen/re-login and inspect resulting shell/account behavior; restore original harmless preferences.
- **Expected:** profile/photo are the selected user's, settings round-trip, scope is personal unless explicitly stated,
  verification and cancellation states are clear, and dates/theme reflect saved choices.
- **Recovery:** invalid field/photo/code, expired verification, failed save, cancel, unavailable configured sender.
- **Screens/modes:** Commons/Settings/Index/Account/Preferences/Notifications and VerifyEmail/VerifySms/VerifyTotp;
  browser/TUI, targeted keyboard/zoom/narrow and theme switching with open dialogs.
- **Status/evidence:** pending / —.

### DC-22 — Verify access and cross-app continuity

- **Actor/start:** Staff A/B, other-org staff, least-privilege specialists, restricted project client, public account
  without BOSS membership and anonymous recipient; positive fixtures paired with refused attempts.
- **Objective/steps:** repeat representative launcher/direct route, palette, quick-create, tray, shared detail/panels,
  recipient/file pickers and public-token paths → follow cross-app links → Back → revoke membership/share → retry.
- **Expected:** BOSS roots require BOSS membership (or explicit administrative grant); permissions and record visibility
  apply to indirect reads/writes; permitted users can finish the paired operation; return navigation keeps context.
- **Recovery:** expired session, inaccessible/deleted link, wrong organization, revoked grant/token and unavailable
  neighboring app. Confirm refusal is due to access, not missing required parameters.
- **Screens/modes:** representative inventory entries from every ownership boundary; browser/TUI/public shell,
  targeted keyboard/phone/zoom. This is an acceptance/manual walk, not a regression route-by-role matrix.
- **Status/evidence:** pending / —.

## 5. Existing checks and future verification

The following is an available-test map, not a passing-results ledger. Paths are relative to each named component;
spec names omit `.spec.js`. Inspect current assertions before extending coverage or choosing a targeted run.

| Component / suite | Existing specs | Relevant activities / limits |
| --- | --- | --- |
| mr-boss regression, `test/Commons/` | TodayPanel, Notifications, QuickCreate | DC-01–04; screen/provider/rule checks do not prove live drawer continuity |
| mr-boss regression, `test/Commons/` | Contacts, ContactImport, ContactsDuplicates, ContactBookSettings | DC-05–06; supplement with complete import/merge and output inspection |
| mr-boss regression, `test/Commons/` | Tasks, Requests, Calendar, EventDetail, Schedules, CalendarSettings, SyncSettings | DC-07–09; external devices, responsive scheduling and two-user RSVP need activity evidence |
| mr-boss regression, `test/Commons/` | Files, FileShares, Knowledge, KnowledgeReview, Notes | DC-10–13; resource/public/co-edit recovery and visual editors need activity evidence |
| mr-boss regression, `test/Commons/` | CommonsSettings | DC-21; account verification also depends on mounted framework screens |
| mr-boss regression, `test/Comms/` | MailAccounts, MailSignIn, MailSettings, Compose, Inbox, InboxMailboxes, CommsHome | DC-14–16; BOSS provider and mount behavior, not successful external mail proof |
| mr-boss regression, `test/Comms/` | Chat, ChatPanel, ChatSettings, CallTarget | DC-17–19; record hooks/access, not complete local media or encrypted recovery |
| mr-boss regression, `test/Comms/` | Consent, CommsModeration | DC-20, DC-22; anonymous and role-boundary walks remain separate |
| mr-boss acceptance | AppStructure, ServerStatic, TuiRender | Supporting structure/render coverage; no new duplicate sweep and no usability claim |
| basic-comms regression | BasicComms, BasicCommsInbox, BasicCommsComposeRef, BasicCommsFiles, BasicCommsSync, BasicCommsTexts, BasicCommsChat, BasicCommsChatChanges, BasicCommsBridges, BasicCommsEncrypted, BasicCommsCalls; client ShellSync and CryptoFlow | Shared Comms behavior; BOSS mount/extension outcomes require separate review evidence |
| basic-comms acceptance, `acceptance/client/` | CallFlow, CallGuestFlow, EncryptedCallFlow, EncryptedChatFlow | Existing local media/guest/encryption journeys; prerequisites and actual mount must be checked |
| webroot regression, `test/client/` | WebrootVue.qvt.shell, WebrootVue.qvt.layout, WebrootVue.qvt.records, WebrootVue.qvt.static, WebrootVue.qvt.views, WebrootAssist, WebrootChat, WebrootTerminal, WebrootPublic.qvt, QvtKeys, Keys | Shared shell/control behavior; fixes belong in existing focused specs where applicable |

No Commons/Comms-specific browser journey files were present under BOSS `test/client/` or `acceptance/client/` at
inventory time. Do not imply a BOSS golden path already exists from the presence of server specs or BasicComms walks.
Resolve coverage gaps when implementing the relevant batch; this documentation change adds no tests.

### Verification rules for later refinements

- Read the repository's [testing skill](../../../../.agents/skills/testing/SKILL.md) before writing/running tests.
  Run the affected regression specs with the existing binary unless a rebuild is required, for example
  `./moq test mr-boss --spec QuickCreate --nobuild`. Commands run from the mr-moqui root.
- Before application implementation commits run `./moq test-apps`; when framework changes are part of a batch,
  run `./moq test-framework` for that work as well. Do not run framework tests or `cargo test` merely for BOSS changes.
  Do not run `test-all` or `accept-all` by default.
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
mode gaps, so a successful desktop happy path cannot close untested TUI or refusal behavior.

| Activity | Status | Outcome / recovery / mode gaps | Evidence / findings |
| --- | --- | --- | --- |
| DC-01 | pending | Not executed; all planned variants remain | — |
| DC-02 | pending | Not executed; all planned variants remain | — |
| DC-03 | pending | Not executed; all planned variants remain | — |
| DC-04 | pending | Not executed; all planned variants remain | — |
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

No observed findings are recorded yet. Allocate **DC-UI-001** onward when evidence exists. Label static suspicions and
design judgments separately from observed defects. Use P1 for blocked work, data/privacy risk or essential unreadability;
P2 for substantial friction/misleading behavior; P3 for localized refinement. A confirmed security/data defect takes
priority over visual polish and is routed to the owning layer.

| ID / kind / severity | Activity and step | Route, actor, theme / viewport / input | Reproduction and impact | Evidence | Owner | Correction / decision | Retest / remaining gap |
| --- | --- | --- | --- | --- | --- | --- | --- |

### Bounded batch record

No execution batches yet. For each batch record:

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
