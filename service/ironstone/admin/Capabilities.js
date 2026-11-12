// The access review in Admin, ironstone.admin.CapabilityServices (impl-admin P9; design-admin §16 the access and grant review;
// mr-moqui plans/Admin-Screens-Down.md). The framework's org.moqui.admin.AccessServices holds the registry, the projections and
// every rule (get#GrantReview: ADMIN_ACCESS_VIEW, sealed permissions left out and counted), and the review's rows are made by
// the framework's System screen's module (tools template/AccessReview.js). This module adds Admin's part:
// - accessReview: the review's one list for print and CSV, with a group's members shown only when they work for an organization
//   the user administers (the others counted, never named, as GroupDetail).
// The Capabilities matrix (get#MatrixContext, apply#MatrixChanges) is the framework's, org.moqui.admin.AccessServices.
const admin = ec.resource.script("component://mr-boss/service/ironstone/admin/Admin.js")
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const review = ec.resource.script("component://tools/template/AccessReview.js")
const {denied} = lib
const access = "org.moqui.admin.AccessServices."
// the framework's bound (get#GrantReview), answered here as a reason the screen shows
const maxReviewGroups = 60

const text = value => String(value ?? "").trim()
const call = (name, parameters) => ec.service.sync().name(name).parameters(parameters).call() || {}
// A comma separated or repeated parameter as its distinct values.
const listOf = value =>
    Array.from(new Set((typeof value === "string" ? value.split(",") : Array.from(value || [])).map(text).filter(Boolean)))
function requireView() {
    if (!admin.required().capabilities.accessView) denied("PERMISSION_DENIED", "ADMIN_ACCESS_VIEW is required")
}

// ===== the access and grant review =====
// get#AccessReview
function accessReview(p) {
    requireView()
    const groupIds = listOf(p.groups)
    if (groupIds.length > maxReviewGroups)
        return {
            failure: "Review at most " + maxReviewGroups + " groups at a time",
            reviewRows: [],
            groupRows: [],
            asOfText: "",
            groups: groupIds.join(","),
            sealedOmittedCount: 0,
            outsideCount: 0
        }
    const found = call(access + "get#GrantReview", {
        userGroupIdList: groupIds,
        appName: text(p.appName) || null,
        asOfDate: p.asOfDate || null
    })
    const members = Array.from(found.memberList || [])
    const inScope = members.length
        ? admin.execute("memberScope", {userIds: members.map(row => row.userId)}).inScopeUserIds || []
        : []
    return Object.assign(
        {failure: null},
        review.view(found, inScope, " member(s) of organizations you do not administer not listed")
    )
}

const operations = {accessReview}
;({
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown capability operation " + op)
        return operations[op](parameters)
    }
})
