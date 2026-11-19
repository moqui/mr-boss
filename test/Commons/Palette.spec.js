// The command palette's id lookup (Commons' IdLookup source, ironstone.commons.PaletteServices.lookup#Id, through the webroot
// shellSearch transition): an id goes to its record only when the user may see that record (SEC-BOS-86). A message between
// two other parties, with no record the user sees, is no row for Joe Developer, and no subject of it shows; john.doe (ADMIN)
// gets the row. Authorization stays on, as for a browser request.
// Run: ./moq test mr-boss --spec Palette
const webroot = "component://webroot/screen/webroot.xml"

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
    },
})

feature("the id lookup names a message only to a user who may see it (SEC-BOS-86)", {
    when() {
        const joe = as("joe.developer", () => idRows(shellJson("shellSearch", { text: messageId, groups: "IdLookup", limit: "10" })))
        const john = idRows(shellJson("shellSearch", { text: messageId, groups: "IdLookup", limit: "10" }))
        return { joe, john }
    },
    then({ joe, john }) {
        joe.filter((row) => String(row.title).includes("Palette secret")) == []
        joe.filter((row) => String(row.url).includes(messageId)) == []
        john.filter((row) => row.title === "Palette secret subject").length == 1
    },
})
