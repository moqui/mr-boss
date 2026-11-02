// Commons Contacts (impl-drawers-commons.md M4; design-drawers-commons.md §6): the side list of the split (screen/Commons/Contacts/List.xml)
// by scope, search and letter; the contact record (template/ContactRecord.xml) of a directory party, a personal contact and an employee,
// with its tabs; editing a personal contact's information, names, notes, organization and relationships, and a directory party only by
// a contact admin; the bulk actions (add to group and book, remove from book, export vCard and CSV, merge two, delete); Duplicates with
// Compare, Merge and Not a duplicate (Mantle's PartyNotDuplicate); New contact opening the record, Link to a directory party,
// the contact's photo (add, change, remove). Privacy (impl R7): Joe Developer's personal contact Sam Secret (the demo's, with the same email and
// phone as the demo's duplicate pair Pat and Patricia Quinn) never shows to john.doe through the list (every scope, the search
// by name, email and phone), the record by id, its transitions, the palette's People source, Compare or Duplicates; john.doe's
// personal contacts never show to Joe Developer. The demo is data/BossDemoData.xml (M4). Authorization stays on, as for a
// browser request.
// Run: ./moq test mr-boss --spec Contacts
const webroot = "component://webroot/screen/webroot.xml"
const commons = "component://mr-boss/screen/Commons.xml"
const MARY = "BOSS_DEMO_PC_MARY", ROBIN = "BOSS_DEMO_PC_ROBIN", TOM = "BOSS_DEMO_PC_TOM", PIPES = "BOSS_DEMO_PC_PIPES", SAM = "BOSS_DEMO_PC_SAM"
// the demo's duplicates: Pat and Patricia Quinn (the same email and phone), Quinn Consulting and Quinn Consulting LLC
const PAT = "BOSS_DEMO_DUP_A", PATRICIA = "BOSS_DEMO_DUP_B", QUINN_ORG = "BOSS_DEMO_DUP_ORG_A", QUINN_LLC = "BOSS_DEMO_DUP_ORG_B"

function render(path, parameters) {
    const str = ec.screen.makeTest().rootScreen(webroot).renderMode("qvt").withStaticData().render(path, Object.assign({ lastStandalone: "true" }, parameters || {}), null)
    const output = String(str.output || "")
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), output, broken: /Error rendering|Exception in render/.test(output) }
}
function post(path, parameters) {
    const str = ec.screen.makeTest().rootScreen(commons).render(path, parameters || {}, "post")
    const output = String(str.output || "")
    let json = null
    try { json = JSON.parse(output) } catch (err) { json = null }
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), json: json || {}, output }
}
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
const one = (entityName, fields) => sys(() => ec.entity.find(entityName).condition(fields).one())
const current = (entityName, fields) => sys(() => Array.from(ec.entity.find(entityName).condition(fields)
        .condition(ec.entity.conditionFactory.makeConditionDate("fromDate", "thruDate", null)).list()))
// the side list's rows, in order
const rowsOf = (output) => Array.from(output.matchAll(/data-party="([^"]+)"/g)).map((match) => match[1])
function list(parameters) { return render("apps/Commons/Contacts", Object.assign({ find: "Y" }, parameters || {})) }
const detail = (partyId, parameters) => render("apps/Commons/Contacts/ContactDetail", Object.assign({ partyId }, parameters || {}))
function as(username, run) {
    login(username)
    try { return run() } finally { login("john.doe") }
}

spec({
    setupSpec() { login("john.doe") },
})

feature("the split renders the side list and the first row's record, with the scopes, letters and bulk actions", {
    when() {
        const shown = list({ scope: "all" })
        return { shown, rows: rowsOf(shown.output) }
    },
    then({ shown, rows }) {
        shown.status == 200
        shown.errors == ""
        !shown.broken
        shown.output.includes("m-container-split")
        shown.output.includes('select-parameter="partyId"')
        shown.output.includes("Recently contacted")
        shown.output.includes("Not in a group")
        shown.output.includes("Add to group")
        shown.output.includes("Export vCard")
        shown.output.includes("Merge two")
        rows.includes("ORG_ACME_BA")
        rows.includes(MARY)
        rows.includes(PAT)
        !rows.includes(SAM)
        !rows.includes("_NA_")
        // the main pane: the record of the first row
        shown.output.includes(`record-id="${rows[0]}"`)
    },
})

