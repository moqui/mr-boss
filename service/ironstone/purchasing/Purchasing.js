// The Purchasing app's access (impl-purchasing §2, §4, P1; design-purchasing §1): the user's buying organizations, their
// capabilities, the suppliers they may work with, the record checks every Purchasing screen and shared mount runs before a
// Mantle service, the drop-downs, the palette and record links. No entity filter covers OrderHeader, Request, Agreement or
// ProductPrice (F2), so a purchase order, quote, request, RFQ, agreement or supplier return is checked here by its buying
// organization and supplier; the Mantle purchasing services check their own permission and organization again, and nothing
// here grants what Mantle refuses.
//
// Later phases extend the tables below rather than the functions: capabilityPermissions (a capability from a Moqui
// permission), areas (the menu areas whose authorization is a capability), recordKinds (a kind of record: its check and,
// once built, its screen), searchFinds (the palette), choiceSources (the drop-downs) and linkPaths (sharedLinks).
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const {find, one, rows, denied, call} = lib
const access = lib.access

const replenishment = () => ec.resource.script("component://mr-boss/service/ironstone/purchasing/Replenishment.js")
const orders = () => ec.resource.script("component://mr-boss/service/ironstone/purchasing/Orders.js")
const approvals = () => ec.resource.script("component://mr-boss/service/ironstone/purchasing/Approvals.js")
const receipts = () => ec.resource.script("component://mr-boss/service/ironstone/purchasing/Receipts.js")
const bills = () => ec.resource.script("component://mr-boss/service/ironstone/purchasing/Bills.js")
const returns = () => ec.resource.script("component://mr-boss/service/ironstone/purchasing/Returns.js")
const agreementReads = () => ec.resource.script("component://mr-boss/service/ironstone/purchasing/Agreements.js")
const rootLocation = "component://mr-boss/screen/Purchasing.xml"
const areaLocation = area => "component://mr-boss/screen/Purchasing/" + area + ".xml"
const choiceLimit = 30
const purchaseRequestType = "RqtPurchase"
// the RFQ request type (P11, mr-mantle SourcingEntities.xml)
const rfqRequestType = "RqtPurchaseRfq"
const quoteStatuses = ["OrderRequested", "OrderProposed"]
// P11: an order that was a quote and was declined or cancelled (not awarded) stays a quote: its status was a quote status
const closedQuoteStatuses = ["OrderRejected", "OrderCancelled"]
function wasQuote(order) {
    if (quoteStatuses.includes(order.statusId)) return true
    if (!closedQuoteStatuses.includes(order.statusId) || order.placedDate) return false
    return (
        find("moqui.entity.EntityAuditLog", {
            changedEntityName: "mantle.order.OrderHeader",
            changedFieldName: "statusId",
            pkPrimaryValue: order.orderId
        })
            .condition("newValueText", "in", quoteStatuses)
            .count() > 0
    )
}
const sourcingReads = () => ec.resource.script("component://mr-boss/service/ironstone/purchasing/Sourcing.js")

// ===== capabilities =====
// Each capability from the Moqui permission the Mantle services check (§2, §4, design §1); the borrowed ones (price and cost
// read, financial read, receipt, bill match) are their owners' grants. `read` is the root grant, and the area capabilities
// below are the authorizations of the menu areas.
const capabilityPermissions = {
    buy: "PURCHASE_ORDER_EDIT",
    approve: "PURCHASE_APPROVE",
    orderApprove: "PURCHASE_ORDER_APPROVE",
    holdRelease: "PURCHASE_HOLD_RELEASE",
    plan: "SUPPLY_PLAN_RUN",
    stockPolicy: "STOCK_POLICY_PLAN",
    policyEdit: "PURCHASE_POLICY_EDIT",
    profileEdit: "SUPPLIER_PROFILE_EDIT",
    scorecardEdit: "SUPPLIER_SCORECARD_EDIT",
    billImport: "PAYABLE_IMPORT",
    returnAuthorize: "RETURN_AUTHORIZE",
    supplierPriceRead: "SUPPLIER_PRICE_VIEW",
    costRead: "PRODUCT_COST_VIEW",
    financialRead: "ACCOUNTING_VIEW",
    receive: "STOCK_RECEIVE",
    match: "INVOICE_MATCH",
    // P2: the supplier finance details on Supplier360 (Accounting's get#SupplierFinance) and the supplier-price edit
    payableRead: "PAYABLE_VIEW",
    termsEdit: "SUPPLIER_TERMS_EDIT",
    supplierPriceEdit: "SUPPLIER_PRICE_EDIT",
    catalogRead: "PRODUCT_CATALOG_VIEW",
    // P5: AP intake's bill from a receipt (Accounting's), and the quality permissions of Warehouse's inspect, verify, dispose
    // and template groups on the shared inspection screens
    payableEdit: "PAYABLE_EDIT",
    inspect: "QUALITY_INSPECT",
    qualityVerify: "QUALITY_VERIFY",
    qualityDispose: "QUALITY_DISPOSE",
    qualityTemplateEdit: "QUALITY_TEMPLATE_EDIT",
    // P6: AP's supplier prepayment (PAYABLE_EDIT, above), and Accounting's landed costs (ACCOUNTING_GL_POST)
    landedCost: "ACCOUNTING_GL_POST"
}
// The menu areas whose authorization is a capability (data/BossSetupData.xml BOSS_PUR_<Area>): listRead, the buying lists
// (suppliers, sourcing, orders, agreements, receiving, returns, bills, performance), which every Purchasing group but the
// requester's opens; Replenishment, Approvals and Settings for their groups. Home and Requests are every Purchasing user's.
const areas = {
    listRead: "Orders",
    replenishment: "Replenishment",
    approvals: "Approvals",
    settings: "Settings",
    // P10: the quick create of a purchase request (BOSS_PUR_NEW_REQUEST), which Requests' New purchase request follows
    requestCreate: "NewPurchaseRequest",
    // P11: the quick create of an RFQ (BOSS_PUR_NEW_RFQ), which QuoteRequests' New RFQ follows
    rfqCreate: "NewQuoteRequest"
}

