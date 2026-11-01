// Warehouse returns (impl-warehouse P14; design-warehouse §11, crosscut §3.8 and §3.18): Returns lists the returns of the
// user's facilities with their separate progress; NewReturn records a supplier return for a quality manager and refuses a
// reader; ReturnDetail shows the Warehouse context with no settlement action; ReturnReceipt receives a box of an RMA with a
// unit rejected at the dock into quarantine with its inspection, settling nothing; SupplierReturnShipment sends back the
// quarantined stock under its Return to supplier disposition (not for an issuer of free stock only) and ships, setting
// ReturnShipped; a Warehouse user cannot settle, and no Warehouse group may authorize. The Mantle rules are mr-mantle's
// WarehouseReturns spec. Fixtures (prefix BOSS_WH_P14_) copy the demo's RMA and supplier return, so the walk keeps the demo.
const lib = ec.resource.script("component://mr-boss/test/WarehouseSpecLib.js")
const {asUser, refusal, invoke, page} = lib
const one = (entity, conditions) => ec.entity.find(entity).condition(conditions).disableAuthz().one()
const rows = (entity, conditions) => Array.from(ec.entity.find(entity).condition(conditions).disableAuthz().list())
const n = value => (value == null ? 0 : Number(String(value)))
const rma = "BOSS_WH_P14_RMA",
    rmaShipment = "BOSS_WH_P14_RMA_SHIP",
    supplierReturn = "BOSS_WH_P14_SRET",
    supplierShipment = "BOSS_WH_P14_SRET_SHIP",
    inspection = "BOSS_WH_P14_INSP"

function withAuthzOff(action) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try {
        return action()
    } finally {
        if (!wasDisabled) ec.artifactExecution.enableAuthz()
    }
}
function create(entity, fields) {
    ec.service
        .sync()
        .name("create#" + entity)
        .parameters(fields)
        .call()
}
// a screen transition as the client posts it, with its errors
function post(path, parameters) {
    return page(path, parameters, "qvt").errors.join(" | ")
}

