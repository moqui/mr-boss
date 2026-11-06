// The Customer Service access and isolation walk (design-customer-service §10 "Unauthorized actions, cancellations, closed
// period and standalone use", crosscut §6 standalone operation, impl-customer-service P16), an acceptance test with artifact
// authorization on, on PurchasingAccessWalk's pattern. Each side, Ziziwork Retail and Ziziwork Services, has its demo case,
// customer and order, and the walk adds an internal note with a secret text to each side's case; Retail's thermostat gets a
// standard cost and a supplier price with odd amounts. Then:
// - each Customer Service demo user opens Customer Service and none of eight other app roots, the W agent (Warehouse's receive
//   and inspect groups) and the F authorizer (Accounting's receivables group) included;
// - the other side's users never see a side's records on the Customer Service routes that show them to its own user or to
//   john.doe (URLs with the record's id, the shared mounts, Chatter and RecordFiles, the case summary, html and for a reader
//   the terminal), nor in the reports' CSV exports or the case summary print, the palette, record links, the drop-downs or
//   their notifications (universal search has no index in a test runtime, impl-purchasing F187);
// - no Customer Service user sees the standard cost or the supplier price, and none may approve a payable, release an invoice
//   hold or receive stock without the group that grants it;
// - the W and F users work from Customer Service's shared mounts (ReturnDetail, QualityInspection, InvoiceDetail) without the
//   Warehouse or Accounting root; their receipt and settlement are CustomerServiceReturnsWalk's;
// - a customer contact (the Support app's demo accounts, PASS public accounts holding no BOSS group) reaches nothing in BOSS: no
//   app root, Commons and Comms included (F216; every BOSS app requires a UserGroup, impl-drawers-commons R29), no case record
//   on a refused Commons or Comms page, no launcher entry, no ironstone.customerservice service and no staff case print; the
//   Support app's isolation between customers is mr-pass's SupportIsolation.
// The later features read what setupSpec adds. Run: ./moq accept mr-boss --spec CustomerServiceAccessWalk
const lib = ec.resource.script("component://mr-boss/test/CustomerService/CustomerServiceSpecLib.js")
const {ids, users, asUser, system, invoke, shell} = lib
const webroot = "component://webroot/screen/webroot.xml"
const since = "2000-01-01T00:00:00Z"
const stamp = ec.l10n.format(ec.user.nowTimestamp, "HHmmssSSS")
const find = (entity, conditions = {}) => ec.entity.find(entity).condition(conditions).disableAuthz()
const one = (entity, conditions) => find(entity, conditions).one()
const rows = (entity, conditions) => Array.from(find(entity, conditions).list())
const call = (service, parameters) => ec.service.sync().name(service).parameters(parameters).disableAuthz().call() || {}
// a number shown as itself, not inside a longer one
const amount = text => `(^|[^\\d.,])${text.replace(/\./g, "\\.")}([^\\d]|$)`
const COST = new RegExp(amount("6,?666.66") + "|" + amount("5,?555.55"))

