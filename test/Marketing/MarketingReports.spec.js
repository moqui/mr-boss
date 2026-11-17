// Marketing's reports (impl-marketing P20; design-marketing §11 Reports, CampaignPerformance): CampaignPerformance's one qvt render for
// the analyst, with all of its checks on that render (the options, the demo running campaign's row, the basis, the CSV and print); the
// Reports tabs of a report reader and the area refused to an author who reads no report; Marketing's entries in Insights' catalog shown
// through Marketing's catalogue to a report reader and hidden from a user without the report permission;
// the weekly digest's dashboard computing each of its panels. The rules are Mantle's
// (test/marketing/MarketingReports, Attribution, MarketingRetention); the scenario is the acceptance MarketingReportsScenario.
// Run: ./moq test mr-boss --spec MarketingReports
const lib = ec.resource.script("component://mr-boss/test/Marketing/MarketingSpecLib.js")
const {ids, users, asUser, invoke, page, system, screenRefusal, shell} = lib
const marketingEntries = [
    "Marketing.Attribution",
    "Marketing.AudienceGrowth",
    "Marketing.CampaignPerformance",
    "Marketing.DeliveryAnalysis"
]

// the analyst and the author open Insights for this spec (its launcher and reader groups), so its catalog asks Marketing's catalogue
// as each
const insightsGroups = ["BOSS_INSIGHTS", "BOSS_INSIGHTS_READ"]
const insightsUserIds = ["BOSS_MKT_ANALYST", "BOSS_MKT_AUTHOR"]
const memberRows = () =>
    Array.from(
        ec.entity
            .find("moqui.security.UserGroupMember")
            .condition("userGroupId", "in", insightsGroups)
            .condition("userId", "in", insightsUserIds)
            .disableAuthz()
            .list()
    )

spec({
    setupSpec() {
        system(() => {
            for (const userId of insightsUserIds)
                for (const userGroupId of insightsGroups)
                    ec.service
                        .sync()
                        .name("create#moqui.security.UserGroupMember")
                        .parameters({userId, userGroupId, fromDate: new Date(Date.now() - 60000)})
                        .call()
        })
    },
    cleanupSpec() {
        system(() => memberRows().forEach(row => row.delete()))
    }
})

feature("CampaignPerformance shows the organization's campaigns with their basis, CSV and print to the analyst", {
    when() {
        return {
            report: asUser(users.analyst, () =>
                page("Reports/CampaignPerformance", {organizationPartyId: ids.organizationId, includeChildren: "true"})
            )
        }
    },
    then({report}) {
        report.status == 200 && report.errors.length == 0
        !report.output.includes("Error rendering") && !report.output.includes("Exception in render")
        report.output.includes("Campaign performance") && report.output.includes("Run report")
        // the running demo campaign meets the last 30 days; its children counted once
        report.output.includes("Spring garden launch")
        report.output.includes("Accepted sends") && report.output.includes("Invoiced net") && report.output.includes("ROI")
        report.output.includes("never added across currencies")
        report.output.includes("renderMode=html-print")
        // another organization's campaign is not shown
        !report.output.includes("Service plan renewals")
    }
})

feature("the Reports tabs for a report reader; the area refused to an author; the catalog by the report permission", {
    when() {
        const tabs = shell(users.analyst, true, "Reports/Catalog", "Reports")
        const author = screenRefusal(users.author, "Reports/Catalog")
        const reader = screenRefusal(users.reader, "Reports/Catalog")
        // Insights' catalog reads Marketing's catalogue as the user
        const catalogOf = user =>
            asUser(user, () =>
                Array.from(invoke("ironstone.insights.RegistryServices.find#Reports", {}).reports || [])
                    .map(row => row.entryId)
                    .filter(id => id.startsWith("Marketing."))
                    .sort()
            )
        return {tabs, author, reader, analystCatalog: catalogOf(users.analyst), authorCatalog: catalogOf(users.author)}
    },
    then({tabs, author, reader, analystCatalog, authorCatalog}) {
        tabs.names == ids.reportsMenu
        author != "" && reader == ""
        analystCatalog == marketingEntries
        authorCatalog == []
    }
})

