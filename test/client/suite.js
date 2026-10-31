suite(
    [
        "AccountingLedgerWalk",
        "AccountingSettingsWalk",
        "AccountingReceivablesWalk",
        "AccountingSettlementWalk",
        "AccountingPaymentsWalk",
        "AccountingPaymentGatewayWalk",
        "AccountingPayablesWalk",
        "AccountingBankingWalk",
        "AccountingCloseWalk",
        "AccountingTaxWalk",
        "ProductsPhone",
        "ProductsWalk",
        "ProductsTaxonomyWalk",
        "ProductsVariantWalk",
        "ProductsPriceWalk",
        "ProductsPriceListWalk",
        "ProductsCatalogSettings",
        "ProductsSupplierWalk",
        "ProductsInventoryWalk",
        "ProductsMethodWalk",
        "ProductsCostWalk",
        "ProductsDocumentWalk",
        "ProductsToolsWalk",
        "ProductsChecks",
        "ProductsImportWalk",
        "ProductsFinish"
    ],
    {
        server: {
            components: ["mr-boss"],
            specs: [
                "AccountingClientFixtures",
                "ProductsPriceFixtures",
                "ProductsInventoryFixtures",
                "ProductsMethodFixtures",
                "ProductsCostFixtures",
                "ProductsToolsFixtures",
                "ProductsImportFixtures"
            ],
            conf: "conf/MoquiDevConf.xml"
        }
    }
)
