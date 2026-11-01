# IronStone BOSS — Maintenance app research

Oct 18, 2026

Reviewed against sources Oct 18, 2026; follows [research-crosscut.md](research-crosscut.md).

Deeper research pass on the **IronStone Maintenance** app (facilities, equipment & assets,
maintenance work orders, and facility and equipment scheduling admin), cataloguing every
relevant screen/page found in the reference apps. Companion to
[3p-app-reference.md](3p-app-reference.md); feeds the Maintenance row in
[initial-design.md](initial-design.md) (Facilities · Equipment & assets · Maintenance work
orders · Facility and equipment scheduling admin). Reused screens it covers (crosscut
§3–§4): the **Facility & equipment record**, which Maintenance includes as the equipment
register, maintenance history and facility tree, and which Warehouse (storage locations
and setup), Manufacturing (production equipment, work centers), Commons (schedules and
booking) and Accounting (fixed-asset books) also include; **Calendar & schedules**, where
Maintenance's version holds the booking policies, approvals and blackout windows (decided
in initial-design: schedules in Commons, their administration in Maintenance); and fixed
assets on the same `Asset`, included in Maintenance (register, lifecycle, custodian) and
Accounting (depreciation, capitalization, disposal).

**Organization.** Sorted by functional area (not by app): all equipment registers
together, all maintenance-request screens together, etc. Within each area, sub-tables per
reference app. Style mirrors [research-manufacturing.md](research-manufacturing.md) and
[research-warehouse.md](research-warehouse.md).

**Scope.** Business UI only: screens, lists, forms, kanban/calendar boards, dialogs,
mobile/kiosk flows and report pages a facilities or equipment manager, technician or
requester actually touches. Depreciation math, scheduling algorithms and accounting
postings are noted only where they shape a screen. Warehouse locations, production
routing and fixed-asset accounting are covered only where Maintenance links into them.

**Path conventions.** Every backticked path resolves against the checkout for its prefix
below (per [research-crosscut.md](research-crosscut.md) §1; checkouts are under
`/home/jonesde/work/moquiwork/`). A bare tail in a table row is relative to the directory
named earlier in the same cell or row.

| Prefix | Checkout | Paths start with |
| --- | --- | --- |
| **Odoo** | `3p_other/odoo` (bundle: `odoo/` repo + `industry/` repo) | `odoo/addons/<addon>/…` (addons `maintenance`, `hr_maintenance`, `stock_maintenance`, `fleet`, `fleet_maintenance`, `hr_fleet`, `account_fleet`, `repair`, `mrp_repair`, `purchase_repair`, `pos_repair`, `resource`); `industry/<package>/` for verticals |
| **ERPNext** | `3p_other/frappe/erpnext` | `erpnext/<module>/…`: assets and asset maintenance in `erpnext/assets/`, customer-equipment service in `erpnext/maintenance/`, downtime in `erpnext/manufacturing/`, warranty in `erpnext/support/` |
| **Frappe HR** | `3p_other/frappe/hrms` | `hrms/<area>/doctype/…` |
| **AureusERP** | `3p_other/aureuserp` | `plugins/webkul/maintenance/…` (Filament under `src/Filament/`, migrations under `database/migrations/`) |
| **Carbon** (Carbon MES for `apps/mes`) | `3p_other/carbon` | `apps/erp/app/{modules,routes}/…` (maintenance, locations, failure modes in `modules/resources/`, routes `routes/x+/{resources+,maintenance+}/`; fixed assets and fleet in `modules/accounting/ui/FixedAssets/`, routes `routes/x+/{fixed-asset+,accounting+}/`), MES `apps/mes/app/…`, `packages/…` |
| **Dolibarr** | `3p_other/dolibarr` | `htdocs/<module>/…` (`asset`, `fichinter`, `resource`, `bookcal`) |
| **Ever Gauzy** | `3p_other/ever-co/ever-gauzy` | `apps/gauzy/src/app/pages/…`, `packages/…` (dialogs `packages/ui-core/shared/src/lib/equipment/`, models `packages/contracts/src/lib/`) |
| **metasfresh** | `3p_other/metasfresh` | `backend/de.metas.<module>/…` (`de.metas.servicerepair.{base,webui}`, legacy models in `de.metas.adempiere.adempiere/base/src/main/java-gen/org/compiere/model/`) |
| **Nextcloud** | `3p_other/nextcloud` (bundle of app repos) | `calendar/src/…`; bundled server code `server/apps/<app>/…`, `server/lib/…` |
| **Zimbra** | `3p_other/Zimbra` (bundle) | `zm-admin-console/WebRoot/js/zimbraAdmin/…` |
| **Moqui baseline** | `mr-moqui-base/runtime` | `component/mr-marble/screen/SimpleScreens/…` (also `component/mr-marble/screen/MyAccount/…`), `component/mr-marble/screen/…`, `component/mr-mantle/entity/…`, `component/mr-mantle/service/mantle/…`, `component/mr-boss/screen/…` |

**Not used here** (checked, nothing relevant): Twenty, Akaunting and Ever Teams (only
"maintenance mode" pages for the app itself, not equipment); Redmine; OpenProject
(`modules/resource_management/` allocates people, not equipment or rooms); Frappe
Helpdesk, Frappe suite and the other Frappe apps; Dolibarr community modules (e-invoicing,
payment gateways, security only). Frappe HR only adds a **Full and Final Asset** row for
assets returned at employee exit (`hrms/hr/doctype/full_and_final_asset/`). The Moqui
components in `3p_moqui/` (Moqui Sales, Moqui WorkManagement, WeCreate, coarchy,
resistmanagement, ServiceJobMonitor, ridgecrest) have no asset, equipment, facility or
maintenance screens.

