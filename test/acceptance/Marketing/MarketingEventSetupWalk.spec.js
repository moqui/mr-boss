// Marketing P16's "usable when" (impl-marketing P16; design-marketing §9 Events, EventDetail, RegistrationSetup, §13 Event), as an
// acceptance walk through the screens' transitions with artifact authorization on: marketing.events makes an event (the calendar's
// create#Event, the user its organizer; the running campaign's link refused without the campaign's edit, and made by its author),
// adds its offer with twenty seats on the shop's site, two ticket types (a free one and one priced by the demo's ticket product) and
// registration questions an author built and published, publishes it, and
// the PASS Event page shows the offer to a visitor; the calendar's own permissions still decide who edits the event (another events
// manager who is not its organizer and edits none of its calendars cannot change it in the calendar, nor offer it again for another
// organization). The rules are Mantle's EventRegistrationSetup, the renders MarketingEvents and mr-pass's MarketingEvents.
// Run: ./moq accept mr-boss --spec MarketingEventSetupWalk
const lib = ec.resource.script("component://mr-boss/test/Marketing/MarketingSpecLib.js")
const {ids, users, asUser, system} = lib
const entityLib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const E = "mantle.work.EventRegistrationServices."
const site = "ZIZI_SHOP"
const state = {}
const dayMs = 86400000

function post(path, parameters) {
    const result = ec.screen.makeTest().rootScreen("component://mr-boss/screen/Marketing.xml").render(path, parameters, "post")
    const errors = Array.from(result.errorMessages || []).join(" | ")
    ec.message.clearErrors()
    return {status: result.status, errors}
}
const as = (user, service, parameters) =>
    asUser(user, () => system(() => ec.service.sync().name(service).parameters(parameters).call() || {}))
const one = (entity, fields) => system(() => ec.entity.find(entity).condition(fields).one())
const all = (entity, fields) => system(() => Array.from(ec.entity.find(entity).condition(fields).list()))
const revision = registrationPolicyId =>
    entityLib.ms(one("mantle.work.registration.EventRegistrationPolicy", {registrationPolicyId}).lastUpdatedStamp)

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        // the shop's site is published for the walk (the demo leaves it to be published)
        system(() =>
            ec.service.sync().name("update#mantle.public.PublicSite").parameters({siteId: site, state: "published"}).call()
        )
        // registration questions an author builds and publishes in Surveys (the shared builder's services)
        const form = as(users.author, "mantle.party.FormDefinitionServices.create#Form", {
            purposeEnumId: "DbfpRegistration",
            organizationPartyId: ids.organizationId,
            description: "Workshop registration"
        })
        as(users.author, "mantle.party.FormDefinitionServices.save#FormField", {
            formId: form.formId,
            title: "Dietary needs",
            fieldTypeEnumId: "DBFFT_text-line",
            audienceEnumId: "CfaCustomer"
        })
        as(users.author, "mantle.party.FormDefinitionServices.publish#Form", {formId: form.formId})
        state.formId = form.formId
    },
    cleanupSpec() {
        login("john.doe")
    }
})

feature("an events manager makes an event through New event, and the campaign's author links it to the campaign", {
    when() {
        const start = new Date(Date.now() + 20 * dayMs)
        const fields = {
            workEffortName: "Summer bulbs evening",
            organizationPartyId: ids.organizationId,
            startDate: start,
            endDate: new Date(start.getTime() + 2 * 3600000),
            location: "Ziziwork garden centre, Orem"
        }
        // the campaign link is a change of the campaign: the events manager (no campaign edit) is refused before any event is made
        const withCampaign = asUser(users.events, () =>
            post("Events/Events/createEvent", Object.assign({marketingCampaignId: ids.runningCampaignId}, fields))
        )
        const madeNone = all("mantle.work.effort.WorkEffort", {workEffortName: "Summer bulbs evening"}).length == 0
        const created = asUser(users.events, () => post("Events/Events/createEvent", fields))
        const event = all("mantle.work.effort.WorkEffort", {workEffortName: "Summer bulbs evening"})[0]
        state.workEffortId = event?.workEffortId
        const linked = as(users.author, "mantle.marketing.CampaignServices.store#CampaignAssociation", {
            marketingCampaignId: ids.runningCampaignId,
            associationKindEnumId: "CakEvent",
            sourceId: state.workEffortId
        })
        return {withCampaign, madeNone, created, event, linked}
    },
    then({withCampaign, madeNone, created, event, linked}) {
        withCampaign.errors.includes("campaign's edit permission") && madeNone
        created.errors == ""
        !!event && event.ownerPartyId == "BOSS_MKT_EVENTS"
        one("mantle.work.registration.RegistrationEvent", {workEffortId: state.workEffortId}).organizationPartyId ==
            ids.organizationId
        !!linked.campaignAssociationId
        all("mantle.marketing.campaign.CampaignAssociation", {sourceId: state.workEffortId, associationKindEnumId: "CakEvent"})[0]
            .marketingCampaignId == ids.runningCampaignId
    }
})

