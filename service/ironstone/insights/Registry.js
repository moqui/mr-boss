// Insights' registries (impl-insights P4; design-insights §6.1, §6.2, §6.3, §4 MeasureMeaning and PanelDetail): the report
// catalog, the metric registrations, the user's report pins and their saved reports. The catalog and the metrics are BOSS seed
// records each owner fills (ironstone.insights ReportCatalogEntry and MetricRegistration, impl-insights §4); they hold
// navigation and meaning only. Nothing here grants what an owner refuses:
// - whether a viewer reads a catalog entry is its owner's catalogue service, called as the viewer, where one is registered
//   (Customer Service's and Commerce's get#ReportCatalogue, Accounting's get#Catalog by reportId, F17), else whether the
//   entry's route opens to the viewer's own groups, as the framework decides a screen path; no report runs on a catalog read;
// - a metric's formula, scope and private fields stay its owner's service or dataset: get#Metric answers the descriptor (basis,
//   grain, denominator, exclusions and the comparison rules) and a panel's target comparison, never a value of its own;
// - pins are the user's InsightsHome UserPreference (design §3), over entries they read; a pin edits the preference only;
// - saved reports are the report engine's definitions the viewer reads (as the viewer) and the saved finds of the viewer and
//   their groups, kept apart, each with the route it opens or why it does not.
// A registration naming a missing service is logged by name and left out; an owner's catalogue that fails is named among the
// unavailable owners and the others still answer.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const {find, one, rows, denied} = lib
const insights = ec.resource.script("component://mr-boss/service/ironstone/insights/Insights.js")
const admin = ec.resource.script("component://mr-boss/service/ironstone/admin/Admin.js")
const R = "org.moqui.report.ReportServices."

const homeKey = "InsightsHome"
const ownerNames = {
    Accounting: "Accounting",
    Commerce: "Commerce",
    CustomerService: "Customer Service",
    Manufacturing: "Manufacturing",
    Products: "Products",
    Projects: "Projects",
    Purchasing: "Purchasing",
    Sales: "Sales",
    Warehouse: "Warehouse"
}
// the refusals an owner's catalogue answers a user without its app, which hide its entries quietly
const refusalText = /not available|authority is required|PERMISSION_DENIED|_UNAVAILABLE|may not|is required/
const blank = value => value == null || value === ""
const list = text =>
    String(text || "")
        .split(",")
        .map(item => item.trim())
        .filter(Boolean)

