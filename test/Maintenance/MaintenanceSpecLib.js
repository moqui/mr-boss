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
    // P8: Services' compressor team of employed technicians (BossZMaintenanceDemoData.xml): Kenji its lead (qualified), Sofia (her
    // electrical safety certificate expired) and Owen (on leave the week of the compressor's oil service)
    fieldTeamId: "BOSS_MNT_TEAM_FIELD",
    qualifiedTechId: "BOSS_PPL_KENJI",
    expiredTechId: "BOSS_PPL_SOFIA",
    awayTechId: "BOSS_PPL_OWEN",
    // P14: the air handler's monthly filter change, active, its August done on time, September late, October skipped and November's
    // due now (BossZMaintenanceDemoData.xml)
    filterPlanId: "BOSS_MNT_PLAN_FILTER",
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
    // equipment, and with Settings the Maintenance administrator's; a procedure author reads procedures alone; P14: Reports for a
    // reader of work; P8 review: Settings for its Teams tab alone, read by a planner or supervisor
    staffMenu: ["Home", "WorkOrders", "Requests", "Procedures", "Preventive", "Equipment", "Facilities", "Reports", "Settings"],
    homeOnlyMenu: ["Home"],
    authorMenu: ["Home", "Procedures"],
    bookingMenu: ["Home", "Scheduling"],
    adminMenu: [
        "Home",
        "WorkOrders",
        "Requests",
        "Procedures",
        "Preventive",
        "Equipment",
        "Facilities",
        "Scheduling",
        "Reports",
        "Settings"
    ],
    settingsMenu: ["SettingsHome", "WorkPolicy", "Teams", "Lookups", "Readiness"],
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

