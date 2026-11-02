// Comms Consent (screen/Comms/Consent/List.xml and Contact.xml, template/ConsentRecord.xml, service/ironstone/comms/ConsentServices.xml;
// design-drawers-commons.md §16 Consent; impl-drawers-commons.md M11) and the Consent tab of the contact record
// (template/ContactRecord.xml, §6 ContactDetail), on the consent demo (data/BossConsentDemoData.xml): the registry with its
// rows, chips and filters, the export of every match and of one contact's history for a data request, recording a consent with
// evidence (allowSolicitation following it), withdrawing it, unsubscribing and subscribing a contact with the note of the
// request, the bulk unsubscribe; for anyone but a contact admin (Joe Developer) the screens say so and the transitions and
// services refuse (one check, a write and a find shown); the contact record's tab shows the state to anyone who may see the contact and its changes only to a
// contact admin. Authorization stays on, as for a browser request.
// Run: ./moq test mr-boss --spec Consent
const webroot = "component://webroot/screen/webroot.xml"
const comms = "component://mr-boss/screen/Comms.xml"
const commons = "component://mr-boss/screen/Commons.xml"
const ALEX = "BOSS_DEMO_CON_ALEX", JORDAN = "BOSS_DEMO_CON_JORDAN", CASEY = "BOSS_DEMO_CON_CASEY", TAYLOR = "BOSS_DEMO_CON_TAYLOR", BOB = "ORG_ACME_BA"
const LIST_NEWS = "BOSS_DEMO_LIST_NEWS", LIST_EVENTS = "BOSS_DEMO_LIST_EVENTS"

function render(path, parameters) {
    const str = ec.screen.makeTest().rootScreen(webroot).renderMode("qvt").withStaticData().render(path, Object.assign({ lastStandalone: "true" }, parameters || {}), null)
    const output = String(str.output || "")
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), output, broken: /Error rendering|Exception in render/.test(output) }
}
function post(root, path, parameters) {
    const str = ec.screen.makeTest().rootScreen(root).render(path, parameters || {}, "post")
    const output = String(str.output || "")
    let json = null
    try { json = JSON.parse(output) } catch (err) { json = null }
    const errors = (json && !Array.isArray(json) && json.errors) || str.errorMessages.join(" | ")
    ec.message.clearErrors()
    return { status: str.status, errors: errors || "", json: json || {}, output }
}
function sys(run) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try { return run() } finally { if (!wasDisabled) ec.artifactExecution.enableAuthz() }
}
function as(username, run) {
    login(username)
    try { return run() } finally { login("john.doe") }
}
function errorOf(name, params) {
    try { call(name, params) } catch (e) { ec.message.clearErrors(); return String(e.message) }
    return null
}
const statusOf = (contactListId, partyId) => sys(() => {
    const rows = Array.from(ec.entity.find("mantle.marketing.contact.ContactListParty").condition({ contactListId, partyId }).orderBy("-fromDate").list())
    return rows.length ? rows[0].statusId : null
})
const consents = (partyId) => sys(() => Array.from(ec.entity.find("mantle.party.PartyConsent").condition({ partyId }).list())
        .sort((a, b) => Number(b.consentDate) - Number(a.consentDate) || (String(b.partyConsentId).length - String(a.partyConsentId).length)
            || (String(b.partyConsentId) > String(a.partyConsentId) ? 1 : -1)))
const rowsOf = (output) => Array.from(output.matchAll(/data-party="([^"]+)"/g)).map((match) => match[1])
const list = (parameters) => render("apps/Comms/Consent", parameters)
const contact = (partyId) => render("apps/Comms/Consent/Contact", { partyId })

spec({
    setupSpec() { login("john.doe") },
})

feature("the registry: one row per contact with consent data, the chips of its lists and purposes, the last change; the demo's states", {
    when() {
        return { shown: list({}) }
    },
    then({ shown }) {
        shown.status == 200
        shown.errors == ""
        !shown.broken
        [ALEX, JORDAN, CASEY, TAYLOR, BOB].every((id) => rowsOf(shown.output).includes(id))
        shown.output.includes("Alex Rivera")
        shown.output.includes("Ziziwork News")
        shown.output.includes("Events and workshops")
        shown.output.includes("Marketing Email")
        shown.output.includes("Record consent")
        shown.output.includes("Export CSV")
        shown.output.includes("Unsubscribe from a list")
    },
})