function viewer() {
    const userScope = insights.required()
    if (!userScope.capabilities.view) denied("INSIGHTS_VIEW_REQUIRED", "Reports and measures need Insights read")
    return userScope
}
// An owner's service as the viewer, in its own transaction and error frame, so its own checks apply and a failure is named,
// not a rollback of the page.
function ownerCall(serviceName, parameters) {
    ec.message.pushErrors()
    try {
        const result = ec.service.sync().name(serviceName).parameters(parameters).requireNewTransaction(true).call() || {}
        if (ec.message.hasError()) throw new Error(ec.message.getErrorsString())
        return result
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
}
// A report engine call as the viewer: the engine checks the operation's grant, the owner and each dataset itself.
function engine(name, parameters) {
    const out = ec.service.sync().name(name).parameters(parameters).call() || {}
    if (ec.message.hasError()) throw new Error(ec.message.getErrorsString())
    return out
}

// ===== registrations =====
// The enabled rows of a registry whose services exist, each invalid one logged by name and left out.
function registered(entityName, keyField, serviceFields) {
    const known = new Map()
    const exists = name => {
        if (!known.has(name)) known.set(name, !!ec.service.getServiceDefinition(name))
        return known.get(name)
    }
    const valid = []
    for (const row of rows(entityName, {})) {
        if (row.disabled === "Y") continue
        const missing = serviceFields.map(field => row[field]).find(name => !blank(name) && !exists(name))
        if (missing) {
            ec.logger.error("Insights registry " + entityName + " " + row[keyField] + " names a missing service " + missing)
            continue
        }
        valid.push(row)
    }
    return valid.sort((a, b) => (a.sequenceNum ?? 999) - (b.sequenceNum ?? 999) || String(a[keyField]).localeCompare(b[keyField]))
}
const catalogEntries = () =>
    registered("ironstone.insights.ReportCatalogEntry", "entryId", ["catalogueService", "optionsService"])
const metricRegistrations = () => registered("ironstone.insights.MetricRegistration", "metricId", ["serviceName"])

// ===== catalog read =====
// The app a route or an owner's catalogue answers for: the route's first segment, else the owner.
const appOf = entry => (entry.routePath ? String(entry.routePath).split("/")[0] : entry.ownerApp)
// The reader of a call: each owner's catalogue is called once (by service and app), and the user's screen grants read once.
function reader() {
    const catalogues = new Map()
    const unavailable = new Set()
    let grants = null
    const catalogueKeys = entry => {
        const key = entry.catalogueService + "|" + appOf(entry)
        if (!catalogues.has(key)) {
            let keys = new Set()
            try {
                const answer = ownerCall(entry.catalogueService, {appRoot: appOf(entry)})
                keys = new Set(Array.from(answer.reports || []).map(row => row.entryId || row.reportId))
            } catch (error) {
                // a user without the owner's app is refused there: its entries are hidden; any other failure is named
                if (!refusalText.test(String(error.message))) {
                    ec.logger.error("Insights catalog: " + entry.catalogueService + " failed: " + error.message)
                    unavailable.add(ownerNames[entry.ownerApp] || entry.ownerApp)
                }
            }
            catalogues.set(key, keys)
        }
        return catalogues.get(key)
    }
    return {
        unavailable,
        reads(entry) {
            try {
                if (!blank(entry.catalogueService)) return catalogueKeys(entry).has(entry.catalogueKey || entry.entryId)
                if (blank(entry.routePath)) return false
                grants = grants || insights.grants()
                return admin.destinationOpens(grants, entry.routePath)
            } catch (error) {
                ec.logger.error("Insights catalog entry " + entry.entryId + " was not checked: " + error.message)
                return false
            }
        }
    }
}
function readableEntry(entryId) {
    const entry = catalogEntries().find(row => row.entryId === entryId)
    if (!entry || !reader().reads(entry)) denied("REPORT_UNAVAILABLE", "Report " + entryId + " is not available")
    return entry
}

// ===== pins (the InsightsHome UserPreference, design §3) =====
function home() {
    const stored = lib.json(ec.user.getPreference(homeKey), null) || {}
    return {
        organizationPartyId: stored.organizationPartyId || null,
        dashboardDefinitionId: stored.dashboardDefinitionId || null,
        orderedPanelIds: Array.isArray(stored.orderedPanelIds) ? stored.orderedPanelIds : [],
        pinnedReportIds: Array.isArray(stored.pinnedReportIds) ? stored.pinnedReportIds.map(String) : [],
        revision: Number(stored.revision || 0)
    }
}

// find#Reports: the entries the viewer reads, pinned first in their order, then by purpose and the owners' sequence; filtered
// by owner, purpose, text and pinned only. Each with its owner, basis, formats, the route it opens (none for a report opened
// from a record) and whether it is pinned; the owners whose catalogue failed are named apart.
function findReports(p) {
    viewer()
    const pins = home()
    const read = reader()
    const text = String(p.text || "")
        .trim()
        .toLowerCase()
    const pinnedOnly = p.pinnedOnly === true || p.pinnedOnly === "true" || p.pinnedOnly === "Y"
    const all = catalogEntries().filter(entry => read.reads(entry))
    const reports = all
        .filter(entry => blank(p.ownerApp) || entry.ownerApp === p.ownerApp)
        .filter(entry => blank(p.purpose) || entry.purpose === p.purpose)
        .filter(
            entry =>
                !text ||
                [entry.title, entry.description, entry.basis, ownerNames[entry.ownerApp]].some(value =>
                    String(value || "")
                        .toLowerCase()
                        .includes(text)
                )
        )
        .map(entry => {
            const pinIndex = pins.pinnedReportIds.indexOf(entry.entryId)
            return {
                entryId: entry.entryId,
                ownerApp: entry.ownerApp,
                ownerName: ownerNames[entry.ownerApp] || entry.ownerApp,
                title: entry.title,
                description: entry.description || "",
                purpose: entry.purpose || "",
                basis: entry.basis || "",
                url: entry.routePath ? "/qapps/" + entry.routePath : null,
                opensFrom: entry.routePath ? "" : "Opens from a record",
                formats: entry.exportFormats || "",
                metricIds: list(entry.metricIds),
                hasOptions: !!entry.routePath && list(entry.parameterContract).length > 0,
                pinned: pinIndex >= 0,
                pinSequence: pinIndex,
                sequenceNum: entry.sequenceNum ?? 999
            }
        })
        .filter(row => !pinnedOnly || row.pinned)
        .sort(
            (a, b) =>
                (a.pinned ? a.pinSequence : 1e6) - (b.pinned ? b.pinSequence : 1e6) ||
                a.purpose.localeCompare(b.purpose) ||
                a.sequenceNum - b.sequenceNum
        )
    const owners = Array.from(new Set(all.map(entry => entry.ownerApp))).sort()
    const purposes = Array.from(new Set(all.map(entry => entry.purpose).filter(Boolean))).sort()
    return {
        reports,
        ownerOptions: owners.map(owner => ({key: owner, text: ownerNames[owner] || owner})),
        purposeOptions: purposes.map(purpose => ({key: purpose, text: purpose})),
        unavailableOwners: Array.from(read.unavailable).sort(),
        pinRevision: pins.revision
    }
}

// store#ReportPins: pin or unpin one entry in the caller's InsightsHome preference, at sequenceNum (its place among the pins,
// from 0) or at the end. Only an entry the caller reads is pinned; unpinning needs nothing. A stale expectedRevision is refused.
function storeReportPins(p) {
    viewer()
    if (blank(p.entryId)) denied("REPORT_REQUIRED", "Choose a report")
    const preference = home()
    if (!blank(p.expectedRevision) && Number(p.expectedRevision) !== preference.revision)
        denied("PINS_CHANGED", "Your pins changed since you read them; reload and try again")
    const pinned = p.pinned === true || p.pinned === "true" || p.pinned === "Y"
    const ids = preference.pinnedReportIds.filter(id => id !== p.entryId)
    if (pinned) {
        readableEntry(p.entryId)
        const at = blank(p.sequenceNum) ? ids.length : Math.max(0, Math.min(ids.length, Number(p.sequenceNum)))
        ids.splice(at, 0, p.entryId)
    }
    preference.pinnedReportIds = ids
    preference.revision += 1
    ec.user.setPreference(homeKey, JSON.stringify(preference))
    return {pinnedReportIds: ids, revision: preference.revision}
}

// ===== report options (design §6 ReportContext) =====
const day = offset => ec.l10n.format(new Date(Date.now() + offset * 86400000), "yyyy-MM-dd")
// The organization's own fiscal periods, newest first (design §6.3: fiscal ranges from the organization's calendar).
function periodOptions(organizationPartyId) {
    if (!organizationPartyId) return []
    return Array.from(
        find("mantle.party.time.TimePeriod").condition("partyId", organizationPartyId).orderBy("-fromDate").limit(36).list()
    ).map(row => ({key: row.timePeriodId, text: row.periodName || row.timePeriodId}))
}
// get#ReportOptions: the shared parameters an entry's route takes (its parameter contract), typed, with the organization in
// scope and the default range; the owner's own options when it registers an options service, called as the viewer. Nothing
// runs the report.
function reportOptions(p) {
    viewer()
    const entry = readableEntry(p.entryId)
    const context = insights.execute("context", {appRoot: "Insights", organizationPartyId: p.organizationPartyId || null})
    const organizationPartyId = context.organizationPartyId || null
    const fields = []
    for (const name of list(entry.parameterContract)) {
        if (name === "organizationPartyId")
            fields.push({
                name,
                title: "Organization",
                type: "choice",
                options: context.organizations.map(row => ({key: row.value, text: row.label})),
                value: organizationPartyId
            })
        else if (name === "fromDate") fields.push({name, title: "From", type: "date", value: day(-30)})
        else if (name === "thruDate") fields.push({name, title: "Through", type: "date", value: day(0)})
        else if (name === "timePeriodId")
            fields.push({
                name,
                title: "Fiscal period",
                type: "choice",
                options: periodOptions(organizationPartyId),
                value: null,
                note: organizationPartyId ? "" : "Choose an organization for its fiscal periods"
            })
    }
    let ownerOptions = []
    if (!blank(entry.optionsService)) {
        try {
            ownerOptions = Array.from(ownerCall(entry.optionsService, {appRoot: appOf(entry), organizationPartyId}).options || [])
        } catch (error) {
            ec.logger.error("Insights report options " + entry.entryId + ": " + error.message)
        }
    }
    return {
        entryId: entry.entryId,
        title: entry.title,
        url: entry.routePath ? "/qapps/" + entry.routePath : null,
        fields,
        ownerOptions
    }
}
// get#ReportLink: the owner's route with the entry's own parameters only (a supplied organization checked against the user's
// by get#Context), for ReportContext's Open. Refuses an entry the user does not read and one opened from a record.
function reportLink(p) {
    viewer()
    const entry = readableEntry(p.entryId)
    if (blank(entry.routePath)) denied("REPORT_ROUTE_UNAVAILABLE", entry.title + " opens from a record")
    const parameters = {}
    for (const name of list(entry.parameterContract)) {
        if (blank(p[name])) continue
        if (name === "organizationPartyId")
            insights.execute("context", {appRoot: "Insights", organizationPartyId: p.organizationPartyId})
        parameters[name] = String(p[name])
    }
    const query = Object.entries(parameters)
        .map(([name, value]) => encodeURIComponent(name) + "=" + encodeURIComponent(value))
        .join("&")
    return {url: "/qapps/" + entry.routePath + (query ? "?" + query : "")}
}

// ===== metrics (design §6.1, §6.2, §6.3) =====
// The comparison rules a descriptor carries (design §6.3), as sentences the meaning panel shows.
function rulesOf(metric) {
    const rules = []
    if (metric.unitPolicy === "currency")
        rules.push("Native currencies are kept apart; amounts in different currencies are never added together.")
    if (metric.aggregation === "ratio")
        rules.push("A rate is recomputed from its numerator and denominator, never averaged or summed.")
    if (metric.aggregation === "snapshot") rules.push("A snapshot is never summed across dates.")
    if (/RecurringTemplate/.test(metric.exclusions || ""))
        rules.push("Recurring base orders are templates and are excluded; their renewals count when placed.")
    return rules
}
function describe(metric) {
    return {
        metricId: metric.metricId,
        version: Number(metric.version || 1),
        ownerApp: metric.ownerApp,
        ownerName: ownerNames[metric.ownerApp] || metric.ownerApp,
        title: metric.title,
        description: metric.description || "",
        serviceName: metric.serviceName || null,
        datasetIds: list(metric.datasetIds),
        catalogEntryId: metric.catalogEntryId || null,
        grain: metric.grain || "",
        recordKey: metric.recordKey || "",
        basis: [metric.dateBasis, metric.statusBasis].filter(Boolean).join("; "),
        dateBasis: metric.dateBasis || "",
        statusBasis: metric.statusBasis || "",
        aggregation: metric.aggregation || "",
        numerator: metric.numerator || "",
        denominator: metric.denominator || "",
        unitPolicy: metric.unitPolicy || "",
        additiveDimensions: metric.additiveDimensions || "",
        nonAdditiveDimensions: metric.nonAdditiveDimensions || "",
        allowedDimensions: metric.allowedDimensions || "",
        supportedFilters: metric.supportedFilters || "",
        exclusions: metric.exclusions || "",
        drillContract: metric.drillContract || "",
        scopePolicy: metric.scopePolicy || "",
        freshness: metric.freshness || "",
        rules: rulesOf(metric)
    }
}
function registration(metricId) {
    const metric = metricRegistrations().find(row => row.metricId === metricId)
    if (!metric || (metric.requiredPermission && !lib.access.has(metric.requiredPermission)))
        denied("METRIC_UNAVAILABLE", "Measure " + metricId + " is not available")
    return metric
}
// A panel set up for another version of its measure is told so.
const versionNote = (panelVersion, version) =>
    panelVersion != null && panelVersion !== version
        ? "This panel was set up for version " + panelVersion + " of the measure; it is now version " + version
        : ""
// The panel of a definition the viewer reads: a library panel's body, or a dashboard's by-value panel by its key.
function panelOf(definition, panelId) {
    if (definition.type === "panel") return definition.body || {}
    if (definition.type !== "dashboard") return null
    const panel = (definition.body?.panels || {})[panelId] || null
    // a library panel placed by reference: its own body, read as the viewer
    if (panel && !panel.business && panel.panelRef)
        return Object.assign({}, engine(R + "get#Definition", {definitionId: panel.panelRef}).definition.body || {}, {
            title: panel.title || undefined
        })
    return panel
}
// A comparison with a target (design §4 Target): a missing target, or a zero target (the comparison's denominator), is
// unavailable, never infinity; the gap and the ratio in decimals.
function comparison(value, target, targetActual) {
    if (blank(value)) return {state: "unavailable", reason: "NO_VALUE", message: "No value to compare"}
    if (!target || blank(target.targetKind)) return {state: "unavailable", reason: "NO_TARGET", message: "No target is set"}
    const goal = target.targetKind === "constant" ? target.targetValue : targetActual
    if (blank(goal)) return {state: "unavailable", reason: "NO_TARGET", message: "The target has no value for this period"}
    const actual = toDecimal(value)
    const wanted = toDecimal(goal)
    if (wanted.isZero())
        return {state: "unavailable", reason: "TARGET_ZERO", message: "The target is zero, so there is no comparison"}
    const gap = actual.subtract(wanted)
    const better = target.betterDirection === "lower" ? gap.compare(0) <= 0 : gap.compare(0) >= 0
    return {
        state: "available",
        gap: String(gap),
        ratio: String(actual.divide(wanted, 4, "HALF_UP")),
        meets: better
    }
}
// get#Metric: a registered metric's descriptor, by its id or by the panel that names it (a library panel, or a dashboard's
// panel by key, read as the viewer), with the panel's target and, given the panel's value (and a metric target's value), the
// comparison. A dataset definition's own descriptor (body.business with its grain) is answered as it is.
function metric(p) {
    viewer()
    let metricId = p.metricId || null
    let panel = null
    if (!blank(p.definitionId)) {
        const definition = engine(R + "get#Definition", {definitionId: p.definitionId}).definition
        if (definition.type === "dataset" && definition.body?.business?.grain) {
            const own = Object.assign({metricId: definition.id, ownerApp: "", title: definition.title}, definition.body.business)
            return {metric: describe(own), available: true, source: "definition", rules: rulesOf(own)}
        }
        const found = panelOf(definition, p.panelId)
        const business = found?.business || null
        if (!business?.metricId)
            return {available: false, reason: "NO_METRIC", message: "This panel has no registered measure", metric: null}
        metricId = business.metricId
        panel = {
            definitionId: definition.id,
            panelId: definition.type === "panel" ? definition.id : p.panelId,
            metricVersion: business.metricVersion == null ? null : Number(business.metricVersion),
            currencyUomId: panelCurrency(found),
            target: business.target || null
        }
    }
    if (blank(metricId)) denied("METRIC_REQUIRED", "Choose a measure or a panel")
    const descriptor = describe(registration(metricId))
    const versionMessage = panel ? versionNote(panel.metricVersion, descriptor.version) : ""
    return {
        available: true,
        source: "registration",
        metric: descriptor,
        rules: descriptor.rules,
        panel,
        versionChanged: !!versionMessage,
        versionMessage,
        comparison: panel ? comparison(p.value, panel.target, p.targetActual) : null
    }
}
// find#PanelMeasures: Dashboard's MeasureMeaning, each panel of a dashboard the viewer reads that names a registered measure,
// with the measure's descriptor; a panel whose measure is unregistered or unreadable says so, never a guessed meaning.
function panelMeasures(p) {
    viewer()
    const definition = engine(R + "get#Definition", {definitionId: p.definitionId}).definition
    if (definition.type !== "dashboard" && definition.type !== "panel") denied("DASHBOARD_REQUIRED", "Choose a dashboard")
    const keys = definition.type === "panel" ? [definition.id] : Object.keys(definition.body?.panels || {})
    const measures = []
    for (const panelId of keys) {
        let found = null
        try {
            found = panelOf(definition, panelId)
        } catch (error) {
            measures.push({panelId, panelTitle: panelId, available: false, message: "The panel is not available to you"})
            continue
        }
        const metricId = found?.business?.metricId
        if (!metricId) continue
        const panelTitle = found.title || panelId
        try {
            // the panel already read: its registration only, not the definition again per panel
            const m = describe(registration(metricId))
            const panelVersion = found.business.metricVersion == null ? null : Number(found.business.metricVersion)
            const versionMessage = versionNote(panelVersion, m.version)
            measures.push({
                panelId,
                panelTitle,
                available: true,
                metricId: m.metricId,
                metricTitle: m.title + " (" + m.ownerName + ", version " + m.version + ")",
                grain: m.grain,
                basis: m.basis,
                denominator: m.aggregation === "ratio" ? m.numerator + " over " + m.denominator : "",
                exclusions: m.exclusions,
                rulesText: m.rules.join(" "),
                source: [m.serviceName, m.datasetIds.join(", ")].filter(Boolean).join("; "),
                freshness: m.freshness,
                message: versionMessage
            })
        } catch (error) {
            measures.push({
                panelId,
                panelTitle,
                available: false,
                metricId,
                message: "Its measure " + metricId + " is not available"
            })
        }
    }
    return {measures}
}
// find#Metrics: the registered metrics the viewer may read, for BusinessMeasure's picker.
function findMetrics() {
    viewer()
    return {
        metrics: metricRegistrations()
            .filter(row => !row.requiredPermission || lib.access.has(row.requiredPermission))
            .map(row => ({
                metricId: row.metricId,
                version: Number(row.version || 1),
                title: row.title,
                ownerName: ownerNames[row.ownerApp] || row.ownerApp,
                unitPolicy: row.unitPolicy || "",
                label: row.title + " (" + (ownerNames[row.ownerApp] || row.ownerApp) + ")"
            }))
    }
}

// ===== a panel's measure and target (design §4 PanelDetail BusinessMeasure, Target) =====
// The one currency every query of a panel is filtered to (a currencyUomId equality filter, not negated), else null: a panel
// whose results may hold several currencies has none.
function panelCurrency(panel) {
    const queries = Array.from(panel?.queries || [])
    if (!queries.length) return null
    const currencyOf = query => {
        const found = new Set()
        const visit = (value, negated) => {
            if (!value || typeof value !== "object") return
            if (Array.isArray(value)) return value.forEach(item => visit(item, negated))
            const field = value.field
            if (field && field.name === "currencyUomId" && (field.op || "eq") === "eq" && !negated && !blank(field.value))
                found.add(String(field.value))
            for (const [key, item] of Object.entries(value)) if (key !== "field") visit(item, negated)
        }
        for (const filter of Array.from(query.filters || [])) {
            if (filter?.disabled === true) continue
            visit(filter.query || filter, filter?.negated === true)
        }
        if (query.query) visit(query.query, false)
        return found.size === 1 ? Array.from(found)[0] : null
    }
    const currencies = queries.map(currencyOf)
    return currencies.every(currency => currency && currency === currencies[0]) ? currencies[0] : null
}
// The viewer's own library panel, for an author: read as the viewer (the engine's read check), refused when not a panel or not
// theirs (the engine's save checks the owner and version again).
function ownPanel(userScope, definitionId) {
    if (!userScope.capabilities.author && !userScope.capabilities.datasetEdit)
        denied("INSIGHTS_AUTHOR_REQUIRED", "A panel's measure and target need Insights authoring")
    if (blank(definitionId)) denied("PANEL_REQUIRED", "Choose a library panel")
    const definition = engine(R + "get#Definition", {definitionId}).definition
    if (definition.type !== "panel") denied("PANEL_REQUIRED", "Choose a library panel")
    if (definition.readOnly || definition.ownerId !== ec.user.userId)
        denied("PANEL_NOT_OWNED", "Only the owner changes a panel; save a copy first")
    return definition
}
function savePanel(definition, body, expectedVersion, note) {
    const version = blank(expectedVersion) ? definition.version : Number(expectedVersion)
    const saved = engine(R + "save#Definition", {
        definition: {
            id: definition.id,
            type: definition.type,
            title: definition.title,
            body,
            version,
            userGroupId: definition.userGroupId || null
        },
        note
    }).definition
    return {definitionId: saved.id, version: saved.version, business: saved.body?.business || null}
}
// store#PanelMeasure: attach a registered metric (its current version) to the author's library panel, or clear it; a target
// set for another metric is dropped.
function storePanelMeasure(p) {
    const userScope = viewer()
    const definition = ownPanel(userScope, p.definitionId)
    const body = Object.assign({}, definition.body || {})
    if (blank(p.metricId)) {
        delete body.business
        return savePanel(definition, body, p.expectedVersion, "Measure cleared")
    }
    const registered = registration(p.metricId)
    const previous = body.business || {}
    body.business = {metricId: registered.metricId, metricVersion: Number(registered.version || 1)}
    if (previous.metricId === registered.metricId && previous.target) body.business.target = previous.target
    return savePanel(definition, body, p.expectedVersion, "Measure " + registered.metricId)
}
const currencyUom = uomId => !blank(uomId) && !!one("moqui.basic.Uom", {uomId, uomTypeEnumId: "UT_CURRENCY_MEASURE"})
// store#PanelTarget: the typed target input of design §4 ({panelId, targetKind, targetMetricId, targetValue, targetUnitId,
// periodBinding, betterDirection, expectedVersion}). The target kind takes only its own value; a target shares the measure's
// unit and basis; a money target names one currency and the panel must be filtered to that one currency, so a target is
// never compared with mixed currencies (TARGET_CURRENCY_MIXED). Without targetKind the target is cleared.
function storePanelTarget(p) {
    const userScope = viewer()
    const definition = ownPanel(userScope, p.panelId)
    const body = Object.assign({}, definition.body || {})
    const business = Object.assign({}, body.business || {})
    if (blank(business.metricId)) denied("PANEL_MEASURE_REQUIRED", "Choose the panel's measure before its target")
    const measure = registration(business.metricId)
    if (blank(p.targetKind)) {
        delete business.target
        body.business = business
        return savePanel(definition, body, p.expectedVersion, "Target cleared")
    }
    if (!["constant", "metric"].includes(p.targetKind)) denied("TARGET_KIND_INVALID", "A target is a measure or a value")
    const direction = blank(p.betterDirection) ? "higher" : p.betterDirection
    if (!["higher", "lower"].includes(direction)) denied("TARGET_DIRECTION_INVALID", "Better is higher or lower")
    const period = blank(p.periodBinding) ? "panel" : p.periodBinding
    if (!["panel", "month", "quarter", "year"].includes(period))
        denied("TARGET_PERIOD_INVALID", "The target's period is the panel's range, a month, a quarter or a year")
    const panelCurrencyId = panelCurrency(body)
    const target = {targetKind: p.targetKind, periodBinding: period, betterDirection: direction}
    if (p.targetKind === "constant") {
        if (!blank(p.targetMetricId)) denied("TARGET_INPUT_INVALID", "A value target takes a value, not a measure")
        if (blank(p.targetValue)) denied("TARGET_VALUE_REQUIRED", "Enter the target value")
        let value
        try {
            value = toDecimal(p.targetValue)
        } catch (_) {
            denied("TARGET_VALUE_REQUIRED", "Enter the target value as a number")
        }
        const unit = blank(p.targetUnitId) ? null : String(p.targetUnitId)
        if (measure.unitPolicy === "currency") {
            if (!currencyUom(unit)) denied("TARGET_UNIT_MISMATCH", "A money target names its currency")
            if (panelCurrencyId !== unit)
                denied(
                    "TARGET_CURRENCY_MIXED",
                    panelCurrencyId
                        ? "The panel shows " + panelCurrencyId + "; a target in " + unit + " cannot be compared with it"
                        : "The panel shows every currency apart; filter it to " + unit + " before setting a target in it"
                )
        } else if (unit && currencyUom(unit)) {
            denied("TARGET_UNIT_MISMATCH", measure.title + " is not money; its target takes no currency")
        }
        Object.assign(target, {targetValue: String(value), targetUnitId: unit})
    } else {
        if (!blank(p.targetValue)) denied("TARGET_INPUT_INVALID", "A measure target takes a measure, not a value")
        if (blank(p.targetMetricId)) denied("TARGET_METRIC_REQUIRED", "Choose the target measure")
        const other = registration(p.targetMetricId)
        if (other.metricId === measure.metricId) denied("TARGET_METRIC_INVALID", "A measure is not its own target")
        if (other.unitPolicy !== measure.unitPolicy || other.aggregation !== measure.aggregation)
            denied("TARGET_UNIT_MISMATCH", "A target measure shares the panel measure's unit and basis")
        if (measure.unitPolicy === "currency" && !panelCurrencyId)
            denied("TARGET_CURRENCY_MIXED", "The panel shows every currency apart; filter it to one currency first")
        Object.assign(target, {
            targetMetricId: other.metricId,
            targetMetricVersion: Number(other.version || 1),
            targetUnitId: measure.unitPolicy === "currency" ? panelCurrencyId : null
        })
    }
    business.target = target
    body.business = business
    return savePanel(definition, body, p.expectedVersion, "Target")
}

// ===== saved reports (design §6 SavedReports) =====
const kindNames = {dashboard: "Dashboard", panel: "Library panel", search: "Saved search", report: "Report", find: "Saved find"}
const savedTypes = ["dashboard", "panel", "search", "report"]
function groupName(userGroupId) {
    const group = userGroupId ? one("moqui.security.UserGroup", {userGroupId}) : null
    return group?.description || userGroupId || ""
}
// The Insights route a definition opens, or why it does not.
function definitionRoute(definition, capabilities) {
    const id = encodeURIComponent(definition.id)
    if (definition.type === "dashboard") return {url: "/qapps/Insights/Dashboard?definitionId=" + id}
    if (definition.type === "search") return {url: "/qapps/Insights/ReportBuilder/Explore?savedSearchId=" + id}
    if (definition.type === "report" && definition.body?.kind === "playlist")
        return {url: "/qapps/Insights/Playlists?definitionId=" + id}
    if (definition.type === "panel")
        return capabilities.author || capabilities.datasetEdit
            ? {url: "/qapps/Insights/PanelDetail?definitionId=" + id}
            : {unavailable: "Open it on a dashboard"}
    return {unavailable: "Not opened in Insights"}
}
// A saved find's screen: an mr-boss form list's screen path when it opens to the viewer, else why not.
function findRoute(row, grants) {
    const match = /^component:\/\/mr-boss\/screen\/(.+)\.xml\.form_list\$/.exec(String(row.formLocation || ""))
    if (!match) return {unavailable: "The screen it was saved on is not an IronStone screen"}
    if (!admin.destinationOpens(grants, match[1])) return {unavailable: "You cannot open the screen it was saved on"}
    return {url: "/qapps/" + match[1] + "?formListFindId=" + encodeURIComponent(row.formListFindId)}
}
// find#SavedReports: the viewer's saved work by kind, kept apart: the report engine's dashboards, library panels, saved
// searches and playlists the viewer reads (their own and shared with their groups; shipped definitions are in Dashboards and
// Library panels), the saved finds of the viewer and of their groups, and the pinned catalog entries; each with its owner or
// group, sharing, the route it opens or why it does not, and whether the viewer may save a copy.
function findSavedReports(p) {
    const userScope = viewer()
    const can = userScope.capabilities
    const text = String(p.text || "")
        .trim()
        .toLowerCase()
    const wanted = kind => blank(p.kind) || p.kind === kind || (p.kind === "definition" && savedTypes.includes(kind))
    const matches = title =>
        !text ||
        String(title || "")
            .toLowerCase()
            .includes(text)
    const out = []
    if (savedTypes.some(wanted)) {
        const definitions = Array.from(engine(R + "list#Definitions", {}).definitions || [])
        for (const definition of definitions) {
            if (definition.readOnly || !savedTypes.includes(definition.type) || !wanted(definition.type)) continue
            if (!matches(definition.title)) continue
            const mine = definition.ownerId === ec.user.userId
            if (p.owner === "mine" && !mine) continue
            if (p.owner === "shared" && mine) continue
            const route = definitionRoute(definition, can)
            out.push({
                kind: definition.type,
                kindName: kindNames[definition.type],
                id: definition.id,
                title: definition.title || definition.id,
                ownerText: mine ? "You" : "Shared",
                sharing: definition.userGroupId ? groupName(definition.userGroupId) : "Private",
                version: definition.version,
                url: route.url || null,
                unavailable: route.unavailable || "",
                canCopy: !!can.author
            })
        }
    }
    if (wanted("find")) {
        const groupIds = Array.from(ec.user.getUserGroupIdSet() || []).filter(id => id !== "ALL_USERS")
        const own = rows("moqui.screen.form.FormListFindUser", {userId: ec.user.userId}).map(row => row.formListFindId)
        const grouped = groupIds.length
            ? Array.from(find("moqui.screen.form.FormListFindUserGroup").condition("userGroupId", "in", groupIds).list())
            : []
        const sharedBy = new Map(grouped.map(row => [row.formListFindId, row.userGroupId]))
        const findIds = Array.from(new Set(own.concat(Array.from(sharedBy.keys()))))
        const grants = findIds.length ? insights.grants() : null
        for (const formListFindId of findIds) {
            const mine = own.includes(formListFindId)
            if (p.owner === "mine" && !mine) continue
            if (p.owner === "shared" && mine) continue
            const row = one("moqui.screen.form.FormListFind", {formListFindId})
            if (!row || !matches(row.description)) continue
            const route = findRoute(row, grants)
            out.push({
                kind: "find",
                kindName: kindNames.find,
                id: formListFindId,
                title: row.description || formListFindId,
                ownerText: mine ? "You" : "Shared",
                sharing: mine ? "Private" : groupName(sharedBy.get(formListFindId)),
                version: null,
                url: route.url || null,
                unavailable: route.unavailable || "",
                canCopy: false
            })
        }
    }
    if (wanted("pin")) {
        const pins = home().pinnedReportIds
        if (pins.length) {
            const read = reader()
            const entries = catalogEntries()
            for (const entryId of pins) {
                const entry = entries.find(row => row.entryId === entryId)
                if (!entry || !read.reads(entry) || !matches(entry.title)) continue
                out.push({
                    kind: "pin",
                    kindName: "Pinned report",
                    id: entryId,
                    title: entry.title,
                    ownerText: ownerNames[entry.ownerApp] || entry.ownerApp,
                    sharing: "Private",
                    version: null,
                    url: entry.routePath ? "/qapps/" + entry.routePath : null,
                    unavailable: entry.routePath ? "" : "Opens from a record",
                    canCopy: false
                })
            }
        }
    }
    return {
        savedReports: out,
        kindOptions: [
            {key: "dashboard", text: "Dashboards"},
            {key: "panel", text: "Library panels"},
            {key: "search", text: "Saved searches"},
            {key: "report", text: "Playlists and reports"},
            {key: "find", text: "Saved finds"},
            {key: "pin", text: "Pinned reports"}
        ]
    }
}
// copy#SavedReport (SaveAs): a copy of a definition the viewer reads, under a new title, private or shared with one of the
// viewer's own groups, saved through the report engine as the viewer (its read, reference and dataset checks); the version
// read must be the source's current one. No cached result or wider grant goes with it.
function copySavedReport(p) {
    const userScope = viewer()
    if (!userScope.capabilities.author) denied("INSIGHTS_AUTHOR_REQUIRED", "Saving a copy needs Insights authoring")
    if (blank(p.title)) denied("TITLE_REQUIRED", "Name the copy")
    const group = blank(p.userGroupId) ? null : String(p.userGroupId)
    if (group && (group === "ALL_USERS" || !Array.from(ec.user.getUserGroupIdSet() || []).includes(group)))
        denied("SHARE_GROUP_UNAVAILABLE", "Share only with a group you belong to")
    const source = engine(R + "get#Definition", {definitionId: p.definitionId}).definition
    if (!savedTypes.includes(source.type))
        denied("COPY_UNAVAILABLE", "Only dashboards, panels, searches and reports are copied here")
    if (!blank(p.expectedVersion) && Number(p.expectedVersion) !== Number(source.version || 0))
        denied("DEFINITION_CHANGED", "It changed since you read it; reload and try again")
    const newId =
        "ins-" +
        source.type +
        "-" +
        String(ec.user.userId)
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "") +
        "-" +
        Date.now()
    const saved = engine(R + "save#Definition", {
        definition: {id: newId, type: source.type, title: String(p.title), body: source.body || {}, userGroupId: group},
        note: "Saved as a copy of " + source.id
    }).definition
    return {definitionId: saved.id, type: saved.type, userGroupId: saved.userGroupId || null}
}
// search#Records: the palette's dashboards and saved reports (design §1.2), each a row with its record and link.
function searchRecords(p) {
    let userScope
    try {
        userScope = insights.required()
    } catch (_) {
        return {rows: []}
    }
    if (!userScope.capabilities.view || !String(p.text || "").trim()) return {rows: []}
    const limit = Math.max(1, Math.min(20, Number(p.limit || 5)))
    let found = []
    try {
        found = findSavedReports({text: p.text, kind: "definition"}).savedReports
    } catch (error) {
        ec.logger.error("Insights palette search failed: " + error.message)
    }
    const shipped = []
    try {
        const text = String(p.text).trim().toLowerCase()
        for (const definition of Array.from(engine(R + "list#Definitions", {definitionType: "dashboard"}).definitions || [])) {
            if (!definition.readOnly || definition.component === "tools") continue
            if (
                String(definition.title || "")
                    .toLowerCase()
                    .includes(text)
            )
                shipped.push({
                    kind: "dashboard",
                    kindName: "Dashboard",
                    id: definition.id,
                    title: definition.title,
                    url: "/qapps/Insights/Dashboard?definitionId=" + encodeURIComponent(definition.id)
                })
        }
    } catch (error) {
        ec.logger.error("Insights palette dashboards failed: " + error.message)
    }
    return {
        rows: found
            .concat(shipped)
            .filter(row => row.url)
            .slice(0, limit)
            .map(row => ({
                title: row.title,
                subtitle: "Insights · " + row.kindName,
                icon: row.kind === "dashboard" ? "sym_o_dashboard" : "sym_o_saved_search",
                recordEntity: "moqui.report.Definition",
                recordId: row.id,
                url: row.url
            }))
    }
}

