// Warehouse reports (impl-warehouse P17; design-warehouse §3 Home, §14): stock at a past date for a lot (the demo's sheet by
// weight) with its opening, receipts, issues, adjustments and closing, flagged incomplete before the demo's first movement;
// operations history with totals by unit, never across units; InventoryValuation's values refused to a Warehouse user
// without financial read while the quantity reports stay complete, and shown with it; the report index, the exports and
// the drop-downs; Home's cards, Your work from the Today source and the quantity indicators. The Mantle rules are mr-mantle's
// WarehouseReports spec. Demo records (BossWarehouseDemoData.xml P17); the financial reader is warehouse.manager made an
// Accounting reader for one feature.
const lib = ec.resource.script("component://mr-boss/test/Warehouse/WarehouseSpecLib.js")
const {ids, asUser, refusal, invoke, page} = lib
const R = "ironstone.warehouse.ReportServices."
const lotId = "BOSS_WH_LOT_SHEET"
const september = {lotId, facilityId: ids.facilityId, fromDate: "2026-09-10", asOfDate: "2026-09-30"}
const historyOf = (out, kind) => Array.from(out.historyRows || []).find(row => row.kind === kind) || {}

function withAuthzOff(action) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try {
        return action()
    } finally {
        if (!wasDisabled) ec.artifactExecution.enableAuthz()
    }
}
// warehouse.manager as an Accounting reader (ACCOUNTING_VIEW) for the action
function asFinancialReader(action) {
    const userId = withAuthzOff(
        () => ec.entity.find("moqui.security.UserAccount").condition("username", "warehouse.manager").one().userId
    )
    const member = {userGroupId: "BOSS_ACCOUNTING_READ", userId, fromDate: "2000-01-01 00:00:00"}
    withAuthzOff(() => ec.service.sync().name("create#moqui.security.UserGroupMember").parameters(member).call())
    try {
        return asUser("warehouse.manager", action)
    } finally {
        withAuthzOff(() => ec.entity.find("moqui.security.UserGroupMember").condition(member).deleteAll())
    }
}

