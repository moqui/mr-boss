// Marketing's events (impl-marketing P16; design-marketing §9 Events, EventDetail, RegistrationSetup): RegistrationSetup's one qvt render of
// Retail's demo workshop for the events manager, with all of its checks on that render (the header, its offer, readiness, the two ticket
// types priced by their products, its questions and notices, the actions by state); and through the services the events list of the
// running campaign for a reader, the event record kind, the ticket product choice, a reader kept from the setup and another organization's
// author refused. The rules are Mantle's (test/work/EventRegistrationSetup); the scenario is the acceptance MarketingEventSetupWalk.
// Run: ./moq test mr-boss --spec MarketingEvents
const lib = ec.resource.script("component://mr-boss/test/Marketing/MarketingSpecLib.js")
const {ids, users, asUser, invoke, page, system} = lib
const E = "mantle.work.EventRegistrationServices."

spec({})

feature("RegistrationSetup shows an event's offer, readiness, tickets, questions and notices to its events manager", {
    when() {
        return {setup: asUser(users.events, () => page("Events/RegistrationSetup", {workEffortId: ids.workshopEventId}))}
    },
    then({setup}) {
        setup.status == 200 && setup.errors.length == 0
        !setup.output.includes("Error rendering") && !setup.output.includes("Exception in render")
        setup.output.includes("Rose pruning workshop") && setup.output.includes("Ziziwork garden centre, Orem")
        setup.output.includes("Spring garden launch") && setup.output.includes("Published")
        // its offer: twelve seats, none taken, the waitlist on
        setup.output.includes("seats 0 / 12") && setup.output.includes("waitlist on")
        // the two ticket types, each priced by its ticket product
        setup.output.includes("Standard") &&
            setup.output.includes("$45.00") &&
            setup.output.includes("Members") &&
            setup.output.includes("$30.00")
        setup.output.includes("Readiness") && setup.output.includes("A payment gateway for the paid tickets")
        setup.output.includes("No questions: a registration asks only the attendee details.")
        setup.output.includes("No notice yet")
        // published: the page's address is the primary action, Close registration and Edit offer under More
        setup.output.includes("View page") &&
            setup.output.includes("CloseOfferDialog") &&
            setup.output.includes("EditOfferDialog")
        !setup.output.includes("PublishDialog")
    }
})

feature(
    "the events list, the record kind and choices; a reader is kept from the setup and another organization's author refused",
    {
        when() {
            const list = asUser(users.reader, () =>
                system(() => invoke(E + "find#Events", {marketingCampaignId: ids.runningCampaignId}))
            )
            const record = asUser(users.reader, () =>
                invoke("ironstone.marketing.ContextServices.check#Record", {
                    appRoot: "Marketing",
                    recordType: "event",
                    recordId: ids.workshopEventId
                })
            )
            const products = asUser(users.events, () =>
                invoke("ironstone.marketing.ContextServices.get#Choices", {
                    appRoot: "Marketing",
                    choice: "ticketProducts",
                    organizationPartyId: ids.organizationId,
                    term: "rose pruning"
                })
            )
            const readerSetup = asUser(users.reader, () =>
                page("Events/RegistrationSetup", {workEffortId: ids.workshopEventId}, "html")
            )
            const other = asUser(users.otherAuthor, () =>
                system(() => lib.refusal(E + "get#EventSetup", {workEffortId: ids.workshopEventId}))
            )
            const context = asUser(users.events, () =>
                invoke("ironstone.marketing.ContextServices.get#SharedContext", {appRoot: "Marketing"})
            )
            return {list, record, products, readerSetup, other, context}
        },
        then({list, record, products, readerSetup, other, context}) {
            list.eventList
                .map(event => event.workEffortId)
                .sort()
                .join() == [ids.webinarEventId, ids.workshopEventId].sort().join()
            list.eventList.every(event => event.campaignText == "Spring garden launch" && event.stateText == "Published")
            !list.canCreate
            record.recordId == ids.workshopEventId && record.label.includes("Rose pruning workshop")
            products.options
                .map(option => option.value)
                .sort()
                .join() == "BOSS_MKT_TICKET_MEMBER,BOSS_MKT_TICKET_STD"
            readerSetup.output.includes("is not available") && !readerSetup.output.includes("Readiness")
            other.includes("RECORD_UNAVAILABLE")
            context.capabilities.eventSetupRead && context.capabilities.eventManage
            context.sharedLinks["Events/RegistrationSetup"] == "//Marketing/Events/RegistrationSetup"
        }
    }
)
