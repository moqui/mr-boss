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

**Execution:** Waves 1–3 (DC-01–10) are complete with the recorded gaps. The continuation authorizes Waves 4–8
(DC-11–22), up to three delegated workers, correction, independent retest and local commits after each verified batch. The initial inventory was established from source, not browser activity;
the coverage ledger and batch record below distinguish current observations from untested leads.

### Inputs and reference patterns

- [Framework UI refinement](../../../../../plans/archive/UI-Refinement.md): the earlier activity-based review, coverage ledger,
  findings and lessons. Its historical environments, delegation arrangements and execution permissions do not carry
  over to this review.
- [Reusable UI review guide](../../../../../docs/dev/UI-Review.md): environment, activity/evidence method and established
  interaction patterns; [application practices](../../../../../docs/dev/Practices-App-Dev.md) and
  [style guide](style-guide.md): architecture, archetypes, widgets, vocabulary and render modes.
- [Implementation](impl-drawers-commons.md), [design](design-drawers-commons.md),
  [research](research-drawers-commons.md), [crosscut design](design-crosscut.md) and
  [crosscut research](research-crosscut.md): intended behavior, reusable screens and the earlier reference survey.
- [Comms framework plan](../../../../../plans/archive/Comms-Framework.md), current `Commons.xml` / `Comms.xml`, component
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
| Commons | BOSS screens, screen context and app services (`service/ironstone/commons/`: palette, Today, quick-create, contacts, drives, calendar publication, knowledge); business rules and business record services in Mantle; file and public-share token services in the framework (`org.moqui.resource.FileServices`) |
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
mr-moqui repository: **B** = `runtime/components/addon/mr-boss/screen/`; **C** =
`runtime/components/base/basic-comms/screen/`; **W** = `runtime/components/base/webroot/screen/webroot/`;
**T** = `runtime/components/base/tools/screen/System/Security/UserAccount/UserAccountDetail/`.
Every source in the inventory is an existing definition; effective runtime reachability remains to be exercised.

`XML` means framework-rendered widgets; `inline qvt/tui` identifies custom render sections, not a claim of feature
parity. Template references and hidden TUI XML routes are recorded explicitly. A twin is supporting coverage for
the same activity, not an additional app or a second reason to render the screen in regression. Container rows need
navigation/default-child inspection. Surface rows below cover dialogs and panels that have no independent URL.

Rows not updated by execution remain **pending**, with evidence **—**. Updated rows distinguish observed browser,
TUI and Standard branches from deferred or unsupported variants. An exercised/partial row does not certify all
variants listed in its source inventory. DC-22 samples access boundaries across the whole inventory in addition to
the primary activity IDs. This inventory holds screen/mode status; §6 holds the only activity status.

### Commons routes

| Route | Source / owner | Activities | Render variants / role | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| `Commons` | `B Commons.xml` | DC-01 | XML widgets (browser/TUI) | exercised, partial | Browser navigation/default Home and embedded TUI host inspected; full Standard/mode matrix deferred. Batch 1 Home and TUI snapshots. |
| `Commons/Calendar/EventDetail` | `B Commons/Calendar/EventDetail.xml` | DC-09 | XML + custom sections; inline qvt; inline tui | exercised, partial | Browser form, recurrence, RSVP Yes→Maybe, reschedule/cancel, booking, phone and actual ICS export exercised.012 following-series route rebased and consecutive all-series save observed; later-occurrence recovery passed for target100044 and Agenda Nov16/17; focused EventDetail 13/13 passed. TUI/Standard full action matrix deferred. Batch 5 event/recurrence/RSVP/ICS evidence. |
| `Commons/Calendar/Schedules/ResourceDetail` | `B Commons/Calendar/Schedules/ResourceDetail.xml` | DC-09 | XML + custom sections; inline qvt; inline tui | exercised, partial | Browser resource/detail context and embedded TUI inspected. Authored TUI list-cell handling 015 is corrected; Contacts destinations and Calendar Settings names were retested on the rebuilt binary. Resource approval path absent/deferred. `batch-5/resource-detail-tui.dom`, pending/resource evidence. |
| `Commons/Calendar/Schedules` | `B Commons/Calendar/Schedules.xml` | DC-09 | XML + custom sections; qvue: `B Commons/Calendar/Schedules.qvue`; inline tui; inline html,qvt | exercised, partial | Browser resource board, booked-slot/free-busy, pending versus Busy privacy and booking recovery inspected; embedded TUI helper inspected. Grid intentionally browser-only. Resource approval UI absent/deferred. Batch 5 room/free-time/pending evidence, `schedules-tui.dom`. |
| `Commons/Calendar/SchedulesTui` | `B Commons/Calendar/SchedulesTui.xml` | DC-09 | Hidden XML TUI helper | exercised, partial | Embedded TUI schedule helper inspected via parent; browser grid and absent approval control are not terminal passes. `batch-5/schedules-tui.dom`. |
| `Commons/Calendar` | `B Commons/Calendar.xml` | DC-09, DC-19 | XML + custom sections; qvue: `B Commons/Calendar.qvue`; inline tui; inline html,qvt | exercised, partial | Browser Week, Month and Agenda actually inspected, light/dark plus phone; Phone Day was inspected with the final quick-event dialog; desktop Day and Work week remain unverified. Quick-event range009 and Agenda summary011 corrected. Two-zone DST and occurrence switching observed. TUI helper inspected; calendar grid is intentionally browser-only. Projects summary, meeting creation 016 and popup geometry 017 were corrected and retested. Batch 5 Calendar/Agenda/DST captures. |
| `Commons/CalendarTui` | `B Commons/CalendarTui.xml` | DC-09 | Hidden XML TUI helper | exercised, partial | Embedded TUI agenda inspected through actual parent; no grid parity claim. `batch-5/calendar-tui.dom/jpg`. Full terminal action matrix deferred. |
| `Commons/Contacts/Compare` | `B Commons/Contacts/Compare.xml` | DC-08 | XML + custom sections; inline qvt; inline tui | exercised, partial | Browser explicit keeper/first-name choice and merge preservation observed. TUI/Standard and stale/collision variants deferred. `batch-4/duplicate-compare-before.dom`, `merge-keeper-book-note-after.dom`, `merge-task-keeper-link-after.dom`. |
| `Commons/Contacts/ContactDetail` | `B Commons/Contacts/ContactDetail.xml` | DC-07, DC-08 | XML + custom sections; inline html-print | exercised, partial | Browser edit/private refusal/recipient/merge/book/note/task links, print HTML and vCard inspected. Contact Tasks reader 010 live retested. TUI browser-only email/detail fallback is unsupported. Batch 4 private/merge/task after DOM/images and output review. |
| `Commons/Contacts/Duplicates` | `B Commons/Contacts/Duplicates.xml` | DC-08 | XML widgets (browser/TUI) | exercised, partial | Browser directory-pair scan/selection, Jo/Joseph Not a duplicate and Patricia merge flow exercised. TUI/Standard and stale-pair matrix deferred. `batch-4/duplicate-compare-before.dom`, merge keeper evidence; coordinator observed directory import/decision. |
| `Commons/Contacts/Import/Mapping` | `B Commons/Contacts/Import/Mapping.xml` | DC-08 | XML widgets (browser/TUI) | exercised, partial | Browser mapping and phone layout exercised. TUI/Standard and broader mapping permutations deferred. `batch-4/import-mapping-phone.dom`. |
| `Commons/Contacts/Import/Options` | `B Commons/Contacts/Import/Options.xml` | DC-08 | XML widgets (browser/TUI) | exercised, partial | Browser wizard options used for actual create imports; duplicate update/skip variants and TUI/Standard remain deferred. Batch 4 import results/coordinator wizard walk. |
| `Commons/Contacts/Import/Preview` | `B Commons/Contacts/Import/Preview.xml` | DC-08 | XML widgets (browser/TUI) | exercised, partial | Browser preview/confirmation in actual CSV/vCard journeys; no stale-preview or TUI/Standard claim. Batch 4 import journeys. |
| `Commons/Contacts/Import/Result` | `B Commons/Contacts/Import/Result.xml` | DC-08 | XML + custom sections; inline qvt; inline tui | exercised, partial | Browser mixed failure 2/2, corrected retry 2/0, background 125/0, vCard 2/0 and revisit; downloaded failure report checked. Phone result inspected. TUI/Standard, update/stale-job cases deferred. Batch 4 result DOMs and output review. |
| `Commons/Contacts/Import/Source` | `B Commons/Contacts/Import/Source.xml` | DC-08 | XML widgets (browser/TUI) | exercised, partial | Browser actual CSV/vCard selection/upload exercised. Prepared but unexecuted malformed/update fixtures remain deferred; TUI/Standard unverified. Batch 4 import result evidence and coordinator wizard walk. |
| `Commons/Contacts/Import` | `B Commons/Contacts/Import.xml` | DC-08 | XML widgets (browser/TUI) | exercised, partial | Browser wizard/default Source reached for CSV and vCard imports; TUI/Standard wizard deferred. Batch 4 actual import outputs. |
| `Commons/Contacts/ImportProgress` | `B Commons/Contacts/ImportProgress.xml` | DC-08 | XML + custom sections; qvue: `B Commons/Contacts/ImportProgress.qvue`; tui: `B Commons/Contacts/ImportProgress.tui.json` | exercised, partial | Browser actual background 125-row progress/completion and revisit; TUI JSON twin and stopped/stale job recovery unverified. `batch-4/import-background-result.dom`, `import-result-revisited.dom`. |
| `Commons/Contacts/List` | `B Commons/Contacts/List.xml` | DC-07 | XML + custom sections; inline html-print; inline qvt; inline tui | exercised, partial | Browser list/filter/private visibility, phone list, contact sheet/export; TUI list inspected. Full keyboard/Standard matrix deferred. `batch-4/contacts-phone-before.jpg`, `contacts-tui.dom/jpg`, independent output review. DC-UI-015 retest passes: native names are visible, row numbers are distinct and two Contacts links reach their own records.  018 pane clipping and action recovery also pass on the final rebuilt TUI. |
| `Commons/Contacts` | `B Commons/Contacts.xml` | DC-07 | XML widgets (browser/TUI) | exercised, partial | Browser default split/list and embedded TUI Contacts navigation inspected. TUI browser-only detail fallback is unsupported, not functional parity. Batch 4 Contacts snapshots. |
| `Commons/Files/DriveSettings` | `B Commons/Files/DriveSettings.xml` | DC-10–12 | XML widgets (browser/TUI) | exercised, partial | Browser scratch Git settings/quota and corrected scalar return route inspected. Standard/TUI settings matrix remains. wave-4/DC-UI-022 and quota evidence. |
| `Commons/Files/Drives` | `B Commons/Files/Drives.xml` | DC-11, DC-12 | XML widgets (browser/TUI) | exercised, partial | Browser corrected Drives return/list inspected; full Files helper also lists drives. Remaining modes/actions partial. wave-4/DC-UI-022-after; wave-8/tui-files-open. |
| `Commons/Files/Shares` | `B Commons/Files/Shares.xml` | DC-11, DC-12 | XML widgets (browser/TUI) | pending | — |
| `Commons/Files` | `B Commons/Files.xml` | DC-11, DC-12 | XML + custom sections; qvue: `B Commons/Files.qvue`; inline tui; inline html,qvt | exercised, partial | Browser DB/Git file lifecycle/share/revoke/compare/restore/upload/public drop, sampled dark preview; TUI folder navigation/read. Remaining modes/recovery partial. Waves 4/8 file/output evidence; DC-UI-019/022. |
| `Commons/FilesTui` | `B Commons/FilesTui.xml` | DC-11, DC-12 | Hidden XML TUI helper | exercised, partial | Actual embedded TUI opens My files/W4 review/Moved, lists filenames/sizes/author and Download actions. Edit/share/upload and byte download not claimed. wave-8/tui-files-open. |
| `Commons/Home` | `B Commons/Home.xml` | DC-01 | XML + custom sections; inline qvt; inline tui | exercised, partial | Browser light/dark, contextual navigation/counter destinations; embedded TUI inspected. `batch-1/home-light.jpg`, `home-dark.jpg`, `home-counters-after.dom.txt`, `tui-commons-dark.jpg`; DC-UI-003 corrected. |
| `Commons/Knowledge/Review` | `B Commons/Knowledge/Review.xml` | DC-13 | XML widgets (browser/TUI) | pending | — |
| `Commons/Knowledge/SpaceDetail` | `B Commons/Knowledge/SpaceDetail.xml` | DC-13 | XML widgets (browser/TUI) | pending | — |
| `Commons/Knowledge/Spaces` | `B Commons/Knowledge/Spaces.xml` | DC-13 | XML widgets (browser/TUI) | exercised, partial | Browser parent/Spaces/reopen/Back inspected after router correction. Remaining actions/modes partial. wave-4/DC-UI-020-child-after. |
| `Commons/Knowledge` | `B Commons/Knowledge.xml` | DC-13 | XML + custom sections; qvue: `B Commons/Knowledge.qvue`; inline tui | exercised, partial | Browser co-edit/history/review/publish and Git wiki persistence; dark current page and TUI read sampled. Dedicated child routes not all separately visited. wave-4 knowledge evidence; wave-8/knowledge-dark-current, tui-knowledge. |
| `Commons/KnowledgeTui` | `B Commons/KnowledgeTui.xml` | DC-13 | Hidden XML TUI helper | exercised, partial | Actual TUI reads W4 shared page/content/change metadata; helper explicitly delegates edit/history/reviews/files to browser. wave-8/tui-knowledge. |
| `Commons/Notes` | `B Commons/Notes.xml` | DC-14 | XML + custom sections; qvue: `B Commons/Notes.qvue`; inline tui | exercised, partial | Browser personal notes/history plus exact pending-save switch/reopen/reload/search; dark sampled. TUI existing note read and new note create. Disconnect/editor fallback and broader modes remain. wave-8/notes-pending-switch-reloaded, notes-search-result, tui-note-created. |
| `Commons/NotesTui` | `B Commons/NotesTui.xml` | DC-14 | Hidden XML TUI helper | exercised, partial | Actual TUI reads 100153 and creates new wiki note 100204 with Saved/new list row. Editing/tags/history/move delegated to browser. wave-8/tui-notes-before, tui-note-created. |
| `Commons/Notifications` | `B Commons/Notifications.xml` | DC-04 | XML + custom sections; inline qvt; inline tui | exercised, partial | Bob full history and Mark all read inspected; mentions and calendar invitation/update/cancel remain in history with unread zero. TUI/Standard and preference variants deferred. `batch-2/bob-full-notifications-read.dom`, `batch-3/bob-mention-notification.dom`. |
| `Commons/Panel/Notifications` | `B Commons/Panel/Notifications.xml` | DC-02, DC-04 | XML + custom sections; inline qvt; inline tui | exercised, partial | Browser row actions, Earlier/read state and phone containment inspected; TUI/Standard and full preference matrix deferred. `batch-2/tray-phone-width-after.dom`, `named-today-actions-after.dom`; DC-UI-006/008. |
| `Commons/Panel/Today` | `B Commons/Panel/Today.xml` | DC-02, DC-04, DC-05 | XML + custom sections; inline qvt; inline tui | exercised, partial | Browser complete/snooze/approve/refuse, persisted outcomes and separate staff isolation; phone corrected. TUI/Standard and stale-source/action branches deferred. Batch 2 Today/approval and named-actions DOMs. |
| `Commons/Panel` | `B Commons/Panel.xml` | DC-02, DC-04 | XML widgets (browser/TUI) | exercised, partial | Browser tray/default panel navigation inspected with combined app drawer/Assist; remaining TUI/Standard navigation deferred. Batch 2 combined drawer captures. |
| `Commons/QuickCreate` | `B Commons/QuickCreate.xml` | DC-03, DC-14 | XML + custom sections; inline qvt; inline tui | exercised, partial | Browser all six kinds saved with contextual links; invalid title/cancel/focus and early Open corrected. Embedded TUI Task saved; Standard Task primary action succeeds. Remaining kind/mode matrix deferred. Batch 1 creation DOMs; DC-UI-001/002/004/005. |
| `Commons/Requests/List` | `B Commons/Requests/List.xml` | DC-05, DC-06 | XML + custom sections; inline qvt; inline tui | exercised, partial | Browser route/list entry exercised while reaching shared request; no exhaustive find, export or TUI/Standard claim. Batch 3 shared request and projects-request-shared-final.dom. |
| `Commons/Requests` | `B Commons/Requests.xml` | DC-05, DC-06 | XML widgets (browser/TUI) | exercised, partial | Browser request list/detail navigation used for shared-record work; full list operations/mode matrix deferred. Batch 3 shared request journey. |
| `Commons/Search` | `B Commons/Search.xml` | DC-01 | XML widgets (browser/TUI) | pending | — |
| `Commons/Settings/Account` | `B Commons/Settings/Account.xml` | DC-21 | XML + custom sections; inline qvt; inline tui | exercised, partial | Browser own profile/photo/zone persistence, TOTP invalid/valid, safe summary dates/no secret, factor removal and original profile/name/photo/US-Eastern restoration inspected. Other modes/expiry remain partial; no Tools/Marble claim. wave-7/8 profile/TOTP/034 evidence. |
| `Commons/Settings/Calendars` | `B Commons/Settings/Calendars.xml` | DC-09, DC-10 | XML + custom sections; inline qvt; inline tui | exercised, partial | Browser internal View sharing/read-only/revoke and Settings controls inspected; TUI settings inspected. No Publish control exists on observed surface; valid publication/token revocation deferred. `batch-5/bob-calendar-view-share.dom`, calendar-only before/after revoke, `calendar-settings-tui.dom`. DC-UI-015 retest passes: five overview names and kind/share context appear, with distinct export numbers. `batch-5/calendar-settings-tui-names-after.dom/.jpg`. |
| `Commons/Settings/ContactBooks` | `B Commons/Settings/ContactBooks.xml` | DC-07, DC-10 | XML widgets (browser/TUI) | exercised, partial | Browser owned shared book 100000, Bob View scope/read and revoke; Bob Settings entry removed while independent directory access remains valid. TUI/Standard matrix deferred. `batch-5/bob-shared-book-view.dom`, `bob-book-settings-after-revoke.dom`. |
| `Commons/Settings/Index` | `B Commons/Settings/Index.xml` | DC-21 | XML + custom sections; inline qvt; inline tui | exercised, partial | Browser/TUI settings navigation inspected; substantive Account/Preferences/Notifications outcomes recorded separately. Full mode/action matrix remains. |
| `Commons/Settings/Notifications` | `B Commons/Settings/Notifications.xml` | DC-04, DC-21 | XML widgets (browser/TUI) | exercised, partial | Browser topic/channel names corrected; Agent Inbox off survives reload then restored, digest hour saved. TUI/Standard actions not claimed. wave-7/DC-UI-032-after, notification-topic-off-reloaded, digest-hour-reloaded. |
| `Commons/Settings/Preferences` | `B Commons/Settings/Preferences.xml` | DC-21 | XML widgets (browser/TUI) | exercised, partial | Browser dark save/reload, TUI preferences/correct initial weekdays and 039 selection preservation inspected. 037 Appearance save/return now passes in Material/qapps, TUI /apps and native Standard /apps; light/comfortable restored. Calendar-wide save/mode matrix and actual phone/wide/zoom remain unverified. wave-7 preferences; wave-8/036/037/039 after evidence. |
| `Commons/Settings/Sync` | `B Commons/Settings/Sync.xml` | DC-10 | XML widgets (browser/TUI) | exercised, partial | Browser authorized one-time credential→reload hidden→revoke No devices, phone inspected; embedded TUI no-devices inspected. Only redacted secret evidence. Actual DAV/external device blocked without client fixture. `batch-5/sync-one-time-redacted.dom`, `sync-reload-no-secret.dom`, `sync-device-revoked.dom`, `sync-device-revoked-phone.jpg`, `sync-tui-no-devices.dom`. |
| `Commons/Settings` | `B Commons/Settings.xml` | DC-21 | XML widgets (browser/TUI) | exercised, partial | Browser/TUI settings container/navigation actually used; child outcomes and gaps recorded individually. |
| `Commons/Tasks/List` | `B Commons/Tasks/List.xml` | DC-05, DC-06 | XML + custom sections; inline qvt; inline tui | exercised, partial | Browser List/Board/Calendar and persisted find inspected; explicit detail Back014 now retains scope/text and selected Board/Calendar view. Full keyboard/Standard/TUI variants deferred. `batch-3/task-filtered-board.dom`, `task-filtered-calendar.dom`; DC-UI-014. |
| `Commons/Tasks` | `B Commons/Tasks.xml` | DC-05, DC-06 | XML widgets (browser/TUI) | exercised, partial | Browser default List/detail replacement and TUI-created Task destination inspected. Container observation is not every child/mode. Batches 1/3. |
| `Commons/Tasks/TaskDetail` | `B Shared/WorkItemDetail.xml` | DC-05, DC-06 | XML + custom sections; inline qvt; inline tui | exercised, partial | Browser shared task actions/persistence, phone geometry, Chatter/files; TUI-created Task destination. Projects shared-task consumer retested; explicit Tasks arrow now retains filtered Board/Calendar state, with direct-detail fallback intact. Batches 1/3; projects-task-shared-final.dom/jpg; DC-UI-014. |
| `Commons/Requests/RequestDetail` | `B Shared/RequestDetail.xml` | DC-05, DC-06 | XML + custom sections; inline qvt; inline tui | exercised, partial | Browser shared request/link/activity outcomes; Projects request consumer shows matching record, In Progress and Work 1/1 done. Remaining mutation/mode branches deferred. `batch-3/projects-request-progress.dom`, Batch 1 request/activity DOMs. |
| `Commons/Settings/Account/VerifyEmail` | `T VerifyEmail.xml` | DC-21 | XML widgets (browser/TUI) | pending | — |
| `Commons/Settings/Account/VerifySms` | `T VerifySms.xml` | DC-21 | XML widgets (browser/TUI) | pending | — |
| `Commons/Settings/Account/VerifyTotp` | `T VerifyTotp.xml` | DC-21 | XML widgets (browser/TUI) | exercised, partial | Browser embedded invalid-code refusal then valid verification (coordinator observed), followed by disposable factor removal. No secret retained. Email/SMS/expiry and other modes not claimed. wave-7 invalid-redacted; wave-8/totp-factor-removed. |

