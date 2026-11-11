// Insights' report catalog and metrics (impl-insights P4; design-insights §6.1, §6.2, §6.3, §4 PanelDetail's Target): a reader
// sees only the entries their owner grants (the owner's catalogue service, else the route's screen authorization); SalesAnalysis
// is one entry, Sales'; a pin edits the user's InsightsHome preference only, over entries they read; get#Metric answers a
// measure's basis, grain, denominator and comparison rules, by id and by the panel that names it; a panel's target is typed, a
// mixed-currency target refused and a missing or zero target an unavailable comparison; saved reports keep their kinds apart and
// a copy is the author's; a legacy saved find shows not valid and the administrator's migration moves the registered ones (P12). Reports', PanelDetail's and SavedReports' one qvt render each. Dashboard's MeasureMeaning is checked on InsightsDashboards' render; the
// screens' access is InsightsAccess's. The "usable when" scenario is the acceptance InsightsCatalogUsable.
// Run: ./moq test mr-boss --spec InsightsCatalog
const lib = ec.resource.script("component://mr-boss/test/Insights/InsightsSpecLib.js")
const {users, asUser, system, refusal, invoke, page} = lib
const G = "ironstone.insights.RegistryServices."
const reports = "org.moqui.report.ReportServices."
const panelIds = {mixed: "INS_CAT_SPEC_PANEL", usd: "INS_CAT_SPEC_USD"}
const homeKey = "InsightsHome"
const userIds = ["BOSS_INS_SVC_MANAGER", "BOSS_INS_WAREHOUSE", "BOSS_INS_FINANCE", "BOSS_INS_READER", "BOSS_INS_AUTHOR"]

// A PanelDetail transition posted as the signed-in user, through the webroot as the browser posts it: its errors.
function post(path, parameters) {
    const result = ec.screen
        .makeTest()
        .rootScreen("component://webroot/screen/webroot.xml")
        .render("apps/Insights/" + path, parameters, "post")
    return Array.from(result.errorMessages || []).join(" | ") || (result.status >= 400 ? "status " + result.status : "")
}
const entryIds = user => asUser(user, () => Array.from(invoke(G + "find#Reports", {}).reports || []).map(row => row.entryId))
function removeSpecData() {
    system(() => {
        const authored = Array.from(ec.entity.find("moqui.report.Definition").condition("ownerId", "BOSS_INS_AUTHOR").list())
            .map(row => row.definitionId)
            .filter(id => Object.values(panelIds).includes(id) || id.startsWith("ins-panel-bossinsauthor"))
        for (const entityName of [
            "moqui.report.DefinitionReference",
            "moqui.report.DefinitionVersion",
            "moqui.report.Definition"
        ])
            if (authored.length) ec.entity.find(entityName).condition("definitionId", "in", authored).deleteAll()
        ec.entity
            .find("moqui.security.UserPreference")
            .condition("userId", "in", userIds)
            .condition("preferenceKey", homeKey)
            .deleteAll()
    })
}
const currencyFilter = currencyUomId => ({query: {field: {name: "currencyUomId", op: "eq", value: currencyUomId}}})
function panel(id, filters) {
    return {
        id,
        type: "panel",
        title: "Spec orders value",
        body: {
            title: "Spec orders value",
            visualization: "stat",
            queries: [{datasetId: "boss-commerce-checkouts", filters, aggregations: [{id: "n", type: "count", role: "metric"}]}]
        }
    }
}

spec({
    stepwise: true,
    setupSpec() {
        removeSpecData()
        login(users.system)
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login(users.system)
        removeSpecData()
        ec.artifactExecution.enableAuthz()
    }
})