Sections: [1 home & work queues](#1-maintenance-home--work-queues) · [2 facilities & locations](#2-facilities--locations) · [3 equipment & asset register](#3-equipment--asset-register) · [4 requests / work orders](#4-maintenance-requests--work-orders) · [5 preventive & schedules](#5-preventive-maintenance--schedules) · [6 technician & field execution](#6-technician--mobile--field-execution) · [7 booking & scheduling admin](#7-facility--equipment-booking--scheduling-admin) · [8 fixed assets](#8-fixed-assets-lifecycle) · [9 fleet](#9-fleet--vehicles) · [10 failure, downtime & reliability](#10-failure-modes-downtime--reliability) · [11 reports](#11-reports--analytics) · [12 configuration](#12-configuration--settings) · [13 cross-app surfaces](#13-cross-app-surfaces) · [14 current Moqui baseline](#14-current-moqui-baseline-mr-marble--marbleerp--mantle) · [15 gaps & BOSS implications](#15-gaps--boss-implications)

---

## 1. Maintenance home & work queues

### Odoo — team kanban dashboard; request kanban is the work queue

The **Maintenance** app opens on a team dashboard (`maintenance.team` kanban, action path
`/maintenance`). Each team card carries live counters that deep-link into the filtered
request queue. The request kanban grouped by stage is where technicians actually work.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Maintenance root menu | **Dashboard** · **Maintenance** (Maintenance Requests) · **Equipment** · **Reporting** (Maintenance Requests analysis) · a second **Reporting** menu holding action-less **Overall Equipment Effectiveness (OEE)** and **Losses Analysis** slots that the Enterprise `mrp_maintenance` addon would fill (absent here, so hidden) · **Configuration** (Settings for `base.group_system`, Maintenance Teams, Equipment Categories, Maintenance Stages in debug mode); root gated by `base.group_user_regular`, items by `group_equipment_manager` / `base.group_user` | `odoo/addons/maintenance/views/maintenance_views.xml` (menuitems `menu_maintenance_title`, `menu_m_dashboard`, `menu_m_request`, `menu_m_request_form`, `menu_equipment_form`, `menu_m_reports`, `menu_m_reports_oee`, `menu_m_reports_losses`, `maintenance_reporting`, `menu_maintenance_configuration`, `menu_maintenance_teams`, `menu_maintenance_cat`, `menu_maintenance_stage_configuration`); `odoo/addons/maintenance/views/res_config_settings_views.xml` (`menu_maintenance_config`) |
| Team dashboard | Kanban of teams; card shows **N To Do** button plus conditional links: scheduled count (opens calendar), high priority, changes requested, unscheduled; card menu has Requests → All / To Do / Done / Cancelled and Reporting → Maintenance Requests; color picker | `odoo/addons/maintenance/views/maintenance_views.xml` (`maintenance_team_kanban`, action `maintenance_dashboard_action`, drill action `hr_equipment_todo_request_action_from_dashboard`); counters `todo_request_count*` on `maintenance.team` in `odoo/addons/maintenance/models/maintenance.py`; styling `odoo/addons/maintenance/static/src/scss/maintenance_team_dashboard.scss` |
| Request queue | `maintenance.request` in kanban (default group by stage, card shows priority, assignees, equipment, activity), list, form, pivot, graph, calendar and activity views; search filters **My Maintenances**, Open/Done/Cancelled, In Progress/Changes Requested/Approved, **High-priority**, **Unscheduled**, unread messages, activity filters; group by Assigned to, Category, Stage, Created By | `odoo/addons/maintenance/views/maintenance_views.xml` (`hr_equipment_request_view_kanban`, `hr_equipment_request_view_card`, `hr_equipment_request_view_tree`, `hr_equipment_request_view_search`, `maintenance_request_view_activity`, action `hr_equipment_request_action`) |
| Activity view | Per-request activities by assignee (avatar, request name, equipment); seeded activity type **Maintenance Request**; Activity Types config action | `odoo/addons/maintenance/views/maintenance_views.xml` (`maintenance_request_view_activity`); `odoo/addons/maintenance/data/mail_activity_type_data.xml`; `odoo/addons/maintenance/views/mail_activity_views.xml` |

### ERPNext — Assets workspace with number cards; maintenance is a sidebar section

There is no separate maintenance app: equipment maintenance lives inside the **Assets**
module. The workspace is an accounting-flavored landing page (value cards and charts);
maintenance queues are the **Asset Maintenance Log** list and calendar.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Assets sidebar | Home · Dashboard · Asset · Depreciation Schedule · Asset Movement · Fixed Asset Register · **Reports** (Asset Depreciation Ledger, Asset Depreciations and Balances, Asset Activity) · **Value Changes** (Asset Capitalization, Asset Value Adjustment) · **Maintenance** (Asset Maintenance, Asset Maintenance Log, Asset Repair, Asset Maintenance Team) · **Setup** (Asset Category, Location, Accounts Settings) | `erpnext/assets/sidebar/assets/assets.json` |
| Assets workspace | Number cards **Total Assets**, **Asset Value**, **New Assets (This Year)**; chart **Asset Value Analytics**; report links incl. **Asset Maintenance Report**; setup links Item, Asset Shift Factor, Asset Shift Allocation | `erpnext/assets/workspace/assets/assets.json`; `assets/number_card/{total_assets,asset_value,new_assets_(this_year)}/`; `assets/dashboard_chart/asset_value_analytics/` |
| Asset dashboard | Charts Asset Value Analytics, **Category-wise Asset Value**, **Location-wise Asset Value** plus the three cards | `erpnext/assets/assets_dashboard/asset/asset.json`; `assets/dashboard_chart/{category_wise_asset_value,location_wise_asset_value}/` |
| Maintenance work queue | Asset Maintenance Log list (status Planned/Completed/Cancelled/Overdue, due date, assignee) and a **calendar** on `due_date` filterable by Asset Maintenance | `erpnext/assets/doctype/asset_maintenance_log/asset_maintenance_log_list.js`, `asset_maintenance_log_calendar.js` |

### AureusERP — Filament clone of Odoo maintenance; requests list first, calendar second

Two clusters: **Maintenance** (Requests resource navigation sort 0, Calendar page sort 1) and
**Configurations** (Teams, Equipment Categories, Stages), plus a top-level **Equipment**
resource. No team dashboard and no KPI widgets beyond the calendar.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Maintenance calendar page | Full-calendar widget of requests on `scheduled_at`; event popover shows name, stage, technician, priority, type; create/edit actions from the calendar | `plugins/webkul/maintenance/src/Filament/Clusters/Maintenance/Pages/Calendar.php`, `plugins/webkul/maintenance/src/Filament/Widgets/MaintenanceCalendarWidget.php` |
| Requests list | Columns name, created by, technician, category, stage, company; group by Stage, Assigned to, Category, Created by | `plugins/webkul/maintenance/src/Filament/Clusters/Maintenance/Resources/MaintenanceRequestResource/{Tables/MaintenanceRequestsTable,Pages/ListMaintenanceRequests}.php` |

### Carbon — Resources home with maintenance KPIs; dispatch list is the queue

Maintenance lives in the **Resources** module next to work centers, processes and
training. Its landing page is a maintenance dashboard; the dispatch table is the queue.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Resources sidebar | **Maintenance** (Dispatches, Schedules, Failure Modes) · **Infrastructure** (Locations, Processes, Work Centers) · **People** (Abilities, Training, Assignments, Suggestions) | `apps/erp/app/modules/resources/ui/useResourcesSubmodules.tsx` |
| Resources dashboard | Count tiles **Open Dispatches**, **Open Scheduled**, **Open Reactive** (each with a View link); KPI card with selectable metric (**Mean Time To Repair**, **Mean Time Between Failures**, **Spare Part Cost**, **Worst Performing Machines**, **Spare Part Consumption**), work-center filter, bar chart, **Export CSV**; lists **Recently Created** and **Assigned to Me** | `apps/erp/app/routes/x+/resources+/_index.tsx`; `MaintenanceKPIs` in `apps/erp/app/modules/resources/resources.models.ts` |
| Dispatches table | Columns Dispatch ID, Work Center, Source, Status, Priority, OEE Impact, Planned Start, Assignee, Actual and Suspected Failure Mode, Created/Updated By and At; filters on status and priority | `apps/erp/app/modules/resources/ui/Maintenance/MaintenanceDispatchesTable.tsx`; route `apps/erp/app/routes/x+/resources+/maintenance.tsx` |

**BOSS implications.** The references point to a landing page with team or queue cards
with counters that open a filtered work order list (Odoo), plus Carbon's
open/scheduled/reactive tiles and a KPI strip. The list and board are the real work queue;
"my work" and unscheduled filters are the most used.

---

## 2. Facilities & locations

### Odoo — no facility registry; equipment points at a stock location

Core maintenance has no site/building/room concept. `stock_maintenance` adds a
"Used in location" field (internal `stock.location`) and an equipment-count smart button
on the location form, so the warehouse location tree doubles as the facility tree. Only
the Enterprise-dependent `property_assets_distribution` industry package models buildings.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Equipment location field | **Used in location** (`location_id`, domain `usage = internal`) on the equipment form; serial-number smart button linking to the matching lot | `odoo/addons/stock_maintenance/views/maintenance_views.xml` (`maintenance_stock_equipment_view_form`); `odoo/addons/stock_maintenance/models/maintenance.py` |
| Location → equipment | Smart button **Equipment** on the stock location form (`action_view_equipments_records`) | `odoo/addons/stock_maintenance/views/stock_location.xml` (`stock_location_form_maintenance_equipments`); `odoo/addons/stock_maintenance/models/stock_location.py` (`equipment_count`) |
| Vehicle location | Free-text `location` (garage) on vehicles | `odoo/addons/fleet/models/fleet_vehicle.py` |
| Buildings and units (industry) | `property_assets_distribution` Studio models: **Buildings** (name, address, tags) → **Property** units (building, type, floor, area, current owner, tenants, accounts) with **Meters** and **Meter Readings** (meter, date, property, quantity, usage, attachment) and cost **Distribution Keys**; needs Enterprise `web_studio` and `sale_subscription` | `industry/property_assets_distribution/data/{ir_model.xml,ir_model_fields.xml,x_meters.xml}` |

### ERPNext — `Location` tree for assets (geo + area)

`Location` is a nested-set tree used only by assets (warehouses are separate). It is the
closest reference for a facility/site/building/room hierarchy in Maintenance.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Location tree | Tree view with **Parent Location**, **Is Group**, **Is Container**; details: Latitude, Longitude, Area + Area UOM, and a geolocation map field | `erpnext/assets/doctype/location/location.json`, `location_tree.js`, `location.js` |
| Location on asset | Asset has required **Location**; also Custodian (Employee), Department, Cost Center | `erpnext/assets/doctype/asset/asset.json` |
| Location-wise value | Dashboard chart of asset value per location | `erpnext/assets/dashboard_chart/location_wise_asset_value/` |

### Carbon — company Locations (sites) with address and timezone

`Location` is a site (plant/office) used by work centers, inventory and dispatches;
there is no building/room hierarchy below it.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Locations list/form | Location Name, Code, address (autocomplete; City required), **Timezone**, custom fields; the validator accepts Latitude/Longitude (both or neither) but the form inputs are commented out | `apps/erp/app/modules/resources/ui/Locations/{LocationsTable.tsx,LocationForm.tsx}`; routes `apps/erp/app/routes/x+/resources+/locations*.tsx`; `locationValidator` in `resources.models.ts` |
| Work centers per location | Work Centers sit under Infrastructure, each with a location and a list of the fixed assets that serve it (section 3) | `apps/erp/app/modules/resources/ui/WorkCenters/WorkCenterForm.tsx`; `apps/erp/app/routes/x+/resources+/work-centers*.tsx` |

### Nextcloud / Zimbra — room metadata, not a facility tree

Both describe a bookable room by flat attributes rather than a hierarchy: Zimbra
**Site / Building / Floor / Room / Capacity** on a resource account; Nextcloud building
name/address/story, room number, room type, seating capacity and features. Useful as the
attribute set for a Room-type facility (details in section 7).

**BOSS implications.** The Mantle `Facility` tree (`parentFacilityId`, types Building /
Floor / Room / Plant …) fits as the facility register, with ERPNext's tree view and
geo/area as the closest model. Storage locations inside a facility are part of the same
reused facility record, the part Warehouse emphasizes; Maintenance's version would add
room attributes (capacity, features) taken from Zimbra and Nextcloud.

---

## 3. Equipment & asset register

### Odoo — `maintenance.equipment`: light registry focused on who has it and how it fails

Equipment is not a product or a fixed asset; it is its own model with owner, technician
and failure statistics. Assignment target is pluggable (`equipment_assign_to`): employee,
department (hr_maintenance), vehicle (fleet_maintenance) or other.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Equipment list/kanban | Kanban (default) and list: name, owner, serial, technician, category, vendor (hidden), company, activity; search **My Equipment**, Assigned / Unassigned, **Under Maintenance** (open request count), Archived; group by Technician, Category, Owner, Vendor, Properties | `odoo/addons/maintenance/views/maintenance_views.xml` (`hr_equipment_view_kanban`, `hr_equipment_view_tree`, `hr_equipment_view_search`, action `hr_equipment_action` path `/equipments`) |
| Equipment form | Smart button **Maintenance** (request count, opens requests filtered to the equipment); archived ribbon; header: Category, Company, Used By (`equipment_assign_to`, hidden until `hr_maintenance` or `fleet_maintenance` adds choices), Owner, Maintenance Team, Technician, Assigned Date and Scrap Date (debug mode only); custom **properties** per category; tabs **Description**, **Product Information** (Vendor, Vendor Reference, Model, Serial Number, Effective Date, Cost, Warranty Expiration Date), **Maintenance** (Expected MTBF, MTBF, Estimated Next Failure, Latest Failure, MTTR); chatter | `odoo/addons/maintenance/views/maintenance_views.xml` (`hr_equipment_view_form`); `odoo/addons/maintenance/models/maintenance.py` (`maintenance.equipment`, `maintenance.mixin` with `expected_mtbf`, `mtbf`, `mttr`, `estimated_next_failure`, `latest_failure_date`, `effective_date`) |
| Employee / department assignment | Adds **Assigned Employee** / **Assigned Department**; employee form smart button **Equipment** (count); public employee form too; request "Created By" becomes employee and the equipment dropdown filters to that employee's equipment; departure wizard unassigns all equipment and posts chatter | `odoo/addons/hr_maintenance/models/equipment.py`, `odoo/addons/hr_maintenance/views/hr_views.xml` (`hr_employee_view_form`, `hr_employee_public_view_form`), `odoo/addons/hr_maintenance/views/maintenance_views.xml`, `odoo/addons/hr_maintenance/models/hr_employee_departure.py` |
| Vehicle assignment | **Used By = Vehicle** with `vehicle_id`; vehicle form smart button **Equipment Assigned**; equipment search group by Vehicle | `odoo/addons/fleet_maintenance/views/{maintenance_equipment_views.xml,fleet_vehicle_views.xml}`, `odoo/addons/fleet_maintenance/models/maintenance_equipment.py` |
| Equipment categories | Category form with smart buttons **Equipment** and **Maintenance**, Responsible (technician), note; list and kanban | `odoo/addons/maintenance/views/maintenance_views.xml` (`hr_equipment_category_view_form`, `hr_equipment_category_view_tree`, `view_maintenance_equipment_category_kanban`, action `hr_equipment_category_action`) |

### ERPNext — `Asset` is the financial fixed asset; maintenance attaches to it

Every maintainable thing is an `Asset` tied to an Item and an Asset Category; the form is
dominated by purchase and depreciation. `Maintenance Required` toggles maintenance.
Customer-owned serialized goods are a separate track (Serial No + Warranty Claim).

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Asset list | Status indicators Draft, Submitted, Partially/Fully Depreciated, Sold, Scrapped, Capitalized, Work In Progress, **In Maintenance**, **Out of Order**, Issue, Receipt; bulk action **Make Asset Movement**. Status is set by the documents: an Asset Maintenance plan puts the asset **In Maintenance**, a pending Asset Repair puts it **Out of Order** | `erpnext/assets/doctype/asset/{asset_list.js,asset.json,asset.py}`; `erpnext/assets/doctype/asset_repair/asset_repair.py` |
| Asset form | Asset Name, Item Code, Asset Category, Asset Type (Existing/Composite Asset/Composite Component), Asset Owner (Company/Supplier/Customer), Location, Custodian (Employee), Department, Cost Center, Purchase Date, Available for Use Date, Asset Quantity, Split From; **Insurance** section (policy, insurer, insured value, start/end, comprehensive); **Maintenance Required**; tabs Depreciation, More Info, Connections (Asset Movement); buttons **Transfer Asset**, **Maintain Asset**, **Asset Repair**, **Asset Value Adjustment**, **Capitalize Asset**, **Split Asset**, **Sell Asset**, **Scrap Asset** / **Restore Asset**, **Depreciation Entry**, Accounting Ledger | `erpnext/assets/doctype/asset/asset.json`, `asset.js`, `asset_dashboard.py` |
| Asset Category | Name, Finance Books, Accounts per company, Enable Capital Work in Progress Accounting, Non Depreciable Category | `erpnext/assets/doctype/asset_category/asset_category.json` |
| Asset Activity | Append-only activity log (asset, subject, date, user) and a Report Builder report | `erpnext/assets/doctype/asset_activity/asset_activity.json`, `assets/report/asset_activity/asset_activity.json` |
| Serial No / Warranty Claim | Customer-side serial with warranty period, warranty and AMC expiry dates; claim with Status Open/Work In Progress/Closed/Cancelled, Warranty / AMC Status, resolution | `erpnext/stock/doctype/serial_no/`, `erpnext/support/doctype/warranty_claim/warranty_claim.json` |

### AureusERP — Odoo-shaped equipment record

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Equipment list/form/view | Name, category, company, owner, maintenance team, technician, vendor + vendor ref, model, serial no, **location** (free text), effective date, cost, warranty date, expected MTBF, note; stored counters `maintenance_count`, `maintenance_open_count`; view page with Edit | `plugins/webkul/maintenance/src/Filament/Resources/EquipmentResource/{Schemas/EquipmentForm.php,Schemas/EquipmentInfolist.php,Tables/EquipmentTable.php,Pages/}`; `plugins/webkul/maintenance/database/migrations/2026_05_18_000004_create_maintenance_equipments_table.php` |
| Equipment categories | Name, note, technician, company; list/create/edit/view pages | `plugins/webkul/maintenance/src/Filament/Clusters/Configurations/Resources/EquipmentCategoryResource/` |

### metasfresh — legacy ADempiere `A_Asset` with maintenance dates

No dedicated equipment screens; the inherited `A_Asset` table (generic window) has
parent asset, product, serial/lot, locator, business partner/location, owned / in
possession, lease partner and termination, guarantee date, use life months/years/units,
and **LastMaintenanceDate / NextMaintenenceDate / LastMaintenanceUnit /
NextMaintenenceUnit / LastMaintenanceNote** — a meter-or-date PM hint without a plan.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Asset (generic window) | Columns as above | `backend/de.metas.adempiere.adempiere/base/src/main/java-gen/org/compiere/model/I_A_Asset.java` |
| Resource unavailability | Resource with DateFrom / DateTo unavailable windows (production resources) | `backend/de.metas.adempiere.adempiere/base/src/main/java-gen/org/compiere/model/I_S_ResourceUnAvailable.java` |

### Carbon — no equipment register; the work center is the machine

Maintenance targets **work centers**; the work-center form lists linked **fixed assets**
(hyperlinked to the asset) so the physical machine record lives in Accounting
(section 8). There is no separate equipment list with technician, warranty or meters.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Work center ↔ fixed asset | Work-center edit form has a **Capital Cost** table of the fixed assets serving it (asset link, name, net book value, monthly depreciation); fixed-asset form has Location and Work Center fields | `apps/erp/app/modules/resources/ui/WorkCenters/WorkCenterForm.tsx`; `apps/erp/app/modules/accounting/ui/FixedAssets/FixedAssetForm.tsx` |

### Ever Gauzy — equipment registry built for sharing

Equipment list with type, serial, manufactured year, initial cost, max share period and
auto-approve; no maintenance fields (section 7).

**BOSS implications.** A candidate Equipment 360 is the Mantle `Asset` (type
`AstTpEquipment`) with Odoo's people fields (owner, team, technician, assigned to
employee/department), vendor and warranty, MTBF/MTTR, and ERPNext's insurance and
lifecycle actions. Customer-owned serials (ERPNext Serial No + Warranty Claim) are a
separate track.

