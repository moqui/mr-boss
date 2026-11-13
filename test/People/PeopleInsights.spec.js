// People's reports and its Insights registrations in BOSS (impl-people P29; design-people §12 Reports and Settings, §1.4 Shipped
// reports and Assist; impl-insights §7 "What waits on People", F70): the registrations resolve (the catalog entries, measures,
// attention providers, the datasets' classes, the flow target and the internal flow map's People step, each naming an existing
// service and screen; every shipped definition loads; no shipped document carries pay, tax, private contact or an identity
// number); Insights' catalog opens a People report on its route with the report chosen, and Mantle's catalogue offers the payroll
// register to payroll alone; a People dataset is read through Insights by a holder of People's Insights bundle, their own
// organization's rows, and by no other Insights reader; an Assist or MCP question on a People dataset is refused and none is
// listed as a source; Reports' one render (headcount as HR, with its denominator and export) and its CSV, and Preferences' one
// render (the People administrator's clocking default and case intake handlers by name). The report rules are Mantle's
// PeopleReports; the access cases are PeopleAccessLater's; the "usable when" is the acceptance PeopleReportsUsable.
// Run: ./moq test mr-boss --spec PeopleInsights
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, page} = lib
const analyst = "people.analyst"
const datasets = ["boss-people-headcount", "boss-people-leave-balances", "boss-people-qualifications"]
const definitions = datasets.concat(["boss-people-workforce", "boss-people-qualification-expiring"])
const documents = ["BossPeopleEmployment", "BossPeopleLeaveLedger", "BossPeopleQualification"]
const A = "ironstone.insights.AssistServices."
const R = "org.moqui.report.ReportServices."
// a route names a screen: its file, or a subscreens-item of its parent (the route's own parameters after "?" aside)
function screenExists(route) {
    const parts = String(route).split("?")[0].split("/")
    const base = "component://mr-boss/screen/"
    if (ec.resource.getLocationReference(base + parts.join("/") + ".xml").getExists()) return true
    const parent = ec.resource.getLocationReference(base + parts.slice(0, -1).join("/") + ".xml")
    return parent.getExists() && String(parent.getText()).includes('name="' + parts[parts.length - 1] + '"')
}

spec({
    setupSpec() {
        login("john.doe")
    }
})

