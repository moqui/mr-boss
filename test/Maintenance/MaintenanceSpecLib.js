// Helpers the Maintenance specs share: the demo ids (data/BossMaintenanceDemoData.xml, data/BossUsersDemoData.xml and the other
// apps' demo facilities and equipment), the demo users by group, a block run as a user with artifact authorization on, a call's
// refusal message, a Maintenance page render and the shell's menu and providers. Later phases add their ids and users here.
const ids = {
    // the Maintenance users' organization (Services) and the one maint.retail plans for alone (Retail)
    organizationId: "ORG_ZIZI_SERVICES",
    otherOrganizationId: "ORG_ZIZI_RETAIL",
    // a facility of each (Manufacturing's and Warehouse's demo), and Retail's forklift (Warehouse's demo)
    facilityId: "BOSS_MFG_SVC_PLANT",
    otherFacilityId: "BOSS_WH_EAST",
    otherAssetId: "BOSS_WH_FORKLIFT",
    // P2: Services' campus, building, floors and rooms, the compressor (of the AC-200 model, held by Kenji) with its motor, the
    // van, the multimeter and the air handler (BossMaintenanceDemoData.xml, BossZMaintenanceDemoData.xml)
    siteId: "BOSS_MNT_SITE",
    buildingId: "BOSS_MNT_BLDG",
    floorId: "BOSS_MNT_FLOOR1",
    otherFloorId: "BOSS_MNT_FLOOR2",
    meetingRoomId: "BOSS_MNT_ROOM_101",
    mechanicalRoomId: "BOSS_MNT_ROOM_102",
    compressorId: "BOSS_MNT_COMPRESSOR",
    motorId: "BOSS_MNT_MOTOR",
    vanId: "BOSS_MNT_VAN",
    airHandlerId: "BOSS_MNT_AIR_HANDLER",
    modelId: "BOSS_MNT_COMP_MODEL",
    custodianId: "BOSS_PPL_KENJI",
    // P3: the team and work orders (BossZMaintenanceDemoData.xml): the air handler's leak in progress, maint.tech's; the compressor's
    // oil service approved for next week, maint.tech2's; the van's service waiting for a supervisor; Room 201's bracket (facility
    // work, unassigned); the overdue multimeter check, maint.tech's; the motor's adopted request on hold
    teamId: "BOSS_MNT_TEAM",
    inProgressOrderId: "BOSS_MNT_WO_AHU",
    plannedOrderId: "BOSS_MNT_WO_COMP_OIL",
    waitingOrderId: "BOSS_MNT_WO_VAN",
    roomOrderId: "BOSS_MNT_WO_ROOM201",
    overdueOrderId: "BOSS_MNT_WO_METER",
    heldOrderId: "BOSS_MNT_WO_MOTOR",
    techPartyId: "BOSS_MNT_TECH",
    tech2PartyId: "BOSS_MNT_TECH2",
    // P4: maint.requester's reports (BossZMaintenanceDemoData.xml): the air handler's water triaged into its work order (maint.reader's
    // report of the same fault linked to it too) and the compressor's oil leak not yet triaged
    triagedRequestId: "BOSS_MNT_REQ_AHU",
    otherReportId: "BOSS_MNT_REQ_AHU2",
    openRequestId: "BOSS_MNT_REQ_COMP",
    // P5: Room 201 out of service (a safety stop linked to its work order) and the compressor's restored belt failure
    roomOutageId: "BOSS_MNT_OUT_ROOM201",
    roomOutageFacilityId: "BOSS_MNT_ROOM_201",
    restoredOutageId: "BOSS_MNT_OUT_COMP_BELT",
    // P15: Room 101 managed (maint.booking approves, two hours at most), Room 103 not managed, the planner's vendor walkthrough in
    // Room 101 next Tuesday and the carpet replacement's blackout over it
    managedRoomId: "BOSS_MNT_ROOM_101",
    unmanagedRoomId: "BOSS_MNT_ROOM_103",
    vendorEventId: "BOSS_MNT_EV_VENDOR",
    blackoutId: "BOSS_MNT_BLK_ROOM101",
    // P16: the technician's shift handover waiting for maint.booking's approval of Room 101
    requestedEventId: "BOSS_MNT_EV_HANDOVER",
    // P6: the procedures (BossZMaintenanceDemoData.xml): the AC-200 compressor service (approved, for the AC-200 model, a group of two
    // steps, a dependency and a pressure reading), the room inspection (approved, for rooms), the van's pre-trip check (a draft) and
    // the old compressor checklist (retired)
    compressorProcedureId: "BOSS_MNT_PROC_COMP",
    compressorPrepareId: "BOSS_MNT_PROC_COMP_PREP",
    compressorOilId: "BOSS_MNT_PROC_COMP_OIL",
    compressorPressureId: "BOSS_MNT_PROC_COMP_PRESS",
    roomProcedureId: "BOSS_MNT_PROC_ROOM",
    draftProcedureId: "BOSS_MNT_PROC_VAN",
    retiredProcedureId: "BOSS_MNT_PROC_OLD",
    // P7: the air handler's follow-up task (a Commons task, maint.tech's, linked to its work order)
    followUpTaskId: "BOSS_MNT_TASK_AHU_GASKET",
    // P9: the parts (BossZMaintenanceDemoData.xml): the air handler's coil gasket in Services' stock warehouse (two issued to its
    // leak, one returned), the issuance, and Retail's stock in the same warehouse
    gasketId: "BOSS_MNT_PART_GASKET",
    gasketStockId: "BOSS_MNT_STOCK_GASKET",
    gasketIssuanceId: "BOSS_MNT_ISS_AHU",
    otherOwnerStockId: "BOSS_PRD_FOREIGN_STOCK",
    // P13: the preventive plans (BossZMaintenanceDemoData.xml), drafts: Room 201's monthly inspection, the compressor's 250-hour oil
    // service over the AC-200 model's 500-hour default (next threshold 1450 hours), and its contactor check by a start counter last
    // read in August (stale)
    roomPlanId: "BOSS_MNT_PLAN_ROOM201",
    compressorPlanId: "BOSS_MNT_PLAN_COMP",
    stalePlanId: "BOSS_MNT_PLAN_STARTS",
    // P10: the held motor's rewind, a purchase request of Services sourced to Delta Motor Rewinds' purchase order, its service line
    // the work's (BossZMaintenanceDemoData.xml)
    rewindRequestId: "BOSS_MNT_PREQ_MOTOR",
    rewindOrderId: "BOSS_MNT_PO_REWIND",
    // P11: Services' costing rate of its service technicians (48 USD an hour), maint.tech's approved timesheet of the belt's week
    // (the compressor's belt, its two hours priced), and the belt's work order
    costingRateId: "BOSS_MNT_RATE_TECH",
    beltTimesheetId: "BOSS_MNT_TS_BELT",
    beltOrderId: "BOSS_MNT_WO_COMP_BELT",
    // the menu of design §1.2 built so far: a planner's, who reads work, requests (P4, a planner's or supervisor's), procedures (P6,
    // a reader of procedures or a planner or supervisor), preventive plans (P13, a reader of work or a planner or supervisor) and
    // equipment, and with Settings the Maintenance administrator's; a procedure author reads procedures alone
    staffMenu: ["Home", "WorkOrders", "Requests", "Procedures", "Preventive", "Equipment", "Facilities"],
    homeOnlyMenu: ["Home"],
    authorMenu: ["Home", "Procedures"],
    bookingMenu: ["Home", "Scheduling"],
    adminMenu: ["Home", "WorkOrders", "Requests", "Procedures", "Preventive", "Equipment", "Facilities", "Scheduling", "Settings"],
    settingsMenu: ["SettingsHome", "WorkPolicy"],
    keys: ["g m", "g w", "g r", "g p", "g l", "g e", "g f"]
}
// The demo users of each group (each but the requester and the administrator also in BOSS_MAINTENANCE), agents of Ziziwork
// Services but maint.retail (Retail only) and maint.admin (Services and Retail), none in ADMIN; a Projects client contact, a PASS
// public account and another app's user; and an instance administrator (ADMIN).
const users = {
    reader: "maint.reader",
    requester: "maint.requester",
    planner: "maint.planner",
    tech: "maint.tech",
    tech2: "maint.tech2",
    supervisor: "maint.supervisor",
    author: "maint.author",
    approver: "maint.approver",
    booking: "maint.booking",
    resources: "maint.resources",
    cost: "maint.cost",
    retailPlanner: "maint.retail",
    admin: "maint.admin",
    client: "sheldon.acme",
    pass: "dana@joesdist.example.com",
    otherApp: "customerservice.read",
    system: "john.doe"
}

