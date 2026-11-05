// Customer Service P13's "usable when" (impl-customer-service P13), as an acceptance walk with artifact authorization on where
// a person acts: the administrator makes a feedback form in FeedbackForms (a copy of Retail's), publishes it in
// FeedbackFormDetail and sends it from ServiceDefaults' Feedback delivery; resolving a case of Joe Q Public makes one
// invitation, which the send job mails only after the delay, once; the customer's page reads the form and the customer's
// label, never the case, and an expired or withdrawn link only guidance; Joe rates 2 with a comment, a repeat answers the first;
// the low score makes the follow-up, assigned to the Support team's manager and told to them, which the manager records on
// ResponseDetail (qvt) while the framework's update and delete of the response are refused; an answered question is ended,
// never deleted, and a changed question is a successor from a date, the earlier answer keeping its question; and
// SatisfactionResults shows one effective period at a time. The PASS page's own walk (the scanner's GET, 390 px, the remote
// frontend) is mr-pass's SupportFeedbackHttp and RemoteHttp. Retail's policy goes back to the demo form afterwards.
// Run: ./moq accept mr-boss --spec CustomerServiceFeedbackWalk
const lib = ec.resource.script("component://mr-boss/test/CustomerService/CustomerServiceSpecLib.js")
const {ids, users, asUser, system, invoke, refusal} = lib
const webroot = "component://webroot/screen/webroot.xml"
const F = "mantle.request.CaseFeedbackServices.",
    B = "ironstone.customerservice.FeedbackServices.",
    S = "mantle.request.SupportCaseServices."
const INVITATION = "mantle.party.FormInvitation"
const state = {}
const one = (entity, conditions) => system(() => ec.entity.find(entity).condition(conditions).one())
const rows = (entity, conditions) => system(() => Array.from(ec.entity.find(entity).condition(conditions).list()))
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
function waitFor(read, millis = 5000) {
    const end = Date.now() + millis
    let value = read()
    while (!value && Date.now() < end) value = read()
    return value
}
// a PASS page operation as the facade calls it: its result, or the error kind
function pageCall(service, input) {
    try {
        return system(
            () => ec.service.sync().throwOnError(true).name(service).parameters({input}).requireNewTransaction(true).call().result
        )
    } catch (error) {
        ec.message.clearErrors()
        return {kind: error.moquiErrorKind || "Error", message: String(error.message)}
    }
}
// a link of the invitation with a token the walk knows (the send job's is mailed, never kept)
function link(invitationId, value, thruMs = 7 * 86400000, revoked = false) {
    system(() =>
        ec.service
            .sync()
            .name("create#mantle.party.ExternalAccessCapability")
            .parameters({
                organizationPartyId: ids.organizationId,
                partyId: ids.customerId,
                recordType: "FormInvitation",
                recordId: invitationId,
                scopes: "CaseFeedback",
                tokenDigest: ec.user.singleUseCodeHash(value),
                fromDate: new Date(Date.now() - 86400000),
                thruDate: new Date(Date.now() + thruMs),
                revokedDate: revoked ? ec.user.nowTimestamp : null
            })
            .call()
    )
    return value
}
const token = name => ("CsFeedbackWalk" + name + "0".repeat(48)).slice(0, 48)