feature("ConsentFind narrows the registry (#what)", {
    where: [
        { what: "unsubscribed from the news", parameters: { contactListId: LIST_NEWS, statusId: "CLPT_UNSUBSCRIBED" }, expected: [JORDAN] },
        { what: "waiting for the opt-in", parameters: { contactListId: LIST_NEWS, statusId: "CLPT_PENDING" }, expected: [CASEY] },
        { what: "an unsubscribe waiting for its confirmation", parameters: { statusId: "CLPT_UNSUBS_PENDING" }, expected: [TAYLOR] },
        { what: "SMS granted", parameters: { purposeEnumId: "PcpSms", statusId: "PconGranted" }, expected: [TAYLOR] },
        { what: "the text of an email", parameters: { text: "jordan.lee@" }, expected: [JORDAN] },
    ],
    expect({ parameters, expected }) {
        const shown = list(parameters)
        shown.errors == ""
        rowsOf(shown.output).filter((id) => id.startsWith("BOSS_DEMO_CON_") || id === BOB).sort() == expected.sort()
    },
})

feature("one contact's consent: the addresses with their contact flag, the lists, the contact as a whole, the history and the export of a data request", {
    when() {
        const page = contact(ALEX)
        const csv = ec.screen.makeTest().rootScreen(comms).render("Consent/Contact/consentHistoryExport", { partyId: ALEX }, "post")
        return { page, csv: String(csv.output || "") }
    },
    then({ page, csv }) {
        page.errors == ""
        !page.broken
        page.output.includes("alex.rivera@example.com")
        page.output.includes("Allows contact")
        page.output.includes("Ziziwork News")
        page.output.includes("Product updates")
        page.output.includes("The contact as a whole")
        page.output.includes("Data Processing")
        page.output.includes("History")
        page.output.includes("Signup form at shop.ziziwork.example")
        page.output.includes("Export for a data request")
        csv.startsWith("Party ID,Name,When,Purpose,Status,Address,List,Source,Evidence,Comments,Recorded By")
        csv.includes("Alex Rivera")
        csv.includes("Data Processing")
    },
})

feature("Record consent with evidence: a withdrawal of marketing email turns the address's contact flag off, a grant turns it on again", {
    when() {
        const withdrawn = post(comms, "Consent/Contact/consentRecord", { partyId: JORDAN, purposeEnumId: "PcpMarketingEmail", statusId: "PconWithdrawn",
            sourceEnumId: "PcsStaff", evidenceText: "Asked by phone not to get offers" })
        const off = sys(() => ec.entity.find("mantle.party.contact.PartyContactMech").condition({ partyId: JORDAN, contactMechId: `${JORDAN}_EM` }).one().allowSolicitation)
        const row = consents(JORDAN)[0]
        const granted = post(comms, "Consent/List/recordConsent", { partyId: JORDAN, purposeEnumId: "PcpMarketingEmail", statusId: "PconGranted",
            sourceEnumId: "PcsForm", evidenceText: "Preferences form, 2026-10" })
        const on = sys(() => ec.entity.find("mantle.party.contact.PartyContactMech").condition({ partyId: JORDAN, contactMechId: `${JORDAN}_EM` }).one().allowSolicitation)
        return { withdrawn, off, row, granted, on }
    },
    then({ withdrawn, off, row, granted, on }) {
        withdrawn.errors == ""
        off == "N"
        row.statusId == "PconWithdrawn"
        row.contactMechId == `${JORDAN}_EM`
        row.evidenceText == "Asked by phone not to get offers"
        row.userId == "EX_JOHN_DOE"
        row.sourceEnumId == "PcsStaff"
        granted.errors == ""
        on == "Y"
    },
})

feature("a contact admin unsubscribes and subscribes a contact with the note of the request; the bulk action unsubscribes the selected", {
    when() {
        const out = post(comms, "Consent/Contact/consentListSet", { partyId: CASEY, contactListId: LIST_NEWS, subscribe: "N", evidenceText: "Email to the shop" })
        const casey = statusOf(LIST_NEWS, CASEY)
        const note = consents(CASEY).find((row) => row.contactListId === LIST_NEWS)
        const back = post(comms, "Consent/Contact/consentListSet", { partyId: CASEY, contactListId: LIST_NEWS, subscribe: "Y", evidenceText: "Asked again at the till" })
        const caseyBack = statusOf(LIST_NEWS, CASEY)
        // Bob is off the events already (the demo's staff withdrawal), so only Jordan changes
        const bulk = post(comms, "Consent/List/unsubscribeParties", { selectedPartyIds: `${JORDAN},${BOB}`, bulkContactListId: LIST_EVENTS, evidenceText: "Suppression list 2026-10" })
        return { out, casey, note, back, caseyBack, bulk, jordanEvents: statusOf(LIST_EVENTS, JORDAN), bobEvents: statusOf(LIST_EVENTS, BOB),
            jordanNote: consents(JORDAN).find((row) => row.contactListId === LIST_EVENTS) }
    },
    then({ out, casey, note, back, caseyBack, bulk, jordanEvents, bobEvents, jordanNote }) {
        out.errors == ""
        casey == "CLPT_UNSUBSCRIBED"
        note.statusId == "PconWithdrawn"
        note.evidenceText == "Email to the shop"
        back.errors == ""
        caseyBack == "CLPT_ACCEPTED"
        bulk.errors == ""
        jordanEvents == "CLPT_UNSUBSCRIBED"
        jordanNote.evidenceText == "Suppression list 2026-10"
        bobEvents == "CLPT_UNSUBSCRIBED"
    },
})

