// Helpers the Customer Service specs share: the demo ids (data/BossCustomerServiceDemoData.xml, BossUsersDemoData.xml), the
// demo users by group, a block run as a user with artifact authorization on or off, a call's refusal message, a Customer
// Service page render, the shell's menu and providers, and the route fixtures the acceptance AppStructure renders. Later
// phases add their ids, users and routes here.
const ids = {
    // Retail's sales orders (load#CustomerServiceDemo): delivered to Joe Q Public, awaiting pick and packed for Joe's
    // Distributing
    deliveredOrderId: "BOSS_CS_SO_DELIVERED",
    pickOrderId: "BOSS_CS_SO_PICK",
    packedOrderId: "BOSS_CS_SO_PACKED",
    // Ziziwork Services' customer and order
    otherOrderId: "BOSS_CS_SO_OTHER",
    otherCustomerId: "BOSS_CS_CUST_OTHER",
    // Retail's customers (Mantle's), and a shared one (ORG_ACME, whose owner is the Party default _NA_)
    customerId: "CustJqp",
    companyCustomerId: "JoeDist",
    sharedCustomerId: "ORG_ACME",
    // Retail's purchase order (Purchasing's demo), no sales order
    purchaseOrderId: "BOSS_PUR_PO_A",
    serializedProductId: "BOSS_CS_THERMOSTAT",
    organizationId: "ORG_ZIZI_RETAIL",
    otherOrganizationId: "ORG_ZIZI_SERVICES",
    // P2: the queues, teams and cases (BossCustomerServiceDemoData.xml, made cases by load#CaseDemo): Joe Q Public's two open
    // cases (the thermostat one assigned to the agent), Joe's Distributing's waiting one, Joe's privacy request in the
    // restricted Privacy queue, and Ziziwork Services' case
    supportQueueId: "BOSS_CS_Q_SUPPORT",
    privacyQueueId: "BOSS_CS_Q_PRIVACY",
    otherQueueId: "BOSS_CS_Q_SERVICES",
    supportTeamId: "BOSS_CS_TEAM_SUPPORT",
    thermostatCaseId: "BOSS_CS_CASE_THERMO",
    filtersCaseId: "BOSS_CS_CASE_FILTERS",
    pickCaseId: "BOSS_CS_CASE_PICK",
    privacyCaseId: "BOSS_CS_CASE_PRIVACY",
    otherCaseId: "BOSS_CS_CASE_OTHER",
    // P4: Retail's default service level policy (its Privacy queue has its own)
    slaPolicyId: "BOSS_CS_SLA_RETAIL",
    // P12: the demo articles (load#KnowledgeDemo) as [space, page path]: published for customers in English and Spanish, a
    // draft, and the agents' internal one
    articlePaths: {
        english: ["ZZW_RETAIL", "help/Thermostat reads the wrong temperature"],
        spanish: ["ZZW_RETAIL", "help/es/Thermostat temperatura incorrecta"],
        draft: ["ZZW_RETAIL", "help/Thermostat battery replacement"],
        internal: ["ZZW_SVC", "Thermostat calibration offset"]
    },
    // P3: Joe Q Public's held order (load#CustomerServiceDemo), the stocked filter and Retail's service mailbox
    heldOrderId: "BOSS_CS_SO_HELD",
    filterProductId: "BOSS_CS_FILTER",
    serviceMailAccountId: "BOSS_CS_SERVICE_MAIL",
    // P7: Retail's "Defective product" case template, which the Support queue uses
    templateFormId: "BOSS_CS_TPL_DEFECTIVE",
    // P6: Retail's mail and public form routes into the Support queue
    mailRouteId: "BOSS_CS_ROUTE_MAIL",
    formRouteId: "BOSS_CS_ROUTE_FORM",
    // P10: the filter's equivalent (a substitute for a short pick of the filter)
    substituteProductId: "BOSS_CS_FILTER_PLUS",
    // P9: Retail's return policy, and the Warehouse demo's requested return of Joe Q Public to Retail (BossWarehouseDemoData.xml)
    returnPolicyId: "BOSS_CS_RPOL_RETAIL",
    warehouseReturnId: "BOSS_WH_RETURN"
}
// P10: a proposed change of an order, made by a spec as the user and removed with its lines, parties, decisions and notices
// (no other spec's lists show it): {requestId, sourceRevision} or {error}.
function orderChange(user, parameters) {
    return asUser(
        user,
        () => {
            ec.message.pushErrors()
            try {
                const out =
                    ec.service
                        .sync()
                        .name("mantle.order.OrderChangeServices.save#OrderChange")
                        .parameters(parameters)
                        .requireNewTransaction(true)
                        .call() || {}
                return Object.assign({}, out, {error: ec.message.hasError() ? ec.message.getErrorsString() : ""})
            } finally {
                ec.message.clearErrors()
                ec.message.popErrors()
            }
        },
        false
    )
}
function removeOrderChange(requestId) {
    if (!requestId) return
    system(() => {
        const remove = (entity, conditions) => ec.entity.find(entity).condition(conditions).deleteAll()
        for (const message of Array.from(
            ec.entity
                .find("moqui.security.user.NotificationMessage")
                .condition({topic: "OrderChangeApproval", recordId: requestId})
                .list()
        )) {
            remove("moqui.security.user.NotificationMessageUser", {notificationMessageId: message.notificationMessageId})
            message.delete()
        }
        for (const entity of [
            "mantle.request.support.OrderChangeDecision",
            "mantle.request.RequestItemOrder",
            "mantle.request.RequestNote",
            "mantle.request.RequestItem",
            "mantle.request.RequestParty"
        ])
            remove(entity, {requestId})
        remove("mantle.request.Request", {requestId})
    })
}
// The demo users of each group (each also in BOSS_CUSTOMER_SERVICE but the administrator), and the other organization's agent.
const users = {
    agent: "customerservice.agent",
    manager: "customerservice.manager",
    orderDesk: "customerservice.orderdesk",
    returns: "customerservice.returns",
    knowledge: "customerservice.knowledge",
    admin: "customerservice.admin",
    agentWarehouse: "customerservice.agentwh",
    returnsReceivables: "customerservice.returnsar",
    read: "customerservice.read",
    services: "customerservice.services"
}

