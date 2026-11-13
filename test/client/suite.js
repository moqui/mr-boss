// Focused client regressions and one golden-path walk per app; other walks belong in test/acceptance/client.
suite(
    [
        "ProjectsPlanningResponses",
        "ProjectsDiffState",
        "ProjectsTimeAsync",
        "ProjectsResourcesAsync",
        "AccountingReceivablesWalk",
        "ProductsWalk",
        "ProductsVariantResponses",
        "WarehouseReceivingWalk",
        "ManufacturingWorkOrdersWalk",
        "PurchasingOrdersWalk",
        "CustomerServiceCasesWalk",
        "CommerceThemesWalk",
        "InsightsDashboardsWalk",
        "AdminUsersWalk",
        "PeopleHireWalk",
        "MaintenanceWorkOrdersWalk"
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