feature("the events manager sets the offer, two ticket types and the questions, and publishes it", {
    when() {
        const setup = "Events/RegistrationSetup/"
        const offer = asUser(users.events, () =>
            post(setup + "storeOffer", {workEffortId: state.workEffortId, totalSeats: "20", publicTitle: "Summer bulbs evening"})
        )
        state.offerId = all("mantle.work.registration.EventRegistrationPolicy", {
            workEffortId: state.workEffortId
        })[0]?.registrationPolicyId
        const details = asUser(users.events, () =>
            post(setup + "storeOffer", {
                workEffortId: state.workEffortId,
                registrationPolicyId: state.offerId,
                expectedRevision: revision(state.offerId),
                siteId: site,
                publicDescription: "Plant your summer bulbs with us.",
                termsText: "Places are held for 15 minutes.",
                waitlistEnabled: "Y"
            })
        )
        const free = asUser(users.events, () =>
            post(setup + "storeTicket", {
                workEffortId: state.workEffortId,
                registrationPolicyId: state.offerId,
                ticketName: "Members",
                priceSourceEnumId: "EtpFree",
                capacity: "5"
            })
        )
        const paid = asUser(users.events, () =>
            post(setup + "storeTicket", {
                workEffortId: state.workEffortId,
                registrationPolicyId: state.offerId,
                ticketName: "Standard",
                priceSourceEnumId: "EtpProduct",
                productId: "BOSS_MKT_TICKET_STD"
            })
        )
        const questions = asUser(users.events, () =>
            post(setup + "storeQuestions", {
                workEffortId: state.workEffortId,
                registrationPolicyId: state.offerId,
                expectedRevision: revision(state.offerId),
                formId: state.formId,
                questionScopeEnumId: "ErqAttendee",
                consentText: "I accept the workshop's terms."
            })
        )
        const published = asUser(users.events, () =>
            post(setup + "publishOffer", {
                workEffortId: state.workEffortId,
                registrationPolicyId: state.offerId,
                expectedRevision: revision(state.offerId)
            })
        )
        return {offer, details, free, paid, questions, published}
    },
    then({offer, details, free, paid, questions, published}) {
        offer.errors == "" && details.errors == "" && free.errors == "" && paid.errors == "" && questions.errors == ""
        published.errors == ""
        one("mantle.work.registration.EventRegistrationPolicy", {registrationPolicyId: state.offerId}).statusId == "ErpPublished"
        all("mantle.work.registration.EventTicketType", {registrationPolicyId: state.offerId}).length == 2
        // the questions' publication opened with the offer, on its site
        one("mantle.party.FormPublication", {
            publicationId: one("mantle.work.registration.EventRegistrationPolicy", {registrationPolicyId: state.offerId})
                .formPublicationId
        }).siteId == site
    }
})

feature("the PASS Event page shows the published offer to a visitor", {
    when() {
        logout()
        let page
        try {
            page = ec.screen
                .makeTest()
                .rootScreen("component://mr-pass/screen/Pass.xml")
                .render("Marketing/Event", {resolvedSiteId: site, publicHost: "shop.zizi.localhost", offer: state.offerId}, null)
        } finally {
            login("john.doe")
        }
        return {html: String(page.output || ""), errors: Array.from(page.errorMessages || [])}
    },
    then({html, errors}) {
        errors.length == 0
        html.includes("Summer bulbs evening") && html.includes("Plant your summer bulbs with us.")
        html.includes("Members") && html.includes("Free") && html.includes("Standard") && html.includes("$45.00")
        html.includes("Places are held for 15 minutes.")
    }
})

feature("the calendar's own permissions still decide who edits the event", {
    when() {
        // another events manager of Retail, not its organizer and editing none of its calendars
        const other = asUser("marketing.admin", () =>
            system(() =>
                ec.service
                    .sync()
                    .name("mantle.work.EventServices.check#EventAccess")
                    .parameters({workEffortId: state.workEffortId, permission: "flags"})
                    .call()
            )
        )
        const organizer = asUser(users.events, () =>
            system(() =>
                ec.service
                    .sync()
                    .name("mantle.work.EventServices.check#EventAccess")
                    .parameters({workEffortId: state.workEffortId, permission: "flags"})
                    .call()
            )
        )
        const elsewhere = asUser("marketing.admin", () =>
            system(() =>
                lib.refusal(E + "store#RegistrationEvent", {
                    workEffortId: state.workEffortId,
                    organizationPartyId: ids.otherOrganizationId
                })
            )
        )
        return {other, organizer, elsewhere}
    },
    then({other, organizer, elsewhere}) {
        organizer.canEdit && !other.canEdit
        elsewhere.includes("ORGANIZATION_FIXED")
    }
})
