// The Purchasing access and isolation walk (design-purchasing §14.4 "Closed period, unauthorized action and standalone use",
// crosscut §6 standalone operation, impl-purchasing P17), an acceptance test with artifact authorization on. Each side,
// Ziziwork Retail and Ziziwork Services, gets its own records marked with a secret text and an odd amount: a placed purchase
// order with its expected receipt, a purchase request, an RFQ with a requested quote, an agreement, a bill, a supplier return,
// an organization-scoped supplier price and (Retail) a product standard cost. Then:
// - each Purchasing user (Retail's demo users of each group, Services' reader and the walk's standalone buyer) opens
//   Purchasing and none of the other app roots;
// - the other side's users never see a side's records on the Purchasing routes that show them to its own reader or to
//   john.doe (URLs with the record's id, the shared mounts, the record panels, html and, for a reader, the terminal), nor in
//   the CSV exports, the prints, the palette, record links and drop-downs (universal search has no index in a test
//   runtime, F-P17-3);
// - no Purchasing user sees a product's standard cost, a bill's payments and unpaid amounts without a finance group, or
//   another organization's supplier price, and none may post stock, match a bill, release a hold or approve a payable
//   without the group that grants it;
// - the Supplier app (a link's pages and a signed-in supplier contact's home) shows neither organization's internal records
//   or another organization's prices;
// - a buyer who also holds Warehouse's receive group and Accounting's match group, and neither root, receives and matches
//   from Purchasing's shared mounts (ShipmentDetail, InvoiceMatch), while the plain buyer is refused both and asks for the
//   hold's release instead (the handoff).
// The later features read the records setupSpec makes. Run: ./moq accept mr-boss --spec PurchasingAccessWalk
const lib = ec.resource.script("component://mr-boss/test/Purchasing/PurchasingSpecLib.js")
const {ids, users, asUser, system, invoke} = lib
const webroot = "component://webroot/screen/webroot.xml"
const since = "2000-01-01T00:00:00Z"
const stamp = ec.l10n.format(ec.user.nowTimestamp, "HHmmssSSS")
let keySeq = 0
const key = () => "pur-p17-" + stamp + "-" + ++keySeq
const find = (entity, conditions = {}) => ec.entity.find(entity).condition(conditions).disableAuthz()
const one = (entity, conditions) => find(entity, conditions).one()
const rows = (entity, conditions) => Array.from(find(entity, conditions).list())
const call = (service, parameters) => ec.service.sync().name(service).parameters(parameters).disableAuthz().call() || {}

// a number shown as itself, not inside a longer one (impl-manufacturing F149)
const amount = text => `(^|[^\\d.,])${text.replace(/\./g, "\\.")}([^\\d]|$)`
// the two sides: the organization, its supplier, facility and secret; each side's records are set by setupSpec
const sides = {
    retail: {
        org: ids.organizationId,
        supplier: ids.supplierId,
        facility: ids.facilityId,
        text: "P17 Retail secret",
        price: "8888.88",
        pattern: new RegExp(`P17 Retail secret|${amount("8,?888.88")}`),
        reader: users.read
    },
    services: {
        org: ids.otherOrganizationId,
        supplier: ids.otherSupplierId,
        facility: "BOSS_PRD_WH",
        text: "P17 Services secret",
        price: "7777.77",
        pattern: new RegExp(`P17 Services secret|${amount("7,?777.77")}`),
        reader: users.services
    }
}
// Retail's product standard cost: no Purchasing user sees it
const COST = new RegExp(amount("6,?666.66"))
// Retail's demo Purchasing users of every group, and the walk's standalone buyer (receive and match groups, no other root)
const retailUsers = [
    users.requester,
    users.buyer,
    users.planner,
    users.approve,
    users.read,
    users.admin,
    users.buyMatch,
    users.buyReceive
]
// the users of the isolation sweeps: Retail's but the purchasing administrator, whose MANTLE_ACTIVE_ORG grant reaches every
// organization when none is active, by design (impl-purchasing §4), as the other apps' administrators
const sweepUsers = retailUsers.filter(username => username !== users.admin)
const STANDALONE = "purchasing.p17standalone"
const otherRoots = ["Products", "Accounting", "Sales", "Warehouse", "Manufacturing", "CustomerService", "Projects", "Admin"]
const state = {}