feature(
    "the registrations name existing services and screens; every shipped definition loads; the audience dataset is the reader's own organizations'",
    {
        when() {
            const registered = system(() => ({
                catalog: Array.from(
                    ec.entity.find("ironstone.insights.ReportCatalogEntry").condition("ownerApp", "Marketing").list()
                ),
                metrics: Array.from(
                    ec.entity.find("ironstone.insights.MetricRegistration").condition("ownerApp", "Marketing").list()
                ),
                providers: Array.from(
                    ec.entity.find("ironstone.insights.AttentionProvider").condition("ownerApp", "Marketing").list()
                ),
                fields: Array.from(
                    ec.entity
                        .find("moqui.entity.document.DataDocumentField")
                        .condition("dataDocumentId", "in", ["BossMarketingDelivery", "BossMarketingMembership"])
                        .list()
                ).map(row => row.fieldNameAlias || String(row.fieldPath).split(":").pop())
            }))
            const problems = []
            for (const row of registered.metrics)
                if (!ec.service.getServiceDefinition(row.serviceName)) problems.push(row.metricId + " names " + row.serviceName)
            for (const row of registered.providers)
                if (!ec.service.getServiceDefinition(row.countService))
                    problems.push(row.providerKey + " names " + row.countService)
            for (const row of registered.catalog.concat(registered.providers)) {
                const parts = String(row.routePath).split("/")
                const parent = ec.resource.getLocationReference(
                    "component://mr-boss/screen/" + parts.slice(0, -1).join("/") + ".xml"
                )
                const file = ec.resource.getLocationReference("component://mr-boss/screen/" + row.routePath + ".xml")
                if (!file.getExists() && !String(parent.getText()).includes('name="' + parts[parts.length - 1] + '"'))
                    problems.push((row.entryId || row.providerKey) + " opens " + row.routePath)
            }
            const loaded = [
                "boss-marketing-deliveries",
                "boss-marketing-audience",
                "boss-marketing-campaigns",
                "boss-marketing-complaint-spike",
                "boss-marketing-bounce-rate",
                "boss-marketing-uncertain-backlog",
                "boss-marketing-weekly-digest"
            ].map(
                definitionId =>
                    definitionId +
                    " " +
                    (invoke("org.moqui.report.ReportServices.get#Definition", {definitionId}).definition || {}).type
            )
            // a Retail membership of the demo indexed again, and a copy of it as Services' row
            const otherDocId = "BOSS_MKT_SPEC_SERVICES_ROW"
            system(() => {
                const retail = Array.from(
                    ec.entity.getDataDocuments("BossMarketingMembership", {contactListId: ids.gardenListId})
                )
                const services = Object.assign({}, retail[0], {
                    _id: otherDocId,
                    contactListId: otherDocId,
                    organizationPartyId: ids.otherOrganizationId
                })
                ec.search.indexDocuments(retail.concat([services]))
            })
            // the totals by list (an aggregate), and the records themselves, which name the member in their key (P20 review)
            const attempt = action => {
                ec.message.pushErrors()
                try {
                    const out = action()
                    return ec.message.hasError() ? {error: ec.message.getErrorsString()} : {out}
                } catch (error) {
                    return {error: String(error.message)}
                } finally {
                    ec.message.clearErrors()
                    ec.message.popErrors()
                }
            }
            const seen = extra =>
                asUser(users.analyst, () => {
                    const found = attempt(() =>
                        invoke("org.moqui.report.ReportServices.run#Query", {
                            query: Object.assign(
                                {
                                    datasetId: "boss-marketing-audience",
                                    from: "now-5y",
                                    thru: "now+1d",
                                    aggregations: [
                                        {id: "list", type: "terms", role: "x-axis", params: {field: "contactListId", size: 200}}
                                    ]
                                },
                                extra || {}
                            )
                        })
                    )
                    return found.error ? "ERROR " + found.error : JSON.stringify(found.out)
                })
            const records = asUser(users.analyst, () =>
                attempt(() =>
                    invoke("org.moqui.report.ReportServices.query#Documents", {
                        datasetId: "boss-marketing-audience",
                        pageSize: 200,
                        from: "now-5y",
                        thru: "now+1d"
                    })
                )
            )
            const memberKey = system(
                () => Array.from(ec.entity.getDataDocuments("BossMarketingMembership", {contactListId: ids.gardenListId}))[0]?._id
            )
            try {
                return {
                    registered,
                    problems,
                    loaded,
                    own: seen(),
                    forged: seen({queryString: "organizationPartyId:" + ids.otherOrganizationId}),
                    records,
                    memberKey,
                    otherDocId
                }
            } finally {
                system(() => ec.search.deleteDocument("BossMarketingMembership", otherDocId))
            }
        },
        then({registered, problems, loaded, own, forged, records, memberKey, otherDocId}) {
            registered.catalog.length == 4 && registered.metrics.length == 2 && registered.providers.length == 4
            problems == []
            // no person, address or token in a shipped document
            registered.fields.filter(
                name => /party|address|email|token|name$/i.test(name) && !/organizationPartyId|contactListName/.test(name)
            ) == []
            loaded ==
                [
                    "boss-marketing-deliveries dataset",
                    "boss-marketing-audience dataset",
                    "boss-marketing-campaigns dashboard",
                    "boss-marketing-complaint-spike alert",
                    "boss-marketing-bounce-rate alert",
                    "boss-marketing-uncertain-backlog alert",
                    "boss-marketing-weekly-digest report"
                ]
            // the Retail analyst reads Retail's memberships, never Services' copy, whatever they ask
            !own.startsWith("ERROR") && own.includes(ids.gardenListId) && !own.includes(otherDocId)
            !forged.includes(otherDocId)
            // a membership record's key carries its member: the records are no reader's, only the totals
            String(memberKey).split("::").length == 3
            String(records.error).includes("ROWS_RESTRICTED")
        }
    }
)