// ===== scope =====
// The user's authorizations on a Purchasing screen (the root, or an area under it), read directly so disabled or inherited
// artifact authorization cannot widen them: whether they may open it and whether an authorization that opens it has the
// active organization filter (the administrator's). A screen with no authorization of its own is the root's. As
// Manufacturing.js's rootGrants. screenAuthz reads the groups' screen authorizations once, and screenGrants picks a
// screen's from them, so the root and every area cost one query.
function screenAuthz(groupIds) {
    return Array.from(
        find("moqui.security.ArtifactAuthzCheckView")
            .condition("userGroupId", "in", groupIds)
            .condition("artifactTypeEnumId", "AT_XML_SCREEN")
            .condition("authzActionEnumId", "in", ["AUTHZA_ALL", "AUTHZA_VIEW"])
            .list()
    )
}
function screenGrants(location, authzRows) {
    const grants = authzRows.filter(row =>
        row.nameIsPattern === "Y" ? new RegExp("^(?:" + row.artifactName + ")$").test(location) : row.artifactName === location
    )
    const always = grants.filter(row => row.authzTypeEnumId === "AUTHZT_ALWAYS")
    const allowed = always.length
        ? always
        : grants.some(row => row.authzTypeEnumId === "AUTHZT_DENY")
          ? []
          : grants.filter(row => row.authzTypeEnumId === "AUTHZT_ALLOW")
    return {found: grants.length > 0, allowed}
}
// Only a system administrator, or an authorization whose filter sets name MANTLE_ACTIVE_ORG (the administrator group's),
// reaches every organization (the active one when there is one); any other grant is limited to the user's organizations, so
// a grant set up without filters fails closed.
function rootGrants() {
    const none = {read: false, unrestricted: false, authzRows: []}
    if (!ec.user.userId || ec.user.hasPermission("PROJECT_CLIENT")) return none
    if (access.systemAdmin()) return {read: true, unrestricted: true, authzRows: [], systemAdmin: true}
    const groupIds = Array.from(ec.user.getUserGroupIdSet() || [])
    if (!groupIds.length) return none
    const authzRows = screenAuthz(groupIds)
    const root = screenGrants(rootLocation, authzRows)
    if (!root.allowed.length) return none
    const activeOrg = authzId =>
        rows("moqui.security.ArtifactAuthzFilter", {artifactAuthzId: authzId}).some(
            row => row.entityFilterSetId === "MANTLE_ACTIVE_ORG"
        )
    return {read: true, unrestricted: root.allowed.some(row => activeOrg(row.artifactAuthzId)), authzRows}
}
function areaGrant(grants, area) {
    if (!grants.read) return false
    if (grants.systemAdmin) return true
    const found = screenGrants(areaLocation(area), grants.authzRows)
    return found.found ? found.allowed.length > 0 : true
}

// The scope of the current user: their organizations (the buyers of the purchase records they may work with; null for every
// organization), the owners of the suppliers they may work with besides the shared ones, and their capabilities. The owners
// are filterOrgIds kept to the organizations the user belongs to, so an active organization the user does not belong to is
// set aside for their own (as Warehouse and Manufacturing); the administrator works in the active organization, or in every
// one with none active (MANTLE_ACTIVE_ORG).
function scope() {
    const grants = rootGrants()
    // a user without Purchasing has no organizations here (record links ask this of every user)
    const organization = grants.read ? call("mantle.party.PartyServices.get#PartyOrganizationInfo") : {}
    const memberIds = Array.from(organization.userOrgIds || [])
    const filterIds = Array.from(organization.filterOrgIds || []).filter(partyId => memberIds.includes(partyId))
    const ownerIds = grants.unrestricted
        ? organization.activeOrgId
            ? [organization.activeOrgId]
            : null
        : filterIds.length
          ? filterIds
          : memberIds
    const capabilities = {read: grants.read}
    for (const [name, permission] of Object.entries(capabilityPermissions))
        capabilities[name] = grants.read && access.has(permission)
    for (const [name, area] of Object.entries(areas)) capabilities[name] = areaGrant(grants, area)
    return {
        read: grants.read,
        unrestricted: grants.unrestricted,
        organizationPartyIds: memberIds,
        activeOrganizationPartyId: grants.unrestricted
            ? organization.activeOrgId || null
            : memberIds.includes(organization.activeOrgId)
              ? organization.activeOrgId
              : null,
        ownerIds,
        partyId: ec.user.userAccount?.partyId || null,
        capabilities
    }
}
function required(userScope = scope()) {
    if (!userScope.read) denied("PURCHASING_UNAVAILABLE", "Purchasing is not available")
    return userScope
}
const owns = (userScope, partyId) => !userScope.ownerIds || (!!partyId && userScope.ownerIds.includes(partyId))
// A supplier's owner in scope: the user's organizations, or shared (_NA_), as the organization filters pass a Party; an
// unowned supplier passes no filter, so it is no one's (the demo gives Mantle's ZiddlemanInc the shared owner)
const ownsSupplier = (userScope, party) => party.ownerPartyId === "_NA_" || owns(userScope, party.ownerPartyId)
const hasRole = (partyId, roleTypeId) => !!partyId && !!one("mantle.party.PartyRole", {partyId, roleTypeId})
const isInternal = partyId => hasRole(partyId, "OrgInternal")
const statusText = statusId => (statusId ? one("moqui.basic.StatusItem", {statusId})?.description || statusId : "")
const likeText = text => "%" + String(text).replace(/[\\%_]/g, character => "\\" + character) + "%"
function partyName(partyId) {
    if (!partyId) return ""
    const organization = one("mantle.party.Organization", {partyId})
    if (organization?.organizationName) return organization.organizationName
    const person = one("mantle.party.Person", {partyId})
    const name = person ? [person.firstName, person.lastName].filter(Boolean).join(" ") : ""
    return name || partyId
}
// The internal organizations a buying record may name: the user's (null for every one).
function buyerIds(userScope) {
    if (userScope.ownerIds) return userScope.ownerIds
    return rows("mantle.party.PartyRole", {roleTypeId: "OrgInternal"}).map(row => row.partyId)
}

