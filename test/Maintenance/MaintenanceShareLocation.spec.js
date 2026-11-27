// Maintenance › Work orders › ShareLocation (mr-moqui plans/Location-Sharing.md §3.7, LL6): who may share their location with a
// customer repair's customer, through the page's share transition with authorization on: the technician assigned to the repair
// shares (Mantle's create#RecordGuestShare, whose rules Mantle's LocationRecordShares spec tests), and maint.tech, a technician
// of another organization with the same groups, posting the same parameters, is refused with nothing made.
// Run: ./moq test mr-boss --spec MaintenanceShareLocation
const lib = ec.resource.script("component://mr-boss/test/Maintenance/MaintenanceSpecLib.js")
const state = {}
const hour = 3600000
const nowMs = () => ec.user.timestampMillis(ec.user.nowTimestamp)

// the share transition as the user, with authorization on: its JSON answer
function share(username, workEffortId) {
    return lib.asUser(username, () => {
        const result = ec.screen
            .makeTest()
            .rootScreen("component://mr-boss/screen/Maintenance.xml")
            .render("WorkOrders/ShareLocation/share", {workEffortId, thruDate: String(nowMs() + hour), purposeText: "About 20 minutes"}, "post")
        ec.message.clearErrors()
        return result.jsonObject || {status: result.status, errors: Array.from(result.errorMessages || []).join(" | ")}
    })
}
const sharesOf = userId => lib.system(() => ec.entity.find("moqui.maps.LocationShare").condition("ownerUserId", userId).count())

spec({
    setupSpec() {
        login("john.doe")
        state.repair = lib.customerRepair("SHARELOC")
        // an open repair with a planned end four hours out
        lib.system(() => {
            const order = ec.entity.find("mantle.work.effort.WorkEffort").condition("workEffortId", state.repair.workEffortId).one()
            order.estimatedCompletionDate = new Date(nowMs() + 4 * hour)
            order.update()
        })
        state.techUserId = lib.system(() => ec.entity.find("moqui.security.UserAccount").condition("username", state.repair.tech).one().userId)
        state.otherUserId = lib.system(() => ec.entity.find("moqui.security.UserAccount").condition("username", lib.users.tech).one().userId)
    },
    cleanupSpec() {
        lib.system(() => {
            for (const row of Array.from(ec.entity.find("moqui.maps.LocationShare").condition("ownerUserId", "in", [state.techUserId, state.otherUserId])
                .condition("endedDate", null).list())) {
                row.revokedDate = ec.user.nowTimestamp
                row.endedDate = ec.user.nowTimestamp
                row.update()
            }
        })
        login("john.doe")
    }
})

feature("the repair's assigned technician shares their location with its customer; another organization's technician is refused", {
    when() {
        const otherBefore = sharesOf(state.otherUserId)
        const refused = share(lib.users.tech, state.repair.workEffortId)
        const otherAfter = sharesOf(state.otherUserId)
        const shared = share(state.repair.tech, state.repair.workEffortId)
        return {refused, shared, made: otherAfter - otherBefore}
    },
    then({refused, shared, made}) {
        shared.applied == true && !!shared.shareId
        refused.applied == false && refused.shareId == null && /not available/.test(refused.reason)
        made == 0
    }
})