// the two sides: the organization, its demo records, the secret on its case and the texts that only its users may see
const sides = {
    retail: {
        org: ids.organizationId,
        caseId: ids.thermostatCaseId,
        customerId: ids.customerId,
        orderId: ids.deliveredOrderId,
        returnId: ids.warehouseReturnId,
        queueText: "Support",
        text: "P16 Retail secret " + stamp,
        pattern: new RegExp(`P16 Retail secret|Thermostat shows the wrong temperature|Thermostat and filters`),
        reader: users.read
    },
    services: {
        org: ids.otherOrganizationId,
        caseId: ids.otherCaseId,
        customerId: ids.otherCustomerId,
        orderId: ids.otherOrderId,
        returnId: null,
        queueText: "Services support",
        text: "P16 Services secret " + stamp,
        pattern: new RegExp(
            `P16 Services secret|Office supplies invoice question|Services office supplies|Services Office Customer`
        ),
        reader: users.services
    }
}
// Retail's Customer Service demo users of every group (the W agent and the F authorizer among them)
const retailUsers = [
    users.agent,
    users.manager,
    users.orderDesk,
    users.returns,
    users.knowledge,
    users.admin,
    users.agentWarehouse,
    users.returnsReceivables,
    users.read
]
// the users of the isolation sweeps: Retail's but the Customer Service administrator, whose MANTLE_ACTIVE_ORG grant works in
// every organization when none is active, by design (CustomerService.js grants, as impl-purchasing F185's administrator)
const sweepUsers = retailUsers.filter(username => username !== users.admin)
const otherRoots = ["Products", "Accounting", "Sales", "Warehouse", "Manufacturing", "Purchasing", "Projects", "Admin"]
// the Support app's demo customer accounts (BossCustomerServiceDemoData: Joe's Distributing's contact and its administrator,
// Joe Q Public's own account)
const contacts = ["dana@joesdist.example.com", "morgan@joesdist.example.com", "joe@public.com"]
const state = {}

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
const opens = got => got.status == 200 && !got.errors
// a service as the screens call it, as the user (authorization off unless enabled): its result, or {error}
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

// the Customer Service routes that show a side's records, with their parameters
function routes(s) {
    const record = {recordEntity: "mantle.request.Request", recordId: s.caseId}
    return [
        ["Home", {lookupType: "order", lookupId: s.orderId}],
        ["Cases/Cases", {view: "all"}],
        ["Cases/CaseDetail", {requestId: s.caseId}],
        ["Cases/CaseDetail", {requestId: s.caseId, tab: "overview"}],
        ["Cases/CaseSummary", {requestId: s.caseId, audience: "internal"}],
        ["Cases/MergeCases", {requestId: s.caseId}],
        ["Cases/SplitCase", {requestId: s.caseId}],
        ["Cases/ChannelSessions", {}],
        ["Chatter", record, "qvt"],
        ["RecordFiles", record, "qvt"],
        ["Customers/Customers", {}],
        ["Customers/Customer360", {customerPartyId: s.customerId}],
        ["Customers/Customer360/ServiceCases", {customerPartyId: s.customerId}],
        ["Customers/Customer360/ServiceOrders", {customerPartyId: s.customerId}],
        ["Customers/ContactDetail", {partyId: s.customerId}],
        ["Orders/Orders", {term: s.orderId}],
        ["Orders/OrderDetail", {orderId: s.orderId}],
        ["Orders/OrderChanges", {}],
        ["Returns/Returns", {view: "all"}],
        ["Returns/WarrantyClaims", {}],
        ["Reports/CaseAnalytics", {requestId: s.caseId}],
        ["Knowledge/CaseToArticle", {requestId: s.caseId}],
        ["Approvals", {}]
    ]
        .concat(
            s.returnId
                ? [
                      ["Returns/ReturnDetail", {returnId: s.returnId}],
                      ["Returns/ReturnAuthorization", {returnId: s.returnId}, "html-print"]
                  ]
                : []
        )
        .map(([path, parameters, mode]) => ({path, parameters, mode: mode || "html"}))
}
const routeName = route => `${route.path} ${route.mode} ${JSON.stringify(route.parameters)}`
// the routes required to show a side's records to its own user or john.doe (the positive control)
const requiredShown = ["Cases/CaseDetail", "Cases/CaseSummary", "Customers/Customer360/ServiceCases", "Orders/OrderDetail"]