// ===== Home and attention (impl-insights P5; design-insights §3 Home) =====
const suiteDashboardId = "insights-suite"
const homePanelLimit = 6
const attentionProviders = () => registered("ironstone.insights.AttentionProvider", "providerKey", ["countService"])
const json = text => lib.json(text, null)
const preferenceIds = key => {
    const stored = json(ec.user.getPreference(key))
    return Array.isArray(stored) ? stored.map(String) : []
}
// The value at a path of an owner's answer (counters.draftCount; queueRows[operation=receiving].lateCount): found false when
// a step is missing, so a misnamed field is a failure, never a quiet omission.
function valueAt(answer, path) {
    let value = answer
    for (const step of String(path).split(".")) {
        const match = /^([^[\]]+)(?:\[([^=\]]+)=([^\]]*)\])?$/.exec(step.trim())
        if (!match || value == null || typeof value !== "object" || !(match[1] in value)) return {found: false}
        value = value[match[1]]
        if (match[2]) {
            const row = Array.from(value || []).find(item => item != null && String(item[match[2]]) === match[3])
            if (!row) return {found: false}
            value = row
        }
    }
    return {found: true, value}
}
// A count of an owner's answer, the paths of its field added: null when the owner gives the viewer no count (any part null).
function countAt(answer, field) {
    let total = 0
    for (const path of String(field).split("+")) {
        const at = valueAt(answer, path)
        if (!at.found) throw new Error("its answer has no " + path.trim())
        if (at.value == null || at.value === "") return null
        const number = Number(String(at.value))
        if (!Number.isFinite(number)) throw new Error(path.trim() + " is not a count")
        total += number
    }
    return total
}
const countText = count => ec.l10n.format(toDecimal(String(count)), "#,##0")
// An owner's answer that it gives the viewer no count: the catalog's refusals, a coded *_REQUIRED refusal (Payables'
// ORGANIZATION_REQUIRED with no organization chosen or active) and the framework's artifact denial; any other error is a failure.
const refusesCount = text => refusalText.test(text) || /\b[A-Z]+(?:_[A-Z]+)*_REQUIRED:|is not authorized for /.test(text)