---

## 4. Maintenance requests / work orders

### Odoo — `maintenance.request`: one record for corrective and preventive, stage-driven

A request is a lightweight ticket: subject, equipment, team, assignees, planned window
and a configurable stage pipeline. Parts, labor cost and invoicing are not on it; those
belong to the separate **Repairs** app (`repair.order`), which is product/customer-oriented.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Request form | Header: **Cancel**, **Reopen Request**, clickable stage statusbar; title (e.g. "Screen not working"), **priority** stars (Very Low/Low/Normal/High), `state` widget (In Progress, Changes Requested, Approved, Done, Cancelled — the kanban-state light); fields **Equipment** (required), Category, Close Date (when done), Requested By (hidden in core; `hr_maintenance` shows it as the employee **Created By**), **Maintenance Type** radio (Corrective / Preventive), request properties, **Team**, **Assignees** (many users), **Planned Date** range (`schedule_date`–`schedule_end`; stored `duration` in hours is computed from it); recurrence block for preventive; tabs **Notes**, **Instructions** (HTML); chatter | `odoo/addons/maintenance/views/maintenance_views.xml` (`hr_equipment_request_view_form`); `odoo/addons/maintenance/models/maintenance.py` (`maintenance.request`: `stage_id`, `priority`, `state`, `maintenance_type`, `schedule_date`, `schedule_end`, `duration`, `instruction_text`, `close_date`); state widget `odoo/addons/maintenance/static/src/widgets/maintenance_request_state_selection.js` |
| Request from equipment / category | Same views scoped by `equipment_id` or category, defaulting team and company | `odoo/addons/maintenance/views/maintenance_views.xml` (`hr_equipment_request_action_from_equipment`, `hr_equipment_request_action_link`) |
| Email-in requests | Each team has a mail alias; inbound email creates a request | `odoo/addons/maintenance/views/maintenance_views.xml` (`maintenance_team_view_form` alias fields); `maintenance.team` inherits `mail.alias.mixin` |
| Repair order (Repairs app) | `repair.order` states New / Confirmed / Done / Cancelled (**Confirm Repair** then **End Repair**); fields product, lot/serial, customer, **Under Warranty**, scheduled date, responsible, tags, priority, parts availability (available / expected / late); tabs **Parts** (add/remove/recycle lines via `repair_line_type`, **Catalog** picker, per-line deadline and lots), **Services** (with its own catalog), **Repair Notes**; buttons **Confirm Repair**, **End Repair**, **Reserve** (Unreserve is a list action), **Quote** (create sale order), **Invoice**, Set to Draft, Cancel; smart buttons Product Moves, Sale Order, Invoices; list (default), mobile kanban, graph, pivot and activity views; a repair operation-type kanban card in Inventory | `odoo/addons/repair/views/repair_views.xml` (`view_repair_order_form`, `view_repair_order_tree`, `view_repair_kanban`, `view_repair_order_form_filter`, `view_repair_graph`, `view_repair_pivot`, menus `menu_repair_order`, `repair_order_menu`, `repair_menu_reporting`, `repair_menu_config`, `repair_menu_tag`); `odoo/addons/repair/models/repair.py`; consumption warning `odoo/addons/repair/wizard/repair_consumption_warning_views.xml`; repair picking-type dashboard `odoo/addons/repair/views/stock_picking_views.xml` (`stock_repair_type_kanban`) |
| Repair bridges | MO ↔ repair smart buttons (**Repairs** / **Manufacturing**), PO ↔ repair (**Repair Orders** / **Purchase Orders**); POS repair settles repair sale orders at the till | `odoo/addons/mrp_repair/views/{production_views.xml,repair_views.xml}`; `odoo/addons/purchase_repair/views/{purchase_views.xml,repair_views.xml}`; `odoo/addons/pos_repair/models/` |

### ERPNext — Asset Repair (corrective) is a submittable cost document

Corrective work is an **Asset Repair**: failure date, downtime, error description,
actions performed, consumed stock items and purchase invoices, with optional
capitalization of the repair cost. There is no request/triage step before it.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Asset Repair | Asset, Failure Date, Completion Date, **Repair Status** (Pending/Completed/Cancelled), Error Description, Actions Performed, **Downtime**, Repair Cost, **Stock Items** consumed (serial/batch picker), **Repair Purchase Invoices**, Total Repair Cost, **Capitalize Repair Cost** + Increase In Asset Life (Months), Cost Center, Project; Accounting Ledger view | `erpnext/assets/doctype/asset_repair/asset_repair.json`, `asset_repair.js`; child tables `asset_repair_consumed_item/`, `asset_repair_purchase_invoice/` |
| Maintenance Visit (customer) | After-sales visit to a customer: Maintenance Date/Time, **Maintenance Type** (Scheduled/Unscheduled/Breakdown), Completion Status (Partially/Fully Completed), Purposes table (item, serial, sales person, work done, against document), Customer Feedback; **Get Items From** Maintenance Schedule / Sales Order / **Warranty Claim** | `erpnext/maintenance/doctype/maintenance_visit/maintenance_visit.json`, `maintenance_visit.js`; `maintenance_visit_purpose/` |
| Warranty Claim | Customer issue against a serial no; Under Warranty/Out of Warranty/Under AMC/Out of AMC; resolution by user | `erpnext/support/doctype/warranty_claim/warranty_claim.json` |

### AureusERP — same request model as Odoo, with instruction attachments

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Request form | Stage selector, name, equipment, category, **requested at**, maintenance type (Corrective/Preventive), recurrence; team, technician (`user_id`, single), scheduled at, duration, priority, company; tabs description and **instructions** with `instruction_type` text / PDF / Google Slide and a preview; chatter action | `plugins/webkul/maintenance/src/Filament/Clusters/Maintenance/Resources/MaintenanceRequestResource/{Schemas/MaintenanceRequestForm,Pages/EditMaintenanceRequest,Pages/ViewMaintenanceRequest}.php`; `plugins/webkul/maintenance/resources/views/filament/clusters/maintenance/resources/maintenance-request/instruction-preview.blade.php`; `plugins/webkul/maintenance/src/Enums/MaintenanceRequestType.php` |

### Carbon — Maintenance Dispatch: work-center-centric work order with OEE impact

A dispatch is a maintenance work order against a **work center** (the machine), not a
separate equipment record. It carries production-impact fields that feed scheduling.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| New/Edit dispatch | Drawer form: description, **Priority** (Low/Medium/High/Critical), **Source** (Scheduled / Reactive / Non-Conformance), **Severity** (Preventive / Operator Performed / Support Required / OEM Required), work center, **Location** (required), **OEE Impact** (Down / Planned / Impact / No Impact), planned start/end, **Takes work center offline** ("While this dispatch is open, the work center is unavailable to the schedule (until the planned end time, or until the dispatch is completed)."), **Suspected Failure Mode**. Status is saved as Open; the lifecycle is **Open / Assigned / In Progress / Completed / Cancelled** (Completed and Cancelled lock the record) | `apps/erp/app/modules/resources/ui/Maintenance/{MaintenanceDispatchForm,MaintenanceStatus,MaintenancePriority,MaintenanceSeverity,MaintenanceSource,MaintenanceOeeImpact}.tsx`; `maintenanceDispatchValidator` in `apps/erp/app/modules/resources/resources.models.ts`; routes `apps/erp/app/routes/x+/maintenance+/{new,update}.tsx` |
| Dispatch detail | Header actions **Start**, **Complete**, **Reopen**, **Delete Dispatch** + explorer (add/edit timecards: employee, work center, start/end, notes); properties panel (copy link/ID/number, status, **assignee**, location, work center, priority, severity, source, procedure, OEE impact, planned and actual start/end, suspected and **Actual Failure Mode**, created by); tabs **Events** (time entries: employee, start/end, notes, start/stop), **Items** (spare parts: item, qty, UoM, unit cost; **Add and issue** with tracked-entity/serial picks), **Comments** | `apps/erp/app/modules/resources/ui/Maintenance/{MaintenanceDispatchHeader,MaintenanceDispatchExplorer,MaintenanceDispatchProperties,MaintenanceDispatchNotes,MaintenanceAddPartModal}.tsx`; routes `apps/erp/app/routes/x+/maintenance+/$dispatchId.{tsx,events.tsx,event.new.tsx,items.tsx,item.new.tsx,add-and-issue.tsx,comments.tsx,status.tsx}` |

### metasfresh — service/repair project for customer-returned goods

Customer repair is a **project** (`C_Project` of service/repair type) started from a
request. Tasks are spare-parts or repair-order lines; the actual repair runs as a
manufacturing order; cost collectors decide what is invoiced. No in-house equipment
maintenance module exists (generic WebUI windows only).

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Request → project | Action **Start Project** on a request (`R_Request`) | `backend/de.metas.servicerepair.webui/src/main/java/de/metas/servicerepair/request/process/R_Request_StartProject.java` |
| Project tasks | Task **Type** Spare Parts / Service Repair Order; **Status** Not Started / In Progress / Completed; part ownership Owned by company / Owned by customer | `backend/de.metas.servicerepair.base/src/main/java/de/metas/servicerepair/project/model/{ServiceRepairProjectTask,ServiceRepairProjectTaskType,ServiceRepairProjectTaskStatus,PartOwnership}.java`; `backend/de.metas.servicerepair.base/src/main/java-gen/de/metas/servicerepair/repository/model/I_C_Project_Repair_Task.java` |
| Project actions | **Start Repair Order** (creates PP_Order), **Create Quotation**, **Open HUs to issue** → issue HUs view, **Release reserved HUs**, **Recalculate summary** (consumption summary) | `backend/de.metas.servicerepair.webui/src/main/java/de/metas/servicerepair/project/process/{C_Project_StartRepairOrder,C_Project_CreateQuotation,C_Project_OpenHUsToIssue,HUsToIssueView_IssueHUs,C_Project_ReleaseReservedHUs,C_Project_RecalculateSummary}.java`; `backend/de.metas.servicerepair.webui/src/main/java/de/metas/servicerepair/project/hu_to_issue/` |
| Cost collectors | Spare Parts To Be Invoiced, Spare Parts Owned By Customer, Repaired Product To Return, Repairing Consumption | `backend/de.metas.servicerepair.base/src/main/java/de/metas/servicerepair/project/model/ServiceRepairProjectCostCollectorType.java` |
| Customer returns / warranty | Add spare parts to a customer return, select/return HUs, warranty case | `backend/de.metas.servicerepair.webui/src/main/java/de/metas/servicerepair/customerreturns/process/`; `backend/de.metas.servicerepair.base/src/main/java/de/metas/servicerepair/customerreturns/{RepairCustomerReturnsService,WarrantyCase}.java` |

**BOSS implications.** In Odoo and Carbon one work order record covers corrective and
preventive work; Carbon adds the fields that matter to production (severity, source, OEE
impact, offline flag, failure modes) and ERPNext the repair cost and downtime. As in
Carbon, parts and time can be recorded on the work order rather than on a separate repair
document. Customer repair (Odoo Repairs, metasfresh) is a different flow; which records
and apps carry it is an open question.

---

## 5. Preventive maintenance & schedules

### Odoo — recurrence on the preventive request; calendar with recurrence

Preventive maintenance is a request with `maintenance_type = preventive` and a
recurrence rule. Closing one spawns the next. No meter/usage triggers in core; the
`usage_based_maintenance` industry package adds run-time meters via Studio models.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Recurrence block | On preventive requests: **Recurrent**, Repeat Every (`repeat_interval`) + unit (Days/Weeks/Months/Years) + Until (Forever / Until date) | `odoo/addons/maintenance/views/maintenance_views.xml` (`hr_equipment_request_view_form`); `odoo/addons/maintenance/models/maintenance.py` (`recurring_maintenance`, `repeat_interval`, `repeat_unit`, `repeat_type`, `repeat_until`) |
| Maintenance calendar | Calendar on `schedule_date`–`schedule_end` colored by assignee, default To Do filter; custom `calendar_with_recurrence` view shows future occurrences (incl. year view popover) | `odoo/addons/maintenance/views/maintenance_views.xml` (`hr_equipment_view_calendar`, action `hr_equipment_request_action_cal`); `odoo/addons/maintenance/static/src/views/calendar_with_recurrence/calendar_with_recurrence_{view,model,renderer,common_renderer,year_renderer,year_popover}.js`; tour `odoo/addons/maintenance/static/tests/tours/tour_calendar_with_recurrence.js` |
| Usage-based maintenance (industry) | Studio models `x_run_time_meter` (date, run-time h, serial) and `x_recurring_maintenance_rules` (product, run-time increment h, run-time meter when done); automations ("On Run-Time edit" on meter readings, "Set task run time meter when done" on project tasks) and server actions **Create Recurrent Tasks Based On Recurring Maintenance Rules** and **Create Corrective Task** create project (field-service) tasks when a serial's run-time passes the threshold; used by `machine_tool_rental` | `industry/usage_based_maintenance/data/{ir_model.xml,ir_model_fields.xml,base_automation.xml,ir_ui_menu.xml,ir_ui_view.xml}`; `industry/machine_tool_rental/data/x_recurring_maintenance_rules.xml` |