// ===== suppliers =====
// A supplier the user may work with (§4): a Supplier-role party that is not an internal organization, not someone's private
// contact, whose owner is one of the user's organizations or shared. No SupplierProfile is required.
function supplierOf(userScope, partyId) {
    const party = partyId ? one("mantle.party.Party", {partyId}) : null
    if (!party || party.disabled === "Y") return null
    if (party.privateOwnerUserId && party.privateOwnerUserId !== ec.user.userId) return null
    if (!hasRole(partyId, "Supplier") || isInternal(partyId)) return null
    return ownsSupplier(userScope, party) ? party : null
}
// The Supplier-role parties a find may list, limited in the query to the user's owners and the shared ones.
function supplierFind(userScope) {
    const factory = ec.entity.conditionFactory
    let query = find("mantle.party.PartyDetailAndRole", {roleTypeId: "Supplier"}).condition(
        factory.makeCondition(
            [factory.makeCondition("disabled", "is-null", null), factory.makeCondition("disabled", "equals", "N")],
            "or"
        )
    )
    if (userScope.ownerIds) query = query.condition("ownerPartyId", "in", ["_NA_"].concat(userScope.ownerIds))
    return query.condition(
        factory.makeCondition(
            [
                factory.makeCondition("privateOwnerUserId", "is-null", null),
                factory.makeCondition("privateOwnerUserId", "equals", ec.user.userId || "_NA_")
            ],
            "or"
        )
    )
}

// ===== shared context =====
// The Purchasing routes other screens link to (sharedLinks), by path under the root; each phase adds its screens.
const linkPaths = [
    // P1: the areas of the menu (design §1)
    "Home",
    "Suppliers",
    "Requests",
    "Sourcing",
    "Orders",
    "Approvals",
    "Agreements",
    "Replenishment",
    "Receiving",
    "Returns",
    "Bills",
    "Performance",
    "Settings",
    // P14a: Replenishment's shared supply plan and availability, and the reorder rules
    "Replenishment/SupplyPlanning",
    "Replenishment/InventoryAvailability",
    "Replenishment/ReorderRules",
    // P2: the supplier screens, the shared Supplier360, SupplierPrices and PriceExplain, Product360 and the buying policy
    "Suppliers/Supplier360",
    "Suppliers/SupplierPrices",
    "Suppliers/PriceExplain",
    "Products/Product360",
    "Settings/PurchasePolicy",
    // P3: the purchase orders and the shared OrderDetail
    "Orders/PurchaseOrders",
    "Orders/OrderDetail",
    // P4: the approval policies
    "Settings/ApprovalPolicies",
    // P5: the receipts, the shared ShipmentDetail, the inspections, the shared QualityInspection and InspectionTemplates
    "Receiving/Receipts",
    "Receiving/ShipmentDetail",
    "Receiving/Inspections",
    "Receiving/QualityInspection",
    "Receiving/InspectionTemplates",
    // P6: the bills, the match exceptions (with the legacy match backfill), the shared InvoiceDetail and InvoiceMatch
    "Bills/BillList",
    "Bills/MatchExceptions",
    "Bills/InvoiceDetail",
    "Bills/InvoiceMatch",
    // P8: the supplier returns, the shared ReturnDetail and the supplier return authorization print
    "Returns/SupplierReturns",
    "Returns/ReturnDetail",
    "Returns/ReturnAuthorization",
    // P9: a purchase order's changes and the acknowledgements
    "Orders/OrderChanges",
    "Orders/Acknowledgements",
    // P10: the purchase requests, the shared RequestDetail and the sourcing of request lines
    "Requests/PurchaseRequests",
    "Requests/RequestDetail",
    "Requests/RequestSourcing",
    // P13: the agreements and AgreementDetail
    "Agreements/AgreementList",
    "Agreements/AgreementDetail",
    // P11: the RFQs and supplier quotes, and their details
    "Sourcing/QuoteRequests",
    "Sourcing/QuoteRequestDetail",
    "Sourcing/Quotes",
    "Sourcing/QuoteDetail",
    // P12: the comparison and award of an RFQ's quotes
    "Sourcing/QuoteComparison",
    "Sourcing/Award",
    // P15: the performance reports and an evaluation's detail, and the scorecard policies
    "Performance/Scorecards",
    "Performance/ScorecardDetail",
    "Performance/Spend",
    "Performance/Commitments",
    "Performance/ProcurementTracker",
    "Performance/PurchaseHistory",
    "Performance/SupplierStatement",
    "Settings/ScorecardPolicies"
]
function sharedContext(p) {
    if (p.appRoot && p.appRoot !== "Purchasing") denied("PURCHASING_CONTEXT", "Purchasing context is not available")
    const userScope = required()
    return {
        capabilities: userScope.capabilities,
        organizationPartyIds: userScope.organizationPartyIds,
        activeOrganizationPartyId: userScope.activeOrganizationPartyId,
        allOrganizations: !userScope.ownerIds,
        appRoot: "Purchasing",
        linkBase: "//Purchasing",
        webBase: "/qapps/Purchasing",
        sharedLinks: Object.fromEntries(linkPaths.map(path => [path, "//Purchasing/" + path]))
    }
}