// P12: a customer repair of a spec-local organization (Customer Service's specs read Services' and Retail's cases exactly, so no
// claim is made in a demo organization): the organization with its policy managing warranty repairs, its customer with an address,
// a unit it sold the customer last month (on the customer's premises: no facility, so no Maintenance scope covers it), a technician
// and a Customer Service agent of it with maint.tech's and customerservice.services' groups, and a claim decided as a chargeable
// repair the customer agreed to; with link, the agent's link#WarrantyWork, which makes the repair a work order assigned to the
// technician. Made once per key: a second call answers the same records.
function customerRepair(key, link = true) {
    const base = "MNT_SPEC_" + key
    const made = {
        organizationPartyId: base + "_ORG",
        customerPartyId: base + "_CUST",
        assetId: base + "_UNIT",
        requestId: base + "_CLAIM",
        address: key.toLowerCase() + ".frontdesk@example.com",
        tech: "mnt.spec." + key.toLowerCase() + ".tech",
        techPartyId: base + "_TECH",
        agent: "mnt.spec." + key.toLowerCase() + ".agent",
        agentPartyId: base + "_AGENT"
    }
    const one = (entity, conditions) => ec.entity.find(entity).condition(conditions).disableAuthz().one()
    const since = "2000-01-01T00:00:00Z"
    if (!one("mantle.party.Party", {partyId: made.organizationPartyId}))
        system(() => {
            const organization = (partyId, name, roleTypeId, ownerPartyId) => {
                call("create#mantle.party.Party", {partyId, partyTypeEnumId: "PtyOrganization", ownerPartyId})
                call("create#mantle.party.Organization", {partyId, organizationName: name})
                call("create#mantle.party.PartyRole", {partyId, roleTypeId})
            }
            organization(made.organizationPartyId, "Repair spec " + key, "OrgInternal", made.organizationPartyId)
            organization(made.customerPartyId, "Repair spec customer " + key, "Customer", made.organizationPartyId)
            call("create#mantle.party.contact.ContactMech", {
                contactMechId: base + "_CM",
                contactMechTypeEnumId: "CmtEmailAddress",
                infoString: made.address
            })
            call("create#mantle.party.contact.PartyContactMech", {
                partyId: made.customerPartyId,
                contactMechId: base + "_CM",
                contactMechPurposeId: "EmailPrimary",
                fromDate: since
            })
            // the technician and the agent: the demo users' groups, agents of the spec's organization
            for (const [username, userId, from] of [
                [made.tech, made.techPartyId, users.tech],
                [made.agent, made.agentPartyId, "customerservice.services"]
            ]) {
                call("create#mantle.party.Party", {partyId: userId, partyTypeEnumId: "PtyPerson"})
                call("create#mantle.party.Person", {partyId: userId, firstName: "Repair spec", lastName: username})
                call("create#mantle.party.PartyRelationship", {
                    relationshipTypeEnumId: "PrtAgent",
                    fromPartyId: userId,
                    toPartyId: made.organizationPartyId,
                    toRoleTypeId: "OrgInternal",
                    fromDate: since
                })
                call("create#moqui.security.UserAccount", {
                    userId,
                    username,
                    partyId: userId,
                    currentPassword: "16ac58bbfa332c1c55bd98b53e60720bfa90d394",
                    passwordHashType: "SHA"
                })
                const fromUserId = one("moqui.security.UserAccount", {username: from}).userId
                for (const member of Array.from(
                    ec.entity
                        .find("moqui.security.UserGroupMember")
                        .condition("userId", fromUserId)
                        .conditionDate("fromDate", "thruDate", ec.user.nowTimestamp)
                        .disableAuthz()
                        .list()
                ))
                    call("create#moqui.security.UserGroupMember", {userId, userGroupId: member.userGroupId, fromDate: since})
            }
            call("create#mantle.work.maintenance.MaintenancePolicy", {
                organizationPartyId: made.organizationPartyId,
                fromDate: since,
                approvalThresholdHours: 0,
                warrantyRepairsManaged: "Y"
            })
            // the unit, sold to the customer last month (its sale says whose it is)
            const orderId = base + "_SO"
            call("create#mantle.order.OrderHeader", {orderId, statusId: "OrderCompleted", currencyUomId: "USD", entryDate: since})
            call("create#mantle.order.OrderPart", {
                orderId,
                orderPartSeqId: "01",
                vendorPartyId: made.organizationPartyId,
                customerPartyId: made.customerPartyId,
                statusId: "OrderCompleted"
            })
            call("create#mantle.order.OrderItem", {
                orderId,
                orderItemSeqId: "01",
                orderPartSeqId: "01",
                itemTypeEnumId: "ItemProduct",
                productId: ids.modelId,
                quantity: 1,
                unitAmount: 900
            })
            call("create#mantle.product.asset.Asset", {
                assetId: made.assetId,
                productId: ids.modelId,
                assetTypeEnumId: "AstTpInventory",
                assetName: "Repair spec unit " + key,
                serialNumber: base + "-SN",
                statusId: "AstDelivered",
                ownerPartyId: made.customerPartyId
            })
            call("create#mantle.product.issuance.AssetIssuance", {
                assetId: made.assetId,
                orderId,
                orderItemSeqId: "01",
                productId: ids.modelId,
                issuedDate: new Date(Date.now() - 30 * 86400000),
                quantity: 1
            })
            // the claim, a case of the organization assigned to the agent, decided as a chargeable repair the customer agreed to
            call("create#mantle.request.Request", {
                requestId: made.requestId,
                requestName: "Repair spec " + key + ": the unit trips on start",
                requestTypeEnumId: "RqtWarranty",
                statusId: "ReqSubmitted",
                requestDate: ec.user.nowTimestamp,
                claimRevision: 0
            })
            call("create#mantle.request.support.CaseProfile", {requestId: made.requestId, intakeDate: ec.user.nowTimestamp})
            for (const [partyId, roleTypeId] of [
                [made.organizationPartyId, "OrgInternal"],
                [made.customerPartyId, "Customer"],
                [made.agentPartyId, "Assignee"]
            ])
                call("create#mantle.request.RequestParty", {requestId: made.requestId, partyId, roleTypeId, fromDate: since})
            call("create#mantle.request.RequestRecord", {
                requestId: made.requestId,
                recordEntityName: "mantle.product.asset.Asset",
                recordId: made.assetId,
                linkedDate: ec.user.nowTimestamp
            })
            call("create#mantle.request.support.WarrantyDecision", {
                requestId: made.requestId,
                sourceRevision: 0,
                organizationPartyId: made.organizationPartyId,
                decisionEnumId: "WdRejected",
                coverageBasisEnumId: "WcbNone",
                reason: "Out of warranty: repaired at the customer's cost",
                decisionDate: ec.user.nowTimestamp,
                decidedByPartyId: made.agentPartyId,
                chargeEstimate: 120,
                chargeCurrencyUomId: "USD",
                customerConsentRef: "Phone call"
            })
        })
    const linked = () =>
        Array.from(
            ec.entity
                .find("mantle.request.RequestRecord")
                .condition({requestId: made.requestId, recordEntityName: "mantle.product.maintenance.AssetMaintenance"})
                .disableAuthz()
                .list()
        )[0]?.recordId || null
    if (link && !linked())
        asUser(made.agent, () => {
            ec.artifactExecution.disableAuthz()
            invoke("mantle.request.WarrantyServices.link#WarrantyWork", {
                requestId: made.requestId,
                comments: "Test and replace the start capacitor",
                assigneePartyId: made.techPartyId
            })
        })
    made.assetMaintenanceId = linked()
    made.workEffortId = made.assetMaintenanceId
        ? one("mantle.product.maintenance.AssetMaintenance", {assetMaintenanceId: made.assetMaintenanceId})?.taskWorkEffortId ||
          null
        : null
    return made
}