spec({
    stepwise: true,
    setupSpec() {
        withAuthzOff(() => {
            create("mantle.order.return.ReturnHeader", {
                returnId: rma,
                statusId: "ReturnApproved",
                customerPartyId: "CustJqp",
                vendorPartyId: "BOSS_WH_RETURNS",
                facilityId: "ZIRET_WH",
                entryDate: ec.user.nowTimestamp,
                currencyUomId: "USD"
            })
            create("mantle.order.return.ReturnItem", {
                returnId: rma,
                returnItemSeqId: "01",
                statusId: "ReturnApproved",
                productId: "BOSS_WH_LOTTED",
                itemTypeEnumId: "ItemProduct",
                returnQuantity: 3,
                receivedQuantity: 0,
                returnReasonEnumId: "RrsnDefective",
                returnResponseEnumId: "RrspCredit",
                responseImmediate: "N"
            })
            create("mantle.shipment.Shipment", {
                shipmentId: rmaShipment,
                shipmentTypeEnumId: "ShpTpSalesReturn",
                statusId: "ShipInput",
                fromPartyId: "CustJqp",
                toPartyId: "BOSS_WH_RETURNS"
            })
            create("mantle.shipment.ShipmentRouteSegment", {
                shipmentId: rmaShipment,
                shipmentRouteSegmentSeqId: "01",
                destinationFacilityId: "ZIRET_WH"
            })
            create("mantle.shipment.ShipmentItem", {shipmentId: rmaShipment, productId: "BOSS_WH_LOTTED", quantity: 3})
            create("mantle.shipment.ShipmentItemSource", {
                shipmentItemSourceId: rmaShipment,
                shipmentId: rmaShipment,
                productId: "BOSS_WH_LOTTED",
                statusId: "SisPending",
                quantity: 3,
                quantityNotHandled: 3,
                returnId: rma,
                returnItemSeqId: "01"
            })
            // the supplier return: quarantined gaskets an inspection disposed of as Return to supplier
            const received = ec.service
                .sync()
                .name("mantle.product.AssetServices.receive#Asset")
                .parameters({
                    productId: "BOSS_WH_GASKET",
                    facilityId: "ZIRET_WH",
                    locationSeqId: "0901",
                    quantity: 2,
                    ownerPartyId: "ORG_ZIZI_RETAIL",
                    statusId: "AstQuarantine",
                    lotId: "BOSS_WH_LOT_R"
                })
                .call()
            const assetId = received.assetId
            create("mantle.product.quality.QualityInspection", {
                qualityInspectionId: inspection,
                organizationPartyId: "ORG_ZIZI_RETAIL",
                facilityId: "ZIRET_WH",
                statusId: "QiDisposed",
                inspectionContextEnumId: "QicReceipt",
                sourceTypeEnumId: "QisAsset",
                productId: "BOSS_WH_GASKET",
                assetId,
                quantity: 2,
                heldQuantity: 2,
                disposedQuantity: 2,
                resultEnumId: "QirRejected",
                quantityAccepted: 0,
                quantityRejected: 2,
                createdDate: ec.user.nowTimestamp
            })
            create("mantle.product.quality.QualityInspectionDisposition", {
                qualityInspectionId: inspection,
                dispositionSeqId: "01",
                dispositionEnumId: "QdReturnSupplier",
                quantity: 2,
                assetId,
                resultAssetId: assetId,
                assetStatusId: "AstQuarantine",
                disposedDate: ec.user.nowTimestamp
            })
            create("mantle.order.return.ReturnHeader", {
                returnId: supplierReturn,
                statusId: "ReturnApproved",
                customerPartyId: "ORG_ZIZI_RETAIL",
                vendorPartyId: "ZiddlemanInc",
                facilityId: "ZIRET_WH",
                entryDate: ec.user.nowTimestamp,
                currencyUomId: "USD"
            })
            create("mantle.order.return.ReturnItem", {
                returnId: supplierReturn,
                returnItemSeqId: "01",
                statusId: "ReturnApproved",
                productId: "BOSS_WH_GASKET",
                itemTypeEnumId: "ItemInventory",
                returnQuantity: 2,
                returnReasonEnumId: "RrsnDefective",
                returnResponseEnumId: "RrspCredit",
                assetId
            })
            create("mantle.shipment.Shipment", {
                shipmentId: supplierShipment,
                shipmentTypeEnumId: "ShpTpPurchaseReturn",
                statusId: "ShipInput",
                fromPartyId: "ORG_ZIZI_RETAIL",
                toPartyId: "ZiddlemanInc"
            })
            create("mantle.shipment.ShipmentRouteSegment", {
                shipmentId: supplierShipment,
                shipmentRouteSegmentSeqId: "01",
                originFacilityId: "ZIRET_WH"
            })
            create("mantle.shipment.ShipmentItem", {shipmentId: supplierShipment, productId: "BOSS_WH_GASKET", quantity: 2})
            create("mantle.shipment.ShipmentItemSource", {
                shipmentItemSourceId: supplierShipment,
                shipmentId: supplierShipment,
                productId: "BOSS_WH_GASKET",
                statusId: "SisPending",
                quantity: 2,
                quantityNotHandled: 2,
                returnId: supplierReturn,
                returnItemSeqId: "01"
            })
        })
    }
})

feature("Returns lists the returns of the user's facilities, and NewReturn is for those who receive or dispose", {
    when() {
        const reader = asUser("warehouse.read", () => ({
            list: page("Returns/Returns", {}, "html"),
            rows: Array.from(invoke("ironstone.warehouse.ReturnServices.get#Returns", {pageSize: 100}).returnRows),
            create: post("Returns/Returns/newReturn", {
                direction: "supplier",
                vendorPartyId: "ZiddlemanInc",
                facilityId: "ZIRET_WH"
            })
        }))
        const quality = asUser("warehouse.quality", () => ({
            list: page("Returns/Returns", {}, "html"),
            create: post("Returns/Returns/newReturn", {
                direction: "supplier",
                vendorPartyId: "ZiddlemanInc",
                facilityId: "ZIRET_WH",
                displayId: "P14-SPEC-RTV"
            })
        }))
        const created = rows("mantle.order.return.ReturnHeader", {displayId: "P14-SPEC-RTV"})
        const suppliers = asUser("warehouse.receive", () =>
            Array.from(
                invoke("ironstone.warehouse.ReturnServices.get#Returns", {direction: "supplier", pageSize: 100}).returnRows
            )
        )
        return {reader, quality, created, suppliers}
    },
    then({reader, quality, created, suppliers}) {
        reader.list.errors == []
        reader.list.output.includes("BOSS_WH_RMA")
        reader.list.output.includes("BOSS_WH_SRET")
        !reader.list.output.includes("New return")
        reader.rows.some(row => row.returnId == "BOSS_WH_RMA" && row.directionText == "From customer")
        reader.rows.some(row => row.returnId == "BOSS_WH_SRET" && row.handledText == "Sent 0 of 3")
        reader.create.includes("PERMISSION_DENIED")
        quality.list.output.includes("New return")
        quality.create == ""
        created.length == 1
        created[0].customerPartyId == "ORG_ZIZI_RETAIL"
        created[0].vendorPartyId == "ZiddlemanInc"
        created[0].statusId == "ReturnCreated"
        suppliers.every(row => row.supplierReturn)
        suppliers.some(row => row.returnId == "BOSS_WH_SRET")
    }
})