feature("each scope lists its contacts: #scope", {
    where: [
        // the directory is large after other specs: narrowed by a name
        { scope: "all", text: "Doe", has: [MARY, "EX_JOHN_DOE"], hasNot: [SAM] },
        { scope: "all", text: "Quinn", has: [PAT, PATRICIA, QUINN_ORG], hasNot: [SAM] },
        { scope: "directory", text: "Doe", has: ["EX_JOHN_DOE"], hasNot: [MARY, SAM] },
        { scope: "directory", text: "Developer", has: ["ORG_ZIZI_JD", "ORG_ZIZI_BD"], hasNot: [SAM] },
        { scope: "mine", has: [MARY, ROBIN, TOM, PIPES, "ORG_ACME_BA"], hasNot: [PAT, SAM, "ORG_ZIZI_JD"] },
        { scope: "BOSS_DEMO_BOOK_JD", has: [MARY, ROBIN, TOM, "ORG_ACME_BA"], hasNot: [PAT, SAM] },
        { scope: "BOSS_DEMO_BOOK_TEAM", has: ["ORG_ACME_BA", "ORG_ZIZI_JD", "ORG_ZIZI_BD"], hasNot: [MARY, SAM] },
        { scope: "recent", has: [ROBIN], hasNot: [SAM] },
        { scope: "ungrouped", has: [TOM, PIPES, "ORG_ZIZI_JD"], hasNot: [MARY, ROBIN, "ORG_ACME_BA", SAM] },
    ],
    expect({ scope, text, has, hasNot }) {
        const shown = list(text ? { scope, text } : { scope })
        const rows = rowsOf(shown.output)
        shown.errors == ""
        !shown.broken
        has.filter((id) => !rows.includes(id)) == []
        hasNot.filter((id) => rows.includes(id)) == []
    },
})

feature("a book's group chips narrow the list: Family is Mary only", {
    when() {
        const shown = list({ scope: "BOSS_DEMO_BOOK_JD", contactBookGroupId: "BOSS_DEMO_GRP_FAMILY" })
        return { shown, rows: rowsOf(shown.output) }
    },
    then({ shown, rows }) {
        shown.errors == ""
        rows == [MARY]
        shown.output.includes("Family · 1")
        // Friends has Robin, and the contacts an import put there
        shown.output.includes("Friends · ")
    },
})

feature("the search finds by #what, and never Joe Developer's personal contact with the same email and phone", {
    where: [
        { what: "name", text: "Quinn", has: [PAT, PATRICIA, QUINN_ORG, QUINN_LLC] },
        { what: "first and last name", text: "Patricia Quinn", has: [PATRICIA] },
        { what: "last and first name", text: "Quinn, Pat", has: [PAT, PATRICIA] },
        { what: "email", text: "pat.quinn@quinn", has: [PAT, PATRICIA] },
        { what: "phone", text: "010-0142", has: [PAT, PATRICIA] },
        { what: "phone as typed", text: "+1 (555) 010-0142", has: [PAT, PATRICIA] },
        { what: "organization", text: "Pipes and Sons", has: [TOM, PIPES] },
        { what: "the other user's contact's name", text: "Secret", has: [] },
    ],
    expect({ text, has }) {
        const shown = list({ scope: "all", text })
        const rows = rowsOf(shown.output)
        shown.errors == ""
        has.filter((id) => !rows.includes(id)) == []
        !rows.includes(SAM)
        !shown.output.includes("Sam Secret")
    },
})

feature("the count of a search is the parties found, one find of the directory and the people of an organization of that name", {
    when() {
        const quinn = list({ scope: "directory", text: "Quinn Consulting" })
        return { quinn, rows: rowsOf(quinn.output) }
    },
    then({ quinn, rows }) {
        // the two organizations and Pat Quinn, a contact of Quinn Consulting
        rows.sort() == [PAT, QUINN_ORG, QUINN_LLC].sort()
        quinn.output.includes("3 contacts")
    },
})

feature("the alphabet jump narrows to the first letter, and the palette's People link (combinedName) searches", {
    when() {
        const letter = rowsOf(list({ scope: "mine", letter: "M" }).output)
        const palette = rowsOf(render("apps/Commons/Contacts", { combinedName: "Robin" }).output)
        return { letter, palette }
    },
    then({ letter, palette }) {
        letter == [MARY]
        palette.includes(ROBIN)
    },
})

feature("the contact record of a directory party, with its books and groups, and each tab (#tab)", {
    where: [
        { tab: "overview", partyId: "ORG_ACME_BA", texts: ["Bob Acme", "bob.acme@test.com", "Books and groups", "Team Contacts", "Customers", "Merge with…"] },
        { tab: "activity", partyId: "ORG_ACME_BA", texts: ["m-chatter", 'default-tab="message"'] },
        { tab: "calendar", partyId: "EX_JOHN_DOE", texts: ["Calendar setup review"] },
        { tab: "tasks", partyId: "EX_JOHN_DOE", texts: ["Review the open support requests"] },
        { tab: "requests", partyId: "ORG_ACME_BA", texts: ["Set up the shared team calendar", "Customer"] },
        { tab: "files", partyId: "ORG_ACME_BA", texts: ["m-record-files"] },
        { tab: "consent", partyId: "ORG_ACME_BA", texts: ["History and export in Comms Consent", "/qapps/Comms/Consent/Contact?partyId=ORG_ACME_BA",
            "Addresses and numbers", "Record consent"] },
    ],
    expect({ tab, partyId, texts }) {
        const shown = detail(partyId, { tab })
        shown.status == 200
        shown.errors == ""
        !shown.broken
        texts.filter((text) => !shown.output.includes(text)) == []
        !shown.output.includes("Private ·")
    },
})

