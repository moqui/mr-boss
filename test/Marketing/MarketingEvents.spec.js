// Marketing's events (impl-marketing P16; design-marketing §9 Events, EventDetail, RegistrationSetup): RegistrationSetup's one qvt render of
// Retail's demo workshop for the events manager, with all of its checks on that render (the header, its offer, readiness, the two ticket
// types priced by their products, its questions and notices, the actions by state); and through the services the events list of the
// running campaign for a reader, the event record kind, the ticket product choice, a reader kept from the setup, another organization's
// author refused and New event's campaign link refused to an events manager who does not edit campaigns. The rules are Mantle's
// (test/work/EventRegistrationSetup); the scenario is the acceptance MarketingEventSetupWalk.
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
            // New event with a campaign by an events manager who does not edit campaigns: refused before any calendar event is made
            const campaignRefused = asUser(users.events, () => {
                const result = ec.screen
                    .makeTest()
                    .rootScreen("component://mr-boss/screen/Marketing.xml")
                    .render(
                        "Events/Events/createEvent",
                        {
                            workEffortName: "Spec refused event",
                            organizationPartyId: ids.organizationId,
                            marketingCampaignId: ids.runningCampaignId,
                            startDate: new Date(Date.now() + 10 * 86400000),
                            endDate: new Date(Date.now() + 10 * 86400000 + 3600000)
                        },
                        "post"
                    )
                const errors = Array.from(result.errorMessages || []).join(" | ")
                ec.message.clearErrors()
                return errors
            })
            const madeNone = system(
                () =>
                    ec.entity.find("mantle.work.effort.WorkEffort").condition({workEffortName: "Spec refused event"}).count() == 0
            )
            // the campaign's author links an event (CampaignDetail's Link an event): the organization's registration events, none for
            // an events manager who does not edit campaigns
            const eventChoice = user =>
                asUser(user, () =>
                    invoke("ironstone.marketing.ContextServices.get#Choices", {
                        appRoot: "Marketing",
                        choice: "registrationEvents",
                        organizationPartyId: ids.organizationId
                    })
                )
            const authorEvents = eventChoice(users.author)
            const managerEvents = eventChoice(users.events)
            return {list, record, products, readerSetup, other, context, campaignRefused, madeNone, authorEvents, managerEvents}
        },
        then({list, record, products, readerSetup, other, context, campaignRefused, madeNone, authorEvents, managerEvents}) {
            authorEvents.options.map(option => option.value).includes(ids.workshopEventId)
            authorEvents.options.map(option => option.value).includes(ids.webinarEventId)
            managerEvents.options.length == 0
            campaignRefused.includes("campaign's edit permission") && madeNone
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

// Marketing follow-up 3 (the user's call of Nov 15): the demo events are dated from the load (ironstone.marketing.DemoServices
// load#EventDatesDemo moves the 2099 placeholders): the webinar upcoming, ten to eleven weeks out on a Thursday evening, the workshop a
// few months out on a Saturday morning, closing the day before, the day and hour in the offer's zone (America/Denver, as PASS shows
// them) whatever the server's (Marketing follow-up 3 review); each event's start is its offer's occurrence
feature("the demo webinar and workshop are dated from the load, each event with its offer", {
    when() {
        const row = (entity, keys) => system(() => ec.entity.find(entity).condition(keys).disableAuthz().one())
        const ms = value => Number(String(value))
        const of = (workEffortId, registrationPolicyId) => {
            const event = row("mantle.work.effort.WorkEffort", {workEffortId})
            const offer = row("mantle.work.registration.EventRegistrationPolicy", {registrationPolicyId})
            return {
                start: ms(offer.occurrenceStart),
                end: ms(offer.occurrenceEnd),
                eventStart: ms(event.estimatedStartDate),
                eventEnd: ms(event.estimatedCompletionDate),
                closes: offer.closesDate == null ? null : ms(offer.closesDate),
                local: String(ec.l10n.format(String(offer.occurrenceStart), "EEE HH:mm", "en", offer.timeZone)),
                zone: offer.timeZone
            }
        }
        return {
            now: Date.now(),
            webinar: of(ids.webinarEventId, ids.webinarOfferId),
            workshop: of(ids.workshopEventId, ids.workshopOfferId)
        }
    },
    then({now, webinar, workshop}) {
        const day = 86400000
        webinar.start == webinar.eventStart && webinar.end == webinar.eventEnd && webinar.end - webinar.start == 3600000
        webinar.start > now + 68 * day && webinar.start < now + 79 * day
        webinar.zone == "America/Denver" && webinar.local == "Thu 18:00"
        workshop.start == workshop.eventStart && workshop.end == workshop.eventEnd && workshop.end - workshop.start == 3 * 3600000
        workshop.start > now + 116 * day && workshop.start < now + 126 * day
        workshop.zone == "America/Denver" && workshop.local == "Sat 09:00"
        workshop.closes > now && workshop.start - workshop.closes == 16 * 3600000
    }
})