feature("ReturnDetail shows the Warehouse context with receiving and no settlement action", {
    when() {
        return asUser("warehouse.receive", () => ({
            customer: page("Returns/ReturnDetail", {returnId: rma}, "html"),
            supplier: page("Returns/ReturnDetail", {returnId: "BOSS_WH_SRET"}, "html"),
            detail: invoke("ironstone.warehouse.ReturnServices.get#ReturnDetail", {returnId: rma}),
            missing: page("Returns/ReturnDetail", {returnId: "BOSS_WH_P14_NONE"}, "html")
        }))
    },
    then({customer, supplier, detail, missing}) {
        customer.errors == []
        customer.output.includes("Customer return " + rma)
        customer.output.includes("Receive")
        customer.output.includes("Settlement")
        !customer.output.includes("Settle return")
        detail.returnHeader.openShipmentId == rmaShipment
        detail.itemRows[0].authorizedQuantity == 3
        supplier.errors == []
        supplier.output.includes("Supplier return BOSS_WH_SRET")
        missing.output.includes("Return not available")
    }
})

feature("ReturnReceipt receives a box with a dock rejection into quarantine with its inspection, settling nothing", {
    when() {
        const line = {
            shipmentId: rmaShipment,
            returnId: rma,
            returnItemSeqId: "01",
            quantityAccepted: 1,
            quantityRejected: 1,
            rejectionReasonEnumId: "ArjDamaged",
            lotNumber: "SEAL-2026-A"
        }
        const reader = asUser("warehouse.read", () =>
            post("Returns/ReturnReceipt/receiveReturn", Object.assign({operationKey: "p14-spec-reader"}, line))
        )
        return asUser("warehouse.receive", () => {
            const before = page("Returns/ReturnReceipt", {shipmentId: rmaShipment}, "html")
            const box = post("Returns/ReturnReceipt/receiveReturn", Object.assign({operationKey: "p14-spec-box1"}, line))
            const after = page("Returns/ReturnReceipt", {shipmentId: rmaShipment}, "html")
            const settle = refusal("mantle.order.ReturnServices.settle#Return", {
                returnId: rma,
                lineList: [{returnItemSeqId: "01", quantity: 1}],
                previewVersion: "p14-spec",
                operationKey: "p14-spec-settle"
            })
            return {reader, before, box, after, settle}
        })
    },
    then({reader, before, box, after, settle}) {
        reader.includes("PERMISSION_DENIED")
        before.errors == []
        before.output.includes("Return receipt " + rmaShipment)
        before.output.includes("Print RMA receiving slip")
        box == ""
        after.output.includes("Sealant check") || after.output.includes("Inspection and disposition")
        rows("mantle.product.receipt.AssetReceipt", {returnId: rma}).length == 1
        rows("mantle.product.receipt.AssetReceipt", {returnId: rma}).every(row =>
            row.assetId ? one("mantle.product.asset.Asset", {assetId: row.assetId}).statusId == "AstQuarantine" : false
        )
        // the returned sealant comes back in the lot it was sold from, not a new lot of the customer's
        rows("mantle.product.receipt.AssetReceipt", {returnId: rma}).every(
            row => one("mantle.product.asset.Asset", {assetId: row.assetId}).lotId == "BOSS_WH_LOT_A"
        )
        rows("mantle.product.quality.QualityInspection", {returnId: rma}).length == 1
        rows("mantle.product.quality.QualityInspection", {returnId: rma})[0].inspectionTemplateId == "BOSS_WH_TMPL"
        n(one("mantle.order.return.ReturnItem", {returnId: rma, returnItemSeqId: "01"}).receivedQuantity) == 2
        rows("mantle.order.return.ReturnItemBilling", {returnId: rma}).length == 0
        // Mantle's own refusal, or with authorization on no grant of a Warehouse group reaches the service (F3)
        settle.includes("FORBIDDEN") || settle.includes("is not authorized")
    }
})

