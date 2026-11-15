// Customer Service record access (impl-customer-service §2, §4, P2 on): each later phase's access rules on its records, with
// artifact authorization enabled: a case by its organization, customer and queue; service level policies and a case's clocks;
// article feedback and an article from a case; case templates; channel routes; assignment rules and saved replies; merge and
// split; order changes; returns; warranty claims; feedback forms and answers; reports; Invite to support. One feature per rule,
// each case of it a line of its problems; another organization's record is refused like a missing one. Split from
// CustomerServiceAccess in Sales follow-up 4 (it ran over 15 s on a loaded run), every feature kept and unchanged;
// CustomerServiceAccess keeps the app's own access (context, menu and providers, Home, capabilities, customer scope, the record
// check, record links, guarded areas); the two share CustomerServiceSpecLib and no state. A later phase adds a case here for an
// access rule it adds on a record.
// Run: ./moq test mr-boss --spec CustomerService/CustomerServiceRecordAccess
const lib = ec.resource.script("component://mr-boss/test/CustomerService/CustomerServiceSpecLib.js")
const {ids, users, asUser, system, refusal, invoke} = lib
const access = "ironstone.customerservice.AccessServices."
// a refusal of a user without Customer Service: the service is not authorized for them, or it refuses them
const refused = message => /CUSTOMER_SERVICE_UNAVAILABLE|is not authorized/.test(message)
const values = result => Array.from(result.options || []).map(row => row.value)

