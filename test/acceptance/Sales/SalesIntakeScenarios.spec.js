// Sales P5's "usable when" (impl-sales P5; design-sales §14.3 scenario 13, its mail and voicemail parts): mail to Retail's intake
// mailbox at sales+leads@ (the demo's rule, createLead by plus tag) makes one lead in East's queue with East's source, and the same
// message delivered again makes none; a voicemail's Create lead makes one lead with the caller's number as submitted, and again
// none; a phone's address book shows sales.rep's account contacts as My accounts, read only, and not another organization's. The
// rules are Mantle's SalesLeadIntake and ProjectedAddressBook and the BOSS SalesIntake.
// Run: ./moq accept mr-boss --spec SalesIntakeScenarios
const lib = ec.resource.script("component://mr-boss/test/Sales/SalesSpecLib.js")
const {ids, users, asUser, system} = lib
const {contacts} = ids
const stamp = String(Date.now()).slice(-6)
const OPPORTUNITY = "mantle.sales.opportunity.SalesOpportunity"
const INTAKE = "mantle.sales.opportunity.SalesLeadIntake"

const intakesOf = (sourceKindEnumId, sourceId) =>
    system(() => Array.from(ec.entity.find(INTAKE).condition({sourceKindEnumId, sourceId}).list()))
const partiesOf = (salesOpportunityId, roleTypeId) =>
    system(() =>
        Array.from(
            ec.entity.find("mantle.sales.opportunity.SalesOpportunityParty").condition({salesOpportunityId, roleTypeId}).list()
        ).map(row => row.partyId)
    )
function mail(emailMessageId) {
    system(() =>
        call("store#moqui.basic.email.EmailMessage", {
            emailMessageId,
            emailAccountId: "BOSS_SAL_INTAKE_MAIL",
            statusId: "ES_RECEIVED",
            contentType: "text/plain",
            receivedDate: ec.user.nowTimestamp,
            messageDate: ec.user.nowTimestamp,
            isRead: "N",
            hasAttachment: "N",
            fromAddress: "avery." + stamp + "@prospect.example",
            fromName: "Avery Prospect",
            toAddresses: "Retail sales <sales+leads@retail.example>",
            subject: "Quote for display cases " + stamp,
            bodyText: "We would like display cases for two stores.",
            messageId: "<scenario13-" + stamp + "@prospect.example>",
            rootEmailMessageId: emailMessageId
        })
    )
}
// the account's rules on the messages, as the mail sync runs them when it stores them
const runRules = emailMessageIdList =>
    system(() =>
        call("org.moqui.mail.EmailClientServices.run#EmailRules", {emailAccountId: "BOSS_SAL_INTAKE_MAIL", emailMessageIdList})
    )

spec({
    setupSpec() {
        login("john.doe")
    }
})

feature(
    "scenario 13: mail to the leads address makes one lead in East's queue with its source; the same message again makes none",
    {
        when() {
            const first = "BOSS_SAL_S13_A_" + stamp
            const second = "BOSS_SAL_S13_B_" + stamp
            mail(first)
            runRules([first])
            // the same mail delivered again (another copy of its Message-ID), and the rules run again on the first
            mail(second)
            runRules([second])
            runRules([first])
            const intakes = intakesOf("SlisEmailMessage", "mid:scenario13-" + stamp + "@prospect.example")
            const leadId = intakes[0]?.salesOpportunityId
            const lead = system(() =>
                ec.entity
                    .find(OPPORTUNITY)
                    .condition("salesOpportunityId", leadId || "-")
                    .one()
            )
            const repLeads = asUser(users.rep, () =>
                Array.from(
                    ec.service
                        .sync()
                        .name("mantle.sales.OpportunityServices.find#Opportunities")
                        .parameters({typeEnumId: "SotLead", text: "display cases " + stamp})
                        .call().opportunityList || []
                ).map(row => row.salesOpportunityId)
            )
            return {intakes, lead, leadId, teams: partiesOf(leadId || "-", "SalesTeam"), repLeads}
        },
        then(r) {
            r.intakes.length == 1
            r.lead.typeEnumId == "SotLead"
            r.lead.dataSourceId == "BOSS_SAL_SRC_WEB"
            r.teams.includes("BOSS_SAL_TEAM_EAST")
            r.repLeads.length == 1
            r.repLeads[0] == r.leadId
        }
    }
)

feature("scenario 13: a voicemail's Create lead makes one lead with the caller's number, and again none", {
    when() {
        const voicemailId = "BOSS_SAL_S13_VM_" + stamp
        system(() => {
            if (!ec.entity.find("moqui.call.VoicemailBox").condition("userId", "BOSS_SAL_REP").one())
                call("create#moqui.call.VoicemailBox", {voicemailBoxId: "BOSS_SAL_S13_BOX", userId: "BOSS_SAL_REP"})
            const box = ec.entity.find("moqui.call.VoicemailBox").condition("userId", "BOSS_SAL_REP").one()
            call("create#moqui.call.Voicemail", {
                voicemailId,
                voicemailBoxId: box.voicemailBoxId,
                fromNumber: "+15550199" + stamp.slice(-2),
                fromName: "Caller " + stamp,
                receivedDate: ec.user.nowTimestamp,
                durationMs: 42000,
                folder: "inbox"
            })
        })
        const post = () =>
            asUser(users.rep, () => {
                const result = ec.screen
                    .makeTest()
                    .rootScreen("component://mr-boss/screen/Comms.xml")
                    .render("Calls/Voicemail/createLead", {voicemailId}, "post")
                ec.message.clearErrors()
                try {
                    return JSON.parse(String(result.output || "{}"))
                } catch (error) {
                    return {}
                }
            })
        const made = post()
        const again = post()
        const intakes = intakesOf("SlisVoicemail", voicemailId)
        return {made, again, intakes}
    },
    then(r) {
        r.made.recordId != null
        r.again.recordId == r.made.recordId
        r.intakes.length == 1
        r.intakes[0].submittedPhone.startsWith("+1555")
    }
})

feature("scenario 13: a phone's address book shows the rep's account contacts as My accounts, read only", {
    when() {
        const dav = (username, service, parameters) =>
            asUser(username, () =>
                system(
                    () =>
                        ec.service
                            .sync()
                            .name(service)
                            .parameters(parameters || {})
                            .call() || {}
                )
            )
        const collection = Array.from(
            dav(users.rep, "mantle.party.ContactDavServices.get#DavCollections").collectionList || []
        ).find(row => row.collectionId === "projected-SalesMyAccounts")
        const names = Array.from(
            dav(users.rep, "mantle.party.ContactDavServices.get#DavObjects", {collectionId: "projected-SalesMyAccounts"})
                .objectList || []
        ).map(row => row.name)
        const put = dav(users.rep, "mantle.party.ContactDavServices.put#DavObject", {
            collectionId: "projected-SalesMyAccounts",
            objectName: contacts.dana + ".vcf",
            data: "BEGIN:VCARD\r\nVERSION:3.0\r\nFN:Changed\r\nN:Changed;;;;\r\nEND:VCARD\r\n"
        })
        return {collection, names, put}
    },
    then(r) {
        r.collection.readOnly == true
        r.names.includes(contacts.dana + ".vcf")
        !r.names.includes(contacts.lee + ".vcf")
        r.put.status == 403
    }
})
