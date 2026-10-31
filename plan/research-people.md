# IronStone BOSS — People app research

Oct 18, 2026
Reviewed against sources Oct 18, 2026; follows [research-crosscut.md](research-crosscut.md).

**Oct 31, 2026 — payroll assessment superseded by [design-people.md](design-people.md#8-payroll-and-compensation).**
The payroll entities, services and data available here are an incomplete historical version. The later commercial
version used for approximately 10,000 agricultural workers and smaller numbers of varied staff is unavailable;
its production capabilities cannot be attributed to this checkout. The conclusions below that payroll is a working
US engine needing mainly UI and updated tax data, that its model fits as-is, and that payroll/year-end are cheap
baseline work are superseded. The design adopts a native, country-neutral component/structure/assignment/run/payslip
model informed by Frappe HR, retains suitable Mantle employment/rate/accounting foundations, and explicitly reviews
legacy artifacts for retention, extension or replacement. Historical tax fixtures and year-end services are not
current statutory support. The original research findings remain below as evidence, not implementation approval.

Deeper research pass on every screen/page relevant to **IronStone People** (HR, managers): employees and org structure, positions and recruiting, time and leave, payroll, skills and training, and reviews — the six main sections of the People row in [initial-design.md](initial-design.md). Companion to [3p-app-reference.md](3p-app-reference.md). It also covers the reused screens People would include (crosscut §3–§4): the **Employee 360** (also in Admin, Projects and Commons), the contact / party record with its employee fields, the leave and shift views of the calendar, onboarding checklists on the task screen, time entry and timesheets with the attendance and pay emphasis, People's version of the approvals list, and expense claims with the capture and approval emphasis (Accounting's version emphasizes posting and payment). Where another research file covers a reused screen in depth it is cross-referenced rather than repeated.

**Organization.** Sorted by functional area, not by app: all employee-directory screens together, all leave screens together, etc. Within each area, sub-tables per reference app. Each section ends with **BOSS implications**; §16–§18 hold the cross-app surfaces, the Moqui baseline and the gaps and findings.

**Scope.** Business UI an HR officer, manager or employee touches: lists, forms, kanban/calendar/tree views, self-service pages, kiosk flows, approval lists and report pages. Payroll tax rules, accrual math and legal compliance are noted only where they shape a screen. Timesheet entry, payroll posting and user accounts are reused screens researched in depth in the Projects, Accounting and Admin files; they are covered here only for what People's version emphasizes.

**Path conventions.** Every backticked path resolves against the checkout for its prefix (crosscut §1); all checkouts are under `/home/jonesde/work/moquiwork/`. Inside a table row a path may be shortened to a tail only when the same cell or row already names the full directory.

| Prefix | Checkout | Paths start with |
| --- | --- | --- |
| **Frappe HR** (hrms) | `3p_other/frappe/hrms` | `hrms/<area>/…` — doctypes for HR, recruitment, leave, attendance, performance and expenses under `hrms/hr/doctype/`, payroll under `hrms/payroll/doctype/`; per-area workspaces `hrms/<area>/workspace/`, sidebars `hrms/workspace_sidebar/`; employee PWA `frontend/src/…`; roster app `roster/src/…` |
| **ERPNext** | `3p_other/frappe/erpnext` | `erpnext/<module>/…` (Employee, Department, Designation, Branch, Company, Holiday List under `erpnext/setup/doctype/`) |
| **Frappe LMS** | `3p_other/frappe/lms` | `frontend/src/…`, backend `lms/lms/…` |
| **Odoo** | `3p_other/odoo` | `odoo/addons/<addon>/…` (`hr`, `hr_holidays`, `hr_attendance`, `hr_recruitment`, `hr_skills*`, `hr_expense`, `hr_work_entry`, `hr_presence`, `hr_gamification`, `hr_timesheet`, `website_hr_recruitment`, `resource`); views in `<addon>/views/`, OWL UI in `<addon>/static/src/` |
| **AureusERP** | `3p_other/aureuserp` | `plugins/webkul/<plugin>/src/Filament/…` (plugins `employees`, `time-off`, `recruitments`, `timesheets`) |
| **Ever Gauzy** | `3p_other/ever-co/ever-gauzy` | `apps/gauzy/src/app/pages/…`, `packages/…` (shared UI `packages/ui-core/`, backend `packages/core/src/lib/`) |
| **Dolibarr** | `3p_other/dolibarr` | `htdocs/<module>/…` (`hrm`, `holiday`, `recruitment`, `salaries`, `expensereport`, `user`; public job pages `htdocs/public/recruitment/`) |
| **Carbon** | `3p_other/carbon` | `apps/erp/app/{modules,routes}/…` (modules `people`, `resources`; routes `apps/erp/app/routes/x+/{people+,person+,resources+,training+,users+}/`) |
| **OpenProject** | `3p_other/openproject` | `app/…` (user working hours, non-working times, departments admin) |
| **Redmine** | `3p_other/redmine` | `app/…` (non-working dates) |
| **Nextcloud** | `3p_other/nextcloud` | `server/apps/profile/…`, `contacts/src/…` (directory pattern only; catalogued in [research-drawers-commons.md](research-drawers-commons.md) §10) |
| **WeCreate** | `3p_moqui/WeCreate` | `screen/wcinternal/…` |
| **resistmanagement** | `3p_moqui/resistmanagement` | `screen/resistadmin/…` |
| **Moqui baseline** | `mr-moqui-base/runtime` | `component/mr-marble/screen/{SimpleScreens,MyAccount}/…`, `component/mr-marble/template/…`, `component/mr-marble/screen/…`, `component/mr-mantle/{entity,data}/…`, `component/mr-mantle/service/mantle/…`; see also [usl-inventory.md](usl-inventory.md) and [ss-inventory.md](ss-inventory.md) |

**Not used here.** Checked and found no HR screens: Twenty ("People" is CRM contacts), Zimbra (accounts only), Akaunting, Frappe CRM / Helpdesk / Insights (beyond the hrms Insights workbooks in §14), Moqui Sales, Moqui WorkManagement, coarchy (actors and process checklists, not HR), ridgecrest, ServiceJobMonitor; metasfresh has only a legacy ADempiere/Libero payroll backend (`backend/de.metas.adempiere.libero.liberoHR/`, Java models, no web UI). OpenProject contributes only working times and departments (§3, §7); Frappe LMS only training (§11).