// Run action as username with artifact authorization enabled, then sign in again as the user before.
function asUser(username, action) {
    const previousUsername = ec.user.username || "john.doe"
    login(username)
    const disabled = ec.artifactExecution.authzDisabled()
    try {
        ec.artifactExecution.enableAuthz()
        return action()
    } finally {
        ec.message.clearErrors()
        if (disabled) ec.artifactExecution.disableAuthz()
        else ec.artifactExecution.enableAuthz()
        login(previousUsername)
    }
}
// Run action with artifact authorization disabled (a spec's own setup and reads).
function system(action) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try {
        return action()
    } finally {
        if (!wasDisabled) ec.artifactExecution.enableAuthz()
    }
}
// The message a call is refused with, or "" when it succeeds: a negative case checks the message names the refusal, and a
// positive case with the same parameters gets "", so a validation error is not taken for a refusal.
function refusal(service, parameters = {}) {
    ec.message.pushErrors()
    try {
        ec.service.sync().name(service).parameters(parameters).requireNewTransaction(true).call()
        return ec.message.hasError() ? ec.message.getErrorsString() : ""
    } catch (error) {
        return String(error.message)
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
}
function invoke(service, parameters = {}) {
    return ec.service.sync().name(service).parameters(parameters).call() || {}
}
// A Maintenance screen as the shell fetches it (qvt, a fragment of the last standalone screen, with its lists' data), with a widget's
// render error counted among the errors; root names another app's root for a shared screen's mount.
function page(path, parameters = {}, mode = "qvt", root = "Maintenance") {
    const renderer = ec.screen
        .makeTest()
        .rootScreen("component://mr-boss/screen/" + root + ".xml")
        .renderMode(mode)
    if (mode === "qvt") renderer.withStaticData()
    const result = renderer.render(path, Object.assign({lastStandalone: "-2"}, parameters), null)
    const output = String(result.output || "")
    const failed = output.match(/(Error rendering|Exception in render)[^\n<]*/g) || []
    const errors = Array.from(result.errorMessages || []).concat(failed)
    ec.message.clearErrors()
    return {status: result.status, output, errors}
}
// A screen render's refusal as the user, nothing of its content: "" when it opens, else its status and errors, which for a refusal
// name the authorization.
function screenRefusal(user, path, parameters = {}) {
    const rendered = asUser(user, () => page(path, parameters, "html"))
    return rendered.status === 200 && rendered.errors.length === 0 ? "" : rendered.status + " " + rendered.errors.join(" | ")
}
// A path under the web root as the user (the REST APIs, menu and shell data): its status, output and whether it was refused.
function hit(path, parameters = {}) {
    const result = ec.screen.makeTest().rootScreen("component://webroot/screen/webroot.xml").render(path, parameters, null)
    const errors = Array.from(result.errorMessages || []).join(" | ")
    ec.message.clearErrors()
    return {
        status: result.status,
        output: String(result.output || ""),
        refused: result.status == 401 || result.status == 403 || /not authorized/i.test(errors)
    }
}
// The shell's menu of Maintenance and the launcher's apps for the user, as the shell fetches them; menuOnly leaves out the shell data
// (the launcher and providers). path and group give another level of the menu (Settings' tabs).
function shell(user, menuOnly = false, path = "Home", group = "Maintenance") {
    const root = "component://webroot/screen/webroot.xml"
    return asUser(user, () => {
        const menu = ec.screen
            .makeTest()
            .rootScreen(root)
            .render("menuData/apps/Maintenance/" + path, {}, null)
        const apps = menuOnly ? [] : JSON.parse(ec.screen.makeTest().rootScreen(root).render("shellData", {}, null).output).apps
        const level = menu.status == 200 ? JSON.parse(menu.output).find(level => level.name === group) : null
        return {
            status: menu.status,
            names: level ? level.subscreens.filter(item => item.menuInclude).map(item => item.name) : [],
            apps: apps.map(app => app.name),
            providers: apps.find(app => app.name === "Maintenance")?.providers
        }
    })
}

;({ids, users, asUser, system, refusal, invoke, page, screenRefusal, hit, shell})
