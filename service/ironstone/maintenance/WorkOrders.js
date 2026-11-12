// Maintenance's work order screens and shell (impl-maintenance P3; design-maintenance §3 WorkOrders, Home, §1.2): the list's
// shape (the saved finds, the state colors and the board and calendar texts over Mantle's find#MaintenanceWorkOrders), the
// Today source (the user's due work orders, opening WorkOrderDetail, with no Mark done) and Admin's lifecycle participant
// (a leaver's open work order assignments and equipment custody, moved through Mantle's schedule#MaintenanceWorkOrder and
// change#MaintenanceCustody, which check their own permissions). The records are Mantle's mantle.work.MaintenanceServices; each
// read here goes through it or checks its own permission first.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const maintenance = ec.resource.script("component://mr-boss/service/ironstone/maintenance/Maintenance.js")
const {find, one, denied, ms} = lib

const statusColors = {
    WeInPlanning: "grey-8",
    WeApproved: "primary",
    WeInProgress: "positive",
    WeOnHold: "warning",
    WeComplete: "teal",
    WeClosed: "grey-7",
    WeCancelled: "negative"
}
const openStatuses = ["WeInPlanning", "WeApproved", "WeInProgress", "WeOnHold"]
const text = value => (value == null || String(value).trim() === "" ? null : String(value).trim())
const flag = value => value === true || value === "true" || value === "Y"

// ===== find#WorkOrderRows =====
// The saved finds of design §3 WorkOrders, each a set of Mantle's filters: my work, my team's, unassigned, overdue, blocked,
// preventive. My team: the teams the user is a current member of (People's PrtMember rows).
function myTeamIds() {
    const partyId = ec.user.userAccount?.partyId
    if (!partyId) return []
    return Array.from(
        find("mantle.party.PartyRelationship", {fromPartyId: partyId, relationshipTypeEnumId: "PrtMember"})
            .conditionDate("fromDate", "thruDate", null)
            .selectField("toPartyId")
            .list()
    ).map(row => row.toPartyId)
}
function rows(p) {
    const filters = {
        text: text(p.text),
        organizationPartyId: text(p.organizationPartyId),
        facilityId: text(p.facilityId),
        assetId: text(p.assetId),
        statusId: text(p.statusId),
        maintenanceKindEnumId: text(p.maintenanceKindEnumId),
        assigneePartyId: text(p.assigneePartyId),
        teamPartyId: text(p.teamPartyId),
        highPriority: p.highPriority,
        overdue: p.overdue,
        blocked: p.blocked,
        mine: p.mine,
        unassigned: p.unassigned,
        pageIndex: p.pageIndex,
        pageSize: p.pageSize,
        pageNoLimit: p.pageNoLimit
    }
    const saved = text(p.savedFind)
    if (saved === "mine") filters.mine = "Y"
    else if (saved === "unassigned") filters.unassigned = "Y"
    else if (saved === "overdue") filters.overdue = "Y"
    else if (saved === "blocked") filters.blocked = "Y"
    else if (saved === "preventive") filters.maintenanceKindEnumId = "MkPreventive"
    else if (saved === "team") filters.teamPartyId = filters.teamPartyId || myTeamIds()[0] || "_NONE_"
    const found = lib.probe("mantle.work.MaintenanceServices.find#MaintenanceWorkOrders", filters)
    const list = Array.from(found.workOrderList || []).map(row =>
        Object.assign({}, row, {
            statusColor: statusColors[row.statusId] || "grey-8",
            calendarTitle: row.workEffortId + " · " + row.workEffortName + (row.targetName ? " · " + row.targetName : ""),
            assignedText: row.assigneeNames || (row.teamName ? row.teamName + " (no technician)" : "Unassigned"),
            priorityText: row.priority == null ? "" : String(row.priority)
        })
    )
    return Object.assign({}, found, {workOrderList: list})
}

