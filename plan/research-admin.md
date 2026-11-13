# IronStone BOSS — Admin app research

Oct 18, 2026

Reviewed against sources Oct 18, 2026; follows [research-crosscut.md](research-crosscut.md).

**Paths (Nov 12, 2026).** The Tools `System/` screen paths cited below are the Oct 18
baseline that was read, and they are left as they were. The administration screens among
them are now System's areas (Access, Security, Settings, Operations, Data, Audit,
Integrations, Protocols), and several of the files cited are gone: see mr-moqui
[plans/archive/Admin-Screens-Down.md](../../../../../plans/archive/Admin-Screens-Down.md).

Deeper research pass on the **IronStone Admin** app (users, groups & permissions;
organizations & settings; integrations & system messages; data import and export),
cataloguing every relevant screen/page found in the reference apps. Companion to
[3p-app-reference.md](3p-app-reference.md); feeds the Admin row in
[initial-design.md](initial-design.md), the protocol-layer server settings (SMTP relay and
gateway trust, CalDAV/WebDAV/SFTP, chat and WebRTC servers) that mr-moqui provides and
Admin configures, and the reused screens Admin includes (crosscut §3–§4): the **user
account** on the Contact / party record and on Employee 360 (also included in Commons and
People), payment, shipping and tax **gateway configuration** (also in Commerce and
Accounting), and the **settings index** that links to each app's own settings section.
Style mirrors
[research-maintenance.md](research-maintenance.md) and
[research-insights.md](research-insights.md).

**Organization.** Sorted by functional area (not by app): all user screens together, all
permission editors together, etc. Within each area, sub-tables per reference app.

**Scope.** System-administrator UI: user and group management, role/permission editors,
authentication and security policy, organization/company and global settings, app and
feature enablement, customization (custom fields, data model), integrations (OAuth,
webhooks, API keys, gateways), mail servers and system messages, scheduled jobs and
automation, data import/export/backup, audit and system logs, privacy tools, instance
health. Per-app configuration screens (e.g. accounting preferences, warehouse setup) are
noted only as the shape of a settings hub; each business app's research file covers its
own configuration.

**Path conventions.** Every backticked path resolves against the checkout for its prefix
(research-crosscut.md §1); all checkouts are under `/home/jonesde/work/moquiwork/`. A bare
tail in a table cell is relative to the directory named earlier in the same cell.

| Prefix | Checkout | Paths start with |
| --- | --- | --- |
| **Zimbra** (zm-admin-console) | `3p_other/Zimbra` | `zm-admin-console/WebRoot/js/zimbraAdmin/<area>/{controller,model,view}/`; labels in `zm-admin-console/WebRoot/messages/ZaMsg.properties` |
| **Nextcloud** | `3p_other/nextcloud` | `server/apps/<app>/…` (e.g. `server/apps/settings/src/`), app repos `<app>/src/…` (`spreed/`, `mail/`, `privacy/`) |
| **Odoo** | `3p_other/odoo` | `odoo/odoo/addons/base/views/…` for the core; `odoo/addons/<addon>/…` for apps (`base_setup`, `base_import`, `base_automation`, `auth_*`, `privacy_lookup`, `mail`, …) |
| **Frappe framework** | `3p_other/frappe/frappe` | `frappe/<area>/…` (`frappe/core/doctype/`, `frappe/core/page/permission_manager/`, `frappe/integrations/doctype/`, `frappe/automation/doctype/`, `frappe/email/doctype/`, `frappe/custom/doctype/`) |
| **Frappe Central** | `3p_other/frappe/central` | `dashboard/src/pages/…`, backend `central/…` |
| **Frappe suite** | `3p_other/frappe/suite` | `frontend/src/apps/<app>/…` |
| **Twenty** | `3p_other/twenty` | `packages/twenty-front/src/{pages,modules}/settings/<area>/…`, `packages/twenty-front/src/modules/spreadsheet-import/` |
| **Carbon** | `3p_other/carbon` | `apps/erp/app/routes/x+/{settings+,users+,shared+}/`, `apps/erp/app/modules/{settings,users}/ui/`, `packages/ee/src/` |
| **Dolibarr** | `3p_other/dolibarr` | `htdocs/<module>/…` (`htdocs/admin/*.php`, `htdocs/user/`, `htdocs/{imports,exports,cron,webhook,blockedlog,datapolicy,api}/`) |
| **Ever Gauzy** | `3p_other/ever-co/ever-gauzy` | `apps/gauzy/src/app/pages/…`, `packages/plugins/integration-*` |
| **Akaunting** | `3p_other/akaunting` | `resources/views/…`, `app/…` |
| **AureusERP** | `3p_other/aureuserp` | `plugins/webkul/<plugin>/src/Filament/…` |
| **OpenProject** | `3p_other/openproject` | `app/{views,components,controllers}/…`, `modules/<module>/…`, `lib/open_project/…`, `config/initializers/menus.rb` (admin menu) |
| **Redmine** | `3p_other/redmine` | `app/{views,controllers,models}/…`, `lib/redmine/preparation.rb` (admin menu) |
| **ServiceJobMonitor** | `3p_moqui/ServiceJobMonitor` | `screen/…`, `entity/…`, `service/…` |
| **Moqui baseline** | `mr-moqui-base/runtime` | `components/base/tools/screen/{System,Tools}/`, `components/base/framework/{entity,service,data,conf}/`, `components/base/webroot/screen/webroot/`, `component/mr-marble/screen/SimpleScreens/…`, `component/mr-marble/…`, `component/mr-mantle/entity/…`, `component/mr-mantle/service/mantle/…`, `component/mr-boss/{screen,data}/…` |

Not used here: metasfresh admin is backend-defined AD windows (users, roles, org) with no
dedicated front-end screens beyond login (`frontend/src/containers/Login.js`); the other
Moqui components in `3p_moqui/` have only small settings screens (coarchy
`screen/settings/settingsinternal/EditOrganization.xml` for org + billing, WeCreate
`screen/wcinternal/Settings/`). Checked for crosscut §7 "also check": Frappe Central (§14,
hosting only), ServiceJobMonitor (§10), OpenProject and Redmine admin (rows in §1–§12).