### Comms routes

All C routes below are mounted through BOSS Comms. BOSS extends Home, Chat, Inbox/Mail, Inbox/Compose,
Inbox/MessageDetail, Calls/Voicemail and Settings/Index in `screen-extend/basic-comms`; review the effective
combined screen and its providers. Rows marked **+ B ext** have that extension at
`runtime/components/addon/mr-boss/screen-extend/basic-comms/screen/` plus the same path; their variants include what the
extension adds. The
BasicComms root is hidden in the BOSS launcher. Consent and Moderation are BOSS's own screens under `B Comms/`.

| Route | Source / owner | Activities | Render variants / role | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| `Comms` | `B Comms.xml` | DC-01 | XML widgets (browser/TUI) | pending | — |
| `Comms/Calls/Call` | `C BasicComms/Calls/Call.xml` | DC-19 | XML + custom sections; qvue: `C BasicComms/Calls/Call.qvue`; tui: `C BasicComms/Calls/Call.tui.json` | exercised, partial | Browser Joe/Bob participant/signaling/controls and mini-window continuity. Main Connecting/black tiles do not prove audio/video; actual media/recording unverified. wave-6/call-*. |
| `Comms/Calls/CallTui` | `C BasicComms/Calls/CallTui.xml` | DC-19 | Hidden XML TUI helper | pending | — |
| `Comms/Calls/Dialer` | `C BasicComms/Calls/Dialer.xml` | DC-19 | XML + custom sections; qvue: `C BasicComms/Calls/Dialer.qvue`; tui: `C BasicComms/Calls/Dialer.tui.json` | pending | — |
| `Comms/Calls/DialerTui` | `C BasicComms/Calls/DialerTui.xml` | DC-19 | Hidden XML TUI helper | pending | — |
| `Comms/Calls/History` | `C BasicComms/Calls/History.xml` | DC-19 | XML widgets (browser/TUI) | exercised, partial | Actual TUI lists prior Bob/guest calls and durations with current media/phone-unavailable notices. No playback/media claim. wave-8/tui-call-history. |
| `Comms/Calls/Queues` | `C BasicComms/Calls/Queues.xml` | DC-19 | XML widgets (browser/TUI) | exercised, partial | Browser local queue Paused/Resume/Log out and waiting/agent counts inspected. Broader handling/queue/mode variants unverified. wave-6/queue-paused. |
| `Comms/Calls/Recordings` | `C BasicComms/Calls/Recordings.xml` | DC-19 | XML + custom sections; qvue: `C BasicComms/Calls/Recordings.qvue`; tui: `C BasicComms/Calls/Recordings.tui.json` | pending | — |
| `Comms/Calls/RecordingsTui` | `C BasicComms/Calls/RecordingsTui.xml` | DC-19 | Hidden XML TUI helper | pending | — |
| `Comms/Calls/Voicemail` | `C BasicComms/Calls/Voicemail.xml` + B ext | DC-19 | XML + custom sections; qvue: `C BasicComms/Calls/Voicemail.qvue`; tui: `C BasicComms/Calls/Voicemail.tui.json` | pending | — |
| `Comms/Calls/VoicemailTui` | `C BasicComms/Calls/VoicemailTui.xml` | DC-19 | Hidden XML TUI helper | pending | — |
| `Comms/Calls` | `C BasicComms/Calls.xml` | DC-19 | XML widgets (browser/TUI) | exercised, partial | Browser call container and TUI history navigation inspected; descendants retain individual mode gaps. |
| `Comms/Chat` | `C BasicComms/Chat.xml` + B ext | DC-18 | XML + custom sections; qvue: `C BasicComms/Chat.qvue`; tui: `C BasicComms/Chat.tui.json` | exercised, partial | Full/tray direct thread/reaction/poll, private room mention/task/filed message and membership refusal; TUI send/read. 035 Pacific clock/day after now passes. Offline/encryption/device/bridge and remaining actions partial. wave-6/chat-tray-continuity; wave-8/chat-* and tui-chat-sent. |
| `Comms/ChatTui` | `C BasicComms/ChatTui.xml` | DC-18 | Hidden XML TUI helper | exercised, partial | Actual room 100051 read and one TUI send with Saved/new row. No offline retry/exactly-once/encrypted-media claim. wave-8/tui-chat-sent. |
| `Comms/Home` | `C BasicComms/Home.xml` + B ext | DC-16, DC-17, DC-19 | XML + custom sections; inline qvt; inline tui | pending | — |
| `Comms/Inbox/Compose` | `C BasicComms/Inbox/Compose.xml` + B ext | DC-03, DC-16, DC-17 | XML + custom sections; qvue: `C BasicComms/Inbox/Compose.qvue`; tui: `C BasicComms/Inbox/Compose.tui.json` | exercised, partial | Browser reply/draft/reopen/Files attachment/captured send, missing recipient/Undo/resend and saved user-zone status inspected. TUI compose, transport failure and remaining variants unverified. wave-5/compose/reply/send evidence; DC-UI-023. |
| `Comms/Inbox/ComposeTui` | `C BasicComms/Inbox/ComposeTui.xml` | DC-16, DC-17 | Hidden XML TUI helper | pending | — |
| `Comms/Inbox/Mail` | `C BasicComms/Inbox/Mail.xml` + B ext | DC-16, DC-17 | XML + custom sections; qvue: `C BasicComms/Inbox/Mail.qvue`; tui: `C BasicComms/Inbox/Mail.tui.json`; inline html,qvt | exercised, partial | Browser imported/shared/internal/private mailbox lifecycle, dates/read-only sender and scoped access; dark and TUI list/detail reads. Remaining recovery/modes explicit. wave-5 mail/mailbox; wave-8/mail-dark-user-zone, tui-mail-thread. |
| `Comms/Inbox/MailTui` | `C BasicComms/Inbox/MailTui.xml` | DC-16, DC-17 | Hidden XML TUI helper | exercised, partial | Actual Inbox list→external sent-message detail with sender/recipient/account/quoted text/attachment name. No TUI compose/send/byte-export claim. wave-8/tui-inbox, tui-mail-thread. |
| `Comms/Inbox/MessageDetail` | `C BasicComms/Inbox/MessageDetail.xml` + B ext | DC-16, DC-17 | XML + custom sections; inline qvt; inline tui; inline html,text | exercised, partial | Browser filed Chat message100204 with Task 100055 backlink, plus TUI email reply detail. Standard print/other actions remain. wave-8/chat-filed-message-detail, tui-mail-thread. |
| `Comms/Inbox` | `C BasicComms/Inbox.xml` | DC-16, DC-17 | XML widgets (browser/TUI) | exercised, partial | Browser mail/internal mailbox and TUI Inbox navigation used; child capability/mode gaps remain individual. |
| `Comms/Panel/Chat` | `C BasicComms/Panel/Chat.xml` | DC-02, DC-03, DC-18 | XML + custom sections; qvue: `C BasicComms/Panel/ChatPanel.qvue`; tui: `C BasicComms/Panel/Chat.tui.json` | pending | — |
| `Comms/Panel/Dialer` | `C BasicComms/Panel/Dialer.xml` | DC-02, DC-19 | XML + custom sections; qvue: `C BasicComms/Calls/Dialer.qvue`; tui: `C BasicComms/Panel/Dialer.tui.json` | pending | — |
| `Comms/Panel` | `C BasicComms/Panel.xml` | DC-02, DC-18, DC-19 | XML widgets (browser/TUI) | pending | — |
| `Comms/Settings/CallHandling` | `C BasicComms/Settings/CallHandling.xml` | DC-19 | XML + custom sections; qvue: `C BasicComms/Settings/CallHandling.qvue`; tui: `C BasicComms/Settings/CallHandling.tui.json` | pending | — |
| `Comms/Settings/CallHandlingTui` | `C BasicComms/Settings/CallHandlingTui.xml` | DC-19 | Hidden XML TUI helper | pending | — |
| `Comms/Settings/Calls` | `C BasicComms/Settings/Calls.xml` | DC-19 | XML + custom sections; qvue: `C BasicComms/Settings/Calls.qvue`; tui: `C BasicComms/Settings/Calls.tui.json` | exercised, partial | Browser device controls and pending/Cancel recovery; TUI explicit media/browser capability contract. Actual granted media/meter not verified. wave-6/DC-UI-030-after-*; wave-8/tui-call-device-contract. |
| `Comms/Settings/Chat` | `C BasicComms/Settings/Chat.xml` | DC-18 | XML widgets (browser/TUI) | pending | — |
| `Comms/Settings/ChatApps` | `C BasicComms/Settings/ChatApps.xml` | DC-18 | XML widgets (browser/TUI) | pending | — |
| `Comms/Settings/Devices` | `C BasicComms/Settings/Devices.xml` | DC-18 | XML + custom sections; qvue: `C BasicComms/Settings/Devices.qvue`; tui: `C BasicComms/Settings/Devices.tui.json` | pending | — |
| `Comms/Settings/DevicesTui` | `C BasicComms/Settings/DevicesTui.xml` | DC-18 | Hidden XML TUI helper | pending | — |
| `Comms/Settings/Identities` | `C BasicComms/Settings/Identities.xml` | DC-15, DC-16 | XML widgets (browser/TUI) | exercised, partial | Browser identity/name/signature/Reply-To edit/reopen and captured send round-trip. Other modes/actions partial. wave-5/identity-reopened and structured captures. |
| `Comms/Settings/Index` | `C BasicComms/Settings/Index.xml` + B ext | DC-15, DC-18, DC-19, DC-21 | XML widgets; + B ext: inline qvt; inline tui | exercised, partial | Browser settings cards/navigation inspected, Calls copy corrected. Other card destination visits not inferred. wave-6/DC-UI-029-after. |
| `Comms/Settings/MailAccounts/Account` | `C BasicComms/Settings/MailAccounts/Account.xml` | DC-15 | XML + custom sections; inline qvt; inline tui | exercised, partial | Browser local hosted/remote status/config/test/sync, setup feedback and removal/cancel inspected. OAuth and remaining modes unverified. wave-5/DC-UI-024/025 and loopback/account-removal evidence. |
| `Comms/Settings/MailAccounts/Add/Address` | `C BasicComms/Settings/MailAccounts/Add/Address.xml` | DC-15 | XML widgets (browser/TUI) | exercised, partial | Actual browser local-account wizard: wrong/corrected SMTP/IMAP credentials, six folders, activation and incoming message recovery. External OAuth/interrupted setup and other modes not verified. wave-5/loopback-*. |
| `Comms/Settings/MailAccounts/Add/Connect` | `C BasicComms/Settings/MailAccounts/Add/Connect.xml` | DC-15 | XML + custom sections; inline qvt; inline tui | exercised, partial | Actual browser local-account wizard: wrong/corrected SMTP/IMAP credentials, six folders, activation and incoming message recovery. External OAuth/interrupted setup and other modes not verified. wave-5/loopback-*. |
| `Comms/Settings/MailAccounts/Add/Finish` | `C BasicComms/Settings/MailAccounts/Add/Finish.xml` | DC-15 | XML widgets (browser/TUI) | exercised, partial | Actual browser local-account wizard: wrong/corrected SMTP/IMAP credentials, six folders, activation and incoming message recovery. External OAuth/interrupted setup and other modes not verified. wave-5/loopback-*. |
| `Comms/Settings/MailAccounts/Add/Options` | `C BasicComms/Settings/MailAccounts/Add/Options.xml` | DC-15 | XML widgets (browser/TUI) | exercised, partial | Actual browser local-account wizard: wrong/corrected SMTP/IMAP credentials, six folders, activation and incoming message recovery. External OAuth/interrupted setup and other modes not verified. wave-5/loopback-*. |
| `Comms/Settings/MailAccounts/Add/Test` | `C BasicComms/Settings/MailAccounts/Add/Test.xml` | DC-15 | XML + custom sections; inline qvt; inline tui | exercised, partial | Actual browser local-account wizard: wrong/corrected SMTP/IMAP credentials, six folders, activation and incoming message recovery. External OAuth/interrupted setup and other modes not verified. wave-5/loopback-*. |
| `Comms/Settings/MailAccounts/Add` | `C BasicComms/Settings/MailAccounts/Add.xml` | DC-15 | XML widgets (browser/TUI) | exercised, partial | Actual browser local-account wizard: wrong/corrected SMTP/IMAP credentials, six folders, activation and incoming message recovery. External OAuth/interrupted setup and other modes not verified. wave-5/loopback-*. |
| `Comms/Settings/MailAccounts/List` | `C BasicComms/Settings/MailAccounts/List.xml` | DC-15 | XML + custom sections; inline qvt; inline tui | exercised, partial | Browser account statuses/list/SMTP capability, remote removal with kept mail and refused account scope inspected. Remaining modes partial. wave-5/DC-UI-024-list-after, account-removed-keep-mail. |
| `Comms/Settings/MailAccounts/Removed` | `C BasicComms/Settings/MailAccounts/Removed.xml` | DC-15 | XML + custom sections; qvue: `C BasicComms/Settings/MailAccounts/Removed.qvue`; tui: `C BasicComms/Settings/MailAccounts/Removed.tui.json` | exercised, partial | Actual embedded removed-account list shows remote account and one message kept. No restore control offered; other modes not inspected. wave-5/account-removed-keep-mail. |
| `Comms/Settings/MailAccounts/SignIn` | `C BasicComms/Settings/MailAccounts/SignIn.xml` | DC-15 | XML + custom sections; qvue: `C BasicComms/Settings/MailAccounts/SignIn.qvue`; tui: `C BasicComms/Settings/MailAccounts/SignIn.tui.json` | pending | — |
| `Comms/Settings/MailAccounts/SyncProgress` | `C BasicComms/Settings/MailAccounts/SyncProgress.xml` | DC-15 | XML + custom sections; qvue: `C BasicComms/Settings/MailAccounts/SyncProgress.qvue`; tui: `C BasicComms/Settings/MailAccounts/SyncProgress.tui.json` | pending | — |
| `Comms/Settings/MailAccounts` | `C BasicComms/Settings/MailAccounts.xml` | DC-15 | XML widgets (browser/TUI) | exercised, partial | Browser wizard/list/account container navigated. Unvisited OAuth/other descendants remain pending. |
| `Comms/Settings/OutOfOffice` | `C BasicComms/Settings/OutOfOffice.xml` | DC-15 | XML + custom sections; inline qvt,html,html-print; inline tui | exercised, partial | Browser invalid range, enabled future reply and account switching after fixes; no actual scheduled auto-reply/whole apply-all matrix. wave-5/DC-UI-027/028-after. |
| `Comms/Settings/Phone` | `C BasicComms/Settings/Phone.xml` | DC-19 | XML + custom sections; qvue: `C BasicComms/Settings/Phone.qvue`; tui: `C BasicComms/Settings/Phone.tui.json` | pending | — |
| `Comms/Settings/PhoneDevices` | `C BasicComms/Settings/PhoneDevices.xml` | DC-19 | XML + custom sections; qvue: `C BasicComms/Settings/PhoneDevices.qvue`; tui: `C BasicComms/Settings/PhoneDevices.tui.json` | pending | — |
| `Comms/Settings/PhoneDevicesTui` | `C BasicComms/Settings/PhoneDevicesTui.xml` | DC-19 | Hidden XML TUI helper | pending | — |
| `Comms/Settings/PhoneTui` | `C BasicComms/Settings/PhoneTui.xml` | DC-19 | Hidden XML TUI helper | pending | — |
| `Comms/Settings/Rules` | `C BasicComms/Settings/Rules.xml` | DC-15 | XML + custom sections; qvue: `C BasicComms/Settings/Rules.qvue`; tui: `C BasicComms/Settings/Rules.tui.json` | exercised, partial | Browser rule preview/apply/reopen with actual persisted flag. Other actions/modes partial. wave-5/rule-*. |
| `Comms/Settings/RulesTui` | `C BasicComms/Settings/RulesTui.xml` | DC-15 | Hidden XML TUI helper | pending | — |
| `Comms/Settings/TextBlocks` | `C BasicComms/Settings/TextBlocks.xml` | DC-15, DC-16 | XML widgets (browser/TUI) | exercised, partial | Browser text block save/reopen/insert and captured message body. Other modes/actions partial. wave-5/text-block-reopened, send-undo-restored, structured capture. |
| `Comms/Settings` | `C BasicComms/Settings.xml` | DC-15, DC-18, DC-19, DC-21 | XML widgets (browser/TUI) | exercised, partial | Browser mail/call settings navigation used. Child actions/modes are recorded separately; unvisited cards not inferred. |
| `Comms/Consent/Contact` | `B Comms/Consent/Contact.xml` | DC-20 | XML widgets (browser/TUI) | exercised, partial | Browser Alex scoped unsubscribe/withdrawal/restoration/history; narrow-admin TUI all five status columns corrected/live retested. Standard fallback source/focused only, not manual full Standard walk. wave-7/consent-*; wave-8/DC-UI-038-after. |
| `Comms/Consent/List` | `B Comms/Consent/List.xml` | DC-20 | XML + custom sections; inline qvt; inline tui | exercised, partial | Browser consent registry/record entry and ordinary-Joe TUI admin refusal. Full TUI registry/actions not claimed. wave-7/consent-*; wave-8/tui-consent-joe-refused. |
| `Comms/Consent` | `B Comms/Consent.xml` | DC-20 | XML widgets (browser/TUI) | exercised, partial | Browser/TUI consent container navigation and role boundaries inspected; child outcomes partial. |
| `Comms/Moderation/Queue` | `B Comms/Moderation/Queue.xml` | DC-20 | XML widgets (browser/TUI) | exercised, partial | Browser selected site/category decisions and Waiting0, public-role/internal entry refusal. TUI/Standard queue not manually inspected. wave-7/moderation-*. |
| `Comms/Moderation/Review` | `B Comms/Moderation/Review.xml` | DC-20 | XML + custom sections; inline qvt; inline tui | exercised, partial | Browser approve/refuse/note/repeat refusal and formatted note date; other-org scoped refusal. TUI/Standard not manually inspected. wave-7/DC-UI-031-note-after, moderation-repeat/other-org-refused. |
| `Comms/Moderation` | `B Comms/Moderation.xml` | DC-20 | XML widgets (browser/TUI) | exercised, partial | Browser internal container/navigation inspected; public-only role denied entry. Remaining modes partial. |