feature("a reader sees only the entries their owner grants; SalesAnalysis is one entry, Sales'", {
    when() {
        const salesAnalysis = system(() =>
            Array.from(ec.entity.find("ironstone.insights.ReportCatalogEntry").list())
                .filter(row => /SalesAnalysis/.test(row.entryId + " " + (row.routePath || "") + " " + (row.catalogueKey || "")))
                .map(row => row.entryId + " " + row.ownerApp + " " + row.routePath)
        )
        return {
            reader: entryIds(users.reader),
            service: entryIds(users.serviceManager),
            warehouse: entryIds(users.warehouse),
            finance: entryIds(users.finance),
            salesAnalysis
        }
    },
    then({reader, service, warehouse, finance, salesAnalysis}) {
        // the Insights reader alone reads no owner's report
        reader == []
        // the Customer Service manager: Customer Service's, by its catalogue; no Accounting or Warehouse report
        service.includes("CustomerService.ServiceLevelCompliance")
        service.includes("CustomerService.CaseVolumes")
        !service.some(id => id.startsWith("Accounting.") || id.startsWith("Warehouse.") || id.startsWith("Commerce."))
        // the warehouse reader: Stock at date by its route, never the Accounting statements
        warehouse.includes("Warehouse.StockAtDate")
        warehouse.includes("Warehouse.OperationsHistory")
        !warehouse.includes("Accounting.BalanceSheet")
        !warehouse.some(id => id.startsWith("Accounting.") || id.startsWith("CustomerService."))
        // the financial reader: Accounting's catalogue, and SalesAnalysis once, as Sales'
        finance.includes("Accounting.TrialBalance")
        finance.includes("Accounting.BalanceSheet")
        finance.filter(id => /SalesAnalysis/.test(id)) == ["Sales.SalesAnalysis"]
        !finance.some(id => id.startsWith("CustomerService."))
        salesAnalysis == ["Sales.SalesAnalysis Sales Accounting/Reports/SalesAnalysis"]
    }
})

feature("a pin edits the user's preference only, over entries they read; Reports shows it first", {
    when() {
        const entryId = "CustomerService.ServiceLevelCompliance"
        const before = system(() => ec.entity.find("ironstone.insights.ReportCatalogEntry").condition("entryId", entryId).one())
        // one sign-in for the manager's calls: pin, a stale and an unreadable pin refused, the catalog, pinned only, the saved pins,
        // Reports' one qvt render (the pinned entry first with its Unpin, and ReportContext for another entry), and unpin
        const run = asUser(users.serviceManager, () => {
            const pinned = invoke(G + "store#ReportPins", {entryId, pinned: true, expectedRevision: 0})
            const stale = refusal(G + "store#ReportPins", {
                entryId: "CustomerService.CaseVolumes",
                pinned: true,
                expectedRevision: 0
            })
            const unreadable = refusal(G + "store#ReportPins", {entryId: "Accounting.TrialBalance", pinned: true})
            const found = invoke(G + "find#Reports", {})
            const pinnedOnly = invoke(G + "find#Reports", {pinnedOnly: true})
            const saved = invoke(G + "find#SavedReports", {kind: "pin"})
            const rendered = page("Reports", {entryId: "CustomerService.CaseVolumes"})
            const unpinned = invoke(G + "store#ReportPins", {entryId, pinned: false})
            return {pinned, stale, unreadable, found, pinnedOnly, saved, rendered, unpinned}
        })
        const {pinned, stale, unreadable, found, pinnedOnly, saved, rendered, unpinned} = run
        const preference = system(() =>
            ec.entity
                .find("moqui.security.UserPreference")
                .condition("userId", "BOSS_INS_SVC_MANAGER")
                .condition("preferenceKey", homeKey)
                .one()
        )
        const after = system(() => ec.entity.find("ironstone.insights.ReportCatalogEntry").condition("entryId", entryId).one())
        return {
            pinned,
            stale,
            unreadable,
            value: JSON.parse(preference.preferenceValue),
            same: JSON.stringify(before) === JSON.stringify(after),
            first: found.reports[0],
            pinnedOnly: pinnedOnly.reports.map(row => row.entryId),
            saved: saved.savedReports.map(row => row.kind + " " + row.id),
            rendered,
            unpinned
        }
    },
    then({pinned, stale, unreadable, value, same, first, pinnedOnly, saved, rendered, unpinned}) {
        pinned.pinnedReportIds == ["CustomerService.ServiceLevelCompliance"]
        pinned.revision == 1
        stale.includes("PINS_CHANGED")
        unreadable.includes("REPORT_UNAVAILABLE")
        // the preference after the unpin: no pins, the revision counted on
        value.pinnedReportIds == []
        value.revision == 2
        same
        first.entryId == "CustomerService.ServiceLevelCompliance"
        first.pinned
        first.url == "/qapps/CustomerService/Reports/ServiceLevelCompliance"
        pinnedOnly == ["CustomerService.ServiceLevelCompliance"]
        saved == ["pin CustomerService.ServiceLevelCompliance"]
        rendered.status == 200
        rendered.errors == []
        rendered.output.includes("Service level compliance")
        rendered.output.includes("Unpin")
        rendered.output.includes("Open Case volumes")
        rendered.output.includes("Ziziwork Retail")
        !rendered.output.includes("Trial balance")
        unpinned.pinnedReportIds == []
    }
})