Sections: [1 admin home & health](#1-admin-home--system-health) · [2 users](#2-users) · [3 groups, roles & permissions](#3-groups-roles--permissions) · [4 authentication & security](#4-authentication--security-policy) · [5 organizations & settings](#5-organizations-companies--general-settings) · [6 apps & features](#6-apps-modules--feature-toggles) · [7 customization](#7-customization-custom-fields-data-model-layouts) · [8 integrations](#8-integrations-oauth-webhooks-api-keys-gateways) · [9 mail, protocols & notifications](#9-mail-servers-protocol-servers-system-messages--notifications) · [10 jobs & automation](#10-scheduled-jobs--automation) · [11 import, export & backup](#11-data-import-export--backup) · [12 logs & audit](#12-logs-audit--monitoring) · [13 privacy](#13-privacy--data-policy) · [14 instances & hosting](#14-instances-servers--hosting) · [15 developer & AI tools](#15-developer-ai--power-tools) · [16 cross-app surfaces](#16-cross-app-surfaces) · [17 current Moqui baseline](#17-current-moqui-baseline-mr-marble--marbleerp--mantle) · [18 gaps & BOSS implications](#18-gaps--boss-implications)

---

## 1. Admin home & system health

| App | Screen/page | What it is | Key files |
| --- | --- | --- | --- |
| Zimbra | **Home** | Summary (counts of accounts, domains, COS, servers; active sessions; queue length), Maintenance (last DB check, last cleanup, last log purge), Runtime / service status link, **Get started** tasks (create domain, configure GAL, configure auth, configure COS, add account(s), manage accounts) | `zm-admin-console/WebRoot/js/zimbraAdmin/home/{controller/ZaHomeController.js,view/ZaHomeXFormView.js}` (`LBL_Home*`) |
| Zimbra | Navigation tree | Overview panel: Home · Monitor (Server Status, Server Statistics, Mail Queues) · Manage (Accounts, Aliases, Distribution Lists, Resources) · Configure (Class of Service, Domains, Servers, Global Settings, Zimlets, Admin Extensions) · Tools and Migration (a Downloads page for migration and import tools) · Search (saved searches); retention policy is a Global Settings tab, not a tree node | `zm-admin-console/WebRoot/js/zimbraAdmin/common/{ZaOverviewPanel,ZaOverviewPanelController,ZaTree}.js` (`OVP_*`) |
| Zimbra | Server status & statistics | Service status per server; global/server stats pages: message count, volume, spam activity, disk, mailbox, sessions (admin, web, IMAP) over hour/day/month/year | `zm-admin-console/WebRoot/js/zimbraAdmin/status/view/ZaServicesListView.js`, `statistics/view/{ZaGlobalStatsView,ZaServerStatsView,ZaGlobal*Page,ZaServer*Page}.js` |
| Nextcloud | **Overview** & setup checks | Admin Overview section: version, update channel, list of **setup checks** (security & configuration warnings with severity and doc links) | `server/apps/settings/lib/Settings/Admin/Overview.php`, `server/apps/settings/src/{main-admin-overview.ts,views/AdminSettingsSetupChecks.vue,components/SettingsSetupChecks/}` |
| Nextcloud | Settings shell | Personal and Admin settings navigation by section: Overview, Basic settings (section id `server`), Sharing, Security, Groupware, Office, Users, Assistant (AI), Administration privileges (delegation), Quick presets, Additional settings; apps register settings into these sections or add their own | `server/apps/settings/src/views/{SettingsApp,SettingsNavigation,SettingsContentWrapper}.vue`, `server/apps/settings/lib/Sections/Admin/*.php` |
| Frappe framework | **System Health Report** | Background workers and queues, scheduler status, socket.io check, emails (failed/pending/unhandled), top errors, DB size and top tables, cache, backup and file sizes, users (total/new), failed logins, active sessions, last active users | `frappe/desk/doctype/system_health_report/` (+ `_errors`, `_queue`, `_tables`, `_workers`, `_failing_jobs`) |
| Twenty | **Admin panel** (instance) | Instance status, health indicators (DB, Redis, worker, queues with queue detail), inferred version, config variables (view/override), workspaces status, user detail with impersonate, AI providers/models | `packages/twenty-front/src/pages/settings/admin-panel/{SettingsAdmin,SettingsAdminInstanceStatus,SettingsAdminIndicatorHealthStatus,SettingsAdminQueueDetail,SettingsAdminConfigVariableDetails,SettingsAdminWorkspacesStatus,SettingsAdminUserDetail}.tsx` |
| Carbon | Settings hub | Settings index with submodule nav in three groups: **Company** (Billing, Company, Companies, Document Templates, Logos, Printing), **Modules** (Accounting, Inventory, Invoicing, Items, People, Planning, Purchasing, Production, Quality, Sales, Resources — one settings page per module), **System** (API Keys, Approval Rules, Audit Logs, Backups, Custom Fields, Demo Data, Integrations, ITAR Certifications, Security, Sequences, Serial Numbers, Webhooks) | `apps/erp/app/routes/x+/settings+/{_index,_layout}.tsx`, `apps/erp/app/modules/settings/ui/useSettingsSubmodules.tsx` |
| Dolibarr | **Setup home** | Setup index: company/organization, modules/applications, menus, display, dictionaries, other setup, security, emails; plus "Tools" (backup, restore, upgrade, purge, about/system info) | `htdocs/admin/index.php`, `htdocs/admin/tools/` |
| OpenProject | **Administration** overview & Information | Admin home of tiles generated from the admin menu: Users and permissions, Work packages, Projects, Custom fields, Labels, Calendars and dates, AI, System settings, Mail and notifications, API and webhooks, Authentication, Announcements, Integrations, Plugins, Backups, Information, Design, Enterprise, Import; **Information** page shows product/core version, build, database version, storage used/free and a checklist of system checks | `config/initializers/menus.rb` (`:admin_menu`), `app/views/admin/{index,info}.html.erb` |
| Redmine | Administration | Admin index and menu: Projects, Users, Groups, Roles and permissions, Trackers, Issue statuses, Workflow, Custom fields, Enumerations, Settings, LDAP authentication, Applications (OAuth), Webhooks, Plugins, Information (checklist of config checks with pass/warn icons, environment) | `lib/redmine/preparation.rb`, `app/views/admin/{index,_menu,info,plugins,webhooks}.html.erb` |
| Moqui baseline | **System dashboard** | Link groups Server Admin (cache, instances, printers, print jobs, service jobs, job runs), Security (users, user groups, artifact groups, active users), Usage (artifact hits, audit log, visits, log viewer), Data Documents and Feeds, Data Admin (L10n, resource finder), Integration Admin (system messages, remotes, types, entity sync), plus System Information: process memory used/peak, threads, load, CPU, OS, runtime start/uptime, framework version, web host, search backend, worker pool (threads, active, queue); Tools dashboard links data import/export, snapshots, SQL runners, entities, data views, status flows, services, Entity Master API, Reload Framework | `components/base/tools/screen/System/dashboard.xml`, `components/base/tools/screen/Tools/dashboard.xml` |

**BOSS implications.** The baseline already collects most health numbers (System
dashboard, job runs, system-message errors); what is missing is a home organized by admin
task. The references suggest an Admin landing page with Zimbra's Monitor / Manage /
Configure grouping, a setup checklist shaped like Nextcloud setup checks and the
OpenProject / Redmine Information checklist (pass or warn per check, with a link to fix
it), and failure counts shaped like Frappe's System Health Report. Carbon's Company /
Modules / System grouping is a candidate shape for the settings index.

---

## 2. Users

| App | Screen/page | What it is | Key files |
| --- | --- | --- | --- |
| Nextcloud | **User management** | Virtual-scrolled user table (display name, email, groups, sub-admin groups, quota bar, language, manager, last login, storage location); left nav of groups with counts (admins, disabled, recent, custom groups); new-user dialog; edit dialog (fields, groups, quota, language, manager); row actions (disable, wipe devices, delete, resend welcome); per-column visibility settings | `server/apps/settings/src/views/{UserManagement,UserManagementNavigation}.vue`, `server/apps/settings/src/components/{UserList.vue,Users/*}` (`NewUserDialog`, `EditUserDialog`, `UserRow`, `UserRowActions`, `UserFormQuota`, `UserFormManager`, `UserSettingsDialog`), `server/apps/settings/src/components/AppNavigationGroupList.vue` |
| Zimbra | Accounts | Account list with search; **New account wizard** (name, COS, password, features, preferences, aliases, forwarding); account form tabs General Information, Contact Information, Member Of, Aliases, Forwarding, Features, Preferences, Themes, Zimlets, Free/Busy Interop, Advanced; dialogs change password, edit alias/forward, move alias, reindex mailbox, bulk delete with progress | `zm-admin-console/WebRoot/js/zimbraAdmin/accounts/view/{ZaAccountListView,ZaNewAccountXWizard,ZaAccountXFormView,ZaAccChangePwdXDlg,ZaEditAliasXDialog,ZaEditFwdAddrXDialog,MoveAliasXDialog,ReindexMailboxXDialog,DeleteAcctsPgrsDlg}.js` |
| Odoo | Users | List with filters Internal Users / Portal Users / Inactive Users, group by company or language; form: name, login, photo, **Access Rights** page (a **Role** radio Light / User / Administrator, allowed companies + default company, then the group picker widget that shows groups by privilege), **Preferences** (language, timezone, notification, signature), **Calendar**, **Security** (change password, API keys, devices with log out from all devices; 2FA rows are added by `auth_totp`) | `odoo/odoo/addons/base/views/res_users_views.xml`, `res_users_apikeys_views.xml`, `res_users_identitycheck_views.xml`, `res_device_views.xml` |
| Frappe framework | User | Form: enabled, name, username, email, language, timezone, **roles** (checkbox grid) or **role profiles**, **module profile** (blocked modules), user type (System/Website), defaults, email signature and user emails, document-follow settings, login window (login after/before hour), restrict IP, simultaneous sessions, API key/secret, social logins, desk theme, active sessions, desk feature toggles (search bar, notifications, list sidebar, bulk actions, view switcher, timeline, dashboard) | `frappe/core/doctype/user/user.{json,js}`, `user_session_display/`, `user_social_login/`, `user_email/` |
| Twenty | Members | Workspace members list, invite by email/link, member detail with role assignment, remove | `packages/twenty-front/src/pages/settings/members/{SettingsWorkspaceMembers,SettingsWorkspaceMember}.tsx`, `modules/settings/workspace-member/` |
| Carbon | Users | Separate lists for **employees**, **customers** (portal), **suppliers** (portal), **operators** (shop-floor PIN users); new employee; reset MFA; reset operator PIN; resend/revoke invite; deactivate; **bulk edit permissions**; employee types | `apps/erp/app/routes/x+/users+/{employees,employees.new,employees.reset-mfa.$employeeId,customers,suppliers,operators,operators.reset-pin.$operatorId,resend-invite,revoke-invite,deactivate,bulk-edit-permissions,employee-types}.tsx`, `apps/erp/app/modules/users/ui/{Employees,Customers,Suppliers,EmployeeTypes,UserAttributes}/` |
| Ever Gauzy | Users | Users list per organization, invite (manage-user-invite), edit user profile and organizations/roles | `apps/gauzy/src/app/pages/users/{users.component.ts,manage-user-invite/,edit-user-profile/,edit-user-mutation/}` |
| Dolibarr | Users | User list, card (login, name, administrator / super-administrator flags, employee flag, hierarchical responsible, range of login validity, force password change, linked contact/member), hierarchy view, **permissions** tab, groups, LDAP, notifications, credentials, API token, display preferences, bank info, agenda, documents, notes | `htdocs/user/{list,card,perms,hierarchy,ldap,credentials,param_ihm,bank,agenda,document,note}.php`, `htdocs/user/{api_token,notify}/card.php` |
| Akaunting | Users | Users list/create/edit/show (name, email, password, companies, roles via Roles app, language, landing page) | `resources/views/auth/users/{index,create,edit,show}.blade.php`, `app/Http/Controllers/Auth/Users.php` |
| AureusERP | Users | Filament resource: list, view, create, edit user; settings page **Manage Users** (default role, invitations) | `plugins/webkul/security/src/Filament/Resources/UserResource/`, `plugins/webkul/security/src/Filament/Clusters/Settings/Pages/ManageUsers.php` |
| OpenProject | Users & placeholder users | Users and permissions → Users: list, new user (invited users activate on first password set), edit tabs (general, working hours, non-working times, memberships, groups, **global roles**, notifications, reminders), change status (lock/unlock/activate) with a confirmation page; **Placeholder users** (named seats assigned to work before a real user exists); **User settings** (defaults for new users) | `app/views/users/`, `app/views/placeholder_users/`, `app/views/admin/settings/users_settings/`, `lib/open_project/ui/extensible_tabs.rb` (`core_user_tabs`) |
| Redmine | Users | List, new, edit tabs (general, groups, memberships, preferences, mail notifications, auto-watch), bulk delete | `app/views/users/{index,new,edit,_general,_groups,_memberships,_preferences,_mail_notifications,bulk_destroy}.html.erb` |
| Moqui baseline | User accounts | System → Security → Users: list, detail (account fields, update password, disable/enable, reset password, **login as** with `ADMIN_LOGIN_AS`, group memberships with from/thru, preferences, notification topic subscriptions, **authentication factors** TOTP / single-use codes / email / SMS, login history, audit log, visits, tarpit locks with release now); SimpleScreens Party detail creates the party's user account and group memberships | `components/base/tools/screen/System/Security/UserAccount/{UserAccountList,UserAccountDetail}.xml`, `UserAccountDetail/{VerifyEmail,VerifySms,VerifyTotp}.xml`, `component/mr-marble/screen/SimpleScreens/Party/EditParty.xml` (`createUserAccount`, `createUserGroupMember`, `resetPassword`) |

**BOSS implications.** A BOSS user is a `UserAccount` on a `Party`, so the Admin user
screen is the user-account part of the reused Contact / party record (also included in
Commons, People and every app that shows a person), not a second person record. The tools
detail already has the actions (login as, factors, login history, tarpit release); what is
missing is a list with status filters, invitations, and the group and app summary that
Odoo's access-rights page and OpenProject's global-roles tab show.
Carbon's split of employees, portal customers and suppliers, and shop-floor operators maps
to party roles plus group membership, not to separate user types.

---

## 3. Groups, roles & permissions

| App | Screen/page | What it is | Key files |
| --- | --- | --- | --- |
| Odoo | Groups | Group form tabs Users, **Dependencies** (implied groups, implied-by groups, disjoint groups), **Access Rights**, Menus, Views, **Settings** (privilege / scope that places the group on the user's access-rights page; API key lifetime in days), Notes; in this checkout model ACLs and record rules are one record: each `ir.access` row has model, create/read/write/delete flags, a **domain** (row filter) and a kind (permission tied to a group, or global restriction) | `odoo/odoo/addons/base/views/res_groups_views.xml`, `odoo/odoo/addons/base/views/ir_access_views.xml`, `odoo/odoo/addons/base/models/ir_access.py` |
| Frappe framework | **Role Permission Manager** | Page: pick DocType or Role → grid of roles × permission levels × rights (read, write, create, delete, submit, cancel, amend, report, export, import, share, print, email, select, mask), "if owner" flag, add a rule, reset to defaults; Role Permission for Page and Report covers non-DocType artifacts | `frappe/core/page/permission_manager/`, `frappe/core/doctype/{docperm,custom_docperm,role_permission_for_page_and_report}/` |
| Frappe framework | Roles & profiles | Role (desk access, 2FA required, home page, disabled); **Role Profile** (bundle of roles); **Module Profile** (blocked modules); **User Type** (limited-user types with allowed doctypes and user-permission field); **User Group** | `frappe/core/doctype/{role,role_profile,module_profile,user_type,user_group}/` |
| Frappe framework | **User Permissions** & inspector | Row-level: restrict a user to specific values of a DocType (e.g. Company = X), apply to all or selected doctypes, hide descendants; **Permission Inspector** explains why a user can or cannot act on a record | `frappe/core/doctype/{user_permission,permission_inspector}/` |
| Twenty | **Roles** | Role list/create/edit; tabs for settings, **permission flags** (Workspace, Members, Roles, Data model, Security, API keys & webhooks, Applications, Billing, Layouts, Views, Workflows, Connected accounts, Import/Export CSV, Upload/Download file, Impersonate, SSO bypass, AI tools: send email, HTTP request, code interpreter, create calendar event), **object-level permissions** (read/update/delete/destroy per object, field-level), assignment to members, API keys and agents | `packages/twenty-front/src/pages/settings/members/roles/{SettingsRoleCreate,SettingsRoleEdit,SettingsRoleObjectLevel,SettingsRoleAddObjectLevel}.tsx`, `packages/twenty-front/src/modules/settings/roles/{role-permissions/{permission-flags,object-level-permissions,objects-permissions},role-assignment,role-settings}/` |
| Carbon | Groups & permissions | User groups (nested, used for approvals and notifications); per-employee **permission form** (module × view/create/update/delete, company-scoped) and **bulk edit** | `apps/erp/app/routes/x+/users+/groups*.tsx`, `apps/erp/app/modules/users/ui/{Groups,Employees/EmployeePermissionsForm.ee.tsx,Employees/BulkEditPermissionsForm.ee.tsx}` |
| Nextcloud | Groups & **delegation** | Groups in the user-management nav (create, rename, delete, sub-admins); **Delegation** section lets a group manage specific admin settings sections without being admin | `server/apps/settings/src/components/{AppNavigationGroupList,GroupListItem,AdminDelegating,AdminDelegation/GroupSelect}.vue`, `server/apps/settings/lib/Settings/Admin/Delegation.php` |
| Zimbra | COS, distribution lists, delegated admin | **Class of Service** (feature/preference/quota bundles assigned to accounts); distribution lists (members, owners, member-of); admin **ACL/grants** on targets; domain ACLs | `zm-admin-console/WebRoot/js/zimbraAdmin/cos/view/{ZaCosListView,ZaCosXFormView,ZaNewCosXWizard}.js`, `dl/view/{ZaDLXFormView,ZaNewDLXWizard}.js`, `common/ACLXFormItem.js`, `domains/view/{ZaAddDomainAclXDialog,ZaEditDomainAclXDialog}.js` |
| Dolibarr | Groups & rights | User groups (members, permissions tab, LDAP); per-module permission checkboxes on user and group; default permissions for new users | `htdocs/user/group/{list,card,perms,ldap}.php`, `htdocs/user/perms.php`, `htdocs/admin/perms.php` |
| Ever Gauzy | **Roles & permissions** | Role selector + permission sections (toggles per permission, ~500 lines of grouped sections: general, admin, organization, employees, invoices, time tracking, …) | `apps/gauzy/src/app/pages/settings/roles-permissions/{roles-permissions.component.ts,permission-sections.ts}` |
| AureusERP | Roles & teams | Filament Shield-style role editor (resource × permission checkboxes), teams resource | `plugins/webkul/security/src/Filament/Resources/{RoleResource,TeamResource}/` |
| OpenProject | Roles, permissions report, groups, departments | **Roles and permissions**: role form with per-module permission checkboxes (project roles and global roles); **Permissions report** (matrix of all roles × all permissions, editable); **Groups** (tabs general, users, memberships, global roles, synchronized LDAP groups); **Departments** hierarchy; **Workflows** per role × type (status transition matrix) | `app/views/roles/{_form,_permissions,report}.html.erb`, `app/views/groups/`, `app/views/admin/departments/`, `app/views/workflows/`, `lib/open_project/ui/extensible_tabs.rb` |
| Redmine | Roles, permissions, workflows | Roles list/form with permission checkboxes; **Permissions** page (roles × permissions matrix); **Workflow** status transitions per role × tracker and **field permissions** (read-only / required per status) | `app/views/roles/{index,_form,permissions}.html.erb`, `app/views/workflows/{edit,permissions,copy}.html.erb`, `app/views/groups/` |
| Moqui baseline | Groups & artifact authz | User groups (detail: group permissions, preferences, artifact authz and tarpits; members on Group Users); **Artifact groups** (screens/services/entities with inherit flag) and **authorizations** (group × artifact group × action view/create/update/delete/all, authz type allow/always/deny); **tarpits** (velocity limits); entity filter sets for row-level | `components/base/tools/screen/System/Security/{UserGroup/{UserGroupList,UserGroupDetail,GroupUsers},ArtifactGroup/{ArtifactGroupList,ArtifactGroupDetail}}.xml`; entities `ArtifactGroup`, `ArtifactAuthz`, `ArtifactTarpit`, `EntityFilterSet`, `EntityFilter`, `UserPermission`, `UserGroupPermission` in `components/base/framework/entity/SecurityEntities.xml` |

**BOSS implications.** Every reference shows permissions as roles with per-area toggles
(Twenty flags, Carbon module × action, Odoo privileges, Redmine and OpenProject role
checkboxes), and most add a matrix (Frappe Role Permission Manager, OpenProject
permissions report, Redmine permissions page). Moqui's `ArtifactGroup` + `ArtifactAuthz`
is the same model one level lower, and Odoo's `ir.access` rows with a domain show model
rights and row rules as one record, the shape of `ArtifactAuthz` + `ArtifactAuthzFilter` /
`EntityFilterSet`. Over that model the references point to three candidate screens: an
app → capability editor that writes artifact authz, a groups × capabilities matrix, and an
access inspector (Frappe Permission Inspector).

---

## 4. Authentication & security policy

| App | Screen/page | What it is | Key files |
| --- | --- | --- | --- |
| Frappe framework | System Settings — security | Session expiry, deny multiple sessions, login with mobile/username/email link, disable user/pass login, password policy + minimum score, force reset after N days, consecutive login attempts + lockout, **2FA** (OTP app / SMS / Email, bypass for restricted-IP users), allow error traceback, dormant days | `frappe/core/doctype/system_settings/system_settings.json` |
| Frappe framework | SSO & directory | **Social Login Key** (Google, GitHub, Office 365, Keycloak, Frappe, Salesforce, custom OIDC; allow/deny sign-ups); **LDAP Settings** (AD/OpenLDAP/custom, field mapping, group → role mapping, TLS, default role/user type); **OAuth Provider Settings** | `frappe/integrations/doctype/{social_login_key,ldap_settings,ldap_group_mapping,oauth_provider_settings}/` |
| Frappe framework | Security Settings | Public `security.txt` (contacts, languages, policy, expiry) | `frappe/core/doctype/security_settings/` |
| Odoo | Auth addons & general settings | Settings blocks: **Permissions** (default access rights for new users, customer account invitation), **API Keys** (allow + duration), **OAuth Authentication**, **LDAP Authentication**; modules `auth_totp` (2FA, enforce by mail), `auth_passkey`, `auth_password_policy`, `auth_timeout`, `auth_signup`; per-user devices list | `odoo/addons/base_setup/views/res_config_settings_views.xml`, `odoo/addons/{auth_totp,auth_totp_mail,auth_passkey,auth_password_policy,auth_timeout,auth_oauth,auth_ldap,auth_signup}/` |
| Nextcloud | Security & auth apps | **Security** admin section: server-side **encryption** settings, enforced **two-factor** (for groups, exclusions), password policy app hook; **LDAP/AD** wizard tabs Server, Users, Login attributes, Groups, Advanced, Expert; **OAuth 2.0 clients** (name, redirect URI, client ID/secret); WebAuthn per user; app passwords / sessions | `server/apps/settings/src/{main-admin-security.js,components/AdminTwoFactor.vue,components/Encryption/}`, `server/apps/user_ldap/src/components/SettingsTabs/{ServerTab,UsersTab,LoginTab,GroupsTab,AdvancedTab,ExpertTab}.vue`, `server/apps/oauth2/src/{views,components/OAuthItem.vue}`, `server/apps/settings/src/{authtokens,main-personal-webauth.js}` |
| Twenty | Security & SSO | **SSO identity providers** (OIDC/SAML), **approved access domains** (auto-join by email domain), 2FA method per user, workspace auth options | `packages/twenty-front/src/pages/settings/security/{SettingsSecuritySsoIdentifyProvider,SettingsSecurityApprovedAccessDomain}.tsx`, `pages/settings/profile/SettingsTwoFactorAuthenticationMethod.tsx`, `modules/settings/{security,two-factor-authentication}/` |
| Carbon | Security & SSO | One **Security** page: require two-factor authentication (upgrade dialog when not entitled); **SAML SSO** connection (IdP metadata URL or pasted XML, ACS URL and SP metadata URL to give the IdP), SSO email domains with verification, require SAML SSO; `sso.tsx` is an action-only route behind that page; ITAR certifications page | `apps/erp/app/routes/x+/settings+/{security,sso,itar-certifications}.tsx`, `apps/erp/app/modules/settings/ui/Security/`, `packages/ee/src/{sso,two-factor.server.ts}` |
| Zimbra | Domain auth & GAL | **Auth config wizard** per domain (internal, external LDAP/AD, custom); **GAL config wizard**; auto-provision; domain certificate; Global Settings also has an Auth tab (SAML SSO) | `zm-admin-console/WebRoot/js/zimbraAdmin/domains/view/{ZaAuthConfigXWizard,ZaGALConfigXWizard,ZaTaskAuthConfigWizard,ZaTaskAutoProvDialog,ZaManualProvConfigDialog}.js`, `globalconfig/view/GlobalConfigXFormView.js` (`NAD_Tab_AUTH`) |
| Dolibarr | Security setup | Password generation/encryption rules, captcha, file upload restrictions, **HTTP security headers**, other (session, login), LDAP, **OAuth** (provider tokens), **OpenID Connect** | `htdocs/admin/{security,security_captcha,security_file,security_headers_http,security_other,ldap,ldap_users,ldap_groups,oauth,oauthlogintokens,openid_connect}.php` |
| Ever Gauzy | OAuth clients | OAuth client registry with secret dialog (Gauzy as provider) | `apps/gauzy/src/app/pages/settings/oauth-clients/` |
| OpenProject | Authentication | **Authentication settings** tabs Login (login required, lost password, block after N failed logins for M minutes), Passwords (minimum length, required character classes, days valid, former passwords banned), Registration (self-registration mode, invitation expiry days), SSO (direct-login provider, remapping existing users); **OAuth applications** (OpenProject as provider); **LDAP connections**; **SCIM clients** (inbound provisioning); modules for 2FA (enforcement, devices), OpenID Connect providers with group links, SAML providers, LDAP group sync | `app/views/admin/settings/authentication_settings/{_login,_passwords,_registration,_sso}.html.erb`, `app/views/oauth/applications/`, `app/views/ldap_auth_sources/`, `app/views/admin/scim_clients/`, `modules/{two_factor_authentication,openid_connect,auth_saml,ldap_groups}/` |
| Redmine | Authentication | Settings → Authentication (login required, autologin, self-registration, password minimum length, required character classes, maximum age, lost password, two-factor authentication mode, session lifetime and timeout); **LDAP authentication** sources (host, port, LDAPS mode, bind account, base DN, filter, on-the-fly user creation, attribute map login/first/last/mail); **Applications** (OAuth via Doorkeeper) | `app/views/settings/_authentication.html.erb`, `app/views/auth_sources/_form_auth_source_ldap.html.erb`, `app/views/doorkeeper/applications/` |
| Moqui baseline | Authc factors, tarpits, SSO entities | Per-user TOTP / single-use / email / SMS factors on the user detail; artifact tarpits; mr-moqui adds **AuthFlow** (`moqui.security.sso`: OAuth, OIDC, SAML flows with field and role maps) and `UserSshKey`, used by `webroot/sso.xml` and the login screen but with no admin screens | `components/base/tools/screen/System/Security/UserAccount/UserAccountDetail.xml`, `components/base/framework/entity/SecurityEntities.xml` (`AuthFlow`, `AuthFlowFieldMap`, `AuthFlowRoleMap`, `OauthFlow`, `OidcFlow`, `SamlFlow`, `UserAuthcFactor`, `UserSshKey`, `UserLoginHistory`, `UserPasswordHistory`), `components/base/webroot/screen/webroot/{sso,Login}.xml` |

**BOSS implications.** Password, session, lockout and 2FA policy are one settings page in
every reference (Frappe System Settings, OpenProject authentication tabs, Redmine
authentication tab, Carbon Security). Moqui has the factors and tarpits but no policy
page. mr-moqui's `AuthFlow` records (OAuth / OIDC / SAML with field and role maps) have no
provider list or editor; Carbon's SAML form and Frappe's Social Login Key and LDAP
Settings are the closest models. 2FA enforced per group (Nextcloud) fits Moqui's group model
directly.

---

## 5. Organizations, companies & general settings

| App | Screen/page | What it is | Key files |
| --- | --- | --- | --- |
| Odoo | **General Settings** & companies | One settings page with app tabs; base blocks: Users (invite, manage), Languages, Companies (name, **Document Layout**, inter-company), Contacts (partner autocomplete), Permissions, Import & Export, Integrations (OAuth, LDAP, geolocation, cloud storage, unsplash), Performance, Progressive Web App, About; Company form with branches; currencies, countries/states, languages, decimal precision, sequences, paper formats | `odoo/addons/base_setup/views/res_config_settings_views.xml`, `odoo/odoo/addons/base/views/{res_company_views,res_currency_views,res_country_views,res_lang_views,decimal_precision_views,ir_sequence_views,report_paperformat_views}.xml` |
| Frappe framework | System Settings & setup wizard | Country, language, time zone, date/time/number formats, float/currency precision, first day of week, app name, backups limit/encryption, scheduler on/off, email footer; **Setup Wizard** for first run; Navbar Settings (logo, items); company/currency in ERPNext | `frappe/core/doctype/system_settings/`, `frappe/desk/page/setup_wizard/`, `frappe/core/doctype/navbar_settings/` |
| Nextcloud | Basic settings, theming, presets | Basic settings: **background jobs** mode (AJAX/Webcron/Cron, last run, errors), email server (§9), profile defaults, system-tag creation restriction; **Theming** (name, URL, slogan, color, logo, background, favicon, legal links, user theming toggle); **Presets** (apply a recommended config bundle: SMB, education, …); language & locale | `server/apps/settings/src/{main-admin-basic-settings.js,components/BasicSettings/{BackgroundJob,ProfileSettings}.vue,views/SettingsPresets.vue,components/SettingsPresets/}`, `server/apps/theming/src/views/{AdminTheming,UserTheming}.vue`, `server/apps/settings/src/views/LanguageLocaleSettings.vue` |
| Zimbra | Global settings, domains, servers | **Global Settings** tabs: General Information, Attachments, MTA, IMAP, POP, AS/AV (anti-spam/virus), Interop, Themes, Auth, Retention Policy; **Domains** (new domain wizard, aliases, GAL, auth, quotas, certificate, features, themes, zimlets); **Servers** (services, volumes, bind IP, proxy, flush cache) | `zm-admin-console/WebRoot/js/zimbraAdmin/globalconfig/view/GlobalConfigXFormView.js`, `domains/view/{ZaNewDomainXWizard,ZaDomainXFormView,ZaDomainAliasWizard,ZaDomainAccountQuotaListView}.js`, `servers/view/{ZaServerXFormView,ZaServerVolumesListView,ZaEditVolumeXDialog,ZaFlushCacheXDialog}.js`, `rp/` |
| Carbon | Company & companies | Company profile, **multiple companies** (create, switch), logos, sequences per table (prefix/next/padding), serial-number schemes, tags, theme; per-module settings pages (accounting, inventory, invoicing, items, people, planning, production, purchasing, quality, resources, sales) | `apps/erp/app/routes/x+/settings+/{company,companies,company.switch.$companyId,logos,sequences,sequences.$tableId,serial-numbers,tags,accounting,inventory,…}.tsx`, `apps/erp/app/modules/settings/ui/{Company,Companies,Sequences,SerialNumbers,Theme}/` |
| Ever Gauzy | Organizations & settings | Organization list and edit (main, location, other settings incl. time format, start of week, fiscal year, bonus, invites); settings: general (personal settings), feature toggles, **custom SMTP**, email history, file storage provider, SMS gateway, danger zone, monitoring | `apps/gauzy/src/app/pages/organizations/edit-organization/edit-organization-settings/{edit-organization-main,edit-organization-location,edit-organization-other-settings}/`, `apps/gauzy/src/app/pages/settings/{general-setting,feature,custom-smtp,email-history,file-storage,sms-gateway,danger-zone,monitoring}/` |
| Akaunting | Settings | Company, Localisation (date/time format, fiscal year start, timezone, percent position), Defaults (account, currency, tax, payment method, language), Invoice (prefix/next number, template, color), Email & Email templates, Schedule (reminders), Categories, Currencies, Taxes, Modules (app store purchases) | `resources/views/settings/{company,localisation,default,invoice,email,email-templates,schedule,categories,currencies,taxes,modules}/`, `app/Http/Controllers/Settings/` |
| Dolibarr | Company & dictionaries | Company/organization (name, address, managers, fiscal year, social networks, opening hours); display (`ihm`), menus, **dictionaries** (countries, currencies, payment terms, units, … ~60 lookup tables), default values, delays/alerts, limits & precision, translation overrides, PDF options | `htdocs/admin/{company,company_socialnetworks,openinghours,ihm,menus,dict,defaultvalues,delais,limits,translation,pdf,pdf_other}.php` |
| OpenProject | System settings, calendars, design | **System settings** General (application title, organization name, host name, page sizes, feeds, welcome block), Languages, External links, Exports, Repositories, Experimental; **Calendars and dates** (working days and hours, date and time formats, iCalendar subscriptions); **Design** (custom style: logo, colors); **Announcements** (banner to all users) | `app/views/admin/settings/{general_settings,languages_settings,external_links_settings,exports_settings,date_format_settings,working_days_and_hours_settings,icalendar_settings}/`, `app/forms/admin/settings/general_settings_form.rb`, `app/views/custom_styles/`, `app/views/announcements/` |
| AureusERP | Companies & settings | Company resource (list/create/view/edit), settings pages Manage Users, Manage Currency, Manage Activity | `plugins/webkul/security/src/Filament/Resources/CompanyResource/`, `plugins/webkul/security/src/Filament/Clusters/Settings/Pages/{ManageUsers,ManageCurrency,ManageActivity}.php` |
| Moqui baseline | Org & preferences | SimpleScreens **Vendor** (internal organizations: org detail, contact info, roles, **init accounting configuration**, accounting preferences, users); **Accounting OrgSettings** (acctg preference, GL account defaults, invoice/item/payment/asset types, financial account types/reasons, payment instruments); ProductStore settings; Party detail edits per-party **PartySetting** values (`storePartySetting`, e.g. the `OrgTemplate*` print templates); System **Localization** (messages, entity field translations); status flows editable via Tools (enumerations only through Entity DataEdit) | `component/mr-marble/screen/SimpleScreens/Vendor/{FindVendor,EditVendor,EditUsers}.xml`, `component/mr-marble/screen/SimpleScreens/Accounting/OrgSettings/*.xml`, `component/mr-marble/screen/SimpleScreens/ProductStore/FindProductStoreSettings.xml`, `component/mr-marble/screen/SimpleScreens/Party/EditParty.xml`, `components/base/tools/screen/System/Localization/{Messages,EntityFields}.xml`, `components/base/tools/screen/Tools/StatusFlows.xml` |

**BOSS implications.** The settings only Admin includes are the instance-wide ones (name,
branding, localization, formats, working days). The organization profile is part of the
reused Contact / party record for the internal organization, and accounting, store and
gateway settings are in the apps whose audience uses them (Accounting OrgSettings, Commerce
stores), with gateway configuration a reused screen that Admin also includes (crosscut
§4). Mantle already has a typed setting
definition for party-scoped settings (`PartySettingType` with regexp, enum type and
default value).

---

## 6. Apps, modules & feature toggles

| App | Screen/page | What it is | Key files |
| --- | --- | --- | --- |
| Nextcloud | **App store** | Discover, browse by category, bundles; app grid/table with level/score badges; enable/disable, **limit to groups**, update all; ExApp daemon selection | `server/apps/appstore/src/{AppstoreApp.vue,views/{AppstoreDiscover,AppstoreBrowse,AppstoreBundles}.vue,components/{AppGrid,AppTable,AppActions.vue,LimitToGroupDialog.vue,UpdateAllDialog.vue,DaemonSelectionDialog}}` |
| Odoo | Apps | Module kanban/list (install, upgrade, uninstall with dependency preview), app store link, theme store | `odoo/odoo/addons/base/views/ir_module_views.xml` (`menu_apps`, `menu_module_tree`) |
| Dolibarr | Modules/applications | Module list by family with on/off switch and per-module setup link; module builder for new modules | `htdocs/admin/modules.php`, `htdocs/modulebuilder/` |
| AureusERP | Plugin manager | List plugins with install/uninstall | `plugins/webkul/plugin-manager/src/Filament/Resources/PluginResource/` |
| Twenty | Applications | Installed and available applications (extensions), application detail with connections, front components, command-menu items, timeline activity types; registration admin | `packages/twenty-front/src/pages/settings/applications/{SettingsApplications,SettingsApplicationDetails,SettingsAvailableApplicationDetails,SettingsApplicationConnectionDetail}.tsx` |
| Ever Gauzy | Feature toggles | Per-tenant/org feature flags page | `apps/gauzy/src/app/pages/settings/feature/` |
| Zimbra | Zimlets & admin extensions | Deploy zimlet wizard, enable per COS/domain; admin extension list | `zm-admin-console/WebRoot/js/zimbraAdmin/zimlets/view/{ZaZimletListView,ZaZimletDeployXWizard,ZaZimletXFormView}.js`, `adminext/view/ZaAdminExtListView.js` |
| Frappe framework | Installed apps & domains | Installed applications list; domain settings to show/hide modules; Desktop/workspace hiding | `frappe/core/doctype/{installed_applications,domain_settings}/` |

**BOSS implications.** BOSS apps are fixed screens gated by authz, not installable
modules, so "app enablement" means which groups can open which IronStone app. Nextcloud's
limit-to-groups dialog is the closest UI; in BOSS terms it is artifact authz on each app
root, which one option would show and edit on the group screen.

---

## 7. Customization (custom fields, data model, layouts)

| App | Screen/page | What it is | Key files |
| --- | --- | --- | --- |
| Frappe framework | **Customize Form**, custom fields, client scripts | Per DocType: add/reorder/hide fields, labels, mandatory, permlevel, list/kanban options; Custom Field; Property Setter; Client Script; DocType Layout; document naming rules | `frappe/custom/doctype/{customize_form,custom_field,property_setter,client_script}/`, `frappe/core/doctype/{doctype_layout,document_naming_rule,document_naming_settings}/` |
| Twenty | **Data model** | Objects list (standard + custom), new object, object detail (fields table, indexes, search, translations, validation rules), field edit; **Layout** settings for page layouts and views | `packages/twenty-front/src/pages/settings/data-model/{SettingsObjects,SettingsNewObject,SettingsObjectDetailPage,SettingsObjectFieldEdit,SettingsObjectIndexes,SettingsObjectTranslations}.tsx`, `pages/settings/layout/{SettingsLayout,SettingsLayoutPageLayoutDetail,SettingsLayoutViewDetail}.tsx` |
| Carbon | Custom fields | Per table: list/new/edit/delete custom fields | `apps/erp/app/routes/x+/settings+/custom-fields*.tsx`, `apps/erp/app/modules/settings/ui/CustomFields/` |
| AureusERP | Custom fields | Field resource (model, type, label, options) | `plugins/webkul/fields/src/Filament/Resources/FieldResource/` |
| Dolibarr | Extra fields | Per-object complementary attributes setup | `htdocs/admin/extrafields.php`, `htdocs/core/tpl/admin_extrafields_*.tpl.php` |
| Odoo | Technical: models, views, menus | Database Structure (models, fields, relations), User Interface (menus, views), Actions, Sequences & Identifiers, Parameters (system parameters), Reporting (paper formats) | `odoo/odoo/addons/base/views/{ir_model_views,ir_ui_view_views,ir_ui_menu_views,ir_actions_views,ir_config_parameter_views,ir_default_views}.xml`; menu tree `base_menus.xml` (`menu_custom`) |
| OpenProject | Custom fields, attributes, form configuration | Custom fields per object (work packages, versions; **project attributes**, **user attributes**, **group attributes** as their own admin pages); **form configuration** per work-package type (attribute groups and order); attribute help texts; statuses, types, priorities | `app/views/custom_fields/`, `app/views/admin/settings/{project_custom_fields,user_custom_fields}/`, `app/views/form_configurations/`, `app/views/attribute_help_texts/`, `app/views/{statuses,work_package_types}/` |
| Redmine | Custom fields, enumerations, trackers | Custom fields per object type; **Enumerations** (priorities, activities, document categories); trackers and issue statuses | `app/views/custom_fields/`, `app/views/enumerations/`, `app/views/{trackers,issue_statuses}/` |
| Moqui baseline | Status flows, auto screens, enumerations | Status flow editor; Auto Screens over any entity; Entity DataEdit (find/edit any record) | `components/base/tools/screen/Tools/{StatusFlows,Data/Browse,Data/Grid}.xml` |

**BOSS implications.** Custom fields have no baseline screen, but the baseline already has
status flows, DB view entities and `DbForm` covering part of what customization offers in
the references. OpenProject's split of custom fields by the object they extend (project,
user and group attributes) suggests one option: each app's settings section edits the
fields for the records that app shows.

---

## 8. Integrations (OAuth, webhooks, API keys, gateways)

| App | Screen/page | What it is | Key files |
| --- | --- | --- | --- |
| Frappe framework | **Webhook** | Per DocType + event (insert, update, submit, cancel, trash, value change), condition, URL (static or dynamic), method, headers, form/JSON body, HMAC secret, timeout, retries, queue; request log | `frappe/integrations/doctype/{webhook,webhook_header,webhook_data,webhook_request_log}/` |
| Frappe framework | Connected apps & OAuth | **Connected App** (outbound OAuth/OIDC client to third parties, scopes, token cache); **OAuth Client** (Frappe as provider: client id/secret, redirect URIs, grant type, allowed roles, dynamic registration); Google/Slack/push settings; integration request log | `frappe/integrations/doctype/{connected_app,token_cache,oauth_client,oauth_scope,oauth_settings,google_settings,slack_webhook_url,push_notification_settings,integration_request}/` |
| Twenty | **Developers** | API keys (new, detail with expiry, role), **webhooks** (URL, operations, secret), API playground (GraphQL and REST); **MCP** settings; logic functions; event logs | `packages/twenty-front/src/pages/settings/developers/{SettingsDevelopers.tsx,api-keys/,webhooks/,playground/}`, `packages/twenty-front/src/modules/settings/{mcp,event-logs,logic-functions}/` |
| Carbon | API keys, webhooks, integrations | API keys (new/detail/delete); **webhooks** (new, edit, rotate secret, delete); **integrations** marketplace cards with install modes, OAuth state, account and dimension mapping, posting sync settings and sync activity (QuickBooks, Xero, Sage, Rillet, Ramp, Slack, Jira, Linear, Onshape, Paperless Parts, Radan, Stripe Connect, OEE devices, MCP, …) | `apps/erp/app/routes/x+/settings+/{api-keys*,webhooks*,integrations*}.tsx`, `apps/erp/app/modules/settings/ui/{ApiKeys,Webhooks}/`, `apps/erp/app/modules/settings/ui/Integrations/{IntegrationsList,IntegrationCard,IntegrationForm,AccountMapping,DimensionMapping,PostingSyncSettings,SyncActivity,InstallModeDialog}.tsx`, `packages/ee/src/{integrations,quickbooks,xero,sage,slack,jira,linear,webhooks.server.ts,api-keys.server.ts}` |
| Ever Gauzy | Integrations | Integration catalog with filters; plugin UIs for Upwork, Hubstaff, GitHub, Jira, Zapier, Make, Activepieces, Plane, WakaTime, AI | `apps/gauzy/src/app/pages/integrations/`, `packages/plugins/integration-*-ui/` |
| Nextcloud | Workflow, webhooks, external integrations | **Flow** (workflow engine): rules = event + checks (file type, group membership, request time, user agent, …) + operation; **webhook listeners** registered by API; Dropbox/Google import apps; external sites; provisioning API | `server/apps/workflowengine/src/components/{Workflow,Rule,Event,Check,Operation}.vue`, `server/apps/webhook_listeners/lib/`, `integration_google/src/`, `integration_dropbox/src/`, `external/src/`, `server/apps/provisioning_api/` |
| Odoo | Integrations & IAP | Settings → Integrations (OAuth providers, LDAP, cloud storage Google/Azure, Google/Microsoft accounts for mail/calendar, reCAPTCHA, geolocation); **IAP** account credits; automation **webhooks** (see §10) | `odoo/addons/base_setup/views/res_config_settings_views.xml`, `odoo/addons/{iap,cloud_storage,cloud_storage_google,cloud_storage_azure,google_account,microsoft_account,google_gmail,microsoft_outlook,google_recaptcha}/` |
| Dolibarr | Webhooks, API, connectors | **Webhook** targets (URL, triggers) with trigger history; REST API module and per-user API token; Zapier, Stripe, PayPal, click-to-dial, DAV, external RSS/agenda sites | `htdocs/webhook/{target_list,target_card,triggerhistory_list,triggerhistory_card}.php`, `htdocs/admin/webhook.php`, `htdocs/api/`, `htdocs/user/api_token/`, `htdocs/admin/{dav,clicktodial,external_rss,agenda_extsites}.php`, `htdocs/{stripe,paypal,zapier}/` |
| OpenProject | Outgoing webhooks, API | **Webhooks** (name, payload URL, description, signature secret, enabled, events per resource — work package, project, time entry, attachment, comment — and all or selected projects) with a **deliveries** table showing each request and response; log cleanup job; API settings (API tokens, CORS) | `modules/webhooks/app/views/webhooks/outgoing/admin/{index,_form,show}.html.erb`, `modules/webhooks/app/components/webhooks/outgoing/deliveries/`, `modules/webhooks/app/workers/cleanup_webhook_logs_job.rb`, `app/views/admin/settings/api_settings/` |
| Redmine | Webhooks, applications | **Webhooks** (URL, secret, active, events, projects); REST API settings; OAuth **Applications** (Doorkeeper) | `app/views/webhooks/{index,_form}.html.erb`, `app/views/admin/webhooks.html.erb`, `app/views/settings/_api.html.erb`, `app/views/doorkeeper/applications/` |
| Moqui baseline | System message remotes & gateways | **Message Remotes** (send/receive URLs, username/password, keys and SSH host fingerprint, shared secrets, auth header, message and send auth types, **authorized IP addresses**, internal/remote ids, EDI separators, pre-auth remote), Message Types (produce/consume/send/receive services, content type, receive/send paths and file pattern); payment and shipping **gateway** configs per store/org | `components/base/tools/screen/System/SystemMessage/{Remote/{MessageRemoteList,MessageRemoteDetail},Type/{MessageTypeList,MessageTypeDetail}}.xml`, `component/mr-marble/screen/SimpleScreens/Gateway/{Payment/{FindPaymentGateway,EditPaymentGateway},Shipping/{FindShippingGateway,EditShippingGateway}}.xml` |

**BOSS implications.** Outgoing webhooks have the same shape in Frappe, Twenty, Carbon,
OpenProject and Redmine: URL, secret, events, scope, enabled, and a delivery log with
responses. In Moqui that is a `SystemMessageType` + `SystemMessageRemote` pair with
`SystemMessage` rows as the delivery log, so what is missing is a webhook-shaped screen
over existing records. API keys could use `UserLoginKey` (hashed key, from/thru,
description), which today has no screen.

---

## 9. Mail servers, protocol servers, system messages & notifications

| App | Screen/page | What it is | Key files |
| --- | --- | --- | --- |
| Frappe framework | **Email Account** & domain | Per account: incoming (IMAP/POP, folders, sync option, append-to DocType, auto-linking, notify if unreplied), outgoing (SMTP, TLS/SSL, default outgoing, track status, signature, footer, auto-reply); email domain; email queue, unhandled email, email rules, templates, unsubscribe | `frappe/email/doctype/{email_account,email_domain,imap_folder,email_queue,unhandled_email,email_rule,email_template,email_unsubscribe}/` |
| Frappe framework | **Notification** | Rule per DocType: event (new, save, submit, cancel, days before/after, value change, method), condition, channel (Email, Slack, System Notification, SMS), recipients (fields, roles, owner, assignees), template, attach print | `frappe/email/doctype/{notification,notification_recipient}/`, `frappe/core/doctype/sms_settings/` |
| Twenty | Accounts & communications | Connected email/calendar accounts (Google, Microsoft, **IMAP/SMTP/CalDAV** connection forms), channel configuration, email-group channels; workspace **communications**: unsubscribe topics and unsubscribers; emailing domains | `packages/twenty-front/src/pages/settings/accounts/{SettingsAccounts,SettingsAccountsEmails,SettingsAccountsCalendars,SettingsAccountsNewImapSmtpCaldavConnection,SettingsAccountsEditImapSmtpCaldavConnection}.tsx`, `pages/settings/communications/`, `modules/settings/{emailing-domains,unsubscribe-topics,unsubscribers}/` |
| Nextcloud | Email server, mail providers, Groupware (CalDAV) | Basic settings: admin **email server** form (send mode SMTP/sendmail, server address and port, transport encryption, authentication, from address, disable certificate verification, send test email) and **Mail Providers** (send calendar invitations from the user's own Mail account or the system account); **Groupware** section filled by the `dav` app: CalDAV server settings (send invitations, birthday calendars, event reminders incl. to shared users and push), system address book, example content | `server/apps/settings/src/{admin-settings-mail.ts,views/AdminSettingsMailServer.vue}`, `server/apps/settings/lib/Settings/Admin/{Mail,MailProvider}.php`, `server/apps/settings/lib/Sections/Admin/Groupware.php`, `server/apps/dav/lib/Settings/{CalDAVSettings,ExampleContentSettings,Admin/SystemAddressBookSettings}.php`, `server/apps/dav/src/views/{CalDavSettings,ExampleContentSettingsSection}.vue` |
| Nextcloud | Talk and Mail app admin | **Talk** admin sections: general, allowed groups, bots, federation, Matrix, Matterbridge, signaling servers (own or hosted), **STUN** and **TURN** servers, recording servers, SIP bridge, web server setup checks; **Mail** app admin: account provisioning from user attributes (with preview), Gmail and Microsoft OAuth app credentials, anti-spam report addresses | `spreed/src/components/AdminSettings/{GeneralSettings,AllowedGroups,BotsSettings,FederationSettings,MatrixSettings,MatterbridgeIntegration,SignalingServers,HostedSignalingServer,StunServers,TurnServers,RecordingServers,SIPBridge,WebServerSetupChecks}.vue`, `mail/src/components/settings/{AdminSettings,ProvisioningSettings,ProvisionPreview,GmailAdminOauthSettings,MicrosoftAdminOauthSettings,AntiSpamSettings}.vue` |
| Zimbra | **MTA** & queues | MTA settings as Global Settings tabs (MTA: relay and fallback relay, my networks, max message size, DNS checks, protocol checks, RBL/RHSBL rejects, milter, TLS-only auth; IMAP; POP; AS/AV); **mail queues** per server (deferred, incoming, active, hold, corrupt) with summary by sender/recipient/origin, and actions (requeue, hold, release, delete) | `zm-admin-console/WebRoot/js/zimbraAdmin/mta/view/{ZaMTAListView,ZaMTAXFormView,ZaQSummaryListView,ZaQMessagesListView,ZaMTAActionDialog}.js`, `globalconfig/view/GlobalConfigXFormView.js` (`NAD_MTA_*`) |
| Odoo | Outgoing mail servers & mail | Technical → Email: outgoing mail servers (SMTP, auth, test), incoming mail servers (IMAP/POP fetch), templates, messages, aliases domain, ICE servers for calls | `odoo/odoo/addons/base/views/ir_mail_server_views.xml`, `odoo/addons/mail/views/{fetchmail_views,ir_mail_server_views,mail_ice_server_views}.xml` |
| Dolibarr | Emails setup & collectors | Sending method (PHP mail / SMTP / sendmail), per-purpose senders (emailing, ticket, password reset), sender profiles, templates; **email collectors** (IMAP poll with filters and actions creating tickets/leads/events) | `htdocs/admin/{mails,mails_emailing,mails_ticket,mails_passwordreset,mails_senderprofile_list,mails_templates,mails_ingoing,emailcollector_list,emailcollector_card,notification}.php` |
| Ever Gauzy | Custom SMTP & SMS | Tenant SMTP override with test; email history; SMS gateway selection | `apps/gauzy/src/app/pages/settings/{custom-smtp,email-history,sms-gateway}/` |
| Akaunting | Email | Mail protocol and SMTP settings; email templates per event | `resources/views/settings/{email,email-templates}/` |
| Frappe suite | Mail admin dashboard | Mail server admin: overview, **domains** (DNS records), accounts, users, groups, mailing lists, invites, **DMARC reports** and **TLS reports** | `frontend/src/apps/mail/pages/dashboard/{OverviewView,DomainsView,DomainView,AccountsView,UsersView,GroupsView,MailingListsView,InvitesView,DmarcReportsView,TlsReportsView}.vue` |
| OpenProject | Mail and notifications | Notification settings (defaults), **email notifications** (from address, BCC, plain text, salutation, header and footer, delivery method SMTP or sendmail with address, port, domain, auth, user, password, STARTTLS/SSL, send test email), **incoming emails** (body delimiters and regex, ignored attachment names) | `app/views/admin/settings/{mail_notifications_settings,incoming_mails_settings}/`, `app/forms/admin/settings/mail_notifications_setting_form.rb` |
| Redmine | Email notifications, incoming emails | Settings tabs Email notifications and **Incoming emails** (mail handler API key for the receiving script, body delimiters, excluded attachment names, preferred body part) | `app/views/settings/{_notifications,_mail_handler}.html.erb` |
| Moqui baseline | **System messages**, email, SSH/SFTP | SystemMessage list (send/consume all, new incoming) and detail (status, type, remote, direction, editable text, send, consume, queue ack, reset error, cancel, download text); `EmailServer` (SMTP host/port/TLS, store host/port/protocol/folder, delete/mark seen, credentials, allowed recipient domains) and `EmailTemplate` have no admin screens (SimpleScreens ProductStore Emails picks templates per store); seeded `poll_EmailServer_frequent` job (paused); NotificationTopic subscriptions per user; a `SystemMessageHook` entity (webhook trigger on message status) is only a commented-out sketch in `ServiceEntities.xml`, not a runtime entity; mr-moqui adds **conf properties** for the built-in SSH server (`ssh_port`, `ssh_sftp_root`, `ssh_max_sessions`), `email_allowed_hosts`, `user_privileged_groups`, `user_sealed_permissions` | `components/base/tools/screen/System/SystemMessage.xml`, `components/base/tools/screen/System/SystemMessage/Message/{SystemMessageList,SystemMessageDetail,SystemMessageDetail/EditMessageText}.xml`; entities `SystemMessage*` in `components/base/framework/entity/ServiceEntities.xml`, `EmailServer`, `EmailTemplate` in `components/base/framework/entity/BasicEntities.xml`, `NotificationTopic*` in `components/base/framework/entity/SecurityEntities.xml`; `components/base/framework/conf/MoquiDefaultConf.xml`, `components/base/framework/data/MoquiSetupData.xml`, `component/mr-marble/screen/SimpleScreens/ProductStore/FindProductStoreEmails.xml` |

**BOSS implications.** initial-design puts protocols in mr-moqui, and research-crosscut §4
lists email sending as reused by Comms (accounts, sending, tracking, unsubscribe and
consent), Marketing, Customer Service and Admin, with Admin's version covering the
servers: outgoing relay or smarthost (`EmailServer`), SMTP gateway trust (allowed gateway
IPs, as `SystemMessageRemote.authorizedIpAddresses` already does for remotes), mail
domains and their DNS checks, the built-in SSH/SFTP server (today conf properties),
CalDAV/CardDAV server options (Nextcloud Groupware section), chat and WebRTC servers
(Nextcloud Talk: signaling, STUN, TURN, recording), and queue views (Zimbra mail queues,
system-message errors). Personal and shared mail accounts and email templates are reused
screens over the same records, emphasized in Comms; Admin can include or link to them.

---

## 10. Scheduled jobs & automation

| App | Screen/page | What it is | Key files |
| --- | --- | --- | --- |
| Frappe framework | Scheduled jobs & workers | **Scheduled Job Type** (method, frequency or cron, queue, stopped, last/next execution), scheduled job log, **RQ Job** and **RQ Worker** views, background tasks, Scheduler event | `frappe/core/doctype/{scheduled_job_type,scheduled_job_log,rq_job,rq_worker,background_task,scheduler_event}/` |
| Frappe framework | **Automation flow**, assignment, auto repeat | Automation Flow (trigger: doc created/updated/field changed/deleted/submitted/date offset/cron; filters, condition; actions; run as triggering user / owner / automation user; run log with steps); **Assignment Rule** (round robin, load balancing, by field, weighted; days; close condition); **Auto Repeat**; **Server Script** (DocType event, scheduler, permission query, API, workflow task; rate limits) | `frappe/automation/doctype/{automation_flow,automation_action,automation_run,automation_run_step,assignment_rule,auto_repeat}/`, `frappe/core/doctype/server_script/` |
| Odoo | Scheduled actions & **automation rules** | `ir.cron` (model, method/code, interval, next call, active, triggers); **Automation rules** with triggers: stage/user/tag/state/priority set, archive/unarchive, create, update, delete, UI change, based on date field, after creation/last update, **on webhook** (incoming URL, log calls); actions = server actions | `odoo/odoo/addons/base/views/{ir_cron_views,ir_cron_trigger_views,ir_actions_views}.xml`, `odoo/addons/base_automation/{views/base_automation_views.xml,models/base_automation.py,static/src/}` |
| Nextcloud | Background jobs & Flow | Cron mode (basic settings); Flow rules (§8) | `server/apps/settings/src/components/BasicSettings/BackgroundJob.vue`, `server/apps/workflowengine/src/` |
| Dolibarr | **Scheduled jobs** | Cron job list (label, class/method or command, frequency, next run, last result, status, priority), card with run now, history | `htdocs/cron/{list,card,info}.php`, `htdocs/admin/` cron setup via `htdocs/cron/admin/` |
| Carbon | Approval rules | Approval rule list/edit (Enterprise `.ee` files): document type (purchase order, quality document, supplier, change notice), minimum amount up to the next rule, who can approve (groups and individuals), default approver, escalation days, enabled | `apps/erp/app/routes/x+/settings+/approval-rules*.tsx`, `apps/erp/app/modules/settings/ui/Approvals/` |
| Twenty | Workflows | Workflow builder (triggers, steps, runs, versions) as standard objects; logic functions | `packages/twenty-front/src/modules/workflow/`, `pages/settings/logic-functions/` |
| ServiceJobMonitor | Job monitors, bounds, alerts, charts | **Monitor** per ServiceJob (title, value path into the job-run results, index, status, algorithm); **bounds** (lower/upper, count, cron so limits can differ by time); **alerts** when a run falls outside bounds (from/thru, value, notification, issue URL, assigned party, status, notified flag); per-monitor notification topic and email settings; charts of values over runs | `screen/MonitorAdmin/Monitor/{FindMonitor,MonitorDetails}.xml`, `screen/MonitorAdmin/Monitor/MonitorDetails/{MonitorSettings,MonitorSettingsBounds,MonitorSettingsNotification,MonitorAlerts,MonitorChart}.xml`, `screen/MonitorAdmin/{Alerts,Charts}.xml`, `entity/ServiceJobMonitor.xml` (`ServiceJobMonitor`, `ServiceJobMonitorBounds`, `ServiceJobMonitorAlert`) |
| Moqui baseline | **Service jobs** | Job list/detail (service, cron, paused, parameters, users to notify, run now), **job runs** list/detail (start/end, results, errors, messages); framework seeds jobs for cleanup (`clean_ArtifactData_daily`, `clean_PrintJobData_daily`, `clean_ServiceJobRun_daily`), `backup_EmbeddedDatabase_daily`, system-message send/consume, `poll_EmailServer_frequent`, entity sync, scheduled screens, data feeds, snapshots | `components/base/tools/screen/System/ServiceJob/{Jobs/{ServiceJobList,ServiceJobDetail},JobRuns/{JobRunList,JobRunDetail}}.xml`, `components/base/framework/data/MoquiSetupData.xml` |

**BOSS implications.** The job screens are complete for one job at a time; missing is
health across jobs (failing, late, paused) and alert rules. ServiceJobMonitor already
shows the Moqui-native shape: bounds on a value read from job-run results, and alerts with
an assignee and an issue URL. Automation rules (Odoo, Frappe) overlap service ECAs, which
the baseline already has; approval rules (Carbon) sit with the records they approve, which
suggests each app's settings section that includes those records.

---

## 11. Data import, export & backup

| App | Screen/page | What it is | Key files |
| --- | --- | --- | --- |
| Odoo | **Import** (base_import) | From any list: upload XLSX/CSV → column mapping with field suggestions (incl. related and sub-fields), options side panel (encoding, separator, date/number formats, batch size, skip first row), **Test** then **Import**, per-column errors, progress for large files, import templates per model | `odoo/addons/base_import/static/src/{import_action,import_data_content,import_data_options,import_data_sidepanel,import_data_column_error,import_data_progress,import_records}/`, `odoo/addons/base_import/models/` |
| Odoo | Export | List action Export: pick fields (tree), import-compatible mode, saved export lists, CSV/XLSX | `odoo/addons/web/static/src/views/view_dialogs/export_data_dialog.js` |
| Frappe framework | **Data Import** | Doc: DocType, import type (insert / update / insert or update), file or Google Sheets URL, template options, **value mapping**, warnings, preview grid, skipped rows, status (Pending/In Progress/Success/Partial Success/Error/Timed Out), import log, submit after import, mute emails | `frappe/core/doctype/{data_import,data_import_log,data_import_skipped_row,data_import_value_mapping}/` |
| Frappe framework | Export, backups, packages | Data Export; **Backups** page (download DB/files backups, schedule); package import/release; deleted documents restore | `frappe/core/doctype/data_export/`, `frappe/desk/page/backups/`, `frappe/core/doctype/{package,package_import,package_release,deleted_document}/` |
| Twenty | **Spreadsheet import** | Modal stepper: upload → select sheet → select header row → **match columns** to fields (auto-match suggestions, sub-fields, do-not-import) → validate (inline cell errors, edit) → import in batches with capacity limit; export CSV from views | `packages/twenty-front/src/modules/spreadsheet-import/steps/components/{UploadStep,SelectSheetStep,SelectHeaderStep,MatchColumnsStep,ValidationStep,ImportDataStep.tsx,SpreadsheetImportStepper.tsx}`, `modules/object-record/spreadsheet-import/` |
| Carbon | Import, backups, demo data | Shared `import/<table>` route (CSV mapping and row classification for items, stock, config lookups); **Backups** page; **Demo data** load/remove | `apps/erp/app/routes/x+/shared+/import.$tableId.tsx`, `apps/erp/app/modules/shared/imports.models.ts`, `apps/erp/app/routes/x+/settings+/{backups,demo-data}.tsx` |
| Dolibarr | Import & export wizards | **Import**: choose dataset → format (CSV/XLSX) → upload → map fields → simulate → import, with keys for update; **Export**: dataset → fields → filters → format → download, saved export profiles | `htdocs/imports/import.php` (`step=1..6`), `htdocs/exports/export.php`, `htdocs/admin/{import,export}.php` |
| Ever Gauzy | Import / export | Export all org data (selected entities) to zip; import from zip with history; external redirect | `apps/gauzy/src/app/pages/import-export/{import,export,external-redirect}/` |
| Akaunting | Import | Per-entity import from template (items, contacts, transactions, …) | `resources/views/common/import/create.blade.php`, `app/Imports/` |
| Zimbra | Migration downloads | Tools and Migration → **Downloads**: links to migration and import tools (Exchange, Domino, GroupWise migration wizards, PST import) that run outside the console; no in-console CSV bulk provisioning in this checkout (accounts are added one at a time with the New Account wizard) | `zm-admin-console/WebRoot/js/zimbraAdmin/helpdesk/{view/ZaMWizView.js,controller/ZaMWizController.js}`, `accounts/view/ZaNewAccountXWizard.js` |
| OpenProject | Backups, Jira import | **Backup** page: backup token (who holds one, reset token), request a backup with or without attachments, download when ready; **Import → Jira**: Jira instances (connection) and import runs with history | `app/views/admin/backups/show.html.erb`, `app/views/admin/import/jira/{instances,import_runs}/` |
| Moqui baseline | **Data Import / Export / Snapshots** | Import XML/JSON/CSV from text, file or location with check-only, dummy FKs, use-try-insert, disable EECA/audit/data feed, timeout; Export by entities or master entity with filters, date range, dependents, per-entity files, zip; **Data Snapshots** (export/import whole DB sets); Data Document export; services with no screen: `org.moqui.resource.SpreadsheetServices.load#SpreadsheetEntity` (one sheet with a header row → store or create records of one entity, with a column-to-field map) and `org.moqui.impl.ServerServices.backup#EmbeddedDatabase` (live backup of the embedded Postgres, retention ladder, optional SFTP mirror; run by `backup_EmbeddedDatabase_daily`) | `components/base/tools/screen/Tools/Data/{Load,Export,Snapshots}.xml` (Export also exports data documents) |

**BOSS implications.** The baseline import is a developer tool over Moqui data files. A
business import needs the shape every reference shares (upload → map columns → test →
import → error rows: Odoo, Twenty, Frappe, Dolibarr), and `load#SpreadsheetEntity` already
does the store step from a column map. Backups run as a seeded job
(`backup_EmbeddedDatabase_daily`) with no screen; OpenProject's token-guarded backup
download is a fitting control for a self-hosted install.

---

## 12. Logs, audit & monitoring

| App | Screen/page | What it is | Key files |
| --- | --- | --- | --- |
| Frappe framework | Logs | **Audit Trail** (compare versions of a document over a date range), Version, **Access Log** (exports and report views: user, file type, filters, columns), **Activity Log** (login/logout, ops), **Error Log** (seen flag, trace id, fingerprint), API Request Log, Permission Log, Submission queue; **Log Settings** (retention per log type) | `frappe/core/doctype/{audit_trail,version,access_log,activity_log,error_log,api_request_log,permission_log,log_settings,logs_to_clear}/` |
| Carbon | Audit logs | Audit log list and details (who, entity, action, diff) | `apps/erp/app/routes/x+/settings+/{audit-logs,audit-logs.details}.tsx`, `apps/erp/app/modules/settings/ui/AuditLog/`, `packages/ee/src/audit/` |
| Twenty | Event logs | Workspace event log (record events, user events) with filters | `packages/twenty-front/src/modules/settings/event-logs/` |
| Nextcloud | Audit & logging | `admin_audit` writes to a separate audit log file with no admin screen; no log-level or log-viewer settings in the bundled settings app (Basic settings holds only background jobs, profile and tags); Activity app for user-facing events | `server/apps/admin_audit/lib/`, `server/apps/settings/lib/Settings/Admin/Server.php`, `activity/src/` |
| Odoo | Technical logs | Logging (`ir.logging`), profiling sessions, privacy logs | `odoo/odoo/addons/base/views/{ir_logging_views,ir_profile_views}.xml`, `odoo/addons/privacy_lookup/views/` |
| Dolibarr | **Unalterable log** & events | Blocked log (hash-chained fiscal log, verify chain); security events log; syslog setup; debug bar | `htdocs/blockedlog/admin/`, `htdocs/admin/{events,syslog,debugbar}.php` |
| Ever Gauzy | Monitoring | Monitoring settings page | `apps/gauzy/src/app/pages/settings/monitoring/` |
| Moqui baseline | Audit, visits, hits, logs | **Audit Log** (entity field changes), **Visits** (visit list/detail with requests), **Artifact Hit Summary/Bins** (screen/service/entity usage and timing), **Active Users**, **Log Viewer**, **Thread List** | `components/base/tools/screen/System/{AuditLog,Visit/{VisitList,VisitDetail},ArtifactHitSummary,ArtifactHitBins,Security/ActiveUsers,LogViewer,ThreadList}.xml` |

**BOSS implications.** Moqui records audit, visits and artifact hits, and its cleanup jobs
take `daysToKeep`; what is missing is retention settings per log type (Frappe Log
Settings) wired to those jobs, an error triage list, and an access log for sensitive
exports (Frappe Access Log). Insights reads the same records for usage analytics.

---

## 13. Privacy & data policy

| App | Screen/page | What it is | Key files |
| --- | --- | --- | --- |
| Odoo | **Privacy lookup** | Find all records referencing a person (name/email) across models, archive or delete them, keep a privacy log | `odoo/addons/privacy_lookup/{wizard,views}/` |
| Dolibarr | **Data policy** | GDPR: retention delays per object type (contacts, members, third parties), anonymize/delete on schedule, consent emails | `htdocs/datapolicy/{admin,class}/` |
| Nextcloud | Privacy | Privacy app (where data lives, who has admin access, encryption status) | `privacy/src/` |
| Frappe framework | Personal data | Personal data download/deletion requests (website), deleted document store | `frappe/website/doctype/personal_data_*/`, `frappe/core/doctype/deleted_document/` |
| Twenty | Legal / DPA | DPA list and new DPA request | `packages/twenty-front/src/pages/settings/legal/{SettingsLegalDpa,SettingsLegalDpaNew}.tsx` |

**BOSS implications.** Privacy lookup (Odoo) maps to a search over a `Party`'s links and
its `CommunicationEvent` records; retention and anonymization rules (Dolibarr data policy)
would need new records and rules beyond that search.

---

## 14. Instances, servers & hosting

| App | Screen/page | What it is | Key files |
| --- | --- | --- | --- |
| Frappe Central | SaaS control plane | Home; signup, login, email verification; onboarding (site name → site ready); **servers** (list, new, server page, snapshots); **team** (access, invitations, join); billing (overview, invoices); add-ons (object storage buckets, AI inference); GitHub connect; settings; backend signs short-lived login assertions so a Central user enters each site without a separate password (`central/sso.py`, Central SSO Settings) | `dashboard/src/pages/{auth,home,onboarding,servers,team,billing,addons,github,settings}/`, `central/sso.py`, `central/central/doctype/central_sso_settings/` |
| Zimbra | Servers & volumes | Server list and form (services enabled, volumes, bind IPs, proxy ports, server pool), flush cache | `zm-admin-console/WebRoot/js/zimbraAdmin/servers/view/` |
| Twenty | Admin panel & domains | Instance health, workspaces; custom domain and subdomain pages; billing plans, usage and limits | `packages/twenty-front/src/pages/settings/{admin-panel,domains,billing}/` |
| Moqui baseline | Cache, instances, entity sync, printing | **Cache** list/elements (clear), **Instance** management (`AppInstance`, `InstanceHost`, images, env, volumes — Docker-style instances), **Entity Sync** (remote sync definitions, history), **Print** (network printers, print jobs), Resource Finder (elFinder over resource locations) | `components/base/tools/screen/System/{Cache/{CacheList,CacheElements},Instance/{InstanceList,InstanceDetail},EntitySync/{EntitySyncList,EntitySyncDetail,EntitySyncHistory},Print/{Printer,PrintJob},Resource/ElFinder}.xml`; entities in `components/base/framework/entity/ServerEntities.xml` |

**BOSS implications.** Self-hosting first means one instance per business, so Moqui's
Instance screens and Frappe Central matter mainly to a hosting provider rather than to a
business administrator.

---

## 15. Developer, AI & power tools

| App | Tool | Key files |
| --- | --- | --- |
| Moqui baseline | SQL Runner, SQL Script Runner, Groovy Shell, Service Run / Reference / LoadRunner, Entity DataEdit, Data Views (DB-defined view entities), Table Stats, Query Stats, Speed Test, Artifact Stats, Entity Master API docs, Reload Framework (the last two are Tools dashboard links); the web shell and SQL runner are gated by sealed permissions `GROOVY_SHELL_WEB`, `SQL_RUNNER_WEB` | `components/base/tools/screen/Tools/{Sql,Data/Grid,Database/{Tables,Queries,SpeedTest},Service/{ServiceRun,ServiceReference,ServiceDetail},Load/*,Data/Views/{FindDbView,EditDbView},ArtifactStats,dashboard}.xml` (the Groovy shell is gone) |
| Frappe framework | System Console, Recorder (request/SQL profiling with suggested indexes), Component explorer | `frappe/desk/doctype/system_console/`, `frappe/core/doctype/{recorder,recorder_query,recorder_suggested_index}/`, `frappe/core/page/component_explorer/` |
| Odoo | Developer mode technical menu, profiling, tests | `odoo/odoo/addons/base/views/{base_menus,ir_profile_views}.xml` |
| Twenty | API playground | `packages/twenty-front/src/pages/settings/developers/playground/` |
| Dolibarr | Module builder | `htdocs/modulebuilder/` |
| Twenty | **AI settings**: tabs Workspace (instructions, read-only system prompt and user context), Models, Skills (create/edit), Tools (custom tools with parameters), MCP, Usage (per user by model, type and day); role permission flags gate AI tools (§3) | `packages/twenty-front/src/pages/settings/ai/{SettingsAI,SettingsAiPrompts,SettingsSkillForm,SettingsToolDetail,SettingsAiUsageUserDetail}.tsx`, `packages/twenty-front/src/pages/settings/ai/components/` |
| OpenProject | **AI** admin: LLM connection (provider API key, connect/disconnect), LLM models, feature bindings (which feature uses which model), health status (run checks, download report), MCP configurations, text transform actions | `app/views/admin/{llm_connections,llm_models,llm_feature_bindings,llm_health_status,mcp_configurations,text_transform_actions}/` |
| Moqui baseline | LLM and A2A records (`LlmConversation`, `LlmMessage`, `LlmCallLog`, `LlmSkill`, `LlmSkillUse`, `LlmLesson`; `A2AContext`, `A2ATask`, `A2AMessage`, `A2AArtifact`, `A2APushConfig`) with no admin screens; `LlmGateway` is a sealed permission in `user_sealed_permissions` | `components/base/framework/entity/{LlmEntities,A2AEntities}.xml`, `components/base/framework/conf/MoquiDefaultConf.xml` |

**BOSS implications.** The tools screens already sit behind sealed permissions, which fits
a developer group. For Assist, Twenty's AI tabs and OpenProject's AI
admin show what an admin expects (provider connection, models, skills, tools, usage); BOSS
has the records (`LlmSkill`, `LlmLesson`, `LlmCallLog`, A2A) but no screens. Assist writes
stay governed by artifact authz (initial-design, Decided), so no separate write-policy
editor appears necessary.

---

## 16. Cross-app surfaces

Reused screens per research-crosscut.md §3–§4. Admin includes the user-account part of the
party record, groups and app access, gateway configuration and the settings index, each in
the form an administrator needs; the same screens and records appear in the other apps
listed. Every app also includes its own settings section, which the settings index links
to. Protocol and server settings are what mr-moqui provides and Admin configures.

| Reused screen or link | Use in Admin | Other apps that include it | Reference evidence |
| --- | --- | --- | --- |
| **Contact / party record** | User account: login, status, groups, apps the user can open, authentication factors, API and SSH keys, login history, login as; on internal-organization parties, the organization profile | Commons (contacts, address book); every app that shows a person or organization; People (employee data) | SimpleScreens Party detail creates the user account on the party (`create#PartyUserAccount`); Carbon users per party type; Nextcloud and Twenty user lists |
| **Employee 360** | User account tab: create or invite on hire, disable on leave | People (employment, pay, leave, reviews); Projects (allocations, timesheets); Commons (directory card) | Carbon employees are users with permissions; OpenProject user edit tabs mix account and working-hours data |
| User accounts, groups, app access | User list and detail, invitations, groups, app access per group, capability editor | People and Commons (account details on the party) | Nextcloud limit-to-groups, Odoo role and privilege selects, Twenty roles, OpenProject global roles |
| Settings (every app's own section) | **Settings index**: instance-wide pages plus a link to every app's settings section | Every app (its own settings section) | Carbon Modules group, Odoo settings app tabs, Dolibarr per-module setup links, Nextcloud sections that apps register into |
| Payment, shipping & tax settings | Gateway configuration in the integrations area (`PaymentGatewayConfig`, `ShippingGatewayConfig`, `TaxGatewayConfig`) | Commerce (per store); Accounting (tax authorities, payment methods); Warehouse (carriers and label gateways) | SimpleScreens Gateway screens (§17); Ever Gauzy SMS gateway selection (§9) |
| Email / SMS sending | Protocol and server settings: outgoing relay, SMTP gateway trust, mail domains, queues; mail accounts and templates included or linked | Comms (accounts, sending, tracking, unsubscribe and consent); Marketing (campaign sends, audiences); Customer Service (case email) | Nextcloud email server and Mail admin, Zimbra MTA and mail queues, Frappe suite mail admin, OpenProject email settings |
| Calendar & schedules (link) | CalDAV / CardDAV server settings | Commons, Maintenance, Projects, People (the calendars themselves) | Nextcloud Groupware section (`dav` app) |
| Chatter & activities, chat (link) | Chat and WebRTC server settings (signaling, STUN/TURN, recording) | Every app's record screens; Comms and Commons (chat) | Nextcloud Talk admin; Odoo ICE servers |
| Approvals waiting (header Notifications panel) | Notification topics and user subscriptions; approval rules are in the settings of the apps that include the approved records | People, Projects, Purchasing, Sales, Accounting (approval lists) | Frappe Notification, Carbon approval rules |
| Dashboard widgets | Admin landing page places health widgets; audit, visits and hits feed Insights usage analytics; their retention is set in Admin | Insights (dashboards, widget builder); every app's landing page | Frappe System Health Report, Twenty admin panel |
| Data import (initial-design "Data import and export") | One import wizard, opened from any app's find screen with the target preset | Every app with a find screen (import entry) | Odoo import from any list, Carbon shared `import/<table>` route, Twenty import from views |
| Assist drawer | LLM providers, skills, lessons, call logs; Assist's access is artifact authz on its user or group | Every app (always-available header drawer) | Twenty AI settings, OpenProject AI admin |

---

## 17. Current Moqui baseline (mr-marble / MarbleERP / Mantle)

The tools component is a complete but developer-oriented admin: every entity is
reachable, but screens are raw forms organized by framework subsystem rather than by admin
task, with no checklist of setup problems and no settings index. MarbleERP adds no admin
screens: `component/mr-marble/screen/marble.xml` mounts the SimpleScreens trees, and its
seed data defines the `MarbleErpAdmin` group and the `MarbleErpAll` / `MarbleErpApp`
artifact groups over the root screen. mr-boss has a root screen gated by the
`BOSS_APP` artifact group (ADMIN only) and a self-service account page; there is no Admin
app yet.

### Screens

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Security | Users (list; detail with account, password, enable/disable, reset, login as, group memberships, preferences, topic subscriptions, TOTP / single-use / email / SMS factors, login history, audit log, tarpit locks), User Groups (permissions, preferences, artifact authz, tarpits; Group Users), Artifact Groups (members, authz, tarpits), Active Users | `components/base/tools/screen/System/Security/{UserAccount/{UserAccountList,UserAccountDetail},UserGroup/{UserGroupList,UserGroupDetail,GroupUsers},ArtifactGroup/{ArtifactGroupList,ArtifactGroupDetail},ActiveUsers}.xml` |
| System messages | Message list and detail (send, consume, reset error, cancel), Message Remotes, Message Types | `components/base/tools/screen/System/SystemMessage/{Message/{SystemMessageList,SystemMessageDetail},Remote/{MessageRemoteList,MessageRemoteDetail},Type/{MessageTypeList,MessageTypeDetail}}.xml` |
| Service jobs | Jobs (parameters, notify users, run now), Job Runs | `components/base/tools/screen/System/ServiceJob/{Jobs/{ServiceJobList,ServiceJobDetail},JobRuns/{JobRunList,JobRunDetail}}.xml` |
| Data | Data Import, Data Export, Data Snapshots, Data Documents (edit, search, export, index), Entity Sync, Entity DataEdit, Auto Screens, Data Views | `components/base/tools/screen/Tools/Data/{Load,Export,Snapshots,Grid}.xml`, `components/base/tools/screen/System/{DataDocument,EntitySync}/`, `components/base/tools/screen/Tools/Data/{Browse,Views}/` |
| Monitoring | System dashboard (server info, worker pool), Audit Log, Visits, Artifact Hit Summary / Bins, Log Viewer, Thread List, Cache, Instances | `components/base/tools/screen/System/{dashboard,AuditLog,ArtifactHitSummary,ArtifactHitBins,LogViewer,ThreadList}.xml`, `components/base/tools/screen/System/{Visit,Cache,Instance}/` |
| L10n, resources, print | Localized messages, entity field translations, resource finder, status flows, printers and print jobs | `components/base/tools/screen/System/{Localization,Resource,Print}/`, `components/base/tools/screen/Tools/StatusFlows.xml` |
| Developer | SQL runners, Groovy shell, service run / reference / load runner, stats | `components/base/tools/screen/Tools/` |
| Login and SSO | Login screen and the SSO callback screen that use `AuthFlow` records | `components/base/webroot/screen/webroot/{Login,sso}.xml` |
| User account on a party | Party detail: create / update / enable / disable user account, reset password, group membership, party settings | `component/mr-marble/screen/SimpleScreens/Party/EditParty.xml` |
| Internal organizations | Find / edit vendor (internal org): contact info, roles, init accounting configuration, accounting preference, users | `component/mr-marble/screen/SimpleScreens/Vendor/{FindVendor,EditVendor,EditUsers}.xml` |
| Accounting org settings | Acctg preference, GL account defaults, type defaults, invoice / item / payment / asset types, financial account types and reasons, payment instruments | `component/mr-marble/screen/SimpleScreens/Accounting/OrgSettings/` |
| Gateways, store settings | Payment and shipping gateway configs; product store settings and store emails | `component/mr-marble/screen/SimpleScreens/Gateway/`, `component/mr-marble/screen/SimpleScreens/ProductStore/{FindProductStoreSettings,FindProductStoreEmails}.xml` |
| Per-object user lists | Users on requests, projects, tasks, vendors | `component/mr-marble/screen/SimpleScreens/{Request,Project,Task,Vendor}/EditUsers.xml` |
| BOSS self-service account | Own profile, change password, add TOTP / single-use / email / SMS factors | `component/mr-boss/screen/Base/User/Account.xml` |
| App-root authz | Artifact groups and admin authz for the app roots | `component/mr-boss/data/BossSetupData.xml` (`BOSS_APP`), `component/mr-marble/data/MarbleErpSetupData.xml` |

Missing: an admin home with checks, an invitation flow, a role-style permission editor or
access inspector, screens for `AuthFlow`, `EmailServer`, `EmailTemplate`, `UserLoginKey`,
`UserSshKey` and the LLM / A2A records, a spreadsheet import with
column mapping, a backup screen, log retention settings, and a settings index.

### Data model available

| Entity group | What it gives Admin | Key files |
| --- | --- | --- |
| `moqui.security` users and groups | `UserAccount`, `UserGroup` (with `groupTypeEnumId`, **`requireAuthcFactor`**, **`ipAllowed`**), `UserGroupMember` (from/thru), `UserPermission`, `UserGroupPermission`, `UserPreference`, `UserGroupPreference`, `UserScreenTheme`, `UserGroupScreenTheme`, `UserAuthcFactor`, `UserLoginKey` (hashed key with from/thru), `UserSshKey`, `UserLoginHistory`, `UserPasswordHistory` | `components/base/framework/entity/SecurityEntities.xml` |
| `moqui.security` artifact authz | `ArtifactGroup`, `ArtifactGroupMember`, `ArtifactAuthz`, `ArtifactAuthzFailure`, `ArtifactAuthzFilter`, `EntityFilterSet`, `EntityFilter`, `ArtifactTarpit`, `ArtifactTarpitLock`; Mantle seeds the `MANTLE_USER_ORG` and `MANTLE_ACTIVE_ORG` filter sets for per-organization rows | `components/base/framework/entity/SecurityEntities.xml`, `component/mr-mantle/data/MantleSetupData.xml` |
| `moqui.security.user` | `NotificationTopic` (title / link templates, alert, email template, persist), `NotificationTopicUser`, `NotificationMessage`, `NotificationMessageUser` | `components/base/framework/entity/SecurityEntities.xml` |
| `moqui.security.sso` (mr-moqui) | `AuthFlow` (type, remote, default user group, inbound, disabled), `AuthFlowFieldMap`, `AuthFlowRoleMap`, `OauthFlow`, `OidcFlow`, `SamlFlow` | `components/base/framework/entity/SecurityEntities.xml` |
| `moqui.service.job`, `moqui.service.message` | `ServiceJob`, `ServiceJobParameter`, `ServiceJobUser`, `ServiceJobRun`, `ServiceJobRunLock`; `SystemMessage`, `SystemMessageType`, `SystemMessageRemote` (incl. `authorizedIpAddresses`), `SystemMessageEnumMap`, `SystemMessageError` (`SystemMessageHook` / `SystemMessageHookStatus` are commented out) | `components/base/framework/entity/ServiceEntities.xml` |
| `moqui.basic` | `EmailServer`, `EmailTemplate`, `EmailTemplateAttachment`, `EmailMessage`; `Enumeration`, `StatusItem`, `StatusFlow`, `Uom`, `Geo`, `LocalizedMessage`, `LocalizedEntityField`; `NetworkPrinter`, `PrintJob` | `components/base/framework/entity/BasicEntities.xml` |
| `moqui.entity` | `EntityAuditLog`, `SequenceValueItem`, `DbViewEntity`, `DataDocument`, `DataFeed`, `EntitySync`, `EntitySyncHistory` | `components/base/framework/entity/EntityEntities.xml` |
| `moqui.server` | `ArtifactHit`, `ArtifactHitBin`, `Visit`, `Visitor`, `HttpSession`, `ClusterMember`; `AppInstance`, `InstanceHost`, `InstanceImage`, `DatabaseHost` | `components/base/framework/entity/ServerEntities.xml` |
| `moqui.screen` | `ScreenTheme`, `FormConfig`, `FormListFind`, `DbForm`, `FormResponse`, `ScreenScheduled` (the `DynamicScreen` entities are commented out) | `components/base/framework/entity/ScreenEntities.xml` |
| LLM / A2A (mr-moqui) | `LlmConversation`, `LlmMessage`, `LlmCallLog`, `LlmSkill`, `LlmSkillUse`, `LlmLesson`; `A2AContext`, `A2ATask`, `A2AMessage`, `A2AArtifact`, `A2APushConfig` | `components/base/framework/entity/{LlmEntities,A2AEntities}.xml` |
| Mantle party and settings | `Party`, `Person`, `Organization`, `PartyRole` (`OrgInternal` for internal organizations), `PartySettingType` (description, `validRegexp`, `enumTypeId`, `defaultValue`), `PartySettingTypeRole`, `PartySetting`, `PartyRelationshipSetting`, `PartySystemMessage` | `component/mr-mantle/entity/PartyEntities.xml` |
| Mantle org config | `PartyAcctgPreference` (Accounting's settings); `ProductStore`; `PaymentGatewayConfig`, `ShippingGatewayConfig`, `TaxGatewayConfig` | `component/mr-mantle/entity/{AccountingLedgerEntities,ProductStoreEntities,AccountingAccountEntities,ShipmentEntities}.xml` |
| Framework conf properties | SSH / SFTP server (`ssh_port`, `ssh_host`, `ssh_host_key`, `ssh_sftp_root`, `ssh_max_sessions`), `email_allowed_hosts`, `user_privileged_groups`, `user_sealed_permissions` — not database records | `components/base/framework/conf/MoquiDefaultConf.xml` |

Missing: a user-invitation record, an instance-scope setting record (settings exist per
party, user and group, plus conf properties), an import-job record with column map and error
rows, an entity-event → webhook subscription record, and job monitors (ServiceJobMonitor has
them as `ServiceJobMonitor`, `ServiceJobMonitorBounds`, `ServiceJobMonitorAlert` in
`3p_moqui/ServiceJobMonitor/entity/ServiceJobMonitor.xml`). There is no LDAP entity or
service in the baseline.

### Services

| Service | Purpose | Key files |
| --- | --- | --- |
| `create#UserAccount`, `update#UserAccount`, `update#Password`, `reset#Password`, `enable#UserAccount`, `disable#UserAccount`, `create#InitialAdminAccount`, `create#UserAuthcFactorTotp` / `Email` / `Sms`, `create#SingleUseAuthcCodes`, `get#UserAuthcFactorRequired`, `increment#UserAccountFailedLogins` | User accounts, passwords, factors, lockout | `components/base/framework/service/org/moqui/impl/UserServices.xml` |
| `login#User`, `handle#Callback`, `logout#User` | SSO login through `AuthFlow` | `components/base/framework/service/org/moqui/sso/AuthServices.xml` |
| `send#SystemMessage`, `consume#SystemMessage`, `receive#IncomingSystemMessage`, `send#AllProducedSystemMessages`, `consume#AllReceivedSystemMessages`, `reset#SystemMessageInError`, `cancel#SystemMessage`, `send#SystemMessageRest` / `JsonRpc` | Message queue, retries, outbound REST (the basis for webhooks) | `components/base/framework/service/org/moqui/impl/SystemMessageServices.xml` |
| `send#SystemMessageSftp`, `poll#SystemMessageSftp` | SFTP remotes | `components/base/framework/service/org/moqui/sftp/SftpMessageServices.xml` |
| `send#Email`, `send#EmailTemplate`, `send#EmailMessage`, `poll#EmailServer` | Mail send and IMAP/POP poll | `components/base/framework/service/org/moqui/mail/EmailServices.xml` |
| `clean#ArtifactData` (`daysToKeep`), `clean#PrintJobData`, `backup#EmbeddedDatabase`; `clean#ServiceJobRun` | Retention cleanup and backup, run as seeded jobs | `components/base/framework/service/org/moqui/impl/{ServerServices,ServiceServices}.xml`, `components/base/framework/data/MoquiSetupData.xml` |
| `read#Spreadsheet`, `load#SpreadsheetEntity` (`fieldMap`, `loadMode` store or create) | Spreadsheet import step | `components/base/framework/service/org/moqui/resource/SpreadsheetServices.xml` |
| `export#EntityDataSnapshot`, `import#EntityDataSnapshot`, `rewrite#EntityEncryptedFieldsAll` | Snapshots and key rotation | `components/base/framework/service/org/moqui/impl/EntityServices.xml` |
| `mantle.party.PartyServices.create#PartyUserAccount`, `update#PartyUserAccount`, `create#UserAccountPerson`, `create#Organization`, `ensure#PartyRole`, `setup#UserOrganizationInfo` (user's organizations and active org for the filter sets), `get#PartySettingValue`, `store#PartySetting` | User account on a party, internal organizations, party settings | `component/mr-mantle/service/mantle/party/PartyServices.xml` |
| `mantle.ledger.LedgerServices.init#PartyAccountingConfiguration` | Copy default accounting setup to a new internal org (Accounting's settings, called from Vendor) | `component/mr-mantle/service/mantle/ledger/LedgerServices.xml` |

---

## 18. Gaps & BOSS implications

### Gaps in the reference set

- **Protocol-server admin for a self-hosted stack.** Zimbra covers mail only (MTA, queues,
  domains); Nextcloud covers CalDAV (Groupware section) and chat/WebRTC servers (Talk) but
  sends mail through an external server. No reference has an SMTP edge-gateway trust page
  (allowed gateway IPs, trusted Authentication-Results headers); that BOSS page has no model
  to copy.
- **Bulk provisioning.** Not in the Zimbra checkout (Tools and Migration is a downloads
  page). Nextcloud, Twenty, Carbon and OpenProject have invitations; a dedicated bulk-invite
  screen was not found in any checkout *(unverified beyond the files read)*.
- **Enterprise-only.** Carbon's Commercial License covers all of `packages/ee/` (SSO,
  two-factor, webhooks, API keys, audit, integrations) and every `.ee.` file (permission
  forms, bulk permission edit, approval rules); the rest of Carbon is AGPL-3.0. OpenProject
  has an Enterprise menu with token-gated features. The Odoo admin addons used here
  (`auth_*`, `base_import`, `base_automation`, `privacy_lookup`) are all community.
- **Logs.** Nextcloud's settings app has no log viewer or log-level page (only
  `admin_audit` writing a file).
- **Privacy.** Only Odoo (`privacy_lookup`) and Dolibarr (`datapolicy`) ship admin privacy
  tools; Frappe's personal-data requests are website-side.
- **Job alerting.** Apart from ServiceJobMonitor and Frappe's failing-jobs table in the
  System Health Report, no reference alerts on scheduled-job results.

### Notable gaps in the Moqui baseline

- **No admin home.** No setup checklist (Nextcloud setup checks, OpenProject / Redmine
  Information checklist), no health summary (Frappe System Health Report, Zimbra home) and
  no "get started" list for a fresh install.
- **Permissions are artifact-centric.** Artifact groups × authz are powerful but there is
  no role-style editor (Odoo privileges, Twenty permission flags plus object-level, Frappe
  permission manager, OpenProject permissions report), no "why can this user do this"
  inspector, and no view from a group to the IronStone apps it opens.
- **Group-level security flags have no policy page.** `UserGroup.requireAuthcFactor` and
  `ipAllowed` exist, as do tarpits, but there is no page that shows password, session,
  lockout and 2FA policy together.
- **No invitations.** Users are created on parties; there is no invite-by-email, pending
  or revoked invite (Nextcloud, Twenty, Carbon, OpenProject).
- **Entities with no screens.** `AuthFlow`, `EmailServer`, `EmailTemplate`,
  `UserLoginKey`, `UserSshKey` and the LLM / A2A records are edited only as data; there is
  no SMTP test, no mail-queue view and no gateway-IP trust setting.
- **Import is entity-XML-shaped.** DataImport takes Moqui data files;
  `load#SpreadsheetEntity` exists but has no wizard with column mapping, test run and
  error rows (Odoo, Twenty, Frappe, Dolibarr), and find screens have no "Import" entry.
- **No settings index.** Organization, localization, numbering, branding and per-app
  settings are scattered (Vendor, OrgSettings, ProductStore, Localization).
- **No webhook screen.** `SystemMessageRemote` with `send#SystemMessageRest` is the
  plumbing; there is no webhook editor with events and a delivery log, and no API-key
  screen.
- **Logs lack retention and triage.** Cleanup jobs take `daysToKeep` but there is no
  retention page, no error-log triage and no export/access log (Frappe Access Log).
- **Backups have a job but no screen.** `backup_EmbeddedDatabase_daily` runs, with no list
  of archives, status or download.

### What each reference contributes

| Reference | Take |
| --- | --- |
| Zimbra | Task-organized navigation (Monitor / Manage / Configure / Tools); home with counts, maintenance status and get-started tasks; COS as reusable feature bundles; domain auth and GAL wizards; MTA settings and mail-queue view with requeue / hold / release / delete |
| Nextcloud | Fast user table with group nav, quotas and manager; setup checks; **delegation** of settings sections to groups; 2FA enforced and excluded by group; app store limit-to-groups; theming; email server form with test; Groupware (CalDAV) and Talk (signaling, STUN, TURN, recording) server settings |
| Odoo | Role (Light / User / Administrator) plus privilege-grouped groups on the user form; `ir.access` rows that combine model rights with a domain; one General Settings page with app sections; spreadsheet import with test run; automation rules incl. incoming webhook trigger; privacy lookup |
| Frappe framework | Role Permission Manager grid; role and module profiles; user permissions (row level) and Permission Inspector; System Health Report; Data Import with value mapping and partial success; Webhook doctype; Connected App vs OAuth Client; notification rules; log retention settings |
| Frappe suite | Mail admin dashboard: domains, accounts, groups, mailing lists, invites, DMARC and TLS reports |
| Twenty | Roles with permission flags plus object- and field-level permissions; developer area (API keys, webhooks, playground); IMAP/SMTP/CalDAV connection forms; spreadsheet import stepper; admin panel with health and config variables; AI settings (models, skills, tools, MCP, usage) and AI tool permission flags |
| Carbon | Settings hub in Company / Modules / System groups; separate employee / customer / supplier / operator users; bulk permission edit; SAML SSO on one Security page; integrations with mapping and sync activity; webhooks with secret rotation; demo data; backups; audit log details |
| OpenProject | Admin menu as the settings index; Information checklist; global roles and permissions report; authentication tabs (login, passwords, registration, SSO), SCIM clients, OIDC / SAML / LDAP group sync; webhooks with deliveries; token-guarded backups; AI admin (LLM connection, models, health checks, MCP) |
| Redmine | Compact admin menu; roles × permissions page; workflow field permissions; authentication settings on one tab; LDAP source form with attribute map; incoming-email handler settings |
| Dolibarr | Module on/off with per-module setup; dictionaries; import / export wizards with simulate and saved profiles; email collectors; hash-chained unalterable log; data-policy retention |
| ServiceJobMonitor | Moqui-native job monitors: bounds on job-run values, alerts with assignee and issue URL, charts |
| Ever Gauzy | Tenant SMTP / SMS / file-storage overrides; feature toggles; org import / export zip |
| Akaunting | Small-business settings set (company, localisation, defaults, invoice numbering, email templates, schedule) |
| Frappe Central | Control plane for hosting many instances (servers, snapshots, team access, billing, SSO into sites) — a hosting concern rather than business Admin |

### Candidate screen inventory (IronStone Admin)

Screens the research points to for a system administrator, including the reused screens
Admin includes. Input to design, not a design.

| Area | Screens |
| --- | --- |
| Home | Admin landing page: setup checklist (pass / warn with a fix link: mail relay set, backups recent, SSH host key changed from the default, admins have 2FA, no failing jobs, search backend available), health (failed and late job runs, system messages in error, mail poll errors, worker pool, last backup), counts (users, active sessions, failed logins), links grouped Monitor / Manage / Configure; health widgets **(reused: Dashboard widgets, every app's landing page and Insights)** |
| Users | User list (status active / disabled / invited / locked, group, app, last login); invite users (single and CSV); **user account on the Contact / party record (reused: Admin, Commons, People, every app that shows a person)** — groups, apps, factors, API keys (`UserLoginKey`), SSH keys, login history, login as, disable, reset, tarpit release; **user account tab on Employee 360 (reused: People, Admin, Projects, Commons)** |
| Groups & permissions | Group list and detail (members with dates, apps the group opens, capabilities, require-factor and allowed-IP flags, preferences); capability editor (app → capability → view / create / update / delete, written as `ArtifactAuthz`); groups × capabilities matrix; row rules (`EntityFilterSet`); access inspector (user × screen / service / record → which authz allows or denies) |
| Security & sign-in | Policy page (password rules, session, lockout via tarpits, groups that require 2FA); SSO providers over `AuthFlow` (OAuth / OIDC / SAML with field and role maps); per-group IP restrictions |
| Settings & organizations | **Settings index** (Admin's instance pages plus a link to each app's own settings section) **(reused: every app's settings section)**; instance settings (name, branding / theme, default locale, time zone and currency, formats); internal organizations as the **organization profile on the Contact / party record (reused: Admin, Commons, every app that shows an organization)** with logos, addresses and `PartySetting` values; localization (messages, entity field translations); enumerations and status flows |
| Apps | App access: each IronStone app root × the groups that can open it |
| Integrations | Webhooks (event, condition, URL, secret, retries; deliveries = `SystemMessage` rows); message remotes and types; API keys; payment, shipping and tax gateway configuration **(reused: Admin, Commerce, Accounting; carrier gateways also Warehouse)** |
| Protocols & mail servers | Outgoing relay or smarthost (`EmailServer`) with test send; SMTP gateway trust (allowed gateway IPs, trusted headers); mail domains with DNS checks; SSH / SFTP server (read-only view of conf properties is one option); CalDAV / CardDAV server options; chat and WebRTC servers (signaling, STUN / TURN, recording); mail queue and system-message queue (errors, retry, cancel); **mail accounts and email templates (reused: Comms, Marketing, Customer Service, Admin)** |
| Notifications | Notification topics (alert, email template, persist) and user subscriptions, feeding the header Notifications panel |
| Jobs & monitoring | Service jobs and runs; job health (failing, late, paused); job monitors and alerts in the ServiceJobMonitor shape |
| Data | **Import wizard** (upload → map columns → test → import → error rows) opened from any app's find screen; export (fields, filters, format, saved profiles); data snapshots; backups (archives, status, download with confirmation) |
| Logs & privacy | Audit log, visits, artifact hits, error log triage, export / access log, retention per log type, privacy lookup |
| Assist & agents | LLM providers and models, skills and lessons, call logs and usage, A2A tasks; Assist's own group and its artifact authz |
| Developer | Existing tools screens behind a developer group and the sealed permissions |

### Data-model findings

- **Fit as is:** `UserAccount`, `UserGroup` (`groupTypeEnumId` could mark app groups;
  `requireAuthcFactor` and `ipAllowed` carry the policy-page flags), `UserGroupMember`,
  `ArtifactGroup` / `ArtifactAuthz` / `ArtifactAuthzFilter` / `EntityFilterSet`,
  `ArtifactTarpit`, `UserAuthcFactor`, `UserLoginKey` (API keys), `UserSshKey`,
  `UserLoginHistory`, `AuthFlow` and its flow and map records, `NotificationTopic`,
  `ServiceJob` / `ServiceJobRun`, `SystemMessage*`, `EmailServer`, `EmailTemplate`,
  `EntityAuditLog`, `ArtifactHit`, `Visit`; Mantle `Party` with `PartyRole` `OrgInternal`,
  `PartySettingType` / `PartySetting` for organization settings, and the
  `MANTLE_ACTIVE_ORG` filter set for multi-organization rows.
- **Existing services:** `mantle.party.PartyServices.create#PartyUserAccount` and
  `update#PartyUserAccount` for user accounts on parties; `org.moqui.impl.UserServices`
  for passwords, enable / disable and factors; `load#SpreadsheetEntity` for the import
  step; `send#SystemMessageRest` for webhook delivery; `clean#ArtifactData` (`daysToKeep`)
  for retention.
- **App access:** one `ArtifactGroup` per IronStone app root (as `BOSS_APP` today) plus
  `ArtifactAuthz` rows per group fits without a new entity.
- **Log retention:** `ServiceJobParameter` values (`daysToKeep`) on the seeded cleanup jobs
  cover most logs; some logs have no cleanup job (audit log, visits).
- **Where new records look necessary:** user **invitation** (party, email, groups, token
  hash, expiry, status); **import job** (file, target entity, column map, options, status,
  counts, error rows); **webhook subscription** (entity, event, condition →
  `SystemMessageType` and remote; a commented-out `SystemMessageHook` in
  `ServiceEntities.xml` sketches status-triggered sends); **job monitor** records like
  ServiceJobMonitor's; possibly an **instance-scope setting** store (see Open questions).
- **Gateway trust:** `SystemMessageRemote.authorizedIpAddresses` is the existing pattern for
  an IP allowlist; the SMTP receiver has none, and one option is a remote record, another a
  conf property.

### Sequencing notes

- **Cheap because the baseline has the records and services:** the user list and user
  account on the party (`create#PartyUserAccount`, `UserServices`); groups and app access
  over artifact authz (`BOSS_APP` already gates the root); the security policy page over
  existing group flags and tarpits; SSO providers over `AuthFlow`; mail relay
  (`EmailServer`) with test send; the system-message queue; notification topics; service
  jobs and runs; a backups page over the seeded backup job; audit, visit and error views
  over existing log records; the tools screens as they are.
- **Screen work plus a small new record:** invitations need the invitation record; the
  import wizard needs the import-job record on top of `load#SpreadsheetEntity`; webhooks
  need the webhook-subscription record on top of `SystemMessageRemote`; job health and
  alerts need the job-monitor records.
- **Depends on other decisions:** the settings index depends on each app's settings section
  existing; instance settings depend on where instance-scope settings are stored (open
  question); the capability editor and matrix depend on what a "capability" is (open
  question); gateway configuration depends on where shared gateway records are edited
  (crosscut §8).
- **Larger or dependent work:** the access inspector (the baseline has no "why can this
  user do this" view); LDAP (nothing in the baseline); privacy lookup (a search over
  `Party` links) and retention rules (new records); automation rules (overlap service
  ECAs); instance management (a hosting concern); custom fields (no baseline screen);
  Assist / LLM admin screens (records exist, no screens); the CalDAV, chat and WebRTC
  server pages depend on mr-moqui shipping those protocols.

### Open questions

- Is a "capability" one `ArtifactGroup`, or a new bundle over several artifact groups and
  entity filter sets (like Odoo privileges or Twenty roles)?
- On hire, does the reused user-account part of Employee 360 create the account directly,
  or send an invitation (the same invitation flow Admin uses)?
- Multi-organization: one BOSS instance with several internal organizations (Carbon and
  Odoo companies; Mantle's `MANTLE_ACTIVE_ORG` filter set already supports this) or one
  organization per instance with Frappe-Central-style hosting of many instances?
- Protocol settings: which stay mr-moqui conf properties (today `ssh_*`,
  `email_allowed_hosts`) shown read-only, and which become database records editable in
  Admin (SMTP listener, gateway IPs, CalDAV, chat, WebRTC)?
- Where do instance-scope settings live: `PartySetting` on the main internal organization,
  conf properties, or a new setting record?
- Mail domains and deliverability reports (Frappe suite DMARC / TLS reports):
  research-crosscut.md §4 lists Comms and Admin for mail settings but does not name
  domains; are they part of Admin's protocol pages, the Comms mail-account screens, or a
  screen both include?
- Payment, shipping and tax gateway configs are shared records included in Commerce (per
  store, per initial-design "Shipping, payment & tax settings"), Accounting, Admin and, for
  carriers, Warehouse; where is each edited, and where is it only read (crosscut §8)?
- Assist writes: initial-design (Decided) governs them with Moqui's existing policy model;
  once writes are allowed, is artifact authz fine-grained enough for tool kinds such as
  send-email or HTTP request (Twenty's AI permission flags), or does Admin need a tool
  policy?
- How much of tools (SQL runner, shell, data edit) stays reachable in production, and
  behind which group?

### Checkout path quirks

- Zimbra admin paths start at `zm-admin-console/` inside the `3p_other/Zimbra` bundle.
- Odoo in this checkout uses one `ir.access` model
  (`odoo/odoo/addons/base/models/ir_access.py`) in place of `ir.model.access` plus
  `ir.rule`.
- Carbon `apps/erp/app/routes/x+/settings+/sso.tsx` is an action-only route; the SSO form is
  on the Security page.
- Frappe Central pages are at `dashboard/src/pages/` at the repository root, not under
  `central/`.
- OpenProject's admin menu is defined in `config/initializers/menus.rb`, and user and group
  tabs in `lib/open_project/ui/extensible_tabs.rb`, not in the view folders.

**Bottom line.** Most of what IronStone Admin needs already exists as Moqui records and
services; what the research finds missing is a task-organized UI over them (home, users on
the reused party record, groups as app capabilities, policy, settings index, import,
backups), plus a few new records (invitations, import jobs, webhook subscriptions, job
monitors). Mail accounts are reused screens emphasized in Comms; Admin's distinct part is
configuring the servers mr-moqui runs.
