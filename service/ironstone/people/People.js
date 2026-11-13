// The People app's context (impl-people §2, P1; design-people §1.1, §1.2): who may open People, their capabilities and scope, the
// record check every People screen and shared mount runs before a Mantle service, the drop-downs, the palette and the canonical
// links. The scope itself is Mantle's (mantle.humanres.PeopleServices.get#Scope: the People permissions, the employers and units
// a staff reader sees, the caller's own employments and live reports), read once per call here; the Mantle services check it
// again, and nothing here grants what Mantle refuses.
//
// Opening People needs the root grant of one of the user's groups (BOSS_PEOPLE, the root user group, or BOSS_PEOPLE_ADMIN), read
// directly so an inherited or disabled authorization cannot widen it (impl-admin F35, as Insights.js); the root grant opens
// navigation only. A system administrator (ADMIN) opens everything. A Projects client contact (PROJECT_CLIENT) never opens
// People, a PASS public account holds no BOSS group, and BOSS_PEOPLE_SELF has no root grant: a self-service employee opens their
// self-service alone, under Commons or People (P8: a non-inheritable grant on it and its context, as Admin's settings index), and
// gets a context of their own and nothing else of People.
//
// Later phases extend the tables below rather than the functions: areas (menu areas whose authorization is a capability),
// recordKinds (a kind of record: its read and, once built, its screen), searchFinds (the palette), choiceSources (the
// drop-downs), linkPaths (sharedLinks) and employee360Apps (the per-app context of Shared/Employee360, P2).
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const {find, one, denied, call} = lib
const access = lib.access

const rootLocation = "component://mr-boss/screen/People.xml"
const areaLocation = area => "component://mr-boss/screen/People/" + area + ".xml"
const choiceLimit = 30
const organizationOptionLimit = 100

// The menu areas whose authorization is a capability (data/BossSetupData.xml BOSS_PPL_<Area>): Settings the People
// administrator's (P1); P6: the hire and employment change wizards (BOSS_PPL_EMPLOYMENT), HR's. Home is every People user's.
const areas = {
    settings: "Settings",
    employment: "Employees/HireEmployee",
    // P8: My team, the managers' (BOSS_PPL_TEAM; the capability team is PEOPLE_TEAM_VIEW's)
    myTeam: "MyTeam",
    // P9: Time & leave's working schedules, HR's and the managers' (BOSS_PPL_SCHEDULES; Holidays HR's alone, BOSS_PPL_HOLIDAYS;
    // the area itself every People user's since P10, BOSS_PPL_TIME); P14's Shift roster is in the same group, so this capability
    // is its too
    schedules: "Time/WorkingSchedules",
    // P10: Payroll, the payroll groups' (BOSS_PPL_PAYROLL; Rates under it)
    payroll: "Payroll"
}
// P8: the self-service screen (Shared/PeopleSelfService.xml, mounted at People/SelfService and Commons/People/SelfService), whose
// own grant opens it to a self-service employee without People (BOSS_PPL_SELF)
const selfServiceLocation = "component://mr-boss/screen/Shared/PeopleSelfService.xml"
// P10: Time & leave (Projects' time screens mounted under People/Time), which a self-service employee opens by its own grant
// (BOSS_PPL_TIME); and Projects' root, whose own Today source answers a Projects user's weeks to submit
const timeLocation = "component://mr-boss/screen/People/Time.xml"
// P15: Expenses (claims and advances), which a self-service employee opens by its own grant (BOSS_PPL_EXPENSES)
const expensesLocation = "component://mr-boss/screen/People/Expenses.xml"
// P18: Skills & training, whose Qualifications a self-service employee opens by the area's own grant (BOSS_PPL_DEVELOPMENT)
const developmentLocation = "component://mr-boss/screen/People/Development.xml"
const projectsLocation = "component://mr-boss/screen/Projects.xml"
// P21: Grievances (the user's confidential cases), every People user's under Employees and a self-service employee's by its own grant
// (BOSS_PPL_CASES_SELF), and a case's RequestDetail under People
const grievancesLocation = "component://mr-boss/screen/People/Employees/Grievances.xml"
// P20: Reviews & goals, which a self-service employee opens by its own grant (BOSS_PPL_PERFORMANCE)
const performanceLocation = "component://mr-boss/screen/People/Performance.xml"
const reviewDetailPath = "/qapps/People/Performance/ReviewDetail"
const REVIEW = "mantle.humanres.ability.PerformanceReview"
const caseDetailPath = "/qapps/People/Employees/RequestDetail"

// ===== scope =====
// The user's screen authorizations, read directly (as Insights.js and Commerce.js): screenAuthz reads the groups' rows once, and
// screenGrants picks a screen's from them (ALWAYS over DENY over ALLOW).
function screenAuthz(groupIds) {
    return Array.from(
        find("moqui.security.ArtifactAuthzCheckView")
            .condition("userGroupId", "in", groupIds)
            .condition("artifactTypeEnumId", "AT_XML_SCREEN")
            .condition("authzActionEnumId", "in", ["AUTHZA_ALL", "AUTHZA_VIEW"])
            .list()
    )
}
function screenGrants(location, authzRows) {
    const grants = authzRows.filter(row =>
        row.nameIsPattern === "Y" ? new RegExp("^(?:" + row.artifactName + ")$").test(location) : row.artifactName === location
    )
    const always = grants.filter(row => row.authzTypeEnumId === "AUTHZT_ALWAYS")
    const allowed = always.length
        ? always
        : grants.some(row => row.authzTypeEnumId === "AUTHZT_DENY")
          ? []
          : grants.filter(row => row.authzTypeEnumId === "AUTHZT_ALLOW")
    return {found: grants.length > 0, allowed, always: always.length > 0}
}
function rootGrants() {
    const none = {read: false, authzRows: []}
    if (!ec.user.userId || ec.user.hasPermission("PROJECT_CLIENT")) return none
    if (access.systemAdmin()) return {read: true, authzRows: [], systemAdmin: true}
    const groupIds = Array.from(ec.user.getUserGroupIdSet() || [])
    if (!groupIds.length) return none
    const authzRows = screenAuthz(groupIds)
    const root = screenGrants(rootLocation, authzRows)
    return {read: root.allowed.length > 0, rootAlways: root.always, authzRows}
}
// An area's grant: the root's ALWAYS (the People administrator's, ADMIN's) passes every area below it; otherwise the area's own
// rows decide when it has any, else the root's.
function areaGrant(grants, area) {
    if (!grants.read) return false
    if (grants.systemAdmin || grants.rootAlways) return true
    const found = screenGrants(areaLocation(area), grants.authzRows)
    return found.found ? found.allowed.length > 0 : true
}

// The scope of the current user: the root grant, Mantle's People scope and the areas.
function scope() {
    const grants = rootGrants()
    const people = grants.read ? call("mantle.humanres.PeopleServices.get#Scope") : null
    const capabilities = Object.assign({read: grants.read}, people?.capabilities || {})
    for (const [name, area] of Object.entries(areas)) capabilities[name] = areaGrant(grants, area)
    return {read: grants.read, people: people || {}, capabilities}
}
// P8: a self-service employee without People: their own grant on the self-service screen (BOSS_PPL_SELF), and nothing else.
function selfServiceOnly(grants = rootGrants()) {
    if (
        grants.read ||
        !ec.user.userId ||
        ec.user.hasPermission("PROJECT_CLIENT") ||
        !ec.user.hasPermission("PEOPLE_SELF_SERVICE")
    )
        return false
    const groupIds = Array.from(ec.user.getUserGroupIdSet() || [])
    return groupIds.length > 0 && screenGrants(selfServiceLocation, screenAuthz(groupIds)).allowed.length > 0
}
function required(userScope = scope()) {
    if (!userScope.read) denied("PEOPLE_UNAVAILABLE", "People is not available")
    return userScope
}
// The reason code of a refusal, also from a probe's message ("Error: CODE: message"), which lib.reasonCode does not read.
const codeOf = error => lib.reasonCode(error) || /\b([A-Z][A-Z0-9_]{3,}):/.exec(String(error?.message || ""))?.[1] || null
const likeText = text => "%" + String(text).replace(/[\\%_]/g, character => "\\" + character) + "%"
function organizationName(partyId) {
    const organization = partyId ? one("mantle.party.Organization", {partyId}) : null
    return organization?.organizationName || partyId || ""
}
function personName(partyId) {
    const person = partyId ? one("mantle.party.Person", {partyId}) : null
    const name = person ? [person.firstName, person.lastName].filter(Boolean).join(" ") : ""
    return name || partyId || ""
}
const employerIds = userScope => Array.from(userScope.people.organizationPartyIds || [])
const unitIds = userScope => employerIds(userScope).concat(Array.from(userScope.people.unitPartyIds || []))
// Organizations as options, by name, searched in the query ignoring case.
function organizationOptions(partyIds, term, limit) {
    if (!partyIds.length) return []
    let query = find("mantle.party.Organization").condition("partyId", "in", partyIds).orderBy("^organizationName").limit(limit)
    if (term) {
        const factory = ec.entity.conditionFactory
        query = query.condition(
            factory.makeCondition(
                ["partyId", "organizationName"].map(field => factory.makeCondition(field, "like", likeText(term)).ignoreCase()),
                "or"
            )
        )
    }
    return Array.from(query.list()).map(row => ({value: row.partyId, label: row.organizationName || row.partyId}))
}