feature("a personal contact shows the Private banner with its book; an employee shows the read-only directory card", {
    when() {
        return { mary: detail(MARY), joe: detail("ORG_ZIZI_JD") }
    },
    then({ mary, joe }) {
        mary.errors == ""
        mary.output.includes("Private · in My Contacts")
        mary.output.includes("mary.doe@example.com")
        mary.output.includes("1956-04-12")
        mary.output.includes("Link to a directory party")
        mary.output.includes("Family")
        mary.output.includes("Prefers a call to an email.")
        joe.errors == ""
        joe.output.includes("Directory card")
        joe.output.includes("Ziziwork Services")
        joe.output.includes("Manager: Bob Developer")
        joe.output.includes("Read only here: the employee record is in People.")
        // the chatter column beside the overview on the full screen
        joe.output.includes('id="ContactChatter"')
    },
})

feature("another user's personal contact is never available to john.doe: the record, its transitions, the palette, compare and duplicates", {
    when() {
        const record = detail(SAM)
        const inSplit = list({ scope: "all", text: "Sam" })
        // a write is refused by the one check of the contact (contactInfoStore, contactFavorite and the rest alike)
        const update = post("Contacts/ContactDetail/contactUpdate", { partyId: SAM, firstName: "Stolen" })
        const exported = post("Contacts/ContactDetail/contactExport", { partyId: SAM, format: "vcard" })
        const bulk = post("Contacts/List/bulkExport", { selectedPartyIds: `${SAM},${MARY}`, format: "vcard" })
        const peopleRows = (json) => ((json.groups || []).find((group) => group.group === "People") || { rows: [] }).rows.map((row) => String(row.url))
        const people = peopleRows(shellJson("shellSearch", { text: "Secret", groups: "People", limit: "20" }))
        const peopleByEmail = peopleRows(shellJson("shellSearch", { text: "pat.quinn@quinnco.example", groups: "People", limit: "20" }))
        const compare = render("apps/Commons/Contacts/Compare", { partyId: SAM, otherPartyId: PAT })
        const duplicates = render("apps/Commons/Contacts/Duplicates", {})
        return { record, inSplit, update, exported, bulk, people, peopleByEmail, compare, duplicates,
            sam: one("mantle.party.Person", { partyId: SAM }), samEmails: current("mantle.party.contact.PartyContactMechInfo", { partyId: SAM }).length,
            samInJohnsBook: current("mantle.party.contact.ContactBookParty", { partyId: SAM, contactBookId: "BOSS_DEMO_BOOK_JD" }).length }
    },
    then({ record, inSplit, update, exported, bulk, people, peopleByEmail, compare, duplicates, sam, samEmails, samInJohnsBook }) {
        record.status == 200
        record.output.includes("is not available")
        !record.output.includes("Sam Secret")
        !rowsOf(inSplit.output).includes(SAM)
        update.errors.includes("Contact BOSS_DEMO_PC_SAM not found")
        !exported.output.includes("BEGIN:VCARD")
        bulk.output.includes("Mary")
        !bulk.output.includes("Secret")
        people.length == 0
        peopleByEmail.filter((url) => url.includes(SAM)) == []
        peopleByEmail.filter((url) => url.includes(PAT)).length == 1
        compare.output.includes("not found")
        !compare.output.includes("Sam Secret")
        !duplicates.output.includes("Sam Secret")
        !duplicates.output.includes(SAM)
        sam.firstName == "Sam"
        samEmails == 2
        samInJohnsBook == 0
    },
})

feature("as Joe Developer: his own personal contact shows, john.doe's never do, and a directory party is read only", {
    when() {
        return as("joe.developer", () => {
            const all = rowsOf(list({ scope: "all" }).output)
            const sam = detail(SAM)
            const mary = detail(MARY)
            const people = ((shellJson("shellSearch", { text: "Mary", groups: "People", limit: "20" }).groups || []).find((group) => group.group === "People")
                    || { rows: [] }).rows.map((row) => String(row.url))
            const bob = detail("ORG_ACME_BA")
            const edit = post("Contacts/ContactDetail/contactUpdate", { partyId: "ORG_ACME_BA", firstName: "Robert" })
            const duplicates = render("apps/Commons/Contacts/Duplicates", {})
            return { all, sam, mary, people, bob, edit, duplicates }
        })
    },
    then({ all, sam, mary, people, bob, edit, duplicates }) {
        all.includes(SAM)
        !all.includes(MARY)
        !all.includes(ROBIN)
        !all.includes(TOM)
        sam.output.includes("Sam Secret")
        sam.output.includes("Private · in My Contacts")
        mary.output.includes("is not available")
        people.filter((url) => url.includes(MARY)) == []
        bob.output.includes("Bob Acme")
        !bob.output.includes("ContactEditDialog")
        edit.errors.includes("You may not change contact ORG_ACME_BA")
        duplicates.output.includes("Only contact admins review duplicates")
        one("mantle.party.Person", { partyId: "ORG_ACME_BA" }).firstName == "Bob"
    },
})

