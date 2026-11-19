// Customer Service channels (impl-customer-service P6, CS-CHANNELS, CS-STACK L8; ironstone.customerservice.ChannelServices,
// Channels.js): ChannelRouting's read of the demo routes, a mail rule naming the queue and a request held for review; the
// Comms hook making a case from a customer's mail in the service mailbox (timed by its received date, the mail on it) and
// refusing one from staff; ChannelSessions' customer audience leaving out an internal call, with the case linked, and its
// one render (qvt); the call-context provider answering the caller's open cases to the agent and nothing to another
// organization's; the acknowledgement text options (the user's own blocks and their organization's service groups', and
// each route's present block, SEC-BAP-81). The Mantle rules (routes, intake, calls, the review) are Mantle's SupportChannels spec; the usable-when
// is the acceptance CustomerServiceChannelsWalk.
// Run: ./moq test mr-boss --spec CustomerService/CustomerServiceChannels
const lib = ec.resource.script("component://mr-boss/test/CustomerService/CustomerServiceSpecLib.js")
const {ids, users, asUser, system, refusal, invoke} = lib
const C = "ironstone.customerservice.ChannelServices."
const state = {}
const receivedAt = Math.floor((Date.now() - 3 * 3600000) / 1000) * 1000
const ms = value =>
    value == null
        ? null
        : typeof value === "number"
          ? value
          : /^\d+$/.test(String(value))
            ? Number(value)
            : new Date(value).getTime()

// a received message in Retail's service mailbox
let count = 0
function receive(fields) {
    count++
    const id = "CSCH_MSG_" + count + "_" + receivedAt
    system(() =>
        ec.service
            .sync()
            .name("store#moqui.basic.email.EmailMessage")
            .parameters(
                Object.assign(
                    {
                        emailMessageId: id,
                        emailAccountId: ids.serviceMailAccountId,
                        statusId: "ES_RECEIVED",
                        contentType: "text/plain",
                        messageDate: new Date(receivedAt),
                        receivedDate: new Date(receivedAt),
                        toAddresses: "service@retail.example",
                        isRead: "N",
                        hasAttachment: "N",
                        messageId: "<csch-" + id + "@example.com>",
                        rootEmailMessageId: id
                    },
                    fields
                )
            )
            .call()
    )
    return id
}