feature("the registrations resolve, the definitions load and no shipped document carries pay or private data", {
    when() {
        const registered = system(() => ({
            catalog: Array.from(ec.entity.find("ironstone.insights.ReportCatalogEntry").condition("ownerApp", "People").list()),
            metrics: Array.from(ec.entity.find("ironstone.insights.MetricRegistration").condition("ownerApp", "People").list()),
            providers: Array.from(ec.entity.find("ironstone.insights.AttentionProvider").condition("ownerApp", "People").list()),
            classes: Array.from(ec.entity.find("ironstone.insights.DatasetClass").condition("domainOwner", "People").list()),
            targets: Array.from(ec.entity.find("ironstone.insights.FlowTarget").condition("ownerApp", "People").list()),
            admitted: Array.from(ec.entity.find("moqui.report.BusinessDataset").condition("datasetId", "in", datasets).list()),
            fields: Array.from(
                ec.entity.find("moqui.entity.document.DataDocumentField").condition("dataDocumentId", "in", documents).list()
            ).map(row => row.fieldNameAlias || String(row.fieldPath).split(":").pop())
        }))
        const problems = []
        for (const row of registered.catalog.concat(registered.metrics))
            for (const name of [row.catalogueService, row.serviceName].filter(Boolean))
                if (!ec.service.getServiceDefinition(name)) problems.push((row.entryId || row.metricId) + " names " + name)
        for (const row of registered.providers)
            if (!ec.service.getServiceDefinition(row.countService)) problems.push(row.providerKey + " names " + row.countService)
        for (const row of registered.catalog.concat(registered.providers, registered.targets))
            if (!screenExists(row.routePath))
                problems.push((row.entryId || row.providerKey || row.targetId) + " opens " + row.routePath)
        const loaded = definitions.map(definitionId => {
            const found = invoke(R + "get#Definition", {definitionId}).definition || {}
            return definitionId + " " + found.type
        })
        const flowMap = invoke(R + "get#Definition", {definitionId: "insights-flowmap-internal"}).definition || {}
        const peopleStep = Array.from(flowMap.body?.steps || []).find(step => step.stepId === "people") || {}
        return {registered, problems, loaded, peopleStep, templateVersion: flowMap.body?.templateVersion}
    },
    then({registered, problems, loaded, peopleStep, templateVersion}) {
        registered.catalog.map(row => row.entryId).sort() ==
            [
                "People.Attendance",
                "People.Expenses",
                "People.Headcount",
                "People.LeaveBalances",
                "People.PayrollRegister",
                "People.Qualifications",
                "People.Recruiting",
                "People.Reviews"
            ]
        registered.metrics.map(row => row.metricId).sort() == ["People.Headcount", "People.Turnover"]
        registered.providers.map(row => row.providerKey).sort() == ["People.Decisions", "People.NoManager", "People.Vacancies"]
        // every People dataset is People data, which Insights' Assist and MCP never admit (F70)
        registered.classes.map(row => row.datasetId + " " + row.classEnumId).sort() ==
            datasets.map(datasetId => datasetId + " InsDcPeople")
        registered.admitted.length == 3
        registered.targets.map(row => row.targetId) == ["People.Employees"]
        problems == []
        loaded ==
            [
                "boss-people-headcount dataset",
                "boss-people-leave-balances dataset",
                "boss-people-qualifications dataset",
                "boss-people-workforce dashboard",
                "boss-people-qualification-expiring alert"
            ]
        templateVersion == 3
        peopleStep.targetRegistrationId == "People.Employees"
        peopleStep.countProviderKey == "People.NoManager"
        peopleStep.catalogEntryId == "People.Headcount"
        registered.fields.length > 25
        registered.fields.filter(
            name =>
                /amount|salary|pay|tax|cost|rate|price|email|phone|address|reference|comments|description|reason$/i.test(name) &&
                !/Date$|EnumId$/.test(name)
        ) == []
    }
})

feature("Insights' catalog opens a People report with it chosen; the payroll register is payroll's alone", {
    when() {
        const entries = Array.from(invoke("ironstone.insights.RegistryServices.find#Reports", {ownerApp: "People"}).reports || [])
        const link = invoke("ironstone.insights.RegistryServices.get#ReportLink", {
            entryId: "People.Headcount",
            organizationPartyId: ids.organizationId,
            fromDate: "2026-01-01"
        })
        const catalogueOf = user =>
            asUser(user, () => {
                ec.artifactExecution.disableAuthz()
                return Array.from(invoke("mantle.humanres.PeopleReportServices.get#Options", {}).reports || []).map(
                    row => row.reportId
                )
            })
        return {
            entries: entries.map(row => row.entryId),
            headcountUrl: entries.find(row => row.entryId === "People.Headcount")?.url,
            link,
            hr: catalogueOf(users.hr),
            payroll: catalogueOf(users.payroll),
            recruiter: catalogueOf(users.recruiter),
            reader: asUser(users.reader, () => {
                ec.artifactExecution.disableAuthz()
                return refusal("mantle.humanres.PeopleReportServices.get#Options", {})
            })
        }
    },
    then({entries, headcountUrl, link, hr, payroll, recruiter, reader}) {
        // the system administrator reads every People report
        entries.length == 8
        headcountUrl == "/qapps/People/Reports?reportId=headcount"
        link.url == "/qapps/People/Reports?reportId=headcount&organizationPartyId=" + ids.organizationId + "&fromDate=2026-01-01"
        !hr.includes("payrollRegister")
        hr.includes("headcount")
        payroll == ["payrollRegister"]
        recruiter == ["recruiting"]
        reader.includes("PERMISSION_DENIED")
    }
})