// get#Attention: each registered provider as the viewer (design §3): one whose route does not open to the viewer, whose
// permission they lack, whose owner refuses them or answers them no count is left out, naming nothing; one whose count fails
// is named on its own card and the others go on. Providers sharing a count call (an owner's Home summary) share one call. The
// counts are grouped by owner and never added into a total: the same work can be in more than one worklist.
function attention(p) {
    viewer()
    const context = insights.execute("context", {appRoot: "Insights", organizationPartyId: p.organizationPartyId || null})
    const organizationPartyId = context.organizationPartyId || null
    const grants = insights.grants()
    const answers = new Map()
    const callOf = provider => {
        const parameters = Object.assign({}, json(provider.countParameters) || {})
        if (provider.organizationParameter && organizationPartyId)
            parameters[provider.organizationParameter] = organizationPartyId
        const key = provider.countService + "|" + JSON.stringify(parameters)
        if (!answers.has(key)) {
            try {
                answers.set(key, {answer: ownerCall(provider.countService, parameters)})
            } catch (error) {
                answers.set(key, {error: String(error.message)})
            }
        }
        return answers.get(key)
    }
    const groups = []
    for (const provider of attentionProviders()) {
        if (!blank(p.ownerApp) && provider.ownerApp !== p.ownerApp) continue
        try {
            if (blank(provider.routePath) || !admin.destinationOpens(grants, provider.routePath)) continue
            if (provider.requiredPermission && !lib.access.has(provider.requiredPermission)) continue
        } catch (error) {
            ec.logger.error("Insights attention provider " + provider.providerKey + " was not checked: " + error.message)
            continue
        }
        const ownerName = ownerNames[provider.ownerApp] || provider.ownerApp
        const card = {
            providerKey: provider.providerKey,
            ownerApp: provider.ownerApp,
            ownerName,
            title: provider.title,
            description: provider.description || "",
            scopeText: provider.organizationParameter && organizationPartyId ? "" : provider.organizationScope || "",
            url: null,
            state: "available",
            count: null,
            countText: "",
            overdueCount: null,
            overdueText: "",
            message: ""
        }
        const call = callOf(provider)
        if (call.error != null && refusesCount(call.error)) continue
        try {
            if (call.error != null) throw new Error(call.error)
            const count = countAt(call.answer, provider.countField)
            if (count == null) continue
            const overdue = blank(provider.overdueField) ? null : countAt(call.answer, provider.overdueField)
            // a filter value {path} is the owner's answer at that path (the plant or facility the count was made for), left
            // out when the answer has none, so the worklist opens on the scope that produced the count
            const query = []
            for (const pair of String(provider.routeParameters || "")
                .split("&")
                .filter(Boolean)) {
                const placeholder = /^([^=]+)=\{(.+)\}$/.exec(pair)
                if (!placeholder) {
                    query.push(pair)
                    continue
                }
                const at = valueAt(call.answer, placeholder[2])
                if (at.found && !blank(at.value)) query.push(placeholder[1] + "=" + encodeURIComponent(String(at.value)))
            }
            if (provider.organizationParameter && organizationPartyId)
                query.push(encodeURIComponent(provider.organizationParameter) + "=" + encodeURIComponent(organizationPartyId))
            const queryText = query.join("&")
            Object.assign(card, {
                count,
                countText: countText(count),
                overdueCount: overdue,
                overdueText: overdue ? countText(overdue) + " overdue" : "",
                url: "/qapps/" + provider.routePath + (queryText ? "?" + queryText : "")
            })
        } catch (error) {
            ec.logger.error("Insights attention provider " + provider.providerKey + " failed: " + error.message)
            Object.assign(card, {
                state: "failed",
                countText: "Unavailable",
                message: ownerName + " did not answer this count just now"
            })
        }
        let group = groups.find(row => row.ownerApp === provider.ownerApp)
        if (!group) groups.push((group = {ownerApp: provider.ownerApp, ownerName, cards: []}))
        group.cards.push(card)
    }
    const now = new Date()
    return {groups, organizationPartyId, asOf: now.getTime(), asOfText: ec.l10n.format(now, "yyyy-MM-dd HH:mm")}
}

