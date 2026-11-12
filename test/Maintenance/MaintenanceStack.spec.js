// Maintenance's stack contributions in BOSS (impl-maintenance P19; design-maintenance §1.4 Comms hooks, §12): the call context of a
// colleague (an employee or agent of Services: Kenji, the requester, maint.tech2) names only the work they reported or are assigned
// (the user's call of Nov 12, review R4), a contact of Services its open work orders and equipment under repair, each opening
// Maintenance, with no cost, and a technician's only their assigned work; Comms' record cards (info, card, search and links) of a work order, equipment
// and a facility open Maintenance, a work order not assigned to the technician is left to the other providers; the work order and
// technician instructions print's one html-print render (the work order, its team and technicians, its QR, no procedure and the
// sign-off line, no cost); Assist's Log as note and Send as message (each form's one qvt render) filing on the work order, Retail's
// planner and another technician refused, a forged record of the message form too (review R2). Mantle's rules (the
// projected calendars, a PUT refused 403, the calendar files, Report a problem from a chat message, the video call) are Mantle's
// MaintenanceStack; the skills resolve by their aliases in test/skill-retrieval.json (./moq test mr-boss --skills); the access
// cases are MaintenanceAccess's; the "usable when" is the acceptance MaintenanceStackWalk.
// Run: ./moq test mr-boss --spec MaintenanceStack
const lib = ec.resource.script("component://mr-boss/test/Maintenance/MaintenanceSpecLib.js")
const {ids, users, asUser, invoke, page} = lib
const S = "ironstone.maintenance.StackServices."
const WORK = "mantle.work.effort.WorkEffort"
// Kenji Arakawa's work phone (BossPeopleDemoData.xml), an employee of Services
const servicesCaller = "+18015550152"

