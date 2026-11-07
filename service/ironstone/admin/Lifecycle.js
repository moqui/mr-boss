// The lifecycle coordinator's participants, ironstone.admin.LifecycleServices (impl-admin P6; design-admin §4.1 Offboarding, §4
// UserDetail LifecycleActions and LifecycleDetail, §14 Lifecycle participant). Mantle's mantle.party.IdentityServices keeps an
// account's lifecycle operation and runs its steps (Lifecycle.js there); BOSS holds the registry of the owners whose resources a
// leaving user hands on (ironstone.admin.LifecycleParticipant, each row seeded by its owner) and reads it here:
// - findOwnedResources: what the user owns, from each participant's lookup, called as the caller so the owner's permission
//   applies, and the steps start#Lifecycle takes (a pause per participant that has one, a transfer per resource);
// - transferOwnedResource: a waiting step handed to a new owner, once its service is what the participant registered, through
//   Mantle's retry#LifecycleStep and so the owner's transfer service;
// - startOperation: a screen's request (UserDetail's LifecycleActions, Users' bulk disable) with the participants' steps;
// - findAssignments and transferAssignments: Projects' participant, over Projects' and Commons' own reassign services, which
//   decide who may reassign (an administrator without Projects' authority is refused there, and the step stays to be retried).
// Registrations are trusted component definitions: a row naming a missing service or permission, or a service without the
// owned-resource contract, is logged by name and left out, and the others still answer. Every call runs with authorization on,
// as the caller: Mantle's identity scope is the organization filters of the caller's grant (nothing with none, but for ADMIN).
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const identityLib = ec.resource.script("component://mr-mantle/service/mantle/party/Identity.js")
const {find, one, rows, denied} = lib
const access = lib.access
const S = "mantle.party.IdentityServices."
const contracts = {
    lookup: [["userId"], ["resourceList"]],
    transfer: [["fromUserId", "toUserId"], ["transferred"]],
    pause: [["userId"], ["pausedCount"]]
}
const text = value => String(value ?? "").trim()
const refused = (reasonCode, reason, extra = {}) => Object.assign({applied: false, reasonCode, reason}, extra)
function requirePermission(permission) {
    if (!ec.user.userId) denied("SIGN_IN", "Sign in to administer identities")
    if (!access.has(permission)) denied("PERMISSION_DENIED", permission + " is required")
}
function carriesContract(service, kind) {
    const definition = service ? ec.service.getServiceDefinition(service) : null
    if (!definition) return false
    const [ins, outs] = contracts[kind]
    const inNames = Array.from(definition.inParameterNames || [])
    return (
        ins.every(name => inNames.includes(name)) && outs.every(name => Object.hasOwn(definition.outParameterInfoMap || {}, name))
    )
}
// The enabled registrations whose services exist and carry the contract, each invalid one logged by name and left out.
function participants() {
    const valid = []
    for (const row of rows("ironstone.admin.LifecycleParticipant", {})) {
        if (row.disabled === "Y") continue
        try {
            const problem = !carriesContract(row.lookupService, "lookup")
                ? "a lookup service without the owned-resource contract " + row.lookupService
                : row.transferService && !carriesContract(row.transferService, "transfer")
                  ? "a transfer service without the owned-resource contract " + row.transferService
                  : row.transferService && !row.resourceParameter
                    ? "no resource parameter"
                    : row.pauseService && !carriesContract(row.pauseService, "pause")
                      ? "a pause service without the owned-resource contract " + row.pauseService
                      : row.requiredPermission &&
                          !one("moqui.security.UserPermission", {userPermissionId: row.requiredPermission})
                        ? "a missing permission " + row.requiredPermission
                        : null
            if (problem) {
                ec.logger.error("Lifecycle participant " + row.participantKey + " names " + problem)
                continue
            }
            valid.push(row)
        } catch (error) {
            ec.logger.error("Lifecycle participant " + row.participantKey + " was not read: " + error.message)
        }
    }
    return valid.sort(
        (a, b) => (a.sequenceNum ?? 999) - (b.sequenceNum ?? 999) || String(a.participantKey).localeCompare(b.participantKey)
    )
}
// An owner's service as the caller, in its own transaction and error frame: its own checks apply, and its failure is an error
// the caller names, not a rollback of the page.
function ownerCall(serviceName, parameters) {
    ec.message.pushErrors()
    try {
        const result = ec.service.sync().name(serviceName).parameters(parameters).requireNewTransaction(true).call() || {}
        if (ec.message.hasError()) throw new Error(ec.message.getErrorsString())
        return result
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
}

// ===== find#OwnedResources =====
function findOwnedResources(p) {
    requirePermission("ADMIN_IDENTITY_VIEW")
    // the identity as the caller may administer it (refused alike when out of scope)
    const found = identityLib.identity(p.userId)
    const userId = found.account.userId
    const participantList = []
    const participantSteps = []
    for (const row of participants()) {
        const entry = {
            participantKey: row.participantKey,
            ownerApp: row.ownerApp || "",
            title: row.title || row.participantKey,
            resourceKind: row.resourceKind || "",
            pauses: !!row.pauseService,
            resourceList: [],
            state: "ready",
            reason: ""
        }
        participantList.push(entry)
        if (row.requiredPermission && !access.has(row.requiredPermission)) {
            Object.assign(entry, {state: "unavailable", reason: row.requiredPermission + " is needed to read and move these"})
            continue
        }
        try {
            entry.resourceList = Array.from(ownerCall(row.lookupService, {userId}).resourceList || [])
                .filter(resource => resource && text(resource.resourceId))
                .map(resource => ({
                    resourceId: text(resource.resourceId),
                    resourceName: text(resource.resourceName) || text(resource.resourceId),
                    resourceKind: text(resource.resourceKind) || entry.resourceKind,
                    transferable: resource.transferable !== false && !!row.transferService,
                    note: text(resource.note)
                }))
        } catch (error) {
            ec.logger.error("Lifecycle participant " + row.participantKey + " lookup of " + userId + " failed: " + error.message)
            Object.assign(entry, {state: "failed", reason: "Its owner could not answer"})
            continue
        }
        if (row.pauseService)
            participantSteps.push({
                providerKey: row.participantKey,
                ownerApp: row.ownerApp,
                title: (row.title || row.participantKey) + " paused",
                action: "pause",
                actionService: row.pauseService
            })
        for (const resource of entry.resourceList.filter(resource => resource.transferable))
            participantSteps.push({
                providerKey: row.participantKey,
                ownerApp: row.ownerApp,
                title: row.title || row.participantKey,
                action: "transfer",
                actionService: row.transferService,
                resourceParameter: row.resourceParameter,
                resourceKind: resource.resourceKind,
                resourceId: resource.resourceId,
                resourceName: resource.resourceName
            })
    }
    const resourceCount = participantList.reduce((count, entry) => count + entry.resourceList.length, 0)
    return {participantList, participantSteps, resourceCount}
}

// ===== transfer#OwnedResource =====
function transferOwnedResource(p) {
    requirePermission("ADMIN_IDENTITY_MANAGE")
    // the operation as the caller may read it (Mantle's scope), then its stored step
    const read = ec.service
        .sync()
        .name(S + "get#Lifecycle")
        .parameters({operationId: text(p.operationId)})
        .call()
    if (ec.message.hasError()) throw new Error(ec.message.getErrorsString())
    const step = one("mantle.party.UserLifecycleOperationStep", {operationId: text(p.operationId), stepSeqId: text(p.stepSeqId)})
    if (!read?.operation || !step) denied("RECORD_UNAVAILABLE", "The step is not available")
    if (step.stepKind !== "transfer") return refused("NOT_A_TRANSFER", "This step does not move a resource")
    const registered = participants().find(row => row.participantKey === step.providerKey)
    if (
        !registered ||
        registered.transferService !== step.actionService ||
        registered.resourceParameter !== step.resourceParameter
    )
        return refused("NOT_REGISTERED", "This step's owner is no longer registered to move it; ask its owner")
    if (registered.requiredPermission && !access.has(registered.requiredPermission))
        return refused("PERMISSION_DENIED", registered.requiredPermission + " is needed to move this")
    // the new owner: a staff identity in the caller's scope (Mantle's retry checks it again) that can sign in
    const toUserId = text(p.toUserId)
    const candidate = identityLib.identity(toUserId)
    const account = candidate.account
    const closed =
        (account.disabled === "Y" && !account.disabledDateTime) ||
        (account.terminateDate != null && Number(String(account.terminateDate)) <= Number(String(ec.user.nowTimestamp)))
    if (closed)
        return refused("OWNER_INELIGIBLE", (account.userFullName || account.username) + " cannot sign in: choose another owner")
    const out = ec.service
        .sync()
        .name(S + "retry#LifecycleStep")
        .parameters({operationId: step.operationId, stepSeqId: step.stepSeqId, toUserId, reason: text(p.reason) || null})
        .call()
    if (ec.message.hasError()) throw new Error(ec.message.getErrorsString())
    return {applied: !!out.applied, reasonCode: out.reasonCode || null, reason: out.reason || null, statusId: out.statusId}
}

// ===== startOperation (screens) =====
// A lifecycle request as a screen makes it: for a disable, or a removal (which Mantle records participant steps for only when it
// leaves no organization), the participants' steps first; then Mantle's start#Lifecycle, as the caller. Each refusal is a reason.
function startOperation(p) {
    const kind = text(p.kind)
    let participantSteps = []
    if (kind === "disable" || kind === "removeOrganization")
        participantSteps = findOwnedResources({userId: p.userId}).participantSteps
    const out =
        ec.service
            .sync()
            .name(S + "start#Lifecycle")
            .parameters({
                userId: text(p.userId),
                kind,
                organizationPartyId: text(p.organizationPartyId) || null,
                effectiveDate: p.effectiveDate || null,
                reason: text(p.reason) || null,
                expectedRevision: text(p.expectedRevision) || null,
                operationKey: text(p.operationKey) || null,
                participantSteps
            })
            .call() || {}
    if (ec.message.hasError()) throw new Error(ec.message.getErrorsString())
    return out
}
// Users' bulk disable: one operation per identity, each checked on its own in its own transaction; the refused ones named.
function bulkDisable(p) {
    const ids = (Array.isArray(p.userIds) ? p.userIds : String(p.userIds || "").split(",")).map(text).filter(Boolean)
    if (!ids.length) throw new Error("Select one or more users first")
    let doneCount = 0
    const failures = []
    for (const userId of ids) {
        ec.message.pushErrors()
        let reason = null
        try {
            const out = startOperation({userId, kind: "disable", reason: p.reason})
            if (!out.applied) reason = out.reason || out.reasonCode
        } catch (error) {
            reason = String(error.message || error)
        } finally {
            ec.message.clearErrors()
            ec.message.popErrors()
        }
        if (reason) {
            const account = one("moqui.security.UserAccount", {userId})
            failures.push((account?.userFullName || account?.username || userId) + ": " + reason)
        } else doneCount++
    }
    return {doneCount, failedCount: failures.length, failures}
}

// ===== Projects' assignments =====
const assignmentNames = {tasks: "Open tasks", workItems: "Open project work items", requests: "Open requests"}
const openTask = row => !["WeComplete", "WeClosed", "WeCancelled"].includes(row.statusId)
// The caller's own assignments, or another identity's in the caller's scope with the permission.
function assignmentParty(userId, permission) {
    if (!ec.user.userId) denied("SIGN_IN", "Sign in to see assignments")
    if (text(userId) === ec.user.userId) return ec.user.userAccount?.partyId || null
    requirePermission(permission)
    return identityLib.identity(userId).account.partyId || null
}
// The open assignments of partyId by kind: work effort ids (tasks, project work items) and request ids.
function openAssignments(partyId) {
    const found = {tasks: [], workItems: [], requests: []}
    if (!partyId) return found
    const factory = ec.entity.conditionFactory
    const assigned = Array.from(
        find("mantle.work.effort.WorkEffortParty")
            .condition({partyId, roleTypeId: "Assignee"})
            .conditionDate("fromDate", "thruDate", ec.user.nowTimestamp)
            .condition(factory.makeCondition("statusId", "not-in", ["WeptDeclined", "WeptUnassigned"], true))
            .list()
    ).map(row => row.workEffortId)
    if (assigned.length)
        for (const task of Array.from(
            find("mantle.work.effort.WorkEffort")
                .condition("workEffortId", "in", Array.from(new Set(assigned)))
                .condition("workEffortTypeEnumId", "WetTask")
                .list()
        ))
            if (openTask(task)) (task.rootWorkEffortId ? found.workItems : found.tasks).push(task.workEffortId)
    const requestIds = Array.from(
        find("mantle.request.RequestParty")
            .condition({partyId, roleTypeId: "Assignee"})
            .conditionDate("fromDate", "thruDate", ec.user.nowTimestamp)
            .list()
    ).map(row => row.requestId)
    if (requestIds.length)
        for (const request of Array.from(
            find("mantle.request.Request")
                .condition("requestId", "in", Array.from(new Set(requestIds)))
                .list()
        ))
            if (!["ReqCompleted", "ReqCancelled"].includes(request.statusId)) found.requests.push(request.requestId)
    return found
}
function findAssignments(p) {
    const partyId = assignmentParty(p.userId, "ADMIN_IDENTITY_VIEW")
    const found = openAssignments(partyId)
    return {
        resourceList: Object.keys(assignmentNames)
            .filter(kind => found[kind].length)
            .map(kind => ({
                resourceId: kind,
                resourceName: assignmentNames[kind] + " (" + found[kind].length + ")",
                resourceKind: "assignment",
                transferable: true,
                note: found[kind].length + " open"
            }))
    }
}
function transferAssignments(p) {
    const kind = text(p.assignmentKind)
    if (!assignmentNames[kind]) throw new Error("Unknown assignment kind " + kind)
    const fromPartyId = assignmentParty(p.fromUserId, "ADMIN_IDENTITY_MANAGE")
    const to = one("moqui.security.UserAccount", {userId: text(p.toUserId)})
    if (!to?.partyId) throw new Error("User " + text(p.toUserId) + " has no party to assign work to")
    const ids = openAssignments(fromPartyId)[kind]
    const failures = []
    if (kind === "workItems" && ids.length) {
        const out = ownerCall("ironstone.projects.WorkItemServices.bulk#WorkItems", {
            action: "assign",
            workEffortIds: ids,
            value: to.partyId
        })
        for (const failure of Array.from(out.failures || [])) failures.push(failure?.reason || String(failure))
        if (Number(out.failedCount || 0) > failures.length) failures.push(Number(out.failedCount) + " refused")
    } else
        for (const id of ids) {
            try {
                if (kind === "tasks")
                    ownerCall("ironstone.commons.TaskServices.reassign#Task", {
                        app: "commons",
                        workEffortId: id,
                        assignToPartyId: to.partyId
                    })
                else ownerCall("ironstone.commons.RequestServices.reassign#Request", {requestId: id, assignToPartyId: to.partyId})
            } catch (error) {
                failures.push(String(error.message || error))
            }
        }
    if (failures.length)
        throw new Error(
            failures.length + " of " + ids.length + " " + assignmentNames[kind].toLowerCase() + " not reassigned: " + failures[0]
        )
    ec.logger.info(
        ids.length + " " + kind + " of " + text(p.fromUserId) + " reassigned to " + text(p.toUserId) + " by " + ec.user.username
    )
    return {transferred: true}
}

const operations = {findOwnedResources, transferOwnedResource, findAssignments, transferAssignments}
;({
    startOperation,
    bulkDisable,
    execute: (op, parameters) => {
        if (!Object.hasOwn(operations, op)) throw new Error("Unknown lifecycle operation " + op)
        return operations[op](parameters)
    }
})