// P20, the screen sweeps (acceptance MaintenanceTui and MaintenanceServerStatic): the shared screens Maintenance mounts, as [path
// under the root, location], read from each Maintenance screen file's subscreens-items (walkChildTree follows files, not mounts)
function mountedScreens() {
    const files = []
    ec.resource.getLocationReference("component://mr-boss/screen/Maintenance.xml").walkChildTree(files, null)
    const found = []
    for (const file of files) {
        if (!file.location.endsWith(".xml")) continue
        const parent = file.path === "Maintenance" ? "" : file.path.substring("Maintenance/".length) + "/"
        const text = String(ec.resource.getLocationReference(file.location).getText())
        const item = /<subscreens-item name="([^"]+)" location="(component:\/\/mr-boss\/screen\/Shared\/[^"]+\.xml)"/g
        for (let match = item.exec(text); match; match = item.exec(text)) found.push([parent + match[1], match[2]])
    }
    return found
}
// The tabs of a mounted screen that the current user's menu shows under Maintenance (a shared screen's tabs of another app's
// context are not offered there), as paths under the root; none when its menu names none
function mountTabs(path, parameters = {}) {
    const name = path.substring(path.lastIndexOf("/") + 1)
    const query = Object.entries(parameters)
        .map(([key, value]) => key + "=" + encodeURIComponent(value))
        .join("&")
    const menu = ec.screen
        .makeTest()
        .rootScreen("component://webroot/screen/webroot.xml")
        .render("menuData/apps/Maintenance/" + path + (query ? "?" + query : ""), {}, null)
    ec.message.clearErrors()
    if (menu.status != 200) return []
    // the deepest level of that name (the menu lists each level of the path; a leaf has no subscreens)
    const level = JSON.parse(menu.output)
        .filter(level => level.name === name)
        .pop()
    return (level?.subscreens || []).filter(item => item.menuInclude).map(item => path + "/" + item.name)
}
// The demo record a swept screen opens on: the entry of the screen or its nearest parent (a tab takes its record's)
const workRecord = {recordEntity: "mantle.work.effort.WorkEffort", recordId: ids.inProgressOrderId}
const sweepRecords = {
    Home: {organizationPartyId: ids.organizationId},
    Chatter: workRecord,
    RecordFiles: workRecord,
    LogNote: {entityName: workRecord.recordEntity, recordId: ids.inProgressOrderId},
    SendMessage: {entityName: workRecord.recordEntity, recordId: ids.inProgressOrderId},
    "WorkOrders/NewWorkOrder": {assetId: ids.compressorId},
    "WorkOrders/WorkOrderDetail": {workEffortId: ids.inProgressOrderId},
    "WorkOrders/WorkOrderDetail/Purchasing": {workEffortId: ids.heldOrderId},
    "WorkOrders/WorkOrderDetail/Costs": {workEffortId: ids.beltOrderId},
    "WorkOrders/WorkItemDetail": {workEffortId: ids.followUpTaskId},
    "WorkOrders/MaterialIssueReceipt": {workEffortId: ids.inProgressOrderId},
    "WorkOrders/InventoryAvailability": {productId: ids.gasketId},
    "WorkOrders/OrderDetail": {orderId: ids.rewindOrderId},
    "Requests/RequestDetail": {requestId: ids.triagedRequestId},
    "Procedures/ProcedureDetail": {workEffortId: ids.compressorProcedureId},
    "Preventive/Plans/PlanDetail": {maintenanceScheduleId: ids.filterPlanId},
    "Equipment/EquipmentDetail": {assetId: ids.compressorId},
    "Equipment/AssetTags": {assetIds: ids.compressorId},
    "Equipment/Product360": {productId: ids.modelId},
    "Equipment/Employee360": {partyId: ids.custodianId},
    "Facilities/FacilityDetail": {facilityId: ids.buildingId},
    "Scheduling/ResourcePolicyDetail": {facilityId: ids.managedRoomId},
    "Scheduling/ResourceCalendar": {date: "2026-11-17"},
    "Scheduling/ResourceCalendarTui": {date: "2026-11-17"},
    "Scheduling/BookingRequests": {fromDate: "2026-11-12"},
    Settings: {organizationPartyId: ids.organizationId},
    "Settings/Teams": {organizationPartyId: ids.organizationId, teamPartyId: ids.fieldTeamId}
}
// (WorkOrders/InterventionReport needs a customer repair, which no demo record is: the sweeps pass customerRepair's as repair)
function sweepParameters(path, repair = null) {
    if (path === "WorkOrders/InterventionReport") return {workEffortId: repair?.workEffortId || ""}
    const key = Object.keys(sweepRecords)
        .filter(key => path === key || path.startsWith(key + "/"))
        .sort((a, b) => b.length - a.length)[0]
    return key ? sweepRecords[key] : {}
}

;({
    ids,
    users,
    asUser,
    system,
    refusal,
    invoke,
    page,
    screenRefusal,
    hit,
    shell,
    customerRepair,
    mountedScreens,
    mountTabs,
    sweepParameters
})