Sections: [1 landing/self-service](#1-landing-dashboards--employee-self-service) · [2 directory & employee 360](#2-employee-directory--employee-360) · [3 org structure](#3-org-structure-departments-org-chart-teams-reporting-lines-companies) · [4 positions & grades](#4-positions-job-titles-grades--headcount-planning) · [5 recruiting](#5-recruiting--applicant-tracking) · [6 lifecycle](#6-onboarding-offboarding--lifecycle-events) · [7 attendance & schedules](#7-attendance-shifts-working-schedules--time) · [8 leave](#8-leave--time-off) · [9 payroll](#9-payroll--compensation) · [10 expenses](#10-expenses--advances) · [11 skills & training](#11-skills-training--certifications) · [12 reviews & goals](#12-performance-goals--reviews) · [13 approvals](#13-approvals--workflow) · [14 reports](#14-reports--analytics) · [15 settings](#15-settings--administration) · [16 cross-app surfaces](#16-cross-app-surfaces) · [17 Moqui baseline](#17-current-moqui-baseline-mrsimplescreens--marbleerp--mantle) · [18 gaps & implications](#18-gaps--boss-implications)

---

## 1. Landing, dashboards & employee self-service

People has three distinct audiences and needs three landing surfaces: an **HR home** (headcount, joiners/leavers, who is out, open requisitions, pending approvals), a **manager home** (my team: who is in/out today, requests waiting for me, reviews due) and an **employee "Me" portal** (check in, request leave, claim an expense, see payslips). Frappe HR is the only reference that ships all three; the others collapse HR home into a list or a set of per-module dashboards.

### Frappe HR (hrms) — per-module workspaces, HR dashboards, employee PWA

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Module workspaces | HR is split into nine desk workspaces, each a chart + three number cards + sidebar: HR Setup (department-wise headcount; total / joining / relieving), Tenure (hiring vs attrition; new hires, exits, promotions), Leaves (applications by type; on leave today / this month; holidays this month), Shift & Attendance (attendance count; present / absent / late), Recruitment (applicant pipeline; openings, applicants, offers), Performance (appraisal overview; cycles, appraisals, goals in progress), Expenses, Tax & Benefits, Payroll (outgoing salary). | `hrms/hr_setup/workspace/hr_setup/hr_setup.json`, `hrms/tenure/workspace/tenure/tenure.json`, `hrms/leaves/workspace/leaves/leaves.json`, `hrms/shift_and_attendance/workspace/shift_&_attendance/shift_&_attendance.json`, `hrms/recruitment/workspace/recruitment/recruitment.json`, `hrms/performance/workspace/performance/performance.json`, `hrms/expenses/workspace/expenses/expenses.json`, `hrms/tax_and_benefits/workspace/tax_&_benefits/tax_&_benefits.json`, `hrms/payroll/workspace/payroll/payroll.json` |
| Workspace sidebars | Each workspace has a Home / Dashboard / transactions / Reports / Setup / Settings sidebar — the clearest per-area HR menu in the checkout. | `hrms/workspace_sidebar/*.json` |
| HR dashboards | Chart dashboards: Human Resource, Employee Lifecycle, Attendance, Recruitment, Expense Claims. | `hrms/hr/hr_dashboard/{human_resource,employee_lifecycle,attendance,recruitment,expense_claims}/` |
| Number cards | ~30 reusable KPI cards (total employees, on leave today, late entry this month, time to fill, offer acceptance rate, applicant-to-hire %, early exits, trainings this month, transfers this month, …). | `hrms/hr/number_card/*/` |
| Employee PWA home | Mobile-first self-service: check-in panel, quick links (request attendance, request a shift, request leave, claim an expense, request an advance, view salary slips), and a request panel with **My Requests / Team Requests** tabs so a manager approves from the same home. | `frontend/src/views/Home.vue`, `frontend/src/components/CheckInPanel.vue`, `frontend/src/components/QuickLinks.vue`, `frontend/src/components/RequestPanel.vue`, `frontend/src/components/RequestList.vue` |
| PWA module dashboards | Attendance, Leaves, Expense claims and Salary slips each get a dashboard tab (balances, recent requests, summaries). | `frontend/src/router/index.js` (`/dashboard/{attendance,leaves,expense-claims,salary-slips}`), `frontend/src/views/{attendance,leave,expense_claim,salary_slip}/Dashboard.vue` |
| Approve from list | Swipe/action sheet with workflow actions on team requests. | `frontend/src/components/RequestActionSheet.vue`, `frontend/src/components/WorkflowActionSheet.vue` |
| Profile / notifications / settings | Employee profile (personal + company info), PWA notifications, app settings, change password, bottom tab bar. | `frontend/src/views/{Profile,Notifications,AppSettings,ChangePassword}.vue`, `frontend/src/components/{ProfileInfoModal,BottomTabs}.vue` |

### Odoo — Employees kanban as home, department kanban, time-off dashboard, attendance systray

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Employees app menu | Management (employee list) · Directory (public employees) · Departments · Reporting · Configuration (Employee: onboarding/offboarding plans, contract types, work locations, departure reasons, tags; Time Management: working schedules; Recruitment: job positions, contract templates). The employee kanban is the landing page. | `odoo/addons/hr/views/hr_views.xml` |
| Department kanban | One card per department with manager, headcount and per-module counters injected by other addons: absences and time-off/allocation requests to approve, expense reports to approve, new applicants, attendance, timesheets, skills. Effectively the **manager home**. | `odoo/addons/hr/views/hr_department_views.xml` (`hr_department_view_kanban`), `odoo/addons/hr_holidays/views/hr_views.xml`, `odoo/addons/hr_expense/views/hr_department_views.xml`, `odoo/addons/hr_recruitment/views/hr_department_views.xml`, `odoo/addons/hr_attendance/views/hr_department_view.xml`, `odoo/addons/hr_timesheet/views/hr_department_views.xml`, `odoo/addons/hr_skills/views/hr_department_views.xml` |
| Time Off dashboard | "My Time" landing: one card per leave type with remaining/used balance, plus a year calendar of my requests and public/mandatory days. | `odoo/addons/hr_holidays/static/src/dashboard/time_off_dashboard.{js,xml}`, `time_off_card.{js,xml}`, `odoo/addons/hr_holidays/static/src/views/calendar/` |
| Attendance systray | Check-in/out button in the top bar (with hours today), usable from any app. | `odoo/addons/hr_attendance/static/src/components/attendance_menu/attendance_menu.{js,xml}` |
| My profile | User preferences form re-skinned as the employee's own profile (work info, private info editable by self). | `odoo/addons/hr/static/src/views/preferences_form_view.js`, `odoo/addons/hr/views/res_users.xml` |
| Presence | Presence status (online/away/absent/out-of-office) badges on employee cards and a cog-menu action to email/SMS absent employees. | `odoo/addons/hr/static/src/components/hr_presence_status/`, `odoo/addons/hr_presence/views/hr_employee_views.xml`, `odoo/addons/hr_presence/static/src/presence_cog_menu/` |

### AureusERP / Ever Gauzy / Dolibarr / Carbon / Moqui baseline — landing patterns

| App | Screen/page | What it is | Key files |
| --- | --- | --- | --- |
| AureusERP | Time-off dashboard | Filament page with my-time-off widget, leave-type balance widget and a full-calendar of requests. | `plugins/webkul/time-off/src/Filament/Pages/Dashboard.php`, `plugins/webkul/time-off/src/Filament/Widgets/{MyTimeOffWidget,LeaveTypeWidget,CalendarWidget}.php` |
| AureusERP | Recruitments page | Applicant chart + job-position stats widgets. | `plugins/webkul/recruitments/src/Filament/Pages/Recruitments.php`, `plugins/webkul/recruitments/src/Filament/Widgets/{ApplicantChartWidget,JobPositionStatsWidget}.php` |
| Ever Gauzy | HR dashboard | Organization dashboard switcher with an HR tab: per-employee income/expense/bonus/profit statistics and chart-type switch (bar, doughnut, stacked). Money-centric, not people-centric. | `apps/gauzy/src/app/pages/dashboard/human-resources/`, `apps/gauzy/src/app/pages/dashboard/employee-charts/`, `apps/gauzy/src/app/pages/dashboard/dashboard.routes.ts` |
| Ever Gauzy | Team dashboard | Team cards and member rows with current activity/timer status and today's tracked time. | `apps/gauzy/src/app/pages/dashboard/team/` (`team-card`, `team-member`, `all-team`) |
| Dolibarr | HRM area | HRM area: search boxes, my leave balance, latest modified leave requests, latest expense reports, latest candidatures, plus configurable dashboard boxes; separate users/groups home. | `htdocs/hrm/index.php`, `htdocs/user/home.php` |
| Carbon | People module | No dashboard: `/x/people` redirects straight to the employee table; a sidebar groups Manage (Employees, Timecards) and Configure (Attributes, Departments, Holidays, Shifts). | `apps/erp/app/routes/x+/people+/_index.tsx`, `apps/erp/app/modules/people/ui/usePeopleSubmodules.tsx` |
| Moqui baseline | HR dashboard | Two links only: Employees (FindParty with `roleTypeId=Employee`) and Labor Rates (§17). | `component/mr-marble/screen/SimpleScreens/HumanRes/dashboard.xml`, `component/mr-marble/screen/SimpleScreens/HumanRes.xml` |

**BOSS implications.** The references point to three landings rather than one: (1) **People home** for HR = Frappe's number-card set condensed to one page (headcount, joiners/leavers this quarter, on leave today, open requisitions, pending approvals, reviews due) with links into each section; (2) **My team** for managers = Odoo's department-kanban counters made person-centric (who is out today, my approvals, my reports' reviews, timesheets missing); (3) **Me** = Frappe's PWA home (check-in, quick request links, my requests / team requests tabs, balances, payslips) rendered responsive so it works on a phone without a separate app. The "Me" surface could also feed the suite header Today panel (out-of-office colleagues, my pending requests), and the counts on People home and My team fit the reused dashboard widgets (number cards, also used by Insights and every app's landing page, crosscut §3). Gauzy's money-centric HR dashboard is a poor fit as an HR default; the Moqui baseline's two-link dashboard shows how little exists to reuse.

---

## 2. Employee directory & employee 360

The employee record is the hub of People. Every reference uses the same two-level shape: a searchable **directory** (kanban/cards for browsing, list for HR work) and an **employee 360** form whose tabs separate public work info from private/HR-only data, with smart-buttons or a connections panel linking to leave, attendance, payroll, expenses, reviews and documents. The important design difference is how **employment history** is stored: Odoo 19 moved contracts into effective-dated `hr.version` rows; ERPNext keeps internal-history child tables; the rest overwrite in place.

### Odoo — kanban/list/hierarchy directory, employee form, versions

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Employee kanban | Photo cards with job title, work email/phone, presence badge, tags, manager; grouped/filterable by department, company, job; sample data when empty. | `odoo/addons/hr/views/hr_employee_views.xml` (`hr_kanban_view_employees`), `odoo/addons/hr/static/src/views/hr_kanban_view.js` |
| Employee list | Multi-edit list (name, work phone/email, activities, company, department, job, manager); an editable-bottom variant for bulk entry; activity view. | `odoo/addons/hr/views/hr_employee_views.xml` (`view_employee_tree`, `hr_employee_list_view`, `hr_employee_list_activites_view`, `hr_employee_view_activity`), `odoo/addons/hr/static/src/views/hr_list_view.js` |
| Search panel | Filters on activities, contract state (permanent, fixed-term, notice period, out of contract, contract start/end), archived; group-by manager, department, job position, tags, employee type, work location, contract start, departure date, properties; department side panel. | `odoo/addons/hr/views/hr_employee_views.xml` (`view_employee_filter`) |
| Employee form | Header with photo, name, job title, work contacts, tags, custom **employee properties**; smart buttons (versions, related contacts, plus per-addon buttons for time off, attendance, timesheets, expenses, skills, fleet, applicants…). Tabs: **Resume**, **Work** (department, job, manager, coach, work location, working schedule; addons inject per-module approvers such as time-off and attendance managers), **Personal** (private contact, family, emergency contact, education, visa/work permit), **Payroll** (contract type, dates, wage, version), **End of Collaboration** (departure reason/date, only when departed), **Settings** (related user, attendance PIN, badge barcode with print-badge). | `odoo/addons/hr/views/hr_employee_views.xml` (`view_employee_form`, pages `resume`, `work_information`, `personal_information`, `payroll_information`, `departure`, `hr_settings`; `view_employee_form_smartbutton_inherited`), `odoo/addons/hr/static/src/views/form_view.js` |
| Employee record versions | Effective-dated snapshots (`date_version`) of job, department, contract dates, contract type, wage and working schedule; list/graph/pivot views and a versions timeline widget on the form. This replaced `hr_contract` in this version. | `odoo/addons/hr/models/hr_version.py`, `odoo/addons/hr/views/hr_version_views.xml`, `odoo/addons/hr/static/src/components/versions_timeline/` |
| Public employee | Read-only "employee public" model and views for non-HR users (directory without private data). | `odoo/addons/hr/models/hr_employee_public.py`, `odoo/addons/hr/views/hr_employee_public_views.xml` |
| Analysis | New-employees-over-time graph and pivot. | `odoo/addons/hr/views/hr_employee_views.xml` (`hr_employee_view_graph`, `hr_employee_view_pivot`) |
| Tags & employee types | Employee categories (tags) and a configurable `hr.employee.type` record (employee, contractor, etc.). | `odoo/addons/hr/views/hr_employee_category_views.xml`, `odoo/addons/hr/models/hr_employee_type.py`, `odoo/addons/hr/views/hr_employee_type_views.xml` |

### Frappe HR / ERPNext — Employee doctype + connections

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Employee form | Tabs: Overview (company, department, designation, grade, branch, reports-to), Joining (offer/confirmation/contract-end dates, notice), Address & Contacts (+ emergency contact), Attendance & Leaves (holiday list, approvers, default shift), Salary (CTC, payroll cost center, bank details), Personal (passport, marital status, health), Profile (education, previous work experience, history in company), Exit (relieving date, reason, exit interview, feedback), Connections. | `erpnext/setup/doctype/employee/employee.json`, `employee.js`, `employee.py` |
| Employee list / tree | List view with status indicators and a tree view by reports-to. | `erpnext/setup/doctype/employee/employee_list.js`, `employee_tree.js` |
| Connections dashboard | Linked-document panel grouped as Attendance, Leave, Lifecycle (onboarding/transfer/promotion/grievance), Exit, Shift, Expense, Benefit, Payroll, Training, Evaluation, Contract. | `hrms/overrides/dashboard_overrides.py` (`get_dashboard_for_employee`) |
| Employment history tables | Education, external work history and internal work history (department/designation/branch over time) as child tables. | `erpnext/setup/doctype/{employee_education,employee_external_work_history,employee_internal_work_history}/` |
| Property history | Field-level change log written by promotions/transfers (`employee_property_history`). | `hrms/hr/doctype/employee_property_history/`, `hrms/hr/employee_property_update.js` |
| Employee groups | Ad-hoc groups of employees (for notifications, shift assignment, etc.). | `erpnext/setup/doctype/{employee_group,employee_group_table}/` |

### AureusERP / Ever Gauzy / Dolibarr / Carbon / Moqui baseline — directory and profile

| App | Screen/page | What it is | Key files |
| --- | --- | --- | --- |
| AureusERP | Employee resource | Odoo-shaped Filament resource: list, create, edit, view; tabs Work information, Private information (address, emergency contact, education, bank, citizenship, work permit), Settings, Resume; relation managers for resume lines and skills. | `plugins/webkul/employees/src/Filament/Resources/EmployeeResource/Pages/{ListEmployees,CreateEmployee,EditEmployee,ViewEmployee,ManageResume,ManageSkill}.php`, `plugins/webkul/employees/src/Filament/Resources/EmployeeResource/{Schemas/EmployeeForm,Schemas/EmployeeInfolist,Tables/EmployeesTable,RelationManagers/ResumeRelationManager,RelationManagers/SkillsRelationManager}.php` |
| Ever Gauzy | Employees list | Table/card layout switch, kind filter (all / human / **agent**), invite and manage-invites, include-deleted toggle, end work / back to work, time-tracking enable/disable per employee. | `apps/gauzy/src/app/pages/employees/employees.component.html`, `employees.component.ts`, `apps/gauzy/src/app/pages/employees/manage-employee-invite/` |
| Ever Gauzy | Edit employee | Routed tabs: account, networks, rates, projects, contacts, location, hiring, employment, settings, documents. | `apps/gauzy/src/app/pages/employees/employees-routing.module.ts`, `apps/gauzy/src/app/pages/employees/edit-employee/edit-employee-profile/` (`edit-employee-{main,networks,rate,projects,contact,location,hiring,employment,settings,documents}`) |
| Ever Gauzy | View employee | Public-style profile page with hours chart. | `apps/gauzy/src/app/pages/employees/view-employee/` |
| Dolibarr | User = employee | Users double as employees: user card holds employee flag, hierarchy (`fk_user` supervisor), employment start/end dates, date of birth, salary / hourly (`thm`) and daily (`tjm`) rates visible only to permitted users. Tabs: user, rights, display setup, notifications, bank/HR info, API token, note, documents, info; HRM adds a skills tab. | `htdocs/user/card.php`, `htdocs/user/list.php`, `htdocs/user/bank.php`, `htdocs/user/document.php`, `htdocs/user/note.php`, `htdocs/core/lib/usergroups.lib.php` (`user_prepare_head`), `htdocs/hrm/skill_tab.php` |
| Carbon | People table + person | Table (user, name, email, employee type, location, shift, status, active) with saved views; person page with sidebar Profile, Job (title, start date, location, shift, department, manager), Abilities, Notes, Timecards and custom attribute categories; a person preview card and a training-assignments panel (days-off and overtime panels are empty stubs). | `apps/erp/app/modules/people/ui/People/PeopleTable.tsx`, `apps/erp/app/routes/x+/person+/$personId.{tsx,details.tsx,job.tsx,abilities.tsx,notes.tsx,timecard.tsx,attributes.$categoryId.tsx}`, `apps/erp/app/modules/people/ui/Person/{PersonJob,PersonDaysOff,PersonOvertime,PersonTrainings,PersonPreview}.tsx`, `apps/erp/app/modules/people/ui/Person/PersonSidebar/usePersonSidebar.tsx` |
| Carbon | Employee accounts | Separate Users area for employee accounts, employee types (permission templates), MFA reset. | `apps/erp/app/routes/x+/users+/{employees.tsx,employees.$employeeId.tsx,employees.new.tsx,employee-types.tsx}` |
| Moqui baseline | Find/Edit party | Employees are parties with the Employee role: FindParty has a CreateEmployeeForm (`create#PersonEmployee`, which creates the `PrtEmployee` relationship but no `Employment` row); EditParty shows roles, classifications, identifications, settings, user account. No employment/position/salary UI (§17). | `component/mr-marble/screen/SimpleScreens/Party/FindParty.xml` (`CreateEmployeeForm`), `component/mr-marble/screen/SimpleScreens/Party/EditParty.xml` |
| Nextcloud | Profile / contacts | Org-directory pattern only: public profile sections and the system address book; see [research-drawers-commons.md](research-drawers-commons.md) §10. | `server/apps/profile/src/views/ProfileApp.vue`, `contacts/src/` |

**BOSS implications.** The evidence favors one directory dataset with **cards** (photo, title, department, presence/out-today) and **list** (HR columns, multi-edit) plus a hierarchy toggle (§3); a public directory view for everyone and the full record for HR (Odoo's employee-public split — in BOSS, one option is field-level authz on the same screen). A candidate **Employee 360** (reused: Admin, Projects, Commons) header carries photo, title, department, manager, status, tags; tabs: Overview (work info + reporting line), Employment (history timeline), Personal (private contacts, emergency, identifications — HR only), Pay (salary/rate history, payroll settings — payroll only), Time & leave (balances, recent requests), Skills & resume, Reviews, Documents, Activity; smart-buttons for counts. In Mantle this is `Person` + `PartyRole(Employee)` + `PartyRelationship(PrtEmployee)` + `Employment` (position, termination reason/type, payroll period, work-location tax address) + `Employee` (per-person tax name, federal/state filing status, allowances, prior YTD income, pay distribution group) + `EmploymentSalary`/`EmploymentPayHistory` + `PartyIdentification` + `PartyContactMech` + `PartyContent` + `PartyNote`; the employment timeline is just the effective-dated rows Mantle already has, which is the Odoo-19 `hr.version` idea for free. Gauzy's "agent" employee kind is worth noting for later: an AI agent could hold a position without being a person.

---

## 3. Org structure (departments, org chart, teams, reporting lines, companies)

Org structure is three overlapping trees that the references keep separate: **legal entities/branches** (who employs and pays), **departments** (who owns cost and approvals) and **reporting lines** (who manages whom, person-to-person). Cross-functional **teams** are a fourth, flat grouping. The org chart is drawn from reporting lines, not departments, in every reference except Carbon and OpenProject (which draw departments).

### Odoo — department hierarchy, employee hierarchy view, org-chart widget, work locations

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Departments | List, kanban (manager home, §1), form (name, parent, manager, company, color) and a **draggable hierarchy view** of the department tree. | `odoo/addons/hr/views/hr_department_views.xml` (form, list, search, `hr_department_view_kanban`, hierarchy view), `odoo/addons/hr/models/hr_department.py` |
| Department chart | Breadcrumb-style parent/child department navigator on the department form. | `odoo/addons/hr/static/src/components/department_chart/department_chart.{js,xml}` |
| Employee hierarchy view | Org chart as a view type over employees (`parent_id`/`child_ids`), avatar cards, drag a person onto a new manager to re-parent. | `odoo/addons/hr/views/hr_employee_views.xml` (`hr_employee_hierarchy_view`), `odoo/addons/hr/static/src/views/hr_employee_hierarchy/` |
| Org-chart side panel | Field widget on the employee form showing managers above and direct reports below, with team counts. | `odoo/addons/hr/static/src/fields/hr_org_chart.{js,xml,scss}` |
| Work locations | Home / office / other locations with address; employees default to one, and the presence system shows where people work today. | `odoo/addons/hr/views/hr_work_location_views.xml`, `odoo/addons/hr/models/hr_work_location.py`, `odoo/addons/hr/models/hr_employee_location.py` |
| Companies | Multi-company: employee, department and job are company-scoped; company switcher in the shell. | `odoo/addons/hr/models/res_company.py` |

### Frappe HR / ERPNext — company, branch, department tree, designation, org chart

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Setup sidebar | HR Setup workspace: Employee, Organizational Chart, Company, Branch, Department, Designation, Employee Group, Employee Grade. | `hrms/workspace_sidebar/hr_setup.json` |
| Company / branch | Company is the legal employer (tree, with default payroll accounts); branch is a flat location label on employees. | `erpnext/setup/doctype/company/`, `erpnext/setup/doctype/branch/` |
| Department tree | Nested-set department tree per company (`parent_department`, `is_group`); HR adds leave / expense / shift-request approver tables as custom fields. | `erpnext/setup/doctype/department/`, `hrms/hr/doctype/department_approver/`, `hrms/setup.py` |
| Designation | Flat job-title list; designation skills attach expected skills. | `erpnext/setup/doctype/designation/`, `hrms/hr/doctype/designation_skill/` |
| Organizational chart | Desk page drawing the reports-to tree per company with expand/collapse, separate desktop and mobile renderers. | `hrms/hr/page/organizational_chart/organizational_chart.{js,py}`, `hrms/public/js/hierarchy_chart/hierarchy_chart_desktop.js`, `hierarchy_chart_mobile.js` |

### AureusERP / Ever Gauzy / Dolibarr / Carbon / OpenProject — org structure

| App | Screen/page | What it is | Key files |
| --- | --- | --- | --- |
| AureusERP | Departments | List, create, edit, view (with a computed hierarchy-path tree), manage-employees sub-page. | `plugins/webkul/employees/src/Filament/Resources/DepartmentResource/Pages/{ListDepartments,CreateDepartment,EditDepartment,ViewDepartment,ManageEmployee}.php`, `plugins/webkul/employees/src/Filament/Resources/DepartmentResource/Schemas/DepartmentInfolist.php` (`buildHierarchyTree`) |
| AureusERP | Work locations | Configuration resource for work locations. | `plugins/webkul/employees/src/Filament/Clusters/Configurations/Resources/WorkLocationResource/` |
| Ever Gauzy | Organizations | Multi-tenant organization list + edit (main, location, settings, other settings); the active organization scopes every page. | `apps/gauzy/src/app/pages/organizations/`, `apps/gauzy/src/app/pages/organizations/edit-organization/edit-organization-settings/` |
| Ever Gauzy | Departments | Flat department CRUD with member assignment. | `apps/gauzy/src/app/pages/departments/departments.component.html`, `apps/gauzy/src/app/pages/departments/departments-mutation/` |
| Ever Gauzy | Teams | Teams with members/managers and a team view page; drives team dashboards and timesheet scoping. | `apps/gauzy/src/app/pages/teams/teams.component.html`, `apps/gauzy/src/app/pages/teams/teams-mutation/`, `apps/gauzy/src/app/pages/teams/view-team/` |
| Dolibarr | Hierarchy | Tree of users by supervisor (`fk_user`), with filters. | `htdocs/user/hierarchy.php`, `htdocs/core/lib/treeview.lib.php` |
| Dolibarr | Groups / establishments | User groups (permissions) and establishments (HR sites with address) as the only org units. | `htdocs/user/group/{list,card,perms}.php`, `htdocs/hrm/establishment/card.php`, `htdocs/hrm/admin/admin_establishment.php` |
| Carbon | Departments | Departments with parent, list and **tree view** (department nodes with members). | `apps/erp/app/modules/people/ui/Departments/{DepartmentsListView,DepartmentsTreeView,DepartmentNode,DepartmentForm}.tsx`, `apps/erp/app/routes/x+/people+/departments.tsx` |
| OpenProject | Departments admin | Hierarchical departments under an organization name; add department, change parent, add/move users between departments. | `app/controllers/admin/departments_controller.rb`, `app/components/admin/departments/{hierarchy_layout_component,change_parent_dialog_component,move_user_dialog_component,add_user_component}.rb`, `app/views/admin/departments/` |

**BOSS implications.** Mantle already models all of this with parties: legal entities and departments are `Organization` parties linked by `PartyRelationship` `PrtOrgRollup` (department → parent org), employment is `PrtEmployee` (person → internal org), and reporting lines can be `PrtManager` relationships between persons (Mantle has no position-to-position reporting entity, so a position-based chart would need one); teams are `PrtMember` relationships to a team organization (or a `PartyClassification`). Work locations are `Facility` records. So the gap is screens, not schema; candidates are (1) an **Org structure** page with a department tree (Carbon/OpenProject style: drag to re-parent, member counts, head of department) and (2) **Org chart** drawn from reporting lines (Odoo hierarchy view + Frappe's mobile renderer), with a side panel version embedded on the Employee 360. Department approvers (Frappe `department_approver`) map naturally to a role on the department party (leave approver, expense approver) rather than a separate table. Teams can stay lightweight: the same `PrtMember` records Projects uses.

---

## 4. Positions, job titles, grades & headcount planning

Most references conflate three things that Mantle keeps apart: a **job class** (title/profile: "Senior Accountant", with expected skills and responsibilities), a **position** (one budgeted seat in a department, filled or vacant) and a **grade/level** (pay band). Odoo's `hr.job` and ERPNext's Designation are job classes with headcount counters; only Dolibarr (job vs position) and Mantle (`EmplPositionClass` vs `EmplPosition`) model seats explicitly, and only Frappe has a real headcount plan (Staffing Plan).

### Odoo — job positions, employee types, contract templates

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Job positions | List/kanban/form: department, company, employee type, contract type, current employees (`no_of_employee`), expected new employees (`no_of_recruitment`), total expected (`expected_employees`), recruiter, recruitment target and job page. Used by both Employees configuration and Recruitment. | `odoo/addons/hr/views/hr_job_views.xml`, `odoo/addons/hr/models/hr_job.py` |
| Job skills | Required skills (type + level) on a job position, used for applicant/employee matching. | `odoo/addons/hr_skills/views/hr_job_skill_views.xml`, `odoo/addons/hr_skills/views/hr_job_views.xml` |
| Contract templates | Template employee-record versions (wage, schedule, contract type) applied when hiring. | `odoo/addons/hr/views/hr_contract_template_views.xml`, `odoo/addons/hr/static/src/js/contract_template_button.js` |
| Structure types | Payroll structure type (monthly/hourly, default working schedule) referenced from versions; the payroll that consumes it is Enterprise-only. | `odoo/addons/hr/models/hr_payroll_structure_type.py` |

### Frappe HR / ERPNext — designation, grade, employment type, staffing plan, requisition

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Designation | Job title + expected skills. | `erpnext/setup/doctype/designation/`, `hrms/hr/doctype/designation_skill/` |
| Employee grade | Grade with default salary structure and default base pay (pay band used by payroll assignment). | `hrms/hr/doctype/employee_grade/employee_grade.json` |
| Employment type | Full-time, part-time, intern, contract, etc. | `hrms/hr/doctype/employment_type/` |
| Staffing plan | Headcount plan per company/department and period: per designation the number of positions, estimated cost per position, current count, current openings, vacancies, total estimated cost; job openings are validated against it. | `hrms/hr/doctype/staffing_plan/`, `hrms/hr/doctype/staffing_plan_detail/staffing_plan_detail.json` |
| Job requisition | Manager request for N positions of a designation with expected compensation, reason, expected-by date, status and time-to-fill; links to the job opening. | `hrms/hr/doctype/job_requisition/job_requisition.json` |

### AureusERP / Ever Gauzy / Dolibarr / resistmanagement / WeCreate — positions and levels

| App | Screen/page | What it is | Key files |
| --- | --- | --- | --- |
| AureusERP | Job positions, employment types, categories | Odoo-shaped configuration resources in the Employees plugin (and mirrored in Recruitments). | `plugins/webkul/employees/src/Filament/Clusters/Configurations/Resources/{JobPositionResource,EmploymentTypeResource,EmployeeCategoryResource}/` |
| Ever Gauzy | Positions / employee levels / employment types | Three flat lookup pages (name + tags) used on the employee employment tab and on candidates. | `apps/gauzy/src/app/pages/positions/positions.component.html`, `apps/gauzy/src/app/pages/employee-levels/employee-level.component.html`, `apps/gauzy/src/app/pages/employment-types/employment-types.component.html` |
| Dolibarr | Job profiles vs positions | **Job** = profile (label, description, needs business travel) with required skills; **Position** = an employee assigned to a job with start/end dates and abandonment comment. Each has card, list, agenda, documents and notes tabs. | `htdocs/hrm/job_{list,card}.php`, `htdocs/hrm/position_{list,card}.php`, `htdocs/hrm/position.php`, `htdocs/hrm/class/{job,position}.class.php` |
| Dolibarr | Skills comparison | Compare required skills of a job profile against users' evaluated skills, side by side. | `htdocs/hrm/compare.php` |
| resistmanagement | Talent (profile) types | Admin over `EmplPositionClass` used as "talent types": dimensions, party classification types and expected skill types per class. | `screen/resistadmin/dashboard/ProfileType.xml`, `screen/resistadmin/dashboard/ProfileType/TalentTypeDetail.xml` |
| WeCreate | Talent search and project positions | Find talent by position class, dimensions, classifications and `PartySkill`; project positions (`WorkEffortEmplPositionDetail`) with applications via `EmploymentApplication` and approval status. | `screen/wcinternal/Account/FindTalent.xml`, `screen/wcinternal/Project/FindProjectPositions.xml` |

**BOSS implications.** Mantle covers this as is; candidate screens are **Job classes** over `EmplPositionClass` (title, description, `EmplPositionClassSkill` expected skills, `EmplClassResponsibility`), **Positions** over `EmplPosition` (org, class, pay grade, salaried/hourly, full-time/temporary, overtime flag, standard hours, budget link, status, from/thru) with the current holder from `EmplPositionParty` and a "vacant" filter, and **Pay grades** over `PayGrade`/`PayGradeSalary`. The headcount plan is then just positions by status (`EmpsPlanned` "Planned For", `EmpsActive` "Active/Open", `EmpsInactive` "Inactive/Closed"; filled vs vacant comes from a current `EmplPositionParty` row; a "frozen" status would be new) summed per department, plus Frappe's estimated-cost column from `PayGradeSalary` — no separate staffing-plan entity appears necessary. A **requisition** is the request to open or backfill a position and the start of recruiting (§5); Mantle's `JobRequisition` is only a commented-out sketch in `HumanResourcesEntities.xml` (with dated fields such as age and gender), so one option is a planned position plus an approval, another is enabling and updating that sketch (Open questions, §18). Dolibarr's job-vs-position split and its skills comparison page are the best UI precedents; WeCreate/resistmanagement prove the `EmplPositionClass` + skills + dimensions pattern already works in Moqui.

---

## 5. Recruiting & applicant tracking

Recruiting is the most CRM-like part of HR: a job opening is a pipeline, applicants move through stages on a kanban, interviews are calendar events with scorecards, and an accepted offer turns into an employee. Odoo is the strongest pipeline UX, Frappe the most complete object model (requisition → opening → applicant → interview → feedback → offer → appointment letter), Gauzy the best interview-panel UI.

### Odoo — recruitment app, applicant kanban, careers site

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Recruitment menu | Applications (by job positions, by talent pools, all applications) · Reporting (recruitment analysis) · Configuration (settings, job positions, stages, UTMs/sources/mediums/campaigns, tags, refuse reasons, degrees, employees, departments, activity types and plans, job boards, email templates). | `odoo/addons/hr_recruitment/views/menuitems.xml` |
| Job positions kanban | One card per job: new/total applications, to-recruit target, hired count, published flag, recruiter and interviewers, email alias, documents; this is the recruitment landing page. | `odoo/addons/hr_recruitment/views/hr_job_views.xml`, `odoo/addons/hr_recruitment/static/src/views/recruitment_kanban_view.{js,xml}` |
| Applicant pipeline | Kanban per job by stage with priority stars, kanban state (in progress / blocked / ready), tags, activities, folded "hired"/"refused" columns; list, calendar (interviews), pivot, graph and activity views. | `odoo/addons/hr_recruitment/views/hr_applicant_views.xml` (kanban, list, calendar, pivot, graph, activity), `odoo/addons/hr_recruitment/static/src/hr_applicant_state_selection/` |
| Applicant form | Header actions (schedule meeting, send interview survey, create employee, refuse with reason), smart buttons (employee, other applications, meetings, documents); fields for job, stage, recruiter, interviewers, expected/proposed salary, availability, degree, source/medium, tags; Note and Details pages; chatter. | `odoo/addons/hr_recruitment/views/hr_applicant_views.xml` (form pages `application_note`, `application_details`), `odoo/addons/hr_recruitment/models/hr_applicant.py`, `odoo/addons/hr_recruitment/views/hr_applicant_refuse_reason_views.xml` |
| Stages | Configurable stages (per job or global) with email template on entry, fold, hired-stage flag. | `odoo/addons/hr_recruitment/views/hr_recruitment_stage_views.xml`, `odoo/addons/hr_recruitment/models/hr_recruitment_stage.py` |
| Talent pools | Saved pools of applicants to re-engage for future jobs. | `odoo/addons/hr_recruitment/views/hr_talent_pool_views.xml`, `odoo/addons/hr_recruitment/models/hr_talent_pool.py` |
| Sources / job boards | UTM source/medium tracking per application and job-board (platform) records. | `odoo/addons/hr_recruitment/views/hr_recruitment_source_views.xml`, `odoo/addons/hr_recruitment/models/hr_job_platform.py` |
| Interview forms | Survey-based interview scorecards sent from the applicant. | `odoo/addons/hr_recruitment_survey/views/{hr_applicant_views,hr_job_views,survey_survey_views}.xml` |
| Applicant skills | Skills on applicants and matching against job skills. | `odoo/addons/hr_recruitment_skills/views/{hr_applicant_skill_views,hr_applicant_views,hr_job_views}.xml` |
| Careers site | Public job list and job detail pages with apply form; applications land in the pipeline. | `odoo/addons/website_hr_recruitment/views/website_hr_recruitment_templates.xml`, `odoo/addons/website_hr_recruitment/controllers/main.py` |

### Frappe HR — requisition → opening → applicant → interview → offer

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Recruitment sidebar | Dashboard, **Hiring Pipeline** (job-applicant kanban), Job Opening, Job Applicant, Interview, Job Offer, Appointment Letter; Planning (Job Requisition, Staffing Plan, Employee Referral); Recruitment Analytics; setup (interview type, opening/offer-term/appointment-letter templates, Job Portal link). | `hrms/workspace_sidebar/recruitment.json` |
| Job opening | Title, designation, department, employment type, location, staffing plan + planned vacancies, salary range (publishable), posted/closes on, publish flag/route, link to requisition, opening template. | `hrms/hr/doctype/job_opening/job_opening.json`, `hrms/hr/doctype/job_opening_template/` |
| Job applicant | Name, email, phone, status, source, cover letter, resume attachment/link with inline preview, rating, expected salary range, referral link; dashboard of interviews/offers. | `hrms/hr/doctype/job_applicant/job_applicant.json`, `job_applicant_dashboard.html`, `hrms/hr/doctype/job_applicant_source/` |
| Interview | Interview with type/round, schedule (date, from/to), interviewers, status, expected vs average rating, summary; feedback dialog per interviewer. | `hrms/hr/doctype/interview/`, `hrms/hr/doctype/interview_type/`, `hrms/hr/doctype/interviewer/`, `hrms/public/js/interview.bundle.js` |
| Interview feedback | Per-interviewer skill assessment ratings, average, result (cleared/rejected), free text. | `hrms/hr/doctype/interview_feedback/interview_feedback.json`, `hrms/hr/doctype/skill_assessment/` |
| Job offer | Offer with designation, department, grade, employment type, reports-to, joining date, salary structure and CTC break-up, leave policy/holidays, probation, offer terms; status workflow. | `hrms/hr/doctype/job_offer/job_offer.json`, `hrms/hr/doctype/{job_offer_term,job_offer_term_template,offer_term,job_offer_component}/` |
| Appointment letter | Generated letter from a template for the hired applicant. | `hrms/hr/doctype/appointment_letter/`, `hrms/hr/doctype/appointment_letter_template/` |
| Employee referral | Employee refers a candidate (resume, designation), with referral-bonus eligibility and payment status. | `hrms/hr/doctype/employee_referral/employee_referral.json` |
| Job portal | Public `/jobs` list with filters and job detail page; web-form application. | `hrms/www/jobs/index.{html,py,js}`, `hrms/templates/generators/job_opening.html`, `hrms/hr/web_form/job_application/` |
| Recruitment analytics | Report of openings → applicants → offers. | `hrms/hr/report/recruitment_analytics/` |

### AureusERP / Ever Gauzy / Dolibarr / WeCreate — recruiting

| App | Screen/page | What it is | Key files |
| --- | --- | --- | --- |
| AureusERP | Applications cluster | Job-by-position list, applicants (list/view/edit + skills), candidates (separate person record reused across applications); configuration of stages, refuse reasons, degrees, UTM sources/mediums, applicant categories, activity plans. Table-based, no kanban. | `plugins/webkul/recruitments/src/Filament/Clusters/Applications/Resources/{JobByPositionResource,ApplicantResource,CandidateResource}/`, `plugins/webkul/recruitments/src/Filament/Clusters/Configurations/Resources/` |
| Ever Gauzy | Candidates | Candidate list with hire / reject / archive, invite, statistics; candidate profile tabs: main, experience (education, skills), hiring, employment, location, rates, documents, feedbacks, interview, history, tasks. | `apps/gauzy/src/app/pages/candidates/candidates.component.html`, `apps/gauzy/src/app/pages/candidates/edit-candidate/edit-candidate-profile/edit-candidate-{main,experience,hiring,employment,location,rates,documents,feedbacks,interview,history,tasks}/` |
| Ever Gauzy | Manage interviews | Interview calendar, interview panel table (interviewers, criteria, rating) and criteria setup (technologies, personal qualities). | `apps/gauzy/src/app/pages/candidates/manage-candidate-interviews/{interview-calendar,interview-panel,interview-criterions}/` |
| Ever Gauzy | Candidate statistics | Charts of interview ratings and feedback per candidate. | `apps/gauzy/src/app/pages/candidates/candidate-statistic/` |
| Dolibarr | Job positions to fill | Position to recruit: expected headcount, recruiter, future manager, establishment, work place, expected date, remuneration, project; applications tab. | `htdocs/recruitment/recruitmentjobposition_{list,card,applications}.php`, `htdocs/recruitment/class/recruitmentjobposition.class.php` |
| Dolibarr | Candidatures | Candidate with requested vs proposed remuneration, status, link to created employee; candidatures can be created from inbound email (`email_msgid`). | `htdocs/recruitment/recruitmentcandidature_{list,card}.php`, `htdocs/recruitment/class/recruitmentcandidature.class.php` |
| Dolibarr | Public job pages | Public list and detail of open positions. | `htdocs/public/recruitment/index.php`, `htdocs/public/recruitment/view.php` |
| WeCreate | Project position applications | Internal list of applications to positions with approve flow, built on Mantle `EmploymentApplication`. | `screen/wcinternal/Project/FindProjectPositions.xml` |

**BOSS implications.** Mantle has only some of the bones: live are `EmploymentApplication` (position, `statusId` with an `EmploymentApplication` status type but no status items seeded, referred-by enum `Earb*`, applying / referred-by / approver party, application date) and `PartySkill`; `JobRequisition`, `JobInterview`, `PartyResume` and `PartyQualification` are commented-out sketches in `HumanResourcesEntities.xml`. There is no stage/pipeline, scorecard, offer or talent-pool concept; the references suggest a thin layer: an applicant **status flow** (status items for the existing `EmploymentApplication` status type plus a `StatusFlow`, with "hired" and "refused" terminal states and a refuse-reason enum), interview **scorecards** (the reused survey builder, also in Marketing and Customer Service, `DbForm` + `FormResponse`, as Odoo uses surveys; or a small rating table keyed to `EmplPositionClassSkill`), interviews as events on the reused calendar (`WorkEffort` `WetEvent` with interviewers in `WorkEffortParty`; enabling `JobInterview` is the alternative), and an **offer** record that pre-fills `Employment`/`EmploymentSalary` on hire. Candidate screens: Openings (Odoo job kanban), Pipeline (applicant kanban per opening, the same kanban component as Sales/Projects), Applicant 360 (resume preview, interviews, feedback, offer, communication timeline), Interviews calendar (the reused calendar), Careers page (public, from the store/website layer) and an email alias per opening (like Odoo/Dolibarr) via the Comms receiver. One option is applicant parties as `Person` with an applicant role (no such `RoleType` is seeded; Mantle has `Employee`, `Contractor`, `Manager`, `OrgEmployer`) so a hired applicant becomes the employee without re-keying. Whether the careers page is a People screen or part of a public website layer that Commerce's storefront would also use is an open question (§18).

---

## 6. Onboarding, offboarding & lifecycle events

Lifecycle events are where HR most often changes an employee record: hire, probation end, promotion, transfer, pay change, leave of absence, separation. The references split into **checklist-driven** onboarding/offboarding (Odoo activity plans, Frappe boarding templates that spawn project tasks) and **document-driven** change events (Frappe promotion/transfer/separation docs that write an audit trail; Odoo writes a new employee-record version).

### Odoo — activity plans, departure wizard, versions

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Onboarding / offboarding plans | Reusable activity plans (ordered to-dos whose responsible is the employee, their manager, a role, a specific user or asked at launch, with deadline offsets before/after the plan date) launched from the employee form; activities appear in each assignee's activity list. | `odoo/addons/hr/views/mail_activity_plan_views.xml`, `odoo/addons/hr/models/mail_activity_plan.py`, `odoo/addons/hr/models/mail_activity_plan_template.py` |
| Departure wizard | "Register departure": reason, dismissal date, computed departure and archive dates, description, apply-immediately; archives the employee/user and ends the current contract version. | `odoo/addons/hr/views/hr_employee_departure_views.xml`, `odoo/addons/hr/models/hr_employee_departure.py`, `odoo/addons/hr/static/src/js/departure_conflict_dialog.js` |
| Departure reasons | Configurable reasons (fired, resigned, retired, …). | `odoo/addons/hr/views/hr_departure_reason_views.xml` |
| Contract end | Dialog when a contract version ends (renew, new version, or depart). | `odoo/addons/hr/static/src/components/contract_end_dialog/` |
| Promotion / pay change | No dedicated document: a new effective-dated `hr.version` with new job/department/wage, visible on the versions timeline. | `odoo/addons/hr/models/hr_version.py`, `odoo/addons/hr/static/src/components/versions_timeline/` |

### Frappe HR — onboarding, separation, promotion, transfer, grievance, F&F

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Employee onboarding | From job offer/applicant: joining date, template, department/designation/grade, holiday list, and **activities** (name, user or role, weight, duration, begin-on offset, "required before employee creation") that create Tasks in a linked Project; status tracks completion. | `hrms/hr/doctype/employee_onboarding/employee_onboarding.json`, `hrms/hr/doctype/employee_onboarding_template/`, `hrms/hr/doctype/employee_boarding_activity/employee_boarding_activity.json` |
| Employee separation | Resignation date, template, activities (also project tasks), linked exit interview, boarding status. | `hrms/hr/doctype/employee_separation/employee_separation.json`, `hrms/hr/doctype/employee_separation_template/` |
| Exit interview | Interviewers, relieving date, questionnaire email (web form), status and summary. | `hrms/hr/doctype/exit_interview/exit_interview.json` |
| Full & final statement | Settlement on exit: payables (salary, leave encashment, gratuity), receivables (advances, loans), assets to recover. | `hrms/hr/doctype/full_and_final_statement/full_and_final_statement.json`, `hrms/hr/doctype/{full_and_final_asset,full_and_final_outstanding_statement}/` |
| Promotion | Promotion date, property changes (designation/grade/department…) and current vs revised CTC; on submit writes to employee and property history. | `hrms/hr/doctype/employee_promotion/employee_promotion.json`, `hrms/hr/doctype/employee_property_history/` |
| Transfer | Transfer date, property changes, optional new company with new employee ID and leave re-allocation. | `hrms/hr/doctype/employee_transfer/employee_transfer.json` |
| Grievance | Grievance against employee/department/party, type, cause, responsible, resolution. | `hrms/hr/doctype/employee_grievance/employee_grievance.json`, `hrms/hr/doctype/grievance_type/` |
| Tenure workspace / reports | Onboarding, separation, grievance; reports Employee Exits, Employee Birthday, Employee Information, Employee Analytics. | `hrms/workspace_sidebar/tenure.json`, `hrms/hr/report/{employee_exits,employee_birthday,employee_analytics}/` |

### AureusERP / Ever Gauzy / Dolibarr — lifecycle

| App | Screen/page | What it is | Key files |
| --- | --- | --- | --- |
| AureusERP | Activity plans, departure reasons | Odoo-style plan and departure-reason configuration. | `plugins/webkul/employees/src/Filament/Clusters/Configurations/Resources/{ActivityPlanResource,DepartureReasonResource}/` |
| Ever Gauzy | Invite, hiring, end work | Employee invites (onboarding into the app), hiring tab (offer / accept / reject dates), "end work / back to work" actions on the list. | `apps/gauzy/src/app/pages/employees/manage-employee-invite/`, `apps/gauzy/src/app/pages/employees/edit-employee/edit-employee-profile/edit-employee-hiring/`, `apps/gauzy/src/app/pages/employees/employees.component.html` |
| Dolibarr | Employment dates only | Employment start/end dates on the user card; position end date with abandonment comment. | `htdocs/user/card.php`, `htdocs/hrm/position_card.php` |

**BOSS implications.** Lifecycle events fit what Mantle already stores — `PartyRelationship` from/thru for employment, `Employment.terminationReasonEnumId` (the `TerminationReason` enum type has no values seeded) / `terminationTypeEnumId` (`TtResigned`/`TtFired`/`TtLayoff`/`TtRetired`), `EmplPositionParty` from/thru for position changes, `EmploymentSalary` rows for pay changes, `UnemploymentClaim` for post-separation claims. One option is a guided **action dialog** per event on the Employee 360 (Hire, Change position/department, Change pay, Leave of absence, Separate) that writes the right effective-dated rows and appears on the employment timeline; this is Odoo's version idea with Frappe's explicit event types. Frappe's approach suggests **onboarding/offboarding checklists** as tasks (a checklist template = a project/task template; responsible by role: HR, manager, IT, the employee) on the reused Task / work item screen (also in Projects, Commons, Customer Service and Sales; `WorkEffort` `WetTask`, `WorkEffortParty`), so they show up in each assignee's task list. An exit interview can be a form from the reused survey builder; final settlement touches Accounting (final pay, advances outstanding) and the reused facility & equipment record (asset return). One option for grievances is a restricted-visibility type (a new request type) on the reused Request / case record rather than a new entity.

---

## 7. Attendance, shifts, working schedules & time

Three related but distinct records: **working schedule** (contracted hours per weekday, the capacity basis for leave and planning), **attendance** (physical presence: check-in/out, kiosk, geofence, late/early flags) and **timesheet** (what the hours were spent on — a reused screen researched in depth in [research-projects.md](research-projects.md) §8–9). Shift-based businesses add **shift types and rosters**. Hourly payroll needs approved hours from either attendance or timesheets: time entry and timesheets are a reused screen (also in Projects and Accounting, crosscut §4), and People's version emphasizes attendance and the pay-relevant totals.

### Odoo — attendance app, kiosk, working schedules, time rules

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Attendance menu | Attendances (kiosk mode) · Reporting · Management (dashboard, attendances) · Configuration (onboarding, time types, automatic rules). | `odoo/addons/hr_attendance/views/hr_attendance_view.xml` |
| Attendance list / calendar / analysis | List, kanban, form, "my attendances" form and calendar, graph and pivot; management filter. Calendar renderer shows check-in/out blocks per day. | `odoo/addons/hr_attendance/views/hr_attendance_view.xml`, `odoo/addons/hr_attendance/static/src/views/calendar/`, `odoo/addons/hr_attendance/static/src/views/attendance_list_view.{js,xml}` |
| Kiosk | Public kiosk app: pick employee or scan badge, PIN entry, camera stream, greeting/confirmation, break-duration dialog; shared-tablet clocking. | `odoo/addons/hr_attendance/static/src/public_kiosk/public_kiosk_app.{js,xml}`, `odoo/addons/hr_attendance/static/src/components/{kiosk_barcode,pin_code,manual_selection,greetings,attendance_video_stream,break_duration_dialog}/`, `odoo/addons/hr_attendance/views/hr_attendance_kiosk_templates.xml` |
| Systray check-in | Top-bar check-in/out (§1). | `odoo/addons/hr_attendance/static/src/components/attendance_menu/` |
| Time rules (overtime) | Rules that classify extra hours (overtime thresholds, sources); attendance overtime can be converted to compensatory time off. | `odoo/addons/hr_attendance/models/hr_time_rule.py`, `odoo/addons/hr_work_entry/views/hr_time_rule_views.xml`, `odoo/addons/hr_holidays_attendance/views/{hr_attendance_overtime_views,hr_leave_allocation_views}.xml` |
| Work entry types | Typed time categories (attendance, overtime, leave types) used for payroll export. | `odoo/addons/hr_work_entry/views/hr_work_entry_type_views.xml`, `odoo/addons/hr_work_entry/models/hr_work_entry_type.py`, `odoo/addons/hr_work_entry/static/src/export_cog_menu/` |
| Working schedules | Resource calendars: type fixed / variable / undefined, attendance lines (day, from/to, day period), hours per day/week, full-time hours and work-time rate, global leaves; employee count and "apply to employees" action; drive leave duration and planning capacity. | `odoo/addons/resource/models/resource_calendar.py`, `odoo/addons/resource/views/{resource_calendar_views,resource_calendar_attendance_views,resource_calendar_leaves_views}.xml`, `odoo/addons/hr/views/resource_calendar_views.xml`, `odoo/addons/hr/static/src/components/resource_calendar_form/` |
| Timesheets | My Timesheets / All Timesheets / reporting by employee, project, task (cross-reference Projects). | `odoo/addons/hr_timesheet/views/hr_timesheet_menus.xml` |

### Frappe HR — check-ins, attendance, shifts, roster, overtime

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Employee check-in | Raw IN/OUT logs (device ID, geolocation lat/long, shift, off-shift flag); biometric/API or PWA check-in; auto attendance links logs to an Attendance. | `hrms/hr/doctype/employee_checkin/employee_checkin.json`, `frontend/src/components/CheckInPanel.vue`, `frontend/src/views/attendance/EmployeeCheckinList.vue` |
| Shift type | Start/end, holiday list, check-in window, late-entry / early-exit grace, half-day and absent hour thresholds, auto-attendance processing, overtime allowed + type, color. | `hrms/hr/doctype/shift_type/shift_type.json` |
| Shift location | Named location with geofence radius used to validate check-ins. | `hrms/hr/doctype/shift_location/shift_location.json` |
| Shift assignment / request / schedule | Assign shifts to employees (bulk tool), employee shift requests with approval, recurring shift schedules (frequency, repeat-on days). | `hrms/hr/doctype/{shift_assignment,shift_assignment_tool,shift_request,shift_schedule,shift_schedule_assignment}/` |
| Roster | Separate Vue app: month grid of employees × days with shift chips, assign/edit shift dialog, filters. | `roster/src/views/MonthView.vue`, `roster/src/components/{MonthViewTable,MonthViewHeader,ShiftAssignmentDialog}.vue` |
| Attendance | Daily status (present / absent / on leave / half day / WFH), in/out times, working hours, late entry / early exit, overtime; attendance request for corrections; bulk marking tool. | `hrms/hr/doctype/attendance/attendance.json`, `hrms/hr/doctype/attendance_request/`, `hrms/hr/doctype/employee_attendance_tool/` |
| Overtime | Overtime types and overtime slips (period total, linked to salary slip/payroll entry). | `hrms/hr/doctype/{overtime_type,overtime_slip,overtime_details,overtime_salary_component}/` |
| PWA attendance | Attendance dashboard + calendar, attendance requests, shift requests, shift assignments, check-in list. | `frontend/src/views/attendance/{Dashboard,AttendanceRequestList,AttendanceRequestForm,ShiftRequestList,ShiftRequestForm,ShiftAssignmentList,ShiftAssignmentForm,EmployeeCheckinList}.vue`, `frontend/src/components/AttendanceCalendar.vue` |
| Reports | Monthly attendance sheet, shift attendance, employee hours utilization (timesheet-based). | `hrms/hr/report/{monthly_attendance_sheet,shift_attendance,employee_hours_utilization_based_on_timesheet}/` |

### Carbon / Ever Gauzy / OpenProject / Redmine / Moqui baseline — time and schedules

| App | Screen/page | What it is | Key files |
| --- | --- | --- | --- |
| Carbon | Timecards | Clock-in/clock-out entries per employee with note; list, new, edit, delete; enabled by a company setting. | `apps/erp/app/modules/people/ui/Timecards/{TimecardsTable,TimecardForm}.tsx`, `apps/erp/app/routes/x+/people+/timecard.tsx`, `apps/erp/app/routes/x+/person+/$personId.timecard.tsx` |
| Carbon | Shifts | Named shift with start/end time, location and weekday checkboxes; employees get one shift. | `apps/erp/app/modules/people/ui/Shifts/{ShiftsTable,ShiftForm}.tsx`, `apps/erp/app/routes/x+/people+/shifts.tsx` |
| Ever Gauzy | Employee timesheets & activity | Daily, weekly, calendar timesheets with approvals; activity tracking (screenshots, apps/URLs, time activities); availability slots for scheduling. Detailed in Projects research §8. | `apps/gauzy/src/app/pages/employees/timesheet/{daily,weekly,calendar,approvals,view}/`, `apps/gauzy/src/app/pages/employees/activity/{screenshot,app-url-activity,time-activities}/`, `apps/gauzy/src/app/pages/employees/schedules/availability-slots/` |
| OpenProject | User working hours & non-working times | Per-user weekly working hours with availability factor; per-user non-working times (vacation) calendar + year overview; global working days/hours and non-working days; used by scheduling and time-entry validation. | `app/models/user_working_hours.rb`, `app/components/users/working_hours/availability_factor_form.rb`, `app/models/user_non_working_time.rb`, `app/components/users/non_working_times/{calendar_component,year_overview_component,dialog_component}.rb`, `app/views/my/{working_hours,non_working_times}.html.erb`, `app/models/non_working_day.rb`, `app/controllers/admin/settings/working_days_and_hours_settings_controller.rb` |
| Redmine | Non-working dates | Admin list of non-working dates (with import) honoured by the calendar and Gantt. | `app/views/non_working_dates/{index,_form}.html.erb`, `app/models/non_working_date.rb`, `app/models/non_working_date_import.rb` |
| Moqui baseline | Party time entries | Clock-in form and time-entry list on the party, worker invoice; my time entries in My Account. | `component/mr-marble/screen/SimpleScreens/Party/PartyTimeEntries.xml` (`ClockInForm`, `TimeEntryList`, `WorkerInvoice`), `component/mr-marble/screen/SimpleScreens/Party/PartyTimeEntries/EditTimeEntry.xml`, `component/mr-marble/screen/MyAccount/User/TimeEntries.xml` |

**BOSS implications.** Mantle covers clocking and hours: `TimeEntry` (from/thru, hours, break hours, work type, rate type and rate modifier for overtime, position class, party, facility, work effort, `Timesheet`), `Timesheet` statuses `TmshInProcess` → `TmshCompleted` → `TmshApproved`, `create#TimeEntryClockIn`, `get#TeamTimesheetInfo`, and `import#TimeSummaryFile`/`import#TimeDetailFile` for external time clocks; `EmplPosition.standardHoursPerWeek` and overtime flag drive pay. What Mantle lacks is a **working schedule / shift** entity and **check-in log with geolocation**: one option is a small working-schedule record (weekly lines, linked to position or employment), with clock-in/out treated as `TimeEntry` rows with no work effort (attendance) versus with a work effort (timesheet). Candidate screens: **Clock in/out** on the Me page and header (Odoo systray, Frappe check-in panel; optional kiosk page for shared tablets), **Attendance** list/calendar for HR with late/missing flags, **Shift roster** (Frappe's month grid — people × days) only for shift businesses, drawn on the reused Calendar & schedules screen. People includes the reused timesheet entry and approval screen (crosscut §4) with the emphasis on approved hours for pay, next to an **Hours for pay** view (attendance plus approved timesheet hours per pay period). OpenProject's per-user working hours + non-working times are a candidate capacity source that the Projects resource planner could read as well.

---

## 8. Leave / time off

Leave is the highest-traffic HR flow after the directory: every employee requests, every manager approves, HR configures. All mature references share the model **leave type → allocation (or accrual) → request → approval → balance**, with public holidays and the working schedule determining how many days a request costs. They differ on where the balance lives: Frappe keeps a **leave ledger**, Odoo computes from allocations minus validated leaves, Dolibarr keeps a counter with a modification log.

### Odoo — time off app

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Time Off menu | My Time (Days Off, Requests for allocation) · Overview · Management (Time Off, Allocations to approve) · Reporting (by Employee, by Type, Balance) · Configuration (Time Types, Accrual Plans, Company Holidays, Mandatory Days, activity types). | `odoo/addons/hr_holidays/views/hr_holidays_views.xml` |
| Dashboard | Per-type balance cards + year calendar of my leaves, public holidays and mandatory days; click a day to request. | `odoo/addons/hr_holidays/static/src/dashboard/`, `odoo/addons/hr_holidays/static/src/views/calendar/` |
| Time off request | Form: type, dates or half-day/hours, duration computed from the working schedule, description, supporting document; manager variant with approve/refuse/validate buttons; dashboard quick-create variants. | `odoo/addons/hr_holidays/views/hr_leave_views.xml` (form, manager form, dashboard forms), `odoo/addons/hr_holidays/models/hr_leave.py` |
| Manager views | Kanban, activity, list with approve buttons, manager calendar and month/week dashboards (team calendar), graph. | `odoo/addons/hr_holidays/views/hr_leave_views.xml` (`hr.leave.view.kanban`, `hr.leave.view.calendar.manager`, `hr.leave.view.dashboard.month`, `hr.leave.view.dashboard.week`), `odoo/addons/hr_holidays/static/src/views/{kanban,list,graph}/` |
| Balance popover | Leave stats widget on employee/request: taken, remaining, upcoming. | `odoo/addons/hr_holidays/static/src/leave_stats/leave_stats.{js,xml}` |
| Time types | Leave types are `hr.work.entry.type` records: validation (none / HR / approver / both), requires allocation, employee allocation requests allowed, unit (day / half-day / hour), color, negative cap. | `odoo/addons/hr_holidays/models/hr_work_entry_type.py`, `odoo/addons/hr_holidays/views/hr_work_entry_type_views.xml` |
| Allocations | Manual or accrual-based allocations per employee/department/company with approval. | `odoo/addons/hr_holidays/views/hr_leave_allocation_views.xml`, `odoo/addons/hr_holidays/models/hr_leave_allocation.py` |
| Accrual plans | Plans with milestone levels: start after N days/months, add X days/hours per frequency (daily … yearly, specific weekdays/month days), cap, carry-over, based on worked time. | `odoo/addons/hr_holidays/views/hr_leave_accrual_views.xml`, `odoo/addons/hr_holidays/models/hr_leave_accrual_plan.py`, `hr_leave_accrual_plan_level.py`, `odoo/addons/hr_holidays/static/src/components/accrual_level/` |
| Public holidays / mandatory days | Company-wide global leaves on the working schedule and "mandatory days" when leave cannot be taken. | `odoo/addons/hr_holidays/views/resource_views.xml`, `odoo/addons/hr_holidays/views/hr_leave_mandatory_day_views.xml` |
| Overtime → time off | Extra attendance hours convertible to allocations (deductible overtime). | `odoo/addons/hr_holidays_attendance/views/{hr_leave_allocation_views,hr_leave_attendance_report_views}.xml` |

### Frappe HR — leave types, policies, allocations, ledger, applications

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Leaves sidebar | Leave Application, Encashment, Control Panel, Policy Assignment, Allocation; reports (balance, balance summary, employees working on a holiday); setup (holiday list + assignment, leave period, policy, block list, type). | `hrms/workspace_sidebar/leaves.json` |
| Leave type / policy | Type flags (LWP, carry-forward, encashment, earned-leave accrual frequency, max continuous days, allow negative, optional, compensatory); policy bundles annual allocations per type; policy assignment per employee + leave period. | `hrms/hr/doctype/{leave_type,leave_policy,leave_policy_detail,leave_policy_assignment,leave_period}/`, `hrms/hr/doctype/earned_leave_schedule/` |
| Leave control panel | Bulk allocation / policy assignment by company, department, designation, grade, employment type. | `hrms/hr/doctype/leave_control_panel/` |
| Allocation / adjustment / encashment / compensatory | Allocation documents, manual adjustments, encashment to pay, compensatory leave requests for working on holidays. | `hrms/hr/doctype/{leave_allocation,leave_adjustment,leave_encashment,compensatory_leave_request}/` |
| Leave ledger | Every allocation, application, expiry and encashment posts a ledger entry; balances are sums. | `hrms/hr/doctype/leave_ledger_entry/`, `hrms/hr/report/leave_ledger/` |
| Leave application | Request with half-day, approver, status workflow; validates against balance, block lists and holidays. | `hrms/hr/doctype/leave_application/`, `hrms/hr/doctype/{leave_block_list,leave_block_list_date,leave_block_list_allow}/` |
| Holiday list | Named holiday calendar (weekly offs + dated holidays), assigned per company/employee. | `erpnext/setup/doctype/holiday_list/`, `erpnext/setup/doctype/holiday/`, `hrms/hr/doctype/holiday_list_assignment/` |
| PWA leave | Leave dashboard (balance semicircles, upcoming holidays), list with my/team tabs, request form. | `frontend/src/views/leave/{Dashboard,List,Form}.vue`, `frontend/src/components/{LeaveBalance,Holidays,LeaveRequestItem,SemicircleChart}.vue` |
| Reports | Employee leave balance, balance summary, employees working on a holiday. | `hrms/hr/report/{employee_leave_balance,employee_leave_balance_summary,employees_working_on_a_holiday}/` |

### AureusERP / Ever Gauzy / Dolibarr / Carbon — leave

| App | Screen/page | What it is | Key files |
| --- | --- | --- | --- |
| AureusERP | Time-off clusters | Odoo-shaped: My Time (my time off, my allocations), Management (time off, allocations), Reporting (by employee), pages Overview (calendar) and By Type, Dashboard; configuration of leave types, accrual plans, public holidays, mandatory days, activity types. | `plugins/webkul/time-off/src/Filament/Clusters/{MyTime,Management,Reporting,Configurations}/Resources/`, `plugins/webkul/time-off/src/Filament/Pages/{Dashboard,Overview,ByType}.php`, `plugins/webkul/time-off/src/Filament/Widgets/OverviewCalendarWidget.php` |
| Ever Gauzy | Time off | Request list with approve / deny / archive, status filter, add/display holidays; settings page for time-off policies. | `apps/gauzy/src/app/pages/time-off/time-off.component.html`, `apps/gauzy/src/app/pages/time-off/time-off-settings/time-off-settings.component.html` |
| Dolibarr | Holidays | Request card (half-day morning/afternoon, approver, status), list, group request for several users, agenda, monthly report; balances page with mass increase and a modification log. | `htdocs/holiday/{card,card_group,list,holiday_agenda,month_report}.php`, `htdocs/holiday/define_holiday.php`, `htdocs/holiday/view_log.php` |
| Carbon | Holidays | Company holiday list only (name, date); no leave requests. | `apps/erp/app/modules/people/ui/Holidays/{HolidaysTable,HolidayForm}.tsx`, `apps/erp/app/routes/x+/people+/holidays.tsx` |

**BOSS implications.** Mantle's leave support is minimal: `EmploymentLeave` (keyed by employment + `fromDate`, both dates without times so no half days or hours; `thruDate`, `leaveTypeEnumId` `EltEarned`/`EltLossOfPay`/`EltHoliday`/`EltSpecialDayOff`, `leaveReasonEnumId` `ElrMedical`/`ElrPersonal`, `leaveApproved` Y/N, `approverPartyId`, description) plus PTO rate types (`RatpVacation`, `RatpSick`, `RatpHoliday`, `RatpPtoOther`) for paying leave hours through `TimeEntry`, and a `WetTimeOff` work-effort type for calendar time-off events. Holiday calendars already have a shape: `HolidayUsaData.xml` (mr-mantle `data/`) seeds US federal and bank holidays as `WetEvent` work efforts with purpose `WepHoliday`, grouped by `WorkEffortCategory` (`HolidayUsaFed`, `HolidayUsaBank`) — a holiday calendar is a category. The gaps are **leave types with policy settings** (unit, requires allocation, validation, carry-over cap, negative allowed), **allocations/accrual rules** and a **leave ledger** (Frappe's approach — auditable and simple to report), plus a real status flow on `EmploymentLeave` (requested → approved/refused → cancelled) instead of a Y/N flag. **Holiday calendars** (`WepHoliday` event categories) are the same records the reused calendar and Projects capacity would read. Candidate screens: Me → Time off (balance cards + request, Odoo dashboard / Frappe PWA), Team calendar (who is out, by department, on the reused Calendar & schedules screen), leave approvals in People's version of the reused approvals list (§13), Allocations (bulk by group, Frappe control panel), Leave types & accrual plans, Holiday calendars. Hours taken flow to payroll as PTO time entries.

---

## 9. Payroll & compensation

Payroll is where People hands off to Accounting. Only two codebases in the checkout implement a real payroll engine: **Frappe HR** (salary components → structures → assignments → payroll entry → salary slips → journal entry/bank remittance, with India-flavoured tax and benefits) and **Mantle** itself (`PayrollServices`: time-period pay run that produces payroll **invoices** from employee to employer, with US federal/state tax adjustments, garnishments, payments and W-2/1099/EFW2 documents). Odoo community has no payroll (Enterprise `hr_payroll`); Dolibarr records salary payments without computing them; Gauzy treats salaries as recurring expenses.

### Frappe HR — payroll module

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Payroll sidebar | Payroll Entry, Salary Structure Assignment, Salary Slip, Additional Salary, Salary Withholding; reports (CTC break-up, salary register, income tax deductions, GL, AP); setup (salary component, salary structure, settings). | `hrms/workspace_sidebar/payroll.json`, `hrms/payroll/payroll_dashboard/payroll/payroll.json` |
| Salary component | Earning/deduction component with formula or amount, condition, tax flags, depends-on-payment-days, flexible benefit, accrual/arrear, GL accounts per company. | `hrms/payroll/doctype/salary_component/salary_component.json`, `hrms/payroll/doctype/salary_component_account/` |
| Salary structure / assignment | Structure = earnings + deductions + employer contributions with formulas, payroll frequency, timesheet-based option, hour rate; assigned per employee with base/variable and from-date (bulk tool). | `hrms/payroll/doctype/{salary_structure,salary_structure_assignment,bulk_salary_structure_assignment,salary_detail}/` |
| Payroll entry | Pay run for company/branch/department/designation/grade and period: fetch employees, validate attendance, create and submit slips, post accrual journal, make bank entry. | `hrms/payroll/doctype/payroll_entry/payroll_entry.json`, `hrms/payroll/doctype/payroll_employee_detail/`, `hrms/payroll/doctype/payroll_period/` |
| Salary slip | Period, working/payment days, LWP, timesheets and hour rate, earnings, deductions, gross/net, loans, leave details; three print formats. | `hrms/payroll/doctype/salary_slip/salary_slip.json`, `hrms/payroll/doctype/{salary_slip_timesheet,salary_slip_leave,salary_slip_loan}/`, `hrms/payroll/print_format/{salary_slip_classic,salary_slip_compact,salary_slip_detailed}/` |
| One-off pay items | Additional salary, arrears, payroll correction, retention bonus, incentive, salary withholding cycles, gratuity rules/slabs. | `hrms/payroll/doctype/{additional_salary,arrear,payroll_correction,retention_bonus,employee_incentive,salary_withholding,gratuity,gratuity_rule}/` |
| Tax & benefits | Income tax slabs, exemption declarations and proofs, benefit application/claim/ledger (separate Tax & Benefits workspace). | `hrms/payroll/doctype/{income_tax_slab,employee_tax_exemption_declaration,employee_tax_exemption_proof_submission,employee_benefit_application,employee_benefit_claim,employee_benefit_ledger}/`, `hrms/workspace_sidebar/tax_&_benefits.json` |
| Reports | Salary register, bank remittance, CTC break-up, income tax computation/deductions, payments by mode/ECS, accrued earnings. | `hrms/payroll/report/{salary_register,bank_remittance,employee_ctc_break_up,income_tax_computation,income_tax_deductions,salary_payments_based_on_payment_mode,salary_payments_via_ecs,accrued_earnings_report}/` |
| PWA payslips | Salary-slip dashboard (year summary) and slip detail with earnings/deductions table and PDF download. | `frontend/src/views/salary_slip/{Dashboard,Detail}.vue`, `frontend/src/components/{SalarySlipItem,SalaryDetailTable}.vue` |

### Odoo / Dolibarr / Ever Gauzy — compensation without an engine

| App | Screen/page | What it is | Key files |
| --- | --- | --- | --- |
| Odoo | Payroll tab + versions | Wage, contract type, structure type and schedule on the employee record version; salary bank account widget; payroll engine absent from community. | `odoo/addons/hr/views/hr_employee_views.xml` (`payroll_information`), `odoo/addons/hr/models/hr_version.py`, `odoo/addons/hr/models/hr_payroll_structure_type.py`, `odoo/addons/hr/static/src/components/many2many_tags_salary_bank/` |
| Odoo | Work entry export | Export of typed work entries for an external payroll provider. | `odoo/addons/hr_work_entry/static/src/export_cog_menu/` |
| Dolibarr | Salaries | Salary payment records (employee, period start/end, amount, payment mode, bank account, project), payments list, bank-transfer requests, statistics; salary/hourly rate on the user. | `htdocs/salaries/{list,card,payments,payment_salary,virement_request}.php`, `htdocs/salaries/stats/index.php`, `htdocs/salaries/class/salary.class.php` |
| Ever Gauzy | Rates / recurring salary | Employee bill rate, minimum billing rate, pay period, weekly limit; salary entered as a recurring employee expense feeding the HR profit dashboard. | `packages/ui-core/shared/src/lib/employee/employee-rates/employee-rates.component.html`, `apps/gauzy/src/app/pages/recurring-expense-employee/` |

### Moqui baseline — payroll engine without screens

Mantle's payroll services, payroll documents and compensation entities, and the one SimpleScreens labor-rates screen, are listed in §17. In short: `process#TimePeriodPay` runs `process#EmploymentPay` for each employment in a pay period (salary from `EmploymentSalary`, or hourly `TimeEntry` hours × `RateAmount`, then `PayrollAdjustment` phases) and writes `InvoicePayroll` invoices (employee → employer), `InvoiceTax` invoices (tax authority → employer) and `InvoicePayrollOther` / `InvoiceGarnishment` invoices to other payees; `approve#PeriodInvoices`, `create#PeriodPayments`, `authorize#PeriodPayments`, `deliver#PeriodPayments` and `reopen#PayrollPeriod` finish or undo the run; `PayrollDocumentServices` produces W-2, EFW2 and 1099-MISC data. Payroll behaviour is tuned by employer `PartySetting` types seeded in `PayrollData.xml` (FLSA workweek start, overtime premiums, minimum-wage checks, workers' comp risk class).

**BOSS implications.** The evidence argues against porting Frappe's payroll engine: Mantle's is already there and is integrated with invoices, payments and the GL; the gap is the UI plus current tax data (the seeded US federal and California adjustments carry 2015 rates). Candidate People screens: **Compensation** tab on the Employee 360 (salary history from `EmploymentSalary`, rate overrides from `RateAmount`, benefits from `EmploymentBenefit`, tax setup on `Employee` and `Employment`, per-employee `PayrollAdjustment` rows), **Pay runs** (pick time period → preview `get#TimePeriodEmployments` → process → review per-employee pay detail → approve invoices → create/authorize/deliver payments; a stepper like Frappe's payroll entry), **Payslips** (render from `EmploymentPayHistory` + `EmploymentPayDetail`; employee sees own on the Me page, like Frappe's PWA), **Payroll setup** (adjustments, allowances, standard deductions, workers-comp rates, garnishments, pay grades, labor rates, the employer payroll `PartySetting` values) and **Year-end** (W-2/1099/EFW2). Frappe's salary component/structure UI is the reference for making `PayrollAdjustment` comprehensible; its multi-country tax and benefits machinery is not. Accounting sees payroll as invoices and payments, so no separate payroll journal screen appears necessary.

---

## 10. Expenses & advances

Expense claims are an employee self-service flow with an Accounting tail: the employee captures receipts, the manager approves, finance posts and reimburses (usually through payroll or a payment run). Expense claims are a reused function (crosscut §4): People's version emphasizes capture and approval, Accounting's posting, taxes and payment (see [research-accounting.md](research-accounting.md) §6–7 for bills and payments).

### Odoo — expenses app

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Expenses menu | My Expenses · Expenses to Process · Reporting (expenses analysis) · Configuration (expense products). | `odoo/addons/hr_expense/views/hr_expense_views.xml` |
| My expenses | List/kanban with a header dashboard of amounts by state (draft / submitted / approved) and drag-and-drop receipt upload that creates expenses (OCR in Enterprise). | `odoo/addons/hr_expense/static/src/components/expense_dashboard.{js,xml}`, `odoo/addons/hr_expense/static/src/views/{list,kanban}.{js,xml}` |
| Expense form | Product (category), amount, taxes, paid by employee vs company, analytic distribution, receipt attachments, split expense; states draft → submitted → approved → posted → in payment → paid. In this version there is no separate expense-report (sheet) object. | `odoo/addons/hr_expense/models/hr_expense.py`, `odoo/addons/hr_expense/static/src/views/expense_form_view.js`, `odoo/addons/hr_expense/views/hr_expense_split_views.xml` |
| Expense products & limits | Expense categories as products with cost and accounts; per-job-position limits. | `odoo/addons/hr_expense/views/product_product_views.xml`, `odoo/addons/hr_expense/models/hr_expense_product_job_position_limit.py` |
| Accounting tail | Journal dashboard tile, posted moves and payments linked back to expenses. | `odoo/addons/hr_expense/views/{account_journal_dashboard_view,account_move_views,account_payment_views}.xml` |
| Project re-invoicing | Expenses linked to projects/sales orders for re-billing. | `odoo/addons/project_hr_expense/` |

### Frappe HR — expense claims, advances, travel

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Expenses sidebar | Employee Advance, Expense Claim, Travel Request, Vehicle Log; accounting entries (payment entry, journal entry); reports (unpaid expense claim, vehicle expenses, AR/AP, GL); setup (expense claim type, driver, vehicle). | `hrms/workspace_sidebar/expenses.json` |
| Expense claim | Lines (date, type, description, amount, sanctioned amount), taxes, advances allocated against the claim, approver and approval status, payable account, project/cost center. | `hrms/hr/doctype/expense_claim/`, `hrms/hr/doctype/{expense_claim_detail,expense_claim_advance,expense_taxes_and_charges,expense_claim_type,expense_claim_account}/` |
| Employee advance | Advance request/payment, returned and claimed amounts, settled against claims. | `hrms/hr/doctype/employee_advance/` |
| Travel request | Itinerary and costing for business travel. | `hrms/hr/doctype/{travel_request,travel_itinerary,travel_request_costing,purpose_of_travel}/` |
| PWA expenses | Expense dashboard (summary), claim list (my/team) and form with items, taxes and advances tables; advance list/form with balance. | `frontend/src/views/expense_claim/{Dashboard,List,Form}.vue`, `frontend/src/views/employee_advance/{List,Form}.vue`, `frontend/src/components/{ExpenseClaimSummary,ExpenseItems,ExpensesTable,ExpenseTaxesTable,ExpenseAdvancesTable,EmployeeAdvanceBalance}.vue` |
| Reports | Unpaid expense claim, employee advance summary. | `hrms/hr/report/{unpaid_expense_claim,employee_advance_summary}/` |

### Dolibarr / Ever Gauzy — expenses

| App | Screen/page | What it is | Key files |
| --- | --- | --- | --- |
| Dolibarr | Expense reports | Report per user and period with lines (type, date, project, qty, unit price, VAT), statuses draft → validated → approved → paid / refused / cancelled, payments, documents, statistics. | `htdocs/expensereport/{list,card,document,note}.php`, `htdocs/expensereport/payment/`, `htdocs/expensereport/stats/index.php`, `htdocs/expensereport/class/expensereport.class.php` |
| Ever Gauzy | Expenses | Organization expenses (optionally per employee/project) with categories, recurring employee expenses. | `apps/gauzy/src/app/pages/expenses/expenses.component.html`, `apps/gauzy/src/app/pages/expenses/expense-categories/`, `apps/gauzy/src/app/pages/recurring-expense-employee/` |

**BOSS implications.** Mantle has no expense-claim entity or invoice type but has two ways to pay one: as an incoming `Invoice` from the employee party (items typed by the `ItemExpense` item-type children in `ItemTypeData.xml`; statuses `InvoiceIncoming` → `InvoiceReceived` → `InvoiceApproved` → `InvoicePmtSent`, paid through normal AP), or as a per-employee `PayrollAdjustment` in the **Expenses, Reimbursement** phase (`PrphExpenses`, the last phase `process#EmploymentPay` runs) with item type `ItemReimbursement`, so reimbursement rides on the next paycheck. The baseline already has the first path for project work: MyAccount **Expenses** lets a worker on a project create an expense invoice (`create#ProjectExpenseInvoice`, `InvoiceSales` type from the worker to the project's vendor party, linked by `WorkEffortInvoice`), add `ItemExpense*` lines and Submit (`InvoiceIncoming` → `InvoiceReceived`) — no receipts, no approver, project-only (§17). One option is an **Expense claim** screen (reused: People, Accounting) that is a thin, mobile-friendly façade over an employee-from invoice in that status flow (Incoming = draft, Received = submitted, Approved = manager-approved; receipt-first capture like Odoo, line table like Frappe), manager approval in People's version of the reused approvals list (§13), and a hand-over to Accounting's version of the screen (posting, tax and payment, crosscut §4) that is just the invoice moving to approved. **Advances** are a payment to the employee recorded against a financial account or as a negative balance settled by the claim (Frappe's advance-allocation table is the UX reference). Project-linked expenses need to carry the `WorkEffort` for Projects to re-bill them.

---

## 11. Skills, training & certifications

Skills serve three consumers: **staffing** (who can do this task or fill this position — Projects and Manufacturing), **development** (gaps against the job profile, training plans) and **compliance** (certifications that expire and gate work). Odoo and Frappe treat skills as a profile catalogue; Carbon is the stand-out for compliance (abilities with recertification and quiz-based trainings that grant them); Dolibarr is the only one that compares employee skills against a job profile in a dedicated screen.

### Odoo — resume, skills, certifications, learning

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Resume tab | Resume lines by section type (experience, education, internal history, training, …) with dates and description; internal lines auto-created from employment; kanban/list/calendar views; printable CV template. | `odoo/addons/hr_skills/views/hr_views.xml` (resume line form/list/kanban/calendar), `odoo/addons/hr_skills/models/hr_resume_line.py`, `odoo/addons/hr_skills/models/hr_resume_line_type.py`, `odoo/addons/hr_skills/static/src/fields/resume_one2many/`, `odoo/addons/hr_skills/views/hr_employee_cv_templates.xml` |
| Skills tab | Skills grouped by skill type with level (progress %), shown as tags or a grouped one-to-many; skill graph view. | `odoo/addons/hr_skills/static/src/fields/{skills_one2many,many2many_tags_skills,one2many_tags_skills}/`, `odoo/addons/hr_skills/static/src/views/skills_graph.js`, `odoo/addons/hr_skills/models/{hr_skill,hr_skill_level,hr_skill_type,hr_employee_skill}.py` |
| Skill types | Skill type with ordered levels and a **certification** flag; certification skills have valid-from/valid-to and expired ones are tracked. | `odoo/addons/hr_skills/models/hr_skill_type.py` (`is_certification`), `odoo/addons/hr_skills/models/hr_employee_skill.py` |
| Learning menu | Certifications (employee skills of certification types) and Training Attendances (training resume lines). | `odoo/addons/hr_skills/views/hr_views.xml` (Learning menu) |
| Department / job skills | Skills overview on departments; required skills on job positions. | `odoo/addons/hr_skills/views/{hr_department_views,hr_job_skill_views,hr_job_views}.xml` |
| eLearning / events / surveys | Completed eLearning courses, attended events and passed certification surveys written to the resume automatically. | `odoo/addons/hr_skills_slides/views/`, `odoo/addons/hr_skills_event/views/`, `odoo/addons/hr_skills_survey/views/` |
| Project staffing | Filter project task assignees by skill. | `odoo/addons/project_hr_skills/` |

### Frappe HR — skills, skill map, training programs/events

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Skill catalogue | Skill master; designation skills (expected per job title); expected skill set. | `hrms/hr/doctype/{skill,designation_skill,expected_skill_set}/` |
| Employee skill map | Per employee: skills with proficiency (rating) and evaluation date, plus trainings attended; pre-filled from designation. | `hrms/hr/doctype/employee_skill_map/employee_skill_map.json`, `hrms/hr/doctype/employee_skill/employee_skill.json`, `hrms/hr/doctype/employee_training/` |
| Training program / event | Program (trainer, supplier); event with type, level, course, location, schedule, invited employees and certificate flag; attendance on the event. | `hrms/hr/doctype/{training_program,training_event,training_event_employee}/` |
| Training feedback / result | Per-employee feedback and results (hours, grade, comments). | `hrms/hr/doctype/{training_feedback,training_result,training_result_employee}/` |

### AureusERP / Dolibarr / Carbon — skills and training

| App | Screen/page | What it is | Key files |
| --- | --- | --- | --- |
| AureusERP | Skills | Skill types configuration, employee skills relation manager and a skills report (employee × skill × level). | `plugins/webkul/employees/src/Filament/Clusters/Configurations/Resources/SkillTypeResource/`, `plugins/webkul/employees/src/Filament/Resources/EmployeeResource/Pages/ManageSkill.php`, `plugins/webkul/employees/src/Filament/Clusters/Reportings/Resources/EmployeeSkillResource/` |
| Dolibarr | Skills | Skill with type (know-how, soft skill "how to be", knowledge) and ordered level descriptions; attachable to jobs (required rank) and users (actual rank). | `htdocs/hrm/skill_{list,card,tab}.php`, `htdocs/hrm/class/{skill,skilldet,skillrank}.class.php` |
| Dolibarr | Evaluations | Periodic evaluation of an employee against a job profile: per-skill evaluated rank vs required rank; validated evaluations update the user's skills. | `htdocs/hrm/evaluation_{list,card}.php`, `htdocs/hrm/class/{evaluation,evaluationdet}.class.php`, `htdocs/hrm/compare.php` |
| Carbon | Abilities | Ability (linked to a manufacturing process) with "recertify every N days"; employee abilities with last training date and expiry; status qualified / expiring (days left) / expired. | `apps/erp/app/modules/resources/ui/Abilities/{AbilitiesTable,AbilityForm,AbilityEmployeesTable,EmployeeAbilityForm,EmployeeAbilityStatus}.tsx`, `apps/erp/app/routes/x+/resources+/abilities.tsx`, `apps/erp/app/routes/x+/person+/$personId.abilities.tsx` |
| Carbon | Training | Training content with ordered quiz questions that **grants an ability** on completion; assignments to groups (internal or external); public share link for external trainees; assignment completion tracking. | `apps/erp/app/modules/resources/ui/Training/{TrainingsTable,TrainingForm,TrainingExplorer,TrainingAssignmentForm,TrainingStatus}.tsx`, `apps/erp/app/routes/x+/training+/`, `apps/erp/app/routes/x+/resources+/assignments.tsx`, `apps/erp/app/routes/share+/training.$id.tsx` |

### Frappe LMS — courses, batches, quizzes, certificates

A separate learning app, not wired into hrms; the closest reference for internal training delivery and certification.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Courses | Course list and detail, course editor with chapters and lessons, per-student progress, course dashboard; course flags for certification, paid certificate, evaluator, enforced lesson order. | `frontend/src/pages/Courses/{Courses,CourseDetail,CourseEditor,CourseDashboard,StudentCourseProgress,CourseCertification}.vue`, `lms/lms/doctype/lms_course/lms_course.json`, `lms/lms/doctype/lms_enrollment/lms_enrollment.json` (progress, current lesson, certificate) |
| Batches | Cohort with start/end dates and times, seat count, instructors, courses, timetable, live classes, assessments, self-enrollment; batch detail with students, certificates, announcements. | `frontend/src/pages/Batches/{Batches,BatchDetail,BatchOverview,BatchForm}.vue`, `lms/lms/doctype/lms_batch/lms_batch.json`, `frontend/src/pages/Forms/{LiveClassForm,AssessmentForm,BatchStudentForm}.vue` |
| Programs | Ordered sets of courses with members and enforced course order. | `frontend/src/pages/Programs/{Programs,ProgramDetail,ProgramEnrollment}.vue`, `lms/lms/doctype/lms_program/lms_program.json` |
| Quizzes & assignments | Quiz builder (questions, passing percentage, max attempts, duration, shuffle, proctoring, negative marking, scheduling), submissions review; assignments with submissions. | `frontend/src/pages/{Quizzes,QuizPage,QuizSubmissions,QuizSubmission,Questions,Assignments,AssignmentSubmissions}.vue`, `lms/lms/doctype/lms_quiz/lms_quiz.json` |
| Certificates & evaluations | Certificate per member and course with issue and **expiry date** and evaluator; certificate evaluation (date, slot, rating, status); evaluator schedule slots; public certified-participants list. | `lms/lms/doctype/{lms_certificate,lms_certificate_evaluation,lms_certificate_request,evaluator_schedule}/`, `frontend/src/pages/{CertifiedParticipants,ProfileCertificates,ProfileEvaluationSchedule}.vue` |
| Statistics / job board | Learning statistics page; a small job-openings board with applications. | `frontend/src/pages/{Statistics,Jobs,JobDetail,JobApplications}.vue` |

**BOSS implications.** Mantle's live skill data is thin: `PartySkill` (skill type enum — the `SkillType` enum type has no values seeded — rating, skill level, started-using date, years of experience), `EmplPositionClassSkill` (required skills per job class) and `WorkEffortSkillStandard` (skills a task needs, for staffing). `PartyQualification` (degree/certificate with from/thru, status and verification status, with a seeded `QualificationType` list), `PartyResume`, `PersonTraining` (training attended, approver, approved flag) and `TrainingClass` exist only as a commented-out block in `HumanResourcesEntities.xml` ("not yet used"); enabling them is a small Mantle change, and training sessions can be `WorkEffort` events with the existing purpose `WepTraining` and attendees in `WorkEffortParty`. Candidate screens: **Skills & resume** tab on the Employee 360 (Odoo's grouped skill bars + resume timeline), **Skills matrix** (people × skills with levels, filter by department/job; Dolibarr compare and AureusERP report — also the staffing lookup Projects and Manufacturing call), **Certifications** list with expiring/expired status driven by `PartyQualification.thruDate` once enabled (Carbon's qualified/expiring/expired chip, Frappe LMS certificate expiry date; notify before expiry), and **Training** (classes/sessions as `WepTraining` events, enrolment, completion writing `PersonTraining` and optionally granting a qualification — Carbon's "training grants ability" closes the loop; Frappe LMS batches, programs and certificate evaluations are the reference if course content is ever needed). Training quizzes could use the reused survey builder (crosscut §4). Gating work on a valid certification (Carbon process abilities) is a Manufacturing/Maintenance consumer of the same data.

---

## 12. Performance, goals & reviews

Reviews are the weakest-covered area in the checkout: Odoo's appraisals are Enterprise-only, AureusERP and Carbon have none, Dolibarr's "evaluations" are skill-rank checks (§11). **Frappe HR** is the complete reference (cycles, templates, KRAs, goals tree, self-appraisal, 360 feedback, formula-based final score); **Gauzy** is the OKR reference (objectives, key results, initiatives, progress updates at organization / team / employee level).

### Frappe HR — appraisal cycles, KRAs, goals, feedback

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Performance sidebar | Goal, Appraisal Cycle, Appraisal, Employee Performance Feedback, Employee Promotion; Appraisal Overview report; setup (appraisal template, KRA, feedback criteria). | `hrms/workspace_sidebar/performance.json` |
| Appraisal cycle | Period, scope (company/branch/department/designation), "get employees" to create appraisees with templates, KRA evaluation method (manual rating vs goal progress), final-score formula, status (not started / in progress / completed). | `hrms/hr/doctype/appraisal_cycle/appraisal_cycle.json`, `hrms/hr/doctype/appraisee/` |
| Appraisal template | KRAs with weightage plus rating criteria for feedback. | `hrms/hr/doctype/appraisal_template/appraisal_template.json`, `hrms/hr/doctype/{appraisal_template_goal,kra}/` |
| Appraisal | Per employee per cycle: KRA scores (from goals or manual), self ratings and reflections, average feedback score, total and final score. | `hrms/hr/doctype/appraisal/appraisal.json`, `hrms/hr/doctype/{appraisal_kra,appraisal_goal}/` |
| Goals | Tree of goals per employee (parent goal, is-group), linked to KRA and cycle, progress % and status; list and tree views. | `hrms/hr/doctype/goal/goal.json`, `hrms/hr/doctype/goal/{goal_tree,goal_list}.js` |
| Performance feedback | Feedback from any reviewer on an appraisal: criteria ratings, total score, comments (360 input). | `hrms/hr/doctype/employee_performance_feedback/employee_performance_feedback.json`, `hrms/hr/doctype/{employee_feedback_criteria,employee_feedback_rating}/`, `hrms/public/js/performance/performance_feedback.js` |
| Overview | Appraisal overview report and chart; workspace cards (ongoing cycles, appraisals this year, goals in progress). | `hrms/hr/report/appraisal_overview/`, `hrms/performance/workspace/performance/performance.json` |

### Ever Gauzy — OKRs

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Goals (objectives) | Objectives at organization, team or employee level with owner, lead, deadline/time frame; group-by; create from preset templates. | `apps/gauzy/src/app/pages/goals/goals.component.html`, `apps/gauzy/src/app/pages/goals/edit-objective/`, `apps/gauzy/src/app/pages/goals/goal-template-select/`, `apps/gauzy/src/app/pages/goals/goal-details/` |
| Key results | KR types (numeric, true/false, currency, task- or KPI-linked), weights, parameters, progress updates with history chart. | `apps/gauzy/src/app/pages/goals/{edit-keyresults,keyresult-type-select,key-result-parameters,keyresult-details,keyresult-update,keyresult-progress-chart}/` |
| Initiatives | Initiatives under key results. | `apps/gauzy/src/app/pages/goals/initiatives/` |
| Goal settings | KPIs and time frames (quarters etc.). | `apps/gauzy/src/app/pages/goal-settings/{edit-kpi,edit-time-frame}/`, `apps/gauzy/src/app/pages/goal-settings/goal-settings.component.html` |

### Odoo / Dolibarr — partial coverage

| App | Screen/page | What it is | Key files |
| --- | --- | --- | --- |
| Odoo | Gamification badges | Badges received shown on the employee form; badge/challenge configuration. Appraisals (`hr_appraisal`) are absent from community. | `odoo/addons/hr_gamification/views/{hr_employee_views,gamification_views}.xml` |
| Odoo | Surveys | Generic survey engine (used for interview forms and certifications) is the community path to review questionnaires. | `odoo/addons/hr_recruitment_survey/views/survey_survey_views.xml`, `odoo/addons/hr_skills_survey/views/survey_survey_views.xml` |
| Dolibarr | Evaluations | Job-profile skill evaluations (see §11). | `htdocs/hrm/evaluation_card.php` |

**BOSS implications.** Mantle sketches `PerformanceReview` (employee, manager, position, period, comments, linked payment for bonuses), `PerformanceReviewItem` (item type + rating enum + comments; `PerformanceReviewItemType` and `PerformanceReviewRating` enums) and `PerformanceNote` (dated notes on a person), but all three sit in the commented-out "not yet used" block of `HumanResourcesEntities.xml`, so nothing in the baseline stores a review today. Enabled, they appear sufficient for the candidate screens: **Review cycles** (create reviews for a scope and period from a template of item types, Frappe-style), **Review form** (self-assessment then manager assessment, items rated on an enum scale, overall comments; 360 feedback as additional reviewer items), **Notes** (continuous feedback via `PerformanceNote`, visible to employee and manager) and **Goals**. For goals, one option is `WorkEffort` as Projects uses it (a goal is a work effort with an owner, due date, progress %, parent goal) rather than a new OKR store, with key results linked to tasks or KPI queries (Gauzy). Questionnaires could come from the reused survey builder (`DbForm` + `FormResponse`). Promotions/pay changes triggered by a review go through the lifecycle actions of §6, and bonuses through payroll adjustments (the `paymentId` on `PerformanceReview`).

---

## 13. Approvals & workflow

Every People transaction except directory edits needs an approval: leave, allocations, attendance corrections, shift requests, overtime, expenses, advances, timesheets, requisitions, offers, training, pay changes. The references either hard-wire approver fields per transaction (Odoo, Dolibarr, Frappe department approvers) or provide one generic approval request object (Gauzy). The best manager UX is Frappe's PWA **Team Requests** tab — one list of everything waiting for me, approve with a swipe.

### Frappe HR — approvers, workflow, team requests

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Approver resolution | Leave, expense and shift-request approvers per department (child tables), overridable per employee (leave / expense / shift-request approver custom fields added to Employee by HR setup). | `hrms/hr/doctype/department_approver/department_approver.py`, `hrms/setup.py` |
| Team requests | PWA request panel with My Requests / Team Requests tabs across leave, expense claims, attendance and shift requests; per-item action sheet with workflow transitions. | `frontend/src/components/RequestPanel.vue`, `frontend/src/components/RequestList.vue`, `frontend/src/components/{RequestActionSheet,WorkflowActionSheet}.vue` |
| Block lists | Dates on which leave cannot be approved except for allowed users. | `hrms/hr/doctype/{leave_block_list,leave_block_list_allow,leave_block_list_date}/` |
| PWA notifications | Push notifications for request/approval events. | `hrms/hr/doctype/pwa_notification/`, `frontend/src/views/Notifications.vue` |

### Odoo — per-model approvers, validation types, activities

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Approver fields | Time-off approver (`leave_manager_id`), attendance manager, expense manager on the employee, set per person (default: manager's user). | `odoo/addons/hr_holidays/views/hr_views.xml`, `odoo/addons/hr_attendance/views/hr_employee_view.xml`, `odoo/addons/hr_expense/views/hr_employee_views.xml` |
| Validation type | Per leave type: no validation, HR, approver, or both (two-step). | `odoo/addons/hr_holidays/models/hr_work_entry_type.py` (`leave_validation_type`) |
| Approval activities | Approval requests appear as scheduled activities for the approver (activity types per module), so the generic activity menu acts as an inbox. | `odoo/addons/hr_holidays/views/mail_activity_views.xml`, `odoo/addons/hr_expense/views/mail_activity_views.xml`, `odoo/addons/hr_recruitment/views/mail_activity_views.xml` |
| Department counters | Department kanban shows counts of items to approve per module (§1). | `odoo/addons/hr/views/hr_department_views.xml` |

### Ever Gauzy / Dolibarr / AureusERP — approvals

| App | Screen/page | What it is | Key files |
| --- | --- | --- | --- |
| Ever Gauzy | Approval requests | Generic request approval (name, type, amount/currency, note, status) with employee and team approvers and a **minimum approver count**; approve/refuse actions in a table. | `apps/gauzy/src/app/pages/approvals/approvals.component.html`, `apps/gauzy/src/app/pages/approvals/table-components/request-approval-action/`, `packages/core/src/lib/request-approval/request-approval.entity.ts` |
| Ever Gauzy | Approval policies | Named policies (seeded examples include Time Off and Equipment Sharing) that requests reference. | `apps/gauzy/src/app/pages/approval-policy/approval-policy.component.html`, `packages/core/src/lib/approval-policy/default-approval-policies.ts` |
| Ever Gauzy | Timesheet approvals | Approve submitted timesheets per period. | `apps/gauzy/src/app/pages/employees/timesheet/approvals/` |
| Dolibarr | Validator / approver on documents | Leave requests carry a designated validator; expense reports a validator and approver with dated validate/approve/refuse/cancel stamps. | `htdocs/holiday/class/holiday.class.php` (`fk_validator`), `htdocs/expensereport/class/expensereport.class.php` (`fk_user_approve`) |
| AureusERP | Approve actions | Approve/refuse table actions on time off and allocations in the Management cluster. | `plugins/webkul/time-off/src/Filament/Clusters/Management/Resources/{TimeOffResource,AllocationResource}/` |

**BOSS implications.** Approvals waiting is a reused screen (crosscut §3): the header **Notifications** panel lists everything suite-wide, and People's **filtered version** of the same list — on My team and People home — would cover leave, attendance corrections, expenses, requisitions, offers, training and pay changes (timesheets included), each row showing requester, type, dates/amount, balance or budget context, with approve / refuse / ask-for-info actions and bulk approve (Frappe's Team Requests tab is the UX reference). Whether People also needs a standalone inbox screen, as this file first proposed, is an open question (§18; crosscut §8). A candidate approver resolution order: employee-level override → department role (a `PartyRelationship` or role such as leave approver on the department party; Mantle has no approver-rule record) → manager (`PrtManager`) → HR; two-step where the type says so (Odoo validation types). Mantle already carries a single approver on some records (`EmploymentLeave.approverPartyId`, `EmploymentApplication.approverPartyId`, `PersonTraining.approverPartyId` in the commented-out block), but leave approval is a Y/N flag, not a status; for one generic list each transaction needs a `statusId` driven by framework `StatusFlow`/`StatusFlowTransition` (`moqui.basic`), and approval events go to the notification topics and the employee's Me page (Frappe's My Requests tab). Gauzy's minimum-approver count is a candidate for high-value approvals (pay changes, offers).

---

## 14. Reports & analytics

HR reporting splits into **operational lists** that HR staff run weekly (leave balances, attendance sheet, who is out, expiring certifications, birthdays/anniversaries, unpaid claims) and **workforce analytics** for leadership (headcount trend, hiring vs attrition, diversity, time-to-fill, payroll cost). Frappe ships by far the largest fixed set; Odoo relies on pivot/graph views over each model plus a few dedicated leave reports.

### Frappe HR — reports, charts, number cards, workbooks

| Area | Reports / charts | Key files |
| --- | --- | --- |
| Workforce | Employee analytics, employee information, employee birthday, employee exits; charts: department/designation-wise headcount, employees by age / branch / grade / type, gender diversity ratio, hiring vs attrition, YoY promotions/transfers. | `hrms/hr/report/{employee_analytics,employee_information,employee_birthday,employee_exits}/`, `hrms/hr/dashboard_chart/{department_wise_employee_count,designation_wise_employee_count,employees_by_age,employees_by_branch,employees_by_grade,employees_by_type,gender_diversity_ratio,hiring_vs_attrition_count,y_o_y_promotions,y_o_y_transfers}/` |
| Leave & attendance | Employee leave balance + summary, leave ledger, employees working on a holiday, monthly attendance sheet, shift attendance; charts: attendance count, leave applications by type, shift assignment breakup. | `hrms/hr/report/{employee_leave_balance,employee_leave_balance_summary,leave_ledger,employees_working_on_a_holiday,monthly_attendance_sheet,shift_attendance}/`, `hrms/hr/dashboard_chart/{attendance_count,leave_applications_by_type,shift_assignment_breakup}/` |
| Recruitment | Recruitment analytics; charts: applicant pipeline, applicant source, applicants by country, application frequency/status, interview status, offer status, openings by department/designation; cards: time to fill, offer acceptance rate, applicant-to-hire %. | `hrms/hr/report/recruitment_analytics/`, `hrms/hr/dashboard_chart/{job_applicant_pipeline,job_applicant_source,job_applicants_by_country,job_application_frequency,job_application_status,interview_status,job_offer_status,department_wise_openings,designation_wise_openings}/`, `hrms/hr/number_card/{time_to_fill,job_offer_acceptance_rate,applicant_to_hire_percentage}/` |
| Time, expense, performance | Hours utilization (timesheets), project profitability, unpaid expense claims, advance summary, vehicle expenses, appraisal overview; charts: claims by type, department-wise claims/timesheet hours, training type, grievance type. | `hrms/hr/report/{employee_hours_utilization_based_on_timesheet,project_profitability,unpaid_expense_claim,employee_advance_summary,vehicle_expenses,appraisal_overview}/`, `hrms/hr/dashboard_chart/{claims_by_type,department_wise_expense_claims,department_wise_timesheet_hours,training_type,grievance_type}/` |
| Payroll | Salary register, bank remittance, CTC break-up, income-tax computation/deductions, accrued earnings, payments by mode. | `hrms/payroll/report/` |
| Insights workbooks | Prebuilt BI workbooks for HR, attendance, expense claims and payroll. | `hrms/hr_setup/insights_workbook/human_resource/`, `hrms/hr/insights_workbook/{attendance,expense_claims}/`, `hrms/payroll/insights_workbook/payroll/` |

### Odoo / AureusERP / Ever Gauzy / Dolibarr — reporting

| App | Area | What it is | Key files |
| --- | --- | --- | --- |
| Odoo | Employee analysis | New employees over time (graph/pivot), employee record versions graph/pivot (wage, contract analysis). | `odoo/addons/hr/views/hr_employee_views.xml` (`hr_employee_view_graph`, `hr_employee_view_pivot`), `odoo/addons/hr/views/hr_version_views.xml` |
| Odoo | Time off reports | By employee, by type, balance; printable holidays summary; report calendar. | `odoo/addons/hr_holidays/report/{hr_leave_employee_report_views,hr_leave_employee_type_report,hr_leave_reports,hr_leave_report_calendar}.xml`, `odoo/addons/hr_holidays/report/holidays_summary_report.py` |
| Odoo | Other module analyses | Attendance graph/pivot, recruitment analysis, expenses analysis pivot, timesheets by employee/project/task; spreadsheet dashboards for expenses and timesheets. | `odoo/addons/hr_attendance/views/hr_attendance_view.xml`, `odoo/addons/hr_recruitment/views/hr_applicant_views.xml` (pivot/graph), `odoo/addons/hr_expense/views/hr_expense_views.xml` (`hr_expense_view_pivot`), `odoo/addons/spreadsheet_dashboard_hr_expense/`, `odoo/addons/spreadsheet_dashboard_hr_timesheet/` |
| AureusERP | Reporting clusters | Employee skills report; time off by employee. | `plugins/webkul/employees/src/Filament/Clusters/Reportings/`, `plugins/webkul/time-off/src/Filament/Clusters/Reporting/Resources/ByEmployeeResource/` |
| Ever Gauzy | Reports | Time, weekly time, manual time, apps/URLs, time limits, expenses, payments, amounts owed — time-tracking-centric. | `apps/gauzy/src/app/pages/reports/{time-reports,weekly-time-reports,manual-time,apps-urls-report,time-limit-report,expenses-report}/` |
| Dolibarr | Statistics | Leave month report; salary and expense-report statistics. | `htdocs/holiday/month_report.php`, `htdocs/salaries/stats/index.php`, `htdocs/expensereport/stats/index.php` |

**BOSS implications.** The references suggest a small fixed set inside People — **Headcount** (by department/position/type, trend, joiners/leavers, turnover), **Who's out** (today/this week), **Leave balances**, **Attendance sheet** (month grid), **Expiring certifications**, **Birthdays & anniversaries**, **Recruiting funnel** (openings → applicants → interviews → offers → hires, time to fill), **Payroll register** (per pay run from `EmploymentPayHistory`) — with diversity, cost and cross-app analysis in Insights. Frappe's chart list is a good catalogue of what HR leaders ask for; sensitive dimensions (gender, age, pay) call for payroll/HR-admin permissions. One option is for every report to be a saved find over the same lists the screens use, so filters and exports are consistent.

---

## 15. Settings & administration

HR configuration is mostly **lookup lists** (types, reasons, categories) plus a few **policy screens** (leave types/accruals, working schedules, payroll setup, approval rules) and **module toggles**. Frappe concentrates switches in one HR Settings form with sections; Odoo spreads them over per-app Settings pages plus Configuration menus; AureusERP mirrors Odoo as Filament "Configurations" clusters.

| App | Area | Screens | Key files |
| --- | --- | --- | --- |
| Odoo | Employees configuration | Settings page; employee tags, onboarding/offboarding plans, contract types, work locations, departure reasons, working schedules, job positions, contract templates. | `odoo/addons/hr/views/hr_views.xml` (Configuration menu), `odoo/addons/hr/views/res_config_settings_views.xml`, `odoo/addons/hr/views/{hr_employee_category_views,hr_work_location_views,hr_departure_reason_views,hr_contract_template_views,resource_calendar_views}.xml` |
| Odoo | Per-app settings | Attendance (kiosk mode, PIN/badge, overtime, automatic check-out), recruitment, expenses, timesheets; time-off configuration via its menu (time types, accrual plans, public holidays, mandatory days). | `odoo/addons/{hr_attendance,hr_recruitment,hr_expense,hr_timesheet}/views/res_config_settings_views.xml`, `odoo/addons/hr_holidays/views/hr_holidays_views.xml` |
| Frappe HR | HR settings | One form: employee settings (created-by naming, retirement age, standard working hours), reminders (birthdays, work anniversaries, holidays, interviews and feedback), leave settings (approver mandatory, backdated-leave role, notifications, auto encashment), shift & attendance, expenses, hiring, employee exit. | `hrms/hr/doctype/hr_settings/hr_settings.json` |
| Frappe HR | Payroll settings / setup | Payroll settings; HR Setup workspace (company, branch, department, designation, groups, grades); module onboarding steps per workspace. | `hrms/payroll/doctype/payroll_settings/`, `hrms/workspace_sidebar/hr_setup.json`, `hrms/hr_setup/onboarding_step/` |
| Frappe HR | Lookups | Employment type, identification document type, grievance type, interview type, expense claim type, leave type, shift type, salary component. | `hrms/hr/doctype/{employment_type,identification_document_type,grievance_type,interview_type,expense_claim_type}/` |
| AureusERP | Configuration clusters | Employees: categories, activity plans, departure reasons, work locations, employment types, job positions, skill types. Time off: leave types, accrual plans, public holidays, mandatory days, activity types. Recruitment: stages, refuse reasons, degrees, UTM, applicant categories. | `plugins/webkul/employees/src/Filament/Clusters/Configurations/Resources/`, `plugins/webkul/time-off/src/Filament/Clusters/Configurations/Resources/`, `plugins/webkul/recruitments/src/Filament/Clusters/Configurations/Resources/` |
| Ever Gauzy | Organization settings | Employment types, employee levels, positions, departments, tags, time-off policies, goal KPIs/time frames, approval policies, roles & permissions. | `apps/gauzy/src/app/pages/{employment-types,employee-levels,positions,departments,tags,goal-settings,approval-policy}/`, `apps/gauzy/src/app/pages/time-off/time-off-settings/`, `apps/gauzy/src/app/pages/settings/roles-permissions/` |
| Dolibarr | Module setup | HRM, holidays, expense reports (incl. expense **rules** and mileage allowance scales), recruitment (incl. public interface), salaries, users/groups. | `htdocs/admin/{hrm,holiday,expensereport,expensereport_rules,expensereport_ik,user,usergroup}.php`, `htdocs/hrm/admin/admin_hrm.php`, `htdocs/recruitment/admin/{setup,setup_candidatures,public_interface}.php`, `htdocs/salaries/admin/salaries.php` |
| Carbon | People settings + attributes | Toggles for timecards and shared-workstation console mode; custom employee **attribute categories** (typed custom fields shown as person tabs). | `apps/erp/app/routes/x+/settings+/people.tsx`, `apps/erp/app/modules/people/ui/Attributes/{AttributeCategoriesTable,AttributeCategoryForm,AttributeForm}.tsx`, `apps/erp/app/routes/x+/people+/attributes.tsx` |

**BOSS implications.** Most People lookups are Mantle `Enumeration` types already — live: `TerminationType`, `TerminationReason` (empty), `EmploymentLeaveType`, `EmploymentLeaveReason`, `SkillType` (empty), `IdentityType`, `EmplAuthzType`, `EmploymentApplicationReferredBy`, `EmploymentResponsibility`, `WorkType`, `EmplTaxExempt`, `RateType`, `PayrollPhase`, `TaxFederalStatus`/`TaxStateStatus`; in the commented-out blocks: qualification type, training class type, job posting type, exam type, review item type/rating — so one generic **Lookups** screen filtered to HR enum types could cover them, with `EmplPositionClass`, `PayGrade`, `BenefitType` (an entity, not an enum) and, once enabled, `TrainingClass` as small dedicated lists. Candidate policy screens: **Leave types & accrual**, **Holiday calendars**, **Working schedules**, **Payroll setup** (§9), **Approval rules** (§13), **Checklist templates** (§6, task templates), **Recruiting stages & refuse reasons**. Module toggles (timecards/kiosk, self-service features, payroll on/off) could go in a People settings page like Carbon's, linked from the Admin settings index (crosscut §4). Carbon's attribute categories are a candidate pattern for country/industry-specific employee fields without schema changes; in Mantle that is `PartyClassification` + `PartyIdentification` + typed `PartySetting` values.

---

## 16. Cross-app surfaces

Screens People would include that other apps include too, plus links to other apps' records (crosscut §3–§4). Each app includes the same screen with its own context; the second column says what People's version emphasizes.

| Reused screen or link | Use in People | Other apps that include it | Reference evidence |
| --- | --- | --- | --- |
| **Employee 360** | Full record: employment, positions, pay, leave, skills, reviews, documents | Admin (user-account tab), Projects (allocations and timesheets), Commons (directory card) | Odoo employee form with per-addon smart buttons and tabs (`odoo/addons/hr/views/hr_employee_views.xml`); Frappe employee connections panel (`hrms/overrides/dashboard_overrides.py`); Carbon person sidebar (`apps/erp/app/modules/people/ui/Person/PersonSidebar/usePersonSidebar.tsx`) |
| **Contact / party record** | Employee fields on the same `Person`: role, employment, department, manager; public fields only for non-HR viewers | Commons (contacts, address book), Admin (user account), every app that shows a person or organization | Odoo public employee model (`odoo/addons/hr/models/hr_employee_public.py`); Dolibarr users double as employees (`htdocs/user/card.php`); Nextcloud profile directory (`server/apps/profile/src/views/ProfileApp.vue`) |
| **Calendar & schedules** | Leave and shift views: team who's-out calendar, holiday calendars, shift roster, interview events | Commons (calendars, booking), Maintenance (scheduling policies), Projects (plan views) | Odoo time-off manager calendar and month/week dashboards (`odoo/addons/hr_holidays/views/hr_leave_views.xml`); Frappe roster (`roster/src/views/MonthView.vue`); OpenProject per-user non-working times (`app/models/user_non_working_time.rb`); Mantle `WepHoliday` events (`component/mr-mantle/data/HolidayUsaData.xml`) |
| **Task / work item** | Onboarding and offboarding checklists as task templates assigned by role | Projects (work items, boards), Commons (my tasks), Customer Service and Sales (follow-up tasks) | Frappe onboarding activities that create Tasks in a Project (`hrms/hr/doctype/employee_boarding_activity/employee_boarding_activity.json`); Odoo activity plans (`odoo/addons/hr/models/mail_activity_plan.py`) |
| **Time entry & timesheets** | Attendance (clock in/out, kiosk, attendance list) and pay: approved hours and PTO time entries per pay period | Projects (entry, approval), Accounting (billing) | Odoo attendance vs timesheets (`odoo/addons/hr_attendance/`, `odoo/addons/hr_timesheet/`); Frappe Employee Checkin vs timesheet-based salary slips (`hrms/hr/doctype/employee_checkin/`, `hrms/payroll/doctype/salary_slip_timesheet/`); Gauzy timesheet approvals (`apps/gauzy/src/app/pages/employees/timesheet/approvals/`) |
| **Approvals waiting** | Filtered list for HR and managers: leave, attendance corrections, expenses, requisitions, offers, training, pay changes | Header Notifications panel (all apps); per-app lists in Projects, Purchasing, Sales, Accounting | Frappe Team Requests (`frontend/src/components/RequestPanel.vue`); Odoo approval activities (`odoo/addons/hr_holidays/views/mail_activity_views.xml`); Gauzy approval requests (`apps/gauzy/src/app/pages/approvals/approvals.component.html`) |
| **Expense claims** | Capture, receipts, manager approval, reimbursement through payroll | Accounting (posting, tax and payment of the approved employee invoice or payroll reimbursement) | Odoo expense accounting tail (`odoo/addons/hr_expense/views/account_move_views.xml`); Frappe expense claim payable account (`hrms/hr/doctype/expense_claim/`); MyAccount Expenses (`component/mr-marble/screen/MyAccount/Expense/FindExpenseInvoice.xml`) |
| **Payroll invoices and payments** (link) | Pay runs, payslips, year-end | Accounting (the `InvoicePayroll`, `InvoiceTax`, `InvoicePayrollOther`, `InvoiceGarnishment` invoices and payroll payments in its invoice and payment screens) | Frappe payroll entry posting a journal entry (`hrms/payroll/doctype/payroll_entry/payroll_entry.json`); Mantle `process#TimePeriodPay` (`component/mr-mantle/service/mantle/humanres/PayrollServices.xml`) |
| **Surveys & forms** | Interview scorecards, exit interviews, review questionnaires, training quizzes | Marketing (surveys), Customer Service (CSAT) | Odoo `hr_recruitment_survey` and `hr_skills_survey` (`odoo/addons/hr_recruitment_survey/views/survey_survey_views.xml`); Frappe exit interview questionnaire (`hrms/hr/doctype/exit_interview/exit_interview.json`); Carbon quiz trainings (`apps/erp/app/modules/resources/ui/Training/TrainingForm.tsx`) |
| **User accounts, groups, app access** | Account details on the Employee 360; create the user on hire, disable on separation | Admin (accounts, groups, app access), Commons (account details on the party) | Odoo Settings tab with related user (`odoo/addons/hr/views/hr_employee_views.xml`); Carbon employee accounts (`apps/erp/app/routes/x+/users+/employees.tsx`); Moqui `create#PersonEmployee` with optional user account |
| **Facility & equipment record** | Equipment assigned to an employee; asset return on separation | Maintenance (equipment register), Warehouse, Manufacturing, Commons, Accounting (fixed assets) | Odoo `hr_maintenance` (`odoo/addons/hr_maintenance/`); Frappe full & final assets (`hrms/hr/doctype/full_and_final_asset/`) |
| **Request / case** | Grievances as a restricted-visibility request type | Customer Service (cases), Purchasing, Maintenance, Projects, Sales, Warehouse, Commons | Frappe Employee Grievance (`hrms/hr/doctype/employee_grievance/employee_grievance.json`) |
| **Dashboard widgets** | Number cards on People home and My team | Insights (dashboards, workforce analytics), every app's landing page | Frappe number cards and dashboard charts (`hrms/hr/number_card/`, `hrms/hr/dashboard_chart/`); hrms Insights workbooks (`hrms/hr/insights_workbook/`) |
| **Careers page** | Public openings and apply form feeding the pipeline; email alias per opening via Comms | Open question (§18): a People screen, or a public website layer Commerce's storefront would also use | Odoo `website_hr_recruitment` (`odoo/addons/website_hr_recruitment/controllers/main.py`); Frappe `/jobs` (`hrms/www/jobs/index.html`); Dolibarr public pages (`htdocs/public/recruitment/index.php`); Frappe LMS job board (`frontend/src/pages/Jobs.vue`) |

---

## 17. Current Moqui baseline (mr-marble / MarbleERP / Mantle)

Mantle has a broad HR data model and a working US payroll engine, but the screens stop at party records, time entries and a labor-rates list. MarbleERP (`component/mr-marble/screen/marble.xml`) only mounts the SimpleScreens `HumanRes` and `Party` trees; it has no HR screens of its own, and `component/mr-boss/screen/` has none yet.

### Screens

| Screen/page | What it is | Key files |
| --- | --- | --- |
| HR dashboard | Menu "Human Resources"; two links: Employees (FindParty with `roleTypeId=Employee`) and Labor Rates | `component/mr-marble/screen/SimpleScreens/HumanRes.xml`, `component/mr-marble/screen/SimpleScreens/HumanRes/dashboard.xml` |
| Labor rates | Find/create/edit `RateAmount` by party, position class, work effort, work type, rate type, rate purpose, period UOM, currency, from/thru | `component/mr-marble/screen/SimpleScreens/HumanRes/EditRateAmounts.xml` |
| Find party / create employee | `CreateEmployeeForm` → `create#PersonEmployee` (Person, contact info, optional user account, `PrtEmployee` relationship to the employer; no `Employment` row) | `component/mr-marble/screen/SimpleScreens/Party/FindParty.xml` |
| Edit party | Person/organization form, roles, classifications, identifications, settings, user account, duplicates | `component/mr-marble/screen/SimpleScreens/Party/EditParty.xml` |
| Related parties | Generic from/to `PartyRelationship` lists and dialogs — the only place `PrtEmployee`, `PrtManager` and `PrtOrgRollup` can be edited | `component/mr-marble/screen/SimpleScreens/Party/PartyRelated.xml` |
| Party time | Clock-in form (`create#TimeEntryClockIn`), time-entry list (`store#TimeEntry`, position class from `get#PartyEmployersAndPositionClasses`), rates reset, worker invoice (`create#WorkerInvoiceItems`) | `component/mr-marble/screen/SimpleScreens/Party/PartyTimeEntries.xml`, `component/mr-marble/screen/SimpleScreens/Party/PartyTimeEntries/EditTimeEntry.xml` |
| Party calendar / tasks / projects | Per-party calendar, tasks and project assignments | `component/mr-marble/screen/SimpleScreens/Party/{PartyCalendar,PartyTasks,PartyProjects}.xml` |
| My time entries | Self-service clock in and time entry | `component/mr-marble/screen/MyAccount/User/TimeEntries.xml` |
| My expenses | Shown only to project members: create an expense invoice for a project (`create#ProjectExpenseInvoice`, `InvoiceSales` from the worker to the project's vendor party, `WorkEffortInvoice` link), add lines typed by `ItemExpense` children, Submit (`InvoiceIncoming` → `InvoiceReceived`) or Cancel; "Invoice Time" turns time entries into invoice lines (`create#ProjectInvoiceItems`). No receipts, approver or non-project expenses | `component/mr-marble/screen/MyAccount/Expense.xml`, `component/mr-marble/screen/MyAccount/Expense/{FindExpenseInvoice,EditExpenseInvoice,EditExpenseInvoiceItems}.xml` |
| Project users | Assign people to a project with a position class (`EmplPositionClass`) | `component/mr-marble/screen/SimpleScreens/Project/EditUsers.xml` |
| Payroll invoice items | Accounting invoice items offer payroll item types (`ItemPayrollIncome`, `ItemPayrollDeduct`, `ItemPayrollTaxes`, `ItemPayrollExpense` children) on `InvoicePayroll` invoices | `component/mr-marble/screen/SimpleScreens/Accounting/Invoice/EditInvoiceItems.xml` |
| Check stub / payroll register | Check print shows the paid invoice's items (pay stub); a payroll check-receipt register template exists but no screen uses it | `component/mr-marble/template/account/PaymentCheck-stubBody.html.fancy`, `component/mr-marble/template/payroll/CheckReceiptRegister.xsl-fo.ftl` |
| Surveys | Form builder and responses (reused screen: Marketing, Customer Service, People) | `component/mr-marble/screen/SimpleScreens/Survey.xml` |

**Missing:** any screen for `Employment`, `Employee` tax setup, positions, job classes, pay grades, salaries, benefits, leave, skills, applications, payroll runs, payslips, payroll setup or year-end documents; no org chart or department tree; no approvals list.

### Data model available

| Entity / enum | What it gives People | Key files |
| --- | --- | --- |
| `Employment` | Subtype of the `PrtEmployee` `PartyRelationship` (shares `partyRelationshipId`): position, termination reason / type (`TtResigned`, `TtFired`, `TtLayoff`, `TtRetired`; `TerminationReason` has no values), identity type and employment-authorization type (I-9 style `IdTp*`, `Eat*`), payroll `timePeriodTypeId`, tax work address, allowances, tax form; `jobRequisitionId` commented out | `component/mr-mantle/entity/HumanResourcesEntities.xml` |
| `Employee` | Per-person payroll tax data: pay distribution group, tax name parts, tax home address, federal/state filing status (`Tfs*`, `Tss*`), allowances, prior YTD income, exempt payee / FATCA codes | same |
| `EmplPosition` | Seat: organization, position class, status `EmpsPlanned` / `EmpsActive` / `EmpsInactive`, pay grade, budget item, salaried / full-time / temporary / overtime flags, minimum hourly wage, tax-exempt category (`Etx*`), from/thru, standard hours per week | same |
| `EmplPositionClass` (+ `EmplPositionClassSkill`, `EmplPositionClassDimension`, `EmplPositionClassPtyClsTp`, `EmplPositionClassParty`, `EmplPositionClassWorkType`, `EmplClassResponsibility`); `EmplPositionParty`; `EmplPositionResponsibility` | Job class (title, description) with expected skills, dimensions, classifications, work types, responsibilities (`EmRsp*`); position holders over time | same |
| `EmploymentSalary`, `PayGrade`, `PayGradeSalary`, `RateAmount` | Salary over time with pay grade; pay bands (amount, min, max); hourly rates by party / position class / pay grade / work type, rate types incl. PTO (`RatpVacation`, `RatpSick`, `RatpHoliday`, `RatpPtoOther`), shift differentials (`RatpEvening`, `RatpNight`, `RatpWeekend`, `RatpShHoliday`) and modifiers `RatmRegular` / `RatmOvertime` / `RatmDouble` | same |
| `EmploymentBenefit`, `BenefitType` | Benefits per employment (cost, employer-paid %, available time) | same |
| `EmploymentLeave` | Date-only leave per employment: type `Elt*`, reason `Elr*`, `leaveApproved` Y/N, approver, description | same |
| `EmploymentPayHistory`, `EmploymentPayDetail` | Per pay date gross, taxable, social/medical taxable, net, disposable, YTD, invoice; per-adjustment lines with payee and tax authority | same |
| `PayrollAdjustment` (+ `PayrollAdjustmentDetail`, `PayrollAdjustmentExempt`, `PayrollAdjustmentFedStts`, `PayrollAdjustmentStateStts`, `PayrollAdjCalcService`, `PayrollAdjCalcParameter`), `PayrollAllowance`, `PayrollStdDeduction`, `PayrollGarnishMinWage`, `WorkTypeGlOverride`, `WorkTypeRiskClass` | Earnings, deductions, taxes and garnishments by phase (`PrphBonus`, `PrphBreak`, `PrphOvertime`, `PrphDeductible`, `PrphTax`, `PrphGarnish`, `PrphExpenses`), rate brackets, exemptions, calc services, workers' comp risk classes | same |
| `UnemploymentClaim` | Claim per employment with status (status type only) | same |
| `EmploymentApplication` | Application to a position: `statusId` (status type `EmploymentApplication`, no items), referred-by enum `Earb*`, applying / referred-by / approver party | same |
| `PartySkill` | Skill type (`SkillType`, no values), rating, level, started using, years of experience | same |
| Commented out ("not yet used") | `PartyQualification`, `PartyResume`, `PerformanceReview`, `PerformanceReviewItem`, `PerformanceNote`, `PersonTraining`, `TrainingClass`, `JobRequisition`, `JobInterview` — definitions present inside XML comments, not deployed | same |
| Party records | `PartyRelationship` types `PrtEmployee`, `PrtManager`, `PrtOrgRollup`, `PrtMember`; role types `Employee`, `Contractor`, `Manager`, `OrgEmployer`; `PartyIdentification`, `PartyClassification`, `PartySetting`, `PartyContent`, `PartyNote`, `PartyContactMech` | `component/mr-mantle/entity/PartyEntities.xml` |
| Time and work | `TimeEntry` (party, facility, from/thru, hours, break hours, rate type / modifier, work type, position class, work effort, timesheet, invoice links), `Timesheet` (`TmshInProcess` / `TmshCompleted` / `TmshApproved`), `TimesheetParty`; `WorkEffort` types `WetTimeOff`, `WetEvent`, purposes `WepHoliday`, `WepTraining`; `WorkEffortParty` (with position class and position), `WorkEffortSkillStandard` | `component/mr-mantle/entity/WorkEffortEntities.xml` |
| Seed data | US federal and bank holidays as `WepHoliday` events in categories `HolidayUsaFed` / `HolidayUsaBank`; employer payroll `PartySetting` types (FLSA workweek, overtime premiums, minimum-wage checks, workers' comp); US federal and California tax adjustments with 2015 rates (some 2017); payroll and expense item types incl. `ItemReimbursement`; invoice types `InvoicePayroll`, `InvoicePayrollOther`, `InvoiceTax`, `InvoiceGarnishment` | `component/mr-mantle/data/{HolidayUsaData,PayrollData,ZapPayrollTaxInstallData,ItemTypeData}.xml`, `component/mr-mantle/entity/AccountingAccountEntities.xml` |

### Services

| Service | Purpose | Key files |
| --- | --- | --- |
| `create#Employment`, `update#Employment`, `delete#Employment`, `create#EmploymentSalary`, `check#NextPayrollTimePeriods` | Employment relationship + `Employment` row; salary rows; payroll periods ahead | `component/mr-mantle/service/mantle/humanres/EmploymentServices.xml` |
| `get#PartyEmployersAndPositionClasses` | Employers and position classes for a party (time entry) | `component/mr-mantle/service/mantle/humanres/PositionServices.xml` |
| `create#RateAmount`, `update#RateAmount` | Labor rates | `component/mr-mantle/service/mantle/humanres/RateServices.xml` |
| `get#TimePeriodEmployments`, `process#TimePeriodPay`, `process#EmploymentPay`, `get#EmploymentPayAmount`, `get#EmploymentPayDetail`, `get#TimePeriodTotalPayAmount`, `calculate#PayrollAdjustment`, `reopen#PayrollPeriod`, `approve#PeriodInvoices`, `create#PeriodPayments`, `set#PeriodPaymentDates`, `set#PeriodPaymentRefNums`, `authorize#PeriodPayments`, `deliver#PeriodPayments`, `create#PayrollInvoice`, `create/update/delete#WorkersCompRate`, `create/update#GarnishmentDetail`, `create/update/delete#PayrollAdjustmentAndDetail` | The pay run and its setup | `component/mr-mantle/service/mantle/humanres/PayrollServices.xml` |
| `get#EmploymentInfo`, `get#EmploymentWageAndTaxInfo`, `create#PeriodWageAndTaxRecords`, `get#UsaIrsW2FormData`, `generate#Efw2File`, `get#UsaIrs1099MiscFormData` | Year-end and wage reporting | `component/mr-mantle/service/mantle/humanres/PayrollDocumentServices.xml` |
| `create#PersonEmployee` | Person + contact info + optional user + `PrtEmployee` relationship | `component/mr-mantle/service/mantle/party/PartyServices.xml` |
| `store#TimeEntry`, `create#TimeEntryClockIn`, `resetAndGet#TimeEntryRates`, `get#TeamTimesheetInfo`, `upload/import#TimeSummaryFile`, `upload/import#TimeDetailFile` | Time entry, clocking, external time-clock import | `component/mr-mantle/service/mantle/work/TimeServices.xml` |
| `create#ProjectExpenseInvoice`, `create#ProjectInvoiceItems`, `create#WorkerInvoiceItems` | Project expense invoices and worker time invoices | `component/mr-mantle/service/mantle/account/InvoiceServices.xml` |
| `create#Event` | Calendar events (interviews, training sessions, holidays) | `component/mr-mantle/service/mantle/work/EventServices.xml` |

**Missing:** no services for leave requests, balances or accruals, applications and interviews, skills or certifications, reviews, approver resolution or org charts.

---

## 18. Gaps & BOSS implications

### Gaps in the reference set

- **Frappe HR is the only full-suite HR reference.** It covers every People section, including recruitment, lifecycle, shifts, leave ledger, payroll, appraisals and an employee PWA. Odoo community is strong on directory, time off, attendance, recruitment, skills and expenses, but **payroll and appraisals are Enterprise-only** (`hr_payroll`, `hr_appraisal` absent), as are `documents`, `hr_referral`, `planning` and `approvals`. Odoo also has no `hr_contract` in this version: contracts became effective-dated `hr.version` records.
- **No reference has US payroll with a UI.** Frappe's payroll is India-flavoured; Odoo community, Dolibarr and Gauzy only record pay; metasfresh's Libero payroll has no web UI. Mantle's engine is the only US payroll in the checkout, and it has no screens.
- **Reviews** are covered only by Frappe (cycles, KRAs, goals, 360 feedback) and Gauzy (OKRs); Dolibarr evaluations are skill-rank checks; Carbon and AureusERP have none.
- **Self-service** is weak everywhere but Frappe: only its PWA has check-in, requests, payslips and team approvals in one place; Odoo's equivalent is scattered across the systray, dashboards and preferences.
- **Sensitive data separation** is explicit only in Odoo (public employee model; payroll/personal tabs gated by group) and Dolibarr (salary visibility permission).
- **Course-based training** lives outside the HR apps (Frappe LMS); Carbon's quiz trainings that grant abilities are the only training-to-qualification loop inside an ERP.

### Notable gaps in the Moqui baseline

- **No People app.** The SimpleScreens HR area is two links and a labor-rates screen; employment, positions, salary, benefits, leave, skills, applications and payroll have no screens (§17).
- **Hiring leaves no employment record.** `create#PersonEmployee` creates the `PrtEmployee` relationship but no `Employment` row, so position, payroll period and tax setup are never captured from the UI.
- **Payroll engine without UI, and dated tax data.** `PayrollServices` runs pay into invoices and payments, but there is no pay-run screen, payslip, payroll setup or year-end screen, and the seeded US federal / California tax adjustments carry 2015 rates.
- **Leave is thin.** `EmploymentLeave` is date-only with a Y/N approved flag, four types and no allocations, accruals, balances, policies or services; every mature reference has all of these.
- **Many HR entities are only sketches.** `PartyQualification`, `PartyResume`, `PerformanceReview`, `PerformanceReviewItem`, `PerformanceNote`, `PersonTraining`, `TrainingClass`, `JobRequisition` and `JobInterview` are commented out; `SkillType`, `TerminationReason` and the `EmploymentApplication` status type have no values.
- **No working schedule or shift entity.** `EmplPosition.standardHoursPerWeek` is the only capacity figure; `TimeEntry` carries a facility but no geolocation.
- **Recruiting pipeline concepts are missing**: no application statuses, scorecard, offer or talent pool; no applicant role type.
- **Expenses are project-only.** MyAccount Expenses works for project members and contractors; there is no receipt capture, approver, advance or non-project claim.
- **No approver rules or generic approvals list**; approval is a per-record approver field or Y/N flag.
- **No org chart or department tree**; reporting lines and department rollups are edited only in the generic Related-parties list.

### What each reference contributes

| Reference | Take |
| --- | --- |
| Frappe HR | Scope and object model: employee PWA home with My/Team requests, workspace number cards, leave ledger, staffing-plan math, onboarding activities as project tasks, promotion/transfer documents, appraisal cycles + 360 feedback, pay-run stepper, report/chart catalogue. Poor fit: the desk tab sprawl (nine-tab ERPNext Employee form with 100+ fields), India-specific tax and benefit doctypes, nine separate workspaces |
| Odoo | Screen patterns: employee kanban/list/hierarchy views, org-chart side panel, effective-dated employee versions, time-off dashboard and accrual levels, validation types, kiosk + systray check-in, recruitment job kanban + applicant pipeline + talent pools, skills with certification expiry, receipt-first expenses. Poor fit: leave types modelled as work-entry types; activities as the only approval inbox |
| Ever Gauzy | Interview panel / calendar / criteria, OKR objectives / key results / initiatives, generic approval requests with a minimum approver count, employee kinds including AI agents. Poor fit: money-centric HR dashboard; salary as a recurring expense |
| Dolibarr | Job profile vs position split, skills comparison and evaluations, expense rules and mileage scales, leave-balance modification log. Poor fit: users-as-employees conflation |
| Carbon | Departments tree view, custom attribute categories as person tabs, abilities with recertification, quiz trainings that grant abilities, timecard toggle. Poor fit: empty stub panels (days off, overtime) |
| AureusERP | Odoo concepts rendered as plain Filament tables and forms; nothing new, and it drops the kanban pipeline |
| Frappe LMS | Course, batch, program, quiz and certificate-with-expiry model for later training delivery |
| OpenProject / Redmine | Per-user working hours and non-working times as the capacity source for Projects; department hierarchy admin; global non-working dates |
| WeCreate / resistmanagement | Proof that `EmplPositionClass` + `EmplPositionClassSkill` + dimensions + `EmploymentApplication` work as a talent and position model in Moqui |
| Moqui baseline | Employment, position, pay-grade, rate and payroll entities; the US payroll engine and year-end documents; clock-in and time entry; project expense invoices. Poor fit: a parallel payroll or position schema |

### Candidate screen inventory (IronStone People)

The screens the research points to for People's audience (HR, managers, employees). Screens other apps would also include are marked **(reused: …)** with those apps, per crosscut §3–§4; the rest are People screens. Input to design, not a design.

| Area | Screens | Primary reference | Data basis / notes |
| --- | --- | --- | --- |
| Landing & self-service | **People home** — HR KPIs (headcount, joiners/leavers, out today, open positions, pending approvals, reviews due) + section links; dashboard widgets **(reused: Insights, every app's landing page)** | Frappe workspaces / number cards | Saved finds behind each card |
| Landing & self-service | **My team** — team presence, my reports' leave / reviews / missing hours, and People's filtered version of approvals waiting **(reused: header Notifications, Projects, Purchasing, Sales, Accounting)** | Odoo department kanban + Frappe Team Requests | `PrtManager`, department `PrtOrgRollup` / `PrtEmployee` |
| Landing & self-service | **Me** — clock in/out, quick requests, my requests, balances, payslips, my profile; feeds the header Today panel | Frappe PWA home + Odoo time-off dashboard | Responsive page, not a separate app |
| Employees & org structure | **Employee 360** **(reused: Admin, Projects, Commons)** — header + Overview / Employment / Personal / Pay / Time & leave / Skills & resume / Reviews / Documents / Activity; user-account details **(reused: Admin, Commons)** | Odoo employee form + Frappe connections | `Employment`, `Employee`, `EmploymentSalary`, `EmplPositionParty`, `PartyContent`, `PartyNote`; field-level authz |
| Employees & org structure | **Directory** — cards / list / hierarchy over the contact / party record with employee fields **(reused: Commons, Admin, every app that shows a person)** | Odoo employee kanban/list + public employee | `Person` + `PartyRole(Employee)` + `PrtEmployee` |
| Employees & org structure | **Org structure & org chart** — department tree (drag re-parent, heads, counts) and reporting-line chart | Carbon / OpenProject departments + Odoo hierarchy view + Frappe org chart | `Organization` + `PrtOrgRollup`; `PrtManager`; teams `PrtMember`; work locations `Facility` |
| Employees & org structure | **Lifecycle actions** — Hire, change position / department / pay, leave of absence, separate; onboarding / offboarding checklists on the task screen **(reused: Projects, Commons, Customer Service, Sales)**; equipment assigned and returned on the facility & equipment record **(reused: Maintenance, Warehouse, Manufacturing, Commons, Accounting)**; grievances as a restricted request type **(reused: Customer Service and the other Request / case apps)** | Frappe onboarding / separation + Odoo activity plans / departure | Effective-dated Mantle rows; checklists as `WetTask` templates |
| Positions & recruiting | **Job classes, positions & pay grades** — job profiles with skills and responsibilities; seats (planned / open / filled / closed) with budget; pay bands | Dolibarr job vs position + Frappe staffing plan + Odoo job | `EmplPositionClass`, `EmplPosition`, `EmplPositionParty`, `PayGrade`, `PayGradeSalary` |
| Positions & recruiting | **Openings & pipeline** — planned positions → openings kanban → applicant pipeline per opening | Odoo recruitment + Frappe job opening | `EmplPosition` + `EmploymentApplication` + new status items; shared kanban component |
| Positions & recruiting | **Applicant 360 & interviews** — resume, interviews on the calendar **(reused: Commons, Maintenance, Projects)**, scorecards from the survey builder **(reused: Marketing, Customer Service)**, offer, hire → employee | Frappe applicant / interview / offer + Gauzy interview panel | `EmploymentApplication`, `WetEvent` interviews, `DbForm` / `FormResponse`; offer record new |
| Positions & recruiting | **Careers page** — public openings and apply form; email alias per opening via Comms | Odoo `website_hr_recruitment` + Frappe `/jobs` | Whether this is a People screen or a public website layer shared with Commerce is an open question |
| Time & leave | **Attendance & clocking** — clock in/out (header, Me, kiosk), attendance list / calendar with late / missing flags | Odoo attendance / kiosk + Frappe check-in | `TimeEntry` without work effort; `facilityId`; geolocation optional |
| Time & leave | **Working schedules & shift roster** — weekly schedules; people × days roster drawn on the calendar **(reused: Commons, Maintenance, Projects)** | Odoo working schedules + Frappe roster | New schedule / shift records; capacity source for the Projects planner |
| Time & leave | **Hours for pay** — attendance and approved timesheet hours per pay period; timesheet entry and approval **(reused: Projects, Accounting)** | Gauzy approvals + Projects research §8 | `Timesheet` (`TmshApproved`), `TimeEntry` |
| Time & leave | **Leave** — request with balance check, team calendar **(reused: Commons, Maintenance, Projects)**, allocations, holiday calendars | Odoo time off + Frappe leave ledger / PWA | `EmploymentLeave` + new leave type / allocation / ledger; `WepHoliday` event categories; PTO time entries |
| Payroll & expenses | **Compensation & pay runs** — salary / rate history; pay-run stepper; per-employee pay detail; payments; payroll setup and tax tables | Frappe payroll entry + Mantle `PayrollServices` | `process#TimePeriodPay`, payroll invoices, `create#PeriodPayments`; Accounting sees invoices |
| Payroll & expenses | **Payslips & year-end** — payslip view / print; W-2 / 1099 / EFW2 | Frappe salary slip + Mantle `PayrollDocumentServices` | `EmploymentPayHistory`, `EmploymentPayDetail` |
| Payroll & expenses | **Expense claims & advances** **(reused: Accounting)** — receipt-first capture, lines, approval, reimbursement; Accounting's version emphasizes posting and payment | Odoo expenses + Frappe expense claim / advance + MyAccount Expenses | Employee-from `Invoice` with `ItemExpense*` items, or `PrphExpenses` adjustment |
| Skills & training | **Skills matrix & certifications** — people × skills; expiring certifications; staffing lookup for Projects and Manufacturing | Odoo skills + Dolibarr compare + Carbon abilities | `PartySkill`, `EmplPositionClassSkill`, `WorkEffortSkillStandard`; `PartyQualification` once enabled |
| Skills & training | **Training** — sessions, enrolment, completion grants a qualification; quizzes from the survey builder **(reused: Marketing, Customer Service)** | Frappe training + Carbon training + Frappe LMS | `WepTraining` events; `PersonTraining` / `TrainingClass` once enabled |
| Reviews | **Reviews & goals** — review cycles, self / manager review, continuous notes, goals | Frappe appraisal + Gauzy OKRs | `PerformanceReview`, `PerformanceReviewItem`, `PerformanceNote` once enabled; goals as `WorkEffort` (parent, `percentComplete`) |
| Reports & settings | **People reports** — headcount, turnover, who's out, balances, attendance sheet, recruiting funnel, payroll register | Frappe reports / charts | Saved finds; cross-app BI in Insights |
| Reports & settings | **People settings & lookups** — HR enum lookups, leave types / accruals, schedules, payroll setup, approval rules, templates, toggles; linked from the Admin settings index | Frappe HR settings + AureusERP configuration clusters | Mantle `Enumeration` types + dedicated policy screens |

### Data-model findings

**Fits as is.** Employees are `Person` parties with `PartyRole` `Employee` and a `PartyRelationship` `PrtEmployee` to the employing internal organization; that relationship's `Employment` row holds position, termination reason/type, payroll period and work-location tax data, with per-person tax data on `Employee`, and `EmploymentSalary`, `EmploymentBenefit`, `EmploymentLeave`, `EmploymentPayHistory` / `EmploymentPayDetail` hanging off the employment. Org units are `Organization` parties linked by `PrtOrgRollup`; managers by `PrtManager`; teams by `PrtMember`; work locations are `Facility`. Jobs are `EmplPositionClass` (+ `EmplPositionClassSkill`, `EmplClassResponsibility`), seats are `EmplPosition` (org, class, `PayGrade`, salaried/hourly, standard hours, budget item, status) filled through `EmplPositionParty`. Recruiting starts from `EmploymentApplication`. Time is `TimeEntry` / `Timesheet` with `RateAmount` and the PTO rate types; payroll is `PayrollServices` producing payroll invoices and payments, configured by `PayrollAdjustment` and related tables plus employer `PartySetting` values. Skills are `PartySkill`; holidays are `WepHoliday` events by `WorkEffortCategory`; training sessions are `WepTraining` events.

**Candidates to enable in Mantle (definitions exist, commented out).** `PartyQualification` (certifications with from/thru and verification), `PartyResume`, `PersonTraining` + `TrainingClass`, `PerformanceReview` + `PerformanceReviewItem` + `PerformanceNote`. `JobRequisition` and `JobInterview` may not be needed: a planned `EmplPosition` plus an approval and a calendar event could cover them.

**Existing records to seed or extend.** Status items and a `StatusFlow` for `EmploymentApplication`; values for `SkillType` and `TerminationReason`; an applicant `RoleType`; a `statusId` on `EmploymentLeave` (requested / approved / refused / cancelled) in place of the Y/N flag, plus hours or half-day support (or a separate request record, see Open questions); current-year payroll tax adjustments; `create#PersonEmployee` (or a BOSS hire service) also creating the `Employment` row.

**Where new records look necessary.** Leave type policy (unit, requires allocation, validation steps, carry-over cap, negative allowed), leave allocations / accrual rules and a leave ledger; working schedules (weekly lines) and shifts, linked to employment or position; an offer record that pre-fills `Employment` / `EmploymentSalary` on hire; review cycles and templates; approver rules (per type, department and employee override, minimum approvers). Checklist templates can be task templates on the reused task screen and questionnaires can come from the reused survey builder, so neither appears to need a People entity.

### Sequencing notes

**Cheap on the baseline.** Org structure and reporting lines (`PrtOrgRollup`, `PrtManager`, `PrtMember` exist and are edited today only in the generic Related-parties list); job classes, positions and pay grades (entities exist, screens only); attendance over `TimeEntry` (clock-in service and screens exist); expense claims as employee-from invoices (the invoice status flow and MyAccount Expenses exist, project-only); compensation, pay runs and payslips (`PayrollServices` and `EmploymentPayHistory` / `EmploymentPayDetail` exist, US only); year-end documents (`PayrollDocumentServices` exists); onboarding checklists (task templates on the reused task screen, no People entity).

**Dependencies.**

- Almost everything on the Employee 360, plus payroll, leave and positions, depends on an `Employment` row, which `create#PersonEmployee` does not create; a hire action or service that creates it comes before them.
- Pay runs depend on current tax data (the seeded adjustments carry 2015 rates) and on `Employee` / `Employment` tax setup; year-end documents are needed before the first year-end of a live pay run.
- Leave depends on a status on `EmploymentLeave` (or a request record), leave types with policy and a ledger; accrual plans depend on the ledger; the team calendar depends on holiday calendars, which the `WepHoliday` seed data already shapes.
- People's version of the approvals list depends on a `statusId` and `StatusFlow` on each transaction (leave is a Y/N flag today) and on approver rules; expense, leave and requisition approvals all wait on it.
- The Me page gathers clock in/out, leave, expenses and payslips, so it follows those pieces.
- Recruiting depends on application status items, an applicant role, an offer record, the reused survey builder (scorecards) and calendar (interviews); the careers page also depends on the open question of a public web layer.
- Reviews, certifications and training depend on enabling the commented-out Mantle entities.
- Working schedules and shift rosters need new records; kiosk mode and geolocation need new fields on `TimeEntry` or a check-in log.
- Non-US payroll has no engine in the checkout; Odoo's work-entry export (hours and pay items to an external provider) is the pattern for that case.

### Open questions

- **Standalone approvals inbox.** Crosscut §3 makes approvals waiting a reused screen, listed suite-wide in the header Notifications panel with People's filtered version on My team and People home. HR officers who clear dozens of leave and expense items a day may also need a full-page list with balance context and bulk actions; is that a mode of the same reused list or a separate screen (crosscut §8)?
- **Requisitions.** Model a requisition as a planned `EmplPosition` with an approval (the option the evidence here favors), enable the commented-out `JobRequisition`, or use a `Request` of a new type on the reused Request / case record?
- **Enabling commented-out HR entities.** Should `PartyQualification`, `PartyResume`, `PersonTraining`, `TrainingClass` and the `PerformanceReview` family be enabled in mr-mantle, or defined as BOSS entities?
- **Leave request record.** Add `statusId` and hours to `EmploymentLeave` (its key, employment + `fromDate`, allows one request per start day), or add a new leave-request entity and keep `EmploymentLeave` as the approved record?
- **Careers page.** Public screens under the People app, or part of a public website layer that Commerce's storefront would also use (crosscut §8, public pages)?
- **Me page.** Commons grew from My Account; is HR self-service a People "Me" screen, a section of the Commons personal area, or one reused screen included in both (crosscut §8)?
- **Grievances** as a restricted request type on the reused Request / case record — is that confidentiality enough, or is a separate HR record needed?
- **Goals.** Goals as `WorkEffort` rows shown in the reused task screen, or a dedicated goal screen over the same records?

**Bottom line.** The evidence points to IronStone People as **Frappe HR's coverage on Mantle's data with Odoo's interaction quality**: Frappe defines the scope (self-service, lifecycle documents, leave ledger, appraisal cycles, pay runs, reports), Odoo supplies the screen patterns (directory views, org chart, time-off dashboard, recruitment kanban, kiosk), and Mantle already supplies most of the data model plus a working US payroll engine that the references lack. The gap is mostly UI over existing entities, a handful of Mantle definitions to enable (qualifications, training, reviews), and a short list of new records — leave policy / allocations / ledger, working schedules / shifts, applicant statuses and offers, review cycles. Three surfaces carry the most traffic because everyone touches them: the **Me** page, People's version of the reused **approvals** list and the **Employee 360**.
