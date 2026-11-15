// The data of the acceptance MarketingCheckInWalk (test/acceptance/client/Marketing/MarketingCheckInWalk; impl-marketing P18 "usable
// when", scenario 14), made on the --serve server before the walk, and the scenario's server half. Retail's "Door spec open evening",
// a free offer whose occurrence is under way now (so its door is open), with three confirmed places: Nora (her entry code kept for the
// walk as the description of a spec-local enumeration, since a code is never stored: the client reads it through the entity REST as
// john.doe), Pia (found by name), and Owen's place, cancelled after his code was issued (refused at the door). The server half:
// cancelling an event stops its pending reminders (a scheduled reminder of a confirmed place is suppressed once the event is
// cancelled, EventRegistrationNotices.js), which a browser cannot see.
// Run: ./moq accept mr-boss --spec MarketingCheckInFixtures
const prefix = "MKT_DOOR_SPEC"
const org = "ORG_ZIZI_RETAIL"
const E = "mantle.work.EventRegistrationServices."
const places = () => ec.resource.script("component://mr-mantle/service/mantle/work/EventRegistrationPlaces.js")
const hourMs = 3600000
const make = (entity, values) =>
    ec.service
        .sync()
        .name("create#" + entity)
        .parameters(values)
        .disableAuthz()
        .call()
const one = (entity, fields) => ec.entity.find(entity).condition(fields).disableAuthz().one()

// an event of Retail with a published free offer starting startMs: the offer's id
function offerOf(key, title, startMs) {
    const workEffortId = prefix + "_EV_" + key
    const registrationPolicyId = prefix + "_OFFER_" + key
    if (one("mantle.work.registration.EventRegistrationPolicy", {registrationPolicyId})) return registrationPolicyId
    make("mantle.work.effort.WorkEffort", {
        workEffortId,
        workEffortTypeEnumId: "WetEvent",
        workEffortName: title,
        statusId: "WeInPlanning",
        estimatedStartDate: new Date(startMs),
        estimatedCompletionDate: new Date(startMs + 3 * hourMs),
        location: "Ziziwork garden centre"
    })
    make("mantle.work.registration.RegistrationEvent", {workEffortId, organizationPartyId: org, createdDate: new Date()})
    make("mantle.work.registration.EventRegistrationPolicy", {
        registrationPolicyId,
        workEffortId,
        organizationPartyId: org,
        occurrenceStart: new Date(startMs),
        occurrenceEnd: new Date(startMs + 3 * hourMs),
        statusId: "ErpPublished",
        publicTitle: title,
        timeZone: "America/Denver",
        totalSeats: 30,
        holdMinutes: 15,
        policyRevision: 1,
        termsRevision: 0,
        publishedDate: new Date()
    })
    make("mantle.work.registration.EventTicketType", {
        ticketTypeId: registrationPolicyId + "_T",
        registrationPolicyId,
        ticketName: "Free place",
        priceSourceEnumId: "EtpFree",
        sequenceNum: 1,
        fromDate: new Date(Date.now() - 86400000)
    })
    return registrationPolicyId
}
// a confirmed place of a new person: its id, and its entry code kept for the walk when asked
function placeOf(registrationPolicyId, firstName, keepCode) {
    const registrationId = prefix + "_R_" + firstName.toUpperCase()
    if (one("mantle.work.registration.EventRegistration", {registrationId})) return registrationId
    const partyId = prefix + "_P_" + firstName.toUpperCase()
    make("mantle.party.Party", {partyId, partyTypeEnumId: "PtyPerson"})
    make("mantle.party.Person", {partyId, firstName, lastName: "Gardener"})
    make("mantle.work.registration.EventRegistration", {
        registrationId,
        registrationPolicyId,
        ticketTypeId: registrationPolicyId + "_T",
        attendeePartyId: partyId,
        buyerPartyId: partyId,
        statusId: "EvrConfirmed",
        confirmedDate: new Date(),
        createdDate: new Date()
    })
    const issued = ec.transaction.runRequireNew(null, "Door spec code", () => places().issueCode(registrationId))
    if (keepCode)
        make("moqui.basic.Enumeration", {
            enumId: prefix + "_CODE_" + firstName.toUpperCase(),
            enumTypeId: prefix,
            description: issued.code
        })
    return registrationId
}

spec({
    setupSpec() {
        login("john.doe")
        ec.artifactExecution.disableAuthz()
    },
    cleanupSpec() {
        ec.artifactExecution.enableAuthz()
    }
})