### Shared and public routes

| Route | Source / owner | Activities | Render variants / role | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| `Commons/Chatter` | `B Shared/Chatter.xml` | DC-06 | XML + custom sections; qvue: `B Shared/Chatter.qvue`; inline tui; inline html,qvt | exercised, partial | Browser mounted shared task/request; follow, actual mention/notification/read/reply, activity feedback and cross-org visibility pair. Full TUI/Standard and author/server mutations deferred. Batch 3 Chatter/access-pair evidence; Projects consumer. |
| `Commons/Chatter/ChatterTui` | `B Shared/ChatterTui.xml` | DC-06 | Hidden XML TUI helper, loaded by Chatter | pending | — |
| `Commons/RecordFiles` | `B Shared/RecordFiles.xml` | DC-06, DC-11 | XML + custom sections; qvue: `B Shared/RecordFiles.qvue`; inline tui; inline html,qvt | exercised, partial | Browser actual 76-byte local upload and authorized-positive/other-org visibility pair. Bob downloaded the uploaded file: 76-byte equality verified in batch-3/download-byte-check.json. Upload failure recovery and TUI/Standard deferred. `batch-3/upload-saved.dom`, `files-positive-data.dom`, `cross-org-files-refused.dom`. |
| `Commons/RecordFiles/RecordFilesTui` | `B Shared/RecordFilesTui.xml` | DC-06, DC-11 | Hidden XML TUI helper, loaded by RecordFiles | pending | — |
| `Comms/Chatter` | `B Shared/Chatter.xml` | DC-06 | XML + custom sections; qvue: `B Shared/Chatter.qvue`; inline tui; inline html,qvt | pending | — |
| `Comms/Chatter/ChatterTui` | `B Shared/ChatterTui.xml` | DC-06 | Hidden XML TUI helper, loaded by Chatter | pending | — |
| `Comms/RecordFiles` | `B Shared/RecordFiles.xml` | DC-06, DC-11 | XML + custom sections; qvue: `B Shared/RecordFiles.qvue`; inline tui; inline html,qvt | pending | — |
| `Comms/RecordFiles/RecordFilesTui` | `B Shared/RecordFilesTui.xml` | DC-06, DC-11 | Hidden XML TUI helper, loaded by RecordFiles | pending | — |
| `/s/<token>` | `B PublicShare.xml` | DC-12 | XML + custom sections; qvue: `B PublicShare.qvue`; tui: `B PublicShare.tui.json`; inline html,qvt | exercised, partial | Browser password refusal/corrected open, scoped listing, exact download/upload-only drop and revoked-link refusal. Expiry/out-of-scope direct operations and public TUI remain gaps. wave-4 public/byte evidence. |
| `/u/<token>` | `B Unsubscribe.xml` | DC-20 | XML + custom sections; qvue: `B Unsubscribe.qvue`; tui: `B Unsubscribe.tui.json`; inline html,qvt | exercised, partial | Expired anonymous browser route inspected; scoped News preference change is corroborated by staff consent/history/restoration. Full retained active public layout/idempotence/verification/remaining modes not claimed. wave-7/unsubscribe-expired, consent-*. |
| `/cal/<token>` | `B PublishedCalendar.xml` | DC-10 | XML + custom sections; qvue: `B PublishedCalendar.qvue`; tui: `B PublishedCalendar.tui.json`; inline html,qvt | exercised negative only; valid flow deferred | Invalid token displays Not available. Valid published calendar and token revocation unexercised: observed Calendar Settings has no Publish control. No positive publication or TUI/Standard claim. `batch-5/public-invalid-token.dom`. |
| `/call/<token>` | `C CallGuest.xml` | DC-19 | XML + custom sections; qvue: `C CallGuest.qvue`; inline tui | exercised, partial | Actual anonymous lobby→Let in→admitted controls, End for all and revoked Link not available. Media/recording and remaining guest recovery not established. wave-6/guest-admitted/revoked. |

Shared XML TUI helpers support the same DC-06/DC-11 activities. Each parent mounts its helper as a hidden child;
inspect both the helper controls and the parent inline TUI loader through the actual host app.

### Embedded surfaces and dialogs

