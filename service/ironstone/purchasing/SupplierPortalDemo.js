// Purchasing's Supplier app demo (impl-purchasing P16): on Accounting's PASS site for ORG_ZIZI_RETAIL (portal.zizi.localhost,
// BossZPortalDemoData.xml, whose invited ZiddlemanInc contact ziddleman.billing signs in to SupplierHome), an RFQ of Retail's
// with a quote requested of ZiddlemanInc and its QuoteResponse link, and the portal demo's purchase order from ZiddlemanInc
// with its OrderAcknowledgement link of the order's revision (BillUpload beside it): fixed tokens (SUPPLIER_PORTAL_TOKENS,
// listed in impl-purchasing P16), as Accounting's PORTAL_TOKENS. Only data loading or a system administrator runs it.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const SUPPLIER_PORTAL_TOKENS = {
    quote: "ZiziPortalDemoQuoteResponseLink00000000000001",
    order: "ZiziPortalDemoOrderAcknowledgeLink000000000001"
}
const org = "ORG_ZIZI_RETAIL",
    supplier = "ZiddlemanInc"
const call = (name, parameters) => lib.call(name, parameters)
function createOnce(entity, key, values) {
    if (!lib.one(entity, key)) call("create#" + entity, Object.assign({}, key, values))
}
function capability(capabilityId, recordType, recordId, scopes, token, recordRevision) {
    createOnce(
        "mantle.party.ExternalAccessCapability",
        {capabilityId},
        {
            organizationPartyId: org,
            partyId: supplier,
            recordType,
            recordId,
            scopes,
            recordRevision,
            tokenDigest: ec.user.singleUseCodeHash(token),
            issuerKind: "organization",
            fromDate: ec.user.nowTimestamp,
            thruDate: new Date(Date.now() + 366 * 86400000),
            createdByUserId: ec.user.userId
        }
    )
}
function load() {
    if (ec.user.userId && !lib.access.systemAdmin()) throw new Error("Demo loading requires system administration")
    const loggedIn = !!ec.user.username
    if (!loggedIn) ec.user.internalLoginUser("john.doe")
    const authzDisabled = ec.artifactExecution.disableAuthz()
    try {
        if (!lib.one("mantle.public.PublicSite", {siteId: "ZIZI_PORTAL"})) {
            ec.logger.warn("Supplier portal demo: Accounting's ZIZI_PORTAL site is not loaded; nothing made")
            return {complete: false}
        }
        // an RFQ of Retail's for 25 of DEMO_1_1, sent, and Ziddleman's quote requested
        const requestId = "BOSS_PUR_PORTAL_RFQ",
            quoteId = "BOSS_PUR_PORTAL_QUOTE"
        createOnce(
            "mantle.request.Request",
            {requestId},
            {
                requestTypeEnumId: "RqtPurchaseRfq",
                requestName: "Spring reset widgets",
                description: "Demo product one-one, boxed in tens.",
                statusId: "ReqSubmitted",
                requestDate: ec.user.nowTimestamp,
                responseRequiredDate: new Date(Date.now() + 10 * 86400000),
                currencyUomId: "USD"
            }
        )
        createOnce(
            "mantle.request.RequestParty",
            {requestId, partyId: org, roleTypeId: "OrgInternal", fromDate: "2026-11-01 00:00:00"},
            {}
        )
        createOnce(
            "mantle.request.RequestItem",
            {requestId, requestItemSeqId: "01"},
            {productId: "DEMO_1_1", description: "Demo product one-one", quantity: 25, statusId: "ReqSubmitted"}
        )
        if (!lib.one("mantle.order.OrderHeader", {orderId: quoteId})) {
            call("create#mantle.order.OrderHeader", {
                orderId: quoteId,
                orderName: "RFQ " + requestId + " · Spring reset widgets",
                statusId: "OrderRequested",
                currencyUomId: "USD",
                entryDate: ec.user.nowTimestamp
            })
            call("create#mantle.order.OrderPart", {
                orderId: quoteId,
                orderPartSeqId: "01",
                vendorPartyId: supplier,
                customerPartyId: org,
                statusId: "OrderRequested"
            })
            call("create#mantle.order.OrderItem", {
                orderId: quoteId,
                orderItemSeqId: "01",
                orderPartSeqId: "01",
                itemTypeEnumId: "ItemInventory",
                productId: "DEMO_1_1",
                itemDescription: "Demo product one-one",
                quantity: 25,
                unitAmount: 0
            })
            call("create#mantle.request.RequestItemOrder", {
                requestId,
                requestItemSeqId: "01",
                orderId: quoteId,
                orderItemSeqId: "01",
                quantity: 25
            })
        }
        capability("ZIZI_PORTAL_QUOTE_LINK", "Quote", quoteId, "QuoteResponse", SUPPLIER_PORTAL_TOKENS.quote, null)
        // Accounting's portal demo order from Ziddleman: its link of the order's revision opens OrderAcknowledgement
        const order = lib.rows("mantle.order.OrderHeader", {orderName: "Portal demo shelving restock"})[0]
        if (order)
            capability(
                "ZIZI_PORTAL_ACK_LINK",
                "Order",
                order.orderId,
                "OrderAcknowledgement,BillUpload",
                SUPPLIER_PORTAL_TOKENS.order,
                Number(order.orderRevision ?? 1)
            )
        return {complete: true}
    } finally {
        if (!authzDisabled) ec.artifactExecution.enableAuthz()
        if (!loggedIn) ec.user.logoutUser()
    }
}
;({execute: op => ({load})[op]()})