// ===== shared context =====
// The People routes other screens link to (sharedLinks), by path under the root; each phase adds its screens.
const linkPaths = [
    // P1: Home and Settings (design §1.2)
    "Home",
    "Settings",
    // P2: the directory and the employee record (design §4)
    "Employees",
    "Employees/Employee360",
    // P3: the organization and the reporting lines (design §4 OrgStructure, OrgChart)
    "Employees/OrgStructure",
    "Employees/OrgChart",
    // P4: positions, job classes and pay grades (design §5)
    "Staffing",
    "Staffing/Positions",
    "Staffing/PositionDetail",
    "Staffing/JobClasses",
    "Staffing/JobClassDetail",
    "Staffing/PayGrades",
    // P5: the approvals list and the People administrator's approval rules and HR vocabularies (design §12, §13)
    "Approvals",
    "Settings/ApprovalPolicies",
    "Settings/Lookups",
    // P6: the hire and employment change wizards (design §4)
    "Employees/HireEmployee",
    "Employees/EmploymentChange",
    // P7: the checklist templates, the employees import (HR's, under Employees: the user's call, Nov 11), a checklist task and a
    // piece of equipment
    "Employees/ChecklistTemplates",
    "Employees/EmployeeImport",
    "Tasks/WorkItemDetail",
    "Employees/EquipmentDetail",
    // P8: the manager's team and the user's own self-service (design §3)
    "MyTeam",
    "SelfService",
    // P9: working schedules and holiday calendars (design §6, §7; the calendars HR's under Time, as the user's call of Nov 11 put
    // HR's own editors out of Settings)
    "Time",
    "Time/WorkingSchedules",
    "Time/WorkingScheduleDetail",
    "Time/HolidayCalendars",
    // P10: Projects' time screens and Rates, mounted under People (design §13)
    "Time/MyTime",
    "Time/Timesheets",
    "Time/TimesheetDetail",
    "Time/TimeEntries",
    "Payroll",
    "Payroll/Rates",
    // P11: leave policies, their detail, allocations (HR's under Time, as the user's call of Nov 11 put HR's own editors out of
    // Settings) and balances (design §7)
    "Time/LeavePolicies",
    "Time/LeavePolicyDetail",
    "Time/LeaveAllocations",
    "Time/LeaveBalances",
    // P12: leave requests, a request's detail and the team calendar (design §7, §13), every People user's and a self-service
    // employee's by the time area's own grant
    "Time/LeaveRequests",
    "Time/LeaveRequestDetail",
    "Time/TeamCalendar",
    // P13: attendance (every People user's and a self-service employee's by the time area's own grant), the clock (the quick create
    // Clock in) and HR's time import
    "Time/Attendance",
    "Time/Clock",
    "Time/TimeImport",
    // P14: the shift roster (HR's and the managers', with the working schedules), its terminal twin and its print
    "Time/ShiftRoster",
    "Time/ShiftRosterTui",
    "Time/ShiftRosterPrint",
    // P15: expense claims, a claim's detail and advances (every People user's and a self-service employee's by the expenses area's
    // own grant), and Payroll's InvoiceDetail (an expense claim's invoice for a holder of PEOPLE_EXPENSE_MANAGE)
    "Expenses",
    "Expenses/ExpenseClaims",
    "Expenses/ExpenseClaimDetail",
    "Expenses/EmployeeAdvances",
    "Payroll/InvoiceDetail",
    // P16: openings, applicants, an application, the interviews calendar (recruiters' and interviewers') and the People
    // administrator's forms (the survey builder with People's registration)
    "Staffing/Openings",
    "Staffing/ApplicantPipeline",
    "Staffing/ApplicantDetail",
    "Staffing/InterviewsCalendar",
    "Settings/Forms",
    "Settings/FormDetail",
    // P29: the reports (design §12 Reports, every People user's, each report its capability's) and the People administrator's
    // preferences (design §12 Settings PeoplePreferences)
    "Reports",
    "Settings/Preferences",
    // P18: skills and qualifications (design §10): the matrix and its terminal twin (development, HR and the managers), and the
    // qualifications (every People user's and a self-service employee's by the area's own grant)
    "Development",
    "Development/SkillsMatrix",
    "Development/SkillsMatrixTui",
    "Development/Qualifications",
    // P17: an offer, its letter's print and an employment change's lifecycle letter (HR's)
    "Staffing/OfferDetail",
    "Staffing/OfferLetter",
    "Employees/EmploymentLetter",
    // P19: training (design §10): the sessions, a session's detail and a completed place's certificate (every People user's and a
    // self-service employee's by the area's own grant)
    "Development/Training",
    "Development/TrainingDetail",
    "Development/TrainingCertificate",
    // P19 review: the training assessment forms (the learning administrator's and the People administrator's)
    "Development/AssessmentForms/List",
    "Development/AssessmentForms/FormDetail",
    // P20: reviews and goals (design §11): the reviews, a review's detail and its release print, the goals (every People user's and
    // a self-service employee's by the area's own grant), the review cycles and the review forms (the review administrator's)
    "Performance",
    "Performance/Reviews",
    "Performance/ReviewDetail",
    "Performance/ReviewRelease",
    "Performance/Goals",
    "Performance/ReviewCycles",
    "Performance/ReviewForms/List",
    "Performance/ReviewForms/FormDetail",
    // P22: payroll configuration (design §8): pay components, structures and groups, payroll's under Payroll beside Rates (the P22
    // review's call of Nov 12, 2026)
    "Payroll/PayComponents",
    "Payroll/PayComponentDetail",
    "Payroll/PayStructures",
    "Payroll/PayStructureDetail",
    "Payroll/PayGroups",
    // P23: pay assignments (design §8 PayAssignments), payroll's under Payroll
    "Payroll/PayAssignments",
    // P24: hours for pay (design §6, payroll's and the managers' under Time & leave) and pay adjustments (design §8, payroll's)
    "Time/HoursForPay",
    "Payroll/PayAdjustments",
    // P25: pay runs (design §8 PayRuns, PayRunDetail), payroll's under Payroll
    "Payroll/PayRuns",
    "Payroll/PayRunDetail",
    // P26: payslips and a slip's detail (design §8 Payslips, PayslipDetail), payroll's under Payroll, and the user's own issued
    // payslip beside SelfService
    "Payroll/Payslips",
    "Payroll/PayslipDetail",
    "MyPayslip"
]
function sharedContext(p) {
    if (p.appRoot && p.appRoot !== "People") denied("PEOPLE_CONTEXT", "People context is not available")
    const grants = rootGrants()
    // P8: a self-service employee without People: no capability but their self-service, their own employments and its link
    if (selfServiceOnly(grants)) {
        const own = call("mantle.humanres.PeopleServices.get#Scope")
        return {
            capabilities: {read: false, self: true},
            organizationPartyIds: [],
            activeOrganizationPartyId: null,
            defaultOrganizationPartyId: null,
            allOrganizations: false,
            organizationOptions: [],
            unitPartyIds: [],
            partyId: own.partyId || null,
            employments: Array.from(own.employments || []),
            appRoot: "People",
            linkBase: "//People",
            webBase: "/qapps/People",
            sharedLinks: {
                SelfService: "//People/SelfService",
                // P26: their own issued payslip (its own grant, BOSS_PPL_PAYSLIP_SELF)
                MyPayslip: "//People/MyPayslip",
                "Time/MyTime": "//People/Time/MyTime",
                // P12: their own leave requests and the team calendar (the time area's own grant)
                "Time/LeaveRequests": "//People/Time/LeaveRequests",
                "Time/LeaveRequestDetail": "//People/Time/LeaveRequestDetail",
                "Time/TeamCalendar": "//People/Time/TeamCalendar",
                // P13: their own attendance and clock (the time area's own grant)
                "Time/Attendance": "//People/Time/Attendance",
                "Time/Clock": "//People/Time/Clock",
                // P15: their own expense claims and advances (the expenses area's own grant)
                "Expenses/ExpenseClaims": "//People/Expenses/ExpenseClaims",
                "Expenses/ExpenseClaimDetail": "//People/Expenses/ExpenseClaimDetail",
                "Expenses/EmployeeAdvances": "//People/Expenses/EmployeeAdvances",
                // P18: their own qualifications (the Skills & training area's own grant)
                "Development/Qualifications": "//People/Development/Qualifications",
                // P19: the training sessions of their employers, their own places and certificates (the same area's grant)
                "Development/Training": "//People/Development/Training",
                "Development/TrainingDetail": "//People/Development/TrainingDetail",
                "Development/TrainingCertificate": "//People/Development/TrainingCertificate"
            }
        }
    }
    const userScope = required()
    const people = userScope.people
    return {
        capabilities: userScope.capabilities,
        organizationPartyIds: employerIds(userScope),
        activeOrganizationPartyId: people.activeOrganizationPartyId || null,
        // a new record's organization: the active, the only, or the user's own employer (impl-sales F111)
        defaultOrganizationPartyId: ec.resource
            .script("component://mr-mantle/service/mantle/facility/FacilityScope.js")
            .defaultOrganization({
                activeOrganizationPartyId: people.activeOrganizationPartyId,
                organizationPartyIds: employerIds(userScope),
                partyId: people.partyId
            }),
        allOrganizations: !!people.allOrganizations,
        organizationOptions: organizationOptions(employerIds(userScope), null, organizationOptionLimit),
        unitPartyIds: Array.from(people.unitPartyIds || []),
        partyId: people.partyId || null,
        employments: Array.from(people.employments || []),
        appRoot: "People",
        linkBase: "//People",
        webBase: "/qapps/People",
        sharedLinks: Object.fromEntries(linkPaths.map(path => [path, "//People/" + path]))
    }
}

// ===== record kinds =====
// Each kind a People screen or mount may be given: its name, icon, screen (once built) and its check, which refuses a record
// that does not exist and one outside the scope alike (RECORD_UNAVAILABLE). P1: an employer and a person; later phases add theirs.
const recordKinds = {
    organization: {
        name: "Employer",
        icon: "sym_o_corporate_fare",
        destination: null,
        read: (userScope, partyId) =>
            employerIds(userScope).includes(partyId) ? {label: organizationName(partyId), detail: "Employer"} : null
    },
    person: {
        name: "Person",
        icon: "sym_o_person",
        destination: "Employees/Employee360",
        read: (userScope, partyId) => {
            // Mantle's scope admits the person (self, team or staff) and names the employments it shows
            const admitted = call("mantle.humanres.PeopleServices.get#Scope", {partyId})
            const employers = Array.from(new Set(Array.from(admitted.partyEmployments || []).map(row => row.organizationPartyId)))
            return {label: personName(partyId), detail: employers.map(organizationName).join(", ")}
        }
    }
}
function recordOf(userScope, kind, recordId) {
    const definition = Object.hasOwn(recordKinds, kind) ? recordKinds[kind] : null
    const unavailable = () => denied("RECORD_UNAVAILABLE", (definition?.name || "Record") + " " + recordId + " is not available")
    if (!recordId || !definition) unavailable()
    let found
    try {
        found = definition.read(userScope, recordId)
    } catch (error) {
        if (lib.reasonCode(error) === "RECORD_UNAVAILABLE") unavailable()
        throw error
    }
    if (!found) unavailable()
    return {recordType: kind, recordId, kindName: definition.name, label: found.label, detail: found.detail}
}
// check#Record: a record a People screen or mount was given, refused unless the user may see it and, when a capability is
// named, holds it.
function checkRecord(p) {
    const userScope = required()
    if (p.capability) {
        if (!Object.hasOwn(userScope.capabilities, p.capability)) throw new Error("Unknown People capability " + p.capability)
        if (!userScope.capabilities[p.capability]) denied("PERMISSION_DENIED", "People " + p.capability + " is required")
    }
    return recordOf(userScope, p.recordType, p.recordId)
}