### ERPNext — Asset Maintenance plan with periodic tasks, logs generated per due date

**Asset Maintenance** (one per asset) holds a team and a task table; each task has a
type, periodicity and assignee. The system creates **Asset Maintenance Log** entries for
each due date; completing a log advances Next Due Date.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Asset Maintenance | Asset, Asset Category, Item Code/Name (read-only), Company, **Maintenance Team**, Maintenance Manager; **Maintenance Tasks** table; dashboard section **Maintenance Log** with counts per status | `erpnext/assets/doctype/asset_maintenance/asset_maintenance.json`, `asset_maintenance.js` |
| Maintenance task row | Maintenance Task, **Maintenance Type** (Preventive Maintenance / Calibration), Maintenance Status (Planned/Overdue/Cancelled), Start Date, **Periodicity** (Daily … 3 Yearly), End Date, **Certificate Required**, Assign To, Next Due Date, Last Completion Date, Description | `erpnext/assets/doctype/asset_maintenance_task/asset_maintenance_task.json` |
| Asset Maintenance Log | Submittable: task, type, periodicity, assignee, Due Date, Completion Date, **Maintenance Status** (Planned/Completed/Cancelled/Overdue), Has Certificate + Certificate attachment, Actions Performed; calendar view | `erpnext/assets/doctype/asset_maintenance_log/asset_maintenance_log.json`, `asset_maintenance_log_calendar.js` |
| Maintenance Schedule (customer) | After-sales schedule per customer: Items table (item, start/end, **Periodicity** Weekly…Yearly/Random, No of Visits, sales person, serial no, sales order) → **Generate Schedule** fills Schedules (scheduled date, actual date, completion status); **Create → Maintenance Visit** | `erpnext/maintenance/doctype/maintenance_schedule/maintenance_schedule.json`, `maintenance_schedule.js`; `maintenance_schedule_item/`, `maintenance_schedule_detail/`; query report `maintenance/report/maintenance_schedules/` |

### AureusERP — recurrence fields on the request

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Recurrence | `recurring_maintenance`, `repeat_interval`, `repeat_unit` (day/week/month/year), `repeat_type` (forever/until), `repeat_until` | `plugins/webkul/maintenance/src/Enums/{MaintenanceRepeatUnit,MaintenanceRepeatType}.php`; `plugins/webkul/maintenance/database/migrations/2026_05_18_000005_create_maintenance_requests_table.php` |

### Carbon — Scheduled Maintenance per work center, capacity-aware

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Scheduled maintenances | List and form: Schedule Name, work center, **Frequency** (Daily/Weekly/Monthly/Quarterly/Annual), day-of-week checkboxes for daily, **Skip Holidays**, priority, **Estimated Duration (minutes)**, **Takes Work Center Offline** (reserves capacity; requires duration), **Next Due Date**, active, **Procedure**, planned spare-part items (`maintenanceScheduleItem` table, validator and service, but no form or route edits them) | `apps/erp/app/modules/resources/ui/MaintenanceSchedule/{MaintenanceSchedulesTable,MaintenanceScheduleForm}.tsx`; `maintenanceScheduleValidator`, `maintenanceFrequency` in `resources.models.ts`; routes `apps/erp/app/routes/x+/resources+/scheduled-maintenance*.tsx` |
| Capacity reservation | Offline PMs subtract their window from work-center capacity in the scheduler | `packages/database/supabase/migrations/20260817041453_scheduled-maintenance-offline.sql`, `20260720121629_capacity-planning.sql` |

**BOSS implications.** Taken together, the references suggest PM plans with both calendar
(Odoo, ERPNext, Carbon) and meter intervals (Moqui baseline `ProductMaintenance`),
per-asset overrides, skip-holiday and day-of-week rules (Carbon), and a calendar that
shows future occurrences (Odoo). One option is that completing a PM work order generates
the next one.

---

## 6. Technician / mobile / field execution

### Carbon MES — technician maintenance board, dispatch execution, work-center display

The MES (shop-floor app) gives technicians and operators their own maintenance screens.
This is the strongest reference for a technician-facing execution flow.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Maintenance board | Tabs **All** (active dispatches) / **Today** (scheduled today) / **Assigned to Me** / **Blocking** (work centers currently down, "No work centers are blocked"); search; filters work center, priority, status (Open / Assigned / In Progress), OEE impact; cards with priority, OEE impact, work center | `apps/mes/app/routes/x+/maintenance.tsx` |
| Dispatch execution | Description, **Procedure**, **Time Entries** (start/stop events, "Time Worked"), **Spare Parts** (add; **Add and issue** from inventory with serial/batch), **Complete** confirmation ("This marks the dispatch as completed") | `apps/mes/app/routes/x+/dispatch.$dispatchId.tsx`, `dispatch.$dispatchId.item.tsx`, `dispatch.$dispatchId.add-and-issue.tsx`, `maintenance-event.tsx` |
| Operator-raised dispatch | Dialog on the job-operation screen: work center, description, priority, severity, actual start/end, OEE impact, suspected and actual failure mode; posted to the MES route, which checks the work center and failure modes belong to the company and sends a notification | `apps/mes/app/components/JobOperation/components/MaintenanceDispatch.tsx`; `apps/mes/app/routes/x+/dispatch.new.tsx` |
| Work-center display tile | Andon-style panel per work center: **Machine down for maintenance now?** (Down for planned maintenance / Unplanned downtime), **Overdue PMs?** (PM schedule lapsed), **Due today?**, **Due in the next N days?**, **Last completed** by whom; "All clear" state | `apps/mes/app/routes/display+/$workCenterId.maintenance.tsx` |

### Odoo — no technician app in community; worksheets are an upsell

Technicians use the same request kanban (**My Maintenances** filter) on mobile web.
Settings offer **Custom Maintenance Worksheets** (`module_maintenance_worksheet`,
enterprise). Field-service style execution comes from the enterprise `planning` /
`industry_fsm` worksheet stack used by industry packages (`hvac_services`,
`usage_based_maintenance`).

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Worksheet setting | Upgrade toggle "Create custom worksheet templates" | `odoo/addons/maintenance/views/res_config_settings_views.xml` |
| Field-service industry packs | HVAC services: worksheet templates, projects, planning; usage-based maintenance creates FSM tasks | `industry/hvac_services/data/worksheet_template.xml`, `industry/usage_based_maintenance/data/base_automation.xml` |

### ERPNext — Maintenance Visit is the field record (customer site)

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Maintenance Visit | Technician (Sales Person) logs work done per serial at a customer, with completion status and customer feedback; created from a schedule, sales order or warranty claim | `erpnext/maintenance/doctype/maintenance_visit/` |

### Dolibarr — Interventions (`fichinter`): billable field-service report

An intervention is a signed, billable work report for a third party: header plus timed
lines. It is the reference for a printable/signable technician report and for recurring
service visits, not for in-house equipment.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Intervention card | Third party, project, **contract**, customer ref, description; lines with date, **duration**, description (plus title/subtotal/text lines); **Total Duration**; actions Validate, **Sign** / Unsign (signed status), **Classify Done**, **Classify Billed** / Unbilled, Create invoice, Reopen, Clone, Send email, PDF; **Change into repeatable intervention**; status Draft / Validated / Billed / Done (closed) / Canceled | `htdocs/fichinter/card.php`; `htdocs/fichinter/class/{fichinter.class.php,fichinterligne.class.php}` (`STATUS_DRAFT`…`STATUS_CANCELED`) |
| Recurring interventions | Template interventions generating new ones on a frequency | `htdocs/fichinter/card-rec.php`, `htdocs/fichinter/class/fichinterrec.class.php` |
| List, index, stats, tabs | List with filters; module index with latest/drafts; statistics; contacts, documents, notes, agenda tabs | `htdocs/fichinter/{list.php,index.php,contact.php,document.php,note.php,agenda.php}`, `htdocs/fichinter/stats/` |

**BOSS implications.** Carbon MES is the evidence for a phone-friendly "my work" board for
technicians and a work order execution view with start/stop time, parts issue, procedure
and complete. A
printable, signable work report (Dolibarr) is useful for outside service.

---

## 7. Facility & equipment booking / scheduling admin

### Odoo — resources and working calendars; bookable rooms only via enterprise appointments

Core `resource` defines **Material** resources (equipment/rooms) alongside people, each
with a working calendar and time off ("leaves"). Booking rooms/desks is the enterprise
**Appointments** app (not in this checkout); the `coworking` industry pack seeds
appointment resources Seat 1–4 and Meeting Room 1–4 (capacity 6, 10, 16, 12).

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Resources | List/form with **Type** Human / Material, working time, timezone, efficiency; filters Human/Material | `odoo/addons/resource/views/resource_resource_views.xml` (`view_resource_resource_search`, `resource_resource_form`, `resource_resource_tree`); `odoo/addons/resource/models/resource_resource.py` (`resource_type`) |
| Working schedules | Calendar form with attendance lines, multi-create; time off / closing days per resource (calendar + list) | `odoo/addons/resource/views/{resource_calendar_views.xml,resource_calendar_attendance_views.xml,resource_calendar_leaves_views.xml}` (`resource_calendar_form`, `view_resource_calendar_attendance_calendar`, `resource_calendar_closing_days`, `resource_calendar_resources_leaves`); menus `odoo/addons/resource/views/menuitems.xml` |
| Room/seat resources (industry) | Appointment resources with capacity | `industry/coworking/data/appointment_resource.xml` |
| Vehicle availability | **Future Driver**, **Available From** (`next_assignation_date`), **Apply New Driver**, **Make Vehicle Available** on the vehicle | `odoo/addons/fleet/views/fleet_vehicle_views.xml` (`fleet_vehicle_view_form`) |

### Carbon — work-center offline windows are the equipment schedule

No booking UI; equipment availability is the work-center capacity calendar, reduced by
dispatches and scheduled maintenances flagged **Takes Work Center Offline**. Rental
fleet units have Reserved / On Rent statuses (section 9).

### ERPNext — none

No room/equipment booking. `Asset Shift Allocation` is about depreciation shifts, not
booking.

### Dolibarr — Resources linked to agenda events, with conflict check; BookCal for public booking

**Resources** are typed things (room, vehicle, projector — the type is a dictionary) with
location, max users, contact details. They are attached to agenda events or other
elements; attaching a busy resource raises "resources already in use". **BookCal**
publishes availability ranges for online appointment booking.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Resource card/list | Ref, **Resource Type** (dictionary), description, location/address, country, phone, email, **Max Users**; tabs contacts, documents, notes, agenda | `htdocs/resource/{card.php,list.php,contact.php,document.php,note.php,agenda.php}`; `htdocs/resource/class/dolresource.class.php` (`fk_code_type_resource`, `max_users`) |
| Resources linked to element | Box on events and interventions listing linked resources with **Type**, **Busy** and **Mandatory** flags; linking a busy resource over a period that overlaps another busy booking fails with `ErrorResourcesAlreadyInUse` (same check in the agenda event card and the REST API) | `htdocs/resource/element_resource.php`; `htdocs/core/tpl/{resource_add,resource_view}.tpl.php`; `htdocs/resource/class/{html.formresource.class.php,api_dolresources.class.php}`; `htdocs/comm/action/card.php` |
| Agenda per resource | Calendar views (day/week/per user) filterable by resource | `htdocs/resource/agenda.php` |
| BookCal calendars & availabilities | Calendar (label, owner, type, third party, project) and availability ranges (calendar, start/end date, **duration of range**, status); booking list | `htdocs/bookcal/{calendar_card.php,calendar_list.php,availabilities_card.php,availabilities_list.php,booking_list.php}`; `htdocs/bookcal/class/{calendar.class.php,availabilities.class.php}`; `htdocs/bookcal/README.md` |

### Ever Gauzy — equipment registry with share requests, approval and policies

The cleanest reference for **employee-facing equipment booking with admin approval**.
Equipment carries a max share period and an auto-approve flag; a share request names the
equipment, the requesting employees or teams, a policy and a date window.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Equipment | Grid/table: name, type, serial number, manufactured year, initial cost + currency, **max share period**, **auto approve** (badge component), tags, image; add/edit dialog | `apps/gauzy/src/app/pages/equipment/{equipment.component.ts,equipment.component.html,equipment-record-view.ts,auto-approve/}`; dialog `packages/ui-core/shared/src/lib/equipment/equipment-mutation.component.html`; model `packages/contracts/src/lib/equipment.model.ts` |
| Equipment sharing (requests) | Table: equipment name, share request date, share start/end date, created by, status, policy; row actions **Approve** / **Refuse**; dialog: request name, equipment, sharing policy, participants (Employees or Teams radio), request day, start day, end day; the dialog sets **APPROVED** at once when the equipment is auto-approve and rejects a window longer than its max share period; status **REQUESTED / APPROVED / REFUSED**; Approve/Refuse gated by `EQUIPMENT_APPROVE_REQUEST`, requests by `EQUIPMENT_MAKE_REQUEST`. No overlap or double-booking check in the dialog or the server service | `apps/gauzy/src/app/pages/equipment-sharing/{equipment-sharing.component.ts,equipment-sharing.component.html,table-components/equipment-sharing-action/,table-components/equipment-sharing-status/,table-components/equipment-sharing-policy-table/}`; dialog `packages/ui-core/shared/src/lib/equipment/equipment-sharing/equipment-sharing-mutation.component.{html,ts}`; `packages/core/src/lib/equipment-sharing/equipment-sharing.service.ts`; permissions in `packages/contracts/src/lib/role-permission.model.ts`; `EquipmentSharingStatusEnum`, `EquipmentSharingParticipantEnum` (EMPLOYEE/TEAM) in `packages/contracts/src/lib/equipment-sharing.model.ts` |
| Sharing policies | Name + description list; selected on each request | `apps/gauzy/src/app/pages/equipment-sharing-policy/`; `packages/ui-core/shared/src/lib/equipment/equipment-sharing-policy/equipment-sharing-policy-mutation.component.html` |

