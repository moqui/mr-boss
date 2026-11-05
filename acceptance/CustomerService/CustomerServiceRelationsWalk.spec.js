// Customer Service P8's "usable when" (impl-customer-service P8, CS-MERGE, CS-JOBS), as an acceptance walk through the screens'
// transitions with artifact authorization on: merging two of Joe Q Public's cases (MergeCases) keeps both histories with their
// audiences, the kept case's clock and the source's breach, and the source says where it went; merging cases of two customers
// is refused; a message split into a new case (SplitCase) starts its clock at that message's receipt, and the source stays
// open; a reply 20 days after resolution makes a linked follow-up case, one within 14 days reopens; auto-close sets the
// closed date, and a rerun changes nothing (scoped to the walk's own case, so Retail's other resolved cases stay open to a
// reply). The rules are Mantle's SupportRelations spec. The time is moved ahead with the
// effective time (a follow-up of a reply is made after the commit on the real clock, so its cases are made now).
// Run: ./moq accept mr-boss --spec CustomerServiceRelationsWalk
const lib = ec.resource.script("component://mr-boss/test/CustomerService/CustomerServiceSpecLib.js")
const {ids, users, asUser, system, invoke} = lib
const webroot = "component://webroot/screen/webroot.xml"
const S = "mantle.request.SupportCaseServices."
const day = 86400000
const state = {names: 0}
const one = (entity, conditions) => system(() => ec.entity.find(entity).condition(conditions).one())
const rows = (entity, conditions) => system(() => Array.from(ec.entity.find(entity).condition(conditions).list()))
const ahead = millis => ec.user.setEffectiveTime(millis == null ? null : Date.now() + millis)
function waitFor(read, millis = 6000) {
    const end = Date.now() + millis
    let value = read()
    while (!value && Date.now() < end) value = read()
    return value
}
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
// a case of a customer made on NewCase by the agent, by its subject
function newCase(subject, customerPartyId = ids.customerId) {
    const requestName = subject + " " + Date.now().toString(36) + "-" + ++state.names
    post(users.agent, "Cases/NewCase/createCase", {
        organizationPartyId: ids.organizationId,
        customerPartyId,
        requestTypeEnumId: "RqtSupport",
        requestCategoryId: ids.supportQueueId,
        requestName,
        priority: "5"
    })
    return one("mantle.request.Request", {requestName})?.requestId
}
// a message filed on the case, as the mail filing and Chatter leave one: the customer's mail, or an agent's note
function customerMail(requestId, fromPartyId = ids.customerId) {
    return system(() => {
        const communicationEventId = ec.service
            .sync()
            .name("create#mantle.party.communication.CommunicationEvent")
            .parameters({
                communicationEventTypeId: "Email",
                statusId: "CeReady",
                fromPartyId,
                toPartyId: ids.organizationId,
                entryDate: ec.user.nowTimestamp,
                subject: "About my case",
                body: "A message from the customer"
            })
            .call().communicationEventId
        ec.service
            .sync()
            .name("create#mantle.request.RequestCommEvent")
            .parameters({requestId, communicationEventId})
            .requireNewTransaction(true)
            .call()
        return communicationEventId
    })
}
const resolve = requestId =>
    post(users.manager, "Cases/CaseDetail/transitionCase", {
        requestId,
        toStatusId: "ReqCompleted",
        resolutionEnumId: "RrCompleted"
    })
const firstClock = requestId =>
    rows("mantle.request.support.CaseSlaEpisode", {requestId, clockEnumId: "SlcFirstResponse"}).find(
        row => !row.carriedFromEpisodeId
    )