feature("SupplierReturnShipment sends back the quarantined stock under its disposition and ships it, setting ReturnShipped", {
    when() {
        const issue = {shipmentId: supplierShipment, returnId: supplierReturn, returnItemSeqId: "01", quantity: 2}
        const issuer = asUser("warehouse.issue", () =>
            post("Returns/SupplierReturnShipment/issueSupplierReturn", Object.assign({operationKey: "p14-spec-issuer"}, issue))
        )
        const quality = asUser("warehouse.quality", () => ({
            sent: post(
                "Returns/SupplierReturnShipment/issueSupplierReturn",
                Object.assign({operationKey: "p14-spec-issue"}, issue)
            ),
            ship: post("Returns/SupplierReturnShipment/shipSupplierReturn", {
                shipmentId: supplierShipment,
                operationKey: "p14-spec-ship-q"
            })
        }))
        const shipper = asUser("warehouse.ship", () => ({
            page: page("Returns/SupplierReturnShipment", {shipmentId: supplierShipment}, "html"),
            shipped: post("Returns/SupplierReturnShipment/shipSupplierReturn", {
                shipmentId: supplierShipment,
                operationKey: "p14-spec-ship",
                trackingCode: "1Z-P14"
            })
        }))
        const slip = asUser("warehouse.read", () =>
            page("Returns/ReturnSlip", {shipmentId: supplierShipment, renderMode: "html-print"}, "html")
        )
        return {issuer, quality, shipper, slip}
    },
    then({issuer, quality, shipper, slip}) {
        issuer.includes("PERMISSION_DENIED")
        quality.sent == ""
        n(one("mantle.product.quality.QualityInspection", {qualityInspectionId: inspection}).heldQuantity) == 0
        quality.ship.includes("PERMISSION_DENIED")
        shipper.page.errors == []
        shipper.page.output.includes("Supplier return " + supplierShipment)
        shipper.page.output.includes("Ship")
        shipper.shipped == ""
        one("mantle.shipment.Shipment", {shipmentId: supplierShipment}).statusId == "ShipShipped"
        one("mantle.order.return.ReturnItem", {returnId: supplierReturn, returnItemSeqId: "01"}).statusId == "ReturnShipped"
        one("mantle.order.return.ReturnHeader", {returnId: supplierReturn}).statusId == "ReturnShipped"
        slip.errors == []
        slip.output.includes("Supplier-return slip " + supplierShipment)
    }
})

feature("no Warehouse group may authorize a return, and a return shipment's record link opens its Returns screen", {
    when() {
        const groups = rows("moqui.security.UserGroupPermission", {userPermissionId: "RETURN_AUTHORIZE"}).map(
            row => row.userGroupId
        )
        const links = asUser("warehouse.read", () => ({
            receipt: invoke("ironstone.commons.PaletteServices.get#RecordLink", {
                recordEntityName: "mantle.shipment.Shipment",
                id: "BOSS_WH_RMA_SHIP"
            }).url,
            supplier: invoke("ironstone.commons.PaletteServices.get#RecordLink", {
                recordEntityName: "mantle.shipment.Shipment",
                id: "BOSS_WH_SRET_SHIP"
            }).url,
            returnLink: invoke("ironstone.commons.PaletteServices.get#RecordLink", {
                recordEntityName: "mantle.order.return.ReturnHeader",
                id: "BOSS_WH_RMA"
            }).url
        }))
        return {groups, links}
    },
    then({groups, links}) {
        !groups.some(groupId => groupId.startsWith("BOSS_WAREHOUSE"))
        String(links.receipt).includes("/Returns/ReturnReceipt?shipmentId=BOSS_WH_RMA_SHIP")
        String(links.supplier).includes("/Returns/SupplierReturnShipment?shipmentId=BOSS_WH_SRET_SHIP")
        String(links.returnLink).includes("/Returns/ReturnDetail?returnId=BOSS_WH_RMA")
    }
})