### Nextcloud — room/resource booking inside the event editor

Rooms and resources are CalDAV principals supplied by backends (admin-managed, often via
an external app or LDAP). The screen everyone uses is the event editor's **Resources**
section: search rooms, filter, check availability, add to the event.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Room selection | **Show rooms** modal: search "Name, building or room number", filters Building, Floor, **Minimum capacity**, Features; room cards with **Check room availability**. Inline resource search: **Room type**, **Minimum seating capacity**, **Projector**, **Whiteboard**, **Wheelchair accessible**, available/unavailable state, **Check availability**, add/remove resource | `calendar/src/components/Editor/Resources/{RoomSelectionModal.vue,ResourceRoomCard.vue,ResourceRoomType.vue,ResourceSeatingCapacity.vue,ResourceList.vue,ResourceListItem.vue,ResourceListSearch.vue}` |
| Room / resource metadata | Room type, seating capacity, building name/address/story, room number, features | `server/lib/public/Calendar/Room/IRoomMetadata.php`, `server/lib/public/Calendar/Resource/IResourceMetadata.php` |
| Principal backends | Rooms and resources exposed as CalDAV principals (schedulable inbox) | `server/apps/dav/lib/CalDAV/ResourceBooking/{RoomPrincipalBackend,ResourcePrincipalBackend,AbstractPrincipalBackend}.php` |

### Zimbra admin console — calendar resource accounts (Location / Equipment)

A resource is a mail-enabled calendar account whose scheduling policy is set by an admin.
This is the clearest **scheduling-admin** reference: auto-accept/decline rules and
conflict tolerance per resource.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| New resource wizard / resource form | Name, display name, **Type** Location / Equipment, **schedule policy** (auto accept + auto decline on conflict combinations), **max conflicts allowed** (count and percent for recurring), auto-decline recurring, always free, forward invites to, **Site / Building / Floor / Room**, **Capacity**, contact name/email/phone, account status (active / maintenance / locked / closed), auto-reply signatures | `zm-admin-console/WebRoot/js/zimbraAdmin/resource/view/{ZaNewResourceXWizard.js,ZaResourceXFormView.js}`; model `resource/model/ZaResource.js` (`RESOURCE_TYPE_LOCATION`, `RESOURCE_TYPE_EQUIPMENT`, `SCHEDULE_POLICY_*`, `A_zimbraCalResMaxNumConflictsAllowed`, `A_zimbraCalResSite`, `A_zimbraCalResBuilding`, `A_zimbraCalResFloor`, `A_zimbraCalResRoom`, `A_zimbraCalResCapacity`); controller `resource/controller/ZaResourceController.js` |

**BOSS implications.** Booking itself is in the reused Calendar & schedules screen that
Commons includes for everyone. Maintenance's version, the scheduling admin, would need
per-resource policy (approval required, auto-approve, max period, conflicts allowed: Gauzy,
Zimbra), a request queue with approve/refuse (Gauzy), an overlap
check (Dolibarr), and blackout windows. No single reference has all four.

---

## 8. Fixed assets lifecycle

### ERPNext — full lifecycle on the Asset form, each step a submittable document

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Asset Movement | **Purpose** Issue / Receipt / Transfer / Transfer and Issue; rows: asset, source/target **Location**, from/to **Employee**; reference document | `erpnext/assets/doctype/asset_movement/asset_movement.json`, `asset_movement_item/`; asset form **Transfer Asset** |
| Asset Value Adjustment | Asset, finance book, date, current vs new value, difference amount/account, journal entry | `erpnext/assets/doctype/asset_value_adjustment/asset_value_adjustment.json` |
| Asset Capitalization | Target item/asset from consumed **Stock Items**, consumed **Assets** and **Services**; totals; project/cost center | `erpnext/assets/doctype/asset_capitalization/asset_capitalization.json` + child tables |
| Depreciation Schedule | Per asset and finance book; **Asset Shift Allocation** re-plans by shift factor | `erpnext/assets/doctype/asset_depreciation_schedule/`, `asset_shift_allocation/`, `asset_shift_factor/` |
| Sell / Scrap / Restore / Split | Asset form actions (sell qty, scrap date, restore scrapped, split qty) | `erpnext/assets/doctype/asset/asset.js` |

### Carbon — fixed assets in Accounting, linked to work centers

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Fixed assets list / new | Columns Asset ID, Name, Serial Number, Status (**Draft / Active / Fully Depreciated / Disposed**; Under Construction only when construction-in-progress is enabled), Asset Class, Location, Acquisition Cost, Net Book Value; form has Location and Work Center | `apps/erp/app/modules/accounting/ui/FixedAssets/{FixedAssetsTable,FixedAssetForm,FixedAssetStatus}.tsx`; `apps/erp/app/routes/x+/accounting+/fixed-assets*.tsx`; `fixedAssetStatuses` in `apps/erp/app/modules/accounting/accounting.models.ts` |
| Fixed asset detail | Header actions **Edit**, **Register**, **Purchase**, **Capitalize**, **Adjust Cost**, **Take Out of Service** / **Return to Service** (reason), **Return to Inventory**, **Sell**, **Dispose** (method, proceeds, NBV, gain/loss), **Attach Job**, Delete; book and tax depreciation (method Straight Line / Declining Balance / **Units of Production**, useful life months, residual %, MACRS property class/convention, bonus %), lifetime usage units, depreciation journal table, documents, notes | `apps/erp/app/routes/x+/fixed-asset+/$fixedAssetId.{tsx,details.tsx,register.tsx,purchase.tsx,capitalize.tsx,adjust-cost.tsx,out-of-service.tsx,return-to-inventory.tsx,sell.tsx,dispose.tsx,attach-job.tsx}`; `apps/erp/app/modules/accounting/ui/FixedAssets/{FixedAssetHeader,FixedAssetOutOfServiceForm,FixedAssetDisposalForm,FixedAssetAdjustCostForm,FixedAssetDocuments,FixedAssetNotes}.tsx` |
| Asset classes, depreciation runs | Class defaults; periodic depreciation run with status and documents | `apps/erp/app/modules/accounting/ui/FixedAssets/{AssetClassForm,AssetClassesTable,DepreciationRunTable,DepreciationRunHeader,DepreciationRunStatus}.tsx`; `apps/erp/app/routes/x+/accounting+/asset-class*.tsx` |

### Odoo — not in community

Asset accounting (`account_asset`) is enterprise-only; the community equipment record has
only Cost, Effective Date and Scrap Date. `account_fleet` adds **Bills** on vehicles.

### Dolibarr — Asset module: accounting-first, with models as templates

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Asset card/list | Ref, label, **asset model**, qty, **acquisition type**, **asset type**, not depreciated flag, acquisition date, start date, acquisition value, recovered VAT, reversal date/amount; status Draft / Validated (in progress) / Disposed; Validate, Set to draft, Reopen, Clone | `htdocs/asset/{card.php,list.php}`; `htdocs/asset/class/asset.class.php` |
| Depreciation tab | Per-mode lines: begin date, duration, rate, base, depreciation, cumulative, residual; future lines; reversal; dispatched-in-bookkeeping flag | `htdocs/asset/depreciation.php`, `htdocs/asset/tpl/depreciation_view.tpl.php`; options `htdocs/asset/depreciation_options.php`, `tpl/depreciation_options_{edit,view}.tpl.php` |
| Disposal | Disposal date, amount, **disposal type** (dictionary), depreciated flag, subject to VAT, customer invoice | `htdocs/asset/disposal.php` |
| Accountancy codes | Per-asset and per-model account codes (economic and fiscal) | `htdocs/asset/accountancy_codes.php`, `tpl/accountancy_codes_{edit,view}.tpl.php`, `class/assetaccountancycodes*.class.php` |
| Asset models | Template card/list with depreciation options and accountancy codes | `htdocs/asset/model/{card.php,list.php,depreciation_options.php,accountancy_codes.php}`, `class/assetmodel.class.php` |
| Tabs | Documents, notes, agenda | `htdocs/asset/{document.php,note.php,agenda.php}` |

**BOSS implications.** Fixed assets are one `Asset` record included in two apps:
Maintenance's version emphasizes the register and lifecycle actions (acquire, transfer,
out of service, dispose), Accounting's the depreciation, capitalization and disposal
postings (ERPNext, Carbon, Dolibarr show the full set).

---

## 9. Fleet / vehicles

### Odoo — Fleet app: vehicles as a specialized equipment class

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Vehicles | Kanban/list/form/pivot/activity: model + brand, license plate, VIN (`vin_sn`), driver and **Future Driver** (**Apply New Driver**), **Drivers History**, state (`fleet.vehicle.state`), tags, location, odometer + unit, model year, fuel, transmission, power, CO2, catalog/purchase/residual value; smart buttons Contracts, Services, Odometer | `odoo/addons/fleet/views/fleet_vehicle_views.xml` (`fleet_vehicle_view_form`, `fleet_vehicle_view_kanban`, `fleet_vehicle_view_tree`, `fleet_vehicle_view_search`, `fleet_vehicle_view_pivot`, action `fleet_vehicle_action`); `fleet/models/fleet_vehicle.py` |
| Services log | Service entries with stage **New / Running / Done / Cancelled**, service type, vendor, cost; graph/pivot/activity | `odoo/addons/fleet/views/fleet_vehicle_cost_views.xml` (`fleet_vehicle_log_services_view_*`, action `fleet_vehicle_log_services_action`); `fleet/models/fleet_vehicle_log_services.py` |
| Contracts | Leasing/insurance contracts with expiry; graph/pivot/activity | `odoo/addons/fleet/views/fleet_vehicle_cost_views.xml` (`fleet_vehicle_log_contract_view_*`, action `fleet_vehicle_log_contract_action`) |
| Odometer | Odometer readings list/form and **Odometers** report | `odoo/addons/fleet/views/fleet_vehicle_views.xml` (`fleet_vehicle_odometer_view_form`, `fleet_vehicle_odometer_view_tree`, action `fleet_vehicle_odometer_action`); `odoo/addons/fleet/views/fleet_vehicle_odometer_report.xml`, `odoo/addons/fleet/report/odometer_report.py` |
| Costs report | Pivot/graph/list of contract + service costs per vehicle | `odoo/addons/fleet/views/fleet_board_view.xml` (`fleet_costs_report_view_pivot`, `fleet_costs_report_view_graph`, action `fleet_costs_reporting_action`); `fleet/report/fleet_report.py` |
| Configuration | Models, Brands, Categories, Contract Types, Service Types, Vehicle Status, Tags, Settings | `odoo/addons/fleet/views/{fleet_vehicle_model_views.xml,fleet_vehicle_views.xml,res_config_settings_views.xml}` (`fleet_vehicle_service_types_action`, `fleet_vehicle_contract_types_action`, `fleet_vehicle_tag_action`, `fleet_vehicle_state_action`, `fleet_config_settings_action`) |
| Bridges | Employee **Cars History** (`hr_fleet`); vendor **Bills** on vehicles and service lines (`account_fleet`); equipment assigned to a vehicle (`fleet_maintenance`) | `odoo/addons/hr_fleet/views/hr_employee_views.xml`; `odoo/addons/account_fleet/views/{fleet_vehicle_views.xml,fleet_vehicle_log_services_views.xml}` |

### Carbon — rental fleet view over fixed assets

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Fleet | Fixed assets used as rental units: columns Asset ID, Item, Serial Number, Asset Class, Status, Net Book Value, Work Center, **Out of Service Reason**; fleet status **Available / Reserved / On Rent / In Maintenance / Sold / Returned to Stock** (Under Construction only with construction-in-progress) | `apps/erp/app/routes/x+/accounting+/fleet.tsx`; `apps/erp/app/modules/accounting/ui/FixedAssets/{FleetAssetsTable,FleetStatus}.tsx`; `fleetStatuses` in `accounting.models.ts` |

**BOSS implications.** Vehicles fit as an asset class (`AsClsPassengerVeh`,
`AsClsCargoVehicle` and its children) with the odometer meters, registrations and
identifiers that Mantle already has; contracts and fuel/service cost logs would be new.
Rental fleet statuses (Carbon) go with rental, which is outside this file's scope.

---

## 10. Failure modes, downtime & reliability

