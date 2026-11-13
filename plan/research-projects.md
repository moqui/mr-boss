# IronStone BOSS — Projects app research

Oct 18, 2026

Reviewed against sources Oct 18, 2026; follows [research-crosscut.md](research-crosscut.md).

Deeper research pass on every screen/page relevant to **IronStone Projects** (project managers, services staff), covering the initial-design sections Projects & milestones · Tasks · Timesheets · Resource scheduling · Time and materials billing · Request intake. Companion to [3p-app-reference.md](3p-app-reference.md); feeds the IronStone Projects row in [initial-design.md](initial-design.md). Projects is the fullest version of the reused **Task / work item** screen (also included in Commons as "tasks assigned", in Customer Service and Sales for follow-up tasks, and in People for onboarding checklists) and covers time entry and timesheets and project costing. It also includes the reused **Employee 360** (allocations and timesheets tabs), **Request / case** (project requests and conversion to work), **Calendar & schedules** (plan views) and the billing handoff to invoices (research-crosscut §3–§4). The research looks for what a services-staff audience needs from each so that Projects stands on its own.

**Two significant sources were added to the checkout after 3p-app-reference.md was written.** They are the primary references for this app and are treated first in each section:

| Source | Checkout | Why it matters |
| --- | --- | --- |
| **OpenProject** | `3p_other/openproject` | Project-management-first application: portfolio/program hierarchy, work packages, Gantt/timeline, boards, backlogs, team planner, resource management, budgets and cost reports. The closest overall model for IronStone Projects. |
| **Redmine** | `3p_other/redmine` | Long-lived, minimal project tracker: projects, issues, queries, versions/roadmap, Gantt/calendar, time logs, wiki/files/forums. The best reference for a compact, comprehensible project UI and for email-driven issue intake. |

**Organization.** Sorted by functional area, not by app: all project-list/create screens together, all task/work-item screens together, all timesheet screens together, etc. Within each area, sub-tables per reference app. Each section ends with **BOSS implications**.

**Scope.** Business UI only: project lists and hubs, work-item lists/boards/Gantt/calendars, milestone and version screens, time entry and timesheet grids, resource planners, budget/cost views, billing hand-off queues, intake forms and project settings. Scheduling algorithms, posting logic and invoice generation are noted only where they shape a Projects screen. Invoices, request intake, and attendance and working schedules are researched in depth in the Accounting/Sales, Customer Service and People files; here they are covered as the reused screens a project audience includes (billing handoff, project request intake, capacity sources).

**Path conventions.** Every backticked path resolves against the checkout of its prefix (research-crosscut §1); checkouts are under `/home/jonesde/work/moquiwork/`. In a table row a bare file name is relative to the directory named earlier in the same cell.

| Prefix | Checkout | Paths start with |
| --- | --- | --- |
| **OpenProject** | `3p_other/openproject` | `app/{views,controllers,models,components}/…`, `modules/<module>/…`, `frontend/src/app/features/…`, `config/…` |
| **Redmine** | `3p_other/redmine` | `app/{views,controllers,models,helpers}/…`, `lib/redmine/…`, `config/…` |
| **Odoo** | `3p_other/odoo` | `odoo/addons/<addon>/…` (`project`, `project_todo`, `project_account`, `sale_project`, `sale_timesheet`, `hr_timesheet`, …) |
| **ERPNext** | `3p_other/frappe/erpnext` | `erpnext/<module>/…` (mainly `erpnext/projects/`, `erpnext/support/`) |
| **Frappe framework** (desk) | `3p_other/frappe/frappe` | `frappe/<area>/…` (e.g. `frappe/public/js/frappe/views/`) |
| **Frappe CRM** | `3p_other/frappe/crm` | `frontend/src/…`, backend `crm/fcrm/doctype/…` |
| **Gameplan** | `3p_other/frappe/gameplan` | `frontend/src/…`, backend `gameplan/gameplan/doctype/…` |
| **AureusERP** | `3p_other/aureuserp` | `plugins/webkul/<plugin>/src/Filament/…` (`projects`, `timesheets`, `full-calendar`) |
| **Dolibarr** | `3p_other/dolibarr` | `htdocs/<module>/…` (mainly `htdocs/projet/`, shared `htdocs/core/lib/project.lib.php`) |
| **Ever Gauzy** | `3p_other/ever-co/ever-gauzy` | `apps/gauzy/src/app/pages/…`, desktop apps `apps/{desktop,desktop-timer}/` |
| **Ever Teams** | `3p_other/ever-co/ever-teams` | repo root (`apps/web/core/…`) |
| **metasfresh** | `3p_other/metasfresh` | `backend/de.metas.<module>/…` |
| **Carbon** | `3p_other/carbon` | `apps/erp/app/{modules,routes}/…` |
| **Nextcloud** | `3p_other/nextcloud` | `<app>/src/…` (`tasks/src/`, `deck/src/`; catalogued in [research-drawers-commons.md](research-drawers-commons.md) §11) |
| **Twenty** | `3p_other/twenty` | `packages/twenty-front/src/…` |
| **Zimbra** (zm-web-client) | `3p_other/Zimbra` | `zm-web-client/WebRoot/…` |
| **Moqui components** (Moqui WorkManagement, Moqui Sales, WeCreate) | `3p_moqui/<component>` (`WorkManagement`, `Sales`, `WeCreate`) | `screen/…`, `service/…` |
| **Moqui baseline** | `mr-moqui-base/runtime` | `component/mr-marble/screen/{SimpleScreens,MyAccount}/…`, `component/mr-marble/screen/…`, `component/mr-mantle/entity/…`, `component/mr-mantle/service/mantle/…`, `component/mr-boss/screen/…` |

Not used here: Akaunting, Frappe Helpdesk (no project field on HD Ticket; intake is covered in [research-customer-service.md](research-customer-service.md)), Signal and the other Moqui components (coarchy, resistmanagement, ServiceJobMonitor, ridgecrest) ship no project, task or timesheet UI. Carbon's only project record is an accounting dimension (name, description) used on sales contracts and reimbursements (`apps/erp/app/modules/accounting/ui/Projects/`); its `resources` module and `packages/planning` are production scheduling. Zimbra Tasks is a personal task list and Frappe CRM Tasks are record follow-ups (both cited once in §4). metasfresh has project and service-provider records but no project screens of its own (§4).