// ===== record kinds =====
// A purchase order: every part's customer is an internal organization (the buyer) and the order's buyers are the record's
// owners; its suppliers are the parts' vendors.
function readOrder(orderId, quoteOnly = false) {
    const order = one("mantle.order.OrderHeader", {orderId})
    const parts = order ? rows("mantle.order.OrderPart", {orderId}) : []
    if (!order || !parts.length || !parts.every(part => isInternal(part.customerPartyId))) return null
    if (quoteOnly && !wasQuote(order)) return null
    const vendorIds = Array.from(new Set(parts.map(part => part.vendorPartyId).filter(Boolean)))
    return {
        owners: parts.map(part => part.customerPartyId),
        suppliers: vendorIds,
        label: order.orderName || orderId,
        detail: [vendorIds.map(partyName).join(", "), statusText(order.statusId)].filter(Boolean).join(" · ")
    }
}
// A request's organization: its OrgInternal RequestParty (P10, F3), else its facility's owner. A requester reads their own
// and assigned requests only (§2): the filer, or a party of the request.
function readRequest(requestId, requestTypeEnumId) {
    const request = one("mantle.request.Request", {requestId})
    if (!request || request.requestTypeEnumId !== requestTypeEnumId) return null
    const parties = rows("mantle.request.RequestParty", {requestId}).filter(row => lib.active(row))
    const organizations = parties.filter(row => row.roleTypeId === "OrgInternal").map(row => row.partyId)
    const facility = request.facilityId ? one("mantle.facility.Facility", {facilityId: request.facilityId}) : null
    return {
        owners: organizations.length ? organizations : [facility?.ownerPartyId],
        suppliers: [],
        own: partyId =>
            !!partyId &&
            (request.filedByPartyId === partyId ||
                parties.some(row => row.partyId === partyId && row.roleTypeId !== "OrgInternal")),
        label: request.requestName || requestId,
        detail: statusText(request.statusId)
    }
}
// A purchase agreement (P13: of the AgrPurchase type): the organization is the buyer, the other party a supplier.
function readAgreement(agreementId) {
    const agreement = one("mantle.party.agreement.Agreement", {agreementId})
    if (
        !agreement ||
        agreement.agreementTypeEnumId !== "AgrPurchase" ||
        !isInternal(agreement.organizationPartyId) ||
        !hasRole(agreement.otherPartyId, "Supplier")
    )
        return null
    return {
        owners: [agreement.organizationPartyId],
        suppliers: [agreement.otherPartyId],
        label: agreement.description || agreementId,
        detail: [partyName(agreement.otherPartyId), statusText(agreement.statusId)].filter(Boolean).join(" · ")
    }
}
// A supplier return: the internal organization returns to its vendor (the return's customer is the buyer).
function readSupplierReturn(returnId) {
    const header = one("mantle.order.return.ReturnHeader", {returnId})
    if (!header || !isInternal(header.customerPartyId) || isInternal(header.vendorPartyId)) return null
    return {
        owners: [header.customerPartyId],
        suppliers: [header.vendorPartyId],
        label: returnId,
        detail: [partyName(header.vendorPartyId), statusText(header.statusId)].filter(Boolean).join(" · ")
    }
}
// A supplier by itself: no buyer of its own, checked as a supplier in scope.
function readSupplier(partyId) {
    const party = one("mantle.party.Party", {partyId})
    if (!party || !hasRole(partyId, "Supplier") || isInternal(partyId)) return null
    return {owners: [], suppliers: [partyId], shared: true, label: partyName(partyId), detail: party.pseudoId || ""}
}
// A product of the user's organizations or the shared catalog (P2: Purchasing's Product360), for a catalog reader.
function readProduct(productId) {
    const product = one("mantle.product.Product", {productId})
    if (!product || !access.has("PRODUCT_CATALOG_VIEW")) return null
    const owner = product.ownerPartyId
    const shared = !owner || owner === "_NA_"
    return {
        owners: shared ? [] : [owner],
        suppliers: [],
        shared,
        label: product.productName || productId,
        detail: product.pseudoId && product.pseudoId !== productId ? product.pseudoId : ""
    }
}

// A facility a replenishment screen plans or lists (P14a): its owner is the buyer; it names no supplier.
function readFacility(facilityId) {
    const facility = one("mantle.facility.Facility", {facilityId})
    if (!facility || !isInternal(facility.ownerPartyId)) return null
    return {owners: [facility.ownerPartyId], suppliers: [], label: facility.facilityName || facilityId, detail: ""}
}