### Carbon — failure-mode catalog and OEE impact on every dispatch

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Failure modes | Name and **Type** (Maintenance / Quality / Operations / Other); used as suspected and actual failure mode on dispatches | `apps/erp/app/modules/resources/ui/FailureModes/{FailureModesTable,FailureModeForm}.tsx`; routes `apps/erp/app/routes/x+/resources+/failure-modes*.tsx`; `maintenanceFailureModeType` in `resources.models.ts` |
| Reliability KPIs | MTTR, MTBF, worst performing machines, spare part cost/consumption on the Resources dashboard | `apps/erp/app/routes/x+/resources+/_index.tsx` |

### Odoo — MTBF/MTTR computed on equipment from corrective requests

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Equipment Maintenance tab | Expected MTBF (input), MTBF, MTTR, Latest Failure, Estimated Next Failure (computed from done corrective requests since effective date) | `odoo/addons/maintenance/models/maintenance.py` (`maintenance.mixin`), `odoo/addons/maintenance/views/maintenance_views.xml` (`hr_equipment_view_form`) |
| OEE / Losses Analysis | Action-less menu slots for work-center productivity reporting, filled only by the Enterprise `mrp_maintenance` addon (not in this checkout) | `odoo/addons/maintenance/views/maintenance_views.xml` (`menu_m_reports_oee`, `menu_m_reports_losses`) |

### ERPNext — Downtime Entry against workstations

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Downtime Entry | Workstation / Machine, From/To Time, Operator, computed Downtime, **Stop Reason** (e.g. Excessive machine set up time, Unplanned machine maintenance, …), Remarks | `erpnext/manufacturing/doctype/downtime_entry/downtime_entry.json` |
| Downtime Analysis | Script report filtered by date range and machine; columns machine, from/to time, downtime (hours), operator, stop reason, remarks | `erpnext/manufacturing/report/downtime_analysis/` |
| Repair downtime | `downtime` field on Asset Repair | `erpnext/assets/doctype/asset_repair/asset_repair.json` |

**BOSS implications.** A failure-mode catalog, suspected vs actual failure mode and an
OEE-impact field (Carbon), downtime with stop reasons (ERPNext) and computed MTBF/MTTR
(Odoo) together make up reliability reporting in the references; Mantle has none of
them.

---

## 11. Reports & analytics

| App | Report | Key files |
| --- | --- | --- |
| Odoo | **Maintenance Requests Analysis** (graph/pivot default, To Do filter, by team/stage/category) | `odoo/addons/maintenance/views/maintenance_views.xml` (`maintenance_request_action_reports`, `hr_equipment_request_view_graph`, `hr_equipment_request_view_pivot`) |
| Odoo | Repairs graph/pivot | `odoo/addons/repair/views/repair_views.xml` (`action_repair_order_graph`, `view_repair_graph`, `view_repair_pivot`) |
| Odoo | Fleet Costs, Odometers | `odoo/addons/fleet/views/fleet_board_view.xml`, `fleet_vehicle_odometer_report.xml` |
| ERPNext | **Fixed Asset Register** (filters status, category, cost center, finance book, period/date based on, group by) | `erpnext/assets/report/fixed_asset_register/` |
| ERPNext | **Asset Maintenance** (Report Builder), **Asset Activity**, Maintenance Schedules (query report), Downtime Analysis | `erpnext/assets/report/{asset_maintenance,asset_activity}/`, `erpnext/maintenance/report/maintenance_schedules/`, `erpnext/manufacturing/report/downtime_analysis/` |
| ERPNext | Asset value charts and cards | `erpnext/assets/dashboard_chart/`, `erpnext/assets/number_card/` |
| Carbon | Maintenance KPI chart with CSV export | `apps/erp/app/routes/x+/resources+/_index.tsx` |

**BOSS implications.** Candidate reports: open/overdue work orders, PM compliance,
MTBF/MTTR and worst assets, maintenance cost by asset and facility, and a fixed asset
register view (also included in Accounting).

---

## 12. Configuration & settings

| App | Configuration screen | Key files |
| --- | --- | --- |
| Odoo | **Maintenance Teams** (name, members, email alias, company; list/kanban/form) | `odoo/addons/maintenance/views/maintenance_views.xml` (`maintenance_team_view_form`, `maintenance_team_view_tree`, `maintenance_team_view_kanban`, action `maintenance_team_action_settings`) |
| Odoo | **Maintenance Stages** (name, sequence, folded in pipe, restricted to teams); seeded New Request, In Progress, Repaired (folded), Scrap (folded) | `odoo/addons/maintenance/views/maintenance_views.xml` (`hr_equipment_stage_view_form`, `hr_equipment_stage_view_tree`, action `hr_equipment_stage_action`); `odoo/addons/maintenance/data/maintenance_data.xml` (`stage_0`, `stage_1`, `stage_3`, `stage_4`) |
| Odoo | **Equipment Categories** (responsible, note; custom properties defined per category) | `odoo/addons/maintenance/views/maintenance_views.xml` (`hr_equipment_category_action`) |
| Odoo | Repair tags; fleet models/brands/service and contract types/vehicle states | `odoo/addons/repair/views/repair_views.xml` (`action_repair_order_tag`); `odoo/addons/fleet/views/` |
| ERPNext | **Asset Maintenance Team** (name, manager, company, members with **Maintenance Role**) | `erpnext/assets/doctype/asset_maintenance_team/asset_maintenance_team.json`, `maintenance_team_member/` |
| ERPNext | Asset Category, Location, Accounts Settings (asset section), Asset Shift Factor | `erpnext/assets/doctype/{asset_category,location,asset_shift_factor}/` |
| AureusERP | Teams (name, users, company), Stages (name, sort, **done** flag), Equipment Categories | `plugins/webkul/maintenance/src/Filament/Clusters/Configurations/Resources/{TeamResource,StageResource,EquipmentCategoryResource}/` |
| Carbon | Failure Modes, Locations, Work Centers (in Resources); asset classes (in Accounting) | `apps/erp/app/modules/resources/ui/{FailureModes,Locations,WorkCenters}/`; `apps/erp/app/modules/accounting/ui/FixedAssets/AssetClassForm.tsx` |
| Carbon | **Procedures** (Production module): versioned procedures with ordered **steps** and **parameters**, picked as the procedure on dispatches and scheduled maintenance and shown to the technician in MES | `apps/erp/app/modules/production/ui/Procedures/{ProceduresTable,ProcedureForm,ProcedureExplorer}.tsx`; `apps/erp/app/routes/x+/procedure+/{$id.tsx,$id.steps.new.tsx,$id.parameters.new.tsx}` |

**BOSS implications.** The configuration found across the references: teams with members
(and an email alias for intake, as in Odoo), stages or status labels, equipment
categories/classes, maintenance types, failure modes and procedures with steps (Carbon).

---

## 13. Cross-app surfaces

Reused screens and links as listed in [research-crosscut.md](research-crosscut.md) §3–§4.
Each app includes the same screen with its own tabs and actions; the **Facility &
equipment record** is the reused screen where Maintenance's version carries the most.

| Reused screen or link | Use in Maintenance | Other apps that include it | Reference evidence |
| --- | --- | --- | --- |
| **Facility & equipment record**: production equipment and work centers | Publishes which equipment is down or reserved for planned work; downtime and OEE feed Maintenance and Manufacturing; a repair can spawn a production order | Manufacturing (production equipment, work centers): reads equipment availability for scheduling and lets operators report a breakdown from the floor | Carbon `takesWorkCenterOffline` on dispatches and schedules, MES maintenance board, job-operation dispatch dialog and work-center display tile (`apps/mes/app/routes/`); ERPNext Downtime Entry and Downtime Analysis; Odoo OEE/Losses menu slots (Enterprise `mrp_maintenance`) and `mrp_repair` smart buttons; Moqui baseline equipment assignments on production runs |
| **Facility & equipment record**: storage locations and setup | Equipment located at a facility/location; storage locations and location setup inside a facility | Warehouse (storage locations and setup) | Odoo `stock_maintenance` location field and location smart button |
| **Inventory availability** and parts issuance | Spare parts issued to a work order | Warehouse (full stock by facility, location, lot, reservations); Customer Service; Purchasing; Sales; Manufacturing; Commerce | Carbon dispatch **Add and issue**; ERPNext Asset Repair consumed stock items; Odoo repair Parts tab with reserve; Moqui `issue#AssetToWorkEffort` |
| **Order detail** (purchase) and supplier links | Buying parts or outside service for a work order; vendor and warranty on equipment | Purchasing (purchase orders, supplier terms) | Odoo `purchase_repair` smart buttons; ERPNext Asset Repair purchase invoices; Odoo/AureusERP equipment vendor + vendor ref + warranty date; Mantle `AssetMaintenance.purchaseOrderId`, `AssetMaintenanceOrderItem` |
| **Fixed assets** (the same `Asset`; Facility & equipment record, fixed-asset books) | Register, lifecycle and custodian | Accounting: depreciation, capitalization (including capitalized repair cost), disposal postings, and the labor and parts cost of work orders | ERPNext Asset + Value Adjustment + Capitalization + **Capitalize Repair Cost**; Carbon Fixed Assets in Accounting linked to work centers, and dispatch time expensed at the work center's labor rate (`packages/database/supabase/migrations/20260929181534_maintenance-labor-journal.sql`); Dolibarr asset module; Mantle `calculateAndPost#AllFixedAssetDepreciations` |
| **Employee 360** | Equipment assigned to employees/departments; return on departure; equipment count on the employee record | People (employment, pay, leave, reviews); Admin; Projects; Commons | Odoo `hr_maintenance` (employee/department assignment, departure unassign, **Equipment** smart button); Odoo `hr_fleet` **Cars History**; ERPNext Asset Custodian + Asset Movement from/to employee; Frappe HR Full and Final Asset; Mantle `AssetPartyAssignment` |
| **Calendar & schedules** (booking) | Scheduling admin: bookable-resource policies, approvals, blackout and maintenance windows (decided in initial-design) | Commons: booking and availability for everyone (decided in initial-design); Projects: plan views; People: leave and shift views | Nextcloud room search and availability in the event editor; Ever Gauzy equipment sharing requests with approve/refuse; Dolibarr resources on agenda events with busy check; Zimbra resource scheduling policy; Moqui `FacilityCalendar`, `AssetCalendar`, event **Equipment** assignments |
| **Customer-owned equipment repair and warranty** (open question) | Repairs and warranty for customer-owned items, service visits, field-service reports | Customer Service (researched in both files); crosscut §8 leaves the records open (see Open questions) | Odoo Repairs (customer, under warranty, quote, invoice); ERPNext Warranty Claim + Maintenance Schedule/Visit; metasfresh service/repair projects; Dolibarr interventions |
| **Task / work item** and project costing | Work orders are `WorkEffort` records like Projects tasks but with purpose `WepMaintenance`; repair cost charged to a project | Projects (work items, costing) | ERPNext Asset Repair `project`; metasfresh `C_Project` service/repair; Dolibarr intervention project |
| **Dashboard widgets** | Maintenance's landing page; KPI widgets (MTBF, MTTR, worst assets, spare-part cost, asset value by category/location) use the Insights widget types | Insights (dashboards, widget builder); every app's landing page | Carbon Resources dashboard KPIs; Odoo equipment MTBF/MTTR + request analysis; ERPNext asset dashboard charts and number cards |
| **Chatter & activities** | Messages, activities and attachments on work orders, equipment and facilities | Every app's record screens (one component from Commons and Comms) | Odoo chatter on requests and equipment; Carbon dispatch comments; Moqui `AssetMaintenanceContent` |

**BOSS implications.** The equipment/facility master and the maintenance work order are
where Maintenance's versions of the reused screens carry the most. The other apps include
the same records with their own emphasis: Manufacturing reads offline windows for
scheduling, Warehouse issues parts and sets up storage locations, Accounting posts
depreciation on the same `Asset`, Commons books facility and equipment schedules, and
People shows assignments on the Employee 360.

---

## 14. Current Moqui baseline (mr-marble / MarbleERP / Mantle)

The baseline has a rich data model and per-asset maintenance tabs, but no maintenance app:
no cross-asset work queue, no team or technician board, no facility-level maintenance, no
booking flow. MarbleERP (`component/mr-marble/screen/marble.xml`) mounts the
SimpleScreens trees (Asset, Facility, Manufacturing, Request, Task, Accounting and the
rest) and adds no maintenance screens of its own. Several maintenance links exist in the
data model but no screen or service uses them yet: `ProductMaintenance.templateWorkEffortId`,
`AssetMaintenance.taskWorkEffortId` and `purchaseOrderId` (both marked TODO in the screens),
and the WorkEffort purpose `WepMaintenance`.