Sections: [1 landing/portfolio/my work](#1-landing-portfolio--my-work) · [2 projects list, create, templates](#2-projects-list-create--templates) · [3 project detail & 360](#3-project-detail--project-360) · [4 tasks / work packages](#4-tasks--work-packages) · [5 boards, backlogs & sprints](#5-boards-backlogs--sprints) · [6 gantt, timeline & calendar](#6-gantt-timeline--calendar) · [7 milestones, versions & phases](#7-milestones-versions--phases) · [8 time tracking & timesheets](#8-time-tracking--timesheets) · [9 resource scheduling & capacity](#9-resource-scheduling--capacity) · [10 budgets, costs & T&M billing](#10-budgets-costs--tm-billing) · [11 request intake & cross-app handoffs](#11-request-intake--cross-app-handoffs) · [12 reporting & analytics](#12-reporting--analytics) · [13 settings & administration](#13-settings--administration) · [14 cross-app surfaces](#14-cross-app-surfaces) · [15 current Moqui baseline](#15-current-moqui-baseline-mr-marble--marbleerp--mantle) · [16 gaps & BOSS implications](#16-gaps--boss-implications)

---

## 1. Landing, portfolio & "my work"

IronStone Projects needs three different landing surfaces: an app home for managers (portfolio health, workload, money), a project list for finding work, and a personal "My work" surface for staff. OpenProject separates all three cleanly; Redmine compresses them into project list + My page.

### OpenProject — global projects, portfolio/program, project overview, My page, My work

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Global projects index | Saved-query project list with hierarchy, favorites, columns incl. custom fields, filters, pagination, project export, and a "Gantt" portfolio link; page header carries save/rename/share actions. | `app/views/projects/index.html.erb`, `app/components/projects/index_page_header_component.rb`, `app/components/projects/table_component.rb`, `app/models/queries/projects/filters/`, `app/models/queries/projects/selects/` |
| Project list filters | Filter set is explicitly modelled: active/archived, ancestor, project type/variant, phase, member, principal, favorite, public, templated, status, name/identifier, created/updated, latest activity, user action, custom fields. | `app/models/queries/projects/filters/*.rb` |
| Project list columns | Default + custom-field selects; created/updated/status/favorite/phase/latest activity/required disk space. | `app/models/queries/projects/selects/*.rb` |
| Portfolio / program workspaces | `workspace_type` is `project`, `program` or `portfolio`; allowed parents are enforced (project can sit under portfolio/program/project; program only under portfolio). Each type gets its own overview grid. | `app/models/project.rb` (`workspace_type`, `ALLOWED_PARENT_WORKSPACE_TYPES`), `modules/overviews/app/components/overviews/workspaces/` |
| Project overview (project workspace) | Widget grid: Description, Project status, Project timeline, Subitems, Meetings, Members, News, Budget totals, Budget by cost type, Actual costs, and project-attribute widgets. Managers can add widgets. | `modules/overviews/app/views/overviews/overviews/show.html.erb`, `dashboard.html.erb`, `modules/overviews/app/components/overviews/workspaces/project_overview_grid_component.html.erb` |
| Portfolio/program overview | Same widget set minus News; portfolio/program aggregate child projects. | `modules/overviews/app/components/overviews/workspaces/{portfolio,program}_overview_grid_component.html.erb` |
| Project status model | Six-state project health separate from the work-item status: on track, at risk, off track, not started, finished, discontinued. | `app/models/project.rb` (`status_code`) |
| Project timeline / phases | Life-cycle phases with start/finish dates and optional start/finish gates; shown as an overview widget and editable in settings. | `app/models/project/phase.rb`, `app/models/project/phase_definition.rb`, `app/components/projects/phases/`, `app/components/projects/settings/life_cycle/` |
| My page | User-arrangeable widget grid (the same grid component as the dashboard). | `frontend/src/app/features/my-page/my-page.component.ts` |
| My work | Personal work screen with list and calendar modes, time-entry rows, scheduled/remaining allocations, entry action menus, and a stop-timer control. | `app/components/my/work/` (`list_component`, `calendar_component`, `time_entries_list_component`, `allocation_row`, `stop_timer_component`) |
| Timers | A running timer is exposed in the menu section and is tied to a work package + time entry. | `modules/costs/app/components/my/timer/menu_section_component.rb` |
| Notifications / activity | Global notifications and project activity feed (work-package journals, news, meetings, wiki/documents). | `app/views/activities/`, `app/views/journals/`, `modules/overviews/app/components/overviews/` |

### Redmine — project index + configurable My page

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Projects list | Query-driven list, saved queries, filters, CSV/Atom export, "My projects"/bookmarked filters. | `app/views/projects/index.html.erb`, `app/models/project_query.rb` |
| Project index columns | Name, status, short description, homepage, identifier, parent, public flag, created/updated, last activity. | `app/models/project_query.rb` (`available_columns`) |
| Project index filters | Name, description, status, parent, created/updated, custom fields. | `app/models/project_query.rb` (`initialize_available_filters`) |
| My page | Drag-and-drop two-column block dashboard; add/remove/order blocks per user. | `app/views/my/page.html.erb`, `app/controllers/my_controller.rb`, `app/helpers/my_helper.rb` |
| My page blocks | Calendar (week), documents, issues assigned to me / reported by me / updated by me / watched by me, an arbitrary saved issue query, news, time log (last N days), activity. Each block supports per-block columns/sort/settings. | `app/views/my/blocks/`, `app/helpers/my_helper.rb` |
| Project overview | See §3; the project show page itself is the landing page. | `app/views/projects/show.html.erb` |
| Activity | Global/project activity feed with date-grouped events. | `app/views/activities/index.html.erb`, `app/controllers/activities_controller.rb` |

### Odoo — Project app menus + list/kanban/calendar + updates

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Project app menu | Projects · Tasks (My Tasks, All Tasks) · Reporting (Tasks Analysis, Customer Ratings) · Configuration (Settings, Projects, Project Templates, Project Roles, Project Stages, Task Stages, Tags, Activity Types, Activity Plans). | `odoo/addons/project/views/project_menus.xml` |
| Project list/kanban/calendar | Switchable project views; kanban is mobile-oriented; list grouped by stage; calendar by planned dates. | `odoo/addons/project/views/project_project_views.xml` (`view_project`, `project_view_kanban`, `view_project_calendar`) |
| Project form header | Stage status bar with "rotting" duration, task completion count/percentage, milestone reached count/progress, customer rating, favorite star, customer/contact details. | `odoo/addons/project/views/project_project_views.xml` (`edit_project`) |
| Project updates | Status/progress update records with author, date, description; list/kanban/graph views; used as the project's periodic health narrative. | `odoo/addons/project/views/project_update_views.xml`, `odoo/addons/project/models/project_update.py` |
| My Tasks | Task kanban/list/calendar/activity/pivot/graph filtered to the current user, grouped by personal stage. | `odoo/addons/project/views/project_task_views.xml` (`action_view_my_task`) |
| Tasks analysis | Pivot/graph analysis over tasks (stage, assignee, working hours, rating). | `odoo/addons/project/views/project_task_views.xml` (`view_project_task_pivot`, `view_project_task_graph`) |

### Odoo to-do / ERPNext / AureusERP / Ever Gauzy / Dolibarr / Moqui WorkManagement — landing patterns

| App | Screen/page | What it is | Key files |
| --- | --- | --- | --- |
| Odoo | To-do | Personal task list over `project.task` with kanban/list/form views, done checkbox, priority, deadline, tags and personal stage; separate top-level menu. | `odoo/addons/project_todo/views/project_task_views.xml`, `odoo/addons/project_todo/views/project_todo_menus.xml` |
| ERPNext | Projects workspace | Desk module page: onboarding, Project Summary chart, Open Projects / Non-completed Tasks / Timesheet Working Hours number cards, Project Reports card, links to Project/Task/Timesheet. | `erpnext/projects/workspace/projects/projects.json`, `erpnext/projects/sidebar/projects/projects.json` |
| ERPNext | Project dashboard | Connections dashboard (Tasks, Timesheets, Issues, Project Updates; material/sales/purchase/manufacture transactions) plus a timesheet heatmap. | `erpnext/projects/doctype/project/project_dashboard.py` |
| AureusERP | Projects dashboard | Filament dashboard widgets: stats overview, tasks by state, tasks by stage, top assignees, top projects. | `plugins/webkul/projects/src/Filament/Widgets/`, `plugins/webkul/projects/src/Filament/Pages/Dashboard.php` |
| Ever Gauzy | Projects list | Table and card-grid layouts, pagination, permissions, favorite toggle, add/edit/delete, "add module" action. | `apps/gauzy/src/app/pages/projects/components/project-list/list.component.html` |
| Ever Gauzy | Project layout | Detail/edit routes and project manager/guard wiring. | `apps/gauzy/src/app/pages/projects/layout/`, `projects-routing.module.ts` |
| Dolibarr | Project list | Dense filter list: status, opportunity status/amount/probability, third party, contact, assigned user, sales rep, late alert, parent project, tags/extra fields; mass close; group-by; column chooser. | `htdocs/projet/list.php` |
| Dolibarr | Project statistics | Graph/statistics view over projects (leads vs projects mode). | `htdocs/projet/stats/index.php` |
| Moqui WorkManagement | Projects screen | QVue page with a right-hand "Find Options" drawer (person, role, status, order by, free text) and inline project/task table. | `screen/wm/Project/Project.qvue`, `screen/wm/Project.xml` |

**BOSS implications.** The references favor OpenProject's three-surface split over a single dashboard: (1) a **Projects home** with portfolio health, workload and overdue/milestone/billing exceptions; (2) a **Find Projects** saved-view table with hierarchy and the filters OpenProject models; (3) a **My work** personal list/calendar with running timer and upcoming allocations, which is also a candidate source for the header "Today" panel. OpenProject's six-state project health is a candidate, and in every reference that has it, it is separate from task status and from the commercial project state (prospect/active/closed). Portfolios/programs could be supported in the data model before any UI exposes them; OpenProject's parent-type rules are the cheapest constraint found.

---

## 2. Projects list, create & templates

### OpenProject — project list, creation wizard, templates, copy

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Create project | Simplified name/identifier form plus a multi-section creation wizard; sections and custom fields are admin-configured. Blank-slate and export variants exist. | `app/views/projects/new.html.erb`, `app/views/projects/creation_wizard/show.html.erb`, `app/components/projects/wizard/`, `app/components/projects/settings/creation_wizard/` |
| Creation wizard admin | Enable/disable, choose sections/custom fields, submission form, export. | `app/components/projects/settings/creation_wizard/`, `app/controllers/projects/settings/creation_wizard_controller.rb`, `app/controllers/projects/creation_wizard_controller.rb` |
| Project templates | Any project can be flagged `templated`; new projects copy from a template (`copy` service copies work packages, members, versions, settings). A default template can be assigned per subproject type. | `app/models/project.rb` (`templated`, `template_id`, `templated_projects`, `subproject_template_assignments`), `app/controllers/projects/templated_controller.rb`, `app/services/projects/copy_service.rb`, `app/models/subproject_template_assignment.rb` |
| Project settings → Template | Marks/uses a project as a template from project settings. | `app/components/projects/settings/template/settings_component.rb`, `app/controllers/projects/settings/template_controller.rb` |
| Copy project | Copy form with selectable components (work packages, members, versions, etc.). | `app/views/projects/copy_form.html.erb`, `app/services/projects/copy_service.rb` |
| Close / archive / delete | Project status changes (finish/discontinue), archive and delete flows; delete warns about work-package reassignment. | `app/controllers/projects/status_controller.rb`, `app/controllers/projects/archive_controller.rb`, `app/components/projects/delete_dialog_component.html.erb` |
| Project identifier / reserved identifiers | Editable identifier with suggestions and a reserved-identifier admin list. | `app/controllers/projects/identifier_controller.rb`, `app/controllers/projects/identifier_suggestion_controller.rb`, `app/controllers/admin/settings/project_reserved_identifiers_controller.rb` |
| Subitems | Project settings for subitem types/templates. | `app/controllers/projects/settings/subitems_controller.rb`, `app/views/projects/settings/subitems/` |

### Redmine — create/copy/close project + module selection

| Screen/page | What it is | Key files |
| --- | --- | --- |
| New/edit project | Name, identifier, description, homepage, parent, public flag, custom fields, trackers, modules, default assigned version/query, activity. | `app/views/projects/new.html.erb`, `app/views/projects/_form.html.erb` |
| Copy project | Copy metadata, members, versions, issue categories, issues, documents, wiki, news, queries, time entries, boards, files, repository (selectable). | `app/views/projects/copy.html.erb`, `app/models/project.rb` (`copy`), `app/controllers/projects_controller.rb` |
| Close/reopen/archive | Project status ladder: active → closed → archived; close cascades to descendants. | `app/models/project.rb` (`close`, `reopen`, `archive`, `unarchive`), `app/views/projects/show.html.erb` |
| Project modules | Per-project on/off switch for issue tracking, time tracking, news, documents, files, wiki, repository, boards, calendar, gantt. | `config/settings.yml` (`default_projects_modules`), `app/models/project.rb` (`enabled_module_names`), `app/views/projects/settings/_*.html.erb` |
| Project settings | Tabs: project (info, modules), members, issue tracking, versions, issue categories, repositories, boards, time-tracking activities. | `app/views/projects/settings/`, `app/views/projects/settings.html.erb`, `app/helpers/projects_helper.rb` (`project_settings_tabs`) |

### Odoo — quick create, templates, stages, visibility, email alias

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Quick-create project | Name + planned date range + project email alias; creates and opens tasks. | `odoo/addons/project/views/project_project_views.xml` (`project_project_view_form_simplified`, `open_create_project`) |
| Full project form | Stage, description, customer/contact, tags, manager, planned dates, settings tab (email alias + accepted senders, company, analytic account, privacy/visibility, allowed internal users, task-management toggles, time-management). | `odoo/addons/project/views/project_project_views.xml` (`edit_project`), `odoo/addons/project/models/project_project.py` |
| Project templates | A project can be `is_template`; products/services can create projects from a template. | `odoo/addons/project/views/project_project_views.xml` (`open_create_project_template`, `project_templates_view_form`), `odoo/addons/sale_project/models/product_template.py` |
| Project roles | Reusable roles assigned to task templates/tasks during project creation from a template. | `odoo/addons/project/views/project_role_views.xml`, `odoo/addons/project/models/project_role.py` |
| Project stages | Configurable stage list with sequence, fold (closed), and rotting threshold; drives the project status bar and kanban. | `odoo/addons/project/views/project_project_stage_views.xml`, `odoo/addons/project/models/project_project_stage.py` |
| Task stages | Per-project task stage configuration (kanban columns), with folded stages treated as closed. | `odoo/addons/project/views/project_task_type_views.xml` |
| Visibility | `privacy_visibility` (portal users / internal / invited internal users). | `odoo/addons/project/models/project_project.py` |
| Email alias | Each project can own an alias; incoming mail creates tasks in that project, with allowed-sender policy. | `odoo/addons/project/models/project_project.py` (`alias_id`, `_alias_get_creation_values`), `odoo/addons/project/views/project_project_views.xml` |

### ERPNext / AureusERP / Dolibarr / Ever Gauzy / WeCreate / Moqui WorkManagement

| App | Screen/page | What it is | Key files |
| --- | --- | --- | --- |
| ERPNext | Project form | Series, name, status (Open/On hold/Completed/Cancelled), type, % complete method (manual/task completion/task progress/task weight), template, priority, department, active flag, timeline (expected/actual dates + actual time), customer + sales order, notes, accounting/costing/billing, progress-update collection, users. | `erpnext/projects/doctype/project/project.json` |
| ERPNext | Project template | Project type + child task templates; used when creating/copying projects. | `erpnext/projects/doctype/project_template/`, `erpnext/projects/doctype/project_template_task/` |
| AureusERP | Project form | Progress stepper (stage), name/description, manager, customer, start/end dates, allocated hours, tags, company, visibility (private/internal/public), allow-timesheets, allow-milestones. | `plugins/webkul/projects/src/Filament/Resources/ProjectResource/Schemas/ProjectForm.php` |
| AureusERP | Projects table | Rich project card stack (name/customer/date/remaining hours/manager/tags), group by stage/manager/customer/created, reorderable, query-builder filters. | `plugins/webkul/projects/src/Filament/Resources/ProjectResource/Tables/ProjectsTable.php` |
| AureusERP | Project pages | List/create/view/edit; relation managers for milestones/tasks; manage milestones/tasks pages. | `plugins/webkul/projects/src/Filament/Resources/ProjectResource/Pages/` |
| Dolibarr | Project create/edit card | Ref, title, parent project, status, opportunity fields (amount/probability/status), dates, third party/contact, assigned users, visibility/public, usage flags (`usage_task`, `usage_bill_time`, `usage_opportunity`, `usage_organize_event`), extra fields. | `htdocs/projet/card.php`, `htdocs/projet/class/project.class.php` |
| Dolibarr | Clone project | Clone with contacts, tasks, project files, task files, notes, date shift, third party. | `htdocs/projet/card.php` (`createFromClone` block) |
| Ever Gauzy | Project create/edit | Dialog forms; project modules; favorites; card/table layouts. | `apps/gauzy/src/app/pages/projects/components/{project-create,project-edit}/` |
| WeCreate | Create project | Account, project name, visibility, start date, estimated hours, description; status flow driven by Mantle `StatusItem`/`StatusFlowTransition`; posts/photos on the project profile. | `screen/wcinternal/Project/FindProject.xml`, `screen/wcinternal/Project/ViewProject.xml` |
| Moqui WorkManagement | Find/create project | QVue list with inline project creation and a find-options drawer; project detail is a simple edit/view screen. | `screen/wm/Project/Project.qvue`, `screen/wm/Project.xml` |

**BOSS implications.** The references converge on a short create form plus an optional wizard rather than one giant form. OpenProject's **template = a real project flagged `templated`** is the cheapest model found: tasks, milestones, members, roles, rates and settings are copied from it, with a default template per project type/subitem type. ERPNext and Odoo both put commercial fields (customer, sales order, contract) on the project; one option is to carry them only when they apply and link to the sales order rather than duplicate price data. Odoo's **project email alias** is a candidate per-project mail route: Comms would receive the mail (SystemMessage/`CommunicationEvent`), and then either the reused request intake creates a `Request` for the project or a project rule creates a work item directly. The Moqui baseline already has the copy step: `mantle.work.ProjectServices.clone#Project` deep-clones a project's tasks, milestones and parties (§15).

---

## 3. Project detail & project 360

### OpenProject — project overview, settings, modules

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Project overview | Widget dashboard described in §1; project header carries favorite, status, settings, archive. | `modules/overviews/app/views/overviews/overviews/show.html.erb`, `modules/overviews/app/components/overviews/page_header_component.html.erb` |
| Project status / timeline widgets | Project health and phase timeline; project attributes widget shows custom fields. | `modules/overviews/app/components/overviews/project_phases/`, `modules/overviews/app/components/overviews/project_custom_fields/` |
| Members widget | Project members and roles. | `modules/overviews/app/components/overviews/workspaces/project_overview_grid_component.html.erb` (`Grids::Widgets::Members`) |
| Budget/cost widgets | Budget totals, budget by cost type, actual costs. | `modules/budgets/app/components/budgets/widgets/`, `modules/costs/app/components/costs/widgets/` |
| Project settings | Sections: General, Life cycle, Modules, Project custom fields, Versions, Work packages (types/categories/internal comments), Template, Repository, Storage, Subitems, Work-package import. | `app/components/projects/settings/`, `app/controllers/projects/settings_controller.rb` |
| Project modules | Enable/disable backlogs, boards, calendar, documents, Gantt, meetings, wiki, work packages, etc. | `app/controllers/projects/settings/modules_controller.rb`, `config/initializers/menus.rb` |
| Project activity | Work-package journals + project events, filterable. | `app/views/activities/`, `app/controllers/activities_controller.rb` |

### Redmine — project overview as a one-page hub

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Project overview | Description, homepage/custom fields, issue-tracking table per tracker (open/closed/total), spent-time box (estimated/spent + log-time/report links), members, latest news, subprojects, wiki content. | `app/views/projects/show.html.erb` |
| Project menu | Per-project tabs for Overview, Activity, Issues, Gantt, Calendar, News, Documents, Files, Wiki, Repository, Boards; module-dependent. | `lib/redmine/preparation.rb` (`MenuManager.map :project_menu`), `app/helpers/projects_helper.rb` |
| Project sidebar | Issue tracking summary, time tracking, members, latest news. | `app/views/projects/_sidebar.html.erb` |
| Settings tabs | Project (info, modules), members, issue tracking, versions, issue categories, repositories, boards, activities. | `app/views/projects/settings/` |

### Odoo — project form as the 360

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Project form | Header facts (stage, completion, milestones, rating, favorite), description, settings, and smart buttons for tasks/milestones/updates/ratings. | `odoo/addons/project/views/project_project_views.xml` (`edit_project`) |
| Profitability / analytic items | Embedded "Analytic Items" action on the project (analytic account lines) and on project updates. | `odoo/addons/project_account/views/project_project_views.xml`, `odoo/addons/project_account/models/project_project.py` |
| Sales / invoices | Embedded actions for sales orders, order items and invoices (from `sale_project`); actual-margin action. | `odoo/addons/sale_project/views/project_views.xml` (`project_embedded_action_invoices`, `sales_orders`, `sales_order_items`, `project_actual_margin`) |
| Updates | Project update list/kanban/form/graph; each update has status, progress, author, date, description and task counts. | `odoo/addons/project/views/project_update_views.xml`, `odoo/addons/project/models/project_update.py` |
| Portal | Customer portal templates for projects and tasks. | `odoo/addons/project/views/project_portal_project_project_templates.xml`, `odoo/addons/project/views/project_portal_project_task_templates.xml` |

### ERPNext / AureusERP / Dolibarr / Ever Gauzy / WeCreate / Moqui WorkManagement

| App | Screen/page | What it is | Key files |
| --- | --- | --- | --- |
| ERPNext | Project form tabs | Tasks, Customer, Notes, Costing (accounting, costing/billing, margin), Progress updates, More Info, Connections. | `erpnext/projects/doctype/project/project.json` |
| ERPNext | Project dashboard | Connections to Task/Timesheet/Issue/Project Update, material requests/BOM/stock, sales, purchase, manufacture; timesheet heatmap. | `erpnext/projects/doctype/project/project_dashboard.py`, `project_dashboard.html` |
| AureusERP | Project view | Infolist + relation managers (milestones, tasks), timesheets relation on tasks. | `plugins/webkul/projects/src/Filament/Resources/ProjectResource/Schemas/ProjectInfolist.php`, `RelationManagers/` |
| Dolibarr | Project card tabs | Project, Contacts, Tasks (with badge), Time spent, Project overview/elements (proposals, orders, invoices, contracts, interventions, shipments, MOs, trips…), Tickets, Event organization, Emailings, Notes, Documents, Agenda. | `htdocs/core/lib/project.lib.php` (`project_prepare_head`), `htdocs/projet/card.php`, `htdocs/projet/element.php` |
| Dolibarr | Project statistics | Statistics mode over the project list. | `htdocs/projet/stats/index.php` |
| Ever Gauzy | Project detail | Record page + edit dialog; task view has a right-side quick-look drawer and a bookmarkable full page that render the same sections. | `apps/gauzy/src/app/pages/projects/`, `apps/gauzy/src/app/pages/tasks/components/task-view/`, `apps/gauzy/src/app/pages/tasks/components/task-view/task-view-sections.ts` |
| WeCreate | Project profile | Instagram-like project page: owner profile, status transition links, visibility, start date, estimated hours, description, posts/photos; positions are managed on a separate screen. | `screen/wcinternal/Project/ViewProject.xml`, `FindProjectPositions.xml` |
| Moqui WorkManagement | Project detail | Simple inline-edit project view; task list is the main content. | `screen/wm/Project/Project.qvue` |

**BOSS implications.** The references point to the project detail page as a **hub with smart buttons** rather than a form: header (health, dates, manager, customer), tabs for Overview / Work items / Milestones / Timesheets / Costs / Files / Activity, and links to the linked sales order, requests and invoices. OpenProject's widget grid is the richest overview; a fixed layout with the same widgets (health, timeline, next milestone, budget vs actual, overdue tasks, recent activity) is a cheaper variant. Dolibarr's one tab per document type grows large; grouping commercial elements under "Related" is one alternative.

---
## 4. Tasks / work packages

### OpenProject — the most complete work-item UI in the checkout

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Work-package list | One query-space with table and card ("grid") representations, optional timeline; configurable columns, grouping, sorting, filters, pagination, sums row, inline create, bulk actions, export. | `app/views/work_packages/index.html.erb`, `frontend/src/app/features/work-packages/routing/wp-list-view/`, `frontend/src/app/features/work-packages/components/wp-table/`, `frontend/src/app/features/work-packages/components/wp-card-view/`, `frontend/src/app/features/work-packages/components/wp-query/` |
| Display modes | `displayRepresentation` switches table ⇄ cards; a timeline toggle adds the Gantt-style right pane; split view opens the selected item beside the list. | `frontend/src/app/features/work-packages/routing/wp-view-base/view-services/wp-view-display-representation.service.ts`, `frontend/src/app/features/work-packages/components/wp-buttons/wp-timeline-toggle-button/`, `app/views/work_packages/split_view.html.erb` |
| Saved queries | Query name, public/starred, filters, columns, sort, group-by; query select menus in the global and project menus. | `app/models/queries/`, `app/views/work_packages/menus/`, `frontend/src/app/features/work-packages/components/wp-query/` |
| Work-package filters | Assigned/assignee-or-group, author, blocked/blocks, category, comment, created/updated, dates interval, done ratio, due/start, duration, estimated hours, id, milestone, parent, priority, project, project phase, relations (relates/duplicates/precedes/follows/requires), responsible, role, shared-with-me/user, status, subject, type, version, watcher, custom fields. | `app/models/queries/work_packages/filter/*.rb` |
| Work-package columns/selects | Relation, custom-field, project phase, typeahead, manual sort; custom fields are first-class columns. | `app/models/queries/work_packages/selects/*.rb` |
| Full work-package view | Tabs: Overview, Activity, Relations, Watchers, Files, Project attributes. Activity supports journals, revisions, filtering/sorting, reactions, inline edit; relations tab groups hierarchy and typed relations. | `app/components/work_packages/full_view/`, `frontend/src/app/features/work-packages/components/wp-single-view-tabs/` |
| Work-package form | Subject, description, type, status, priority, assignee, responsible, project, phase, version, category, start/due dates, duration, % complete, estimated/remaining hours, budget, custom fields, attachments, watchers, parent/relations. | `app/components/work_packages/`, `frontend/src/app/features/work-packages/components/wp-edit/`, `frontend/src/app/features/work-packages/components/wp-details/` |
| Inline create / split create | Create a work package in the list or beside it without leaving the query; type and project preset. | `app/components/work_packages/full_view/create_component.*`, `app/views/work_packages/split_create.html.erb` |
| Relations | Parent/child hierarchy, blocked-by/blocks, relates, duplicates, precedes/follows, requires; relation create/remove/group rows; hierarchy indentation. | `frontend/src/app/features/work-packages/components/wp-relations/`, `frontend/src/app/features/work-packages/components/wp-table/` hierarchy services |
| Bulk / copy / move | Bulk edit/delete, copy with options, move to another project. | `app/views/work_packages/bulk/`, `app/views/work_packages/copy.html.erb`, `app/views/work_packages/moves/` |
| Work-package summary report | Per-category summary of work packages (counts by status/type) with details. | `app/views/work_packages/reports/report.html.erb`, `app/views/work_packages/reports/report_details.html.erb` |
| Reminders / watchers / share | Reminder modal, watcher button/tab, share modal. | `frontend/src/app/features/work-packages/components/wp-buttons/wp-reminder-button/`, `frontend/src/app/features/work-packages/components/wp-single-view-tabs/watchers-tab/`, `frontend/src/app/features/work-packages/components/wp-share-modal/` |
| Baseline | Plan baseline display with legends and baseline modal. | `frontend/src/app/features/work-packages/components/wp-baseline/` |
| Project attributes tab | Shows project-level attributes while viewing a work package. | `frontend/src/app/features/work-packages/components/wp-single-view-tabs/project-attributes-tab/` |

### Redmine — compact issue tracker with a strong query model

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Issue list | Query-driven list with selected columns, grouping, sorting, inline column choice, bulk edit, context menu, CSV/Atom/PDF exports. | `app/views/issues/index.html.erb`, `app/controllers/issues_controller.rb` |
| Issue query columns | Id, project, tracker, parent, status, priority, subject, author, assignee, watchers, updated, category, fixed version, start/due dates, estimated hours, estimated remaining, total estimated, done ratio, created/closed, last updated by, relations, attachments, description, last notes. | `app/models/issue_query.rb` (`available_columns`) |
| Issue query filters | Status, tracker, priority, assignee, author, category, fixed version, dates, estimated/spent hours, done ratio, project/subproject, parent/child, relations, watchers, custom fields, free text. | `app/models/issue_query.rb` (`initialize_available_filters`) |
| Saved queries | Personal/public queries, default query per project/user, query form with column/group/sort/options; CSV options dialog. | `app/views/queries/`, `app/models/query.rb`, `app/controllers/queries_controller.rb` |
| Issue detail | Header (subject, status, private badge, previous/next), author/assignee avatars, attributes table (status, priority, assignee, category, version, dates, done ratio, estimated/spent), description, subtasks, relations, attachments, watchers, history/time/changeset tabs. | `app/views/issues/show.html.erb`, `app/views/issues/tabs/` |
| Issue form | Tracker, subject, description, status, priority, assignee, category, fixed version, start/due, done ratio, estimated hours, parent, watchers, private, custom fields, attachments. | `app/views/issues/_form.html.erb`, `_attributes.html.erb` |
| Subtasks / relations | Parent/child tree, related issues (relates/duplicates/blocks/precedes/follows/copied-to), watchers. | `app/views/issues/_subtasks.html.erb`, `_relations.html.erb`, `app/models/issue_relation.rb` |
| Bulk edit | Multi-select issue update with per-field "no change" semantics. | `app/views/issues/bulk_edit.html.erb`, `app/controllers/issues_controller.rb` |
| Issue categories / trackers | Project-scoped categories and global trackers with per-tracker workflows/fields. | `app/views/issue_categories/`, `app/views/trackers/`, `app/models/issue_category.rb` |
| Watchers | Add/remove watchers, watcher list column and filter. | `app/views/watchers/`, `app/models/watcher.rb` |
| Issue intake / mail handler | Incoming mail creates issues or replies; target project resolved by subaddress or `project` keyword; permission checks per project. | `app/models/mail_handler.rb` |

### Odoo — task views and form

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Task views | Kanban (grouped by stage or project), list, calendar, activity, pivot, graph; My Tasks grouped by personal stage; All Tasks ungrouped with project column. | `odoo/addons/project/views/project_task_views.xml` (`action_view_my_task`, `action_view_all_task`, `view_task_kanban`, `view_task_tree2`, `view_task_calendar`) |
| Task form | Stage bar + state bar, priority, tags, project, milestone, assignees, roles, customer, deadline, recurrence (interval/unit/type/until), allocated hours, description (collaborative HTML), sub-tasks, blocked-by, extra info. | `odoo/addons/project/views/project_task_views.xml` (`view_task_form2`), `odoo/addons/project/models/project_task.py` |
| Task states | In Progress, Changes Requested, Approved, Waiting, Done, Canceled; stage is separate and per-project. | `odoo/addons/project/models/project_task.py` (`state`, `stage_id`) |
| Subtasks / dependencies | `child_ids` table with stage/assignee/deadline; `depend_on_ids` "Blocked By" table with the same columns. | `odoo/addons/project/views/project_task_views.xml` |
| Recurrence | Recurring task checkbox + interval/unit/type/until; recurrence count stat button. | `odoo/addons/project/models/project_task.py` |
| Activities | Mail activities on tasks; "Next Activity"/"My Deadline" columns and activity view. | `odoo/addons/project/views/project_task_views.xml`, `odoo/addons/mail/views/` |
| Rating | Customer rating on tasks/projects (`rating_last_value`, rating stat button). | `odoo/addons/project/views/project_task_views.xml`, `odoo/addons/project/views/project_project_views.xml` |
| Portal sharing | Share project/task with portal users; portal task/project templates. | `odoo/addons/project/views/project_sharing_project_task_views.xml`, `odoo/addons/project/views/project_portal_project_project_templates.xml`, `odoo/addons/project/views/project_portal_project_task_templates.xml` |

### ERPNext / AureusERP / Dolibarr / Ever Gauzy / Moqui WorkManagement / others

| App | Screen/page | What it is | Key files |
| --- | --- | --- | --- |
| ERPNext | Task form | Subject, project, issue, type, group flag, status (Open/Working/Pending Review/Overdue/Template/Completed/Cancelled), priority, weight, parent task, completed by/on, template flags, begin/duration, expected dates/time, progress, milestone flag, description, dependencies, actual dates/time, costing/billing, review/closing dates, department/company. | `erpnext/projects/doctype/task/task.json` |
| ERPNext | Task list/Gantt/calendar | Standard list with Gantt view (Frappe Gantt) and calendar; task dashboard connections. | `erpnext/projects/doctype/task/task_list.js`, `erpnext/projects/doctype/task/task_calendar.js`, `erpnext/projects/doctype/task/task_dashboard.py`, (Frappe framework) `frappe/public/js/frappe/views/gantt/gantt_view.js` |
| ERPNext | Task dependencies | `Task Depends On` / `Dependent Task` child tables. | `erpnext/projects/doctype/task_depends_on/`, `erpnext/projects/doctype/dependent_task/` |
| AureusERP | Task table | Priority toggle, state icon/modal, title, project, milestone, customer, assignees, allocated hours, time spent, remaining, progress, deadline, tags. | `plugins/webkul/projects/src/Filament/Resources/TaskResource/Tables/TasksTable.php` |
| AureusERP | Task form | Progress stepper per project stage, title, state, tags, description, project, milestone, customer, assignees, deadline, allocated hours. | `plugins/webkul/projects/src/Filament/Resources/TaskResource/Schemas/TaskForm.php` |
| AureusERP | Task relations | Sub-tasks and timesheets relation managers; manage-tasks/manage-subtasks/manage-timesheets pages. | `plugins/webkul/projects/src/Filament/Resources/TaskResource/RelationManagers/`, `plugins/webkul/projects/src/Filament/Resources/TaskResource/Pages/` |
| Dolibarr | Project tasks list | Tasks table with filters, progress, assigned users, dates, time spent; tasks can be grouped/sorted and mass-updated. | `htdocs/projet/tasks.php`, `htdocs/projet/tasks/list.php` |
| Dolibarr | Task card | Task identity, dates, progress, assigned users, contacts, notes, documents, comments, time spent; status progression. | `htdocs/projet/tasks/task.php`, `htdocs/core/lib/project.lib.php` (`task_prepare_head`) |
| Ever Gauzy | Task lists | Table, kanban, and sprint views; task dialog for create/edit; team and "my task" dialogs. | `apps/gauzy/src/app/pages/tasks/components/task/`, `apps/gauzy/src/app/pages/tasks/components/task-view/` |
| Ever Gauzy | Task view | Shared read-only sections rendered in both a right-side drawer and a full-width route page (details, relations: members, project, parent, tags, teams, sprint, status/priority/size, estimate). | `apps/gauzy/src/app/pages/tasks/components/task-view/task-view-sections.ts`, `task-view-page.component.html` |
| Moqui WorkManagement | Task screen | QVue task table with full-screen task editor, inline edit of name/assignee/project/status/priority/due date, comments, saved finds, filter drawer (person/role/project/status/order/text). | `screen/wm/Task/Task.qvue`, `screen/wm/Task.xml` |
| Moqui WorkManagement | Task notifications | Task update/assignment email templates. | `screen/EmailTemplates/WMTaskUpdateNotificationEmail.xml` |
| Nextcloud Tasks / Nextcloud Deck | See Commons research §11 | VTODO-backed personal tasks and kanban cards with details/attachments/comments/activity tabs. | [research-drawers-commons.md](research-drawers-commons.md) §11 |
| Moqui Sales | Edit task | Moqui-native task edit screen tied to a sales opportunity: task id/name/status/estimated completion/description; links to project summary, milestone summary and task summary; uses SimpleScreens work transitions for user project list/milestones/task list. | `screen/Sales/Task/EditTask.xml` (references `component://mr-marble/template/work/WorkTransitions.xml`) |
| Zimbra (zm-web-client) | Tasks | Personal task list over task-list folders: sortable list columns, detail view, edit view with due date, percent complete, priority and reminder; new task-folder dialog. | `zm-web-client/WebRoot/js/zimbraMail/tasks/view/{ZmTaskListView,ZmTaskView,ZmTaskEditView,ZmNewTaskFolderDialog}.js`, `zm-web-client/WebRoot/templates/tasks/Tasks.template` |
| Twenty | Per-record tasks widget | Task component and hooks used inside record timelines; not a full project module. | `packages/twenty-front/src/modules/activities/tasks/` |
| Gameplan | My Tasks / Space tasks / task page | Task list with tabs All / Assigned to me / Created by me, grouped by status (Backlog, Todo, In Progress, Done, Canceled) with collapsible groups; task fields title, description, start/due date, priority (Urgent/High/Medium/Low), project, team, assignee, completed at/by, comment count. | `frontend/src/pages/{MyTasks,SpaceTasks,Task}.vue`, `frontend/src/components/TaskList.vue`, `gameplan/gameplan/doctype/gp_task/gp_task.json` |
| Gameplan | Space (project) | A GP Project is shown as a "space" with Discussions, Pages and Tasks tabs; members, readme, icon, private flag, archive. Tasks sit beside discussion threads and documents rather than in a planning tool. | `frontend/src/pages/{Space,SpaceDiscussions,SpacePages,SpaceTasks}.vue`, `gameplan/gameplan/doctype/gp_project/gp_project.json` |
| Frappe CRM | Tasks | Follow-up tasks linked to any record (`reference_doctype` / `reference_docname`): title, status (Backlog/Todo/In Progress/Done/Canceled), priority, assignee, start/due date; list and kanban views. | `frontend/src/pages/Tasks.vue`, `crm/fcrm/doctype/crm_task/crm_task.json` |
| metasfresh | Service-provider issues | `S_Issue` with project, milestone, parent issue, estimated / budgeted effort, aggregated and invoicable child effort, planned UAT and delivered dates; `S_Milestone` (name, due date); `S_TimeBooking`; issues and bookings are imported from GitHub and Everhour. Backend records only; no custom project screens in the frontend *(window layout unverified)*. | `backend/de.metas.serviceprovider/src/main/java/de/metas/serviceprovider/{issue,milestone,timebooking,github,everhour}/`, `backend/de.metas.business/src/main/java/de/metas/project/` |

**BOSS implications.** The references suggest **one work-item screen** over Mantle `WorkEffort` that switches views over the same dataset: list/table, kanban/board, calendar, timeline/Gantt. OpenProject's **saved queries + configurable columns + grouping + split view** is the strongest interaction model found, and Redmine shows that a compact column/filter set is enough for small teams. The references keep three concepts separate: (1) **work-item status** (per type workflow), (2) **project health** (six-state), and (3) **stage/board column** (per project). OpenProject's typed relations (parent/child, blocked-by/blocks, relates, duplicates, precedes/follows with lag, includes/part-of, requires) are a candidate in place of free-text links; Mantle `WorkEffortAssoc` already has Relates To, Depends On (Blocked By), Duplicates, Based On, Clones, Caused By and Independent Of, and `WorkEffort.parentWorkEffortId` gives the hierarchy, so only precedes/follows with a lag is missing (§16). Other candidates are Odoo's recurrence and personal "My Tasks" stage view, and Redmine's watchers + email reply intake. The evidence favors keeping request records a separate entity linked to work items, not a disguised task, because SLA and communication semantics differ (see §11). Gameplan and Frappe CRM show the light end of the same record: a five-state task list grouped by status, and follow-up tasks linked to any record, which matches how Commons and Sales would include the reused work-item screen.

---

## 5. Boards, backlogs & sprints

### OpenProject — action-based boards + real backlog

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Boards index / board | Kanban board whose columns are driven by a chosen action: status, assignee, version, subproject, or subtasks; card drag moves the work package field; board configuration modal, add-list, filters, toolbar, inline add. | `modules/boards/app/controllers/boards/boards_controller.rb`, `modules/boards/app/views/boards/`, `frontend/src/app/features/boards/board/` |
| Board actions registry | Column semantics are pluggable services (`status`, `assignee`, `version`, `subproject`, `subtasks`); the same board shell serves all of them. | `frontend/src/app/features/boards/board/board-actions/` (`board-actions-registry.service.ts`, `*-action.service.ts`) |
| Board configuration | Configure action, filters, columns, and save/share the board view. | `frontend/src/app/features/boards/board/configuration-modal/`, `add-list-modal/` |
| Backlog & sprints | Combined backlog + sprint view with drag-and-drop across lists, batch moves, split view, filters. | `modules/backlogs/app/views/backlogs/backlog/show.html.erb`, `modules/backlogs/app/views/backlogs/sprints/index.html.erb` |
| Sprint reports / burndown | Burndown chart and sprint report widgets. | `modules/backlogs/app/views/backlogs/burndown_chart/show.html.erb`, `modules/backlogs/app/components/backlogs/sprint_reports/`, `modules/backlogs/app/models/burndown.rb` |
| Backlog settings | Estimation units, multiple active sprints, shared backlogs, sprint sharing. | `modules/backlogs/app/views/projects/settings/`, `modules/backlogs/app/controllers/projects/settings/` |
| Sprint work-package fields | Sprint/backlog bucket fields on work packages plus bulk edit. | `modules/backlogs/app/views/work_packages/bulk/_sprint_and_backlog_bucket_fields.html.erb` |

### Other references

| App | Screen/page | What it is | Key files |
| --- | --- | --- | --- |
| Nextcloud Deck | Board + card sidebar | Kanban stacks, card drag/reorder, card details/attachments/comments/activity tabs, labels, assignees, due/start, dependencies, board sharing and timeline; also a Gantt board mode. | `deck/src/components/board/Board.vue`, `components/card/CardSidebar*.vue` (see Commons research §11) |
| Odoo | Task kanban | Kanban grouped by stage (default) or project; quick create; drag changes stage. | `odoo/addons/project/views/project_task_views.xml` (`view_task_kanban*`) |
| Ever Gauzy | Sprint view | Task board organized by sprint; task/task-view components shared with list pages. | `apps/gauzy/src/app/pages/tasks/components/task/tasks-layouts/tasks-sprint-view/` |
| Redmine | Boards | **Not kanban** — project forums with topics/messages. Worth keeping as a discussion surface, not a work board. | `app/views/boards/`, `app/views/messages/` |
| ERPNext | Kanban | Generic Frappe kanban on Task/Project; no sprint/backlog module in this checkout. | (Frappe framework) `frappe/public/js/frappe/views/kanban/`, `erpnext/projects/` |
| Moqui WorkManagement / WeCreate | none | Table/detail only. | — |

**BOSS implications.** OpenProject treats boards as **views over the work-item query with a column action**: columns can be status, assignee, milestone, project, or parent task. That pattern gives one board implementation instead of separate "status board / team board / milestone board" screens. Backlogs/sprints matter mainly if IronStone targets agile teams; one option is a work-item field (sprint/backlog bucket) with no separate backlog UI. Redmine's "board = forum" shows that project discussion is a different feature; the reused Commons/Comms discussion and Chatter screens are one place for it, rather than overloading the board.

---

## 6. Gantt, timeline & calendar

| App | Screen/page | What it is | Key files |
| --- | --- | --- | --- |
| OpenProject | Work-package table timeline | Gantt-style bars in the right pane of the table, driven by start/due dates and relations; toggle from the toolbar. | `frontend/src/app/features/work-packages/components/wp-table/timeline/`, `wp-buttons/wp-timeline-toggle-button/` |
| OpenProject | Gantt module | Full-page Gantt view (saved Gantt queries, project/global). | `modules/gantt/app/views/gantt/gantt/index.html.erb`, `modules/gantt/app/controllers/gantt/` |
| OpenProject | Portfolio Gantt | Global project list links to a Gantt query over portfolio projects. | `app/components/projects/index_page_header_component.rb` (`gantt_portfolio_query_link`) |
| OpenProject | Baseline | Planned-vs-actual baseline bars/legends and baseline modal. | `frontend/src/app/features/work-packages/components/wp-baseline/` |
| OpenProject | Calendar | Work-package calendar page. | `frontend/src/app/features/calendar/wp-calendar/`, `wp-calendar-page/` |
| OpenProject | Project timeline widget | Phase/project timeline on the overview. | `modules/overviews/app/components/overviews/project_phases/`, `Grids::Widgets::ProjectTimeline` |
| Redmine | Gantt | Query-driven Gantt chart with relations and progress line. | `app/views/gantts/show.html.erb`, `_chart.html.erb`, `app/controllers/gantts_controller.rb` |
| Redmine | Calendar | Issue calendar by start/due date, with project/user filters. | `app/views/calendars/show.html.erb`, `app/controllers/calendars_controller.rb` |
| Dolibarr | Gantt | Project Gantt view (jsGantt) and per-project Gantt include. | `htdocs/projet/ganttview.php`, `ganttchart.inc.php`, `jsgantt_language.js.php` |
| ERPNext | Gantt/calendar | Frappe Gantt view and task calendar. | (Frappe framework) `frappe/public/js/frappe/views/gantt/gantt_view.js`, `erpnext/projects/doctype/task/task_calendar.js` |
| Odoo | Calendar | Task calendar and project calendar by planned dates. | `odoo/addons/project/views/project_task_views.xml` (`view_task_calendar`), `project_project_views.xml` (`view_project_calendar`) |
| AureusERP | Full calendar | Generic full-calendar plugin used by project/task resources. | `plugins/webkul/full-calendar/` (listed in 3p-app-reference.md) |
| Ever Gauzy | Calendar | Time-log/timesheet calendar plus task dates. | `apps/gauzy/src/app/pages/employees/timesheet/calendar/` |

**BOSS implications.** In OpenProject and Redmine the Gantt is a **view of the work-item query**, with dependencies as bars/arrows and the same filters/columns as the list; OpenProject's inline timeline plus baseline is the strongest model, and Redmine's query-driven Gantt is the minimum viable one. The calendar in both is the same dataset by date fields. If scheduling people matters more than task bars, the team planner (§9) is an alternative default landing to a Gantt.

---

## 7. Milestones, versions & phases

IronStone Projects needs **milestones** (client-visible dates/deliverables), **versions/releases** (what ships when) and **project phases** (life-cycle stages with gates). The references model these as three different things; collapsing them is a design choice about which semantics BOSS wants.

### OpenProject — versions/roadmap + phases/gates

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Versions index / roadmap | Project version list with roadmap filter and version links; each version shows status, date, description and issue/work-package counts. | `app/views/versions/index.html.erb`, `_roadmap_filter.html.erb`, `_roadmap_version_links.html.erb` |
| Version detail | Page header with edit/delete, then a widget grid: overview, progress (estimated, remaining and spent time), wiki page, related work packages, work-packages graph. | `app/views/versions/show.html.erb`, `app/components/projects/settings/versions/` |
| Version form | Name, description, status, wiki page, start date, finish date, sharing, custom fields. | `app/views/versions/new.html.erb`, `edit.html.erb`, `app/forms/versions/form.rb` |
| Version widgets | Overview, progress, wiki, related-issues and work-packages-graph widget components used by the detail page. | `app/components/projects/settings/versions/` |
| Project phases | Admin-defined phase definitions with start/finish gates and position; project-level start/finish dates per phase; duration calculated over working days; previous-phase chaining. | `app/models/project/phase.rb`, `app/models/project/phase_definition.rb`, `modules/overviews/app/components/overviews/project_phases/` |
| Phase settings | Activate/deactivate phases per project; reschedule; working-day-aware duration. | `app/controllers/projects/settings/life_cycle_steps_controller.rb`, `app/services/project_phases/` |
| Phase filtering | Project/work-package filters by phase, any phase, phase gate. | `app/models/queries/work_packages/filter/project_phase_filter.rb`, `app/models/queries/projects/filters/project_phase_*.rb` |
| Milestone work packages | No dedicated milestone model: a milestone is a work-package **type** flagged `is_milestone` (single date, shown as a diamond), or is represented by versions/phases. | `app/models/type.rb` (`scopes :milestone`), `app/models/version.rb` |

### Redmine — versions/roadmap

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Roadmap / versions index | Open versions (completed ones behind a filter), each with a status badge, issue counts, dates and completion; sidebar filter by tracker, completed versions and subprojects. | `app/views/versions/index.html.erb`, `_sidebar.html.erb` |
| Version detail | Name, status badge, overview, wiki page content, time tracking (estimated, remaining, spent), status-by breakdown, related issues. | `app/views/versions/show.html.erb`, `_overview.html.erb` |
| Version form | Name, description, status (open/locked/closed), due date, sharing, wiki page title. | `app/views/versions/_form.html.erb` |
| Version settings | Project settings → versions list; issue category/version assignment. | `app/views/projects/settings/_versions.html.erb` |

### Odoo / ERPNext / AureusERP / others

| App | Screen/page | What it is | Key files |
| --- | --- | --- | --- |
| Odoo | Milestones | Name, sequence, project, deadline, reached flag/date, task count/done count, deadline exceeded/future flags; list/kanban/form; project shows reached count/progress and next milestone. | `odoo/addons/project/views/project_milestone_views.xml`, `odoo/addons/project/models/project_milestone.py` |
| Odoo | Milestone billing | Milestones can carry a sales-order line and quantity percentage; reaching milestones drives delivered quantity/invoicing. | `odoo/addons/sale_project/models/project_milestone.py`, `sale_order_line.py` |
| Odoo | Project stages | Life-cycle-ish stage list with fold/rotting, separate from milestones. | `odoo/addons/project/models/project_project_stage.py` |
| ERPNext | Milestone | `Task.is_milestone` + milestone flag in task list/Gantt; project % complete can use task completion/progress/weight. No separate milestone record. | `erpnext/projects/doctype/task/task.json` |
| ERPNext | Project template | Template project type + template tasks; copied into new projects. | `erpnext/projects/doctype/project_template/` |
| AureusERP | Milestones | Configurable milestone records (name, deadline, completed) attached to projects/tasks. | `plugins/webkul/projects/src/Filament/Clusters/Configurations/Resources/MilestoneResource/` |
| Dolibarr | none | No milestone/version object; use task dates and project start/end. | `htdocs/projet/` |
| Ever Gauzy | Goals/OKRs | Goals/key results are a separate management layer, not project milestones. | `apps/gauzy/src/app/pages/goals/` |
| WeCreate / Moqui WorkManagement | none | Estimated dates/hours only. | (WeCreate) `screen/wcinternal/Project/`, (Moqui WorkManagement) `screen/wm/` |

**BOSS implications.** The references separate three meanings: **milestones** are client-facing deliverables (date + reached state + optional billing trigger), **versions/releases** are a set of work items that ship together, and **phases** are the project life cycle. OpenProject's phase/gate model is the richest and fits services delivery; Odoo's milestone → sales-order milestone billing is the cleanest T&M link; Redmine's roadmap is the cheapest version/roadmap UI. Mantle already models the first two as `WorkEffort` types: `WetMilestone` and `WetRelease` under a `WetProject`, with tasks linked by `WorkEffortAssoc` types `WeatMilestone` / `WeatRelease`, and the baseline has milestone screens (§15). Reached = status `WeComplete` plus `actualCompletionDate`. What the billing trigger lacks is a share of an order line: `OrderItemWorkEffort` links a sales order line to a work effort (with `requiredWork`), but has no quantity-percentage field like Odoo's `quantity_percentage` (§16). Phases have no Mantle record. Milestones are cheap on the existing type; phases need a new record; a version/roadmap screen matters only if releases are a real workflow for the audience.

---

## 8. Time tracking & timesheets

### OpenProject — time entries, My work, timer, rates

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Time entry form | User (when logging for others), days + hours (or start time), work package/meeting entity, activity, comments, custom fields. | `modules/costs/app/components/time_entries/time_entry_form_component.html.erb` |
| My work — list | Time entries grouped in a list with stats, filters, row action menu, edit/delete. | `app/components/my/work/list_component.*`, `time_entries_list_component`, `list_stats_component` |
| My work — calendar | Calendar view of logged time. | `app/components/my/work/calendar_component.*` |
| My work — allocations | Scheduled/remaining allocation rows and action menu, separate from actual time entries. | `app/components/my/work/allocation_row.rb`, `allocation_action_menu_component.rb`, `remaining_allocations.rb` |
| Timer | Start/stop timer tied to a work package/time entry; running timer shown in the menu and in My work. | `modules/costs/app/components/my/timer/`, `app/components/my/work/stop_timer_component.rb` |
| Time & costs settings (project) | Enable time/cost tracking, choose time-entry activities, cost types, rates. | `modules/costs/app/components/projects/settings/time_and_costs/`, `time_entry_activities/`, `cost_types/` |
| Time entry activities | Enumeration-like activities (development, design, …), per project. | `modules/costs/app/controllers/admin/settings/time_entry_activities_controller.rb`, `modules/costs/app/models/time_entry_activities_project.rb` |
| Hourly rates | Default rate, user rate, project-specific rate with history; rate dialogs/forms. | `modules/costs/app/controllers/{default_hourly_rates,hourly_rates,my/hourly_rates}_controller.rb`, `modules/costs/app/components/hourly_rates/` |
| Cost entries | Non-time costs (units × cost type) attached to work packages/projects. | `modules/costs/app/models/cost_entry.rb`, `modules/costs/app/views/costlog/` |
| Time entry model | Project, polymorphic entity (work package or meeting), user, activity, rate, logged_by, spent_on, hours, start time, comments, custom fields. | `modules/costs/app/models/time_entry.rb` |
| Time entry reports | Cost/time reports with grouping and export; time entries also appear in work-package/cost widgets. | `modules/reporting/`, `modules/costs/app/controllers/grids/widgets/time_entries_current_user_controller.rb` |

### Redmine — timelog + report

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Log time form | Project, issue, user (if permitted), spent_on, hours, comments, activity, custom fields. | `app/views/timelog/_form.html.erb` |
| Time entries list | Query list with filters, columns, bulk edit, CSV. | `app/views/timelog/index.html.erb`, `app/controllers/timelog_controller.rb` |
| Spent-time report | Criteria (up to 3: project, issue, user, activity, tracker, category, version, …), columns year/month/week/day, totals, CSV. | `app/views/timelog/report.html.erb`, `_report_criteria.html.erb`, `lib/redmine/helpers/time_report.rb` |
| My page time log block | Last N days of the current user's time entries, grouped by day. | `app/helpers/my_helper.rb` (`render_timelog_block`), `app/views/my/blocks/_timelog.html.erb` |
| Time entry model | Project, issue, user, author, activity, hours, spent_on, comments; required issue/comments configurable. | `app/models/time_entry.rb` |
| Activities admin | Time-entry activities and project-level activity enablement. | `app/views/enumerations/`, `app/views/projects/settings/_activities.html.erb` |

### Odoo — analytic-line timesheets

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Timesheet list/form | Analytic line: date, employee/user, project, task, description/name, unit amount, billable/cost amounts. | `odoo/addons/hr_timesheet/views/account_analytic_line_views.xml` (`hr_timesheet_line_tree`, `hr_timesheet_line_form`, `timesheet_view_form_user`) |
| Timesheet views | List, kanban, calendar, pivot, graph; "My Timesheets" and "My Projects/Tasks" filters; group by employee/project/task/date. | `odoo/addons/hr_timesheet/views/account_analytic_line_views.xml` (`view_kanban_account_analytic_line`, `view_calendar_account_analytic_line`, `view_hr_timesheet_line_pivot`, `view_hr_timesheet_line_graph`) |
| Pivot analyses | Employee × month and date-by-week pivots with time spent and cost. | `odoo/addons/hr_timesheet/views/account_analytic_line_views.xml` (`view_hr_timesheet_line_pivot`, `view_my_timesheet_line_pivot`) |
| Timer | **No native timer in this community checkout** (only `timesheet_grid`/enterprise or third-party adds one). | — |
| Timesheet settings | Time unit, encode reminders (including a reminder to approvers), time-off-generated timesheets, and project/task linkage; the approval UI itself is not in this community checkout. | `odoo/addons/hr_timesheet/views/res_config_settings_views.xml` |

### ERPNext / AureusERP / Ever Gauzy / Ever Teams / Dolibarr

| App | Screen/page | What it is | Key files |
| --- | --- | --- | --- |
| ERPNext | Timesheet form | Title, company, customer, currency, sales invoice, status (Draft/Submitted/Partially Billed/Billed/Payslip/Completed/Cancelled), project, user, start/end date, employee/department, `time_logs` grid, totals, billing details, note. | `erpnext/projects/doctype/timesheet/timesheet.json` |
| ERPNext | Time log row | Activity type, from/to time, expected hours, hours, completed, project, task, billing hours/rate/amount, costing rate/amount, sales invoice, billable flag, description. | `erpnext/projects/doctype/timesheet_detail/timesheet_detail.json` |
| ERPNext | Timer | In-form timer starts/stops a row and creates new rows; `timer.js` loaded by the Timesheet form. | `erpnext/projects/doctype/timesheet/timesheet.js`, `erpnext/public/js/projects/timer.js` |
| ERPNext | Timesheet calendar/list | Calendar and list views, dashboard connections. | `erpnext/projects/doctype/timesheet/{timesheet_calendar,timesheet_list}.js`, `erpnext/projects/doctype/timesheet/timesheet_dashboard.py` |
| AureusERP | Timesheet resource | Date, employee, project, task, description, time spent (unit amount); list/manage pages. | `plugins/webkul/timesheets/src/Filament/Resources/TimesheetResource/Schemas/TimesheetForm.php`, `Pages/ManageTimesheets.php` |
| Ever Gauzy | Weekly timesheet | Project/task rows × weekday columns, per-cell duration with popover detail, add-time button, filters. | `apps/gauzy/src/app/pages/employees/timesheet/weekly/weekly/weekly.component.html` |
| Ever Gauzy | Daily timesheet | Row-per-log table: project/task, employee, log type, source, duration, time span, notes; bulk selection/delete; edit/add. | `apps/gauzy/src/app/pages/employees/timesheet/daily/daily/daily.component.html` |
| Ever Gauzy | Calendar timesheet | Calendar view of logs. | `apps/gauzy/src/app/pages/employees/timesheet/calendar/` |
| Ever Gauzy | Approvals | Timesheet approval tab beside daily/weekly/calendar, plus a general approval-requests list with approve/reject actions and approval policies. | `apps/gauzy/src/app/pages/employees/timesheet/approvals/`, `apps/gauzy/src/app/pages/approvals/` |
| Ever Gauzy | Timer | Desktop timer and desktop apps feed time logs. | `apps/desktop-timer/`, `apps/desktop/` |
| Dolibarr | Time spent list | Per project/task time entries with date, user, duration, product, billed flag; filters incl. date and duration. | `htdocs/projet/tasks/time.php` |
| Dolibarr | Timesheet input | Per day / per week / per month input grids. | `htdocs/projet/activity/perday.php`, `perweek.php`, `permonth.php`, `htdocs/core/lib/project.lib.php` (`project_timesheet_prepare_head`) |
| Ever Teams | Timesheet views | Weekly and monthly timesheet calendars, compact view and view toggle over tracked time. | `apps/web/core/components/timesheet/` |
| Ever Teams | Daily plan | Plan the day's tasks with planned work hours and task estimates, compare plan to estimates, suggested plan, "enforce planned task" when starting the timer. | `apps/web/core/components/features/daily-plan/` |
| Moqui WorkManagement / WeCreate | none | Only estimated hours on tasks/projects. | — |

**BOSS implications.** The references use one **time-entry** record (user, date, hours/start-end, project, work item, activity, billable flag, rate, invoice link, comment) with several surfaces over it. Mantle `TimeEntry` already carries party, work effort, from/thru, hours, break hours, work type (activity), client and vendor rates from `RateAmount`, and client and vendor invoice-item links, grouped by `Timesheet` (§15). Candidate surfaces: **My week** (grid + timer), **project/task time tab** (list + totals), and **team approval/report** (group by person/project/task/date/activity, export). OpenProject's separate "allocation" vs "actual time entry" distinction is what makes its scheduling work; the two are not conflated in any planning reference. Other candidates: Redmine's configurable required fields (issue/comment) and activities, ERPNext's billable/costing split and timer, Ever Gauzy's weekly grid, and Dolibarr's per-day/week/month input as alternative views. Timesheet entry and approval are reused across apps (research-crosscut §4): Projects includes entry and approval for project work, People includes attendance and the approved, pay-relevant totals. Every reference with approval puts it on the timesheet period (`Timesheet` statuses In-Process → Completed → Approved, which has no reject transition yet), not on each row. Ever Teams' daily plan and weekly-limit report are candidates for the My week view.

---

## 9. Resource scheduling & capacity

### OpenProject — team planner + resource management

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Team planner index/overview | Saved plan views (name/public/starred); global and project overview lists. | `modules/team_planner/app/controllers/team_planner/team_planner_controller.rb`, `modules/team_planner/app/views/team_planner/` |
| Team planner board | Timeline of assignees × days/weeks with assigned work packages; add work packages, split view/create, view selector, assignee lanes. | `frontend/src/app/features/team-planner/team-planner/` (`planner/`, `assignee/`, `add-work-packages/`, `view-select/`) |
| Resource planners | Named planner views scoped to project/global, public/favorite, with a work-package list content and query behind it. | `modules/resource_management/app/controllers/resource_management/resource_planners_controller.rb`, `modules/resource_management/app/views/resource_management/resource_planners/`, `resource_planner_views/` |
| Resource allocations | Polymorphic allocation to a work package; states requested / allocated / rejected / canceled (the code notes the state machine is not used yet: every allocation goes straight to allocated); placeholder user requested vs named principal staffed; date range, allocated time, requested/reviewed/assigned-by. | `modules/resource_management/app/models/resource_allocation.rb` |
| Staffing | Allocation list + assignment dialog: candidate list, overbooking warning with working schedules, assign principal. | `modules/resource_management/app/controllers/resource_management/staffing_controller.rb`, `modules/resource_management/app/components/resource_allocations/` |
| Working hours / non-working times | User working hours and non-working times, used by duration/overbooking calculations; global working days/hours settings. | `app/controllers/users/working_hours_controller.rb`, `app/controllers/users/non_working_times_controller.rb`, `app/models/user_working_hours.rb`, `app/models/user_non_working_time.rb`, `app/views/users/working_hours/`, `app/views/users/non_working_times/` |
| My work allocations | Personal view of upcoming/remaining allocations. | `app/components/my/work/allocation_row.rb`, `remaining_allocations.rb` |

### Other references

| App | Screen/page | What it is | Key files |
| --- | --- | --- | --- |
| Odoo | Assignees/roles | Multiple assignees per task; project roles assigned from templates; resource calendar on project; no capacity planner in this community checkout. | `odoo/addons/project/models/project_task.py` (`user_ids`, `role_ids`), `project_project.py` (`resource_calendar_id`) |
| ERPNext | Project users + holidays | Project User child table (welcome email, attachments, hide timesheets, status); Holiday List on project for working-day calculations; no capacity planner. | `erpnext/projects/doctype/project_user/project_user.json`, `erpnext/projects/doctype/project/project.json` (`holiday_list`) |
| Ever Gauzy | People/teams/time off | Employees, teams, time-off, approvals; resource context for project/task assignment, but no allocation planner. | `apps/gauzy/src/app/pages/{employees,teams,time-off,approvals}/` |
| Dolibarr | Project contacts/roles | Internal/external contacts with project/task roles; agenda/events; no workload view. | `htdocs/projet/contact.php`, `htdocs/projet/tasks/contact.php`, `htdocs/projet/agenda.php` |
| Redmine | Members/roles | Project membership with roles and per-role permissions; no workload planning. | `app/views/projects/settings/_members.html.erb`, `app/models/member.rb`, `app/models/role.rb` |
| WeCreate | Project positions | Role/position records with invited/applied accounts and approval status — role-based staffing rather than named allocations. | `screen/wcinternal/Project/FindProjectPositions.xml` |
| Moqui WorkManagement | Assignee only | Task assignee; no capacity data. | `screen/wm/Task/Task.qvue` |
| Ever Teams | Weekly limit report | Hours tracked per member against a weekly limit (percentage used, remaining), grouped and exportable. | `apps/web/core/components/pages/reports/weekly-limit/` |

**BOSS implications.** Resource scheduling is the weakest area in the ERP references and the strongest in OpenProject, which treats it as a first-class screen. OpenProject models **allocations separately from time entries and from task assignments**: an allocation is a request for N hours over a date range against a project/work item, optionally against a placeholder role, later staffed to a person. Mantle has no such record: `WorkEffortParty` carries party, role, from/thru, status (Offered → Assigned …) and `emplPositionClassId` but no hours and needs a real party, and `WorkEffortSkillStandard` holds only an estimated head count, duration and cost per skill (§16). OpenProject's placeholder-user → named-principal flow, overbooking warning and working-hours basis are the strongest candidates found. Its team planner (people × time) is the manager's main view; a role/capacity view over the reused Employee 360 and working schedules (also included in People) is one way to aggregate across projects. Capacity in OpenProject comes from working hours and allocations, not from assigned tasks alone.

---

## 10. Budgets, costs & T&M billing

### OpenProject — budgets, rates, cost reports (no invoicing)

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Budgets index/show | Project budgets with labor and material budget items; spent/available rollups from time and cost entries. | `modules/budgets/app/views/budgets/{index,show,new,edit}.html.erb`, `modules/budgets/app/models/budget.rb` |
| Labor budget items | Hours × user/rate + comment + computed budget. | `modules/budgets/app/views/budgets/subform/_labor_budget_subform.html.erb`, `modules/budgets/app/models/labor_budget_items/` |
| Material budget items | Units × cost type + comment + computed budget. | `modules/budgets/app/views/budgets/subform/_material_budget_subform.html.erb`, `modules/budgets/app/models/budget.rb` (`material_budget_items`) |
| Budget widgets | Budget totals, budget by cost type, actual costs, on project/portfolio/program overviews. | `modules/budgets/app/components/budgets/widgets/`, `modules/costs/app/components/costs/widgets/actual_costs.html.erb` |
| Cost entries | Non-time costs on work packages: units, cost type, rate, spent_on, comment, budget. | `modules/costs/app/models/cost_entry.rb`, `modules/costs/app/views/costlog/edit.html.erb` |
| Cost types | Admin-defined cost types with rates and project assignments. | `modules/costs/app/controllers/admin/cost_types_controller.rb`, `admin/cost_types/cost_type_projects_controller.rb`, `modules/costs/app/views/admin/cost_types/` |
| Hourly rates | Default rate, user rate, and project-specific rate; rate history/dialogs. | `modules/costs/app/controllers/default_hourly_rates_controller.rb`, `hourly_rates_controller.rb`, `modules/costs/app/components/hourly_rates/` |
| Cost reports | Saved/public cost reports over time and cost entries, grouping/filtering, XLS/PDF export. | `modules/reporting/app/controllers/reporting/cost_reports_controller.rb`, `modules/reporting/app/views/reporting/cost_reports/index.html.erb`, `modules/reporting/app/models/cost_query/` |
| Time & costs settings | Per-project enablement, activity list, cost types/rates. | `modules/costs/app/components/projects/settings/time_and_costs/`, `cost_types/`, `time_entry_activities/` |
| Invoicing | **None.** OpenProject stops at budgets/costs; billing is external. | — |

### Odoo — analytic accounting + timesheet-driven invoicing

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Analytic account | Project carries an analytic account; analytic items are the cost/revenue ledger, shown as an embedded action. | `odoo/addons/project/models/project_project.py` (`account_id`), `odoo/addons/project_account/views/project_project_views.xml` |
| Project profitability | Analytic items + sales orders/order items/invoices embedded actions; actual-margin action. | `odoo/addons/project_account/views/`, `odoo/addons/sale_project/views/project_views.xml`, `odoo/addons/sale_project/views/project_task_views.xml` |
| Service product tracking | Product `service_tracking` can create a task in a global project, a project + task, or a project only; template project and task template selectable. | `odoo/addons/sale_project/models/product_template.py` |
| Sales-order generation | Confirming a service SO line generates/links project and task; allocated hours follow ordered quantity. | `odoo/addons/sale_project/models/sale_order_line.py` |
| Invoicing policies | Ordered/prepaid, delivered timesheets, delivered milestones; delivered quantity computed from timesheets/milestones. | `odoo/addons/sale_timesheet/models/product_template.py`, `sale_order_line.py`, `account_analytic_line.py` |
| Reinvoice / margins | Timesheet reinvoice and sale-timesheet margin modules. | `odoo/addons/sale_timesheet/`, `odoo/addons/sale_timesheet_margin/` |
| Project-linked purchasing/expenses/stock/MRP | Project fields/links on POs, expenses, stock moves, manufacturing orders. | `odoo/addons/project_purchase/`, `project_sale_expense/`, `project_stock/`, `project_mrp*/` |

### ERPNext — project costing/billing + timesheet invoicing

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Project costing/billing tab | Estimated costing, total costing amount, total purchase cost, total sales amount, total billable amount, total billed amount, material cost, gross margin and margin %. | `erpnext/projects/doctype/project/project.json` |
| Timesheet billing | Total hours/billable hours/billed hours, billable/costing amounts, per-billed %, sales invoice link, status. | `erpnext/projects/doctype/timesheet/timesheet.json` |
| Time log rates | Billable flag, billing rate/amount, costing rate/amount per row; activity type carries default costing/billing rates. | `erpnext/projects/doctype/timesheet_detail/timesheet_detail.json`, `activity_type/activity_type.json` |
| Sales invoice | Timesheets link to a Sales Invoice; billing summary report reconciles billable vs billed. | `erpnext/projects/doctype/timesheet/timesheet.json` (`sales_invoice`), `erpnext/projects/report/timesheet_billing_summary/` |
| Project transactions | Dashboard connections for sales order/invoice, purchase order/receipt/invoice, stock entry, work order, material request/BOM. | `erpnext/projects/doctype/project/project_dashboard.py` |

### Dolibarr / Ever Gauzy / Redmine / metasfresh

| App | Screen/page | What it is | Key files |
| --- | --- | --- | --- |
| Dolibarr | Billable time | Project flag `usage_bill_time`; time entries can carry a product and a "billed" flag; project overview aggregates proposals, orders, invoices, contracts, interventions, shipments, MOs and trips. | `htdocs/projet/card.php`, `htdocs/projet/tasks/time.php`, `htdocs/projet/element.php`, `htdocs/core/lib/project.lib.php` |
| Dolibarr | Project statistics | Graph/statistics view over projects (counts, status and opportunity data). | `htdocs/projet/stats/index.php` |
| Ever Gauzy | Invoices/expenses/income/payments | Accounting records exist (invoices, payments, expenses, income, recurring expenses); no project-level T&M billing automation is visible in the project/task pages. | `apps/gauzy/src/app/pages/{invoices,payments,expenses,income,expense-recurring}/` |
| Redmine | Time/cost only | Estimated/spent hours and time reports; no rates, budgets or invoicing. | `app/models/time_entry.rb`, `app/views/timelog/report.html.erb` |
| metasfresh | Budgeted and invoicable effort | `S_Issue` carries estimated, budgeted and rough-estimate effort, rolls effort up the issue tree, and keeps an invoicable child-effort quantity for billing service work *(how it reaches an invoice is unverified)*. | `backend/de.metas.serviceprovider/src/main/java/de/metas/serviceprovider/issue/IssueEntity.java` |
| Moqui WorkManagement / WeCreate | none | Estimated hours only; no rates/billing. | — |

**BOSS implications.** The references split the problem in two: **costing** (rates × time + material/expense costs) sits in the project tool; **billing** (invoice draft, tax, revenue recognition) sits in accounting/sales. OpenProject's budget-vs-actual widgets and ERPNext's `billable` vs `costing` split are the closest data-model matches. The references converge on three billing bases: **time & materials** (billable hours × rate), **milestones** (reached milestone releases a percentage), and **fixed fee/prepaid** (ordered quantity). Rate cards are versioned in the references (OpenProject rate history; ERPNext activity-type rates), and Mantle `RateAmount` already is, with from/thru, client vs vendor purpose and party / work effort / work type / position-class matching. An "unbilled time" queue in Projects is a candidate, handing a batch to invoicing; the invoice screens are reused (also included in Accounting and Sales), so a services business running only Projects could review and send the resulting invoice in its own app (the baseline already has `mantle.account.InvoiceServices.create#ProjectInvoiceItems`, §15). Mantle's `Budget` is a period/GL-account budget with no work-effort link; project-level caps exist only as `WorkEffort.totalTimeAllowed` and `totalClientCostAllowed` (§16).

---

## 11. Request intake & cross-app handoffs

Projects intake in BOSS means: a customer/internal request arrives (Customer Service, email, portal, sales handoff), becomes a `Request` (Mantle) and/or a project/work item, and keeps its communication timeline. The references split this across several mechanisms.

### Intake mechanisms by app

| App | Mechanism | What it creates | Key files |
| --- | --- | --- | --- |
| **OpenProject** | Authenticated work-package create (list/split/full view); project creation wizard for new-project requests; no public request form in this checkout. Access controlled by `add_work_packages`/project permissions. | Work package (type/status/project preset) or project | `app/components/work_packages/full_view/create_component.*`, `app/views/projects/creation_wizard/show.html.erb`, `app/controllers/projects/creation_wizard_controller.rb` |
| **Redmine** | Email intake via mail handler; issue create from any project/global context; issue categories/trackers route the request. Replies thread into the issue journal. | Issue (tracker/status/priority/assignee/category/version) | `app/models/mail_handler.rb`, `app/views/issues/new.html.erb`, `app/views/issues/_form.html.erb` |
| **Odoo** | Project email alias creates tasks; portal users can create/view tasks; service products on sales orders generate projects/tasks; project/task sharing. | Task (project alias), project/task from SO | `odoo/addons/project/models/project_project.py` (`alias_id`), `odoo/addons/sale_project/models/sale_order_line.py`, `odoo/addons/project/views/project_sharing_project_task_views.xml` |
| **ERPNext** | Issue linked to a project; portal web forms for issues and tasks (both `login_required`, so not anonymous); project linked to sales order. | Issue, Task, Project | `erpnext/projects/web_form/tasks/tasks.json`, `erpnext/support/web_form/issues/issues.json`, `erpnext/support/doctype/issue/issue.json`, `erpnext/projects/doctype/project/project.json` (`sales_order`) |
| **Dolibarr** | Project tab "Tickets"; public ticket portal; project links to proposals/orders/invoices/contracts/interventions. | Ticket, linked commercial documents | `htdocs/core/lib/project.lib.php` (`project_prepare_head`), `htdocs/ticket/`, `htdocs/public/ticket/`, `htdocs/projet/element.php` |
| **Frappe Helpdesk / Customer Service** | Ticket templates, portal article suggestions, email/telephony channels; no project field exists in this checkout, so project linkage would be an added `Request` relation/custom field. | HD Ticket | see [research-customer-service.md](research-customer-service.md) §2–§3 |
| **Moqui baseline** | Request form (type, customer, project, assignee, priority, response-required date) and a request **Tasks** tab that creates or links tasks; My Requests in MyAccount. Commons (planned) shows requests assigned. | Mantle `Request` + `RequestWorkEffort`; project via `Request.rootWorkEffortId` | `component/mr-marble/screen/SimpleScreens/Request/{FindRequest,EditRequest,EditTasks}.xml`, `component/mr-marble/screen/MyAccount/User/Request/MyRequests.xml` |
| **Ever Gauzy / Moqui WorkManagement / WeCreate** | Internal task/project creation only; WeCreate adds project positions/applications (people apply to roles). | Task / project / position application | (Ever Gauzy) `apps/gauzy/src/app/pages/tasks/`, (Moqui WorkManagement) `screen/wm/Task/`, (WeCreate) `screen/wcinternal/Project/FindProjectPositions.xml` |

### Sales-to-project handoff

| App | Handoff | Key files |
| --- | --- | --- |
| Odoo | Service product `service_tracking` = task / project+task / project; project template + task template; SO line stores generated project/task; ordered qty syncs allocated hours; invoice policy per product. | `odoo/addons/sale_project/models/product_template.py`, `sale_order_line.py`, `odoo/addons/sale_timesheet/models/*` |
| ERPNext | Project has customer + sales order; project dashboard links sales orders/invoices; project costing/billing tab aggregates them. | `erpnext/projects/doctype/project/project.json`, `project_dashboard.py` |
| Dolibarr | Project overview/elements tab lists proposals, orders, invoices, contracts, interventions, shipments; project can be created from an opportunity (lead/project mode). | `htdocs/projet/element.php`, `htdocs/projet/card.php`, `htdocs/projet/list.php` (`LeadsOrProjects`) |
| OpenProject / Redmine | No sales integration; external reference fields/custom fields only. | — |

**BOSS implications.** The evidence favors **Request → Project/Work item** as an explicit conversion with linked records, not a copy: the Request keeps SLA/channel/communication; the project/work item gets plan dates, assignee, estimate. The request intake form and its template/field-dependency model (see the Customer Service research) are a reused screen: Projects would include the same intake, with a project context, so a services team can take requests without the Customer Service app. Mantle already links both ends (`Request.rootWorkEffortId` for the project, `RequestWorkEffort` for tasks) and the baseline request screen has a Tasks tab that creates linked tasks. Odoo's project **email alias → task** and Redmine's **mail handler → issue** are the asynchronous channels found, and could be normalized through Comms/SystemMessage. For sales, Odoo and ERPNext let a service line on a quote/order create a project from a template and link the order, with the billing basis stored on the line. Neither duplicates customer or price data on the project; both link to the party and the order.

---

## 12. Reporting & analytics

| App | Screen/page | What it is | Key files |
| --- | --- | --- | --- |
| OpenProject | Cost reports | Saved/public reports over time and cost entries, grouping/filtering, XLS/PDF export. | `modules/reporting/app/controllers/reporting/cost_reports_controller.rb`, `modules/reporting/app/models/cost_query/` |
| OpenProject | Work-package summary | Per-category work-package report with details. | `app/views/work_packages/reports/report.html.erb`, `report_details.html.erb` |
| OpenProject | Project/portfolio dashboards | Widget grids: status, timeline, subitems, budgets, actual costs, members, meetings, custom attributes. | `modules/overviews/app/components/overviews/workspaces/` |
| OpenProject | Baseline / Gantt / timeline | Plan-vs-actual visualization and portfolio Gantt. | `frontend/src/app/features/work-packages/components/wp-baseline/`, `modules/gantt/` |
| Redmine | Issue reports | Issue summary by tracker/status/priority/category/assignee and detailed report. | `app/views/reports/issue_report.html.erb`, `issue_report_details.html.erb` |
| Redmine | Spent-time report | Grouped hours by criteria and period, CSV. | `app/views/timelog/report.html.erb` |
| Redmine | Project overview | Live counts by tracker + spent/estimated hours. | `app/views/projects/show.html.erb` |
| Odoo | Task analysis | Pivot/graph of tasks by stage/assignee/project/working hours/rating. | `odoo/addons/project/views/project_task_views.xml` (`view_project_task_pivot`, `view_project_task_graph`) |
| Odoo | Burndown | Project/task burndown chart embedded action. | `odoo/addons/project/views/project_task_views.xml` (`project_embedded_action_project_burndown_chart`), `odoo/addons/project/static/src/views/burndown_chart/` |
| Odoo | Project updates / ratings | Health narrative + customer ratings. | `odoo/addons/project/views/{project_update_views,rating_rating_views}.xml` |
| ERPNext | Projects workspace | Project Summary chart, Open Projects / Non-completed Tasks / Timesheet Working Hours cards, report links. | `erpnext/projects/workspace/projects/projects.json` |
| ERPNext | Reports | Project Summary, Delayed Tasks Summary, Timesheet Billing Summary, Daily Timesheet Summary, Project-wise Stock Tracking. | `erpnext/projects/report/` |
| AureusERP | Dashboard widgets | Stats overview, tasks by state/stage, top assignees, top projects. | `plugins/webkul/projects/src/Filament/Widgets/` |
| Ever Gauzy | Reports | Time reports, weekly time reports, manual time, project/team reports; custom dashboards. | `apps/gauzy/src/app/pages/reports/{time-reports,weekly-time-reports,manual-time}/`, `pages/dashboard/custom-dashboard/` |
| Dolibarr | Project statistics | Graph/statistics over projects. | `htdocs/projet/stats/index.php` |
| Moqui WorkManagement / WeCreate | none | Simple lists/counts only. | — |

**BOSS implications.** The operational reports the references put in the project tool are task counts by status/assignee, overdue, milestone slippage, unbilled time, budget vs actual and utilization; cross-app BI is an Insights topic. OpenProject's saved-report model (saved filters + grouping + export) is an alternative to hard-coded reports, and ERPNext's small fixed set (open projects, non-completed tasks, hours, billing) is a candidate for the landing page. Utilization and margin have several definitions in the references (hours logged vs allocated, billable vs non-billable, cost vs billable amount), so they need an explicit definition in design.

---

## 13. Settings & administration

### OpenProject — global work-package/project configuration + per-project settings

| Area | Screens | Key files |
| --- | --- | --- |
| Work-package administration | Types, form configuration, workflows (status-transition matrix), statuses, custom fields, priorities, progress tracking, identifier format, calendars/working days, automations, attribute help texts, AI settings. | `config/initializers/menus.rb`, `app/controllers/admin/settings/`, `app/controllers/workflows/`, `app/views/workflows/`, `app/views/statuses/`, `app/views/work_package_types/` |
| Project administration | Project lists settings, new-project settings/creation wizard, project custom fields and sections, project phase definitions, reserved identifiers. | `app/controllers/admin/settings/`, `app/components/settings/project_*`, `app/components/projects/settings/creation_wizard/` |
| Per-project settings | General, life cycle, modules, project custom fields, versions, work-package types/categories/internal comments, template, repository, storage, subitems, work-package import. | `app/components/projects/settings/`, `app/controllers/projects/settings/` |
| Users/groups/roles | Users, placeholder users, groups, departments, members, roles, permission report, avatars. | `config/initializers/menus.rb`, `app/views/users/`, `app/views/roles/`, `app/views/groups/` |
| Cost administration | Cost types/rates, time-entry activities, time settings, cost settings, custom fields for time entries. | `modules/costs/app/controllers/admin/`, `modules/costs/app/views/admin/` |
| Backlog/board/Gantt settings | Estimation units, active sprints, shared backlogs, board configuration, Gantt queries. | `modules/backlogs/app/controllers/projects/settings/`, `modules/boards/`, `modules/gantt/` |

### Redmine — admin + project settings

| Area | Screens | Key files |
| --- | --- | --- |
| Global admin | Trackers, issue statuses, workflows matrix, priorities, custom fields, enumerations (time-entry activities, document categories), roles/permissions, settings, mail handler, repositories, LDAP/auth. | `app/views/{trackers,issue_statuses,workflows,enumerations,custom_fields,roles,settings,auth_sources}/`, `app/controllers/admin_controller.rb` |
| Workflow matrix | Role × tracker × status transition matrix with field permissions. | `app/views/workflows/`, `app/controllers/workflows_controller.rb` |
| Project settings | Members/roles, versions, issue categories, modules, repository, activities, boards. | `app/views/projects/settings/`, `app/controllers/projects_controller.rb` |
| Custom fields | Issue/time-entry/project/version/user/group custom fields with format, visibility and role filters. | `app/views/custom_fields/`, `app/models/custom_field.rb` |

### Odoo / ERPNext / AureusERP / Dolibarr / Ever Gauzy

| App | Area | Screens | Key files |
| --- | --- | --- | --- |
| Odoo | Project configuration | Settings, project/template list, project roles, project stages, task stages, tags, activity types, activity plans. | `odoo/addons/project/views/project_menus.xml`, `odoo/addons/project/views/project_project_stage_views.xml`, `odoo/addons/project/views/project_task_type_views.xml`, `odoo/addons/project/views/mail_activity_type_views.xml`, `odoo/addons/project/views/mail_activity_plan_views.xml` |
| ERPNext | Project settings | Project Settings, Project Type, Task Type, Activity Type (costing/billing rates), Project Template. | `erpnext/projects/doctype/{projects_settings,project_type,task_type,activity_type,project_template}/` |
| AureusERP | Project configuration cluster | Activity plans, tags, task stages, milestones, project stages; settings pages for tasks/time. | `plugins/webkul/projects/src/Filament/Clusters/Configurations/`, `plugins/webkul/projects/src/Filament/Clusters/Settings/Pages/ManageTasks.php`, `plugins/webkul/projects/src/Filament/Clusters/Settings/Pages/ManageTime.php` |
| Dolibarr | Project admin | Project module setup, extra fields for project/task, permissions, opportunities toggle, timesheet visibility, billable-time switch, project numbering. | `htdocs/projet/admin/`, `htdocs/core/lib/project.lib.php` (`project_admin_prepare_head`), `htdocs/admin/` |
| Ever Gauzy | Project/task settings | Project/task statuses, priorities, sizes, tags, project modules, organization settings. | `apps/gauzy/src/app/pages/{settings,tags,projects,tasks}/` |
| Moqui WorkManagement / WeCreate | minimal | Status/enumeration data comes from Mantle `StatusItem`/`StatusFlow`; no dedicated admin UI. | (Moqui WorkManagement) `screen/wm/`, (WeCreate) `screen/wcinternal/` |

**BOSS implications.** In OpenProject and Redmine, global configuration holds **work-item types, status flows, priorities, custom fields, project phases, rate cards, cost types and time-entry activities**, and per-project settings only choose/enable them and set project-specific rates/templates/visibility. That separation of global type/form/workflow configuration from per-project enablement is the clearest pattern found. Mantle status flows are a candidate for the workflow matrix without a new engine. Odoo exposes both a task stage and a status; one option is one board-column concept per board with the rest derived, so users are not asked which one the board uses.

---

## 14. Cross-app surfaces

Reused screens as listed in research-crosscut §3–§4. Projects includes each in the form a services-staff audience needs, so a business running only Projects has work items, time, requests, capacity and billing in one app; the other apps include the same screens with their own context.

| Reused screen or link | Use in Projects | Other apps that include it | Reference evidence |
| --- | --- | --- | --- |
| **Task / work item** | The fullest version: work-item list, board, calendar, Gantt and detail over `WorkEffort` (`WetTask`) | Commons ("tasks assigned"; Commons says "task"), Customer Service and Sales (follow-up tasks), People (onboarding checklists) | OpenProject work packages; Odoo `project_todo` (personal to-dos over `project.task`); Gameplan My Tasks; Frappe CRM record-linked tasks; Moqui baseline `component/mr-marble/screen/MyAccount/User/Task/MyTasks.xml` and `component/mr-marble/screen/SimpleScreens/Task/` over one `WorkEffort` record |
| **Time entry & timesheets** | My week, project and task time tabs, timesheet-period approval | People (attendance, clock in/out, pay-relevant totals), Accounting (billing) | Mantle `TimeEntry`, `Timesheet`; ERPNext Timesheet; Odoo `hr_timesheet`; Ever Gauzy timesheet approvals; baseline Clock In (`create#TimeEntryClockIn`) |
| **Employee 360** | Allocations and timesheets tabs; working schedules and leave as the capacity source | People (employment, pay, leave), Admin (user account), Commons (directory card) | OpenProject My work allocations and user working hours / non-working times; Ever Gauzy employee timesheets; Moqui baseline `component/mr-marble/screen/SimpleScreens/Party/{PartyProjects,PartyTasks,PartyTimeEntries}.xml` |
| **Request / case** | Project request intake (the same form, with a project context), project requests list on Project 360, conversion to a project (`Request.rootWorkEffortId`) or work items (`RequestWorkEffort`) | Customer Service (case intake, queues, SLA), Purchasing, Maintenance, Sales, Warehouse, Commons | Redmine mail handler; Odoo project alias; ERPNext `Issue.project`; Dolibarr project Tickets tab; Moqui baseline `component/mr-marble/screen/SimpleScreens/Request/EditTasks.xml` and `component/mr-marble/screen/SimpleScreens/Task/EditRequests.xml` |
| **Calendar & schedules** | Work items and milestones by date; plan views (team planner) over the same events and holidays | Commons (calendars, booking), Maintenance (scheduling policies), People (leave and shift views) | OpenProject WP calendar and team planner; Redmine calendar; baseline `TaskServices.get#FullCalendarData` used by My Calendar and Party Calendar |
| **Billing handoff / invoices** | Unbilled time, reached milestones and budget vs billed; a batch creates invoice items, and the reused invoice screen lets the project team review and send the invoice | Accounting (posting, payments), Sales (order-based billing) | Odoo `sale_timesheet` invoicing policies; ERPNext timesheet billing; Mantle `create#ProjectInvoiceItems` / `create#TimeEntryInvoiceItems` |
| **Order detail** (sales handoff) | A quote or order line creates a project from a template and links back; Project 360 shows the order | Sales, Purchasing, Customer Service, Warehouse, Accounting, Commerce | Odoo `service_tracking`; ERPNext `Project.sales_order`; Mantle `OrderItemWorkEffort`, `AgreementItemWorkEffort`, `SalesOpportunityWorkEffort` |
| **Expense claims** | Project-linked expenses captured against the project and re-billed from it | People (capture, approval), Accounting (posting, payment) | Odoo `project_sale_expense`; baseline MyAccount expense with Project field and `create#ProjectExpenseInvoice` |
| **Chatter & activities** | Work-item and project Activity tabs | Every app's record screens | OpenProject Activity tab; Odoo chatter on tasks; Mantle `WorkEffortCommEvent`; baseline TaskSummary comments |
| **Approvals waiting** | Timesheets awaiting approval, as a filtered list and in the header Notifications panel | Header (all apps); People, Purchasing, Sales, Accounting approval lists | Ever Gauzy timesheet approvals; Odoo timesheet reminders to approvers |
| **Dashboard widgets** | Widgets on Projects home | Insights (cross-project BI), every app's landing page | ERPNext Projects workspace number cards; OpenProject overview widget grid |
| **Knowledge base** | Wiki pages linked to projects and work items | Commons (wiki authoring), Customer Service (articles) | Redmine and OpenProject wiki modules; Moqui baseline `component/mr-marble/screen/SimpleScreens/Project/EditWikiPages.xml` (`WikiPageWorkEffort`) |
| **Purchasing / Warehouse / Manufacturing / Maintenance links** | Project-linked purchases, stock issues and repair costs as inputs to project costing | Purchasing, Warehouse, Manufacturing, Maintenance | Odoo `project_purchase`, `project_stock`, `project_mrp*`; ERPNext project dashboard connections; Mantle `AcctgTrans.workEffortId`, `InvoiceItemDetail.workEffortId` |

**BOSS implications.** Projects includes one reused screen in its fullest form (work items) and several others (Employee 360, Request / case, Calendar & schedules, Order detail, invoices) in a project context; its distinct screens are mostly planning, time and money views over records that several apps create and share.

---

## 15. Current Moqui baseline (mr-marble / MarbleERP / Mantle)

The baseline is a working project tracker, not a stub: projects, milestones, tasks with assignments and typed relations, requests linked to tasks, time entry with client and vendor rates, and T&M invoicing from a project. What it lacks is planning (boards, Gantt, capacity), timesheet periods and approval, budgets per project, and any landing page. MarbleERP (`component/mr-marble/screen/marble.xml`) mounts the SimpleScreens `Project`, `Request`, `Task` and `Wiki` trees; its dashboard (`component/mr-marble/screen/marble/dashboard.xml`) only links Projects and Tasks and shows Submitted / In Progress request counts. IronStone BOSS already carries copies of the MyAccount user screens (`component/mr-boss/screen/Base/User/{Task,Request,TimeEntries,Calendar}.xml`).

### Screens

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Find Project | Saved-find list (ID, name, client, vendor, status, purpose, priority, estimated completion, estimated/actual hours) with header filters; **New Project** dialog | `component/mr-marble/screen/SimpleScreens/Project/FindProject.xml` (`create#Project`) |
| Project Summary | Project header (client, vendor, status, status flow, dates, estimated/actual hours), task counts by status as links (In Planning, Approved, In Progress, On Hold, Complete/Closed, Cancelled), milestone list, parties, wiki pages, task tree | `component/mr-marble/screen/SimpleScreens/Project/ProjectSummary.xml` (`get#ProjectStats`) |
| Edit Project | Name, status, status flow, purpose, visibility, priority, client and vendor, dates, **time allowed** and **client cost allowed** (the only budget fields); computed actual cost / client cost / profit, client budget remaining and used %, estimated complete %; **Clone Project** dialog | `component/mr-marble/screen/SimpleScreens/Project/EditProject.xml` (`update#Project`, `clone#Project`) |
| Milestones | Milestone list with **Create Milestone** dialog; Milestone Summary shows the milestone's inactive, active and done task lists | `component/mr-marble/screen/SimpleScreens/Project/{EditMilestones,MilestoneSummary}.xml` |
| Progress report | Per-milestone and per-child stats in hours and days: estimated, actual, remaining, time allowed, work and budget actual/remaining % | `component/mr-marble/screen/SimpleScreens/Project/ProjectProgressReport.xml` (`get#ProjectMilestoneSummary`, `get#WorkEffortChildStats`) |
| Project parties | Add/update party assignments: role, position class, expectation, status, from/thru | `component/mr-marble/screen/SimpleScreens/Project/EditUsers.xml` |
| Project time entries | Time entries across the project's tasks with client and vendor rates and invoice links; Hide/Show Invoiced; **Update Rates**; create project invoice items | `component/mr-marble/screen/SimpleScreens/Project/ProjectTimeEntries.xml` (`store#TimeEntry`, `resetAndGet#ProjectTimeEntryRates`, `create#ProjectInvoiceItems`) |
| Find Task | Full-text search (DataDocument) plus saved-find list with column selection, CSV/XLSX: project, milestone, parent, assignee, team, status, priority, purpose, resolution, estimated completion, estimated/remaining/actual hours; bulk **Assign / Unassign / Update Selected**; **New Task** dialog | `component/mr-marble/screen/SimpleScreens/Task/FindTask.xml` |
| Task Summary | Header with inline status, resolution and field updates; nested comments; child tasks; content attachments; **Clock In**; links to project, milestone and requests | `component/mr-marble/screen/SimpleScreens/Task/TaskSummary.xml`, `TaskSummary/TaskCommentNested.xml` |
| Task tabs | Edit Task; Assignments (person or team); Related (`WorkEffortAssoc` from/to); Requests (`RequestWorkEffort`); Time (add time, clock in, delete); Wiki pages | `component/mr-marble/screen/SimpleScreens/Task/{EditTask,EditUsers,EditRelated,EditRequests,EditTimeEntries,EditWikiPages}.xml` |
| Requests | Find/Edit Request (type, customer, project, facility, store, assignee, priority, response-required date, resolution; comments, parties, notes, content, items) and a **Tasks** tab that creates or links tasks | `component/mr-marble/screen/SimpleScreens/Request/{FindRequest,EditRequest,EditRequestItems,EditTasks}.xml` |
| MyAccount | My Tasks (list + New Task), Task Detail (notes, assignments, clone), Time (own entries, clock in, record time), My Requests, My Calendar (events and tasks); expense invoices with a Project field | `component/mr-marble/screen/MyAccount/User/{Task/MyTasks,Task/TaskDetail,TimeEntries,Request/MyRequests,Calendar/MyCalendar}.xml`, `component/mr-marble/screen/MyAccount/Expense/{FindExpenseInvoice,EditExpenseInvoice}.xml` |
| Party tabs | A party's projects, tasks, requests, calendar, and time entries with rates and a **Worker Invoice** action | `component/mr-marble/screen/SimpleScreens/Party/{PartyProjects,PartyTasks,PartyRequests,PartyCalendar,PartyTimeEntries}.xml` |
| Rates | Rate amounts by type, purpose, party, work effort, work type, position class, from/thru | `component/mr-marble/screen/SimpleScreens/HumanRes/EditRateAmounts.xml` |
| Project invoices | **Project Client Invoice** and **Project Worker Invoice** dialogs on Find Invoice | `component/mr-marble/screen/SimpleScreens/Accounting/Invoice/FindInvoice.xml` |
| Team timesheet (print only) | Print template for a team timesheet; no screen calls it | `component/mr-marble/template/work/TeamTimesheet.xsl-fo.ftl` (data from `get#TeamTimesheetInfo`) |

### Data model available (mr-mantle)

| Entity / enum | What it gives Projects | Key files |
| --- | --- | --- |
| `WorkEffort` | One record for project, milestone, release, component and task: types `WetProject`, `WetMilestone`, `WetRelease`, `WetComponent`, `WetTask` (also `WetEvent`, `WetTimeOff`); `parentWorkEffortId` + `rootWorkEffortId` (tree and project), `statusId` + per-record `statusFlowId`, priority, `percentComplete`, visibility, purpose, resolution, estimated/actual start and completion, recurrence (`recurStartCron`, `recurLimit`, `recurEndDate`), estimated / remaining / actual work time, **`totalTimeAllowed`**, `actualCost`, `actualClientCost`, **`totalClientCostAllowed`** | `component/mr-mantle/entity/WorkEffortEntities.xml` |
| Purposes, statuses, resolutions | Task purposes Task, Bug Fix, New Feature, Feature Enhancement, Feature Test, To Do, Document, Communication, Placeholder (`WepTask` …); project purposes `WepPr*`; statuses In Planning, Approved, In Progress, On Hold, Complete, Closed, Cancelled (`We*`, flows `Default` and `WorkEffortOther`); resolutions Completed, Incomplete, Won't Complete, Duplicate, Cannot Reproduce, Insufficient Information | same |
| `WorkEffortParty` | Members, assignees, managers, reporters, watchers, client manager/billing, vendor (role groups `RgpProject`, `RgpTask`, `RgpProjectClient`, `RgpProjectVendor`); from/thru; status Offered → Assigned → Arrived → Departed, Declined, Unassigned; availability, expectation, position class, `receiveNotifications`. No hours field | same |
| `WorkEffortAssoc` | Typed relations: Relates To, Depends On (Blocked By), Duplicates, Based On, Clones, Caused By, Independent Of; membership types Milestone, Release, Component (`WeatMilestone`, `WeatRelease`, `WeatComponent`); from/thru, sequence. No lag | same |
| `WorkEffortSkillStandard`, `WorkEffortEmplPosition`, `WorkEffortProduct` | Estimated head count / duration / cost per skill; link to an employee position; products with estimated quantity and cost (a material estimate) | same |
| `TimeEntry`, `Timesheet`, `TimesheetParty` | Time: party, team, vendor, client, work effort, facility, from/thru, hours, break hours, piece count, work type, position class, rate type (including `RatpNoCharge`), client and vendor hourly/piece rates and `RateAmount` refs, client and vendor invoice items; timesheet per party/client and period with status In-Process → Completed → Approved | same |
| `RateAmount` | Versioned rate card: rate type, purpose (`RaprClient` billing, `RaprVendor` pay), currency, from/thru, matched by work effort, party, work type, pay grade, position class | `component/mr-mantle/entity/HumanResourcesEntities.xml` |
| `WorkEffortBilling`, `WorkEffortInvoice`, `InvoiceItemDetail.workEffortId`, `AcctgTrans.workEffortId` | Which invoice items billed a work effort (with a percentage), invoices per project, project dimension on invoice details and GL transactions | `component/mr-mantle/entity/{WorkEffortEntities,AccountingAccountEntities,AccountingLedgerEntities}.xml` |
| `OrderItemWorkEffort`, `AgreementItemWorkEffort`, `SalesOpportunityWorkEffort` | Order line ↔ project/task (with `requiredWork` and `forStatusId` fulfillment rules), agreement item ↔ work effort, opportunity ↔ work effort | `component/mr-mantle/entity/{OrderEntities,PartyEntities,SalesEntities}.xml` |
| `Request`, `RequestWorkEffort` | `Request.rootWorkEffortId` links a request to a project; `RequestWorkEffort` to tasks; types include `RqtBugFix`, `RqtNewFeature`, `RqtSupport`; statuses Draft, Submitted, Reviewed, In Progress, Completed, Cancelled | `component/mr-mantle/entity/RequestEntities.xml` |
| `WorkEffortCommEvent`, `WorkEffortNote`, `WorkEffortContent`, `WikiPageWorkEffort` | Chatter messages, notes, files and wiki links on any work effort | `component/mr-mantle/entity/WorkEffortEntities.xml` |
| `Budget`, `BudgetItem`, `BudgetItemDetail`, `BudgetRevision`, `BudgetReview`, `BudgetParty`, `BudgetScenario` (`mantle.other.budget`) | Period budgets (types Capital, Operating) with items by GL account, product and sub-period; **no work-effort link** | `component/mr-mantle/entity/AccountingOtherEntities.xml` |
| Holidays | Holiday `WorkEffort` rows (purpose `WepHoliday`) skipped by `get#NextBusinessDay` / `get#FutureBusinessDay` | `component/mr-mantle/entity/WorkEffortEntities.xml` |

Missing for Projects: a resource allocation record, project phases and gates, project health / status updates, a template marker, precedes/follows with lag, a milestone billing share, project budget lines, a working-schedule record (People), and a sprint/backlog field.

### Services (mr-mantle)

| Service | Purpose | Key files |
| --- | --- | --- |
| `create#Project`, `update#Project`, `clone#Project` (deep clone), `get#ProjectStats`, `get#ProjectMilestoneSummary`, `get#WorkEffortChildStats`, `get#ProjectParties`, `get#ProjectTeams`, `get#ProjectTasks`, `get#ProjectMilestones`, `create#Milestone`, `update#Milestone` | Projects with client/vendor/manager roles, project-as-template copy, budget and progress stats, milestones | `component/mr-mantle/service/mantle/work/ProjectServices.xml` |
| `create#Task`, `create#SimpleTask`, `update#Task`, `set#TaskMilestone`, `set#TaskDefaults`, `add#TaskComment` / `update#TaskComment` / `delete#TaskComment`, `add#TaskTime`, `update#TaskFromTime`, `update#ProjectTimeFromTask`, `get#FullCalendarData` | Tasks, milestone membership, comments, time rollups, calendar feed | `component/mr-mantle/service/mantle/work/TaskServices.xml` |
| `store#TimeEntry`, `create#TimeEntryClockIn`, `delete#TimeEntry`, `store#TimeEntryWorkEffort`, `store#WorkEffortPartyTime`, `get#TeamTimesheetInfo`, `get#TimeEntryAmount`, `resetAndGet#TimeEntryRates`, `resetAndGet#ProjectTimeEntryRates`, `get#TimeEntryRate`, `find#RateAmount`, `import#TimeSummaryFile`, `import#TimeDetailFile` | Time entry, clock-in timer, rate lookup and reset, team timesheet data, time-clock imports | `component/mr-mantle/service/mantle/work/TimeServices.xml` |
| `clone#WorkEffort`, `delete#WorkEffort`, `add#WorkEffortParty` / `remove#WorkEffortParty` / `replace#WorkEffortParty`, `get#WorkEffortStartEnd`, `create#WorkEffortContent` | Generic work-effort copy, assignment, dates and files | `component/mr-mantle/service/mantle/work/WorkEffortServices.xml` |
| `create#ProjectInvoiceItems`, `create#TimeEntryInvoiceItems`, `create#ProjectExpenseInvoice`, `create#WorkerInvoiceItems` | T&M invoicing of a project's time and expenses (per entry, per worker or one line; client or vendor side) | `component/mr-mantle/service/mantle/account/InvoiceServices.xml` |
| `create#Request`, `update#Request`, `replace#RequestParty`, `add#RequestComment` | Requests (intake; the reused Request / case screen) | `component/mr-mantle/service/mantle/request/RequestServices.xml` |
| `create#Budget`, `store#BudgetItem`, `run#BudgetExpenseReport` | Period/GL budgets (Accounting) | `component/mr-mantle/service/mantle/other/{BudgetServices,BudgetReportServices}.xml` |
| `post#WorkEffortCost` | Declared but empty (`TODO: implement this`) | `component/mr-mantle/service/mantle/ledger/OtherAutoPostServices.xml` |
| `get#NextBusinessDay`, `get#FutureBusinessDay` | Business-day arithmetic skipping weekends and holiday work efforts | `component/mr-mantle/service/mantle/work/EventServices.xml` |

---

## 16. Gaps & BOSS implications

### Gaps in the reference set

- **OpenProject and Redmine are the only project-management-first references.** Odoo, ERPNext, Dolibarr and Ever Gauzy are ERP/HR suites with project modules added; they are stronger on commercial handoff and weaker on planning. OpenProject is the main reference for planning and work-item UX, Redmine for compactness and email intake, and Odoo/ERPNext for sales, costing and billing links.
- **No dedicated milestone record** in OpenProject (a work-package type flagged `is_milestone`, or versions/phases) or ERPNext (`Task.is_milestone`). Odoo and AureusERP have milestone records; only Odoo connects them to billing (`sale_line_id` + `quantity_percentage`).
- **Odoo community has no timer and no capacity planner.** `planning` and `timesheet_grid` are not in this checkout. Timers exist in OpenProject, ERPNext, Ever Gauzy's desktop apps and Ever Teams; capacity planning only in OpenProject (team planner, resource management).
- **OpenProject has no invoicing.** It stops at budgets, rates and cost reports. Odoo (`sale_timesheet`), ERPNext (timesheets → sales invoice) and Dolibarr (billable time) are the billing references.
- **OpenProject's allocation workflow is not live yet.** The requested → allocated / rejected / canceled states exist, but the code sends every allocation straight to allocated; the placeholder → named-person staffing flow is the working part.
- **Redmine "boards" are forums**, not kanban; its Gantt and calendar are query views.
- **Lightweight task tools are not project tools.** Nextcloud Tasks/Deck and Twenty tasks are Commons/record-widget references (catalogued in the Commons research); Gameplan puts tasks beside discussions and pages with a five-state status and no planning; Frappe CRM tasks are record follow-ups.
- **No project module** in Akaunting or Zimbra; Carbon's project is only an accounting dimension; metasfresh has project, issue, milestone and time-booking records (imported from GitHub/Everhour) but no project screens.
- **Moqui WorkManagement is a minimal Moqui project/task app** (QVue table, find drawer, saved finds, comments, simple project edit) with no Gantt, timesheets, budgets or resource planning; **WeCreate** contributes role-based staffing (project positions with invitations, applications and approval) and a profile-like project page.
- **Ever Gauzy is the strongest timesheet UX** (weekly day-grid, daily log table, calendar, approvals, timer apps) and the weakest on planning; Ever Teams adds a daily plan and a weekly-limit report.
- **Request intake is fragmented everywhere.** Project tools assume authenticated users; ERP tools have email aliases, logged-in web forms (ERPNext's issue and task web forms both require login) or tickets.
- **Customer-facing project portals are thin**: Odoo has portal project/task templates and project sharing; the others are internal.

### Notable gaps in the Moqui baseline

- **No planning views.** Tasks are lists only; there is no board, Gantt/timeline or dependency view, and the only task calendar is the personal/party calendar feed.
- **No landing page.** MarbleERP's dashboard links to Projects and Tasks; there is no portfolio, workload, overdue or unbilled summary.
- **No timesheet periods.** `Timesheet` has entity and statuses but no screen; `get#TeamTimesheetInfo` feeds only a print template; there is no week grid, submit or approve step, and no reject transition.
- **No allocation or capacity.** Nothing records "N hours of person or role X on project Y in weeks A–B"; `WorkEffortParty` has no hours and needs a named party.
- **Budgets are caps, not plans.** Projects have `totalTimeAllowed` and `totalClientCostAllowed`; Mantle `Budget` is a GL/period budget with no project link; `post#WorkEffortCost` is an empty stub, so project cost is computed, not posted.
- **T&M only.** `create#ProjectInvoiceItems` bills time and expenses; there is no milestone-share or fixed-fee billing basis.
- **Missing project concepts:** phases and gates, health status and periodic status updates, a template flag (any project can be cloned), precedes/follows with lag, project types with enabled modules, sprints/backlog.
- **Strong parts of the baseline:** one `WorkEffort` tree for project/milestone/task, typed `WorkEffortAssoc`, `WorkEffortParty` roles, the clock-in timer, versioned `RateAmount` client and vendor rates, `Request` ↔ project/task links, and project invoicing from time entries.

### What each reference contributes

| Reference | Take |
| --- | --- |
| OpenProject | Saved queries, configurable columns, split view, typed relations, board-as-column-action, team planner, allocation vs time-entry split, placeholder staffing, budget-vs-actual widgets, phases/gates, portfolio/program parent rules. Cautions: one giant project form; a separate board implementation per column type |
| Redmine | Compact issue columns/filters, watchers, configurable required time-entry fields, mail handler intake, roadmap, spent-time report by up to three criteria. Cautions: board-as-forum for work; hard-coded reports |
| Odoo | Project email alias, milestones with billing percentage, personal task stages and to-do, recurrence, service product → project/task generation, invoicing policies (ordered, timesheets, milestones), project updates. Cautions: customer/price data duplicated on the project; community edition has no timer or capacity |
| ERPNext | Costing vs billable split, timesheet status and billing fields, activity-type and per-employee activity costs, small fixed workspace card set, project template tasks, % complete methods |
| AureusERP | Simple milestone records, task table with allocated/spent/remaining hours, project dashboard widgets |
| Dolibarr | Per-day/week/month time input, project-elements overview, usage flags (tasks, bill time, opportunity, events). Cautions: one tab per document type |
| Ever Gauzy | Weekly/daily timesheet grids, timesheet approvals, desktop timer apps |
| Ever Teams | Daily plan against estimates, weekly-limit report |
| Gameplan / Frappe CRM | The light end of the reused work-item screen, as Commons and Sales would include it: grouped-by-status list, record-linked follow-ups with list/kanban |
| metasfresh | Budgeted vs estimated effort and invoicable effort rolled up an issue tree (reference only) |
| Moqui WorkManagement / WeCreate | A QVue task table with find drawer and saved finds; role/position staffing with applications |
| Moqui baseline | The data model and services for projects, milestones, tasks, time, rates, requests and T&M invoicing (§15) |

### Candidate screen inventory (IronStone Projects)

Candidate screens for project managers and services staff, from the findings above. Screens other apps would also include are marked **(reused: …)**.

| Area | Screens |
| --- | --- |
| Home | **Projects home**: portfolio health, workload, overdue work items, milestones due, unbilled time, budget exceptions; a fixed layout or a widget grid **(reused: Insights widget types)** |
| Projects | **Find Projects** (saved views, hierarchy, favorites; over `WorkEffort` `WetProject`, `get#ProjectStats`) · **Project 360** hub: header (health, dates, manager, client) and tabs Overview, Work items, Milestones, Time, Costs, Files, Activity **(reused: Chatter, all apps)**, Related: order **(reused: Order detail; Sales, Purchasing, Customer Service, Warehouse, Accounting, Commerce)**, requests **(reused: Request / case; Customer Service, Purchasing, Maintenance, Sales, Warehouse, Commons)**, invoices **(reused: Accounting, Sales)** · **Create project** short form + from template (`clone#Project`) · **Portfolio / program** roll-up |
| Work items | **Work items** list / board / calendar / timeline over one query **(reused: Commons "tasks assigned", Customer Service and Sales follow-ups, People checklists)** · **Work item detail**: status and resolution, assignees and watchers (`WorkEffortParty`), relations (`WorkEffortAssoc`), subtasks, recurrence, time, files, Activity |
| Milestones & phases | **Milestones / roadmap** over `WetMilestone` (and `WetRelease` when used): due date, reached, task progress, billing share · **Phases** with gates |
| Time | **My week**: week grid plus clock-in timer over `TimeEntry`; also a source for the header Today panel's time widget **(reused: People)** · **Project / work item time tab** with rates and invoiced flags · **Team timesheets & approval** by `Timesheet` period **(reused: People pay-relevant totals, Approvals waiting)** |
| Resources | **Team planner**: people × weeks of assigned work and estimates, capacity from working schedules and leave **(reused: People)** · **Allocations / staffing**: requested vs staffed, placeholder roles, overbooking warning (needs a new record) · allocations and timesheets tabs on **Employee 360 (reused: People, Admin, Commons)** |
| Money | **Budget & cost**: budget vs actual hours and cost, labor and material, rates · **Billing queue**: unbilled time, reached milestones, fixed fees → invoice items via `create#ProjectInvoiceItems` · **Project invoices**: review and send the resulting invoices **(reused: Accounting, Sales)** · **Project expenses** linked to the project **(reused: People, Accounting)** |
| Intake | **Project request intake**: the request form with a project context, and requests linked to the project with **Convert to work item** **(reused: Request / case; Customer Service, Purchasing, Maintenance, Sales, Warehouse, Commons)** |
| Reports | **Project reports**: work items by status/assignee, overdue, milestone slippage, utilization, unbilled time, budget vs actual; saved reports **(reused: Insights for cross-app BI)** |
| Settings | **Project settings** (general, members and roles, enabled tabs, rates, template) · **Global configuration**: work-item purposes and status flows, priorities, time-entry work types, rate cards (`RateAmount`), project templates |

### Data-model findings

Mantle records that fit (names verified in `mr-moqui-base/runtime/components/addon/mr-mantle/entity/`):

- **Projects, milestones, releases and work items** fit `WorkEffort` with `WetProject`, `WetMilestone`, `WetRelease`, `WetTask`; hierarchy by `parentWorkEffortId` / `rootWorkEffortId`; milestone and release membership by `WorkEffortAssoc` `WeatMilestone` / `WeatRelease`. The earlier sketch's "milestones are their own entity" does not match Mantle: a milestone is a `WetMilestone` work effort, its deadline is `estimatedCompletionDate`, reached is `WeComplete` plus `actualCompletionDate`.
- **Status and board columns**: `statusId` with a per-project `statusFlowId`; board columns could be a view action over status, assignee, milestone or parent, with no second stage field.
- **Members, assignees, watchers**: `WorkEffortParty` with the `RgpProject` / `RgpTask` role groups (not `WorkEffortPartyAssignment`).
- **Relations**: `WorkEffortAssoc` types `WeatRelatesTo`, `WeatDependsOn`, `WeatDuplicates`, `WeatBasedOn`, `WeatClone`, `WeatCausedBy`, `WeatIndependentOf`.
- **Time and rates**: `TimeEntry`, `Timesheet`, `TimesheetParty`, `RateAmount`; non-billable time is rate type `RatpNoCharge`, so no separate billable flag appears necessary.
- **Billing links**: `TimeEntry.invoiceId` / `vendorInvoiceId`, `WorkEffortBilling`, `WorkEffortInvoice`, `OrderItemWorkEffort` for the order line behind a project or milestone; services `create#ProjectInvoiceItems`, `create#TimeEntryInvoiceItems`.
- **Requests**: `Request.rootWorkEffortId` and `RequestWorkEffort`; **Chatter and files**: `WorkEffortCommEvent`, `WorkEffortNote`, `WorkEffortContent`, `WikiPageWorkEffort`.
- **Budget caps**: `WorkEffort.totalTimeAllowed`, `totalClientCostAllowed`, `actualCost`, `actualClientCost` via `get#ProjectStats`.

What Mantle lacks, with options:

- **Milestone billing share.** Odoo's milestone billing needs, on the order-line link, the share of the line released when the milestone is reached. One option is a quantity-percentage (or amount) field on `OrderItemWorkEffort`; `WorkEffortBilling.percentage` already records what was billed afterwards.
- **Resource allocation.** A new record (e.g. `WorkEffortAllocation`) would hold work effort, optional party, `emplPositionClassId` for a placeholder role, from/thru, allocated hours, status (Requested, Allocated, Rejected, Cancelled), requested/reviewed by. `WorkEffortParty` cannot carry it as it stands (no hours, party is part of the key) and `WorkEffortSkillStandard` has no dates or person.
- **Precedes/follows with lag**: a new `WorkEffortAssoc` type and a lag field (days) would cover Gantt scheduling.
- **Project phases and gates**: phase definitions plus per-project phase rows with dates and gate dates; either a new `WorkEffort` type under the project or a small phase record (Open questions).
- **Project health and updates**: a project-update record (date, author, health, progress %, narrative) whose latest row gives the six-state health, kept apart from `statusId`.
- **Template marker** for projects meant only to be cloned: an indicator or a `WorkEffortCategory`.
- **Project budget lines**, if caps are not enough: a link from `Budget` to `WorkEffort` with labor/material items, or work-effort budget lines; `WorkEffortProduct` estimates already cover material quantities.
- **Working schedule** (researched in research-people §7) is the capacity source; the same record would serve People and Projects.
- **Sprint / backlog** field on work items, relevant only for agile teams.

### Sequencing notes

- **Cheap on the baseline.** Find Projects, Project 360 (Overview, Work items, Milestones, Time, Costs from `get#ProjectStats`, Activity, Related), create-from-template via `clone#Project`, the work-item list and detail, milestones on `WetMilestone`, project and work-item time tabs, the clock-in timer, the unbilled-time queue over `create#ProjectInvoiceItems`, request links and Convert (the baseline request Tasks tab) all have records and services already (§15).
- **Small additions.** Timesheet submit/approve needs a reject transition on `Timesheet`; a template marker is an indicator or category; a board needs only a view over status or assignee; a basic team planner can read existing assignments and estimates.
- **Depends on new records.** Gantt with dependencies and baseline depends on precedes/follows with lag; allocations and staffing on the allocation record; phases and gates on a phase record; project health on a project-update record; milestone billing share and fixed-fee billing on the order-line share field; project budget lines and cost posting on a `Budget` link and on `post#WorkEffortCost`, which is an empty stub.
- **Depends on other apps' records.** Team-planner capacity depends on the working-schedule record (People research); reused request intake depends on the Customer Service request form and templates; per-project email aliases depend on Comms mail routing; a customer portal depends on the cross-app portal question (research-crosscut §8).
- **Optional by audience.** Portfolio/program roll-ups, sprints and backlogs, and versions/roadmap matter only for some audiences; the data model can carry them before any screen does.

### Open questions

- **Allocation record.** New `WorkEffortAllocation`-style entity, or extend `WorkEffortParty` with hours and accept a placeholder party for unnamed roles?
- **Phases.** A `WorkEffort` type under the project (dates, status and Chatter come free) or a separate phase record with gate fields?
- **Milestone billing share.** On `OrderItemWorkEffort` (the order-line link) or on the milestone `WorkEffort`?
- **Timesheet approval.** research-crosscut §4 lists entry and approval under Projects; research-people §7 describes approval of pay-relevant hours in People. One approval on the `Timesheet` period, included in both apps with different filters, or two approval steps?
- **Project email alias.** Always create a `Request` through the reused intake, or allow a project alias to create work items directly for internal teams?
- **Project budgets.** initial-design puts Budgets in Accounting; crosscut §4 lists project costing under Projects. Project budget lines in `mantle.other.budget` with a work-effort link, or project caps plus estimates?
- **Rate cards.** The baseline edits `RateAmount` under HumanRes; client billing rates matter to Projects and pay rates to People. One reused rate screen with purpose tabs, or a screen per purpose, and which apps edit vs view?

### Checkout path quirks

- OpenProject's version form is a Primer form class (`app/forms/versions/form.rb`), and the version page is a widget grid of components in `app/components/projects/settings/versions/`; there are no `_form` or `_issue_counts` partials.
- Redmine's project menu is defined in `lib/redmine/preparation.rb`, not in a views folder; project settings tabs come from `project_settings_tabs` in `app/helpers/projects_helper.rb`.
- ERPNext rows that cite Gantt or kanban views use Frappe framework paths (`frappe/public/js/frappe/views/…`).
- Ever Gauzy's desktop apps are `apps/desktop/` and `apps/desktop-timer/`; there is no desktop-activity app.
- Zimbra web-client paths start `zm-web-client/`; `zd-full/ZimbraWebClient/` holds a duplicate copy.
- In the Moqui baseline the MyAccount screens are `component/mr-marble/screen/MyAccount/…`, beside (not under) `screen/SimpleScreens/`.

**Bottom line.** The evidence points to IronStone Projects as a **project-management-first app with ERP handoffs**, on a Mantle model that already covers most of the records: OpenProject supplies the interaction model (work items, saved queries, boards, Gantt, team planner, allocations, budgets, phases), Redmine the compact query and email-intake discipline, and Odoo/ERPNext/Dolibarr the sales-order, milestone-billing and timesheet-invoicing links. The two surfaces where services staff and managers spend their day are **My week / timesheets** and **resource planning**, and they are also where the ERP references and the Moqui baseline are weakest.
