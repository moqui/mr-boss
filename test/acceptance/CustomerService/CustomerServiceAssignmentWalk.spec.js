// Customer Service P5's "usable when" (impl-customer-service P5: CS-ASSIGNMENT, CS-REPLIES), as an acceptance walk on Retail's
// demo (the Support team: the agent, the warehouse agent and the knowledge author, the manager) through the screens'
// transitions and the services they call: round robin between two eligible agents skips the one outside their hours, and
// two concurrent intakes take two slots; a rule with no eligible agent leaves the case unassigned and tells the manager, and
// a reassignment keeps the clock; the team's saved reply with a tag and a status is previewed on CaseDetail and applied on
// confirmation, a personal reply is its owner's only, and Comms' text blocks still list the agent's own and shared blocks;
// a bulk reply to three customers' cases mails each on its own thread, and a failed delivery retried by its message ID
// sends no second reply. The rules are Mantle's SupportAssignment and SupportReplies specs.
// Run: ./moq accept mr-boss --spec CustomerServiceAssignmentWalk
const lib = ec.resource.script("component://mr-boss/test/CustomerService/CustomerServiceSpecLib.js")
const {ids, users, asUser, system, invoke, refusal} = lib
const webroot = "component://webroot/screen/webroot.xml"
const S = "mantle.request.SupportCaseServices."
const capture = ec.factory.getTool("MailCapture")
const state = {}
// a Mantle service called directly as the user: its own permission and organization checks (the screens call it under
// their own authorization)
const asMantle = (user, action) => asUser(user, action, false)
const one = (entity, conditions) => system(() => ec.entity.find(entity).condition(conditions).one())
const rows = (entity, conditions) => system(() => Array.from(ec.entity.find(entity).condition(conditions).list()))
const assigneeOf = requestId =>
    rows("mantle.request.RequestParty", {requestId, roleTypeId: "Assignee"}).filter(row => !row.thruDate)[0]?.partyId || null
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
const newCase = (queueId, customerPartyId = ids.customerId, name = "Assignment walk case") =>
    asMantle(users.manager, () =>
        invoke(S + "create#Case", {
            organizationPartyId: ids.organizationId,
            customerPartyId,
            requestCategoryId: queueId,
            requestName: name
        })
    ).requestId
// a message once its send commits
function messageOf(emailMessageId) {
    const end = Date.now() + 5000
    let message = one("moqui.basic.email.EmailMessage", {emailMessageId})
    while (message && !["ES_SENT", "ES_BOUNCED"].includes(message.statusId) && message.sendError == null && Date.now() < end)
        message = one("moqui.basic.email.EmailMessage", {emailMessageId})
    return message
}