feature("get#Metric answers basis, grain and denominator, by id and by the panel that names it", {
    when() {
        return asUser(users.reader, () => ({
            orders: invoke(G + "get#Metric", {metricId: "Sales.Orders"}),
            orderValue: invoke(G + "get#Metric", {metricId: "Sales.OrderValue"}),
            sla: invoke(G + "get#Metric", {metricId: "CustomerService.ServiceLevelCompliance"}),
            stock: invoke(G + "get#Metric", {metricId: "Warehouse.StockAtDate"}),
            // Commerce's shipped Store operations dashboard: its orders panel names Sales' orders measure
            byPanel: invoke(G + "get#Metric", {definitionId: "boss-commerce-store-operations", panelId: "orders", value: "12"}),
            unmeasured: invoke(G + "get#Metric", {definitionId: "boss-commerce-store-operations", panelId: "checkouts"}),
            unknown: refusal(G + "get#Metric", {metricId: "Sales.Pipeline"})
        }))
    },
    then({orders, orderValue, sla, stock, byPanel, unmeasured, unknown}) {
        orders.metric.ownerApp == "Sales"
        orders.metric.grain == "Order part"
        orders.metric.basis.startsWith("Placed date")
        // a count and a value are two measures: the count takes no currency, the value keeps currencies apart
        orders.metric.unitPolicy == "count"
        orders.rules.some(rule => rule.startsWith("Recurring base orders are templates"))
        orderValue.metric.unitPolicy == "currency"
        orderValue.rules.some(rule => rule.startsWith("Native currencies are kept apart"))
        sla.metric.aggregation == "ratio"
        sla.metric.denominator == "Clocks decided (met or missed) and open past due"
        sla.rules.some(rule => rule.startsWith("A rate is recomputed"))
        stock.rules.includes("A snapshot is never summed across dates.")
        byPanel.metric.metricId == "Sales.Orders"
        byPanel.panel.metricVersion == 1
        !byPanel.versionChanged
        byPanel.comparison.reason == "NO_TARGET"
        unmeasured.available == false
        unmeasured.reason == "NO_METRIC"
        unknown.includes("METRIC_UNAVAILABLE")
    }
})

