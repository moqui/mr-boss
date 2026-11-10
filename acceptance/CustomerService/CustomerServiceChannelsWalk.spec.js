// Customer Service P6's "usable when" (impl-customer-service P6), as an acceptance walk through the mail rules, Chat and the
// screens' transitions with artifact authorization on: mail to the support address makes a case in the Support queue timed by
// its received date with one acknowledgement, and a reply in the thread files on the case; an Auto-Submitted reply attaches to
// the case, sends nothing and makes no case, and an unknown sender is held for review and accepted by the manager in
// ChannelRouting; a
// queue's intake token is issued and revoked there, and a project's token still makes a project request through
// RequestIntake's services; a chat message becomes a case on channel ScChat, and the agent logs a call on it; a forum topic
// escalated through PASS's operation lands in the queue by its route, and the agent's previewed public reply posts with no
// private note. The rules are Mantle's SupportChannels and CustomerServiceChannels' specs.
// Run: ./moq accept mr-boss --spec CustomerServiceChannelsWalk
const lib = ec.resource.script("component://mr-boss/test/CustomerService/CustomerServiceSpecLib.js")
const {ids, users, asUser, system, invoke} = lib
const webroot = "component://webroot/screen/webroot.xml"
const F = "mantle.forum.ForumServices."
const state = {}
const receivedAt = Math.floor((Date.now() - 90 * 60000) / 1000) * 1000
const ms = value =>
    value == null
        ? null
        : typeof value === "number"
          ? value
          : /^\d+$/.test(String(value))
            ? Number(value)
            : new Date(value).getTime()
const one = (entity, conditions) => system(() => ec.entity.find(entity).condition(conditions).one())
const all = (entity, conditions) => system(() => Array.from(ec.entity.find(entity).condition(conditions).list()))
// a transition of a screen under an app as the user posts it
function post(user, path, parameters) {
    return asUser(user, () => {
        const rendered = ec.screen
            .makeTest()
            .rootScreen(webroot)
            .render("apps/" + path, parameters, "post")
        let json = null
        try {
            json = JSON.parse(rendered.output)
        } catch (error) {
            json = null
        }
        const result = {status: rendered.status, errors: Array.from(rendered.errorMessages || []).join(" | "), json: json || {}}
        ec.message.clearErrors()
        return result
    })
}
function profileOf(requestId, waitMs = 4000) {
    const end = Date.now() + waitMs
    let profile = one("mantle.request.support.CaseProfile", {requestId})
    while (!profile && Date.now() < end) profile = one("mantle.request.support.CaseProfile", {requestId})
    return profile
}
let count = 0
function receive(fields) {
    count++
    const id = "CSCW_MSG_" + count + "_" + receivedAt
    system(() =>
        invoke(
            "store#moqui.basic.email.EmailMessage",
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
                    messageId: "<cscw-" + id + "@example.com>",
                    rootEmailMessageId: id
                },
                fields
            )
        )
    )
    return id
}
const runRules = idList =>
    system(() =>
        invoke("org.moqui.mail.EmailClientServices.run#EmailRules", {
            emailAccountId: ids.serviceMailAccountId,
            emailMessageIdList: idList
        })
    )