spec({
    setupSpec() {
        login("john.doe")
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("the call context names a colleague's own work and a non-colleague's organization's work, with no cost (R4)", {
    when() {
        // spec-local work numbers: the requester (an agent of Services who reported the air handler's leak), maint.tech2 (assigned
        // the oil service) and a contact of Services who is no employee or agent of it
        lib.system(() => {
            const phone = (partyId, contactNumber) =>
                call("mantle.party.ContactServices.create#TelecomNumber", {
                    partyId,
                    countryCode: "1",
                    areaCode: "801",
                    contactNumber,
                    contactMechPurposeId: "PhoneWork"
                })
            phone("BOSS_MNT_REQUESTER", "777-0191")
            phone(ids.tech2PartyId, "777-0192")
            call("create#mantle.party.Party", {partyId: "MNT_STACK_SPEC_CONTACT", partyTypeEnumId: "PtyPerson"})
            call("create#mantle.party.Person", {partyId: "MNT_STACK_SPEC_CONTACT", firstName: "Vic", lastName: "Contact"})
            call("create#mantle.party.PartyRelationship", {
                relationshipTypeEnumId: "PrtContact",
                fromPartyId: "MNT_STACK_SPEC_CONTACT",
                toPartyId: ids.organizationId,
                fromDate: 0
            })
            phone("MNT_STACK_SPEC_CONTACT", "777-0193")
        })
        const context = (user, number) => asUser(user, () => invoke(S + "get#CallContext", {number}))
        return {
            kenji: context(users.planner, servicesCaller),
            requester: context(users.planner, "+18017770191"),
            tech2: context(users.planner, "+18017770192"),
            contact: context(users.planner, "+18017770193"),
            techOfContact: context(users.tech, "+18017770193")
        }
    },
    then({kenji, requester, tech2, contact, techOfContact}) {
        const has = (out, id) => out.recordList.some(row => row.url.includes("WorkOrderDetail?workEffortId=" + id))
        // Kenji, an employee who reported nothing and is assigned nothing: none of Services' work
        !has(kenji, ids.inProgressOrderId)
        !has(kenji, ids.plannedOrderId)
        // the requester: the work order of the request they filed, its equipment under repair, nothing else
        has(requester, ids.inProgressOrderId)
        !has(requester, ids.plannedOrderId)
        requester.recordList.some(
            row => row.title == "Equipment under repair: Air handler AHU-2" && row.status == "Work order " + ids.inProgressOrderId
        )
        // maint.tech2: the work assigned to them
        has(tech2, ids.plannedOrderId)
        !has(tech2, ids.inProgressOrderId)
        // a contact of Services (no colleague): the organization's open work, Maintenance links only, no cost
        has(contact, ids.inProgressOrderId)
        has(contact, ids.plannedOrderId)
        contact.contactList.length == 0
        contact.recordList.every(row => row.url.startsWith("/qapps/Maintenance/"))
        !JSON.stringify(contact).includes("$")
        !JSON.stringify(contact).toLowerCase().includes("cost")
        // a technician reads only their assigned work of it
        has(techOfContact, ids.inProgressOrderId)
        !has(techOfContact, ids.plannedOrderId)
    }
})

feature("Comms' record cards of a work order, equipment and a facility open Maintenance; unassigned work is left to others", {
    when() {
        const lookup = (user, parameters) => asUser(user, () => invoke(S + "lookup#Records", parameters))
        return {
            info: lookup(users.planner, {
                operation: "info",
                records: [
                    {recordEntityName: WORK, recordId: ids.inProgressOrderId},
                    {recordEntityName: "mantle.product.asset.Asset", recordId: ids.compressorId},
                    {recordEntityName: "mantle.facility.Facility", recordId: ids.buildingId},
                    {recordEntityName: WORK, recordId: ids.followUpTaskId}
                ]
            }).recordList,
            card: lookup(users.planner, {operation: "card", recordEntityName: WORK, recordId: ids.inProgressOrderId}).card,
            unassigned: lookup(users.tech, {operation: "card", recordEntityName: WORK, recordId: ids.plannedOrderId}).card,
            search: lookup(users.planner, {operation: "search", text: "Compressor"}).optionList,
            links: lookup(users.planner, {
                operation: "links",
                body:
                    '<p>See <a href="/qapps/Maintenance/WorkOrders/WorkOrderDetail?workEffortId=' +
                    ids.inProgressOrderId +
                    '">the leak</a> and <a href="/qapps/Maintenance/Equipment/EquipmentDetail?assetId=' +
                    ids.compressorId +
                    '">C-1</a></p>'
            }).recordList
        }
    },
    then({info, card, unassigned, search, links}) {
        info.length == 3
        info[0].url == "/qapps/Maintenance/WorkOrders/WorkOrderDetail?workEffortId=" + ids.inProgressOrderId
        info[0].typeLabel == "Work order"
        info[1].title == "Compressor C-1"
        info[2].url.includes("/qapps/Maintenance/Facilities/FacilityDetail")
        card.title == "Work order " + ids.inProgressOrderId + ": Air handler coil leak"
        card.status == "In Progress"
        unassigned == null
        search.some(option => option.value == "mantle.product.asset.Asset|" + ids.compressorId)
        search.some(option => option.value == WORK + "|" + ids.plannedOrderId)
        links.length == 2
        links[0].id == ids.inProgressOrderId
    }
})

feature("the work order and technician instructions print the work order with its QR and team, and no cost", {
    when() {
        return asUser(users.tech2, () =>
            page(
                "WorkOrders/WorkOrderDetail/Instructions",
                {workEffortId: ids.plannedOrderId, lastStandalone: "true"},
                "html-print"
            )
        )
    },
    then(rendered) {
        rendered.errors.length == 0
        rendered.output.includes("Work order " + ids.plannedOrderId + ": Compressor 500-hour oil service")
        rendered.output.includes("Compressor C-1")
        rendered.output.includes("<svg")
        rendered.output.includes("Steps")
        // the demo's oil service has no procedure (no demo work order has steps): the print says so
        rendered.output.includes("No procedure: the work is as described above.")
        rendered.output.includes("Team Facilities maintenance")
        rendered.output.includes("Completed by")
        !rendered.output.includes("$")
    }
})

feature("Assist's Log as note and Send as message file the answer on the work order, through Maintenance's record check", {
    when() {
        const record = {entityName: WORK, recordId: ids.inProgressOrderId}
        const post = (user, path, parameters) =>
            asUser(user, () => {
                const result = ec.screen
                    .makeTest()
                    .rootScreen("component://mr-boss/screen/Maintenance.xml")
                    .render(path, parameters, "post")
                const errors = Array.from(result.errorMessages || [])
                ec.message.clearErrors()
                return errors
            })
        const linked = () =>
            ec.entity
                .find("mantle.work.effort.WorkEffortCommEvent")
                .condition("workEffortId", ids.inProgressOrderId)
                .disableAuthz()
                .count()
        const before = linked()
        const noteForm = asUser(users.planner, () => page("LogNote", record))
        const messageForm = asUser(users.planner, () => page("SendMessage", record))
        const noted = post(users.planner, "LogNote/logNote", Object.assign({noteText: "Assist: the coil header leaks"}, record))
        const sent = post(
            users.planner,
            "SendMessage/sendMessage",
            Object.assign(
                {
                    toValue: "party:" + ids.techPartyId,
                    subject: "About the leak",
                    messageText: "Assist: check the coil header first",
                    messageRecordEntity: WORK,
                    messageRecordId: ids.inProgressOrderId
                },
                record
            )
        )
        // Retail's planner may not note Services' work order
        const otherNoted = post(users.retailPlanner, "LogNote/logNote", Object.assign({noteText: "Not theirs"}, record))
        // nor file a message on it by the form's hidden fields; nor maint.tech2 on work not assigned to them (review R2)
        const forged = user =>
            post(
                user,
                "SendMessage/sendMessage",
                Object.assign(
                    {
                        toValue: "party:" + ids.techPartyId,
                        subject: "Forged",
                        messageText: "Not theirs to file",
                        messageRecordEntity: WORK,
                        messageRecordId: ids.inProgressOrderId
                    },
                    record
                )
            )
        const otherSent = forged(users.retailPlanner)
        const unassignedSent = forged(users.tech2)
        return {noteForm, messageForm, noted, sent, otherNoted, otherSent, unassignedSent, added: linked() - before}
    },
    then({noteForm, messageForm, noted, sent, otherNoted, otherSent, unassignedSent, added}) {
        noteForm.errors.length == 0
        noteForm.output.includes("Log the note")
        messageForm.errors.length == 0
        messageForm.output.includes("Work order " + ids.inProgressOrderId + ": Air handler coil leak")
        noted.length == 0
        sent.length == 0
        otherNoted.join(" ").includes("not available")
        otherSent.join(" ").includes("not available")
        unassignedSent.join(" ").includes("not assigned") || unassignedSent.join(" ").includes("not available")
        added == 2
    }
})