// A supplier bill (P6): from a supplier to the buying organization (the buyer), not a credit of another bill.
function readBill(invoiceId) {
    const bill = one("mantle.account.invoice.Invoice", {invoiceId})
    if (!bill || bill.creditForInvoiceId || !isInternal(bill.toPartyId) || isInternal(bill.fromPartyId)) return null
    // People P27 review (AC-23): a payroll-origin bill (a person's net pay) is a reader of payroll's, missing to anyone else
    if (
        bill.payrollOrigin === "Y" &&
        !ec.resource.script("component://mr-mantle/service/mantle/account/PayrollOrigin.js").canRead()
    )
        return null
    return {
        owners: [bill.toPartyId],
        suppliers: [bill.fromPartyId],
        label: bill.referenceNumber ? "Bill " + bill.referenceNumber : "Bill " + invoiceId,
        detail: [partyName(bill.fromPartyId), statusText(bill.statusId)].filter(Boolean).join(" · ")
    }
}

// Each kind a Purchasing screen, mount, palette or record link may be given: its name, icon, the Purchasing screen that opens
// it (destination, the path and id parameter under the root; null until its phase builds it, and then the record opens Home's
// lookup), the capability that reads it beyond the requester's own (listRead) and its read (a record answers its owners
// (buyers) and suppliers, a label and a detail, or null when there is no such record). Later phases set the destinations.
const recordKinds = {
    // P3: a purchase order opens the shared OrderDetail under Orders
    order: {
        name: "Purchase order",
        icon: "sym_o_receipt_long",
        destination: "Orders/OrderDetail?orderId=",
        read: id => readOrder(id)
    },
    // P11: a supplier quote opens QuoteDetail and an RFQ QuoteRequestDetail under Sourcing
    quote: {
        name: "Supplier quote",
        icon: "sym_o_request_quote",
        destination: "Sourcing/QuoteDetail?orderId=",
        read: id => readOrder(id, true)
    },
    // P10: a purchase request opens the shared RequestDetail under Requests
    request: {
        name: "Purchase request",
        icon: "sym_o_add_task",
        destination: "Requests/RequestDetail?requestId=",
        requester: true,
        read: id => readRequest(id, purchaseRequestType)
    },
    rfq: {
        name: "RFQ",
        icon: "sym_o_contract",
        destination: "Sourcing/QuoteRequestDetail?requestId=",
        read: id => readRequest(id, rfqRequestType)
    },
    // P13: an agreement opens AgreementDetail under Agreements
    agreement: {
        name: "Agreement",
        icon: "sym_o_handshake",
        destination: "Agreements/AgreementDetail?agreementId=",
        read: readAgreement
    },
    // P8: a supplier return opens the shared ReturnDetail under Returns
    supplierReturn: {
        name: "Supplier return",
        icon: "sym_o_assignment_return",
        destination: "Returns/ReturnDetail?returnId=",
        read: readSupplierReturn
    },
    supplier: {name: "Supplier", icon: "sym_o_corporate_fare", destination: null, read: readSupplier},
    // P14a: the facility a plan or reorder rule is for (no screen of its own)
    facility: {name: "Facility", icon: "sym_o_warehouse", destination: null, read: readFacility},
    supplier: {
        name: "Supplier",
        icon: "sym_o_corporate_fare",
        destination: "Suppliers/Supplier360?vendorPartyId=",
        read: readSupplier
    },
    // P2: a product opens Purchasing's Product360
    product: {name: "Product", icon: "sym_o_inventory_2", destination: "Products/Product360?productId=", read: readProduct},
    // P5: a purchase receipt opens the shared ShipmentDetail under Receiving, and its inspection the shared QualityInspection
    receipt: {
        name: "Receipt",
        icon: "sym_o_inbox",
        destination: "Receiving/ShipmentDetail?shipmentId=",
        read: id => receipts().readReceipt(id)
    },
    inspection: {
        name: "Inspection",
        icon: "sym_o_verified",
        destination: "Receiving/QualityInspection?qualityInspectionId=",
        read: id => receipts().readInspection(id)
    },
    // P6: a supplier bill opens the shared InvoiceDetail under Bills
    bill: {name: "Supplier bill", icon: "sym_o_receipt", destination: "Bills/InvoiceDetail?invoiceId=", read: readBill}
}

// A record the user may work with: every buyer it names is one of their organizations and every supplier it names is in
// their supplier scope; one that names no buyer is refused unless it is a supplier or the user works in every organization.
// A kind past the requester's needs the buying lists' grant (listRead), and a requester reads their own requests only. A
// missing record and one outside the scope are refused alike (RECORD_UNAVAILABLE), so a forged id learns nothing.
function recordOf(userScope, kind, recordId) {
    const definition = Object.hasOwn(recordKinds, kind) ? recordKinds[kind] : null
    const unavailable = () => denied("RECORD_UNAVAILABLE", (definition?.name || "Record") + " " + recordId + " is not available")
    if (!recordId || !definition) unavailable()
    const found = definition.read(recordId)
    if (!found) unavailable()
    const owners = found.owners.filter(owner => owner !== undefined)
    const allowed =
        (owners.length > 0 || found.shared || !userScope.ownerIds) &&
        owners.every(owner => owns(userScope, owner)) &&
        found.suppliers.every(partyId => !!supplierOf(userScope, partyId)) &&
        (userScope.capabilities.listRead || (definition.requester && found.own(userScope.partyId)))
    if (!allowed) unavailable()
    return {recordType: kind, recordId, kindName: definition.name, label: found.label, detail: found.detail}
}