| Route / surface | Source / owner | Activities | Variants and inspection | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| All BOSS apps: launcher | W `apps/AppList.xml` / framework shell; BOSS app registrations, suite groups in `runtime/components/addon/mr-boss/screen-extend/webroot/screen/webroot/apps/AppList.xml` and templates `runtime/components/addon/mr-boss/template/AppList.{html,qvt,tui}.fancy` | DC-01, DC-22 | BOSS html, qvt and tui templates; authorized destinations, group order and the trailing More group, active app, empty permissions | exercised, partial | Browser light/dark suite grouping/Commons destination; embedded TUI entry inspected. Full role/empty-permission/Standard variants deferred. `batch-1/launcher-initial-dark.dom.txt`, `launcher-light.jpg`, TUI navigation evidence. |
| All BOSS apps: app navigation and breadcrumbs | W / framework shell | DC-01, DC-02 | Browser/TUI, sibling menus, keyboard and Back | exercised, partial | Browser Commons/Projects records, explicit Back and embedded TUI CtrlK navigation inspected.014 filtered Tasks-arrow Board/Calendar return and direct fallback retested. Full keyboard/mode matrix deferred. Batches 1/3; projects-task-shared-final.dom/jpg; DC-UI-014. |
| Saved finds and list controls | Shared framework widgets; consuming lists | DC-01, DC-05 | Find Options, sort, save/update/default/reset, columns, pagination, export | exercised, partial | Existing Projects Open bugs saved find and Back observed; Commons Task List/Board/Calendar find exercised. Saved-find create/update/default/reset, columns/export/pagination matrix deferred; Commons Task screen has no saved-find control. `batch-1/saved-find-open-bugs.dom.txt`, `saved-find-back.dom.txt`; Batch 3 filtered view evidence. |
| Palette | W / shell; Commons and Comms providers | DC-01, DC-22 | Recent, Screens, Actions, Saved finds, Records/ID, People, Pages/files, Events, Messages/rooms | exercised, partial | Browser @Bob exact person, known raw-ID destination, missing-ID no ghost record and return; TUI CtrlK→Commons Home. Other source groups, recent order/failure and full mode matrix deferred. `batch-1/palette-people.dom.txt`, `palette-id.dom.txt`, `palette-missing-id.dom.txt`, `tui-go-to.dom.txt`. |
| Quick-create menu | W / shell; BOSS root providers | DC-03 | Contextual kinds, record-required activity, cancellation and focus return | exercised, partial | Browser six kinds/context/cancel/focus; TUI context-free Activity removed, Task AltEnter persisted. Standard Task primary works. Contextual TUI Activity unsupported; other terminal kinds deferred. Batch 1 quick-create/TUI after evidence. |
| Header badges | W / shell; BOSS theme/count providers | DC-04, DC-17–19 | Mail versus internal messages, unread/mentions, Today, notifications, missed calls | exercised, partial | Today counts/task outcomes and Bob mention/read notifications observed; mail/message counts visible only. Full unread/mail/missed-call semantics belong later waves. Batches 1/2/3 counter/notification evidence. |
| Account/presence menu | W / shell; BOSS account destinations | DC-01, DC-21 | Profile, status/presence, theme, preferences, re-login/logout, keyboard | exercised, partial | Theme switches and review identity sign-in/logout used; full profile/presence/preferences/account verification deferred to DC-21. Batch 1 light/dark and later actor captures. |
| Tray frame and tabs | W / shell with B/C panel content | DC-02–04, DC-18, DC-19 | Today, Chat, Notifications, Dialer; cross-navigation, resize, overlay, focus | exercised, partial | Browser Today/Notifications with app drawer and Assist, phone containment and named actions; Chat only entry/cancel in DC-03. Dialer/live-call and full resize/focus/TUI variants deferred. Batch 2 combined/phone evidence; Batch1 chat-entry. |
| Assist drawer | W `assist.xml`, `js/WebrootAssist.js`, canvas/sandbox clients / framework | DC-02, DC-22 | Available chat/history/context/rules/canvas controls, run state, cancellation/approval, provider unavailable; record unsupported TUI behavior | exercised failure path; provider blocked | Browser available context/history controls and failed run reopen/Retry inspected, explicit failure reason corrected 007. No usable provider model, so successful run/stop/approval/canvas blocked. TUI behavior not certified. Batch 2 Assist after evidence. |
| Live-call mini-window | W call client `js/WebrootCall.js` / framework | DC-02, DC-19 | Incoming/active state, navigate away, return, end call, narrow combined layout | exercised, partial | Joe/Bob call mini-window beside task and Today actually inspected; media remained unproved and wide/phone override requests failed. wave-6/call-mini-today-1920 (actual image1280px). |
| Contacts: contact methods, books/groups, recipient cards | B Contacts screens; Mantle contact services | DC-07, DC-08, DC-16 | Add/edit/remove, selected labels, privacy, merge comparison, print/export | exercised, partial | Browser selected email/phone/private recipient, merge comparison, books, print/vCard and imported Unicode/freeform phone inspected. Remaining group/address lifecycle and keyboard/modes deferred. Batches 4/5; DC-UI-010. |
| Calendar: quick event, recurrence, invite and booking controls | B Calendar/Schedules QVue and EventDetail | DC-09, DC-10 | Drag and keyboard alternatives, conflict feedback, attendee/room selectors, publication | exercised, partial | Browser range refusal/default recovery, RSVP, two-zone DST, recurrence exception/all/following attempt, room conflict/correction/cancel and free-time controls.012 later-occurrence recovery passed; resource approval/publication UI absent/deferred. Desktop Day/Work week, full keyboard/drag and remaining mode variants are unverified. Batch 5;009/011/012/013/015. |
| Files: browser and details pane | B `Commons/Files.qvue` | DC-11, DC-12 | Upload/progress, preview, rename/move, share/link, versions/compare/restore, trash, narrow selected file | exercised, partial | Joe/Bob edit share, saved versions/compare/restore, revoke refusal retaining the draft, regrant/retry, rename/move/trash/restore and quota/collision upload recovery observed. TUI folder/file read sampled; narrow/zoom and remaining modes/recovery unverified. `wave-4/file-compare.txt`, `revoked-save-retained.txt`, `quota-refused.txt`, `quota-retry-success.txt`, `collision-keep-both.txt`; `wave-8/tui-files-open.txt`. |
| Attach from Files / Save to Files | B and C file-picker transitions; Compose/Mail/Chat/RecordFiles consumers | DC-06, DC-11, DC-16, DC-18 | Authorized drive/folder selection, upload failures, cancel/reopen, correct destination | exercised, partial | Compose Files attachment survives draft/reopen/send; shared-account Bob download matches the 31-byte source. RecordFiles upload/download is separately covered in DC-06. Save to Files and other consumers, picker cancellation/denial/upload-failure recovery remain unverified. `wave-5/reply-draft-before-close.txt`, `sent-reply.txt`, `shared-mail-attachment-byte-check.json`; Batch 3 upload/byte evidence. |
| Knowledge: tree/editor/history/review dialogs | B `Commons/Knowledge.qvue` and child screens | DC-13 | Co-edit, save/version, compare/restore, duplicate/move, review/publish; text fallback | exercised, partial | Database wiki co-edit/review/publication, persisted Git wiki edit/history and actual version-menu/compare-close controls observed; parent/Spaces return retested. TUI reads W4 Knowledge and delegates richer editing/history to browser. Remaining duplicate/move/conflict/fallback and mode branches unverified; this does not establish visits to every dedicated descendant. `wave-4/knowledge-published-reader.txt`, `knowledge-history-names-after.txt`, `scratch-git-knowledge-history.txt`, `DC-UI-020-parent-after.txt`; `wave-8/tui-knowledge.txt`. |
| Notes: editor and note navigation | B `Commons/Notes.qvue` | DC-14 | Private note selection, saved/dirty state, search, recovery, text fallback | exercised, partial | Bob private note/autosave/checkpoint restore and Joe refusal; Joe note 100153 exact pending edit survives switch/reopen/reload and search returns one result. TUI reads it and creates note 100204. Disconnect/concurrent/editor-fallback recovery and remaining modes unverified. `wave-4/notes-persisted-after.txt`, `notes-restored-checkpoint.txt`, `notes-joe-refusal.txt`; `wave-8/notes-pending-switch-reloaded.txt`, `notes-search-result.txt`, `tui-note-created.txt`. |
| Inbox: accounts/folders/Internal mailboxes | C Inbox with B Home/Mail/MessageDetail extensions and providers | DC-16, DC-17 | Thread/list selection, labels, assignment where offered, drafts/outbox, file-on-record/create-from actions; mailbox browse/join/leave, new mailbox and members dialogs | exercised, partial | Hosted/shared mail list/thread, safe HTML, draft/sent message and TUI detail read sampled. Private mailbox two-member post/reply, separate unread, task/Chatter link, membership removal/new-post isolation and other-org refusals observed. Ordinary shared-account grant/revoke, join recovery, external filing/follow-up and remaining labels/triage/count/mode branches unverified. `wave-5/imported-html.txt`, `mailbox-bob-unread.txt`, `mailbox-joe-reply-unread.txt`, `mailbox-task-chatter.txt`, `mailbox-bob-after-new-owner-post.txt`, `mailbox-other-org-refused.txt`; `wave-8/tui-mail-thread.txt`. |
| Compose: recipients, attachments, send/draft controls | C Compose with B picker/provider additions | DC-03, DC-16 | Identity, recipient lookup/chips, text blocks, pending send, schedule, retry/cancel | exercised, partial | Context recipient, identity/signature/Reply-To/text block, Files attachment and persisted reply/draft/reopen/captured send observed. Missing-recipient refusal and Send→Undo restoration/resend sampled; user-zone Saved status corrected. Capture is structured envelope/body/headers/names, with attachment bytes checked separately. Scheduled send, transport failure/retry, missing attachment, disconnected success and TUI compose unverified. `wave-5/reply-draft-before-close.txt`, `sent-reply.txt`, `recipient-refused.txt`, `send-undo-restored.txt`, `shared-mail-attachment-byte-check.json`; DC-UI-023. |
| Chat: room and message actions | C Chat and tray with B record providers | DC-06, DC-18 | Threads, Files, members, mentions, reactions, polls, forward, encryption/devices, record/create actions | exercised, partial | Full/tray direct thread/reaction/poll; private selected mention and source-linked task/filed message, membership refusal and TUI send. Offline/encryption/forward/files and broader modes remain partial. wave-6/8 chat evidence. |
| Calls: lobby, incoming/active call and meeting join | C Calls and W call client; B calendar/contact providers | DC-19 | Local media, dial/search/transfer targets where offered, call-link/guest handoff, permission refusal | exercised, partial | Actual guest lobby/admission/end/revoke and participant signaling inspected. Media/recording/VM and remaining phone/transfer/recovery variants unverified. wave-6 guest/call evidence. |
| Record cards, Chatter and activity dialogs | B shared detail/Chatter screens; Mantle | DC-03, DC-06, DC-22 | Note/reply/edit/delete, mention, follow, activity, record visibility, mounted context | exercised, partial | Browser contextual activity save, follow, selected mention/reply, feedback, cross-org panels, Projects shared consumer. Author edit/delete server persistence, submitted non-author refusal and full TUI/Standard remain deferred. Batches 1/3. |
| Account verification dialogs | B Account and mounted T screens | DC-21 | Email/SMS/TOTP configured fixtures, validation, cancellation and safe recovery | exercised, partial | Embedded TOTP invalid→valid and factor removal exercised; email/SMS/expiry and other cancellation modes remain pending. No secret retained in notes. |

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
| basic-comms acceptance, `test/acceptance/client/` | CallFlow, CallGuestFlow, EncryptedCallFlow, EncryptedChatFlow | Existing local media/guest/encryption journeys; prerequisites and actual mount must be checked |
| webroot regression, `test/client/` | WebrootVue.qvt, WebrootVue.qvt.shell, WebrootVue.qvt.layout, WebrootVue.qvt.records, WebrootVue.qvt.static, WebrootVue.qvt.views, WebrootVue.qvt.markdown, WebrootAssist, WebrootChat, WebrootTerminal, WebrootPublic.qvt, QvtKeys, Keys | Shared shell/control behavior; fixes belong in existing focused specs where applicable |
| webroot regression, `test/` | QvtConfig | The shell restoring a saved dark/light/automatic choice and a forced or locked appearance policy taking precedence (DC-21 theme) |
| webroot acceptance, `test/acceptance/client/` | ThemeLayout | Offline measured theme and geometry checks of shared components (`./moq accept` runs it with `--offline`); the place for a reusable contrast/geometry check found here |

