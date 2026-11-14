// Sales Home, the shell and Admin's offboarding of Sales (impl-sales P6; design-sales §3 Home, §12.2, §1.4; design-admin §14):
// Home's one qvt render for the representative (the counters, each the count of the list it opens; the counters of what is not built
// yet not configured; their assigned work and pipeline; the funnel's box), the Sales today-source naming the rep's deal due to close
// and nothing for another user's Today, the quick create's activity on a deal through its transition, the import wizard's Sales
// mount (the opportunities target for a manager, refused to a rep), and Admin's lifecycle listing the rep's deals and accounts
// through Sales' participant to the identity operator and the administrator (SALES_OWNER_CHANGE, the user's call of Nov 13). The
// rules are Mantle's SalesWorkspace, SalesOpportunityImport and SalesPipelineDataset; the "usable when" is the acceptance
// SalesHomeUsable.
// Run: ./moq test mr-boss --spec SalesHome
const lib = ec.resource.script("component://mr-boss/test/Sales/SalesSpecLib.js")
const {ids, users, asUser, system, invoke, refusal, page} = lib
const {deals} = ids

spec({
    setupSpec() {
        login("john.doe")
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("Home's counters are their lists' counts, with the rep's assigned work, pipeline and funnel", {
    when() {
        const home = asUser(users.rep, () => page("Home"))
        // Home's counters and the Leads list's count, as the rep under Home's grant (its authorization off here)
        const counters = asUser(users.rep, () =>
            system(() => Array.from(invoke("mantle.sales.SalesWorkspaceServices.get#SalesHome", {}).counters || []))
        )
        const leadsCount = asUser(users.rep, () =>
            system(
                () =>
                    invoke("mantle.sales.OpportunityServices.find#Opportunities", {
                        typeEnumId: "SotLead",
                        statusId: "SalesOppOpen",
                        pageSize: 1
                    }).opportunityListCount
            )
        )
        return {home, leads: counters.find(counter => counter.counterKey === "leads") || {}, leadsCount}
    },
    then({home, leads, leadsCount}) {
        home.errors.length == 0
        leads.state == "ready"
        leads.count == leadsCount
        leads.count > 0
        // the card shows the count and opens the list it counts
        home.output.includes('title="Leads to work" value="' + leadsCount + '"')
        leads.listPath == "Pipeline/Leads"
        home.output.includes("My open opportunities")
        // P11: the quote and order counters are counts too, never "Not configured"
        !home.output.includes("Not configured")
        home.output.includes("Quotes to send")
        home.output.includes("Assigned to me")
        home.output.includes("Wingtip stores refit")
        home.output.includes("My pipeline")
        home.output.includes("Pipeline by stage")
        home.output.includes("New opportunity")
        // another team's deal is not the rep's
        !home.output.includes("Contoso lab pilot")
    }
})

feature("Today names the rep's deal due to close and none of another user's; quick create schedules an activity on a deal", {
    when() {
        const thruDate = new Date(Date.now() + 400 * 86400000)
        const today = asUser(users.rep, () =>
            invoke("ironstone.sales.ContextServices.get#TodayItems", {userId: ec.user.userId, thruDate})
        )
        const other = asUser(users.rep, () => invoke("ironstone.sales.ContextServices.get#TodayItems", {userId: "BOSS_SAL_REP2"}))
        const before = system(() =>
            ec.entity
                .find("mantle.sales.opportunity.SalesOpportunityWorkEffort")
                .condition("salesOpportunityId", deals.wingtip)
                .count()
        )
        const scheduled = asUser(users.rep, () =>
            page(
                "QuickCreate/NewActivity/addActivity",
                {
                    salesOpportunityId: deals.wingtip,
                    workEffortName: "Quick create follow-up",
                    estimatedCompletionDate: "2099-01-05"
                },
                "html"
            )
        )
        const after = system(() =>
            ec.entity
                .find("mantle.sales.opportunity.SalesOpportunityWorkEffort")
                .condition("salesOpportunityId", deals.wingtip)
                .count()
        )
        return {
            items: Array.from(today.items || []),
            label: today.label,
            other: Array.from(other.items || []),
            before,
            after,
            scheduled
        }
    },
    then(r) {
        r.label == "Sales"
        r.items.some(item => item.record.recordId === deals.wingtip)
        r.items.every(item => item.canUpdate === false)
        r.other.length == 0
        r.scheduled.errors.length == 0
        r.after == r.before + 1
    }
})

feature("the import wizard's Sales mount is the opportunities target for a manager and refused to a rep", {
    when() {
        const contextOf = user =>
            asUser(user, () => {
                ec.message.pushErrors()
                try {
                    // as the wizard's screen calls it, under the Sales root's grant (its authorization off here)
                    const out = system(() => invoke("ironstone.shared.DataImportServices.get#ImportContext", {appRoot: "Sales"}))
                    return ec.message.hasError() ? {refused: ec.message.getErrorsString()} : out
                } catch (error) {
                    return {refused: String(error.message)}
                } finally {
                    ec.message.clearErrors()
                    ec.message.popErrors()
                }
            })
        return {manager: contextOf(users.manager), rep: contextOf(users.rep)}
    },
    then({manager, rep}) {
        manager.targetId == "opportunities"
        manager.importMount.canRun == true
        String(rep.refused).includes("SALES_TEAM_VIEW is required")
    }
})

feature("Admin's lifecycle lists the rep's deals through Sales' participant to the identity operator and the administrator", {
    when() {
        const participantOf = user =>
            asUser(
                user,
                () =>
                    Array.from(
                        invoke("ironstone.admin.LifecycleServices.find#OwnedResources", {
                            appRoot: "Admin",
                            userId: "BOSS_SAL_REP"
                        }).participantList || []
                    ).find(entry => entry.participantKey === "sales.assignments") || {}
            )
        return {identity: participantOf(users.identity), admin: participantOf("admin.admin")}
    },
    then({identity, admin}) {
        identity.state == "ready"
        Array.from(identity.resourceList).some(resource => resource.resourceId === "deal:" + deals.wingtip)
        admin.state == "ready"
        Array.from(admin.resourceList).some(resource => resource.resourceId === "deal:" + deals.wingtip)
    }
})