spec({
    setupSpec() {
        state.demoPolicy = system(() =>
            ec.resource.script("component://mr-mantle/service/mantle/request/CaseFeedback.js").policyAt(ids.organizationId)
        )
    },
    cleanupSpec() {
        ec.user.setEffectiveTime(null)
        // Retail's policy back to the demo form, as the demo made it
        if (state.demoPolicy)
            asUser(
                users.admin,
                () =>
                    invoke(F + "save#InvitationPolicy", {
                        organizationPartyId: ids.organizationId,
                        formId: state.demoPolicy.formId,
                        delayMinutes: state.demoPolicy.delayMinutes,
                        frequencyEnumId: state.demoPolicy.frequencyEnumId,
                        tokenDays: state.demoPolicy.tokenDays,
                        reminderCount: state.demoPolicy.reminderCount,
                        reminderDays: state.demoPolicy.reminderDays,
                        lowScoreThreshold: state.demoPolicy.lowScoreThreshold,
                        followUpTeamPartyId: state.demoPolicy.followUpTeamPartyId,
                        followUpDays: state.demoPolicy.followUpDays,
                        changeReason: "Back to the demo form"
                    }),
                false
            )
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("the administrator copies Retail's form, publishes it and sends it from Service defaults", {
    when() {
        const made = post(users.admin, "Settings/FeedbackForms/createForm", {
            organizationPartyId: ids.organizationId,
            description: "Walk feedback",
            sourceFormId: state.demoPolicy.formId
        })
        const form = rows("moqui.screen.form.DbForm", {ownerPartyId: ids.organizationId, description: "Walk feedback"})[0]
        state.formId = form.formId
        const published = post(users.admin, "Settings/FeedbackFormDetail/publishForm", {formId: form.formId})
        const sent = post(users.admin, "Settings/ServiceDefaults/saveFeedbackPolicy", {
            organizationPartyId: ids.organizationId,
            formId: form.formId,
            delayMinutes: "60",
            frequencyEnumId: "FdfPerCase",
            tokenDays: "14",
            reminderCount: "1",
            reminderDays: "3",
            lowScoreThreshold: "2",
            followUpTeamPartyId: ids.supportTeamId,
            followUpDays: "2",
            changeReason: "Walk"
        })
        const detail = asUser(users.admin, () => lib.page("Settings/FeedbackFormDetail", {formId: form.formId}))
        return {made, published, sent, detail}
    },
    then({made, published, sent, detail}) {
        made.errors == ""
        published.errors == ""
        sent.errors == ""
        detail.errors.length == 0
        detail.output.includes("Walk feedback")
        detail.output.includes("Sent for resolved cases") || detail.output.includes("sent for resolved cases")
    }
})

feature("resolving Joe's case makes one invitation, mailed only after the delay and once", {
    when() {
        // the services as the case screens call them (Mantle's raw services take no artifact grant of their own)
        const created = asUser(
            users.agent,
            () =>
                invoke(S + "create#Case", {
                    organizationPartyId: ids.organizationId,
                    customerPartyId: ids.customerId,
                    requestCategoryId: ids.supportQueueId,
                    requestName: "Feedback walk: thermostat battery cover missing"
                }),
            false
        )
        state.requestId = created.requestId
        asUser(
            users.manager,
            () =>
                invoke(S + "transition#Case", {
                    requestId: state.requestId,
                    toStatusId: "ReqCompleted",
                    resolutionEnumId: "RrCompleted"
                }),
            false
        )
        const invitation = waitFor(
            () => rows(INVITATION, {recordEntityName: "mantle.request.Request", recordId: state.requestId})[0]
        )
        state.invitationId = invitation.invitationId
        const early = system(() => invoke(F + "send#Invitations", {invitationIds: state.invitationId}))
        ec.user.setEffectiveTime(Date.now() + 61 * 60000)
        const due = system(() => invoke(F + "send#Invitations", {invitationIds: state.invitationId}))
        const again = system(() => invoke(F + "send#Invitations", {invitationIds: state.invitationId}))
        ec.user.setEffectiveTime(null)
        const sent = one(INVITATION, {invitationId: state.invitationId})
        const twice = system(() => invoke(F + "create#Invitation", {requestId: state.requestId}))
        return {invitation, early, due, again, sent, twice}
    },
    then({invitation, early, due, again, sent, twice}) {
        invitation.formId == state.formId
        invitation.emailAddress == "joe@public.com"
        early.sent == 0
        due.sent == 1
        again.sent == 0
        sent.statusEnumId == "FinSent"
        sent.emailMessageId != null
        twice.reason == "ALREADY_INVITED"
    }
})

feature(
    "Joe's page reads the form, never the case; he rates 2 with a comment, a repeat answers the first; bad links guide only",
    {
        when() {
            const open = link(state.invitationId, token("Open"))
            const expired = link(state.invitationId, token("Expired"), -1000)
            const withdrawn = link(state.invitationId, token("Withdrawn"), 86400000, true)
            const read = pageCall(F + "get#Invitation", {siteId: "ZIZI_PORTAL", token: open})
            const bad = [expired, withdrawn, "x".repeat(48)].map(
                value => pageCall(F + "get#Invitation", {siteId: "ZIZI_PORTAL", token: value}).kind
            )
            const rated = pageCall(F + "submit#CaseFeedback", {
                siteId: "ZIZI_PORTAL",
                token: open,
                values: {rating: "2", reason: "speed", comment: "Three days for a reply", contactOk: "Y"}
            })
            const repeat = pageCall(F + "submit#CaseFeedback", {siteId: "ZIZI_PORTAL", token: open, values: {rating: "5"}})
            const invitation = one(INVITATION, {invitationId: state.invitationId})
            state.formResponseId = invitation.formResponseId
            return {read, bad, rated, repeat, invitation}
        },
        then({read, bad, rated, repeat, invitation}) {
            read.invitation.customerName.includes("Joe")
            !JSON.stringify(read).includes(state.requestId)
            !JSON.stringify(read).includes("battery cover")
            bad.join() == "NotFound,NotFound,NotFound"
            rated.receipt.scoreText == "2 of 5"
            repeat.alreadyApplied == true
            invitation.score == 2
        }
    }
)

feature(
    "the low score's follow-up goes to the team's manager, who records it on ResponseDetail; the response cannot be changed",
    {
        when() {
            const followUp = rows("mantle.request.support.FeedbackFollowUp", {invitationId: state.invitationId})[0]
            const notified = rows("moqui.security.user.NotificationMessage", {topic: "CaseFeedbackFollowUp"}).some(row =>
                String(row.messageJson).includes(followUp.followUpId)
            )
            const detail = asUser(users.manager, () => lib.page("Reports/ResponseDetail", {formResponseId: state.formResponseId}))
            const recorded = post(users.manager, "Reports/ResponseDetail/recordFollowUp", {
                formResponseId: state.formResponseId,
                actionEnumId: "FfaCall",
                statusEnumId: "FfsDone",
                note: "Called Joe; a cover ships today"
            })
            const after = one("mantle.request.support.FeedbackFollowUp", {followUpId: followUp.followUpId})
            const D = "org.moqui.impl.ScreenServices."
            const update = system(() =>
                refusal(D + "update#FormResponse", {formResponseId: state.formResponseId, responseMap: {rating: "5"}})
            )
            const remove = system(() => refusal(D + "delete#FormResponse", {formResponseId: state.formResponseId}))
            return {followUp, notified, detail, recorded, after, update, remove}
        },
        then({followUp, notified, detail, recorded, after, update, remove}) {
            followUp.score == 2
            followUp.teamPartyId == ids.supportTeamId
            followUp.assigneePartyId != null
            notified == true
            detail.errors.length == 0
            detail.output.includes("Rated 2 of 5")
            detail.output.includes("Three days for a reply")
            detail.output.includes("Follow up")
            recorded.errors == ""
            after.statusEnumId == "FfsDone"
            String(after.note).includes("a cover ships today")
            update.includes("RESPONSE_LOCKED")
            remove.includes("RESPONSE_LOCKED")
        }
    }
)

feature("an answered question is ended, not deleted; a changed question is a successor from a date; results compare one period", {
    when() {
        const D = "org.moqui.impl.ScreenServices."
        const deleted = system(() => refusal(D + "delete#DbFormField", {formId: state.formId, fieldName: "reason"}))
        const ended = asUser(
            users.admin,
            () => refusal(F + "end#FeedbackFormPart", {formId: state.formId, part: "field", fieldName: "reason"}),
            false
        )
        const changed = asUser(
            users.admin,
            () =>
                invoke(F + "save#FeedbackFormField", {
                    formId: state.formId,
                    fieldName: "rating",
                    title: "How well did we solve it?",
                    fieldTypeEnumId: "DBFFT_radio",
                    isRequired: "Y",
                    optionText: "1 | 1 - Badly\n2 | 2\n3 | 3\n4 | 4\n5 | 5 - Very well",
                    fromDate: new Date(Date.now() + 2000)
                }),
            false
        )
        // the answer keeps the question it answered
        const answer = asUser(users.manager, () =>
            invoke(B + "get#CaseResponse", {appRoot: "CustomerService", formResponseId: state.formResponseId})
        )
        ec.user.setEffectiveTime(Date.now() + 5000)
        const results = asUser(users.manager, () =>
            invoke(B + "find#CaseResponses", {appRoot: "CustomerService", formId: state.formId})
        )
        // the period the answer's invitation is in: an earlier one
        const earlier = results.periodOptions
            .slice(1)
            .map(option =>
                asUser(users.manager, () =>
                    invoke(B + "find#CaseResponses", {appRoot: "CustomerService", formId: state.formId, periodId: option.value})
                )
            )
            .find(found => found.rows.some(row => row.requestId == state.requestId))
        const page = asUser(users.manager, () => lib.page("Reports/SatisfactionResults", {formId: state.formId}))
        ec.user.setEffectiveTime(null)
        return {deleted, ended, changed, answer, results, earlier, page}
    },
    then({deleted, ended, changed, answer, results, earlier, page}) {
        deleted != ""
        ended == ""
        changed.successor == true
        answer.response.answers.find(row => row.fieldName == "rating").title ==
            "How satisfied are you with how we handled your request?"
        answer.response.answers.some(row => row.fieldName == "reason")
        results.periodOptions.length >= 2
        !results.rows.some(row => row.requestId == state.requestId)
        earlier.rows.some(row => row.requestId == state.requestId && row.scoreText == "2 / 5")
        page.errors.length == 0
        page.output.includes("Version")
    }
})
