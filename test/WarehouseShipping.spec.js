// Warehouse P13 in BOSS (impl-warehouse P13): the Ship task shows the demo's packed shipment BOSS_WH_SHIP_SHIP rated by the
// Mantle test carrier and the local rules, for the shipper only; its labels are bought, a print on the demo's label printer
// fails and offers a reprint while the labels stay, and it ships; PackageTracking lists it; Carriers shows the test gateway
// with its account masked and rates a shipment in CarrierTest; Printers, FacilityDetail's Printers tab, the label sheets and
// the manifest render; InvoiceDetail's Warehouse context shows the shipment's invoice without amounts for a reader; Home
// counts the shipping queue. The guarded labels, timeouts, refunds and dispatch are mr-mantle's WarehouseShipping; access is
// WarehouseAccess.
const lib = ec.resource.script("component://mr-boss/test/WarehouseSpecLib.js")
const {ids, asUser, invoke, refusal} = lib
const shipping = "ironstone.warehouse.ShippingServices."
const task = "mantle.shipment.WarehouseTaskServices."
const shipmentId = "BOSS_WH_SHIP_SHIP"
spec({
    setupSpec() {
        login("john.doe")
    }
})

feature("Ship shows the packed shipment's addresses, rates and packages to the shipper, and nothing to a reader", {
    when() {
        return {
            context: asUser("warehouse.ship", () => invoke(shipping + "get#ShipContext", {shipmentId})),
            toShip: asUser("warehouse.ship", () => invoke(shipping + "get#ShipContext", {facilityId: ids.facilityId})),
            rates: asUser("warehouse.ship", () => invoke(task + "get#ShipmentRates", {shipmentId}), false),
            shipper: asUser("warehouse.ship", () => lib.page("Shipping/Ship", {shipmentId}, "html")),
            reader: asUser("warehouse.read", () => lib.page("Shipping/Ship", {shipmentId}, "html")),
            readerContext: asUser("warehouse.read", () => refusal(shipping + "get#ShipContext", {shipmentId})),
            queue: asUser("warehouse.ship", () =>
                invoke("ironstone.warehouse.HomeServices.get#Home", {facilityId: ids.facilityId}).queueRows.find(
                    row => row.operation === "shipping"
                )
            )
        }
    },
    then({context, toShip, rates, shipper, reader, readerContext, queue}) {
        context.found == true
        context.packageRows.length == 2
        context.labelsByGateway == true
        context.gateway.shippingGatewayConfigId == "TEST_SHIPPING"
        context.destination.postalCode == "89119"
        context.canShip == false
        context.blockers.some(row => row.code == "TRACKING_REQUIRED")
        toShip.shipmentRows.some(row => row.shipmentId == "BOSS_WH_SHIP_SHIP")
        rates.rateRows.some(
            row => row.rateSource == "gateway" && row.carrierPartyId == "TEST_CARRIER" && row.shippingTotal == "14"
        )
        rates.rateRows.some(row => row.rateSource == "local")
        shipper.errors == []
        shipper.output.includes("Ship demo bracket")
        shipper.output.includes("Buy labels")
        shipper.output.includes("Test Carrier")
        reader.errors == []
        !reader.output.includes("Ship demo bracket")
        reader.output.includes("Shipping needs the ship permission")
        readerContext.includes("PERMISSION_DENIED")
        queue.readyCount >= 1
        queue.waitingCount != null
    }
})

