// The Sales access and isolation walk (impl-sales P20, §2 "Scope in three steps" and "Borrowed authority stays borrowed"; design-sales
// §1.1, §1.3, §1.4, §14.3 scenario 3), an acceptance test with artifact authorization on, on MaintenanceAccessWalk's and
// CustomerServiceAccessWalk's pattern. Each side gets a lead, an opportunity, a quote, a request for quote and a placed sales order
// with a secret name, made by its own representative: Ziziwork Retail's by sales.rep (Retail East, for Wingtip Traders; the order is
// approved, shipped and so invoiced, and a second order is put on a Credit hold) and Ziziwork Sales' by sales.rep3 (its only
// organization, for Fabrikam Industrial); each side's account gets a phone number for the call context. Then:
// - another organization's records: no Retail-only Sales user (rep, rep2, manager, approver, change operator, agreement keeper,
//   reader, and Marketing's salesperson marketing.sales) sees Ziziwork Sales' records, and sales.rep3 sees none of Retail's (nor
//   Retail's account, contact, agreement, shipment or invoice);
// - another team's records: within Retail the East rep's lead, deal, quote and request show to no one outside East but a holder of
//   SALES_TEAM_VIEW (not rep2 of West, the approver, the change operator, the agreement keeper or marketing.sales), and the orders to no
//   one but East, team viewers and the approver and change operator, who see orders to decide or change them (not rep2, the keeper or
//   marketing.sales);
// through the Sales routes with the record's id (OpportunityDetail, OrderDetail of the quote and the order, QuoteSend,
// QuoteRequestDetail, Customer360, ContactDetail, AgreementDetail, ShipmentDetail, InvoiceDetail, the Assist answer actions LogNote and
// SendMessage), the lists searched by the secret (Opportunities, Leads, Quotes, QuoteRequests, Orders, Accounts) and the lists' CSV
// exports, Home, Forecast and the pipeline reports for the other organization, the quote print, Marketing's mount of Leads and
// Accounts, the palette, the drop-downs (searched and as the selected value), check#Record, the Chatter and RecordFiles panels, Assist's
// tools (the registered AgentToolExposure services, run as the user), the Comms providers (record lookup, call context, "Create lead"
// and "Create RFQ" from another organization's message, "Log call" on another's deal), the opportunity import and the Mantle services
// the screens call (reads, lists and writes), and the writes change nothing; the owner (and Retail's manager, and john.doe for the
// Marketing mount) sees each record, so a refusal is not a broken route;
// - costs: no Sales user gets a cost or margin from a quote, an order or the sales analysis (costShown false; john.doe's true);
// - finance: no Sales group reads an invoice or a payment (InvoiceDetail "not available", check#Record refused, get#SalesOrder without
//   invoices or payments, its Send refused); john.doe opens the invoice;
// - borrowed actions: no Sales group holds a cost, price-edit, credit, payment, receivable or shipment permission; each is refused
//   releasing the Credit hold, which stays, while the approver places and releases a Manual hold on the same order.
// sales.admin (SALES_ALL_ORGANIZATIONS) and sales.manager2 (both organizations) are left out of the isolation and kept in the costs,
// finance and borrowed checks. The rules are SalesAccess's (one case each) and Mantle's; menus per group are SalesFoundationWalk's.
// Run: ./moq accept mr-boss --spec SalesAccessWalk
const lib = ec.resource.script("component://mr-boss/test/Sales/SalesSpecLib.js")
const {ids, users, asUser, system} = lib
const stamp = ec.l10n.format(ec.user.nowTimestamp, "HHmmssSSS")
const run = stamp.slice(-6)
const OPPORTUNITY = "mantle.sales.opportunity.SalesOpportunity"
const ORDER = "mantle.order.OrderHeader"
const REQUEST = "mantle.request.Request"
const PARTY = "mantle.party.Party"
const C = "ironstone.sales.ContextServices."
const O = "mantle.sales.OpportunityServices."
const Q = "mantle.order.SalesQuoteServices."
const SO = "mantle.order.SalesOrderServices."
const webroot = "component://webroot/screen/webroot.xml"
const marketingSales = "marketing.sales"
// every Retail-only Sales user, and the users kept out of the isolation (both organizations, every organization)
const retailUsers = [
    users.rep,
    users.rep2,
    users.manager,
    users.approver,
    users.change,
    users.agreement,
    users.reader,
    marketingSales
]
const groupUsers = retailUsers.concat([users.otherRep, users.bothManager, users.admin])
const refusedText = /RECORD_UNAVAILABLE|ORGANIZATION_DENIED|PERMISSION_DENIED|HOLD_UNAVAILABLE|not available|not authorized/
const state = {}

// the two sides: the organization, its representative, the account and contact its records are for, and (made in setup) its records,
// each with a secret name
const sides = {
    retail: {
        org: ids.organizationId,
        owner: users.rep,
        ownerPartyId: "BOSS_SAL_REP",
        account: ids.accounts.wingtip,
        accountName: "Wingtip Traders",
        contact: ids.contacts.dana,
        phone: "7" + run
    },
    zizi: {
        org: ids.otherOrganizationId,
        owner: users.otherRep,
        ownerPartyId: "BOSS_SAL_REP3",
        account: ids.accounts.fabrikam,
        accountName: "Fabrikam Industrial",
        contact: ids.contacts.lee,
        phone: "8" + run
    }
}
for (const [name, s] of Object.entries(sides)) {
    s.name = name
    s.secrets = {}
    for (const kind of ["lead", "deal", "quote", "rfq", "order", "held"]) s.secrets[kind] = `P20A ${kind} ${name} ${stamp}`
    s.secrets.account = s.accountName
    s.number = "+1505" + s.phone
}
// what each viewer must not see of a side, by kind (impl-sales §2's scope: the organization, then the assignment or team view)
const recordKinds = ["lead", "deal", "quote", "rfq", "order", "held"]
const forbidden = {
    retail: {
        [users.otherRep]: recordKinds.concat(["account", "agreement", "shipment", "invoice"]),
        [users.rep2]: recordKinds,
        [users.agreement]: recordKinds,
        [marketingSales]: recordKinds,
        [users.approver]: ["lead", "deal", "quote", "rfq"],
        [users.change]: ["lead", "deal", "quote", "rfq"]
    },
    zizi: Object.fromEntries(retailUsers.map(user => [user, recordKinds.concat(["account"])]))
}
// a list's search text: the secret without its "P20A " head, so the list's echo of the query is not taken for a row
const query = secret => secret.replace(/^P20A /, "")
const secretsOf = (s, viewer) => (forbidden[s.name][viewer] || []).map(kind => s.secrets[kind]).filter(Boolean)
const idsOf = (s, kinds) =>
    kinds
        .flatMap(
            kind =>
                ({
                    lead: [s.leadId],
                    deal: [s.dealId],
                    quote: [s.quoteId],
                    rfq: [s.requestId],
                    order: [s.orderId],
                    held: [s.heldOrderId],
                    account: [s.account, s.contact, s.org],
                    agreement: [s.agreementId],
                    shipment: [s.shipmentId],
                    invoice: [s.invoiceId]
                })[kind] || []
        )
        .filter(Boolean)
