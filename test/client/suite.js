// Focused client regressions and one golden-path walk per app; other walks belong in acceptance/client.
suite(
    [
        "ProjectsPlanningResponses",
        "ProjectsDiffState",
        "AccountingReceivablesWalk",
        "ProductsWalk",
        "WarehouseReceivingWalk",
        "ManufacturingWorkOrdersWalk",
        "PurchasingOrdersWalk",
        "CustomerServiceCasesWalk",
        "CommerceThemesWalk",
        "InsightsDashboardsWalk",
        "AdminUsersWalk"
    ],
    {
        server: {
            components: ["mr-boss"],
            specs: ["AccountingClientFixtures", "InsightsClientFixtures", "AdminClientFixtures"],
            conf: "conf/MoquiDevConf.xml",
            // the walks that send (invoices, reminders, the close) keep their mail in the capture (docs/Build-Test.md)
            properties: {mail_capture_sends: "true"}
        }
    }
)