// get#OperationFailures: Monitor's Business operations dashboard as an attention source (impl-insights F19): the runs its
// "Rollbacks and retries by operation" panel counts, over the last day, read from the shipped dashboard and run as the viewer,
// so Monitor's own grants (the dashboard and the telemetry dataset) decide.
function countOperationFailures(p) {
    viewer()
    const definition = engine(R + "get#Definition", {definitionId: "monitor-operations"}).definition
    const source = (definition.body?.panels?.failed?.queries || [])[0]
    if (!source) throw new Error("Monitor's Business operations dashboard has no rollbacks panel")
    const metric = Array.from(source.aggregations || []).filter(item => (item.role || "metric") === "metric")
    const out = engine(R + "run#Query", {
        query: {
            from: p.from || "now-24h",
            thru: "now",
            queries: [{datasetId: source.datasetId, queryString: source.queryString, aggregations: metric}]
        }
    })
    // the engine answers a refused or failed query as an error notice and no frames, never as a zero
    const failed = Array.from(out.notices || []).find(notice => notice.level === "error")
    if (failed) {
        if (/not authorized/.test(String(failed.message)))
            denied("OPERATIONS_UNAVAILABLE", "Monitor's business operations are not available to you")
        throw new Error("Monitor's business operations query failed: " + failed.message)
    }
    let count = 0
    for (const frame of Array.from(out.frames || []))
        for (const field of Array.from(frame.fields || []))
            if (metric.some(item => item.id === field.name))
                for (const value of Array.from(field.values || [])) count += Number(String(value ?? 0)) || 0
    return {count}
}

