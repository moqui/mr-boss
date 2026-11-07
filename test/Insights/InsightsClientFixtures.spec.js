// The data of the Insights golden walk (test/client/Insights/InsightsDashboardsWalk), made on the --serve server before the walk:
// a dashboard and a library panel, ADMIN's, shared with the Insights users (BOSS_INSIGHTS). The panel's dataset (Mantle's sales
// orders) is not readable by the Insights groups until a steward admits it (P3; the demo data leaves it waiting for review), so
// the walk's author sees it as not available.
// Run: ./moq test mr-boss --spec InsightsClientFixtures
const reports = "org.moqui.report.ReportServices."

spec({
    setupSpec() {
        login("john.doe")
    }
})

feature("the walk's shared dashboard and library panel exist", {
    when() {
        const save = definition => {
            const found = ec.service
                .sync()
                .name(reports + "get#Definition")
                .parameters({definitionId: definition.id})
            ec.message.pushErrors()
            let existing = null
            try {
                existing = found.call()?.definition
            } finally {
                ec.message.clearErrors()
                ec.message.popErrors()
            }
            if (!existing) call(reports + "save#Definition", {definition, note: "Insights walk fixture"})
        }
        save({
            id: "INS_WALK_PANEL",
            type: "panel",
            title: "Orders per day",
            userGroupId: "BOSS_INSIGHTS",
            body: {
                title: "Orders per day",
                visualization: "timeSeries",
                queries: [
                    {
                        datasetId: "mantle-sales-orders",
                        aggregations: [
                            {
                                id: "day",
                                type: "date_histogram",
                                role: "x-axis",
                                params: {field: "placedDate", calendar_interval: "1d"}
                            },
                            {id: "orders", type: "cardinality", role: "metric", params: {field: "orderId"}}
                        ]
                    }
                ]
            }
        })
        save({
            id: "INS_WALK_BOARD",
            type: "dashboard",
            title: "Management board",
            userGroupId: "BOSS_INSIGHTS",
            body: {
                panels: {note: {title: "About", visualization: "text", text: "The week at a glance."}},
                layout: {type: "autoGrid"}
            }
        })
        return {
            count: ec.entity
                .find("moqui.report.Definition")
                .condition("definitionId", "in", ["INS_WALK_PANEL", "INS_WALK_BOARD"])
                .disableAuthz()
                .count()
        }
    },
    then({count}) {
        count == 2
    }
})
