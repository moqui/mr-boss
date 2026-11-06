// The regression suite's walks, one golden path per app; the other walks are acceptance tests (acceptance/client).
suite(
    [
        "AccountingReceivablesWalk",
        "ProductsWalk",
        "WarehouseReceivingWalk",
        "ManufacturingWorkOrdersWalk",
        "PurchasingOrdersWalk",
        "CustomerServiceCasesWalk",
        "CommerceThemesWalk"
    ],
    {
        server: {
            components: ["mr-boss"],
            specs: [
                "AccountingClientFixtures"
            ],
            conf: "conf/MoquiDevConf.xml",
            // the walks that send (invoices, reminders, the close) keep their mail in the capture (docs/Build-Test.md)
            properties: {mail_capture_sends: "true"}
        }
    }
)
