// Customer Service's customer reads (impl-customer-service P3; design-customer-service §4 Customers, Customer360,
// ContactDetail; crosscut §3.1, §3.2; CustomerServices.xml): the customers the user serves (CustomerService.js's scope: their
// organizations' and the shared ones, F74), each record a customer, and for a shared customer (owner _NA_, such as ORG_ACME)
// only the user's organizations' orders, cases, returns and invoices. The audience rule of §2: no payment details; invoice
// amounts only for a holder of ACCOUNTING_VIEW or RECEIVABLE_VIEW (withheld, never zero); the credit status (Mantle's
// mantle.account.CreditServices.get#CustomerCreditStatus, F36) only for a holder of CUSTOMER_CREDIT_VIEW, read only; the
// identifications and tax registrations read only.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const cs = ec.resource.script("component://mr-boss/service/ironstone/customerservice/CustomerService.js")
const orders = ec.resource.script("component://mr-boss/service/ironstone/customerservice/Orders.js")
const {find, one, rows, ms} = lib

const contactRelationships = ["PrtContact", "PrtEmployee", "PrtRepresentative"]
const caseOpenStatuses = ["ReqSubmitted", "ReqReviewed", "ReqInProgress", "ReqWaitingCustomer", "ReqOnHold"]
const listCap = 50
const L = text => ec.l10n.localize(text)
const dayText = value => (value == null || value === "" ? "" : ec.l10n.format(new Date(ms(value)), "d MMM yyyy"))
const money = (value, currencyUomId) =>
    value == null ? "" : ec.l10n.formatCurrency(ec.l10n.roundCurrency(toDecimal(value), currencyUomId), currencyUomId)

// The customer's current contact mechanisms, each with its kind, value and purpose.
function contactsOf(partyId) {
    const out = []
    for (const row of rows("mantle.party.contact.PartyContactMech", {partyId}).filter(row => lib.active(row))) {
        const mech = one("mantle.party.contact.ContactMech", {contactMechId: row.contactMechId})
        if (!mech) continue
        let value = mech.infoString || ""
        if (mech.contactMechTypeEnumId === "CmtTelecomNumber") {
            const phone = one("mantle.party.contact.TelecomNumber", {contactMechId: mech.contactMechId})
            value = phone ? [phone.countryCode, phone.areaCode, phone.contactNumber].filter(Boolean).join(" ") : value
        } else if (mech.contactMechTypeEnumId === "CmtPostalAddress") {
            const address = one("mantle.party.contact.PostalAddress", {contactMechId: mech.contactMechId})
            value = address
                ? [address.toName, address.address1, address.city, address.postalCode].filter(Boolean).join(", ")
                : value
        }
        out.push({
            kindText: cs.enumText(mech.contactMechTypeEnumId),
            value,
            purposeText: cs.enumText(row.contactMechPurposeId)
        })
    }
    return out
}
// The people who are current contacts, employees or representatives of the customer, with their ContactDetail links.
function contactPeople(customerPartyId) {
    const seen = new Set()
    const out = []
    for (const row of rows("mantle.party.PartyRelationship", {toPartyId: customerPartyId})) {
        if (!contactRelationships.includes(row.relationshipTypeEnumId) || !lib.active(row) || seen.has(row.fromPartyId)) continue
        seen.add(row.fromPartyId)
        const email = contactsOf(row.fromPartyId).find(mech => mech.kindText && /mail/i.test(mech.kindText))
        out.push({
            partyId: row.fromPartyId,
            name: cs.partyName(row.fromPartyId),
            roleText: cs.enumText(row.relationshipTypeEnumId),
            email: email?.value || "",
            url: "/qapps/CustomerService/Customers/ContactDetail?partyId=" + encodeURIComponent(row.fromPartyId)
        })
    }
    return out
}
// The customer's orders with the user's organizations (F74: a shared customer's other organizations' are left out).
function ordersOf(userScope, customerPartyId) {
    const ids = Array.from(
        find("mantle.order.OrderHeaderAndPart")
            .condition("customerPartyId", customerPartyId)
            .condition("vendorPartyId", "in", cs.vendorIds(userScope))
            .selectField("orderId")
            .selectField("entryDate")
            .distinct(true)
            .orderBy("-entryDate")
            .limit(listCap)
            .list()
    ).map(row => row.orderId)
    const out = []
    for (const orderId of Array.from(new Set(ids)))
        try {
            cs.recordOf(userScope, "order", orderId)
            out.push(orders.orderRow(orderId))
        } catch (error) {
            if (lib.reasonCode(error) !== "RECORD_UNAVAILABLE")
                ec.logger.error("Customer Service order " + orderId + " was not read: " + error.message)
        }
    return out
}
// The customer's invoices from the user's organizations, newest first.
function invoicesOf(userScope, customerPartyId) {
    return Array.from(
        find("mantle.account.invoice.Invoice")
            .condition("toPartyId", customerPartyId)
            .condition("fromPartyId", "in", cs.vendorIds(userScope))
            .condition("statusId", "not-equals", "InvoiceCancelled")
            .orderBy("-invoiceDate")
            .limit(listCap)
            .list()
    ).map(invoice => orders.invoiceRow(userScope, invoice))
}
// The customer's credit with each of the user's organizations that has a policy or a hold for it, for a credit reader only.
function creditOf(userScope, customerPartyId) {
    if (!userScope.capabilities.creditRead) return {read: false, rows: []}
    const out = []
    for (const organizationPartyId of cs.vendorIds(userScope)) {
        const sells = find("mantle.order.OrderHeaderAndPart", {customerPartyId, vendorPartyId: organizationPartyId}).count() > 0
        if (!sells) continue
        try {
            const status = lib.probe("mantle.account.CreditServices.get#CustomerCreditStatus", {
                organizationPartyId,
                customerPartyId
            })
            const currencyUomId = status.currencyUomId
            out.push({
                organizationName: cs.partyName(organizationPartyId),
                limitText: status.policy?.creditLimit != null ? money(status.policy.creditLimit, currencyUomId) : L("No limit"),
                availableText: status.available != null ? money(status.available, currencyUomId) : "",
                holdCount: Array.from(status.holds || []).length,
                holdText: Array.from(status.holds || [])
                    .map(hold => [hold.orderId, hold.holdComment].filter(Boolean).join(": "))
                    .join("; ")
            })
        } catch (error) {
            // one organization's credit read that fails is named and the others still show
            ec.logger.error("Credit of " + customerPartyId + " with " + organizationPartyId + ": " + error.message)
        }
    }
    return {read: true, rows: out}
}