feature("john.doe edits his personal contact Mary: an email with a purpose, a changed phone, names, a note, an organization and a relationship", {
    when() {
        const addEmail = post("Contacts/ContactDetail/contactInfoStore", { partyId: MARY, kind: "email", emailAddress: "mary.home@example.com", emailPurposeId: "EmailOther" })
        const changePhone = post("Contacts/ContactDetail/contactInfoStore", { partyId: MARY, kind: "phone", contactMechId: "BOSS_DEMO_PC_MARY_TN",
            contactMechPurposeId: "PhoneMobile", phone: "+1 555 010 0162" })
        const addPurpose = post("Contacts/ContactDetail/contactInfoPurpose", { partyId: MARY, contactMechId: "BOSS_DEMO_PC_MARY_EM", contactMechPurposeId: "EmailBilling" })
        const removePurpose = post("Contacts/ContactDetail/contactInfoPurpose", { partyId: MARY, contactMechId: "BOSS_DEMO_PC_MARY_EM",
            contactMechPurposeId: "EmailBilling", remove: "true" })
        const names = post("Contacts/List/contactUpdate", { partyId: MARY, nickname: "Mom", comments: "Call on Sundays after lunch." })
        const note = post("Contacts/ContactDetail/contactNote", { partyId: MARY, noteText: "Birthday dinner at the Elm Street place." })
        const org = post("Contacts/ContactDetail/contactOrganization", { partyId: MARY, organizationPartyId: PIPES, jobTitle: "Bookkeeper" })
        const rel = post("Contacts/ContactDetail/contactRelationshipAdd", { partyId: MARY, otherPartyId: ROBIN, relationshipTypeEnumId: "PrtFriend", direction: "to" })
        // a directory party may not be related to a personal contact
        const badRel = post("Contacts/ContactDetail/contactRelationshipAdd", { partyId: "ORG_ACME_BA", otherPartyId: MARY, relationshipTypeEnumId: "PrtFriend", direction: "to" })
        const shown = detail(MARY)
        const expired = detail(MARY, { showExpired: "Y" })
        const infos = current("mantle.party.contact.PartyContactMechInfo", { partyId: MARY })
        const phones = current("mantle.party.contact.PartyContactMechTelecomNumber", { partyId: MARY })
        return { addEmail, changePhone, addPurpose, removePurpose, names, note, org, rel, badRel, shown, expired, infos, phones,
            person: one("mantle.party.Person", { partyId: MARY }), party: one("mantle.party.Party", { partyId: MARY }),
            relRows: current("mantle.party.PartyRelationship", { fromPartyId: MARY, toPartyId: ROBIN, relationshipTypeEnumId: "PrtFriend" }),
            orgRows: current("mantle.party.PartyRelationship", { fromPartyId: MARY, toPartyId: PIPES, relationshipTypeEnumId: "PrtContact" }) }
    },
    then({ addEmail, changePhone, addPurpose, removePurpose, names, note, org, rel, badRel, shown, expired, infos, phones, person, party, relRows, orgRows }) {
        addEmail.errors == ""
        changePhone.errors == ""
        addPurpose.errors == ""
        removePurpose.errors == ""
        names.errors == ""
        note.errors == ""
        org.errors == ""
        rel.errors == ""
        badRel.errors.includes("cannot be related to one of your personal contacts")
        infos.some((info) => info.infoString === "mary.home@example.com" && info.contactMechPurposeId === "EmailOther")
        !infos.some((info) => info.contactMechId === "BOSS_DEMO_PC_MARY_EM" && info.contactMechPurposeId === "EmailBilling")
        phones.length == 1
        phones[0].contactNumber == "010-0162"
        phones[0].contactMechPurposeId == "PhoneMobile"
        person.nickname == "Mom"
        party.comments == "Call on Sundays after lunch."
        relRows.length == 1
        orgRows.length == 1
        orgRows[0].relationshipName == "Bookkeeper"
        shown.output.includes("mary.home@example.com")
        shown.output.includes("Birthday dinner at the Elm Street place.")
        shown.output.includes("Bookkeeper · Pipes and Sons")
        shown.output.includes("Friend of Robin Fischer")
        expired.output.includes("Hide expired")
        expired.output.includes("+1 555 010-0161")
    },
})

