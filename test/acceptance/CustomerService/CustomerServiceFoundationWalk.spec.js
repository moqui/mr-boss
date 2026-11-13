// Customer Service P1's "usable when" (impl-customer-service P1), as an acceptance walk with artifact authorization on: the
// menu renders for each group, and each area of it opens while the others are refused; quick create offers nothing a group
// may not create (P2: a case to the groups that enter cases); an agent finds their organization's customers and orders through the
// palette but not another organization's, and a forged customer or order id is refused, on Home's lookup too; a Projects
// client contact is refused the root and every ironstone.customerservice service. And the demo the later phases build on:
// the delivered, invoiced and paid order with its serialized thermostat now the customer's, the order awaiting pick with its
// reservations, and the packed order. The rules themselves are CustomerServiceAccess's.
// Run: ./moq accept mr-boss --spec CustomerServiceFoundationWalk
const lib = ec.resource.script("component://mr-boss/test/CustomerService/CustomerServiceSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, shell} = lib
const access = "ironstone.customerservice.AccessServices."
const areas = ["Home", "Cases", "Customers", "Orders", "Returns", "Approvals", "Availability", "Knowledge", "Reports", "Settings"]
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0

feature("the menu renders for each group, its areas open, the others are refused, and quick create offers a case to its groups", {
    when() {
        const problems = []
        for (const user of Object.values(users)) {
            const found = shell(user)
            if (found.status != 200 || !found.names.length) problems.push(`${user}'s menu: ${found.status} ${found.names}`)
            // P2: a case for the groups that enter cases (BOSS_CS_NEW_CASE), nothing else of Customer Service's
            const offered = (found.providers?.quickCreate || [])
                .filter(item => String(item.kind || "").startsWith("customerService"))
                .map(item => item.kind)
            const mayCreate = [users.agent, users.manager, users.admin, users.agentWarehouse, users.services].includes(user)
            // P9: a return for the Returns area's groups (the agent, manager, return authorizer and administrator)
            const mayReturn = [
                users.agent,
                users.manager,
                users.admin,
                users.agentWarehouse,
                users.services,
                users.returns,
                users.returnsReceivables
            ].includes(user)
            const expectedKinds = (mayCreate ? ["customerServiceCase"] : []).concat(mayReturn ? ["customerServiceReturn"] : [])
            if (JSON.stringify(offered) !== JSON.stringify(expectedKinds))
                problems.push(`${user} is offered the Customer Service quick create ${offered}`)
            for (const area of areas) {
                const expected = found.names.includes(area)
                // P12: Knowledge is Commons Knowledge, a .qvue screen with its terminal twin and no html: it opens in tui
                const rendered = asUser(user, () => lib.page(area, {}, area === "Knowledge" ? "tui" : "html"))
                if (opened(rendered) !== expected)
                    problems.push(`${user} ${area}: ${expected ? "refused" : "opened"} ${rendered.status} ${rendered.errors}`)
            }
        }
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("an agent finds their organization's customers and orders in the palette and record links, never another's", {
    when() {
        const problems = []
        const palette = (user, text) =>
            asUser(user, () => invoke(access + "search#Records", {text, limit: 20}).rows.map(row => row.url))
        const link = (user, id) =>
            asUser(
                user,
                () =>
                    invoke("ironstone.commons.PaletteServices.get#RecordLink", {recordEntityName: "mantle.order.OrderHeader", id})
                        .url || null
            )
        const orders = palette(users.agent, "BOSS_CS_SO")
        for (const orderId of [ids.deliveredOrderId, ids.pickOrderId, ids.packedOrderId])
            if (!orders.some(url => url.includes(orderId))) problems.push(`the agent's palette misses ${orderId}`)
        if (orders.some(url => url.includes(ids.otherOrderId))) problems.push("the agent's palette has the other order")
        const customers = palette(users.agent, "Joe")
        // P3: a customer opens Customer360 (F77)
        for (const partyId of [ids.customerId, ids.companyCustomerId])
            if (!customers.some(url => url.includes("customerPartyId=" + partyId)))
                problems.push(`the agent's palette misses ${partyId}`)
        if (palette(users.agent, "Services Office").length) problems.push("the agent's palette has the other customer")
        if (palette(users.services, "Joe").some(url => url.includes(ids.customerId)))
            problems.push("the other organization's palette has Retail's customer")
        if (!link(users.agent, ids.packedOrderId)) problems.push("the agent has no link to the packed order")
        if (link(users.agent, ids.otherOrderId)) problems.push("the agent links the other organization's order")
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("a forged customer or order id is refused like another organization's, on Home's lookup too", {
    when() {
        const problems = []
        asUser(users.agent, () => {
            for (const [recordType, recordId] of [
                ["order", "BOSS_CS_FORGED"],
                ["order", ids.otherOrderId],
                ["customer", "BOSS_CS_FORGED"],
                ["customer", ids.otherCustomerId]
            ]) {
                const message = refusal(access + "check#Record", {recordType, recordId})
                if (!message.includes("RECORD_UNAVAILABLE")) problems.push(`${recordType} ${recordId}: ${message || "accepted"}`)
            }
            const home = lib.page("Home", {lookupType: "order", lookupId: ids.otherOrderId})
            if (!home.output.includes(ids.otherOrderId + " is not available to you.") || home.output.includes("Services office"))
                problems.push("Home's lookup shows the other organization's order")
        })
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("a Projects client contact is refused the root and every ironstone.customerservice service", {
    when() {
        const problems = []
        const client = "sheldon.acme"
        const home = asUser(client, () => lib.page("Home", {}, "html"))
        if (opened(home)) problems.push("the client opens Home")
        if (shell(client).apps.includes("CustomerService")) problems.push("the client's launcher has Customer Service")
        const root = "component://mr-boss/service/ironstone/customerservice"
        for (const ref of ec.resource.getLocationReference(root).getDirectoryEntries()) {
            const name = ref.location.substring(ref.location.lastIndexOf("/") + 1)
            if (!name.endsWith(".xml")) continue
            for (const match of String(ref.getText()).matchAll(/<service verb="([A-Za-z]+)" noun="([A-Za-z]+)"([^>]*)>/g)) {
                if (/type="interface"/.test(match[3])) continue
                const service = "ironstone.customerservice." + name.replace(/\.xml$/, "") + "." + match[1] + "#" + match[2]
                const message = asUser(client, () =>
                    refusal(service, {
                        recordType: "order",
                        recordId: ids.deliveredOrderId,
                        text: "joe",
                        choice: "customers",
                        order: "packed",
                        // P2: the cases' required parameters, so the refusal is the authorization's, not a validation's
                        requestId: ids.thermostatCaseId,
                        requestIds: [ids.thermostatCaseId],
                        operation: "assign",
                        // P12: Send to customer's article
                        wikiPageId: "BOSS_CS_NO_PAGE",
                        // P3: the customer, order, shipment and invoice reads' required parameters
                        partyId: ids.customerId,
                        customerPartyId: ids.customerId,
                        orderId: ids.deliveredOrderId,
                        shipmentId: "BOSS_CS_NO_SHIPMENT",
                        invoiceId: "BOSS_CS_NO_INVOICE",
                        // P6: a case from a message's kind
                        kind: "email",
                        // P9: the returns' required parameters
                        action: "authorize",
                        returnIds: [ids.warehouseReturnId],
                        returnId: ids.warehouseReturnId,
                        qualityInspectionId: "BOSS_CS_NO_INSPECTION",
                        capability: "inspect",
                        // P13: a feedback answer's read
                        formResponseId: "BOSS_CS_NO_RESPONSE",
                        // P15: an invitation's address
                        emailAddress: "nobody@example.com"
                    })
                )
                if (!/is not authorized|CUSTOMER_SERVICE_UNAVAILABLE|requires system administration/.test(message))
                    problems.push(`the client reaches ${service}: ${message || "accepted"}`)
            }
        }
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature(
    "the demo: a delivered, invoiced and paid order with the customer's serialized thermostat, an order awaiting pick, a packed one",
    {
        when() {
            return system(() => {
                const one = (entity, fields) => ec.entity.find(entity).condition(fields).one()
                const list = (entity, fields) => Array.from(ec.entity.find(entity).condition(fields).list())
                const thermostat = list("mantle.product.asset.Asset", {productId: ids.serializedProductId}).find(
                    asset => asset.statusId === "AstDelivered"
                )
                const billings = list("mantle.order.OrderItemBilling", {orderId: ids.deliveredOrderId})
                const invoice = billings.length ? one("mantle.account.invoice.Invoice", {invoiceId: billings[0].invoiceId}) : null
                const applied = invoice ? list("mantle.account.payment.PaymentApplication", {invoiceId: invoice.invoiceId}) : []
                const packedSources = list("mantle.shipment.ShipmentItemSource", {orderId: ids.packedOrderId})
                const packedShipment = packedSources.length
                    ? one("mantle.shipment.Shipment", {shipmentId: packedSources[0].shipmentId})
                    : null
                return {
                    delivered: one("mantle.order.OrderHeader", {orderId: ids.deliveredOrderId})?.statusId,
                    thermostatOwner: thermostat?.ownerPartyId,
                    issued: thermostat ? list("mantle.product.issuance.AssetIssuance", {assetId: thermostat.assetId}).length : 0,
                    warranty: list("mantle.product.feature.ProductFeatureAppl", {productId: ids.serializedProductId}).length,
                    invoiceStatus: invoice?.statusId,
                    appliedCount: applied.length,
                    pick: one("mantle.order.OrderHeader", {orderId: ids.pickOrderId})?.statusId,
                    pickReservations: list("mantle.product.issuance.AssetReservation", {orderId: ids.pickOrderId}).length,
                    packedStatus: packedShipment?.statusId
                }
            })
        },
        then({delivered, thermostatOwner, issued, warranty, invoiceStatus, appliedCount, pick, pickReservations, packedStatus}) {
            delivered == "OrderCompleted"
            thermostatOwner == "CustJqp"
            issued == 1
            warranty == 1
            invoiceStatus == "InvoicePmtRecvd"
            appliedCount >= 1
            pick == "OrderApproved"
            pickReservations >= 1
            packedStatus == "ShipPacked"
        }
    }
)