feature("a panel's target is typed: mixed currencies refused, a missing or zero target unavailable; only an author sets one", {
    when() {
        const target = (panelId, extra) => Object.assign({panelId, targetKind: "constant", betterDirection: "higher"}, extra)
        const reader = asUser(users.reader, () => ({
            service: refusal(G + "store#PanelTarget", target(panelIds.usd, {targetValue: "1000", targetUnitId: "USD"})),
            // the editors' area refuses the reader PanelDetail's transitions (BOSS_INS_AUTHORING)
            screen: post("PanelDetail/storeTarget", {
                definitionId: panelIds.usd,
                targetKind: "constant",
                targetValue: "1",
                targetUnitId: "USD"
            })
        }))
        const authored = asUser(users.author, () => {
            invoke(reports + "save#Definition", {definition: panel(panelIds.mixed, [])})
            invoke(reports + "save#Definition", {definition: panel(panelIds.usd, [currencyFilter("USD")])})
            for (const id of Object.values(panelIds))
                invoke(G + "store#PanelMeasure", {definitionId: id, metricId: "Sales.OrderValue"})
            const mixed = refusal(G + "store#PanelTarget", target(panelIds.mixed, {targetValue: "1000", targetUnitId: "USD"}))
            // an order count's target is a number, without a currency, on a panel of every currency
            invoke(G + "store#PanelMeasure", {definitionId: panelIds.mixed, metricId: "Sales.Orders"})
            const count = refusal(G + "store#PanelTarget", target(panelIds.mixed, {targetValue: "50"}))
            const otherCurrency = refusal(
                G + "store#PanelTarget",
                target(panelIds.usd, {targetValue: "1000", targetUnitId: "EUR"})
            )
            const both = refusal(
                G + "store#PanelTarget",
                target(panelIds.usd, {targetValue: "1000", targetUnitId: "USD", targetMetricId: "Accounting.InvoicedRevenue"})
            )
            const otherBasis = refusal(G + "store#PanelTarget", {
                panelId: panelIds.usd,
                targetKind: "metric",
                targetMetricId: "Warehouse.OnHand"
            })
            const noTarget = invoke(G + "get#Metric", {definitionId: panelIds.usd, value: "500"})
            const stored = invoke(G + "store#PanelTarget", target(panelIds.usd, {targetValue: "1000", targetUnitId: "USD"}))
            const compared = invoke(G + "get#Metric", {definitionId: panelIds.usd, value: "500"})
            // PanelDetail's one qvt render: BusinessMeasure with its basis, the target and Dependencies
            const detail = page("PanelDetail", {definitionId: panelIds.usd})
            // the zero target through PanelDetail's transition, named in the editors' area for the author
            const posted = post("PanelDetail/storeTarget", {
                definitionId: panelIds.usd,
                targetKind: "constant",
                targetValue: "0",
                targetUnitId: "USD",
                betterDirection: "higher",
                periodBinding: "panel"
            })
            const zero = invoke(G + "get#Metric", {definitionId: panelIds.usd, value: "500"})
            return {mixed, count, otherCurrency, both, otherBasis, noTarget, stored, compared, detail, posted, zero}
        })
        const {mixed, count, otherCurrency, both, otherBasis, noTarget, stored, compared, detail, posted, zero} = authored
        return {mixed, count, otherCurrency, both, otherBasis, reader, noTarget, stored, compared, detail, posted, zero}
    },
    then({mixed, count, otherCurrency, both, otherBasis, reader, noTarget, stored, compared, detail, posted, zero}) {
        mixed.includes("TARGET_CURRENCY_MIXED")
        count == ""
        otherCurrency.includes("TARGET_CURRENCY_MIXED")
        both.includes("TARGET_INPUT_INVALID")
        otherBasis.includes("TARGET_UNIT_MISMATCH")
        reader.service.includes("INSIGHTS_AUTHOR_REQUIRED")
        reader.screen.includes("not authorized")
        posted == ""
        noTarget.comparison.state == "unavailable"
        noTarget.comparison.reason == "NO_TARGET"
        stored.business.target.targetUnitId == "USD"
        stored.business.target.targetValue == "1000"
        compared.panel.currencyUomId == "USD"
        compared.comparison.state == "available"
        compared.comparison.gap == "-500"
        compared.comparison.ratio == "0.5000"
        !compared.comparison.meets
        detail.status == 200
        detail.errors == []
        detail.output.includes("Business measure")
        detail.output.includes("Order value (Sales, version 1)")
        detail.output.includes("Target 1000 USD, better higher, over panel")
        detail.output.includes("Used in")
        zero.comparison.state == "unavailable"
        zero.comparison.reason == "TARGET_ZERO"
    }
})

feature("saved reports keep their kinds apart; a copy is the author's, private or for one of their groups", {
    when() {
        const authored = asUser(users.author, () => ({
            copied: invoke(G + "copy#SavedReport", {
                definitionId: panelIds.usd,
                title: "Spec copy",
                userGroupId: "BOSS_INSIGHTS"
            }),
            otherGroup: refusal(G + "copy#SavedReport", {definitionId: panelIds.usd, title: "Spec copy", userGroupId: "ADMIN"}),
            mine: invoke(G + "find#SavedReports", {kind: "panel", owner: "mine"}),
            // SavedReports' one qvt render: the kinds apart, Save as for an author
            rendered: page("SavedReports", {kind: "panel"})
        }))
        const read = asUser(users.reader, () => ({
            readerCopy: refusal(G + "copy#SavedReport", {definitionId: panelIds.usd, title: "Mine"}),
            shared: invoke(G + "find#SavedReports", {kind: "panel"})
        }))
        const {copied, otherGroup, mine, rendered} = authored
        const {readerCopy, shared} = read
        return {copied, otherGroup, readerCopy, mine: mine.savedReports, shared: shared.savedReports, rendered}
    },
    then({copied, otherGroup, readerCopy, mine, shared, rendered}) {
        copied.type == "panel"
        copied.userGroupId == "BOSS_INSIGHTS"
        otherGroup.includes("SHARE_GROUP_UNAVAILABLE")
        readerCopy.includes("INSIGHTS_AUTHOR_REQUIRED")
        mine.some(row => row.id === panelIds.usd && row.sharing === "Private" && row.ownerText === "You")
        mine.some(row => row.id === copied.definitionId && row.kindName === "Library panel")
        // the reader reads the shared copy, and is told a panel opens on a dashboard (PanelDetail is the authors')
        shared.some(
            row => row.id === copied.definitionId && row.ownerText === "Shared" && row.unavailable === "Open it on a dashboard"
        )
        !shared.some(row => row.id === panelIds.usd)
        rendered.status == 200
        rendered.errors == []
        rendered.output.includes("Spec copy")
        rendered.output.includes("Library panel")
        rendered.output.includes("Save as")
    }
})