// ===== choices =====
// Each People drop-down: its options for the user, searched in the query ignoring case, with the selected value's label when it
// is in scope but not on the page. An unknown choice throws. Later phases add sources (positions, pay groups). P3: employees (one
// employer's current employees, the managers and members OrgStructure and OrgChart choose). P4: departments (one employer's), job
// classes and pay grades (names only: a grade's amounts are payroll's, PayrollSetupServices.find#PayGrades). P5: staff (one
// employer's current employees and agents, who an approval rule names to decide). P6: positions (one employer's seats in effect
// that are not inactive, the vacant ones first, by name; a department narrows them), workLocations (one employer's facilities)
// and the termination reasons and types (People's lookups, ended values left out). P9: workingSchedules (one employer's schedules
// not ended), holidayCalendars (one employer's and the shared ones), timeZones (the zone names) and employments (one employer's
// current employments, each by its person: the employment a schedule is assigned to). P11: leaveTypes (People's leave types, ended
// values left out) and leavePolicies (the policies of the employers an HR reader reads, or of one, not closed; by name).
function withSelected(options, selected, admits, label) {
    if (selected && !options.some(option => option.value === selected) && admits(selected))
        options.push({value: selected, label: label(selected)})
    return options
}
const choiceSources = {
    // the employers a staff reader sees
    employers: (userScope, term, selected) =>
        withSelected(
            organizationOptions(employerIds(userScope), term, choiceLimit),
            selected,
            partyId => employerIds(userScope).includes(partyId),
            organizationName
        ),
    // the employers and the departments and teams under them
    units: (userScope, term, selected) =>
        withSelected(
            organizationOptions(unitIds(userScope), term, choiceLimit),
            selected,
            partyId => unitIds(userScope).includes(partyId),
            organizationName
        ),
    // the people in scope: the current employees of the employers a staff reader sees, the caller's live reports and themselves
    // with self-service; by name or id
    people: (userScope, term, selected) => {
        const people = userScope.people
        const factory = ec.entity.conditionFactory
        const reach = []
        if (employerIds(userScope).length)
            reach.push(
                factory.makeCondition(
                    factory.makeCondition("relationshipTypeEnumId", "equals", "PrtEmployee"),
                    "and",
                    factory.makeCondition("toPartyId", "in", employerIds(userScope))
                )
            )
        const own = Array.from(people.reportPartyIds || []).concat(
            people.capabilities?.self && people.partyId ? [people.partyId] : []
        )
        if (own.length)
            reach.push(
                factory.makeCondition(
                    factory.makeCondition("relationshipTypeEnumId", "equals", "PrtEmployee"),
                    "and",
                    factory.makeCondition("fromPartyId", "in", own)
                )
            )
        if (!reach.length) return []
        let query = find("mantle.party.PartyFromAndRelationship")
            .condition(factory.makeCondition(reach, "or"))
            .conditionDate("fromDate", "thruDate", null)
            .selectField(["fromPartyId", "firstName", "lastName"])
            .orderBy(["^firstName", "^lastName"])
            .limit(choiceLimit)
        if (term)
            query = query.condition(
                factory.makeCondition(
                    ["fromPartyId", "firstName", "lastName"].map(field =>
                        factory.makeCondition(field, "like", likeText(term)).ignoreCase()
                    ),
                    "or"
                )
            )
        // a person employed by two employers is one option
        const byParty = new Map()
        for (const row of Array.from(query.list()))
            if (!byParty.has(row.fromPartyId))
                byParty.set(row.fromPartyId, {
                    value: row.fromPartyId,
                    label: [row.firstName, row.lastName].filter(Boolean).join(" ") || row.fromPartyId
                })
        const options = Array.from(byParty.values())
        return withSelected(
            options,
            selected,
            partyId => {
                try {
                    return !!recordOf(userScope, "person", partyId)
                } catch (error) {
                    return false
                }
            },
            personName
        )
    },
    // P3: one employer's current employees (organizationPartyId), else those of every employer a staff reader sees: the managers
    // and members OrgStructure and OrgChart choose
    employees: (userScope, term, selected, p) => employeeOptions(userScope, term, selected, p),
    // P5: one employer's current employees and agents (organizationPartyId; none without one), who an approval rule names
    staff: (userScope, term, selected, p) =>
        employeeOptions(userScope, term, selected, p, ["PrtEmployee", "PrtAgent"], !!p?.organizationPartyId),
    // P6: one employer's positions in effect and not inactive (organizationPartyId; none without one), narrowed to a department
    // (departmentPartyId) when one is chosen, each with its state of occupancy now: the seat a hire or a transfer takes
    positions: (userScope, term, selected, p) => {
        if (!p?.organizationPartyId || !employerIds(userScope).includes(p.organizationPartyId)) return []
        const factory = ec.entity.conditionFactory
        const base = () => {
            let query = find("mantle.humanres.position.EmplPosition")
                .condition("organizationPartyId", p.organizationPartyId)
                .condition("statusId", "not-equals", "EmpsInactive")
                .condition(
                    factory.makeCondition(
                        factory.makeCondition("thruDate", "is-null", null),
                        "or",
                        factory.makeCondition("thruDate", "greater", ec.user.nowTimestamp)
                    )
                )
            if (p.departmentPartyId) query = query.condition("departmentPartyId", p.departmentPartyId)
            return query
        }
        let query = base()
            .orderBy("^description")
            .limit(choiceLimit * 2)
        if (term)
            query = query.condition(
                factory.makeCondition(
                    ["emplPositionId", "description"].map(field =>
                        factory.makeCondition(field, "like", likeText(term)).ignoreCase()
                    ),
                    "or"
                )
            )
        const found = Array.from(query.list())
        const held = new Set(
            found.length
                ? Array.from(
                      find("mantle.humanres.position.EmplPositionParty")
                          .condition(
                              "emplPositionId",
                              "in",
                              found.map(row => row.emplPositionId)
                          )
                          .conditionDate("fromDate", "thruDate", null)
                          .list()
                  ).map(row => row.emplPositionId)
                : []
        )
        const label = row => (row.description || row.emplPositionId) + (held.has(row.emplPositionId) ? " (held)" : " (vacant)")
        const options = found
            .sort((a, b) => Number(held.has(a.emplPositionId)) - Number(held.has(b.emplPositionId)))
            .slice(0, choiceLimit)
            .map(row => ({value: row.emplPositionId, label: label(row)}))
        return withSelected(
            options,
            selected,
            id => base().condition("emplPositionId", id).count() > 0,
            id => one("mantle.humanres.position.EmplPosition", {emplPositionId: id})?.description || id
        )
    },
    // P6: one employer's facilities (organizationPartyId; none without one), an assignment's work location
    workLocations: (userScope, term, selected, p) => {
        if (!p?.organizationPartyId || !employerIds(userScope).includes(p.organizationPartyId)) return []
        const factory = ec.entity.conditionFactory
        const base = () => find("mantle.facility.Facility").condition("ownerPartyId", p.organizationPartyId)
        let query = base().orderBy("^facilityName").limit(choiceLimit)
        if (term)
            query = query.condition(
                factory.makeCondition(
                    ["facilityId", "facilityName"].map(field =>
                        factory.makeCondition(field, "like", likeText(term)).ignoreCase()
                    ),
                    "or"
                )
            )
        const options = Array.from(query.list()).map(row => ({value: row.facilityId, label: row.facilityName || row.facilityId}))
        return withSelected(
            options,
            selected,
            id => base().condition("facilityId", id).count() > 0,
            id => one("mantle.facility.Facility", {facilityId: id})?.facilityName || id
        )
    },
    // P6: the people a hire may be (Mantle's preview#Hire matches, public identity only, with their relationships with the
    // employer: by name the people related to the user's employers, anyone else by an exact email typed; the user's call), for an
    // HR editor; two characters at least. The selected one is labelled only when Mantle admits them by id (a related person), so a
    // supplied id names no one
    hirePeople: (userScope, term, selected, p) => {
        if (!userScope.capabilities.hrView || !userScope.capabilities.hrEdit) return []
        const organizationPartyId = p?.organizationPartyId || employerIds(userScope)[0] || null
        if (!organizationPartyId || !employerIds(userScope).includes(organizationPartyId)) return []
        const preview = parameters => {
            try {
                return lib.probe("mantle.humanres.PeopleServices.preview#Hire", Object.assign({organizationPartyId}, parameters))
            } catch (error) {
                // a People user who may not hire finds no one; a person not admitted by id is not named
                if (!["PERMISSION_DENIED", "RECORD_UNAVAILABLE"].includes(codeOf(error))) throw error
                return null
            }
        }
        const options =
            term.length >= 2
                ? Array.from(preview({term})?.matches || []).map(row => ({
                      value: row.partyId,
                      label:
                          (row.preferredName ? row.personName + " (" + row.preferredName + ")" : row.personName) +
                          (row.relationshipText ? " · " + row.relationshipText : "")
                  }))
                : []
        if (selected && !options.some(option => option.value === selected)) {
            const person = preview({partyId: selected})?.person
            if (person?.partyId === selected) options.push({value: selected, label: person.personName})
        }
        return options
    },
    // P6: the termination reasons and types (People's lookups, Enumeration.thruDate: an ended value left out)
    terminationReasons: (userScope, term, selected) => vocabularyOptions("TerminationReason", term, selected),
    terminationTypes: (userScope, term, selected) => vocabularyOptions("TerminationType", term, selected),
    // P4: the departments of one employer (organizationPartyId; none without one), a position's department
    departments: (userScope, term, selected, p) => {
        if (!p?.organizationPartyId || !employerIds(userScope).includes(p.organizationPartyId)) return []
        const under = Array.from(
            call("mantle.humanres.PeopleServices.get#Scope", {organizationPartyId: p.organizationPartyId}).unitPartyIds || []
        )
        const departments = under.length
            ? Array.from(
                  find("mantle.party.PartyRole")
                      .condition("partyId", "in", under)
                      .condition("roleTypeId", "OrgDepartment")
                      .selectField("partyId")
                      .list()
              ).map(row => row.partyId)
            : []
        return withSelected(
            organizationOptions(departments, term, choiceLimit),
            selected,
            partyId => departments.includes(partyId),
            organizationName
        )
    },
    // P4: the current job classes by title (a staff reader's), and the pay grades by name, never an amount
    jobClasses: (userScope, term, selected) => {
        if (!userScope.capabilities.staff) return []
        const factory = ec.entity.conditionFactory
        const current = () =>
            find("mantle.humanres.position.EmplPositionClass").condition(
                factory.makeCondition(
                    factory.makeCondition("thruDate", "is-null", null),
                    "or",
                    factory.makeCondition("thruDate", "greater", ec.user.nowTimestamp)
                )
            )
        let query = current().orderBy("^title").limit(choiceLimit)
        if (term)
            query = query.condition(
                factory.makeCondition(
                    ["emplPositionClassId", "title"].map(field =>
                        factory.makeCondition(field, "like", likeText(term)).ignoreCase()
                    ),
                    "or"
                )
            )
        const options = Array.from(query.list()).map(row => ({
            value: row.emplPositionClassId,
            label: row.title || row.emplPositionClassId
        }))
        return withSelected(
            options,
            selected,
            id => current().condition("emplPositionClassId", id).count() > 0,
            id => one("mantle.humanres.position.EmplPositionClass", {emplPositionClassId: id})?.title || id
        )
    },
    // the grades of PayrollSetupServices' read scope: the shared ones and those owned by an employer the user reads; with
    // organizationPartyId (a position's employer, in scope), the ones its positions take, its own and the shared ones
    payGrades: (userScope, term, selected, p) => {
        if (!userScope.capabilities.staff) return []
        const factory = ec.entity.conditionFactory
        const owners = p?.organizationPartyId
            ? employerIds(userScope).filter(partyId => partyId === p.organizationPartyId)
            : employerIds(userScope)
        const readable = () =>
            find("mantle.humanres.rate.PayGrade").condition(
                factory.makeCondition(
                    [factory.makeCondition("organizationPartyId", "is-null", null)].concat(
                        owners.length ? [factory.makeCondition("organizationPartyId", "in", owners)] : []
                    ),
                    "or"
                )
            )
        let query = readable().selectField(["payGradeId", "description"]).orderBy("^description")
        if (term)
            query = query.condition(
                factory.makeCondition(
                    ["payGradeId", "description"].map(field => factory.makeCondition(field, "like", likeText(term)).ignoreCase()),
                    "or"
                )
            )
        const options = Array.from(query.limit(choiceLimit).list()).map(row => ({
            value: row.payGradeId,
            label: row.description || row.payGradeId
        }))
        const gradeName = id => one("mantle.humanres.rate.PayGrade", {payGradeId: id})?.description || id
        return withSelected(options, selected, id => readable().condition("payGradeId", id).count() > 0, gradeName)
    },
    // P9: one employer's working schedules not ended (organizationPartyId; none without one), by name
    workingSchedules: (userScope, term, selected, p) => {
        if (!userScope.capabilities.staff || !p?.organizationPartyId || !employerIds(userScope).includes(p.organizationPartyId))
            return []
        const factory = ec.entity.conditionFactory
        const open = () =>
            find("mantle.humanres.schedule.WorkingSchedule")
                .condition("organizationPartyId", p.organizationPartyId)
                .condition(
                    factory.makeCondition(
                        factory.makeCondition("thruDate", "is-null", null),
                        "or",
                        factory.makeCondition("thruDate", "greater", ec.user.nowTimestamp)
                    )
                )
        let query = open()
            .selectField(["workingScheduleId", "scheduleName", "timeZone"])
            .orderBy("^scheduleName")
            .limit(choiceLimit)
        if (term)
            query = query.condition(
                factory.makeCondition(
                    ["workingScheduleId", "scheduleName"].map(field =>
                        factory.makeCondition(field, "like", likeText(term)).ignoreCase()
                    ),
                    "or"
                )
            )
        const label = row => (row.scheduleName || row.workingScheduleId) + (row.timeZone ? " (" + row.timeZone + ")" : "")
        const options = Array.from(query.list()).map(row => ({value: row.workingScheduleId, label: label(row)}))
        return withSelected(
            options,
            selected,
            id => open().condition("workingScheduleId", id).count() > 0,
            id => label(one("mantle.humanres.schedule.WorkingSchedule", {workingScheduleId: id}) || {workingScheduleId: id})
        )
    },
    // P9: the holiday calendars of one employer (organizationPartyId) and the shared ones, or of every employer a staff reader sees
    holidayCalendars: (userScope, term, selected, p) => {
        if (!userScope.capabilities.staff) return []
        const owners = p?.organizationPartyId
            ? employerIds(userScope).filter(partyId => partyId === p.organizationPartyId)
            : employerIds(userScope)
        const factory = ec.entity.conditionFactory
        const readable = () =>
            find("mantle.work.effort.WorkEffortCategory")
                .condition("categoryTypeEnumId", "WcatHoliday")
                .condition(
                    factory.makeCondition(
                        [factory.makeCondition("ownerPartyId", "is-null", null)].concat(
                            owners.length ? [factory.makeCondition("ownerPartyId", "in", owners)] : []
                        ),
                        "or"
                    )
                )
        let query = readable().selectField(["workEffortCategoryId", "description"]).orderBy("^description").limit(choiceLimit)
        if (term)
            query = query.condition(
                factory.makeCondition(
                    ["workEffortCategoryId", "description"].map(field =>
                        factory.makeCondition(field, "like", likeText(term)).ignoreCase()
                    ),
                    "or"
                )
            )
        const options = Array.from(query.list()).map(row => ({
            value: row.workEffortCategoryId,
            label: row.description || row.workEffortCategoryId
        }))
        return withSelected(
            options,
            selected,
            id => readable().condition("workEffortCategoryId", id).count() > 0,
            id => one("mantle.work.effort.WorkEffortCategory", {workEffortCategoryId: id})?.description || id
        )
    },
    // P9: the time zone names, searched by name (a closed list the server holds)
    timeZones: (userScope, term, selected) => {
        const all = Array.from(ec.l10n.getAvailableTimeZones() || [])
            .map(String)
            .sort()
        const label = zone => zone.replace(/_/g, " ")
        const wanted = term.toLowerCase()
        const options = all
            .filter(zone => !wanted || label(zone).toLowerCase().includes(wanted))
            .slice(0, choiceLimit)
            .map(zone => ({value: zone, label: label(zone)}))
        return withSelected(options, selected, zone => all.includes(zone), label)
    },
    // P9: one employer's current employments (organizationPartyId, an HR reader's; none without one), each by its person
    employments: (userScope, term, selected, p) => {
        if (!userScope.capabilities.hrView || !p?.organizationPartyId || !employerIds(userScope).includes(p.organizationPartyId))
            return []
        const factory = ec.entity.conditionFactory
        const base = () =>
            find("mantle.party.PartyFromAndRelationship")
                .condition("relationshipTypeEnumId", "PrtEmployee")
                .condition("toPartyId", p.organizationPartyId)
                .conditionDate("fromDate", "thruDate", null)
                .selectField(["partyRelationshipId", "fromPartyId", "firstName", "lastName"])
                .orderBy(["^firstName", "^lastName"])
        let query = base().limit(choiceLimit)
        if (term)
            query = query.condition(
                factory.makeCondition(
                    ["fromPartyId", "firstName", "lastName"].map(field =>
                        factory.makeCondition(field, "like", likeText(term)).ignoreCase()
                    ),
                    "or"
                )
            )
        const label = row => [row.firstName, row.lastName].filter(Boolean).join(" ") || row.fromPartyId
        const options = Array.from(query.list()).map(row => ({value: row.partyRelationshipId, label: label(row)}))
        return withSelected(
            options,
            selected,
            id => base().condition("partyRelationshipId", id).count() > 0,
            id => label(Array.from(base().condition("partyRelationshipId", id).list())[0] || {fromPartyId: id})
        )
    },
    // P11: People's leave types (an HR vocabulary; ended values left out)
    leaveTypes: (userScope, term, selected) => vocabularyOptions("PeopleLeaveType", term, selected),
    // P18: the skill types and qualification types (People's lookups, ended values left out), and the skill levels by their number
    // (each value's enumCode), a requirement's least level and an evaluation's
    skillTypes: (userScope, term, selected) => vocabularyOptions("SkillType", term, selected),
    qualificationTypes: (userScope, term, selected) => vocabularyOptions("QualificationType", term, selected),
    skillLevels: (userScope, term, selected) => {
        const wanted = String(term || "").toLowerCase()
        const options = vocabularyOptions("SkillLevel", "", null)
            .map(option => {
                const code = one("moqui.basic.Enumeration", {enumId: option.value})?.enumCode
                return /^\d+$/.test(String(code || "")) ? {value: String(code), label: code + " " + option.label} : null
            })
            .filter(Boolean)
        return options.filter(option => !wanted || option.label.toLowerCase().includes(wanted) || option.value === selected)
    },
    // P11: the leave policies not closed of the employers an HR reader reads (or of organizationPartyId), by name
    leavePolicies: (userScope, term, selected, p) => {
        if (!userScope.capabilities.hrView) return []
        const owners = p?.organizationPartyId
            ? employerIds(userScope).filter(partyId => partyId === p.organizationPartyId)
            : employerIds(userScope)
        if (!owners.length) return []
        const factory = ec.entity.conditionFactory
        const open = () =>
            find("mantle.humanres.leave.LeavePolicy")
                .condition("organizationPartyId", "in", owners)
                .condition(
                    factory.makeCondition(
                        factory.makeCondition("thruDate", "is-null", null),
                        "or",
                        factory.makeCondition("thruDate", "greater", ec.user.nowTimestamp)
                    )
                )
        let query = open()
            .selectField(["leavePolicyId", "policyName", "organizationPartyId"])
            .orderBy("^policyName")
            .limit(choiceLimit)
        if (term)
            query = query.condition(
                factory.makeCondition(
                    ["leavePolicyId", "policyName"].map(field =>
                        factory.makeCondition(field, "like", likeText(term)).ignoreCase()
                    ),
                    "or"
                )
            )
        const label = row =>
            (row.policyName || row.leavePolicyId) +
            (owners.length > 1 ? " (" + organizationName(row.organizationPartyId) + ")" : "")
        const options = Array.from(query.list()).map(row => ({value: row.leavePolicyId, label: label(row)}))
        return withSelected(
            options,
            selected,
            id => open().condition("leavePolicyId", id).count() > 0,
            id => label(one("mantle.humanres.leave.LeavePolicy", {leavePolicyId: id}) || {leavePolicyId: id})
        )
    }
}
// The current values of one of People's HR vocabularies (an Enumeration family whose ended values, thruDate, are left out), in
// their order, searched by name.
function vocabularyOptions(enumTypeId, term, selected) {
    const factory = ec.entity.conditionFactory
    const current = () =>
        find("moqui.basic.Enumeration")
            .condition("enumTypeId", enumTypeId)
            .condition(
                factory.makeCondition(
                    factory.makeCondition("thruDate", "is-null", null),
                    "or",
                    factory.makeCondition("thruDate", "greater", ec.user.nowTimestamp)
                )
            )
    let query = current().orderBy(["sequenceNum", "description"]).limit(choiceLimit)
    if (term) query = query.condition(factory.makeCondition("description", "like", likeText(term)).ignoreCase())
    const options = Array.from(query.list()).map(row => ({value: row.enumId, label: row.description || row.enumId}))
    return withSelected(
        options,
        selected,
        id => current().condition("enumId", id).count() > 0,
        id => one("moqui.basic.Enumeration", {enumId: id})?.description || id
    )
}
// The current employees of the employers a staff reader sees, or of the one asked for (refused outside, as none): each person once,
// by name or id; the selected one when it is one of them. relationshipTypes widens them (P5's staff: agents too), and a source that
// needs its employer (required) answers none without one.
function employeeOptions(userScope, term, selected, p, relationshipTypes = ["PrtEmployee"], required = true) {
    if (!required) return []
    const employers = p?.organizationPartyId
        ? employerIds(userScope).filter(partyId => partyId === p.organizationPartyId)
        : employerIds(userScope)
    if (!employers.length) return []
    const factory = ec.entity.conditionFactory
    const base = () =>
        find("mantle.party.PartyFromAndRelationship")
            .condition("relationshipTypeEnumId", "in", relationshipTypes)
            .condition("toPartyId", "in", employers)
            .conditionDate("fromDate", "thruDate", null)
            .selectField(["fromPartyId", "firstName", "lastName"])
            .orderBy(["^firstName", "^lastName"])
    let query = base().limit(choiceLimit)
    if (term)
        query = query.condition(
            factory.makeCondition(
                ["fromPartyId", "firstName", "lastName"].map(field =>
                    factory.makeCondition(field, "like", likeText(term)).ignoreCase()
                ),
                "or"
            )
        )
    const byParty = new Map()
    for (const row of Array.from(query.list()))
        if (!byParty.has(row.fromPartyId))
            byParty.set(row.fromPartyId, {
                value: row.fromPartyId,
                label: [row.firstName, row.lastName].filter(Boolean).join(" ") || row.fromPartyId
            })
    return withSelected(
        Array.from(byParty.values()),
        selected,
        partyId => base().condition("fromPartyId", partyId).count() > 0,
        personName
    )
}
// ===== P16: recruiting's choices (design §5) =====
// one employer's approved active seats (EmpsActive, in effect), the seats an opening fills
choiceSources.approvedSeats = (userScope, term, selected, p) => {
    if (!p?.organizationPartyId || !employerIds(userScope).includes(p.organizationPartyId)) return []
    const factory = ec.entity.conditionFactory
    const base = () =>
        find("mantle.humanres.position.EmplPosition")
            .condition("organizationPartyId", p.organizationPartyId)
            .condition("statusId", "EmpsActive")
            .condition(
                factory.makeCondition(
                    factory.makeCondition("thruDate", "is-null", null),
                    "or",
                    factory.makeCondition("thruDate", "greater", ec.user.nowTimestamp)
                )
            )
    let query = base().orderBy("^description").limit(choiceLimit)
    if (term)
        query = query.condition(
            factory.makeCondition(
                ["emplPositionId", "description"].map(field => factory.makeCondition(field, "like", likeText(term)).ignoreCase()),
                "or"
            )
        )
    const options = Array.from(query.list()).map(row => ({
        value: row.emplPositionId,
        label: row.description || row.emplPositionId
    }))
    return withSelected(
        options,
        selected,
        id => base().condition("emplPositionId", id).count() > 0,
        id => one("mantle.humanres.position.EmplPosition", {emplPositionId: id})?.description || id
    )
}
// one employer's published interview scorecards (mantle.party.FormDefinitionServices.find#Forms checks the reader)
choiceSources.scorecardForms = (userScope, term, selected, p) => {
    if (!p?.organizationPartyId) return []
    let found
    try {
        found = lib.probe("mantle.party.FormDefinitionServices.find#Forms", {
            purposeEnumIds: ["DbfpInterviewScorecard"],
            organizationPartyId: p.organizationPartyId
        })
    } catch (error) {
        return []
    }
    const wanted = String(term || "").toLowerCase()
    return Array.from(found.forms || [])
        .filter(form => form.published && (!wanted || form.description.toLowerCase().includes(wanted)))
        .map(form => ({value: form.formId, label: form.description}))
}
// the openings a recruiter reads (find#Openings), the open ones first, a closed one said so
choiceSources.openings = (userScope, term, selected) => {
    let found
    try {
        found = lib.probe("mantle.humanres.RecruitingServices.find#Openings", {
            term: term || null,
            includeClosed: true,
            pageSize: 100
        })
    } catch (error) {
        return []
    }
    const rows = Array.from(found.openings || []).sort((a, b) => Number(!a.takesApplications) - Number(!b.takesApplications))
    const options = rows
        .slice(0, choiceLimit)
        .map(row => ({
            value: row.jobOpeningId,
            label: row.title + (row.takesApplications ? "" : " (" + row.stateText.toLowerCase() + ")")
        }))
    if (selected && !options.some(option => option.value === selected)) {
        const chosen = rows.find(row => row.jobOpeningId === selected)
        if (chosen) options.push({value: chosen.jobOpeningId, label: chosen.title})
    }
    return options
}
// the people an application may be recorded for by id: the current employees and agents of the employers a recruiter reads
// and their earlier applicants (create#Application checks again), by name
choiceSources.applicants = (userScope, term, selected, p) => {
    const employers = employerIds(userScope)
    if (!userScope.capabilities.recruitView || !employers.length) return []
    const options = employeeOptions(userScope, term, selected, p, ["PrtEmployee", "PrtAgent"])
    const applicantIds = Array.from(
        find("mantle.humanres.employment.EmploymentApplication")
            .condition("organizationPartyId", "in", employers)
            .selectField("applyingPartyId")
            .distinct(true)
            .limit(500)
            .list()
    ).map(row => row.applyingPartyId)
    if (applicantIds.length) {
        const factory = ec.entity.conditionFactory
        let query = find("mantle.party.Person")
            .condition("partyId", "in", applicantIds)
            .orderBy(["^firstName", "^lastName"])
            .limit(choiceLimit)
        if (term)
            query = query.condition(
                factory.makeCondition(
                    ["firstName", "lastName"].map(field => factory.makeCondition(field, "like", likeText(term)).ignoreCase()),
                    "or"
                )
            )
        for (const row of Array.from(query.list()))
            if (!options.some(option => option.value === row.partyId))
                options.push({
                    value: row.partyId,
                    label: [row.firstName, row.lastName].filter(Boolean).join(" ") + " (applicant)"
                })
    }
    return options.slice(0, choiceLimit)
}
// the sources of an application (EmploymentApplicationReferredBy)
choiceSources.applicationSources = (userScope, term, selected) =>
    vocabularyOptions("EmploymentApplicationReferredBy", term, selected)

