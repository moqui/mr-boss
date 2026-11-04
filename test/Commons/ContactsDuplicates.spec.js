// Commons Contacts' Duplicates and Compare (screen/Commons/Contacts/Duplicates.xml, Compare.xml; impl-drawers-commons.md M4;
// design-drawers-commons.md §6): the demo's duplicate pairs (data/BossDemoData.xml: Pat and Patricia Quinn with the same email and
// phone, Quinn Consulting and Quinn Consulting LLC) grouped by reason, each reason's limit, a reason narrowing the list, and Joe
// Developer's personal contact Sam Secret (with the same email and phone) never in it nor in Compare; Duplicates is for contact
// admins; Compare and Merge; Not a duplicate (Mantle's PartyNotDuplicate) and Run the scan; an old BOSS not-a-duplicate setting
// moved on a load. Mantle's own rules of the scan (find#PartyDuplicates, check#AllPartyDuplicates, the not-duplicate pairs it leaves
// out) are mr-mantle's test/party/Contacts.spec.js. Each list of the pairs runs find#PartyDuplicates for every flagged party, which a
// full test run makes many: the spec lists them as few times as its rules need. Authorization stays on, as for a browser request.
// It runs after Contacts.spec.js, whose list and search checks need the pairs before the merge.
// Run: ./moq test mr-boss --spec ContactsDuplicates
const webroot = "component://webroot/screen/webroot.xml"
const commons = "component://mr-boss/screen/Commons.xml"
const SAM = "BOSS_DEMO_PC_SAM"
const PAT = "BOSS_DEMO_DUP_A", PATRICIA = "BOSS_DEMO_DUP_B", QUINN_ORG = "BOSS_DEMO_DUP_ORG_A", QUINN_LLC = "BOSS_DEMO_DUP_ORG_B"

function render(path, parameters) {
    const str = ec.screen.makeTest().rootScreen(webroot).renderMode("qvt").withStaticData().render(path, Object.assign({ lastStandalone: "true" }, parameters || {}), null)
    const output = String(str.output || "")
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), output, broken: /Error rendering|Exception in render/.test(output) }
}
function post(path, parameters) {
    const str = ec.screen.makeTest().rootScreen(commons).render(path, parameters || {}, "post")
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | ") }
}
function sys(run) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try { return run() } finally { if (!wasDisabled) ec.artifactExecution.enableAuthz() }
}
const one = (entityName, fields) => sys(() => ec.entity.find(entityName).condition(fields).one())
const current = (entityName, fields) => sys(() => Array.from(ec.entity.find(entityName).condition(fields)
        .condition(ec.entity.conditionFactory.makeConditionDate("fromDate", "thruDate", null)).list()))
function as(username, run) {
    login(username)
    try { return run() } finally { login("john.doe") }
}

spec({
    dependsOn: ["Contacts"],
    setupSpec() { login("john.doe") },
})

// The limit is of each reason's pairs: with one limit over all, the email pairs (sorted first) left no name group once a
// database had more email pairs than the limit (a full test run's 800 or so).
feature("the duplicate pairs' limit is of each reason, so more email pairs than the limit leave the name group", {
    when() {
        const pairs = sys(() => ec.service.sync().name("ironstone.commons.ContactServices.get#DuplicatePairs").parameters({ limit: 1 }).call().pairList)
        const reasons = Array.from(pairs).map((pair) => pair.reason)
        return { email: reasons.filter((reason) => reason == "email").length, name: reasons.filter((reason) => reason == "name").length }
    },
    then({ email, name }) {
        email == 1
        name == 1
    },
})

feature("Duplicates groups the pairs by reason and leaves out personal contacts, another user's too; a reason narrows it; it is for contact admins", {
    when() {
        const shown = render("apps/Commons/Contacts/Duplicates", {})
        const byEmail = render("apps/Commons/Contacts/Duplicates", { reason: "email" })
        const joe = as("joe.developer", () => render("apps/Commons/Contacts/Duplicates", {}))
        return { shown, byEmail, joe }
    },
    then({ shown, byEmail, joe }) {
        shown.errors == ""
        !shown.broken
        shown.output.includes("Same email · ")
        shown.output.includes("Same name · ")
        shown.output.includes("Patricia Quinn")
        shown.output.includes("Quinn Consulting LLC")
        // the names as alike as Mantle scores them
        shown.output.includes("names 100% alike")
        !shown.output.includes("Sam Secret")
        !shown.output.includes(SAM)
        byEmail.output.includes("Patricia Quinn")
        !byEmail.output.includes("Quinn Consulting LLC")
        !byEmail.output.includes("Sam Secret")
        joe.output.includes("Only contact admins review duplicates")
    },
})

