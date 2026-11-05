// Customer Service assignment and saved replies (impl-customer-service P5; AssignmentServices, ReplyServices, Assignment.js,
// Replies.js; the rules are Mantle's, tested in mr-mantle test/request/SupportAssignment and SupportReplies): the rule list
// and the team members' participation read for the organization; the saved replies each user may use (a personal one its
// owner's, a team's its members' through the team's group, the service-wide one of the user's organizations), and Comms
// still listing the user's own and shared blocks; a reply's save through Comms' text block with its actions and their
// refusals; the bulk reply's preview per case (its own recipient, another organization's case named Forbidden); and the one
// render (qvt) of AssignmentRules, SavedReplies, AgentTeams and BulkReply.
// Run: ./moq test mr-boss --spec CustomerService/CustomerServiceAssignment
const lib = ec.resource.script("component://mr-boss/test/CustomerService/CustomerServiceSpecLib.js")
const {ids, users, asUser, system, refusal, invoke} = lib
const A = "ironstone.customerservice.AssignmentServices.",
    R = "ironstone.customerservice.ReplyServices."
const replyIds = result => Array.from(result.replies || []).map(row => row.emailTextBlockId)

spec({
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "the rules and the participation are read for the organization; each user's saved replies are theirs, their team's and the service's",
    {
        when() {
            const rules = asUser(users.manager, () => invoke(A + "find#Rules", {appRoot: "CustomerService"}))
            const participation = asUser(users.manager, () => invoke(A + "get#TeamParticipation", {appRoot: "CustomerService"}))
            const operators = asUser(users.manager, () =>
                invoke(A + "get#RuleChoices", {appRoot: "CustomerService", choice: "operators", fieldEnumId: "AcfTag"})
            )
            const values = asUser(users.manager, () =>
                invoke(A + "get#RuleChoices", {appRoot: "CustomerService", choice: "values", fieldEnumId: "AcfBand"})
            )
            const mine = user => asUser(user, () => replyIds(invoke(R + "find#SavedReplies", {appRoot: "CustomerService"})))
            const blocksOf = user =>
                asUser(
                    user,
                    () =>
                        Array.from(invoke("org.moqui.impl.EmailClientServices.find#EmailTextBlocks", {}).textBlockList || []).map(
                            row => row.emailTextBlockId
                        ),
                    false
                )
            const comms = blocksOf(users.agent)
            // Retail's service-wide reply is its organization's group's: another organization's agent never sees it in Comms
            const otherComms = blocksOf(users.services)
            return {
                rules,
                participation,
                operators: Array.from(operators.options || []).map(row => row.value),
                values: Array.from(values.options || []).map(row => row.value),
                agent: mine(users.agent),
                manager: mine(users.manager),
                // the administrator, on no team, is in Retail's group too (F131: Mantle keeps its service managers there)
                admin: mine(users.admin),
                services: mine(users.services),
                comms,
                otherComms
            }
        },
        then(r) {
            r.rules.organizationPartyId == ids.organizationId
            r.rules.rules.some(row => row.assignmentRuleId == "BOSS_CS_RULE_SUPPORT" && row.distributionEnumId == "AdManual")
            r.participation.participation[ids.supportTeamId + "|BOSS_CS_AGENT"].eligibleText == "Takes cases"
            r.operators == ["AcoHas", "AcoHasNot"]
            r.values.includes("CpbUrgent")
            r.agent.includes("BOSS_CS_REPLY_DETAILS")
            r.agent.includes("BOSS_CS_REPLY_FILTERS")
            r.agent.includes("BOSS_CS_REPLY_PATIENCE")
            r.manager.includes("BOSS_CS_REPLY_DETAILS")
            !r.manager.includes("BOSS_CS_REPLY_PATIENCE")
            !r.services.includes("BOSS_CS_REPLY_FILTERS")
            r.admin.includes("BOSS_CS_REPLY_FILTERS")
            r.comms.includes("BOSS_CS_REPLY_PATIENCE")
            r.comms.includes("BOSS_CS_REPLY_DETAILS")
            r.comms.includes("BOSS_CS_REPLY_FILTERS")
            !r.otherComms.includes("BOSS_CS_REPLY_FILTERS")
        }
    }
)

feature("a saved reply's text is a Comms text block, its actions checked; only its owner changes it", {
    when() {
        const saved = asUser(users.manager, () =>
            invoke(R + "save#SavedReplyAction", {
                appRoot: "CustomerService",
                title: "Assignment spec reply",
                bodyHtml: "<p>Hello {{contactName}}</p>",
                userGroupId: "SVT_" + ids.supportTeamId,
                organizationPartyId: ids.organizationId,
                actions: [{actionEnumId: "SraAddTag", tagEnumId: "RtgVip"}]
            })
        )
        const block = system(() =>
            ec.entity.find("moqui.basic.email.EmailTextBlock").condition("emailTextBlockId", saved.emailTextBlockId).one()
        )
        const facts = system(() =>
            ec.entity.find("mantle.request.support.SavedReply").condition("emailTextBlockId", saved.emailTextBlockId).one()
        )
        const badAction = asUser(users.manager, () =>
            refusal(R + "save#SavedReplyAction", {
                appRoot: "CustomerService",
                emailTextBlockId: saved.emailTextBlockId,
                actionAction: "add",
                actionEnumId: "SraAddTag",
                tagEnumId: "RtgNotATag"
            })
        )
        const otherGroup = asUser(users.manager, () =>
            refusal(R + "save#SavedReplyAction", {
                appRoot: "CustomerService",
                title: "Wrong group",
                userGroupId: "SVT_BOSS_CS_TEAM_SERVICES"
            })
        )
        const notOwner = asUser(users.agent, () =>
            refusal(R + "save#SavedReplyAction", {
                appRoot: "CustomerService",
                emailTextBlockId: saved.emailTextBlockId,
                title: "Mine now"
            })
        )
        return {saved, block, facts, badAction, otherGroup, notOwner}
    },
    then(r) {
        r.block.ownerUserId == "BOSS_CS_MANAGER"
        r.block.userGroupId == "SVT_" + ids.supportTeamId
        r.facts.variableNames == "contactName"
        r.badAction.includes("TAG_UNKNOWN")
        r.otherGroup.includes("GROUP_UNAVAILABLE")
        r.notOwner.includes("REPLY_UNAVAILABLE")
    }
})

feature("the bulk reply previews each case on its own: its recipient and actions, another organization's case Forbidden", {
    when() {
        return asUser(users.agent, () =>
            invoke(R + "preview#BulkReply", {
                appRoot: "CustomerService",
                requestIds: [ids.filtersCaseId, ids.otherCaseId],
                emailTextBlockId: "BOSS_CS_REPLY_DETAILS"
            })
        )
    },
    then(r) {
        r.cases.length == 2
        r.cases[0].requestId == ids.filtersCaseId
        r.cases[0].actionsText.includes("Add the tag Follow up")
        r.cases[1].outcome == "Forbidden"
    }
})

feature("AssignmentRules, SavedReplies, AgentTeams and BulkReply render (qvt)", {
    when() {
        const rules = asUser(users.admin, () =>
            lib.page("Settings/AssignmentRules", {
                organizationPartyId: ids.organizationId,
                assignmentRuleId: "BOSS_CS_RULE_SUPPORT",
                previewCategoryId: ids.supportQueueId
            })
        )
        const replies = asUser(users.manager, () =>
            lib.page("Settings/SavedReplies", {emailTextBlockId: "BOSS_CS_REPLY_DETAILS", previewRequestId: ids.filtersCaseId})
        )
        const teams = asUser(users.manager, () => lib.page("Settings/AgentTeams", {}))
        const bulk = asUser(users.agent, () =>
            lib.page("Cases/BulkReply", {requestIds: ids.filtersCaseId, emailTextBlockId: "BOSS_CS_REPLY_PATIENCE"})
        )
        return {rules, replies, teams, bulk}
    },
    then({rules, replies, teams, bulk}) {
        rules.status == 200
        rules.errors == []
        rules.output.includes("Support: agents take cases")
        rules.output.includes("Conditions: a case must meet all of them")
        rules.output.includes("Left for an agent to take")
        replies.status == 200
        replies.errors == []
        replies.output.includes("Need more details")
        replies.output.includes("Thank you for contacting")
        replies.output.includes("Wait")
        teams.status == 200
        teams.errors == []
        teams.output.includes("Takes cases")
        bulk.status == 200
        bulk.errors == []
        bulk.output.includes("Thanks for your patience")
        bulk.output.includes("Send 1 replies")
    }
})