// ===== P19: training's choices (design §10 Training) =====
// who may train a session: the current employees and agents of the employers a development reader administers (store#Training checks
// the course's employer)
choiceSources.trainers = (userScope, term, selected, p) =>
    userScope.capabilities.developView ? employeeOptions(userScope, term, selected, p, ["PrtEmployee", "PrtAgent"]) : []
// the published training assessment forms of one employer (organizationPartyId), else of every employer the user reads
// (mantle.party.FormDefinitionServices.find#Forms checks the reader per employer), labelled with the employer when several
choiceSources.trainingForms = (userScope, term, selected, p) => {
    const employers = p?.organizationPartyId
        ? employerIds(userScope).filter(partyId => partyId === p.organizationPartyId)
        : employerIds(userScope)
    const wanted = String(term || "").toLowerCase()
    const options = []
    for (const organizationPartyId of employers.slice(0, 20)) {
        let found
        try {
            found = lib.probe("mantle.party.FormDefinitionServices.find#Forms", {
                purposeEnumIds: ["DbfpTrainingAssessment"],
                organizationPartyId
            })
        } catch (error) {
            continue
        }
        for (const form of Array.from(found.forms || []))
            if (form.published && (!wanted || form.description.toLowerCase().includes(wanted) || form.formId === selected))
                options.push({
                    value: form.formId,
                    label: form.description + (employers.length > 1 ? " · " + organizationName(organizationPartyId) : "")
                })
    }
    return options.slice(0, choiceLimit)
}

// People follow-up 3: the meeting rooms a training session or an interview books (Mantle's EventRooms.js: through Maintenance's
// resource booking, its policy, clashes and blackouts), as Commons' Schedules lists them: a room (FcTpRoom) bookable and not
// closed, by name or its site's, for a development reader or a recruiter
choiceSources.rooms = (userScope, term, selected) => {
    if (!userScope.capabilities.developView && !userScope.capabilities.recruitView) return []
    const factory = ec.entity.conditionFactory
    const base = () =>
        find("mantle.facility.Facility")
            .condition("facilityTypeEnumId", "FcTpRoom")
            .condition("bookable", "Y")
            .condition(
                factory.makeCondition(
                    factory.makeCondition("closedDate", "is-null", null),
                    "or",
                    factory.makeCondition("closedDate", "greater", ec.user.nowTimestamp)
                )
            )
    let query = base().orderBy("^facilityName").limit(choiceLimit)
    if (term)
        query = query.condition(
            factory.makeCondition(
                ["facilityId", "facilityName"].map(field => factory.makeCondition(field, "like", likeText(term)).ignoreCase()),
                "or"
            )
        )
    const rooms = Array.from(query.list())
    const sites = new Map(
        rooms.some(row => row.parentFacilityId)
            ? Array.from(
                  find("mantle.facility.Facility")
                      .condition("facilityId", "in", Array.from(new Set(rooms.map(row => row.parentFacilityId).filter(Boolean))))
                      .selectField("facilityId,facilityName")
                      .list()
              ).map(row => [row.facilityId, row.facilityName || row.facilityId])
            : []
    )
    const label = row =>
        (row.facilityName || row.facilityId) + (row.parentFacilityId ? " · " + (sites.get(row.parentFacilityId) || "") : "")
    return withSelected(
        rooms.map(row => ({value: row.facilityId, label: label(row)})),
        selected,
        facilityId => base().condition("facilityId", facilityId).count() > 0,
        facilityId => one("mantle.facility.Facility", {facilityId})?.facilityName || facilityId
    )
}

// P20: the published review forms of one employer (organizationPartyId), else of every employer the user reads, as trainingForms
choiceSources.reviewForms = (userScope, term, selected, p) => {
    const employers = p?.organizationPartyId
        ? employerIds(userScope).filter(partyId => partyId === p.organizationPartyId)
        : employerIds(userScope)
    const wanted = String(term || "").toLowerCase()
    const options = []
    for (const organizationPartyId of employers.slice(0, 20)) {
        let found
        try {
            found = lib.probe("mantle.party.FormDefinitionServices.find#Forms", {
                purposeEnumIds: ["DbfpReview"],
                organizationPartyId
            })
        } catch (error) {
            continue
        }
        for (const form of Array.from(found.forms || []))
            if (form.published && (!wanted || form.description.toLowerCase().includes(wanted) || form.formId === selected))
                options.push({
                    value: form.formId,
                    label: form.description + (employers.length > 1 ? " · " + organizationName(organizationPartyId) : "")
                })
    }
    return options.slice(0, choiceLimit)
}
// P20: the colleagues a reviewer asks for feedback and development names a reviewer: the current employees and agents of the review's
// employer (organizationPartyId), for one who works for it now or reads it as staff; Mantle's change#ReviewState checks again
choiceSources.reviewColleagues = (userScope, term, selected, p) => {
    const organizationPartyId = p?.organizationPartyId
    if (!organizationPartyId) return []
    const partyId = ec.user.userAccount?.partyId
    const worksThere =
        !!partyId &&
        find("mantle.party.PartyRelationship")
            .condition("relationshipTypeEnumId", "in", ["PrtEmployee", "PrtAgent"])
            .condition({fromPartyId: partyId, toPartyId: organizationPartyId})
            .conditionDate("fromDate", "thruDate", null)
            .count() > 0
    if (!worksThere && !employerIds(userScope).includes(organizationPartyId)) return []
    const factory = ec.entity.conditionFactory
    let query = find("mantle.party.PartyFromAndRelationship")
        .condition("relationshipTypeEnumId", "in", ["PrtEmployee", "PrtAgent"])
        .condition("toPartyId", organizationPartyId)
        .conditionDate("fromDate", "thruDate", null)
        .selectField(["fromPartyId", "firstName", "lastName"])
        .orderBy(["^firstName", "^lastName"])
        .limit(choiceLimit)
    if (term)
        query = query.condition(
            factory.makeCondition(
                ["fromPartyId", "firstName", "lastName"].map(field =>
                    factory.makeCondition(field, "like", likeText(term)).ignoreCase()
                ),
                "or"
            )
        )
    const byParty = new Map()
    for (const row of Array.from(query.list()))
        if (!byParty.has(row.fromPartyId))
            byParty.set(row.fromPartyId, {
                value: row.fromPartyId,
                label: [row.firstName, row.lastName].filter(Boolean).join(" ") || row.fromPartyId
            })
    if (selected && !byParty.has(selected) && byParty.size < choiceLimit) {
        const row = find("mantle.party.PartyFromAndRelationship")
            .condition("relationshipTypeEnumId", "in", ["PrtEmployee", "PrtAgent"])
            .condition({toPartyId: organizationPartyId, fromPartyId: selected})
            .conditionDate("fromDate", "thruDate", null)
            .selectField(["fromPartyId", "firstName", "lastName"])
            .one()
        if (row)
            byParty.set(selected, {value: selected, label: [row.firstName, row.lastName].filter(Boolean).join(" ") || selected})
    }
    return Array.from(byParty.values())
}

