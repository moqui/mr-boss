# IronStone BOSS — Header, Drawers, Commons & Comms research

Oct 17, 2026

Reviewed against sources Oct 18, 2026; follows [research-crosscut.md](research-crosscut.md).

Deeper research pass on the **Header tray**, the **drawers (Assist, Commons/Comms panels)** and the **Commons & Comms apps**, cataloguing every relevant screen/page found in the reference apps. Companion to [3p-app-reference.md](3p-app-reference.md); feeds the design sections of [initial-design.md](initial-design.md) (Header tray and Assist; Commons & Comms: contacts, calendar, facility and equipment schedules, tasks and requests assigned, files, notes and knowledge, email, chat, calls, internal comm events). Commons and Comms are used from every app (initial-design), so their screens are reused screens that the apps include, and the header pieces are suite chrome over every app. Reused screens it covers (per [research-crosscut.md](research-crosscut.md) §3–§4): the **Contact / party record**, **Calendar & schedules** (booking in Commons; Maintenance includes the same schedules with policies, approvals and blackout windows, per initial-design's decided split), **Files**, notes, wiki and **knowledge base** authoring, and **Events**; the **Task / work item** screen (Commons' **Tasks assigned**, also in Projects, Customer Service, Sales and People) and the **Request / case** screen (Commons' **Requests assigned**, also in Customer Service, Purchasing, Maintenance and others); Comms email, chat, calls and consent/unsubscribe (sending also included in Marketing, Customer Service and Admin); **Chatter & activities**, one component on every app's record screens; and the header **Notifications** panel with the suite-wide "approvals waiting" list.

**Organization.** Sorted by functional area (not by app): all email screens together, all files screens together, etc. Within each area, sub-tables per reference app. §1–§5 are the header tray and drawers, §6–§8 Comms, §9–§13 Commons, §14 settings, §15 the extension points; §16–§18 are the closing sections. The closing **Gaps & BOSS implications** section applies the crosscut skeleton three times: each sub-section has a **Header & drawers**, a **Commons** and a **Comms** block.

**Scope.** Screens, panels and extension points for the header tray, Assist, Commons and Comms. Protocol work (SMTP, IMAP, CalDAV, CardDAV, WebDAV, WebRTC, CRDT sync) is mr-moqui's and is out of scope except where it shapes a screen. The Office/WOPI angle is a separate pass: `zm-onlyoffice` (WOPI-capable OnlyOffice server) and the Nextcloud `office/` and `richdocuments/` checkouts hold the editor-host integration UI; they are not catalogued here.

**Path conventions.** Every backticked path resolves against the checkout of its row's reference below (crosscut §1). Inside a table row a path may be a tail relative to a directory named earlier in the same cell or row (`spreed/src/components/CallView/CallView.vue`, `CallView/Grid/*.vue`).

| Prefix | Checkout | Paths start with |
| --- | --- | --- |
| **Nextcloud** | `3p_other/nextcloud` (bundle of app repos) | `<app>/src/…` (Vue UI), `<app>/lib/…` (PHP), `<app>/templates/…`; core shell `server/core/…`, `server/lib/…`; bundled server apps `server/apps/<app>/…` |
| **Zimbra** | `3p_other/Zimbra` (bundle) | `zm-web-client/WebRoot/js/zimbraMail/…` and `zm-web-client/WebRoot/templates/…`; `zd-full/ZimbraWebClient/…` for IM and notebook, which zm-web-client does not ship |
| **Frappe apps** (Frappe suite, Gameplan, Frappe Wiki) | `3p_other/frappe` | the app directory: `suite/frontend/src/…` (one SPA with an app registry), `gameplan/frontend/src/…`, `wiki/frontend/src/…`; backend `<app>/<app>/…` |
| **Ever Gauzy** | `3p_other/ever-co/ever-gauzy` | `apps/gauzy/src/app/pages/…`, `packages/…` |
| **Twenty** | `3p_other/twenty` | `packages/twenty-front/src/…`, `packages/twenty-ui/src/…` |
| **Signal** | `3p_other/signalapp` (bundle) | `Signal-Desktop/ts/…`, `Signal-Server/…`, `libsignal/…`, `ringrtc/…` |
| **OpenProject** | `3p_other/openproject` | `app/…`, `modules/<module>/…`, `frontend/src/app/features/…` |
| **Redmine** | `3p_other/redmine` | `app/views/…` |
| **Moqui WorkManagement** | `3p_moqui/WorkManagement` | `screen/…` |
| **Moqui baseline** | `mr-moqui-base/runtime` | `component/mr-marble/screen/…` (SimpleScreens and MyAccount), `component/mr-boss/screen/…`, `component/mr-mantle/entity/…`, `component/mr-mantle/service/mantle/…`, `components/base/framework/{entity,service}/…`, `components/base/webroot/screen/webroot/…` |
| **Nextcloud Assistant** | not in the checkout (crosscut §1) | names in §18 are from the published repository github.com/nextcloud/assistant (`src/…`), listings checked Oct 18, 2026; they are not checkout paths |

**Not used here.** Checked and found nothing beyond what is catalogued: ERPNext and the Frappe framework desk (no groupware screens beyond record timelines); Odoo `calendar` and `contacts` addons (checked, not catalogued: Nextcloud and Zimbra cover the same screens; Odoo Knowledge and Appointment are not in the community checkout); Frappe CRM and Frappe Helpdesk (record-side email and activity timelines only, covered in [research-sales.md](research-sales.md) and [research-customer-service.md](research-customer-service.md)); Carbon, AureusERP, Dolibarr, metasfresh, Akaunting (business modules; Dolibarr agenda resources are in [research-maintenance.md](research-maintenance.md)); Ever Teams and Ever Rec (team workspace and screen recording, no groupware screens beyond Ever Gauzy's); Nextcloud `forms` and `tables` (survey and table builders, not catalogued here; whether Commons includes a form builder is a crosscut §8 question) and `cookbook`. Signal-Server, `libsignal`, `ringrtc` and `boring` ship no UI.

Sections: [1 shell/header drawers](#1-app-shell-header--drawers) · [2 search/palette](#2-search--command-palette) · [3 quick create](#3-quick-create) · [4 today](#4-today-panel--dashboard-widgets) · [5 notifications/activity/presence](#5-notifications-activity--presence) · [6 chat](#6-chat--presence-comms) · [7 calls](#7-calls--video-meetings) · [8 email](#8-email-comms) · [9 calendar](#9-calendar-commons) · [10 contacts](#10-contacts-commons) · [11 tasks/boards](#11-tasks--boards-commons) · [12 files/drive](#12-files--drive-commons) · [13 notes/knowledge](#13-notes-wiki-knowledge--discussions-commons) · [14 preferences](#14-preferences--per-app-settings) · [15 plugin-surface inventory](#15-cross-app-plugin-surface-inventory) · [16 cross-app surfaces](#16-cross-app-surfaces) · [17 Moqui baseline](#17-current-moqui-baseline-mr-marble--marbleerp--mantle) · [18 gaps & BOSS implications](#18-gaps--boss-implications)

---

## 1. App shell, header & drawers

### Nextcloud core — header assembled from micro-apps

The whole logged-in shell is one PHP template with small Vue apps mounted into named header slots. There is no core "sidebar/drawer" component: left nav and right sidebars are per-app, extended through registry APIs (see §12 and §15).

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Logged-in app shell | `<body>` = `#header` (header-start with logo + `#header-start__appmenu`; header-center `#unified-search`; header-end `#notifications`, `#contactsmenu`, `#user-menu`) + `#content` filled by each app | `server/core/templates/layout.user.php` |
| Shell bootstrap | Mounts the header micro-apps at load | `server/core/src/init.ts` |
| App launcher (top-left) | Drop-down grid of apps with nav counters and per-app actions | `server/core/src/components/MainMenu.ts`, `components/AppMenu.vue`, `AppMenuItem.vue`, `AppMenuActions.vue`, `AppMenuAction.vue`, `AppActionIcon.vue`, `AppIcon.vue` |
| Account/user menu (top-right) | Avatar menu: profile QR, settings links, user-status entry, logout | `server/core/src/components/UserMenu.ts`, `server/core/src/views/AccountMenu.vue`, `AccountMenu/AccountMenuEntry.vue`, `AccountMenu/AccountMenuProfileEntry.vue`, `AccountMenu/AccountQRLoginDialog.vue` |
| Contacts menu (top-right) | "Contacts" drop-down assembled from server providers (e.g. Talk's `CallProvider`) | `server/core/src/components/ContactsMenu.ts`, `server/core/src/views/ContactsMenu.vue`, `ContactsMenu/ContactMenuEntry.vue`, `server/core/src/services/ContactsMenuService.ts`, `server/lib/private/Contacts/ContactsMenu/Providers/*`, `spreed/lib/ContactsMenu/Providers/CallProvider.php` |
| Public-page top bar | Same header pattern for logged-out share/booking pages | `server/core/templates/layout.public.php`, `server/core/src/public-page-menu.ts`, `views/PublicPageMenu.vue`, `PublicPageUserMenu.vue` |
| Left app navigation | Per-app responsibility (`#app-navigation`); Files' version for reference | `server/apps/files/src/views/FilesNavigation.vue`, `components/FilesNavigationListItem.vue`, `components/FilesNavigationSearch.vue` |
| Shared right sidebar | No core sidebar; the construct is a registry: files' sidebar shell + `registerSidebarTab` from the @nextcloud/files library; core adds only the "Add to a project" collaboration popover | `server/apps/files/src/views/FilesSidebar.vue` + `sidebar/{setup,mount,provider,sharedState}.ts`, `server/core/src/OCP/collaboration.js`, `server/apps/files_sharing/src/collaborationresourceshandler.ts` |
| Global file preview overlay | App-less "viewer" that renders over any app's content | `viewer/src/views/Viewer.vue` (the standalone `viewer/` repo is the current code; the bundled `server/apps/viewer/src` holds only a two-file shim) |

### Zimbra core — op-registry app shell

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Client bootstrap & view manager | App base + the view-switch manager that swaps content-pane views per folder; view-id constants (`VIEW_CONVLIST`, `VIEW_CONV`, `VIEW_MSG`, `VIEW_TRAD`) | `zm-web-client/WebRoot/js/zimbraMail/core/ZmZimbraMail.js`, `core/ZmApp.js`, `core/ZmAppViewMgr.js`, `core/ZmId.js`, `core/ZmOperation.js` |
| Global "New" dropdown ops | One toolbar registry: `NEW_MENU`, `NEW_FOLDER`, `NEW_TAG` plus every app's `NEW_*` items; displayed per app via `getNewButtonProps()` (see §3) | `zm-web-client/WebRoot/js/zimbraMail/core/ZmOperation.js` (op constants L105-108, L164-169, L250-253, L524-535), each app's `Zm*App.js` |
| Zimlets sidebar | Permanent app-list "zimlet drawer": sidebar app + tree + panel views (extensible panel UI) | `zm-web-client/WebRoot/js/zimbraMail/share/view/ZmZimletApp.js`, `ZmZimletAppView.js`, `share/model/ZmZimletMgr.js`, `ZmZimletContext.js`, `share/controller/ZmZimletAppController.js` |
| Detached-window shell | Popup-window host for compose/read in a separate browser window | `zm-web-client/WebRoot/js/zimbraMail/core/ZmNewWindow.js`, `package/NewWindow_1.js`, `NewWindow_2.js` |
| Global alert surfaces | Sound, floating desktop toast, app-level badge/alert | `zm-web-client/WebRoot/js/zimbraMail/share/view/ZmSoundAlert.js`, `ZmDesktopAlert.js`, `ZmAppAlert.js` |
| Email hover object handler | Right-click/hover menu on any email address anywhere (reply, add contact, create appt…) | `zm-web-client/WebRoot/js/zimbraMail/share/zimlet/handler/ZmEmailObjectHandler.js`, `mail/view/object/ZmAddressObjectHandler.js` |

### Frappe suite & Gameplan — app registry + rail

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Suite app registry | Single registry of apps (drive, slides, writer, sheets, meet, mail, calendar) with URL prefixes, logos, PWA flags; feeds router + launcher | `suite/frontend/src/apps/registry.ts`, `registry.test.ts` |
| Root router | Per-app lazy route groups; remembers last app | `suite/frontend/src/router/index.ts`, `suite/frontend/src/apps/<id>/routes.ts` |
| Suite shell | Full-page layout; registers suite-level command palette + PWA install | `suite/frontend/src/shell/SuiteLayout.vue`, `SuiteCommandPalette.vue` |
| App launcher | Full-page grid of app tiles (phone variant orders last-app first) | `suite/frontend/src/shell/LauncherView.vue`, `LauncherTile.vue` |
| Gameplan left rail | Collapsible rail with spaces + unread badges, Drafts/Search/Notifications/People items, account menu, user-arrangeable rail dialog | `gameplan/frontend/src/components/AppRail/AppRail.vue`, `CustomizeSidebarDialog.vue`, `customizeSidebar.ts`, `gameplan/frontend/src/data/unreadCount.ts` |
| Mobile drawer patterns | Per-app bottom sheets/tab bars: mail `MobileTabBar` + folder sheet; wiki `MobileDrawer`/`MobileAppMenu` | `suite/frontend/src/apps/mail/components/mobile/{MobileTabBar,MobileFolderSheet}.vue`, `wiki/frontend/src/components/{MobileDrawer,MobileAppMenu}.vue` |

### Ever Gauzy — Angular ERP shell, registry-driven header & sidebars

- Angular + Nebular shell: fixed header + collapsible left icon rail + pluggable right sidebars + a dockable AI-chat column; nearly everything in the header is registry-driven (`NavigationBuilderService`, `SelectorBuilderService`, plugin header actions).
- ERP module screens (accounting/sales/etc.) are out of this pass's scope — the shell is what matters here.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Master shell | Post-login shell: one-column layout + main nav menu; dynamic nav sections (reports, "Manage", "My Tasks") | `apps/gauzy/src/app/pages/pages.component.ts`, `packages/ui-core/theme/src/lib/layouts/one-column/one-column.layout.*` |
| ngx-header (top bar) | Quick-create button, org/team/project/employee/date selectors, timer toggle, plugin header actions, mobile extra-actions panel | `packages/ui-core/theme/src/lib/components/header/header.component.*` |
| Main nav menu + sidebar items | App-icon module rail with sections; permission/feature-gated items | `packages/ui-core/core/src/lib/components/main-nav-menu/main-nav-menu.component.*`, `components/sidebar-menu/` |
| Brand + workspace switcher | Logo row opening a multi-tenant workspace accordion | `packages/ui-core/theme/src/lib/components/gauzy-logo/`, `workspace-menu/workspace-menu.component.ts` |
| User identity + menu | Sidebar-footer user chip and overlay user menu (profile, logout) | `packages/ui-core/theme/src/lib/components/user/user.component.ts`, `user-menu/user-menu.component.ts` |
| Header title & breadcrumb | Page-title block with breadcrumb trail + back navigation | `packages/ui-core/shared/src/lib/components/header-title/`, `breadcrumb/`, `back-navigation/` |
| Header entity selectors | Org/employee/team/project pickers + date range, visibility driven by `SelectorBuilderService` | `packages/ui-core/shared/src/lib/selectors/{organization,employee,team,project,date-range-picker}/` |
| Navigation builder & route registry | `registerHeaderAction`/`registerSidebar`, nav-section add/remove, plugin page routing | `packages/ui-core/core/src/lib/services/navigation-builder/navigation-builder.service.ts`, `page/page-route-registry.service.ts` |
| Dynamic right sidebars | `DEFAULT_SIDEBARS` registry: changelog + quick-settings as collapsed right drawers with toolbar toggle | `packages/ui-core/theme/src/lib/components/theme-sidebar/default-sidebars.ts`, `theme-sidebar.component.ts`, `changelog/`, `theme-settings/` |
| Record-view drawer | Right quick-look drawer + expand-to-full-width route page (drawer links must resolve to real routes) | `packages/ui-core/shared/src/lib/record-view/{record-view-drawer,record-view-route-page}.component.ts` |
| AI-chat sidebar (plugin) | Docked chat panel between nav and content; expand/maximize/detach into its own window | `packages/plugins/ai-chat-react-ui/src/lib/ai-chat-sidebar.component.ts`, `provide-ai-chat-sidebar.ts`, `packages/ui-core/core/src/lib/services/chat-sidebar/` |
| Inbox plugin | Emails/Notifications/Archived tabbed page + 60s-polled header badge registered via `registerHeaderAction` | `packages/plugins/inbox-ui/src/lib/inbox-ui.plugin.ts`, `components/inbox-header-badge/`, `inbox-page/` |
| Quick actions (Ctrl+Q) | Grouped create-style dialog (new documents, start/stop timer); no fuzzy palette | `packages/ui-core/shared/src/lib/dialogs/quick-actions/quick-actions.component.*` |
| Custom dashboards | User-defined dashboards: canvas, tab strip, widget palette, widget-config dialog | `apps/gauzy/src/app/pages/dashboard/custom-dashboard/{dashboard-canvas,widget-palette,widget-config-dialog}.component.ts` |
| Widget framework & catalog | Widget host/window-layout abstractions + prebuilt domain widgets (accounting/charts/hr/teams/project) with provider registry; React widget primitives | `packages/ui-core/shared/src/lib/dashboard/{widget,widget-host,window-layout}/`, `dashboard/widgets/provide-core-dashboard-widgets.ts`, `packages/ui-react-components/src/lib/components/WidgetCard.tsx` |

### Twenty — shared drawer primitive + side panel + command engines

- React shell chrome shipped as shared primitives (`@ui/…`): one `NavigationDrawer` primitive consumed by both the workspace and the settings surfaces via a content swap; ⌘K has evolved into context-scoped command menus plus a right side panel with its own router/back-stack.
- No notification bell and no title-bar favorites star — favorites live in the drawer (draggable, folder-capable); commands can be pinned to headers.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| App drawer assembly | Mounts the drawer with header, mode switcher, main-vs-settings content switch, animated transitions | `packages/twenty-front/src/modules/navigation/components/AppNavigationDrawer.tsx` |
| Drawer primitives | Collapsing shared primitive: section titles, items, subitems, scrollable content, animated collapse wrapper, unread dot | `packages/twenty-front/src/modules/ui/navigation/navigation-drawer/components/{NavigationDrawer,NavigationDrawerSection,NavigationDrawerItem,NavigationDrawerScrollableContent,NavigationDrawerAnimatedCollapseWrapper,NavigationDrawerItemsCollapsableContainer}.tsx` |
| Collapse behavior | Page-header collapse button + expand-state hooks | `packages/twenty-front/src/modules/ui/navigation/navigation-drawer/components/NavigationDrawerCollapseButton.tsx`, `hooks/{useToggleNavigationDrawer,useNavigationDrawerExpanded}.ts` |
| Drawer header & workspace switcher | Brand/workspace dropdown; "open record in side panel vs full page" options | `packages/twenty-front/src/modules/navigation/components/NavigationDrawerHeader.tsx`, `MultiWorkspaceDropdown/*` |
| Tabbed drawer content | One drawer, two contents: main navigation ↔ AI-chat history | `packages/twenty-front/src/modules/navigation/components/{MainNavigationDrawerModeSwitcher,NavigationDrawerTabbedContent,MainNavigationDrawerContent}.tsx` |
| Favorites section | Draggable, folder-capable pinned favorites | `packages/twenty-front/src/modules/navigation-menu-item/display/sections/favorites/components/{FavoritesSectionDispatcher,FavoritesSection}.tsx` |
| Workspace (objects) section | Objects/views/folders as `navigationMenuItem`s with dnd reorder | `packages/twenty-front/src/modules/navigation-menu-item/display/sections/workspace/components/{WorkspaceSectionDispatcher,WorkspaceSection,WorkspaceSectionListDndKit,WorkspaceSectionListReadOnly}.tsx` |
| Settings drawer content | The same drawer swaps to settings items | `packages/twenty-front/src/modules/navigation/components/SettingsNavigationDrawerContent.tsx`, `packages/twenty-front/src/modules/settings/components/SettingsNavigationDrawerItems.tsx` |
| Mobile nav bar | Bottom-bar equivalent of the drawer | `packages/twenty-front/src/modules/navigation/components/{MobileNavigationBar,MobileNavigationBarScrollEffect}.tsx`, `hooks/useMobileNavigationBarItems.ts` |
| Page headers | Generic `PageHeader`; record identifier bars (show/index) with view-bar and action mounts | `packages/twenty-front/src/modules/ui/layout/page/components/PageHeader.tsx`, `packages/twenty-front/src/pages/object-record/RecordShowPageHeader.tsx`, `packages/twenty-front/src/modules/object-record/record-index/components/RecordIndexPageHeader*.tsx` |
| Right side panel (⌘K host) | Collapsible panel with top bar, router/back-stack, per-page routing: search, ask-AI, compose email, compose calendar event, create related record, share record, record page | `packages/twenty-front/src/modules/side-panel/components/{SidePanelContainer,SidePanelTopBar,SidePanelRouter,SidePanelToggleButton,SidePanelExpandButton}.tsx`, `packages/twenty-front/src/modules/side-panel/pages/{search,ask-ai,compose-email,compose-calendar-event,create-related-record,share-record,record-page}/` |
| Context-scoped command menus | Per-surface assemblies (index page, record show, standalone page, side panel) + legacy overlay/mobile inputs | `packages/twenty-front/src/modules/command-menu-item/components/{RecordIndex,RecordShow,StandalonePage,RecordPageSidePanel}CommandMenu.tsx`, `packages/twenty-front/src/modules/command-menu/components/CommandMenuOpenContainer.tsx` |
| Engine commands (registry) | Headless actions: navigation, panel/AI-tab openers, create record/view, import, delete/restore, export, share, compose email/campaign, edit layout, favorites | `packages/twenty-front/src/modules/command-menu-item/engine-command/components/`, `engine-command/global/`, `engine-command/record/` |
| Pinned commands & row menus | Command items pinned to headers; per-click dropdown of record commands | `packages/twenty-front/src/modules/command-menu-item/components/{CommandMenuDropdownAtCursor,RecordIndexCommandMenuDropdown}.tsx` |
| Record widgets | Timeline, tasks, notes, files, emails and email thread, calendar events, chat threads, call recordings (with summary and transcript) as per-record widgets (the closest Chatter analog in the checkouts); the same record shell is reused inside the side panel; the data side is the `activities` module (tasks, notes, emails, calendar, files, timeline activities) | `packages/twenty-front/src/modules/page-layout/widgets/{timeline,tasks,notes,files,emails,email-thread,calendar,chat-threads,call-recording}/`, `packages/twenty-front/src/modules/activities/{tasks,notes,emails,calendar,files,timeline-activities}/`, `packages/twenty-front/src/modules/side-panel/pages/record-page/components/` |
| twenty-ui primitives | Breadcrumb/ListItem/Tabs, draggable & suggestion menu items, Section/OverflowingList layout helpers | `packages/twenty-ui/src/primitives/navigation/`, `packages/twenty-ui/src/components/navigation/`, `packages/twenty-ui/src/components/layout/{Section,OverflowingList}/` |

**BOSS implications.** Header content in every reference is mounted slots over one shell — the BOSS header/plugins split maps directly. The *registry API* pattern (sidebar tabs, file actions, search filters, new-menu entries, message actions) is the shared-context plumbing initial-design asks for; Zimbra's op registry (`ZmOperation` + `handleOp` lazy app load) is the same idea done imperatively. Gameplan's AppRail (collapsible, user-arrangeable, unread badges) is the best drawer reference for a Commons/Comms switcher. Ever Gauzy extends furthest on seams (`registerHeaderAction`/`registerSidebar`/`ChatSidebarService.register` + page-route registry) and pairs every record drawer with a bookmarkable full-page twin; Twenty proves the one-drawer/multi-content model (workspace ↔ settings ↔ AI-chat) plus a back-stacked right side panel and headless engine commands.

---

## 2. Search & command palette

### Nextcloud — unified search modal + per-app registration

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Unified search mount + API | Mounts at `#unified-search`; exposes `OCA.UnifiedSearch.registerFilterAction()` so apps add scoped filters | `server/core/src/unified-search.ts`, `store/unifiedSearch.ts` |
| Search shell | Input (Ctrl/Cmd+F logic) + results modal wrapper | `server/core/src/views/UnifiedSearch.vue` |
| Search modal & results | Full-screen modal: input, result rows, skeletons, filter chips, custom date range, connected-services bar | `server/core/src/components/UnifiedSearch/{UnifiedSearchModal,UnifiedSearchInput,SearchResult,SearchResultSkeleton,SearchResultPlaceholders,SearchFilterChip,CustomDateRangeModal,ConnectedServicesBar,SearchableList,LegacySearchResult}.vue` |
| Search service layer | Client controller + service + composable; server composes PHP providers | `server/core/src/services/{UnifiedSearchController,UnifiedSearchService}.ts`, `composables/useUnifiedSearch.ts`, `server/lib/private/Search/SearchComposer.php` |
| Legacy search | Older modal still shipped | `server/core/src/legacy-unified-search.ts`, `views/LegacyUnifiedSearch.vue` |
| Mail search provider | PHP `OCP\Search\IProvider` (no JS filter in mail) | `mail/lib/Search/Provider.php`, `mail/lib/Provider/MailProvider.php` |
| Talk search filter | JS filter `talk-message` (conversation/message picker) reusing global search | `spreed/src/search.js`, `spreed/src/components/LeftSidebar/SearchConversationsResults/SearchConversationsResults.vue` |
| Files in-folder search | JS filter `in-folder` + results view over WebDAV SEARCH | `server/apps/files/src/plugins/search/folderSearch.ts`, `views/search.ts`, `services/{Search,WebDavSearch}.ts`, `store/search.ts` |

### Zimbra — search app + saved searches

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Search app | Dedicated "Search" tab with toolbar + results list | `zm-web-client/WebRoot/js/zimbraMail/share/ZmSearchApp.js`, `share/controller/ZmSearchController.js`, `ZmSearchResultsController.js` |
| Search toolbar | Query input + item-type buttons, shown in mail and search apps | `zm-web-client/WebRoot/js/zimbraMail/share/view/ZmSearchToolBar.js`, `ZmSearchResultsToolBar.js` |
| Refine/filter panel | Refine current results by folder/tag/type/date | `zm-web-client/WebRoot/js/zimbraMail/share/view/ZmSearchResultsFilterPanel.js` |
| Saved searches | Search-folder model + "Searches" tree + save dialog + tree controller | `zm-web-client/WebRoot/js/zimbraMail/share/model/ZmSearchFolder.js`, `controller/ZmSearchTreeController.js`, `view/dialog/ZmNewSearchDialog.js` |
| Search model | Query execution + result wrapper | `zm-web-client/WebRoot/js/zimbraMail/share/model/ZmSearch.js`, `ZmSearchResult.js` |

### Frappe — command palettes

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Suite command palette | Global palette; each app contributes palette groups (`paletteGroups` in the root store); Cmd/Ctrl+Enter opens a row in a new tab | `suite/frontend/src/shell/SuiteCommandPalette.vue`, `CommandPaletteSidebarItem.vue`, `suite/frontend/src/stores/` (root store) |
| Wiki palette search | Global search palette inside wiki | `wiki/frontend/src/components/CommandPalette.vue` |

### Ever Gauzy & Twenty — command surfaces and side panel

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Gauzy quick actions (Ctrl+Q) | Grouped create-style dialog (new documents, start/stop timer); no fuzzy search or global palette in the header | `packages/ui-core/shared/src/lib/dialogs/quick-actions/quick-actions.component.ts` |
| Twenty ⌘K → side panel | Context-scoped command menus (index/record/standalone/side panel) + right side panel with back-stack routing (search, ask-AI, compose, record page); headless "engine commands" registry | `packages/twenty-front/src/modules/command-menu-item/components/*CommandMenu.tsx`, `modules/command-menu-item/engine-command/components/`, `modules/side-panel/{components,pages}/` |

**BOSS implications.** The closest model for a BOSS "jump to any record / run any action" palette is the unified-search modal + `registerFilterAction` extension point, with per-app providers (mail behaves as a PHP provider; talk/files as JS filters — both patterns usable for BOSS screens). Zimbra's saved searches ("Searches" tree entries) suggest palette-able *stored queries*, not just records.

---

## 3. Quick create

### Zimbra — one "New" menu, per-app ops, quick-add dialogs

| Screen/page | What it is | Key files |
| --- | --- | --- |
| New-menu op registry | `NEW_MESSAGE`, `NEW_CONTACT`, `NEW_APPT`, `NEW_TASK`, `NEW_FILE`, `NEW_DOC`, `NEW_FOLDER`, `NEW_TAG`, etc. per app | `zm-web-client/WebRoot/js/zimbraMail/core/ZmOperation.js`, each app's `Zm*App.js` (`_registerOperations`, `getNewButtonProps`) |
| Lazy app load on op | `handleOp` opens the compose/create view and lazily loads the owning app package | each `zm-web-client/WebRoot/js/zimbraMail/*/Zm*App.js` `handleOp`; e.g. `zm-web-client/WebRoot/js/zimbraMail/mail/controller/ZmMailListController.js` ops L45-85 |
| Generic quick-add dialog | Base quick-form dialog all areas extend | `zm-web-client/WebRoot/js/zimbraMail/share/view/dialog/ZmQuickAddDialog.js` |
| Quick contact | Contact quick-add dialog | `zm-web-client/WebRoot/js/zimbraMail/abook/view/ZmContactQuickAddDialog.js` (template `abook.Contacts#QuickAddPrompt`) |
| Quick event | Appointment quick-add + "more details" handoff; can be reached from mail (`CREATE_APPT`) | `zm-web-client/WebRoot/js/zimbraMail/calendar/view/ZmApptQuickAddDialog.js`, `mail/controller/ZmMailListController.js` L83/L1750 |
| Quick task from mail | `CREATE_TASK` op → task controller prefill | `zm-web-client/WebRoot/js/zimbraMail/mail/controller/ZmMailListController.js` L84, `tasks/controller/ZmTaskController.js` |
| New-address add-on-send | Send confirm offers "add new addresses to contacts" rows | `zm-web-client/WebRoot/js/zimbraMail/mail/view/ZmMailConfirmView.js` L49-51,L233, `templates/mail/Message.template#ZmMailConfirmView*` |

### Nextcloud — per-app new menus, prefilled cross-context creates

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Files "New" menu | Extension list + name dialog: folder, from-template, template folder, file request | `server/apps/files/src/newMenu/{newFolder,newFromTemplate,newTemplatesFolder}.ts`, `components/NewNodeDialog.vue`, `server/apps/files_sharing/src/files_newMenu/newFileRequest.ts` |
| Files templates | Template picker + fill-in fields (OCS route `/ocs/v2.php/apps/files/api/v1/templates`) | `server/apps/files/src/services/Templates.js`, `views/TemplatePicker.vue`, `components/TemplateFiller*`, `lib/Controller/TemplateController.php` |
| New message (mail) | Composer modal (mailto/new flow) | `mail/src/components/NewMessageModal.vue`, `NewMessageButtonHeader.vue` |
| Quick event | New-event dialog from calendar header | `calendar/src/views/NewEventDialog.vue` |
| Quick task | Task create dialog (also multi-line paste → multiple tasks) | `tasks/src/components/TaskCreateDialog.vue`, `CreateMultipleTasksDialog.vue`, `utils/textToTask.js` |
| Quick card | Deck card create dialog + embedded custom picker (create card from Files/other apps) | `deck/src/CardCreateDialog.vue`, `deck/src/views/CreateNewCardCustomPicker.vue` (registered via `deck/src/init-reference.js`) |
| New page (Collectives) | Page-tree "New page" dialog | `collectives/src/components/PageList/NewPageDialog.vue` |
| New whiteboard | Files "New whiteboard" library/templates picker injected by whiteboard app | `whiteboard/src/files.ts`, `whiteboard/src/hooks/useLibraryCatalog.ts` |
| Create from Talk message | "Create a task"/"Create card" message actions prefill from a chat message (incl. call deep link) | `tasks/src/talk.js`, `deck/src/init-talk.js`, paired dialogs above |

**BOSS implications.** The header "+" menu matches Zimbra's op registry exactly (one menu, items registered by each app, disabled states from writability). NC adds the missing "prefill from context" half: create-from-message / create-from-address actions. Deck's embedded custom picker (create *and* attach from within a Files share dialog) is a candidate pattern for Commons "quick create + link to current record".

---

## 4. Today panel & dashboard widgets

### Nextcloud — dashboard app + per-app widgets

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Dashboard app | Personal dashboard: user-arrangeable widget layout, eager/first-launch layout, status strip | `server/apps/dashboard/src/{main.js,DashboardApp.vue}`, `components/{ApiDashboardWidget,ApiDashboardWidgetItem}.vue`, `lib/Controller/DashboardApiController.php`, `templates/index.php` |
| Widget registration API | `OCA.Dashboard.register(app, callback)` / `registerStatus(app, callback)` | `server/apps/dashboard/src/main.js` (L~347/356) |
| Tasks widget | Today/upcoming tasks with per-item "mark done" + inline-create | `tasks/src/dashboard.js` → `tasks/src/views/Dashboard.vue` |
| Deck widgets ×3 | Upcoming / Today / Tomorrow assigned cards | `deck/src/init-dashboard.js` → `deck/src/views/{DashboardUpcoming,DashboardToday,DashboardTomorrow}.vue`, `components/dashboard/Card.vue`, `stores/dashboard.js` |
| Notes widget | Recent/favorite notes | `notes/src/dashboard.js` → `notes/src/components/Dashboard.vue` |
| Status widgets | user status + weather on dashboard | `server/apps/user_status/src/menu.js`, `server/apps/weather_status/src/weather-status.js` |
| Server-side widgets | PHP widgets: important mail, unread mail, upcoming calendar events, activity | `mail/lib/Dashboard/{ImportantMailWidget,UnreadMailWidget,MailWidget}.php`, `calendar/lib/Dashboard/CalendarWidget.php`, `activity/lib/Dashboard/ActivityWidget.php` |
| API widgets | Same layout fed from `IAPIWidget` server data (any business app can join) | `server/apps/dashboard/src/components/ApiDashboardWidget*.vue`, `server/lib/public/Dashboard/*` |
| Talk home dashboard + Talk widget | Inside Talk, the home screen (`WelcomeView`) shows an upcoming-meetings feed with join buttons; for the Nextcloud dashboard Talk registers a server-side `IAPIWidget` (conversations with a call in progress, unread mentions or unread one-to-one messages) | `spreed/src/components/Dashboard/{TalkDashboard,DashboardSection,EventCard}.vue`, `spreed/src/views/WelcomeView.vue`, `spreed/src/services/dashboardService.ts`, `stores/dashboard.ts`, `spreed/lib/Dashboard/TalkWidget.php` |
| Calendar reference widget | Calendar view embedded as a rich reference/widget | `calendar/src/reference.js`, `calendar/src/store/widget.js` |

### Zimbra — portal portlets

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Portal app | Configurable portlet dashboard | `zm-web-client/WebRoot/js/zimbraMail/portal/ZmPortalApp.js`, `portal/view/{ZmPortalView,ZmPortletView}.js`, `portal/model/{ZmPortlet,ZmPortletMgr}.js`, `portal/controller/ZmPortalController.js` |
| Mini calendar | Overview-pane mini calendar with drag-to-create — a header-widget analog inside apps | `zm-web-client/WebRoot/js/zimbraMail/calendar/view/ZmMiniCalendar.js`, `calendar/model/ZmCalMgr.js` |

### Frappe suite — in-sidebar widgets

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Calendar sidebar widgets | MiniMonth + UpcomingEvents in the calendar rail | `suite/frontend/src/apps/calendar/components/{MiniMonth,UpcomingEvents}.vue` |
| Meet lobby widgets | Upcoming meetings grid on Meet home | `suite/frontend/src/apps/meet/components/UpcomingMeetings.vue`, `GroupTile.vue` |

### Ever Gauzy — dashboards (widget registry & canvas)

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Custom dashboards | User-defined dashboards: canvas, tab strip, widget palette, per-widget config dialog | `apps/gauzy/src/app/pages/dashboard/custom-dashboard/{dashboard-canvas,widget-palette,widget-config-dialog}.component.ts` |
| Widget framework & catalog | Widget host/window-layout abstractions + prebuilt widgets per domain (accounting/charts/hr/teams/project) with provider registry; React widget primitives | `packages/ui-core/shared/src/lib/dashboard/{widget,widget-host,window-layout}/`, `dashboard/widgets/provide-core-dashboard-widgets.ts`, `packages/ui-react-components/src/lib/components/WidgetCard.tsx` |

### OpenProject & Redmine — My page

| Screen/page | What it is | Key files |
| --- | --- | --- |
| OpenProject My page | Personal grid page: add, move and resize widgets — work-package table, calendar, graph and overview, time entries, news, documents, members, favorite projects, custom text | `modules/my_page/app/views/my/page/`, `frontend/src/app/features/my-page/my-page.component.ts`, `frontend/src/app/shared/components/grids/widgets/{wp-table,wp-calendar,wp-graph,wp-overview,time-entries,news,documents,custom-text,favorite-projects}/` |
| Redmine My page | Block layout the user picks: issues (assigned, reported, watched, by saved query), calendar, documents, news, time log, activity | `app/views/my/page.html.erb`, `app/views/my/blocks/{_issues.erb,_calendar.html.erb,_documents.html.erb,_news.html.erb,_timelog.html.erb,_activity.html.erb}` |

**BOSS implications.** The Today panel = widget registry (`OCA.Dashboard.register` + JS widgets vs PHP `IAPIWidget` data widgets) and the browser header "Today" can reuse exactly the tasks/deck/talk-event widget contents. An NC calendar PHP widget plus the upcoming-meetings feed covers the initial-design "Today's events" line; per-item quick actions (mark done, join, open thread) matter more than layout.

---

## 5. Notifications, activity & presence

### Nextcloud

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Notifications tray | **App absent from this checkout** (only the `#notifications` mount div remains) — see the OpenProject and Odoo notification references below | `server/core/templates/layout.user.php` (mount div, L~81) |
| Set status modal | Presence picker: online select, custom message, clear-at, predefined statuses | `server/apps/user_status/src/components/{SetStatusModal,OnlineStatusSelect,CustomMessageInput,ClearAtSelect,PredefinedStatus,PredefinedStatusesList}.vue`, `store/`, `services/` |
| Status menu entry | Vue entry inside the user menu + dashboard status widget | `server/apps/user_status/src/menu.js`, `UserStatus.vue` |
| Profile page | Public profile with per-section registry (shared files section) | `server/apps/profile/src/main.ts`, `views/ProfileApp.vue`, `components/{ProfileSection,SharedResourcesSection}.vue`, `templates/profile.php` |
| Activity app — pages | Feed pages with vue-router: `/all`, `/heatmap`, filters; nav + settings | `activity/src/app.ts`, `routes.ts`, `views/{ActivityApp,ActivityAppFeed,ActivityAppNavigation,ActivityHeatmapView,UserSettings,AdminSettings,DailySummary}.vue` |
| Activity — file sidebar tab | Per-record activity timeline as a files-sidebar tab (custom element + `registerSidebarTab({id:'activity'})`) | `activity/src/sidebar.ts`, `views/ActivityTab.vue`, `components/ActivitySidebarPlugin.vue`, `lib/Listener/LoadSidebarScripts.php` |
| Activity — stream page, RSS, email | Legacy stream template with RSS link; personal/admin email-notification settings; daily digest email machinery | `activity/templates/{stream.app.navigation.php,stream.body.php,rss.php,settings/personal.php}`, `activity/lib/{MailQueueHandler,DigestSender,NotificationGenerator}.php` |
| Activity content pieces | Activity rows/groups, heatmap grid, rich-argument renderers | `activity/src/components/{ActivityComponent,ActivityFilterBar,ActivityGrid,ActivityGroup,ActivityHeatmap,EmailSettings}.vue`, `components/activities/`, `components/richArgumentsTypes/` |
| Talk presence preloading | Online/away/dnd + custom status shown on avatars across conv lists | `spreed/src/utils/userStatus.ts`, `spreed/src/stores/session.ts` |

### Zimbra — badges, reminders, alert surfaces

| Screen/page | What it is | Key files |
| --- | --- | --- |
| New-mail alerts | New-mail badge + sound/desktop toast surfaces | `zm-web-client/WebRoot/js/zimbraMail/share/view/{ZmSoundAlert,ZmDesktopAlert,ZmAppAlert}.js`, `mail/ZmMailApp.js` badge wiring |
| Appointment reminder popups | Reminder controller with snooze engine; full list dialog + compact single-appt dialog | `zm-web-client/WebRoot/js/zimbraMail/calendar/controller/{ZmReminderController,ZmSnoozeBeforeProcessor}.js`, `calendar/view/{ZmReminderDialog,ZmQuickReminderDialog}.js` |
| Vacation reminder | Vacation-reply active reminder dialog | `templates/mail/Message.template#VacationRemindDialog`, `zm-web-client/WebRoot/js/zimbraMail/mail/view/ZmMailConfirmView.js` |
| IM presence model | Presence state machine (online/away/dnd/xa/invisible/custom) | `zd-full/ZimbraWebClient/WebRoot/js/zimbraMail/im/model/{ZmRosterPresence,ZmRoster}.js` |

### Odoo — systray menus, activities and followers (`odoo/addons/mail`)

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Activity menu (systray) | Header drop-down of my activities grouped by model with overdue / today / planned counts; opens the filtered list | `odoo/addons/mail/static/src/core/web/activity_menu.js`, `activity_menu.xml` |
| Messaging menu (systray) | Header drop-down of chats, channels and notifications (including mail delivery failures) with unread counts | `odoo/addons/mail/static/src/core/public_web/messaging_menu/messaging_menu.js`, `odoo/addons/mail/static/src/core/web/messaging_menu_patch.js` |
| Activities on a record | Activity list in Chatter; schedule (type, due date, assignee, summary), mark done with feedback, assign popover; activity plans that schedule several at once | `odoo/addons/mail/static/src/core/web/{activity,activity_button,activity_list_popover,activity_markasdone_popover,activity_assign_popover}.js`, `odoo/addons/mail/models/{mail_activity,mail_activity_type,mail_activity_plan}.py` |
| Activity view | Grid of records × activity types with due-state colours | `odoo/addons/mail/static/src/views/web/activity/{activity_controller,activity_renderer}.js` |
| Followers | Follower list with subtype choice per follower (which events notify whom) | `odoo/addons/mail/static/src/core/web/{follower_list,follower_subtype_dialog}.js`, `odoo/addons/mail/models/mail_followers.py` |
| Chatter | Message/note/activity/attachment timeline beside each form; scheduled messages | `odoo/addons/mail/static/src/chatter/web/{chatter.xml,chatter_patch.js,scheduled_message.js}`, `odoo/addons/mail/models/{mail_thread,mail_scheduled_message}.py` |

### OpenProject — in-app notification center

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Notification bell | Header bell with unread count | `frontend/src/app/features/in-app-notifications/bell/in-app-notification-bell.component.ts` |
| Notification center | Inbox page with mark-all-read: left menu with Inbox count, **by reason** filters (mentioned, assigned, accountable, watched, date alert, reminder, shared) and **by project** counts; entries show actors, status, relative time, date alert and reminder alert; split view opens the work package beside the list | `app/views/notifications/index.html.erb`, `app/menus/notifications/menu.rb`, `frontend/src/app/features/in-app-notifications/{center,entry}/`, `app/models/notification.rb` (reasons) |
| Notification settings | Per-user and per-project choices of which reasons notify, plus date alerts | `app/components/my/notifications/{show_page_component,project_settings_dialog_component}.rb`, `app/views/my/notifications.html.erb` |
| Reminders | Personal reminders on a work package that come back as notifications | `app/models/notification.rb` (`reminder` reason), `frontend/src/app/features/in-app-notifications/entry/reminder-alert/` |

### Ever Gauzy & Twenty — notifications

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Gauzy inbox plugin | Emails/Notifications/Archived tabbed inbox page + header badge registered via `registerHeaderAction`, read every 60 s (not while the tab is hidden) and at once after a change; core notification service | `packages/plugins/inbox-ui/src/lib/inbox-ui.plugin.ts`, `components/{inbox-header-badge,inbox-page,inbox-notifications,inbox-item-detail}/`, `packages/ui-core/core/src/lib/services/notification/` |
| Gauzy approvals | Approval requests (name, employees/teams, minimum approver count, status Requested / Approved / Refused) under configurable approval policies | `apps/gauzy/src/app/pages/approvals/approvals.component.ts`, `apps/gauzy/src/app/pages/approval-policy/` |
| Twenty (absent) | No in-app notification center in this snapshot (toasts only); deep-link equivalent is `OpenRecordIn` (side panel vs full page) | `packages/twenty-front/src/modules/ui/feedback/toast/components/AppToaster.tsx`, `modules/navigation/constants/OpenRecordInOptions.ts` |

**BOSS implications.** There is no notifications panel to port: the baseline has none (§17) and the Nextcloud notifications app is not in the checkout; OpenProject's notification center is the most complete one present (bell count, inbox with by-reason and by-project filters, reminders, per-project settings) and maps onto Moqui `NotificationMessage` / `NotificationTopic`; Odoo's two systray menus (activities by model with overdue/today/planned counts; chats and notifications) are the closest shape to the BOSS Today and Notifications panels. Gauzy's approval requests show what an "approvals waiting" list needs (requester, approvers, minimum count, policy). The Activity app's *records-side timeline as sidebar tab* is exactly the Chatter-under-every-record pattern; its digest-email machinery doubles as the notification-email reference. Presence = user_status modal + `<NcAvatar status>` conventions + Talk session awareness.

---

## 6. Chat & presence (Comms)

### Nextcloud Talk (`spreed/`)

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Talk routes | `/apps/spreed` → WelcomeView; `/call/:token` → MainView; plus not-found/forbidden/duplicate-session; recording route | `spreed/src/router/router.ts` |
| App shell | Left sidebar + top bar + call/chat panes + right sidebar + global dialogs (poll manager, media settings, settings) | `spreed/src/App.vue`, `spreed/src/views/MainView.vue` |
| Welcome / guest screens | Landing (no room selected), forbidden, session-conflict, guest welcome + nickname | `spreed/src/views/{WelcomeView,ForbiddenView,SessionConflictView}.vue`, `components/{GuestWelcomeWindow,SetGuestUsername}.vue` |
| Conversation list (left rail) | Virtualized room list with tag headers/filters, invites, open conversations, search results | `spreed/src/components/LeftSidebar/{LeftSidebar,InvitationHandler}.vue`, `LeftSidebar/ConversationsList/{ConversationsListVirtual,ConversationItem,ConversationTagHeader}.vue`, `LeftSidebar/{SearchConversationsResults,OpenConversationsList}/` |
| Chat view | Message list + composer + room header | `spreed/src/components/ChatView.vue`, `store/messagesStore.js`, `services/messagesService.ts`, `composables/useGetMessages.ts` |
| Message list & parts | Day-grouped virtual list; pinned messages; rich bodies; system messages | `spreed/src/components/MessagesList/MessagesList.vue`, `MessagesList/MessagesGroup/{MessagesGroup,MessagesSystemGroup}.vue`, `MessagesList/PinnedMessage/PinnedMessage.vue`, `MessagesGroup/Message/MessageItem.vue`, `Message/MessagePart/MessageBody.vue`, `SystemMessageItem.vue` |
| Message content embeds | File/image/video/audio previews, location card, contact card, deck-card preview, mention chips | `spreed/src/components/MessagesList/MessagesGroup/Message/MessagePart/{FilePreview,ImagePreview,AudioPlayer,LocationCard,ContactCard,DeckCard,MentionChip}.vue` |
| Composer | Rich-text input: mentions, typing indicator, audio recorder, attachments + new-file dialog + upload editor, smart-picker trigger | `spreed/src/components/NewMessage/{NewMessage,NewMessageAudioRecorder,NewMessageAttachments,NewMessageNewFileDialog,NewMessageUploadEditor,NewMessageTypingIndicator,NewMessageChatSummary}.vue`, `composables/useChatMentions.ts` |
| Message actions | Per-message menu: reply, forward, copy, edit, translate, reminders, scheduled sends | `spreed/src/components/MessagesList/MessagesGroup/Message/MessageButtonsBar/{MessageButtonsBar,MessageForwarder,MessageTranslateDialog,ScheduledMessageActions}.vue` |
| Reactions & polls | Reactions wrapper/list + reaction toasts; full poll lifecycle (create/vote/view) | `spreed/src/components/MessagesList/MessagesGroup/Message/MessagePart/{ReactionsWrapper,ReactionsList,PollCard}.vue`, `spreed/src/components/PollViewer/*.vue`, `services/{reactionsService,pollService}.ts` |
| Threads | Threaded replies + drafts via chatExtras store; threads tab in sidebar | `spreed/src/composables/useGetThreadId.ts`, `stores/chatExtras.ts`, `spreed/src/components/RightSidebar/Threads/ThreadsTab.vue` |
| Right sidebar | Tabs: chat, participants, breakout rooms, details, shared items | `spreed/src/components/RightSidebar/{RightSidebar,RightSidebarContent}.vue`, `Participants/*.vue`, `SharedItems/*.vue` |
| Room settings | Sectioned conversation settings dialog: basic info and avatar, notifications, listable, mentions, link share, recording consent, expiration, bans, lobby, SIP, permissions, live transcription, breakout rooms, Matterbridge, bots, preserve conversation, locking, danger zone | `spreed/src/components/ConversationSettings/{ConversationSettingsDialog,ConversationPermissionsSettings,LobbySettings,LockingSettings,NotificationsSettings,LinkShareSettings,ListableSettings,SipSettings,RecordingConsentSettings,LiveTranscriptionSettings,DangerZone,ExpirationSettings}.vue`, `BanSettings/`, `Matterbridge/` |
| Create room | Setup page (type/name/permissions) + contacts page (teams/circles) | `spreed/src/components/NewConversationDialog/{NewConversationDialog,NewConversationSetupPage,NewConversationContactsPage}.vue`, `services/teamsService.ts` |
| Room administration extras | Extend 1:1 to group, import participants by email, schedule meeting, phone/SIP dial-in | `spreed/src/components/{ExtendOneToOneDialog,ImportEmailsDialog,CalendarEventsDialog}.vue`, `LeftSidebar/CallPhoneDialog/`, `UIShared/DialpadPanel.vue` |
| Files-surface chat | Talk tab inside Files sidebar; chat + in-call panes for shared nodes; public-share sidebars (discussion on share page; password-auth join) | `spreed/src/{FilesSidebarTabApp.vue,FilesSidebarLoaderApp.vue,PublicShareSidebar.vue,PublicShareSidebarTrigger.vue,PublicShareAuthSidebar.vue,PublicShareAuthForm.vue}`, `main{FilesSidebar,MainPublicShareSidebar…}.js`, `views/{FilesSidebarChatView,FilesSidebarCallView}.vue` |
| Workflow "post to conversation" | Files workflow operator to post uploads into a room | `spreed/src/flow.js`, `views/FlowPostToConversation.vue` |

### Zimbra IM (zd-full — zm-web-client has no IM)

| Screen/page | What it is | Key files |
| --- | --- | --- |
| IM app | Roster app with presence menu + ops (new chat, new roster item/group, gateway login, block buddy) | `zd-full/ZimbraWebClient/WebRoot/js/zimbraMail/im/ZmImApp.js` |
| Roster & chats | Buddy list overview + one-click chat widget windows; group chats/conference rooms; IM taskbar | `zd-full/ZimbraWebClient/WebRoot/js/zimbraMail/im/view/{ZmImOverview,ZmChatWidget}.js`, `im/view/popup/*.js`, `im/controller/*`, `im/model/{ZmRoster,ZmChat,ZmConferenceRoom}.js` |
| Presence & gateways | Presence model (§5), XMPP gateway controls, privacy list | `zd-full/ZimbraWebClient/WebRoot/js/zimbraMail/im/model/{ZmImService,ZmZimbraImService,ZmImGateway,ZmImPrivacyList,ZmRosterPresence}.js`, `im/view/prefs/ZmImGatewayControl.js` |

### Signal Desktop (Electron/React — pane-mode chat shell)

- Renderer is React (one .dom.tsx file per component); main window = collapsible nav sidebar + left pane + conversation column; the whole left pane is a **mode-switch machine** (inbox/search/compose/archive/find-by-username/phone/choose-members/set-metadata) — the same pane doubles as the search overlay and the compose flow.
- Group of extra chat mods: pinned chats, chat folders, pinned messages, polls, view-once media, disappearing timers, usernames, message requests, stories, stickers; no scheduled/snoozed messages found in this snapshot.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Root shells | App-view switch (installer/standalone-registration/inbox); 3-column inbox with modal/toast layers over any screen | `Signal-Desktop/ts/components/App.dom.tsx`, `Signal-Desktop/ts/components/Inbox.dom.tsx`, `Signal-Desktop/ts/types/app.std.ts`, `Signal-Desktop/ts/components/{GlobalModalContainer,ToastManager}.dom.tsx` |
| Nav sidebar | Collapsible tabs: chats / calls / stories / settings + profile avatar | `Signal-Desktop/ts/components/{NavSidebar,NavTabs}.dom.tsx`, `Signal-Desktop/ts/types/Nav.std.ts` |
| Left pane modes | Mode-switched pane: inbox, search overlay (contacts+groups+messages), compose, archive, find-by-username/phone, choose-group-members, set-group-metadata | `Signal-Desktop/ts/components/LeftPane.dom.tsx`, `Signal-Desktop/ts/components/leftPane/*`, `Signal-Desktop/ts/types/leftPane.std.ts` |
| Global search overlay | Contacts + groups + messages results under the search input | `Signal-Desktop/ts/components/leftPane/LeftPaneSearchHelper.dom.tsx`, `Signal-Desktop/ts/components/conversationList/MessageSearchResult.dom.tsx`, `Signal-Desktop/ts/state/ducks/search.preload.ts` |
| Conversation list & folders | Rows with preview/unread/mention badges, pinned chats, chat-folder filter chips, row context menu, archive view, full-width banners | `Signal-Desktop/ts/components/conversationList/{ConversationListItem,GroupListItem,ContactListItem}.dom.tsx`, `Signal-Desktop/ts/components/leftPane/{LeftPaneChatFolders,LeftPaneConversationListItemContextMenu,LeftPaneArchiveHelper}.dom.tsx`, `Signal-Desktop/ts/components/LeftPaneBanner.dom.tsx` |
| Conversation view | Header + timeline column: date headers, last-seen marker, jump-down | `Signal-Desktop/ts/components/conversation/{ConversationView,Timeline,TimelineItem,LastSeenIndicator,ScrollDownButton}.dom.tsx` |
| Message bubbles & parts | Body renderer (@mentions, linkify, emoji); image grid/PDF/audio+waveform/lightbox; view-once + link previews + read-more | `Signal-Desktop/ts/components/conversation/{Message,MessageBody,AtMention,Linkify}.dom.tsx`, `{Image,ImageGrid,GIF,Pdf,MessageAudio,Waveform,FileThumbnail,Lightbox}.dom.tsx`, `TapToViewNotAvailableModal.dom.tsx`, `MessageBodyReadMore.dom.tsx` |
| Inline system notices | Timer, safety number, session-refresh (out-of-sync), call-start, profile-change rows in the timeline | `Signal-Desktop/ts/components/conversation/{TimerNotification,SafetyNumberNotification,ChatSessionRefreshedNotification,CallingNotification,ProfileChangeNotification}.dom.tsx` |
| Message interactions | Context menu (reply/react/edit/forward/delete/pin/detail), reaction picker/viewer, multi-select mode, message-detail pane, pinned-messages panel | `Signal-Desktop/ts/components/conversation/{MessageContextMenu,ReactionPicker,ReactionViewer,SelectModeActions,MessageDetail,MessageMetadata}.dom.tsx`, `conversation/pinned-messages/*` |
| Typing & message requests | Typing-bubble animation; accept/block/report-spam chips for unknown senders | `Signal-Desktop/ts/components/conversation/{TypingBubble,TypingAnimation,MessageRequestActions,MessageRequestActionsConfirmation}.dom.tsx` |
| Composer | Quill rich input (_mentions/emoji); unified emoji/GIF/sticker picker; staged attachments + pre-send image editor + quality; voice memo with waveform + speed; poll creation; disappearing-timer select in header | `Signal-Desktop/ts/components/{CompositionArea,CompositionInput,CompositionUpload,MediaEditor,MediaQualitySelector,CompositionRecording,CompositionRecordingDraft,MiniPlayer,PollCreateModal,DisappearingTimerSelect}.dom.tsx`, `Signal-Desktop/ts/components/fun/FunPicker.dom.tsx` (only the needed flags enabled) |
| Details pane & media tabs | Right-side details stack (profile header, actions, notification settings) + media gallery tabs (media/documents/voice/links) | `Signal-Desktop/ts/types/Panels.std.ts` (typed push/pop panel stack), `Signal-Desktop/ts/components/conversation/conversation-details/*`, `conversation/media-gallery/{MediaGallery,AttachmentSection}.dom.tsx` |
| Group admin & contact screens | Group create/edit/permission/link-management/pending-invite screens; contact modal; safety-number viewer; nickname+note editor | `Signal-Desktop/ts/components/conversation/conversation-details/{EditConversationAttributesModal,AddGroupMembersModal,GroupLinkManagement,GroupV2Permissions,PendingInvites}.dom.tsx`, `Signal-Desktop/ts/components/conversation/{ContactModal}.dom.tsx`, `Signal-Desktop/ts/components/{SafetyNumberViewer,EditNicknameAndNoteModal}.dom.tsx` |
| New chat flows | Compose modes: find-by-username/phone, choose members, group title/description | `Signal-Desktop/ts/components/leftPane/{LeftPaneComposeHelper,LeftPaneFindByUsernameHelper,LeftPaneFindByPhoneNumberHelper,LeftPaneChooseGroupMembersHelper,LeftPaneSetGroupMetadataHelper}.dom.tsx` |
| Stories & stickers | Stories tab/viewer/creator/send modal; sticker-pack creator as its own window | `Signal-Desktop/ts/components/{StoriesTab,StoryViewer,StoryCreator,SendStoryModal}.dom.tsx`, `Signal-Desktop/ts/windows/sticker-creator/` |

### Odoo Discuss (`odoo/addons/mail`)

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Discuss app | Full-page channels, direct messages and inbox (messages that mention or are addressed to me), with starred and history | `odoo/addons/mail/static/src/core/public_web/discuss_app/`, `odoo/addons/mail/static/src/core/web/discuss_app/` |
| Chat windows and chat hub | Floating chat windows opened from the messaging menu, collapsed into bubbles in a hub that survives navigation | `odoo/addons/mail/static/src/core/common/{chat_window,chat_hub,chat_bubble}.js` |
| Composer | Mentions, canned responses, emoji/GIF picker, voice messages, polls, attachments | `odoo/addons/mail/static/src/core/common/{composer,canned_response_model,create_poll_dialog}.js`, `odoo/addons/mail/static/src/discuss/{gif_picker,voice_message,typing}/` |
| Presence | Online/away/offline status on avatars and a status drop-down | `odoo/addons/mail/static/src/core/common/{im_status,im_status_dropdown,im_status_service}.js` |
| Calls | Voice/video calls in a channel: participant cards and video, call menu in the header, invitations, blur | `odoo/addons/mail/static/src/discuss/call/common/{call,call_menu,call_invitations,call_participant_card,call_participant_video}.js` |

**BOSS implications.** A synchronous header chat panel maps to Talk's LeftSidebar (rooms w/ unread + search) and Zimbra's chat-widget popup (1:1 rooms in own window). The *message→task/card conversion* and per-message actions bar are the "everything is a record" glue. Talk is also the presence reference: signaling session state, typing indicators, away/DND, live participants. Odoo Discuss is the one reference where chat lives inside a business suite: chat windows collapse to a hub that stays across screens, and the same Chatter thread model carries record messages and channel messages, as BOSS plans with `CommunicationEvent`. Signal adds the trade reference for pure-messaging polish: its left-pane-as-mode-machine suggests a BOSS chat drawer/search/compose could be one pane with modes (not separate screens), and its typed panel stack (`Panels.std.ts`) is the cleanest known UI contract for pushing contact/group/media drawers.

---

## 7. Calls & video meetings

### Nextcloud Talk

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Call view | Grid or promoted-speaker call; wake lock; active speaker tracking | `spreed/src/components/CallView/CallView.vue`, `CallView/Grid/*.vue`, `CallView/shared/*.vue`, `spreed/src/components/CallView/{useActiveSpeakers,useWakeLock}.ts` |
| Call grid & tiles | Paged video wall, per-participant tiles, presenter/screen-share/local overlay | `spreed/src/components/CallView/Grid/{VideosGrid,SpeakersGrid}.vue`, `shared/{VideoVue,LocalVideo,PresenterOverlay,ScreenShare,ViewerOverlayCallView,ReactionToaster}.vue` |
| **Floating call overlay** | Standalone draggable mini call window (live-call header panel analog); launches from a direct-call link interception and creates 1:1 room | `spreed/src/FloatingCallOverlay.vue`, `mainFloatingCall.ts`, `mainFloatingCallTrigger.ts`, `composables/useDraggableBounded.ts` |
| Call chrome | Call time, media controls, reaction menu, tasks counter, bottom bar + leave/fail dialogs | `spreed/src/components/TopBar/{CallTime,TopBarMediaControls,ReactionMenu,TasksCounter}.vue`, `CallView/BottomBar.vue`, `CallFailedDialog.vue`, `CallEndLeaveButton.vue` |
| Pre-join & AV devices | Media settings modal: device selector, speaker test, background blur/editor, advanced audio, recording consent | `spreed/src/components/MediaSettings/{MediaSettings,MediaDevicesSelector,MediaDevicesSpeakerTest,VideoBackgroundEditor,AdvancedAudioDialog}.vue` |
| Breakout rooms | Editor + per-room items + in-call actions + message dialog | `spreed/src/components/BreakoutRoomsEditor/*.vue`, `RightSidebar/BreakoutRooms/*.vue`, `ConversationSettings/BreakoutRoomsSettings.vue`, `stores/breakoutRooms.ts` |
| Recording UI | Headless recorder route (renders muted call view for server recorder); real recorder in separate repo | `spreed/src/{RecordingApp.vue,mainRecording.js}`, `views/FilesSidebarCallView.vue` (embedded call), `templates/recording.php`, the recording server is the separate `nextcloud-talk-recording/` repo in the bundle |
| Live transcription | In-call transcript stream + settings (admin/room/personal) | `spreed/src/components/CallView/shared/{LiveTranscriptionRenderer,TranscriptBlock}.vue`, `components/ConversationSettings/LiveTranscriptionSettings.vue`, `spreed/src/services/liveTranscriptionService.ts`, `stores/liveTranscription.ts` |
| Meeting scheduling | Schedule-meeting dialog from conversation; small event chip display; upcoming-meetings feed (§4) | `spreed/src/components/CalendarEventsDialog.vue`, `UIShared/{CalendarEventSmall,ScheduledDateTime}.vue`, `services/groupwareService.ts` |
| Talk Desktop (Electron) | Desktop client for Talk: separate incoming-call window (callbox), title bar with user status, desktop notifications service | `talk-desktop/src/callbox/callbox.window.ts`, `talk-desktop/src/talk/renderer/{TitleBar/TitleBar.vue,UserStatus/,notifications/notifications.service.js}` |

### Zimbra voice (zm-web-client)

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Voice app | Voicemail + call-history app: phone list, call features, callers; ops call-back / mark-heard / reply-by-email / download / NEW_CALL | `zm-web-client/WebRoot/js/zimbraMail/voicemail/{ZmVoiceApp.js}` + `voicemail/controller/{ZmCallListController,ZmVoicemailListController,ZmVoiceTreeController}.js`, `voicemail/model/{ZmPhone,ZmCallFeature,ZmCall,ZmCallingParty,ZmVoicemail}.js`, `voicemail/view/{ZmCallListView,ZmVoicemailListView,ZmMP3VoicemailListView,ZmFlashAudioPlayer,ZmSoundPlayer}.js`, `templates/voicemail/Voicemail.template` |

### Frappe meet (suite)

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Meet layout & home | Start/join home + upcoming-meetings grid + group tile | `suite/frontend/src/apps/meet/pages/{MeetLayout,Home}.vue`, `components/{UpcomingMeetings,GroupTile}.vue` |
| Meeting page | Pre-call preview, lobby, layout grid, toolbar; SFU client | `suite/frontend/src/apps/meet/pages/Meeting.vue`, `components/{MeetingLayout,ParticipantTile,MeetingToolbar,LobbyOverlay,JoinRequestNotifications,RecordingPreflightDialog}.vue`, `utils/SFUClient.ts` |
| Side panels | Slide-in participant/chat panels from toolbar; polls and captions | `suite/frontend/src/apps/meet/components/{ChatPanel,PeoplePanel,FloatingReactions,CaptionOverlay}.vue`, `CreatePollModal.vue` |

### Signal Desktop — calls

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Calls tab & lobby | Call-history list + "New call" + call-link panel; per-call lobby (participant info, device/permission setup, join) | `Signal-Desktop/ts/components/{CallsTab,CallsList,CallsNewCallButton}.dom.tsx`, `Signal-Desktop/ts/components/{CallingLobby,CallingPreCallInfo,CallingDeviceSelection,MediaPermissionsModal,CallNeedPermissionScreen}.dom.tsx` |
| Call screen & grid | Full-screen call: header, 1:1 + group participant grids, controls; group extras (overflow area, participant count, raised hands, participant menu, reaction burst) | `Signal-Desktop/ts/components/{CallScreen,CallManager,CallingHeader,GroupCallRemoteParticipants,DirectCallRemoteParticipant}.dom.tsx`, `{GroupCallOverflowArea,CallParticipantCount,CallingRaisedHandsList,CallingParticipantMenu,CallReactionBurst}.dom.tsx` |
| Incoming & floating surfaces | Global incoming-call bar; picture-in-picture window; screen-share picker; background blur | `Signal-Desktop/ts/components/{IncomingCallBar,CallingPip,CallingSelectPresentingSourcesModal,CallBackgroundBlur}.dom.tsx` |
| Call links (meetings) | Create/edit/name call links, details screen, pending participants, leave-confirm | `Signal-Desktop/ts/components/{CallLinkDetails,CallLinkAddNameModal,CallLinkEditModal,CallLinkPendingParticipantModal}.dom.tsx`, `Signal-Desktop/ts/types/CallLink.std.ts` |
| Quality & diagnostics | Post-call quality survey + dedicated diagnostic window | `Signal-Desktop/ts/components/{CallQualitySurveyDialog,CallDiagnosticWindow}.dom.tsx` |
| RingRTC hooks | Calling glue isolated in `Signal-Desktop/ts/calling/`; `CallManager` drives `CallScreen`; npm dependency @signalapp/ringrtc | `Signal-Desktop/package.json`, `Signal-Desktop/ts/calling/`, `Signal-Desktop/ts/components/CallManager.dom.tsx` |

**BOSS implications.** Talk covers virtually every WebRTC call screen BOSS would need: grid views, tile chrome, media consent popup, breakouts, the headless recorder route, the floating mini-window. The header model in initial-design ("live call mini-window persists over navigation") is literally implemented by the floating-call overlay + its route interception. Talk's recording route is the runner for a server-side recorder; Frappe Meet shows the slide-in people/chat panel pattern for a smaller implementation. Signal Desktop adds the consumer-grade completeness list (lobby → call screen → incoming bar → PiP → diagnostics) and the **call-link** concept as the "meeting front door"; if BOSS adopts `ringrtc`, its Desktop wiring (`ts/calling/` + `CallManager`) is the integration template.

---

## 8. Email (Comms)

### Nextcloud mail (`mail/src/`)

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Route model | All routes (`/`, `mailto`, `/box/:id(?filters)`, `/box/…/thread/:id(/draft)`, `/outbox`, `/setup`) render `mail/src/views/Home.vue` — the "screens" are swapped panes + URL state | `mail/src/router.js`, `views/{Home,Setup}.vue`, `init.js` |
| Home shell | Navigation + mailbox/thread list + reading pane composer host | `mail/src/components/{Navigation,Mailbox,MailboxThread,Thread}.vue`, `components/Outbox.vue` |
| Left navigation | Accounts, mailboxes with counts, outbox link, search box, settings gear | `mail/src/components/{Navigation,NavigationAccount,NavigationMailbox,NavigationOutbox}.vue` |
| Envelope list | Per-mailbox list, priority inbox/unified config, virtual rows w/ per-item quick actions, colors, skeletons | `mail/src/components/{Envelope,EnvelopeList,EnvelopePrimaryActions,EnvelopeSingleClickActions,MenuEnvelope,EmptyMailbox}.vue`, `util/AccountColor.js`, `util/priorityInbox.js` |
| Thread & message reading | Thread detail; per-message collapsible blocks + actions (reply, snooze, move, tags, read receipts) | `mail/src/components/{Thread,MailboxThread,ThreadEnvelope}.vue` |
| Message body & warnings | Message view: headers, HTML/plain/smime/pgp bodies, attachments, iMIP, itinerary, phishing/fake screenshots warnings | `mail/src/components/{Message,MessageHTMLBody,MessagePlainTextBody,MessageEncryptedBody,MessageAttachments}.vue`, `components/MessageAttachment…`, `components/{Imip,Itinerary,MdnRequest}.vue` |
| Composer | 2k-line composer modal: recipient autocompletion, identity/alias picker, SMIME sign/encrypt, scheduled send, attachment upload + attach from Files, drafts | `mail/src/components/Composer.vue`, `{NewMessageModal,ComposerSessionIndicator,ComposerAttachment*}.vue`, `components/TextEditor.vue` + `mail/src/ckeditor/*`, `service/{DraftService,OutboxService,AttachmentService,FileService,AutocompleteService}.js` |
| Outbox | Queued + scheduled sends w/ retry + content view | `mail/src/components/{Outbox,OutboxMessageContent,OutboxMessageListItem}.vue`, `store/outboxStore.js` |
| Account setup wizard | Manual/OAuth add-account flows | `mail/src/views/Setup.vue`, `components/AccountForm.vue`, `main-oauth-popup.js` → `views/OauthDone.vue`, `templates/oauth_done.php` |
| User settings dialog | Sections: account (name/aliases/signature/defaults/editor), sieve filters (editor + rule builder), out-of-office, calendar (iMIP handling), SMIME certs, trash retention, search settings, quick actions, trusted senders, text blocks (shared templates), keyboard shortcuts, internal-address book, delegation (sendAs), contextChat opt-in | `mail/src/components/AppSettingsMenu.vue` + `components/{AccountSettings,AliasSettings,SignatureSettings,EditorSettings,AccountDefaultsSettings,SieveAccountForm,SieveFilterForm,OutOfOfficeForm,CalendarSettings,CertificateSettings,TrashRetentionSettings,SearchSettings,quickActions/*,TrustedSenders,textBlocks/*,InternalAddress,DelegationModal}.vue`, `service/{SieveService,OutOfOfficeService,QuickActionsService,TextBlockService,InternalAddressService,DelegationService,SmimeCertificateService}.js` |
| Admin settings | Mail admin mount: provisioning, Gmail/MS OAuth, anti-spam | `mail/src/main-settings.js`, `components/settings/{AdminSettings,ProvisioningSettings,ProvisionPreview,GmailAdminOauthSettings,MicrosoftAdminOauthSettings,AntiSpamSettings}.vue`, `templates/settings-admin.php` |
| Search UI | In-nav search + advanced search modal + per-field priority settings | `mail/src/components/Navigation.vue`, `components/SearchMessages.vue`, `components/SearchSettings.vue`, `service/{ListService,MessageService}.js` |
| Tags / snooze / threading | Tag CRUD modal, snooze/un-snooze, thread grouping utils | `mail/src/components/{TagModal,TagItem,DeleteTagModal}.vue`, `service/MessageService.js`, `util/groupedEnvelopes.js` |
| Contact integration | Hover in mail, contact-details panel beside sender, internal/external distinction, add-to-contacts | `mail/src/components/DisplayContactDetails.vue`, `service/ContactIntegrationService.js`, `lib/Controller/ContactIntegrationController.php` |
| Calendar/iMIP integration | iMIP RSVP + delegated calendar picker, CalDAV client, itinerary import | `mail/src/components/Imip*.vue`, `service/caldavService.js`, `dav/client.js`, `util/{calendar,calendarColor,eventAttendee}.js`, `itinerary/*` |
| Files integration | Attach from Files (file picker, DAV prop), send-as-attachment, deep links for notifications/outbox | `mail/src/util/filePicker.js`, `service/FileSharingService.js`, `registerDavProperty` in `main.js`, `lib/Controller/DeepLinkController.php` |
| AI hooks | Thread summary, smart replies, translate, follow-up reminders, AI icons, SmartPicker in editor, ContextChat indexing | `mail/src/components/{ThreadSummary,TranslationModal}.vue`, `service/{AiIntergrationsService,translationService,FollowUpService}.js`, `lib/ContextChat/ContextChatProvider.php`, `mail/src/ckeditor/smartpicker/*` |
| Encryption | Mailvelope PGP integration for read/compose | `mail/src/components/MailvelopeEditor.vue`, `mail/src/crypto/pgp.js` |

### Zimbra mail (zm-web-client)

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Mail app core | App registration (settings/prefs/ops), badge handling, search wiring, vacation handling | `zm-web-client/WebRoot/js/zimbraMail/mail/ZmMailApp.js` |
| List models & views | Conversation list, message list, double-pane reading (`ZmTradView`), split container; grouped by time/from/priority/size | `zm-web-client/WebRoot/js/zimbraMail/mail/controller/{ZmConvListController,ZmMailListController,ZmDoublePaneController}.js`, `mail/view/{ZmConvListView,ZmMailMsgListView,ZmDoublePaneView,ZmTradView}.js`, `mail/model/{ZmConv,ZmMailMsg,ZmMailListGroup…}.js`, `mail/view/{ZmConvView2,ZmMailMsgView}.js` |
| Reading view | Full message detail: headers, info bars, per-attachment chips, remote-image blocked bar, tag row, reply/forward toolbar | `zm-web-client/WebRoot/js/zimbraMail/mail/view/ZmMailMsgView.js`, `templates/mail/Message.template` (MessageHeader/SentBy/InviteHeader/InformationBar/MessageListHeader blocks) |
| Compose | Compose form (detachable to window), embedded images/inline objects, auto-save, send-later | `zm-web-client/WebRoot/js/zimbraMail/mail/view/ZmComposeView.js` (+ `ZmHiddenComposeView`), `mail/controller/ZmComposeController.js` (send/save/attach/format/spell ops) |
| Recipients & editor | Address rows + autocomplete, rich editor (TinyMCE/Ck? wrapper), html-lite editor, spell check | `zm-web-client/WebRoot/js/zimbraMail/mail/view/ZmRecipients.js`, `share/view/htmlEditor/{ZmHtmlEditor,ZmLiteHtmlEditor,ZmSpellChecker}.js`, `share/view/{ZmAutocompleteListView,ZmAddressInputField}.js` |
| Attach & upload | Attach dialog (upload + briefcase picker), upload progress, forward-as-attachment | `zm-web-client/WebRoot/js/zimbraMail/share/view/dialog/{ZmAttachDialog,ZmUploadDialog}.js`, `share/view/dialog/ZmUploadConflictDialog.js`, `share/ZmUploadManager.js`, `templates/mail/Message.template#ForwardAttachments/#UploadProgressContainer` |
| Send confirm | Send-mail confirmation + add-missing-contacts rows; vacation reminder | `zm-web-client/WebRoot/js/zimbraMail/mail/controller/ZmMailConfirmController.js`, `mail/view/ZmMailConfirmView.js`, `templates/mail/Message.template#ZmMailConfirmView*` |
| Folder/tag management shared | Folder/tag/search-folder models + tree controllers, new/rename/pick dialogs, folder props (retention/notify/sharing) | `zm-web-client/WebRoot/js/zimbraMail/share/model/{ZmFolder,ZmFolderTree,ZmMountpoint,ZmTag,ZmTagTree,ZmSearchFolder,ZmAccessControlList}.js`, `share/controller/{ZmFolderTreeController,ZmTagTreeController}.js`, `share/view/dialog/{ZmNewOrganizerDialog,ZmNewTagDialog,ZmPickTagDialog,ZmChooseFolderDialog,ZmFolderPropsDialog,ZmFolderNotifyDialog,ZmFolderRetentionView}.js`, mail override `mail/controller/ZmMailFolderTreeController.js` |
| Sharing surfaces | Share-props + accept/decline/revoke dialogs (folder/calendar/briefcase/notebook) + share-reply + "sharing" pref page | `zm-web-client/WebRoot/js/zimbraMail/share/view/dialog/{ZmSharePropsDialog,ZmAcceptShareDialog,ZmDeclineShareDialog,ZmRevokeShareDialog,ZmShareSearchDialog}.js`, `share/view/{ZmShareReply,ZmShareTreeView}.js`, `prefs/view/ZmSharingPage.js` |
| Search surface | Search toolbar + dedicated search app results + refined panel + saved searches (§2) | see §2 rows; entry `ZmMailApp._setupSearchToolbar` |
| Distinctive actions | Redirect dialog, source view (server-rendered window), delivery/read receipt, spam, mute conv, forward-conv | `zm-web-client/WebRoot/js/zimbraMail/mail/view/ZmMailRedirectDialog.js` + template, `mail/controller/ZmMailListController.js` (`_showMsgSource` "SHOW_ORIG"), `mail/model/ZmMailMsg.js` (`sendReadReceipt`) |
| Template file | Single 700-line Mail.template listing all compose/read/confirm/redirect/invite templates | `zm-web-client/WebRoot/templates/mail/Message.template` |

### Frappe suite mail

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Mail layout + sidebar | Collapsible mailbox rail w/ drag-to-move threads; phone bottom-nav + folder sheet | `suite/frontend/src/apps/mail/components/AppSidebar.vue`, `components/mobile/{MobileTabBar,MobileFolderSheet}.vue`, `pages/MailLayout.vue` |
| Inbox / thread screens | AllInboxes combined, per-mailbox view w/ thread pane, split-view toggle | `suite/frontend/src/apps/mail/pages/{AllInboxesView,MailboxView}.vue`, `components/{DefaultLayout,ThreadPane,MailThread,MailDetails,ThreadHeader,MailThreadSkeleton,MailListItem,MailListToolbar,SplitViewToggle}.vue` |
| Compose | Bottom/side dock + full-page compose + rich editor + toolbar; compose store | `suite/frontend/src/apps/mail/components/{ComposeDock,ComposeMailEditor,ComposeMailToolbar}.vue`, `pages/ComposeView.vue` |
| Outbox | Send queue with filters + submission details + delivery-status banner | `suite/frontend/src/apps/mail/pages/{OutboxView,SubmissionDetailsView}.vue`, `components/{OutboxFilters,DeliveryStatusBanner}.vue` |
| Screener | Sieve "screened senders" allow/deny inbox screen | `suite/frontend/src/apps/mail/pages/ScreenerView.vue` |
| Contacts views | Contacts / addressbooks / single-contact screens inside mail app | `suite/frontend/src/apps/mail/pages/{ContactsView,ContactView,AddressBookView,AddressBooksView}.vue` |
| Mail admin | Admin dashboard: accounts, domains, users, groups, mailing lists, invites + DMARC-ish "mail exchange" reports | `suite/frontend/src/apps/mail/pages/dashboard/*.vue`, `pages/MailExchangeView.vue`, `components/Settings/*` |
| Exchange flows | Mail/Calendar/Contacts sync-account ("exchange") views | `suite/frontend/src/apps/mail/pages/{MailExchangesView,CalendarExchangesView,ContactsExchangesView,CalendarExchangeView}.vue` |
| Mail backend | The mail app talks JMAP to a mail server (`jmap_configured` flag); the Frappe bundle also holds a Stalwart server checkout (IMAP/JMAP/SMTP/CalDAV/CardDAV/WebDAV) | `suite/frontend/src/apps/mail/constants.ts`, `stalwart/README.md` |

**BOSS implications.** Email screens split naturally into: left rail (accounts/folders + counts) → list+reading-pane modes (Zimbra's three pane layouts vs NC's responsive split) ⇒ thread → message with attachments/iMIP → composer modal/dock incl. schedule & snooze → filter rules/sieve + OOO → outbox. All three render the same "message + attachments + shared-with" surface, which doubles well as the internal `CommunicationEvent` inbox view initial-design wants. Truly notable extras: mail→sieve allowed-denials screener (Frappe), delegation (sendAs), text blocks (shared canned replies), mail file-attach from drive, deep-link notification routes.

---

## 9. Calendar (Commons)

### Nextcloud calendar (`calendar/src/`)

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Routes & access modes | `/:view/:firstDay` (main, view = day/week/month/year/list), `/p/:tokens…` public, `/embed/:tokens…` embedded, plus editor child routes (`/new|edit/popover|full`), booking/proposal deep links, legacy `/edit/:object` | `calendar/src/router.js`, `calendar/appinfo/routes.php`, `lib/Controller/PublicViewController.php` |
| Main shell | Content + left nav (calendar list w/ share/edit, appointments, trash, settings) + grid + unscheduled-tasks sidebar + editor routes; live sync (notify_push) | `calendar/src/views/Calendar.vue`, `components/AppNavigation/{CalendarList,AppointmentConfigList,Settings}.vue`, `AppNavigation/CalendarList/Trashbin.vue` |
| Grid & view modes | FullCalendar host + header view switcher with hotkeys; empty state | `calendar/src/components/{CalendarGrid,EmptyCalendar}.vue`, `components/AppNavigation/AppNavigationHeader/AppNavigationHeaderViewMenu.vue` |
| Event editors | Quick new-event dialog; popover ("simple") editor; full-page detailed editor (details/attendees/alarms/resources/attachments) | `calendar/src/views/{NewEventDialog,EditSimple,EditFull}.vue`, `components/Editor/{Properties/*,DurationSelector,SaveButtons,AddTalkModal}.vue` |
| Free/busy | Availability modal w/ room/resource check + suggested slots; room-availability modal; calendar-block sources; free-busy services; shows from contacts menu too | `calendar/src/components/Editor/FreeBusy/{FreeBusy,RoomAvailabilityModal}.vue`, `fullcalendar/eventSources/freeBusy*.js`, `services/freeBusyService.js`, `services/freeBusySlotService.js`, `calendar/src/views/ContactsMenuAvailability.vue` |
| Recurrence & alarms | RRULE editor + exceptions warnings; VALARM/reminder rows | `calendar/src/components/Editor/Repeat/*.vue`, `calendar/src/components/Editor/Alarm/*.vue` + `models/alarm.js` |
| Attendees & invites | Invitation-response buttons (accept/decline) + responses hints; invitees list/search/org; contact search via server autocomplete | `calendar/src/components/Editor/Invitees/*.vue`, `InvitationResponseButtons.vue`, `lib/Controller/ContactController.php` |
| Shared calendars | Edit-calendar modal: publish (public link + share-mail), internal link, sharees with ACLs; calendar trash; rooms/resources scheduling list | `calendar/src/components/AppNavigation/{EditCalendarModal,EditCalendarModal/*,CalendarList/*}` + `store/principals.js`, `components/Editor/Resources/*.vue` |
| Appointment booking | Booking-overview + public booking page + confirmation (per "appointment config"), config modal w/ Talk room, DB-backed slots | `calendar/src/appointments/main-{overview,booking,confirmation}.js`, `calendar/src/views/Appointments/*.vue`, `components/Appointments/*.vue`, `lib/Controller/{Appointment,Booking}Controller.php`, `templates/appointments/*.php` |
| Meeting proposals | Multiple date proposals + vote matrix shared to attendees | `calendar/src/views/Proposal/*.vue`, `components/Proposal/*.vue`, `lib/Controller/{Proposal,ProposalPublic}Controller.php`, `lib/Db/Proposal*.php` |
| Availability / profile | Weekly availability published to profile settings + used in booking modal (`calendar-availability-vue` component) | `calendar-availability-vue/src/{index.js,CalendarAvailability.vue,convert.js}`, `server/apps/dav/src/views/UserAvailability.vue` + `components/AvailabilityForm.vue`, `calendar/src/components/AppointmentConfigModal.vue` |
| Settings | Calendar settings (timezone, appearance, delegation, import) | `calendar/src/components/AppNavigation/Settings.vue` + `Settings/*.vue` |
| iCal / guests | Subscribable external calendars; guest visits; publish/subscribe | `calendar/src/components/AppNavigation/EditCalendarModal/*` |
| Widget | Calendar reference widget (workspace/panel mounts) | `calendar/src/reference.js`, `store/widget.js` |

### Zimbra calendar

| Screen/page | What it is | Key files |
| --- | --- | --- |
| App core & views | Day/work-week/week/month/list + schedule ("free-busy") view factory | `zm-web-client/WebRoot/js/zimbraMail/calendar/ZmCalendarApp.js`, `view/ZmCalViewMgr.js`, `view/{ZmCalDayView,ZmCalWeekView,ZmCalColView,ZmCalMonthView,ZmCalListView,ZmCalScheduleView}.js`, `model/{ZmAppt,ZmApptList,ZmCalendar,ZmCalBaseItem,ZmRecurrence}.js` |
| Appointment compose | Full compose/edit (attendees, resources, free/busy), schedule assistant, location/time suggestions, attendee picker, recur choices dialog, notify choice | `zm-web-client/WebRoot/js/zimbraMail/calendar/view/{ZmApptComposeView,ZmCalItemEditView,ZmApptEditView,ZmFreeBusySchedulerView,ZmScheduleAssistantView,ZmTimeSuggestionView,ZmLocationSuggestionView,ZmAttendeePicker,ZmApptRecurDialog,ZmApptNotifyDialog}.js`, `controller/{ZmApptController,ZmCalItemComposeController,ZmApptComposeController}.js`, `templates/calendar/Appointment.template` |
| Quick add | Quick appointment dialog (title/date/venue) + more-details handoff | `zm-web-client/WebRoot/js/zimbraMail/calendar/view/ZmApptQuickAddDialog.js`, `share/view/dialog/ZmQuickAddDialog.js` (extends), `templates/calendar/Calendar.template` |
| Reminders | Reminder dialog w/ snooze; compact single-appointment dialog (§5) | `zm-web-client/WebRoot/js/zimbraMail/calendar/controller/{ZmReminderController,ZmSnoozeBeforeProcessor}.js`, `view/{ZmReminderDialog,ZmQuickReminderDialog}.js` |
| Calendar management | Add/share/rename calendar dialogs, external-iCal subscribe dialog, calendar tree, mini calendar | `zm-web-client/WebRoot/js/zimbraMail/calendar/controller/ZmCalendarTreeController.js`, `view/{ZmNewCalendarDialog,ZmExternalCalendarDialog,ZmMiniCalendar}.js`, `share/view/dialog/{ZmSharePropsDialog,ZmNewOrganizerDialog}.js` |
| Print & prefs | Calendar print dialog (layout/range) + calendar prefs page | `zm-web-client/WebRoot/js/zimbraMail/calendar/view/ZmCalPrintDialog.js`, `controller/ZmCalViewController.js`, `calendar/view/ZmCalendarPrefsPage.js` |
| Templates | Appointment/Calendar template files | `zm-web-client/WebRoot/templates/calendar/{Appointment,Appointment_ar}.template`, `Calendar.template` |

### Frappe suite calendar

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Calendar layout & view | Grid month/week + rail sidebar w/ MiniMonth + UpcomingEvents | `suite/frontend/src/apps/calendar/pages/{CalendarLayout,CalendarView}.vue`, `components/{AppSidebar,MiniMonth,UpcomingEvents,MonthDayCell,DateChip}.vue` |
| Event UI | Right-side event detail pane/popover + alerts list | `suite/frontend/src/apps/calendar/components/{EventDetail,EventPopover,EventAlertList}.vue` |
| Modals & real-time | Create/edit/recurring/settings modals; socket-driven updates | `suite/frontend/src/apps/calendar/components/Modals/*.vue`, `socket.ts`, `apps/calendar/stores/` |

**BOSS implications.** All three share: grid (`day/week/month/(year)/list`) + two editors (popover vs full-page) + shared-calendar mgmt + reminders popups + free/busy scheduling. NC adds the *external-facing* calendar side relevant to facility and equipment schedules: publish link, booking pages, meeting proposals, availability-on-profile (CalDAV untouched). iCal subscribe is a first-class feature (subscribe external feeds). This fits initial-design's decided split: facility and equipment schedules in Commons, their administration in IronStone Maintenance.

---

## 10. Contacts (Commons)

### Nextcloud contacts (`contacts/src/`)

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Routes | `/` + group views (all/recently/not-grouped/system/user-groups/org-chart), `/:group/:contact`, `addressbook(/contact)`, `circle/:id` (teams), `user_group/:id`, `chart/:id`, `import`, `ocm-invites`, `u/:userId` profile redirect | `contacts/src/router/index.js`, `contacts/src/models/constants.ts` |
| Main shell & list | RootNavigation (new/import/actions) + list + details split view; batch ops + merge dialog | `contacts/src/views/Contacts.vue`, `components/AppContent/{ContactsContent,CircleContent,ChartContent}.vue`, `components/ContactsList/{ContactsListItem,Batch,Merging}.vue` |
| Contact details pane | Header avatar (social fetch), name/org/title fields, property rows (mutable pickers per type), group membership, related resources panels (files/talk/calendar/deck) | `contacts/src/components/{ContactDetails,DetailsHeader}.vue`, `components/ContactDetails/ContactDetailsAvatar.vue`, `components/ContactDetails/*`, `components/Properties/*.vue` |
| "New contact" flow | No modal — creates + activates contact inline | `contacts/src/components/ContactDetails.vue` (store dispatch) |
| Teams/circles & members | Circle details + settings/configs; member list with add-member and per-member actions; user-group equivalent listing | `contacts/src/components/{CircleDetails,CircleDetails/*,MemberList/*,UserGroupDetails}.vue` |
| Org chart view | Navigate-able contact graph | `contacts/src/components/{ChartTemplate,OrgChart}.vue`, `utils/chartUtils.js` |
| Import | vCard import flow (pick addressbook + file/Files picker, client-side parse + validate); processing screen | `contacts/src/components/AppNavigation/Settings/SettingsImportContacts.vue`, `services/parseVcf.js`, `views/Processing/ImportView.vue`, `components/ProcessingScreen.vue`, `lib/Controller/ImportController.php`, `services/checks/*` |
| Pickers & sharing | Entity/contacts pickers used by events/mails/shared teams | `contacts/src/components/EntityPicker/*.vue` |
| Integrations | Mount contact-details readonly pane into mail sender hover; contacts-menu provider; files action loader | `contacts/src/oca.ts`, `views/ReadOnlyContactDetails.vue`, `lib/{ContactsMenu/Providers/DetailsProvider,Listener/LoadContactsFilesActions}.php` |
| Settings & data | Addressbook/share/sort settings in nav footer; admin settings; social-avatar provider crons | `contacts/src/components/AppNavigation/{RootNavigation,ContactsSettings}.vue` + `components/AppNavigation/Settings/*.vue`, `lib/Settings/AdminSettings.php`, `lib/Service/Social/*.php` |
| DAV backing | CardDAV/Teams CRUD via cdav stores | `contacts/src/services/cdav.js`, `store/{addressbooks,contacts,groups,circles,principals}.js`, `store/ocminvites.ts` |
| Templates/pages | main.php, admin settings, wayf page | `contacts/templates/{main,settings/admin,wayf}.php` |

### Zimbra address book

| Screen/page | What it is | Key files |
| --- | --- | --- |
| App core | Operations + GAL prefs + virtual dist-list folders | `zm-web-client/WebRoot/js/zimbraMail/abook/ZmContactsApp.js`, `abook/model/{ZmContact,ZmContactList,ZmAddrBook}.js` |
| List & detail views | Contact split view (list + detail cards), sort, search bar, DL member expansion | `zm-web-client/WebRoot/js/zimbraMail/abook/view/{ZmContactsBaseView,ZmContactSplitView}.js`, `abook/controller/{ZmContactListController,ZmContactController}.js` |
| Edit / quick add | Full editor + quick-add dialog | `zm-web-client/WebRoot/js/zimbraMail/abook/view/{ZmEditContactView,ZmContactQuickAddDialog}.js`, `templates/abook/Contacts.template` |
| Groups & dist lists | Group view + member picker + DL properties; contact-group shortcut menu | `zm-web-client/WebRoot/js/zimbraMail/abook/view/{ZmGroupView,ZmContactGroupMenu}.js`, `ZmNewContactGroupDialog.js`, `ZmNewAddrBookDialog.js` |
| GAL & pickers | GAL-aware contact chooser; contact picker dialog reused by compose & scheduling; HAB tree | `zm-web-client/WebRoot/js/zimbraMail/abook/view/{ZmContactSearch,ZmContactPicker}.js`, `controller/ZmHabTreeController.js`, `abook/view/ZmContactsHelper.js` |
| Print | Print contact/book flows | `zm-web-client/WebRoot/js/zimbraMail/abook/controller/ZmContactListController.js`, `ZmContactsApp.js` |

### Frappe suite (mail-side contacts)

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Contact screens | Contacts list + single contact + address books pages | `suite/frontend/src/apps/mail/pages/{ContactsView,ContactView,AddressBookView,AddressBooksView}.vue` |

**BOSS implications.** The details-pane beside the list, *related resources* (files/talk/calendar/deck panels per contact), in-place property editing, and merge are the Commons contact core; org-chart view (NC) and DL groups (Zimbra) round out the record. OCM invites (`ocm-invites` routes + `components/Ocm/*`) show how federated contact invitations fit a self-hosting suite.

---

## 11. Tasks & boards (Commons)

### Nextcloud tasks (`tasks/src/`)

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Shell/nav & routes | Smart collections + per-calendar task lists with counters; drag/drop between them | `tasks/src/App.vue`, `views/AppNavigation.vue`, `components/AppNavigation/*`, `router.js` |
| Smart-collection views | Smart-collection views (all/current/today/week/starred/completed) + calendar view + week view; load-completed button | `tasks/src/views/AppContent/{Collections,Calendar,Week,General}.vue`, `components/LoadCompletedButton.vue` |
| Smart filters | Collection filter switcher in store helper | `tasks/src/store/storeHelper.js` |
| Task rows | Summary/badges/status/checkbox/DnD handle rows; paste-text→task | `tasks/src/components/{TaskBody,TaskStatusDisplay,TaskCheckbox,TaskDragContainer}.vue` |
| List header | Create dropdown + filter chips + sort dropdown | `tasks/src/components/{HeaderBar,FilterDropdown,SortorderDropdown}.vue` |
| Create task | Create dialog + multi-create dialog | `tasks/src/components/{TaskCreateDialog,CreateMultipleTasksDialog}.vue` |
| Task sidebar | Right pane w/ Details tab (status, %, priority slider, location, URL, tags) + Notes tab; modular rows | `tasks/src/views/AppSidebar.vue`, `components/AppSidebar/{TextItem,SliderItem,TagsItem,NotesItem,DateTimePickerItem,MultiselectItem,CheckboxItem,CalendarPicker*}.vue` |
| Reminders/recurrence | Alarm list + relative/absolute pickers; recurrence editor controls | `tasks/src/components/AppSidebar/Alarm/*.vue`, `components/Repeat/Repeat*.vue` |
| Dashboard / Talk / links | Dashboard widget (§4); "create task from Talk" action; deep links to calendar/deck; paste-to-task | `tasks/src/dashboard.js`, `tasks/src/views/Dashboard.vue`, `tasks/src/talk.js`, `tasks/src/views/AppSidebar.vue` (deckLink), `utils/textToTask.js` |
| DAV layer | CalDAV VTODO client | `tasks/src/services/{cdav,requests}.js`, `store/cdav-requests.js` |

### Nextcloud deck (`deck/src/`)

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Routes & overview | `/` overview by due-date buckets; `/board/:id` kanban (+archived/share views); `/board/:id/card/:id(+tab)` opens card sidebar | `deck/src/router.js` |
| Board | Kanban stacks w/ drag reorder + card-add slots; board modes (kanban/gantt); filters/sort/search toolbar | `deck/src/components/board/{Board,Stack,StackCardAdd}.vue`, `components/Controls.vue` |
| Cards | Card item w/ cover/badges/avatars + context menu | `deck/src/components/cards/{CardItem,CardBadges,CardCover,CardMenu}.vue`, `cards/badges/*` |
| Card sidebar | Details / Attachments / Comments / Activity tabs | `deck/src/components/card/{CardSidebar,CardSidebarTabDetails,CardSidebarTabAttachments,CardSidebarTabComments,CardSidebarTabActivity}.vue` |
| Card editors | Description (rich), due/start, assignments, labels, dependencies | `deck/src/components/card/{Description,DueDateSelector,StartDateSelector,AssignmentSelector,TagSelector,DependentCardsSelector}.vue` |
| Attachments | Upload (DnD/clipboard) + list; deck-file sharing picker (share a file to a card) | `deck/src/components/card/AttachmentList.vue`, `components/AttachmentDragAndDrop.vue`, `mixins/attachmentUpload.js`, `deck/src/views/FileSharingPicker.js` |
| Board sidebar | Board manage tabs: share (users/groups/labels/timeline), labels, deleted, timeline | `deck/src/components/board/{BoardSidebar,SharingTabSidebar,TagsTabSidebar,DeletedTabSidebar,TimelineTabSidebar}.vue` |
| Dialogs | Create card/move card/boards/card selector/settings/shortcuts | `deck/src/{CardCreateDialog,CardMoveDialog,CardSelector,BoardSelector}.vue`, `components/{DeckAppSettings,KeyboardShortcuts}.vue` |
| Search | Unified search placeholders/results for cards & boards | `deck/src/components/search/{GlobalSearchResults,Placeholder}.vue` |
| Dashboard & cross-app | Widgets (§4); reference widgets; OCP.Collaboration link types; talk message action; calendar deep links | `deck/src/init-{dashboard,reference,collections,talk,calendar}.js`, `deck/src/views/{Card,Board,Comment}ReferenceWidget.vue`, `FileSharingPicker.js` |

### Zimbra tasks

| Screen/page | What it is | Key files |
| --- | --- | --- |
| App core & views | Tasks app over task-list folders (calendar-typed): list columns sortable; detail view; compose/edit (due, %, priority, reminder); new task-folder dialog | `zm-web-client/WebRoot/js/zimbraMail/tasks/{ZmTasksApp.js}` + `tasks/controller/{ZmTaskListController,ZmTaskController,ZmTaskTreeController}.js`, `tasks/view/{ZmTaskListView,ZmTaskView,ZmTaskMultiView,ZmTaskEditView,ZmNewTaskFolderDialog}.js`, `tasks/model/{ZmTask,ZmTaskFolder,ZmTaskMgr}.js`, `templates/tasks/Tasks.template` |

### Ever Gauzy — task surfaces

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Task pages & widgets | Task table/CRUD, task detail view, sprint table layout; shared task widgets (status/priority/size selects, badges, add-task dialog); OKR goals module | `apps/gauzy/src/app/pages/tasks/`, `packages/ui-core/shared/src/lib/tasks/`, `apps/gauzy/src/app/pages/goals/` |

**BOSS implications.** Tasks are VTODOs over the calendar platform in NC and Zimbra alike — matching the initial-design "task = WorkEffort" choice: one task record surfaces in Tasks (checklist UI), Calendar (unscheduled-task sidebar in NC calendar!), Deck/card-style boards, and Today-panel widgets. The Tasks sidebar (one row component per property) is a candidate template for the task detail pane, a reused screen that Commons includes beside Projects, Customer Service, Sales and People.

---

## 12. Files & drive (Commons)

### Nextcloud files + satellite apps

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Files app shell & routing | Single route `/:view/:fileid` over view objects + many registered "sections" | `server/apps/files/src/{main.ts,FilesApp.vue}`, `router/router.ts`, `views/{FilesNavigation,FilesList,FilesSidebar,SearchEmptyView}.vue` |
| Sections (nav) | All files, personal, favorites (sub-folders), recent, search-results, folder-tree (experimental), + satellites below | `server/apps/files/src/views/{files,personal-files,favorites,recent,search,folderTree}.ts`, `services/Recent.ts` |
| File list components | Virtualized list/grid + sort headers + upload picker + drop service + quota footer + previews/SW | `server/apps/files/src/components/{VirtualList,FilesListVirtual,FilesListTableHeader*}.vue`, `views/FilesList.vue`, `store/uploader.ts`, `services/DropService.ts`, `components/NavigationQuota.vue`, `services/{PreviewService.ts,ServiceWorker.js}` |
| New menu & templates | New-node menu + templates feature (fill-in fields → OCS create) | `server/apps/files/src/newMenu/*.ts`, `services/Templates.js`, `views/TemplatePicker.vue`, `components/TemplateFiller{.vue}` , `lib/Controller/TemplateController.php` |
| File actions | `registerFileAction` set: delete/download/favorite/move-copy/rename/sidebar/openFolder/openInFiles/edit-locally/convert; plus list-header row and context menu composables | `server/apps/files/src/actions/*.ts`, `composables/{useFileActions,useFileListActions}.ts`, `store/{actionsmenu,selection}.ts` |
| List filters | Name/hidden/type/modified chip filters | `server/apps/files/src/filters/*Filter.ts`, `components/FileListFilter/*` |
| Sidebar shell & tabs | Files sidebar with registry-based tabs: sharing, versions, comments, activity, photos, talk (§6), plus "add tags/favorite" sidebar actions; contributing apps load their scripts on the Files `LoadSidebar` event | `server/apps/files/src/views/FilesSidebar.vue`, `sidebar/*`, `files_sharing/src/files-sidebar.ts`, `files_versions/src/{sidebar_tab.ts,views/FilesVersionsSidebarTab.vue}`, `comments/src/{files-sidebar,comments-activity-tab}.ts`, `activity/src/sidebar.ts`, `photos/src/sidebar.ts`, `systemtags/src/files_actions/*.ts`, `files/src/actions/sidebarFavoriteAction.ts` |
| Sharing tab & dialog | Unified share list/link share/expiry/avatar stacks/inherited; incoming/outgoing/links/file-request/deleted/pending shares sections | `server/apps/files_sharing/src/views/{SharingTab,SharingDetailsTab,SharingList,SharingLinkList}.vue`, `components/{UnifiedShare*,SharingEntry*,SharingInput,ShareExpiryTime}.vue`, `files_sharing/src/files_views/shares.ts`, `services/SharingService.ts` |
| Public share pages | Public link SPA with four views incl. file drop + nickname; server base controllers | `server/apps/files_sharing/src/public/{init,router}.ts`, `files_sharing/src/public-nickname-handler.ts`, `src/public/views/{publicShare,publicFileShare,publicFileDrop}.ts`, `views/FilesHeaderNoteToRecipient.vue`, `lib/public/AppFramework/{PublicShare,AuthPublicShare}Controller.php` |
| Share-by-email provider | Email share backend + admin settings UI | `server/apps/sharebymail/lib/ShareByMailProvider.php`, `src/settings-admin.ts` |
| Federated shares | Remote share dialog + admin/personal settings | `server/apps/federatedfilesharing/src/components/{RemoteShareDialog,AdminSettings,PersonalSettings}.vue` |
| External storages | Personal ext-storage section + mount settings tables | `server/apps/files_external/src/init-files.ts`, `components/{ExternalStorageTable,UserMountSettings}.vue`, `views/{FilesExternalSettings,ExternalStoragesSection}.vue` |
| Trash | Trash section + restore + empty-trash actions | `server/apps/files_trashbin/src/files_views/{trashbinView,columns}.ts`, `files_actions/restoreAction.ts`, `files_listActions/emptyTrashAction.ts` |
| Reminders (per file) | DAV reminder props + actions w/ suggested dates + custom picker | `server/apps/files_reminders/src/files-init.ts`, `files_actions/*.ts`, `components/SetCustomReminderModal.vue` |
| Tags | Tag view section + admin tag mgmt + picker/form + files tag filter | `server/apps/systemtags/src/{files_views/systemtagsView.ts,views/*,components/{SystemTags,SystemTagPicker,SystemTagForm}.vue,files_filters/TagsFilter.ts,admin.ts}` |
| Comments | Files comment tab + GET-comments service + unread inline action | `server/apps/comments/src/{files-sidebar,comments-activity-tab,init}.ts`, `services/GetComments.ts`, `actions/inlineUnreadCommentsAction.ts` |
| Viewer | Global preview engine w/ per-mime handlers + viewerAction | `viewer/src/{views/Viewer.vue,components/{Images,Videos,Audios,ImageEditor,Error}.vue,services/Viewer.js,files_actions/viewerAction.ts}` (the standalone `viewer/` repo is current; `server/apps/viewer/src` is a legacy shim) |
| Email viewer | `.eml`/`.msg` preview handler | `files_emailviewer/src/main.js`, `views/EmailView.vue` |
| Photos | Timeline/albums/places/faces/tags views + slideshow/picker/metadata dialogs (gallery reading of same files) | `photos/src/router/index.ts`, `views/{TimelineView,AlbumsView,AlbumContent,FacesView,PlacesView,TagsView,FoldersView}.vue` |
| Reference picker | Insert-file-reference widget (shared into other apps) | `server/apps/files/src/reference-files.ts`, `views/{FileReferencePickerElement,ReferenceFileWidget}.vue` |
| Transfer ownership | Move account data / folder ownership to another user dialog | `server/apps/files/src/components/TransferOwnershipDialogue.vue` |

### Zimbra briefcase

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Briefcase app | Files-in-Zimbra area: latest-files list, version-history list (`VIEW_BRIEFCASE_DETAIL` vs `VIEW_BRIEFCASE_REVISION`), tree of briefcases; detail/icon list views; right-pane preview; upload/version check-in dialogs, version rows | `zm-web-client/WebRoot/js/zimbraMail/briefcase/{ZmBriefcaseApp.js}` + `briefcase/controller/{ZmBriefcaseController,ZmBriefcaseTreeController}.js`, `briefcase/model/{ZmBriefcase,ZmBriefcaseItem,ZmDocletMgr}.js` (`ZmRevisionItem` is defined in `ZmBriefcaseItem.js`)`, `briefcase/view/{ZmDetailListView,ZmBriefcaseIconView,ZmPreviewPaneView}.js`, `briefcase/view/dialog/ZmBriefcaseTabView.js`, `briefcase/view/dialog/{ZmCheckinDialog}.js`, `briefcase/view/ZmNewBriefcaseDialog.js`, `share/view/dialog/ZmUploadDialog.js` + `share/ZmUploadManager.js`, `templates/briefcase/Briefcase.template` |

### Frappe drive (suite)

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Drive layout & pages | Personal home + Favourites/Recents/Trash/Documents/Attachments/Slides list pages | `suite/frontend/src/apps/drive/pages/{DriveLayout,Personal,Favourites,Recents,Trash,Documents}.vue` |
| List/grid renderers | Grid/list toggle, file rows + preview renderers, folder page, breadcrumbs | `suite/frontend/src/apps/drive/components/{GridView,ListView,DriveListRow,EditableBreadcrumbs}.vue`, `pages/{File,Folder}.vue` |
| Navbar & sidebar + upload | Drive navbar w/ search/sort overlays + left sidebar; FileUploader queue + tracker + storage bar | `suite/frontend/src/apps/drive/components/{Navbar,Sidebar,DriveToolBar,FileUploader,UploadTracker,StorageBar}.vue` |
| Dialogs & sharing | New folder/link; share/move/info/rename batch dialogs; access selector | `suite/frontend/src/apps/drive/components/{NewFolderDialog,EntityDialogs}.vue` + `ui/drive/components/{ShareDialog,MoveDialog,InfoDialog,AccessSelect}.vue` |

**BOSS implications.** The whole files area is built on extension registries — exactly the shape the shared-context section of initial-design asks for: the evidence favors a BOSS files screen that hosts the same *tab/action/new-menu/preview-handler* API set so apps (Talk chat tab, Office, PDF preview, email-as-file) all mount inside it. Files templates (fill-in fields → generated doc), public file-drop pages, transfer-ownership, external-storage UIs are feature checklists worth repeating across Commons sharing.

---

## 13. Notes, wiki, knowledge & discussions (Commons)

### Nextcloud text (`text/src/`) — the collaborative editor engine (also used by Files/Notes/Collectives)

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Public API | `OCA.Text.{createEditor,createCollaborativeEditor,createMarkdownContentEditor,createMarkdownContentComparison,createTable}`; fileId+useSession routes to collaborative | `text/src/{editor.ts,createEditor.ts}` |
| Embed harness | Lifecycle/event-bus editor embed (mount/destroy/readOnly states) | `text/src/TextEditorEmbed.ts` |
| Collaborative component | Owns `new Doc()` + Awareness; session provider + Tiptap Collaboration; conflict resolution vs indexedDB | `text/src/components/CollaborativeEditor.vue` (y.Doc + Awareness at L88-89/257) |
| Editor factory/menus | Rich/plain editor builds, all Tiptap nodes/marks; MenuBar/ReadonlyBar; floating buttons with SmartPicker entry | `text/src/{EditorFactory.ts,extensions/RichText.ts,extensions/PlainText.js}`, `components/Menu/{MenuBar,ReadonlyBar}.vue`, `components/Editor/FloatingButtons.vue` |
| **Yjs plumbing** | Yjs state helpers (prosemirror→YXmlFragment seeding); sync service + polling backend + WebSocket polyfill; room id `file:context/id`; outbox queue; sync provider | `text/src/helpers/yjs.ts`, `text/src/helpers/setInitialYjsState.ts`, `text/src/apis/{sync,connect,save}.ts`, `text/src/services/{SyncService,PollingBackend,Outbox,WebSocketPolyfill,y-websocket,SyncServiceProvider}.ts|js` |
| Sessions glue | useSyncService, useSessions, useIndexedDbProvider, useSaveService, useConnection composables | `text/src/composables/{useSyncService,useSessions,useIndexedDbProvider,useSaveService,useConnection}.ts` |
| Save strategy | Collaborative → sync-service save; standalone → DAV PUT | `text/src/services/SaveService.ts`, `apis/save.ts` |
| Editor UX | Link pill bubble, mention/emoji suggestion lists, comment bubbles, callouts/details/TOC nodes, markdown-it preproc (wikiLinks, footnotes, math) | `text/src/components/{Link/LinkBubbleView,Comment/CommentBubbleView}.vue`, `components/Suggestion/{Mention/MentionList,Emoji/EmojiList,LinkPicker/LinkPickerList}.vue`, `extensions/{LinkBubble,LinkPicker,CommentBubble,AnnotationsVisibility}.js|ts`, `markdownit/*`, `nodes/*` |
| Attachments | MediaHandler upload/prompt + attachment src resolver + extract-attachment-srcs plugin | `text/src/components/Editor/{MediaHandler,MediaHandler.provider}.vue|js`, `services/AttachmentResolver.js`, `plugins/extractAttachmentSrcs.ts` |
| Presence | Session avatar list + guest names, colored carets, user colors | `text/src/components/Editor/{SessionList,AvatarWrapper,GuestNameDialog}.vue`, `extensions/CollaborationCaret.ts`, `extensions/{Mention,UserColor}.js` |
| Status | Document/save/sync status chips incl. offline state | `text/src/components/Editor/{DocumentStatus,DocumentStatus/SyncStatus,SessionStatus,OfflineState}.vue` |
| Surfaces | Viewer handler (`text-viewer` custom element), files rich-workspace folder header (folder README editor), direct-editing full page, public share, text files-settings section | `text/src/viewer.js`, `init.js`, `helpers/files.js`, `views/{RichWorkspace,DirectEditing}.vue`, `text/src/public.ts` |
| Deps | `yjs ^13.6.33`, `y-protocols`, `y-prosemirror ^1.3.7`, `y-indexeddb`, `@tiptap/* 3.31.4` (incl. extension-collaboration/caret) | `text/package.json` |

### Nextcloud notes (`notes/src/`)

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Shell & routes | Categories left nav + note split view; `welcome` + `note/:id` | `notes/src/App.vue`, `router.js`, `components/NotesView.vue` |
| Note modes | Display-mode editors (rich/plain/preview; rich via `OCA.Text.createEditor`, plain/preview with EasyMDE/markdown-it fallback) | `notes/src/components/{Note,NoteRich,NotePlain}.vue`, `components/Editor{EasyMDE,MarkdownIt,Plain}.vue` |
| Categories list | Folder-like categories with counts | `notes/src/components/CategoriesList.vue` |
| Note sidebar | Notes' own sidebar hosting files-registered tabs by allow-list (sharing, versions) | `notes/src/components/NoteSidebar.vue`, `notes/src/sidebarTabs.js` |
| Settings & widgets | Display-mode settings (rich/plain/preview), notes-folder picker, shortcuts; dashboard widget; templates | `notes/src/components/AppSettings.vue`, `dashboard.js` → `components/Dashboard.vue`, `TemplateService.js`, `components/TemplatePicker.vue` |
| Sync | Conflict-cache store + note service | `notes/src/stores/sync.js`, `NotesService.js` |

### Nextcloud collectives (`collectives/src/`) — wiki/knowledge base

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Routes | Home (collectives list), `/:slug-colId/:page` page view w/ nested routes, `/p/:token` public share pages, `/_/print` print view | `collectives/src/router.js`, `views/{HomeView,CollectiveView,CollectivePrintView}.vue` |
| Page tree | Nested sub-pages, drag reorder, favorites, trash, new page dialog | `collectives/src/components/PageList/*.vue` |
| Page editor | TextEditor mounts read module or `OCA.Text.createEditor` (collab editing provided by text app) | `collectives/src/components/Page/TextEditor.vue`, `composables/{useEditor,useReader}.ts` |
| Stores | pages/outline/collectives/members/sessions(share tokens)/versions/tags/templates | `collectives/src/stores/{pages,collectives,circles,sessions,versions,tags,templates}.js` |
| Members & settings | Collective members modal + member picker; collective-settings dialog (name/emoji/share mode) | `collectives/src/components/Nav/{CollectiveMembersModal,CollectiveSettings}.vue`, `components/Member/MemberPicker.vue` |
| Page sidebar tabs | Share / versions (compare) / attachments / backlinks | `collectives/src/components/PageSidebar/{SidebarTabSharing,SidebarTabVersions,SidebarTabAttachments,SidebarTabBacklinks}.vue` |
| Templates & search extras | Templates collective/dialog; reference widget; files-header for collective folders; admin settings | `collectives/src/components/Nav/TemplatesDialog.vue`, `stores/templates.js`, `reference.ts`, `views/PageReferenceWidget.vue`, `files/FilesCollectiveHeader.ts`, `settings-admin.ts` → `views/AdminSettings.vue` |
| Editor share-able sessions | Session heartbeat for public share edit sessions | `collectives/src/stores/sessions.js` |

### Nextcloud whiteboard (`whiteboard/src/`)

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Runtimes | main.ts picks viewer / public-share / direct-edit / recording | `whiteboard/src/main.ts`, `utils/renderWhiteboardView.tsx` |
| Excalidraw canvas + stores | App state/config/sync/JWT/collab/language zustand stores | `whiteboard/src/stores/{useExcalidrawStore,useSyncStore,useJwtStore,useCollaborationStore,useWhiteboardConfigStore}.ts` |
| Real-time sync | socket.io ↔ collab backend w/ JWT, snapshot fetch, IndexedDB cache, sync web worker | `whiteboard/src/hooks/{useCollaboration,useSync}.ts`, `utils/{fetchWhiteboardSnapshot,syncSceneData,sanitizeAppState}.ts`, `workers/syncWorker.ts`, `database/db.ts`, `types/protocol.ts` |
| In-meeting interactions | Follow user, presentation mode, voting, timer, recording hooks | `whiteboard/src/hooks/{useFollowedUser,usePresentation,useVoting,useTimer,useRecording}.ts` |
| Share & templates | Public sharing + direct-edit; "New whiteboard" files-library picker with org/personal template catalog | `whiteboard/src/files.ts`, `hooks/useLibraryCatalog.ts`, `templates/directEditing.php` |
| AI & settings | Text→diagram assistant dialog; board tagging; admin (collab-server checks) + personal settings | `whiteboard/src/components/AssistantDialog.vue`, `services/ai.ts`, `whiteboard/src/{admin.ts,components/AdminSettings.vue}`, `whiteboard/src/{personal.ts,components/PersonalSettings.vue}` |
| PHP pages | admin/personal/directEditing/recording page shells | `whiteboard/templates/*.php` |

### Zimbra docs & notebook

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Zimbra Docs | X-Zimbra-doc editor app: full-page wiki-document composer + preview (created via Briefcase NEW_DOC) | `zm-web-client/WebRoot/js/zimbraMail/docs/{ZmDocsEditApp.js}` + `docs/controller/ZmDocsEditController.js`, `docs/view/{ZmDocsEditView,ZmDocsPreview}.js` |
| Notebook (zd-full) | Wiki notebooks with pages, version history, file views, conflict/import dialogs, plus **wiklets** (wiki text macros, e.g. `{{toc}}`) | `zd-full/ZimbraWebClient/WebRoot/js/zimbraMail/notebook/{ZmNotebookApp.js}` + `notebook/controller/*.js`, `notebook/view/{ZmNotebookPageView,ZmPageEditView,ZmPageVersionView,ZmFileListView}.js`, `notebook/view/wiklet/*`, `notebook/view/conv/ZmWikiConverter.js` |

### Gameplan & Frappe Wiki

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Gameplan router & layouts | Discussions SPA w/ mobile layouts; Desktop = AppRail + page | `gameplan/frontend/src/router.ts`, `components/{DesktopLayout,MobileLayout}.vue`, `pages/MobileHome.vue` |
| AppRail | Collapsible rail: spaces with unread badges, Search/People/Notifications/Drafts items, account menu, customize (§1) | `gameplan/frontend/src/components/AppRail/{AppRail,CustomizeSidebarDialog}.vue` |
| Discussions | Community/discussion list + discussion view w/ comments, polls, reactions | `gameplan/frontend/src/components/{DiscussionList,DiscussionView,Poll,Reactions}.vue` |
| Spaces | Space pages w/ tasks/discussions/pages tabs; NewSpace dialog | `gameplan/frontend/src/pages/{Space,SpaceDiscussion,SpaceTasks,Task,Page}.vue`, `components/NewSpaceDialog.vue` |
| Personal pages | MyTasks, MyPages, Bookmarks, Drafts, Notifications, Search, Teams, People(+profile) | `gameplan/frontend/src/pages/{MyTasks,MyPages,Bookmarks,Drafts,Notifications,Search,Teams,PersonProfile}.vue` |
| Wiki editor | Wiki editor based on Tiptap with custom slash commands + callout/mermaid/image/iframe/pdf/video node views + toolbar and bubble menu + page links; Markdown round-trip helpers; TOC | `wiki/frontend/src/components/WikiEditor.vue`, `tiptap-extensions/{SlashCommandsList,WikiToolbar,WikiBubbleMenu,PageLinkList}.vue`, `tiptap-extensions/{slash-commands,page-links,wiki-markdown}.js`, `components/EditorTableOfContents.vue` |
| Wiki panels | SpaceSidebar + WikiTree (nested page tree), LibrarySidebar (switch spaces), MobileDrawer, content viewer + change-request/draft diff panels | `wiki/frontend/src/components/{SpaceSidebar,WikiTree,SpaceTreePanel,LibrarySidebar,WikiContentViewer,WikiDocumentPanel,DraftContributionPanel,ContributionsPanel,DiffViewer,EditorTableOfContents}.vue`, `pages/{Overview,AllSpaces,ContributionReview}.vue` |

### Ever Gauzy — Docs plugin and help center

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Docs shell | Organization documents: folder tree column, browse list with filter bar, cards or table, bulk actions, stats, detail panel with activity, links and preview; other plugins add sections through the page-route registry | `packages/plugins/docs-ui/src/lib/docs.routes.ts`, `components/{shell,tree,table,cards,filter-bar,bulk,stats,detail,activity,links,preview,upload}/` |
| Page editor | TipTap document editor with block comment threads, version history panel, autosave, read-only mode, suggestion menus | `packages/plugins/docs-ui/src/lib/editor/document-editor.component.ts`, `editor/{comments,version-history,menus,suggestion,read-only}/`, `editor/services/document-autosave.service.ts` |
| Review queue | Request review / reject dialogs and a review page for documents waiting on a reviewer | `packages/plugins/docs-ui/src/lib/pages/review/review-page.component.ts`, `dialogs/{request-review-dialog,reject-dialog}.component.ts` |
| Sharing, classification, inbound | Share, move, link, category (with merge), classification and extracted-text dialogs; inbound settings give a mail domain and secret so documents can arrive by email | `packages/plugins/docs-ui/src/lib/dialogs/{share-dialog,move-dialog,link-dialog,category-dialog,category-merge-dialog,classification-dialog,extracted-text-dialog,inbound-domain-dialog}.component.ts`, `pages/settings/docs-inbound-settings-page.component.ts` |
| Help center | Knowledge-base articles with add/delete article dialogs; backend plugin with help-center, article and author entities | `apps/gauzy/src/app/pages/help-center/`, `packages/plugins/knowledge-base/src/lib/{help-center,help-center-article,help-center-author}/` |

### OpenProject & Redmine — wiki, news and forums

| Screen/page | What it is | Key files |
| --- | --- | --- |
| OpenProject wiki | Project wiki: page tree menu, show, edit, rename, move under a parent, history, diff, annotate, export | `app/views/wiki/{show,edit,rename,edit_parent_page,history,diff,annotate,menu_tree,export_multiple}.html.erb` |
| OpenProject wikis module | Wiki pages linked to work packages: a wiki tab on the work package, link-existing and create-new page dialogs, inline page-link macro, page search | `modules/wikis/app/components/wikis/{work_package_wikis_tab_component,link_existing_wiki_page_dialog,create_new_wiki_page_dialog,inline_page_link_macro_component,search_pages_result_component}.rb`, `modules/wikis/app/controllers/work_package_wikis_tab_controller.rb` |
| OpenProject news and forums | Project news (list, show with comments, new/edit); forums with threaded messages | `app/views/news/{index,show,new,edit}.html.erb`, `app/views/forums/{index,show}.html.erb`, `app/views/messages/{show,new,edit}.html.erb` |
| Redmine wiki | Page, edit, history, diff, annotate, rename, index by title and **by date**, export to HTML and PDF | `app/views/wiki/{show,edit,history,diff,annotate,rename,index,date_index,export}.html.erb`, `app/views/wiki/show.pdf.erb` |
| Redmine news and boards | News with comments; boards (forums) with topics and quoted replies | `app/views/news/{index,show}.html.erb`, `app/views/boards/{index,show}.html.erb`, `app/views/messages/{show.html,quote.js}.erb` |

### Moqui WorkManagement — wiki

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Wiki spaces and page detail | Vue wiki over the framework wiki entities: space tree (`q-tree`), page view and edit, history and compare, set published version, page comments as `CommunicationEvent`s | `screen/wiki/{WikiSpaces,WikiDetail,WikiBlogs}.xml`, `screen/wiki/Wiki/{WikiSpaces,WikiDetail}.qvue`, `screen/wiki/WikiBlogs/WikiBlogs.qvue` |

**BOSS implications.** Three co-editing stacks sit in these codebases, matching the initial-design decision: (1) Nextcloud text = **Yjs + y-prosemirror + server-sync + IndexedDB offline + presence/status** — this is the pattern the yrs + Tiptap decision matches, worth following almost verbatim (see `text/src/apis/sync.ts`, `text/src/services/SyncService.ts`, `text/src/composables/useIndexedDbProvider.ts`, `text/src/components/Editor/OfflineState.vue`); (2) whiteboard uses Excalidraw + socket.io with JWT and a snapshot web worker — a preview of what a yrs-based server will look like; (3) Frappe wiki does plain Tiptap + sockets + change requests/_review diffs — the moderation/versioning layer a BOSS wiki would need. Wiklets show that wiki macros ({{comments}}, TOC insertion etc.) are expected user features. Collectives' page tree + per-page print + backlinks is the closest knowledge-base screen set for Commons. Ever Gauzy Docs adds what a business wiki needs beyond editing: a review queue, classification and categories, and documents arriving by email; OpenProject's wikis module shows wiki pages linked from a business record (a work package tab), the pattern for linking KB pages to cases and tasks (`WikiPageRequest`, `WikiPageWorkEffort`). Redmine and OpenProject cover the plain wiki chores (history, diff, annotate, rename, by-date index, PDF export) and project news.

---

## 14. Preferences & per-app settings

### Zimbra prefs (`zm-web-client/WebRoot/js/zimbraMail/prefs/`)

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Prefs app & shell | Section registry: each app adds prefs; tab tree + per-page controller | `zm-web-client/WebRoot/js/zimbraMail/prefs/ZmPreferencesApp.js` (`_registerPrefs`: GENERAL, ACCOUNTS, FILTERS, SIGNATURES, OUTOFOFFICE, TRUSTED, SHARING, NOTIFICATIONS, MOBILE, IMPORT_EXPORT, SHORTCUTS, ZIMLETS, + BACKUP offline), `prefs/view/{ZmPrefView,ZmPreferencesPage}.js`, `prefs/controller/{ZmPrefController,ZmPrefPageTreeController}.js`, `templates/prefs/Pages.template` |
| Per-app tabs | Mail display + compose (`new window compose` pref), accounts (personas + test), signatures, calendar (ZmCalendarPrefsPage), address book, trusted addresses | `zm-web-client/WebRoot/js/zimbraMail/mail/view/prefs/{ZmMailPrefsPage,ZmAccountsPage,ZmAccountTestDialog,ZmSignaturesPage,ZmTrustedPage}.js`, `calendar/view/ZmCalendarPrefsPage.js` |
| Filter rules page | Server-side mail filters list + rule editor dialog | `zm-web-client/WebRoot/js/zimbraMail/prefs/controller/{ZmFilterController,ZmFilterRulesController}.js`, `prefs/view/{ZmFilterPage,ZmFilterRulesView,ZmFilterRuleDialog}.js`, `prefs/model/{ZmFilterRule,ZmFilterRules}.js` |
| Sharing page | Manage all shares across folders | `zm-web-client/WebRoot/js/zimbraMail/prefs/view/ZmSharingPage.js` (+ `templates/prefs/Pages.template#SharingPrefPage`) |
| Notifications page | Notification devices / new-mail alerts prefs | `zm-web-client/WebRoot/js/zimbraMail/prefs/view/ZmNotificationsPage.js` |
| Devices & offline | Mobile-device status/wipe; offline backup page + offline bootstrap/settings (desktop client) | `zm-web-client/WebRoot/js/zimbraMail/prefs/view/{ZmMobileDevicesPage,ZmBackupPage}.js`, `offline/{ZmOffline.js,model/ZmOfflineDB.js}`, `share/view/dialog/ZmOfflineSettingsDialog.js` |
| Import/export & shortcuts | Data import/export page; shortcuts reference; Zimlet management; 2FA/codes dialogs | `zm-web-client/WebRoot/js/zimbraMail/prefs/view/{ZmImportExportPage,ZmShortcutsPage,ZmZimletsPage}.js`, `share/controller/ZmImportExportController.js`, `share/view/dialog/ZmTwoFactorSetupDialog.js` (2FA) |

### Nextcloud per-app settings

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Mail user app settings dialog + admin settings | see §8 rows (settings dialog sections; admin bundle) | `mail/src/components/AppSettingsMenu.vue`, `components/settings/*`, `mail/src/main-settings.js` |
| Calendar settings modal | Timezone/appearance/delegation/import | `calendar/src/components/AppNavigation/Settings.vue` + `Settings/*.vue` |
| Contacts settings | Addressbooks/shares/sort in nav footer + admin page | `contacts/src/components/AppNavigation/{RootNavigation,ContactsSettings}.vue` + `Settings/*`, `lib/Settings/AdminSettings.php` |
| Talk user + admin settings | Personal settings dialog + 12 admin sections | `spreed/src/components/SettingsDialog/{SettingsDialog,AppearanceSettings,ConversationsSettings,MatrixAccountSettings…}.vue`, `spreed/src/views/AdminSettings.vue` + `components/AdminSettings/*.vue`, `mainAdminSettings.js` |
| Text/whiteboard/collectives | Whiteboard admin (collab-server check) + personal settings; collectives admin settings; Text ships no admin screen | `whiteboard/src/{admin.ts,personal.ts}` + `whiteboard/src/components/…`, `collectives/src/settings-admin.ts` → `views/AdminSettings.vue` |
| Notes settings | Rich/plain/preview modes + folder + shortcuts | `notes/src/components/AppSettings.vue` |
| Deck settings | App settings + board defaults; per-card sort persist | `deck/src/components/DeckAppSettings.vue`, `stores/board.js` |
| Files global settings | (mostly absent beyond per-section settings; quota + shortcuts) | `server/apps/files/src/composables/useHotKeys.ts`, `components/NavigationQuota.vue` |

### Signal Desktop — settings dialog

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Settings tab-screen | Left category nav + `SettingsPage`-enum routing: Profile, Account (linked devices, PIN, registration lock, recovery key), General, Appearance (chat color), Chats (chat-folder editor), Calls, Notifications (incl. notification profiles, while-muted), Privacy (read receipts/typing), Data usage, Backups, Internal | `Signal-Desktop/ts/components/Preferences.dom.tsx`, `Signal-Desktop/ts/components/PreferencesUtil.dom.tsx`, `Signal-Desktop/ts/components/preferences/*`, `Signal-Desktop/ts/types/Nav.std.ts` |

**BOSS implications.** Zimbra's model — *apps register their preference tabs into one settings screen* (`registerPrefSection`) — matches one option for BOSS: each app keeps its own settings section and registers it into IronStone Admin's settings index (Comms and Commons among them). NC's per-app user settings dialogs (the `NcAppSettingsDialog` pattern) are the in-app alternative.

---

## 15. Cross-app plugin-surface inventory

Verified extension points across the checkouts — the concrete analogues to BOSS's "shared context plumbing" (initial-design §Header tray) and the Assist drawer's reach:

| API (codebase) | What it enables (BOSS analog) |
| --- | --- |
| `OCA.Dashboard.register` / `registerStatus` (NC) | Header "Today" panel widgets & any business app's counter widget |
| Server-side `IAPIWidget` (`OCP\Dashboard\*`) | Same, from PHP/data providers for BOSS services |
| `registerSidebarTab` / `registerTab` (@nextcloud/files library) (NC) | Record-detail drawer tabs (talk/chat share, versions, comments, activity, photos) |
| `registerFileAction` / `registerFileListAction` / `registerFileListHeader` (NC) | Row/context actions & strip above lists |
| `addNewFileMenuEntry` + Templates OCS (NC) | Header quick-create items + doc-from-template |
| `registerDavProperty` (NC) | Extra per-node props (reminders, metadata) |
| `OCA.Viewer.registerHandler` (NC) | Per-mime inline preview handlers (email viewer, office) |
| `OCA.UnifiedSearch.registerFilterAction` + PHP `IProvider` (NC) | Command-palette scoped filters |
| `OCP.Collaboration.registerType` (deck/board/card) | "Add to a project"-style link pickers |
| `OCA.Talk.registerMessageAction` (tasks/deck talk.js/init-talk.js) | Convert chat message → task/board card |
| `OCA.Contacts.mountContactDetails` (contacts/src/oca.ts + mail DisplayContactDetails) | Contact hover pane in mail |
| Reference widgets `registerWidget` (calendar, deck, collectives) | Rich snippets of records inside editors/chat/mail |
| Workflow custom elements (`spreed/src/flow.js` → `views/FlowPostToConversation.vue`) | Automated "event → action" flows |
| Public surfaces (PublicShare sidebars, booking pages, mailto window, FloatingCall, Recorder route) | Out-of-app shells (guest share windows, call overlay, booking pages) |
| Zimbra: `ZmOperation` NEW_*/`getNewButtonProps` + `handleOp` lazy load | Header quick-create registry |
| Zimbra: zimlets sidebar `ZmZimletAppView` + object handlers (`ZmEmailObjectHandler`) | Extensible side drawer + in-text micro-actions |
| Frappe suite: `suite/frontend/src/apps/registry.ts` app registry + `SuiteCommandPalette` groups + per-app `apps/{mail,calendar}/components/AppSidebar.vue` rails | App-switch + per-app drawer templates |
| Ever Gauzy: `NavigationBuilderService.registerHeaderAction`/`registerSidebar`, `ChatSidebarService.register`, `PageRouteRegistryService`, `DEFAULT_SIDEBARS`, record-view drawer | Header tray items, plug-in right drawers, docked AI/chat panel, plugin routes, record quick-look + full-page twin |
| Twenty: side-panel router (`packages/twenty-front/src/modules/side-panel/`) + headless `engine-command` components + `OpenRecordIn` | Contextual quick drawers with back-stack, headless command registry, record-open-in-panel/full-page |

---

## 16. Cross-app surfaces

Reused screens and links as listed in [research-crosscut.md](research-crosscut.md) §3–§4. Commons and Comms are used from every app (initial-design), so their screens are reused screens that the apps include; the header pieces are suite chrome over every app. Each app includes the same screen with its own context and action set.

| Reused screen or link | Use in Header, Commons & Comms | Other apps that include it | Reference evidence |
| --- | --- | --- | --- |
| **Contact / party record** | Commons Contacts: list + detail split, contact info, relationships, groups, related records (messages, events, tasks, requests, files) | Every app that shows a person or organization; Admin (user account on the party); People (employee data) | Nextcloud Contacts details pane with related-resource panels and a read-only pane mounted in Mail (§10); Zimbra contact picker reused by compose and scheduling; Moqui `Party/EditParty.xml` tabs (§17) |
| **Customer 360 / Supplier 360 / Employee 360** | Commons and Comms supply the Chatter tab, the contact card and the email/chat history; Commons includes the People directory card | Customer 360: Sales, Customer Service, Marketing, Accounting, Commerce; Supplier 360: Purchasing, Accounting, Products, Warehouse; Employee 360: People, Admin, Projects | Twenty record widgets (timeline, emails, calendar, files); Odoo Chatter on every form; Moqui `PartyMessages` reusing the MyAccount message screens |
| **Chatter & activities** (one component) | One timeline beside every record: messages and notes, scheduled activities, attachments, followers; activities due roll up into the header Today panel | Every app's record screens | Odoo Chatter, activities, followers and activity menu (§5); Twenty record widgets (§1); Nextcloud Activity sidebar tab and Deck card tabs (§5, §11) |
| **Task / work item** | Commons: "My tasks" smart lists and quick-create task; tasks due in the Today panel; the task screen with a lighter action set | Projects (work items, boards, plans); Customer Service and Sales (follow-up tasks); People (onboarding checklists) | Nextcloud Tasks (§11), Gameplan My Tasks, Moqui `MyAccount/User/Task/` |
| **Request / case** | Commons: "Requests assigned" list; Comms: turn an email or chat message into a request | Customer Service (case intake, queues, SLA); Purchasing; Maintenance; Projects; Sales; Warehouse | Moqui `MyAccount/User/Request/`; message → task/card actions in Nextcloud Tasks and Deck (§3) |
| **Calendar & schedules** | Commons: personal and shared calendars, facility and equipment schedules, booking (schedules in Commons is decided in initial-design) | Maintenance: scheduling admin (policies, approvals, blackout windows; decided in initial-design); Projects: plan views; People: leave and shift views | Nextcloud Calendar resources, room availability and booking pages (§9); Zimbra resource scheduling; Moqui `MyCalendar`, `FacilityCalendar`, `AssetCalendar` |
| **Facility & equipment record** | Commons: availability and booking (request a room or machine) | Maintenance (equipment register, maintenance history, facility tree); Warehouse (storage locations and setup); Manufacturing (production equipment, work centers); Accounting (fixed-asset books) | Nextcloud room-availability modal (§9); see [research-maintenance.md](research-maintenance.md) §13 |
| **Approvals waiting** | The header Notifications panel lists everything waiting on the user | Per-app lists in People (leave, expenses, pay hours), Projects (timesheets), Purchasing (PO and request approvals), Sales (quote and discount approvals) and Accounting (bill approval) | OpenProject notification reasons and filters (§5); Ever Gauzy approval requests and policies (§5) |
| **Knowledge base articles** | Commons: spaces, pages, authoring, review and publish | Customer Service: search, suggest, link to a case, suggest an edit | Ever Gauzy help center and Docs review queue; OpenProject wikis tab on a work package (§13); Mantle `WikiPageRequest` |
| **Email/SMS sending, consent, unsubscribe** | Comms: accounts, sending, tracking, consent and unsubscribe | Marketing: campaign sends and audiences; Customer Service: case email; Admin: relay, gateway trust, protocol servers and queues | Nextcloud Mail, Zimbra mail, Frappe suite mail screener (§8); Mantle `ContactListParty` unsubscribe statuses and `PartyContactMech.allowSolicitation` |
| **Events & webinars** | Commons: the calendar event, invitations and RSVP | Marketing: registration, tickets and communication schedule | Nextcloud Calendar invitees and invitation responses; Talk meeting scheduling (§7, §9) |
| **Dashboard widgets** | The Today panel shows app-registered widgets | Insights (dashboards, widget types and builder); every app's landing page | Nextcloud `OCA.Dashboard.register` / `IAPIWidget` (§4); OpenProject and Redmine My page (§4) |
| **Search / command palette** (suite chrome) | One palette over every app | Every app registers result providers and actions | Nextcloud unified search providers and filters, Frappe suite palette groups, Twenty engine commands (§2); Moqui `Base/QuickSearch.xml` |
| **Per-app settings and user preferences** | Commons and Comms settings sections (mail accounts, signatures, filters, calendar, notification topics) | Every app has its own settings section; Admin's settings index links to them | Zimbra prefs section registry, Nextcloud per-app settings dialogs, Signal settings (§14); Moqui `MyAccount/User/Notifications.xml` topic subscriptions |
| **User accounts** | Commons: self-service account page (password, two-factor, locale, time zone) and account details on the party | Admin (user accounts, groups, app access); People (account details on the party) | Moqui `MyAccount/User/Account.xml` |
| **Files on records** | The attachments tab on every record is the Files component scoped to that record | Every app's record screens | Nextcloud Files sidebar registry and Deck card attachments (§12); Mantle `*Content` join entities |

**BOSS implications.** The Commons screens that the research finds reused across the apps are the contact record, calendar & schedules, knowledge pages and files, plus the task and request screens that Commons includes as Tasks assigned and Requests assigned; Comms contributes the message, chat and call screens and, with Commons, the Chatter component. The header pieces (search, quick create, Today and Notifications with approvals waiting) read records from every app; the registry references (Nextcloud dashboard and search, Zimbra's op registry, Ever Gauzy's header actions) favor each app exposing a provider (search results, quick-create items, Today items, notification topics) over the header querying app tables.

---

## 17. Current Moqui baseline (mr-marble / MarbleERP / Mantle)

There is no groupware app. The baseline is the **My Account** app (mounted at `/apps/my` by `component/mr-marble/MoquiConf.xml`; a popup subscreens panel with **User** and **Expense**), the SimpleScreens **Wiki** app and the **Party** record tabs, plus three header plugins. MarbleERP (`component/mr-marble/screen/marble.xml`) mounts the SimpleScreens Party, Request, Task, Wiki and Survey trees and QuickSearch; it adds nothing for Commons or Comms. IronStone BOSS has copies of the My Account User screens under `component/mr-boss/screen/Base/User/` (still Groovy expressions), but `component/mr-boss/screen/boss.xml` mounts only QuickSearch, Search, QuickLookup and SalesSummary ("the others are not ported to JavaScript yet"). The Assist panel is not ported to the mr-moqui webroot.

### Screens

| Screen/page | What it is | Key files |
| --- | --- | --- |
| My Account root | Popup subscreens panel; default **User** (tabs below), plus **Expense** (expense invoices) | `component/mr-marble/screen/MyAccount.xml`, `MyAccount/User.xml`, `MyAccount/Expense.xml` |
| Notifications | My `NotificationMessage`s (title, topic, sent, viewed) with mark-viewed; topic subscriptions with receive and email flags per topic | `component/mr-marble/screen/MyAccount/User/Notifications.xml` |
| Messages | Find messages (from/to party, type, status, purpose, subject, body), create Message, thread view, single message, reply, edit purposes and status | `component/mr-marble/screen/MyAccount/User/Messages/{FindMessage,EditMessage,MessageThread}.xml`, `MessageThread/SingleMessage.xml` |
| Calendar | My calendar (FullCalendar via `mr-calendar`) showing events and tasks; New Event; event detail with parties, equipment (asset assignments), notes, audit log, clone | `component/mr-marble/screen/MyAccount/User/Calendar/{MyCalendar,EventDetail}.xml` |
| Tasks | My tasks list (name, status, purpose, priority, estimated completion, work times), create simple task; task detail with assignments, notes, clone, time entries | `component/mr-marble/screen/MyAccount/User/Task/{MyTasks,TaskDetail}.xml` |
| Requests | My requests (find, create); edit request with parties, comments (nested replies), content upload/download, status | `component/mr-marble/screen/MyAccount/User/Request/{MyRequests,EditRequest}.xml`, `EditRequest/RequestComment{Nested,Reply,Update}.xml` |
| Time entries | Clock in, record time against tasks | `component/mr-marble/screen/MyAccount/User/TimeEntries.xml` |
| Scheduled finds | Saved finds rendered on a cron schedule and emailed (template, subject, render mode, no-results abort, save-to location) | `component/mr-marble/screen/MyAccount/User/ScheduledFinds.xml`, `ScheduledFinds/EditScheduledFind.xml` |
| Contact info, account | My contact mechanisms; account: name, username, email, password, locale and time zone, two-factor factors (email, SMS, TOTP, single-use codes) | `component/mr-marble/screen/MyAccount/User/{ContactInfo,Account}.xml`, `ContactInfo/UpdateContactInfo.xml` |
| Header account widget | Four counts linking into My Account — unread notifications, received messages, events this week, open tasks; polled every 5 minutes, notification count also bumped from the websocket | `component/mr-marble/screen/ssstatic/lib/MyAccountNav.qvue`; counts from `mantle.party.PartyServices.get#UserNoticeCounts` (REST `/rest/s1/mantle/my/noticeCounts` in `component/mr-mantle/service/mantle.rest.xml`) |
| Header search and org widgets | Search box that opens the current app's QuickSearch; active-organization picker | `component/mr-marble/screen/ssstatic/lib/{QuickSearch,ActiveOrgNav}.qvue`, registered as `STRT_HEADER_NAVBAR_COMP` / `STRT_HEADER_ACCOUNT_COMP` in `component/mr-marble/data/SimpleScreensSetupData.xml` |
| Shell slots and websocket | Header logo, title, navbar and account plugin lists come from screen-theme resources; `NotificationClient` websocket in the shell | `components/base/webroot/screen/webroot/qapps.xml`, `components/base/webroot/screen/webroot/js/WebrootVue.qvt.js` |
| Assist | `setAssistTitle` transition with an Assist permission check; the Assist client (chat and canvas) is not ported | `components/base/webroot/screen/webroot/apps.xml`, `components/base/webroot/screen/webroot/js/README.md` |
| Wiki app | Spaces (new, clone, edit), page tree and view, edit page (text area with the space's editor type), comments (`CommunicationEvent`), attachments, categories, linked requests and tasks, history compare, published version; blogs | `component/mr-marble/screen/SimpleScreens/Wiki/{WikiSpaces,EditWikiSpace,wiki,EditWikiPage,ViewWikiPage,WikiCompare,WikiBlogs,EditWikiBlog}.xml`, `Wiki/wiki/WikiComment{Nested,Reply}.xml` |
| Party record (contacts) | Find party (create person, organization, customer, employee, account, contact); edit party with contact info, expired contacts, find duplicates and merge; tabs Messages (reuses the MyAccount message screens), Emails (`EmailMessage` list, send), Calendar, Tasks, Requests, Projects, Related (relationships), Agreements, Time entries | `component/mr-marble/screen/SimpleScreens/Party/{FindParty,EditParty,PartyMessages,PartyEmails,PartyCalendar,PartyTasks,PartyRequests,PartyProjects,PartyRelated}.xml`, `Party/EditParty/{UpdateContactInfo,FindDuplicates}.xml` |
| Facility and asset calendars | Work-effort events per facility or asset (read; asset calendar can add an event) | `component/mr-marble/screen/SimpleScreens/Facility/FacilityCalendar.xml`, `component/mr-marble/screen/SimpleScreens/Asset/Asset/AssetCalendar.xml` |
| BOSS search and lookup | QuickSearch over DataDocuments, full Search, QuickLookup by ID jumping to order, party, product, shipment, invoice, payment, task, project and more | `component/mr-boss/screen/Base/{QuickSearch,Search,QuickLookup}.xml`, `component/mr-boss/template/SearchTransitions.xml` |
| BOSS user screens (not mounted) | Copies of the My Account User screens | `component/mr-boss/screen/Base/User/`, `component/mr-boss/screen/Base/User.xml` |

### Data model available

| Entity / enum | What it gives Header, Commons and Comms | Key files |
| --- | --- | --- |
| `moqui.security.user.NotificationMessage`, `NotificationMessageUser`, `NotificationTopic`, `NotificationTopicUser` | Notifications: topic, sub-topic, user group, title, link, type (info/success/warning/danger), alert flags, JSON payload; per-user viewed date; per-topic title/link templates, receive/email defaults, email template; per-user topic subscription | `components/base/framework/entity/SecurityEntities.xml` |
| `moqui.security.UserPreference`, `moqui.screen.ScreenScheduled`, `moqui.screen.form.FormListFind` | User settings; scheduled and saved finds (palette-able stored queries) | `components/base/framework/entity/{SecurityEntities,ScreenEntities}.xml` |
| `mantle.party.communication.CommunicationEvent` | Messages, comments and logged communications: type (`Email`, `Message`, `Comment`, `Phone`, `FaceToFace`, `Letter`, `Fax`, `WebSite`, `AutoEmail`), status (`CeReady`, `CeSent`, `CeReceived`, `CeViewed`, `CeAssigned`, `CeInProgress`, `CeResolved`, `CeReferred`, `CeBounced`, `CeCancelled`, `CeUnknownParty`), from/to party and contact mech, parent and root (threads), subject, body, `emailMessageId`, `contactListId` | `component/mr-mantle/entity/PartyEntities.xml` |
| `CommunicationEventParty`, `CommunicationEventContent`, `CommunicationEventPurpose`, `CommunicationEventProduct` | Extra recipients, attachments, purposes, products on a message | same |
| Record joins | `OrderCommunicationEvent`, `RequestCommEvent`, `WorkEffortCommEvent`, `WikiPageCommunicationEvent` — messages on orders, requests, tasks/events and wiki pages | `component/mr-mantle/entity/{OrderEntities,RequestEntities,WorkEffortEntities,PartyEntities}.xml` |
| `moqui.basic.email.EmailMessage`, `EmailServer`, `EmailTemplate` | Raw sent/received mail (headers, from/to/cc/bcc, body and text, message id, root/parent), mail servers (polled), templates | `components/base/framework/entity/BasicEntities.xml` |
| `Party`, `Person`, `Organization`, `PartyRole`, `PartyRelationship`, `PartyContactMech`, `ContactMech`, `PostalAddress`, `TelecomNumber`, `PartyContent`, `PartyNote` | Contacts and their details, relationships, documents, notes; `PartyContactMech.allowSolicitation` | `component/mr-mantle/entity/PartyEntities.xml` |
| `ContactList`, `ContactListParty`, `ContactListCommStatus` | Mailing lists with subscription statuses including `CLPT_UNSUBS_PENDING` and `CLPT_UNSUBSCRIBED`; unsubscribe emails | `component/mr-mantle/entity/MarketingEntities.xml` |
| `WorkEffort` (`WetEvent`, `WetTask`, `WetTimeOff`, …) | Events and tasks: name, status, priority, estimated start/completion, all-day dates, location, purpose (`WepMeeting`, `WepPhoneCall`, `WepEmail`, `WepToDo`, `WepHoliday`, …); recurrence is a TODO in the entity | `component/mr-mantle/entity/WorkEffortEntities.xml` |
| `WorkEffortParty`, `WorkEffortFacility`, `WorkEffortAssetAssign`, `WorkEffortNote`, `WorkEffortContent` | Attendees/assignees with role, status, `availabilityEnumId` (`WeptaAvailable`, `WeptaBusy`, `WeptaAway`), `mustRsvp`, `receiveNotifications`; rooms; equipment; notes; files | same |
| `moqui.resource.DbResource`, `DbResourceFile`, `DbResourceFileHistory` | Database-backed file tree with file history | `components/base/framework/entity/ResourceEntities.xml` |
| `*Content` joins | `PartyContent`, `WorkEffortContent`, `RequestContent`, `CommunicationEventContent`, `OrderContent`, `InvoiceContent`, `ShipmentContent`, `FacilityContent`, `AgreementContent`, … — attachments per record | `component/mr-mantle/entity/*.xml` |
| `moqui.resource.wiki.WikiSpace`, `WikiPage`, `WikiPageHistory`, `WikiPageCategory`, `WikiPageAlias`, `WikiPageUser`, `WikiSpaceUser`, `WikiBlog` | Wiki and blog | `components/base/framework/entity/ResourceEntities.xml` |
| `WikiPageRequest`, `WikiPageWorkEffort` | KB pages linked to requests and tasks | `component/mr-mantle/entity/{RequestEntities,WorkEffortEntities}.xml` |
| `moqui.service.message.SystemMessage` | Protocol traffic normalized by mr-moqui (initial-design) | `components/base/framework/entity/ServiceEntities.xml` |

### Services

| Service | Purpose | Key files |
| --- | --- | --- |
| `get#UserNoticeCounts`, `setup#UserOrganizationInfo` | Header counts (unviewed notifications; received `Email`/`Message`/`Comment`; events this week; open tasks); active org | `component/mr-mantle/service/mantle/party/PartyServices.xml` |
| `create#Message`, `reply#CommunicationEvent`, `find#PartyCommunicationEvents`, `add#WikiPageComment`, `create#CommunicationEventContent` | Messages, replies, party timeline, wiki comments, message attachments | `component/mr-mantle/service/mantle/party/CommunicationServices.xml` |
| `create#Event`, `get#FullCalendarData` (events); `create#SimpleTask`, `create#Task`, `update#Task`, `add#TaskComment`, `get#FullCalendarData` (tasks) | Calendar and tasks | `component/mr-mantle/service/mantle/work/{EventServices,TaskServices}.xml` |
| `create#Request`, `update#Request`, `add#RequestComment`, `create#RequestContent` | Requests assigned | `component/mr-mantle/service/mantle/request/RequestServices.xml` |
| `get#PartyContactInfo`, `store#PartyContactInfo`, `create#EmailAddress`, `create#TelecomNumber`, `create#PostalAddress`; `find#PartyDuplicates`, `merge#Parties`; `search#Party`, `create#Person`, `create#Organization` | Contacts | `component/mr-mantle/service/mantle/party/{ContactServices,DuplicateServices,PartyServices}.xml` |
| `search#Universal`; `search#MantleFiltered`, `lookup#ById` | Search and ID lookup for the palette | `component/mr-mantle/service/mantle/search/UniversalSearchServices.xml`, `component/mr-mantle/service/mantle/GeneralServices.xml` |
| `org.moqui.resource.WikiServices` (`get#WikiPageInfo`, `update#WikiPage`, `create#WikiSpace`, `clone#WikiPage`, `upload#WikiPageAttachment`, `set#PublishedVersion`, `get#WikiSpacePages`, `create#WikiBlog`, …) | Wiki | `components/base/framework/service/org/moqui/resource/WikiServices.xml` |
| `org.moqui.mail.EmailServices` (`send#Email`, `send#EmailTemplate`, `send#EmailMessage`, `poll#EmailServer`, `save#EcaEmailMessage`) | Send, poll and store mail | `components/base/framework/service/org/moqui/mail/EmailServices.xml` |
| `org.moqui.impl.UserServices` (`set#Preference`, `update#Password`, two-factor factor services) | Account and preferences | `components/base/framework/service/org/moqui/impl/UserServices.xml` |

---

## 18. Gaps & BOSS implications

### Gaps in the reference set

**Header & drawers.**
- The Nextcloud **notifications** app is not in the checkout (only the `#notifications` mount div in `server/core/templates/layout.user.php`); OpenProject's notification center and Odoo's systray menus (§5) are the notification references instead. Twenty has no notification center (toasts only).
- **Nextcloud Assistant** is not in the checkout. From the published repository (github.com/nextcloud/assistant, listings checked Oct 18, 2026): entry points `src/{assistant,assistantPage,main,personalSettings,adminSettings,filesNewMenu,imageGenerationReference,speechToTextReference,textGenerationReference,taskOutputFileReference,stickerGeneration}.js`; views `src/views/{AssistantPage,ImageResultCustomPickerElement,TextResultCustomPickerElement,TaskOutputFileReferenceWidget}.vue`; components `src/components/{AssistantHeaderMenuEntry,TaskTypeSelect,TaskList,TaskListItem,RunningEmptyContent,AssistantTextProcessingForm,AssistantTextProcessingModal,AssistantFormInputs,AssistantFormOutputs}.vue` and folders `ChattyLLM/`, `ContextChat/`, `Translate/`, `fields/`. It is the direct Assist-drawer reference (header entry, task-type actions, running-tasks feed), but its data model (the TaskProcessing API) is not BOSS's `screen_use` agent.
- No reference has an assistant that reads and navigates the app's own screens; the Twenty ask-AI side-panel page and the Ever Gauzy AI-chat sidebar are chat panels beside the content (no screen-driving code found in the files catalogued).
- No reference documents a split between built-in header elements and plugin widgets; the closest are Nextcloud (core header micro-apps vs app registries) and Ever Gauzy (`registerHeaderAction`).

**Commons.**
- Nextcloud Contacts imports vCard only; there is no CSV import (no `csv` in `contacts/src`). Zimbra's import/export preferences page is the only data-import reference.
- Odoo Knowledge and Appointment are not in the community checkout; the knowledge references are Nextcloud Collectives and Text, Frappe Wiki, Gameplan, Ever Gauzy Docs, OpenProject and Redmine wikis.
- Not in the checkout: the Nextcloud group-folders app and Photos' details tab. (Talk Desktop **is** in the checkout, `talk-desktop/`; §7.)
- Booking pages exist only in Nextcloud Calendar (appointment configs, public booking, proposals); approval of bookings is researched in [research-maintenance.md](research-maintenance.md).

**Comms.**
- Signal ships no web client: Signal-Server has no HTML (a JSON/WebSocket service), so the self-hosted Comms web UI is entirely BOSS-built; Signal Desktop is the pure-messaging UX reference (§6, §7). Candidate Rust crates, no detail needed here: `libsignal/` (Signal protocol) and `ringrtc/` (WebRTC calling; used by Signal Desktop through the @signalapp/ringrtc package), plus `boring/` (BoringSSL bindings).
- Zimbra zm-web-client has no IM or notebook; those exist only in the older `zd-full/` tree (§6, §13). Zimbra voice is voicemail and call history, not WebRTC.
- Nextcloud Mail registers no JS dashboard widget (PHP `IAPIWidget` widgets only).
- No reference has a consent screen beside the mailbox; consent and unsubscribe show up as Frappe suite's screener (allow/deny senders) and Odoo's mail blacklist model (`odoo/addons/mail/models/{mail_blacklist,mail_thread_blacklist}.py`).

### Notable gaps in the Moqui baseline

**Header & drawers.**
- **No Today panel.** `MyAccountNav` shows four counts that open full screens; nothing lists items due today or overdue, and activities (`WepToDo`, `WepPhoneCall`, …) are not counted.
- **No notifications panel or approvals list.** Notifications is a flat list; `NotificationMessage` has topic, title, link and a JSON payload but no record reference, actor or reason fields, and nothing collects approvals waiting.
- **No quick create and no command palette.** QuickSearch is search plus ID lookup; it runs no actions and does not offer saved finds.
- **Assist is not ported**, and screens expose no shared context (current record, filters, selection) for Assist, Chatter and the tray panels.
- **The BOSS user screens are copies, not mounted** (`boss.xml`), and still use Groovy expressions.

**Commons.**
- **Contacts are admin-shaped.** Find/Edit Party is a back-office record; there is no address-book list with a detail pane, no personal vs organization directory, no contact groups other than marketing `ContactList`s and relationships, no vCard/CSV import or export. Duplicate find and merge exist.
- **Calendar is one personal view.** No shared or team calendars, no free/busy view (although `WorkEffortParty.availabilityEnumId` exists), no recurrence (TODO in `WorkEffort`), no reminders, no invitation/RSVP flow (`mustRsvp` exists), no external calendar subscription. Facility and asset calendars are read-mostly; there is no booking request.
- **Tasks** is a list: no today/week/overdue lists, no board, no checklist.
- **No Files app.** Attachments live per record (`*Content`) and per wiki page; nothing browses folders, shares, versions or public links.
- **Wiki** edits in a text area, has no co-editing, no drag in the page tree, no review step (only a published version), and no personal notes.

**Comms.**
- **No mail client.** Messages are internal `CommunicationEvent`s; there are no mail accounts, mailboxes, folders, compose with attachments or rules. Party Emails lists `EmailMessage`s and can resend. `CommunicationEvent.emailMessageId` links the two, but only order, invoice and shipment services set it (from a grep).
- **No chat, presence or calls**: no rooms, membership, read markers or reactions, and no call records.
- **Consent has data but no screen**: `ContactListParty` unsubscribe statuses and `PartyContactMech.allowSolicitation`.

### What each reference contributes

**Header & drawers.**

| Reference | Take |
| --- | --- |
| Nextcloud | Shell of header micro-apps; unified search with per-app providers and filters; dashboard widget registry (JS and server `IAPIWidget`); user status; floating call overlay |
| Odoo | Systray activity menu (overdue/today/planned by model) and messaging menu — the Today and Notifications panel shapes |
| OpenProject | Notification center: bell count, inbox with by-reason and by-project filters, reminders, date alerts, per-project settings; My page widget grid |
| Ever Gauzy | Header-action and sidebar registries; record drawer with full-page twin; inbox badge polling; approval requests with policies; quick actions (Ctrl+Q) |
| Twenty | One drawer with swappable contents; right side panel with back-stack routing; headless engine commands; context-scoped command menus |
| Zimbra | One "New" menu fed by every app's operations; saved searches; reminder dialogs with snooze |
| Frappe suite, Gameplan | App registry and launcher; palette groups per app; Gameplan's user-arrangeable rail with unread badges |
| Redmine | My page block picker |
| Nextcloud Assistant (published repo) | Assistant entry in the header, task-type picker, running-tasks feed |

**Commons.**

| Reference | Take |
| --- | --- |
| Nextcloud | Contacts (list + details pane, related resources, org chart, circles, merge); Calendar (popover vs full editor, free/busy, rooms and resources, booking pages, proposals, publish/subscribe); Tasks (smart lists, property-row sidebar); Deck (boards, card tabs); Files (sidebar/action/new-menu/preview registries, sharing, versions, trash, file drop, templates); Text + Collectives (Yjs co-editing, page tree, backlinks, versions) |
| Zimbra | Contact split view and quick add; calendar views with schedule assistant and location/time suggestions; briefcase versions and check-in |
| Frappe Wiki, Gameplan | Wiki page tree, Tiptap editor with slash commands, contributions and review with diffs; Gameplan spaces with discussions, tasks and pages, personal My Tasks / My Pages / Bookmarks / Drafts |
| Ever Gauzy | Docs: tree, detail panel, TipTap editor with block comments and version history, review queue, classification, documents by email; help center |
| OpenProject, Redmine | Wiki chores (history, diff, annotate, rename, by-date index, PDF export), news, forums; wiki pages linked from a work package tab |
| Twenty | Record widgets for timeline, tasks, notes, files, emails, calendar |
| Moqui WorkManagement | A Vue wiki over the same framework wiki entities (space tree, history, compare, comments) — the nearest Moqui code to port |

**Comms.**

| Reference | Take |
| --- | --- |
| Nextcloud Mail | Full mail client: accounts, mailboxes, envelope list, thread view, composer with schedule and attach-from-Files, outbox, sieve filters, out-of-office, text blocks, delegation, contact hover, iMIP |
| Nextcloud Talk (+ Talk Desktop) | Chat rooms, threads, polls, reactions, room settings; calls (grid, lobby, breakout rooms, recording, live transcription, floating overlay); desktop callbox |
| Zimbra | Three reading-pane layouts, compose detachable to a window, send confirm with add-contacts, folder/tag/share dialogs; IM roster (zd-full) |
| Frappe suite | Mail (compose dock, outbox with delivery status, screener, admin), Meet (lobby, side panels, polls, captions) |
| Odoo Discuss | Chat inside a business suite: chat windows and hub that survive navigation, presence, calls, inbox of mentions |
| Signal Desktop | Left pane as a mode machine; typed panel stack; message requests; call links, incoming-call bar, picture-in-picture |
| Gameplan | Discussions with comments, polls and reactions (async team posts) |

### Candidate screen inventory (Header, IronStone Commons, IronStone Comms)

**Header & drawers.**

| Area | Screens |
| --- | --- |
| Header bar (suite chrome) | App launcher, search/command palette, quick create "+", Today, chat, email/async count, Notifications, live-call mini-window (only during a call), account menu, Assist toggle |
| Search / command palette | Extends QuickSearch: records (DataDocument search), ID lookup, actions registered by apps, saved finds (`FormListFind`) as entries; results grouped by app |
| Quick create | Task, event, note, contact, request; items registered by apps; prefilled from the current record (link to it) |
| Today panel | Tasks due today and overdue, today's events with join, activities due, other overdue items; quick actions (mark done, snooze, open) |
| Notifications panel + full page | Panel with unread list and reason filters (mention, assignment, approval, date alert, reminder) by app; full Notifications page with the same filters; **Approvals waiting** list with approve/refuse or open **(reused: every app through the header; per-app lists in People, Projects, Purchasing, Sales, Accounting)**; topic settings link |
| Chat panel | Rooms with unread counts and search; open a room in the canvas beside Assist |
| Assist drawer | Decided in initial-design: always-available top-level drawer; header panels open in the canvas Assist sees; `screen_use` read-only for now |

**IronStone Commons.**

| Area | Screens |
| --- | --- |
| Home | Commons landing: today, my tasks, upcoming events, recent pages and files |
| Contacts | Directory list + detail pane; **Contact / party record** **(reused: every app that shows a person or organization, Admin, People)** with info, relationships, groups, related messages/events/tasks/requests/files, Chatter; import/export (vCard, CSV with mapping); duplicates and merge; org chart later |
| Calendar & schedules | **Calendar & schedules** **(reused: Maintenance, Projects, People)**: grid (day, week, month, list), quick-create popover and full editor (attendees, rooms, equipment, reminders, recurrence), free/busy; my and shared calendars; facility and equipment schedules with a book action over the **Facility & equipment record** **(reused: Maintenance, Warehouse, Manufacturing, Accounting)**; booking request |
| Tasks assigned | My tasks smart lists (today, week, overdue, all); task detail **(reused: Projects, Customer Service, Sales, People)** |
| Requests assigned | My requests list; request detail **(reused: Customer Service, Purchasing, Maintenance, Projects, Sales, Warehouse)** |
| Files | Browser (folders, recent, favorites, shared with me, trash), detail sidebar (sharing, versions, comments, activity), upload, public links; record attachments tab as the same component **(reused: every app's record screens)** |
| Notes & knowledge | Wiki spaces, page tree, page view and co-editing (yrs), history and compare, comments, review and publish; personal notes; blogs (framework `WikiBlog`); knowledge base articles **(reused: Customer Service, for search, suggest and case links)** |
| Events | Event record with invitations and RSVP **(reused: Marketing, which adds registration, tickets and communication schedule)** |
| Settings | Calendar, contacts and notification-topic preferences |

**IronStone Comms.**

| Area | Screens |
| --- | --- |
| Inbox | One inbox over `CommunicationEvent` for internal messages and email: accounts and folders, thread list + reading pane, filters (unread, assigned, mentions) |
| Email | Composer (identities, attachments from Files, templates, scheduled send), outbox, rules, out-of-office, signatures, account setup; sending **(reused: Marketing, Customer Service)** |
| Chat | Room list, room view (threads, mentions, reactions, attachments, polls later), room settings, new room / direct message; message actions: create task, request or event |
| Calls | Pre-join lobby, call view, call history, scheduled meetings (with Calendar) |
| Chatter & activities | Timeline component, compose message/note, schedule activity, followers, attachments **(reused: every app's record screens)** |
| Consent & unsubscribe | Per-contact consent and list subscriptions; public unsubscribe page **(reused: Marketing)** |
| Settings | Mail accounts, signatures, chat and call preferences |

### Data-model findings

**Header & drawers.**
- Notifications: `NotificationMessage` / `NotificationMessageUser` / `NotificationTopic` / `NotificationTopicUser` fit, with one topic per reason as one option; a record reference, actor and reason would need either new fields or a convention inside `messageJson`.
- Approvals waiting can be derived from the source records' statuses (leave, PO, bill, booking), published as notifications; the list itself does not appear to need an approval entity.
- Today panel: one option is extending `get#UserNoticeCounts` to return lists (due today, overdue) over `WorkEffortAndParty` (`WetTask`, `WetEvent`, activity purposes).
- Palette and quick-create registries could be configuration records, like the `ScreenThemeResource` header plugins; saved finds already exist as `FormListFind`.

**Commons.**
- Contacts: `Party`, `Person`, `Organization`, `PartyRole`, `PartyRelationship`, `PartyContactMech` / `ContactMech`, `PartyContent`, `PartyNote`; merge through `merge#Parties`. Address-book groups and personal contacts have no settled record (Open questions).
- Calendar: `WorkEffort` `WetEvent` with `WorkEffortParty` (role, `availabilityEnumId`, `mustRsvp`, `receiveNotifications`), `WorkEffortFacility` and `WorkEffortAssetAssign` for rooms and equipment. Missing, and likely to need new records or fields: recurrence, reminders, a calendar collection (there is no entity for "a calendar"), external subscriptions.
- Tasks and activities: `WorkEffort` `WetTask` and purposes `WepToDo`, `WepPhoneCall`, `WepMeeting`, `WepEmail`.
- Files: `DbResource` / `DbResourceFile` / `DbResourceFileHistory` plus the record `*Content` joins; sharing, permissions and public links have no Mantle records.
- Knowledge: `WikiSpace`, `WikiPage`, `WikiPageHistory`, `WikiPageCategory`, `WikiBlog`, linked by `WikiPageCommunicationEvent`, `WikiPageRequest`, `WikiPageWorkEffort`; CRDT state and snapshot in the decided multi-entry JSON document type.

**Comms.**
- Messages: `CommunicationEvent` (types, `Ce*` statuses, parent/root threads), `CommunicationEventParty`, `CommunicationEventContent`, `CommunicationEventPurpose`; record joins `OrderCommunicationEvent`, `RequestCommEvent`, `WorkEffortCommEvent`, `WikiPageCommunicationEvent`. Chatter on every record needs more joins or a generic link (crosscut §8).
- Email: `EmailMessage`, `EmailServer`, `EmailTemplate`, linked by `CommunicationEvent.emailMessageId`; per-user mail accounts, folders and flags have no records yet.
- Chat and calls: no Mantle records for rooms, membership, read markers or reactions; the Matrix-style store (decided in initial-design) would define them, with call records as `CommunicationEvent` and meetings as `WorkEffort` (`WepMeeting`).
- Consent: `PartyContactMech.allowSolicitation`, `ContactListParty` (`CLPT_UNSUBSCRIBED`), `ContactListCommStatus`.

### Sequencing notes

**Header & drawers.** The palette is cheap to start: QuickSearch, ID lookup (`lookup#ById`) and saved finds (`FormListFind`) exist. Quick create for task, event, contact and request has create services in the baseline (§17); quick-create notes depend on personal notes, which the baseline lacks. The Today panel builds on `get#UserNoticeCounts` and `WorkEffort` data, the Notifications panel and page on `NotificationMessage`; the approvals list depends on the source apps publishing approval notifications. The Assist drawer is decided but its client is not ported to the mr-moqui webroot. The chat panel and live-call window depend on Comms chat and calls.

**Commons.** Contacts build on Find/Edit Party, the contact services and `merge#Parties`; the address-book list, groups and CSV import mapping are new work. The calendar builds on `MyCalendar`, `create#Event` and `get#FullCalendarData`: personal and shared views and the event editor are cheaper than recurrence, which has no Mantle field (a TODO in `WorkEffort`); facility and equipment schedules can be read from `FacilityCalendar` / `AssetCalendar`, while booking approval depends on the scheduling policies included in Maintenance. My tasks and my requests reuse the MyAccount task and request screens. Wiki spaces, pages, comments and history exist in SimpleScreens Wiki (with a Vue port in Moqui WorkManagement); co-editing depends on the yrs sync server in mr-moqui. Record attachments exist through the `*Content` joins; the full Files app (sharing, versions, public links) needs new records, and CalDAV/CardDAV sync settings depend on the mr-moqui protocol servers. The org chart has no baseline screen.

**Comms.** The internal-message inbox and the Chatter component build on `CommunicationEvent` and the MyAccount message screens; Chatter on every record depends on the record-link question (crosscut §8). Email accounts, inbox and composer depend on the mr-moqui IMAP/POP poller and SMTP sending. Consent fields already exist (`PartyContactMech.allowSolicitation`, `ContactListParty`), so showing them on the contact record is cheap. Chat and calls depend on the framework's Matrix-style store and WebRTC.

### Open questions

**Header & drawers.**
- Which header elements can Assist reach (initial-design open item)? A starting split from the research: the built-in palette, quick create, Today and Notifications vs app plugin widgets.
- Is the approvals list in the Notifications panel only, or also a full-page inbox beside per-app lists (crosscut §8)? One option from the evidence is one full Notifications page (OpenProject's notification center) that also serves as the approvals inbox.
- Extend `NotificationMessage` with record, actor and reason fields, or keep them inside `messageJson`?

**Commons.**
- Address-book groups: marketing `ContactList`, `PartyRelationship`, or a new record? Personal contacts: private parties with an owner, or a separate address book?
- Calendar collections: a parent `WorkEffort`, a `WorkEffortParty` role convention, or a new entity?
- Files backend: `DbResource` or file-system resource locations, and how record `*Content` attachments appear in the Files tree.

**Comms.**
- Chat messages: one `CommunicationEvent` per message, or a separate Matrix-style store that projects into `CommunicationEvent` for Chatter and search?
- Consent screens are included in Comms and Marketing (crosscut §4), over `ContactListParty` (mailing-list subscriptions) and `PartyContactMech.allowSolicitation`: is that enough for per-contact consent, or is a separate consent record needed, and which screens edit it?

### Checkout path quirks

- Nextcloud viewer: use the standalone `viewer/` repo; `server/apps/viewer/src` holds a two-file shim.
- Talk moved several composables into components: `spreed/src/components/CallView/{useActiveSpeakers,useWakeLock}.ts`; message parts are under `spreed/src/components/MessagesList/MessagesGroup/Message/`.
- Signal Desktop: chat folders are `Signal-Desktop/ts/components/leftPane/LeftPaneChatFolders.dom.tsx` but the banner is `Signal-Desktop/ts/components/LeftPaneBanner.dom.tsx`; the emoji/GIF/sticker picker is `Signal-Desktop/ts/components/fun/FunPicker.dom.tsx`.
- Zimbra: `ZmRevisionItem` is defined in `zm-web-client/WebRoot/js/zimbraMail/briefcase/model/ZmBriefcaseItem.js`; the conversation view is `mail/view/ZmConvView2.js`.
- The Frappe bundle also holds a Stalwart mail server checkout (`3p_other/frappe/stalwart`).

**Bottom line.** The references cover every Commons and Comms screen researched here; the gaps are in BOSS's own baseline, which has data for almost everything (messages, events, tasks, wiki, notifications, consent) but only My Account-style list screens over it. The header is the newest part: the references favor a palette, quick create, Today and Notifications built as registries that apps feed, OpenProject and Odoo are the closest notification and activity shapes, and chat and calls depend on framework work not yet done.
