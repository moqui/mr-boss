// Purchasing's supplier returns (impl-purchasing P8; design-purchasing §9): NewSupplierReturn takes a receipt's quantity
// with the supplier's RMA and is refused past the receipt's eligibility or for a user without the buy permission;
// SupplierReturns lists the return by view and by order or supplier (OrderDetail's and Supplier360's returns) with its one
// html render; ReturnDetail's Purchasing context shows the eligible receipts and the items by receipt, and a buyer
// authorizes the return with the RMA (its one html render). The Mantle rules (authorize#SupplierReturn,
// create#ReplacementOrder) are mr-mantle's PurchaseReturns spec; the access rules are PurchasingAccess's; the usable-when walk
// is the acceptance PurchasingReturnsWalk. Run: ./moq test mr-boss --spec PurchasingReturns
const lib = ec.resource.script("component://mr-boss/test/Purchasing/PurchasingSpecLib.js")
const {ids, users, asUser, system, invoke, page, returnFixture} = lib
const R = "ironstone.purchasing.ReturnServices."
const webroot = "component://webroot/screen/webroot.xml"
const state = {}
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
const returnsOf = assetReceiptId =>
    system(() =>
        Array.from(ec.entity.find("mantle.order.return.ReturnItem").condition("assetReceiptId", assetReceiptId).list()).map(
            row => row.returnId
        )
    )

spec({
    stepwise: true,
    setupSpec() {
        state.fixture = returnFixture("Spec returns")
    }
})

feature("a new supplier return takes a receipt's quantity with the RMA; past its eligibility, or without buy, it is refused", {
    when() {
        const form = quantity => ({
            orderId: state.fixture.orderId,
            assetReceiptId: state.fixture.assetReceiptId,
            returnQuantity: quantity,
            returnReasonEnumId: "RrsnDefective",
            returnResponseEnumId: "RrspReplace",
            supplierRmaId: "SPEC-RMA-1"
        })
        const path = "Returns/SupplierReturns/newSupplierReturn"
        const reader = post(users.read, path, form("1"))
        const created = post(users.buyer, path, form("2"))
        const excess = post(users.buyer, path, form("4"))
        const returnIds = returnsOf(state.fixture.assetReceiptId)
        state.returnId = returnIds[0]
        const header = system(() =>
            ec.entity.find("mantle.order.return.ReturnHeader").condition("returnId", state.returnId).one()
        )
        return {reader, created, excess, returnIds, header}
    },
    then({reader, created, excess, returnIds, header}) {
        reader.errors.includes("PERMISSION_DENIED")
        created.errors == ""
        excess.errors.includes("QUANTITY_EXCEEDS_ELIGIBLE")
        returnIds.length == 1
        header.supplierRmaId == "SPEC-RMA-1"
        header.customerPartyId == ids.organizationId
        header.vendorPartyId == ids.sharedSupplierId
        header.statusId == "ReturnCreated"
    }
})

feature("SupplierReturns lists the return by view, order and supplier; its html render offers New supplier return", {
    when() {
        const find = parameters =>
            asUser(users.buyer, () =>
                Array.from(invoke(R + "find#SupplierReturns", Object.assign({appRoot: "Purchasing"}, parameters)).returnRows)
            )
        const authorize = find({view: "authorize", orderId: state.fixture.orderId})
        const dispatch = find({view: "dispatch", orderId: state.fixture.orderId})
        const supplier = find({vendorPartyId: ids.sharedSupplierId, text: "SPEC-RMA-1"})
        const render = asUser(users.buyer, () => page("Returns/SupplierReturns", {orderId: state.fixture.orderId}, "html"))
        return {authorize, dispatch, supplier, render}
    },
    then({authorize, dispatch, supplier, render}) {
        authorize.map(row => row.returnId) == [state.returnId]
        authorize[0].supplierRmaId == "SPEC-RMA-1"
        authorize[0].authorizedText == "2"
        authorize[0].physicalText == "Not authorized yet"
        dispatch == []
        supplier.some(row => row.returnId == state.returnId)
        render.status == 200
        render.errors == []
        render.output.includes(state.returnId)
        render.output.includes("New supplier return")
    }
})

feature("ReturnDetail shows the eligible receipts and the item by receipt; the buyer authorizes it with the RMA", {
    when() {
        const render = asUser(users.buyer, () => page("Returns/ReturnDetail", {returnId: state.returnId}, "html"))
        const before = asUser(users.buyer, () =>
            invoke(R + "get#ReturnDetail", {appRoot: "Purchasing", returnId: state.returnId})
        )
        const authorized = post(users.buyer, "Returns/ReturnDetail/purchasingAuthorizeReturn", {
            returnId: state.returnId,
            supplierRmaId: "SPEC-RMA-2"
        })
        const after = user =>
            asUser(user, () => invoke(R + "get#ReturnDetail", {appRoot: "Purchasing", returnId: state.returnId}))
        return {render, before, authorized, buyer: after(users.buyer), reader: after(users.read)}
    },
    then({render, before, authorized, buyer, reader}) {
        render.status == 200
        render.errors == []
        render.output.includes("Supplier return " + state.returnId)
        render.output.includes("Eligible receipts")
        render.output.includes("Receipt " + state.fixture.assetReceiptId)
        before.returnHeader.canAuthorize == true
        before.eligibleRows.some(row => row.assetReceiptId == state.fixture.assetReceiptId && row.eligibleQuantity == 3)
        before.itemRows[0].authorizedQuantity == 2
        authorized.errors == ""
        buyer.returnHeader.statusId == "ReturnApproved"
        buyer.returnHeader.supplierRmaId == "SPEC-RMA-2"
        buyer.returnHeader.canRecordRma == true
        buyer.returnHeader.canReplace == true
        buyer.shipmentRows.length == 1
        buyer.eligibleRows == []
        reader.returnHeader.canRecordRma == false
        reader.returnHeader.canReplace == false
    }
})
