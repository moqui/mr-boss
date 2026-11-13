// Purchasing P14b's "usable when" (impl-purchasing P14, the buy part of design-purchasing §14.4 #2 and #3 that needs P7 and
// P10), as an acceptance walk through Replenishment's and Receiving's screens and transitions with artifact authorization on,
// as the demo planner, buyer, approver and receiving buyer of Retail at ZIRET_WH:
// - a customer-order shortage converted to a purchase order keeps its sales line, and its receipt offers to reserve the
//   received stock (on hold at the dock for its putaway) for it and reserves it from ShipmentDetail;
// - a customer-order shortage takes the drop-ship route from SupplyPlanning: its sales line moves to Ziddleman's drop-ship
//   facility and is bought there;
// - where Retail's buying policy sends plan buys to purchase requests, the buyer's conversion makes a purchase request sent
//   for approval, and the request's demand, submitted and then approved, is not suggested again.
// Run: ./moq accept mr-boss --spec PurchasingReplenishmentRoutesWalk
const lib = ec.resource.script("component://mr-boss/test/Purchasing/PurchasingSpecLib.js")
const dropShip = ec.resource.script("component://mr-boss/test/Purchasing/PurchasingDropShipLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const S = "mantle.product.SupplyPlanningServices.",
    P = "mantle.order.PurchaseServices.",
    R = "mantle.request.RequestServices."
const run = Date.now()
const products = {
    peg: {productId: "BOSS_PUR_WALK_PEG", productName: "Walk made-to-order part"},
    drop: {productId: "BOSS_PUR_WALK_DROP", productName: "Walk drop-shipped part"},
    request: {productId: "BOSS_PUR_WALK_REQ", productName: "Walk requested part"}
}
const facility = {planFacilityId: ids.facilityId}
const state = {}
let keySeq = 0
const key = () => "walk-p14b-" + run + "-" + ++keySeq
const rows = (entity, key) => system(() => Array.from(ec.entity.find(entity).condition(key).list()))
const one = (entity, key) => rows(entity, key)[0] || null
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0
// the planner's plan of the products from the Purchasing mount (Recalculate), then the plan as the buyer reads it
function planned(productId) {
    const recalculated = asUser(users.planner, () =>
        page("Replenishment/SupplyPlanning/runPlan", Object.assign({productId}, facility))
    )
    const plan = asUser(users.buyer, () => invoke(S + "get#SupplyPlan", {facilityIds: [ids.facilityId]}), false)
    return {recalculated, suggestion: (plan.suggestions || []).find(row => row.productId === productId) || null}
}
const convert = (planningSuggestionId, extra = {}) =>
    asUser(users.buyer, () =>
        page(
            "Replenishment/SupplyPlanning/convertSuggestions",
            Object.assign({operationKey: key(), planningSuggestionIdList: [planningSuggestionId]}, facility, extra)
        )
    )
// Retail's buying policy's plan buys to purchase requests, or back to orders (the administrator, as Settings does)
function planBuys(value) {
    return asUser(
        users.admin,
        () => {
            const policy = invoke(P + "get#PurchasePolicy", {organizationPartyId: ids.organizationId})
            return invoke(P + "store#PurchasePolicy", {
                organizationPartyId: ids.organizationId,
                expectedFromDate: policy.expectedFromDate || null,
                policyGroup: "controls",
                planBuyToRequest: value,
                changeReason: "Replenishment routes walk"
            })
        },
        false
    )
}

spec({
    stepwise: true,
    setupSpec() {
        for (const product of Object.values(products)) lib.replenishmentFixture(product)
        system(() => {
            // Ziddleman drop-ships the walk's drop-shipped part from its drop-ship facility (BOSS_PUR_DROPSHIP)
            invoke("update#mantle.product.ProductPrice", {productPriceId: products.drop.productId + "_BUY", canDropShip: "Y"})
            invoke("store#mantle.facility.ProductFacility", {
                productId: products.request.productId,
                facilityId: ids.facilityId,
                minimumStock: 4
            })
        })
        // customer orders at ZIRET_WH reserved without stock: three of the made-to-order part, two to drop-ship
        state.pegOrder = dropShip.customerOrder([[products.peg.productId, 3, ids.facilityId]])
        state.dropOrder = dropShip.customerOrder([[products.drop.productId, 2, ids.facilityId]])
    },
    cleanupSpec() {
        planBuys("N")
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "a customer-order shortage converted to a purchase order keeps its sales line, and its receipt offers to reserve for it",
    {
        when() {
            const {recalculated, suggestion} = planned(products.peg.productId)
            const converted = convert(suggestion?.planningSuggestionId)
            const supply = rows("mantle.request.requirement.RequirementSupply", {requirementId: suggestion?.requirementId})[0]
            const pegged = rows("mantle.request.requirement.RequirementOrderItem", {requirementId: suggestion?.requirementId})
            // the draft placed and approved, and its receipt prepared
            const orderId = supply?.orderId
            asUser(users.buyer, () => invoke(P + "place#PurchaseOrder", {orderId}), false)
            asUser(
                users.approve,
                () =>
                    invoke(P + "decide#PurchaseApproval", {
                        orderId,
                        orderRevision: one("mantle.order.OrderHeader", {orderId}).orderRevision,
                        operationKey: key()
                    }),
                false
            )
            asUser(users.buyReceive, () =>
                page("Receiving/Receipts/prepareReceipt", {orderPart: orderId + ":01", operationKey: key()})
            )
            const shipmentId = rows("mantle.shipment.ShipmentItemSource", {orderId})[0]?.shipmentId
            const received = asUser(users.buyReceive, () =>
                page("Receiving/ShipmentDetail/purchaseReceive", {
                    shipmentId,
                    productId: products.peg.productId,
                    quantityAccepted: "3",
                    operationKey: key()
                })
            )
            const assetId = rows("mantle.product.receipt.AssetReceipt", {shipmentId})[0]?.assetId
            const detail = asUser(users.buyReceive, () => page("Receiving/ShipmentDetail", {shipmentId}, "html"))
            const reserved = asUser(users.buyReceive, () =>
                page("Receiving/ShipmentDetail/purchaseReservePeg", {
                    shipmentId,
                    assetId,
                    orderId: state.pegOrder.orderId,
                    orderItemSeqId: "01"
                })
            )
            const reservations = rows("mantle.product.issuance.AssetReservation", {
                orderId: state.pegOrder.orderId,
                orderItemSeqId: "01"
            })
            return {recalculated, suggestion, converted, supply, pegged, received, detail, reserved, reservations, assetId}
        },
        then({recalculated, suggestion, converted, supply, pegged, received, detail, reserved, reservations, assetId}) {
            recalculated.errors == []
            suggestion.methodEnumId == "PsmBuy"
            suggestion.customerDemand == true
            converted.errors == []
            supply.orderId != null
            pegged.some(row => row.orderId == state.pegOrder.orderId)
            received.errors == []
            opened(detail)
            detail.output.includes("Bought for customer orders")
            detail.output.includes("Reserve for this order")
            reserved.errors == []
            reservations.filter(row => row.assetId == assetId).reduce((total, row) => total + Number(String(row.quantity)), 0) ==
                3
        }
    }
)

feature("a customer-order shortage takes the drop-ship route from SupplyPlanning, its sales line bought from the supplier", {
    when() {
        const {suggestion} = planned(products.drop.productId)
        const screen = asUser(users.buyer, () => page("Replenishment/SupplyPlanning", facility))
        const converted = convert(suggestion?.planningSuggestionId, {buyRoute: "dropShip"})
        ec.factory.waitWorkerPoolEmpty(50)
        const salesItem = one("mantle.order.OrderItem", {orderId: state.dropOrder.orderId, orderItemSeqId: "01"})
        const salesPart = one("mantle.order.OrderPart", {orderId: salesItem.orderId, orderPartSeqId: salesItem.orderPartSeqId})
        const dropLine = one("mantle.order.OrderItem", {salesOrderId: state.dropOrder.orderId, salesOrderItemSeqId: "01"})
        return {suggestion, screen, converted, salesPart, dropLine}
    },
    then({suggestion, screen, converted, salesPart, dropLine}) {
        suggestion.customerDemand == true
        opened(screen)
        screen.output.includes("Drop-ship customer orders")
        converted.errors == []
        salesPart.facilityId == "BOSS_PUR_DROPSHIP"
        dropLine.orderId != null
        one("mantle.order.OrderPart", {orderId: dropLine.orderId}).vendorPartyId == ids.sharedSupplierId
    }
})

feature("under the request policy a buy becomes a purchase request for approval, whose demand is not suggested again", {
    when() {
        const policy = planBuys("Y")
        const first = planned(products.request.productId)
        const converted = convert(first.suggestion?.planningSuggestionId)
        const supply = rows("mantle.request.requirement.RequirementSupply", {
            requirementId: first.suggestion?.requirementId
        })[0]
        const requestId = supply?.requestId
        const submitted = one("mantle.request.Request", {requestId})
        const whileSubmitted = planned(products.request.productId).suggestion
        const approved = asUser(
            users.approve,
            () => invoke(R + "decide#PurchaseRequestApproval", {requestId, operationKey: key()}),
            false
        )
        const whileApproved = planned(products.request.productId).suggestion
        const detail = asUser(users.buyer, () => page("Requests/RequestDetail", {requestId}, "html"))
        return {policy, first, converted, supply, submitted, whileSubmitted, approved, whileApproved, detail}
    },
    then({policy, first, converted, supply, submitted, whileSubmitted, approved, whileApproved, detail}) {
        policy.policy.planBuyToRequest == "Y"
        first.suggestion.quantity == "4"
        converted.errors == []
        supply.supplyTypeEnumId == "RstPurchaseRequest"
        submitted.statusId == "ReqSubmitted"
        submitted.facilityId == ids.facilityId
        whileSubmitted == null
        approved.statusId == "ReqInProgress"
        whileApproved == null
        opened(detail)
        detail.output.includes("Walk requested part")
    }
})
