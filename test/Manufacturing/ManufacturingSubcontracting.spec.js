// Manufacturing's subcontracting (impl-manufacturing P14 "Usable when", design-manufacturing §7 SubcontractOperations and
// SubcontractDetail), through the Subcontracting screens and the shared SupplyPlanning with the Manufacturing context: the
// planner requests outside processing for an operation of a released work order; the buyer (Purchasing's buyer group) converts
// it on the Planning mount into a draft service purchase order line with OrderItemWorkEffort and RequirementSupply; the
// planner cannot convert it, and a second conversion answers the same line; the demo places the order until Purchasing
// does; a run reader without the buyer's grant sees no purchase price, the buyer does; Supplier360, OrderDetail and
// ShipmentDetail show the subcontract with the Manufacturing context. The dispatch, output receipt, acceptance, accrual and
// bill match are Mantle's ProductionSubcontract spec. The run is this spec's (setupSpec), of the demo's released method.
// Run: ./moq test mr-boss --spec ManufacturingSubcontracting
const lib = ec.resource.script("component://mr-boss/test/Manufacturing/ManufacturingSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, page} = lib
const P = "mantle.work.ProductionServices.",
    S = "mantle.product.SupplyPlanningServices."
const state = {}
const find = (entity, conditions) => ec.entity.find(entity).condition(conditions).disableAuthz()
const rowsOf = (entity, conditions) => Array.from(find(entity, conditions).list())
const html = (path, parameters) => page(path, parameters, "html")

spec({
    stepwise: true,
    setupSpec() {
        // a released work order of the demo method of DEMO_1_1 with its operations, and a current plan of Retail's plant
        asUser(
            users.plan,
            () => {
                const created = invoke(P + "create#ProductionOrder", {
                    operationKey: "spec-p14-run-" + Date.now(),
                    organizationPartyId: "ORG_ZIZI_RETAIL",
                    productId: ids.productId,
                    productBomId: ids.methodId,
                    quantity: 2,
                    facilityId: ids.plantId,
                    workEffortName: "Spec subcontracted assemblies"
                })
                const released = invoke(P + "release#ProductionOrder", {
                    operationKey: "spec-p14-release-" + Date.now(),
                    workEffortId: created.workEffortId
                })
                state.runId = created.workEffortId
                state.operationId = released.result.operationWorkEffortIds[0]
                state.plan = invoke(S + "run#SupplyPlan", {facilityIds: [ids.plantId], productIds: [ids.serviceProductId]})
            },
            false
        )
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("the planner requests outside processing from SubcontractOperations; a reader cannot", {
    when() {
        const parameters = {
            operationKey: "spec-p14-request",
            operationWorkEffortId: state.operationId,
            productId: ids.serviceProductId,
            quantity: 2,
            supplierPartyId: ids.supplierId,
            vendorFacilityId: ids.vendorFacilityId
        }
        // with authz disabled, so the refusal is the service's own permission check
        const reader = asUser(
            users.read,
            () => refusal(P + "request#SubcontractService", Object.assign({}, parameters, {operationKey: "spec-p14-reader"})),
            false
        )
        const readerCheck = asUser(users.read, () =>
            refusal("ironstone.manufacturing.AccessServices.check#Record", {
                recordType: "operation",
                recordId: state.operationId,
                capability: "plan"
            })
        )
        const requested = asUser(users.plan, () => page("Subcontracting/SubcontractOperations/requestService", parameters))
        const subcontract = system(
            () => rowsOf("mantle.work.production.ProductionSubcontract", {operationWorkEffortId: state.operationId})[0]
        )
        const list = asUser(users.plan, () => html("Subcontracting/SubcontractOperations"))
        const detail = asUser(users.plan, () => html("Subcontracting/SubcontractDetail", {workEffortId: state.operationId}))
        return {reader, readerCheck, requested, subcontract, list, detail}
    },
    then({reader, readerCheck, requested, subcontract, list, detail}) {
        reader.includes("PERMISSION_DENIED")
        readerCheck.includes("PERMISSION_DENIED")
        requested.errors.length == 0
        subcontract.statusId == "PscRequested"
        subcontract.supplierPartyId == ids.supplierId
        subcontract.vendorFacilityId == ids.vendorFacilityId
        list.errors.length == 0
        list.output.includes("Spec subcontracted assemblies") || list.output.includes(state.runId)
        detail.errors.length == 0
        detail.output.includes("Requested")
        detail.output.includes("Filter coating service")
        !detail.output.includes("Request outside processing")
    }
})

feature("a buyer converts it on the Planning mount to a draft service PO line; the planner cannot; again answers the line", {
    when() {
        const subcontract = system(
            () => rowsOf("mantle.work.production.ProductionSubcontract", {operationWorkEffortId: state.operationId})[0]
        )
        const suggestion = system(
            () =>
                rowsOf("mantle.request.requirement.PlanningSuggestion", {
                    planningRunId: state.plan.planningRunId,
                    requirementId: subcontract.requirementId
                })[0]
        )
        const parameters = {plantId: ids.plantId, planningSuggestionIdList: [suggestion.planningSuggestionId]}
        const buyerPlan = asUser(users.buyer, () => page("Planning/SupplyPlanning", {plantId: ids.plantId}))
        const plannerPlan = asUser(users.plan, () => page("Planning/SupplyPlanning", {plantId: ids.plantId}))
        const planner = asUser(users.plan, () =>
            page("Planning/SupplyPlanning/convertSuggestions", Object.assign({operationKey: "spec-p14-planner"}, parameters))
        )
        const afterPlanner = system(() => rowsOf("mantle.order.OrderItemWorkEffort", {workEffortId: state.operationId}).length)
        const first = asUser(users.buyer, () =>
            page("Planning/SupplyPlanning/convertSuggestions", Object.assign({operationKey: "spec-p14-first"}, parameters))
        )
        const again = asUser(
            users.buyer,
            () =>
                invoke(S + "convert#PlanningSuggestions", {
                    operationKey: "spec-p14-again",
                    planningSuggestionIds: [suggestion.planningSuggestionId]
                }),
            false
        )
        const links = system(() => rowsOf("mantle.order.OrderItemWorkEffort", {workEffortId: state.operationId}))
        const supply = system(() =>
            rowsOf("mantle.request.requirement.RequirementSupply", {
                requirementId: subcontract.requirementId,
                supplyTypeEnumId: "RstPurchaseOrder"
            })
        )
        state.orderId = links[0]?.orderId
        return {buyerPlan, plannerPlan, planner, afterPlanner, first, again, links, supply}
    },
    then({buyerPlan, plannerPlan, planner, afterPlanner, first, again, links, supply}) {
        buyerPlan.errors.length == 0
        buyerPlan.output.includes("Make draft purchase order lines")
        !buyerPlan.output.includes("Recalculate")
        !plannerPlan.output.includes("Make draft purchase order lines")
        afterPlanner == 0
        first.errors.length == 0
        links.length == 1
        links[0].requiredWork == "Y"
        supply.length == 1
        supply[0].orderItemSeqId == links[0].orderItemSeqId
        const header = system(() => find("mantle.order.OrderHeader", {orderId: links[0].orderId}).one())
        header.statusId == "OrderOpen"
        const item = system(() =>
            find("mantle.order.OrderItem", {orderId: links[0].orderId, orderItemSeqId: links[0].orderItemSeqId}).one()
        )
        item.productId == ids.serviceProductId
        Number(String(item.quantity)) == 2
        Number(String(item.unitAmount)) == 3
        again.results[0].resultCode == "EXISTING"
        again.results[0].orderItemSeqId == links[0].orderItemSeqId
    }
})

feature("a run reader or planner without the buyer grant sees no purchase price; the buyer does", {
    when() {
        const read = username =>
            asUser(username, () => invoke(P + "get#SubcontractStatus", {operationWorkEffortId: state.operationId}), false)
        const order = username => asUser(username, () => html("Subcontracting/OrderDetail", {orderId: state.orderId}))
        return {
            reader: read(users.read),
            buyer: read(users.buyer),
            // the planner reads the run without the buyer grant; the reader has no Subcontracting area
            readerOrder: order(users.plan),
            buyerOrder: order(users.buyer),
            readerDetail: asUser(users.plan, () => html("Subcontracting/SubcontractDetail", {workEffortId: state.operationId})),
            buyerDetail: asUser(users.buyer, () => html("Subcontracting/SubcontractDetail", {workEffortId: state.operationId}))
        }
    },
    then({reader, buyer, readerOrder, buyerOrder, readerDetail, buyerDetail}) {
        reader.serviceLines.length == 1
        reader.serviceLines[0].unitAmount === undefined
        reader.priceRead == false
        buyer.serviceLines[0].unitAmount == "3"
        buyer.priceRead == true
        readerOrder.errors.length == 0
        readerOrder.output.includes("Spec subcontracted assemblies") || readerOrder.output.includes(state.runId)
        !readerOrder.output.includes("$3.00")
        buyerOrder.output.includes("$3.00")
        readerDetail.errors.length == 0
        !readerDetail.output.includes("$3.00")
        buyerDetail.output.includes("$3.00")
        buyerDetail.output.includes("Draft purchase order")
    }
})

feature("the demo places the draft order for the buyer, not for the planner", {
    when() {
        const D = "ironstone.manufacturing.DemoServices.place#SubcontractOrder"
        const planner = asUser(users.plan, () => refusal(D, {orderId: state.orderId}))
        const buyer = asUser(users.buyer, () => refusal(D, {orderId: state.orderId}))
        const twice = asUser(users.buyer, () => refusal(D, {orderId: state.orderId}))
        return {planner, buyer, twice, header: system(() => find("mantle.order.OrderHeader", {orderId: state.orderId}).one())}
    },
    then({planner, buyer, twice, header}) {
        planner.includes("PERMISSION_DENIED")
        buyer == ""
        twice.includes("ORDER_NOT_DRAFT")
        header.statusId == "OrderPlaced"
    }
})

feature("Supplier360, OrderDetail and ShipmentDetail show the demo subcontract with the Manufacturing context", {
    when() {
        return {
            supplier: asUser(users.plan, () =>
                html("Subcontracting/Supplier360/SubcontractOrders", {vendorPartyId: ids.supplierId})
            ),
            order: asUser(users.plan, () => html("Subcontracting/OrderDetail", {orderId: ids.serviceOrderId})),
            shipment: asUser(users.plan, () => html("Subcontracting/ShipmentDetail", {shipmentId: ids.dispatchId})),
            other: asUser(users.services, () => html("Subcontracting/SubcontractDetail", {workEffortId: ids.operationId})),
            instructions: asUser(users.plan, () =>
                html("Subcontracting/SubcontractInstructions", {workEffortId: ids.operationId, kind: "dispatch"})
            )
        }
    },
    then({supplier, order, shipment, other, instructions}) {
        supplier.errors.length == 0
        supplier.output.includes("Coating at Ziddleman")
        order.errors.length == 0
        order.output.includes("Coating at Ziddleman")
        shipment.errors.length == 0
        shipment.output.includes("Sent to the supplier")
        // the other organization's reader opens no Subcontracting, and sees nothing of the operation
        !other.output.includes("Coating at Ziddleman")
        instructions.errors.length == 0
        instructions.output.includes("Dispatch instructions")
        instructions.output.includes("remain the property of")
    }
})