spec({
    setupSpec() {
        login("john.doe")
        system(() => {
            for (const side of ["retail", "services"]) {
                const s = sides[side]
                const note = call("create#mantle.party.communication.CommunicationEvent", {
                    communicationEventTypeId: "Comment",
                    statusId: "CeReceived",
                    fromPartyId: "EX_JOHN_DOE",
                    body: s.text,
                    entryDate: ec.user.nowTimestamp
                }).communicationEventId
                call("create#mantle.request.RequestCommEvent", {requestId: s.caseId, communicationEventId: note})
                state[side] = {noteId: note}
            }
            // Retail's standard cost and a supplier's price of the thermostat, which no Customer Service user may read
            state.costId = call("create#mantle.product.cost.ProductStandardCost", {
                productStandardCostId: "BOSS_CS_P16_COST_" + stamp,
                productId: ids.serializedProductId,
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
                changeReason: "P16 access walk"
            }).productStandardCostId
            state.priceId = call("create#mantle.product.ProductPrice", {
                productId: ids.serializedProductId,
                vendorPartyId: "ZiddlemanInc",
                customerPartyId: ids.organizationId,
                priceTypeEnumId: "PptCurrent",
                pricePurposeEnumId: "PppPurchase",
                price: "5555.55",
                priceUomId: "USD",
                minQuantity: 1,
                fromDate: ec.user.nowTimestamp
            }).productPriceId
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        system(() => {
            for (const side of ["retail", "services"]) {
                const noteId = state[side]?.noteId
                if (!noteId) continue
                find("mantle.request.RequestCommEvent", {communicationEventId: noteId}).deleteAll()
                find("mantle.party.communication.CommunicationEvent", {communicationEventId: noteId}).deleteAll()
            }
            if (state.costId) find("mantle.product.cost.ProductStandardCost", {productStandardCostId: state.costId}).deleteAll()
            if (state.priceId) find("mantle.product.ProductPrice", {productPriceId: state.priceId}).deleteAll()
            if (state.billId) find("mantle.account.invoice.Invoice", {invoiceId: state.billId}).deleteAll()
        })
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("each Customer Service user opens Customer Service and none of the other app roots, W and F included", {
    when() {
        const problems = []
        for (const username of retailUsers.concat([users.services])) {
            const home = page(username, "Home", {})
            if (home.status != 200 || home.errors.length)
                problems.push(`${username} cannot open Customer Service: ${home.errors}`)
            asUser(username, () => {
                for (const root of otherRoots) if (opens(render(root, "", {}))) problems.push(`${username} opens the ${root} app`)
            })
        }
        // the roots open for a user granted them, so a refusal above is not a broken render
        const opened = asUser("john.doe", () => otherRoots.filter(root => opens(render(root, "", {}))))
        if (problems.length) log.warn("Customer Service access walk problems:\n" + problems.join("\n"))
        return {problems, opened}
    },
    then({problems, opened}) {
        problems.join("\n") == ""
        opened.length >= 6
    }
})

feature(
    "neither side's users see the other's records on a Customer Service route, shared mount or record panel, html or terminal",
    {
        when() {
            const problems = []
            const shownPaths = {}
            for (const [side, sweep] of [
                ["services", sweepUsers],
                ["retail", [users.services]]
            ]) {
                const s = sides[side]
                const all = routes(s)
                // which routes show the side's records to its own user or to john.doe
                const shown = all.filter(
                    route =>
                        s.pattern.test(page(s.reader, route.path, route.parameters, route.mode).output) ||
                        s.pattern.test(page("john.doe", route.path, route.parameters, route.mode).output)
                )
                shownPaths[side] = [...new Set(shown.map(route => route.path))]
                log.info(
                    `Routes that show no ${side} record to its user or john.doe:\n` +
                        all
                            .filter(route => !shown.includes(route))
                            .map(routeName)
                            .join("\n")
                )
                // the other side's users, on every route, and a reader in the terminal too
                for (const username of sweep)
                    for (const route of all) {
                        const modes = [route.mode].concat(
                            (username === users.read || username === users.services) && route.mode === "html" ? ["tui"] : []
                        )
                        for (const mode of modes) {
                            const got = page(username, route.path, route.parameters, mode)
                            if (s.pattern.test(got.output))
                                problems.push(`${username} sees ${side}'s ${routeName(route)} (${mode})`)
                        }
                    }
            }
            if (problems.length) log.warn("Customer Service access walk problems:\n" + problems.join("\n"))
            return {problems, shownPaths}
        },
        then({problems, shownPaths}) {
            problems.join("\n") == ""
            requiredShown.filter(path => !shownPaths.retail.includes(path)) == []
            requiredShown.filter(path => !shownPaths.services.includes(path)) == []
        }
    }
)

feature("the reports' exports and the case summary print of each side hold only its rows", {
    when() {
        const problems = []
        const R = "ironstone.customerservice.ReportingServices."
        const reports = [
            ["get#CaseVolumes", {groupBy: "queue"}],
            ["get#SlaCompliance", {}],
            ["get#ResponseTimes", {}],
            ["get#ReturnAnalysis", {}]
        ]
        let exported = 0
        for (const [side, other, sweep] of [
            ["services", "retail", [users.manager, users.read, users.agent]],
            ["retail", "services", [users.services]]
        ]) {
            const s = sides[side]
            for (const username of sweep) {
                for (const [service, parameters] of reports) {
                    const csv = read(
                        username,
                        R + service,
                        Object.assign({appRoot: "CustomerService", output: "csv"}, parameters)
                    )
                    const text = JSON.stringify(csv.answer || {})
                    if (csv.answer?.csvText) exported++
                    if (s.pattern.test(text) || text.includes(s.queueText + ","))
                        problems.push(`${username} exports ${side}'s ${service}`)
                }
                // the case summary of the other side's case, customer and internal
                for (const audience of ["customer", "internal"]) {
                    const printed = read(username, "mantle.request.SupportCaseServices.get#CaseSummaryPrint", {
                        requestId: s.caseId,
                        audience
                    })
                    if (s.pattern.test(printed.printHtml || ""))
                        problems.push(`${username} prints ${side}'s case summary (${audience})`)
                }
            }
        }
        // the control: john.doe prints each side's internal summary with its secret
        const controls = ["retail", "services"].map(side =>
            (
                read("john.doe", "mantle.request.SupportCaseServices.get#CaseSummaryPrint", {
                    requestId: sides[side].caseId,
                    audience: "internal"
                }).printHtml || ""
            ).includes(sides[side].text)
        )
        if (problems.length) log.warn("Customer Service access walk problems:\n" + problems.join("\n"))
        return {problems, controls, exported}
    },
    then({problems, controls, exported}) {
        problems.join("\n") == ""
        controls == [true, true]
        exported > 0
    }
})

feature("the palette, record links, drop-downs and notifications keep each side to its records", {
    when() {
        const problems = []
        const access = "ironstone.customerservice.AccessServices."
        for (const [side, sweep] of [
            ["services", sweepUsers],
            ["retail", [users.services]]
        ]) {
            const s = sides[side]
            for (const username of sweep) {
                for (const text of [s.orderId, s.caseId, s.customerId, s.text, "P16", "Office", "Thermostat"]) {
                    const palette = read(username, access + "search#Records", {text, limit: 50}, true)
                    const hit = Array.from(palette.rows || []).filter(
                        row =>
                            s.pattern.test(JSON.stringify(row)) ||
                            [s.orderId, s.caseId, s.customerId].some(id => String(row.url || "").includes("=" + id))
                    )
                    if (hit.length) problems.push(`${username} finds ${text} of ${side} in the palette`)
                }
                for (const [recordEntityName, id] of [
                    ["mantle.request.Request", s.caseId],
                    ["mantle.order.OrderHeader", s.orderId],
                    ["mantle.party.Party", s.customerId]
                ]) {
                    const link = read(username, "ironstone.commons.PaletteServices.get#RecordLink", {recordEntityName, id}, true)
                    if (link.url && /CustomerService/.test(link.url))
                        problems.push(`${username} has a link to ${id}: ${link.url}`)
                }
                for (const [choice, extra] of [
                    ["customers", {term: ""}],
                    ["customers", {term: "zzz-none", selected: s.customerId}],
                    ["organizations", {}]
                ]) {
                    const options = Array.from(
                        read(username, access + "get#Choices", Object.assign({choice}, extra), true).options || []
                    )
                    if (options.some(option => option.value === s.customerId || option.value === s.org))
                        problems.push(`${username} gets ${choice} ${JSON.stringify(extra)} of ${side}`)
                }
            }
        }
        // the notifications of each side's cases and orders reach only that side's users: each case is assigned to one of its
        // side's agents and back (Mantle's SupportCaseAssigned notice to the assignee), then every notice of the records checked
        const assign = (requestId, assigneePartyId) =>
            read("john.doe", "mantle.request.SupportCaseServices.update#Case", {requestId, assigneePartyId}).error
        const assigned = [
            assign(sides.retail.caseId, "BOSS_CS_MANAGER"),
            assign(sides.retail.caseId, "BOSS_CS_AGENT"),
            assign(sides.services.caseId, "BOSS_CS_SERVICES"),
            assign(sides.services.caseId, "")
        ].filter(Boolean)
        if (assigned.length) problems.push("the assignments: " + assigned.join(" | "))
        const sideOf = {}
        for (const username of retailUsers) sideOf[one("moqui.security.UserAccount", {username})?.userId] = "retail"
        sideOf[one("moqui.security.UserAccount", {username: users.services})?.userId] = "services"
        let notices = 0
        for (const side of ["retail", "services"]) {
            const s = sides[side]
            for (const message of rows("moqui.security.user.NotificationMessage", {}).filter(row =>
                [s.caseId, s.orderId].includes(row.recordId)
            ))
                for (const recipient of rows("moqui.security.user.NotificationMessageUser", {
                    notificationMessageId: message.notificationMessageId
                })) {
                    notices++
                    const of = sideOf[recipient.userId]
                    if (of && of !== side)
                        problems.push(`${recipient.userId} is told of ${side}'s ${message.topic} ${message.recordId}`)
                }
        }
        // the control: each side's own user finds its case's order in the palette and gets its link
        const found = {}
        for (const side of ["retail", "services"]) {
            const s = sides[side]
            found[side] = {
                palette: Array.from(read(s.reader, access + "search#Records", {text: s.orderId, limit: 20}, true).rows || [])
                    .length,
                link: read(
                    s.reader,
                    "ironstone.commons.PaletteServices.get#RecordLink",
                    {
                        recordEntityName: "mantle.order.OrderHeader",
                        id: s.orderId
                    },
                    true
                ).url
            }
        }
        if (problems.length) log.warn("Customer Service access walk problems:\n" + problems.join("\n"))
        return {problems, found, notices}
    },
    then({problems, found, notices}) {
        problems.join("\n") == ""
        notices >= 3
        found.retail.palette > 0
        found.services.palette > 0
        found.retail.link == "/qapps/CustomerService/Orders/OrderDetail?orderId=" + sides.retail.orderId
        found.services.link == "/qapps/CustomerService/Orders/OrderDetail?orderId=" + sides.services.orderId
    }
})

feature("no Customer Service user sees a standard cost or supplier price, or approves, releases or receives without the group", {
    when() {
        const problems = []
        for (const username of retailUsers)
            for (const [path, parameters] of [
                ["Availability/Product360", {productId: ids.serializedProductId}],
                ["Availability/Product360/Summary", {productId: ids.serializedProductId}],
                ["Availability/Products", {productId: ids.serializedProductId}],
                ["Availability/InventoryAvailability", {productId: ids.serializedProductId}],
                ["Orders/OrderDetail", {orderId: ids.deliveredOrderId}]
            ]) {
                const got = page(username, path, parameters)
                if (COST.test(got.output)) problems.push(`${username} sees the cost or supplier price on ${path}`)
            }
        // the control: john.doe sees the standard cost under Products
        const costControl = asUser("john.doe", () =>
            COST.test(
                render("Products", "Products/Product360/Costs", {
                    productId: ids.serializedProductId,
                    organizationPartyId: ids.organizationId
                }).output
            )
        )
        // finance and stock verbs the Customer Service groups do not hold, each on a real record so the refusal is the
        // permission's: a bill of Retail, a hold placed on it, the Purchasing demo's expected receipt
        // a supplier's bill to Retail, made here (no demo bill is Retail's)
        const billId = "BOSS_CS_P16_BILL_" + stamp
        system(() =>
            call("create#mantle.account.invoice.Invoice", {
                invoiceId: billId,
                invoiceTypeEnumId: "InvoiceSales",
                statusId: "InvoiceIncoming",
                fromPartyId: "ZiddlemanInc",
                toPartyId: ids.organizationId,
                currencyUomId: "USD",
                invoiceDate: ec.user.nowTimestamp,
                description: "P16 access walk bill"
            })
        )
        state.billId = billId
        const bill = one("mantle.account.invoice.Invoice", {invoiceId: billId})
        const holdId = "BOSS_CS_P16_HOLD"
        if (bill && !one("mantle.account.invoice.InvoiceHold", {invoiceHoldId: holdId}))
            system(() =>
                call("create#mantle.account.invoice.InvoiceHold", {
                    invoiceHoldId: holdId,
                    invoiceId: bill.invoiceId,
                    holdComment: "P16 access walk",
                    placedByUserId: "EX_JOHN_DOE",
                    placedDate: ec.user.nowTimestamp
                })
            )
        const verbs = (
            bill
                ? [
                      [
                          "mantle.account.InvoiceServices.approve#Payable",
                          {invoiceId: bill.invoiceId, lastUpdatedStamp: bill.lastUpdatedStamp}
                      ],
                      [
                          "mantle.account.InvoiceServices.release#InvoiceHold",
                          {invoiceHoldId: holdId, releaseComment: "P16 access walk"}
                      ]
                  ]
                : []
        ).concat([
            [
                "mantle.shipment.WarehouseTaskServices.receive#ShipmentStock",
                {operationKey: "cs-p16-" + stamp, shipmentId: "BOSS_PUR_RCV_SHIP", productId: "DEMO_1_1", quantityAccepted: 1},
                users.agentWarehouse
            ]
        ])
        const received = () => rows("mantle.product.receipt.AssetReceipt", {shipmentId: "BOSS_PUR_RCV_SHIP"}).length
        const before = received()
        for (const username of retailUsers)
            for (const [service, parameters, allowed] of verbs) {
                if (username === allowed) continue
                const got = read(username, service, parameters)
                if (!/PERMISSION_DENIED|ACCESS_DENIED|is not authorized|FORBIDDEN/.test(got.error))
                    problems.push(`${username} ${service}: ${got.error || "accepted"}`)
            }
        const holdReleased = bill ? !!one("mantle.account.invoice.InvoiceHold", {invoiceHoldId: holdId})?.releasedDate : false
        if (bill) system(() => find("mantle.account.invoice.InvoiceHold", {invoiceHoldId: holdId}).deleteAll())
        if (problems.length) log.warn("Customer Service access walk problems:\n" + problems.join("\n"))
        return {problems, costControl, verbs: verbs.length, holdReleased, received: received() - before}
    },
    then({problems, costControl, verbs, holdReleased, received}) {
        problems.join("\n") == ""
        costControl == true
        verbs == 3
        holdReleased == false
        received == 0
    }
})

feature("the W agent and the F authorizer work from Customer Service's shared mounts without the Warehouse or Accounting root", {
    when() {
        const roots = {}
        for (const username of [users.agentWarehouse, users.returnsReceivables])
            roots[username] = asUser(username, () => ["Warehouse", "Accounting"].filter(root => opens(render(root, "", {}))))
        const invoice = rows("mantle.account.invoice.Invoice", {fromPartyId: ids.organizationId, toPartyId: ids.customerId})[0]
        return {
            roots,
            warehouseReturn: page(users.agentWarehouse, "Returns/ReturnDetail", {returnId: ids.warehouseReturnId}),
            inspections: page(users.agentWarehouse, "Returns/Returns", {view: "all"}),
            financeReturn: page(users.returnsReceivables, "Returns/ReturnDetail", {returnId: ids.warehouseReturnId}),
            invoiceId: invoice?.invoiceId,
            financeInvoice: invoice
                ? page(users.returnsReceivables, "Orders/InvoiceDetail", {invoiceId: invoice.invoiceId})
                : null
        }
    },
    then({roots, warehouseReturn, inspections, financeReturn, invoiceId, financeInvoice}) {
        roots[users.agentWarehouse] == []
        roots[users.returnsReceivables] == []
        warehouseReturn.errors == []
        warehouseReturn.output.includes("Return " + ids.warehouseReturnId)
        inspections.errors == []
        financeReturn.errors == []
        financeReturn.output.includes("Return " + ids.warehouseReturnId)
        invoiceId != null
        financeInvoice.errors == []
        financeInvoice.output.includes(invoiceId)
        !financeInvoice.output.includes("Invoice not available")
    }
})

feature(
    "a customer contact reaches nothing in BOSS: no root (Commons and Comms too) or launcher entry, no service, record or staff print",
    {
        when() {
            const problems = []
            const roots = otherRoots.concat(["CustomerService", "Insights", "Commons", "Comms"])
            // Commons and Comms are granted to BOSS_USERS, not ALL_USERS (F216), so a public account is refused them; their pages
            // show it no record of the cases, their customers or orders: the request list and Joe's case, the inbox
            const commonsPages = [
                ["Commons", "Requests/List", {}],
                ["Commons", "Requests/RequestDetail", {requestId: ids.thermostatCaseId}],
                ["Commons", "Requests/RequestDetail", {requestId: ids.otherCaseId}],
                ["Comms", "Inbox", {}]
            ]
            const anyCase = new RegExp(sides.retail.pattern.source + "|" + sides.services.pattern.source)
            for (const username of contacts) {
                if (!one("moqui.security.UserAccount", {username})) {
                    problems.push(`no demo account ${username}`)
                    continue
                }
                asUser(username, () => {
                    for (const root of roots) if (opens(render(root, "", {}))) problems.push(`${username} opens the ${root} app`)
                })
                asUser(username, () => {
                    for (const [root, path, parameters] of commonsPages) {
                        const got = render(root, path, parameters)
                        if (opens(got)) problems.push(`${username} opens ${root}/${path}`)
                        if (anyCase.test(got.output))
                            problems.push(`${username} sees a case's record on ${root}/${path}: ${got.output.match(anyCase)[0]}`)
                    }
                })
                const launcher = shell(username).apps
                if (launcher.length) problems.push(`${username}'s launcher has ${launcher.join(", ")}`)
                for (const [service, parameters] of [
                    ["ironstone.customerservice.AccessServices.search#Records", {text: "joe", limit: 20}],
                    [
                        "ironstone.customerservice.AccessServices.check#Record",
                        {recordType: "case", recordId: ids.thermostatCaseId}
                    ],
                    [
                        "ironstone.customerservice.CaseServices.get#CaseDetail",
                        {appRoot: "CustomerService", requestId: ids.thermostatCaseId}
                    ],
                    ["ironstone.customerservice.CaseServices.find#Cases", {appRoot: "CustomerService"}],
                    ["ironstone.customerservice.ReportingServices.get#CaseVolumes", {appRoot: "CustomerService", output: "csv"}]
                ]) {
                    const got = read(username, service, parameters, true)
                    if (!/is not authorized|CUSTOMER_SERVICE_UNAVAILABLE|PERMISSION_DENIED/.test(got.error))
                        problems.push(`${username} reaches ${service}: ${got.error || "accepted"}`)
                }
                // Mantle's staff print of the contact's own customer's case
                const printed = read(username, "mantle.request.SupportCaseServices.get#CaseSummaryPrint", {
                    requestId: ids.thermostatCaseId,
                    audience: "internal"
                })
                if (!/PERMISSION_DENIED|RECORD_UNAVAILABLE/.test(printed.error))
                    problems.push(`${username} prints a case summary`)
            }
            if (problems.length) log.warn("Customer Service access walk problems:\n" + problems.join("\n"))
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)
