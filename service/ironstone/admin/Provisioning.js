// People's entry into Admin's lifecycle (ironstone.admin.LifecycleServices request#Provisioning and request#AccessEnd; design-admin
// §4.1 Provisioning from People, design-people §4; impl-people P7, owner contract, F15): the mr-boss tx-commit rules on People's
// hire#Employee and on an applied employment change (service/PeopleLifecycle.secas.xml), and HR's "Request access again" on
// Employee360, call these with the People change. The grant proposal is BOSS's: BOSS_USERS and BOSS_PEOPLE_SELF by default (the
// user's call, impl-people §4), and anything more only a registered bundle the caller may give (its delegable permission held,
// never a privileged one); Admin's delegation rules decide again when the identity operator sends the invitation. Mantle's
// mantle.party.IdentityServices request#Provisioning and request#AccessEnd record the operation, keyed by the change, and run its
// steps now for an identity operator or leave them waiting for one; the employment is the organization membership (F49), so no
// second relationship is made. A failure is noted on the change (PeopleServices.note#AccessRequestFailure) and logged by
// employment; it never undoes the hire or the change, and the request is made again by its key.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const text = value => String(value ?? "").trim()
const defaultProposal = ["BOSS_USERS", "BOSS_PEOPLE_SELF"]
const refused = (reasonCode, reason) => ({applied: false, reasonCode, reason, operationId: null, statusId: null, retried: false})

// A Mantle request as the caller (with the caller's authorization, so an identity operator's scope applies), in its own
// transaction and error frame: its answer, or the failure as a refusal.
function request(service, parameters) {
    ec.message.pushErrors()
    try {
        const out = ec.service.sync().name(service).parameters(parameters).requireNewTransaction(true).call() || {}
        if (ec.message.hasError()) throw new Error(ec.message.getErrorsString())
        return out
    } catch (error) {
        const message = String(error.message || error)
        return refused(lib.reasonCode(error) || /\b([A-Z][A-Z0-9_]{3,}):/.exec(message)?.[1] || "REQUEST_FAILED", message)
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
}
// The failure kept on the change, in a transaction of its own (never the change's): logged when even that is refused.
function noteFailure(employmentChangeId, out) {
    ec.message.pushErrors()
    try {
        ec.service
            .sync()
            .name("mantle.humanres.PeopleServices.note#AccessRequestFailure")
            .parameters({employmentChangeId, failure: out.reason || out.reasonCode})
            .requireNewTransaction(true)
            .call()
    } catch (error) {
        ec.logger.error(
            "The access request of change " +
                employmentChangeId +
                " failed (" +
                out.reason +
                ") and was not noted: " +
                error.message
        )
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
}
const changeOf = employmentChangeId =>
    text(employmentChangeId)
        ? lib.one("mantle.humanres.employment.EmploymentChange", {employmentChangeId: text(employmentChangeId)})
        : null
// The proposal: the defaults, and each other bundle the caller may give (registered, enabled, its delegable permission held, not
// a privileged group); else refused by name.
function proposal(extra) {
    const ids = Array.from(
        new Set(
            defaultProposal.concat(
                Array.from(extra || [])
                    .map(text)
                    .filter(Boolean)
            )
        )
    )
    for (const groupId of ids) {
        if (defaultProposal.includes(groupId)) continue
        const bundle = lib.one("moqui.security.CapabilityBundle", {userGroupId: groupId})
        const group = lib.one("moqui.security.UserGroup", {userGroupId: groupId})
        if (!bundle || bundle.disabled === "Y" || !group)
            return {refusal: refused("GRANT_INVALID", groupId + " is not a registered bundle")}
        const privileged = groupId === "ADMIN" || Array.from(UserSecurityChecks.privilegedGroups()).includes(groupId)
        if (privileged || (bundle.delegablePermissionId && !ec.user.hasPermission(bundle.delegablePermissionId)))
            return {refusal: refused("GRANT_NOT_YOURS", (bundle.description || groupId) + " is not yours to give")}
    }
    return {ids}
}
// request#Provisioning: a hire HR asked an account for.
function requestProvisioning(p) {
    const change = changeOf(p.employmentChangeId)
    if (!change || change.changeKindEnumId !== "EckHire") return refused("NOT_A_HIRE", "Not a hire")
    if (change.accessRequested !== "Y") return refused("NOT_REQUESTED", "The hire asked for no account")
    const proposed = proposal(p.bundleGroupIdList)
    if (proposed.refusal) {
        noteFailure(change.employmentChangeId, proposed.refusal)
        return proposed.refusal
    }
    const out = request("mantle.party.IdentityServices.request#Provisioning", {
        employmentChangeId: change.employmentChangeId,
        bundleGroupIdList: proposed.ids,
        operationKey: text(p.operationKey) || null,
        reason: text(p.reason) || "Hired"
    })
    if (out.applied === false) noteFailure(change.employmentChangeId, out)
    return out
}
// request#AccessEnd: a separation applied (any other change is no access end, answered quietly).
function requestAccessEnd(p) {
    const change = changeOf(p.employmentChangeId)
    if (!change || change.changeKindEnumId !== "EckSeparation") return refused("NOT_A_SEPARATION", "Not a separation")
    const out = request("mantle.party.IdentityServices.request#AccessEnd", {
        employmentChangeId: change.employmentChangeId,
        operationKey: text(p.operationKey) || null,
        reason: text(p.reason) || "Separated"
    })
    // a person with no account has no access to end: nothing to note
    if (out.applied === false && out.reasonCode !== "NO_ACCOUNT") noteFailure(change.employmentChangeId, out)
    return out
}

const operations = {requestProvisioning, requestAccessEnd}
;({
    execute: (op, parameters) => {
        if (!Object.hasOwn(operations, op)) throw new Error("Unknown provisioning operation " + op)
        return operations[op](parameters || {})
    },
    defaultProposal
})