feature(
    "a return of an organization that does not settle returns separately shows why it is not received, and a supplier item with no stock named offers the facility's stock",
    {
        when() {
            withAuthzOff(() => {
                create("mantle.order.return.ReturnHeader", {
                    returnId: "BOSS_WH_P14_D11OFF",
                    statusId: "ReturnApproved",
                    customerPartyId: "CustJqp",
                    vendorPartyId: "ORG_ZIZI_RETAIL",
                    facilityId: "ZIRET_WH",
                    entryDate: ec.user.nowTimestamp
                })
                create("mantle.order.return.ReturnItem", {
                    returnId: "BOSS_WH_P14_D11OFF",
                    returnItemSeqId: "01",
                    statusId: "ReturnApproved",
                    productId: "BOSS_WH_LOTTED",
                    returnQuantity: 1
                })
                create("mantle.shipment.Shipment", {
                    shipmentId: "BOSS_WH_P14_D11OFF",
                    shipmentTypeEnumId: "ShpTpSalesReturn",
                    statusId: "ShipInput",
                    fromPartyId: "CustJqp",
                    toPartyId: "ORG_ZIZI_RETAIL"
                })
                create("mantle.shipment.ShipmentRouteSegment", {
                    shipmentId: "BOSS_WH_P14_D11OFF",
                    shipmentRouteSegmentSeqId: "01",
                    destinationFacilityId: "ZIRET_WH"
                })
                create("mantle.shipment.ShipmentItem", {
                    shipmentId: "BOSS_WH_P14_D11OFF",
                    productId: "BOSS_WH_LOTTED",
                    quantity: 1
                })
                create("mantle.shipment.ShipmentItemSource", {
                    shipmentItemSourceId: "BOSS_WH_P14_D11OFF",
                    shipmentId: "BOSS_WH_P14_D11OFF",
                    productId: "BOSS_WH_LOTTED",
                    quantity: 1,
                    quantityNotHandled: 1,
                    returnId: "BOSS_WH_P14_D11OFF",
                    returnItemSeqId: "01"
                })
                create("mantle.order.return.ReturnHeader", {
                    returnId: "BOSS_WH_P14_NOSTOCK",
                    statusId: "ReturnApproved",
                    customerPartyId: "ORG_ZIZI_RETAIL",
                    vendorPartyId: "ZiddlemanInc",
                    facilityId: "ZIRET_WH",
                    entryDate: ec.user.nowTimestamp
                })
                create("mantle.order.return.ReturnItem", {
                    returnId: "BOSS_WH_P14_NOSTOCK",
                    returnItemSeqId: "01",
                    statusId: "ReturnApproved",
                    productId: "BOSS_WH_GASKET",
                    returnQuantity: 1
                })
                create("mantle.shipment.Shipment", {
                    shipmentId: "BOSS_WH_P14_NOSTOCK",
                    shipmentTypeEnumId: "ShpTpPurchaseReturn",
                    statusId: "ShipInput",
                    fromPartyId: "ORG_ZIZI_RETAIL",
                    toPartyId: "ZiddlemanInc"
                })
                create("mantle.shipment.ShipmentRouteSegment", {
                    shipmentId: "BOSS_WH_P14_NOSTOCK",
                    shipmentRouteSegmentSeqId: "01",
                    originFacilityId: "ZIRET_WH"
                })
                create("mantle.shipment.ShipmentItem", {
                    shipmentId: "BOSS_WH_P14_NOSTOCK",
                    productId: "BOSS_WH_GASKET",
                    quantity: 1
                })
                create("mantle.shipment.ShipmentItemSource", {
                    shipmentItemSourceId: "BOSS_WH_P14_NOSTOCK",
                    shipmentId: "BOSS_WH_P14_NOSTOCK",
                    productId: "BOSS_WH_GASKET",
                    quantity: 1,
                    quantityNotHandled: 1,
                    returnId: "BOSS_WH_P14_NOSTOCK",
                    returnItemSeqId: "01"
                })
            })
            const receiver = asUser("warehouse.receive", () => ({
                detail: invoke("ironstone.warehouse.ReturnServices.get#ReturnShipmentDetail", {shipmentId: "BOSS_WH_P14_D11OFF"}),
                page: page("Returns/ReturnReceipt", {shipmentId: "BOSS_WH_P14_D11OFF"}, "html")
            }))
            const quality = asUser("warehouse.quality", () => ({
                detail: invoke("ironstone.warehouse.ReturnServices.get#ReturnShipmentDetail", {
                    shipmentId: "BOSS_WH_P14_NOSTOCK"
                }),
                page: page("Returns/SupplierReturnShipment", {shipmentId: "BOSS_WH_P14_NOSTOCK"}, "html")
            }))
            return {receiver, quality}
        },
        then({receiver, quality}) {
            receiver.detail.returnShipment.receiveBlockedText.includes("does not settle returns separately")
            receiver.detail.returnLineRows[0].canReceive == false
            receiver.page.errors == []
            receiver.page.output.includes("does not settle returns separately")
            quality.detail.returnLineRows[0].assetOptions.some(row => row.assetId == "BOSS_WH_RTS_STOCK")
            quality.detail.returnLineRows[0].canIssue == true
            quality.page.errors == []
            quality.page.output.includes("Send back")
        }
    }
)