// ===== get#TodayItems =====
// The Maintenance today-source: the user's open work orders due by the end of the range (their planned finish, else start),
// each opening WorkOrderDetail, with no Mark done (Mantle's Today leaves managed work out of its own tasks). Another user's
// Today, and a user who reads no maintenance work, get none.
function today(p) {
    const label = "Maintenance"
    if (p.userId && p.userId !== ec.user.userId) return {items: [], label}
    const userScope = maintenance.execute("capabilities", {}).capabilities
    if (!userScope.read || !userScope.workRead) return {items: [], label}
    const thru = p.thruDate ? ms(p.thruDate) : null
    const found = lib.probe("mantle.work.MaintenanceServices.find#MaintenanceWorkOrders", {mine: "Y", pageSize: 50})
    const items = []
    for (const row of Array.from(found.workOrderList || [])) {
        const due = ms(row.estimatedCompletionDate) ?? ms(row.estimatedStartDate)
        if (due == null || (thru != null && due >= thru)) continue
        items.push({
            kind: "maintenanceWork",
            workEffortId: row.workEffortId,
            requestId: null,
            title: row.workEffortName + (row.targetName ? " · " + row.targetName : ""),
            dueDate: new Date(due),
            startDate: row.estimatedStartDate ? new Date(ms(row.estimatedStartDate)) : null,
            endDate: null,
            allDay: false,
            priority: row.priority ?? null,
            statusId: row.statusId,
            assignees: [],
            canUpdate: false,
            hasCallLink: false,
            url: "/qapps/Maintenance/WorkOrders/WorkOrderDetail?workEffortId=" + encodeURIComponent(row.workEffortId),
            record: {
                recordEntityName: "mantle.work.effort.WorkEffort",
                recordId: row.workEffortId,
                recordName: row.workEffortName
            }
        })
    }
    return {items, label}
}