// P22: payroll configuration's drop-downs, a payroll reader's (PAYROLL_VIEW) of one employer in scope (organizationPartyId): its pay
// components in use (code and name) for a structure, its pay groups for a preview, its accounts (code and name) for a component's
// mapping; and the registered localizations. No amount is in any of them.
const payrollEmployer = (userScope, p) =>
    userScope.capabilities.payrollView && p?.organizationPartyId && employerIds(userScope).includes(p.organizationPartyId)
        ? p.organizationPartyId
        : null
const inUse = query => {
    const factory = ec.entity.conditionFactory
    return query.condition(
        factory.makeCondition(
            factory.makeCondition("thruDate", "is-null", null),
            "or",
            factory.makeCondition("thruDate", "greater", ec.user.nowTimestamp)
        )
    )
}
function searched(query, term, fields) {
    if (!term) return query
    const factory = ec.entity.conditionFactory
    return query.condition(
        factory.makeCondition(
            fields.map(field => factory.makeCondition(field, "like", likeText(term)).ignoreCase()),
            "or"
        )
    )
}
choiceSources.payComponents = (userScope, term, selected, p) => {
    const organizationPartyId = payrollEmployer(userScope, p)
    if (!organizationPartyId) return []
    const C = "mantle.humanres.payroll.PayrollComponent"
    const label = row => row.componentCode + " · " + (row.componentName || row.componentCode)
    const rows = Array.from(
        searched(inUse(find(C).condition("organizationPartyId", organizationPartyId)), term, ["componentCode", "componentName"])
            .orderBy("componentCode")
            .limit(choiceLimit)
            .list()
    )
    return withSelected(
        rows.map(row => ({value: row.payrollComponentId, label: label(row)})),
        selected,
        id => !!one(C, {payrollComponentId: id, organizationPartyId}),
        id => label(one(C, {payrollComponentId: id}))
    )
}
choiceSources.payGroups = (userScope, term, selected, p) => {
    const organizationPartyId = payrollEmployer(userScope, p)
    if (!organizationPartyId) return []
    const G = "mantle.humanres.payroll.PayrollGroup"
    const rows = Array.from(
        searched(inUse(find(G).condition("organizationPartyId", organizationPartyId)), term, ["groupName"])
            .orderBy("^groupName")
            .limit(choiceLimit)
            .list()
    )
    return withSelected(
        rows.map(row => ({value: row.payrollGroupId, label: row.groupName || row.payrollGroupId})),
        selected,
        id => !!one(G, {payrollGroupId: id, organizationPartyId}),
        id => one(G, {payrollGroupId: id})?.groupName || id
    )
}
choiceSources.glAccounts = (userScope, term, selected, p) => {
    const organizationPartyId = payrollEmployer(userScope, p)
    if (!organizationPartyId) return []
    const ownIds = Array.from(
        find("mantle.ledger.account.GlAccountOrganization")
            .condition("organizationPartyId", organizationPartyId)
            .selectField("glAccountId")
            .list()
    ).map(row => row.glAccountId)
    if (!ownIds.length) return []
    const A = "mantle.ledger.account.GlAccount"
    const label = row => [row.accountCode, row.accountName].filter(Boolean).join(" ")
    const rows = Array.from(
        searched(find(A).condition("glAccountId", "in", ownIds), term, ["accountCode", "accountName"])
            .orderBy("accountCode")
            .limit(choiceLimit)
            .list()
    )
    return withSelected(
        rows.map(row => ({value: row.glAccountId, label: label(row)})),
        selected,
        id => ownIds.includes(id),
        id => label(one(A, {glAccountId: id}) || {accountCode: id})
    )
}
// P23: pay assignments' drop-downs, a payroll reader's of one employer in scope: its current employments by the person's name (whom
// AssignPay puts on a structure), its structures published and not ended (by name), the elective lines of one structure
// (payrollStructureId: its components by code and name) and Mantle's benefit types. No amount is in any of them.
choiceSources.payEmployments = (userScope, term, selected, p) => {
    const organizationPartyId = payrollEmployer(userScope, p)
    if (!organizationPartyId) return []
    const base = () =>
        find("mantle.party.PartyFromAndRelationship")
            .condition("relationshipTypeEnumId", "PrtEmployee")
            .condition("toPartyId", organizationPartyId)
            .conditionDate("fromDate", "thruDate", null)
            .selectField(["partyRelationshipId", "fromPartyId", "firstName", "lastName"])
            .orderBy(["^firstName", "^lastName"])
    const label = row => [row.firstName, row.lastName].filter(Boolean).join(" ") || row.fromPartyId
    const rows = Array.from(searched(base(), term, ["fromPartyId", "firstName", "lastName"]).limit(choiceLimit).list())
    return withSelected(
        rows.map(row => ({value: row.partyRelationshipId, label: label(row)})),
        selected,
        id => base().condition("partyRelationshipId", id).count() > 0,
        id => label(Array.from(base().condition("partyRelationshipId", id).list())[0] || {fromPartyId: id})
    )
}
choiceSources.payStructures = (userScope, term, selected, p) => {
    const organizationPartyId = payrollEmployer(userScope, p)
    if (!organizationPartyId) return []
    const S = "mantle.humanres.payroll.PayrollStructure"
    const base = () => inUse(find(S).condition({organizationPartyId, statusId: "PtsPublished"}))
    const rows = Array.from(searched(base(), term, ["structureName"]).orderBy("^structureName").limit(choiceLimit).list())
    const label = row => row.structureName + " · " + row.currencyUomId
    return withSelected(
        rows.map(row => ({value: row.payrollStructureId, label: label(row)})),
        selected,
        id => base().condition("payrollStructureId", id).count() > 0,
        id => label(one(S, {payrollStructureId: id}) || {structureName: id, currencyUomId: ""})
    )
}
choiceSources.payElections = (userScope, term, selected, p) => {
    if (!userScope.capabilities.payrollView || !p?.payrollStructureId) return []
    const structure = one("mantle.humanres.payroll.PayrollStructure", {payrollStructureId: p.payrollStructureId})
    if (!structure || !employerIds(userScope).includes(structure.organizationPartyId)) return []
    const componentIds = Array.from(
        inUse(
            find("mantle.humanres.payroll.PayrollStructureComponent").condition({
                payrollStructureId: structure.payrollStructureId,
                eligibilityEnumId: "PleElected",
                statusId: "PtsPublished"
            })
        )
            .selectField("payrollComponentId")
            .list()
    ).map(row => row.payrollComponentId)
    if (!componentIds.length) return []
    const C = "mantle.humanres.payroll.PayrollComponent"
    const label = row => row.componentCode + " · " + (row.componentName || row.componentCode)
    return Array.from(
        searched(find(C).condition("payrollComponentId", "in", componentIds), term, ["componentCode", "componentName"])
            .orderBy("componentCode")
            .limit(choiceLimit)
            .list()
    ).map(row => ({value: row.payrollComponentId, label: label(row)}))
}
choiceSources.benefitTypes = (userScope, term, selected) => {
    if (!userScope.capabilities.payrollView) return []
    const B = "mantle.humanres.employment.BenefitType"
    const rows = Array.from(searched(find(B), term, ["description"]).orderBy("description").limit(choiceLimit).list())
    return withSelected(
        rows.map(row => ({value: row.benefitTypeId, label: row.description || row.benefitTypeId})),
        selected,
        id => !!one(B, {benefitTypeId: id}),
        id => one(B, {benefitTypeId: id})?.description || id
    )
}
// P24: hours for pay's pay groups (a payroll reader's every group of the employers in scope, a manager's the groups their reports
// are paid in now), a group's prepared periods (newest first; for a reader of the group), and an employment's employee advances
// (a payroll reader's, by their purpose and dates; never an amount). Mantle checks each again where it is used.
const hoursGroupIds = userScope => {
    const G = "mantle.humanres.payroll.PayrollGroup"
    if (userScope.capabilities.payrollView)
        return employerIds(userScope).length
            ? Array.from(
                  inUse(find(G).condition("organizationPartyId", "in", employerIds(userScope)))
                      .selectField("payrollGroupId")
                      .list()
              ).map(row => row.payrollGroupId)
            : []
    const reportIds = Array.from(userScope.people.reportPartyIds || [])
    if (!userScope.capabilities.team || !reportIds.length) return []
    return Array.from(
        new Set(
            Array.from(
                find("mantle.humanres.payroll.PayrollAssignment")
                    .condition("partyId", "in", reportIds)
                    .condition("isPrimary", "Y")
                    .conditionDate("fromDate", "thruDate", null)
                    .selectField("payrollGroupId")
                    .list()
            ).map(row => row.payrollGroupId)
        )
    )
}
choiceSources.hoursGroups = (userScope, term, selected) => {
    const ids = hoursGroupIds(userScope)
    if (!ids.length) return []
    const G = "mantle.humanres.payroll.PayrollGroup"
    const label = row => (row.groupName || row.payrollGroupId) + " · " + organizationName(row.organizationPartyId)
    const rows = Array.from(
        searched(find(G).condition("payrollGroupId", "in", ids), term, ["groupName"])
            .orderBy("^groupName")
            .limit(choiceLimit)
            .list()
    )
    return withSelected(
        rows.map(row => ({value: row.payrollGroupId, label: label(row)})),
        selected,
        id => ids.includes(id),
        id => label(one(G, {payrollGroupId: id}) || {payrollGroupId: id})
    )
}
choiceSources.payPeriods = (userScope, term, selected, p) => {
    const payrollGroupId = p?.payrollGroupId || null
    if (!payrollGroupId || !hoursGroupIds(userScope).includes(payrollGroupId)) return []
    const links = Array.from(
        find("mantle.humanres.payroll.PayrollGroupPeriod").condition("payrollGroupId", payrollGroupId).list()
    )
    const periodIds = links.map(row => row.timePeriodId)
    if (!periodIds.length) return []
    const label = row => lib.calendarDateText(row.fromDate) + " to " + lib.calendarDateText(row.thruDate)
    const periods = Array.from(
        find("mantle.party.time.TimePeriod").condition("timePeriodId", "in", periodIds).orderBy("-fromDate").list()
    )
    const options = periods
        .map(row => ({value: row.timePeriodId, label: label(row)}))
        .filter(option => !term || option.label.includes(term))
        .slice(0, choiceLimit)
    return withSelected(
        options,
        selected,
        id => periodIds.includes(id),
        id => label(one("mantle.party.time.TimePeriod", {timePeriodId: id}) || {})
    )
}
choiceSources.payAdvances = (userScope, term, selected, p) => {
    if (!userScope.capabilities.payrollView || !p?.partyRelationshipId) return []
    const employment = one("mantle.party.PartyRelationship", {partyRelationshipId: p.partyRelationshipId})
    if (!employment || !employerIds(userScope).includes(employment.toPartyId)) return []
    const A = "mantle.humanres.expense.EmployeeAdvance"
    const base = () => find(A).condition({partyRelationshipId: p.partyRelationshipId, statusEnumId: "EasApproved"})
    const label = row =>
        [row.employeeAdvanceId, row.purpose, row.requiredDate ? "needed " + lib.calendarDateText(row.requiredDate) : ""]
            .filter(Boolean)
            .join(" · ")
    const rows = Array.from(
        searched(base(), term, ["employeeAdvanceId", "purpose"]).orderBy("-requestedDate").limit(choiceLimit).list()
    )
    return withSelected(
        rows.map(row => ({value: row.employeeAdvanceId, label: label(row)})),
        selected,
        id => base().condition("employeeAdvanceId", id).count() > 0,
        id => label(one(A, {employeeAdvanceId: id}) || {employeeAdvanceId: id})
    )
}
choiceSources.payrollLocalizations = (userScope, term, selected) => {
    if (!userScope.capabilities.payrollView) return []
    const L = "mantle.humanres.payroll.PayrollLocalization"
    const rows = Array.from(searched(find(L), term, ["localizationName"]).orderBy("localizationName").limit(choiceLimit).list())
    return withSelected(
        rows.map(row => ({value: row.payrollLocalizationId, label: row.localizationName || row.payrollLocalizationId})),
        selected,
        id => !!one(L, {payrollLocalizationId: id}),
        id => one(L, {payrollLocalizationId: id})?.localizationName || id
    )
}
// P27: a pay group's localization payee (the authority its localization's amounts are paid to): an organization, by name, a
// payroll reader's; never an internal one (an employer pays it, it is no employer)
choiceSources.payrollPayees = (userScope, term, selected) => {
    if (!userScope.capabilities.payrollView) return []
    const D = "mantle.party.PartyDetail"
    const base = () => find(D).condition("partyTypeEnumId", "PtyOrganization").condition("privateOwnerUserId", "is-null", null)
    const rows = Array.from(searched(base(), term, ["organizationName", "partyId"]).orderBy("organizationName").limit(choiceLimit).list())
    return withSelected(
        rows.map(row => ({value: row.partyId, label: row.organizationName || row.partyId})),
        selected,
        id => base().condition("partyId", id).count() > 0,
        id => one(D, {partyId: id})?.organizationName || id
    )
}

function choices(p) {
    const userScope = required()
    if (!Object.hasOwn(choiceSources, p.choice)) throw new Error("Unknown People choice " + p.choice)
    return {options: choiceSources[p.choice](userScope, String(p.term || "").trim(), p.selected || null, p)}
}

