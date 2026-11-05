// Customer Service P4's "usable when" (impl-customer-service P4, design §10 case intake to resolution), as an acceptance walk
// through the screens' transitions with artifact authorization on, on Retail's demo service levels (the Support team works
// Monday to Friday 9:00-17:00 in Chicago, the default policy's Normal band answers in 4 business hours and resolves in 24):
// a case received Friday 16:30 with Monday a holiday is due for first response on Tuesday, as SlaSimulation said; an internal
// note and a failed send do not meet first response and a sent reply does; waiting for the customer pauses resolution and an
// internal hold does not; a status change through Projects' triage#Request is recorded on the case and Commons' due date edit
// is refused; a reopen starts a new resolution episode and keeps the first breach; a policy row started later leaves an open
// case on the row it began with; and a scan with one failing clock names it and warns the rest. The rules are Mantle's
// SupportSla and BusinessTime specs. Run: ./moq accept mr-boss --spec CustomerServiceSlaWalk
const lib = ec.resource.script("component://mr-boss/test/CustomerService/CustomerServiceSpecLib.js")
const {ids, users, asUser, system, invoke, refusal} = lib
const webroot = "component://webroot/screen/webroot.xml"
const L = "mantle.request.SlaServices."
const state = {}
const chicago = (day, clock) => new Date(Date.parse(day + "T" + clock + ":00-06:00")).getTime()
const at = value => (value == null ? null : /^-?\d+$/.test(String(value)) ? Number(value) : Date.parse(String(value)))
const one = (entity, conditions) => system(() => ec.entity.find(entity).condition(conditions).one())
const rows = (entity, conditions) => system(() => Array.from(ec.entity.find(entity).condition(conditions).list()))
const clock = (requestId, clockEnumId, sequenceNum = 1) =>
    one("mantle.request.support.CaseSlaEpisode", {requestId, clockEnumId, sequenceNum})
const now = (day, clockText) => ec.user.setEffectiveTime(chicago(day, clockText))
// a transition of a Customer Service screen as the user posts it
function post(user, path, parameters) {
    return asUser(user, () => {
        const rendered = ec.screen
            .makeTest()
            .rootScreen(webroot)
            .render("apps/CustomerService/" + path, parameters, "post")
        const result = {status: rendered.status, errors: Array.from(rendered.errorMessages || []).join(" | ")}
        ec.message.clearErrors()
        return result
    })
}
// a case for Joe Q Public in the Support queue, from NewCase, at the pinned time: its id
function newCase(name) {
    post(users.agent, "Cases/NewCase/createCase", {
        organizationPartyId: ids.organizationId,
        customerPartyId: ids.customerId,
        requestTypeEnumId: "RqtSupport",
        requestCategoryId: ids.supportQueueId,
        requestName: name,
        priority: "5",
        salesChannelEnumId: "ScEmail"
    })
    return one("mantle.request.Request", {requestName: name})?.requestId
}
// a message on the case as Chatter and the mail filing leave it: a note, or a mail in a state (filed once ES_SENT)
function message(requestId, typeId, mailStatusId) {
    return system(() => {
        const agent = one("moqui.security.UserAccount", {username: users.agent}).partyId
        const emailMessageId = mailStatusId
            ? call("create#moqui.basic.email.EmailMessage", {
                  statusId: mailStatusId,
                  subject: "Re: your case",
                  body: "An answer",
                  sentDate: mailStatusId === "ES_SENT" ? ec.user.nowTimestamp : null
              }).emailMessageId
            : null
        const communicationEventId = call("create#mantle.party.communication.CommunicationEvent", {
            communicationEventTypeId: typeId,
            statusId: mailStatusId === "ES_SENT" ? "CeSent" : "CeReady",
            fromPartyId: agent,
            toPartyId: ids.customerId,
            entryDate: ec.user.nowTimestamp,
            emailMessageId,
            body: "An answer"
        }).communicationEventId
        call("create#mantle.request.RequestCommEvent", {requestId, communicationEventId})
        return communicationEventId
    })
}