spec({
    setupSpec() {
        capture.enable()
        // a queue of the Support team for the walk, whose rule gives cases to the agent and the warehouse agent in turn
        state.queue = asMantle(users.admin, () =>
            invoke(S + "save#ServiceQueue", {
                organizationPartyId: ids.organizationId,
                description: "Assignment walk queue",
                responsibleTeamPartyId: ids.supportTeamId
            })
        ).requestCategoryId
        // the warehouse agent's hours: a calendar of the organization with working hours on a day that is not today
        // today's weekday in Chicago (0 Sunday to 6 Saturday, as the working hours take them)
        const today = new Date(Date.now() - 6 * 3600000).getUTCDay()
        state.calendarId = system(() =>
            invoke("create#mantle.work.calendar.Calendar", {
                calendarName: "Walk: warehouse agent's hours",
                ownerPartyId: ids.organizationId,
                calendarKindEnumId: "CalkResource",
                timeZone: "America/Chicago"
            })
        ).calendarId
        // around the clock: a calendar with no working hours. The agents otherwise work on the team's hours (Customer Service
        // P4's demo, weekdays), so a walk run in the evening or at a weekend would find neither agent in hours.
        state.allDayId = system(() =>
            invoke("create#mantle.work.calendar.Calendar", {
                calendarName: "Walk: around the clock",
                ownerPartyId: ids.organizationId,
                calendarKindEnumId: "CalkResource",
                timeZone: "America/Chicago"
            })
        ).calendarId
        asMantle(users.admin, () =>
            invoke("mantle.work.CalendarServices.store#WorkingHours", {
                calendarId: state.calendarId,
                workDays: String((today + 3) % 7),
                workStart: "09:00",
                workEnd: "17:00",
                timeZone: "America/Chicago"
            })
        )
    },
    cleanupSpec() {
        capture.reset()
        ec.message.clearErrors()
        // the agents back on the team's hours
        for (const partyId of ["BOSS_CS_AGENT", "BOSS_CS_AGENT_WH"])
            post(users.manager, "Settings/AgentTeams/saveParticipation", {
                organizationPartyId: ids.organizationId,
                teamPartyId: ids.supportTeamId,
                partyId,
                calendarId: ""
            })
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("round robin between two agents skips the one outside their hours; two intakes at once take two slots", {
    when() {
        const saved = post(users.admin, "Settings/AssignmentRules/saveRule", {
            organizationPartyId: ids.organizationId,
            requestCategoryId: state.queue,
            ruleName: "Walk round robin",
            distributionEnumId: "AdRoundRobin",
            eligiblePartyIds: "BOSS_CS_AGENT,BOSS_CS_AGENT_WH",
            respectSchedule: "Y",
            sequenceNum: "10"
        })
        post(users.manager, "Settings/AgentTeams/saveParticipation", {
            organizationPartyId: ids.organizationId,
            teamPartyId: ids.supportTeamId,
            partyId: "BOSS_CS_AGENT",
            assignmentEligible: "Y",
            calendarId: state.allDayId
        })
        const participation = post(users.manager, "Settings/AgentTeams/saveParticipation", {
            organizationPartyId: ids.organizationId,
            teamPartyId: ids.supportTeamId,
            partyId: "BOSS_CS_AGENT_WH",
            assignmentEligible: "Y",
            calendarId: state.calendarId
        })
        const outside = [newCase(state.queue), newCase(state.queue)].map(assigneeOf)
        // back in hours (around the clock), two intakes at once
        post(users.manager, "Settings/AgentTeams/saveParticipation", {
            organizationPartyId: ids.organizationId,
            teamPartyId: ids.supportTeamId,
            partyId: "BOSS_CS_AGENT_WH",
            assignmentEligible: "Y",
            calendarId: state.allDayId
        })
        const parallelIds = parallel(
            2,
            (thread, args) => {
                login(args.user)
                ec.artifactExecution.disableAuthz()
                return call(args.service, {
                    organizationPartyId: args.org,
                    customerPartyId: args.customer,
                    requestCategoryId: args.queue,
                    requestName: "Walk parallel " + thread
                }).requestId
            },
            {
                user: users.manager,
                service: S + "create#Case",
                org: ids.organizationId,
                customer: ids.customerId,
                queue: state.queue
            },
            {transaction: false}
        )
        return {saved, participation, outside, together: parallelIds.map(assigneeOf)}
    },
    then(r) {
        r.saved.errors == ""
        r.participation.errors == ""
        r.outside == ["BOSS_CS_AGENT", "BOSS_CS_AGENT"]
        r.together.includes("BOSS_CS_AGENT")
        r.together.includes("BOSS_CS_AGENT_WH")
    }
})

feature("a rule with no eligible agent leaves the case unassigned and tells the manager; a reassignment keeps the clock", {
    when() {
        const rules = asUser(users.admin, () =>
            invoke("ironstone.customerservice.AssignmentServices.find#Rules", {appRoot: "CustomerService"})
        )
        const rule = rules.rules.find(row => row.ruleName == "Walk round robin")
        post(users.admin, "Settings/AssignmentRules/saveRule", {
            assignmentRuleId: rule.assignmentRuleId,
            organizationPartyId: ids.organizationId,
            requestCategoryId: state.queue,
            ruleName: "Walk round robin",
            distributionEnumId: "AdRoundRobin",
            eligiblePartyIds: "BOSS_CS_AGENT_WH",
            respectSchedule: "Y",
            maxOpenCases: "1"
        })
        const unassigned = newCase(state.queue)
        const told = rows("moqui.security.user.NotificationMessage", {topic: "SupportCaseUnassigned"}).filter(row =>
            String(row.messageJson || "").includes(unassigned)
        )
        // the thermostat-like case of the Support queue moved into the walk queue: no one eligible, its clocks as they were
        const moved = newCase(ids.supportQueueId)
        const clocks = () =>
            rows("mantle.request.support.CaseSlaEpisode", {requestId: moved}).map(row => row.caseSlaEpisodeId + "|" + row.dueDate)
        const before = clocks()
        const move = post(users.manager, "Cases/CaseDetail/updateCase", {requestId: moved, requestCategoryId: state.queue})
        return {
            unassigned: assigneeOf(unassigned),
            outcome: one("mantle.request.support.CaseProfile", {requestId: unassigned}).assignmentOutcomeEnumId,
            told,
            before,
            after: clocks(),
            move
        }
    },
    then(r) {
        r.unassigned == null
        r.outcome == "AoNoAgent"
        r.told.length == 1
        r.move.errors == ""
        r.before.length > 0
        r.after == r.before
    }
})

feature(
    "the team's reply with a tag and a status is previewed on CaseDetail and applied on confirmation; a personal reply is its owner's",
    {
        when() {
            capture.clear()
            state.replyCase = newCase(ids.supportQueueId)
            const preview = asUser(users.agent, () =>
                lib.page("Cases/CaseDetail", {requestId: state.replyCase, tab: "reply", replyBlockId: "BOSS_CS_REPLY_DETAILS"})
            )
            const shown = asMantle(users.agent, () =>
                invoke(S + "preview#SavedReply", {requestId: state.replyCase, emailTextBlockId: "BOSS_CS_REPLY_DETAILS"})
            ).preview
            const applied = post(users.agent, "Cases/CaseDetail/applyCaseReply", {
                requestId: state.replyCase,
                replyBlockId: "BOSS_CS_REPLY_DETAILS",
                replyBody: shown.bodyHtml,
                replySubject: shown.subject,
                caseRevision: shown.caseRevision,
                operationKey: "walk-reply-" + state.replyCase,
                send: "Y"
            })
            const personal = asMantle(users.manager, () =>
                refusal(S + "preview#SavedReply", {requestId: state.replyCase, emailTextBlockId: "BOSS_CS_REPLY_PATIENCE"})
            )
            const comms = asUser(
                users.agent,
                () =>
                    Array.from(invoke("org.moqui.mail.EmailClientServices.find#EmailTextBlocks", {}).textBlockList || []).map(
                        row => row.emailTextBlockId
                    ),
                false
            )
            return {
                preview,
                applied,
                request: one("mantle.request.Request", {requestId: state.replyCase}),
                tags: rows("mantle.request.RequestTag", {requestId: state.replyCase}).map(row => row.tagEnumId),
                personal,
                comms
            }
        },
        then(r) {
            r.preview.status == 200
            r.preview.errors == []
            r.preview.output.includes("Thank you for contacting")
            r.preview.output.includes("Set the status to Waiting for customer")
            r.applied.errors == ""
            r.request.statusId == "ReqWaitingCustomer"
            r.tags.includes("RtgFollowUp")
            r.personal.includes("REPLY_UNAVAILABLE")
            r.comms.includes("BOSS_CS_REPLY_PATIENCE")
            r.comms.includes("BOSS_CS_REPLY_DETAILS")
        }
    }
)

feature("a bulk reply mails each of three customers on its own thread; a failed delivery is retried by its message ID", {
    when() {
        const caseIds = [ids.customerId, ids.companyCustomerId, ids.sharedCustomerId].map(customer =>
            newCase(ids.supportQueueId, customer, "Walk bulk case")
        )
        capture.clear()
        const sent = post(users.agent, "Cases/BulkReply/applyBulkReply", {
            requestIds: caseIds.join(","),
            emailTextBlockId: "BOSS_CS_REPLY_PATIENCE",
            operationKey: "walkbulk1"
        })
        const messages = caseIds.map(
            requestId =>
                JSON.parse(one(lib_operation(), {operationKey: "walkbulk1-" + requestId})?.resultJson || "{}").emailMessageId
        )
        messages.forEach(messageOf)
        const captured = capture.getMessages().filter(row => String(row.subject).includes("Walk bulk case"))
        // a fourth case whose send fails, then the same bulk key again: the same message goes, no second reply
        const failedCase = newCase(ids.supportQueueId, ids.customerId, "Walk failed case")
        capture.disable()
        try {
            post(users.agent, "Cases/BulkReply/applyBulkReply", {
                requestIds: failedCase,
                emailTextBlockId: "BOSS_CS_REPLY_PATIENCE",
                operationKey: "walkbulk2"
            })
            const first = JSON.parse(
                one(lib_operation(), {operationKey: "walkbulk2-" + failedCase})?.resultJson || "{}"
            ).emailMessageId
            messageOf(first)
        } finally {
            capture.enable()
        }
        const failedId = JSON.parse(
            one(lib_operation(), {operationKey: "walkbulk2-" + failedCase})?.resultJson || "{}"
        ).emailMessageId
        const failed = one("moqui.basic.email.EmailMessage", {emailMessageId: failedId})
        capture.clear()
        post(users.agent, "Cases/BulkReply/applyBulkReply", {
            requestIds: failedCase,
            emailTextBlockId: "BOSS_CS_REPLY_PATIENCE",
            operationKey: "walkbulk2"
        })
        const resent = messageOf(failedId)
        return {
            sent,
            messages,
            captured,
            failedError: failed?.sendError || null,
            resent,
            resentCount: capture.count(),
            replies: rows("moqui.basic.email.EmailMessage", {emailAccountId: ids.serviceMailAccountId}).filter(row =>
                String(row.subject || "").includes(failedCase)
            ).length
        }
    },
    then(r) {
        r.sent.errors == ""
        new Set(r.messages).size == 3
        r.captured.length == 3
        r.captured.every(row => row.toList.length == 1)
        r.failedError != null
        r.resent.statusId == "ES_SENT"
        r.resentCount == 1
        r.replies == 1
    }
})

function lib_operation() {
    return "mantle.ledger.transaction.PostingOperation"
}
