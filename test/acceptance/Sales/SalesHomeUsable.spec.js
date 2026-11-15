// Sales P6's "usable when" and gate 1, a working CRM (impl-sales P6; design-sales §3 Home and OpportunityImport, §1.4, §12.2;
// design-admin §14): Home's counters open the lists they count; a CSV of five deals, one with an unknown stage, imports four through
// the shared wizard under Sales and names the one; disabling an offboarded rep in Admin lists their deals and moves them to a new
// owner; Assist qualifies a lead only after the user approves the step (no qualify tool, the skill leaves Qualify to the user, the
// tools that write ask first and none is on MCP), and the user's own Qualify makes the opportunity. The rules are Mantle's
// SalesWorkspace, SalesOpportunityImport and SalesPipelineDataset, and the BOSS SalesHome.
// Run: ./moq accept mr-boss --spec SalesHomeUsable
const lib = ec.resource.script("component://mr-boss/test/Sales/SalesSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const T = "org.moqui.admin.DataTransferServices."
const OPPORTUNITY = "mantle.sales.opportunity.SalesOpportunity"
const run = String(Date.now()).slice(-6)
const rows = (entity, condition) => system(() => Array.from(ec.entity.find(entity).condition(condition).list()))
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0
const leaver = "SAL_USABLE_LEAVER_" + run

spec({
    setupSpec() {
        login("john.doe")
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("Home's counters open the lists they count", {
    when() {
        const home = asUser(users.rep, () => page("Home", {}, "html"))
        const counters = asUser(users.rep, () =>
            system(() => Array.from(invoke("mantle.sales.SalesWorkspaceServices.get#SalesHome", {}).counters || []))
        ).filter(counter => counter.state === "ready")
        // each counter's list, opened with the counter's own parameters, counts the same rows through the list's own service: the
        // pipeline's (P6), the requests for quote (P8), the quotes and the orders (P11)
        const listCount = counter => {
            const call = (service, parameters, field) =>
                asUser(users.rep, () => system(() => invoke(service, Object.assign({pageSize: 1}, parameters))))[field]
            if (counter.listPath === "Pipeline/Leads" || counter.listPath === "Pipeline/Opportunities")
                return call(
                    "mantle.sales.OpportunityServices.find#Opportunities",
                    Object.assign(
                        {
                            statusId: "SalesOppOpen",
                            typeEnumId: counter.listPath === "Pipeline/Leads" ? "SotLead" : "SotOpportunity"
                        },
                        counter.parameters
                    ),
                    "opportunityListCount"
                )
            if (counter.listPath === "Quotes/QuoteRequests")
                return call("mantle.order.SalesQuoteServices.find#QuoteRequests", counter.parameters, "quoteRequestListCount")
            if (counter.listPath === "Quotes/Quotes")
                return call("mantle.order.SalesQuoteServices.find#Quotes", counter.parameters, "quoteListCount")
            if (counter.listPath === "Orders/Orders")
                return call("mantle.sales.SalesWorkspaceServices.find#SalesOrders", counter.parameters, "orderListCount")
            return "no list service for " + counter.listPath
        }
        const lists = counters.map(counter => {
            const listed = asUser(users.rep, () => page(counter.listPath, counter.parameters, "html"))
            return {key: counter.counterKey, count: counter.count, listed: Number(listCount(counter)), opened: opened(listed)}
        })
        return {home, lists}
    },
    then({home, lists}) {
        opened(home)
        home.output.includes("Leads to work")
        lists.map(list => list.key).join() ==
            "leads,myOpportunities,pastClose,quoteRequests,quotesToSend,quotesExpiring,ordersBlocked"
        lists.every(list => list.opened && list.count === list.listed)
    }
})

feature("a CSV of five deals, one with an unknown stage, imports four through the wizard under Sales and names the one", {
    when() {
        const csv = ["Source key,Name,Stage,Amount,Currency"]
            .concat(
                ["A", "B", "C", "D"].map(
                    (key, at) =>
                        "usable-" + run + "-" + key + ",Usable deal " + key + " " + run + ",Discovery," + (1000 + at) + ",USD"
                )
            )
            .concat(["usable-" + run + "-E,Usable deal E " + run + ",Signed,500,USD"])
            .join("\n")
        const post = (path, parameters) =>
            asUser(users.manager, () => page("Pipeline/OpportunityImport/Index/" + path, parameters, "html"))
        const staged = post("stage", {organizationPartyId: ids.organizationId, sourceText: csv})
        const key = rows("moqui.server.TransferBatch", {targetId: "opportunities", userId: "BOSS_SAL_MANAGER"}).sort((a, b) =>
            String(b.transferId).localeCompare(String(a.transferId))
        )[0]?.transferId
        const get = () =>
            asUser(users.manager, () => system(() => invoke(T + "get#Transfer", {targetId: "opportunities", operationKey: key})))
        const validated = asUser(users.manager, () =>
            system(() =>
                invoke(T + "validate#Import", {
                    targetId: "opportunities",
                    operationKey: key,
                    mappingRevision: get().mappingRevision
                })
            )
        )
        post("apply", {operationKey: key, inputFingerprint: validated.inputFingerprint})
        const applied = get()
        return {
            staged: staged.errors.length === 0,
            counts: [applied.appliedCount, applied.errorCount],
            named: Array.from(applied.importRows || [])
                .filter(row => row.result === "invalid")
                .map(row => String(row.errorMessage))
                .join("; "),
            made: rows(OPPORTUNITY, {organizationPartyId: ids.organizationId}).filter(row =>
                String(row.importSourceKey || "").startsWith("usable-" + run)
            ).length
        }
    },
    then(out) {
        out.staged
        out.counts.join(",") == "4,1"
        out.named.includes("Stage Signed is not a current stage")
        out.made == 4
    }
})

feature("disabling an offboarded rep in Admin lists their deals and moves them to a new owner", {
    when() {
        // a rep of Retail's East team, who owns one open deal
        system(() => {
            call("create#mantle.party.Party", {partyId: leaver, partyTypeEnumId: "PtyPerson"})
            call("create#mantle.party.Person", {partyId: leaver, firstName: "Leaving", lastName: "Rep " + run})
            call("create#mantle.party.PartyRelationship", {
                relationshipTypeEnumId: "PrtAgent",
                fromPartyId: leaver,
                toPartyId: ids.organizationId,
                toRoleTypeId: "OrgInternal",
                fromDate: 0
            })
            call("create#moqui.security.UserAccount", {
                userId: leaver,
                username: "sal.leaver." + run,
                partyId: leaver,
                currentPassword: "16ac58bbfa332c1c55bd98b53e60720bfa90d394",
                passwordHashType: "SHA"
            })
            for (const userGroupId of ["BOSS_USERS", "BOSS_SALES", "BOSS_SALES_REP"])
                call("create#moqui.security.UserGroupMember", {userId: leaver, userGroupId, fromDate: 0})
        })
        const dealId = asUser("sal.leaver." + run, () =>
            system(() =>
                invoke("mantle.sales.OpportunityServices.create#Opportunity", {
                    organizationPartyId: ids.organizationId,
                    opportunityName: "Leaver's deal " + run
                })
            )
        ).salesOpportunityId
        const preview = asUser(users.identity, () =>
            invoke("ironstone.admin.LifecycleServices.find#OwnedResources", {appRoot: "Admin", userId: leaver})
        )
        const sales = Array.from(preview.participantList || []).find(row => row.participantKey === "sales.assignments") || {}
        const confirmed = asUser(users.identity, () =>
            page(
                "Users/UserDetail/startLifecycle",
                {userId: leaver, kind: "disable", reason: "Left Retail", operationKey: "SAL-USABLE-" + run},
                "html",
                "Admin"
            )
        )
        const operationId = rows("mantle.party.UserLifecycleOperation", {operationKey: "SAL-USABLE-" + run})[0]?.operationId
        const step = rows("mantle.party.UserLifecycleOperationStep", {operationId: operationId || "_NA_"}).find(
            row => row.resourceId === "deal:" + dealId
        )
        const moved = asUser(users.identity, () =>
            invoke("ironstone.admin.LifecycleServices.transfer#OwnedResource", {
                appRoot: "Admin",
                operationId,
                stepSeqId: step?.stepSeqId,
                toUserId: "BOSS_SAL_REP"
            })
        )
        const owners = system(() =>
            Array.from(
                ec.entity
                    .find("mantle.sales.opportunity.SalesOpportunityParty")
                    .condition({salesOpportunityId: dealId, roleTypeId: "SalesRepresentative"})
                    .conditionDate("fromDate", "thruDate", ec.user.nowTimestamp)
                    .list()
            ).map(row => row.partyId)
        )
        return {dealId, sales, confirmed, step, moved, owners}
    },
    then(r) {
        r.sales.state == "ready"
        Array.from(r.sales.resourceList).some(resource => resource.resourceId === "deal:" + r.dealId)
        r.confirmed.errors.length == 0
        r.step != null
        r.owners.join(",") == "BOSS_SAL_REP"
    }
})

feature("Assist qualifies a lead only after the user approves the step; the user's Qualify makes the opportunity", {
    when() {
        // the opportunity tools (P6); P10's quote tools (sales_find_quotes, sales_preview_quote, sales_send_quote) are left out here
        const tools = rows("moqui.agent.AgentToolExposure", {}).filter(row =>
            /^sales_[a-z]+_opportunit/.test(String(row.toolName))
        )
        const skill = String(ec.resource.getLocationText("component://mr-boss/skill/sales-qualify-lead.md", false) || "")
        // a lead of the rep's, qualified by the rep's own Qualify on its OpportunityDetail
        const leadId = asUser(users.rep, () =>
            system(() =>
                invoke("mantle.sales.OpportunityServices.create#Opportunity", {
                    organizationPartyId: ids.organizationId,
                    typeEnumId: "SotLead",
                    opportunityName: "Usable lead " + run
                })
            )
        ).salesOpportunityId
        const revision = asUser(users.rep, () =>
            system(
                () =>
                    invoke("mantle.sales.OpportunityServices.get#Opportunity", {salesOpportunityId: leadId}).opportunity.revision
            )
        )
        const qualified = asUser(users.rep, () =>
            page(
                "Pipeline/OpportunityDetail/qualifyLead",
                {salesOpportunityId: leadId, expectedRevision: revision, accountPartyId: ids.accounts.wingtip},
                "html"
            )
        )
        return {
            tools: tools.map(row => row.toolName + ":" + row.classificationEnumId + ":" + row.exposeMcp).sort(),
            skill,
            qualified,
            lead: rows(OPPORTUNITY, {salesOpportunityId: leadId})[0]
        }
    },
    then(r) {
        // no tool qualifies a lead; the writes ask the user first and none is on MCP
        r.tools.join(",") ==
            "sales_close_opportunity:AgclWrite:N,sales_create_opportunity:AgclWrite:N,sales_find_opportunities:AgclRead:Y,sales_move_opportunity:AgclWrite:N"
        r.skill.includes("risk: confirm")
        r.skill.includes("Do not press Qualify")
        r.qualified.errors.length == 0
        r.lead.typeEnumId == "SotOpportunity"
        r.lead.accountPartyId == ids.accounts.wingtip
    }
})