feature("the contact info shows each kind's primary first, as Mantle's get#PartyContactInfo has it, with a phone of the primary address; never to another user", {
    when() {
        const ID = "BOSS_TEST_PRIMARY"
        sys(() => {
            if (!one("mantle.party.Party", { partyId: ID })) {
                const create = (entityName, fields) => call("create#" + entityName, fields)
                create("mantle.party.Party", { partyId: ID, pseudoId: ID, partyTypeEnumId: "PtyPerson", privateOwnerUserId: "EX_JOHN_DOE", disabled: "N" })
                create("mantle.party.Person", { partyId: ID, firstName: "Prim", lastName: "Ary" })
                const mech = (id, type, info) => create("mantle.party.contact.ContactMech", { contactMechId: id, contactMechTypeEnumId: type, infoString: info || null })
                const pcm = (id, purpose, fromDate) => create("mantle.party.contact.PartyContactMech", { partyId: ID, contactMechId: id,
                    contactMechPurposeId: purpose, fromDate })
                // the other email first, the primary one after it
                mech("BOSS_TEST_PRIM_EM2", "CmtEmailAddress", "prim.other@example.com")
                pcm("BOSS_TEST_PRIM_EM2", "EmailOther", "2026-10-01 09:00:00")
                mech("BOSS_TEST_PRIM_EM1", "CmtEmailAddress", "prim.main@example.com")
                pcm("BOSS_TEST_PRIM_EM1", "EmailPrimary", "2026-10-02 09:00:00")
                // a phone only through the primary address
                mech("BOSS_TEST_PRIM_TN", "CmtTelecomNumber")
                create("mantle.party.contact.TelecomNumber", { contactMechId: "BOSS_TEST_PRIM_TN", countryCode: "1", areaCode: "555", contactNumber: "010-0199" })
                mech("BOSS_TEST_PRIM_PA2", "CmtPostalAddress")
                create("mantle.party.contact.PostalAddress", { contactMechId: "BOSS_TEST_PRIM_PA2", address1: "9 Side Road", city: "Springfield", countryGeoId: "USA" })
                pcm("BOSS_TEST_PRIM_PA2", "PostalHome", "2026-10-01 09:00:00")
                mech("BOSS_TEST_PRIM_PA1", "CmtPostalAddress")
                create("mantle.party.contact.PostalAddress", { contactMechId: "BOSS_TEST_PRIM_PA1", address1: "1 Main Street", city: "Springfield", countryGeoId: "USA",
                    telecomContactMechId: "BOSS_TEST_PRIM_TN" })
                pcm("BOSS_TEST_PRIM_PA1", "PostalPrimary", "2026-10-02 09:00:00")
            }
        })
        // the service as the screen calls it (its explicit personal-contact condition holds with authorization off too), and the screen
        const rec = sys(() => call("ironstone.commons.ContactServices.get#ContactRecord", { partyId: ID }))
        const shown = detail(ID)
        const joe = as("joe.developer", () => ({ rec: sys(() => call("ironstone.commons.ContactServices.get#ContactRecord", { partyId: ID })), shown: detail(ID) }))
        return { rec, shown, joe }
    },
    then({ rec, shown, joe }) {
        rec.found
        rec.contactMechList.filter((mech) => mech.kind === "email").map((mech) => mech.value) == ["prim.main@example.com", "prim.other@example.com"]
        rec.contactMechList.find((mech) => mech.value === "prim.main@example.com").isPrimary
        !rec.contactMechList.find((mech) => mech.value === "prim.other@example.com").isPrimary
        rec.contactMechList.find((mech) => mech.kind === "phone").value == "+1 555 010-0199"
        rec.contactMechList.find((mech) => mech.kind === "phone").isPrimary
        rec.contactMechList.find((mech) => mech.kind === "phone").readOnly
        rec.contactMechList.find((mech) => mech.kind === "phone").purposeText == "Of the primary address"
        rec.addressList.map((address) => address.address1) == ["1 Main Street", "9 Side Road"]
        rec.addressList[0].isPrimary
        rec.record.primaryEmail == "prim.main@example.com"
        shown.status == 200
        !shown.broken
        shown.output.indexOf("prim.main@example.com") < shown.output.indexOf("prim.other@example.com")
        shown.output.indexOf("1 Main Street") < shown.output.indexOf("9 Side Road")
        shown.output.includes("text-weight-medium")
        shown.output.includes("+1 555 010-0199")
        !joe.rec.found
        joe.rec.contactMechList == null
        joe.shown.output.includes("is not available")
        !joe.shown.output.includes("prim.main@example.com")
    },
})

feature("john.doe as a contact admin edits a directory party; the star of his default book", {
    when() {
        const add = post("Contacts/ContactDetail/contactInfoStore", { partyId: PAT, kind: "web", webAddress: "quinnco.example", webPurposeId: "WebUrlPrimary" })
        const unstar = post("Contacts/ContactDetail/contactFavorite", { partyId: MARY, contactBookId: "BOSS_DEMO_BOOK_JD", isFavorite: "N" })
        const star = post("Contacts/ContactDetail/contactFavorite", { partyId: PAT, contactBookId: "BOSS_DEMO_BOOK_JD", isFavorite: "Y" })
        return { add, unstar, star, web: current("mantle.party.contact.PartyContactMechInfo", { partyId: PAT, contactMechTypeEnumId: "CmtWebAddress" }),
            mary: current("mantle.party.contact.ContactBookParty", { partyId: MARY, contactBookId: "BOSS_DEMO_BOOK_JD" })[0],
            pat: current("mantle.party.contact.ContactBookParty", { partyId: PAT, contactBookId: "BOSS_DEMO_BOOK_JD" })[0] }
    },
    then({ add, unstar, star, web, mary, pat }) {
        add.errors == ""
        web.length == 1
        web[0].infoString == "https://quinnco.example"
        unstar.errors == ""
        star.errors == ""
        mary.isFavorite == "N"
        pat.isFavorite == "Y"
    },
})