// ===== palette =====
// The palette's People records, each opening its People screen. P2: the directory, the people find#Employees reaches for the
// user (its public work identity, the same projection as the list and export), each person once, opening Employee360, with
// recordEntity and recordId for Assist's search.
const searchFinds = [
    {
        kind: "person",
        rows: (userScope, text, limit) => {
            let found
            try {
                found = lib.probe("mantle.humanres.PeopleServices.find#Employees", {term: text, pageSize: limit * 2})
            } catch (error) {
                // a People user the directory reaches no one for (the root group alone) finds nothing
                if (codeOf(error) === "PERMISSION_DENIED") return []
                throw error
            }
            const byParty = new Map()
            for (const row of Array.from(found.employees || [])) {
                const shown = byParty.get(row.partyId)
                if (shown) {
                    shown.subtitle += ", " + row.organizationName
                    continue
                }
                byParty.set(row.partyId, {
                    title: row.preferredName ? row.personName + " (" + row.preferredName + ")" : row.personName,
                    subtitle: ["Employee", [row.jobTitle, row.organizationName].filter(Boolean).join(" · ")].join(" · "),
                    icon: recordKinds.person.icon,
                    recordEntity: "mantle.party.Party",
                    recordId: row.partyId,
                    url: "/qapps/People/" + recordKinds.person.destination + "?partyId=" + encodeURIComponent(row.partyId)
                })
            }
            return Array.from(byParty.values())
        }
    },
    // P12: the user's own leave requests (design §1.4: the palette's own requests), by their days, leave type or state; none of
    // another person (a manager finds a report's from the person's record or the list)
    {
        kind: "leaveRequest",
        rows: (userScope, text, limit) => {
            const wanted = text.toLowerCase()
            let found
            try {
                found = lib.probe("mantle.humanres.LeaveServices.find#Requests", {mine: true, pageSize: 100})
            } catch (error) {
                if (codeOf(error) === "PERMISSION_DENIED") return []
                throw error
            }
            return Array.from(found.requests || [])
                .filter(row =>
                    ["leave", row.datesText, row.leaveTypeText, row.statusText].some(part =>
                        String(part || "")
                            .toLowerCase()
                            .includes(wanted)
                    )
                )
                .slice(0, limit)
                .map(row => ({
                    title: "My leave " + row.datesText + (row.partText ? " (" + row.partText.toLowerCase() + ")" : ""),
                    subtitle: ["Leave request", row.leaveTypeText, row.statusText].join(" · "),
                    icon: "sym_o_beach_access",
                    recordEntity: LEAVE_REQUEST,
                    recordId: row.leaveRequestId,
                    url: leaveRequestPath + "?leaveRequestId=" + encodeURIComponent(row.leaveRequestId)
                }))
        }
    }
]
// P16: a recruiter's openings (by title) and applications (by the applicant's name), each opening its People screen
searchFinds.push(
    {
        kind: "opening",
        rows: (userScope, text, limit) => {
            let found
            try {
                found = lib.probe("mantle.humanres.RecruitingServices.find#Openings", {term: text, pageSize: limit})
            } catch (error) {
                if (codeOf(error) === "PERMISSION_DENIED") return []
                throw error
            }
            return Array.from(found.openings || []).map(row => ({
                title: row.title,
                subtitle: ["Opening", row.organizationName, row.stateText].join(" · "),
                icon: "sym_o_campaign",
                recordEntity: "mantle.humanres.recruitment.JobOpening",
                recordId: row.jobOpeningId,
                url: "/qapps/People/Staffing/ApplicantPipeline?jobOpeningId=" + encodeURIComponent(row.jobOpeningId)
            }))
        }
    },
    {
        kind: "application",
        rows: (userScope, text, limit) => {
            let found
            try {
                found = lib.probe("mantle.humanres.RecruitingServices.find#Applications", {term: text, pageSize: limit})
            } catch (error) {
                if (codeOf(error) === "PERMISSION_DENIED") return []
                throw error
            }
            return Array.from(found.applications || []).map(row => ({
                title: row.applicantName,
                subtitle: ["Applicant", row.openingTitle, row.stageText].join(" · "),
                icon: "sym_o_person_search",
                recordEntity: APPLICATION,
                recordId: row.employmentApplicationId,
                url: applicationPath + "?employmentApplicationId=" + encodeURIComponent(row.employmentApplicationId)
            }))
        }
    }
)
const APPLICATION = "mantle.humanres.employment.EmploymentApplication"
const applicationPath = "/qapps/People/Staffing/ApplicantDetail"
// P12: a leave request's record (the palette, the record-lookup, a notice and Today open it)
const LEAVE_REQUEST = "mantle.humanres.leave.LeaveRequest"
const leaveRequestPath = "/qapps/People/Time/LeaveRequestDetail"
function search(p) {
    const userScope = scope()
    if (!userScope.read || !String(p.text || "").trim()) return {rows: []}
    const text = String(p.text).trim()
    const limit = Math.max(1, Math.min(20, Number(p.limit || 5)))
    const found = new Map()
    for (const definition of searchFinds) {
        let rowsFound = []
        try {
            rowsFound = definition.rows(userScope, text, limit)
        } catch (error) {
            ec.logger.error("People palette " + definition.kind + " search failed: " + error.message)
        }
        for (const row of rowsFound) if (!found.has(row.url)) found.set(row.url, row)
    }
    return {rows: Array.from(found.values()).slice(0, limit)}
}

// ===== Employee360 (P2; design §4 Employee360, crosscut §3.4) =====
// The per-app context of Shared/Employee360: for each app that mounts it, the regions it shows (of those get#Employee360 admits),
// the regions it shows only for the user's own record, what may be changed there and the actions. A context narrows what Mantle
// admits and grants nothing. Maintenance's row came with its mount (impl-maintenance P2); an app with no row (Projects, Admin, Sales)
// links the People mount for a People user and the Commons mount otherwise (employee360Link).
const employee360Apps = {
    // People: every region the user's capabilities admit; personal corrections, the employment's files and activity
    // P23: Compensation, People's alone (design §4 Employee360's per-app context: Commons, Projects, Maintenance and Insights show
    // no compensation); Mantle admits it only to a payroll reader of the opened employment's employer
    People: {
        regions: ["overview", "employmentHistory", "personalInfo", "filesAndActivity", "compensation"],
        ownOnly: [],
        edits: true,
        returnLabel: "Employees",
        returnPath: "//People/Employees"
    },
    // Commons: the public work card, and the user's own private data with the corrections they may make themselves
    Commons: {
        regions: ["overview", "personalInfo"],
        ownOnly: ["personalInfo"],
        edits: "self",
        returnLabel: null,
        returnPath: null
    },
    // Insights: the Overview of the person behind a report drill-down, read only, with the return to the report
    Insights: {regions: ["overview"], ownOnly: [], edits: false, returnLabel: "Back to the report", returnPath: null},
    // Maintenance (impl-maintenance P2, F62; design-people §4's Maintenance row): a custodian's or technician's public work
    // identity, read only, returning to Equipment; the equipment they hold is Maintenance's own read in its scope
    // (ironstone.maintenance.EquipmentServices.get#AssignedEquipment), not People's, and qualification validity waits for People P18
    Maintenance: {regions: ["overview"], ownOnly: [], edits: false, returnLabel: "Equipment", returnPath: "//Maintenance/Equipment"}
}
// P18: the apps whose Employee360 shows Skills and reviews (DevelopmentServices.get#PersonDevelopment decides what each reader sees
// in it): People's alone (design §4 Employee360: development by its own permissions)
const developmentApps = ["People"]
const employee360Path = app => "/qapps/" + (app === "Commons" ? "Commons/People/Employee360" : "People/Employees/Employee360")
// get#Employee360: the person's record under appRoot, the regions of Mantle's answer that the app's context shows, the fields the
// user may change there and the employment the record opened on. A person outside the scope answers recordFound false (the screen
// shows "Not available"); another app root is refused (PEOPLE_CONTEXT), and People's mount needs the People root (PEOPLE_UNAVAILABLE).
function employee360(p) {
    const app = Object.hasOwn(employee360Apps, p.appRoot || "") ? employee360Apps[p.appRoot] : null
    if (!app) denied("PEOPLE_CONTEXT", "This person's record is not available here")
    const userScope = p.appRoot === "People" ? required() : null
    if (!userScope && !ec.user.userId) denied("PEOPLE_UNAVAILABLE", "People is not available")
    // checkOnly: a person or employment the user may not read answers no region, as a missing one, rather than a refusal
    // logged as a failed service on every "Not available" view
    const found = call("mantle.humanres.PeopleServices.get#Employee360", {
        partyId: p.partyId,
        partyRelationshipId: p.partyRelationshipId || null,
        checkOnly: true
    })
    if (!Array.from(found.access || []).length) return {recordFound: false, regions: [], record: {}}
    const own = Array.from(found.access || []).includes("self")
    const regions = Array.from(found.regions || []).filter(
        region => app.regions.includes(region) && (!app.ownOnly.includes(region) || own)
    )
    const caps = found.capabilities || {}
    const editable =
        app.edits === true
            ? Array.from(caps.selfFields || [])
            : app.edits === "self" && own
              ? ["preferredName", "homePhone", "mobilePhone"]
              : []
    const record = {
        partyId: found.partyId,
        overview: found.overview,
        personalInfo: regions.includes("personalInfo") ? found.personalInfo : null,
        partyRelationshipId: found.partyRelationshipId || null,
        hostEmploymentId: regions.includes("filesAndActivity") ? found.hostEmploymentId : null
    }
    // P23: the opened employment's compensation, read by Mantle for a payroll reader alone (absent from this answer otherwise)
    if (regions.includes("compensation"))
        record.compensation = call("mantle.humanres.PayrollSetupServices.get#Compensation", {
            partyId: found.partyId,
            partyRelationshipId: found.partyRelationshipId || null
        })
    return {
        recordFound: true,
        regions,
        record,
        own,
        editableFields: caps.editPersonal && regions.includes("personalInfo") ? editable : [],
        // P6: the employment changes, People's alone: an HR editor of the opened employment's employer with the wizards' grant
        // changes it (Mantle checks again), and People shows the changes waiting to HR and to their approvers
        canChangeEmployment: !!userScope && !!caps.changeEmployment && !!userScope.capabilities.employment,
        // P23: a payroll editor of the opened employment's employer asks for its pay change (Mantle checks again)
        canChangePay: regions.includes("compensation") && !!caps.changePay,
        showsChanges: !!userScope,
        // P7: the equipment the person holds (AssignedEquipment), People's: Mantle answers the person and HR of their employer
        showsEquipment: !!userScope,
        // P18: Skills and reviews (skills, qualifications, resume), People's: Mantle answers each reader their part
        showsDevelopment: !!userScope && developmentApps.includes(p.appRoot),
        returnLabel: app.returnLabel,
        returnPath: app.returnPath
    }
}
// get#Employee360Link: where the user opens a person's record from an app with no Employee360 row (Projects' PersonDetail,
// Admin's UserDetail, design §4 Employee360, crosscut §3.4): the People mount for a People user whose scope admits the person as
// staff or team, the Commons mount for one it admits otherwise (the person themselves), else no link. The link adds no right:
// Employee360 checks again.
function employee360Link(p) {
    const none = {url: null, label: null}
    if (!p.partyId || !ec.user.userId) return none
    // checkOnly: a person the user may not read is no link, not a refusal logged on every view of PersonDetail or UserDetail
    const admitted = call("mantle.humanres.PeopleServices.get#Scope", {partyId: p.partyId, checkOnly: true})
    const kinds = Array.from(admitted.partyAccess || [])
    if (!kinds.length) return none
    const peopleUser = rootGrants().read && (kinds.includes("staff") || kinds.includes("team"))
    return {
        url: employee360Path(peopleUser ? "People" : "Commons") + "?partyId=" + encodeURIComponent(p.partyId),
        label: peopleUser || !kinds.includes("self") ? "Employee record" : "My employee record"
    }
}
// The People link of an employment (the employment content host's record, for the Chatter and RecordFiles panels and the
// notifications that name it): its Employee360 under People for a People user who reads its files, else none.
function employmentLink(partyRelationshipId) {
    if (!ec.user.userId || !rootGrants().read) return null
    const access = call("mantle.humanres.PeopleServices.check#EmploymentAccess", {partyRelationshipId})
    if (!access.recordVisible) return null
    return (
        employee360Path("People") +
        "?partyId=" +
        encodeURIComponent(access.partyId) +
        "&partyRelationshipId=" +
        encodeURIComponent(partyRelationshipId)
    )
}