spec({
    setupSpec() {
        login("john.doe")
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("ChannelRouting reads the demo routes, a mail rule naming the queue and a request held for review", {
    when() {
        // a Comms rule of the service mailbox filing into the Support queue, and an unknown sender's mail held by it
        system(() =>
            invoke("store#moqui.basic.email.EmailRule", {
                emailRuleId: "CSCH_RULE",
                ownerUserId: "BOSS_CS_ADMIN",
                emailAccountId: ids.serviceMailAccountId,
                ruleName: "Support intake",
                sequenceNum: 0,
                enabled: "Y",
                matchAllEnumId: "ErmAll",
                stopProcessing: "Y",
                conditionsJson: "[]",
                actionsJson: JSON.stringify([{action: "createRequest", value: ids.supportQueueId}]),
                matchedCount: 0
            })
        )
        const held = receive({
            fromAddress: "stranger.csch@example.net",
            fromName: "Stan Ger",
            subject: "CSCH who handles returns",
            bodyText: "Hi"
        })
        system(() =>
            invoke("mantle.request.RequestServices.create#RequestFromEmail", {
                emailMessageId: held,
                emailAccountId: ids.serviceMailAccountId,
                ruleOwnerUserId: "BOSS_CS_ADMIN",
                value: ids.supportQueueId
            })
        )
        // the acknowledgement text options (SEC-BAP-81): the manager's own block; an agent's shared with the Customer Service
        // app group the manager is in (no service group: not offered); the team's and Retail's service-wide replies (the
        // manager is in both groups); and the route's present one
        const blocks = {
            CSCH_BLOCK_OWN: {ownerUserId: "BOSS_CS_MANAGER", title: "CSCH own"},
            CSCH_BLOCK_APP: {ownerUserId: "BOSS_CS_AGENT", userGroupId: "BOSS_CUSTOMER_SERVICE", title: "CSCH app group"}
        }
        system(() => {
            for (const [emailTextBlockId, fields] of Object.entries(blocks))
                invoke("store#moqui.basic.email.EmailTextBlock", {
                    emailTextBlockId,
                    bodyHtml: "<p>Case ${requestId}</p>",
                    ...fields
                })
        })
        const routing = asUser(users.manager, () => invoke(C + "find#ServiceRoutes", {appRoot: "CustomerService"}).routing, false)
        // a route's present block is offered on that route's own form only (RouteEdit shows it), not to AddRoute or another
        // route's form, where the manager may not name it
        const route = () => ec.entity.find("mantle.request.support.ServiceRoute").condition("serviceRouteId", ids.mailRouteId)
        system(() => route().updateAll({ackTextBlockId: "CSCH_BLOCK_APP"}))
        const present = asUser(users.manager, () => invoke(C + "find#ServiceRoutes", {appRoot: "CustomerService"}).routing, false)
        system(() => {
            route().updateAll({ackTextBlockId: "BOSS_CS_ACK_SUPPORT"})
            ec.entity
                .find("moqui.basic.email.EmailTextBlock")
                .condition("emailTextBlockId", "in", Object.keys(blocks))
                .deleteAll()
        })
        const values = options => Array.from(options || []).map(option => option.value)
        const routeOf = (found, serviceRouteId) => found.routes.find(row => row.serviceRouteId == serviceRouteId)
        return {
            routing,
            offered: values(routing.textBlockOptions),
            presentOffered: {
                add: values(present.textBlockOptions),
                own: values(routeOf(present, ids.mailRouteId).ackTextBlockOptions),
                other: values(routeOf(present, ids.formRouteId).ackTextBlockOptions)
            }
        }
    },
    then({routing, offered, presentOffered}) {
        offered.includes("CSCH_BLOCK_OWN")
        offered.includes("CSCH_BLOCK_APP") == false
        offered.includes("BOSS_CS_REPLY_DETAILS")
        offered.includes("BOSS_CS_REPLY_FILTERS")
        offered.includes("BOSS_CS_ACK_SUPPORT")
        presentOffered.own.includes("CSCH_BLOCK_APP")
        presentOffered.add.includes("CSCH_BLOCK_APP") == false
        presentOffered.other.includes("CSCH_BLOCK_APP") == false
        routing.organizationPartyId == ids.organizationId
        routing.canEdit == false
        routing.routes.some(row => row.serviceRouteId == ids.mailRouteId && row.acknowledge == "Y" && row.queueText == "Support")
        routing.routes.some(row => row.serviceRouteId == ids.formRouteId && row.rateLimitPerHour == "20")
        routing.rules.some(row => row.emailRuleId == "CSCH_RULE" && row.queueText == "Support")
        // the Support queue's public form token is P15's demo (the Support app's NewCustomerCase); Privacy has none
        routing.tokens.some(row => row.requestCategoryId == ids.supportQueueId && row.active == true)
        routing.tokens.some(row => row.requestCategoryId == ids.privacyQueueId && row.active == false)
        routing.held.some(row => row.requestName == "CSCH who handles returns" && row.reasonText.includes("unknown sender"))
        !routing.routes.some(row => row.requestCategoryId == ids.otherQueueId)
    }
})

feature(
    "Create a case from a customer's mail: a case for the customer timed by its received date, the mail on it; staff's refused",
    {
        when() {
            const mail = receive({
                fromAddress: "joe@public.com",
                fromName: "Joe Q Public",
                subject: "CSCH Thermostat clicks",
                bodyText: "It clicks at night."
            })
            const made = asUser(
                users.agent,
                () => invoke(C + "create#CaseFromMessage", {appRoot: "CustomerService", kind: "email", emailMessageId: mail}),
                false
            )
            state.mailCase = made.recordId
            const again = asUser(
                users.agent,
                () => refusal(C + "create#CaseFromMessage", {appRoot: "CustomerService", kind: "email", emailMessageId: mail}),
                false
            )
            const staffMail = receive({
                fromAddress: "customerservice.manager@example.com",
                subject: "CSCH internal",
                bodyText: "x"
            })
            system(() =>
                invoke("store#moqui.security.UserAccount", {
                    userId: "BOSS_CS_MANAGER",
                    emailAddress: "customerservice.manager@example.com"
                })
            )
            const staff = asUser(
                users.agent,
                () =>
                    refusal(C + "create#CaseFromMessage", {appRoot: "CustomerService", kind: "email", emailMessageId: staffMail}),
                false
            )
            return system(() => ({
                made,
                again,
                staff,
                request: ec.entity.find("mantle.request.Request").condition("requestId", made.recordId).one(),
                profile: ec.entity.find("mantle.request.support.CaseProfile").condition("requestId", made.recordId).one(),
                filed: ec.entity
                    .find("mantle.request.RequestEmailMessage")
                    .condition({requestId: made.recordId, emailMessageId: mail})
                    .count()
            }))
        },
        then({made, again, staff, request, profile, filed}) {
            made.url.includes("Cases/CaseDetail")
            request.salesChannelEnumId == "ScEmail"
            request.requestCategoryId == ids.supportQueueId
            profile != null
            ms(profile.intakeDate) == receivedAt
            filed == 1
            again.includes("ALREADY_FILED")
            staff.includes("CUSTOMER_UNAVAILABLE")
        }
    }
)

feature("ChannelSessions: a customer's calls without the internal one, linked to their case; its one render (qvt)", {
    when() {
        asUser(
            users.agent,
            () => {
                invoke("mantle.request.SupportCaseServices.log#CaseCall", {
                    requestId: state.mailCase,
                    summary: "CSCH walked through the reset",
                    durationMinutes: 6
                })
                invoke("mantle.request.SupportCaseServices.log#CaseCall", {
                    requestId: state.mailCase,
                    summary: "CSCH asked the warehouse",
                    internal: "Y"
                })
            },
            false
        )
        const found = asUser(
            users.agent,
            () =>
                invoke(C + "find#ChannelSessions", {
                    appRoot: "CustomerService",
                    customerPartyId: ids.customerId,
                    channel: "phone"
                }),
            false
        )
        const otherCustomer = asUser(
            users.agent,
            () => refusal(C + "find#ChannelSessions", {appRoot: "CustomerService", customerPartyId: ids.otherCustomerId}),
            false
        )
        const page = asUser(users.agent, () =>
            lib.page("Cases/ChannelSessions", {customerPartyId: ids.customerId, channel: "phone"})
        )
        return {sessions: found.sessions, otherCustomer, page}
    },
    then({sessions, otherCustomer, page}) {
        sessions.some(row => row.requestId == state.mailCase && row.durationText == "6 min" && row.directionText == "Out")
        !sessions.some(row => row.audienceText == "Internal")
        otherCustomer.includes("RECORD_UNAVAILABLE")
        page.status == 200
        page.errors == []
        page.output.includes("Channel sessions")
        page.output.includes("Log a call")
        page.output.includes(state.mailCase)
    }
})

feature("the call-context provider answers the caller's open cases to the agent, and nothing to another organization's", {
    when() {
        const context = user => asUser(user, () => invoke(C + "get#CallContext", {number: "+17022345678"}), false)
        return {agent: context(users.agent), services: context(users.services), short: context(users.agent).recordList}
    },
    then({agent, services}) {
        agent.contactList.length == 0
        agent.recordList.some(row => row.url.includes(ids.thermostatCaseId))
        agent.recordList.every(row => row.url.includes("/qapps/CustomerService/Cases/CaseDetail"))
        services.recordList.length == 0
    }
})