feature("Export CSV: every contact that matches the find", {
    when() {
        const str = ec.screen.makeTest().rootScreen(comms).render("Consent/List/exportCsv", { contactListId: LIST_NEWS }, "post")
        return { csv: String(str.output || "") }
    },
    then({ csv }) {
        csv.startsWith("Party ID,Name,Email")
        csv.includes("Alex Rivera")
        csv.includes("Jordan Lee")
        !csv.includes("Mary Doe")
    },
})

feature("anyone but a contact admin: the screens say so, and the transitions and services refuse without reading", {
    allowMessageErrors: true,
    when() {
        return as("joe.developer", () => {
            const before = consents(ALEX).length
            const shown = list({})
            const page = contact(ALEX)
            const recorded = post(comms, "Consent/List/recordConsent", { partyId: ALEX, purposeEnumId: "PcpMarketingEmail", statusId: "PconWithdrawn" })
            const csv = post(comms, "Consent/List/exportCsv", {})
            const history = post(comms, "Consent/Contact/consentHistoryExport", { partyId: ALEX })
            // the services themselves, with authorization off so their own check is what refuses
            const find = sys(() => errorOf("ironstone.comms.ConsentServices.find#Consents", {}))
            const state = sys(() => call("ironstone.comms.ConsentServices.get#ContactConsent", { partyId: ALEX, includeHistory: true }))
            return { before, after: consents(ALEX).length, shown, page, recorded, csv, history, find, state,
                news: statusOf(LIST_NEWS, ALEX) }
        })
    },
    then({ before, after, shown, page, recorded, csv, history, find, state, news }) {
        shown.status == 200
        shown.output.includes("Only contact admins see and change consent")
        !shown.output.includes("Alex Rivera")
        page.output.includes("Only contact admins see and change consent")
        !page.output.includes("alex.rivera@example.com")
        recorded.errors.includes("Only contact admins manage consent")
        !csv.output.includes("Alex Rivera")
        !history.output.includes("Alex Rivera")
        find.includes("Only contact admins manage consent")
        state.canEdit == false
        state.historyList.length == 0
        after == before
        news == "CLPT_UNSUBSCRIBED" || news == "CLPT_ACCEPTED"
    },
})

feature("the contact record's Consent tab: the state and the changes for a contact admin, the state alone for anyone else who may see the contact", {
    when() {
        const admin = render("apps/Commons/Contacts/ContactDetail", { partyId: TAYLOR, tab: "consent" })
        const viaTab = post(commons, "Contacts/ContactDetail/consentRecord", { partyId: TAYLOR, purposeEnumId: "PcpPhone", statusId: "PconWithdrawn",
            contactMechId: `${TAYLOR}_TN`, evidenceText: "Asked not to be called" })
        const other = as("joe.developer", () => ({ shown: render("apps/Commons/Contacts/ContactDetail", { partyId: TAYLOR, tab: "consent" }),
            changed: post(commons, "Contacts/ContactDetail/consentListSet", { partyId: TAYLOR, contactListId: LIST_NEWS, subscribe: "N" }) }))
        return { admin, viaTab, other, phone: consents(TAYLOR).find((row) => row.purposeEnumId === "PcpPhone"), news: statusOf(LIST_NEWS, TAYLOR) }
    },
    then({ admin, viaTab, other, phone, news }) {
        admin.errors == ""
        !admin.broken
        admin.output.includes("taylor.brooks@example.com")
        admin.output.includes("Record consent")
        admin.output.includes("Unsubscribe")
        admin.output.includes("History and export in Comms Consent")
        admin.output.includes("/qapps/Comms/Consent/Contact?partyId=" + TAYLOR)
        viaTab.errors == ""
        phone.statusId == "PconWithdrawn"
        other.shown.errors == ""
        other.shown.output.includes("taylor.brooks@example.com")
        other.shown.output.includes("Ziziwork News")
        !other.shown.output.includes("Record consent")
        !other.shown.output.includes("History and export in Comms Consent")
        other.changed.errors.includes("Only contact admins manage consent")
        news == "CLPT_ACCEPTED"
    },
})