const leaks = (s, viewer, text) => secretsOf(s, viewer).filter(secret => String(text || "").includes(secret))

// a Sales (or another root's) screen as the user, in a render mode: its status, output and errors
function render(user, path, parameters = {}, mode = "html", root = "Sales") {
    return asUser(user, () => {
        let result
        try {
            const test = ec.screen.makeTest().rootScreen(`component://mr-boss/screen/${root}.xml`).renderMode(mode)
            if (mode === "qvt") test.withStaticData()
            result = test.render(path, Object.assign({lastStandalone: "-2"}, parameters), null)
        } catch (error) {
            result = {status: 0, output: "", errorMessages: [String(error.message)]}
        }
        ec.message.clearErrors()
        return {
            status: result.status,
            output: String(result.output || ""),
            errors: Array.from(result.errorMessages || []).join(" | ")
        }
    })
}
const opens = got => got.status == 200 && !got.errors
// a transition posted as the user: its errors, or its status when it is refused with none ("" when it is accepted)
function post(user, path, parameters, root = "Sales") {
    return asUser(user, () => {
        let errors
        try {
            const result = ec.screen
                .makeTest()
                .rootScreen(`component://mr-boss/screen/${root}.xml`)
                .render(path, parameters, "post")
            errors = Array.from(result.errorMessages || []).join(" | ") || (result.status >= 400 ? "status " + result.status : "")
        } catch (error) {
            errors = String(error.message)
        }
        ec.message.clearErrors()
        return errors
    })
}
// a path under the web root as the user (the record panels' data): status, output and errors
function hit(user, path, parameters = {}) {
    return asUser(user, () => {
        const result = ec.screen.makeTest().rootScreen(webroot).render(path, parameters, "get")
        const errors = Array.from(result.errorMessages || []).join(" | ")
        ec.message.clearErrors()
        return {status: result.status, output: String(result.output || ""), errors}
    })
}
// a service called as the user: with artifact authorization on (what the user's own call meets: the palette, the choices, the Comms
// providers, Assist's tools) or, withoutAuthz (direct), off as the root's grant lets its screens call Mantle (its own checks deciding)
function ask(user, service, parameters = {}, withoutAuthz = false) {
    return asUser(user, () => {
        if (withoutAuthz) ec.artifactExecution.disableAuthz()
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
    })
}
const direct = (user, service, parameters) => ask(user, service, parameters, true)
const one = (entity, values) => system(() => ec.entity.find(entity).condition(values).one())
const rows = (entity, values) => system(() => Array.from(ec.entity.find(entity).condition(values).list()))
const revisionOf = orderId => Number(one(ORDER, {orderId})?.orderRevision ?? 1)
const dealRevision = salesOpportunityId =>
    system(
        () =>
            ec.service
                .sync()
                .name(O + "get#Opportunity")
                .parameters({salesOpportunityId})
                .call()?.opportunity?.revision
    )
const rfqRevision = requestId =>
    system(
        () =>
            ec.service
                .sync()
                .name(Q + "get#QuoteRequest")
                .parameters({requestId})
                .call()?.quoteRequest?.requestRevision
    )
// the keys of a result that name a cost or a margin with a value (a quote, an order: none for a Sales user)
function costKeys(value, path = "", found = []) {
    if (value == null || typeof value !== "object") return found
    for (const [key, inner] of Object.entries(value)) {
        if (
            /cost|margin/i.test(key) &&
            inner != null &&
            inner !== "" &&
            inner !== false &&
            !(Array.isArray(inner) && !inner.length)
        )
            found.push(path + key)
        costKeys(inner, path + key + ".", found)
    }
    return found
}
const plain = value => JSON.parse(JSON.stringify(value ?? null))

// the Sales routes that show a side's records, with the ids the walk made
function routes(s) {
    const list = [
        ["Pipeline/OpportunityDetail", {salesOpportunityId: s.dealId}],
        ["Pipeline/OpportunityDetail", {salesOpportunityId: s.leadId}],
        ["Pipeline/Opportunities", {text: query(s.secrets.deal)}],
        ["Pipeline/Opportunities", {text: query(s.secrets.deal), pageNoLimit: "true", lastStandalone: "true"}, "csv"],
        ["Pipeline/Leads", {text: query(s.secrets.lead)}],
        ["Pipeline/Leads", {text: query(s.secrets.lead), pageNoLimit: "true", lastStandalone: "true"}, "csv"],
        ["Pipeline/Forecast", {organizationPartyId: s.org}],
        ["Quotes/Quotes", {text: query(s.secrets.quote), state: "all"}],
        ["Orders/OrderDetail", {orderId: s.quoteId}],
        ["Orders/QuoteSend", {orderId: s.quoteId}],
        ["Quotes/QuoteRequests", {text: query(s.secrets.rfq)}],
        ["Quotes/QuoteRequestDetail", {requestId: s.requestId}],
        ["Orders/Orders", {text: query(s.secrets.order)}],
        ["Orders/OrderDetail", {orderId: s.orderId}],
        ["Accounts/Customer360", {customerPartyId: s.account}],
        ["Accounts/Accounts", {text: s.accountName.slice(1, -1)}],
        ["Accounts/ContactDetail", {partyId: s.contact}],
        ["Home", {organizationPartyId: s.org}],
        ["Reports/PipelineAnalysis", {organizationPartyId: s.org}],
        ["Reports/WinLoss", {organizationPartyId: s.org}],
        ["LogNote", {entityName: OPPORTUNITY, recordId: s.dealId}],
        ["SendMessage", {entityName: OPPORTUNITY, recordId: s.dealId}]
    ]
    if (s.heldOrderId) list.push(["Orders/OrderDetail", {orderId: s.heldOrderId}])
    if (s.shipmentId) list.push(["Orders/ShipmentDetail", {shipmentId: s.shipmentId}])
    if (s.invoiceId) list.push(["Orders/InvoiceDetail", {invoiceId: s.invoiceId}])
    if (s.agreementId) list.push(["Agreements/AgreementDetail", {agreementId: s.agreementId}])
    return list.map(([path, parameters, mode]) => ({path, parameters, mode: mode || "html"}))
}
const routeName = route => `${route.path} ${route.mode} ${JSON.stringify(route.parameters)}`

