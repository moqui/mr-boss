// Marketing's registrations (impl-marketing P17; design-marketing §9 Registrations, RegistrationDetail): a staff registration of the
// demo webinar's free place by its events manager confirms at once; RegistrationDetail's one qvt render shows it to the events manager
// with all of its checks on that render (the header, its state, the terms it accepted with their cancellation rule, its history, the
// actions by state, a new entry code among them); a reader
// gets "Not available"; the record kind, the event's Registrations link and another organization's author refused through the
// services. The rules are Mantle's (test/work/EventRegistrations); the scenario is the acceptance MarketingRegistrationScenario.
// Run: ./moq test mr-boss --spec MarketingRegistrations
const lib = ec.resource.script("component://mr-boss/test/Marketing/MarketingSpecLib.js")
const {ids, users, asUser, invoke, page, system} = lib
const E = "mantle.work.EventRegistrationServices."
let entered = null

spec({
    setupSpec() {
        // the Mantle services as the events manager (authorization off: the service's own rule; a screen grants its calls)
        entered = asUser(users.events, () =>
            system(() => {
                const reserved = invoke(E + "reserve#Registration", {
                    registrationPolicyId: ids.webinarOfferId,
                    ticketTypeId: ids.webinarTicketId,
                    quantity: 1,
                    buyerName: "Spec Attendee",
                    buyerEmail: "spec.attendee@registrations.example.test",
                    requestKey: "bossregspec" + Math.floor(Math.random() * 1e9)
                })
                const completed = invoke(E + "complete#Registration", {
                    reservationId: reserved.reservationId,
                    attendees: [{name: "Spec Attendee"}],
                    acceptTerms: true
                })
                return {reserved, completed}
            })
        )
    }
})

feature("RegistrationDetail shows a confirmed staff registration, its terms and history to the events manager", {
    when() {
        const registrationId = entered.completed.registrationIds[0]
        return {registrationId, detail: asUser(users.events, () => page("Events/RegistrationDetail", {registrationId}))}
    },
    then({registrationId, detail}) {
        entered.reserved.state == "held" && entered.completed.state == "confirmed"
        detail.status == 200 && detail.errors.length == 0
        detail.output.includes("Spec Attendee") &&
            detail.output.includes("Spring planting webinar") &&
            detail.output.includes("Free place")
        detail.output.includes("Confirmed") && detail.output.includes("Staff entry")
        // the words of the terms it accepted, and its history: held, answered, confirmed
        detail.output.includes("Free. The link to join is sent with your confirmation.")
        detail.output.includes("Place held") && detail.output.includes("Answers and terms accepted")
        // confirmed: the change actions under More, no Confirm
        detail.output.includes("CancelDialog") &&
            detail.output.includes("CorrectDialog") &&
            detail.output.includes("NotifyDialog") &&
            detail.output.includes("ReissueDialog")
        // follow-up 1: the accepted terms' cancellation rule in words, and the refund the terms give a cancellation now
        detail.output.includes("You may cancel online until the event starts, for a full refund.")
        detail.output.includes("refundPercent")
        !detail.output.includes("ConfirmDialog")
        detail.output.includes(registrationId)
    }
})

feature("a reader gets Not available; the record kind, the event's link and another organization's author are by organization", {
    when() {
        const registrationId = entered.completed.registrationIds[0]
        const readerDetail = asUser(users.reader, () => page("Events/RegistrationDetail", {registrationId}, "html"))
        const record = asUser(users.events, () =>
            invoke("ironstone.marketing.ContextServices.check#Record", {
                appRoot: "Marketing",
                recordType: "registration",
                recordId: registrationId
            })
        )
        const readerRecord = asUser(users.reader, () =>
            lib.refusal("ironstone.marketing.ContextServices.check#Record", {
                appRoot: "Marketing",
                recordType: "registration",
                recordId: registrationId
            })
        )
        const other = asUser(users.otherAuthor, () => system(() => lib.refusal(E + "get#Registration", {registrationId})))
        const list = asUser(users.events, () =>
            system(() => invoke(E + "find#Registrations", {workEffortId: ids.webinarEventId}))
        )
        const context = asUser(users.events, () =>
            invoke("ironstone.marketing.ContextServices.get#SharedContext", {appRoot: "Marketing"})
        )
        return {readerDetail, record, readerRecord, other, list, context, registrationId}
    },
    then(r) {
        r.readerDetail.output.includes("Not available") && !r.readerDetail.output.includes("Spec Attendee")
        r.record.recordId == r.registrationId
        r.readerRecord != ""
        r.other.includes("PERMISSION_DENIED") || r.other.includes("RECORD_UNAVAILABLE")
        r.list.registrationList.some(row => row.registrationId == r.registrationId && row.attendeeName == "Spec Attendee")
        !!r.context.sharedLinks["Events/Registrations"] && !!r.context.sharedLinks["Events/RegistrationDetail"]
        r.context.capabilities.registrationRead
    }
})
