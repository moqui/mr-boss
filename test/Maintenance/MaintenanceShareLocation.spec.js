// Maintenance › Work orders › ShareLocation (mr-moqui plans/archive/Location-Sharing.md §3.7, LL6), through the page's transitions with
// authorization on: who may share their location with a customer repair's customer (the repair's assigned technician; maint.tech,
// a technician of another organization with the same groups, posting the same parameters, is refused with nothing made), and the
// split that tells the customer only after the technician confirmed: share makes the share and mails nothing, sendLink mails its
// link (the app's "started", or the press in a browser), and a share stopped instead (the app's Not now) sends nothing.
// Mantle's rules are Mantle's LocationRecordShares spec's.
// Run: ./moq test mr-boss --spec MaintenanceShareLocation
const lib = ec.resource.script("component://mr-boss/test/Maintenance/MaintenanceSpecLib.js")
const state = {}
const hour = 3600000
const nowMs = () => ec.user.timestampMillis(ec.user.nowTimestamp)

// a transition of the page as the user, with authorization on: its JSON answer
function post(username, transition, parameters) {
    return lib.asUser(username, () => {
        const result = ec.screen
            .makeTest()
            .rootScreen("component://mr-boss/screen/Maintenance.xml")
            .render("WorkOrders/ShareLocation/" + transition, Object.assign({workEffortId: state.repair.workEffortId}, parameters), "post")
        ec.message.clearErrors()
        return result.jsonObject || {status: result.status, errors: Array.from(result.errorMessages || []).join(" | ")}
    })
}
const share = username => post(username, "share", {thruDate: String(nowMs() + hour), purposeText: "About 20 minutes"})
const sharesOf = userId => lib.system(() => ec.entity.find("moqui.maps.LocationShare").condition("ownerUserId", userId).count())
const mails = () =>
    lib.system(() =>
        Array.from(ec.entity.find("moqui.basic.email.EmailMessage").condition("emailTemplateId", "MANTLE_LOCATION_GUEST_LINK").list())
            .filter(row => String(row.body || "").includes("/location/")))

spec({
    stepwise: true,
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
        const refused = share(lib.users.tech)
        const otherAfter = sharesOf(state.otherUserId)
        const mailsBefore = mails().length
        const shared = share(state.repair.tech)
        state.shared = shared
        return {refused, shared, made: otherAfter - otherBefore, mailed: mails().length - mailsBefore}
    },
    then({refused, shared, made, mailed}) {
        shared.applied == true && !!shared.shareId && /^[A-Za-z0-9_-]{32}$/.test(shared.linkSecret)
        refused.applied == false && refused.shareId == null && /not available/.test(refused.reason)
        made == 0
        // the share alone tells the customer nothing
        mailed == 0
    }
})

feature("the link is mailed by sendLink once the technician confirmed, and a share stopped instead (Not now) sends nothing", {
    when() {
        const before = mails().length
        const sent = post(state.repair.tech, "sendLink", {shareId: state.shared.shareId, linkSecret: state.shared.linkSecret})
        const afterSend = mails()
        const declined = share(state.repair.tech)
        const stopped = post(state.repair.tech, "stop", {shareId: declined.shareId})
        const ended = lib.system(() => ec.entity.find("moqui.maps.LocationShare").condition("shareId", declined.shareId).one())
        return {before, sent, afterSend, declined, stopped, ended, afterStop: mails().length}
    },
    then({before, sent, afterSend, declined, stopped, ended, afterStop}) {
        sent.applied == true && sent.mailReason != "NO_SENDER" && sent.mailReason != "NO_CUSTOMER_EMAIL"
        afterSend.length == before + 1
        afterSend.some(row => String(row.body || "").includes("#" + state.shared.linkSecret))
        declined.applied == true && stopped.applied == true && ended.endedDate != null
        afterStop == afterSend.length
    }
})