// a side's records, made by its own representative through the Mantle services the screens call
function makeRecords(s) {
    const made = (service, parameters) => {
        const out = direct(s.owner, service, parameters)
        if (out.error) state.setupErrors.push(`${s.name} ${service}: ${out.error}`)
        return out
    }
    s.leadId = made(O + "create#Opportunity", {
        organizationPartyId: s.org,
        typeEnumId: "SotLead",
        opportunityName: s.secrets.lead
    }).salesOpportunityId
    s.dealId = made(O + "create#Opportunity", {
        organizationPartyId: s.org,
        opportunityName: s.secrets.deal,
        accountPartyId: s.account
    }).salesOpportunityId
    s.quoteId = made(Q + "create#Quote", {
        organizationPartyId: s.org,
        customerPartyId: s.account,
        orderName: s.secrets.quote
    }).orderId
    made(Q + "store#QuoteLine", {orderId: s.quoteId, orderRevision: revisionOf(s.quoteId), productId: "DEMO_1_1", quantity: 1})
    s.requestId = made(Q + "create#QuoteRequest", {
        organizationPartyId: s.org,
        customerPartyId: s.account,
        requestName: s.secrets.rfq
    }).requestId
    const order = name => {
        const orderId = made(SO + "create#SalesOrder", {
            organizationPartyId: s.org,
            customerPartyId: s.account,
            orderName: name
        }).orderId
        made(SO + "store#SalesOrderLine", {orderId, orderRevision: revisionOf(orderId), productId: "DEMO_1_1", quantity: 1})
        made(SO + "place#SalesOrder", {orderId, orderRevision: revisionOf(orderId)})
        return orderId
    }
    s.orderId = order(s.secrets.order)
    // a phone number on the account, for the call context
    system(() => {
        const mech = ec.service
            .sync()
            .name("create#mantle.party.contact.ContactMech")
            .parameters({contactMechTypeEnumId: "CmtTelecomNumber"})
            .call()
        ec.service
            .sync()
            .name("create#mantle.party.contact.TelecomNumber")
            .parameters({contactMechId: mech.contactMechId, countryCode: "1", areaCode: "505", contactNumber: s.phone})
            .call()
        ec.service
            .sync()
            .name("create#mantle.party.contact.PartyContactMech")
            .parameters({
                partyId: s.account,
                contactMechId: mech.contactMechId,
                contactMechPurposeId: "PhonePrimary",
                fromDate: ec.user.nowTimestamp
            })
            .call()
    })
    if (s.name !== "retail") return
    // Retail's order approved by its approver, then shipped (Mantle's shipment services, as the system) and so invoiced
    const approved = direct(users.approver, SO + "approve#SalesOrder", {
        orderId: s.orderId,
        orderRevision: revisionOf(s.orderId),
        operationKey: "p20a-approve-" + stamp
    })
    if (approved.error) state.setupErrors.push(`retail approve: ${approved.error}`)
    system(() => {
        const svc = (name, parameters) => ec.service.sync().name(name).parameters(parameters).call() || {}
        const shipment = svc("mantle.shipment.ShipmentServices.create#OrderPartShipment", {
            orderId: s.orderId,
            orderPartSeqId: "01"
        })
        s.shipmentId = shipment.shipmentId
        svc("mantle.shipment.ShipmentServices.pack#ShipmentProduct", {
            shipmentId: shipment.shipmentId,
            shipmentPackageSeqId: shipment.shipmentPackageSeqId,
            productId: "DEMO_1_1",
            quantity: 1
        })
        svc("mantle.shipment.ShipmentServices.pack#Shipment", {shipmentId: shipment.shipmentId})
        svc("mantle.shipment.ShipmentServices.ship#Shipment", {shipmentId: shipment.shipmentId})
    })
    ec.factory.waitWorkerPoolEmpty(50)
    s.invoiceId = rows("mantle.order.OrderItemBilling", {orderId: s.orderId})[0]?.invoiceId
    // a second order, put on a Credit hold (Accounting's to release)
    s.heldOrderId = order(s.secrets.held)
    s.creditHoldId = system(
        () =>
            ec.service
                .sync()
                .name("mantle.order.OrderServices.hold#Order")
                .parameters({orderId: s.heldOrderId, holdTypeEnumId: "OhtCredit", holdComment: "P20 access walk credit review"})
                .call()?.orderHoldReasonId
    )
    // Retail's demo agreement (P15), read by Retail's users only
    s.agreementId = ids.agreements.contoso
    s.secrets.agreement = one("mantle.party.agreement.Agreement", {agreementId: s.agreementId})?.description || null
    s.secrets.shipment = null
    s.secrets.invoice = null
}

