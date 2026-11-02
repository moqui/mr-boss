// Helpers the Warehouse specs share: the demo ids, a block run as a user with artifact authorization on or off, a call's
// refusal message, and a Warehouse page render.
const ids = {
    facilityId: "ZIRET_WH",
    eastFacilityId: "BOSS_WH_EAST",
    otherFacilityId: "BOSS_PRD_WH",
    assetId: "BOSS_WH_SER_1",
    eastAssetId: "BOSS_WH_SER_3",
    otherAssetId: "BOSS_PRD_STOCK",
    lotId: "BOSS_WH_LOT_A",
    containerId: "BOSS_WH_TOTE_E1",
    shipmentId: "BOSS_WH_SHIP_OUT",
    transferShipmentId: "BOSS_WH_SHIP_TRANSFER",
    otherShipmentId: "BOSS_WH_SHIP_OTHER",
    returnId: "BOSS_WH_RETURN",
    countId: "BOSS_WH_COUNT"
}

// Run action as username, with artifact authorization enabled or not, then sign in again as the user before.
function asUser(username, action, enabled = true) {
    const previousUsername = ec.user.username || "john.doe"
    login(username)
    const disabled = ec.artifactExecution.authzDisabled()
    try {
        if (enabled) ec.artifactExecution.enableAuthz()
        else ec.artifactExecution.disableAuthz()
        return action()
    } finally {
        ec.message.clearErrors()
        if (disabled) ec.artifactExecution.disableAuthz()
        else ec.artifactExecution.enableAuthz()
        login(previousUsername)
    }
}

