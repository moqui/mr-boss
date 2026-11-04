// Purchasing's purchase requests (impl-purchasing P10; design-purchasing §4): the Requests list's scope and views (a
// requester's own requests only, a buyer's organization's, Awaiting sourcing with what is left) and its one html render;
// RequestDetail's Purchasing branch, its one html render for the approver with Approve, the lines and the approval;
// RequestSourcing's one html render for the buyer with the demo request's supplier group; the other apps' Items tab link to
// RequestSourcing for a buyer only (Requests.js sourcingUrl); and Home's unsourced count with the Today source of requests due
// to source. The rules of requests and sourcing are Mantle's (mr-mantle test/order/PurchaseRequests); the access cases are
// PurchasingAccess's; the usable-when walk is acceptance PurchasingRequestsWalk.
// Run: ./moq test mr-boss --spec PurchasingRequests
const lib = ec.resource.script("component://mr-boss/test/Purchasing/PurchasingSpecLib.js")
const {ids, users, asUser, invoke, page} = lib
const R = "mantle.request.RequestServices.",
    S = "ironstone.purchasing.RequestServices."
const state = {}

// a request of Retail's filed by the user with one line of DEMO_1_1 from Brightline, submitted
function submittedRequest(user, name) {
    return asUser(
        user,
        () => {
            const requestId = invoke(R + "create#PurchaseRequest", {
                organizationPartyId: ids.organizationId,
                requestName: name,
                facilityId: ids.facilityId
            }).requestId
            invoke(R + "store#PurchaseRequestItem", {
                requestId,
                productId: "DEMO_1_1",
                quantity: 6,
                supplierPartyId: ids.supplierId
            })
            invoke(R + "submit#PurchaseRequest", {requestId})
            return requestId
        },
        false
    )
}

spec({
    setupSpec() {
        state.requesterRequestId = submittedRequest(users.requester, "Spec requester gloves")
        state.buyerRequestId = submittedRequest(users.buyer, "Spec buyer tape")
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("Requests: a requester lists their own requests only, a buyer the organization's by view; the list's one html render", {
    when() {
        const idsOf = result => (result.requestRows || []).map(row => row.requestId)
        const requester = asUser(users.requester, () => idsOf(invoke(S + "find#PurchaseRequests", {pageSize: 100})))
        const buyerAll = asUser(users.buyer, () => idsOf(invoke(S + "find#PurchaseRequests", {pageSize: 100})))
        const buyerMine = asUser(users.buyer, () => idsOf(invoke(S + "find#PurchaseRequests", {view: "mine", pageSize: 100})))
        const sourcing = asUser(users.buyer, () => invoke(S + "find#PurchaseRequests", {view: "sourcing", pageSize: 100}))
        const demo = (sourcing.requestRows || []).find(row => row.requestId == ids.requestId) || {}
        const rendered = asUser(users.buyer, () => page("Requests/PurchaseRequests", {view: "sourcing"}, "html"))
        return {requester, buyerAll, buyerMine, sourcing: idsOf(sourcing), demo, rendered}
    },
    then(r) {
        r.requester.includes(state.requesterRequestId)
        r.requester.includes(ids.requestId)
        !r.requester.includes(state.buyerRequestId)
        r.buyerAll.includes(state.requesterRequestId)
        r.buyerAll.includes(state.buyerRequestId)
        r.buyerMine.includes(state.buyerRequestId)
        !r.buyerMine.includes(state.requesterRequestId)
        r.sourcing.includes(ids.requestId)
        !r.sourcing.includes(state.buyerRequestId)
        r.demo.remainingText == "12"
        r.demo.approvalText == "Approved"
        r.rendered.errors.join(" | ") == ""
        r.rendered.output.includes("Awaiting sourcing")
        r.rendered.output.includes("Workshop fasteners")
    }
})

feature("RequestDetail in Purchasing: the approver's one html render shows Approve, the line and the approval waiting", {
    when() {
        const rendered = asUser(users.approve, () =>
            page("Requests/RequestDetail", {requestId: state.requesterRequestId}, "html")
        )
        return {rendered}
    },
    then({rendered}) {
        rendered.errors.join(" | ") == ""
        rendered.output.includes("Spec requester gloves")
        rendered.output.includes("Approve")
        rendered.output.includes("Demo Product One-One")
        rendered.output.includes("Waiting for one approval")
    }
})

feature(
    "RequestSourcing: the buyer's one html render shows the demo request's supplier group ready; the Items tab's link is a buyer's",
    {
        when() {
            const rendered = asUser(users.buyer, () => page("Requests/RequestSourcing", {requestId: ids.requestId}, "html"))
            const requests = () => ec.resource.script("component://mr-boss/service/ironstone/purchasing/Requests.js")
            const buyerLink = asUser(users.buyer, () => requests().sourcingUrl(ids.requestId))
            const requesterLink = asUser(users.requester, () => requests().sourcingUrl(ids.requestId))
            const items = asUser(users.requester, () => requests().itemRows(ids.requestId))
            return {rendered, buyerLink, requesterLink, items}
        },
        then(r) {
            r.rendered.errors.join(" | ") == ""
            r.rendered.output.includes("Source purchase requests")
            r.rendered.output.includes("Ziddleman")
            r.rendered.output.includes("Create purchase orders")
            r.buyerLink == "/qapps/Purchasing/Requests/RequestSourcing?requestId=" + ids.requestId
            r.requesterLink == null
            r.items.length == 1
            r.items[0].remainingText == "12 of 12 to source"
        }
    }
)

feature("Home counts the unsourced requests, and Today offers the buyer the requests due to source", {
    when() {
        const counters = asUser(users.buyer, () => invoke("ironstone.purchasing.BuyerServices.get#Home", {}).counters)
        const today = asUser(users.buyer, () => invoke(S + "get#TodayItems", {thruDate: "2026-12-31 00:00:00"}).items)
        const requesterToday = asUser(
            users.requester,
            () => invoke(S + "get#TodayItems", {thruDate: "2026-12-31 00:00:00"}).items
        )
        return {counters, today, requesterToday}
    },
    then(r) {
        r.counters.unsourcedCount >= 1
        r.today.some(item => item.requestId == ids.requestId && item.url.includes("Requests/RequestDetail"))
        r.requesterToday.length == 0
    }
})