// a Purchasing screen as the shell fetches it, as the user with authorization on
const page = (username, path, parameters = {}, mode = "html") => asUser(username, () => lib.page(path, parameters, mode))
// a screen of another root as the user's shell requests it
function render(root, path, parameters = {}, mode = "html") {
    let result
    try {
        result = ec.screen
            .makeTest()
            .rootScreen(`component://mr-boss/screen/${root}.xml`)
            .renderMode(mode)
            .render(path, Object.assign({lastStandalone: "-2"}, parameters), null)
    } catch (error) {
        result = {status: 0, output: "", errorMessages: [String(error.message)]}
    }
    ec.message.clearErrors()
    return {
        status: result.status,
        output: String(result.output || ""),
        errors: Array.from(result.errorMessages || []).join(" | ")
    }
}
// a Purchasing transition as the client posts it, as the user: its status and errors
function post(username, path, parameters) {
    return asUser(username, () => {
        const rendered = ec.screen
            .makeTest()
            .rootScreen(webroot)
            .render("apps/Purchasing/" + path, parameters, "post")
        const result = {status: rendered.status, errors: Array.from(rendered.errorMessages || []).join(" | ")}
        ec.message.clearErrors()
        return result
    })
}
// a service as the screens call it, as the user: its result, or {} when refused, with the refusal
function read(username, service, parameters, enabled = false) {
    return asUser(
        username,
        () => {
            ec.message.pushErrors()
            try {
                const out = ec.service.sync().name(service).parameters(parameters).requireNewTransaction(true).call() || {}
                return Object.assign({}, out, {error: ec.message.hasError() ? ec.message.getErrorsString() : ""})
            } catch (error) {
                return {error: String(error.message || error)}
            } finally {
                ec.message.clearErrors()
                ec.message.popErrors()
            }
        },
        enabled
    )
}

// a spec user in Purchasing's root and buyer groups and the given others, an agent of Retail
function standaloneUser(username, groups) {
    const partyId = "BOSS_PUR_P17_STANDALONE"
    call("store#mantle.party.Party", {partyId, partyTypeEnumId: "PtyPerson"})
    call("store#mantle.party.Person", {partyId, firstName: "P17", lastName: "Standalone buyer"})
    call("store#moqui.security.UserAccount", {
        userId: partyId,
        username,
        partyId,
        userFullName: "P17 Standalone buyer",
        currentPassword: "16ac58bbfa332c1c55bd98b53e60720bfa90d394",
        passwordHashType: "SHA"
    })
    for (const userGroupId of groups)
        call("store#moqui.security.UserGroupMember", {userId: partyId, userGroupId, fromDate: since})
    call("store#mantle.party.PartyRelationship", {
        partyRelationshipId: partyId + "_ORG",
        fromPartyId: partyId,
        toPartyId: ids.organizationId,
        relationshipTypeEnumId: "PrtAgent",
        toRoleTypeId: "OrgInternal",
        fromDate: since
    })
}