// A People dataset through Insights: the analyst (an Insights reader with People's Insights bundle, Retail's) reads Retail's
// employments and never Services', whatever they send; an Insights reader without the bundle reads none. The demo's employments
// are indexed here.
feature("a People dataset is read through Insights by People's bundle alone, each its own organization's rows", {
    when() {
        system(() => {
            ec.search.indexDocuments(Array.from(ec.entity.getDataDocuments("BossPeopleEmployment", {})))
            ec.search.indexDocuments(Array.from(ec.entity.getDataDocuments("BossPeopleQualification", {})))
        })
        const seen = (user, extra) =>
            asUser(user, () => {
                const out = invoke(
                    R + "query#Documents",
                    Object.assign(
                        {datasetId: "boss-people-headcount", pageSize: 500, from: "now-9y", thru: "now+1y"},
                        extra || {}
                    )
                )
                return Array.from(out.hits || []).map(hit => hit.body?.organizationPartyId)
            })
        // a qualification's employers are a list (fromRelationships): Retail's analyst reads Retail's employees' alone
        const qualifications = asUser(analyst, () =>
            Array.from(
                invoke(R + "query#Documents", {
                    datasetId: "boss-people-qualifications",
                    pageSize: 100,
                    from: "now-1y",
                    thru: "now+5y"
                }).hits || []
            ).map(hit => hit.body?.partyQualificationId)
        )
        return {
            qualifications,
            retail: seen(analyst),
            forged: seen(analyst, {queryString: "organizationPartyId:" + ids.otherOrganizationId}),
            reader: asUser("insights.reader", () =>
                refusal(R + "query#Documents", {datasetId: "boss-people-headcount", from: "now-9y", thru: "now+1y"})
            )
        }
    },
    then({qualifications, retail, forged, reader}) {
        qualifications.includes(ids.firstAidId)
        !qualifications.includes(ids.otherQualificationId)
        retail.length > 5
        retail.every(id => id === ids.organizationId)
        forged == []
        reader != ""
    }
})

feature("an Assist or MCP question on a People dataset is refused, and no People dataset is offered as a source", {
    when() {
        return asUser(analyst, () => ({
            // a refusal the asker can act on is the answer: not available, with its code
            assist: invoke(A + "run#DatasetQuery", {datasetId: "boss-people-headcount", aggregate: "count"}),
            mcp: invoke(A + "run#OperationsQuery", {datasetId: "boss-people-qualifications", aggregate: "count"}),
            sources: Array.from(invoke(A + "find#QuerySources", {}).datasets || []).map(row => row.datasetId),
            mcpSources: Array.from(invoke(A + "find#OperationsSources", {}).datasets || []).map(row => row.datasetId)
        }))
    },
    then({assist, mcp, sources, mcpSources}) {
        assist.available == false
        assist.refusedCode == "DATASET_UNAVAILABLE"
        mcp.available == false
        mcp.refusedCode == "DATASET_UNAVAILABLE"
        sources.filter(id => id.startsWith("boss-people-")) == []
        mcpSources.filter(id => id.startsWith("boss-people-")) == []
    }
})

feature("Reports' one render and its CSV as HR, and Preferences' one render as the People administrator", {
    when() {
        const reports = asUser(users.hr, () => page("Reports", {reportId: "headcount", groupBy: "department"}))
        const csv = asUser(users.hr, () => {
            const result = ec.screen
                .makeTest()
                .rootScreen("component://mr-boss/screen/People.xml")
                .render("Reports/exportCsv", {reportId: "headcount", organizationPartyId: ids.organizationId}, null)
            return String(result.output || "")
        })
        const preferences = asUser(users.admin, () => page("Settings/Preferences", {organizationPartyId: ids.organizationId}))
        return {reports, csv, preferences}
    },
    then({reports, csv, preferences}) {
        reports.errors == []
        reports.output.includes("Headcount and turnover")
        reports.output.includes("Turnover is exits over the average headcount")
        reports.output.includes("Store")
        reports.output.includes("exportCsv")
        // HR is never offered the payroll register
        !reports.output.includes("Payroll register")
        csv.startsWith("Headcount and turnover")
        csv.includes("Employer,Headcount at start,Headcount at end")
        preferences.errors == []
        preferences.output.includes("Clocking")
        preferences.output.includes("Confidential cases go to")
        preferences.output.includes("People Case handler")
    }
})