// P12 (design §13.2): a saved find on a list the copied report screens had is shown not valid, never opened elsewhere; the
// instance administrator's migration inventories the finds and schedules of Insights' lists and moves only the registered ones
feature("a legacy saved find shows not valid; the administrator's migration lists it and moves the registered one only", {
    when() {
        const location = "component://mr-boss/screen/Insights/"
        const finds = {
            gone: ["INS_CAT_FIND_GONE", location + "Reports.xml.form_list$DataDocumentList"],
            moved: ["INS_CAT_FIND_MOVED", location + "ReportBuilder/DatasetDetail/FieldList.xml.form_list$FieldList"]
        }
        const ids = Object.values(finds).map(find => find[0])
        const clean = () =>
            system(() => {
                for (const entityName of ["moqui.screen.form.FormListFindField", "moqui.screen.form.FormListFindUser", "moqui.screen.form.FormListFind"])
                    ec.entity.find(entityName).condition("formListFindId", "in", ids).deleteAll()
            })
        clean()
        try {
            system(() => {
                const make = (entityName, fields) => {
                    const row = ec.entity.makeValue(entityName)
                    row.setAll(fields)
                    row.create()
                }
                for (const [formListFindId, formLocation] of Object.values(finds)) {
                    make("moqui.screen.form.FormListFind", {formListFindId, formLocation, description: "Spec " + formListFindId})
                    make("moqui.screen.form.FormListFindUser", {formListFindId, userId: "BOSS_INS_READER"})
                }
            })
            const listed = asUser(users.reader, () => invoke(G + "find#SavedReports", {kind: "find"}).savedReports || [])
            const refused = asUser(users.reader, () => refusal(G + "migrate#LegacySavedFinds", {}))
            const dryRun = invoke(G + "migrate#LegacySavedFinds", {})
            const kept = system(() => ec.entity.find("moqui.screen.form.FormListFind").condition("formListFindId", finds.moved[0]).one().formLocation)
            const applied = invoke(G + "migrate#LegacySavedFinds", {apply: true})
            const moved = system(() => ec.entity.find("moqui.screen.form.FormListFind").condition("formListFindId", finds.moved[0]).one().formLocation)
            const after = asUser(users.reader, () => invoke(G + "find#SavedReports", {kind: "find"}).savedReports || [])
            const action = (answer, id) => (Array.from(answer.finds || []).find(row => row.formListFindId === id) || {}).action
            return {
                listed: listed.filter(row => ids.includes(row.id)),
                refused,
                dryGone: action(dryRun, finds.gone[0]),
                dryMoved: action(dryRun, finds.moved[0]),
                kept,
                applied: applied.applied,
                moved,
                after: after.find(row => row.id === finds.moved[0]) || {},
                goneAfter: after.find(row => row.id === finds.gone[0]) || {}
            }
        } finally {
            clean()
        }
    },
    then({listed, refused, dryGone, dryMoved, kept, applied, moved, after, goneAfter}) {
        listed.length == 2
        listed.every(row => row.invalid === true && row.url === null && row.unavailable.startsWith("Not valid"))
        refused.includes("ADMIN_REQUIRED")
        dryGone == "invalid"
        dryMoved == "moved"
        kept.endsWith("DatasetDetail/FieldList.xml.form_list$FieldList")
        applied == true
        moved == "component://mr-boss/screen/Insights/ReportBuilder/DatasetFields.xml.form_list$FieldList"
        after.invalid === false
        goneAfter.invalid === true
    }
})