spec({
    setupSpec() {
        // Monday the 9th is Retail's holiday
        system(() =>
            call("create#mantle.work.effort.WorkEffort", {
                workEffortTypeEnumId: "WetEvent",
                purposeEnumId: "WepHoliday",
                workEffortName: "Walk holiday",
                ownerPartyId: ids.organizationId,
                allDayStart: "2026-11-09"
            })
        )
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("a case received Friday 16:30 with a holiday Monday is due for first response Tuesday, as SlaSimulation said", {
    when() {
        now("2026-11-06", "16:30")
        const simulation = asUser(
            users.admin,
            () =>
                invoke(L + "simulate#Policy", {
                    serviceLevelPolicyId: ids.slaPolicyId,
                    receivedDate: new Date(chicago("2026-11-06", "16:30")),
                    priority: 5
                }).simulation,
            false
        )
        const page = asUser(users.admin, () =>
            lib.page(
                "Settings/ServiceLevelPolicies",
                {
                    organizationPartyId: ids.organizationId,
                    simulatePolicyId: ids.slaPolicyId,
                    priority: "5"
                },
                "html"
            )
        )
        state.caseA = newCase("SLA walk: thermostat beeps")
        const history = asUser(users.agent, () => lib.page("Cases/CaseDetail", {requestId: state.caseA, tab: "sla"}, "html"))
        return {simulation, page, first: clock(state.caseA, "SlcFirstResponse"), history}
    },
    then({simulation, page, first, history}) {
        simulation.clocks[0].label == "First response"
        simulation.clocks[0].dueText == "Tue 10 Nov 2026 12:30"
        simulation.holidays.some(row => row.name == "Walk holiday")
        page.errors == []
        page.output.includes("When would a case be due?")
        at(first.dueDate) == chicago("2026-11-10", "12:30")
        history.output.includes("Tue 10 Nov 2026 12:30")
    }
})

feature("an internal note and a failed send do not meet first response; a sent reply does", {
    when() {
        now("2026-11-10", "09:10")
        message(state.caseA, "Comment")
        message(state.caseA, "Email", "ES_READY")
        const before = clock(state.caseA, "SlcFirstResponse").stateEnumId
        now("2026-11-10", "09:30")
        message(state.caseA, "Email", "ES_SENT")
        return {before, after: clock(state.caseA, "SlcFirstResponse")}
    },
    then({before, after}) {
        before == "SlsRunning"
        after.stateEnumId == "SlsMet"
        at(after.actualDate) == chicago("2026-11-10", "09:30")
    }
})

feature("waiting for the customer pauses resolution from CaseDetail; an internal hold does not", {
    when() {
        now("2026-11-10", "10:00")
        const waiting = post(users.manager, "Cases/CaseDetail/transitionCase", {
            requestId: state.caseA,
            toStatusId: "ReqWaitingCustomer",
            reason: "Asked for a photo of the display"
        })
        const paused = clock(state.caseA, "SlcResolution").stateEnumId
        now("2026-11-11", "10:00")
        post(users.manager, "Cases/CaseDetail/transitionCase", {requestId: state.caseA, toStatusId: "ReqInProgress"})
        const resumed = clock(state.caseA, "SlcResolution")
        post(users.manager, "Cases/CaseDetail/transitionCase", {
            requestId: state.caseA,
            toStatusId: "ReqOnHold",
            reason: "Waiting on the warehouse"
        })
        return {waiting, paused, resumed, held: clock(state.caseA, "SlcResolution").stateEnumId}
    },
    then({waiting, paused, resumed, held}) {
        waiting.errors == ""
        paused == "SlsPaused"
        resumed.stateEnumId == "SlsRunning"
        resumed.pausedMinutes == 480
        held == "SlsRunning"
    }
})

feature("a status change through Projects' triage is recorded on the case; Commons' due date edit is refused on it", {
    when() {
        now("2026-11-11", "11:00")
        system(() => call("update#mantle.request.Request", {requestId: state.caseA, statusId: "ReqInProgress"}))
        const caseB = newCase("SLA walk: triaged in Projects")
        state.caseB = caseB
        const triaged = asUser(
            "john.doe",
            () =>
                refusal("ironstone.projects.ProjectRequestServices.triage#Request", {
                    requestId: caseB,
                    action: "status",
                    value: "ReqReviewed"
                }),
            false
        )
        const due = asUser(
            "joe@public.com",
            () =>
                // Joe's request in Commons would be a case: its due date is the service levels', so Commons' "Response wanted
                // by" is refused (the guard of P2, CaseGuard)
                refusal("ironstone.commons.RequestServices.raise#Request", {
                    requestName: "SLA walk: my order is late",
                    responseRequiredDate: new Date(chicago("2026-11-20", "12:00"))
                }),
            false
        )
        return {
            triaged,
            due,
            events: rows("mantle.request.support.CaseSlaEvent", {requestId: caseB, eventTypeEnumId: "SetStatus"}),
            status: one("mantle.request.Request", {requestId: caseB}).statusId
        }
    },
    then({triaged, due, events, status}) {
        triaged == ""
        status == "ReqReviewed"
        events.some(row => row.fromStatusId == "ReqSubmitted" && row.statusId == "ReqReviewed")
        due.includes("CASE_DUE_DATE")
    }
})

feature("a reopen starts a new resolution episode and keeps the first breach", {
    when() {
        // case B has had no response: after Thursday 15:00 its first response is breached
        now("2026-11-12", "15:00")
        asUser("john.doe", () => invoke(L + "scan#CaseSla", {limit: 2000}), false)
        const breached = clock(state.caseB, "SlcFirstResponse")
        post(users.manager, "Cases/CaseDetail/transitionCase", {
            requestId: state.caseB,
            toStatusId: "ReqCompleted",
            resolutionEnumId: "RrCompleted"
        })
        now("2026-11-12", "16:00")
        const reopened = post(users.manager, "Cases/CaseDetail/transitionCase", {
            requestId: state.caseB,
            toStatusId: "ReqInProgress",
            reason: "Still beeping"
        })
        return {
            breached,
            reopened,
            first: clock(state.caseB, "SlcFirstResponse"),
            resolved: clock(state.caseB, "SlcResolution"),
            second: clock(state.caseB, "SlcResolution", 2)
        }
    },
    then({breached, reopened, first, resolved, second}) {
        breached.breachedDate != null
        reopened.errors == ""
        first.stateEnumId == "SlsUnmet"
        at(first.breachedDate) == at(breached.breachedDate)
        resolved.stateEnumId != "SlsRunning"
        second.stateEnumId == "SlsRunning"
        at(second.startDate) == chicago("2026-11-12", "16:00")
    }
})

feature("a scan with one failing clock names it and warns the rest", {
    when() {
        now("2026-11-13", "09:00")
        const fresh = newCase("SLA walk: warned")
        const broken = system(() => {
            call("create#mantle.request.Request", {
                requestId: "BOSS_CS_SLA_NOT_A_CASE",
                requestName: "Not a case",
                statusId: "ReqSubmitted"
            })
            return call("create#mantle.request.support.CaseSlaEpisode", {
                requestId: "BOSS_CS_SLA_NOT_A_CASE",
                clockEnumId: "SlcResolution",
                sequenceNum: 1,
                stateEnumId: "SlsRunning",
                startDate: new Date(chicago("2026-11-02", "09:00")),
                dueDate: new Date(chicago("2026-11-03", "09:00"))
            }).caseSlaEpisodeId
        })
        // the fresh case's first response warns an hour before its 13:00 due time
        now("2026-11-13", "12:05")
        const scanned = asUser("john.doe", () => invoke(L + "scan#CaseSla", {limit: 2000}), false)
        return {broken, scanned, warned: clock(fresh, "SlcFirstResponse").warnedDate}
    },
    then({broken, scanned, warned}) {
        scanned.failedList.some(row => row.caseSlaEpisodeId == broken)
        warned != null
    }
})

feature("a policy row started later leaves an open case on the row it began with", {
    when() {
        now("2026-11-13", "13:00")
        const saved = post(users.admin, "Settings/ServiceLevelPolicies/savePolicy", {
            serviceLevelPolicyId: ids.slaPolicyId,
            organizationPartyId: ids.organizationId,
            policyName: "Retail standard",
            first_CpbNormal: "120",
            resolution_CpbNormal: "960",
            warning_CpbNormal: "30",
            draft: "N",
            changeReason: "Faster first response"
        })
        const later = newCase("SLA walk: after the change")
        return {saved, open: clock(state.caseA, "SlcResolution"), later: clock(later, "SlcFirstResponse")}
    },
    then({saved, open, later}) {
        saved.errors == ""
        open.serviceLevelPolicyId == ids.slaPolicyId
        later.serviceLevelPolicyId != ids.slaPolicyId
        later.targetMinutes == 120
    }
})