// a side's records, each with its secret text where a screen shows it and its price as an amount
function records(side) {
    const s = sides[side]
    const out = {}
    // a placed and approved purchase order of two lines, with its expected receipt
    const order = call("mantle.order.OrderServices.create#Order", {
        customerPartyId: s.org,
        vendorPartyId: s.supplier,
        currencyUomId: "USD",
        facilityId: s.facility,
        orderName: `${s.text} order ${stamp}`
    })
    out.orderId = order.orderId
    out.orderItemSeqId = call("mantle.order.OrderServices.add#OrderProductQuantity", {
        orderId: order.orderId,
        orderPartSeqId: order.orderPartSeqId,
        productId: "DEMO_1_1",
        quantity: 2,
        unitAmount: s.price,
        itemTypeEnumId: "ItemInventory"
    }).orderItemSeqId
    call("mantle.order.OrderServices.place#Order", {orderId: order.orderId})
    call("mantle.order.OrderServices.approve#Order", {orderId: order.orderId})
    out.shipmentId = call("mantle.shipment.ShipmentServices.create#OrderPartShipment", {
        orderId: order.orderId,
        orderPartSeqId: order.orderPartSeqId,
        destinationFacilityId: s.facility
    }).shipmentId
    // a purchase request of the organization (its OrgInternal party)
    out.requestId = "BOSS_PUR_P17_REQ_" + side.toUpperCase() + "_" + stamp
    call("create#mantle.request.Request", {
        requestId: out.requestId,
        requestTypeEnumId: "RqtPurchase",
        statusId: "ReqSubmitted",
        requestName: `${s.text} request`,
        facilityId: s.facility,
        currencyUomId: "USD",
        filedByPartyId: "BOSS_PUR_REQUESTER"
    })
    call("create#mantle.request.RequestParty", {
        requestId: out.requestId,
        partyId: s.org,
        roleTypeId: "OrgInternal",
        fromDate: since
    })
    call("create#mantle.request.RequestItem", {
        requestId: out.requestId,
        requestItemSeqId: "01",
        statusId: "ReqSubmitted",
        productId: "DEMO_1_1",
        description: `${s.text} request line`,
        quantity: 3,
        quantityUomId: "OTH_ea",
        supplierPartyId: s.supplier
    })
    // an RFQ of the organization and its supplier's requested quote
    out.rfqId = "BOSS_PUR_P17_RFQ_" + side.toUpperCase() + "_" + stamp
    call("create#mantle.request.Request", {
        requestId: out.rfqId,
        requestTypeEnumId: "RqtPurchaseRfq",
        statusId: "ReqSubmitted",
        requestName: `${s.text} RFQ`,
        facilityId: s.facility,
        currencyUomId: "USD",
        filedByPartyId: "BOSS_PUR_BUYER"
    })
    call("create#mantle.request.RequestParty", {requestId: out.rfqId, partyId: s.org, roleTypeId: "OrgInternal", fromDate: since})
    const quote = call("mantle.order.OrderServices.create#Order", {
        customerPartyId: s.org,
        vendorPartyId: s.supplier,
        currencyUomId: "USD",
        facilityId: s.facility,
        orderName: `${s.text} quote`
    })
    out.quoteId = quote.orderId
    call("mantle.order.OrderServices.add#OrderProductQuantity", {
        orderId: quote.orderId,
        orderPartSeqId: quote.orderPartSeqId,
        productId: "DEMO_1_1",
        quantity: 3,
        unitAmount: s.price,
        itemTypeEnumId: "ItemInventory"
    })
    call("update#mantle.order.OrderHeader", {orderId: quote.orderId, statusId: "OrderRequested", supplierQuote: "Y"})
    call("update#mantle.order.OrderPart", {
        orderId: quote.orderId,
        orderPartSeqId: quote.orderPartSeqId,
        statusId: "OrderRequested"
    })
    // an agreement with the supplier
    out.agreementId = "BOSS_PUR_P17_AGR_" + side.toUpperCase() + "_" + stamp
    call("create#mantle.party.agreement.Agreement", {
        agreementId: out.agreementId,
        agreementTypeEnumId: "AgrPurchase",
        statusId: "AgmStDraft",
        organizationPartyId: s.org,
        organizationRoleTypeId: "OrgInternal",
        otherPartyId: s.supplier,
        otherRoleTypeId: "Supplier",
        agreementDate: ec.user.nowTimestamp,
        fromDate: ec.user.nowTimestamp,
        currencyUomId: "USD",
        description: `${s.text} agreement`,
        isTemplate: "N",
        agreementRevision: 1,
        revisionDate: ec.user.nowTimestamp
    })
    // a supplier bill for the order
    out.invoiceId = call("mantle.account.InvoiceServices.create#Invoice", {
        fromPartyId: s.supplier,
        toPartyId: s.org,
        invoiceTypeEnumId: "InvoiceSales",
        currencyUomId: "USD",
        referenceNumber: `P17-${side}-${stamp}`,
        description: `${s.text} bill`
    }).invoiceId
    call("mantle.account.InvoiceServices.create#InvoiceItem", {
        invoiceId: out.invoiceId,
        itemTypeEnumId: "ItemInventory",
        productId: "DEMO_1_1",
        quantity: 2,
        amount: s.price,
        description: `${s.text} bill line`
    })
    // a supplier return
    out.returnId = call("mantle.order.ReturnServices.create#Return", {
        customerPartyId: s.org,
        vendorPartyId: s.supplier,
        currencyUomId: "USD"
    }).returnId
    call("update#mantle.order.return.ReturnHeader", {returnId: out.returnId, supplierRmaId: `${s.text} RMA`})
    // the organization's own purchase price of DEMO_1_1 from its supplier
    // (ended by cleanupSpec: at 8888.88 it would put the later walks' orders from Brightline in the large approval band)
    out.productPriceId = call("create#mantle.product.ProductPrice", {
        productId: "DEMO_1_1",
        vendorPartyId: s.supplier,
        customerPartyId: s.org,
        priceTypeEnumId: "PptCurrent",
        pricePurposeEnumId: "PppPurchase",
        price: s.price,
        priceUomId: "USD",
        minQuantity: 1,
        fromDate: ec.user.nowTimestamp
    }).productPriceId
    return out
}

