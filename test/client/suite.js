// Focused client regressions and one golden-path walk per app; other walks belong in test/acceptance/client.
suite(
    [
        "NotesResponses",
        "VaultLock",
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
        "MaintenanceWorkOrdersWalk",
        "SalesPipelineWalk",
        "MarketingSendWalk"
    ],
    {
        server: {
            components: ["mr-boss"],
            specs: ["AccountingClientFixtures", "InsightsClientFixtures", "AdminClientFixtures", "MarketingClientFixtures"],
            conf: "conf/MoquiDevConf.xml",
            // the walks that send (invoices, reminders, the close) keep their mail in the capture (docs/Build-Test.md)
            properties: {moqui_conf__email_client__capture_sends: "true"}
        }
    }
)