No Commons/Comms-specific browser journey files were present under BOSS `test/client/` or `test/acceptance/client/` at
inventory time. Do not imply a BOSS golden path already exists from the presence of server specs or BasicComms walks.
Adding a golden-path walk for each app is a remaining item in
[impl-drawers-commons.md](impl-drawers-commons.md#9-addendum-nov-8-2026-remaining-items), outside this review.
Resolve coverage gaps when implementing the relevant batch; this documentation change adds no tests.

### Verification rules for later refinements

- Read the repository's [testing skill](../../../../../.agents/skills/testing/SKILL.md) before writing/running tests.
  Run the affected regression specs with the existing binary unless a rebuild is required, for example
  `./moq test mr-boss --spec QuickCreate --nobuild`, and for client specs `./moq test-client mr-boss --serve --spec
  <name>`. Commands run from the mr-moqui root.
- During each batch run localized checks for the affected rules, bugs and activities. Run `./moq test-apps` once
  at the end of the planned review pass; include `./moq test-framework` there when the pass changed framework code.
  The completed Waves 1–3 pass used the end of Wave 3; the current Waves 4–8 pass uses the end of Wave 8. This user-directed cadence also applies to future
  review iterations and supersedes the initial per-batch full-suite cadence; earlier runs remain historical results.
  Do not run framework tests or `cargo test` merely for BOSS changes.
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
| DC-05 | exercised | Partial: shared task/request status and Projects consumers persist; filtered List/Board/Calendar retain find.014 explicit Tasks-arrow return now restores Assigned to me and search in both Board and Calendar; direct detail fallback and Projects shared task retested. Removed-assignee, stale/invalid writes, full keyboard and remaining Standard/TUI variants are deferred to a bounded follow-up. | Batch 3; task/filter/return before-after evidence; DC-UI-014. |
| DC-06 | exercised | Partial: follow, actual selected mention, delivered/read notification, reply, completed activity/feedback and 76-byte upload persist; Bob Download matches uploaded bytes (download-byte-check.json). Positive shared Chatter/RecordFiles responses pair with other-org visibility refusals; Projects supplies a second consumer; final task/request DOMs show the same fixtures, task Complete and request In Progress. Author edit/delete persistence, submitted non-author refusal, attachment failure recovery and full mode variants remain deferred. | Batch 3; mention/reply/upload/access-pair evidence and independent review. |
| DC-07 | exercised | Partial: private contact edit/recipient, Bob direct refusal, print/vCard, shared-book View/revoke and Contacts TUI inspected.010 contact Tasks reader corrected/live retested.015 rebuilt TUI shows names and distinct numbers; 31 opens Ana and 32 opens Bob Acme. The existing focused native regression passes. 018 pane text and hit targets are clipped; rebuilt Ana/Bob actions and Calendar Settings recovery pass. Remaining contact lifecycle and Standard/TUI variants are deferred. | Batches 4/5; private/export/merge/book evidence; DC-UI-010/015. |
| DC-08 | exercised | Partial: CSV mixed failure/corrected retry, background 125/revisit, vCard 2/0 with Unicode/email/freeform-phone/About, Not a duplicate, explicit keeper choice and merge note/book/task-link preservation exercised. Import update/skip, malformed-vCard recovery, stale pair/job/cancellation and full mode variants are deferred; fixture files alone do not close these. | Batch 4; actual import/output/merge evidence; DC-UI-010. |
| DC-09 | exercised | Partial: Week/Month/Agenda, quick event refusal/default recovery, RSVP Yes→Maybe, reschedule/cancel, actual ICS, two-zone DST, recurrence exception/all shift, booking conflict/correction/cancel and free-time controls exercised.009/011/013 retested;012 following rebase/consecutive save and13/13 focused checks pass, later-occurrence UI passed. Projects Calendar New meeting 016 persists with its IRON link; popup 017 fits at 1920 and 1280px, and the 390px phone dialog fits. Rebuilt 015 TUI names and destinations pass. Desktop Day/Work week and remaining keyboard/modes/recurrence variants are deferred; resource approval control is absent. | Batch 5 range/Agenda/RSVP/ICS/DST/recurrence/resource/TUI evidence; DC-UI-009/011/012/013/015. |
| DC-10 | exercised | Partial: Bob calendar View/read-only then calendar-only direct refusal after revoke; shared-book View scope/read then Settings entry removed after revoke. Authorized one-time credential disappears on reload and revocation leaves No devices; evidence redacted. TUI Settings/Sync inspected; rebuilt 015 Calendar Settings shows all five names and distinct export numbers. Invalid public token refused; valid publication/revoke deferred because current Settings has no Publish control. Actual external DAV integration blocked by absent client fixture. | Batch 5 calendar/book/sync/public-negative evidence; external integration and absent-control deferrals explicit. |
| DC-11 | exercised, continuing | Joe personal W4 review folder: create text, Bob Edit share/accept, second-user save, version compare, cancel restore, restore as newest, exact downloaded bytes, revoke stale editor refusal with draft retained, regrant/retry, rename, cancel move, move, Trash and restore. Ordinary upload, whole-batch quota refusal at 1 MB, corrected 3 MB retry, collision cancel/Keep both and scratch Git edit/restore/history also pass. Remaining modes and RecordFiles continuity stay on this pass checklist. | Waves 4–8 / Wave 4 evidence; DC-UI-019 |
| DC-12 | exercised, continuing | Disposable anonymous password link: wrong password, corrected open, scoped listing, actual 40-byte download and refusal after revoke. Upload-only link accepted a collision-safe 31-byte file, showed Sent without other files, owner preview/attribution matched, and revoke refused reload. Expiry and out-of-scope direct operations remain in this pass. | wave-4/public-read.png/.txt; public-revoked.txt; byte-check.json |
| DC-13 | exercised, continuing | Joe-owned W4KB database space with Bob editor and assigned read-only reviewer. Bob live cursor/text reaches Joe; named versions persist, reader compares requested version, requests changes, Joe revises and re-requests, reader approves/publishes version 05. Scratch Git wiki save and real commit history also pass. Duplicate/move/restore and remaining recovery/modes stay open. | wave-4/knowledge-published-reader.png/.txt; DC-UI-020/021 |
| DC-14 | exercised, continuing | Bob first-use/private note/autosave/checkpoint/restore and Joe foreign-note refusal remain verified. Joe note 100153 exact pending-save edit survives switch/reopen/reload; search returns one matching note. TUI reads 100153 and creates wiki note 100204. Disconnect/concurrent failure/editor fallback and remaining modes stay open. | wave-4 note evidence; wave-8/notes-pending-switch-reloaded, notes-search-result, tui-notes-before, tui-note-created; DC-UI-021 |
| DC-15 | exercised, continuing | Hosted delivery versus remote incoming sync, loopback wrong/corrected SMTP/IMAP credentials, six-folder setup and actual one-message sync, identity/signature/Reply-To, reusable text block, rule preview/apply/reopen/persisted flag, invalid OOO range and future OOO activation persistence pass. Misleading sync/setup feedback, disabled account chips and silent OOO-off save corrected. Cancel removal then Remove with Keep mail leaves the remote account Removed with its one message kept; no restore control is offered. External OAuth, interrupted wizard, actual future auto-reply and remaining keyboard/narrow/Standard/TUI variants remain unverified. | wave-5/loopback-*, identity-reopened, text-block-reopened, rule-*, ooo-range-refused; DC-UI-024/025/027/028. |
| DC-16 | exercised, continuing | Imported plain/hostile HTML, blocked remote image, message disclosure, Files attachment, persisted reply/reopen/local captured send and Bob's exact 31-byte download pass. User-zone header/group/Saved status and read-only sender attribution corrected. Missing-recipient refusal and Send→Undo restoration/resend retain identity/To/subject/signature/text-block/Reply-To. Capture is structured envelope/body/headers/names, with byte equality proven separately; external mail filing/follow-up, transport failure/retry, missing attachment and remaining modes stay open. | wave-5/imported-html, reply-draft-before-close, sent-reply, captured-*.json, shared-mail-attachment-byte-check.json, recipient-refused, send-undo-restored; DC-UI-023/026. |
| DC-17 | exercised, continuing | Read-only shared hosted account preserves actual sender and forbids reply. Separate private W5 triage has Joe/Bob two-member post/reply, distinct unread transitions, linked task and matching task Chatter message. After membership removal Bob's mailbox is not found/new mailbox reply unavailable; previously delivered history remains readable with Reply to sender. A new owner-only post is absent for removed Bob; other-org nonmember mailbox and known account/thread routes return not found without content. Join/accept recovery, inaccessible linked record, ordinary shared-account grant/revoke and remaining triage/count/mode variants stay open. | wave-5/mailbox-bob-unread, mailbox-joe-reply-unread, mailbox-linked-task, mailbox-task-chatter, mailbox-bob-removed-history; DC-UI-026. |
| DC-18 | exercised, partial | Full/tray direct text/thread/reaction/poll; private room 100051 selected mention→Task 100055 Chatter Chat→filed Message 100204/backlink; removed Bob loses room and other-org room is not found. One actual TUI send/read persists. 035 live Pacific clocks and Yesterday/Today split now pass. Attachments/forward/disconnected success/encryption/device/bridge and remaining modes stay open. | wave-6/chat-tray-continuity; wave-8/chat-*, tui-chat-sent; DC-UI-035 |
| DC-19 | exercised, partial | Joe/Bob call signaling and participant controls, persistent mini-window beside a task/Today, local queue Paused state, anonymous guest lobby/admission, End for all and revoked-link refusal exercised; other-org active call returns not found. Main call remained Connecting and tiles black: actual media/recording/playback are unverified. Device-test pending/Cancel feedback corrected; successful media and remaining phone/handling/history/mode variants stay open. | wave-6/call-*, guest-admitted/revoked, queue-paused; DC-UI-029/030 |
| DC-20 | exercised, partial | Alex demo scoped News unsubscribe, staff marketing-email withdrawal/evidence and restoration preserve memberships/history; expired anonymous route inspected. PASS selected approve/refuse, public approved-only topic, empty queue, repeat-decision and public-role/other-org refusals verified. Formatted review dates and all five narrow-admin TUI consent statuses retested. Full active anonymous layout/idempotence/export/verification-mail and remaining modes stay gaps. | wave-7 consent/moderation/expired-route evidence; wave-8/DC-UI-038-after; DC-UI-031/038 |
| DC-21 | exercised, partial | Own dark/Pacific/profile/photo persistence and corrected display name, topic off/reload/restore, digest-hour setting and TOTP invalid→valid verification were exercised. TOTP factor removed; profile/name/photo/US-Eastern and light/comfortable preferences restored in retained after states; original calendar weekdays preserved. Specific retests 032–039 pass, including Appearance save/return in Material, TUI and native Standard. Email/SMS/expiry and remaining mode/recovery variants unverified; final gates and cleanup audit passed. | wave-7 settings/profile/notification/TOTP; wave-8/profile-restored, totp-factor-removed, preferences-light-restored, tui-appearance-comfortable-restored and finding after evidence; DC-UI-032–039 |
| DC-22 | exercised, partial | Restricted Sheldon client sees Projects only, permitted ACME-1 addressed message and Standard detail; wrong BLUTH-1/Commons root refused. Other-org shared task/request/mail/mailbox/call/room and public-only moderator internal entry refused, paired with permitted operations. Private Chat source→task→Inbox and revoke checks persist; anonymous file/guest links and expired unsubscribe sampled. Broader client/specialist/root/picker/panel/session and full mode matrices remain partial. | prior access-pair evidence; wave-5 other-org mail/mailbox; wave-6 guest/call; wave-7 public-role/expired-unsubscribe; wave-8/client-*, chat-* |

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
| DC-UI-009 / observed / P2 | DC-09: explicit invalid quick-event range | Commons Calendar; Joe, 1280px | Start Nov12 10:00/end09:00 saved event 100033 as 10–11, silently replacing the submitted end. | Batch 5 CUA observation (no saved before-input image), range-inline-refusal-1280-after and blank-end recovery/detail DOM. | BOSS Calendar/QuickCreate services and form | Refuse explicit reversed/equal timed ranges and reversed all-day dates; preserve blank-end default and same-day all-day. | Fresh inline refusal retains fields; cleared end creates persisted Nov13 14–15. Focused range tests passed; latest final gate coordinator-owned. |
| DC-UI-010 / observed / P2 | DC-07/08: contact Tasks after merge | Contact 100233; Contact administrator | Task100035 survives merge and links keeper but Contact Tasks says No tasks: reader ignores generic Party links. | Batch 4 contact-linked-task-missing-before, merge-task-keeper-link-after, contact-linked-task-after DOM/image. | BOSS ContactActivity | Union role/generic WetTask rows, check visibility, dedup, order and bound output 100. | After lists task once; regression covers generic/role union, hidden/non-task exclusion and ordering. Merge preservation itself passed. |
| DC-UI-011 / observed / P2 | DC-09: open Agenda occurrence | Commons Calendar Agenda; Joe | Summary API is visible=true but clicked Agenda item stays loading because reactive proxy/raw identities differ. | Batch 5 agenda-open-loading-before, summary-positive-response and open-summary-after DOM/images. | BOSS Calendar.qvue | Guard callbacks by request generation, open state and stable occurrence key. | Commons populated occurrence summary/switching passes; regression covers current, stale, reopened and closed responses. The Projects Sprint 2 review summary also populates; meeting creation is independently covered by 016. |
| DC-UI-012 / observed / P2 | DC-09: save this and following, then save again | EventDetail recurring event; Joe | New following series persists at actual 16:00 while editor remains on stale 19:00 context; later saves can act from old occurrence coordinates. | Batch 5 recurrence-following-stale-form/new-series/actual-time-before, rebased-after and consecutive-all-18-after DOM; stale route JSON. | BOSS EventServices/EventDetail | Route to returned target, explicitly clear inherited occurrence for a new target, and return normalized changed occurrence for the same series. | Following target 100043 rebased to 17:00 and subsequent all-series save shows 18:00. Focused EventDetail 13/13 passed; Later-occurrence target 100044 now shows Nov 16 17:00 then 18:00 on consecutive save; Agenda Nov 16/17 both 6–7 PM confirms persistence. |
| DC-UI-013 / observed / P3 | DC-09: identify calendar icon controls | Commons Calendar; browser/phone | Mini-month/range navigation, settings/options, rail/search and popup close controls have no useful accessible names. | Batch 5 earlier calendar/Agenda AX; calendar-icon-names-after.dom. | BOSS Calendar.qvue | Add localized aria-labels matching existing action/tooltips; identify calendar-specific options by calendar name. | Fresh AX exposes named mini-month/range/settings/options controls and popup closes in Commons and Projects. No new action or route. |
| DC-UI-014 / observed / P2 | DC-05: explicit Tasks Back | Joe, Assigned to me plus Compare the calendar filter; Board/Calendar | Detail Tasks arrow returns All open with blank search; selected view preference alone survives. | Batch 3 task-back-drops-find-before DOM/image; filtered-board/calendar-after and direct-back-fallback-after. | BOSS Tasks List/SharedWorkItemDetail/TaskServices | Carry existing keep JSON as taskListFind; allowlist task-find fields and return only to fixed sibling List. Retain tabs/common actions; no arbitrary return URL. | Live Board and Calendar return preserve Assigned to me, search and one matching task. Direct detail keeps plain List fallback; Projects shared task remains usable. Existing regression renders/helper extended without extra render; test encoding assertions corrected to framework plus semantics. |
| DC-UI-015 / observed / P1 | DC-07/09/10: terminal explicit list-cell representation | Embedded TUI Contacts/List and Settings/Calendars | Authored tui text/link branches are dropped by list-cell renderer, hiding names. First repair restores nodes but repeated empty native IDs make every Contacts link use [30], so index destinations collide. | Batch 4 Contacts TUI and contacts-tui-duplicate-ids-before DOM/image; Batch 5 calendar-settings-tui; tui-gap-source-classification.txt. | Framework ScreenTui generator | Handle authored tui branches as native cell nodes and normalize empty/duplicate IDs through existing unique-ID machinery. Empty and repeated authored IDs use the existing document-wide unique-ID machinery. | Rebuilt Contacts shows meaningful names and distinct numbers; 31 opens Ana EX_PRJ_ANA, 32 opens Bob Acme ORG_ACME_BA. Calendar Settings shows all five names and distinct export numbers. Independent evidence review and the existing focused native regression pass. Do not conflate unsupported ContactRecord qvt-only fallback or horizontally scrollable Resource facts with this defect. |
| DC-UI-016 / observed / P1 | DC-09: Projects shared Calendar New meeting | Joe, IRON Plan Calendar | Save sends project workEffortId in the POST URL query; the framework write guard refuses the request, blocking meeting creation in this shared consumer. | Batch 5 projects-calendar-create-query-before DOM/image. | BOSS Calendar.qvue request caller | Move the existing project identity into the POST body; preserve project scope and service authorization. GET scoping and existing authorization remain unchanged; focused actual-component regression covers form setup and all mutation callers. | Joe created 100045 at Nov12 14–15 through Projects; Agenda summary and opened Event detail match, with Linked records → Project IRON. Independent source/evidence review passes. |
| DC-UI-017 / observed / P2 | DC-09: open a wide Agenda event summary | Projects IRON and Commons Calendar; Joe, 1920/1280px | Full-row anchor leaves neither side enough space: Quasar narrows the menu to 261px while its 400px child overflows, truncating title/time/actions. | Batch 5 projects-popup-clipped-before DOM/image/bounds; projects-popup-fits-after and commons-popup-1280-after. | BOSS Calendar.qvue | Anchor the popup at a narrow point on the clicked row and bound desktop contents to the actual menu width; preserve phone dialog behavior. | Projects after: width/client/scroll all 400px at x278. Commons 1280px: all 400px at x526. Phone dialog and scroll width are 390px with no body overflow. Independent source/image/bounds review and the existing pure Agenda regression pass. |
| DC-UI-018 / observed / P2 | DC-07: read the terminal contact list beside its detail | Embedded TUI, 40-column Contacts side pane; long rows with numbered links | A selectable list can be wider than its assigned pane. The row painter ignores child width, so text and hit targets extend into the neighboring detail. Numbering is included in truncation and is not the cause. | Batch 4 contacts-tui-unique-links-after.jpg records the pre-018 overflow; contacts-tui-pane-clipped-after DOM/image, pane-ana/bob-after DOMs and independent-tui-pane-review.txt record recovery. | Framework native TUI row painter | Intersect each child's paint boundary with its allocated width and restore the parent boundary before drawing the next sibling. Layout widths and protocol stay unchanged. | Focused native paint/hitbox regression passes. Rebuilt 1920px Contacts rows and underlines stop before the detail pane; Ana and Bob links still select their distinct records. Calendar Settings retains all five names and exports. Independent source/image/recovery review passes; final full gate is recorded with this batch. |


| DC-UI-019 / observed / P3 | DC-11: successful person share | Joe, Files W4 review folder, light desktop / 1280px image | Share succeeds and Bob appears, but the cleared recipient immediately shows Please select an option. | wave-4/DC-UI-019-before/after.png/.txt | BOSS Files.qvue | Clear successful recipient to the select’s valid empty string; retain failed inputs and duplicate-submit guard. | Live after: blank neutral recipient, disabled Share, Bob May edit persists. Independent source/image retest passes; FileShares 5/5 passes. |
| DC-UI-020 / observed / P2 | DC-13: Spaces/settings → page → Spaces | Joe, Knowledge, light desktop / 1280px image | Cached parent return retains the old child below the page and loses its placeholder registration; later Spaces can be blank until reload. | wave-4/knowledge-created-before.png; DC-UI-020-parent-after.png/.txt, DC-UI-020-child-after.txt | Framework webroot router | Reusing the same custom component preserves descendant registration; visit the terminal placeholder so it clears the stale child. Static factory query refresh remains. | Fresh origin parent/child repeat and browser Back pass; independent source/evidence review and 10/10 focused router features pass. Forward is focused-model coverage only. |
| DC-UI-021 / observed / P3 | DC-13/14: identify custom toolbar controls | Joe Knowledge and Bob Notes | Settings/page actions, Knowledge history menus/compare close and Notes header pin/menu expose unnamed buttons despite hidden icon text. | wave-4/knowledge-fresh.txt; DC-UI-020-parent-after.txt; notes-persisted-after.png/.txt | BOSS Knowledge.qvue, Notes.qvue | Add localized action names, including dynamic Pin/Unpin. | Live snapshots expose Spaces and their settings, Page actions, Pin and Note actions. Follow-up History snapshot names each version menu and Close the compare; clicking close removes the diff and retains History. Independent evidence/source review; no behavior change. |
| DC-UI-022 / observed / P3 | DC-11: Drive settings → Drives | Joe, scratch Git drive 100052 | Backlink implicitly inherits the loaded drive object and serializes its fields into the drive query. | wave-4/DC-UI-022-before.txt, DC-UI-022-after.txt | BOSS DriveSettings.xml | Explicitly pass scalar driveId as the inherited drive parameter. | Live href is /Files/Drives?drive=100052, Open in Files unchanged; following it shows Drives listing. Independent source/evidence review and Files 17/17 pass. |
| DC-UI-023 / observed / P2 | DC-16: read/reply/draft dates | Comms Inbox/Mail/Compose, Joe, light desktop | Browser-zone header 6 AM disagrees with Joe-zone server quote 7 AM; list groups and Saved status also used browser calendar/time. | wave-5/DC-UI-023-before/after, groups-after, saved-user-time-after; send-undo-restored | Framework BasicComms Mail.qvue/Compose.qvue and desktop copy | Shared user-zone formatter for displayed dates/Saved; calendar-day grouping handles DST; quote disclosure names its state. | Live header/quote, fresh-origin Today/Yesterday groups and Saved status agree; focused ShellSync 9/9 and generated copy reviewed. Unsampled scheduling date controls remain leads. |
| DC-UI-024 / observed / P2 | DC-15: hosted account status/actions | Comms Settings/MailAccounts, Joe, light desktop | SMTP-only hosted account offers incoming sync/progress despite no incoming mailbox. | wave-5/DC-UI-024-before, list-after, account-after | Framework MailSettingsServices, MailAccounts List/Account | Separate actual incoming storeHost capability from outgoing server; retain SMTP test/send/settings and reject explicit impossible sync before enqueue. | Delivered here and outgoing configuration retained; incoming-only actions gone; remote Support still has Sync. Focused BasicComms 8/8; independent review passes. |
| DC-UI-025 / observed / P3 | DC-15: setup after successful sync | Comms Settings/MailAccounts/Account, Joe, light desktop | setup=done asserts first sync under way after Active/Last sync already show completion. | wave-5/loopback-sync-manual-recovery; DC-UI-025-after | Framework Account.xml | Banner follows current error/paused/local/completed/initial state. | Live Active/Last sync/ready text passes. Seven other focused features passed; corrected exact feature retry 1/1. Initial activation scheduling lead remains separate. |
| DC-UI-026 / observed / P2 | DC-16/17: shared-account sender | Comms Inbox/Mail, Bob, light desktop | Account aliases count as isMe for routing and mislabeled Joe's sent message as Bob/me. | wave-5/DC-UI-026-before/after | Framework Mail.qvue and desktop copy | Present actual email sender name/address/avatar; retain isMe routing, recipient semantics and read-only permission. | Bob sees Joe Developer review/JR and named disclosure, explicit read-only footer, no Reply. ShellSync 9/9 and independent evidence review pass. |
| DC-UI-027 / observed / P2 | DC-15: switch OOO account | Comms Settings/OutOfOffice, Joe, light desktop | Both permitted account chips are disabled because static section-iterate loses per-entry availability metadata. | wave-5/DC-UI-027-before/after | Framework statics preparation and ScreenQvtStatic | Retain per-entry/nested generated extras through existing m-scope, preserving deny-on-missing. | Enabled real links switch to separate remote account; native static 38/38 and mounted client 26/26 pass. Independent source/golden/evidence review passes. |
| DC-UI-028 / observed / P2 | DC-15: enable future OOO reply | Comms Settings/OutOfOffice, Joe, light desktop | Checking Y-only enabled retains hidden N in static model and saves Off despite success. | wave-5/DC-UI-028-before-checked, before-saved-off, after | Framework ScreenQvtStatic | Filter checkbox initial/current keys against actual options, matching merged renderer; no OOO business rule bypass. | Future range/body/audience and checked state persist with Starts date/Turn off. Native/mounted tests cover off/on/mixed/default; independent review passes. Actual scheduled delivery and broader disable/apply-all variants remain separate coverage. |
| DC-UI-029 / observed / P3 | DC-19: discover call settings | Comms Settings Index, Joe, light desktop | Calls card says camera, microphone and ringtone are coming despite working settings controls. | wave-6/settings-calls-card-before.txt, settings-calls-controls.txt, DC-UI-029-after.png/.txt | BOSS Settings Index extension | Describe current browser device/test/ringtone/start options. | Corrected card text and destination controls independently reviewed. This does not establish live media. |
| DC-UI-030 / observed / P2 | DC-19: test microphone and camera | Comms Settings Calls, Joe, light desktop | A pending device permission request gives no visible progress or cancellation, leaving Test apparently idle. | wave-6/settings-calls-controls.txt; DC-UI-030-after-pending.png/.txt, after-cancel.txt | Framework BasicComms Calls.qvue | Show immediate pending status/Cancel and generic failure/retry; invalidate stale requests, release late streams and clear timers/meter/tracks. Preserve shared media API and browser permission behavior. | Live pending/Cancel recovery independently reviewed; actual-method regression 9/9 (0.8 s of 8 s). Permission grant, running meter and real media remain unverified live. |
| DC-UI-031 / observed / P2 | DC-20: read moderation dates | Comms Moderation Queue/Review, internal moderator, light desktop | Waiting/report/staff-note dates display numeric epochs instead of civil dates, obscuring review timing. | wave-7/DC-UI-031-before.png/.txt, note-before.txt, note-after.png/.txt | BOSS moderation presentation services and Queue/Review | Produce viewer-zone date text once for numeric epoch inputs and display that text. No moderation policy change. | Live staff note shows 2026-11-09 00:37; focused retest 3/3 (0.8 s of 264 s), independent source/evidence review. Initial test used an incorrect returned-type expectation, repaired in the fixture before rerun. |
| DC-UI-032 / observed / P2 | DC-21: identify notification topic/channel controls | Commons Settings Notifications, Joe, dark desktop | Whitespace option labels leave matrix checkboxes unnamed despite row/column text. | wave-7/DC-UI-032-before/after.png/.txt | Framework m-check/CSS/precompiled renderer and BOSS Notifications | Supply topic/channel tooltips and conditional visually hidden option labels; retain visible labels and native values. | Live accessible names and compact layout reviewed; existing widget 1/1, precompile 1/1. Off/reload/restore sampled for Agent Inbox; TUI semantics not changed. |
| DC-UI-033 / observed / P2 | DC-21: save person profile name | Commons Settings Account, Joe, dark desktop | Person name saves while user display/header name stays stale. | wave-7/DC-UI-033-before/after.png/.txt | Mantle PartyServices.update#Account | Refresh UserFullName only on persisted name changes, using complete Person; preserve deliberate custom name on settings-only/unchanged saves. | Actual Joe Verified Developer header/photo and profile persist; PartyAccounts 5/5 (0.2 s of 393 s), independent review. Profile name/photo/US-Eastern restored in wave-8/profile-restored.txt; broader verification modes remain partial. |
| DC-UI-034 / observed / P1 | DC-21: ordinary account factor summary | Commons Settings Account, Joe | Raw factor rows expose reusable authenticator material outside explicit setup. Evidence is redacted. | wave-7/DC-UI-034-before-redacted.txt; wave-8/DC-UI-034-after.png/.txt, totp-factor-removed.txt | Framework UserServices.get#UserAuthcFactorInfo and BOSS Account | Return active-factor metadata whitelist; only email/SMS destinations retain factorOption. Use safe account list; explicit setup/code validation remain separate. | RecentAuth 3/3 and CommonsSettings 9/9; independent API/source review. Actual factor row has blank Sent to and civil Added/Valid-until dates; disposable factor then removed. No Tools/Marble or hidden-network-payload audit claim. |
| DC-UI-035 / observed / P2 | DC-18: saved-zone chat clock/day | Comms Chat, Joe with Pacific zone | Timeline clocks/day boundaries still follow browser zone after Account preference changes. | wave-8/DC-UI-035-before/after.png/.txt | Framework BasicComms Chat.qvue and desktop bundle | Shared user-zone formatting and calendar-day ordinals, with absent/invalid-zone browser fallback. | ShellSync 9/9 (4.8 s of 7 s), bundle 1/1 and exact generated diff reviewed; midnight/Berlin/25h/23h cases covered. Actual Pacific room shows Yesterday 11:56 PM and Today 12:04 AM consistently with list/tooltips/system events. |
| DC-UI-036 / observed / P2 | DC-21: TUI working-day initialization | Commons Settings Preferences, Joe, embedded TUI | JSON-list choice strings do not initialize comma-based picker/painter selection, hiding existing weekdays. | wave-8/tui-preferences.txt, DC-UI-036-after.txt | Framework moqui-tui forms | Normalize JSON string arrays only for Check/multiple DropDown initial buffers; preserve scalar checks/radio/single select. | Focused key/paint checks and debug build pass; live buffer1,2,3,4,5 shows checked Mon–Fri. 039 selection editing is separate. |
| DC-UI-037 / observed / P2 | DC-21: TUI appearance save return | Commons Settings Preferences, Joe, embedded TUI | Save returns a browser /qapps path to the TUI; native HTML also receives JSON instead of a normal return. | wave-8/tui-density-saved/reopened.txt; DC-UI-037-fixed-prefix-after.txt; DC-UI-037-standard-after.png/.txt; DC-UI-037-material-after.png/.txt | BOSS Preferences transition | Rendered hidden marker selects only fixed local apps/qapps routes; Material preparation recognizes implicit /actions even though its transition RenderState is html. Native HTML gets 302/message; null-request TUI stays apps. | Final CommonsSettings 9/9 (3.9 s of 264 s) includes the exact Material prepared marker. Actual Material remains /qapps with full controls/light/comfortable; TUI /apps persist/reopen/restore and native Standard /apps Appearance saved pass. Earlier relative-leaf/mode-only candidates are superseded. |
| DC-UI-038 / observed / P2 | DC-20: read TUI consent status | Comms Consent Contact, narrow contact admin, embedded TUI | Contact/Consent/List/whole-party/history status cells are blank despite actual grants/memberships. | wave-8/tui-consent-admin.txt, DC-UI-038-after.txt | BOSS ConsentRecord template | Preserve browser chips; emit plain JSON TUI cells and encoded Standard fallbacks, removing only generated chip/tooltip markup. Services/auth unchanged. | Live all five statuses readable; Consent 12/12 (1.3 s of 264 s), one legitimate TUI variant added to existing feature; independent review. Full Standard walk not claimed. |
| DC-UI-039 / observed / P2 | DC-21: TUI working-day multi-select | Commons Settings Preferences, Joe, embedded TUI | Filtering Sat then Enter replaces Mon–Fri with Saturday. Calendar was not saved; reopening restored originals. | wave-8/tui-working-days-select-drops-others.txt; DC-UI-039-filter-enter-after.txt, DC-UI-039-space-enter-after.txt | Framework moqui-tui picker/painter | Check groups follow multiple-dropdown Space=Toggle/Enter=Done; paint all selections and show hint. Single-check/radio contracts retained. | Final source and focused key/paint checks pass; actual filtered Enter preserves Mon–Fri and Space→Enter adds Saturday without undo/replacement. Calendar was not saved; reopening preserves original weekdays. No broader selection/mode matrix claim. |

### Static leads

Static suspicions from source inspection while planning. These are not findings: reproduce each one in its activity,
then allocate a DC-UI ID or close it here with the reason.

| Lead | Source | Activity | Suspicion |
| --- | --- | --- | --- |
| Comms menu order | `B Comms/Moderation.xml` (`default-menu-index="6"`) and `B Comms.xml` (Settings `menu-index="6"`) | DC-01, DC-20 | Moderation and Settings share an index, so their order in the Comms menu is not decided |
| Stale Calls card | `runtime/components/addon/mr-boss/screen-extend/basic-comms/screen/BasicComms/Settings/Index.xml` | DC-19, DC-21 | BOSS's Calls card on the Comms settings index says camera, microphone and ringtone are "coming with calls", but `Comms/Settings/Calls` provides them |
| No Call handling card | `C BasicComms/Settings/Index.xml` | DC-19 | The settings index has cards for Phone and Desk and soft phones but none for Call handling, which is reached only from the Settings menu |

### Bounded batch record

Waves 1–3 were executed in the five bounded batches below. The first, **DC-01 and DC-03**, established demo-user
browser light/dark at 1920×1080, embedded TUI and targeted keyboard baselines for the shell, palette, quick-create
and fixture setup reused by the later activities.

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
- Five bounded batches: DC-01/03, DC-02/04, DC-05/06, DC-07/08, DC-09/10. Use localized checks during batches and
  full suites at the pass boundary (end of Wave 3 here), as directed by the user. Full application gates use the
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

#### Batch 3 — shared records and filtered return (verified with mode gaps)

- Joe/Bob operated the shared task/request, follow, selected mention, received/read notification, reply, completed
  activity feedback, uploaded 76-byte local file and Complete/Resume. Projects showed matching work/request identity,
  request In Progress and Work 1/1 done at task completion; final shared task/request DOMs show task Complete and request In Progress. This is representative consumer evidence, not a Projects app review.
- Positive populated Chatter/RecordFiles responses pair with other-org visible=false refusals. Preserve the matched
  request URL/actor context with the raw JSON: the refusal snapshot alone does not identify its input/actor.
- List→Board→Calendar retains the find.014 corrected explicit Tasks-arrow return from detail for both Board and
  Calendar; after evidence retains Assigned to me, Compare the calendar and one matching task. Direct fallback and
  Projects shared task were retested. Keep removed-assignee/stale/invalid writes, author persistence/server refusal,
  attachment failures and remaining keyboard/Standard/TUI variants explicitly deferred. Bob Download matches the uploaded 76-byte file (download-byte-check.json).

- Final focused affected specs passed 122/122 features. Before this batch commit, `./moq test-apps --nobuild`
  passed 3410/3410 server features and 19/19 client features within existing budgets (`apps-batch-3-final.log`).
- The full gate exposed a pre-existing Resources fixture mismatch at the UTC/local week boundary. Its scenario now
  uses the actual demo allocation week and reapplies that effective clock after user switches; assertions and budgets
  are unchanged. Focused Resources and the full application gate pass.
- Earlier local batch 2 commits: framework `1d3fb10d`, BOSS `fb8085cb`. This batch commits the filtered task-return
  correction and shared-record execution record; remaining owning-layer batch commits follow their own gates.

#### Batch 4 — contacts, import and merge (verified with mode gaps)

- Private contact edit/Compose recipient, Bob refusal, print HTML and downloaded vCard were inspected. Actual CSV
  mixed import created 2 / failed 2; corrected retry 2/0; background 125/0 completed and reopened result retained identity.
  Valid vCard created 2 / failed 0; imported 100237 retains Unicode/email/freeform phone/About despite parse warning.
- Four directory contacts support Jo/Joseph Not a duplicate and Patricia comparison. Explicit Patricia keeper choice
 100234→100233 preserves note, Joe My Contacts membership and generic task 100035 link.010 fixed the contact task
  reader; fresh DOM/image lists task once. These are actual results, not prepared fixture expectations.
- Terminal Contacts list and Calendar Settings exposed015: authored tui list-cell branches were lost; initial repair
  then exposed duplicate native IDs. Final rebuilt UI shows unique row numbers and correct Ana/Bob destinations, and all five Calendar Settings names. Independent evidence review and the existing focused native regression pass. ContactRecord's qvt-only
  linked email/detail fallback is unsupported; resource value columns require horizontal navigation, not a data-loss claim.
- Import update/skip, malformed-vCard recovery, stale duplicate/job/cancel branches and remaining lifecycle/modes are
  deferred follow-up. A prepared input file is not execution evidence.

- Final artifact inspection exposed separate pane-overflow finding018 after meaningful Contact names were restored. Its native painter correction passes the focused paint/hitbox regression and independent source review. Rebuilt Contacts now stays inside its pane, both numbered Ana/Bob actions still work, and Calendar Settings retains its five named rows; independent after-image/recovery review passes.

- The framework gate exposed a separate pre-existing replica-test accounting race: initial schema replay can
  legitimately increment the cumulative fallback counter. The test now records that startup baseline and still
  requires zero added fallbacks for the healthy fresh read and exactly one with replay paused. Returned records,
  timeouts and budgets are unchanged. Its corrected focused run passes; independent source review confirms the
  routing assertions retain their strength. The final aggregate gate includes this prerequisite and painter018.

- Final framework gate passed every phase with `RUST_TEST_THREADS=2` (`framework-final-verified.log`), including
  the native pane regression. One earlier run timed out in an unrelated Git fixture waiting for an internal update
  to leave recording; the isolated case passed, then the full Git crate and complete final gate passed at bounded
  concurrency. Optional Report-hook errors in that earlier diagnostic were not established as the timeout's cause;
  no Git/report product or fixture code was changed.
- `cargo lint` and `cargo lint-min` pass. The final Calendar geometry/request regression passes 23/23 features.
  Screen lint scanned 1747 files with zero parse failures; 132 existing idiom/hazard sites remain visible in the
  separate `screen-lint-final.log` report. This is not a claim of zero lint warnings.
- Local batch 3 commit is BOSS `eeea177f`. Before this Contacts batch commit, `./moq test-apps --nobuild` passed
  3410/3410 server features and 19/19 client features within unchanged budgets (`apps-batch-4-final.log`).
  Framework owning-layer commit `d4927955` contains the native cell/ID/pane corrections, focused tests, replica-test
  prerequisite and reusable review patterns. This BOSS batch commits the contact task reader and review record.

#### Batch 5 — calendar, resources and access (verified with mode gaps)

- Observed desktop views are Week, Month and Agenda; phone Day and quick dialog were inspected. Desktop Day/Work week are not inferred from buttons. Wide light/dark,
  phone detail, RSVP Yes→Maybe, reschedule/cancel and actual METHOD:PUBLISH ICS were exercised. Independent ICS review
  validates UID, organizer, Bob TENTATIVE, reminder and 10–11 US/Eastern interval; this is not external client import.
- DST recurrence March 13/14/15 appears 10 AM throughout in US/Eastern, versus Berlin 16:00 then 15:00/15:00. Single
  exception/all-series shift were observed.009 inline refusal retains input and blank end recovers to 14–15.011 Agenda
  now opens populated summaries;013 names calendar controls.012 following rebase/consecutive save are evidenced;
  focused EventDetail 13/13 passed, later-occurrence UI passed (target 100044, Nov 16 17:00 then 18:00; Agenda Nov 16/17 both 6–7 PM). Projects Calendar summary and New meeting 016 were retested successfully.
- Maple 10–11 conflict retains input, corrected 11–12 booking saves, cancel preserves first. Free-time excludes booked
  slot and Create prefills interval; cancel is observed. Pending versus Bob Busy privacy is observed; no Approve
  control exists on current Maintenance placeholder, so approval is deferred as absent UI.
- Bob calendar View is read-only; calendar-only 100036 becomes Not available after revoke. Book 100000 View scope/read
  then removal from Bob Settings is observed; independent directory access legitimately remains. Device secret was
  displayed once under user authorization, hidden after reload, then revoked to No devices; evidence is redacted.
  Invalid public calendar token refuses. Valid publication/revoke is deferred because Settings has no Publish control;
  actual external DAV integration is blocked by absent client fixture. Export is not publication.
- Embedded Calendar/Schedules/ResourceDetail/Calendar Settings/Sync were inspected. Grids intentionally remain browser-only.
 015 rebuilt names, numbering and distinct destinations pass. Actual 200% zoom is tool-blocked, Assist success
  lacks usable model, and later-wave live-call/Comms activities remain outside this bounded pass.
- Projects Plan Calendar New meeting exposed 016: the project identity is in the POST URL query and write guard refuses it. Caller now passes it in the body; focused regression and independent source review pass. Live event 100045 persists at Nov12 14–15 with its IRON link.
- Popup 017 now fits its menu at 1920 and 1280px; phone quick-event dialog fits at 390px. Before/after geometry and screenshots are retained; no screenshot baseline suite was added.
- Final release build and the six affected application specs pass: 122/122 features. Full commit gates are recorded below when complete.
- Final end-of-Wave-3 application gate passed 3410/3410 server features and 19/19 browser client features within
  unchanged budgets (`apps-batch-5-final.log`). The six affected application specs passed 122/122; the final Calendar
  component/request/geometry recheck passed 23/23. No broad regression walk or screenshot baseline was added.
- Final framework gate passed every phase on the final native painter/ID source (`framework-final-verified.log`,
  bounded Rust concurrency 2), as did `cargo lint` and `cargo lint-min`. Screen lint reports zero parse failures
  across 1747 files; existing idiom/hazard sites remain in the separate report. Required BOSS acceptance passed
  520/520 server and 172/172 client features when CommonsClientFixtures was added; the fixture was not changed later.
- Local owning-layer commits include framework `d4927955` and BOSS Contacts `4182f6cc`; this commit contains the final
  Calendar implementation and record. Framework `753b351d` records the requested future cadence: localized checks
  during batches and full suites once at the end of the planned review pass.

#### Waves 1–3 pass disposition

- DC-01–10 each have observed primary outcomes, recovery evidence and explicit remaining variants in the activity
  ledger and screen inventory. All 18 reproduced UI findings have corrections and independent after/recovery review.
  Browser navigation was coordinator-proxied; delegated workers designed checks, fixed code and inspected saved
  snapshots/images because child sessions could not access the shared built-in browser.
- Remaining execution coverage includes actual 200% zoom, successful Assist/provider execution, external DAV clients,
  valid calendar publication/revocation and resource approval controls absent from the current UI, plus the deferred
  mode/access/recovery variants listed per activity. The live-call repeat remains Wave 6; substantive Mail/Chat work
  remains with its later waves. These gaps retain their explicit dispositions.
- The approved disposable sync credential was verified for one-time display, hidden after reload and revoked.
  Secret evidence is redacted. The isolated review server is stopped; its disposable database and ignored local
  evidence are retained. Commits are local, with no push or deployment.

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


#### Waves 4–8 continuation — Wave 4, first verified batch

- The user authorized the continuation with up to three workers and local commits, with **focused checks only until the end of Wave 8**. Full application/framework suites and the component acceptance suite required by new fixtures run at that final boundary. This overrides the older per-commit cadence.
- Reused the isolated `/private/tmp/boss-ui-review-data` database and mutable resources, existing release binary and local port 18090. Initial framework/BOSS/Mantle heads were `c7c719fd`, `18d30d9a`, `da9ed876`; PASS is absent until moderation. Manual mail capture remains enabled. Evidence is ignored under `plans/ui-refinement-evidence/boss-waves-4-8/`; no credentials or reusable live tokens are retained there.
- Three delegated roles cover browser test design, fixing and independent verification. Child chats cannot bind the coordinator’s built-in browser (one direct attempt each, no native fallback); the coordinator performs UI steps and shares screenshots/snapshots for independent review. This is an explicit execution limitation, not independent live-browser execution by the children.
- DC-11–14 outcomes and outstanding branches are recorded in the activity ledger above. Public download returned exactly `Wave 4 revocation retry retained draft.\n`; restoring the earlier file returned exactly `Wave 4 disposable file — Joe version one.\n`. The new Bob note’s original and named checkpoint remain in history after both restores. No permanent deletions were used.
- DC-UI-019/020/021 are corrected and independently reviewed. Local checks: FileShares **5/5**, Knowledge/KnowledgeReview/Notes **34/34**, webroot layout/router **10/10**; no budgets raised or broad walks added. Whole suites remain reserved for Wave 8. Desktop light evidence is captured; requested wide sizing was not achieved (actual retained images are 1280px). Dark/narrow/keyboard/TUI and Standard primary actions remain on the pass checklist. Actual 200% zoom remains unsupported by the browser API.


#### Wave 4 — storage and upload follow-up

- Joe created scratch drive `100052`, backed by `/private/tmp/boss-ui-review-data/git/DRIVE_100052`; a 31-byte text and 2 MiB text batch was refused at the 1 MB quota with no partial creation, then both uploaded after changing it to 3 MB. The quota rule preflights the whole batch; partial success was a source proposal, not an observed result. Upload/download latency in this harness is the user approval gate, as the user clarified; it is not an app or tool availability defect.
- The uploaded text was edited to a named Git checkpoint, then restored as a new commit with prior commits retained. Canceling an existing-name upload kept the old file; retrying Keep both created `w4-upload (2).txt`. Ordinary file upload and separate public file-drop upload both persisted. The public drop displays only Send files and Sent; owner details identify the supplied fictional uploader and exact preview/31-byte size. Revocation returns Link not available.
- Joe also created member-only scratch Git wiki `W4GIT`, under the isolated runtime’s `git/WIKI_W4GIT`. A named save appears as a real commit in its three-commit History. Database wiki co-edit/review/publication remains separately covered by W4KB.
- DC-UI-022 corrects the observed serialized-object return URL; focused Files **17/17** passed. Screen lint report for the first batch scanned **1747 files**, **0 parse failures**, **132 pre-existing flagged sites**; report is separate from source. Whole suites remain deferred to Wave 8.
- First verified batch commits: framework `af69ddf8`, BOSS `f563c1b1`. This follow-up retains remaining recovery and mode gaps rather than claiming the complete matrix passed.


#### Wave 5 — local mail, shared account and private mailbox

- DC-15–17 are now exercised, continuing; their ledger rows preserve untested modes and recovery branches. The coordinator used the isolated runtime and built-in browser; delegated workers reviewed source and retained screenshots/DOM/artifacts because child chats cannot bind its IAB tabs. No native-browser fallback was retried. Upload/download approval latency is the harness/user approval gate, not an app failure.
- The local mail wizard refused wrong loopback credentials, then verified corrected SMTP/IMAP credentials and six folders. A real local plain-text IMAP message reached the Inbox. Hosted multipart import/HTML/image safety and outbound capture are separate flows. External provider/OAuth success is unverified. Canceling account removal preserved it; confirming Remove with Keep mail left the remote account Removed with one message kept. No restore UI was offered, so restoration is not claimed.
- Joe's persisted reply retained its Files attachment; Bob's shared-account download matched the 31-byte source and SHA-256. Structured capture contains the actual local envelope/body/headers and attachment names, not raw MIME or attachment bytes. A second message exercised missing-recipient refusal, Send→Undo restoration and resend: saved identity/To/subject/signature/text block and Reply-To agree with its one retained matching capture. The coordinator observed the Undo sequence; the restored-state image alone does not prove canceled-delivery absence.
- Private W5 triage (100051) shows Joe/Bob two-member post/reply and separate unread transitions. Bob's reply links to BOSS_UI_TASK and appears in its Chatter. Removing Bob makes the mailbox unavailable and prevents new mailbox reply; historical delivered recipient copies remain readable by the intended Mantle contract. A new owner-only post is visible to Joe and absent from Bob's Unified Inbox. Other-org nonmember access to the mailbox and known mail account/folder/thread returns not found without message content. Ordinary shared-account grant/revoke and inaccessible-record filing remain open.
- DC-UI-023–028 are corrected and independently reviewed against their specific after artifacts. Date headers/quote/group/Saved status use Joe's zone; SMTP-only capability and completed-sync setup feedback agree with actual state; Bob sees the real email sender; OOO account navigation and future activation persist. The OOO after capture establishes scheduled state, not actual future automatic delivery or every apply-to-all/disable branch. Preparation extraction and per-entry availability preserve default denial; checkbox filtering matches the merged renderer and preserves existing mail rules.
- Focused verification: ShellSync 9/9 (4.7 s of 7 s); BasicComms 024 8/8 (3.7 s of 8 s), followed by a 025 run with seven other passing features and a corrected exact-feature retry 1/1 (0.5 s); native static 38/38 and mounted static client 26/26; debug build passed. Generated desktop copies and static goldens were regenerated and inspected. The initial 023 focused failure loaded an old bundle during parallel generation; sequential regeneration/test passed. Runtime/component and browser-origin caches also required restart/fresh origin for the final live grouping check. These verification qualifications are separate from product defects.
- Full test-apps/test-framework, affected desktop crate checks and acceptance obligations from the modified fixtures remain at the user-directed end-of-Wave-8 boundary. No budgets were raised, no new regression screen sweep was added and no full suite ran for this batch. Waves 6–8 still cover actual chat/call/guest/media outcomes, Consent/PASS moderation/settings verification, cross-app access, remaining modes/recovery and final integration checks. Local listener/fixture readiness is not media-delivery proof; actual 200% zoom remains unsupported by the current browser API. No commit is recorded until the coordinator performs it.


#### Waves 6–7 — chat/call continuity, consent and moderation checkpoint

- DC-18/19/20 are exercised, partial; DC-21 remains pending while personal settings/verification outcomes are still being collected. The same coordinator-only IAB arrangement applies, with delegated source and saved-evidence review. Browser size requests for 1920px were accepted by the API but did not change the observed DOM viewport (1265×720) or retained image width (1280px). Filenames such as call-mini-today-1920 are request labels, not proof of a wide viewport. Earlier Waves 4–8 references to wide/1920 captures are qualified by these actual dimensions; actual wide/narrow/200% zoom variants remain unverified unless measured separately.
- Full Chat and the tray show the same Joe/Bob disposable text, reaction count 1, one reply and poll Ready 1/Needs review 0. Call participants appear In the call while the main state is Connecting; the mini-window persists over the selected task and Today. This proves signaling/UI continuity, not transmitted audio/video. Anonymous guest flow actually used lobby → Let in → admitted controls, then End for all and revoked-link Link not available. Other-org staff's direct active call 100001 returns Call not found. No actual media packet/frame, recording or playback success is claimed. Queue Paused/Resume/Log out controls are visible; broader queue/phone/handling variants remain partial.
- DC-02's live-call/Today/task combination was repeated. Joe lacks AgentUse for Assist; permissions were not expanded for a layout check. Successful Assist run, stop/approval/canvas and full simultaneous combinations remain blocked/unverified.
- Consent used existing demo Alex Rivera, rather than the proposed new recipient: News-only unsubscribe preserved Events/Updates and the primary email grant; staff withdrawal changed primary Marketing Email to Withdrawn with evidence, then restoration recorded a new grant and restored all three memberships. Retained staff snapshots establish the resulting scope/history; they do not substitute for independent public-shell layout, GET-no-mutation, idempotence, expired-link, export-byte or verification-delivery evidence. No live token is retained in notes.
- PASS was loaded for the selected moderation fixture; the public latest-topics page shows only the approved question, and the internal queue has Waiting 0. A repeated approval returns Review has ended. The public-only moderator cannot enter internal Comms, and other-org staff cannot inspect the review item. Internal roles remain separate from public moderation. Full PASS review stays out of scope.
- DC-UI-029/030/031 are corrected and independently reviewed for the reproduced issues. Focused BasicCommsCalls passed 9/9 (0.8 s of 8 s); CommsModeration retest passed 3/3 (0.8 s of 264 s). The earlier 031 failed assertion was a fixture returned-type expectation, corrected before the passing retest. Selected Wave5 mail, Wave6 queue and Wave7 moderation fixture features each passed; the complete modified BOSS acceptance suite remains at the end of Wave8. No whole application/framework suite was run for this checkpoint, and no budget was raised.
- Supported mode/recovery variants, access/cross-app walks and shared-fix retests remain for Wave8. Browser permission prompt availability is separate from application pending/Cancel feedback; cancel invalidates the app request and safely stops late streams without claiming to abort the native prompt. TOTP approval and current Dark preference persistence are in progress, so DC-21 has no completion claim here. Coordinator retains final tests, acceptance, lint, notes and commit ownership.


#### Wave 8 — settings, access and supported TUI checkpoint

- Inventory entries were reconciled conservatively with actual observed surfaces: Files/DriveSettings/Drives and TUI folder read, Knowledge/Spaces and TUI read, Notes browser/TUI, mail wizard/account/settings and TUI message read, call/queue/history/device-contract samples, Consent and Moderation. Unvisited dedicated descendants and modes remain pending; a shared component or focused test does not prove their visit. Restricted-client Standard evidence is a permitted read, not a Standard mutation pass.
- DC-14 pending-save switch/reopen/reload/search now preserves the exact Notes 100153 paragraphs. TUI creates a separate wiki note 100204 and sends one new message in private room 100051; these IDs belong to different entities from earlier mail message IDs. Chat source continuity persists through Task 100055 Chatter to filed Inbox Message 100204. Bob's removed room disappears and the other-org direct room is not found. Sheldon’s positive ACME-1 message/Standard read pairs with BLUTH-1 and Commons root refusals. Broader access and mode matrices remain partial.
- Personal settings now have actual dark/Pacific/profile/photo/topic/digest persistence evidence. TOTP invalid code was refused and a valid code accepted, as observed by the coordinator; disposable factor removal and temporary harmless preference/profile cleanup are pending. 034 redacts shared summary output while preserving explicit setup/validation; its final live safe-summary check and 035 Chat zone-after check remain pending. No secret is retained in the plan; no Tools/Marble account coverage is implied.
- Embedded TUI actually opens Files/Moved, reads W4 Knowledge and Notes 100153, creates a new note, sends Chat, reads mail detail and lists call history. Knowledge/Notes helpers explicitly delegate richer editing/history/review to the browser; TUI call notices/media limitations are not media failure or success proof. Ordinary Joe's consent registry refusal pairs with the narrow admin’s corrected five status columns after 038. The initial working-day state is correct after 036; 039’s final Space-toggle/Enter-done edit is still awaiting final live verification. Appearance return 037 has a focused pass but no final live after at this checkpoint.
- New focused results: widget 032 1/1 and precompile 1/1; Mantle PartyAccounts 033 5/5; RecentAuth 034 3/3 and BOSS CommonsSettings 9/9; Chat 035 ShellSync 9/9 and bundle 1/1; 036 bounded key/paint checks; 037 CommonsSettings 9/9; 038 Consent 12/12 including one real additional TUI-mode render; final 039 key test 1/1. Initial bridge/type assertion mistakes and superseded 039 contract checks are not counted as final passes. Final framework/application/desktop/modified-BOSS-acceptance gates and screen lint are still pending for the coordinator.
- No final completion or cleanup claim is made. Actual media/recording/voicemail, external OAuth/bridge/device success, disconnected delivery/recovery, unsupported feature/mode branches and other recorded gaps remain explicit. 1920/390/200% browser override requests did not establish those geometries. User approval waits for uploads/downloads are harness latency. No budget increase, regression sweep or blanket acceptance run was added; the final requested suites remain at the end-of-Wave8 boundary.


#### Final specific retests and cleanup checkpoint — final gates pending

- Independent review now confirms 034’s live account factor row has no secret destination text and shows civil dates; TOTP was subsequently removed. 035’s actual Pacific Chat clocks/day labels agree across list/message/system/tooltip. 036 initial weekdays, 038 all five consent status columns and 039 filtered-Enter/Space-Enter selection behavior pass their actual retained after states. For 039 no Calendar save was performed; reopening retained original weekdays. These observations supersede the then-pending notes in prior checkpoint records.
- Profile/name/photo and US/Eastern restoration, no second factor, and stored light/comfortable appearance states are retained in profile-restored, totp-factor-removed, preferences-light-restored, tui-appearance-comfortable-restored and native Standard after artifacts. This is observed settings cleanup, not a claim that every disposable review record was removed or every earlier preference was exhaustively restored. Digest/topic changes retain their individual recorded outcomes.
- 037 now passes final integration. The page-authored hidden marker is constrained to fixed local apps/qapps routes; Material preparation identifies its implicit /actions endpoint even though that transition uses an html RenderState. Final CommonsSettings **9/9** (3.9 s of 264 s) checks the exact prepared qapps value. Actual Material Save remains /qapps/Commons/Settings/Preferences with full controls, Dark mode unchecked and Comfortable selected; TUI /apps save/reopen/comfortable restoration and native Standard /apps Appearance saved also pass. The disproved relative-leaf and mode-only candidates are superseded; their earlier isolated passes are not used as final evidence.
- Runtime cleanup is confirmed by the coordinator: the review HTTP server and local SMTP/IMAP helper exited successfully, no TUI process remains, and no listeners remain on 18090/18125/18143. The capture helper opt-in flag is off and its scheduled review window expired. Isolated database/resources and redacted evidence are retained. Product sources are frozen; final suite/lint results, the final cleanup audit and commits remain pending for the coordinator.
- Current retained browser images are 1280px, with actual document width 1265px where measured. No new wide/phone/200% success claim is added; all existing external/media/recovery gaps remain.

#### Waves 4–8 — final verification and local commits

The requested review pass is complete with corrected findings **DC-UI-019–039** and the activity outcomes and remaining variants recorded above. Three delegated workers investigated and fixed shared causes and independently reviewed source and retained after evidence. The coordinator performed the live built-in-browser checks because worker IAB surfaces were unavailable. This closes the pass with documented coverage gaps; it does not turn partial activities or unvisited descendants into complete coverage.

Full suites ran only at the end of Wave 8, following the user's requested cadence. Final results, with detailed logs under the ignored framework `plans/ui-refinement-evidence/boss-waves-4-8/checks/` directory:

| Final gate | Result | Evidence |
| --- | --- | --- |
| Rust lint and final release build | Passed; bounded build jobs, release built once after product fixes. | `final-cargo-lint.log`, `final-release-build.log` |
| `./moq test-framework --release --nobuild` | Passed on final retest, all seven phases. Server 420/420; demo 10/10; webroot offline 417/417; dev-aide offline 48/48; served clients 149/149; workspace native tests passed. | `final-test-framework-retest.log` |
| `./moq test-apps --release --nobuild` | Passed: 3411/3411 server features and 19/19 served-client features. Mantle 321.0/393 s and BOSS 215.6/264 s server time; BOSS clients 54.9/57 s. | `final-test-apps.log` |
| Offline BasicComms ShellSync | Passed 9/9, 4.8/7 s. | `final-shell-sync.log` |
| Desktop crate tests | Passed 90/90 after the compatible runtime pin; binary/doc targets have no tests. No desktop application launch or device-success claim. | `final-desktop-tests-pinned.log` |
| Modified BOSS acceptance component | Passed: 523/523 server features across 97 specs, including the complete CommonsClientFixtures; 172/172 served-client features across 67 specs. No duplicate unchanged fixture run was needed. | `final-boss-acceptance.log` |
| Screen expression lint | Passed: 1747 files, 44897 expressions, zero parse failures. All 132 flagged sites match the earlier Wave 4 report after line-offset normalization; zero added or removed findings. | `final-screen-lint.txt` |

The first framework gate caught two stale static-section golden expectations omitted from the earlier 027 commit. Regeneration changed only `vFor` to `sectionIterateOpen` and the matching scope close in `structure.js` and `qvt-extras.js`; independent diff review, focused verification with regeneration disabled and the full retest passed. The initial failed gate remains in `final-test-framework.log`. Webroot offline took 44.6 s against its nominal 44 s budget, within the runner's accepted tolerance; no budget was changed.

Desktop validation first required the normal generated `target/moqui-app` prerequisite. Fresh dependency resolution then selected `tauri-runtime` alpha5, which removed dispatcher callbacks still called by pinned Tauri alpha5 and implemented by CEF alpha6. Both published dependency lockfiles use runtime alpha4. The independently reviewed exact alpha4 manifest pin makes that compatibility durable; the final desktop run passed. This excluded desktop-workspace manifest change does not invalidate the passing server/framework gates. Initial prerequisite and dependency failures remain retained alongside the final pass in the desktop logs.

Final framework integration is committed locally as **941b146e**; the Mantle account-name correction is **c39405ad**. Earlier verified batch commits remain in their owning repositories. The BOSS settings/consent corrections and this final record are committed together. No pushes or deployments were performed.

Final cleanup confirms the review HTTP server, embedded terminal sessions and local mail helper are stopped, with no listeners on 18090/18125/18143. The disposable TOTP factor and temporary photo were removed; Joe's name, US/Eastern zone, light/comfortable appearance and sampled digest/topic preferences were restored. The remote review account was removed with its fetched mail retained. Capture is disabled and its scheduled window expired; the isolated review database/resources and redacted evidence remain available.

Actual browser media/recording, external provider/device success, disconnected recovery variants and the remaining activity-specific branches stay unverified where stated. This pass did not establish 1920px, 390px or actual 200% browser zoom; retained images are the measured 1280px captures. Rich TUI actions explicitly delegated to the browser and the source-only Tools/Marble factor-page follow-up remain outside the verified outcomes. No regression sweep, screenshot baseline suite or budget increase was added.

#### Waves 4–8 — technical review follow-up

A source review of the Wave 4–8 commits corrected their implementation without changing a finding's outcome. Chat, Inbox and Compose dates use the user's zone *and* language again: `moqui.l10n.formatZoned` (Intl, user locale and zone) with `dayKey`/`dayNumber`, in place of fixed English patterns that had lost localized names and 24-hour clocks (023/035). Consent text comes from the consent service instead of being scraped from chip HTML (038). The Account factor list leaves out codes sent from a factor. Appearance save keeps its rendered marker, now that the static form's action is confirmed to be the same cached `/apps` URL from every shell (037). The static section preparation is `statics/prepare.rs`; the TUI multi-choice check is one session helper, and JSON choice lists of numbers initialize too (036/039). Marble's My Account factor list was checked and does not carry an authenticator secret; a regression spec now guards it.
