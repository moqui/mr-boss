// The command palette's id lookup (Commons' IdLookup source, ironstone.commons.PaletteServices.lookup#Id, through the webroot
// shellSearch transition) and the record links' search (Chatter's searchRecords, ironstone.comms.InboxServices.search#LinkRecords):
// an id goes to its record only when the user may see that record (SEC-BOS-86). A message between two other parties, and a
// request, a task and an event of another organization with no party of Joe Developer's, are no row for him, and no subject or
// name of them shows; john.doe (ADMIN) gets them. Authorization stays on, as for a browser request.
// Run: ./moq test mr-boss --spec Palette
const webroot = "component://webroot/screen/webroot.xml"
const commons = "component://mr-boss/screen/Commons.xml"
const REQUEST = "BOSS_TEST_PAL_REQ", TASK = "BOSS_TEST_PAL_TASK", EVENT = "BOSS_TEST_PAL_EVENT"

function shellJson(path, parameters) {
    const str = ec.screen.makeTest().rootScreen(webroot).render(path, parameters || {}, null)
    let json = null
    try { json = JSON.parse(str.output) } catch (err) { json = null }
    ec.message.clearErrors()
    return json || {}
}
function sys(run) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try { return run() } finally { if (!wasDisabled) ec.artifactExecution.enableAuthz() }
}
function as(username, run) {
    login(username)
    try { return run() } finally { login("john.doe") }
}
const idRows = (json) => ((json.groups || []).find((group) => group.group === "IdLookup") || { rows: [] }).rows
let messageId

spec({
    setupSpec() {
        login("john.doe")
        // a message from Bob Acme to Pat Quinn: not Joe Developer's, and filed on no record
        messageId = sys(() => call("create#mantle.party.communication.CommunicationEvent", {
            communicationEventTypeId: "Email", contactMechTypeEnumId: "CmtEmailAddress", fromPartyId: "ORG_ACME_BA",
            toPartyId: "BOSS_DEMO_DUP_A", subject: "Palette secret subject", body: "x", statusId: "CeSent", entryDate: ec.user.nowTimestamp
        }).communicationEventId)
        // a request, a task and an event of another organization (Acme), no party of Joe's on them
        sys(() => {
            call("create#mantle.request.Request", { requestId: REQUEST, requestName: "Palette secret request", requestTypeEnumId: "RqtSupport",
                statusId: "ReqSubmitted", filedByPartyId: "ORG_ACME_BA" })
            call("create#mantle.work.effort.WorkEffort", { workEffortId: TASK, workEffortTypeEnumId: "WetTask", workEffortName: "Palette secret task",
                ownerPartyId: "ORG_ACME", statusId: "WeInPlanning" })
            call("create#mantle.work.effort.WorkEffort", { workEffortId: EVENT, workEffortTypeEnumId: "WetEvent", workEffortName: "Palette secret event",
                ownerPartyId: "ORG_ACME", statusId: "WeInPlanning" })
        })
    },
})

// the rows of a lookup by id, of the message's MessageDetail or a record's own id (a party may share the message's sequence number)
const lookup = (text) => idRows(shellJson("shellSearch", { text, groups: "IdLookup", limit: "10" }))
const messageRows = (rows) => rows.filter((row) => String(row.url).includes("MessageDetail?communicationEventId=" + messageId))
const named = (rows) => rows.filter((row) => String(row.title).includes("Palette secret"))
function linkOptions(term) {
    const str = ec.screen.makeTest().rootScreen(commons).render("Chatter/searchRecords", { term }, null)
    let json = null
    try { json = JSON.parse(str.output) } catch (err) { json = null }
    ec.message.clearErrors()
    return Array.isArray(json) ? json : []
}

feature("the id lookup names a message, a request, a task or an event only to a user who may see it (SEC-BOS-86)", {
    when() {
        const ids = [REQUEST, TASK, EVENT]
        const joe = as("joe.developer", () => ({ message: messageRows(lookup(messageId)), records: ids.flatMap((id) => named(lookup(id))) }))
        const john = { message: messageRows(lookup(messageId)), records: ids.flatMap((id) => named(lookup(id))) }
        return { joe, john }
    },
    then({ joe, john }) {
        joe.message == []
        joe.records == []
        john.message.length == 1
        john.message[0].title == "Palette secret subject"
        john.records.length == 3
    },
})

feature("the record links' search offers a record by its id only to a user who may see it (SEC-BOS-86)", {
    when() {
        const joe = as("joe.developer", () => [REQUEST, TASK].flatMap((id) => linkOptions(id)).filter((row) => [REQUEST, TASK].includes(row.id)))
        const john = [REQUEST, TASK].flatMap((id) => linkOptions(id)).filter((row) => [REQUEST, TASK].includes(row.id))
        return { joe, john }
    },
    then({ joe, john }) {
        joe == []
        john.length == 2
    },
})
