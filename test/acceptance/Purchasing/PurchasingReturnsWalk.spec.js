// Purchasing P8's "usable when" (impl-purchasing P8; design §14.4 #4, the supplier side), through the screens' transitions
// with artifact authorization on where Purchasing acts: the unit P5's inspector rejected (8 received, 7 accepted, 1 rejected
// and disposed Return to supplier) is returned from Purchasing with the supplier's RMA, and a second return of the same
// receipt and lot is refused past what it still allows; the buyer authorizes it, Warehouse sends it back and ships it, and the
// return shows ReturnShipped; with nothing billed it needs no credit and the receipt's match-eligible quantity is the 7
// accepted, not the 8 received; once the supplier bills one unit, a return of three released units is credited for the
// billed one only, its amount shown to a finance reader and withheld from the buyer; and a replacement for the rejected unit
// opens a linked purchase order at no price with its expected receipt, completing the return. Finance (AP of Retail's) is
// the walk's own user. Run: ./moq accept mr-boss --spec PurchasingReturnsWalk
const lib = ec.resource.script("component://mr-boss/test/Purchasing/PurchasingSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const webroot = "component://webroot/screen/webroot.xml"
const rows = (entity, key) => system(() => Array.from(ec.entity.find(entity).condition(key).list()))
const one = (entity, key) => rows(entity, key)[0] || null
const product = {productId: "BOSS_PUR_WALK_RETURNED", productName: "Walk returned valve"}
const ap = "BOSS_PUR_WALK_RET_AP"
const P = "mantle.order.PurchaseServices.",
    Q = "mantle.product.QualityServices.",
    R = "mantle.order.ReturnServices.",
    T = "mantle.shipment.WarehouseTaskServices.",
    S = "ironstone.purchasing.ReturnServices."
const state = {}
let keySeq = 0
const key = () => "pur-ret-walk-" + Date.now() + "-" + ++keySeq
// a transition of a Purchasing screen as the user posts it: its status and errors
function post(user, path, parameters) {
    return asUser(user, () => {
        const rendered = ec.screen
            .makeTest()
            .rootScreen(webroot)
            .render("apps/Purchasing/" + path, parameters, "post")
        const result = {status: rendered.status, errors: Array.from(rendered.errorMessages || []).join(" | ")}
        ec.message.clearErrors()
        return result
    })
}
// a Mantle call as the user, with artifact authorization off (the services check their own permissions)
const as = (user, service, parameters) => asUser(user, () => invoke(service, parameters), false)
const returnOfReceipt = () =>
    rows("mantle.order.return.ReturnItem", {assetReceiptId: state.assetReceiptId}).map(row => row.returnId)
const shipmentOf = returnId => one("mantle.shipment.ShipmentItemSource", {returnId})?.shipmentId
const itemOf = returnId => one("mantle.order.return.ReturnItem", {returnId})
// the warehouse sends back the return's item and ships it
function sendBack(returnId, quantity, issuer) {
    const shipmentId = shipmentOf(returnId)
    as(issuer, T + "issue#SupplierReturnStock", {
        operationKey: key(),
        shipmentId,
        returnId,
        returnItemSeqId: itemOf(returnId).returnItemSeqId,
        quantity
    })
    as("warehouse.ship", T + "ship#SupplierReturn", {operationKey: key(), shipmentId, trackingCode: "1Z-PUR-" + returnId})
    return shipmentId
}
const findReturns = (user, parameters) =>
    asUser(user, () =>
        Array.from(invoke(S + "find#SupplierReturns", Object.assign({appRoot: "Purchasing"}, parameters)).returnRows)
    )
const newReturn = (quantity, response) =>
    post(users.buyer, "Returns/SupplierReturns/newSupplierReturn", {
        orderId: state.orderId,
        assetReceiptId: state.assetReceiptId,
        returnQuantity: quantity,
        returnReasonEnumId: "RrsnDefective",
        returnResponseEnumId: response,
        supplierRmaId: "RMA-WALK-" + quantity
    })

spec({
    stepwise: true,
    setupSpec() {
        lib.replenishmentFixture(product)
        system(() => {
            // the product's receipts need inspection at Retail's facilities (a tracking policy of its own)
            if (
                !rows("mantle.facility.WarehousePolicy", {organizationPartyId: ids.organizationId, productId: product.productId})
                    .length
            )
                invoke("create#mantle.facility.WarehousePolicy", {
                    organizationPartyId: ids.organizationId,
                    policyType: "tracking",
                    facilityId: "_NA_",
                    productId: product.productId,
                    fromDate: "2026-01-01 00:00:00",
                    inspectionRequired: "Y",
                    changeReason: "Purchasing returns walk: inspect on receipt"
                })
            // AP of Retail's
            if (!one("moqui.security.UserAccount", {userId: ap})) {
                invoke("create#moqui.security.UserGroup", {userGroupId: ap, description: "Purchasing returns walk AP"})
                for (const permission of ["PAYABLE_EDIT", "PAYABLE_VIEW", "PAYABLE_IMPORT"])
                    invoke("create#moqui.security.UserGroupPermission", {
                        userGroupId: ap,
                        userPermissionId: permission,
                        fromDate: 0
                    })
                invoke("create#mantle.party.Party", {partyId: ap, partyTypeEnumId: "PtyPerson"})
                invoke("create#mantle.party.Person", {partyId: ap, firstName: "Walk", lastName: "Returns AP"})
                invoke("create#mantle.party.PartyRelationship", {
                    partyRelationshipId: ap,
                    relationshipTypeEnumId: "PrtAgent",
                    fromPartyId: ap,
                    toPartyId: ids.organizationId,
                    toRoleTypeId: "OrgInternal",
                    fromDate: 0
                })
                invoke("create#moqui.security.UserAccount", {
                    userId: ap,
                    username: ap,
                    partyId: ap,
                    currentPassword: "16ac58bbfa332c1c55bd98b53e60720bfa90d394",
                    passwordHashType: "SHA"
                })
                invoke("create#moqui.security.UserGroupMember", {userId: ap, userGroupId: ap, fromDate: 0})
            }
        })
        // P5's receipt: an approved order of ten at Ziddleman's price of 4.00, eight received into quarantine in one lot, the
        // inspector accepting 7 and rejecting 1, Warehouse's quality releasing the 7 and sending the 1 back to the supplier
        state.orderId = as(users.buyer, P + "create#PurchaseOrder", {
            organizationPartyId: ids.organizationId,
            vendorPartyId: ids.sharedSupplierId,
            facilityId: ids.facilityId,
            orderName: "Returns walk"
        }).orderId
        state.orderItemSeqId = as(users.buyer, P + "store#PurchaseOrderItem", {
            orderId: state.orderId,
            productId: product.productId,
            quantity: 10
        }).orderItemSeqId
        as(users.buyer, P + "place#PurchaseOrder", {orderId: state.orderId})
        const orderRevision = one("mantle.order.OrderHeader", {orderId: state.orderId}).orderRevision
        as(users.approve, P + "decide#PurchaseApproval", {orderId: state.orderId, orderRevision, operationKey: key()})
        const shipmentId = as(users.buyReceive, T + "ensure#PurchaseReceipt", {
            operationKey: key(),
            orderId: state.orderId,
            orderPartSeqId: "01",
            facilityId: ids.facilityId
        }).result.shipmentId
        const received = as(users.buyReceive, T + "receive#ShipmentStock", {
            operationKey: key(),
            shipmentId,
            productId: product.productId,
            quantityAccepted: 8,
            lotNumber: "WALK-RET-LOT",
            locationSeqId: "0901"
        }).result
        const qualityInspectionId = received.qualityInspectionIds[0]
        state.assetReceiptId = one("mantle.product.receipt.AssetReceipt", {shipmentId}).assetReceiptId
        as("warehouse.inspect", Q + "submit#Inspection", {
            qualityInspectionId,
            quantityAccepted: 7,
            quantityRejected: 1,
            resultReason: "One valve cracked"
        })
        as("warehouse.quality", Q + "verify#Inspection", {qualityInspectionId})
        as("warehouse.quality", Q + "dispose#Inspection", {
            operationKey: key(),
            qualityInspectionId,
            dispositionEnumId: "QdRelease",
            quantity: 7
        })
        as("warehouse.quality", Q + "dispose#Inspection", {
            operationKey: key(),
            qualityInspectionId,
            dispositionEnumId: "QdReturnSupplier",
            quantity: 1,
            reason: "Cracked: back to the supplier"
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "the rejected unit is returned with the supplier's RMA; a second return of the receipt and lot past what it allows is refused",
    {
        when() {
            const created = newReturn("1", "RrspReplace")
            state.returnA = returnOfReceipt()[0]
            const excess = newReturn("8", "RrspCredit")
            const returnIds = returnOfReceipt()
            const authorized = post(users.buyer, "Returns/ReturnDetail/purchasingAuthorizeReturn", {
                returnId: state.returnA,
                supplierRmaId: "RMA-WALK-A"
            })
            const item = itemOf(state.returnA)
            const asset = one("mantle.product.asset.Asset", {assetId: item.assetId})
            const print = asUser(users.buyer, () => page("Returns/ReturnAuthorization", {returnId: state.returnA}, "html"))
            return {
                created,
                excess,
                returnIds,
                authorized,
                item,
                asset,
                header: one("mantle.order.return.ReturnHeader", {returnId: state.returnA}),
                print
            }
        },
        then({created, excess, returnIds, authorized, item, asset, header, print}) {
            created.errors == ""
            excess.errors.includes("QUANTITY_EXCEEDS_ELIGIBLE")
            returnIds == [state.returnA]
            String(item.returnQuantity) == "1"
            asset.statusId == "AstQuarantine"
            asset.lotId != null
            authorized.errors == ""
            header.statusId == "ReturnApproved"
            header.supplierRmaId == "RMA-WALK-A"
            print.errors == []
            print.output.includes("RMA-WALK-A")
            print.output.includes(product.productName)
        }
    }
)

feature("Warehouse ships it and the return shows ReturnShipped; unbilled, it needs no credit and leaves the receipt's match", {
    when() {
        state.shipmentA = sendBack(state.returnA, 1, "warehouse.quality")
        const listed = findReturns(users.buyer, {orderId: state.orderId}).find(row => row.returnId == state.returnA) || {}
        const preview = as(ap, R + "preview#ReturnSettlement", {returnId: state.returnA})
        const status = as(users.buyer, Q + "get#SourceInspectionStatus", {assetReceiptId: state.assetReceiptId})
        return {
            listed,
            preview,
            receipt: Array.from(status.receiptRows || [])[0] || {},
            shipment: one("mantle.shipment.Shipment", {shipmentId: state.shipmentA})
        }
    },
    then({listed, preview, receipt, shipment}) {
        shipment.statusId == "ShipShipped"
        listed.statusId == "ReturnShipped"
        listed.physicalText.includes("sent 1 of 1")
        preview.canSettle == false
        String(preview.itemRows[0].unbilledQuantity) == "1"
        preview.itemRows[0].eligibleQuantity.isZero()
        String(receipt.acceptedQuantity) == "8"
        String(receipt.matchEligibleQuantity) == "7"
    }
})

feature("with one unit billed, a return of three released units is credited for the billed one only", {
    when() {
        // the supplier's bill for one unit, taken in by AP, matched to the receipt by the buyer who holds the match group and approved
        const invoiceId = as(ap, "mantle.account.InvoiceServices.import#Bill", {
            organizationPartyId: ids.organizationId,
            supplierPartyId: ids.sharedSupplierId,
            referenceNumber: "WALK-RET-" + Date.now()
        }).invoiceId
        system(() =>
            invoke("mantle.account.InvoiceServices.create#InvoiceItem", {
                invoiceId,
                itemTypeEnumId: "ItemInventory",
                productId: product.productId,
                quantity: 1,
                amount: 4
            })
        )
        as(users.buyMatch, "mantle.account.InvoiceMatchServices.apply#InvoiceMatch", {
            invoiceId,
            allocationList: [
                {
                    invoiceItemSeqId: one("mantle.account.invoice.InvoiceItem", {invoiceId}).invoiceItemSeqId,
                    orderId: state.orderId,
                    orderItemSeqId: state.orderItemSeqId,
                    assetReceiptId: state.assetReceiptId,
                    quantity: "1"
                }
            ]
        })
        // finance approves the bill (a credit is made only against a finalized bill)
        system(() => {
            for (const statusId of ["InvoiceReceived", "InvoiceApproved"])
                if (one("mantle.account.invoice.Invoice", {invoiceId}).statusId != statusId)
                    invoke("update#mantle.account.invoice.Invoice", {invoiceId, statusId})
        })
        const created = newReturn("3", "RrspCredit")
        state.returnB = returnOfReceipt().find(returnId => returnId != state.returnA)
        post(users.buyer, "Returns/ReturnDetail/purchasingAuthorizeReturn", {
            returnId: state.returnB,
            supplierRmaId: "RMA-WALK-B"
        })
        sendBack(state.returnB, 3, "warehouse.issue")
        const preview = as(ap, R + "preview#ReturnSettlement", {returnId: state.returnB})
        const settled = as(ap, R + "settle#Return", {
            returnId: state.returnB,
            previewVersion: preview.previewVersion,
            operationKey: key()
        })
        const row = user => findReturns(user, {orderId: state.orderId}).find(each => each.returnId == state.returnB) || {}
        return {created, preview, settled, finance: row(users.buyMatch), buyer: row(users.buyer)}
    },
    then({created, preview, settled, finance, buyer}) {
        created.errors == ""
        String(preview.itemRows[0].eligibleQuantity) == "1"
        String(preview.itemRows[0].unbilledQuantity) == "2"
        settled.resultCode == "SETTLED"
        settled.creditInvoiceIds.length == 1
        finance.settlementText.includes("Credited 1 ($4.00)")
        finance.settlementText.includes("2 open")
        buyer.settlementText.includes("Credited 1 (amount Withheld)")
    }
})

feature("a replacement for the rejected unit opens a linked purchase order with its expected receipt and completes the return", {
    when() {
        const replaced = post(users.buyer, "Returns/ReturnDetail/purchasingReplaceReturn", {
            returnId: state.returnA,
            returnItemSeqId: itemOf(state.returnA).returnItemSeqId,
            quantity: "1",
            operationKey: key()
        })
        const item = itemOf(state.returnA)
        const orderId = item.replacementOrderId
        const receiptIds = orderId
            ? [...new Set(rows("mantle.shipment.ShipmentItemSource", {orderId}).map(row => row.shipmentId))]
            : []
        const detail = asUser(users.buyer, () => page("Returns/ReturnDetail", {returnId: state.returnA}, "html"))
        return {
            replaced,
            item,
            orderId,
            part: orderId ? one("mantle.order.OrderPart", {orderId}) : null,
            line: orderId ? one("mantle.order.OrderItem", {orderId}) : null,
            receipt: receiptIds.length ? one("mantle.shipment.Shipment", {shipmentId: receiptIds[0]}) : null,
            header: one("mantle.order.return.ReturnHeader", {returnId: state.returnA}),
            detail
        }
    },
    then({replaced, item, orderId, part, line, receipt, header, detail}) {
        replaced.errors == ""
        orderId != null
        String(item.replacedQuantity) == "1"
        part.statusId == "OrderApproved"
        part.vendorPartyId == ids.sharedSupplierId
        line.productId == product.productId
        line.unitAmount.isZero()
        receipt.shipmentTypeEnumId == "ShpTpPurchase"
        header.statusId == "ReturnCompleted"
        detail.errors == []
        detail.output.includes("Replacement orders")
        detail.output.includes(orderId)
    }
})
