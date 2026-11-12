// Maintenance reports in BOSS (impl-maintenance P17; design-maintenance §8 Reports and WorkStatusReport, §1.4 Shipped reports; Insights'
// registries, impl-insights §7): Maintenance's catalogue lists its reports to a maintenance reader and refuses a technician and
// another app's user, and Insights' catalog shows the same entries; the registrations name existing services and screens; the shipped
// datasets' documents carry no amount, cost or rate and every shipped definition loads; Work status's and the Reports landing's one qvt
// render each (the supervisor's: the demo's open work by team, its rows opening WorkOrderDetail, the CSV and Print offered; the
// landing's cards and report links). The counting rules are Mantle's MaintenanceReports; the access rule is MaintenanceAccess'; the
// "usable when" is the acceptance MaintenanceReportsWalk.
// Run: ./moq test mr-boss --spec MaintenanceReports
const lib = ec.resource.script("component://mr-boss/test/Maintenance/MaintenanceSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, page} = lib
const catalogue = "ironstone.maintenance.ReportServices.get#ReportCatalogue"
const documents = ["BossMaintenanceWorkOrder", "BossMaintenanceOccurrence", "BossMaintenanceOutage"]
const definitions = [
    "boss-maintenance-work-status",
    "boss-maintenance-pm-compliance",
    "boss-maintenance-outages",
    "boss-maintenance-operations",
    "boss-maintenance-overdue-pm",
    "boss-maintenance-resource-down",
    "boss-maintenance-generation-failed"
]
const entryIdsOf = user =>
    asUser(user, () => Array.from(invoke(catalogue, {appRoot: "Maintenance"}).reports || []).map(row => row.entryId))

spec({
    setupSpec() {
        login("john.doe")
    }
})

feature(
    "the catalogue is a maintenance reader's, in Insights' catalog too; the registrations hold; the datasets carry no amount",
    {
        when() {
            const insightsEntries = Array.from(invoke("ironstone.insights.RegistryServices.find#Reports", {}).reports || [])
                .map(row => row.entryId)
                .filter(id => id.startsWith("Maintenance."))
            const registered = system(() => ({
                catalog: Array.from(
                    ec.entity.find("ironstone.insights.ReportCatalogEntry").condition("ownerApp", "Maintenance").list()
                ),
                metrics: Array.from(
                    ec.entity.find("ironstone.insights.MetricRegistration").condition("ownerApp", "Maintenance").list()
                ),
                providers: Array.from(
                    ec.entity.find("ironstone.insights.AttentionProvider").condition("ownerApp", "Maintenance").list()
                ),
                classes: Array.from(
                    ec.entity.find("ironstone.insights.DatasetClass").condition("domainOwner", "Maintenance").list()
                ),
                fields: Array.from(
                    ec.entity.find("moqui.entity.document.DataDocumentField").condition("dataDocumentId", "in", documents).list()
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
            const loaded = definitions.map(definitionId => {
                const found = invoke("org.moqui.report.ReportServices.get#Definition", {definitionId}).definition || {}
                return definitionId + " " + found.type
            })
            return {
                reader: entryIdsOf(users.reader),
                supervisor: entryIdsOf(users.supervisor),
                tech: asUser(users.tech, () => refusal(catalogue, {appRoot: "Maintenance"})),
                otherApp: asUser(users.otherApp, () => refusal(catalogue, {appRoot: "Maintenance"})),
                insightsEntries,
                registered,
                problems,
                loaded
            }
        },
        then({reader, supervisor, tech, otherApp, insightsEntries, registered, problems, loaded}) {
            reader == ["Maintenance.WorkStatus", "Maintenance.PreventiveCompliance"]
            supervisor == reader
            tech.includes("PERMISSION_DENIED")
            otherApp != ""
            // the system administrator, who reads maintenance work, sees the same entries in Insights' catalog
            insightsEntries.sort() == ["Maintenance.PreventiveCompliance", "Maintenance.WorkStatus"]
            registered.metrics.map(row => row.metricId).sort() ==
                ["Maintenance.Backlog", "Maintenance.OnTimePm", "Maintenance.OverduePm"]
            registered.providers.length == 3
            registered.classes.length == 3
            problems == []
            // restricted values: no amount, cost, rate or price in any shipped document
            registered.fields.length > 30
            registered.fields.filter(name => /amount|cost|price|^rate|Rate[A-Z]|Rate$/i.test(name) && !/Date$/.test(name)) == []
            loaded ==
                [
                    "boss-maintenance-work-status dataset",
                    "boss-maintenance-pm-compliance dataset",
                    "boss-maintenance-outages dataset",
                    "boss-maintenance-operations dashboard",
                    "boss-maintenance-overdue-pm alert",
                    "boss-maintenance-resource-down alert",
                    "boss-maintenance-generation-failed alert"
                ]
        }
    }
)

feature("Work status's and the Reports landing's one render each, as the supervisor", {
    when() {
        const status = asUser(users.supervisor, () =>
            page("Reports/WorkStatusReport", {lastStandalone: "true", organizationPartyId: ids.organizationId})
        )
        const overview = asUser(users.supervisor, () => page("Reports/Overview", {lastStandalone: "true"}))
        return {status, overview}
    },
    then({status, overview}) {
        status.errors == []
        status.output.includes("Totals")
        status.output.includes("By team")
        status.output.includes("Facilities maintenance")
        // the demo's air handler leak is open: backlog, a row; the rows export as CSV
        status.output.includes(ids.inProgressOrderId)
        status.output.includes("renderMode=csv")
        status.output.includes("Print")
        !/amount|cost/i.test(status.output.replace(/costCenter|Cost centre/g, ""))
        overview.errors == []
        overview.output.includes("Work status · backlog now")
        overview.output.includes("PM compliance · on time")
        overview.output.includes("Downtime · resources down")
        overview.output.includes("Reports/WorkStatusReport")
    }
})