spec({
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

// A screen render's refusal as the user, nothing of its content: "" when it opens, else its status and errors, which for a
// refusal name the authorization
function screenRefusal(user, path) {
    const rendered = asUser(user, () => lib.page(path, {}, "html"))
    return rendered.status === 200 && rendered.errors.length === 0 ? "" : rendered.status + " " + rendered.errors.join(" | ")
}
const unauthorized = message => /^40[13] |is not authorized/.test(message)

// P2: a case is checked by its organization, customer and queue: the agent of its team's queue reaches it (and with caseEdit
// may change it), the reader of no team does not, another organization's agent does not, and the restricted Privacy queue's
// case only its team; its record link opens CaseDetail for a user who sees it and keeps the Commons link for another
feature("a case is its queue's team's and its assignee's; another organization's and a restricted queue's are refused", {
    when() {
        const problems = []
        const check = (user, recordId, capability) =>
            asUser(user, () => refusal(access + "check#Record", {recordType: "case", recordId, capability}))
        for (const [user, recordId, capability, expected] of [
            [users.agent, ids.thermostatCaseId, "caseEdit", ""],
            [users.read, ids.thermostatCaseId, null, "RECORD_UNAVAILABLE"],
            [users.services, ids.thermostatCaseId, null, "RECORD_UNAVAILABLE"],
            [users.services, ids.otherCaseId, "caseEdit", ""],
            [users.agent, ids.otherCaseId, null, "RECORD_UNAVAILABLE"],
            [users.agent, ids.privacyCaseId, null, "RECORD_UNAVAILABLE"],
            [users.manager, ids.privacyCaseId, null, "RECORD_UNAVAILABLE"],
            [users.admin, ids.privacyCaseId, null, ""],
            [users.read, ids.otherCaseId, null, "RECORD_UNAVAILABLE"]
        ]) {
            const message = check(user, recordId, capability)
            if (expected === "" ? message !== "" : !message.includes(expected))
                problems.push(`${user} on case ${recordId}: ${message || "accepted"}, not ${expected || "accepted"}`)
        }
        const link = user =>
            asUser(
                user,
                () =>
                    invoke("ironstone.commons.PaletteServices.get#RecordLink", {
                        recordEntityName: "mantle.request.Request",
                        id: ids.thermostatCaseId
                    }).url || null
            )
        const agentLink = link(users.agent)
        if (agentLink !== "/qapps/CustomerService/Cases/CaseDetail?requestId=" + ids.thermostatCaseId)
            problems.push(`the agent's case link: ${agentLink}`)
        const readerLink = link(users.read)
        if (String(readerLink).includes("CustomerService")) problems.push(`the reader's case link: ${readerLink}`)
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

// P4: a service level policy is the administrator's to save (SUPPORT_POLICY_EDIT), its list the settings readers' and another
// organization's refused; a case's clocks are read by the agent of its queue and not by another organization's agent; the
// settings offer only organizations Mantle's saves take; and ServiceLevelPolicies renders for the administrator (qvt) with the demo policy and New policy
feature("service levels: the administrator saves a policy and the manager may not; a case's clocks are its organization's", {
    when() {
        const problems = []
        const draft = {
            organizationPartyId: ids.organizationId,
            policyName: "Access spec draft",
            requestCategoryId: ids.supportQueueId,
            draft: true,
            targets: [{priorityBandEnumId: "CpbNormal", firstResponseMinutes: 60, resolutionMinutes: 480}]
        }
        const sla = "mantle.request.SlaServices."
        for (const [user, service, parameters, expected] of [
            [users.admin, "save#Policy", draft, ""],
            [users.manager, "save#Policy", draft, "PERMISSION_DENIED"],
            [users.manager, "find#Policies", {organizationPartyId: ids.organizationId}, ""],
            [users.agent, "find#Policies", {organizationPartyId: ids.otherOrganizationId}, "RECORD_UNAVAILABLE"],
            [users.agent, "get#CaseSlaHistory", {requestId: ids.thermostatCaseId}, ""],
            [users.services, "get#CaseSlaHistory", {requestId: ids.thermostatCaseId}, "RECORD_UNAVAILABLE"]
        ]) {
            // Mantle's services check their permission and organization themselves (the screens call them after the case's
            // check, under the screen's authorization)
            const message = asUser(user, () => refusal(sla + service, parameters), false)
            if (expected === "" ? message !== "" : !message.includes(expected))
                problems.push(`${user} ${service}: ${message || "accepted"}, not ${expected || "accepted"}`)
        }
        // the settings offer only organizations Mantle's saves take (F-P4-6: not every internal organization)
        const offered = asUser(
            users.admin,
            () =>
                invoke("ironstone.customerservice.ConfigurationServices.get#ServiceLevelSettings", {appRoot: "CustomerService"})
                    .organizations || [],
            false
        )
        if (!offered.some(row => row.value === ids.organizationId)) problems.push("the settings do not offer the organization")
        for (const row of offered) {
            const message = asUser(users.admin, () => refusal(sla + "find#Policies", {organizationPartyId: row.value}), false)
            if (message) problems.push(`the settings offer ${row.value}, which Mantle refuses: ${message}`)
        }
        const page = asUser(users.admin, () =>
            lib.page("Settings/ServiceLevelPolicies", {organizationPartyId: ids.organizationId})
        )
        return {problems, page}
    },
    then({problems, page}) {
        problems.join("\n") == ""
        page.status == 200
        page.errors == []
        page.output.includes("Retail standard")
        page.output.includes("Privacy requests")
        page.output.includes("New policy")
    }
})
// P12: article feedback is the knowledge author's (who reviews it) and the service manager's (who reads it), never an agent's,
// in the service and on the screen; an article drafted from a case is the knowledge author's, on a case of their organization
feature(
    "article feedback is the knowledge author's and the manager's; an article from a case the author's, on their organization's cases",
    {
        when() {
            const problems = []
            const knowledge = "ironstone.customerservice.KnowledgeServices."
            for (const [user, service, parameters, expected] of [
                [users.knowledge, "find#ArticleFeedback", {}, ""],
                [users.manager, "find#ArticleFeedback", {}, ""],
                [users.agent, "find#ArticleFeedback", {}, "PERMISSION_DENIED"],
                [users.knowledge, "prepare#ArticleFromCase", {requestId: ids.thermostatCaseId}, ""],
                [users.agent, "prepare#ArticleFromCase", {requestId: ids.thermostatCaseId}, "PERMISSION_DENIED"],
                [users.knowledge, "prepare#ArticleFromCase", {requestId: ids.otherCaseId}, "RECORD_UNAVAILABLE"]
            ]) {
                const message = asUser(user, () =>
                    refusal(knowledge + service, Object.assign({appRoot: "CustomerService"}, parameters))
                )
                if (expected === "" ? message !== "" : !message.includes(expected))
                    problems.push(
                        `${user} ${service} ${parameters.requestId || ""}: ${message || "accepted"}, not ${expected || "accepted"}`
                    )
            }
            for (const path of ["Knowledge/ArticleFeedback", "Knowledge/CaseToArticle"]) {
                const got = screenRefusal(users.agent, path)
                if (!unauthorized(got) || !got.includes("AT_XML_SCREEN ["))
                    problems.push(`the agent on ${path}: ${got || "opened"}`)
            }
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)
// P7: case templates are the administrator's to change (SUPPORT_POLICY_EDIT), not the manager's; another organization's
// template, and its case values, are refused like a missing one
feature("case templates: the administrator saves one and the manager may not; another organization's is refused", {
    when() {
        const problems = []
        const S = "mantle.request.SupportCaseServices."
        const draft = {organizationPartyId: ids.organizationId, description: "Access spec template"}
        for (const [user, service, parameters, expected] of [
            [users.admin, "save#CaseTemplate", draft, ""],
            [users.manager, "save#CaseTemplate", draft, "PERMISSION_DENIED"],
            [users.agent, "get#CaseTemplate", {formId: ids.templateFormId}, ""],
            [users.services, "get#CaseTemplate", {formId: ids.templateFormId}, "RECORD_UNAVAILABLE"],
            [users.services, "get#CaseTemplateValues", {requestId: ids.thermostatCaseId}, "RECORD_UNAVAILABLE"]
        ]) {
            const message = asUser(user, () => refusal(S + service, parameters), false)
            if (expected === "" ? message !== "" : !message.includes(expected))
                problems.push(`${user} ${service}: ${message || "accepted"}, not ${expected || "accepted"}`)
        }
        const templates = "ironstone.customerservice.TemplateServices."
        const theirs = asUser(users.services, () =>
            refusal(templates + "find#Templates", {appRoot: "CustomerService", organizationPartyId: ids.organizationId})
        )
        if (!theirs.includes("RECORD_UNAVAILABLE"))
            problems.push(`find#Templates of Retail for Services: ${theirs || "accepted"}`)
        const otherChoice = asUser(users.services, () =>
            invoke(templates + "get#CaseTemplateChoice", {
                appRoot: "CustomerService",
                organizationPartyId: ids.organizationId,
                requestCategoryId: ids.supportQueueId
            })
        )
        if (otherChoice.templateFormId || otherChoice.templateOptions.length)
            problems.push("NewCase offers Retail's template to Services' agent")
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})
// P6: channel routing is the administrator's to save and the manager's to read; an agent reads neither, a manager no other
// organization's, and a case from a message is a case editor's for a customer of their organization
feature(
    "channel routes: the administrator saves one and the manager reads them; the agent may not; another organization's refused",
    {
        when() {
            const problems = []
            const route = {requestCategoryId: ids.supportQueueId, channelEnumId: "SrcChat", acknowledge: "N"}
            for (const [user, service, parameters, expected, authz] of [
                [users.admin, "mantle.request.SupportCaseServices.save#ServiceRoute", route, "", false],
                [users.manager, "mantle.request.SupportCaseServices.save#ServiceRoute", route, "PERMISSION_DENIED", false],
                [
                    users.services,
                    "mantle.request.SupportCaseServices.save#ServiceRoute",
                    Object.assign({}, route, {channelEnumId: "SrcWebForm"}),
                    "PERMISSION_DENIED",
                    false
                ],
                [
                    users.manager,
                    "ironstone.customerservice.ChannelServices.find#ServiceRoutes",
                    {organizationPartyId: ids.organizationId},
                    "",
                    true
                ],
                [
                    users.agent,
                    "ironstone.customerservice.ChannelServices.find#ServiceRoutes",
                    {organizationPartyId: ids.organizationId},
                    "PERMISSION_DENIED",
                    true
                ],
                [
                    users.manager,
                    "ironstone.customerservice.ChannelServices.find#ServiceRoutes",
                    {organizationPartyId: ids.otherOrganizationId},
                    "RECORD_UNAVAILABLE",
                    true
                ],
                [
                    users.read,
                    "ironstone.customerservice.ChannelServices.create#CaseFromMessage",
                    {kind: "email", emailMessageId: "NO_SUCH_MESSAGE"},
                    "PERMISSION_DENIED",
                    true
                ]
            ]) {
                const message = asUser(
                    user,
                    () => refusal(service, Object.assign({appRoot: "CustomerService"}, parameters)),
                    authz
                )
                if (expected === "" ? message !== "" : !message.includes(expected))
                    problems.push(`${user} ${service}: ${message || "accepted"}, not ${expected || "accepted"}`)
            }
            const page = asUser(users.admin, () => lib.page("Settings/ChannelRouting", {organizationPartyId: ids.organizationId}))
            return {problems, page}
        },
        then({problems, page}) {
            problems.join("\n") == ""
            page.status == 200
            page.errors == []
            page.output.includes("Channel routing")
            page.output.includes("Support")
            page.output.includes("Add route")
            page.output.includes("Held for review")
        }
    }
)

// P5: an assignment rule is the administrator's to save (SUPPORT_POLICY_EDIT), not the manager's, and never on another
// organization's queue; a saved reply on a case is a case editor's (SUPPORT_CASE_EDIT), not the reader's, and another
// organization's agent is refused the case; a saved reply's change is its owner's only, and an agent shares none
feature("assignment rules are the administrator's, saved replies on a case a case editor's of its organization", {
    when() {
        const problems = []
        const S = "mantle.request.SupportCaseServices."
        const draft = {
            organizationPartyId: ids.organizationId,
            requestCategoryId: ids.supportQueueId,
            ruleName: "Access spec draft rule",
            distributionEnumId: "AdManual",
            draft: true
        }
        for (const [user, service, parameters, expected] of [
            [users.admin, "save#AssignmentRule", draft, ""],
            [users.manager, "save#AssignmentRule", draft, "PERMISSION_DENIED"],
            [
                users.admin,
                "save#AssignmentRule",
                Object.assign({}, draft, {requestCategoryId: ids.otherQueueId}),
                "QUEUE_UNAVAILABLE"
            ],
            [users.manager, "preview#Assignment", {requestId: ids.filtersCaseId}, ""],
            [users.services, "preview#Assignment", {requestId: ids.filtersCaseId}, "RECORD_UNAVAILABLE"],
            [users.agent, "preview#SavedReply", {requestId: ids.filtersCaseId, emailTextBlockId: "BOSS_CS_REPLY_DETAILS"}, ""],
            [
                users.read,
                "preview#SavedReply",
                {requestId: ids.filtersCaseId, emailTextBlockId: "BOSS_CS_REPLY_DETAILS"},
                "PERMISSION_DENIED"
            ],
            [
                users.services,
                "preview#SavedReply",
                {requestId: ids.filtersCaseId, emailTextBlockId: "BOSS_CS_REPLY_FILTERS"},
                "RECORD_UNAVAILABLE"
            ]
        ]) {
            const message = asUser(user, () => refusal(S + service, parameters), false)
            if (expected === "" ? message !== "" : !message.includes(expected))
                problems.push(`${user} ${service}: ${message || "accepted"}, not ${expected || "accepted"}`)
        }
        const save = "ironstone.customerservice.ReplyServices.save#SavedReplyAction"
        for (const [user, parameters, expected] of [
            [users.agent, {emailTextBlockId: "BOSS_CS_REPLY_PATIENCE", disabled: "N"}, ""],
            [users.manager, {emailTextBlockId: "BOSS_CS_REPLY_PATIENCE", disabled: "N"}, "REPLY_UNAVAILABLE"],
            [users.read, {title: "Reader reply", bodyHtml: "<p>Hi</p>"}, "PERMISSION_DENIED"],
            // an agent's replies are their own: sharing with their team is its manager's
            [
                users.agent,
                {title: "Agent team reply", bodyHtml: "<p>Hi</p>", userGroupId: "SVT_BOSS_CS_TEAM_SUPPORT"},
                "GROUP_UNAVAILABLE"
            ]
        ]) {
            const message = asUser(user, () => refusal(save, Object.assign({appRoot: "CustomerService"}, parameters)))
            if (expected === "" ? message !== "" : !message.includes(expected))
                problems.push(`${user} save#SavedReplyAction: ${message || "accepted"}, not ${expected || "accepted"}`)
        }
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("merge is a service manager's and split a case editor's, each on their organization's cases; the lineage too", {
    when() {
        const problems = []
        const S = "mantle.request.SupportCaseServices."
        const merge = {targetRequestId: ids.thermostatCaseId, sourceRequestIds: [ids.filtersCaseId]}
        const split = {requestId: ids.filtersCaseId}
        for (const [user, service, parameters, expected] of [
            [users.manager, "preview#MergeCases", merge, ""],
            [users.agent, "preview#MergeCases", merge, "PERMISSION_DENIED"],
            [users.agent, "preview#SplitCase", split, ""],
            [users.read, "preview#SplitCase", split, "PERMISSION_DENIED"],
            [users.services, "preview#SplitCase", split, "RECORD_UNAVAILABLE"],
            [users.read, "get#CaseLineage", split, ""],
            [users.services, "get#CaseLineage", split, "RECORD_UNAVAILABLE"]
        ]) {
            const message = asUser(user, () => refusal(S + service, parameters), false)
            if (expected === "" ? message !== "" : !message.includes(expected))
                problems.push(`${user} ${service}: ${message || "accepted"}, not ${expected || "accepted"}`)
        }
        // the screens' check: a merge needs the manager's capability on each case
        for (const [user, expected] of [
            [users.manager, ""],
            [users.agent, "PERMISSION_DENIED"]
        ]) {
            const message = asUser(user, () =>
                refusal(access + "check#Record", {
                    appRoot: "CustomerService",
                    recordType: "case",
                    recordId: ids.filtersCaseId,
                    capability: "caseManage"
                })
            )
            if (expected === "" ? message !== "" : !message.includes(expected))
                problems.push(`${user} check#Record caseManage: ${message || "accepted"}, not ${expected || "accepted"}`)
        }
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

// P10: an order change is its order's organization's: the order desk applies (ORDER_CHANGE_APPLY), an agent does not, and
// Ziziwork Services' agent reaches neither the record nor Mantle's read of it; the line choices are the order's
feature("order changes: the order desk may apply one, an agent may not; another organization's is refused", {
    when() {
        const problems = []
        const saved = lib.orderChange(users.agent, {
            orderId: ids.pickOrderId,
            orderChangeKindEnumId: "OckCancel",
            reason: "Access spec",
            lines: [{orderItemSeqId: "01", quantity: 1}]
        })
        try {
            if (saved.error) problems.push("the agent's proposal: " + saved.error)
            const record = {
                appRoot: "CustomerService",
                recordType: "orderChange",
                recordId: saved.requestId,
                capability: "orderChangeApply"
            }
            // Services' agent asks for the record alone: another organization's is refused whatever the capability
            for (const [user, expected, capability] of [
                [users.orderDesk, "", "orderChangeApply"],
                [users.agent, "PERMISSION_DENIED", "orderChangeApply"],
                [users.services, "RECORD_UNAVAILABLE", null]
            ]) {
                const message = asUser(user, () => refusal(access + "check#Record", Object.assign({}, record, {capability})))
                if (expected === "" ? message !== "" : !message.includes(expected))
                    problems.push(`${user} check#Record: ${message || "accepted"}, not ${expected || "accepted"}`)
            }
            const read = {requestId: saved.requestId}
            const desk = asUser(users.orderDesk, () => refusal("mantle.order.OrderChangeServices.get#OrderChange", read), false)
            const other = asUser(users.services, () => refusal("mantle.order.OrderChangeServices.get#OrderChange", read), false)
            if (desk !== "") problems.push("the order desk's read: " + desk)
            if (!other.includes("RECORD_UNAVAILABLE")) problems.push("Services' read: " + (other || "accepted"))
            const lines = choice =>
                asUser(users.agent, () => invoke(access + "get#Choices", Object.assign({appRoot: "CustomerService"}, choice)))
            if (!values(lines({choice: "orderLines", orderId: ids.pickOrderId})).includes("01"))
                problems.push("the agent's order lines lack line 01")
            const otherLines = asUser(users.services, () =>
                refusal(access + "get#Choices", {appRoot: "CustomerService", choice: "orderLines", orderId: ids.pickOrderId})
            )
            if (!otherLines.includes("RECORD_UNAVAILABLE")) problems.push("Services' order lines: " + (otherLines || "accepted"))
        } finally {
            lib.removeOrderChange(saved.requestId)
        }
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

// P9: a customer return is its organization's and its customer's: the return authorizer authorizes it, the agent may not; the
// return's record check with a capability; another organization's agent is refused it and its reads
feature("returns: the authorizer's to authorize and the agent's to enter; another organization's return is refused", {
    when() {
        const problems = []
        const check = (user, capability) =>
            asUser(user, () =>
                refusal(access + "check#Record", {
                    appRoot: "CustomerService",
                    recordType: "return",
                    recordId: ids.warehouseReturnId,
                    capability
                })
            )
        for (const [user, capability, expected] of [
            [users.returns, "returnAuthorize", ""],
            [users.agent, "returnAuthorize", "PERMISSION_DENIED"],
            [users.agent, null, ""],
            [users.services, null, "RECORD_UNAVAILABLE"],
            [users.agent, "returnPolicyEdit", "PERMISSION_DENIED"]
        ]) {
            const message = check(user, capability)
            if (expected === "" ? message !== "" : !message.includes(expected))
                problems.push(`${user} check ${capability}: ${message || "accepted"}, not ${expected || "accepted"}`)
        }
        const P = "mantle.order.ReturnPolicyServices."
        for (const [user, service, parameters, expected] of [
            [users.agent, "authorize#Return", {operationKey: "CSA-RET-1", returnId: ids.warehouseReturnId}, "PERMISSION_DENIED"],
            [users.services, "get#ReturnState", {returnId: ids.warehouseReturnId}, "RECORD_UNAVAILABLE"],
            [
                users.manager,
                "save#Policy",
                {organizationPartyId: ids.organizationId, policyName: "Access spec"},
                "PERMISSION_DENIED"
            ],
            [users.agent, "evaluate#ReturnPolicy", {returnId: ids.warehouseReturnId}, ""]
        ]) {
            const message = asUser(user, () => refusal(P + service, parameters), false)
            if (expected === "" ? message !== "" : !message.includes(expected))
                problems.push(`${user} ${service}: ${message || "accepted"}, not ${expected || "accepted"}`)
        }
        const theirs = asUser(users.services, () =>
            refusal("ironstone.customerservice.ReturnServices.get#ReturnDetail", {
                appRoot: "CustomerService",
                returnId: ids.warehouseReturnId
            })
        )
        if (!theirs.includes("RECORD_UNAVAILABLE")) problems.push(`Retail's return for Services: ${theirs || "accepted"}`)
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

// P11: a warranty claim is its case's: a case editor of its organization works it, the service reader may not, another
// organization's agent is refused the claim, its reads and the customer's delivered serials
feature(
    "warranty claims: a case editor's of the claim's organization; another organization's agent is refused it and its serials",
    {
        when() {
            const problems = []
            const thermostat = lib.deliveredThermostat()
            const made = lib.warrantyClaim(users.agent, {requestName: "Access spec warranty claim", assetId: thermostat.assetId})
            try {
                if (made.error) problems.push("the agent's claim: " + made.error)
                for (const [user, capability, expected] of [
                    [users.agent, "caseEdit", ""],
                    [users.read, "caseEdit", "PERMISSION_DENIED"],
                    [users.services, null, "RECORD_UNAVAILABLE"]
                ]) {
                    const message = asUser(user, () =>
                        refusal(access + "check#Record", {
                            appRoot: "CustomerService",
                            recordType: "case",
                            recordId: made.requestId,
                            capability
                        })
                    )
                    if (expected === "" ? message !== "" : !message.includes(expected))
                        problems.push(`${user} check#Record: ${message || "accepted"}, not ${expected || "accepted"}`)
                }
                const W = "mantle.request.WarrantyServices."
                for (const [user, expected] of [
                    [users.agent, ""],
                    [users.read, "PERMISSION_DENIED"],
                    [users.services, "RECORD_UNAVAILABLE"]
                ]) {
                    const message = asUser(user, () => refusal(W + "get#WarrantyClaim", {requestId: made.requestId}), false)
                    if (expected === "" ? message !== "" : !message.includes(expected))
                        problems.push(`${user} get#WarrantyClaim: ${message || "accepted"}, not ${expected || "accepted"}`)
                }
                const serials = user =>
                    values(
                        asUser(user, () =>
                            invoke(access + "get#Choices", {
                                appRoot: "CustomerService",
                                choice: "customerAssets",
                                customerPartyId: ids.customerId
                            })
                        )
                    )
                if (!serials(users.agent).includes(thermostat.assetId)) problems.push("the agent's serials lack the thermostat")
                if (serials(users.services).length) problems.push("Services' agent sees Retail's customer's serials")
            } finally {
                lib.closeWarrantyClaim(made.requestId)
            }
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)

// P13: feedback forms are the administrator's to change (SUPPORT_POLICY_EDIT), not the manager's; the answers are service
// management's (an agent is refused SatisfactionResults); another organization's form, policy and answers are refused
feature(
    "feedback: the administrator keeps the forms, the manager reads the answers, the agent neither; another organization's refused",
    {
        when() {
            const problems = []
            const form = system(
                () =>
                    Array.from(
                        ec.entity
                            .find("moqui.screen.form.DbForm")
                            .condition({purposeEnumId: "DbfpCaseFeedback", ownerPartyId: ids.organizationId})
                            .list()
                    )[0]
            )
            const answer = system(
                () =>
                    Array.from(
                        ec.entity
                            .find("mantle.party.FormInvitation")
                            .condition({organizationPartyId: ids.organizationId, statusEnumId: "FinResponded"})
                            .list()
                    )[0]
            )
            const F = "mantle.request.CaseFeedbackServices.",
                B = "ironstone.customerservice.FeedbackServices."
            for (const [user, service, parameters, expected] of [
                [users.admin, F + "get#FeedbackForm", {formId: form.formId}, ""],
                [users.manager, F + "rename#FeedbackForm", {formId: form.formId, description: "Mine now"}, "PERMISSION_DENIED"],
                [users.services, F + "get#FeedbackForm", {formId: form.formId}, "RECORD_UNAVAILABLE"],
                [
                    users.services,
                    F + "save#InvitationPolicy",
                    {organizationPartyId: ids.organizationId, formId: form.formId},
                    "PERMISSION_DENIED"
                ],
                [users.manager, B + "find#CaseResponses", {appRoot: "CustomerService"}, ""],
                [users.agent, B + "find#CaseResponses", {appRoot: "CustomerService"}, "PERMISSION_DENIED"],
                [users.manager, B + "get#CaseResponse", {appRoot: "CustomerService", formResponseId: answer.formResponseId}, ""],
                [
                    users.services,
                    B + "get#CaseResponse",
                    {appRoot: "CustomerService", formResponseId: answer.formResponseId},
                    "RECORD_UNAVAILABLE"
                ],
                [
                    users.agent,
                    B + "get#CaseResponse",
                    {appRoot: "CustomerService", formResponseId: answer.formResponseId},
                    "RECORD_UNAVAILABLE"
                ]
            ]) {
                const message = asUser(user, () => refusal(service, parameters), false)
                if (expected === "" ? message !== "" : !message.includes(expected))
                    problems.push(`${user} ${service}: ${message || "accepted"}, not ${expected || "accepted"}`)
            }
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)

// P14: the reports are the Reports area's (the agent, manager and return authorizer), over the user's organizations and the
// queues of the teams they report on: the reader is refused, a manager of the Support team is refused the Privacy queue, and
// Services' agent is refused Retail and Retail's customer
feature("reports: the manager reads the Support team's queue, not Privacy's; the reader and another organization are refused", {
    when() {
        const problems = []
        const R = "ironstone.customerservice.ReportingServices."
        const app = {appRoot: "CustomerService"}
        for (const [user, service, parameters, expected] of [
            [users.manager, R + "get#SlaCompliance", Object.assign({requestCategoryId: ids.supportQueueId}, app), ""],
            [
                users.manager,
                R + "get#SlaCompliance",
                Object.assign({requestCategoryId: ids.privacyQueueId}, app),
                "RECORD_UNAVAILABLE"
            ],
            [users.read, R + "get#CaseVolumes", app, "PERMISSION_DENIED"],
            [
                users.services,
                R + "get#CaseVolumes",
                Object.assign({organizationPartyId: ids.organizationId}, app),
                "RECORD_UNAVAILABLE"
            ],
            [
                users.services,
                R + "get#ReturnAnalysis",
                Object.assign({customerPartyId: ids.customerId}, app),
                "CUSTOMER_UNAVAILABLE"
            ],
            [
                users.services,
                R + "get#CustomerServiceStatistics",
                Object.assign({customerPartyId: ids.customerId}, app),
                "CUSTOMER_UNAVAILABLE"
            ]
        ]) {
            const message = asUser(user, () => refusal(service, parameters), false)
            if (expected === "" ? message !== "" : !message.includes(expected))
                problems.push(`${user} ${service}: ${message || "accepted"}, not ${expected || "accepted"}`)
        }
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})
feature(
    "Invite to support is a SUPPORT_CONTACT_INVITE holder's, to the contact's own address; another organization's contact is refused",
    {
        when() {
            const contactId = "BOSS_CS_JOEDIST_CONTACT"
            const S = "ironstone.customerservice.SupportAppServices."
            const offer = user =>
                asUser(user, () => invoke(S + "get#SupportInvite", {appRoot: "CustomerService", partyId: contactId}))
            const holder = offer(users.manager)
            const agent = offer(users.agent)
            const inviteAs = (user, emailAddress) =>
                asUser(user, () =>
                    refusal(S + "create#SupportInvitation", {appRoot: "CustomerService", partyId: contactId, emailAddress})
                )
            return {
                holder,
                agent,
                agentInvite: inviteAs(users.agent, "dana@joesdist.example.com"),
                otherAddress: inviteAs(users.manager, "someone@elsewhere.example.com"),
                otherOrganization: asUser(users.services, () =>
                    refusal(S + "get#SupportInvite", {appRoot: "CustomerService", partyId: contactId})
                )
            }
        },
        then({holder, agent, agentInvite, otherAddress, otherOrganization}) {
            holder.canInvite === true
            holder.customerPartyId === "JoeDist"
            holder.emailOptions.some(row => row.value === "dana@joesdist.example.com")
            agent.canInvite === false
            agentInvite.includes("PERMISSION_DENIED")
            otherAddress.includes("EMAIL_INVALID")
            otherOrganization.includes("RECORD_UNAVAILABLE")
        }
    }
)
