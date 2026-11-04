// Manufacturing's subcontracting (impl-manufacturing P14 "Usable when", design-manufacturing §7 SubcontractOperations and
// SubcontractDetail), through the Subcontracting screens and the shared SupplyPlanning with the Manufacturing context: the
// planner requests outside processing for an operation of a released work order; the buyer (Purchasing's buyer group) converts
// it through the Planning mount's convertSuggestions into a draft service purchase order line; the demo places the order
// until Purchasing does; a run planner without the buyer's grant sees no purchase price on the screens, the buyer does;
// Supplier360, OrderDetail and ShipmentDetail show the subcontract with the Manufacturing context. The conversion's lines
// and links, the planner's refusal, a second conversion, the prices by reader, the dispatch, output receipt, acceptance,
// accrual and bill match are Mantle's ProductionSubcontract spec; SupplyPlanning's other renders are ManufacturingPlanning's. The
// run is this spec's (setupSpec), of the demo's released method.
// Run: ./moq test mr-boss --spec ManufacturingSubcontracting
const lib = ec.resource.script("component://mr-boss/test/Manufacturing/ManufacturingSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, page} = lib
const P = "mantle.work.ProductionServices.",
    S = "mantle.product.SupplyPlanningServices."
const state = {}
const find = (entity, conditions) => ec.entity.find(entity).condition(conditions).disableAuthz()
const rowsOf = (entity, conditions) => Array.from(find(entity, conditions).list())
const html = (path, parameters) => page(path, parameters, "html")
// a transition as its form posts it, as the user with artifact authorization on: its error messages, "" when it succeeds
function post(user, path, parameters) {
    return asUser(user, () => {
        const result = ec.screen
            .makeTest()
            .rootScreen("component://mr-boss/screen/Manufacturing.xml")
            .render(path, parameters, "post")
        const errors = Array.from(result.errorMessages || []).join(" | ")
        ec.message.clearErrors()
        return errors
    })
}

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
        // the mount's record check (the service's own refusal is Mantle's ProductionSubcontract)
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
        return {readerCheck, requested, subcontract, list, detail}
    },
    then({readerCheck, requested, subcontract, list, detail}) {
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

feature("a buyer converts it through the Planning mount's convertSuggestions to a draft service PO line; the scheduler may not", {
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
        // a second render of SupplyPlanning: only this plan has an outside-processing suggestion, the buyer's to convert
        const buyerPlan = asUser(users.buyer, () => page("Planning/SupplyPlanning", {plantId: ids.plantId}))
        const plannerPlan = asUser(users.plan, () => page("Planning/SupplyPlanning", {plantId: ids.plantId}))
        // the buyer passes the mount's plan-or-buy check, which the scheduler (who reads the plan) does not
        const scheduler = post(
            users.schedule,
            "Planning/SupplyPlanning/convertSuggestions",
            Object.assign({operationKey: "spec-p14-scheduler"}, parameters)
        )
        const first = post(
            users.buyer,
            "Planning/SupplyPlanning/convertSuggestions",
            Object.assign({operationKey: "spec-p14-first"}, parameters)
        )
        const links = system(() => rowsOf("mantle.order.OrderItemWorkEffort", {workEffortId: state.operationId}))
        state.orderId = links[0]?.orderId
        return {buyerPlan, plannerPlan, scheduler, first, links}
    },
    then({buyerPlan, plannerPlan, scheduler, first, links}) {
        buyerPlan.errors.length == 0
        buyerPlan.output.includes("Make draft purchase order lines")
        !buyerPlan.output.includes("Recalculate")
        !plannerPlan.output.includes("Make draft purchase order lines")
        scheduler.includes("PRODUCTION_PLAN or PURCHASE_ORDER_EDIT is required")
        first == ""
        links.length == 1
    }
})

feature("a run planner without the buyer grant sees no purchase price on the screens; the buyer does", {
    when() {
        const order = username => asUser(username, () => html("Subcontracting/OrderDetail", {orderId: state.orderId}))
        return {
            // the planner reads the run without the buyer grant; the reader has no Subcontracting area
            readerOrder: order(users.plan),
            buyerOrder: order(users.buyer),
            readerDetail: asUser(users.plan, () => html("Subcontracting/SubcontractDetail", {workEffortId: state.operationId})),
            buyerDetail: asUser(users.buyer, () => html("Subcontracting/SubcontractDetail", {workEffortId: state.operationId}))
        }
    },
    then({readerOrder, buyerOrder, readerDetail, buyerDetail}) {
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
