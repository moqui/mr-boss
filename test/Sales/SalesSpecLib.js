// Helpers the Sales specs share: the demo ids (data/BossUsersDemoData.xml and the other apps' demo organizations), the demo users by
// group, a block run as a user with artifact authorization on, a call's refusal message, a Sales page render and the shell's menu
// and providers. Later phases add their ids and users here.
const ids = {
    // the Sales users' organization (Retail) and the second demo organization, the storeless seller (impl-sales F72), which
    // sales.rep3 works alone
    organizationId: "ORG_ZIZI_RETAIL",
    otherOrganizationId: "ORG_ZIZI_SALES",
    // the menu of design §1.2 built so far: every Sales user's (Pipeline since P4, Accounts since P3, Quotes since P7, Orders since
    // P11, Agreements since P15), and with Reports a report reader's
    staffMenu: ["Home", "Pipeline", "Accounts", "Quotes", "Orders", "Agreements"],
    reportMenu: ["Home", "Pipeline", "Accounts", "Quotes", "Orders", "Agreements", "Reports"],
    // P18 adds Target attainment
    reportsMenu: ["Catalogue", "SalesSummary", "SalesAnalysis", "TargetAttainment", "PipelineAnalysis", "WinLoss"],
    accountsMenu: ["Accounts", "Contacts"],
    keys: ["g s", "g a", "g c", "g o", "g l", "g q", "g r", "g m"],
    // P3's demo accounts and contacts (data/BossYSalesAccountsDemoData.xml): Retail's Wingtip Traders (sales.rep's, under its parent
    // Wingtip Group), Contoso Labs (a prospect, sales.rep2's), Kim Park (an individual customer) and the duplicate pair Adatum
    // Corporation and Adatum Corp; Dana Morales, a contact of Wingtip Traders and Contoso Labs; Ziziwork Sales' Fabrikam
    // Industrial (sales.rep3's, with its contact Lee Chen) and Tailspin Outfitters
    accounts: {
        wingtip: "BOSS_SAL_ACC_WINGTIP",
        group: "BOSS_SAL_ACC_WTGROUP",
        contoso: "BOSS_SAL_ACC_CONTOSO",
        kim: "BOSS_SAL_ACC_KIMPARK",
        adatum: "BOSS_SAL_ACC_ADATUM",
        adatum2: "BOSS_SAL_ACC_ADATUM2",
        fabrikam: "BOSS_SAL_ACC_FABRIKAM",
        tailspin: "BOSS_SAL_ACC_TAILSPIN"
    },
    contacts: {dana: "BOSS_SAL_CON_DANA", lee: "BOSS_SAL_CON_LEE"},
    // P15: Retail's demo agreements (data/BossZSalesDemoData.xml): Contoso's active supply terms and the standard terms template
    agreements: {contoso: "BOSS_SAL_AGR_CONTOSO", standard: "BOSS_SAL_AGR_STANDARD"},
    // P2: Settings, the administrator's and, for Teams, the manager's (with Accounts and Reports a manager's menu); its tabs
    managerMenu: ["Home", "Pipeline", "Accounts", "Quotes", "Orders", "Agreements", "Reports", "Settings"],
    // P9 adds Defaults and Approval rules
    // P18 adds Targets, the manager's too
    settingsMenu: [
        "Readiness",
        "Stages",
        "Teams",
        "LeadSources",
        "Targets",
        "TypesAndReasons",
        "SalesDefaults",
        "ApprovalPolicies"
    ],
    managerSettingsMenu: ["Teams", "Targets"],
    // P4: Pipeline's tabs, and the demo deals (data/BossZSalesDemoData.xml): Retail East's (sales.rep's) Wingtip refit in Proposal with
    // an activity, its maintenance plan (recurring), Kim Park's renewal (won), a website lead and the trade fair lead in East's queue;
    // Retail West's (sales.rep2's) Contoso pilot on West's pipeline, Adatum's racks (lost), Contoso's second site (a lead) and a partner
    // referral in West's queue (no owner);
    // Ziziwork Sales' (sales.rep3's) Fabrikam line upgrade and its outbound-call lead
    // P18 adds Forecast
    pipelineMenu: ["Opportunities", "Leads", "Forecast"],
    deals: {
        wingtip: "BOSS_SAL_OPP_WINGTIP_Q4",
        wingtipPlan: "BOSS_SAL_OPP_WINGTIP_SVC",
        kim: "BOSS_SAL_OPP_KIM_RENEW",
        contoso: "BOSS_SAL_OPP_CONTOSO_PILOT",
        adatum: "BOSS_SAL_OPP_ADATUM_LOST",
        fabrikam: "BOSS_SAL_OPP_FABRIKAM_LINE",
        fairLead: "BOSS_SAL_OPP_LEAD_FAIR",
        webLead: "BOSS_SAL_OPP_LEAD_WEB",
        contosoLead: "BOSS_SAL_OPP_LEAD_CONTOSO",
        westQueueLead: "BOSS_SAL_OPP_LEAD_WEST_QUEUE",
        callsLead: "BOSS_SAL_OPP_LEAD_CALLS"
    },
    wingtipActivity: "BOSS_SAL_ACT_WINGTIP",
    // P7: the demo quotes (data/BossZSalesDemoData.xml): Retail East's draft for Wingtip (sales.rep; a customer price line and an
    // entered price), Ziziwork Sales' storeless draft for Fabrikam (sales.rep3; taxed through the seller's gateway); Quotes' tabs
    quotes: {wingtip: "BOSS_SAL_QTE_WINGTIP", fabrikam: "BOSS_SAL_QTE_FABRIKAM"},
    // P12 adds Quote templates
    quotesMenu: ["Quotes", "QuoteRequests", "QuoteTemplates"],
    // P8: the demo requests for quote (data/BossZSalesDemoData.xml): sales.rep's phoned request from Wingtip (three lines, the third
    // with no product), and the mail to sales+rfq@ that East's queue took (its request found by the message)
    rfqs: {wingtip: "BOSS_SAL_RFQ_WINGTIP", mailMessage: "BOSS_SAL_MSG_RFQ"},
    // P9: Quotes' tabs for a sales approver (Approvals), and Retail's demo approval rules (data/BossZSalesDemoData.xml): a discount of
    // 5 % or more (the Wingtip draft's refit line) and a free line, each a sales approver's
    approverQuotesMenu: ["Quotes", "QuoteRequests", "QuoteTemplates", "Approvals"],
    approvalRules: {discount: "BOSS_SAL_APR_RETAIL_DISCOUNT", free: "BOSS_SAL_APR_RETAIL_FREE"},
    // P12: Retail's demo quote templates (data/BossZSalesDemoData.xml): the published store refit starter (sales.manager's: Demo
    // Product One-One priced on the quote's date, Demo Product One-Two at a fixed bundle rate, an installation charge) and a draft
    templates: {refit: "BOSS_SAL_TPL_REFIT", service: "BOSS_SAL_TPL_SERVICE"},
    // P18: Retail's 2026 Q4 sales period and its targets (data/BossZSalesDemoData.xml): Retail's, Retail East's under it and sales.rep's
    // under East (with the rep's submitted forecast), and sales.rep2's measured on placed orders
    periods: {q4: "BOSS_SAL_TP_2026Q4"},
    forecasts: {
        retail: "BOSS_SAL_FC_RETAIL_Q4",
        east: "BOSS_SAL_FC_EAST_Q4",
        rep: "BOSS_SAL_FC_REP_Q4",
        rep2: "BOSS_SAL_FC_REP2_Q4"
    }
}
// The demo users of each group (each but the administrator also in BOSS_SALES), agents of Ziziwork Retail but sales.rep3 (Ziziwork
// Sales only) and sales.manager2 and sales.admin (both), none in ADMIN; a Projects client contact, a PASS public account and another
// app's user; an identity operator; and an instance administrator (ADMIN).
const users = {
    rep: "sales.rep",
    rep2: "sales.rep2",
    manager: "sales.manager",
    approver: "sales.approver",
    change: "sales.change",
    agreement: "sales.agreement",
    reader: "sales.reader",
    otherRep: "sales.rep3",
    bothManager: "sales.manager2",
    admin: "sales.admin",
    client: "sheldon.acme",
    pass: "dana@joesdist.example.com",
    otherApp: "customerservice.read",
    identity: "admin.identity",
    system: "john.doe"
}