feature("stock at a past date for a lot shows its opening, receipts, issues, adjustments and closing", {
    when() {
        return asUser("warehouse.read", () => ({
            out: invoke(R + "get#StockAtDate", september),
            places: page("Reports/StockAtDate/Places", september, "html"),
            history: page("Reports/StockAtDate/History", september, "html")
        }))
    },
    then({out, places, history}) {
        out.complete == true
        out.stockRows.length == 1
        out.stockRows[0].openingQuantity == 50
        out.stockRows[0].receiptQuantity == 20
        out.stockRows[0].issueQuantity == 12
        out.stockRows[0].adjustmentQuantity == -0.5
        out.stockRows[0].closingQuantity == 57.5
        out.stockRows[0].unitText != ""
        out.stockRows[0].productLink.includes("Inventory/Product360")
        Array.from(out.historyRows)
            .map(row => row.kind)
            .join(",") == "receipt,issue,adjustment"
        historyOf(out, "receipt").documentLink.includes("Receiving/ReceiptDetail")
        historyOf(out, "issue").documentLink.includes("Shipping/ShipmentDetail")
        places.errors == []
        places.output.includes("Gasket sheet by weight")
        places.output.includes("57.5")
        history.errors == []
        history.output.includes("BOSS_WH_SHIP_SHEET_OUT")
    }
})
feature("history from before the demo's first movement is flagged incomplete, never zero", {
    when() {
        const early = Object.assign({}, september, {fromDate: "2009-01-01"})
        return asUser("warehouse.read", () => ({
            out: invoke(R + "get#StockAtDate", early),
            places: page("Reports/StockAtDate/Places", early, "html")
        }))
    },
    then({out, places}) {
        out.complete == false
        out.historyStartText != ""
        out.stockRows[0].openingQuantity == null
        out.stockRows[0].closingQuantity == 57.5
        places.output.includes("History is incomplete")
        places.output.includes("Unknown")
    }
})
feature("operations history never adds incompatible units", {
    when() {
        const out = asUser("warehouse.read", () =>
            invoke(R + "get#OperationsHistory", {
                facilityId: ids.facilityId,
                fromDate: "2026-09-01",
                thruDate: "2026-09-30",
                pageSize: 100
            })
        )
        const totals = Array.from(out.totalRows || [])
        const shipments = Array.from(out.historyRows || []).map(row => row.shipmentId)
        return {
            out,
            shipments,
            kilograms: totals.find(row => row.quantityUomId === "WT_kg") || {},
            units: totals.map(row => row.quantityUomId || "").join(","),
            received: Array.from(out.historyRows || []).find(row => row.shipmentId === "BOSS_WH_SHIP_SHEET_IN") || {},
            page: asUser("warehouse.read", () =>
                page(
                    "Reports/OperationsHistory",
                    {facilityId: ids.facilityId, fromDate: "2026-09-01", thruDate: "2026-09-30"},
                    "html"
                )
            )
        }
    },
    then({shipments, kilograms, units, received, page}) {
        shipments.includes("BOSS_WH_SHIP_SHEET_IN")
        shipments.includes("BOSS_WH_SHIP_SHEET_OUT")
        // one total for each unit: kilograms are never added to other units
        new Set(units.split(",")).size == units.split(",").length
        kilograms.acceptedQuantity == 70
        kilograms.rejectedQuantity == 1
        kilograms.shippedQuantity == 12
        received.documentLink.includes("Receiving/ReceiptDetail")
        received.movementsLink.includes("Inventory/Movements?shipmentId=BOSS_WH_SHIP_SHEET_IN")
        received.daysFromExpected == 11
        page.errors == []
        page.output.includes("Gasket sheet by weight")
    }
})
feature("a Warehouse user without financial read is refused InventoryValuation's values; the quantity reports are complete", {
    when() {
        return {
            reader: asUser("warehouse.read", () => page("Reports/InventoryValuation", {}, "html")),
            readerValues: asUser("warehouse.read", () =>
                refusal("mantle.product.InventoryReportServices.run#InventoryValuation", {organizationPartyId: "ORG_ZIZI_RETAIL"})
            ),
            readerStock: asUser("warehouse.read", () => invoke(R + "get#StockAtDate", september).stockRows.length),
            financial: asFinancialReader(() => ({
                page: page("Reports/InventoryValuation", {facilityId: ids.facilityId}, "html"),
                scope: invoke(R + "get#ValuationScope", {facilityId: ids.facilityId})
            }))
        }
    },
    then({reader, readerValues, readerStock, financial}) {
        reader.errors == []
        reader.output.includes("Stock values need financial read")
        !reader.output.includes("Inventory accounts")
        readerValues != ""
        readerStock == 1
        financial.scope.financialRead == true
        financial.scope.organizationPartyId == "ORG_ZIZI_RETAIL"
        financial.page.errors == []
        financial.page.output.includes("Inventory accounts")
        !financial.page.output.includes("Stock values need financial read")
        // revaluation and cost repair stay in Accounting's context
        !financial.page.output.includes("Repair product cost")
        !financial.page.output.includes("Preview revaluation")
    }
})
feature("the report index, the exports and the drop-downs", {
    when() {
        return {
            reader: asUser("warehouse.read", () => page("Reports/ReportIndex", {}, "html")),
            reviewer: asUser("warehouse.countreview", () => page("Reports/ReportIndex", {}, "html")),
            export: asUser("warehouse.read", () =>
                invoke(R + "get#StockAtDate", Object.assign({pageNoLimit: true, pageSize: 1}, september))
            ),
            movements: asUser("warehouse.read", () =>
                Array.from(
                    invoke("ironstone.warehouse.InventoryServices.find#Movements", {shipmentId: "BOSS_WH_SHIP_SHEET_IN"})
                        .movementList
                ).map(row => row.assetDetailId)
            ),
            choices: asUser("warehouse.read", () =>
                Object.fromEntries(
                    [
                        ["owners", "ORG_ZIZI_RETAIL"],
                        ["parties", "ZiddlemanInc"],
                        ["facilities", ids.facilityId],
                        ["carriers", "_NA_"]
                    ].map(([choice, selected]) => [
                        choice,
                        Array.from(invoke(R + "get#ReportChoices", {choice, term: "zzz-none", selected}).options).map(
                            row => row.value
                        )
                    ])
                )
            ),
            unknown: asUser("warehouse.read", () => refusal(R + "get#ReportChoices", {choice: "everything"}))
        }
    },
    then({reader, reviewer, export: exported, movements, choices, unknown}) {
        reader.errors == []
        reader.output.includes("Stock at date")
        reader.output.includes("Operations history")
        !reader.output.includes("Count variance")
        reviewer.output.includes("Count variance")
        exported.historyRowsCount == 3
        exported.historyRows.length == 3
        movements.sort().join(",") == "BOSS_WH_SHEET_RCPT1,BOSS_WH_SHEET_RCPT2"
        choices.owners.includes("ORG_ZIZI_RETAIL")
        choices.parties.includes("ZiddlemanInc")
        choices.facilities.includes(ids.facilityId)
        choices.carriers.length == 0
        unknown.includes("Unknown Warehouse report choice")
    }
})
feature("the reports refuse another organization's facility and a user without Warehouse", {
    when() {
        const other = {facilityId: ids.otherFacilityId}
        return {
            stock: asUser("warehouse.read", () => refusal(R + "get#StockAtDate", other)),
            history: asUser("warehouse.read", () => refusal(R + "get#OperationsHistory", other)),
            valuation: asUser("warehouse.read", () => refusal(R + "get#ValuationScope", other)),
            organization: asUser("warehouse.read", () =>
                refusal(R + "get#ValuationScope", {organizationPartyId: "ORG_ZIZI_SERVICES"})
            ),
            finance: asUser("finance.read", () => refusal(R + "get#StockAtDate", {}), false),
            financeHistory: asUser("finance.read", () => refusal(R + "get#OperationsHistory", {}), false)
        }
    },
    then({stock, history, valuation, organization, finance, financeHistory}) {
        stock.includes("FACILITY_UNAVAILABLE")
        history.includes("FACILITY_UNAVAILABLE")
        valuation.includes("FACILITY_UNAVAILABLE")
        organization.includes("ORGANIZATION_UNAVAILABLE")
        finance.includes("WAREHOUSE_UNAVAILABLE")
        financeHistory.includes("WAREHOUSE_UNAVAILABLE")
    }
})
feature("Home has a card per queue, the Today source's items as Your work and the facility's quantity indicators", {
    when() {
        return asUser("warehouse.count", () => {
            invoke("ironstone.warehouse.AccessServices.select#Facility", {facilityId: ids.facilityId})
            return {
                home: invoke("ironstone.warehouse.HomeServices.get#Home", {appRoot: "Warehouse"}),
                today: invoke("ironstone.warehouse.HomeServices.get#TodayItems", {}),
                render: page("Home", {}, "html")
            }
        })
    },
    then({home, today, render}) {
        Array.from(home.workRows).length == Array.from(today.items).length
        Array.from(home.workRows).some(row => row.title.includes("BOSS_WH_COUNT") && row.step != "")
        home.indicators.productCount > 0
        home.indicators.onHoldCount > 0
        home.indicators.quarantineCount > 0
        render.errors == []
        render.output.includes("Products in stock")
        render.output.includes("Counts/Counts")
        // the desk's scan or look up
        render.output.includes("Scan or type a code")
    }
})