feature("bulk actions: add to a group and a book (a personal contact stays out of a shared book), remove from the book", {
    when() {
        const toGroup = post("Contacts/List/bulkAddToGroup", { selectedPartyIds: `${TOM},${PIPES}`, contactBookGroupId: "BOSS_DEMO_GRP_FRIENDS" })
        const toBook = post("Contacts/List/bulkAddToBook", { selectedPartyIds: `ORG_ACME_SA,${TOM}`, contactBookId: "BOSS_DEMO_BOOK_TEAM" })
        const sheldonIn = current("mantle.party.contact.ContactBookParty", { partyId: "ORG_ACME_SA", contactBookId: "BOSS_DEMO_BOOK_TEAM" }).length
        const removed = post("Contacts/List/bulkRemoveFromBook", { selectedPartyIds: "ORG_ACME_SA", contactBookId: "BOSS_DEMO_BOOK_TEAM" })
        const nothing = post("Contacts/List/bulkAddToBook", { selectedPartyIds: "", contactBookId: "BOSS_DEMO_BOOK_TEAM" })
        return { toGroup, toBook, sheldonIn, removed, nothing,
            friends: sys(() => Array.from(ec.entity.find("mantle.party.contact.ContactBookGroupParty").condition("contactBookGroupId", "BOSS_DEMO_GRP_FRIENDS").list())).map((row) => row.partyId),
            tomInTeam: current("mantle.party.contact.ContactBookParty", { partyId: TOM, contactBookId: "BOSS_DEMO_BOOK_TEAM" }).length,
            sheldonAfter: current("mantle.party.contact.ContactBookParty", { partyId: "ORG_ACME_SA", contactBookId: "BOSS_DEMO_BOOK_TEAM" }).length,
            ungrouped: rowsOf(list({ scope: "ungrouped" }).output) }
    },
    then({ toGroup, toBook, sheldonIn, removed, nothing, friends, tomInTeam, sheldonAfter, ungrouped }) {
        toGroup.errors == ""
        friends.includes(TOM)
        friends.includes(PIPES)
        toBook.errors == ""
        sheldonIn == 1
        tomInTeam == 0
        removed.errors == ""
        sheldonAfter == 0
        nothing.errors.includes("Select one or more contacts first")
        !ungrouped.includes(TOM)
    },
})

feature("export vCard and CSV of the selected contacts, and a contact's vCard", {
    when() {
        const vcard = post("Contacts/List/bulkExport", { selectedPartyIds: `${MARY},${ROBIN}`, format: "vcard" })
        const csv = post("Contacts/List/bulkExport", { selectedPartyIds: `${MARY},${ROBIN},ORG_ACME_BA`, format: "csv" })
        const single = post("Contacts/ContactDetail/contactExport", { partyId: MARY, format: "vcard" })
        return { vcard, csv, single }
    },
    then({ vcard, csv, single }) {
        vcard.status == 200
        vcard.output.split("BEGIN:VCARD").length == 3
        vcard.output.includes("FN:Mary Doe")
        vcard.output.includes("robin.fischer@example.org")
        csv.output.startsWith("First Name,")
        csv.output.includes("Mary,")
        csv.output.includes("bob.acme@test.com")
        csv.output.split("\r\n").filter((line) => line).length == 4
        single.output.includes("FN:Mary Doe")
        single.output.split("BEGIN:VCARD").length == 2
    },
})