### Screens

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Asset dashboard | Links Asset Summary, Assets, Move Asset, Physical Inventory, Containers, Lots, Pools, On Hand Report — inventory-oriented | `component/mr-marble/screen/SimpleScreens/Asset/dashboard.xml` |
| Find Asset | Filters asset type, class, status, product, facility/location, container, lot, pool, owner, acquired/received/manufactured dates, acquire cost, only-no-location / only-no-cost | `component/mr-marble/screen/SimpleScreens/Asset/Asset/{FindAsset,FindSummary}.xml` |
| Asset detail | Tabs per asset; detail form with product, facility, location, container, lot, owner, serial, soft identifier, manufactured/acquired/received dates, **Update Cost & Owner**, reservations, audit log; for fixed assets also name, depreciation type, expected end of life, salvage value, depreciation and year-begin depreciation, plus a depreciation section | `component/mr-marble/screen/SimpleScreens/Asset/Asset/{AssetDetail,DetailHistory}.xml` |
| Asset Maintenance tab | **Planned maintenance** list per asset from `ProductMaintenance` with Last/Next:Diff display from `get#AssetMaintenanceNeeded` and a **New Maint** row action; maintenance history list; dialogs **Add Planned Maintenance** and **Add Other Maintenance** (status, date, maintenance type, interval meter or interval UOM, interval quantity, comments) | `component/mr-marble/screen/SimpleScreens/Asset/Asset/AssetMaintenance.xml`, `component/mr-marble/screen/SimpleScreens/Asset/Asset/AssetMaintenance/FindAssetMaintenance.xml` |
| Edit Maintenance | Status, date, type, planned maintenance, interval meter/UOM/qty, comments; **content** attachments (upload/download); audit log | `component/mr-marble/screen/SimpleScreens/Asset/Asset/AssetMaintenance/EditAssetMaintenance.xml` |
| Meter Readings tab | **New Meter Reading** (date, meter, value); list with read-by | `component/mr-marble/screen/SimpleScreens/Asset/Asset/AssetMeters.xml` |
| Registrations tab | Government registrations: from/thru, registration date, agency, registration number, license number | `component/mr-marble/screen/SimpleScreens/Asset/Asset/AssetRegistrations.xml` |
| Assignments tab | Party assignments with role and from/thru (custodian/user) | `component/mr-marble/screen/SimpleScreens/Asset/Asset/AssetParties.xml` |
| Asset calendar | **New Event** (name, purpose, facility, start, est. hours) on the asset, which assigns the asset to the event; calendar of the asset's events (event detail link TODO) | `component/mr-marble/screen/SimpleScreens/Asset/Asset/AssetCalendar.xml` |
| Event detail (user calendar) | Event form, notes, party assignments and an **Equipment** list: add an `AstTpEquipment` asset to the event with an assignment status | `component/mr-marble/screen/MyAccount/User/Calendar/{MyCalendar,EventDetail}.xml`; copy in `component/mr-boss/screen/Base/User/Calendar/EventDetail.xml` |
| Move Asset | Select an asset, then move quantity to a facility, location (scan location supported) or container with status | `component/mr-marble/screen/SimpleScreens/Asset/Asset/{SelectAsset,MoveAsset}.xml` |
| Product meters & maintenance plans | On the product: Product Meters (meter type, UOM, name) and Product Maintenance (type, description, interval qty, interval meter or UOM, repeat count; the template work effort is not on the form) | `component/mr-marble/screen/SimpleScreens/Catalog/Product/EditProduct.xml` |
| Facility find/edit | Find by name/type/owner/ID; edit: ID, name, type, owner, **parent facility**, opened/closed dates, size + UOM, asset policy flags (warehouse types), address, lat/long, phone, email, description; **child facilities** list (one level), notes, box types, location types | `component/mr-marble/screen/SimpleScreens/Facility/{FindFacility,EditFacility}.xml` |
| Facility locations | Locations with area/aisle/section/level/position, type, capacity + UOM, sequence; find assets in location | `component/mr-marble/screen/SimpleScreens/Facility/EditFacilityLocations.xml` |
| Facility calendar | Calendar of work-effort events filtered by facility (read-only; event detail TODO) | `component/mr-marble/screen/SimpleScreens/Facility/FacilityCalendar.xml` |
| Requests | Find/edit requests with items, tasks, users and wiki pages — a possible intake record, but no maintenance request type | `component/mr-marble/screen/SimpleScreens/Request/{FindRequest,EditRequest}.xml` |
| Equipment on production runs | Equipment assignments on a run (`WorkEffortAssetAssign`); Manufacturing dashboard links **Equipment Assets** (`AstTpEquipment`) | `component/mr-marble/screen/SimpleScreens/Manufacturing/Run/EditRun.xml`, `component/mr-marble/screen/SimpleScreens/Manufacturing/dashboard.xml` |
| Post depreciation | **Post Depreciation** on a time period | `component/mr-marble/screen/SimpleScreens/Accounting/TimePeriod/ViewPeriodGlAccounts.xml` |

### Data model available

| Entity / enum | What it gives Maintenance | Key files |
| --- | --- | --- |
| `Asset` | `parentAssetId` (hierarchy), `assetTypeEnumId`, `classEnumId`, `statusId`, owner, product, name, serial / soft identifier / activation number, received/acquired/manufactured dates, expected/actual end of life, **capacity** + UOM, `facilityId` + `locationSeqId`, container, lot, `geoPointId`, acquire order/work effort/shipment, acquire cost, salvage value, depreciation + type, tax depreciation | `component/mr-mantle/entity/ProductAssetEntities.xml` |
| `AssetType` enum | Inventory, Supplies, **Fixed Asset** → Equipment (`AstTpEquipment`), Rental Equipment, Real Estate, Investment Real Estate, Bearer Biological; Biological; Intangible | same file, `AstTp*` |
| `AssetClass` enum | Inventory (Raw Material, Sub-assembly, Finished Good, Digital Good), Warehouse/Manufacturing Equipment, Boat, Forklift, Digger, Manlift, Service Body, Tractor, Passenger Vehicle, Compressor, Trencher, Puller, Tanker, Reel Stand, Cargo Vehicle (Truck, Trailer, Container), Computer Hardware (Desktop, Laptop, Tablet, Monitor), Computer Software (4 kinds) | same file, `AsCls*` |
| Asset status | Incoming, Available, Promised, Delivered, Activated, Deactivated, On Hold, **In Use**, In Storage, In Transfer, In Transfer (Promised), Returned, **Defective**, Quarantine, Morgue — no "In Maintenance" / "Out of Service" | same file, `Ast*` |
| `AssetMaintenance` | Asset, status, maintenance date, `maintenanceTypeEnumId`, `productMaintenanceId` (plan), `taskWorkEffortId` (the work), `intervalQuantity`, `intervalUomId`, `intervalProductMeterId`, `purchaseOrderId`, user, comments. Statuses **Created / Scheduled / In Process / Completed / Cancelled** (`AsMnt*`); flow Created → Scheduled or In Process or Cancelled, Scheduled → In Process or Cancelled, In Process → Completed. Children `AssetMaintenanceContent`, `AssetMaintenanceOrderItem` | same file |
| `MaintenanceType` enum | Vehicle Maintenance (Oil Change, Belt Replacement, Re-Fuel, Tune Up, Battery Replace, Battery Check, Lubricate Chassis, Tires Rotate, Tire Replacement), HVAC Maintenance (Air Filter Replace, Refrigerant Check/Recharge), Cleaning (`MntTp*`) — no inspection or calibration type | same file |
| `ProductMaintenance` | PM plan per product: type, description, comments, `templateWorkEffortId`, `intervalQuantity` + `intervalUomId` or `intervalProductMeterId`, **repeatCount** | same file |
| `ProductMeter`, `ProductMeterType`, `AssetMeter` | Meters per product; readings per asset (date, meter type, product meter, value, reason, linked maintenance/work effort, user); meter types Speedometer, Tachometer, Distance, **Motor Time**, Use Count, Copy Count, Trip, Tachograph, Taximeter, Event Data Recorder, Pedometer, **Odometer**, Thermometer (`PdMtr*`). `AssetMeter` carries a TODO to move to `Measurement` | same file |
| `Measurement` | Generic reading with type, date, value, UOM, `workEffortId`, `assetId`, `facilityId`, `productMeterId`, `assetMaintenanceId`, reason, user | `component/mr-mantle/entity/WorkEffortEntities.xml` |
| `AssetRegistration`, `AssetIdentification`, `AssetPartyAssignment` | Government registrations; identifiers (mfg serial, MAC, VIN, gas card, license plate, tracking label); party/role assignment over time | `component/mr-mantle/entity/ProductAssetEntities.xml` |
| `AssetDepreciation`, `AssetStandardCost`, `AssetGlAppl` | Per-period depreciation (with useful life years); standard cost; GL overrides; depreciation types Straight Line, Double Declining, Sum of Years Digits, Units of Production; tax MACRS GDS 5/7 | same file |
| `Facility` (+ `FacilityGroup`, `FacilityParty`, `FacilityContent`, `FacilityNote`, `FacilityCertification`, `FacilityLocation`) | `parentFacilityId` hierarchy, types **Block, Block Group, Building, Land, Floor, Office, Call Center, Data Center, Plant, Room, Retail Store, Warehouse, Dock, Production Line** (`FcTp*`), size, opened/closed, geo point, `statusId` (a `Facility` status type with no status items seeded), parties, notes, certifications | `component/mr-mantle/entity/FacilityEntities.xml` |
| `WorkEffort` | The maintenance work order record (crosscut §6): purpose `WepMaintenance`, `priority`, `statusId` (In Planning, Approved, In Progress, On Hold, Complete, Closed, Cancelled), `resolutionEnumId`, `facilityId`, estimated/actual start and completion, estimated/actual work time, recurrence (`recurStartCron`, `recurLimit`, `recurEndDate`) | `component/mr-mantle/entity/WorkEffortEntities.xml` |
| WorkEffort links | Purposes **Maintenance** (`WepMaintenance`) and **Asset Usage (Rental)** (`WepAssetUsage`); `WorkEffortAssetAssign` (status Requested / Assigned / Arrived / Departed / Request Denied, from/thru, allocated cost, comments) — usable as an equipment booking; `WorkEffortAssetNeeded`; `WorkEffortFacility` (type Inventory Origin / Also Used, no status, so a room booking has no request/approve state); `WorkEffortParty`; `WorkEffortAssoc`; `TimeEntry` | same file |
| `Request` | Intake record with types Bug Fix, New Feature, Information, Proposal, Quote, Support, Inventory, Purchase, Contact Us — none for maintenance | `component/mr-mantle/entity/RequestEntities.xml` |

### Services

| Service | Purpose | Key files |
| --- | --- | --- |
| `mantle.product.EquipmentServices`: `create#Equipment` (asset type `AstTpEquipment`, status `AstInUse`), `create#AssetMaintenance` (fills type, interval UOM and meter from the plan and records a meter reading; does not create a work effort), `get#AssetMaintenanceNeeded` (last reading, last maintenance date/interval, **next interval**, **remaining interval**), `create#AssetMaintenanceContent`, `update#AssetMaintenanceContent`, `save#AssetMaintenanceContentFile` | Equipment creation and PM due calculation per asset and plan | `component/mr-mantle/service/mantle/product/EquipmentServices.xml` |
| `mantle.product.AssetServices`: `move#Asset`, `issue#AssetToWorkEffort`, `issue#AnyAssetToWorkEffort`, `replace#AssetPartyAssignment`, reservation services | Moves, parts issuance to a work effort, custodian change | `component/mr-mantle/service/mantle/product/AssetServices.xml` |
| `mantle.work.EventServices`: `create#Event` (optional `assetId` adds a `WorkEffortAssetAssign` already **Assigned**, optional `requestId`; no conflict check), `get#FullCalendarData` (filters by facility, party or asset lists) | Calendar events and equipment on events | `component/mr-mantle/service/mantle/work/EventServices.xml` |
| `mantle.work.WorkEffortServices.clone#WorkEffort`; `mantle.work.TaskServices.create#Task`, `add#TaskTime`; `mantle.work.TimeServices.store#TimeEntry` | Copy a template work effort; tasks and time entry | `component/mr-mantle/service/mantle/work/{WorkEffortServices,TaskServices,TimeServices}.xml` |
| `mantle.request.RequestServices.create#Request` | Request intake | `component/mr-mantle/service/mantle/request/RequestServices.xml` |
| `mantle.facility.FacilityServices`: `create#Facility`, `update#Facility`, `create#FacilityLocation`, `update#FacilityCertification`, `create#FacilityNote` | Facility master | `component/mr-mantle/service/mantle/facility/FacilityServices.xml` |
| `mantle.ledger.AssetAutoPostServices`: `calculate#FixedAssetDepreciation`, `post#FixedAssetDepreciation`, `calculateAndPost#AllFixedAssetDepreciations` | Depreciation (also included in Accounting) | `component/mr-mantle/service/mantle/ledger/AssetAutoPostServices.xml` |

Missing: any service that lists due or overdue PM across assets, creates the next work
order from a plan (`templateWorkEffortId` + `clone#WorkEffort` are the obvious parts),
checks booking conflicts, or computes MTBF/MTTR or downtime.

---

## 15. Gaps & BOSS implications

### Gaps in the reference set