// Run action as username with artifact authorization enabled, then sign in again as the user before.
function asUser(username, action) {
    const previousUsername = ec.user.username || "john.doe"
    login(username)
    const disabled = ec.artifactExecution.authzDisabled()
    try {
        ec.artifactExecution.enableAuthz()
        return action()
    } finally {
        ec.message.clearErrors()
        if (disabled) ec.artifactExecution.disableAuthz()
        else ec.artifactExecution.enableAuthz()
        login(previousUsername)
    }
}
// Run action with artifact authorization disabled (a spec's own setup and reads).
function system(action) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try {
        return action()
    } finally {
        if (!wasDisabled) ec.artifactExecution.enableAuthz()
    }
}
// The message a call is refused with, or "" when it succeeds: a negative case checks the message names the refusal, and a
// positive case with the same parameters gets "", so a validation error is not taken for a refusal.
function refusal(service, parameters = {}) {
    ec.message.pushErrors()
    try {
        ec.service.sync().name(service).parameters(parameters).requireNewTransaction(true).call()
        return ec.message.hasError() ? ec.message.getErrorsString() : ""
    } catch (error) {
        return String(error.message)
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
}
function invoke(service, parameters = {}) {
    return ec.service.sync().name(service).parameters(parameters).call() || {}
}
// A Sales screen as the shell fetches it (qvt, a fragment of the last standalone screen, with its lists' data), with a widget's
// render error counted among the errors; root names another app's root for a shared screen's mount.
function page(path, parameters = {}, mode = "qvt", root = "Sales") {
    const renderer = ec.screen
        .makeTest()
        .rootScreen("component://mr-boss/screen/" + root + ".xml")
        .renderMode(mode)
    if (mode === "qvt") renderer.withStaticData()
    const result = renderer.render(path, Object.assign({lastStandalone: "-2"}, parameters), null)
    const output = String(result.output || "")
    const failed = output.match(/(Error rendering|Exception in render)[^\n<]*/g) || []
    const errors = Array.from(result.errorMessages || []).concat(failed)
    ec.message.clearErrors()
    return {status: result.status, output, errors}
}
// A screen render's refusal as the user, nothing of its content: "" when it opens, else its status and errors, which for a refusal
// name the authorization.
function screenRefusal(user, path, parameters = {}) {
    const rendered = asUser(user, () => page(path, parameters, "html"))
    return rendered.status === 200 && rendered.errors.length === 0 ? "" : rendered.status + " " + rendered.errors.join(" | ")
}
// A path under the web root as the user (the REST APIs, menu and shell data): its status, output and whether it was refused.
function hit(path, parameters = {}) {
    const result = ec.screen.makeTest().rootScreen("component://webroot/screen/webroot.xml").render(path, parameters, null)
    const errors = Array.from(result.errorMessages || []).join(" | ")
    ec.message.clearErrors()
    return {
        status: result.status,
        output: String(result.output || ""),
        refused: result.status == 401 || result.status == 403 || /not authorized/i.test(errors)
    }
}
// The shell's menu of Sales and the launcher's apps for the user, as the shell fetches them; menuOnly leaves out the shell data (the
// launcher and providers). path and group give another level of the menu (Reports' tabs).
function shell(user, menuOnly = false, path = "Home", group = "Sales") {
    const root = "component://webroot/screen/webroot.xml"
    return asUser(user, () => {
        const menu = ec.screen
            .makeTest()
            .rootScreen(root)
            .render("menuData/apps/Sales/" + path, {}, null)
        const apps = menuOnly ? [] : JSON.parse(ec.screen.makeTest().rootScreen(root).render("shellData", {}, null).output).apps
        const level = menu.status == 200 ? JSON.parse(menu.output).find(level => level.name === group) : null
        return {
            status: menu.status,
            names: level ? level.subscreens.filter(item => item.menuInclude).map(item => item.name) : [],
            apps: apps.map(app => app.name),
            providers: apps.find(app => app.name === "Sales")?.providers
        }
    })
}

// ===== P16: a recurring base =====
// An approved sales order of Retail for an account (one line of Demo Product One-One, approved in place: no reservation, mail or
// approval rule) and, made from it by the agreement keeper, a monthly recurring base: {sourceOrderId, baseOrderId}.
function recurringBase(customerPartyId = ids.accounts.wingtip) {
    const sourceOrderId = system(() => {
        const created = invoke("mantle.order.OrderServices.create#Order", {
            vendorPartyId: ids.organizationId,
            customerPartyId,
            currencyUomId: "USD",
            orderName: "Monthly restock"
        })
        invoke("mantle.order.OrderServices.create#OrderItem", {
            orderId: created.orderId,
            orderPartSeqId: created.orderPartSeqId,
            productId: "DEMO_1_1",
            itemTypeEnumId: "ItemProduct",
            quantity: 4,
            unitAmount: 25,
            requireInventory: false
        })
        for (const value of [
            ec.entity.find("mantle.order.OrderHeader").condition("orderId", created.orderId).one(),
            ec.entity.find("mantle.order.OrderPart").condition("orderId", created.orderId).one()
        ]) {
            value.set("statusId", "OrderApproved")
            value.update()
        }
        return created.orderId
    })
    // the keeper's call, the service's own permission check deciding
    const stored = asUser(users.agreement, () =>
        system(() =>
            invoke("mantle.order.SalesRecurrenceServices.store#SalesRecurrence", {
                orderId: sourceOrderId,
                frequency: "monthly",
                dayOfMonth: "1",
                hourOfDay: "6",
                recurTimeZone: "America/Denver",
                recurFromDate: String(Date.now() - 60 * 24 * 60 * 60 * 1000)
            })
        )
    )
    return {sourceOrderId, baseOrderId: stored.baseOrderId}
}

// ===== P20 sweeps =====
// The screen sweeps (acceptance SalesTui and SalesServerStatic, impl-sales P20), as MaintenanceSpecLib's: the shared screens Sales
// mounts, as [path under the root, location], read from each Sales screen file's subscreens-items (walkChildTree follows files, not
// mounts). Commons' Notifications under Quotes/Approvals is Commons' (it opens on a notification), not swept here.
function mountedScreens() {
    const files = []
    ec.resource.getLocationReference("component://mr-boss/screen/Sales.xml").walkChildTree(files, null)
    const found = []
    for (const file of files) {
        if (!file.location.endsWith(".xml")) continue
        const parent = file.path === "Sales" ? "" : file.path.substring("Sales/".length) + "/"
        const text = String(ec.resource.getLocationReference(file.location).getText())
        const item = /<subscreens-item name="([^"]+)"\s+location="(component:\/\/mr-boss\/screen\/Shared\/[^"]+\.xml)"/g
        for (let match = item.exec(text); match; match = item.exec(text)) found.push([parent + match[1], match[2]])
    }
    return found
}
// The tabs of a mounted screen that the current user's menu shows under Sales (a shared screen's tabs of another app's context are
// not offered there), as paths under the root; none when its menu names none
function mountTabs(path, parameters = {}) {
    const name = path.substring(path.lastIndexOf("/") + 1)
    const query = Object.entries(parameters)
        .map(([key, value]) => key + "=" + encodeURIComponent(value))
        .join("&")
    const menu = ec.screen
        .makeTest()
        .rootScreen("component://webroot/screen/webroot.xml")
        .render("menuData/apps/Sales/" + path + (query ? "?" + query : ""), {}, null)
    ec.message.clearErrors()
    if (menu.status != 200) return []
    // the deepest level of that name (the menu lists each level of the path; a leaf has no subscreens)
    const level = JSON.parse(menu.output)
        .filter(level => level.name === name)
        .pop()
    return (level?.subscreens || []).filter(item => item.menuInclude).map(item => path + "/" + item.name)
}
// The records the Sales demo has no row of, made for the sweeps (as SalesOrderChanges makes them): a rep's direct order for Wingtip,
// placed and approved, with a price change the change operator filed and the approver decided; a second order, part shipped and so
// invoiced; and a monthly recurring base (recurringBase). {orderId, requestId, shippedOrderId, shipmentId, invoiceId, baseOrderId}
function sweepOrders() {
    const O = "mantle.order.SalesOrderServices."
    const revisionOf = id =>
        Number(ec.entity.find("mantle.order.OrderHeader").condition("orderId", id).disableAuthz().one().orderRevision)
    const approved = (orderName, quantity) => {
        const id = asUser(users.rep, () =>
            system(() => {
                const made = invoke(O + "create#SalesOrder", {
                    organizationPartyId: ids.organizationId,
                    customerPartyId: ids.accounts.wingtip,
                    contactPartyId: ids.contacts.dana,
                    orderName
                }).orderId
                invoke(O + "store#SalesOrderLine", {
                    orderId: made,
                    orderRevision: revisionOf(made),
                    productId: "DEMO_1_1",
                    quantity
                })
                invoke(O + "place#SalesOrder", {orderId: made, orderRevision: revisionOf(made)})
                return made
            })
        )
        asUser(users.approver, () =>
            system(() =>
                invoke(O + "approve#SalesOrder", {
                    orderId: id,
                    orderRevision: revisionOf(id),
                    operationKey: "sweep-approve-" + id
                })
            )
        )
        return id
    }
    const orderId = approved("Wingtip sweep shelving", 4)
    const saved = asUser(users.change, () =>
        system(() =>
            invoke("mantle.order.OrderChangeServices.save#OrderChange", {
                orderId,
                orderChangeKindEnumId: "OckPrice",
                reason: "Volume discount agreed on the phone",
                lines: [{orderItemSeqId: "01", proposedUnitAmount: 7}]
            })
        )
    )
    asUser(users.approver, () =>
        system(() =>
            invoke("mantle.order.OrderChangeServices.decide#OrderChange", {
                requestId: saved.requestId,
                sourceRevision: saved.sourceRevision
            })
        )
    )
    const shippedOrderId = approved("Wingtip sweep shipped shelving", 3)
    const shipped = system(() => {
        const S = "mantle.shipment.ShipmentServices."
        const shipment = invoke(S + "create#OrderPartShipment", {orderId: shippedOrderId, orderPartSeqId: "01"})
        invoke(S + "pack#ShipmentProduct", {
            shipmentId: shipment.shipmentId,
            shipmentPackageSeqId: shipment.shipmentPackageSeqId,
            productId: "DEMO_1_1",
            quantity: 1
        })
        invoke(S + "pack#Shipment", {shipmentId: shipment.shipmentId})
        invoke(S + "ship#Shipment", {shipmentId: shipment.shipmentId})
        const billing = ec.entity.find("mantle.order.OrderItemBilling").condition("orderId", shippedOrderId).list()
        return {shipmentId: shipment.shipmentId, invoiceId: billing.size() ? billing.get(0).invoiceId : null}
    })
    ec.message.clearErrors()
    return Object.assign(
        {orderId, requestId: saved.requestId || null, shippedOrderId, baseOrderId: recurringBase().baseOrderId},
        shipped
    )
}
// The demo record a swept screen opens on: the entry of the screen or its nearest parent (a tab takes its record's); made is
// sweepOrders' records (an order, its change, a shipment and an invoice)
const opportunityRecord = {recordEntity: "mantle.sales.opportunity.SalesOpportunity", recordId: ids.deals.wingtip}
const organization = {organizationPartyId: ids.organizationId}
const sweepRecords = (made = {}) => ({
    Home: organization,
    Chatter: opportunityRecord,
    RecordFiles: opportunityRecord,
    LogNote: {entityName: opportunityRecord.recordEntity, recordId: ids.deals.wingtip},
    SendMessage: {entityName: opportunityRecord.recordEntity, recordId: ids.deals.wingtip},
    "QuickCreate/NewActivity": {salesOpportunityId: ids.deals.wingtip},
    "QuickCreate/NewContact": {accountPartyId: ids.accounts.wingtip},
    "Pipeline/OpportunityDetail": {salesOpportunityId: ids.deals.wingtip},
    "Pipeline/WorkItemDetail": {workEffortId: ids.wingtipActivity},
    "Pipeline/Forecast": {organizationPartyId: ids.organizationId, timePeriodId: ids.periods.q4},
    "Accounts/Customer360": {organizationPartyId: ids.organizationId, customerPartyId: ids.accounts.wingtip},
    "Accounts/ContactDetail": {partyId: ids.contacts.dana},
    "Accounts/MergeCompare": {partyId: ids.accounts.adatum, otherPartyId: ids.accounts.adatum2},
    "Quotes/QuoteRequestDetail": {requestId: ids.rfqs.wingtip},
    "Quotes/QuoteTemplateDetail": {orderId: ids.templates.refit},
    "Orders/OrderDetail": {orderId: made.orderId || ""},
    "Orders/OrderChangeDetail": {requestId: made.requestId || ""},
    "Orders/ShipmentDetail": {shipmentId: made.shipmentId || ""},
    "Orders/InvoiceDetail": {invoiceId: made.invoiceId || ""},
    "Orders/QuoteSend": {orderId: ids.quotes.wingtip},
    "Products/Product360": {productId: "DEMO_1_1", organizationPartyId: ids.organizationId},
    "Products/InventoryAvailability": {productId: "DEMO_1_1"},
    "Products/PriceExplain": {orderId: ids.quotes.wingtip, orderItemSeqId: "01"},
    "Agreements/AgreementDetail": {agreementId: ids.agreements.contoso},
    "Agreements/PriceLists/PriceListDetail": {priceListId: "BOSS_PRICE_LIST"},
    Settings: organization,
    "Settings/Teams": {organizationPartyId: ids.organizationId, teamPartyId: "BOSS_SAL_TEAM_EAST"},
    "Settings/Targets": {organizationPartyId: ids.organizationId, timePeriodId: ids.periods.q4},
    Reports: organization
})
function sweepParameters(path, made = {}) {
    const records = sweepRecords(made)
    const key = Object.keys(records)
        .filter(key => path === key || path.startsWith(key + "/"))
        .sort((a, b) => b.length - a.length)[0]
    return key ? records[key] : {}
}
// The second records of a screen the tui sweep renders again (each path's own record is sweepParameters'): OrderDetail on the
// demo quote, the storeless seller's quote and the recurring base, OpportunityDetail on a lead, as [path, parameters]
function sweepExtras(made = {}) {
    return [
        ["Orders/OrderDetail", {orderId: ids.quotes.wingtip}],
        ["Orders/OrderDetail", {orderId: ids.quotes.fabrikam}],
        ["Orders/OrderDetail", {orderId: made.baseOrderId || ""}],
        ["Pipeline/OpportunityDetail", {salesOpportunityId: ids.deals.webLead}]
    ]
}

;({
    ids,
    users,
    asUser,
    system,
    refusal,
    invoke,
    page,
    screenRefusal,
    hit,
    shell,
    recurringBase,
    mountedScreens,
    mountTabs,
    sweepOrders,
    sweepRecords,
    sweepParameters,
    sweepExtras
})