feature("the weekly digest's dashboard computes every panel for the analyst, the memberships by list name among them", {
    when() {
        // the digest's dashboards with the digest's own ranges, as its delivery renders them (the terms on contactListName need
        // the field sortable: without it the memberships panel was an aggregation error, TUI review 2026-11-16)
        const digest = system(
            () => invoke("org.moqui.report.ReportServices.get#Definition", {definitionId: "boss-marketing-weekly-digest"}).definition
        )
        // the digest's last seven days reach back at least to the fixture's newest Garden membership, whose date is fixed in the
        // demo data: the panels are checked, not the day the suite runs
        const newest = system(() =>
            Array.from(ec.entity.find("mantle.marketing.contact.ContactListParty").condition("contactListId", ids.gardenListId)
                .orderBy("-fromDate").list())[0]
        )
        const sinceDays = Math.ceil((Date.now() - Number(newest.fromDate)) / 86400000) + 1
        const reach = (from) => (from === "now-7d" && sinceDays > 7 ? `now-${sinceDays}d` : from)
        const panels = {}
        asUser(users.analyst, () => {
            for (const spec of digest.body.dashboards) {
                const dashboard = invoke("org.moqui.report.ReportServices.render#Dashboard", {
                    definitionId: spec.dashboardRef,
                    from: reach(spec.from),
                    thru: spec.thru
                }).dashboard
                for (const [id, panel] of Object.entries(dashboard.panels || {})) panels[id] = panel
            }
        })
        return {panels}
    },
    then({panels}) {
        Object.keys(panels).sort() == ["byOrganization", "deliveriesByState", "memberships", "receipts"]
        Object.entries(panels).filter(([, panel]) => (panel.notices || []).some(notice => notice.level === "error")).map(([id]) => id) == []
        JSON.stringify(panels.memberships.frames).includes("Garden newsletter")
    }
})