feature("Retail's open evening is under way with Nora's, Pia's and Owen's places, Owen's cancelled after his code was issued", {
    when() {
        if (!one("moqui.basic.EnumerationType", {enumTypeId: prefix}))
            make("moqui.basic.EnumerationType", {enumTypeId: prefix, description: "Check-in walk codes (acceptance fixture)"})
        const offer = offerOf("OPEN", "Door spec open evening", Date.now() - hourMs)
        placeOf(offer, "Nora", true)
        placeOf(offer, "Pia", false)
        const owen = placeOf(offer, "Owen", true)
        ec.entity
            .find("mantle.work.registration.EventRegistration")
            .condition("registrationId", owen)
            .updateAll({statusId: "EvrCancelled"})
        return {
            offer: one("mantle.work.registration.EventRegistrationPolicy", {registrationPolicyId: offer}),
            nora: one("moqui.basic.Enumeration", {enumId: prefix + "_CODE_NORA"}),
            owen: one("mantle.work.registration.EventRegistration", {registrationId: owen})
        }
    },
    then(r) {
        r.offer.statusId == "ErpPublished"
        r.nora.description.startsWith("EV")
        r.owen.statusId == "EvrCancelled"
    }
})

feature("cancelling an event stops its pending reminders", {
    when() {
        const offer = offerOf("LATER", "Door spec autumn walk", Date.now() + 2 * 86400000)
        const registrationId = placeOf(offer, "Quinn", false)
        // a reminder three days before the start: due now
        if (!one("mantle.work.registration.EventCommunicationSchedule", {scheduleId: prefix + "_REMINDER"}))
            make("mantle.work.registration.EventCommunicationSchedule", {
                scheduleId: prefix + "_REMINDER",
                registrationPolicyId: offer,
                triggerEnumId: "EctBeforeStart",
                offsetMinutes: 3 * 24 * 60,
                channelEnumId: "MdcEmail",
                recipientScopeEnumId: "EcrAttendee",
                purposeEnumId: "MtpTransactional",
                fromDate: new Date(Date.now() - 86400000)
            })
        ec.entity
            .find("mantle.work.effort.WorkEffort")
            .condition("workEffortId", prefix + "_EV_LATER")
            .updateAll({statusId: "WeCancelled"})
        // the notices job sends nothing for a cancelled event's places
        ec.service
            .sync()
            .name(E + "run#RegistrationNotices")
            .disableAuthz()
            .call()
        const deliveries = Array.from(
            ec.entity
                .find("mantle.party.MessageDelivery")
                .condition("sourceEnumId", "MdsrcEventRegistration")
                .condition("eventKey", "like", "%" + registrationId + "%")
                .disableAuthz()
                .list()
        )
        return {deliveries: deliveries.length}
    },
    then(r) {
        r.deliveries == 0
    }
})

// The Marketing client walks (MarketingCheckInWalk's kept codes, MarketingCalendarWalk's demo send and webinar days) read records as
// john.doe over entity REST, which grants no entity by default (docs/security/Attack-Surface.md: AT_ENTITY): this test database
// gives the instance administrators a view of those entities alone.
const READ_GROUP = prefix + "_RECORDS"
const readEntities = ["moqui.basic.Enumeration", "mantle.marketing.campaign.CampaignSend", "mantle.work.effort.WorkEffort"]
feature("the Marketing client walks' record reader: the instance administrators view the walks' entities over entity REST", {
    when() {
        if (!one("moqui.security.ArtifactGroup", {artifactGroupId: READ_GROUP})) {
            make("moqui.security.ArtifactGroup", {
                artifactGroupId: READ_GROUP,
                description: "Marketing client walks: records read over entity REST"
            })
            for (const artifactName of readEntities)
                make("moqui.security.ArtifactGroupMember", {
                    artifactGroupId: READ_GROUP,
                    artifactName,
                    artifactTypeEnumId: "AT_ENTITY",
                    nameIsPattern: "N"
                })
            make("moqui.security.ArtifactAuthz", {
                artifactAuthzId: READ_GROUP + "_ADMIN",
                userGroupId: "ADMIN",
                artifactGroupId: READ_GROUP,
                authzTypeEnumId: "AUTHZT_ALLOW",
                authzActionEnumId: "AUTHZA_VIEW"
            })
        }
        return {
            members: ec.entity
                .find("moqui.security.ArtifactGroupMember")
                .condition("artifactGroupId", READ_GROUP)
                .disableAuthz()
                .count()
        }
    },
    then({members}) {
        members == readEntities.length
    }
})