// The pinned catalog entries the viewer reads, in their order (design §3 PinnedReports): only the pinned entries are checked,
// each through its owner's catalogue or its route.
function pinnedReports(pins) {
    if (!pins.length) return {reports: [], unavailableOwners: []}
    const read = reader()
    const entries = catalogEntries()
    const reports = []
    for (const entryId of pins) {
        const entry = entries.find(row => row.entryId === entryId)
        if (!entry || !read.reads(entry)) continue
        reports.push({
            entryId,
            title: entry.title,
            ownerName: ownerNames[entry.ownerApp] || entry.ownerApp,
            description: entry.description || "",
            url: entry.routePath ? "/qapps/" + entry.routePath : null,
            opensFrom: entry.routePath ? "" : "Opens from a record"
        })
    }
    return {reports, unavailableOwners: Array.from(read.unavailable).sort()}
}
// The organization scope of a dashboard placed on Home, as its variables: the chosen organization, else the viewer's
// organizations; none for the administrator in every organization. The suite's sales panels name it vendorPartyId.
function scopeVariables(context) {
    const scope = context.organizationPartyId || (context.allOrganizations ? null : context.organizationPartyIds)
    if (scope == null) return {}
    const value = Array.isArray(scope) ? (scope.length ? scope : ["_NA_"]) : scope
    return {organizationPartyId: value, vendorPartyId: value}
}
// get#Home: the viewer's landing (design §3): the management scope, their starred and recent dashboards, the dashboard whose
// panels Home shows (their own choice, else the shipped suite dashboard) with the panels in their order, their pinned reports
// and whether this is their first use. Every definition is read as the viewer; one they no longer read is left out, and a
// chosen dashboard they cannot read is said so. Attention is get#Attention's, so a slow or failing owner never holds Home.
function getHome(p) {
    const userScope = viewer()
    const preference = home()
    let context
    try {
        context = insights.execute("context", {
            appRoot: "Insights",
            organizationPartyId: p.organizationPartyId || preference.organizationPartyId || null
        })
    } catch (error) {
        if (!blank(p.organizationPartyId)) throw error
        // a saved organization no longer the viewer's falls back to their default scope
        context = insights.execute("context", {appRoot: "Insights"})
    }
    const dashboards = Array.from(engine(R + "list#Definitions", {definitionType: "dashboard"}).definitions || []).filter(
        definition => definition.component !== "tools"
    )
    const byId = new Map(dashboards.map(definition => [definition.id, definition]))
    const link = definition => "/qapps/Insights/Dashboard?definitionId=" + encodeURIComponent(definition.id)
    const stars = preferenceIds("REPORT_STARRED")
    const recent = preferenceIds("REPORT_RECENT")
    const favorites = []
    for (const [kind, ids] of [
        ["Starred", stars],
        ["Recent", recent]
    ])
        for (const id of ids) {
            const definition = byId.get(id)
            if (!definition || favorites.some(row => row.definitionId === id)) continue
            favorites.push({
                definitionId: id,
                title: definition.title || id,
                kind,
                folder: definition.body?.folder || "",
                shipped: !!definition.readOnly,
                url: link(definition)
            })
        }
    const dashboardId = preference.dashboardDefinitionId || suiteDashboardId
    const dashboard = {definitionId: dashboardId, title: "", available: false, message: "", url: null}
    let panelOptions = []
    try {
        const definition = engine(R + "get#Definition", {definitionId: dashboardId}).definition
        if (definition.type !== "dashboard") throw new Error("not a dashboard")
        const panels = definition.body?.panels || {}
        const layoutIds = Array.from(definition.body?.layout?.items || []).map(item => item.panelId)
        const keys = layoutIds.filter(id => id in panels).concat(Object.keys(panels).filter(id => !layoutIds.includes(id)))
        panelOptions = keys.map(panelId => ({value: panelId, label: panels[panelId]?.title || panelId}))
        Object.assign(dashboard, {title: definition.title || dashboardId, available: true, url: link(definition)})
    } catch (error) {
        ec.logger.warn("Insights Home dashboard " + dashboardId + " is not available: " + error.message)
        dashboard.message =
            dashboardId === suiteDashboardId
                ? "The suite dashboard is not available to you"
                : "Your chosen dashboard is not available to you; choose another with Arrange"
    }
    const chosen = preference.orderedPanelIds.filter(id => panelOptions.some(option => option.value === id))
    const panelIds = (chosen.length ? chosen : panelOptions.map(option => option.value)).slice(0, homePanelLimit)
    const pinned = pinnedReports(preference.pinnedReportIds)
    return {
        organizationPartyId: context.organizationPartyId || null,
        organizations: context.organizations,
        allOrganizations: context.allOrganizations,
        scopeVariables: scopeVariables(context),
        from: context.defaults.from,
        thru: context.defaults.thru,
        capabilities: userScope.capabilities,
        favorites,
        dashboard,
        panels: panelIds
            .map(panelId => panelOptions.find(option => option.value === panelId))
            .map(option => ({
                panelId: option.value,
                title: option.label
            })),
        panelOptions,
        dashboardOptions: dashboards
            .map(definition => ({value: definition.id, label: definition.title || definition.id}))
            .sort((a, b) => a.label.localeCompare(b.label)),
        pinnedReports: pinned.reports,
        unavailableOwners: pinned.unavailableOwners,
        firstUse: !stars.length && !recent.length && !preference.pinnedReportIds.length && preference.revision === 0,
        revision: preference.revision
    }
}
// store#HomeLayout: the viewer's arrangement in the InsightsHome preference (design §3): the organization in scope (one of
// theirs), the dashboard whose panels Home shows (one they read; none: the suite dashboard) and at most six of its panels in
// order. It changes references and order only, never what a source shows; pins are kept.
function storeHomeLayout(p) {
    viewer()
    const preference = home()
    if (!blank(p.expectedRevision) && Number(p.expectedRevision) !== preference.revision)
        denied("HOME_CHANGED", "Your Home changed since you read it; reload and try again")
    const organizationPartyId = blank(p.organizationPartyId) ? null : String(p.organizationPartyId)
    if (organizationPartyId) insights.execute("context", {appRoot: "Insights", organizationPartyId})
    const dashboardId = blank(p.dashboardDefinitionId) ? null : String(p.dashboardDefinitionId)
    let panelIds = Array.from(p.orderedPanelIds || [])
        .map(String)
        .filter(Boolean)
    if (panelIds.length > homePanelLimit) denied("HOME_PANELS_LIMIT", "Home shows at most " + homePanelLimit + " panels")
    if (dashboardId || panelIds.length) {
        let definition
        try {
            definition = engine(R + "get#Definition", {definitionId: dashboardId || suiteDashboardId}).definition
        } catch (_) {
            denied("DASHBOARD_UNAVAILABLE", "Dashboard " + (dashboardId || suiteDashboardId) + " is not available")
        }
        if (definition.type !== "dashboard") denied("DASHBOARD_REQUIRED", "Choose a dashboard")
        const missing = panelIds.find(id => !(id in (definition.body?.panels || {})))
        if (missing) denied("PANEL_UNAVAILABLE", "Panel " + missing + " is not on " + (definition.title || definition.id))
    }
    preference.organizationPartyId = organizationPartyId
    preference.dashboardDefinitionId = dashboardId
    preference.orderedPanelIds = panelIds
    preference.revision += 1
    ec.user.setPreference(homeKey, JSON.stringify(preference))
    return {revision: preference.revision}
}

const operations = {
    findReports,
    storeReportPins,
    reportOptions,
    reportLink,
    metric,
    findMetrics,
    panelMeasures,
    storePanelMeasure,
    storePanelTarget,
    findSavedReports,
    copySavedReport,
    searchRecords,
    attention,
    countOperationFailures,
    getHome,
    storeHomeLayout
}
;({
    home,
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Insights registry operation " + op)
        return operations[op](parameters || {})
    }
})