feature("merge two from the list goes to the compare; it takes exactly two", {
    when() {
        const three = post("Contacts/List/bulkMerge", { selectedPartyIds: `${PAT},${PATRICIA},${MARY}` })
        const two = post("Contacts/List/bulkMerge", { selectedPartyIds: `${PAT},${PATRICIA}` })
        return { three, two }
    },
    then({ three, two }) {
        three.errors.includes("Select exactly two contacts to merge")
        two.errors == ""
        // on to Contacts/Compare (a redirect here; the client follows the answer's screenUrl)
        two.status == 302
    },
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

feature("Duplicates groups the pairs by reason, runs the scan on demand, and leaves out personal contacts", {
    when() {
        const before = render("apps/Commons/Contacts/Duplicates", {})
        const scan = post("Contacts/Duplicates/runScan", {})
        const after = render("apps/Commons/Contacts/Duplicates", {})
        const byEmail = render("apps/Commons/Contacts/Duplicates", { reason: "email" })
        return { before, scan, after, byEmail }
    },
    then({ before, scan, after, byEmail }) {
        before.errors == ""
        !before.broken
        before.output.includes("Same email · ")
        before.output.includes("Same name · ")
        before.output.includes("Patricia Quinn")
        before.output.includes("Quinn Consulting LLC")
        // the names as alike as Mantle scores them
        before.output.includes("names 100% alike")
        !before.output.includes("Sam Secret")
        scan.errors == ""
        after.output.includes("Patricia Quinn")
        !after.output.includes("Sam Secret")
        byEmail.output.includes("Patricia Quinn")
        !byEmail.output.includes("Quinn Consulting LLC")
    },
})

feature("Compare shows both side by side with the field choice; Merge keeps Pat Quinn with Patricia's first name and her address", {
    when() {
        const compare = render("apps/Commons/Contacts/Compare", { partyId: PAT, otherPartyId: PATRICIA, returnTo: "duplicates" })
        const merged = post("Contacts/Compare/mergeContacts", { partyId: PAT, otherPartyId: PATRICIA, returnTo: "duplicates", keepPartyId: PAT,
            pick_firstName: "right" })
        const after = render("apps/Commons/Contacts/Duplicates", {})
        return { compare, merged, after, pat: one("mantle.party.PartyDetail", { partyId: PAT }), patricia: one("mantle.party.Party", { partyId: PATRICIA }),
            patAddresses: current("mantle.party.contact.PartyContactMechPostalAddress", { partyId: PAT }) }
    },
    then({ compare, merged, after, pat, patricia, patAddresses }) {
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
        !after.output.includes(PATRICIA)
    },
})

feature("Not a duplicate keeps a pair out of the list (Mantle's PartyNotDuplicate), and the scan leaves it out", {
    when() {
        const marked = post("Contacts/Duplicates/notDuplicate", { partyId: QUINN_ORG, otherPartyId: QUINN_LLC })
        const after = render("apps/Commons/Contacts/Duplicates", {})
        const scan = post("Contacts/Duplicates/runScan", {})
        return { marked, after, scan, again: render("apps/Commons/Contacts/Duplicates", {}),
            decision: one("mantle.party.PartyNotDuplicate", { partyId: QUINN_ORG, otherPartyId: QUINN_LLC }) }
    },
    then({ marked, after, scan, again, decision }) {
        marked.errors == ""
        decision.decidedByUserId == "EX_JOHN_DOE"
        !after.output.includes("Quinn Consulting LLC")
        scan.errors == ""
        !again.output.includes("Quinn Consulting LLC")
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

feature("New contact from Contacts (quick create with openAfter) makes a personal contact and opens it; Link to a directory party shares it", {
    when() {
        const made = post("QuickCreate/createContact", { partyTypeEnumId: "PtyPerson", contactName: "Lena Link", emailAddress: "lena@link.example",
            contactBookId: "BOSS_DEMO_BOOK_JD", openAfter: "Y" })
        const partyId = made.json.partyId
        const before = one("mantle.party.Party", { partyId })
        const joeBefore = as("joe.developer", () => detail(partyId).output.includes("is not available"))
        const linked = post("Contacts/ContactDetail/contactLink", { partyId })
        const after = one("mantle.party.Party", { partyId })
        const joeAfter = as("joe.developer", () => detail(partyId).output.includes("Lena Link"))
        const notMine = post("Contacts/ContactDetail/contactLink", { partyId: "ORG_ACME_BA" })
        return { made, partyId, before, joeBefore, linked, after, joeAfter, notMine,
            role: one("mantle.party.PartyRole", { partyId, roleTypeId: "Contact" }) }
    },
    then({ made, partyId, before, joeBefore, linked, after, joeAfter, notMine, role }) {
        made.errors == ""
        made.json.screenUrl == `/qapps/Commons/Contacts?partyId=${partyId}`
        before.privateOwnerUserId == "EX_JOHN_DOE"
        joeBefore
        linked.errors == ""
        after.privateOwnerUserId == null
        role != null
        joeAfter
        notMine.errors.includes("Only your own personal contact can be linked to the directory")
    },
})

feature("a photo for a contact: an image is its face image, shown as the avatar, a new one takes its place and Remove takes it away; another file and another user are refused", {
    when() {
        const png = "\u0089PNG fake image bytes for the spec"
        const faces = (partyId) => sys(() => Array.from(ec.entity.find("mantle.party.PartyContent").condition("partyId", partyId)
                .condition("partyContentTypeEnumId", "PcntFaceImage").list()))
        const avatar = (partyId) => ec.screen.makeTest().rootScreen(commons).render("Contacts/ContactDetail/contactAvatar", { partyId }, null).status
        const before = detail(MARY).output
        const uploaded = post("Contacts/ContactDetail/contactAvatarUpload", { partyId: ROBIN, contentFile: uploadedFile("robin.png", png, "image/png") })
        const firstId = (faces(ROBIN)[0] || {}).partyContentId
        const changed = post("Contacts/ContactDetail/contactAvatarUpload", { partyId: ROBIN, contentFile: uploadedFile("robin-new.jpg", png, "image/jpeg") })
        const after = faces(ROBIN)
        // the file is served inline by its name: only an image's name and type
        const svg = post("Contacts/ContactDetail/contactAvatarUpload", { partyId: ROBIN, contentFile: uploadedFile("robin.svg", "<svg/>", "image/svg+xml") })
        const page = post("Contacts/ContactDetail/contactAvatarUpload", { partyId: ROBIN, contentFile: uploadedFile("robin.html", png, "image/png") })
        const imageStatus = avatar(ROBIN), noImageStatus = avatar(MARY), hiddenStatus = avatar(SAM)
        ec.message.clearErrors()
        const shown = detail(ROBIN)
        const row = list({ scope: "mine" }).output
        // Joe Developer: john.doe's personal contact is not found, a directory party is not his to change, and no photo dialog for it
        const joe = as("joe.developer", () => ({ robin: post("Contacts/ContactDetail/contactAvatarUpload", { partyId: ROBIN, contentFile: uploadedFile("x.png", png, "image/png") }),
            bob: post("Contacts/ContactDetail/contactAvatarUpload", { partyId: "ORG_ACME_BA", contentFile: uploadedFile("x.png", png, "image/png") }), bobPage: detail("ORG_ACME_BA").output }))
        const kept = faces(ROBIN).length
        const removed = post("Contacts/ContactDetail/contactAvatarRemove", { partyId: ROBIN })
        return { before, uploaded, firstId, changed, after, svg, page, imageStatus, noImageStatus, hiddenStatus, shown, row, joe, kept, removed,
            gone: faces(ROBIN).length, goneStatus: avatar(ROBIN), afterRemove: detail(ROBIN).output }
    },
    then({ before, uploaded, firstId, changed, after, svg, page, imageStatus, noImageStatus, hiddenStatus, shown, row, joe, kept, removed, gone, goneStatus, afterRemove }) {
        // no photo yet: the More menu offers to add one
        before.includes('id="ContactPhotoDialog"')
        before.includes("Add a photo")
        uploaded.errors == ""
        firstId != null
        changed.errors == ""
        after.length == 1
        after[0].partyContentId != firstId
        after[0].description == "robin-new.jpg"
        svg.errors.includes("Choose an image file")
        page.errors.includes("Choose an image file")
        imageStatus == 200
        noImageStatus == 404
        hiddenStatus == 404
        shown.output.includes("contactAvatar?partyId=BOSS_DEMO_PC_ROBIN")
        shown.output.includes("Change photo")
        shown.output.includes("contactAvatarRemove")
        row.includes("contactAvatar?partyId=BOSS_DEMO_PC_ROBIN")
        joe.robin.errors.includes("not found")
        joe.bob.errors.includes("You may not change contact ORG_ACME_BA")
        !joe.bobPage.includes('id="ContactPhotoDialog"')
        kept == 1
        removed.errors == ""
        gone == 0
        goneStatus == 404
        !afterRemove.includes("contactAvatar?partyId=BOSS_DEMO_PC_ROBIN")
        afterRemove.includes("Add a photo")
    },
})

feature("delete: john.doe's personal contact goes; a directory party with history is disabled; his own party and another user's contact stay", {
    when() {
        const self = post("Contacts/List/bulkDelete", { selectedPartyIds: "EX_JOHN_DOE" })
        const deleted = post("Contacts/List/bulkDelete", { selectedPartyIds: `${TOM},${SAM}` })
        // Pat Quinn has john.doe's email of the Contacts demo: kept, disabled (mantle.party.ContactBookServices.delete#Contact)
        const directory = post("Contacts/List/bulkDelete", { selectedPartyIds: PAT })
        const mine = rowsOf(list({ scope: "mine" }).output)
        return { self, deleted, directory, mine, tom: one("mantle.party.Party", { partyId: TOM }), sam: one("mantle.party.Party", { partyId: SAM }),
            pat: one("mantle.party.Party", { partyId: PAT }), john: one("mantle.party.Party", { partyId: "EX_JOHN_DOE" }),
            tomBooks: current("mantle.party.contact.ContactBookParty", { partyId: TOM }).length,
            patBooks: current("mantle.party.contact.ContactBookParty", { partyId: PAT }).length }
    },
    then({ self, deleted, directory, mine, tom, sam, pat, john, tomBooks, patBooks }) {
        self.errors == ""
        john.disabled != "Y"
        deleted.errors == ""
        // nothing refers to Tom: removed
        tom == null
        tomBooks == 0
        sam.disabled != "Y"
        !mine.includes(TOM)
        directory.errors == ""
        pat.disabled == "Y"
        patBooks == 0
    },
})

// Print (design §18 Print documents, html-print): the record's Print is a printed contact card, the list's a contact sheet of the
// find; another user's personal contact prints as not available.
function printed(path, parameters) {
    const str = ec.screen.makeTest().rootScreen(webroot).renderMode("html-print").render(path, parameters || {}, null)
    const output = String(str.output || "")
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), output }
}
feature("Print: Mary Doe's contact card and the contact sheet of the find; another user's personal contact is not printed", {
    when() {
        return { card: printed("apps/Commons/Contacts/ContactDetail", { partyId: "BOSS_DEMO_PC_MARY" }),
            sheet: printed("apps/Commons/Contacts/List", { find: "Y", scope: "all", text: "Bob" }),
            record: render("apps/Commons/Contacts/ContactDetail", { partyId: "BOSS_DEMO_PC_MARY" }),
            list: render("apps/Commons/Contacts/List", { find: "Y", scope: "all" }),
            stranger: as("joe.developer", () => printed("apps/Commons/Contacts/ContactDetail", { partyId: "BOSS_DEMO_PC_MARY" })) }
    },
    then({ card, sheet, record, list, stranger }) {
        card.status == 200
        card.errors == ""
        card.output.includes("Mary Doe")
        card.output.includes("mary.doe@example.com")
        card.output.includes("12 Elm Street<br>Springfield, IL 62701")
        card.output.includes("Prefers a call to an email.")
        card.output.includes("My Contacts · Family")
        // a printed card has no actions
        !card.output.includes("contactFavorite")
        sheet.status == 200
        sheet.output.includes("Bob Developer")
        sheet.output.includes("bob.developer@test.com")
        sheet.output.includes("Ziziwork Services")
        !sheet.output.includes("Mary Doe")
        record.output.includes("renderMode=html-print&amp;partyId=BOSS_DEMO_PC_MARY")
        list.output.includes("/apps/Commons/Contacts/List?renderMode=html-print&amp;find=Y&amp;scope=all")
        !stranger.output.includes("mary.doe@example.com")
        stranger.output.includes("This contact is not available")
    },
})