// ===== Activities (crosscut §3.2 Customer Service row) =====
// A party of the user's organizations: one of them, or a person with a current relationship to one (an employee, agent
// or member).
function ofOrganizations(vendors, partyId) {
    if (!partyId) return false
    if (vendors.includes(partyId)) return true
    return rows("mantle.party.PartyRelationship", {fromPartyId: partyId}).some(
        row => vendors.includes(row.toPartyId) && lib.active(row)
    )
}
// get#CustomerActivities: the customer's and its contact people's communication events and its activities the user may
// see, read only, newest first. An event shows when it is on a case the user sees, or it is with the user's organizations
// (its other party is one of them or of their people) and on no case the user does not see; a shared customer's other
// organizations' are left out (F74). An activity (a WorkEffortRecord on the customer) shows when its owner or assignee is
// of the user's organizations. Subjects, dates, kinds and parties only: no body.
function customerActivities(p) {
    const userScope = cs.required()
    const customerPartyId = String(p.customerPartyId || "")
    cs.recordOf(userScope, "customer", customerPartyId)
    const vendors = cs.vendorIds(userScope)
    const people = new Set([customerPartyId].concat(contactPeople(customerPartyId).map(row => row.partyId)))
    const caseSeen = new Map()
    const seen = requestId => {
        if (!caseSeen.has(requestId)) caseSeen.set(requestId, !!orders.linkOf(userScope, "case", requestId))
        return caseSeen.get(requestId)
    }
    const eventIds = new Set()
    for (const partyId of people)
        for (const field of ["fromPartyId", "toPartyId"])
            for (const row of find("mantle.party.communication.CommunicationEvent")
                .condition(field, partyId)
                .selectField("communicationEventId")
                .orderBy("-entryDate")
                .limit(listCap)
                .list())
                eventIds.add(row.communicationEventId)
    const events = eventIds.size
        ? Array.from(
              find("mantle.party.communication.CommunicationEvent")
                  .condition("communicationEventId", "in", Array.from(eventIds))
                  .orderBy("-entryDate")
                  .list()
          )
        : []
    const eventRows = []
    for (const event of events) {
        const caseIds = rows("mantle.request.RequestCommEvent", {communicationEventId: event.communicationEventId}).map(
            row => row.requestId
        )
        const onSeenCase = caseIds.find(seen)
        if (caseIds.length && !onSeenCase) continue
        const other = people.has(event.fromPartyId) ? event.toPartyId : event.fromPartyId
        if (!onSeenCase && !ofOrganizations(vendors, other)) continue
        eventRows.push({
            communicationEventId: event.communicationEventId,
            dateText: dayText(event.entryDate || event.datetimeStarted),
            kindText: cs.enumText(event.communicationEventTypeId) || event.communicationEventTypeId || "",
            subject: event.subject || "",
            fromName: event.fromPartyId ? cs.partyName(event.fromPartyId) : "",
            toName: event.toPartyId ? cs.partyName(event.toPartyId) : "",
            caseId: onSeenCase || null,
            caseUrl: onSeenCase ? orders.linkOf(userScope, "case", onSeenCase) : null
        })
        if (eventRows.length >= listCap) break
    }
    const activityRows = []
    for (const link of rows("mantle.work.effort.WorkEffortRecord", {
        recordEntityName: "mantle.party.Party",
        recordId: customerPartyId
    })) {
        const effort = one("mantle.work.effort.WorkEffort", {workEffortId: link.workEffortId})
        if (!effort) continue
        const assignees = rows("mantle.work.effort.WorkEffortParty", {workEffortId: effort.workEffortId})
            .filter(row => lib.active(row))
            .map(row => row.partyId)
        if (![effort.ownerPartyId].concat(assignees).some(partyId => ofOrganizations(vendors, partyId))) continue
        activityRows.push({
            workEffortId: effort.workEffortId,
            name: effort.workEffortName || effort.workEffortId,
            dueText: dayText(effort.estimatedCompletionDate || effort.estimatedStartDate),
            sortDate: ms(effort.estimatedCompletionDate || effort.estimatedStartDate) || 0,
            statusText: cs.statusText(effort.statusId),
            assigneeText: assignees.map(cs.partyName).join(", ")
        })
    }
    activityRows.sort((a, b) => b.sortDate - a.sortDate)
    return {eventRows, activityRows: activityRows.slice(0, listCap)}
}