// The message a call is refused with, or "" when it succeeds: a negative case checks the message names the refusal, and a
// positive case with the same parameters gets "", so a validation error is not taken for a refusal.
function refusal(service, parameters = {}) {
    ec.message.pushErrors()
    try {
        ec.service.sync().name(service).parameters(parameters).requireNewTransaction(true).call()
        return ec.message.hasError() ? ec.message.getErrorsString() : ""
    } catch (error) {
        return String(error.message)
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
}
function invoke(service, parameters = {}) {
    return ec.service.sync().name(service).parameters(parameters).call() || {}
}

// A Warehouse screen as the shell fetches it (qvt, a fragment of the last standalone screen, with its lists' data), with
// a widget's render error counted among the errors.
function page(path, parameters = {}, mode = "qvt") {
    const renderer = ec.screen.makeTest().rootScreen("component://mr-boss/screen/Warehouse.xml").renderMode(mode)
    if (mode === "qvt") renderer.withStaticData()
    const result = renderer.render(path, Object.assign({lastStandalone: "-2"}, parameters), null)
    const output = String(result.output || "")
    const failed = output.match(/(Error rendering|Exception in render)[^\n<]*/g) || []
    const errors = Array.from(result.errorMessages || []).concat(failed)
    ec.message.clearErrors()
    return {status: result.status, output, errors}
}

// The route fixtures of every Warehouse screen (P18), for AppStructure, TuiRender and ServerStatic: by path under the
// Warehouse root, the demo record's parameters (data/BossWarehouseDemoData.xml) and a text the screen shows in every data
// state (tuiText where the terminal twin shows another: a scan field's title, not its placeholder); and the shared screens and Handheld mounts under the root that
// the screen file walk does not find, as [path, screen location].
function routeFixtures() {
    const shared = "component://mr-boss/screen/Shared/"
    const own = "component://mr-boss/screen/Warehouse/"
    const routes = {
        // Warehouse P1: Home's queues (counted by later phases) and the lookup of a demo unit by its serial number
        "Home": {parameters: {scanText: "SCN-1001"}, text: "Serialized scanner"},
        // Warehouse P4: the Inventory area on its demo stock (data/BossWarehouseDemoData.xml), and Products' shared mounts in the
        // Warehouse context (pushed in setupSpec); a tab renders its parent's level here, WarehouseInventory checks the tabs' rows
        // a list's demo row is found by a filter (not by its text, which the filter field would echo), as the suite's other
        // specs add rows that page it off the first page
        "Inventory": {parameters: {productId: "BOSS_WH_PACKED"}, text: "BOSS_WH_PACK_STOCK"},
        "Inventory/Assets": {parameters: {productId: "BOSS_WH_PACKED"}, text: "BOSS_WH_PACK_STOCK"},
        "Inventory/AssetDetail": {parameters: {assetId: "BOSS_WH_LOT_AVAIL"}, text: "Lot SEAL-2026-A"},
        "Inventory/AssetDetail/Ledger": {parameters: {assetId: "BOSS_WH_LOT_AVAIL"}, text: "Lot SEAL-2026-A"},
        "Inventory/AssetDetail/Reservations": {parameters: {assetId: "BOSS_WH_LOT_AVAIL"}, text: "Lot SEAL-2026-A"},
        "Inventory/AssetDetail/Audit": {parameters: {assetId: "BOSS_WH_LOT_AVAIL"}, text: "Lot SEAL-2026-A"},
        "Inventory/AssetDetail/Files": {parameters: {assetId: "BOSS_WH_LOT_AVAIL"}},
        "Inventory/AssetDetail/Notes": {parameters: {assetId: "BOSS_WH_LOT_AVAIL"}},
        "Inventory/Movements": {text: "Stock movements"},
        "Inventory/Lots": {parameters: {lotId: "BOSS_WH_LOT_A"}, text: "Lot SEAL-2026-A"},
        "Inventory/Containers": {text: "BOSS_WH_TOTE_E1"},
        "Inventory/ContainerDetail": {parameters: {containerId: "BOSS_WH_TOTE_E1"}, text: "East tote 1"},
        "Inventory/Traceability": {parameters: {rootType: "lot", rootId: "BOSS_WH_LOT_A"}, text: "Lineage"},
        "Inventory/Availability": {parameters: {productId: "BOSS_WH_LOTTED"}, text: "Lot-tracked sealant"},
        "Inventory/Availability/Locations": {parameters: {productId: "BOSS_WH_LOTTED"}, text: "Lot-tracked sealant"},
        "Inventory/Availability/Reservations": {parameters: {productId: "BOSS_WH_LOTTED"}, text: "Lot-tracked sealant"},
        "Inventory/Availability/Movements": {parameters: {productId: "BOSS_WH_LOTTED"}, text: "Lot-tracked sealant"},
        "Inventory/Product360": {parameters: {productId: "BOSS_WH_LOTTED"}, text: "Lot-tracked sealant"},
        "Inventory/Product360/Replenishment": {parameters: {productId: "BOSS_WH_LOTTED"}, text: "Lot-tracked sealant"},
        // Warehouse P2: Facilities (the list and tree), the shared facility and equipment screens with the Warehouse context
        // (pushed in setupSpec with FacilityDetail's tabs); a direct shared-root render is its default Overview leaf, empty
        // without an app root
        "Locations": {parameters: {text: "Retail East"}, text: "Ziziwork Retail East Warehouse"},
        "Locations/Facilities": {parameters: {text: "Retail East"}, text: "Ziziwork Retail East Warehouse"},
        "Locations/FacilityDetail": {parameters: {facilityId: "ZIRET_WH"}, text: "Ziziwork Retail Warehouse"},
        "Locations/EquipmentDetail": {parameters: {assetId: "BOSS_WH_FORKLIFT"}, text: "Forklift 2"},
        // Warehouse P5: Move on a location of ZIRET_WH, with a quarantined demo asset chosen; the Handheld area (its Move is the
        // same screen, pushed in setupSpec)
        "Transfers": {text: "Move stock"},
        "Transfers/Move": {parameters: {facilityId: "ZIRET_WH", locationSeqId: "0901", assetId: "BOSS_WH_LOT_QUARANTINE"},
            text: "Quarantined stock moves only"},
        // Warehouse P15: Transfers and the demo transfer, subcontract dispatch and stock request (data/BossWarehouseDemoData.xml);
        // the shared shipment and request mounts are pushed in setupSpec
        "Transfers/Transfers": {text: "BOSS_WH_SHIP_TRANSFER"},
        "Transfers/TransferShipmentDetail": {parameters: {shipmentId: "BOSS_WH_SHIP_TRANSFER"}, text: "Transfer demo filter"},
        "Transfers/SubcontractShipmentDetail": {parameters: {shipmentId: "BOSS_WH_SHIP_SUB"}, text: "Custody at supplier"},
        "Transfers/TransferSheet": {parameters: {shipmentId: "BOSS_WH_SHIP_TRANSFER"}, text: "Sent by"},
        "Transfers/NewTransfer": {text: "Transfer stock to another facility"},
        "Transfers/StockRequests": {text: "Filters for the east line"},
        "Transfers/RequestDetail": {parameters: {requestId: "BOSS_WH_REQ"}, text: "Items and progress"},
        "Transfers/NewStockRequest": {text: "Ask for stock"},
        // Warehouse P6: Adjustments with a demo asset fixed, and Repack of the demo cases (data/BossWarehouseDemoData.xml)
        "Inventory/Adjustments": {parameters: {assetId: "BOSS_WH_LOT_AVAIL"}, text: "Adjust this asset"},
        "Transfers/Repack": {parameters: {assetId: "BOSS_WH_CASES"}, text: "Unpack into"},
        "Handheld": {text: "Scan anything"},
        "Handheld/Home": {parameters: {lookupId: "SCN-1001"}, text: "Serialized scanner"},
        "Handheld/Move": {parameters: {facilityId: "ZIRET_WH"}, text: "Scan the bin", tuiText: "To bin or container"},
        // Warehouse P7: Receiving, on the demo purchase receipt and order
        "Receiving": {parameters: {text: "WH_SHIP_IN"}, text: "BOSS_WH_SHIP_IN"},
        "Receiving/Receipts": {parameters: {text: "WH_SHIP_IN"}, text: "BOSS_WH_SHIP_IN"},
        "Receiving/Receive": {parameters: {shipmentId: "BOSS_WH_SHIP_IN"}, text: "Ziddleman"},
        "Receiving/NewReceipt": {text: "Open a receipt"},
        "Receiving/ReceiptDocument": {parameters: {shipmentId: "BOSS_WH_SHIP_IN"}, text: "Receipt BOSS_WH_SHIP_IN"},
        "Receiving/ReceiptDetail": {parameters: {shipmentId: "BOSS_WH_SHIP_IN"}, text: "Lot-tracked sealant"},
        "Handheld/Receive": {parameters: {shipmentId: "BOSS_WH_SHIP_IN"}, text: "Ziddleman"},
        // Warehouse P9: Putaway on ZIRET_WH with the sealant on hold at receiving chosen, its sheet, the rules and Handheld Putaway
        "Receiving/Putaway": {parameters: {facilityId: "ZIRET_WH", assetId: "BOSS_WH_LOT_HOLD"},
            text: "Waiting to be put away"},
        "Receiving/PutawaySheet": {parameters: {facilityId: "ZIRET_WH"}, text: "Putaway sheet"},
        "Locations/PutawayRules": {parameters: {facilityId: "ZIRET_WH"}, text: "BOSS_WH_PR_SEAL"},
        "Handheld/Putaway": {parameters: {facilityId: "ZIRET_WH"}, text: "Scan the stock", tuiText: "waiting"},
        // Warehouse P3: the settings on ZIRET_WH and the demo's key-account pool and Retail store, each tab rendered alone
        "Settings/Index": {parameters: {lastStandalone: "true"}, text: "Stock policies"},
        "Settings/StockPolicies": {parameters: {facilityId: "ZIRET_WH"}},
        "Settings/StockPolicies/OperationPolicy": {parameters: {lastStandalone: "true", facilityId: "ZIRET_WH"}, text: "Receipt steps"},
        "Settings/StockPolicies/TrackingPolicy": {parameters: {lastStandalone: "true", facilityId: "ZIRET_WH"}, text: "Block expired stock"},
        "Settings/StockPolicies/ProductTrackingExceptions": {parameters: {lastStandalone: "true", facilityId: "ZIRET_WH"}, text: "Product tracking exceptions"},
        "Settings/StockPolicies/PolicyPreview": {parameters: {lastStandalone: "true", facilityId: "ZIRET_WH"}, text: "Policy in effect"},
        "Settings/ReservationPolicies": {parameters: {facilityId: "ZIRET_WH"}},
        "Settings/ReservationPolicies/FacilityReservation": {parameters: {lastStandalone: "true", facilityId: "ZIRET_WH"}, text: "Reservation order"},
        "Settings/ReservationPolicies/StoreReservation": {parameters: {lastStandalone: "true", productStoreId: "POPC_DEFAULT"}, text: "Ziziwork Retail Store"},
        "Settings/ReservationPolicies/ReservationCheck": {parameters: {lastStandalone: "true", facilityId: "ZIRET_WH"}, text: "Reservation check"},
        "Settings/AssetPools/PoolList": {parameters: {lastStandalone: "true"}, text: "KEY-ACCOUNTS"},
        "Settings/AssetPools/PoolDetail": {parameters: {lastStandalone: "true", assetPoolId: "BOSS_WH_POOL"}, text: "Key account stock"},
        // Warehouse P10: the Counts area on the demo's planned blind count, the Due find, the sheets, the count schedule tab and
        // the variance report under Reports (empty until a count is reviewed)
        "Counts": {text: "Due"},
        "Counts/Counts": {text: "BOSS_WH_COUNT"},
        "Counts/CountDetail": {parameters: {physicalInventoryId: "BOSS_WH_COUNT"}, text: "Cycle count"},
        "Counts/CountEntry": {text: "Choose a count to enter"},
        "Counts/CountReview": {parameters: {physicalInventoryId: "BOSS_WH_COUNT"}, text: "reviewed once it is submitted"},
        "Counts/CountSheet": {parameters: {physicalInventoryId: "BOSS_WH_COUNT"}, text: "Count sheet"},
        // P18: the count quick create
        "NewCount": {text: "Plan a count"},
        "Handheld/Count": {text: "Choose a count to enter"},
        "Reports/CountVariance": {text: "Count variance"},
        // Warehouse P17: the report index, stock at a date (shared, its tabs) on the demo's lot by weight, operations history
        // and the Warehouse context of Accounting's valuation (values with financial read only)
        "Reports": {text: "Stock at date"},
        "Reports/ReportIndex": {text: "Operations history"},
        "Reports/StockAtDate": {parameters: {lotId: "BOSS_WH_LOT_SHEET", asOfDate: "2026-09-30"}, text: "Stock at date"},
        // the tabs rendered alone (lastStandalone true): at the shell's -2 the level is StockAtDate's header, whose tab pane
        // the client fills, so a tab's rows are not in that render
        "Reports/StockAtDate/Places": {
            parameters: {lastStandalone: "true", lotId: "BOSS_WH_LOT_SHEET", fromDate: "2026-09-10", asOfDate: "2026-09-30"},
            text: "Gasket sheet by weight"
        },
        "Reports/StockAtDate/History": {
            parameters: {lastStandalone: "true", lotId: "BOSS_WH_LOT_SHEET", fromDate: "2026-09-10", asOfDate: "2026-09-30"},
            text: "BOSS_WH_SHIP_SHEET_OUT"
        },
        "Reports/OperationsHistory": {parameters: {fromDate: "2026-09-01", thruDate: "2026-09-30"}, text: "Operations history"},
        "Reports/InventoryValuation": {text: "Inventory valuation"},
        "Settings/StockPolicies/CountSchedule": {parameters: {lastStandalone: "true", facilityId: "ZIRET_WH"}, text: "Every 30 days"},
        // Warehouse P11: Picking on the demo's picklist "Morning picks" and its shipment of the pick demo bracket; Shipping's
        // outgoing shipments, the outbound ShipmentDetail and the Warehouse OrderDetail on the demo sales order
        "Picking": {text: "Morning picks"},
        "Picking/Picklists": {text: "Morning picks"},
        "Picking/PicklistDetail": {parameters: {workEffortId: "BOSS_WH_LOAD"}, text: "BOSS_WH_SHIP_PICK"},
        "Picking/CreatePicklists": {text: "Choose the orders"},
        "Picking/Pick": {parameters: {workEffortId: "BOSS_WH_LOAD"}, text: "Pick demo bracket"},
        "Picking/PickLocationMoves": {parameters: {facilityId: "ZIRET_WH"}, text: "Below minimum"},
        "Picking/PickSheet": {parameters: {workEffortId: "BOSS_WH_LOAD"}, text: "Pick sheet"},
        "Shipping": {text: "BOSS_WH_SHIP_PICK"},
        "Shipping/Shipments": {text: "BOSS_WH_SHIP_PICK"},
        "Shipping/ShipmentDetail": {parameters: {shipmentId: "BOSS_WH_SHIP_PICK"}, text: "Pick demo bracket"},
        "Orders": {parameters: {orderId: "BOSS_WH_SO"}, text: "Pick demo bracket"},
        "Orders/OrderDetail": {parameters: {orderId: "BOSS_WH_SO"}, text: "Pick demo bracket"},
        "Handheld/Pick": {parameters: {workEffortId: "BOSS_WH_LOAD"}, text: "Pick demo bracket"},
        "Handheld/PickFace": {parameters: {facilityId: "ZIRET_WH"}, text: "Below minimum"},
        // Warehouse P12: Pack on the demo's picked shipment, its print, Handheld Pack, the box types, and MaterialIssueReceipt on
        // the demo kit shipment (its shared root alone is not available)
        "Shipping/Pack": {parameters: {shipmentId: "BOSS_WH_SHIP_PACK"}, text: "Pack demo hinge"},
        "Shipping/PackingSlip": {parameters: {shipmentId: "BOSS_WH_SHIP_PACK"}, text: "Packing slip"},
        "Handheld/Pack": {parameters: {shipmentId: "BOSS_WH_SHIP_PACK"}, text: "Pack demo hinge"},
        "Locations/BoxTypes": {text: "Medium carton"},
        // Warehouse P13: Ship on the demo's packed shipment, PackageTracking, the label sheet and manifest prints, Carriers,
        // Printers and its test page, and InvoiceDetail's Warehouse context on the shipment's invoice
        "Shipping/Ship": {parameters: {shipmentId: "BOSS_WH_SHIP_SHIP"}, text: "Ship demo bracket"},
        "Shipping/PackageTracking": {text: "Package tracking"},
        "Shipping/LabelSheet": {parameters: {kind: "box"}, text: "Small carton"},
        "Shipping/Manifest": {parameters: {facilityId: "ZIRET_WH"}, text: "Carrier manifest"},
        "Locations/Carriers": {text: "Test Carrier"},
        "Locations/Printers": {text: "Dock label printer"},
        "Locations/PrinterTestPage": {text: "TEST PAGE"},
        "Orders/InvoiceDetail": {parameters: {invoiceId: "BOSS_WH_INV_SHIP"}, text: "Ship demo bracket"},
        "Inventory/MaterialIssueReceipt": {parameters: {sourceType: "shipmentAssembly", sourceId: "BOSS_WH_SHIP_KIT"},
            text: "Kit assembly"},
        // Warehouse P8: the Inspection area on the demo's draft inspection and published sealant check, the shared inspection and
        // template screens with the Warehouse context (pushed in setupSpec), and the two prints
        "Inspection": {text: "BOSS_WH_INSP"},
        "Inspection/Inspections": {text: "BOSS_WH_INSP"},
        "QualityInspection": {parameters: {qualityInspectionId: "BOSS_WH_INSP"}, text: "Viscosity"},
        "Inspection/InspectionTemplates": {parameters: {inspectionTemplateId: "BOSS_WH_TMPL"}, text: "Seal intact"},
        "InspectionCertificate": {parameters: {qualityInspectionId: "BOSS_WH_INSP"}, text: "Inspection certificate"},
        "Inspection/TemplatePrint": {parameters: {inspectionTemplateId: "BOSS_WH_TMPL"}, text: "Viscosity"},
        // Warehouse P14: the Returns area on the demo RMA and supplier return, the shared return and shipment screens with the
        // Warehouse context (pushed in setupSpec), and the slip
        "Returns": {text: "BOSS_WH_RMA"},
        "Returns/Returns": {text: "BOSS_WH_SRET"},
        "Returns/ReturnDetail": {parameters: {returnId: "BOSS_WH_RMA"}, text: "Customer return BOSS_WH_RMA"},
        "Returns/ReturnReceipt": {parameters: {shipmentId: "BOSS_WH_RMA_SHIP"}, text: "Return receipt BOSS_WH_RMA_SHIP"},
        "Returns/SupplierReturnShipment": {parameters: {shipmentId: "BOSS_WH_SRET_SHIP"}, text: "Spare pump gasket"},
        "Returns/ReturnSlip": {parameters: {shipmentId: "BOSS_WH_RMA_SHIP"}, text: "RMA receiving slip"},
    }
    const mounts = [
        ["Locations/FacilityDetail", shared + "FacilityDetail.xml"],
        ["Locations/EquipmentDetail", shared + "EquipmentDetail.xml"],
        ["Handheld/Move", own + "Transfers/Move.xml"],
        ["Handheld/Receive", own + "Receiving/Receive.xml"],
        ["Handheld/Putaway", own + "Receiving/Putaway.xml"],
        ["Handheld/Count", own + "Counts/CountEntry.xml"],
        ["Handheld/Pick", own + "Picking/Pick.xml"],
        ["Handheld/Pack", own + "Shipping/Pack.xml"],
        ["Handheld/PickFace", own + "Picking/PickLocationMoves.xml"],
        ["Shipping/ShipmentDetail", shared + "ShipmentDetail.xml"],
        ["Orders/OrderDetail", shared + "OrderDetail.xml"],
        ["Orders/InvoiceDetail", shared + "InvoiceDetail.xml"],
        ["Inventory/MaterialIssueReceipt", shared + "MaterialIssueReceipt.xml"],
        ["Receiving/ReceiptDetail", shared + "ShipmentDetail.xml"],
        ["Receiving/Supplier360", shared + "Supplier360.xml"],
        ["Transfers/TransferShipmentDetail", shared + "ShipmentDetail.xml"],
        ["Transfers/SubcontractShipmentDetail", shared + "ShipmentDetail.xml"],
        ["Transfers/RequestDetail", shared + "RequestDetail.xml"],
        ["QualityInspection", shared + "QualityInspection.xml"],
        ["Inspection/InspectionTemplates", shared + "InspectionTemplates.xml"],
        ["Returns/ReturnDetail", shared + "ReturnDetail.xml"],
        ["Returns/ReturnReceipt", shared + "ShipmentDetail.xml"],
        ["Returns/SupplierReturnShipment", shared + "ShipmentDetail.xml"],
        ["Inventory/Availability", shared + "InventoryAvailability.xml"],
        ["Inventory/Availability/Locations", shared + "InventoryAvailability/Locations.xml"],
        ["Inventory/Availability/Reservations", shared + "InventoryAvailability/Reservations.xml"],
        ["Inventory/Availability/Movements", shared + "InventoryAvailability/Movements.xml"],
        ["Inventory/Product360", shared + "Product360.xml"],
        ["Inventory/Product360/Replenishment", shared + "Product360/Replenishment.xml"],
        ["Reports/StockAtDate", shared + "StockAtDate.xml"],
        ["Reports/StockAtDate/Places", shared + "StockAtDate/Places.xml"],
        ["Reports/StockAtDate/History", shared + "StockAtDate/History.xml"],
        ["Reports/InventoryValuation", shared + "InventoryValuation.xml"]
    ]
    for (const tab of ["Overview", "Children", "Locations", "Products", "BoxTypes", "Printers", "Policies", "Schedules", "Files",
        "Conversation"]) {
        mounts.push(["Locations/FacilityDetail/" + tab, shared + "FacilityDetail/" + tab + ".xml"])
        routes["Locations/FacilityDetail/" + tab] = {parameters: {facilityId: "ZIRET_WH"}, text: "Ziziwork Retail Warehouse"}
    }
    routes["Receiving/Supplier360"] = {parameters: {vendorPartyId: "ZiddlemanInc"}, text: "Ziddleman"}
    for (const tab of ["Overview", "Documents", "Receiving", "Conversation"]) {
        mounts.push(["Receiving/Supplier360/" + tab, shared + "Supplier360/" + tab + ".xml"])
        routes["Receiving/Supplier360/" + tab] = {parameters: {vendorPartyId: "ZiddlemanInc"}, text: "Ziddleman"}
    }
    return {routes, mounts}
}

;({ids, asUser, refusal, invoke, page, routeFixtures})