// check#Record: a record a Purchasing screen or mount was given, refused unless the user may work with it and, when a
// capability is named, holds it.
function checkRecord(p) {
    const userScope = required()
    if (p.capability) {
        if (!Object.hasOwn(capabilityPermissions, p.capability)) throw new Error("Unknown Purchasing capability " + p.capability)
        if (!userScope.capabilities[p.capability])
            denied("PERMISSION_DENIED", capabilityPermissions[p.capability] + " is required")
    }
    return recordOf(userScope, p.recordType, p.recordId)
}

// The Purchasing screen of a record: its kind's destination, else Home's lookup of it.
function recordUrl(kind, recordId) {
    const destination = recordKinds[kind]?.destination
    if (destination) return "/qapps/Purchasing/" + destination + encodeURIComponent(recordId)
    return "/qapps/Purchasing/Home?lookupType=" + kind + "&lookupId=" + encodeURIComponent(recordId)
}
// The Purchasing link of a record the user may work with, else null (get#RecordLink).
function recordLink(kind, recordId) {
    try {
        const userScope = scope()
        if (!userScope.read) return null
        recordOf(userScope, kind, recordId)
        return recordUrl(kind, recordId)
    } catch (error) {
        if (lib.reasonCode(error) !== "RECORD_UNAVAILABLE")
            ec.logger.warn("Purchasing link of " + kind + " " + recordId + ": " + error.message)
        return null
    }
}
// The kind of a purchase order (a quote while in the quote statuses), or null for an order that is not a purchase.
function orderKind(orderId) {
    const order = one("mantle.order.OrderHeader", {orderId})
    if (!order) return null
    return wasQuote(order) ? "quote" : "order"
}
// The kind of a purchase request or RFQ, or null for another request.
function requestKind(requestId) {
    const type = one("mantle.request.Request", {requestId})?.requestTypeEnumId
    return type === purchaseRequestType ? "request" : type === rfqRequestType ? "rfq" : null
}

// ===== palette =====
// The finds of the palette (design §1: authorized PO, RFQ and supplier lookup): each kind by its id and names, ignoring case,
// limited in the query to the user's buyers or supplier scope, and each row checked again by recordOf; P2 adds a supplier by
// its item codes (the supplier offers' otherPartyItemId) and products. Later phases add requests, RFQs and agreements as
// their screens are built.
const searchFinds = [
    {
        kind: "order",
        query: (userScope, condition) =>
            find("mantle.order.OrderHeaderAndPart")
                .condition("customerPartyId", "in", buyerIds(userScope))
                .condition(condition(["orderId", "orderName", "externalId", "otherPartyOrderId"]))
                .selectField("orderId")
                .distinct(true)
                .orderBy("orderId"),
        idField: "orderId",
        kindOf: orderKind
    },
    {
        kind: "supplier",
        query: (userScope, condition) =>
            supplierFind(userScope)
                .condition(condition(["partyId", "pseudoId", "organizationName", "firstName", "lastName"]))
                .selectField("partyId")
                .distinct(true)
                .orderBy("partyId"),
        idField: "partyId"
    },
    {
        kind: "supplier",
        query: (userScope, condition) =>
            find("mantle.product.ProductPrice")
                .condition("pricePurposeEnumId", "PppPurchase")
                .condition("vendorPartyId", "is-not-null", null)
                .condition(condition(["otherPartyItemId"]))
                .selectField("vendorPartyId")
                .distinct(true)
                .orderBy("vendorPartyId"),
        idField: "vendorPartyId"
    },
    // P10: a purchase request by its id or name, of the user's organizations (its OrgInternal party)
    {
        kind: "request",
        query: (userScope, condition) =>
            find("mantle.request.RequestAndParty", {requestTypeEnumId: purchaseRequestType, roleTypeId: "OrgInternal"})
                .condition("partyId", "in", buyerIds(userScope))
                .condition(condition(["requestId", "requestName"]))
                .selectField("requestId")
                .distinct(true)
                .orderBy("-requestId"),
        idField: "requestId"
    },
    // P11: an RFQ by its id or name, of the user's organizations (its OrgInternal party)
    {
        kind: "rfq",
        query: (userScope, condition) =>
            find("mantle.request.RequestAndParty", {requestTypeEnumId: rfqRequestType, roleTypeId: "OrgInternal"})
                .condition("partyId", "in", buyerIds(userScope))
                .condition(condition(["requestId", "requestName"]))
                .selectField("requestId")
                .distinct(true)
                .orderBy("-requestId"),
        idField: "requestId"
    },
    // P8: a supplier return by its id, the supplier's RMA or their reference
    {
        kind: "supplierReturn",
        query: (userScope, condition) =>
            find("mantle.order.return.ReturnHeader")
                .condition("customerPartyId", "in", buyerIds(userScope))
                .condition(condition(["returnId", "supplierRmaId", "displayId"]))
                .selectField("returnId")
                .orderBy("-returnId"),
        idField: "returnId"
    },
    // P13: a purchase agreement by its id or description
    {
        kind: "agreement",
        query: (userScope, condition) =>
            find("mantle.party.agreement.Agreement", {agreementTypeEnumId: "AgrPurchase"})
                .condition("organizationPartyId", "in", buyerIds(userScope))
                .condition(condition(["agreementId", "description"]))
                .selectField("agreementId")
                .orderBy("-agreementId"),
        idField: "agreementId"
    },
    {
        kind: "product",
        query: (userScope, condition) =>
            find("mantle.product.Product")
                .condition(condition(["productId", "pseudoId", "productName"]))
                .condition(
                    ec.entity.conditionFactory.makeCondition(
                        [
                            ec.entity.conditionFactory.makeCondition("ownerPartyId", "is-null", null),
                            ec.entity.conditionFactory.makeCondition(
                                "ownerPartyId",
                                "in",
                                ["_NA_"].concat(userScope.ownerIds || buyerIds(userScope))
                            )
                        ],
                        "or"
                    )
                )
                .selectField("productId")
                .orderBy("productId"),
        idField: "productId"
    }
]
function search(p) {
    const userScope = scope()
    if (!userScope.read || !userScope.capabilities.listRead || !String(p.text || "").trim()) return {rows: []}
    const text = String(p.text).trim()
    const limit = Math.max(1, Math.min(20, Number(p.limit || 5)))
    const factory = ec.entity.conditionFactory
    const condition = fields =>
        factory.makeCondition(
            fields.map(field => factory.makeCondition(field, "like", likeText(text)).ignoreCase()),
            "or"
        )
    const found = new Map()
    for (const definition of searchFinds) {
        let rowsFound = []
        try {
            rowsFound = Array.from(definition.query(userScope, condition).limit(limit).list())
        } catch (error) {
            ec.logger.error("Purchasing palette " + definition.kind + " search failed: " + error.message)
        }
        // each row on its own: one that fails or is out of scope is left out and the others still show
        for (const row of rowsFound) {
            const recordId = row[definition.idField]
            try {
                const kind = definition.kindOf ? definition.kindOf(recordId) : definition.kind
                const record = recordOf(userScope, kind, recordId)
                const url = recordUrl(kind, recordId)
                if (!found.has(url))
                    found.set(url, {
                        title: (record.label && record.label !== recordId ? record.label + " · " : "") + recordId,
                        subtitle: [record.kindName, record.detail].filter(Boolean).join(" · "),
                        icon: recordKinds[kind].icon,
                        url
                    })
            } catch (error) {
                if (lib.reasonCode(error) !== "RECORD_UNAVAILABLE")
                    ec.logger.error("Purchasing palette " + definition.kind + " " + recordId + ": " + error.message)
            }
        }
    }
    return {rows: Array.from(found.values()).slice(0, limit)}
}