// ===== record-lookup (design §1.4 Comms hooks) =====
// The Person record-lookup over the directory projection (org.moqui.comms.ProviderInterfaces.record#Lookup): search, the people
// find#Employees reaches for the text; info and card, a person the user's scope admits, as their public work identity; links, the
// people a message's Employee360 links name. A person the scope does not admit is answered visible false, or not at all.
const PARTY = "mantle.party.Party"
function personCard(partyId) {
    const found = call("mantle.humanres.PeopleServices.get#Employee360", {partyId, checkOnly: true})
    if (!Array.from(found.access || []).length) return null
    const overview = found.overview || {}
    return {
        partyId,
        title: overview.personName,
        subtitle: Array.from(overview.employments || [])
            .map(row => [row.jobTitle, row.organizationName].filter(Boolean).join(", "))
            .join(" · "),
        workEmail: overview.workEmail,
        workPhone: overview.workPhone
    }
}
// P12: a leave request the user reads (get#Request admits them), as the record-lookup shows it: the person, the days, what it
// charges and its state; never the leave type or the reason. Null when it is not theirs to read.
function leaveCard(leaveRequestId) {
    let found
    try {
        found = lib.probe("mantle.humanres.LeaveServices.get#Request", {leaveRequestId})
    } catch (error) {
        return null
    }
    const request = found?.request
    if (!request) return null
    return {
        title: "Leave of " + request.personName + ", " + request.datesText,
        status: request.statusText,
        url: leaveRequestPath + "?leaveRequestId=" + encodeURIComponent(leaveRequestId),
        lines: [request.chargedText]
    }
}
// P16: an application the user reads (get#Application admits a recruiter of its employer and its interviewers), as the
// record-lookup shows it: the applicant, the opening and the stage; never a scorecard. Null when it is not theirs to read.
function applicationCard(employmentApplicationId) {
    let found
    try {
        found = lib.probe("mantle.humanres.RecruitingServices.get#Application", {employmentApplicationId})
    } catch (error) {
        return null
    }
    const application = found?.application
    if (!application) return null
    return {
        title: "Application of " + application.applicantName,
        status: application.stageText,
        url: applicationPath + "?employmentApplicationId=" + encodeURIComponent(employmentApplicationId),
        lines: [application.openingTitle].filter(Boolean)
    }
}
function lookup(p) {
    const empty = {recordList: [], card: null, optionList: []}
    if (!ec.user.userId) return empty
    const url = partyId => employee360Link({partyId}).url
    if (p.operation === "search") {
        const text = String(p.text || "").trim()
        if (!text) return empty
        const rowsFound = searchFinds[0].rows(null, text, Math.max(1, Math.min(20, Number(p.limit || 10))))
        return Object.assign(empty, {
            optionList: rowsFound.map(row => ({value: PARTY + "|" + row.recordId, label: row.title + " · " + row.subtitle}))
        })
    }
    if (p.operation === "info") {
        const recordList = []
        for (const wanted of Array.from(p.records || [])) {
            // P12: a leave request the user reads, as its person and days and state (never its type or reason)
            if (wanted.recordEntityName === LEAVE_REQUEST || wanted.recordEntityName === "LeaveRequest") {
                const card = leaveCard(wanted.recordId)
                if (card)
                    recordList.push({
                        recordEntityName: wanted.recordEntityName,
                        recordId: wanted.recordId,
                        entity: LEAVE_REQUEST,
                        visible: true,
                        title: card.title,
                        typeLabel: "Leave request",
                        url: card.url,
                        icon: "sym_o_beach_access"
                    })
                continue
            }
            // P16: an application the user reads
            if (wanted.recordEntityName === APPLICATION || wanted.recordEntityName === "EmploymentApplication") {
                const card = applicationCard(wanted.recordId)
                if (card)
                    recordList.push({
                        recordEntityName: wanted.recordEntityName,
                        recordId: wanted.recordId,
                        entity: APPLICATION,
                        visible: true,
                        title: card.title,
                        typeLabel: "Application",
                        url: card.url,
                        icon: "sym_o_person_search"
                    })
                continue
            }
            if (wanted.recordEntityName !== PARTY && wanted.recordEntityName !== "Party") continue
            // a person People does not admit is left to the other providers (the hook keeps the first answer per record)
            const card = personCard(wanted.recordId)
            if (!card) continue
            recordList.push({
                recordEntityName: wanted.recordEntityName,
                recordId: wanted.recordId,
                entity: PARTY,
                visible: true,
                title: card.title,
                typeLabel: "Employee",
                url: url(wanted.recordId),
                icon: recordKinds.person.icon
            })
        }
        return Object.assign(empty, {recordList})
    }
    if (p.operation === "card") {
        if (p.recordEntityName === LEAVE_REQUEST && p.recordId) {
            const card = leaveCard(p.recordId)
            return card
                ? Object.assign(empty, {
                      card: {
                          entityName: LEAVE_REQUEST,
                          id: p.recordId,
                          title: card.title,
                          status: card.status,
                          url: card.url,
                          lines: card.lines
                      }
                  })
                : empty
        }
        if (p.recordEntityName === APPLICATION && p.recordId) {
            const card = applicationCard(p.recordId)
            return card
                ? Object.assign(empty, {
                      card: {
                          entityName: APPLICATION,
                          id: p.recordId,
                          title: card.title,
                          status: card.status,
                          url: card.url,
                          lines: card.lines
                      }
                  })
                : empty
        }
        if (p.recordEntityName !== PARTY || !p.recordId) return empty
        const card = personCard(p.recordId)
        if (!card) return empty
        return Object.assign(empty, {
            card: {
                entityName: PARTY,
                id: p.recordId,
                title: card.title,
                status: card.subtitle,
                url: url(p.recordId),
                lines: [card.workEmail, card.workPhone].filter(Boolean)
            }
        })
    }
    if (p.operation === "links") {
        const ids = Array.from(
            String(p.body || "").matchAll(
                /\/qapps\/(?:People\/Employees|Commons\/People)\/Employee360\?partyId=([A-Za-z0-9_.-]+)/g
            )
        ).map(match => decodeURIComponent(match[1]))
        return Object.assign(empty, {
            recordList: Array.from(new Set(ids))
                .slice(0, 5)
                .map(id => ({entity: PARTY, id}))
        })
    }
    throw new Error("Unknown record lookup " + p.operation)
}

// ===== the employment change wizard (P6) =====
// The parameters of mantle.humanres.PeopleServices preview#EmploymentChange and apply#EmploymentChange for an EmploymentChange
// draft: the employment, the kind, the date and why, and the fields of that kind only (a transfer's four terms, an empty one
// cleared; a manager change's manager; a leave's return; a separation's type and reason), so a term of another kind is not sent.
const changeFields = {
    transfer: ["departmentPartyId", "emplPositionId", "managerPartyId", "facilityId"],
    manager: ["managerPartyId"],
    leave: ["returnDate"],
    return: [],
    separation: ["terminationReasonEnumId", "terminationTypeEnumId"]
}
function changeParameters(partyRelationshipId, changeKind, draft) {
    const out = {
        partyRelationshipId: partyRelationshipId || null,
        changeKind: changeKind || null,
        effectiveDate: draft.effectiveDate || null,
        reason: draft.reason || null
    }
    for (const field of changeFields[changeKind] || []) out[field] = draft[field] ?? ""
    return out
}