feature("labels are bought, a failed print keeps them and offers a reprint, and the shipment ships", {
    when() {
        const run = (service, parameters) => asUser("warehouse.ship", () => refusalOrResult(service, parameters), false)
        const labels = run(task + "request#PackageLabels", {operationKey: "p13-boss-labels", shipmentId})
        const printed = asUser(
            "warehouse.ship",
            () =>
                invoke("mantle.facility.PrintServices.dispatch#Document", {
                    facilityId: ids.facilityId,
                    printerPurposeEnumId: "PtpPackageLabel",
                    documentType: "shipmentLabel",
                    shipmentId
                }),
            false
        )
        const afterPrint = asUser("warehouse.ship", () => lib.page("Shipping/Ship", {shipmentId}, "html"))
        const shipped = run(task + "ship#OutgoingShipment", {operationKey: "p13-boss-ship", shipmentId})
        const tracking = asUser("warehouse.ship", () => lib.page("Shipping/PackageTracking", {show: "all"}, "html"))
        const trackingRows = asUser("warehouse.ship", () =>
            invoke(shipping + "get#Tracking", {facilityId: ids.facilityId, show: "due", shipmentId})
        )
        return {labels, printed, afterPrint, shipped, tracking, trackingRows}
    },
    then({labels, printed, afterPrint, shipped, tracking, trackingRows}) {
        labels.result.resultCode == "LABELED"
        labels.result.doneCount == 2
        printed.printed == false
        printed.reprintable == true
        afterPrint.errors == []
        afterPrint.output.includes("Reprint")
        afterPrint.output.includes("1ZTEST")
        shipped.result.resultCode == "SHIPPED"
        tracking.errors == []
        tracking.output.includes("BOSS_WH_SHIP_SHIP")
        trackingRows.trackingRows.length == 2
        trackingRows.trackingRows.every(row => row.carrierName == "Test Carrier" && row.shipped)
    }
})
function refusalOrResult(service, parameters) {
    ec.message.pushErrors()
    try {
        const out = ec.service.sync().name(service).parameters(parameters).call() || {}
        return Object.assign({}, out, {error: ec.message.hasError() ? ec.message.getErrorsString() : ""})
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
}

feature("Carriers shows the test gateway with its account masked, edits for the Warehouse admin, and rates in CarrierTest", {
    when() {
        return {
            setup: asUser("warehouse.read", () => invoke(shipping + "get#CarrierSetup", {})),
            reader: asUser("warehouse.read", () => lib.page("Locations/Carriers", {}, "html")),
            manager: asUser("warehouse.admin", () =>
                lib.page("Locations/Carriers", {testShipmentId: "BOSS_WH_SHIP_SHIP", testGatewayId: "TEST_SHIPPING"}, "html")
            )
        }
    },
    then({setup, reader, manager}) {
        setup.gatewayRows.some(row => row.shippingGatewayConfigId == "TEST_SHIPPING" && row.modeText == "Test")
        setup.bindingRows.some(row => row.carrierPartyId == "TEST_CARRIER" && row.accountText == "••••0001")
        !JSON.stringify(setup).includes("TEST-ACCOUNT-0001")
        setup.canEdit == false
        reader.errors == []
        reader.output.includes("Test Carrier")
        !reader.output.includes("Add method")
        manager.errors == []
        manager.output.includes("Add method")
        manager.output.includes("Carrier test")
    }
})

feature("Printers, the facility's Printers tab, the label sheets and the manifest", {
    when() {
        return {
            index: asUser("warehouse.read", () => lib.page("Locations/Printers", {}, "html")),
            tab: asUser("warehouse.facility", () =>
                lib.page("Locations/FacilityDetail/Printers", {facilityId: ids.facilityId}, "html")
            ),
            readerTab: asUser("warehouse.read", () =>
                lib.page("Locations/FacilityDetail/Printers", {facilityId: ids.facilityId}, "html")
            ),
            locations: asUser("warehouse.read", () =>
                invoke(shipping + "get#LabelSheet", {kind: "location", facilityId: ids.facilityId})
            ),
            boxes: asUser("warehouse.read", () => lib.page("Shipping/LabelSheet", {kind: "box"}, "html")),
            lot: asUser("warehouse.read", () =>
                invoke(shipping + "get#LabelSheet", {kind: "lot", ids: ids.lotId + "," + "NO_SUCH_LOT"})
            ),
            manifest: asUser("warehouse.read", () => lib.page("Shipping/Manifest", {facilityId: ids.facilityId}, "html"))
        }
    },
    then({index, tab, readerTab, locations, boxes, lot, manifest}) {
        index.errors == []
        index.output.includes("Dock label printer")
        tab.errors == []
        tab.output.includes("Bind printer")
        tab.output.includes("Package Label")
        readerTab.errors == []
        !readerTab.output.includes("Bind printer")
        locations.labels.length > 3
        locations.labels[0].svg.startsWith("<svg")
        boxes.errors == []
        boxes.output.includes("Small carton")
        lot.labels.length == 1
        manifest.errors == []
        manifest.output.includes("Carrier manifest")
    }
})

feature("InvoiceDetail's Warehouse context shows the shipment's invoice, with amounts only for financial read", {
    when() {
        return {
            evidence: asUser("warehouse.read", () => invoke(shipping + "get#InvoiceEvidence", {invoiceId: "BOSS_WH_INV_SHIP"})),
            page: asUser("warehouse.read", () => lib.page("Orders/InvoiceDetail", {invoiceId: "BOSS_WH_INV_SHIP"}, "html")),
            other: asUser("warehouse.read", () => lib.page("Orders/InvoiceDetail", {invoiceId: "NO_SUCH_INVOICE"}, "html"))
        }
    },
    then({evidence, page, other}) {
        evidence.found == true
        evidence.financialRead == false
        evidence.invoice.totalText == null
        evidence.lineRows[0].amountText == null
        evidence.lineRows[0].shipmentsText == "BOSS_WH_SHIP_SHIP"
        page.errors == []
        page.output.includes("Lines and their shipments")
        page.output.includes("Ship demo bracket")
        other.errors == []
        other.output.includes("it bills no shipment")
    }
})