spec({
    setupSpec() {
        login("john.doe")
        state.setupErrors = []
        for (const s of Object.values(sides)) makeRecords(s)
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("each side's records are made and its own representative sees them; Retail's manager sees Retail's", {
    when() {
        const problems = state.setupErrors.slice()
        for (const s of Object.values(sides)) {
            for (const key of ["leadId", "dealId", "quoteId", "requestId", "orderId"])
                if (!s[key]) problems.push(`${s.name} has no ${key}`)
            const own = [
                ["Pipeline/OpportunityDetail", {salesOpportunityId: s.dealId}, s.secrets.deal],
                ["Pipeline/OpportunityDetail", {salesOpportunityId: s.leadId}, s.secrets.lead],
                ["Orders/OrderDetail", {orderId: s.quoteId}, s.secrets.quote],
                ["Quotes/QuoteRequestDetail", {requestId: s.requestId}, s.secrets.rfq],
                ["Orders/OrderDetail", {orderId: s.orderId}, s.secrets.order]
            ]
            for (const [path, parameters, secret] of own) {
                const got = render(s.owner, path, parameters)
                if (!got.output.includes(secret)) problems.push(`${s.owner} does not see ${secret} on ${path}: ${got.errors}`)
            }
            const csv = render(
                s.owner,
                "Pipeline/Leads",
                {text: query(s.secrets.lead), pageNoLimit: "true", lastStandalone: "true"},
                "csv"
            )
            if (!csv.output.includes(s.secrets.lead)) problems.push(`${s.owner}'s Leads CSV lacks their lead: ${csv.errors}`)
            const print = render(s.owner, "Orders/OrderDetail/salesQuotePrint", {orderId: s.quoteId})
            if (!opens(print)) problems.push(`${s.owner} cannot print their quote: ${print.errors}`)
        }
        const retail = sides.retail
        if (!retail.shipmentId || !retail.invoiceId || !retail.heldOrderId || !retail.creditHoldId)
            problems.push(`Retail's shipment, invoice or held order: ${JSON.stringify(retail)}`)
        const manager = render(users.manager, "Pipeline/OpportunityDetail", {salesOpportunityId: retail.dealId})
        if (!manager.output.includes(retail.secrets.deal))
            problems.push(`the manager does not see East's deal: ${manager.errors}`)
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("another organization's and another team's records show on no Sales route, list, export or print", {
    when() {
        const problems = []
        for (const s of Object.values(sides)) {
            for (const viewer of Object.keys(forbidden[s.name])) {
                for (const route of routes(s)) {
                    const got = render(viewer, route.path, route.parameters, route.mode)
                    const seen = leaks(s, viewer, got.output)
                    if (seen.length) problems.push(`${viewer} sees ${seen} on ${routeName(route)}`)
                }
                // the quote print: refused to a viewer the quote is not shown to
                if (forbidden[s.name][viewer].includes("quote")) {
                    const print = render(viewer, "Orders/OrderDetail/salesQuotePrint", {orderId: s.quoteId})
                    if (opens(print) && print.output.length) problems.push(`${viewer} prints ${s.name}'s quote`)
                }
            }
        }
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("Marketing's mount of Leads and Accounts shows its salesperson no other team's or organization's lead", {
    when() {
        const problems = []
        for (const s of Object.values(sides)) {
            for (const [path, parameters, mode] of [
                ["Leads/Leads", {text: query(s.secrets.lead)}],
                ["Leads/Leads", {text: query(s.secrets.lead), pageNoLimit: "true", lastStandalone: "true"}, "csv"],
                ["Leads/Accounts", {text: s.accountName.slice(1, -1)}]
            ]) {
                const got = render(marketingSales, path, parameters, mode || "html", "Marketing")
                const seen = leaks(s, marketingSales, got.output)
                if (seen.length) problems.push(`${marketingSales} sees ${seen} on Marketing ${path}`)
            }
        }
        // the mount shows a lead to a user whose Sales scope holds it (john.doe, every organization)
        const control = render("john.doe", "Leads/Leads", {text: query(sides.retail.secrets.lead)}, "html", "Marketing")
        return {problems, control: control.output.includes(sides.retail.secrets.lead)}
    },
    then({problems, control}) {
        problems.join("\n") == ""
        control == true
    }
})

feature(
    "the palette, the drop-downs, check#Record and the record panels give nothing of another organization's or team's records",
    {
        when() {
            const problems = []
            for (const s of Object.values(sides)) {
                const checks = [
                    ["opportunity", s.dealId, "deal"],
                    ["opportunity", s.leadId, "lead"],
                    ["quote", s.quoteId, "quote"],
                    ["quoteRequest", s.requestId, "rfq"],
                    ["order", s.orderId, "order"],
                    ["order", s.heldOrderId, "held"],
                    ["account", s.account, "account"],
                    ["contact", s.contact, "account"],
                    ["organization", s.org, "account"],
                    ["agreement", s.agreementId, "agreement"],
                    ["shipment", s.shipmentId, "shipment"],
                    ["invoice", s.invoiceId, "invoice"]
                ].filter(([, recordId]) => recordId)
                const panels = [
                    [OPPORTUNITY, s.dealId, "deal"],
                    [OPPORTUNITY, s.leadId, "lead"],
                    [ORDER, s.quoteId, "quote"],
                    [ORDER, s.orderId, "order"],
                    [REQUEST, s.requestId, "rfq"],
                    [PARTY, s.account, "account"]
                ]
                const choices = [
                    ["organizations", {selected: s.org}, "account"],
                    ["accounts", {term: s.accountName, selected: s.account}, "account"],
                    ["dealContacts", {accountPartyId: s.account, selected: s.contact}, "account"],
                    ["deals", {term: query(s.secrets.deal), selected: s.dealId}, "deal"],
                    ["deals", {term: query(s.secrets.lead), selected: s.leadId}, "lead"],
                    ["changeOrders", {term: s.orderId, selected: s.orderId}, "order"],
                    ["orderLines", {orderId: s.orderId}, "order", true],
                    ["agreements", {selected: s.agreementId}, "agreement"]
                ].filter(([, parameters, kind]) => kind !== "agreement" || s.agreementId)
                for (const viewer of Object.keys(forbidden[s.name])) {
                    const kinds = forbidden[s.name][viewer]
                    const hidden = idsOf(s, kinds)
                    // the palette, by each secret
                    for (const secret of secretsOf(s, viewer)) {
                        const found = ask(viewer, C + "search#Records", {text: secret})
                        const text = JSON.stringify(found.rows || [])
                        if (leaks(s, viewer, text).length || hidden.some(id => text.includes('"' + id + '"')))
                            problems.push(`${viewer}'s palette finds ${s.name}'s ${secret}`)
                    }
                    // the drop-downs, searched and with the record as the selected value
                    for (const [choice, parameters, kind, any] of choices) {
                        if (!kinds.includes(kind)) continue
                        const options = Array.from(
                            ask(viewer, C + "get#Choices", Object.assign({choice}, parameters)).options || []
                        )
                        const offered = options.filter(
                            option => any || hidden.includes(option.value) || leaks(s, viewer, option.label).length
                        )
                        if (offered.length)
                            problems.push(`${viewer}'s ${choice} offers ${s.name}'s ${JSON.stringify(plain(offered))}`)
                    }
                    // check#Record, as a screen or a mount checks a record it was given
                    for (const [recordType, recordId, kind] of checks) {
                        if (!kinds.includes(kind)) continue
                        const checked = ask(viewer, C + "check#Record", {recordType, recordId})
                        if (!checked.error.includes("RECORD_UNAVAILABLE"))
                            problems.push(`${viewer} checks ${s.name}'s ${recordType} ${recordId}: ${checked.error || "given"}`)
                    }
                    // the Chatter and RecordFiles panels of each record
                    for (const [recordEntity, recordId, kind] of panels) {
                        if (!kinds.includes(kind) || !recordId) continue
                        for (const panel of ["RecordFiles/filesData", "Chatter/chatterData"]) {
                            const got = hit(viewer, "apps/Sales/" + panel, {recordEntity, recordId})
                            if (!got.errors.includes("RECORD_PANEL_UNAVAILABLE") || leaks(s, viewer, got.output).length)
                                problems.push(
                                    `${viewer} opens ${panel} of ${s.name}'s ${recordEntity} ${recordId}: ${got.errors}`
                                )
                        }
                    }
                }
                // the owner's palette finds the deal and the owner's check reads it
                const ownPalette = ask(s.owner, C + "search#Records", {text: s.secrets.deal})
                if (!JSON.stringify(ownPalette.rows || []).includes(s.secrets.deal))
                    problems.push(`${s.owner}'s palette misses their deal`)
                const ownCheck = ask(s.owner, C + "check#Record", {recordType: "opportunity", recordId: s.dealId})
                if (ownCheck.error) problems.push(`${s.owner}'s check of their deal: ${ownCheck.error}`)
            }
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)

feature("Assist's Sales tools, run as the user, find nothing of another organization's or team's and change none of it", {
    when() {
        const problems = []
        const exposure = toolName => one("moqui.agent.AgentToolExposure", {toolName})?.serviceName
        const tool = (user, toolName, parameters) => {
            const serviceName = exposure(toolName)
            if (!serviceName) {
                problems.push(`no tool ${toolName}`)
                return {error: "no tool"}
            }
            return ask(user, serviceName, parameters)
        }
        for (const s of Object.values(sides)) {
            const before = one(OPPORTUNITY, {salesOpportunityId: s.dealId})
            for (const viewer of Object.keys(forbidden[s.name])) {
                const kinds = forbidden[s.name][viewer]
                const reads = [
                    ["sales_find_opportunities", {text: query(s.secrets.deal)}],
                    ["sales_find_opportunities", {text: query(s.secrets.lead), typeEnumId: "SotLead"}],
                    ["sales_find_quotes", {text: query(s.secrets.quote), state: "all"}],
                    ["sales_preview_quote", {orderId: s.quoteId}]
                ]
                for (const [toolName, parameters] of reads) {
                    const out = tool(viewer, toolName, parameters)
                    const seen = leaks(s, viewer, JSON.stringify(plain(Object.assign({}, out, {error: ""}))))
                    if (seen.length) problems.push(`${viewer}'s ${toolName} answers ${seen}`)
                }
                if (kinds.includes("quote")) {
                    const preview = tool(viewer, "sales_preview_quote", {orderId: s.quoteId})
                    if (!refusedText.test(preview.error))
                        problems.push(`${viewer} previews ${s.name}'s quote: ${preview.error || "given"}`)
                    const send = tool(viewer, "sales_send_quote", {
                        orderId: s.quoteId,
                        orderRevision: revisionOf(s.quoteId),
                        previewOnly: "Y"
                    })
                    if (!refusedText.test(send.error))
                        problems.push(`${viewer} sends ${s.name}'s quote: ${send.error || "accepted"}`)
                }
                if (kinds.includes("deal")) {
                    const revision = dealRevision(s.dealId)
                    const writes = [
                        [
                            "sales_move_opportunity",
                            {salesOpportunityId: s.dealId, opportunityStageId: "SalesProposal", expectedRevision: revision}
                        ],
                        [
                            "sales_close_opportunity",
                            {salesOpportunityId: s.dealId, statusId: "SalesOppLost", expectedRevision: revision}
                        ]
                    ]
                    for (const [toolName, parameters] of writes) {
                        const out = tool(viewer, toolName, parameters)
                        if (!refusedText.test(out.error))
                            problems.push(`${viewer}'s ${toolName} on ${s.name}'s deal: ${out.error || "accepted"}`)
                    }
                }
                if (kinds.includes("account")) {
                    const created = tool(viewer, "sales_create_opportunity", {
                        organizationPartyId: s.org,
                        opportunityName: "P20A tool probe " + stamp
                    })
                    if (!refusedText.test(created.error))
                        problems.push(`${viewer} creates a deal for ${s.org}: ${created.error || "accepted"}`)
                }
            }
            const after = one(OPPORTUNITY, {salesOpportunityId: s.dealId})
            if (after.statusId !== before.statusId || after.opportunityStageId !== before.opportunityStageId)
                problems.push(
                    `${s.name}'s deal moved: ${before.opportunityStageId}/${before.statusId} to ${after.opportunityStageId}/${after.statusId}`
                )
            // the owner's tool finds it
            const own = tool(s.owner, "sales_find_opportunities", {text: query(s.secrets.deal)})
            if (!JSON.stringify(plain(own.opportunityList || [])).includes(s.secrets.deal))
                problems.push(`${s.owner}'s sales_find_opportunities misses their deal: ${own.error}`)
        }
        const probes = rows(OPPORTUNITY, {opportunityName: "P20A tool probe " + stamp}).length
        return {problems, probes}
    },
    then({problems, probes}) {
        problems.join("\n") == ""
        probes == 0
    }
})

feature("the Comms providers give no other organization's or team's deal, and its actions are refused on them", {
    when() {
        const problems = []
        for (const s of Object.values(sides)) {
            for (const viewer of Object.keys(forbidden[s.name])) {
                const kinds = forbidden[s.name][viewer]
                if (!kinds.includes("deal")) continue
                // record lookup: info, card and search
                const info = ask(viewer, C + "lookup#Records", {
                    operation: "info",
                    records: [{recordEntityName: OPPORTUNITY, recordId: s.dealId}]
                })
                if (Array.from(info.recordList || []).length) problems.push(`${viewer}'s lookup info gives ${s.name}'s deal`)
                const card = ask(viewer, C + "lookup#Records", {
                    operation: "card",
                    recordEntityName: OPPORTUNITY,
                    recordId: s.dealId
                })
                if (card.card) problems.push(`${viewer}'s lookup card gives ${s.name}'s deal`)
                const search = ask(viewer, C + "lookup#Records", {operation: "search", text: query(s.secrets.deal)})
                if (leaks(s, viewer, JSON.stringify(plain(search.optionList || []))).length)
                    problems.push(`${viewer}'s lookup search finds ${s.name}'s deal`)
                // the call context for the account's number
                const ring = ask(viewer, C + "get#CallContext", {number: s.number})
                if (leaks(s, viewer, JSON.stringify(plain(ring.recordList || []))).length)
                    problems.push(`${viewer}'s call context for ${s.number} shows ${s.name}'s deal`)
                // the deal drop-down of Log call, and Log call on the deal
                const options = ask(viewer, C + "get#DealOptions", {term: query(s.secrets.deal)})
                if (leaks(s, viewer, JSON.stringify(plain(options.options || []))).length)
                    problems.push(`${viewer}'s Log call deals offer ${s.name}'s deal`)
                const logged = ask(viewer, C + "log#Call", {
                    salesOpportunityId: s.dealId,
                    summary: "P20 walk call",
                    direction: "inbound"
                })
                if (!refusedText.test(logged.error))
                    problems.push(`${viewer} logs a call on ${s.name}'s deal: ${logged.error || "accepted"}`)
            }
            // the owner's lookup and call context give the deal
            const ownInfo = ask(s.owner, C + "lookup#Records", {
                operation: "info",
                records: [{recordEntityName: OPPORTUNITY, recordId: s.dealId}]
            })
            if (!Array.from(ownInfo.recordList || []).length)
                problems.push(`${s.owner}'s lookup misses their deal: ${ownInfo.error}`)
            const ownRing = ask(s.owner, C + "get#CallContext", {number: s.number})
            if (!JSON.stringify(plain(ownRing.recordList || [])).includes(s.secrets.deal))
                problems.push(`${s.owner}'s call context misses their deal: ${ownRing.error}`)
        }
        // "Create lead" and "Create RFQ" from Retail's RFQ intake mail: Ziziwork Sales' rep cannot read it; without the edit grant refused
        const message = {emailMessageId: ids.rfqs.mailMessage, organizationPartyId: ids.otherOrganizationId}
        const otherLead = ask(users.otherRep, C + "create#LeadFromMessage", message)
        if (!/RECORD_UNAVAILABLE/.test(otherLead.error))
            problems.push(`${users.otherRep} makes a lead of Retail's mail: ${otherLead.error || "made"}`)
        const otherRfq = ask(users.otherRep, C + "create#QuoteRequestFromMessage", message)
        if (!/RECORD_UNAVAILABLE/.test(otherRfq.error))
            problems.push(`${users.otherRep} makes an RFQ of Retail's mail: ${otherRfq.error || "made"}`)
        const readerLead = ask(users.reader, C + "create#LeadFromMessage", {emailMessageId: ids.rfqs.mailMessage})
        if (!/PERMISSION_DENIED|RECORD_UNAVAILABLE/.test(readerLead.error))
            problems.push(`${users.reader} makes a lead: ${readerLead.error || "made"}`)
        const keeperRfq = ask(users.agreement, C + "create#QuoteRequestFromMessage", {emailMessageId: ids.rfqs.mailMessage})
        if (!/PERMISSION_DENIED|RECORD_UNAVAILABLE/.test(keeperRfq.error))
            problems.push(`${users.agreement} makes an RFQ: ${keeperRfq.error || "made"}`)
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature(
    "the opportunity import refuses a user without SALES_IMPORT and another organization, and names no other organization's deal",
    {
        when() {
            const validate = (user, scopeKey, rowValues) =>
                direct(user, O + "validate#OpportunityImportRow", {targetId: "opportunities", scopeKey, rowValues})
            const probe = {externalKey: "p20a-" + stamp, opportunityName: "P20A import probe " + stamp, typeEnumId: "lead"}
            const repRow = validate(users.rep, ids.organizationId, probe)
            const otherRepRow = validate(users.otherRep, ids.otherOrganizationId, probe)
            const managerOther = validate(users.manager, ids.otherOrganizationId, probe)
            const managerOwn = validate(users.manager, ids.organizationId, probe)
            const named = validate(users.manager, ids.organizationId, {
                salesOpportunityId: sides.zizi.dealId,
                opportunityName: "Renamed"
            })
            // the wizard's stage, posted by a representative, is refused and stages nothing
            const batches = () => rows("moqui.server.TransferBatch", {targetId: "opportunities", userId: "BOSS_SAL_REP"}).length
            const before = batches()
            const staged = post(users.rep, "Pipeline/OpportunityImport/Index/stage", {
                organizationPartyId: ids.organizationId,
                sourceText: "Source key,Name\np20a-" + stamp + ",P20A import probe " + stamp
            })
            return {
                repRow: repRow.error,
                otherRepRow: otherRepRow.error,
                managerOther: managerOther.error,
                managerOwn,
                named: JSON.stringify(plain(named)),
                namedLeak: JSON.stringify(plain(named)).includes(sides.zizi.secrets.deal),
                staged,
                stagedCount: batches() - before,
                made: rows(OPPORTUNITY, {opportunityName: "P20A import probe " + stamp}).length
            }
        },
        then(r) {
            r.repRow.includes("PERMISSION_DENIED")
            r.otherRepRow.includes("PERMISSION_DENIED")
            r.managerOther.includes("ORGANIZATION_DENIED")
            r.managerOwn.error == ""
            r.named.includes("not available")
            r.namedLeak == false
            r.staged != ""
            r.stagedCount == 0
            r.made == 0
        }
    }
)

feature("Mantle's sales services, called as the user, read and change nothing of another organization's or team's records", {
    when() {
        const problems = []
        for (const s of Object.values(sides)) {
            const before = {
                deal: one(OPPORTUNITY, {salesOpportunityId: s.dealId}),
                quoteLines: rows("mantle.order.OrderItem", {orderId: s.quoteId}).length,
                rfqLines: rows("mantle.request.RequestItem", {requestId: s.requestId}).length,
                holds: rows("mantle.order.OrderHoldReason", {orderId: s.orderId}).length,
                changes: rows(REQUEST, {orderId: s.orderId, requestTypeEnumId: "RqtOrderChange"}).length
            }
            for (const viewer of Object.keys(forbidden[s.name])) {
                const kinds = forbidden[s.name][viewer]
                // the reads and lists: nothing of the secrets
                const reads = [
                    ["deal", O + "get#Opportunity", {salesOpportunityId: s.dealId}],
                    ["deal", O + "find#Opportunities", {text: query(s.secrets.deal)}],
                    ["lead", O + "find#Opportunities", {text: query(s.secrets.lead), typeEnumId: "SotLead"}],
                    ["quote", Q + "get#Quote", {orderId: s.quoteId}],
                    ["quote", Q + "find#Quotes", {text: query(s.secrets.quote), state: "all"}],
                    ["rfq", Q + "get#QuoteRequest", {requestId: s.requestId}],
                    ["rfq", Q + "find#QuoteRequests", {text: query(s.secrets.rfq)}],
                    ["order", SO + "get#SalesOrder", {orderId: s.orderId}],
                    ["order", "mantle.sales.SalesWorkspaceServices.find#SalesOrders", {text: query(s.secrets.order)}],
                    ["account", "mantle.sales.SalesWorkspaceServices.find#Accounts", {text: s.accountName}],
                    ["agreement", "mantle.party.SalesAgreementServices.get#SalesAgreement", {agreementId: s.agreementId}],
                    ["agreement", "mantle.party.SalesAgreementServices.find#SalesAgreements", {text: s.secrets.agreement}]
                ]
                for (const [kind, service, parameters] of reads) {
                    if (!kinds.includes(kind) || Object.values(parameters).some(value => value == null)) continue
                    const out = direct(viewer, service, parameters)
                    const seen = leaks(s, viewer, JSON.stringify(plain(Object.assign({}, out, {error: ""}))))
                    if (seen.length) problems.push(`${viewer}'s ${service} answers ${seen}`)
                }
                // the writes: refused
                const writes = [
                    [
                        "deal",
                        O + "update#Opportunity",
                        {salesOpportunityId: s.dealId, expectedRevision: dealRevision(s.dealId), nextStep: "P20 walk"}
                    ],
                    [
                        "deal",
                        O + "move#Opportunity",
                        {
                            salesOpportunityId: s.dealId,
                            opportunityStageId: "SalesProposal",
                            expectedRevision: dealRevision(s.dealId)
                        }
                    ],
                    [
                        "deal",
                        O + "close#Opportunity",
                        {salesOpportunityId: s.dealId, statusId: "SalesOppLost", expectedRevision: dealRevision(s.dealId)}
                    ],
                    ["deal", O + "add#OpportunityActivity", {salesOpportunityId: s.dealId, workEffortName: "P20 walk activity"}],
                    [
                        "quote",
                        Q + "store#QuoteLine",
                        {orderId: s.quoteId, orderRevision: revisionOf(s.quoteId), productId: "DEMO_1_1", quantity: 1}
                    ],
                    [
                        "quote",
                        "mantle.order.SalesQuoteIssueServices.send#Quote",
                        {orderId: s.quoteId, orderRevision: revisionOf(s.quoteId), previewOnly: "Y"}
                    ],
                    [
                        "rfq",
                        Q + "store#QuoteRequestItem",
                        {requestId: s.requestId, requestRevision: rfqRevision(s.requestId), productId: "DEMO_1_1", quantity: 1}
                    ],
                    ["order", SO + "approve#SalesOrder", {orderId: s.orderId, orderRevision: "0"}],
                    ["order", SO + "hold#SalesOrder", {orderId: s.orderId, holdTypeEnumId: "OhtManual", holdComment: "P20 walk"}],
                    [
                        "order",
                        "mantle.order.OrderChangeServices.save#OrderChange",
                        {
                            orderId: s.orderId,
                            orderChangeKindEnumId: "OckPrice",
                            reason: "P20 walk",
                            lines: [{orderItemSeqId: "01", proposedUnitAmount: 1}]
                        }
                    ]
                ]
                for (const [kind, service, parameters] of writes) {
                    if (!kinds.includes(kind)) continue
                    const out = direct(viewer, service, parameters)
                    if (!refusedText.test(out.error))
                        problems.push(`${viewer} calls ${service} on ${s.name}'s record: ${out.error || "accepted"}`)
                }
                // the forecast of Retail's representative (P18): its key's readers only
                if (s.name === "retail" && kinds.includes("deal")) {
                    const forecast = direct(viewer, "mantle.sales.ForecastServices.get#Forecast", {
                        salesForecastId: ids.forecasts.rep
                    })
                    if (!refusedText.test(forecast.error))
                        problems.push(`${viewer} reads sales.rep's forecast: ${forecast.error || "given"}`)
                }
            }
            const after = {
                deal: one(OPPORTUNITY, {salesOpportunityId: s.dealId}),
                quoteLines: rows("mantle.order.OrderItem", {orderId: s.quoteId}).length,
                rfqLines: rows("mantle.request.RequestItem", {requestId: s.requestId}).length,
                holds: rows("mantle.order.OrderHoldReason", {orderId: s.orderId}).length,
                changes: rows(REQUEST, {orderId: s.orderId, requestTypeEnumId: "RqtOrderChange"}).length
            }
            if (after.deal.statusId !== before.deal.statusId || after.deal.opportunityStageId !== before.deal.opportunityStageId)
                problems.push(`${s.name}'s deal changed`)
            if (after.deal.nextStep !== before.deal.nextStep) problems.push(`${s.name}'s deal's next step changed`)
            for (const key of ["quoteLines", "rfqLines", "holds", "changes"])
                if (after[key] !== before[key]) problems.push(`${s.name}'s ${key} went from ${before[key]} to ${after[key]}`)
            const activities = rows("mantle.sales.opportunity.SalesOpportunityWorkEffort", {salesOpportunityId: s.dealId}).length
            if (activities) problems.push(`${s.name}'s deal got ${activities} activities`)
        }
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("costs: no Sales user gets a cost or margin from a quote, an order or the sales analysis", {
    when() {
        const problems = []
        const s = sides.retail
        // the readers of Retail's records: the owner, the manager, the reader, the administrator
        for (const user of [users.rep, users.manager, users.reader, users.admin, users.bothManager]) {
            for (const [service, parameters] of [
                [Q + "get#Quote", {orderId: s.quoteId}],
                [SO + "get#SalesOrder", {orderId: s.orderId}]
            ]) {
                const out = direct(user, service, parameters)
                const keys = costKeys(plain(Object.assign({}, out, {error: null})))
                if (keys.length) problems.push(`${user}'s ${service} answers ${keys}`)
            }
        }
        for (const user of [users.manager, users.reader, users.admin, users.bothManager]) {
            const analysis = direct(user, "mantle.sales.SalesReportServices.run#SalesAnalysis", {organizationPartyId: s.org})
            if (analysis.error) problems.push(`${user}'s sales analysis: ${analysis.error}`)
            if (analysis.costShown) problems.push(`${user}'s sales analysis shows costs`)
            const keys = Array.from(analysis.analysisRows || []).flatMap(row => costKeys(plain(row)))
            if (keys.length) problems.push(`${user}'s analysis rows carry ${[...new Set(keys)]}`)
        }
        // Ziziwork Sales' rep reads no Retail analysis
        const other = direct(users.otherRep, "mantle.sales.SalesReportServices.run#SalesAnalysis", {organizationPartyId: s.org})
        if (!refusedText.test(other.error)) problems.push(`${users.otherRep} reads Retail's analysis: ${other.error || "given"}`)
        const control = direct("john.doe", "mantle.sales.SalesReportServices.run#SalesAnalysis", {organizationPartyId: s.org})
        return {problems, controlCosts: control.costShown}
    },
    then({problems, controlCosts}) {
        problems.join("\n") == ""
        controlCosts == true
    }
})

feature("finance: no Sales group reads an invoice or a payment, nor sends the invoice; john.doe opens it", {
    when() {
        const problems = []
        const s = sides.retail
        for (const user of groupUsers) {
            const page = render(user, "Orders/InvoiceDetail", {invoiceId: s.invoiceId})
            if (!page.output.includes("Invoice not available") && opens(page)) problems.push(`${user} opens the invoice`)
            const checked = ask(user, C + "check#Record", {recordType: "invoice", recordId: s.invoiceId})
            if (!checked.error.includes("RECORD_UNAVAILABLE"))
                problems.push(`${user} checks the invoice: ${checked.error || "given"}`)
            const order = direct(user, SO + "get#SalesOrder", {orderId: s.orderId})
            if (Array.from(order.invoices || []).length || Array.from(order.payments || []).length || order.showMoney)
                problems.push(`${user}'s order shows its invoices or payments`)
            const sent = post(user, "Orders/InvoiceDetail/salesInvoiceSend", {
                invoiceId: s.invoiceId,
                operationKey: "p20a-send-" + user
            })
            if (!sent) problems.push(`${user} sends the invoice`)
            const sendDirect = direct(user, "mantle.account.InvoiceServices.send#Invoice", {
                invoiceId: s.invoiceId,
                operationKey: "p20a-direct-" + user
            })
            if (!sendDirect.error) problems.push(`${user} sends the invoice through Accounting's service`)
        }
        const control = render("john.doe", "Orders/InvoiceDetail", {invoiceId: s.invoiceId})
        const controlOrder = direct("john.doe", SO + "get#SalesOrder", {orderId: s.orderId})
        return {
            problems,
            control: opens(control) && !control.output.includes("Invoice not available"),
            controlInvoices: Array.from(controlOrder.invoices || []).map(row => row.invoiceId)
        }
    },
    then({problems, control, controlInvoices}) {
        problems.join("\n") == ""
        control == true
        controlInvoices.includes(sides.retail.invoiceId)
    }
})

feature("borrowed actions: no Sales group holds them; each is refused the Credit hold, while the approver keeps a Manual one", {
    when() {
        const problems = []
        const borrowed = [
            "PRODUCT_COST_VIEW",
            "PRICE_EDIT",
            "CREDIT_HOLD_RELEASE",
            "PAYMENT_HOLD_RELEASE",
            "RECEIVABLE_VIEW",
            "RECEIVABLE_EDIT",
            "ACCOUNTING_VIEW",
            "SHIPMENT_PICK",
            "SHIPMENT_PACK",
            "SHIPMENT_SHIP"
        ]
        for (const user of groupUsers) {
            const held = asUser(user, () => borrowed.filter(permission => ec.user.hasPermission(permission)))
            if (held.length) problems.push(`${user} holds ${held}`)
        }
        const s = sides.retail
        for (const user of groupUsers) {
            const released = direct(user, SO + "release#SalesOrderHold", {
                orderHoldReasonId: s.creditHoldId,
                releaseComment: "P20 walk"
            })
            if (!/HOLD_TYPE_DENIED|HOLD_UNAVAILABLE|PERMISSION_DENIED/.test(released.error))
                problems.push(`${user} releases the Credit hold: ${released.error || "released"}`)
        }
        const credit = one("mantle.order.OrderHoldReason", {orderHoldReasonId: s.creditHoldId})
        // the approver places a Manual hold on the same order and releases it (ORDER_APPROVE, Sales' own hold)
        const placed = direct(users.approver, SO + "hold#SalesOrder", {
            orderId: s.heldOrderId,
            holdTypeEnumId: "OhtManual",
            holdComment: "P20 walk manual"
        })
        const manual = rows("mantle.order.OrderHoldReason", {orderId: s.heldOrderId, holdTypeEnumId: "OhtManual"}).find(
            row => !row.releasedDate
        )
        const releasedManual = manual
            ? direct(users.approver, SO + "release#SalesOrderHold", {
                  orderHoldReasonId: manual.orderHoldReasonId,
                  releaseComment: "P20 walk"
              })
            : {error: "no manual hold"}
        return {problems, credit, placed: placed.error, releasedManual: releasedManual.error}
    },
    then({problems, credit, placed, releasedManual}) {
        problems.join("\n") == ""
        credit != null
        credit.releasedDate == null
        placed == ""
        releasedManual == ""
    }
})