// ===== choices =====
// Each Purchasing drop-down: its options for the user, the term and the selected value, with the selected value's label when
// it is in scope but not on the page. Later phases add sources.
const choiceSources = {
    // the suppliers the user may work with (their organizations' and the shared ones)
    suppliers: (userScope, term, selected) => {
        const factory = ec.entity.conditionFactory
        let query = supplierFind(userScope).selectField("partyId").distinct(true).orderBy("partyId").limit(choiceLimit)
        if (term)
            query = query.condition(
                factory.makeCondition(
                    ["partyId", "pseudoId", "organizationName", "firstName", "lastName"].map(field =>
                        factory.makeCondition(field, "like", likeText(term)).ignoreCase()
                    ),
                    "or"
                )
            )
        const options = Array.from(query.list()).map(row => ({value: row.partyId, label: partyName(row.partyId)}))
        if (selected && !options.some(option => option.value === selected) && supplierOf(userScope, selected))
            options.push({value: selected, label: partyName(selected)})
        return options
    },
    // the user's buying organizations (internal organizations they belong to, or every one for the administrator)
    organizations: (userScope, term, selected) => {
        const ids = buyerIds(userScope)
        const options = ids
            .map(partyId => ({value: partyId, label: partyName(partyId)}))
            .filter(option => !term || option.label.toLowerCase().includes(term.toLowerCase()))
            .sort((a, b) => a.label.localeCompare(b.label))
            .slice(0, choiceLimit)
        if (selected && !options.some(option => option.value === selected) && ids.includes(selected))
            options.push({value: selected, label: partyName(selected)})
        return options
    },
    // P14a: Replenishment's planning facilities, products and plan methods (Replenishment.js)
    planFacilities: (userScope, term, selected) => replenishment().facilityChoices(userScope, term, selected),
    planProducts: (userScope, term, selected) => replenishment().productChoices(userScope, term, selected),
    planningMethods: (userScope, term) => replenishment().methodChoices(term),
    // P2: the people of the user's organizations (agents, employees, members) a supplier's buyer may be, by name
    buyers: (userScope, term, selected) => {
        const factory = ec.entity.conditionFactory
        const now = Number(ec.user.nowTimestamp)
        const active = row =>
            (row.fromDate == null || Number(row.fromDate) <= now) && (row.thruDate == null || Number(row.thruDate) > now)
        const peopleIds = Array.from(
            new Set(
                Array.from(
                    find("mantle.party.PartyRelationship")
                        .condition("relationshipTypeEnumId", "in", ["PrtAgent", "PrtEmployee", "PrtMember"])
                        .condition("toPartyId", "in", buyerIds(userScope))
                        .list()
                )
                    .filter(active)
                    .map(row => row.fromPartyId)
            )
        )
        if (!peopleIds.length) return []
        let query = find("mantle.party.Person").condition("partyId", "in", peopleIds).orderBy("firstName").limit(choiceLimit)
        if (term)
            query = query.condition(
                factory.makeCondition(
                    ["firstName", "lastName", "partyId"].map(field =>
                        factory.makeCondition(field, "like", likeText(term)).ignoreCase()
                    ),
                    "or"
                )
            )
        const options = Array.from(query.list()).map(row => ({value: row.partyId, label: partyName(row.partyId)}))
        if (selected && !options.some(option => option.value === selected) && peopleIds.includes(selected))
            options.push({value: selected, label: partyName(selected)})
        return options
    },
    // P3: the products a purchase order line may name, and the cost centres of a line (Orders.js)
    orderProducts: (userScope, term, selected) => orders().productChoices(userScope, term, selected),
    costCenters: (userScope, term, selected) => orders().costCenterChoices(userScope, term, selected),
    // P4: an approval policy step's approver (a user holding PURCHASE_APPROVE in the user's organizations), its approver group
    // (a group holding PURCHASE_APPROVE) and product category (Approvals.js)
    approvers: (userScope, term, selected) => approvals().approverChoices(userScope, term, selected),
    approverGroups: (userScope, term, selected) => approvals().approverGroupChoices(term, selected),
    productCategories: (userScope, term, selected) => approvals().categoryChoices(term, selected),
    // P5: the approved order parts a receipt is prepared for, the rejection reasons and a receipt's locations (Receipts.js)
    receiptParts: (userScope, term, selected) => receipts().receiptParts(userScope, term, selected),
    rejectionReasons: () => receipts().rejectionReasons(),
    receiptLocations: (userScope, term, selected, p) => receipts().receiptLocations(userScope, term, selected, p),
    // P6: the purchase orders a bill may be for, of a supplier when partyId is given (Bills.js)
    billOrders: (userScope, term, selected, p) => bills().orderChoices(userScope, term, selected, p),
    // P8: the purchase orders a supplier return may come from (of a supplier when partyId is given), an order's eligible
    // receipts by receipt and lot (orderId), and a supplier return item's reason and response (Returns.js)
    returnOrders: (userScope, term, selected, p) => returns().orderChoices(userScope, term, selected, p),
    returnReceipts: (userScope, term, selected, p) => returns().receiptChoices(userScope, p),
    returnReasons: () => returns().reasonChoices(),
    returnResponses: () => returns().responseChoices(),
    // P13: the active agreements a release may come from (of a supplier when partyId is given), the templates a new agreement
    // starts from, an agreement's items in effect (agreementId), its signers, the term types, payment terms and currencies
    // (Agreements.js)
    releaseAgreements: (userScope, term, selected, p) => agreementReads().releaseChoices(userScope, term, selected, p),
    agreementTemplates: (userScope, term, selected) => agreementReads().templateChoices(userScope, term, selected),
    agreementItems: (userScope, term, selected, p) => agreementReads().itemChoices(userScope, term, selected, p),
    agreementSigners: (userScope, term, selected, p) => agreementReads().signerChoices(userScope, term, selected, p),
    termTypes: (userScope, term) => agreementReads().termTypeChoices(term),
    settlementTerms: () => agreementReads().settlementTermChoices(),
    currencies: (userScope, term, selected) => agreementReads().currencyChoices(term, selected),
    // P11: the open RFQs a quote may answer, and how a quote came (Sourcing.js)
    rfqs: (userScope, term, selected) => sourcingReads().rfqChoices(userScope, term, selected),
    // P15: the purchase requests the procurement tracker follows
    trackerRequests: (userScope, term, selected) =>
        ec.resource
            .script("component://mr-boss/service/ironstone/purchasing/Reports.js")
            .requestChoices(userScope, term, selected),
    quoteChannels: () => sourcingReads().channelChoices(),
    // P2: the supplier categories (PartyClassification rows of PcltSupplierCategory)
    supplierCategories: (userScope, term, selected) => {
        let query = find("mantle.party.PartyClassification", {classificationTypeEnumId: "PcltSupplierCategory"})
            .orderBy("description")
            .limit(choiceLimit)
        if (term)
            query = query.condition(ec.entity.conditionFactory.makeCondition("description", "like", likeText(term)).ignoreCase())
        const options = Array.from(query.list()).map(row => ({
            value: row.partyClassificationId,
            label: row.description || row.partyClassificationId
        }))
        if (selected && !options.some(option => option.value === selected)) {
            const row = one("mantle.party.PartyClassification", {partyClassificationId: selected})
            if (row?.classificationTypeEnumId === "PcltSupplierCategory")
                options.push({value: selected, label: row.description || selected})
        }
        return options
    }
}
function choices(p) {
    const userScope = required()
    if (!Object.hasOwn(choiceSources, p.choice)) throw new Error("Unknown Purchasing choice " + p.choice)
    return {options: choiceSources[p.choice](userScope, String(p.term || "").trim(), p.selected || null, p)}
}

const operations = {sharedContext, checkRecord, search, choices}
;({
    recordLink,
    orderKind,
    requestKind,
    // the scope for a phase's own module and the shared mounts' Purchasing branch: the user's scope, the same refusing a
    // user without Purchasing, the buyer and supplier checks, a record's check and its Purchasing link
    scope,
    required,
    owns,
    buyerIds,
    supplierOf,
    supplierFind,
    recordOf,
    recordUrl,
    // whether a kind has its Purchasing screen yet (get#RecordLink leaves a request or return to its other apps until it has)
    hasScreen: kind => !!recordKinds[kind]?.destination,
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Purchasing operation " + op)
        return operations[op](parameters)
    }
})