feature("Compare shows both side by side with the field choice, never another user's contact; Merge keeps Pat Quinn with Patricia's first name and her address", {
    when() {
        const stranger = render("apps/Commons/Contacts/Compare", { partyId: SAM, otherPartyId: PAT })
        const compare = render("apps/Commons/Contacts/Compare", { partyId: PAT, otherPartyId: PATRICIA, returnTo: "duplicates" })
        const merged = post("Contacts/Compare/mergeContacts", { partyId: PAT, otherPartyId: PATRICIA, returnTo: "duplicates", keepPartyId: PAT,
            pick_firstName: "right" })
        return { stranger, compare, merged, pat: one("mantle.party.PartyDetail", { partyId: PAT }), patricia: one("mantle.party.Party", { partyId: PATRICIA }),
            patAddresses: current("mantle.party.contact.PartyContactMechPostalAddress", { partyId: PAT }) }
    },
    then({ stranger, compare, merged, pat, patricia, patAddresses }) {
        stranger.output.includes("not found")
        !stranger.output.includes("Sam Secret")
        compare.errors == ""
        compare.output.includes("Side by side")
        compare.output.includes("Keep Pat Quinn (BOSS_DEMO_DUP_A)")
        compare.output.includes("Not a duplicate")
        compare.output.includes("pick_firstName")
        merged.errors == ""
        merged.status == 302
        patricia.disabled == "Y"
        patricia.mergedToPartyId == PAT
        pat.firstName == "Patricia"
        pat.comments == "Met at the October trade show."
        patAddresses.length == 1
    },
})

feature("Not a duplicate keeps a pair out of the list (Mantle's PartyNotDuplicate), as Merge does the merged pair; Run the scan runs on demand", {
    when() {
        const marked = post("Contacts/Duplicates/notDuplicate", { partyId: QUINN_ORG, otherPartyId: QUINN_LLC })
        const after = render("apps/Commons/Contacts/Duplicates", {})
        // last, as each list after a scan has more flagged parties to read
        const scan = post("Contacts/Duplicates/runScan", {})
        return { marked, after, scan, decision: one("mantle.party.PartyNotDuplicate", { partyId: QUINN_ORG, otherPartyId: QUINN_LLC }) }
    },
    then({ marked, after, scan, decision }) {
        marked.errors == ""
        decision.decidedByUserId == "EX_JOHN_DOE"
        !after.output.includes("Quinn Consulting LLC")
        !after.output.includes(PATRICIA)
        scan.errors == ""
    },
})

feature("an old BOSS not-a-duplicate setting moves to PartyNotDuplicate on a load, and the setting goes", {
    when() {
        sys(() => ec.entity.makeDataLoader().xmlText(`<entity-facade-xml>
            <mantle.party.PartySettingType partySettingTypeId="BossNotDuplicates" description="Not duplicates of (IronStone Contacts)"/>
            <mantle.party.PartySetting partyId="ORG_ACME_BA" partySettingTypeId="BossNotDuplicates" settingValue="ORG_ACME_SA,NO_SUCH_PARTY"/>
        </entity-facade-xml>`).load())
        const out = sys(() => call("ironstone.commons.ContactServices.migrate#NotDuplicateSettings", {}))
        const [low, high] = ["ORG_ACME_BA", "ORG_ACME_SA"].sort()
        return { out, decision: one("mantle.party.PartyNotDuplicate", { partyId: low, otherPartyId: high }),
            setting: one("mantle.party.PartySetting", { partyId: "ORG_ACME_BA", partySettingTypeId: "BossNotDuplicates" }),
            type: one("mantle.party.PartySettingType", { partySettingTypeId: "BossNotDuplicates" }) }
    },
    then({ out, decision, setting, type }) {
        out.migratedCount == 1
        decision != null
        setting == null
        type == null
    },
})