// get#Customer360: the customer's record in Customer Service (crosscut §3.2 Customer Service row). A customer the user does
// not serve is not found, like a missing one.
function customer360(p) {
    const userScope = cs.required()
    const customerPartyId = String(p.customerPartyId || "")
    try {
        cs.recordOf(userScope, "customer", customerPartyId)
    } catch (error) {
        if (lib.reasonCode(error) !== "RECORD_UNAVAILABLE") throw error
        return {customerFound: false, customerPartyId, customerDetail: null}
    }
    const party = one("mantle.party.Party", {partyId: customerPartyId})
    const cases = lib.call("ironstone.customerservice.CaseServices.find#Cases", {
        view: "all",
        customerPartyId,
        pageSize: 20
    })
    const caseRows = Array.from(cases.cases || [])
    const orderRows = ordersOf(userScope, customerPartyId)
    const shipmentRows = []
    for (const order of orderRows.slice(0, 20))
        for (const shipment of orders.shipmentsOf(order.orderId))
            if (!shipmentRows.some(row => row.shipmentId === shipment.shipmentId))
                shipmentRows.push({
                    shipmentId: shipment.shipmentId,
                    orderId: order.orderId,
                    statusText: cs.statusText(shipment.statusId),
                    arrivalText: dayText(shipment.estimatedArrivalDate),
                    url: orders.linkOf(userScope, "shipment", shipment.shipmentId)
                })
    const invoiceRows = invoicesOf(userScope, customerPartyId)
    const read = orders.moneyRead()
    const openInvoices = invoiceRows.filter(row => !row.paid)
    const heldOrders = orderRows.filter(row => row.statusId === "OrderHold")
    const identifications = rows("mantle.party.PartyIdentification", {partyId: customerPartyId}).map(row => ({
        typeText: cs.enumText(row.partyIdTypeEnumId),
        value: row.idValue || "",
        expireText: dayText(row.expireDate)
    }))
    const taxRows = rows("mantle.other.tax.TaxAuthorityParty", {partyId: customerPartyId})
        .filter(row => lib.active(row))
        .map(row => ({authorityText: row.taxAuthorityId, partyTaxId: row.partyTaxId || "", exempt: row.isExempt === "Y"}))
    return {
        customerFound: true,
        customerPartyId,
        customerDetail: {
            customerName: cs.partyName(customerPartyId),
            pseudoId: party.pseudoId || "",
            kindText: party.partyTypeEnumId === "PtyPerson" ? L("Person") : L("Organization"),
            shared: party.ownerPartyId === "_NA_",
            ownerText: party.ownerPartyId === "_NA_" ? L("Shared customer") : cs.partyName(party.ownerPartyId),
            contacts: contactsOf(customerPartyId),
            people: contactPeople(customerPartyId),
            identifications,
            taxRows,
            caseRows,
            openCaseCount: caseRows.filter(row => caseOpenStatuses.includes(row.statusId)).length,
            orderRows,
            openOrderCount: orderRows.filter(row =>
                ["OrderPlaced", "OrderProcessing", "OrderApproved", "OrderHold"].includes(row.statusId)
            ).length,
            heldOrders: heldOrders.map(row => ({orderId: row.orderId, url: row.url})),
            shipmentRows,
            invoiceRows,
            openInvoiceCount: openInvoices.length,
            moneyRead: read,
            credit: creditOf(userScope, customerPartyId),
            canNewCase: !!userScope.capabilities.caseEdit,
            newCaseUrl: "/qapps/CustomerService/Cases/NewCase?customerPartyId=" + encodeURIComponent(customerPartyId),
            contactUrl: "/qapps/CustomerService/Customers/ContactDetail?partyId=" + encodeURIComponent(customerPartyId)
        }
    }
}