// the Purchasing routes that show a side's records, with their parameters
function routes(r, side) {
    const s = sides[side]
    const record = {recordEntity: "mantle.order.OrderHeader", recordId: r.orderId}
    return [
        ["Home", {lookupType: "order", lookupId: r.orderId}],
        ["Orders/PurchaseOrders", {}],
        ["Orders/PurchaseOrders", {view: "all", orderId: r.orderId}],
        ["Orders/OrderDetail", {orderId: r.orderId}],
        ["Orders/OrderChanges", {orderId: r.orderId}],
        ["Orders/Acknowledgements", {}],
        ["Chatter", record, "qvt"],
        ["RecordFiles", record, "qvt"],
        ["Requests/PurchaseRequests", {}],
        ["Requests/RequestDetail", {requestId: r.requestId}],
        ["Requests/RequestSourcing", {requestId: r.requestId}],
        ["Sourcing/QuoteRequests", {}],
        ["Sourcing/QuoteRequestDetail", {requestId: r.rfqId}],
        ["Sourcing/QuoteComparison", {requestId: r.rfqId}],
        ["Sourcing/Award", {requestId: r.rfqId}],
        ["Sourcing/Quotes", {}],
        ["Sourcing/QuoteDetail", {orderId: r.quoteId}],
        ["Agreements/AgreementList", {}],
        ["Agreements/AgreementDetail", {agreementId: r.agreementId}],
        ["Suppliers/SupplierList", {}],
        ["Suppliers/Supplier360", {vendorPartyId: s.supplier}],
        ["Suppliers/SupplierPrices", {productId: "DEMO_1_1"}],
        ["Suppliers/PriceExplain", {productId: "DEMO_1_1", vendorPartyId: s.supplier, organizationPartyId: s.org}],
        ["Products/Product360", {productId: "DEMO_1_1"}],
        ["Receiving/Receipts", {}],
        ["Receiving/ShipmentDetail", {shipmentId: r.shipmentId}],
        ["Bills/BillList", {}],
        ["Bills/InvoiceDetail", {invoiceId: r.invoiceId}],
        ["Bills/InvoiceMatch", {invoiceId: r.invoiceId}],
        ["Bills/MatchExceptions", {}],
        ["Returns/SupplierReturns", {}],
        ["Returns/ReturnDetail", {returnId: r.returnId}],
        ["Returns/ReturnAuthorization", {returnId: r.returnId}, "html-print"],
        ["Approvals", {}],
        ["Performance/Spend", {organizationPartyId: s.org}],
        ["Performance/Commitments", {organizationPartyId: s.org}],
        ["Performance/ProcurementTracker", {requestId: r.requestId}],
        ["Performance/PurchaseHistory", {productId: "DEMO_1_1"}],
        ["Performance/SupplierStatement", {supplierPartyId: s.supplier, organizationPartyId: s.org}]
    ].map(([path, parameters, mode]) => ({path, parameters, mode: mode || "html"}))
}
const routeName = route => `${route.path} ${route.mode} ${JSON.stringify(route.parameters)}`
// the routes required to show a side's records to its own reader or john.doe (the positive control)
const requiredShown = [
    "Orders/OrderDetail",
    "Orders/PurchaseOrders",
    "Requests/RequestDetail",
    "Sourcing/QuoteRequestDetail",
    "Sourcing/QuoteDetail",
    "Agreements/AgreementDetail",
    "Bills/InvoiceDetail",
    "Returns/ReturnDetail"
]