// ===== self-service, the team and Today (P8; design §3, §1.4) =====
// Where a People decision waiting is decided: a position's activation on PositionDetail, an employment change on the person's
// Employee360 (People's mount; the approver's notice opens the same).
function decisionUrl(row) {
    if (row.approvalKindEnumId === "PakPosition")
        return "/qapps/People/Staffing/PositionDetail?emplPositionId=" + encodeURIComponent(row.sourceId)
    // P23 review: a pay change (its own kind, PakPayChange) on the person's Employee360 too, where its approver reads its salary
    if ((row.approvalKindEnumId === "PakEmploymentChange" || row.approvalKindEnumId === "PakPayChange") && row.partyId)
        return "/qapps/People/Employees/Employee360?partyId=" + encodeURIComponent(row.partyId)
    // P12: a leave request (or its cancellation) on LeaveRequestDetail
    if (row.approvalKindEnumId === "PakLeave") return leaveRequestPath + "?leaveRequestId=" + encodeURIComponent(row.sourceId)
    // P13: an attendance correction, among the days to decide on Attendance
    if (row.approvalKindEnumId === "PakAttendance") return "/qapps/People/Time/Attendance?show=decide"
    // P15: an expense claim on ExpenseClaimDetail, an advance among the advances to decide
    if (row.approvalKindEnumId === "PakExpenseClaim")
        return "/qapps/People/Expenses/ExpenseClaimDetail?invoiceId=" + encodeURIComponent(row.sourceId)
    if (row.approvalKindEnumId === "PakAdvance") return "/qapps/People/Expenses/EmployeeAdvances?show=decide"
    // P19: a place asked for in a training session, on the session's detail
    if (row.approvalKindEnumId === "PakTraining")
        return trainingDetailPath + "?personTrainingId=" + encodeURIComponent(row.sourceId)
    // P20: a review's finalizing, on the review's detail
    if (row.approvalKindEnumId === "PakReview")
        return reviewDetailPath + "?performanceReviewId=" + encodeURIComponent(row.sourceId)
    // P22 review: publishing a pay component's term or a pay structure, on the component's or the structure's detail
    if (row.approvalKindEnumId === "PakPayrollConfig")
        return row.sourceEntityName === "mantle.humanres.payroll.PayrollStructure"
            ? "/qapps/People/Payroll/PayStructureDetail?payrollStructureId=" + encodeURIComponent(row.sourceId)
            : "/qapps/People/Payroll/PayComponentDetail?payrollComponentId=" + encodeURIComponent(row.payrollComponentId || "")
    // P24: a pay adjustment, among those waiting for the user's decision on PayAdjustments
    if (row.approvalKindEnumId === "PakPayAdjustment") return "/qapps/People/Payroll/PayAdjustments?show=decide"
    // P25: a pay run, on its PayRunDetail
    if (row.approvalKindEnumId === "PakPayrollRun")
        return "/qapps/People/Payroll/PayRunDetail?payrollRunId=" + encodeURIComponent(row.sourceId)
    return "/qapps/People/Approvals"
}
// get#TodayItems: People's Today source, declared on the People root and on Commons' root (a self-service employee opens no
// People root, and the shell gathers sources from the roots a user may open, F64; Home and the panel take each service once):
// the People decisions waiting on the user (find#DueWork's decision, PEOPLE_REQUEST_APPROVE), each opening where it is decided;
// and (P10) the user's own weeks to submit (my week not submitted: TimesheetServices.find#WeeksToSubmit, the rule of Projects'
// Today), for one who keeps time under People (a People user, or a self-service employee by the time area's own grant) and does
// not open Projects, whose own source answers them there, each opening the week in People's My time. Another user's Today gets
// none. The self-service items of later phases join here (P12 leave starting, P18 a qualification expiring, P19 training due).
function today(p) {
    const label = "People"
    if (!ec.user.userId || (p.userId && p.userId !== ec.user.userId)) return {items: [], label}
    const items = []
    const item = values =>
        Object.assign(
            {
                workEffortId: null,
                requestId: null,
                dueDate: null,
                startDate: null,
                endDate: null,
                allDay: false,
                priority: null,
                statusId: null,
                assignees: [],
                canUpdate: false,
                hasCallLink: false,
                record: null
            },
            values
        )
    // the decisions are a decider's (PEOPLE_REQUEST_APPROVE, or PAYROLL_APPROVE for payroll configuration: P22 review), with a
    // party to decide as
    if (
        (ec.user.hasPermission("PEOPLE_REQUEST_APPROVE") || ec.user.hasPermission("PAYROLL_APPROVE")) &&
        ec.user.userAccount?.partyId
    ) {
        const found = call("mantle.humanres.PeopleServices.find#DueWork", {kinds: "decision", pageSize: 20})
        for (const row of Array.from(found.dueWork || []))
            items.push(item({kind: "approval", title: row.title, url: decisionUrl(row)}))
    }
    // P12: leave starting for my team, today or tomorrow (a manager's live reports, PEOPLE_TEAM_VIEW): who is out, never why
    if (ec.user.hasPermission("PEOPLE_TEAM_VIEW") && ec.user.userAccount?.partyId) {
        try {
            const today = ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd")
            const [y, m, d] = today.split("-").map(Number)
            const tomorrow = new Date(Date.UTC(y, m - 1, d + 1)).toISOString().substring(0, 10)
            const own = ec.user.userAccount.partyId
            const found = lib.probe("mantle.humanres.LeaveServices.get#TeamAbsences", {start: today, end: tomorrow})
            for (const event of Array.from(found.eventList || [])) {
                const startDay = String(event.start).substring(0, 10)
                // the manager's reports (and an HR reader's employers'), which they open; not a colleague's day the calendar shows
                if (event.partyId === own || startDay < today || !event.openable) continue
                items.push(
                    item({
                        kind: "leave",
                        title: event.title + (startDay === today ? " today" : " tomorrow"),
                        startDate: startDay,
                        allDay: !!event.allDay,
                        url: leaveRequestPath + "?leaveRequestId=" + encodeURIComponent(event.leaveRequestId),
                        record: {recordEntityName: LEAVE_REQUEST, recordId: event.leaveRequestId, recordName: event.title}
                    })
                )
            }
        } catch (error) {
            ec.logger.error("People Today of " + ec.user.userId + ": the team's leave was left out: " + error.message)
        }
    }
    // P18: my qualification expiring (the user's own verified ones expiring within thirty days, or expired and not renewed): its
    // type and expiry, never its number, opening their qualifications
    if (ec.user.hasPermission("PEOPLE_SELF_SERVICE") && ec.user.userAccount?.partyId && developmentAreaOpens()) {
        try {
            const found = lib.probe("mantle.humanres.DevelopmentServices.find#Qualifications", {
                mine: true,
                show: "attention",
                pageSize: 10
            })
            for (const row of Array.from(found.qualifications || [])) {
                const expired = row.validity === "expired"
                const day = String(row.thruDateText || "").slice(0, 10)
                items.push(
                    item({
                        kind: "qualification",
                        title:
                            (expired
                                ? "Your " + row.typeText.toLowerCase() + " expired "
                                : "Your " + row.typeText.toLowerCase() + " expires ") + day,
                        dueDate: day || null,
                        url: qualificationsPath + "?state=attention",
                        record: {recordEntityName: QUALIFICATION, recordId: row.partyQualificationId, recordName: row.typeText}
                    })
                )
            }
        } catch (error) {
            ec.logger.error("People Today of " + ec.user.userId + ": the qualifications expiring were left out: " + error.message)
        }
    }
    // P19: training due: the user's own enrolled sessions and those they train, starting within seven days (find#Training's due),
    // each opening the session
    if (ec.user.userAccount?.partyId && developmentAreaOpens()) {
        try {
            const found = lib.probe("mantle.humanres.DevelopmentServices.find#Training", {show: "due", pageSize: 10})
            for (const row of Array.from(found.sessions || [])) {
                const day = String(row.startText || "").slice(0, 10)
                items.push(
                    item({
                        kind: "training",
                        title: (row.isTrainer ? "You train " : "Training: ") + row.title + " " + row.startText,
                        startDate: day || null,
                        url: trainingDetailPath + "?workEffortId=" + encodeURIComponent(row.workEffortId),
                        record: {
                            recordEntityName: "mantle.work.effort.WorkEffort",
                            recordId: row.workEffortId,
                            recordName: row.title
                        }
                    })
                )
            }
        } catch (error) {
            ec.logger.error("People Today of " + ec.user.userId + ": the training due was left out: " + error.message)
        }
    }
    // P20 review: a review step due: the user's own self assessment, the assessment of a person they review and feedback asked of
    // them, waiting (find#Reviews' to do; the decisions are above, a release and an acknowledgment are on Reviews), each opening the
    // review; the step and the cycle, the person reviewed to the reviewer and a giver, never a rating or an answer
    if (ec.user.userAccount?.partyId && performanceAreaOpens()) {
        try {
            const found = lib.probe("mantle.humanres.ReviewServices.find#Reviews", {show: "todo", pageSize: 20})
            const stepTodo = ["Your self assessment", "Assess", "Give feedback"]
            for (const row of Array.from(found.reviews || [])) {
                if (!stepTodo.includes(row.todoText)) continue
                const what =
                    row.todoText === "Your self assessment"
                        ? "Your self assessment for " + row.cycleName
                        : (row.todoText === "Assess" ? "Assess " : "Feedback on ") + row.personName + " · " + row.cycleName
                items.push(
                    item({
                        kind: "review",
                        title: what + (row.dueText ? ", due " + row.dueText : ""),
                        dueDate: row.dueText || null,
                        url: reviewDetailPath + "?performanceReviewId=" + encodeURIComponent(row.performanceReviewId),
                        record: {recordEntityName: REVIEW, recordId: row.performanceReviewId, recordName: row.cycleName}
                    })
                )
            }
        } catch (error) {
            ec.logger.error("People Today of " + ec.user.userId + ": the review steps due were left out: " + error.message)
        }
    }
    // P25: payroll exceptions, the payroll operator's alone (PAYROLL_VIEW with PAYROLL_EDIT): each pay run that needs their work (an
    // employee in error or still pending, returned by the approver, an approval that no longer holds), opening its PayRunDetail; the
    // group, the period and the counts, never a person or an amount
    if (ec.user.hasPermission("PAYROLL_VIEW") && ec.user.hasPermission("PAYROLL_EDIT")) {
        try {
            const found = lib.probe("mantle.humanres.PayrollRunServices.find#Runs", {show: "attention", pageSize: 10})
            for (const row of Array.from(found.runs || [])) {
                const what = row.errorCount
                    ? row.errorCount + (row.errorCount === 1 ? " employee in error" : " employees in error")
                    : row.state === "returned"
                      ? "returned by the approver"
                      : row.state === "stale"
                        ? "its approval no longer holds"
                        : row.pendingCount + " still to calculate"
                items.push(
                    item({
                        kind: "payroll",
                        title: "Pay run " + row.groupName + ", " + row.periodText + ": " + what,
                        dueDate: row.payDateText || null,
                        url: "/qapps/People/Payroll/PayRunDetail?payrollRunId=" + encodeURIComponent(row.payrollRunId),
                        record: {
                            recordEntityName: "mantle.humanres.payroll.PayrollRun",
                            recordId: row.payrollRunId,
                            recordName: "Pay run " + row.groupName + ", " + row.periodText
                        }
                    })
                )
            }
        } catch (error) {
            ec.logger.error("People Today of " + ec.user.userId + ": the payroll exceptions were left out: " + error.message)
        }
    }
    if (keepsTimeHere()) {
        try {
            for (const week of Array.from(lib.probe("mantle.work.TimesheetServices.find#WeeksToSubmit", {}).weekList || [])) {
                const hours = ec.l10n.format(week.hours, "#,##0.##")
                const text = week.returned
                    ? "Returned: fix and submit your week of ${week} (${hours} h)"
                    : "Submit your week of ${week} (${hours} h)"
                items.push(
                    item({
                        kind: "timesheet",
                        timesheetId: week.timesheetId,
                        weekStart: week.weekStart,
                        hours: week.hours,
                        returned: week.returned,
                        overdue: week.overdue,
                        title: ec.resource.expand(ec.l10n.localize(text), "", {week: week.weekText, hours}),
                        url: "/qapps/People/Time/MyTime?weekDate=" + encodeURIComponent(week.weekStart),
                        record: {
                            recordEntityName: "mantle.work.time.Timesheet",
                            recordId: week.timesheetId,
                            recordName: ec.resource.expand(ec.l10n.localize("Week of ${week}"), "", {week: week.weekText})
                        }
                    })
                )
            }
        } catch (error) {
            ec.logger.error("People Today of " + ec.user.userId + ": the weeks to submit were left out: " + error.message)
        }
    }
    return {label, items}
}
// P10: whether People's time area opens to the user: through the root, or by the area's own grant for a self-service employee.
function timeAreaOpens(grants = rootGrants()) {
    if (grants.systemAdmin) return true
    if (grants.read) return areaGrant(grants, "Time")
    const groupIds = Array.from(ec.user.getUserGroupIdSet() || [])
    return groupIds.length > 0 && screenGrants(timeLocation, screenAuthz(groupIds)).allowed.length > 0
}
// P15: whether People's expenses area opens to the user: through the root, or by the area's own grant for a self-service employee.
function expensesAreaOpens(grants = rootGrants()) {
    if (grants.systemAdmin) return true
    if (grants.read) return areaGrant(grants, "Expenses")
    const groupIds = Array.from(ec.user.getUserGroupIdSet() || [])
    return groupIds.length > 0 && screenGrants(expensesLocation, screenAuthz(groupIds)).allowed.length > 0
}
// P18: whether People's Skills & training area opens to the user: through the root, or by the area's own grant for a self-service
// employee.
function developmentAreaOpens(grants = rootGrants()) {
    if (grants.systemAdmin) return true
    if (grants.read) return areaGrant(grants, "Development")
    const groupIds = Array.from(ec.user.getUserGroupIdSet() || [])
    return groupIds.length > 0 && screenGrants(developmentLocation, screenAuthz(groupIds)).allowed.length > 0
}
// P18: a qualification's record (Today, a notice and the files panel open it) and its People link: the user's qualifications
// with its files, for whoever reads them (the person and HR of an employer of theirs), else none.
const QUALIFICATION = "mantle.humanres.ability.PartyQualification"
const qualificationsPath = "/qapps/People/Development/Qualifications"
// P19: a training session's detail (Today's training due, a place to approve)
const trainingDetailPath = "/qapps/People/Development/TrainingDetail"
const trainingPath = "/qapps/People/Development/Training"
function qualificationLink(partyQualificationId) {
    if (!ec.user.userId || !partyQualificationId || !developmentAreaOpens()) return null
    const found = call("mantle.humanres.DevelopmentServices.check#QualificationAccess", {partyQualificationId})
    if (!found.recordVisible) return null
    const own = found.partyId === ec.user.userAccount?.partyId
    return (
        qualificationsPath +
        "?show=" +
        (own ? "mine" : "all") +
        "&partyQualificationId=" +
        encodeURIComponent(partyQualificationId)
    )
}
// P20: whether People's Reviews & goals area opens to the user: through the root, or by the area's own grant for a self-service
// employee.
function performanceAreaOpens(grants = rootGrants()) {
    if (grants.systemAdmin) return true
    if (grants.read) return areaGrant(grants, "Performance")
    const groupIds = Array.from(ec.user.getUserGroupIdSet() || [])
    return groupIds.length > 0 && screenGrants(performanceLocation, screenAuthz(groupIds)).allowed.length > 0
}
// P20: a review's People link (a notice, the files panel's record, the record link): its ReviewDetail under People for one who reads
// it (Mantle's get#Review: its person, reviewer, a feedback giver, an approver, development), else none.
function reviewLink(performanceReviewId) {
    if (!ec.user.userId || !performanceReviewId || !performanceAreaOpens()) return null
    try {
        lib.probe("mantle.humanres.ReviewServices.get#Review", {performanceReviewId})
    } catch (error) {
        return null
    }
    return reviewDetailPath + "?performanceReviewId=" + encodeURIComponent(performanceReviewId)
}
// P21: whether Grievances opens to the user: through the root, or by its own grant for a self-service employee.
function grievancesOpen(grants = rootGrants()) {
    if (grants.systemAdmin || grants.read) return true
    const groupIds = Array.from(ec.user.getUserGroupIdSet() || [])
    return groupIds.length > 0 && screenGrants(grievancesLocation, screenAuthz(groupIds)).allowed.length > 0
}
// P21: a confidential case's People link (a notice, Chatter's and RecordFiles' record, the record link): its RequestDetail under
// People for its people (Mantle's check#PeopleCaseAccess), else none.
function caseLink(requestId) {
    if (!ec.user.userId || !requestId || !grievancesOpen()) return null
    const found = call("mantle.request.RequestServices.check#PeopleCaseAccess", {requestId})
    return found.recordVisible ? caseDetailPath + "?requestId=" + encodeURIComponent(requestId) : null
}
// P10: whether the user keeps their time under People and not in Projects: People's time area opens to them and Projects' root
// does not (its own Today source answers a Projects user's weeks to submit).
function keepsTimeHere() {
    const grants = rootGrants()
    if (grants.systemAdmin || !timeAreaOpens(grants)) return false
    const groupIds = Array.from(ec.user.getUserGroupIdSet() || [])
    return groupIds.length > 0 && screenGrants(projectsLocation, screenAuthz(groupIds)).allowed.length === 0
}
// get#SelfServiceContext: the links of Shared/PeopleSelfService under the app that mounts it (People or Commons): the user's own
// employee record (People's mount for a People user, else Commons'), and under People the approvals and Home. Another root is
// refused (PEOPLE_CONTEXT). It grants nothing: get#SelfService checks the user.
function selfServiceContext(p) {
    if (!["People", "Commons"].includes(p.appRoot)) denied("PEOPLE_CONTEXT", "Self-service is not available here")
    const partyId = ec.user.userAccount?.partyId || null
    const record = partyId ? employee360Link({partyId}) : {url: null}
    const grants = rootGrants()
    const peopleUser = grants.read
    return {
        appRoot: p.appRoot,
        employee360Url: record.url || null,
        approvalsUrl: peopleUser ? "/qapps/People/Approvals" : null,
        peopleHomeUrl: peopleUser ? "/qapps/People/Home" : null,
        // P10: the user's own week, under People's time area when it opens to them (the root or the area's own grant)
        myTimeUrl: timeAreaOpens(grants) ? "/qapps/People/Time/MyTime" : null,
        // P12: their leave requests and the team calendar, under the same area
        leaveRequestsUrl: timeAreaOpens(grants) ? "/qapps/People/Time/LeaveRequests" : null,
        // P13: their own attendance days, under the same area
        attendanceUrl: timeAreaOpens(grants) ? "/qapps/People/Time/Attendance?show=mine" : null,
        // P14: their published shifts on the team calendar, under the same area
        teamCalendarUrl: timeAreaOpens(grants) ? "/qapps/People/Time/TeamCalendar" : null,
        // P15: their own expense claims and advances, under People's expenses area
        expenseClaimsUrl: expensesAreaOpens(grants) ? "/qapps/People/Expenses/ExpenseClaims?show=mine" : null,
        advancesUrl: expensesAreaOpens(grants) ? "/qapps/People/Expenses/EmployeeAdvances?show=mine" : null,
        // P18: their own qualifications, under Skills & training when it opens to them
        qualificationsUrl: developmentAreaOpens(grants) ? qualificationsPath + "?show=mine" : null,
        // P19 review: their own training places, under the same area
        trainingUrl: developmentAreaOpens(grants) ? trainingPath + "?show=mine" : null,
        // P21: their confidential cases (Grievances), and filing one
        grievancesUrl: grievancesOpen(grants) ? "/qapps/People/Employees/Grievances" : null,
        // P20: their own reviews and goals, under Reviews & goals when it opens to them
        reviewsUrl: performanceAreaOpens(grants) ? "/qapps/People/Performance/Reviews?show=mine" : null,
        goalsUrl: performanceAreaOpens(grants) ? "/qapps/People/Performance/Goals" : null
    }
}

// ===== find#AvailablePeople (P18; design §10 SkillsMatrix FindAvailable) =====
// Who has a skill and is free over the days: Projects' find#StaffingCandidates bounded to the people the user's skills matrix keeps
// (the same filters), each as text; the cost rate only for a holder of PAYROLL_VIEW (and the staffing search's own rule).
function availablePeople(p) {
    const userScope = required()
    const scoped = call("mantle.humanres.DevelopmentServices.get#SkillsMatrix", {
        organizationPartyId: p.organizationPartyId || null,
        unitPartyId: p.unitPartyId || null,
        emplPositionClassId: p.emplPositionClassId || null,
        term: p.term || null,
        pageSize: 1
    })
    const partyIdList = Array.from(scoped.scopePartyIds || [])
    if (!partyIdList.length) return {candidates: []}
    const found = call("mantle.work.ResourceServices.find#StaffingCandidates", {
        skillTypeEnumId: p.skillTypeEnumId || null,
        fromDate: p.fromDate || null,
        thruDate: p.thruDate || null,
        hoursPerWeek: p.hoursPerWeek || null,
        partyIdList,
        withRates: !!userScope.capabilities.payrollView,
        limit: 20
    })
    const hours = value => ec.l10n.format(value || 0, "#,##0.#")
    const candidates = Array.from(found.candidateList || []).map(row => ({
        partyId: row.partyId,
        name: row.name,
        fits: !!row.fits,
        shortWeeks: row.shortWeeks || 0,
        freeText: hours(row.freeHours) + " h free of " + hours(row.needHours) + " h",
        skillText: row.hasSkill ? "Level " + (row.skillRating ?? "") + (row.skillSelfDeclared ? " (self-declared)" : "") : "",
        rateText: row.costRate != null ? ec.l10n.format(row.costRate, "#,##0.00") + " " + (row.costCurrencyUomId || "") : "",
        projectsText: Array.from(row.currentProjects || []).join(", ")
    }))
    return {candidates}
}

const operations = {
    sharedContext,
    checkRecord,
    choices,
    search,
    employee360,
    employee360Link,
    lookup,
    today,
    selfServiceContext,
    availablePeople
}
function run(op, p) {
    if (!Object.hasOwn(operations, op)) throw new Error("Unknown People operation " + op)
    return operations[op](p || {})
}
;({execute: run, employmentLink, changeParameters, decisionUrl, qualificationLink, caseLink, reviewLink})
