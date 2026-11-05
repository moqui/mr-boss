// Customer Service access (impl-customer-service §2, §4, P1): who may open Customer Service, the menu, providers and launcher
// per group, Home's one render (qvt), the capabilities from the Mantle permissions (own and borrowed) and the area
// authorizations, the organization and customer scope, the record check against another organization's and forged ids, a
// capability on a record, record links, the areas a group guards, and the paths around the Mantle services that no Customer
// Service group reaches: the Mantle REST order and return paths and the raw request, order and return mutators. One feature
// per rule, each case of it a line of its problems, with artifact authorization enabled. The Mantle services' own permission
// checks are Mantle's. The access and isolation walk is the acceptance CustomerServiceFoundationWalk. A later phase adds a
// case only for an access rule it adds, and its quick creates, Today sources and notification topics to the menu feature's
// rows.
// Run: ./moq test mr-boss --spec CustomerService/CustomerServiceAccess
const lib = ec.resource.script("component://mr-boss/test/CustomerService/CustomerServiceSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, shell} = lib
const access = "ironstone.customerservice.AccessServices."
// a refusal of a user without Customer Service: the service is not authorized for them, or it refuses them
const refused = message => /CUSTOMER_SERVICE_UNAVAILABLE|is not authorized/.test(message)
const values = result => Array.from(result.options || []).map(row => row.value)

spec({
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

// A screen render's refusal as the user, nothing of its content: "" when it opens, else its status and errors, which for a
// refusal name the authorization
function screenRefusal(user, path) {
    const rendered = asUser(user, () => lib.page(path, {}, "html"))
    return rendered.status === 200 && rendered.errors.length === 0 ? "" : rendered.status + " " + rendered.errors.join(" | ")
}
const unauthorized = message => /^40[13] |is not authorized/.test(message)

feature("a Customer Service user gets the context; another app's user and a Projects client contact are refused it and the app", {
    when() {
        const problems = []
        const context = user => asUser(user, () => refusal(access + "get#SharedContext", {}))
        for (const user of [users.read, users.agent, users.knowledge, users.admin, users.services]) {
            const message = context(user)
            if (message !== "") problems.push(`${user} is refused the context: ${message}`)
        }
        for (const user of ["warehouse.read", "finance.read", "purchasing.read", "sheldon.acme"]) {
            const message = context(user)
            if (!refused(message)) problems.push(`${user} gets the context: ${message || "accepted"}`)
        }
        const otherRoot = asUser(users.read, () => refusal(access + "get#SharedContext", {appRoot: "Warehouse"}))
        if (!otherRoot.includes("CUSTOMER_SERVICE_CONTEXT")) problems.push(`another root's context is given: ${otherRoot}`)
        for (const user of ["warehouse.read", "sheldon.acme"]) {
            const home = screenRefusal(user, "Home")
            if (!unauthorized(home)) problems.push(`${user} opens Home: ${home || "opened"}`)
        }
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

// the menu of design §1; Home, Cases, Customers, Orders, Availability and Knowledge open to every Customer Service user, the
// others by group (BOSS_CS_<Area>)
const order = ["Home", "Cases", "Customers", "Orders", "Returns", "Approvals", "Availability", "Knowledge", "Reports", "Settings"]
const open = ["Home", "Cases", "Customers", "Orders", "Availability", "Knowledge"]
const menuOf = extra => order.filter(name => open.includes(name) || extra.includes(name))

// quick create offers a case to the groups that enter cases (NewCase, BOSS_CS_NEW_CASE; P2); P9 adds Request return
feature("the Customer Service menu and providers follow each group's areas; the launcher shows it to its users only", {
    when() {
        const rows = [
            {user: users.read, extra: [], quick: []},
            {user: users.agent, extra: ["Returns", "Reports"], quick: ["customerServiceCase"]},
            {user: users.manager, extra: ["Returns", "Approvals", "Reports", "Settings"], quick: ["customerServiceCase"]},
            {user: users.orderDesk, extra: [], quick: []},
            {user: users.returns, extra: ["Returns", "Approvals", "Reports"], quick: []},
            {user: users.knowledge, extra: [], quick: []},
            {user: users.admin, extra: order, quick: ["customerServiceCase"]}
        ]
        const problems = []
        for (const {user, extra, quick} of rows) {
            const found = shell(user)
            const quickKinds = (found.providers?.quickCreate || []).map(item => item.kind)
            if (found.status != 200) problems.push(`${user}'s menu: ${found.status}`)
            if (JSON.stringify(found.names) !== JSON.stringify(menuOf(extra)))
                problems.push(`${user}'s menu is ${found.names}, not ${menuOf(extra)}`)
            if (JSON.stringify(quickKinds) !== JSON.stringify(quick))
                problems.push(`${user} is offered quick create ${quickKinds}, not ${quick}`)
            const topics = (found.providers?.notificationTopics || []).map(item => item.topic || item)
            if (quick.length && !["SupportCaseAssigned", "SupportCaseCustomerReply"].every(topic => topics.includes(topic)))
                problems.push(`${user} lacks the case topics: ${JSON.stringify(topics)}`)
            if (!(found.providers?.paletteSources || []).some(source => source.group === "CustomerService"))
                problems.push(`${user} has no Customer Service palette source`)
            if (!(found.providers?.keymaps || []).some(keymap => keymap.scope === "customerservice"))
                problems.push(`${user} has no customerservice key scope`)
        }
        // the launcher: the reader has Customer Service and no other business app; the agent who borrows Warehouse's receive
        // and inspect groups has no Warehouse launcher; another app's user has no Customer Service
        const readerApps = shell(users.read).apps
        if (!readerApps.includes("CustomerService")) problems.push(`the reader's launcher has no Customer Service: ${readerApps}`)
        const business = ["Products", "Accounting", "Manufacturing", "Warehouse", "Projects", "Sales", "Purchasing"]
        const otherApps = readerApps.filter(app => business.includes(app))
        if (otherApps.length) problems.push(`the reader's launcher has ${otherApps}`)
        if (shell(users.agentWarehouse).apps.includes("Warehouse")) problems.push("the borrowing agent has Warehouse")
        if (shell("warehouse.read").apps.includes("CustomerService")) problems.push("warehouse.read has Customer Service")
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("Home counts the agent's open cases, shows the later measures as not configured, My cases and the lookup of the order", {
    when() {
        return asUser(users.agent, () => lib.page("Home", {lookupType: "order", lookupId: ids.deliveredOrderId}))
    },
    then({status, errors, output}) {
        status == 200
        errors == []
        output.includes("SLA compliance")
        output.includes("CSAT")
        output.includes("Not configured")
        output.includes("Service health,")
        output.includes("Sales order " + ids.deliveredOrderId)
        output.includes("Thermostat and filters")
        output.includes("My cases")
        output.includes(ids.thermostatCaseId)
        output.includes("Team queues")
    }
})

const capabilityNames = [
    "caseEdit",
    "caseManage",
    "policyEdit",
    "knowledgeEdit",
    "contactInvite",
    "orderChangeRequest",
    "orderChangeApprove",
    "orderChangeApply",
    "orderHoldRelease",
    "returnAuthorize",
    "returnExceptionApprove",
    "returnPolicyEdit",
    "warrantyApprove",
    "creditRead",
    "receive",
    "inspect",
    "dispose",
    "invoiceCredit",
    "paymentRefund",
    "returnCredit",
    "returns",
    "approvals",
    "reports",
    "settings"
]
const agent = ["caseEdit", "orderChangeRequest", "creditRead", "returns", "reports"]
const authorizer = ["returnAuthorize", "returns", "approvals", "reports"]
const capabilityUsers = [
    {user: users.read, granted: []},
    {user: users.agent, granted: agent},
    {
        user: users.manager,
        granted: [
            "caseEdit",
            "caseManage",
            "contactInvite",
            "orderChangeApprove",
            "returnExceptionApprove",
            "warrantyApprove"
        ].concat(["returns", "approvals", "reports", "settings"])
    },
    {user: users.orderDesk, granted: ["orderChangeApply", "orderHoldRelease"]},
    {user: users.returns, granted: authorizer},
    {user: users.knowledge, granted: ["knowledgeEdit"]},
    // the borrowed groups: Warehouse's receive and inspect (W), Accounting's receivables (F), which reads credit too
    {user: users.agentWarehouse, granted: agent.concat(["receive", "inspect"])},
    {user: users.returnsReceivables, granted: authorizer.concat(["creditRead", "invoiceCredit"])}
]
feature("each group holds exactly the capabilities of its permissions and areas, the administrator every Customer Service one", {
    when() {
        const problems = []
        for (const {user, granted} of capabilityUsers) {
            const capabilities = asUser(user, () => invoke(access + "get#SharedContext", {}).capabilities)
            const held = capabilityNames.filter(name => capabilities[name])
            const expected = capabilityNames.filter(name => granted.includes(name))
            if (JSON.stringify(held) !== JSON.stringify(expected)) problems.push(`${user} holds ${held}, not ${expected}`)
            if (capabilities.read !== true) problems.push(`${user} does not read`)
        }
        const admin = asUser(users.admin, () => invoke(access + "get#SharedContext", {}))
        const borrowed = ["receive", "inspect", "dispose", "invoiceCredit", "paymentRefund", "returnCredit"]
        const missing = capabilityNames.filter(name => !borrowed.includes(name)).filter(name => !admin.capabilities[name])
        if (missing.length) problems.push(`the administrator lacks ${missing}`)
        const extra = borrowed.filter(name => admin.capabilities[name])
        if (extra.length) problems.push(`the administrator borrows ${extra}`)
        if (admin.allOrganizations !== true) problems.push("the administrator is not in every organization")
        // P2: the administrator sees the team queues of every organization and the restricted Privacy queue of its team
        const adminQueues = Array.from(admin.queueIds).sort().join()
        if (adminQueues !== [ids.privacyQueueId, ids.otherQueueId, ids.supportQueueId].sort().join())
            problems.push(`the administrator's queues: ${adminQueues}`)
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("a user's customers are their organization's and the shared ones, in the drop-downs and the palette, never another's", {
    when() {
        const problems = []
        const choices = (user, choice, extra = {}) =>
            asUser(user, () => values(invoke(access + "get#Choices", Object.assign({choice}, extra))))
        const retail = choices(users.read, "customers", {term: "joe"})
        for (const partyId of [ids.customerId, ids.companyCustomerId])
            if (!retail.includes(partyId)) problems.push(`the reader is not offered ${partyId}: ${retail}`)
        const services = choices(users.services, "customers", {term: "customer"})
        if (!services.includes(ids.otherCustomerId)) problems.push(`the other organization's customers: ${services}`)
        if (choices(users.read, "customers", {term: "customer"}).includes(ids.otherCustomerId))
            problems.push("the reader is offered the other organization's customer")
        // ORG_ACME's owner is the Party default, shared (_NA_), so every organization serves it
        for (const user of [users.read, users.services])
            if (!choices(user, "customers", {term: "Another"}).includes(ids.sharedCustomerId))
                problems.push(`${user} is not offered the shared customer`)
        // a selected value outside the page: Retail's customer for its user, not for the other organization's
        const selected = user => choices(user, "customers", {term: "zzz-none", selected: ids.customerId})
        if (!selected(users.read).includes(ids.customerId)) problems.push("the reader's selected customer is left out")
        if (selected(users.services).includes(ids.customerId)) problems.push("the other organization gets the selected customer")
        const organizations = choices(users.read, "organizations", {})
        if (!organizations.includes(ids.organizationId) || organizations.includes(ids.otherOrganizationId))
            problems.push(`the reader's organizations: ${organizations}`)
        const unknown = asUser(users.read, () => refusal(access + "get#Choices", {choice: "everything"}))
        if (!unknown.includes("Unknown Customer Service choice")) problems.push(`an unknown choice: ${unknown || "accepted"}`)
        // the palette: the reader's sales orders and customers, nothing of the other organization's, no purchase order
        const search = (user, text) =>
            asUser(user, () => invoke(access + "search#Records", {text, limit: 20}).rows.map(row => row.url))
        const orders = search(users.read, "boss_cs_so")
        for (const orderId of [ids.deliveredOrderId, ids.pickOrderId, ids.packedOrderId])
            if (!orders.some(url => url.endsWith("OrderDetail?orderId=" + orderId)))
                problems.push(`the reader's palette misses ${orderId}: ${orders}`)
        if (orders.some(url => url.includes(ids.otherOrderId))) problems.push("the reader's palette has the other order")
        if (search(users.read, "boss_pur_po").length) problems.push("the reader's palette has a purchase order")
        if (!search(users.read, "public").some(url => url.endsWith("Customer360?customerPartyId=" + ids.customerId)))
            problems.push("the reader's palette has no Joe Q Public")
        // P3: a customer by email and by phone
        if (!search(users.read, "joe@public.com").some(url => url.endsWith("Customer360?customerPartyId=" + ids.customerId)))
            problems.push("the reader's palette does not find Joe Q Public by email")
        if (!search(users.read, "234-5678").some(url => url.endsWith("Customer360?customerPartyId=" + ids.customerId)))
            problems.push("the reader's palette does not find Joe Q Public by phone")
        const servicesOrders = search(users.services, "boss_cs_so")
        if (
            !servicesOrders.some(url => url.includes(ids.otherOrderId)) ||
            servicesOrders.some(url => url.includes(ids.deliveredOrderId))
        )
            problems.push(`the other organization's palette: ${servicesOrders}`)
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

// each record type: a record of Retail's and ones it does not reach (another organization's, unowned, a purchase order)
const records = [
    {recordType: "order", own: ids.deliveredOrderId, others: [ids.otherOrderId, ids.purchaseOrderId]},
    {recordType: "customer", own: ids.customerId, others: [ids.otherCustomerId, ids.organizationId]},
    {recordType: "customer", own: ids.sharedCustomerId, others: []}
]
feature("another organization's or a forged record is refused like a missing one; a capability on a record is its permission's", {
    when() {
        const problems = []
        const check = (recordType, recordId, capability) => refusal(access + "check#Record", {recordType, recordId, capability})
        asUser(users.read, () => {
            for (const {recordType, own, others} of records) {
                const ownMessage = check(recordType, own)
                if (ownMessage !== "") problems.push(`the reader is refused its ${recordType} ${own}: ${ownMessage}`)
                for (const recordId of others.concat(["BOSS_CS_FORGED"])) {
                    const message = check(recordType, recordId)
                    if (!message.includes("RECORD_UNAVAILABLE"))
                        problems.push(`the reader reaches ${recordType} ${recordId}: ${message || "accepted"}`)
                }
            }
            const unknown = check("everything", ids.deliveredOrderId)
            if (!unknown.includes("RECORD_UNAVAILABLE")) problems.push(`an unknown record type: ${unknown}`)
        })
        asUser(users.services, () => {
            const own = check("order", ids.otherOrderId)
            if (own !== "") problems.push(`services is refused its own order: ${own}`)
            const retail = check("order", ids.deliveredOrderId)
            if (!retail.includes("RECORD_UNAVAILABLE")) problems.push(`services reaches Retail's order: ${retail || "accepted"}`)
        })
        // a capability on the same record: the holder passes, the user without its permission is refused
        for (const [capability, holder, without] of [
            ["orderChangeApply", users.orderDesk, users.agent],
            ["returnAuthorize", users.returns, users.manager],
            ["receive", users.agentWarehouse, users.agent]
        ]) {
            const held = asUser(holder, () => check("order", ids.deliveredOrderId, capability))
            if (held !== "") problems.push(`${holder} is refused ${capability}: ${held}`)
            const refusedMessage = asUser(without, () => check("order", ids.deliveredOrderId, capability))
            if (!refusedMessage.includes("PERMISSION_DENIED"))
                problems.push(`${without} is not refused ${capability}: ${refusedMessage || "accepted"}`)
        }
        const unknownCapability = asUser(users.agent, () => check("order", ids.deliveredOrderId, "everything"))
        if (!unknownCapability.includes("Unknown Customer Service capability"))
            problems.push(`an unknown capability: ${unknownCapability || "accepted"}`)
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature(
    "a sales order's and a customer's record links open OrderDetail and Customer360 for Customer Service users only (F77); purchase orders keep theirs",
    {
        when() {
            const link = (user, recordEntityName, id, enabled = true) =>
                asUser(
                    user,
                    () => invoke("ironstone.commons.PaletteServices.get#RecordLink", {recordEntityName, id}).url || null,
                    enabled
                )
            const order = "mantle.order.OrderHeader"
            return {
                own: link(users.read, order, ids.deliveredOrderId),
                other: link(users.read, order, ids.otherOrderId),
                services: link(users.services, order, ids.otherOrderId),
                // another app's user: with authorization disabled the service itself answers no link
                warehouse: link("warehouse.read", order, ids.deliveredOrderId, false),
                // a purchase order stays Purchasing's
                purchase: link("purchasing.read", order, ids.purchaseOrderId),
                // P3: a customer the reader serves opens Customer360 here (F77)
                customer: link(users.read, "mantle.party.Party", ids.customerId),
                // another app's user keeps the customer's Commons contact
                commonsCustomer: link("warehouse.read", "mantle.party.Party", ids.customerId, false)
            }
        },
        then({own, other, services, warehouse, purchase, customer, commonsCustomer}) {
            own == "/qapps/CustomerService/Orders/OrderDetail?orderId=" + ids.deliveredOrderId
            other == null
            services == "/qapps/CustomerService/Orders/OrderDetail?orderId=" + ids.otherOrderId
            warehouse == null
            String(purchase).startsWith("/qapps/Purchasing/")
            customer == "/qapps/CustomerService/Customers/Customer360?customerPartyId=" + ids.customerId
            commonsCustomer == "/qapps/Commons/Contacts/ContactDetail?partyId=" + ids.customerId
        }
    }
)

// P3: a shipment and an invoice are the user's organization's of a customer they serve, a contact a served customer's or its
// contact's; the confirmation resend is a case editor's on the order
feature("a shipment, an invoice and a contact are the user's organization's customers'; the resend is a case editor's", {
    when() {
        const problems = []
        const first = (entity, field) =>
            system(
                () => ec.entity.find(entity).condition("orderId", ids.deliveredOrderId).disableAuthz().list()[0]?.[field] || null
            )
        const shipmentId = first("mantle.shipment.ShipmentItemSource", "shipmentId")
        const invoiceId = first("mantle.order.OrderItemBilling", "invoiceId")
        const check = (user, recordType, recordId, capability) =>
            asUser(user, () => refusal(access + "check#Record", {recordType, recordId, capability}))
        for (const [recordType, recordId] of [
            ["shipment", shipmentId],
            ["invoice", invoiceId]
        ]) {
            const own = check(users.read, recordType, recordId)
            if (own !== "") problems.push(`the reader is refused its ${recordType} ${recordId}: ${own}`)
            for (const [user, id] of [
                [users.services, recordId],
                [users.read, "BOSS_CS_FORGED"]
            ]) {
                const message = check(user, recordType, id)
                if (!message.includes("RECORD_UNAVAILABLE"))
                    problems.push(`${user} reaches ${recordType} ${id}: ${message || "accepted"}`)
            }
        }
        const contact = (user, partyId) =>
            asUser(user, () => refusal("ironstone.customerservice.CustomerServices.check#ServiceContact", {partyId}))
        if (contact(users.read, ids.customerId) !== "") problems.push("the reader is refused its customer's contact record")
        for (const partyId of [ids.otherCustomerId, "BOSS_CS_AGENT"]) {
            const message = contact(users.read, partyId)
            if (!message.includes("RECORD_UNAVAILABLE"))
                problems.push(`the reader opens contact ${partyId}: ${message || "accepted"}`)
        }
        const holder = check(users.agent, "order", ids.deliveredOrderId, "caseEdit")
        if (holder !== "") problems.push(`the agent may not resend: ${holder}`)
        const reader = check(users.read, "order", ids.deliveredOrderId, "caseEdit")
        if (!reader.includes("PERMISSION_DENIED")) problems.push(`the reader may resend: ${reader || "accepted"}`)
        return {problems, shipmentId, invoiceId}
    },
    then({problems, shipmentId, invoiceId}) {
        shipmentId != null
        invoiceId != null
        problems.join("\n") == ""
    }
})

feature("the areas a group guards refuse a Customer Service user without it; no group reaches the Mantle REST or raw mutators", {
    when() {
        const problems = []
        for (const [user, path] of [
            [users.read, "Returns"],
            [users.agent, "Approvals"],
            [users.agent, "Settings"]
        ]) {
            const got = screenRefusal(user, path)
            if (!unauthorized(got) || !got.includes("AT_XML_SCREEN [")) problems.push(`${user} ${path}: ${got || "opened"}`)
        }
        const opened = screenRefusal(users.read, "Customers")
        if (opened !== "") problems.push(`the reader is refused Customers: ${opened}`)
        for (const user of [users.agent, users.orderDesk, users.returns, users.admin])
            asUser(user, () => {
                for (const [path, method] of [
                    ["s1/mantle/orders", "get"],
                    ["s1/mantle/orders/" + ids.pickOrderId, "patch"],
                    ["s1/mantle/returns", "post"]
                ]) {
                    const rendered = ec.screen
                        .makeTest()
                        .rootScreen("component://webroot/screen/webroot/rest.xml")
                        .render(path, {customerPartyId: ids.customerId, vendorPartyId: ids.organizationId}, method)
                    if (![401, 403].includes(rendered.status)) problems.push(`${user} ${path} ${method}: ${rendered.status}`)
                    ec.message.clearErrors()
                }
                for (const [service, parameters] of [
                    ["mantle.order.OrderServices.cancel#OrderItem", {orderId: ids.pickOrderId, orderItemSeqId: "01"}],
                    ["mantle.order.ReturnServices.create#ReturnFromOrder", {orderId: ids.deliveredOrderId, orderPartSeqId: "01"}],
                    ["update#mantle.request.Request", {requestId: "BOSS_DEMO_PREQ_ACME1", statusId: "ReqCancelled"}]
                ]) {
                    const message = refusal(service, parameters)
                    if (!message.includes("is not authorized")) problems.push(`${user} ${service}: ${message || "accepted"}`)
                }
            })
        const status = system(
            () => ec.entity.find("mantle.order.OrderHeader").condition("orderId", ids.pickOrderId).one().statusId
        )
        if (status !== "OrderApproved") problems.push(`the order awaiting pick is ${status}`)
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

// P2: a case is checked by its organization, customer and queue: the agent of its team's queue reaches it (and with caseEdit
// may change it), the reader of no team does not, another organization's agent does not, and the restricted Privacy queue's
// case only its team; its record link opens CaseDetail for a user who sees it and keeps the Commons link for another
feature("a case is its queue's team's and its assignee's; another organization's and a restricted queue's are refused", {
    when() {
        const problems = []
        const check = (user, recordId, capability) =>
            asUser(user, () => refusal(access + "check#Record", {recordType: "case", recordId, capability}))
        for (const [user, recordId, capability, expected] of [
            [users.agent, ids.thermostatCaseId, "caseEdit", ""],
            [users.read, ids.thermostatCaseId, null, "RECORD_UNAVAILABLE"],
            [users.services, ids.thermostatCaseId, null, "RECORD_UNAVAILABLE"],
            [users.services, ids.otherCaseId, "caseEdit", ""],
            [users.agent, ids.otherCaseId, null, "RECORD_UNAVAILABLE"],
            [users.agent, ids.privacyCaseId, null, "RECORD_UNAVAILABLE"],
            [users.manager, ids.privacyCaseId, null, "RECORD_UNAVAILABLE"],
            [users.admin, ids.privacyCaseId, null, ""],
            [users.read, ids.otherCaseId, null, "RECORD_UNAVAILABLE"]
        ]) {
            const message = check(user, recordId, capability)
            if (expected === "" ? message !== "" : !message.includes(expected))
                problems.push(`${user} on case ${recordId}: ${message || "accepted"}, not ${expected || "accepted"}`)
        }
        const link = user =>
            asUser(
                user,
                () =>
                    invoke("ironstone.commons.PaletteServices.get#RecordLink", {
                        recordEntityName: "mantle.request.Request",
                        id: ids.thermostatCaseId
                    }).url || null
            )
        const agentLink = link(users.agent)
        if (agentLink !== "/qapps/CustomerService/Cases/CaseDetail?requestId=" + ids.thermostatCaseId)
            problems.push(`the agent's case link: ${agentLink}`)
        const readerLink = link(users.read)
        if (String(readerLink).includes("CustomerService")) problems.push(`the reader's case link: ${readerLink}`)
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

// P4: a service level policy is the administrator's to save (SUPPORT_POLICY_EDIT), its list the settings readers' and another
// organization's refused; a case's clocks are read by the agent of its queue and not by another organization's agent; the
// settings offer only organizations Mantle's saves take; and ServiceLevelPolicies renders for the administrator (qvt) with the demo policy and New policy
feature("service levels: the administrator saves a policy and the manager may not; a case's clocks are its organization's", {
    when() {
        const problems = []
        const draft = {
            organizationPartyId: ids.organizationId,
            policyName: "Access spec draft",
            requestCategoryId: ids.supportQueueId,
            draft: true,
            targets: [{priorityBandEnumId: "CpbNormal", firstResponseMinutes: 60, resolutionMinutes: 480}]
        }
        const sla = "mantle.request.SlaServices."
        for (const [user, service, parameters, expected] of [
            [users.admin, "save#Policy", draft, ""],
            [users.manager, "save#Policy", draft, "PERMISSION_DENIED"],
            [users.manager, "find#Policies", {organizationPartyId: ids.organizationId}, ""],
            [users.agent, "find#Policies", {organizationPartyId: ids.otherOrganizationId}, "RECORD_UNAVAILABLE"],
            [users.agent, "get#CaseSlaHistory", {requestId: ids.thermostatCaseId}, ""],
            [users.services, "get#CaseSlaHistory", {requestId: ids.thermostatCaseId}, "RECORD_UNAVAILABLE"]
        ]) {
            // Mantle's services check their permission and organization themselves (the screens call them after the case's
            // check, under the screen's authorization)
            const message = asUser(user, () => refusal(sla + service, parameters), false)
            if (expected === "" ? message !== "" : !message.includes(expected))
                problems.push(`${user} ${service}: ${message || "accepted"}, not ${expected || "accepted"}`)
        }
        // the settings offer only organizations Mantle's saves take (F-P4-6: not every internal organization)
        const offered = asUser(
            users.admin,
            () =>
                invoke("ironstone.customerservice.ConfigurationServices.get#ServiceLevelSettings", {appRoot: "CustomerService"})
                    .organizations || [],
            false
        )
        if (!offered.some(row => row.value === ids.organizationId)) problems.push("the settings do not offer the organization")
        for (const row of offered) {
            const message = asUser(users.admin, () => refusal(sla + "find#Policies", {organizationPartyId: row.value}), false)
            if (message) problems.push(`the settings offer ${row.value}, which Mantle refuses: ${message}`)
        }
        const page = asUser(users.admin, () =>
            lib.page("Settings/ServiceLevelPolicies", {organizationPartyId: ids.organizationId})
        )
        return {problems, page}
    },
    then({problems, page}) {
        problems.join("\n") == ""
        page.status == 200
        page.errors == []
        page.output.includes("Retail standard")
        page.output.includes("Privacy requests")
        page.output.includes("New policy")
    }
})
// P12: article feedback is the knowledge author's (who reviews it) and the service manager's (who reads it), never an agent's,
// in the service and on the screen; an article drafted from a case is the knowledge author's, on a case of their organization
feature(
    "article feedback is the knowledge author's and the manager's; an article from a case the author's, on their organization's cases",
    {
        when() {
            const problems = []
            const knowledge = "ironstone.customerservice.KnowledgeServices."
            for (const [user, service, parameters, expected] of [
                [users.knowledge, "find#ArticleFeedback", {}, ""],
                [users.manager, "find#ArticleFeedback", {}, ""],
                [users.agent, "find#ArticleFeedback", {}, "PERMISSION_DENIED"],
                [users.knowledge, "prepare#ArticleFromCase", {requestId: ids.thermostatCaseId}, ""],
                [users.agent, "prepare#ArticleFromCase", {requestId: ids.thermostatCaseId}, "PERMISSION_DENIED"],
                [users.knowledge, "prepare#ArticleFromCase", {requestId: ids.otherCaseId}, "RECORD_UNAVAILABLE"]
            ]) {
                const message = asUser(user, () =>
                    refusal(knowledge + service, Object.assign({appRoot: "CustomerService"}, parameters))
                )
                if (expected === "" ? message !== "" : !message.includes(expected))
                    problems.push(
                        `${user} ${service} ${parameters.requestId || ""}: ${message || "accepted"}, not ${expected || "accepted"}`
                    )
            }
            for (const path of ["Knowledge/ArticleFeedback", "Knowledge/CaseToArticle"]) {
                const got = screenRefusal(users.agent, path)
                if (!unauthorized(got) || !got.includes("AT_XML_SCREEN ["))
                    problems.push(`the agent on ${path}: ${got || "opened"}`)
            }
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)

// P5: an assignment rule is the administrator's to save (SUPPORT_POLICY_EDIT), not the manager's, and never on another
// organization's queue; a saved reply on a case is a case editor's (SUPPORT_CASE_EDIT), not the reader's, and another
// organization's agent is refused the case; a saved reply's change is its owner's only
feature("assignment rules are the administrator's, saved replies on a case a case editor's of its organization", {
    when() {
        const problems = []
        const S = "mantle.request.SupportCaseServices."
        const draft = {
            organizationPartyId: ids.organizationId,
            requestCategoryId: ids.supportQueueId,
            ruleName: "Access spec draft rule",
            distributionEnumId: "AdManual",
            draft: true
        }
        for (const [user, service, parameters, expected] of [
            [users.admin, "save#AssignmentRule", draft, ""],
            [users.manager, "save#AssignmentRule", draft, "PERMISSION_DENIED"],
            [
                users.admin,
                "save#AssignmentRule",
                Object.assign({}, draft, {requestCategoryId: ids.otherQueueId}),
                "QUEUE_UNAVAILABLE"
            ],
            [users.manager, "preview#Assignment", {requestId: ids.filtersCaseId}, ""],
            [users.services, "preview#Assignment", {requestId: ids.filtersCaseId}, "RECORD_UNAVAILABLE"],
            [users.agent, "preview#SavedReply", {requestId: ids.filtersCaseId, emailTextBlockId: "BOSS_CS_REPLY_DETAILS"}, ""],
            [
                users.read,
                "preview#SavedReply",
                {requestId: ids.filtersCaseId, emailTextBlockId: "BOSS_CS_REPLY_DETAILS"},
                "PERMISSION_DENIED"
            ],
            [
                users.services,
                "preview#SavedReply",
                {requestId: ids.filtersCaseId, emailTextBlockId: "BOSS_CS_REPLY_FILTERS"},
                "RECORD_UNAVAILABLE"
            ]
        ]) {
            const message = asUser(user, () => refusal(S + service, parameters), false)
            if (expected === "" ? message !== "" : !message.includes(expected))
                problems.push(`${user} ${service}: ${message || "accepted"}, not ${expected || "accepted"}`)
        }
        const save = "ironstone.customerservice.ReplyServices.save#SavedReplyAction"
        for (const [user, parameters, expected] of [
            [users.agent, {emailTextBlockId: "BOSS_CS_REPLY_PATIENCE", disabled: "N"}, ""],
            [users.manager, {emailTextBlockId: "BOSS_CS_REPLY_PATIENCE", disabled: "N"}, "REPLY_UNAVAILABLE"],
            [users.read, {title: "Reader reply", bodyHtml: "<p>Hi</p>"}, "PERMISSION_DENIED"]
        ]) {
            const message = asUser(user, () => refusal(save, Object.assign({appRoot: "CustomerService"}, parameters)))
            if (expected === "" ? message !== "" : !message.includes(expected))
                problems.push(`${user} save#SavedReplyAction: ${message || "accepted"}, not ${expected || "accepted"}`)
        }
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})