spec({
    setupSpec() {
        login("john.doe")
        system(() => {
            state.retail = records("retail")
            state.services = records("services")
            standaloneUser(STANDALONE, [
                "BOSS_PURCHASING",
                "BOSS_PURCHASING_BUYER",
                "BOSS_WAREHOUSE_RECEIVE",
                "BOSS_ACCOUNTING_MATCH"
            ])
            // Retail's standard cost of DEMO_1_1, which no Purchasing user may read
            call("create#mantle.product.cost.ProductStandardCost", {
                productStandardCostId: "BOSS_PUR_P17_COST_" + stamp,
                productId: "DEMO_1_1",
                organizationPartyId: ids.organizationId,
                quantity: 1,
                quantityUomId: "OTH_ea",
                priceUomId: "USD",
                state: "draft",
                materialCost: "6666.66",
                laborCost: 0,
                machineCost: 0,
                overheadCost: 0,
                outsideCost: 0,
                totalCost: "6666.66",
                unitCost: "6666.66",
                materialBasis: "manual",
                overheadBasis: "none",
                complete: "Y",
                findingsJson: "[]",
                changeReason: "P17 access walk"
            })
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        // the sides' purchase prices end with the walk; the specs after it in a shared database price DEMO_1_1 as before
        for (const side of ["retail", "services"])
            if (state[side]?.productPriceId)
                call("update#mantle.product.ProductPrice", {
                    productPriceId: state[side].productPriceId,
                    thruDate: ec.user.nowTimestamp
                })
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("each Purchasing user opens Purchasing and none of the other app roots", {
    when() {
        const problems = []
        for (const username of retailUsers.concat([users.services, STANDALONE])) {
            const home = page(username, "Home", {})
            if (home.status != 200 || home.errors.length) problems.push(`${username} cannot open Purchasing: ${home.errors}`)
            asUser(username, () => {
                for (const root of otherRoots) {
                    // the demo's receiving buyer is in Warehouse's root group as well (BossUsersDemoData.xml); the walk's
                    // standalone buyer holds the receive group without it
                    if (username === users.buyReceive && root === "Warehouse") continue
                    const other = render(root, "", {})
                    if (other.status == 200 && !other.errors) problems.push(`${username} opens the ${root} app`)
                }
            })
        }
        // the roots open for a user granted them, so a refusal above is not a broken render
        const opened = asUser("john.doe", () =>
            otherRoots.filter(root => {
                const got = render(root, "", {})
                return got.status == 200 && !got.errors
            })
        )
        if (problems.length) log.warn("Purchasing access walk problems:\n" + problems.join("\n"))
        return {problems, opened}
    },
    then({problems, opened}) {
        problems.join("\n") == ""
        opened.length >= 6
    }
})

feature("neither side's users see the other's records on a Purchasing route, shared mount or record panel, html or terminal", {
    when() {
        const problems = []
        const shownPaths = {}
        for (const [side, other, sweep] of [
            ["services", "retail", sweepUsers.concat([STANDALONE])],
            ["retail", "services", [users.services]]
        ]) {
            const s = sides[side]
            const all = routes(state[side], side)
            // which routes show the side's records to its own reader or to john.doe
            const shown = all.filter(
                route =>
                    s.pattern.test(page(s.reader, route.path, route.parameters, route.mode).output) ||
                    s.pattern.test(page("john.doe", route.path, route.parameters, route.mode).output)
            )
            shownPaths[side] = [...new Set(shown.map(route => route.path))]
            log.info(
                `Routes that show no ${side} record to its reader or john.doe:\n` +
                    all
                        .filter(route => !shown.includes(route))
                        .map(routeName)
                        .join("\n")
            )
            // the other side's users, on every route (not only the shown ones), and a reader in the terminal too
            for (const username of sweep)
                for (const route of all) {
                    const modes = [route.mode].concat(
                        (username === users.read || username === users.services) && route.mode === "html" ? ["tui"] : []
                    )
                    for (const mode of modes) {
                        const got = page(username, route.path, route.parameters, mode)
                        if (s.pattern.test(got.output)) problems.push(`${username} sees ${side}'s ${routeName(route)} (${mode})`)
                    }
                }
        }
        if (problems.length) log.warn("Purchasing access walk problems:\n" + problems.join("\n"))
        return {problems, shownPaths}
    },
    then({problems, shownPaths}) {
        problems.join("\n") == ""
        requiredShown.filter(path => !shownPaths.retail.includes(path)) == []
        requiredShown.filter(path => !shownPaths.services.includes(path)) == []
    }
})

feature("exports and prints of each side hold only its rows", {
    when() {
        const problems = []
        const reports = [
            ["get#PurchaseSpend", {groupBy: "supplier"}],
            ["get#PurchaseSpend", {groupBy: "product"}],
            ["get#PurchaseCommitments", {}],
            ["get#PurchaseHistory", {productId: "DEMO_1_1"}]
        ]
        const csvOf = (username, service, parameters) =>
            read(
                username,
                "ironstone.purchasing.ReportServices." + service,
                Object.assign({appRoot: "Purchasing", output: "csv"}, parameters)
            )
        const own = {}
        for (const [side, other, sweep] of [
            ["services", "retail", [users.read, users.buyer, users.buyMatch, STANDALONE]],
            ["retail", "services", [users.services]]
        ]) {
            const s = sides[side]
            for (const username of sweep) {
                for (const [service, parameters] of reports) {
                    const csv = csvOf(username, service, parameters)
                    if (s.pattern.test(JSON.stringify(csv.answer || {})))
                        problems.push(`${username} exports ${side}'s ${service}`)
                    if (sides[other].pattern.test(csv.answer?.csvText || "")) own[username] = true
                }
                // the prints: a purchase order, an RFQ and an agreement of the side
                for (const [service, parameters] of [
                    ["mantle.order.OrderServices.get#PurchaseOrderPrint", {orderId: state[side].orderId}],
                    ["mantle.order.SourcingServices.get#QuoteRequestPrint", {requestId: state[side].rfqId}],
                    ["mantle.party.AgreementServices.get#PurchaseAgreementPrint", {agreementId: state[side].agreementId}]
                ]) {
                    const printed = read(username, service, parameters)
                    if (s.pattern.test(printed.printHtml || "")) problems.push(`${username} prints ${side}'s ${service}`)
                }
            }
        }
        // the control: john.doe prints each side's order
        const controls = ["retail", "services"].map(side =>
            sides[side].pattern.test(
                read("john.doe", "mantle.order.OrderServices.get#PurchaseOrderPrint", {orderId: state[side].orderId}).printHtml ||
                    ""
            )
        )
        if (problems.length) log.warn("Purchasing access walk problems:\n" + problems.join("\n"))
        return {problems, controls, own}
    },
    then({problems, controls, own}) {
        problems.join("\n") == ""
        controls == [true, true]
    }
})

feature("the palette, record links and drop-downs keep each side to its records", {
    when() {
        const problems = []
        const access = "ironstone.purchasing.AccessServices."
        const found = {}
        for (const [side, mine, sweep] of [
            ["services", "retail", sweepUsers.concat([STANDALONE])],
            ["retail", "services", [users.services]]
        ]) {
            const s = sides[side],
                r = state[side]
            for (const username of sweep) {
                // the palette: by the other side's ids and its text
                for (const text of [r.orderId, r.quoteId, s.text, s.supplier, "P17"]) {
                    const palette = read(username, access + "search#Records", {text, limit: 50}, true)
                    const hit = Array.from(palette.rows || []).filter(
                        row =>
                            s.pattern.test(JSON.stringify(row)) ||
                            [r.orderId, r.quoteId, s.supplier].some(id => String(row.url || "").includes("=" + id))
                    )
                    if (hit.length) problems.push(`${username} finds ${text} in the palette`)
                }
                // record links of the other side's records
                for (const [recordEntityName, id] of [
                    ["mantle.order.OrderHeader", r.orderId],
                    ["mantle.order.OrderHeader", r.quoteId],
                    ["mantle.request.Request", r.requestId],
                    ["mantle.request.Request", r.rfqId],
                    ["mantle.party.agreement.Agreement", r.agreementId],
                    ["mantle.account.invoice.Invoice", r.invoiceId],
                    ["mantle.order.return.ReturnHeader", r.returnId]
                ]) {
                    const link = read(username, "ironstone.commons.PaletteServices.get#RecordLink", {recordEntityName, id}, true)
                    if (link.url && /Purchasing/.test(link.url)) problems.push(`${username} has a link to ${id}: ${link.url}`)
                }
                // the drop-downs: suppliers and organizations, by term and as a selected value
                for (const [choice, extra] of [
                    ["suppliers", {term: ""}],
                    ["suppliers", {term: "zzz-none", selected: s.supplier}],
                    ["organizations", {}],
                    ["billOrders", {partyId: s.supplier}]
                ]) {
                    const options = Array.from(
                        read(username, access + "get#Choices", Object.assign({choice}, extra), true).options || []
                    )
                    if (
                        options.some(
                            option => option.value === s.supplier || option.value === s.org || option.value === r.orderId
                        )
                    )
                        problems.push(`${username} gets ${choice} ${JSON.stringify(extra)} of ${side}`)
                }
                // universal search is not checked here: a test runtime has no index, so it answers nothing for either
                // side (F-P17-3); the palette above, with its own-side control, is the search check
            }
            // the control: each side's own reader finds its order in the palette and gets its link
            const reader = sides[mine].reader
            found[mine] = {
                palette: Array.from(
                    read(reader, access + "search#Records", {text: state[mine].orderId, limit: 20}, true).rows || []
                ).length,
                link: read(
                    reader,
                    "ironstone.commons.PaletteServices.get#RecordLink",
                    {
                        recordEntityName: "mantle.order.OrderHeader",
                        id: state[mine].orderId
                    },
                    true
                ).url
            }
        }
        if (problems.length) log.warn("Purchasing access walk problems:\n" + problems.join("\n"))
        return {problems, found}
    },
    then({problems, found}) {
        problems.join("\n") == ""
        found.retail.palette > 0
        found.services.palette > 0
        found.retail.link == "/qapps/Purchasing/Orders/OrderDetail?orderId=" + state.retail.orderId
        found.services.link == "/qapps/Purchasing/Orders/OrderDetail?orderId=" + state.services.orderId
    }
})

feature("no Purchasing user sees a standard cost, a bill's payments or another organization's price, or posts finance or stock", {
    when() {
        const problems = []
        // the standard cost: Product360's Summary and Costs under Purchasing, for every user (john.doe sees it under Products)
        for (const username of retailUsers.concat([STANDALONE]))
            for (const path of ["Products/Product360", "Products/Product360/Summary", "Products/Product360/Costs"]) {
                const got = page(username, path, {productId: "DEMO_1_1", organizationPartyId: ids.organizationId})
                if (COST.test(got.output)) problems.push(`${username} sees the standard cost on ${path}`)
            }
        const costControl = asUser("john.doe", () =>
            COST.test(
                render("Products", "Products/Product360/Costs", {productId: "DEMO_1_1", organizationPartyId: ids.organizationId})
                    .output
            )
        )
        // a bill's payments and unpaid amounts: withheld from a buyer, shown to the buyer who also holds the match group
        // (PAYABLE_VIEW); never shown as zero
        const detail = username =>
            read(username, "ironstone.purchasing.BillServices.get#BillDetail", {
                appRoot: "Purchasing",
                invoiceId: state.retail.invoiceId
            })
        const buyerBill = detail(users.buyer)
        const matcherBill = detail(users.buyMatch)
        // another organization's supplier price: Retail's buyer's price of DEMO_1_1 from Services' supplier is none of its own
        const price = username =>
            read(username, "mantle.product.PriceServices.get#ProductPrice", {
                productId: "DEMO_1_1",
                vendorPartyId: sides.services.supplier,
                customerPartyId: ids.organizationId,
                pricePurposeEnumId: "PppPurchase",
                quantity: 1,
                currencyUomId: "USD"
            })
        const buyerPrice = price(users.buyer)
        if (sides.services.pattern.test(JSON.stringify(buyerPrice))) problems.push("the buyer gets Services' price")
        // posting: finance and stock verbs the Purchasing groups do not hold, with the service's own permission check, each
        // on a real record so the refusal is the permission's, not a missing record's (P17 review: a hold and a transaction
        // that did not exist were refused as "not available"). post#AcctgTrans is left out: a manual posting's authority is
        // the posting guard's (REVIEW_REQUIRED), not a permission refusal; the Accounting walks cover it
        const holdId = "BOSS_PUR_P17_HOLD"
        if (!one("mantle.account.invoice.InvoiceHold", {invoiceHoldId: holdId}))
            call("create#mantle.account.invoice.InvoiceHold", {
                invoiceHoldId: holdId,
                invoiceId: state.retail.invoiceId,
                holdComment: "P17 access walk",
                placedByUserId: "EX_JOHN_DOE",
                placedDate: ec.user.nowTimestamp
            })
        const verbs = [
            [
                "mantle.account.InvoiceServices.approve#Payable",
                {
                    invoiceId: state.retail.invoiceId,
                    lastUpdatedStamp: one("mantle.account.invoice.Invoice", {invoiceId: state.retail.invoiceId}).lastUpdatedStamp
                }
            ],
            ["mantle.account.InvoiceServices.release#InvoiceHold", {invoiceHoldId: holdId, releaseComment: "P17 access walk"}],
            [
                "mantle.shipment.WarehouseTaskServices.receive#ShipmentStock",
                {operationKey: key(), shipmentId: state.retail.shipmentId, productId: "DEMO_1_1", quantityAccepted: 1}
            ]
        ]
        const refusals = {}
        for (const username of retailUsers.filter(user => user !== users.buyReceive))
            for (const [service, parameters] of verbs) {
                const got = read(username, service, parameters)
                refusals[`${username} ${service}`] = got.error
                if (!/PERMISSION_DENIED|ACCESS_DENIED|is not authorized|FORBIDDEN/.test(got.error))
                    problems.push(`${username} ${service}: ${got.error || "accepted"}`)
            }
        const received = rows("mantle.product.receipt.AssetReceipt", {shipmentId: state.retail.shipmentId}).length
        const holdReleased = !!one("mantle.account.invoice.InvoiceHold", {invoiceHoldId: holdId}).releasedDate
        call("delete#mantle.account.invoice.InvoiceHold", {invoiceHoldId: holdId})
        if (problems.length) log.warn("Purchasing access walk problems:\n" + problems.join("\n"))
        return {problems, costControl, buyerBill, matcherBill, received, holdReleased}
    },
    then({problems, costControl, buyerBill, matcherBill, received, holdReleased}) {
        holdReleased == false
        problems.join("\n") == ""
        costControl == true
        buyerBill.error == ""
        matcherBill.error == ""
        !JSON.stringify(buyerBill).includes('"paymentRows":[{')
        received == 0
    }
})

feature("the Supplier app shows neither organization's internal records nor another organization's prices", {
    when() {
        const problems = []
        const P = "mantle.order.SupplierPortalServices."
        const siteId = "ZIZI_PORTAL"
        // a page's operation as PASS calls it, signed out (or as the supplier contact)
        const portal = (service, input, username = null) => {
            if (username) login(username)
            else logout()
            try {
                return (
                    ec.service
                        .sync()
                        .throwOnError(true)
                        .name(P + service)
                        .parameters({input: Object.assign({siteId}, input)})
                        .requireNewTransaction(true)
                        .call().result || {}
                )
            } catch (error) {
                ec.message.clearErrors()
                return {errorKind: error.moquiErrorKind || "Error", errorMessage: String(error.message)}
            } finally {
                login("john.doe")
            }
        }
        const quoteToken = "ZiziPortalDemoQuoteResponseLink00000000000001"
        const orderToken = "ZiziPortalDemoOrderAcknowledgeLink000000000001"
        const answers = {
            homeByLink: portal("get#SupplierHome", {token: orderToken}),
            quote: portal("get#QuoteInvitation", {token: quoteToken}),
            order: portal("get#PublishedPurchaseOrder", {token: orderToken}),
            // a forged record in the input: the link's own order only
            orderForged: portal("get#PublishedPurchaseOrder", {token: orderToken, orderId: state.services.orderId}),
            homeSignedIn: portal("get#SupplierHome", {}, "ziddleman.billing"),
            otherOrder: portal("get#PublishedPurchaseOrder", {token: "f".repeat(46), orderId: state.retail.orderId})
        }
        for (const [name, answer] of Object.entries(answers)) {
            const text = JSON.stringify(answer)
            for (const side of ["retail", "services"])
                if (sides[side].pattern.test(text)) problems.push(`the Supplier app's ${name} shows ${side}'s records`)
            if (COST.test(text)) problems.push(`the Supplier app's ${name} shows the standard cost`)
        }
        if (problems.length) log.warn("Purchasing access walk problems:\n" + problems.join("\n"))
        return {problems, answers}
    },
    then({problems, answers}) {
        problems.join("\n") == ""
        !answers.homeByLink.errorKind
        !answers.order.errorKind
        !answers.homeSignedIn.errorKind
        // a record named beside the link is refused, never answered
        answers.orderForged.errorKind == "NotFound"
        answers.otherOrder.errorKind == "NotFound"
    }
})

feature("a buyer with the receive and match groups and neither root receives and matches from Purchasing's shared mounts", {
    when() {
        const s = sides.retail
        // Retail's approved order of ten from Ziddleman at 9.00 and its expected receipt; its bill for eight at 9.50
        const order = system(() => {
            const o = call("mantle.order.OrderServices.create#Order", {
                customerPartyId: s.org,
                vendorPartyId: ids.sharedSupplierId,
                currencyUomId: "USD",
                facilityId: s.facility,
                orderName: "P17 standalone order " + stamp
            })
            const orderItemSeqId = call("mantle.order.OrderServices.add#OrderProductQuantity", {
                orderId: o.orderId,
                orderPartSeqId: o.orderPartSeqId,
                productId: "DEMO_1_1",
                quantity: 10,
                unitAmount: 9,
                itemTypeEnumId: "ItemInventory"
            }).orderItemSeqId
            call("mantle.order.OrderServices.place#Order", {orderId: o.orderId})
            call("mantle.order.OrderServices.approve#Order", {orderId: o.orderId})
            const shipmentId = call("mantle.shipment.ShipmentServices.create#OrderPartShipment", {
                orderId: o.orderId,
                orderPartSeqId: o.orderPartSeqId,
                destinationFacilityId: s.facility
            }).shipmentId
            return {orderId: o.orderId, orderItemSeqId, shipmentId}
        })
        const roots = ["Warehouse", "Accounting"].filter(root =>
            asUser(STANDALONE, () => {
                const got = render(root, "", {})
                return got.status == 200 && !got.errors
            })
        )
        // receiving: the plain buyer is refused, the standalone buyer receives 8 from Purchasing's ShipmentDetail
        const line = {shipmentId: order.shipmentId, productId: "DEMO_1_1", quantityAccepted: "8"}
        const path = "Receiving/ShipmentDetail/purchaseReceive"
        const buyerReceive = post(users.buyer, path, Object.assign({operationKey: key()}, line))
        const receive = post(STANDALONE, path, Object.assign({operationKey: key()}, line))
        const receipts = rows("mantle.product.receipt.AssetReceipt", {shipmentId: order.shipmentId})
        // the bill, uploaded by the plain buyer from Bills, its line keyed by AP
        const reference = "P17-STANDALONE-" + stamp
        const upload = post(users.buyer, "Bills/BillList/uploadBill", {
            organizationPartyId: s.org,
            supplierPartyId: ids.sharedSupplierId,
            orderId: order.orderId,
            referenceNumber: reference,
            operationKey: key()
        })
        const invoiceId = rows("mantle.account.invoice.Invoice", {referenceNumber: reference})[0]?.invoiceId
        system(() =>
            call("mantle.account.InvoiceServices.create#InvoiceItem", {
                invoiceId,
                itemTypeEnumId: "ItemInventory",
                productId: "DEMO_1_1",
                quantity: 8,
                amount: "9.50"
            })
        )
        // matching: the plain buyer is refused, the standalone buyer applies the 8 from Purchasing's InvoiceMatch
        const allocation = {
            invoiceId,
            organizationPartyId: s.org,
            sourceKey_0: [
                rows("mantle.account.invoice.InvoiceItem", {invoiceId})[0]?.invoiceItemSeqId,
                order.orderId,
                order.orderItemSeqId,
                receipts[0]?.assetReceiptId
            ].join("|"),
            quantity_0: "8"
        }
        const buyerMatch = post(users.buyer, "Bills/InvoiceMatch/applyMatch", allocation)
        const match = post(STANDALONE, "Bills/InvoiceMatch/applyMatch", allocation)
        const billed = rows("mantle.order.OrderItemBilling", {invoiceId})
        // the price variance holds the bill; the plain buyer asks for its release (the handoff) and cannot release it
        const hold = rows("mantle.account.invoice.InvoiceHold", {invoiceId}).filter(row => !row.releasedDate)[0]
        const ask = hold
            ? post(users.buyer, "Bills/InvoiceDetail/billRequestRelease", {
                  invoiceId,
                  invoiceHoldId: hold.invoiceHoldId,
                  releaseRequestNote: "P17: the supplier credits the difference"
              })
            : {errors: "no hold"}
        const release = hold
            ? read(STANDALONE, "mantle.account.InvoiceServices.release#InvoiceHold", {invoiceHoldId: hold.invoiceHoldId}).error
            : "no hold"
        return {roots, buyerReceive, receive, receipts, upload, buyerMatch, match, billed, ask, release}
    },
    then({roots, buyerReceive, receive, receipts, upload, buyerMatch, match, billed, ask, release}) {
        roots == []
        buyerReceive.errors.includes("PERMISSION_DENIED")
        receive.errors == ""
        receipts.length == 1
        String(receipts[0].quantityAccepted) == "8"
        upload.errors == ""
        buyerMatch.errors.includes("PERMISSION_DENIED")
        match.errors == ""
        billed.length == 1
        ask.errors == ""
        release.includes("PERMISSION_DENIED")
    }
})