// find#Customers: CustomerList's rows over find#ServiceCustomers (name or id, email or phone), each with its open cases,
// the latest order and, for a credit reader, its held orders.
function findCustomers(p) {
    const userScope = cs.required()
    const term = String(p.term || "").trim()
    if (!term) return {customers: [], message: L("Enter a name, email, phone or id")}
    const found = Array.from(lib.call("ironstone.customerservice.CaseServices.find#ServiceCustomers", {term}).customers || [])
    const vendors = cs.vendorIds(userScope)
    const customers = found.map(row => {
        const latest = find("mantle.order.OrderHeaderAndPart")
            .condition("customerPartyId", row.partyId)
            .condition("vendorPartyId", "in", vendors)
            .selectField("orderId")
            .selectField("entryDate")
            .orderBy("-entryDate")
            .limit(1)
            .one()
        const held = Array.from(
            find("mantle.order.OrderHeaderAndPart")
                .condition("customerPartyId", row.partyId)
                .condition("vendorPartyId", "in", vendors)
                .condition("statusId", "OrderHold")
                .selectField("orderId")
                .distinct(true)
                .limit(10)
                .list()
        ).map(order => order.orderId)
        // a held order's reason: a credit hold's only for a credit reader
        const reasons = held.length
            ? Array.from(
                  find("mantle.order.OrderHoldReason")
                      .condition("orderId", "in", held)
                      .condition("releasedDate", "is-null", null)
                      .list()
              ).map(reason =>
                  reason.holdTypeEnumId === "OhtCredit" && !userScope.capabilities.creditRead
                      ? L("On hold")
                      : cs.enumText(reason.holdTypeEnumId) + (reason.holdComment ? ": " + reason.holdComment : "")
              )
            : []
        return Object.assign({}, row, {
            latestOrderId: latest?.orderId || null,
            latestOrderText: latest ? latest.orderId + " · " + dayText(latest.entryDate) : "",
            latestOrderUrl: latest ? cs.recordUrl("order", latest.orderId) : null,
            holdText: Array.from(new Set(reasons)).join("; "),
            url: cs.recordUrl("customer", row.partyId)
        })
    })
    return {customers, message: customers.length ? "" : L("No customer matches")}
}

// check#ServiceContact: a contact the user may open here: a customer they serve, or a current contact, employee or
// representative of one. Anyone else is refused like a missing party (RECORD_UNAVAILABLE).
function serviceContact(p) {
    const userScope = cs.required()
    const partyId = String(p.partyId || "")
    const unavailable = () => lib.denied("RECORD_UNAVAILABLE", "Contact " + partyId + " is not available")
    if (!partyId || !one("mantle.party.Party", {partyId})) unavailable()
    if (cs.customerOf(userScope, partyId)) return {partyId, customerPartyId: partyId, customerName: cs.partyName(partyId)}
    const customer = rows("mantle.party.PartyRelationship", {fromPartyId: partyId})
        .filter(row => contactRelationships.includes(row.relationshipTypeEnumId) && lib.active(row))
        .map(row => row.toPartyId)
        .find(customerPartyId => !!cs.customerOf(userScope, customerPartyId))
    if (!customer || cs.isInternal(partyId)) unavailable()
    return {partyId, customerPartyId: customer, customerName: cs.partyName(customer)}
}

const operations = {customer360, customerActivities, findCustomers, serviceContact}
;({
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Customer Service customer operation " + op)
        return operations[op](parameters || {})
    }
})