- **Odoo community lacks the add-ons that make its maintenance app complete**: no
  `mrp_maintenance` (so the OEE and Losses Analysis menus stay empty), no
  `maintenance_worksheet` (the settings toggle is an upgrade prompt), no `account_asset`,
  `appointment`, `planning`, `industry_fsm`, `quality_control` or `web_studio`. The
  industry packages cited here (`usage_based_maintenance`, `hvac_services`, `coworking`,
  `machine_tool_rental`, `property_assets_distribution`) depend on those Enterprise
  modules, so they show data shapes only.
- **No reference combines booking approval with a conflict check.** Ever Gauzy has request →
  approve/refuse with auto-approve and max share period but no overlap check; Dolibarr has
  the busy/overlap check but no approval; Zimbra has auto-accept/decline and allowed
  conflicts per resource but is a mail server, not an ERP.
- **Facility hierarchy below a site is thin everywhere.** ERPNext `Location` is a tree with
  geo and area; Carbon stops at the site; Odoo core uses stock locations; the Odoo property
  industry package (Studio, Enterprise) models buildings and units; Zimbra and Nextcloud
  give room attributes without a tree. None ties facility-level work orders to rooms.
- **Meter-based PM** appears only in the Moqui baseline (`ProductMaintenance` with a
  product meter), metasfresh's legacy `A_Asset` fields and Odoo's Enterprise-dependent
  usage-based industry package. ERPNext, Carbon and Odoo core schedule by calendar only.
- **Calibration and certificates** are only in ERPNext (task type Calibration, certificate
  required/attached). **Checklists** are only in Carbon (Procedures with steps and
  parameters, linked from dispatches and schedules).
- **Technician mobile**: only Carbon MES has dedicated technician screens; Odoo's
  field-service worksheets are Enterprise.
- **Fixed-asset accounting** is in ERPNext, Carbon and Dolibarr; not in Odoo community.

### Notable gaps in the Moqui baseline

- **No work queue.** `AssetMaintenance` is only reachable per asset; there is no
  cross-asset list, kanban, calendar, "my work" or team view (compare Odoo team dashboard
  and request kanban, Carbon dispatch table and MES board).
- **No request/triage step.** Nothing like Odoo's request or Carbon's operator-raised
  dispatch; a requester outside Maintenance cannot report a broken machine or room.
  `Request` exists but has no maintenance type.
- **The work order link is unused.** `AssetMaintenance.taskWorkEffortId` and
  `purchaseOrderId` are TODO in the screens, `create#AssetMaintenance` creates no work
  effort, and no screen or service uses `WepMaintenance`. Priority, assignees, planned
  window, time entries and recurrence already exist on `WorkEffort` and `WorkEffortParty`.
- **No team, failure mode, downtime or OEE impact** records or fields.
- **No status for "down".** Asset status has Defective / On Hold but no In Maintenance /
  Out of Service; ERPNext (In Maintenance, Out of Order), Carbon fixed assets (Take Out of
  Service) and Carbon fleet (In Maintenance) all have it, and Manufacturing needs it.
- **PM is per product plan only.** No per-asset schedule override, no calendar of due PMs,
  no auto-generation of the next work order (`templateWorkEffortId` is not on the form and
  not used), no "skip holidays" or day-of-week rules. `get#AssetMaintenanceNeeded`
  computes due per asset and plan, but nothing lists all due/overdue PMs. No calibration or
  inspection maintenance type.
- **Facilities are logistics-shaped.** Edit Facility is about shipping, box types and
  inventory flags with a one-level child list; there is no facility tree, no
  facility-level maintenance, no room attributes (capacity, features) and no facility
  equipment list. Facility status has no seeded values.
- **Scheduling admin is absent.** Facility and asset calendars show WorkEffort events and
  the event screen can add equipment, but `create#Event` assigns equipment directly
  (no Requested step), there is no approval, conflict check, per-resource policy or
  blackout window, and `WorkEffortFacility` has no status for room requests.

### What each reference contributes

| Reference | Take |
| --- | --- |
| Odoo | Team dashboard cards with deep-link counters; request kanban by stage with the state light; Corrective/Preventive on one record with recurrence and a calendar that shows future occurrences; equipment MTBF/MTTR; employee/department/vehicle assignment and departure unassign; email-in requests via team alias; Repairs as a separate customer-facing app; fleet odometer, services and contracts |
| Carbon / Carbon MES | Work-center-centric dispatch with severity, source, **OEE impact**, suspected vs actual failure mode, **takes work center offline**; timecards and spare-part issue on the dispatch; Procedures as checklists; MES technician board, floor-raised dispatch and andon tile; KPI landing page (MTTR, MTBF, worst machines, part cost); fixed assets with out-of-service and fleet statuses; labor cost posted from dispatch time |
| ERPNext | Location tree with geo/area; per-asset maintenance plan with task periodicity, **Calibration** type and certificates; generated logs with calendar; Asset Repair with downtime, consumed items and capitalized cost; asset status driven by maintenance and repair documents; Asset Movement between locations/employees; Downtime Entry with stop reasons |
| AureusERP | Confirms the Odoo shape is portable; instructions as text / PDF / slides |
| Dolibarr | Signed, billable intervention report with recurring templates; resources attached to events with busy/mandatory flags and an overlap check; public booking ranges (BookCal); asset models as templates |
| Ever Gauzy | Equipment share request → approve/refuse, max share period, auto-approve, sharing policies, employee/team participants, separate request and approve permissions |
| Zimbra / Nextcloud | Per-resource scheduling policy (auto-accept/decline, conflicts allowed); room search by building, floor, capacity and features with availability check in the event editor |
| metasfresh | Customer repair as project with spare-parts vs repair-order tasks and ownership-aware cost collectors; meter-or-date maintenance hints on the legacy asset |
| Moqui baseline | Meter-based PM plans per product with next/remaining interval, meter readings, registrations, custodian assignments, equipment on events and production runs, facility hierarchy and types, depreciation services |

### Candidate screen inventory (IronStone Maintenance)

| Area | Screens |
| --- | --- |
| Home | Maintenance landing page: tiles (open, overdue PM, high priority, unassigned, assets down), my work, team cards with counters, MTTR/MTBF strip (widgets on the Insights widget types, **(reused: Insights, every app's landing page)**) |
| Work orders | Work order list (saved filters, group by team/status/asset/facility), board by status, calendar; work order detail (asset or facility, type, priority, severity, source, team, assignees, planned window, offline flag, failure mode suspected/actual, procedure/instructions, time entries, parts used with issue through **Inventory availability** **(reused: Warehouse, Customer Service, Purchasing, Sales, Manufacturing, Commerce)**, purchase links, Chatter **(reused: every app's record screens)**, history); quick "report a problem" dialog for anyone (a **Request / case** if intake uses `Request`, see Open questions); phone-friendly detail for technicians |
| Preventive | PM plans (product-level `ProductMaintenance` + per-asset overrides), due/overdue PM list with meter status, PM calendar, generate-next action |
| Equipment & assets | Equipment find (type/class/status/facility/team/custodian/warranty/due); **Equipment 360** = the **Facility & equipment record** **(reused: Warehouse, Manufacturing, Commons, Accounting)**: summary, hierarchy children, meters, maintenance history, plans, assignments (links to **Employee 360** **(reused: People, Admin, Projects, Commons)**), registrations, documents, calendar, and a books tab over the fixed-asset records **(reused: Accounting, where depreciation, capitalization and disposal actions are emphasized)** |
| Facilities | Facility tree (site → building → floor → room), facility record **(reused: Warehouse, Manufacturing, Commons, Accounting)**: attributes, rooms, equipment in facility, work orders, calendar, parties, certifications; storage locations tab with location setup **(reused: Warehouse)** |
| Scheduling admin | Bookable resources (facilities/equipment) with policy (approval required, auto-approve, max period, conflicts allowed, capacity, features); booking requests queue (approve/refuse); blackout and maintenance windows; the booking calendar itself, the **Calendar & schedules** screen **(reused: Commons, Projects, People)** |
| Reliability | Downtime log, failure modes, MTBF/MTTR/worst assets report, PM compliance, maintenance cost by asset/facility |
| Configuration | Teams and members, maintenance types, failure modes, status labels, meter types, asset classes, procedures/checklists; Maintenance settings section (linked from the Admin settings index) |

### Data-model findings

- **Work order as `WorkEffort` with purpose `WepMaintenance`** (crosscut §6) fits: it has
  status, priority, estimated/actual dates, `facilityId`, `WorkEffortParty` assignees,
  `TimeEntry` and recurrence fields. One option keeps `AssetMaintenance` as the asset-side
  record with `taskWorkEffortId` set from the work order, and generates work orders from
  `ProductMaintenance.templateWorkEffortId` with `clone#WorkEffort` (see Open questions).
- **Missing fields or records:** severity, source, OEE impact, takes-offline flag,
  suspected and actual failure mode, downtime (on the WorkEffort or a maintenance extension
  entity); failure mode catalog; maintenance team (a Party group with members via
  `PartyRelationship`, or a new entity); procedures/checklists. None exist today.
- **Facility work orders** could use `WorkEffort.facilityId` or `WorkEffortFacility`;
  equipment work orders `WorkEffortAssetAssign` or `AssetMaintenance`.
- **"Down" status:** options are new asset statuses such as In Maintenance and Out of
  Service, or a separate availability record, either readable by Manufacturing and booking.
- **Bookings:** `WorkEffortAssetAssign` (Requested / Assigned / Request Denied) fits
  equipment; rooms would need a status on `WorkEffortFacility` or a booking record; policies
  per Asset/Facility (approval required, auto-approve, max period, conflicts allowed,
  blackout windows) would need a new entity or attributes.
- **Room attributes** (capacity, features, floor) would need fields or a facility feature
  record; `Asset.capacity` exists only for assets.
- **Meter readings:** `AssetMeter` is what the screens and `get#AssetMaintenanceNeeded`
  use today; it carries a TODO to move to `Measurement`.
- **Calibration/inspection** maintenance types are not seeded; certificate attachments fit
  `AssetMaintenanceContent`, which can hold the file.

### Sequencing notes

- The work queue depends on the work order record choice (Open questions). `WorkEffort`
  already has status, priority, assignees, time entries and recurrence, but
  `taskWorkEffortId` and `WepMaintenance` are unused today.
- The Equipment 360 is cheap to start: the per-asset tabs exist (meters, maintenance,
  assignments, registrations, calendar).
- The PM due list builds on `get#AssetMaintenanceNeeded`, which computes due per asset and
  plan but has no cross-asset list; generate-next depends on `templateWorkEffortId` and
  `clone#WorkEffort`, neither used for maintenance today.
- The facility tree builds on `parentFacilityId` and the Facility services; room
  attributes depend on new fields.
- Teams depend on the team record choice; maintenance types are an enum with no
  inspection or calibration type.
- The asset "down" status depends on the status choice, and Manufacturing and booking
  depend on it.
- The booking approval workflow and policies depend on new records (policy, room booking
  status) and on a conflict check that no service has; until then booking works by direct
  assignment (`create#Event` assigns equipment as **Assigned**).
- Reliability analytics beyond counts depend on the failure mode, downtime and OEE
  fields; fleet specifics on new contract and cost log records; calibration certificates
  on the new maintenance types.
- A technician kiosk has only Carbon MES as a reference; a work order detail that works on
  a phone is part of the work order screen itself.

### Open questions

- Is the work order a WorkEffort with an `AssetMaintenance` child (the option in
  Data-model findings), or `AssetMaintenance` with a WorkEffort child (today's shape)?
  Facility work orders push toward WorkEffort-first.
- **Customer-owned equipment repair and warranty** (Odoo Repairs, ERPNext Warranty Claim
  and Maintenance Visit, metasfresh service/repair, Dolibarr interventions): which records
  carry it (case, repair order, maintenance work order), and which repair screens do
  Customer Service and Maintenance each include (crosscut §8)?
- **Maintenance request intake:** a `Request` with a new maintenance type, through the
  reused Request / case screen (crosscut §3 lists maintenance requests among its uses), or
  a `WorkEffort` created in In Planning directly?
- Booking approval is part of the scheduling admin, decided for Maintenance in
  initial-design; could the same approvals also be included in Commons or the header
  approvals waiting list, so facility managers approve their own rooms there?
- How far into fixed-asset accounting does the Equipment 360 go (read-only NBV vs
  actions)? Crosscut §4 lists depreciation, capitalization and disposal as Accounting's
  emphasis on the same `Asset`.
- "Down" as new `Asset` statuses or as a separate availability record, given that asset
  status today also carries inventory meaning?
- Maintenance teams as Party groups or a new entity?
- Meter readings: keep `AssetMeter` or move to `Measurement` as its TODO says?
- Fleet: a vehicle asset class inside Maintenance, or separate fleet screens later?

### Checkout path quirks

- Odoo industry packages sit at the bundle root (`industry/<package>/`), not under
  `odoo/`; they are data-only Studio packages that need Enterprise modules.
- Carbon's operator-raised dispatch dialog is in
  `apps/mes/app/components/JobOperation/components/MaintenanceDispatch.tsx`; the route
  `apps/mes/app/routes/x+/dispatch.new.tsx` is only the action.
- The Moqui user calendar and event detail are under
  `component/mr-marble/screen/MyAccount/`, outside `SimpleScreens/`.
