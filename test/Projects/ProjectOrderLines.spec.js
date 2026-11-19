// The order lines a project fulfils come from its own organization's sales orders (service/ironstone/projects/BillingServices.xml
// get#ProjectVendors, search#OrderLines, link#OrderLine, get#OrderAccess; plans/Security-Review-Medium.md SEC-BOS-95): a client
// shared by two organizations has a sales order from each, and the project of one offers, links and shows only its own; a link to
// the other's line made past the screens (Mantle's link#ProjectOrderItem asks only for the client) opens nothing in OrderDetail.
// As john.doe, a Projects manager who manages money.
// Run: ./moq test mr-boss --spec ProjectOrderLines
const RUN = Date.now().toString(36).slice(-4).toUpperCase()
const PROJECT = "POL" + RUN
const CLIENT = "BOSS_TEST_POL_CLIENT"
const OTHERORG = "BOSS_TEST_POL_OTHERORG"
const VENDOR = "ORG_ZIZI_SERVICES"
const B = "ironstone.projects.BillingServices."
const made = {}

function sys(run) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try { return run() } finally { if (!wasDisabled) ec.artifactExecution.enableAuthz() }
}
// the services as the Money and OrderDetail screens call them: each checks money and the project itself (check#Money, get#ProjectAccess)
function answer(name, parameters) {
    const out = sys(() => ec.service.sync().name(name).parameters(parameters || {}).call()) || {}
    const errors = ec.message.hasError() ? ec.message.getErrorsString() : ""
    ec.message.clearErrors()
    return Object.assign({ errors }, out)
}
function order(vendorPartyId, name) {
    const orderId = call("mantle.order.OrderServices.create#Order", { customerPartyId: CLIENT, vendorPartyId, currencyUomId: "USD", orderName: name }).orderId
    const partSeq = ec.entity.find("mantle.order.OrderPart").condition("orderId", orderId).one().orderPartSeqId
    const seq = call("mantle.order.OrderServices.create#OrderItem", { orderId, orderPartSeqId: partSeq, itemTypeEnumId: "ItemServiceProduct",
        itemDescription: name + " work", quantity: 1, unitAmount: 1000 }).orderItemSeqId
    return { orderId, seq, line: orderId + ":" + seq }
}

spec({
    setupSpec() {
        login("john.doe")
        ec.artifactExecution.enableAuthz()
        sys(() => {
            const store = (entityName, fields) => ec.service.sync().name("store#" + entityName).parameters(fields).call()
            store("mantle.party.Party", { partyId: CLIENT, partyTypeEnumId: "PtyOrganization", ownerPartyId: "_NA_" })
            store("mantle.party.Organization", { partyId: CLIENT, organizationName: "Order lines shared client" })
            store("mantle.party.Party", { partyId: OTHERORG, partyTypeEnumId: "PtyOrganization", ownerPartyId: OTHERORG })
            store("mantle.party.Organization", { partyId: OTHERORG, organizationName: "Order lines other vendor" })
            call("mantle.work.ProjectServices.create#Project", { workEffortId: PROJECT, workEffortName: "Order lines " + RUN, visibilityEnumId: "WevWorkGroup",
                ownerPartyId: VENDOR, vendorPartyId: VENDOR, clientPartyId: CLIENT })
            call("mantle.work.WorkEffortServices.add#WorkEffortParty", { workEffortId: PROJECT, partyId: "EX_JOHN_DOE", roleTypeId: "ProjectManager", statusId: "WeptAssigned" })
            made.own = order(VENDOR, "Own " + RUN)
            made.other = order(OTHERORG, "Other " + RUN)
            // a second part of the own order, sold by the other organization: not shown through the project
            call("create#mantle.order.OrderPart", { orderId: made.own.orderId, orderPartSeqId: "99", vendorPartyId: OTHERORG, customerPartyId: CLIENT,
                statusId: "OrderOpen" })
            made.foreignSeq = call("mantle.order.OrderServices.create#OrderItem", { orderId: made.own.orderId, orderPartSeqId: "99",
                itemTypeEnumId: "ItemServiceProduct", itemDescription: "Foreign part work " + RUN, quantity: 1, unitAmount: 7777 }).orderItemSeqId
        })
    },
    cleanupSpec() {
        sys(() => {
            for (const id of [made.own?.orderId, made.other?.orderId].filter((id) => id)) {
                try {
                    for (const entityName of ["mantle.order.OrderItemWorkEffort", "mantle.order.OrderItem", "mantle.order.OrderPart", "mantle.order.OrderHeader"])
                        ec.entity.find(entityName).condition("orderId", id).deleteAll()
                } catch (err) { ec.logger.warn(`ProjectOrderLines: order ${id} is left: ${err.message}`) }
            }
            try {
                ec.entity.find("mantle.work.effort.WorkEffortParty").condition("workEffortId", PROJECT).deleteAll()
                ec.entity.find("mantle.work.effort.WorkEffort").condition("workEffortId", PROJECT).deleteAll()
            } catch (err) { ec.logger.warn(`ProjectOrderLines: project ${PROJECT} is left: ${err.message}`) }
        })
    },
})

feature("a project offers and links only its organization's order lines to a shared client; another's linked past the screens opens nothing", {
    when() {
        const search = answer(B + "search#OrderLines", { workEffortId: PROJECT, term: RUN })
        const linkOther = answer(B + "link#OrderLine", { workEffortId: PROJECT, orderLine: made.other.line })
        const linkOwn = answer(B + "link#OrderLine", { workEffortId: PROJECT, orderLine: made.own.line })
        // a link to the other's line made before the rule (Mantle's link#ProjectOrderItem now refuses it too), written as a row
        sys(() => call("create#mantle.order.OrderItemWorkEffort", { orderId: made.other.orderId, orderItemSeqId: made.other.seq, workEffortId: PROJECT }))
        const ownDetail = answer(B + "get#OrderDetail", { orderId: made.own.orderId })
        const otherDetail = answer(B + "get#OrderDetail", { orderId: made.other.orderId })
        const otherAccess = answer(B + "get#OrderAccess", { orderId: made.other.orderId, need: "none" })
        return { search, linkOther, linkOwn, ownDetail, otherDetail, otherAccess }
    },
    then({ search, linkOther, linkOwn, ownDetail, otherDetail, otherAccess }) {
        search.optionList.some((option) => option.value == made.own.line)
        !search.optionList.some((option) => option.value == made.other.line)
        linkOther.errors.includes("not found")
        linkOwn.errors == ""
        ownDetail.detail != null
        ownDetail.detail.lineRows.some((row) => row.orderItemSeqId == made.own.seq)
        !ownDetail.detail.lineRows.some((row) => row.orderItemSeqId == made.foreignSeq)
        !JSON.stringify(ownDetail.detail).includes("Foreign part work")
        otherDetail.detail == null
        otherAccess.canView == false
    },
})