// Run action as username, with artifact authorization enabled or not, then sign in again as the user before.
function asUser(username, action, enabled = true) {
    const previousUsername = ec.user.username || "john.doe"
    login(username)
    const disabled = ec.artifactExecution.authzDisabled()
    try {
        if (enabled) ec.artifactExecution.enableAuthz()
        else ec.artifactExecution.disableAuthz()
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
// A Customer Service screen as the shell fetches it (qvt, a fragment of the last standalone screen, with its lists' data), with
// a widget's render error counted among the errors.
function page(path, parameters = {}, mode = "qvt") {
    const renderer = ec.screen.makeTest().rootScreen("component://mr-boss/screen/CustomerService.xml").renderMode(mode)
    if (mode === "qvt") renderer.withStaticData()
    const result = renderer.render(path, Object.assign({lastStandalone: "-2"}, parameters), null)
    const output = String(result.output || "")
    const failed = output.match(/(Error rendering|Exception in render)[^\n<]*/g) || []
    const errors = Array.from(result.errorMessages || []).concat(failed)
    ec.message.clearErrors()
    return {status: result.status, output, errors}
}
// The shell's menu of Customer Service and the launcher's apps for the user, as the shell fetches them.
function shell(user) {
    const root = "component://webroot/screen/webroot.xml"
    return asUser(user, () => {
        const menu = ec.screen.makeTest().rootScreen(root).render("menuData/apps/CustomerService/Home", {}, null)
        const data = ec.screen.makeTest().rootScreen(root).render("shellData", {}, null)
        const apps = JSON.parse(data.output).apps
        const level = menu.status == 200 ? JSON.parse(menu.output).find(level => level.name === "CustomerService") : null
        return {
            status: menu.status,
            names: level ? level.subscreens.filter(item => item.menuInclude).map(item => item.name) : [],
            apps: apps.map(app => app.name),
            providers: apps.find(app => app.name === "CustomerService")?.providers
        }
    })
}

// The route fixtures of the Customer Service screens that are not placeholders, for the acceptance AppStructure: by path under
// the root, the demo record's parameters and a text the screen shows in every data state; and the shared screens mounted
// under the root that the screen file walk does not find, as [path, screen location]. Each phase adds its routes.
function routeFixtures() {
    const routes = {
        // P1: Home's measures (measured by later phases) and the lookup of the delivered demo order
        Home: {parameters: {lookupType: "order", lookupId: ids.deliveredOrderId}, text: "Thermostat and filters"},
        // P2: the case screens and the settings
        "Cases/Cases": {parameters: {view: "all"}, text: "Cases"},
        "Cases/NewCase": {parameters: {customerPartyId: ids.customerId}, text: "New case"},
        "Cases/CaseDetail": {parameters: {requestId: ids.thermostatCaseId}, text: "Thermostat shows the wrong temperature"},
        "Settings/SettingsHome": {parameters: {}, text: "Customer Service settings"},
        "Settings/Queues": {parameters: {}, text: "Queues"},
        "Settings/AgentTeams": {parameters: {}, text: "Agent teams"},
        "Settings/CaseTypes": {parameters: {}, text: "Case types"},
        "Settings/StatusCategories": {parameters: {}, text: "Status categories"},
        "Settings/ServiceDefaults": {parameters: {}, text: "Service defaults"},
        "Cases/WorkItemDetail": {parameters: {workEffortId: "BOSS_CS_NO_TASK"}, text: "is not available in Customer Service"},
        // P4: the service levels and one case's measurements
        "Settings/ServiceLevelPolicies": {parameters: {}, text: "Service levels"},
        "Reports/CaseAnalytics": {parameters: {requestId: ids.thermostatCaseId}, text: "Events"},
        // P12: Knowledge (Commons Knowledge mounted, its qvue component), the feedback queue, an article from Joe's case and
        // the knowledge sources
        Knowledge: {fullPathOnly: true},
        "Knowledge/Knowledge": {parameters: {}, text: "BossKnowledge"},
        "Knowledge/ArticleFeedback": {parameters: {}, text: "Article feedback"},
        "Knowledge/CaseToArticle": {parameters: {requestId: ids.thermostatCaseId}, text: "Article from case"},
        "Settings/KnowledgeSources": {parameters: {}, text: "Knowledge sources"},
        // P7: the case templates
        "Settings/CaseTemplates": {parameters: {}, text: "Case templates"},
        // P5: the assignment rules, the saved replies and a bulk reply's preview
        "Settings/AssignmentRules": {parameters: {}, text: "Assignment rules"},
        "Settings/SavedReplies": {parameters: {}, text: "Saved replies"},
        "Cases/BulkReply": {
            parameters: {requestIds: ids.filtersCaseId, emailTextBlockId: "BOSS_CS_REPLY_PATIENCE"},
            text: "Reply to"
        },
        // P3: the customer, order and availability screens and the shared mounts under them
        "Customers/Customers": {parameters: {term: "joe@public.com"}, text: "Joe Public"},
        "Customers/Customer360": {parameters: {customerPartyId: ids.customerId}, text: "Joe Public"},
        "Customers/Customer360/ServiceOverview": {parameters: {customerPartyId: ids.customerId}, text: "joe@public.com"},
        "Customers/Customer360/ServiceCases": {parameters: {customerPartyId: ids.customerId}, text: ids.thermostatCaseId},
        "Customers/Customer360/ServiceOrders": {parameters: {customerPartyId: ids.customerId}, text: ids.deliveredOrderId},
        "Customers/Customer360/ServiceBilling": {parameters: {customerPartyId: ids.customerId}, text: "Invoice"},
        "Customers/ContactDetail": {parameters: {partyId: ids.customerId}, text: "Joe"},
        "Orders/Orders": {parameters: {term: ids.deliveredOrderId}, text: ids.deliveredOrderId},
        "Orders/OrderDetail": {parameters: {orderId: ids.heldOrderId}, text: "Waiting for the customer to confirm"},
        "Orders/ShipmentDetail": {parameters: {shipmentId: "BOSS_CS_NO_SHIPMENT"}, text: "Shipment not available"},
        "Orders/InvoiceDetail": {parameters: {invoiceId: "BOSS_CS_NO_INVOICE"}, text: "Invoice not available"},
        "Availability/Products": {parameters: {productId: ids.serializedProductId}, text: "Service demo smart thermostat"},
        "Availability/Product360": {parameters: {productId: ids.serializedProductId}, text: "Service demo smart thermostat"},
        "Availability/InventoryAvailability": {parameters: {productId: ids.filterProductId}, text: "Stock"},
        "Availability/StockAtDate": {parameters: {productId: ids.filterProductId}, text: "Stock at date"},
        // P6: the channel sessions and the channel routing
        "Cases/ChannelSessions": {parameters: {}, text: "Channel sessions"},
        "Settings/ChannelRouting": {parameters: {}, text: "Channel routing"},
        // P8: merge and split, opened from a case
        "Cases/MergeCases": {parameters: {requestId: ids.thermostatCaseId}, text: "Merge cases"},
        "Cases/SplitCase": {parameters: {requestId: ids.thermostatCaseId}, text: "Split case"},
        // P10: the order changes and the shared change detail
        "Orders/OrderChanges": {parameters: {}, text: "Order changes"},
        "Orders/OrderChangeDetail": {parameters: {requestId: "BOSS_CS_NO_CHANGE"}, text: "Order change not available"},
        // P9: the returns, a return, the RMA print, the return policies, the approvals and Customer360's Returns tab
        "Returns/Returns": {parameters: {view: "all"}, text: "Returns"},
        "Returns/NewReturn": {parameters: {orderId: ids.deliveredOrderId}, text: "What comes back"},
        "Returns/ReturnDetail": {parameters: {returnId: ids.warehouseReturnId}, text: "Return " + ids.warehouseReturnId},
        "Returns/QualityInspection": {parameters: {qualityInspectionId: "BOSS_CS_NO_INSPECTION"}, text: "not available"},
        "Returns/ReturnAuthorization": {parameters: {returnId: ids.warehouseReturnId}, text: ids.warehouseReturnId},
        "Settings/ReturnPolicies": {parameters: {}, text: "Return policies"},
        Approvals: {parameters: {}, text: "Approvals"},
        "Customers/Customer360/ServiceReturns": {parameters: {customerPartyId: ids.customerId}, text: "Request return"},
        // P13: the survey builder's mounts: the feedback forms, a form, the CSAT results and one answer
        "Settings/FeedbackForms": {parameters: {}, text: "Feedback forms"},
        "Settings/FeedbackFormDetail": {parameters: {formId: "BOSS_CS_NO_FORM"}, text: "is not available"},
        "Reports/SatisfactionResults": {parameters: {}, text: "Satisfaction results"},
        "Reports/ResponseDetail": {parameters: {formResponseId: "BOSS_CS_NO_RESPONSE"}, text: "not available"}
    }
    const mounts = [
        ["Cases/CaseDetail", "component://mr-boss/screen/Shared/RequestDetail.xml"],
        ["Cases/WorkItemDetail", "component://mr-boss/screen/Shared/WorkItemDetail.xml"],
        ["Knowledge/Knowledge", "component://mr-boss/screen/Commons/Knowledge.xml"],
        ["Customers/Customer360", "component://mr-boss/screen/Shared/Customer360.xml"],
        ["Orders/OrderDetail", "component://mr-boss/screen/Shared/OrderDetail.xml"],
        ["Orders/ShipmentDetail", "component://mr-boss/screen/Shared/ShipmentDetail.xml"],
        ["Orders/InvoiceDetail", "component://mr-boss/screen/Shared/InvoiceDetail.xml"],
        ["Availability/InventoryAvailability", "component://mr-boss/screen/Shared/InventoryAvailability.xml"],
        ["Availability/StockAtDate", "component://mr-boss/screen/Shared/StockAtDate.xml"],
        ["Availability/Product360", "component://mr-boss/screen/Shared/Product360.xml"],
        ["Orders/OrderChangeDetail", "component://mr-boss/screen/Shared/OrderChangeDetail.xml"],
        ["Returns/ReturnDetail", "component://mr-boss/screen/Shared/ReturnDetail.xml"],
        ["Returns/QualityInspection", "component://mr-boss/screen/Shared/QualityInspection.xml"],
        ["Approvals/Notifications", "component://mr-boss/screen/Commons/Notifications.xml"],
        // P13
        ["Settings/FeedbackForms", "component://mr-boss/screen/Shared/SurveyForms.xml"],
        ["Settings/FeedbackFormDetail", "component://mr-boss/screen/Shared/SurveyFormDetail.xml"],
        ["Reports/SatisfactionResults", "component://mr-boss/screen/Shared/SurveyResponses.xml"],
        ["Reports/ResponseDetail", "component://mr-boss/screen/Shared/SurveyResponseDetail.xml"]
    ]
    return {routes, mounts}
}

;({ids, users, asUser, system, refusal, invoke, page, shell, routeFixtures, orderChange, removeOrderChange})