spec({
    cleanup() {
        ec.user.setEffectiveTime(null)
    },
    cleanupSpec() {
        ec.user.setEffectiveTime(null)
        // Retail's service defaults back to no auto-close
        if (state.defaults)
            asUser(
                users.admin,
                () => invoke(S + "save#ServiceDefaults", Object.assign({}, state.defaults, {autoCloseDays: null})),
                false
            )
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "merging two of Joe's cases keeps both histories, the kept case's clock and the source's breach; two customers' are refused",
    {
        when() {
            const kept = newCase("Thermostat restarts")
            const source = newCase("Thermostat restarts again")
            const elsewhere = newCase("Filters missing", ids.companyCustomerId)
            const reply = customerMail(source)
            // an agent's note, as Chatter leaves one
            const note = asUser(
                users.agent,
                () =>
                    invoke("mantle.request.RequestServices.add#RequestComment", {
                        requestId: source,
                        body: "Internal: the same unit"
                    }),
                false
            ).communicationEventId
            // the source's first response came due an hour ago: the scan records its breach
            system(() => {
                const clock = firstClock(source)
                clock.set("dueDate", new Date(Date.now() - 3600000))
                clock.update()
                invoke("mantle.request.SlaServices.scan#CaseSla", {limit: 2000})
            })
            const keptClock = firstClock(kept)
            const sourceClock = firstClock(source)
            const page = asUser(users.manager, () => lib.page("Cases/MergeCases", {requestId: kept, sourceRequestIds: source}))
            // the revisions MergeConfirm posts, as the preview read them
            const preview = asUser(
                users.manager,
                () => invoke(S + "preview#MergeCases", {targetRequestId: kept, sourceRequestIds: [source]}),
                false
            ).preview
            const twoCustomers = post(users.manager, "Cases/MergeCases/mergeCases", {
                targetRequestId: kept,
                sourceIdsText: elsewhere,
                reason: "Duplicates",
                operationKey: "walk-merge-refused-" + Date.now()
            })
            const merged = post(users.manager, "Cases/MergeCases/mergeCases", {
                targetRequestId: kept,
                sourceIdsText: source,
                reason: "The same thermostat",
                operationKey: "walk-merge-" + Date.now(),
                caseRevisions: preview.caseRevisions
            })
            return {
                kept,
                source,
                reply,
                note,
                keptClock,
                sourceClock,
                page,
                twoCustomers,
                merged,
                sourceRequest: one("mantle.request.Request", {requestId: source}),
                keptAfter: one("mantle.request.support.CaseSlaEpisode", {caseSlaEpisodeId: keptClock.caseSlaEpisodeId}),
                sourceAfter: one("mantle.request.support.CaseSlaEpisode", {caseSlaEpisodeId: sourceClock.caseSlaEpisodeId}),
                carried: rows("mantle.request.support.CaseSlaEpisode", {
                    requestId: kept,
                    carriedFromEpisodeId: sourceClock.caseSlaEpisodeId
                }),
                keptMessages: rows("mantle.request.RequestCommEvent", {requestId: kept}).map(row => row.communicationEventId),
                keptOverview: asUser(users.manager, () => lib.page("Cases/CaseDetail", {requestId: kept, tab: "overview"})),
                sourceDetail: asUser(users.manager, () => lib.page("Cases/CaseDetail", {requestId: source}))
            }
        },
        then(r) {
            r.page.errors == []
            r.page.output.includes("What the merge does")
            r.twoCustomers.errors.includes("CUSTOMER_MISMATCH")
            r.merged.errors == ""
            r.sourceRequest.statusId == "ReqCancelled"
            r.sourceRequest.requestResolutionEnumId == "RrDuplicate"
            // the kept case's clock as it was; the source's breach kept on its own clock and carried
            Number(r.keptAfter.dueDate) == Number(r.keptClock.dueDate) ||
                String(r.keptAfter.dueDate) == String(r.keptClock.dueDate)
            r.sourceClock.breachedDate != null
            r.sourceAfter.stateEnumId == "SlsMerged"
            r.sourceAfter.breachedDate != null
            r.carried.length == 1
            r.carried[0].breachedDate != null
            // both histories: the source's mail and note on the kept case, the note still an internal comment
            r.keptMessages.includes(r.reply)
            r.keptMessages.includes(r.note)
            one("mantle.party.communication.CommunicationEvent", {communicationEventId: r.note}).communicationEventTypeId ==
                "Comment"
            r.keptOverview.errors == []
            r.keptOverview.output.includes("Merged from")
            r.keptOverview.output.includes(r.source)
            r.sourceDetail.errors == []
            r.sourceDetail.output.includes("Merged into case " + r.kept)
        }
    }
)

feature("a message split into a new case starts its clock at that message's receipt; the source stays open", {
    when() {
        const source = newCase("Two problems in one mail")
        const issue = customerMail(source)
        const received = one("mantle.party.communication.CommunicationEvent", {communicationEventId: issue}).entryDate
        const page = asUser(users.agent, () => lib.page("Cases/SplitCase", {requestId: source, communicationEventIds: issue}))
        const split = post(users.agent, "Cases/SplitCase/splitCase", {
            requestId: source,
            messageIdsText: issue,
            requestName: "The second problem",
            operationKey: "walk-split-" + Date.now()
        })
        const relation = rows("mantle.request.support.CaseRelation", {fromRequestId: source, relationTypeEnumId: "CrtSplit"})[0]
        return {
            source,
            issue,
            received,
            page,
            split,
            relation,
            sourceRequest: one("mantle.request.Request", {requestId: source}),
            profile: relation ? one("mantle.request.support.CaseProfile", {requestId: relation.toRequestId}) : null,
            clock: relation ? firstClock(relation.toRequestId) : null,
            newMessages: relation
                ? rows("mantle.request.RequestCommEvent", {requestId: relation.toRequestId}).map(row => row.communicationEventId)
                : []
        }
    },
    then(r) {
        r.page.errors == []
        r.page.output.includes("What the new case takes")
        r.split.errors == ""
        r.relation != null
        r.sourceRequest.statusId == "ReqSubmitted"
        String(r.profile.intakeDate) == String(r.received)
        String(r.clock.startDate) == String(r.received)
        r.newMessages.includes(r.issue)
    }
})

feature("a reply 20 days after resolution makes a linked follow-up case; one within 14 days reopens", {
    when() {
        const late = newCase("Fixed, then not")
        const recent = newCase("Fixed, then not again")
        const resolved = [resolve(late), resolve(recent)]
        ahead(3 * day)
        customerMail(recent)
        const reopened = one("mantle.request.Request", {requestId: recent})
        const secondClock = rows("mantle.request.support.CaseSlaEpisode", {
            requestId: recent,
            clockEnumId: "SlcResolution",
            sequenceNum: 2
        })
        ahead(20 * day)
        customerMail(late)
        ahead(null)
        const followUp = waitFor(
            () =>
                rows("mantle.request.support.CaseRelation", {fromRequestId: late, relationTypeEnumId: "CrtFollowUp"})[0]
                    ?.toRequestId
        )
        return {
            late,
            resolved,
            reopened,
            secondClock,
            followUp,
            lateRequest: one("mantle.request.Request", {requestId: late}),
            followUpProfile: followUp ? one("mantle.request.support.CaseProfile", {requestId: followUp}) : null,
            lateDetail: asUser(users.manager, () => lib.page("Cases/CaseDetail", {requestId: late, tab: "overview"}))
        }
    },
    then(r) {
        r.resolved.map(row => row.errors) == ["", ""]
        r.reopened.statusId == "ReqInProgress"
        r.secondClock.length == 1
        r.lateRequest.statusId == "ReqCompleted"
        r.followUp != null
        r.followUpProfile != null
        r.lateDetail.output.includes("Followed up by")
        r.lateDetail.output.includes(r.followUp)
    }
})

feature("auto-close sets the closed date and keeps the status; a rerun changes nothing", {
    when() {
        const policy = system(
            () =>
                Array.from(
                    ec.entity
                        .find("mantle.request.support.ServicePolicy")
                        .condition({organizationPartyId: ids.organizationId})
                        .condition("thruDate", "is-null", null)
                        .orderBy("-fromDate")
                        .list()
                )[0]
        )
        state.defaults = {
            organizationPartyId: ids.organizationId,
            defaultCategoryId: policy.defaultCategoryId,
            caseWorkflowId: policy.caseWorkflowId,
            unknownSenderEnumId: policy.unknownSenderEnumId,
            reopenWindowDays: policy.reopenWindowDays,
            resolutionRequired: policy.resolutionRequired,
            customerImmediateCancel: policy.customerImmediateCancel
        }
        const saved = asUser(
            users.admin,
            () => invoke(S + "save#ServiceDefaults", Object.assign({}, state.defaults, {autoCloseDays: 30})),
            false
        )
        const closing = newCase("Resolved and quiet")
        resolve(closing)
        ahead(31 * day)
        const first = system(() => invoke(S + "close#ResolvedCases", {limit: 2000, requestIds: [closing]}))
        const closedDate = one("mantle.request.support.CaseProfile", {requestId: closing}).closedDate
        const second = system(() => invoke(S + "close#ResolvedCases", {limit: 2000, requestIds: [closing]}))
        ahead(null)
        return {
            saved,
            closing,
            first,
            second,
            closedDate,
            closedAgain: one("mantle.request.support.CaseProfile", {requestId: closing}).closedDate,
            request: one("mantle.request.Request", {requestId: closing}),
            detail: asUser(users.manager, () => lib.page("Cases/CaseDetail", {requestId: closing}))
        }
    },
    then(r) {
        r.saved.servicePolicyId != null
        r.first.closedCount == 1
        r.closedDate != null
        r.request.statusId == "ReqCompleted"
        String(r.closedAgain) == String(r.closedDate)
        r.second.closedCount == 0
        r.second.failedList.length == 0
        r.detail.output.includes("Open a follow-up case")
    }
})