// ===== the lifecycle participant (Admin's offboarding, design-admin §14; impl-maintenance F56) =====
const assignmentNames = {workOrders: "Open work orders", custody: "Equipment held", bookingApprovals: "Resources approved"}
// The user's own, or another's for a holder of ADMIN_IDENTITY_VIEW (to read) or ADMIN_IDENTITY_MANAGE (to move), as Projects'
// participant reads them; the party of the identity.
function participantParty(userId, permission) {
    if (!ec.user.userId) denied("SIGN_IN", "Sign in to see assignments")
    if (text(userId) === ec.user.userId) return ec.user.userAccount?.partyId || null
    if (!ec.user.hasPermission(permission)) denied("PERMISSION_DENIED", permission + " is required")
    return one("moqui.security.UserAccount", {userId: text(userId)})?.partyId || null
}
// A party's open work orders (a current Assignee on an open managed root or on a step of one, P6/F113) and the equipment it holds
// now (a current custodian or operator), as ids; counts are what the participant shows.
function openAssignments(partyId) {
    const found = {workOrders: [], custody: [], bookingApprovals: []}
    if (!partyId) return found
    const assigned = Array.from(
        find("mantle.work.effort.WorkEffortParty", {partyId, roleTypeId: "Assignee"})
            .conditionDate("fromDate", "thruDate", ec.user.nowTimestamp)
            .selectField("workEffortId")
            .list()
    ).map(row => row.workEffortId)
    if (assigned.length) {
        // a step counts as its work order (its root)
        const roots = new Set(assigned)
        for (const row of Array.from(
            find("mantle.work.effort.WorkEffort")
                .condition("workEffortId", "in", Array.from(new Set(assigned)))
                .condition("rootWorkEffortId", "is-not-null", null)
                .selectField("workEffortId,rootWorkEffortId")
                .list()
        ))
            roots.add(row.rootWorkEffortId)
        const orders = Array.from(
            find("mantle.work.maintenance.MaintenanceWorkOrderDetail")
                .condition("workEffortId", "in", Array.from(roots))
                .condition("statusId", "in", openStatuses)
                .selectField("workEffortId")
                .list()
        )
        found.workOrders = orders.map(row => row.workEffortId)
    }
    found.custody = Array.from(
        find("mantle.product.asset.AssetPartyAssignment", {partyId})
            .condition("roleTypeId", "in", ["Custodian", "Operator"])
            .conditionDate("fromDate", "thruDate", ec.user.nowTimestamp)
            .selectField("assetId,roleTypeId")
            .list()
    ).map(row => row.assetId + "|" + row.roleTypeId)
    // P15: the rooms and equipment whose bookings the party approves now (BookingApprover)
    found.bookingApprovals = Array.from(
        find("mantle.facility.FacilityParty", {partyId, roleTypeId: "BookingApprover"})
            .conditionDate("fromDate", "thruDate", ec.user.nowTimestamp)
            .selectField("facilityId")
            .list()
    )
        .map(row => "facility|" + row.facilityId)
        .concat(
            Array.from(
                find("mantle.product.asset.AssetPartyAssignment", {partyId, roleTypeId: "BookingApprover"})
                    .conditionDate("fromDate", "thruDate", ec.user.nowTimestamp)
                    .selectField("assetId")
                    .list()
            ).map(row => "asset|" + row.assetId)
        )
    return found
}
// Who moves each kind (the user's call, Nov 12: offboarding stays with Maintenance's staff, no new permission): the services
// below check these in the work's organization themselves. An identity operator without them sees the items, named with who
// moves them, and gets no transfer step, so the offboarding hands them off and nothing fails for the operator.
const movers = {
    workOrders: {permissions: ["MAINTENANCE_PLAN", "MAINTENANCE_SUPERVISE"], who: "a Maintenance planner or supervisor"},
    custody: {permissions: ["MAINTENANCE_RESOURCE_EDIT"], who: "a Maintenance resource administrator"},
    // P15: handed over through store#ResourceApprover (RESOURCE_POLICY_EDIT in the resource's organization)
    bookingApprovals: {permissions: ["RESOURCE_POLICY_EDIT"], who: "a Maintenance resource administrator"}
}
function findAssignments(p) {
    const found = openAssignments(participantParty(p.userId, "ADMIN_IDENTITY_VIEW"))
    return {
        resourceList: Object.keys(assignmentNames)
            .filter(kind => found[kind].length)
            .map(kind => {
                const canMove = movers[kind].permissions.some(permission => ec.user.hasPermission(permission))
                return {
                    resourceId: kind,
                    resourceName:
                        assignmentNames[kind] +
                        " (" +
                        found[kind].length +
                        ")" +
                        (canMove ? "" : ", moved in Maintenance by " + movers[kind].who),
                    resourceKind: "assignment",
                    transferable: canMove,
                    note: found[kind].length + " open" + (canMove ? "" : "; " + movers[kind].who + " moves them in Maintenance")
                }
            })
    }
}
// Each work order's technicians with the leaver replaced, through schedule#MaintenanceWorkOrder, and each holding through
// change#MaintenanceCustody; each refusal (the caller's maintenance permission, the new person not of the organization) is
// named, and the rest go on.
function transferAssignments(p) {
    const kind = text(p.assignmentKind)
    if (!assignmentNames[kind]) throw new Error("Unknown maintenance assignment kind " + kind)
    const fromPartyId = participantParty(p.fromUserId, "ADMIN_IDENTITY_MANAGE")
    const to = one("moqui.security.UserAccount", {userId: text(p.toUserId)})
    if (!to?.partyId) throw new Error("User " + text(p.toUserId) + " has no party to assign work to")
    const ids = openAssignments(fromPartyId)[kind]
    const failures = []
    for (const id of ids) {
        try {
            if (kind === "workOrders") {
                // the leaver replaced on the root and on each step of the work order (P6, F113)
                lib.probe("mantle.work.MaintenanceServices.schedule#MaintenanceWorkOrder", {
                    workEffortId: id,
                    replacePartyId: fromPartyId,
                    withPartyId: to.partyId
                })
            } else if (kind === "bookingApprovals") {
                // the leaver ended now and the new person approving from then, the requests waiting kept for them
                const [resourceType, resourceId] = id.split("|")
                lib.probe("mantle.work.ResourceBookingServices.store#ResourceApprover", {
                    assetId: resourceType === "asset" ? resourceId : null,
                    facilityId: resourceType === "facility" ? resourceId : null,
                    partyId: fromPartyId,
                    end: "Y",
                    replacementPartyId: to.partyId
                })
            } else {
                const [assetId, roleTypeId] = id.split("|")
                lib.probe("mantle.product.MaintenanceResourceServices.change#MaintenanceCustody", {
                    assetId,
                    roleTypeId,
                    newPartyId: to.partyId
                })
            }
        } catch (error) {
            failures.push(id + ": " + String(error.message || error))
        }
    }
    if (failures.length)
        throw new Error(
            failures.length + " of " + ids.length + " " + assignmentNames[kind].toLowerCase() + " not moved: " + failures[0]
        )
    ec.logger.info(
        ids.length +
            " maintenance " +
            kind +
            " of " +
            text(p.fromUserId) +
            " moved to " +
            text(p.toUserId) +
            " by " +
            ec.user.username
    )
    return {transferred: true}
}

const operations = {rows, today, findAssignments, transferAssignments}
;({
    execute: (op, parameters) => {
        if (!Object.hasOwn(operations, op)) throw new Error("Unknown Maintenance work order operation " + op)
        return operations[op](parameters || {})
    }
})