const requestOf = emailMessageId => all("mantle.request.RequestEmailMessage", {emailMessageId})[0]?.requestId || null
const sentOf = requestId =>
    all("mantle.request.RequestEmailMessage", {requestId})
        .map(row => one("moqui.basic.email.EmailMessage", {emailMessageId: row.emailMessageId}))
        .filter(row => row && row.statusId !== "ES_RECEIVED")

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        // the service mailbox's rule: its mail to the support address files into the Support queue
        system(() =>
            invoke("store#moqui.basic.email.EmailRule", {
                emailRuleId: "CSCW_SUPPORT_RULE",
                ownerUserId: "BOSS_CS_ADMIN",
                emailAccountId: ids.serviceMailAccountId,
                ruleName: "Support intake",
                sequenceNum: 0,
                enabled: "Y",
                matchAllEnumId: "ErmAll",
                stopProcessing: "Y",
                conditionsJson: JSON.stringify([{field: "to", operator: "contains", value: "service@retail.example"}]),
                actionsJson: JSON.stringify([{action: "createRequest", value: ids.supportQueueId}]),
                matchedCount: 0
            })
        )
    },
    cleanupSpec() {
        ec.message.clearErrors()
        // the token walk revokes the Support queue's demo form token (Customer Service P15's SUPPORT_TOKENS); the walks
        // after this one (SupportWalk) use it
        system(() => {
            const intake = ec.resource.script("component://mr-boss/service/ironstone/customerservice/SupportDemo.js")
                .SUPPORT_TOKENS.intake
            const demo = one("mantle.party.ExternalAccessCapability", {tokenDigest: ec.user.singleUseCodeHash(intake)})
            if (demo?.revokedDate)
                invoke("update#mantle.party.ExternalAccessCapability", {
                    capabilityId: demo.capabilityId,
                    revokedDate: null,
                    revokedByUserId: null
                })
        })
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("mail to the support address is a case in Support timed by its received date, acknowledged once; a reply files on it", {
    when() {
        const first = receive({
            fromAddress: "joe@public.com",
            fromName: "Joe Q Public",
            subject: "CSCW Thermostat lost its schedule",
            bodyText: "The weekly schedule is gone."
        })
        runRules([first])
        const requestId = requestOf(first)
        state.mailCase = requestId
        state.firstMessage = first
        const profile = profileOf(requestId)
        const firstMessage = one("moqui.basic.email.EmailMessage", {emailMessageId: first})
        const reply = receive({
            fromAddress: "joe@public.com",
            subject: "Re: CSCW Thermostat lost its schedule",
            bodyText: "Also the clock.",
            inReplyTo: firstMessage.messageId,
            referencesHeader: firstMessage.messageId
        })
        runRules([reply])
        return {
            request: one("mantle.request.Request", {requestId}),
            profile,
            clock: one("mantle.request.support.CaseSlaEpisode", {requestId, clockEnumId: "SlcFirstResponse", sequenceNum: 1}),
            sent: sentOf(requestId),
            replyRequest: requestOf(reply)
        }
    },
    then({request, profile, clock, sent, replyRequest}) {
        request.requestCategoryId == ids.supportQueueId
        request.salesChannelEnumId == "ScEmail"
        profile != null
        ms(profile.intakeDate) == receivedAt
        ms(clock.startDate) == receivedAt
        clock.stateEnumId == "SlsRunning"
        sent.length == 1
        sent[0].bodyText.includes("Your case " + request.requestId)
        replyRequest == request.requestId
    }
})

feature(
    "an Auto-Submitted reply attaches and sends nothing; an unknown sender is held, then accepted as a case in ChannelRouting",
    {
        when() {
            const firstMessage = one("moqui.basic.email.EmailMessage", {emailMessageId: state.firstMessage})
            const casesBefore = all("mantle.request.Request", {requestCategoryId: ids.supportQueueId}).length
            const auto = receive({
                fromAddress: "joe@public.com",
                subject: "Automatic reply: away",
                bodyText: "Away.",
                inReplyTo: firstMessage.messageId,
                headersString: "Auto-Submitted: auto-replied"
            })
            runRules([auto])
            const unknown = receive({
                fromAddress: "dee.cscw@example.net",
                fromName: "Dee Newcomer",
                subject: "CSCW Do you ship to Canada",
                bodyText: "Before I order."
            })
            runRules([unknown])
            const heldId = requestOf(unknown)
            const heldProfile = profileOf(heldId, 400)
            const routing = asUser(users.admin, () =>
                lib.page("Settings/ChannelRouting", {organizationPartyId: ids.organizationId})
            )
            const accepted = post(users.manager, "CustomerService/Settings/ChannelRouting/reviewHeld", {
                requestId: heldId,
                decision: "accept",
                organizationPartyId: ids.organizationId
            })
            return {
                autoRequest: requestOf(auto),
                sent: sentOf(state.mailCase).length,
                casesAfterAuto: all("mantle.request.Request", {requestCategoryId: ids.supportQueueId}).length - 1,
                casesBefore,
                heldProfile,
                routing,
                accepted,
                acceptedProfile: one("mantle.request.support.CaseProfile", {requestId: heldId})
            }
        },
        then(r) {
            r.autoRequest == state.mailCase
            r.sent == 1
            // the held request is the only new one in the queue; the automatic reply made none
            r.casesAfterAuto == r.casesBefore
            r.heldProfile == null
            r.routing.errors == []
            r.routing.output.includes("CSCW Do you ship to Canada")
            r.accepted.errors == ""
            r.acceptedProfile != null
        }
    }
)

feature("a queue's intake token is issued and revoked in ChannelRouting; a project's token still makes a project request", {
    when() {
        const issued = post(users.admin, "CustomerService/Settings/ChannelRouting/issueToken", {
            requestCategoryId: ids.supportQueueId,
            organizationPartyId: ids.organizationId
        })
        const active = () =>
            all("mantle.party.ExternalAccessCapability", {recordType: "RequestCategory", recordId: ids.supportQueueId}).filter(
                row => !row.revokedDate
            )
        const afterIssue = active().length
        const agentIssue = post(users.agent, "CustomerService/Settings/ChannelRouting/issueToken", {
            requestCategoryId: ids.supportQueueId
        })
        const removed = post(users.admin, "CustomerService/Settings/ChannelRouting/removeToken", {
            requestCategoryId: ids.supportQueueId,
            organizationPartyId: ids.organizationId
        })
        const project = system(() =>
            invoke("mantle.request.RequestServices.check#IntakeToken", {token: "BossDemoIronIntakeForm1", routeName: "r"})
        )
        const made = system(() =>
            invoke("mantle.request.RequestServices.create#IntakeRequest", {
                token: "BossDemoIronIntakeForm1",
                firstName: "Pia",
                lastName: "Project",
                emailAddress: "pia.cscw@example.org",
                requestName: "CSCW project form",
                description: "Still works."
            })
        )
        return {
            issued,
            afterIssue,
            agentIssue,
            removed,
            afterRemove: active().length,
            project,
            made,
            projectRequest: one("mantle.request.Request", {requestId: made.requestId})
        }
    },
    then(r) {
        r.issued.errors == ""
        r.afterIssue == 1
        r.agentIssue.errors != ""
        r.removed.errors == ""
        r.afterRemove == 0
        r.project.valid == true
        r.projectRequest.rootWorkEffortId != null
        r.projectRequest.requestCategoryId == null
    }
})

feature("a customer's chat message becomes a case on channel ScChat, and the agent logs a call on it from CaseDetail", {
    when() {
        const room = asUser(
            "joe@public.com",
            () =>
                invoke("org.moqui.chat.ChatServices.create#Room", {
                    roomName: "Joe and service",
                    memberUserIdList: ["BOSS_CS_AGENT"]
                }),
            false
        )
        const sent = asUser(
            "joe@public.com",
            () =>
                invoke("org.moqui.chat.ChatServices.send#Message", {
                    chatRoomId: room.chatRoomId,
                    body: "<p>CSCW my filter order never came</p>"
                }),
            false
        )
        const made = post(users.agent, "Comms/Chat/createFrom", {
            chatRoomId: room.chatRoomId,
            eventSeq: sent.eventSeq,
            kind: "case"
        })
        const requestId = made.json.recordId
        const logged = post(users.agent, "CustomerService/Cases/CaseDetail/logCaseCall", {
            requestId,
            returnRequestId: requestId,
            summary: "CSCW called Joe: the order ships Monday",
            durationMinutes: "4",
            direction: "out",
            outcomeEnumId: "CcoReached"
        })
        return {
            made,
            request: one("mantle.request.Request", {requestId}),
            profile: one("mantle.request.support.CaseProfile", {requestId}),
            logged,
            calls: all("mantle.request.RequestCommEvent", {requestId}).map(row =>
                one("mantle.party.communication.CommunicationEvent", {communicationEventId: row.communicationEventId})
            )
        }
    },
    then({made, request, profile, logged, calls}) {
        made.errors == ""
        request.salesChannelEnumId == "ScChat"
        request.requestCategoryId == ids.supportQueueId
        profile != null
        calls.some(event => event.communicationEventTypeId == "Chat")
        logged.errors == ""
        calls.some(event => event.communicationEventTypeId == "Phone" && String(event.body).includes("ships Monday"))
    }
})

feature(
    "a forum topic escalated through PASS lands in Support, held for a member who is no customer until accepted; the agent's previewed public reply posts, no private note",
    {
        when() {
            const forum = (name, input) =>
                invoke(name, {
                    input: /publish#Post$|create#CaseFromTopic$|store#Category$/.test(name)
                        ? Object.assign({operationId: ec.user.randomString(32)}, input)
                        : input
                }).result
            // a published site the agent runs, with a public category and a member's topic
            const site = system(() => {
                const siteId = forum("mantle.public.SiteServices.create#Site", {
                    name: "Retail community",
                    ownerPartyId: "BOSS_CS_AGENT"
                }).siteId
                forum("mantle.public.SiteServices.update#Site", {siteId, state: "published", expectedRevision: 1})
                return siteId
            })
            const categoryId = asUser(
                users.agent,
                () => forum(F + "store#Category", {siteId: site, name: "Help"}).contactListId,
                false
            )
            asUser(
                users.agent,
                () =>
                    forum(F + "set#CategoryAccess", {
                        siteId: site,
                        contactListId: categoryId,
                        visibility: "public",
                        publicationState: "published",
                        expectedRevision: 1,
                        confirm: true
                    }),
                false
            )
            const poster = system(() => {
                const partyId = invoke("mantle.party.PartyServices.create#Person", {firstName: "Rae", lastName: "Member"}).partyId
                invoke("mantle.party.PartyServices.create#PartyUserAccount", {
                    partyId,
                    username: "cscw.member",
                    emailAddress: "rae.cscw@example.test",
                    newPassword: "moqui1!!",
                    newPasswordVerify: "moqui1!!"
                })
                const at = Date.now()
                invoke("create#mantle.public.PublicSiteParty", {
                    siteId: site,
                    partyId,
                    state: "active",
                    role: "member",
                    joinedAt: at,
                    revision: 1
                })
                invoke("create#mantle.public.PublicSiteProfile", {
                    siteId: site,
                    partyId,
                    handle: "rae",
                    displayName: "rae",
                    discoverability: "members",
                    revision: 1
                })
                for (const member of [partyId, "BOSS_CS_AGENT"]) {
                    invoke("create#mantle.marketing.contact.ContactListParty", {
                        contactListId: categoryId,
                        partyId: member,
                        statusId: "CLPT_ACCEPTED",
                        fromDate: at - 1000
                    })
                    invoke("store#mantle.forum.ForumMemberState", {
                        siteId: site,
                        partyId: member,
                        trustLevel: "basic",
                        approvedContributions: 10,
                        dailyTopics: 0,
                        dailyReplies: 0,
                        revision: 1
                    })
                }
                return partyId
            })
            login("cscw.member", "moqui1!!")
            const rootId = forum(F + "publish#Post", {
                siteId: site,
                contactListId: categoryId,
                title: "CSCW app will not pair",
                body: "<p>Pairing fails</p>"
            }).rootCommEventId
            login("john.doe")
            const route = post(users.admin, "CustomerService/Settings/ChannelRouting/saveRoute", {
                requestCategoryId: ids.supportQueueId,
                channelEnumId: "SrcForum",
                siteId: site,
                forumContactListId: categoryId,
                organizationPartyId: ids.organizationId
            })
            const created = asUser(
                users.agent,
                () =>
                    forum(F + "create#CaseFromTopic", {
                        siteId: site,
                        rootCommEventId: rootId,
                        postIds: [rootId],
                        reason: "Pairing fault"
                    }),
                false
            )
            const requestId = created.requestId
            // a public member who is no customer of Retail: held for review, and the manager accepts the member as customer
            const heldRole = one("mantle.party.PartyRole", {partyId: poster, roleTypeId: "Customer"})
            const accepted = post(users.manager, "CustomerService/Settings/ChannelRouting/reviewHeld", {
                requestId,
                decision: "accept",
                organizationPartyId: ids.organizationId
            })
            profileOf(requestId)
            const body = "<p>CSCW reset the hub, then pair again.</p>"
            const preview = asUser(users.agent, () =>
                lib.page("Cases/CaseDetail", {requestId, tab: "conversation", forumReplyBody: body})
            )
            const hash = asUser(
                users.agent,
                () => forum(F + "preview#CaseReply", {siteId: site, rootCommEventId: rootId, requestId, body}).previewHash,
                false
            )
            const published = post(users.agent, "CustomerService/Cases/CaseDetail/publishForumReply", {
                requestId,
                forumReplyBody: body,
                previewHash: hash,
                operationId: "cscw-" + requestId
            })
            // the topic as its member reads it
            login("cscw.member", "moqui1!!")
            const posts = forum(F + "get#Posts", {siteId: site, rootCommEventId: rootId}).postList
            login("john.doe")
            return {
                route,
                heldRole,
                accepted,
                request: one("mantle.request.Request", {requestId}),
                profile: one("mantle.request.support.CaseProfile", {requestId}),
                customer: all("mantle.request.RequestParty", {requestId, roleTypeId: "Customer"})[0],
                poster,
                preview,
                published,
                posts
            }
        },
        then(r) {
            r.route.errors == ""
            r.heldRole == null
            r.accepted.errors == ""
            r.request.statusId == "ReqSubmitted"
            r.request.requestCategoryId == ids.supportQueueId
            r.request.salesChannelEnumId == "ScForum"
            r.profile != null
            r.customer.partyId == r.poster
            r.preview.errors == []
            r.preview.output.includes("Reply publicly in forum")
            r.preview.output.includes("Public reply preview")
            r.published.errors == ""
            r.posts.some(p => String(p.body).includes("reset the hub"))
            !r.posts.some(p => String(p.body).includes("Pairing fault") || String(p.body).includes("From forum topic"))
        }
    }
)
