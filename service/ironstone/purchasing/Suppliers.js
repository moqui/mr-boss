// Purchasing's supplier reads and bulk changes (design-purchasing Suppliers and Supplier360; impl-purchasing P2): the
// supplier list of the user's scope with each supplier's buying profile in an organization, the duplicate candidates a new
// supplier is checked against, Supplier360's Purchasing context (contact, the profile in effect and its rows, the buyer and
// its history, the category and the supplier check), and the bulk buyer and category changes, one result per supplier. The
// scope is Purchasing.js's (the user's organizations' suppliers and the shared ones); the writes are Mantle's
// mantle.party.SupplierServices, which check SUPPLIER_PROFILE_EDIT and the organization again.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const purchasing = ec.resource.script("component://mr-boss/service/ironstone/purchasing/Purchasing.js")
const policy = ec.resource.script("component://mr-mantle/service/mantle/order/PurchasePolicy.js")
const {find, one, rows, ms, denied} = lib

const PROFILE = "mantle.party.supplier.SupplierProfile"
const blank = value => value == null || String(value).trim() === ""
const likeText = text => "%" + String(text).replace(/[\\%_]/g, character => "\\" + character) + "%"
const current = (row, at) => (ms(row.fromDate) ?? -Infinity) <= at && (ms(row.thruDate) ?? Infinity) > at
const statusColors = {SupaPending: "warning", SupaApproved: "positive", SupaRejected: "negative", SupaSuspended: "negative"}
function partyName(partyId) {
    if (!partyId) return ""
    const organization = one("mantle.party.Organization", {partyId})
    if (organization?.organizationName) return organization.organizationName
    const person = one("mantle.party.Person", {partyId})
    return (person ? [person.firstName, person.lastName].filter(Boolean).join(" ") : "") || partyId
}
const statusText = statusId => (statusId ? one("moqui.basic.StatusItem", {statusId})?.description || statusId : "")
const enumText = enumId => (enumId ? one("moqui.basic.Enumeration", {enumId})?.description || enumId : "")

// The buying organization of a read: the given one if it is the user's, else the active one, else the user's first.
function organizationOf(userScope, organizationPartyId) {
    const ids = userScope.ownerIds || rows("mantle.party.PartyRole", {roleTypeId: "OrgInternal"}).map(row => row.partyId)
    if (!blank(organizationPartyId)) {
        if (!ids.includes(organizationPartyId)) denied("RECORD_UNAVAILABLE", "Organization is not available")
        return organizationPartyId
    }
    return userScope.activeOrganizationPartyId || userScope.organizationPartyIds[0] || ids[0] || null
}
function listScope() {
    const userScope = purchasing.required()
    if (!userScope.capabilities.listRead) denied("PERMISSION_DENIED", "The supplier list is not available")
    return userScope
}
// The organization's profiles of the suppliers in effect now, by supplier.
function profilesOf(organizationPartyId, supplierIds, at) {
    const profiles = new Map()
    if (!organizationPartyId || !supplierIds.length) return profiles
    for (const row of find(PROFILE, {organizationPartyId}).condition("supplierPartyId", "in", supplierIds).list())
        if (current(row, at)) {
            const known = profiles.get(row.supplierPartyId)
            if (!known || ms(row.fromDate) > ms(known.fromDate)) profiles.set(row.supplierPartyId, row)
        }
    return profiles
}
// The organization's people (agents, employees, members), for the buyer columns and choices.
function organizationPeople(organizationIds) {
    const at = ms(ec.user.nowTimestamp)
    return new Set(
        Array.from(
            find("mantle.party.PartyRelationship")
                .condition("relationshipTypeEnumId", "in", ["PrtAgent", "PrtEmployee", "PrtMember"])
                .condition("toPartyId", "in", organizationIds)
                .list()
        )
            .filter(row => current(row, at))
            .map(row => row.fromPartyId)
    )
}
// The Buyer-to-Supplier relationships in effect now of the organization's people, by supplier.
function buyersOf(organizationPartyId, supplierIds, at) {
    const buyers = new Map()
    if (!organizationPartyId || !supplierIds.length) return buyers
    const people = organizationPeople([organizationPartyId])
    for (const row of find("mantle.party.PartyRelationship", {relationshipTypeEnumId: "PrtSupplier", fromRoleTypeId: "Buyer"})
        .condition("toPartyId", "in", supplierIds)
        .list())
        if (current(row, at) && people.has(row.fromPartyId)) buyers.set(row.toPartyId, row)
    return buyers
}
// The supplier categories in effect now, by supplier.
function categoriesOf(supplierIds, at) {
    const categories = new Map()
    if (!supplierIds.length) return categories
    const types = new Map(
        rows("mantle.party.PartyClassification", {classificationTypeEnumId: "PcltSupplierCategory"}).map(row => [
            row.partyClassificationId,
            row.description || row.partyClassificationId
        ])
    )
    for (const row of find("mantle.party.PartyClassificationAppl").condition("partyId", "in", supplierIds).list())
        if (current(row, at) && types.has(row.partyClassificationId))
            categories.set(row.partyId, {
                partyClassificationId: row.partyClassificationId,
                text: types.get(row.partyClassificationId)
            })
    return categories
}
function blockText(profile, at) {
    const from = ms(profile?.purchaseBlockFromDate)
    if (from == null) return ""
    const thru = ms(profile.purchaseBlockThruDate)
    if (thru != null && thru <= at) return ""
    const reason = profile.purchaseBlockReason ? ": " + profile.purchaseBlockReason : ""
    return (from > at ? "Blocked from " + lib.dateText(profile.purchaseBlockFromDate) : "Blocked") + reason
}
// The profile's display: the approval status with its chip color, the block, the currency, Incoterm and terms.
function profileDisplay(profile, at) {
    return {
        approvalStatusId: profile?.approvalStatusId || null,
        approvalText: profile?.approvalStatusId ? statusText(profile.approvalStatusId) : "Not set",
        approvalColor: statusColors[profile?.approvalStatusId] || "grey-7",
        blockText: blockText(profile, at),
        currencyUomId: profile?.currencyUomId || null,
        incotermText: enumText(profile?.incotermEnumId),
        termText: profile?.settlementTermId
            ? one("mantle.account.invoice.SettlementTerm", {settlementTermId: profile.settlementTermId})?.description ||
              profile.settlementTermId
            : "",
        selfBillingText: profile?.selfBillingIndicator === "Y" ? "Yes" : "No"
    }
}

// find#Suppliers: the suppliers in the user's scope, by name, ID or external ID (ignoring case) and by category, buyer,
// approval status or block, paged, each with its buying profile in the organization, buyer, category and owner.
function findSuppliers(p) {
    const userScope = listScope()
    const organizationPartyId = organizationOf(userScope, p.organizationPartyId)
    const at = ms(ec.user.nowTimestamp)
    const factory = ec.entity.conditionFactory
    // the conditions of the find, applied to a find for the count and another for the page
    const conditions = []
    const text = String(p.text || "").trim()
    if (text)
        conditions.push(
            factory.makeCondition(
                ["partyId", "pseudoId", "externalId", "organizationName", "firstName", "lastName"].map(field =>
                    factory.makeCondition(field, "like", likeText(text)).ignoreCase()
                ),
                "or"
            )
        )
    // the filters on the organization's profile, buyer and category, as id lists in the query
    const restrict = ids => conditions.push(factory.makeCondition("partyId", "in", ids.length ? ids : ["_NA_NONE_"]))
    if (!blank(p.approvalStatusId) || p.blocked === "Y") {
        const profiles = Array.from(find(PROFILE, {organizationPartyId}).list()).filter(row => current(row, at))
        restrict(
            profiles
                .filter(row => blank(p.approvalStatusId) || row.approvalStatusId === p.approvalStatusId)
                .filter(row => p.blocked !== "Y" || !!blockText(row, at))
                .map(row => row.supplierPartyId)
        )
    }
    if (!blank(p.buyerPartyId))
        restrict(
            rows("mantle.party.PartyRelationship", {
                relationshipTypeEnumId: "PrtSupplier",
                fromRoleTypeId: "Buyer",
                fromPartyId: p.buyerPartyId
            })
                .filter(row => current(row, at))
                .map(row => row.toPartyId)
        )
    if (!blank(p.partyClassificationId))
        restrict(
            rows("mantle.party.PartyClassificationAppl", {partyClassificationId: p.partyClassificationId})
                .filter(row => current(row, at))
                .map(row => row.partyId)
        )
    const query = () => {
        let built = purchasing.supplierFind(userScope)
        for (const condition of conditions) built = built.condition(condition)
        return built.selectField("partyId").selectField("pseudoId").selectField("ownerPartyId").distinct(true)
    }
    const paged = lib.page(query().orderBy("partyId"), p, "supplierRows", query().count())
    const ids = paged.rows.map(row => row.partyId)
    const profiles = profilesOf(organizationPartyId, ids, at),
        buyers = buyersOf(organizationPartyId, ids, at),
        categories = categoriesOf(ids, at)
    paged.supplierRows = paged.rows.map(row => {
        const profile = profiles.get(row.partyId) || null
        const buyer = buyers.get(row.partyId)
        return Object.assign(
            {
                partyId: row.partyId,
                pseudoId: row.pseudoId || row.partyId,
                supplierName: partyName(row.partyId),
                ownerText: row.ownerPartyId === "_NA_" ? "Shared" : partyName(row.ownerPartyId),
                buyerPartyId: buyer?.fromPartyId || null,
                buyerName: buyer ? partyName(buyer.fromPartyId) : "",
                categoryText: categories.get(row.partyId)?.text || "",
                emailText: contactValue(row.partyId, "CmtEmailAddress")
            },
            profileDisplay(profile, at)
        )
    })
    delete paged.rows
    return Object.assign(paged, {organizationPartyId, organizationName: partyName(organizationPartyId)})
}
// The supplier's primary contact value of a kind (an email), else its first.
function contactValue(partyId, contactMechTypeEnumId) {
    const at = ms(ec.user.nowTimestamp)
    const mechs = rows("mantle.party.contact.PartyContactMech", {partyId}).filter(row => current(row, at))
    const ordered = mechs.sort(
        (a, b) => (b.contactMechPurposeId === "EmailPrimary") - (a.contactMechPurposeId === "EmailPrimary")
    )
    for (const row of ordered) {
        const mech = one("mantle.party.contact.ContactMech", {contactMechId: row.contactMechId})
        if (mech?.contactMechTypeEnumId === contactMechTypeEnumId) return mech.infoString || ""
    }
    return ""
}

// find#SupplierDuplicates: the suppliers in the user's scope a new one may duplicate, by its organization or person name,
// external ID or email (ignoring case), at most ten.
function duplicates(p) {
    const userScope = listScope()
    const factory = ec.entity.conditionFactory
    const conditions = []
    const name = String(p.organizationName || "").trim()
    if (name) conditions.push(factory.makeCondition("organizationName", "like", likeText(name)).ignoreCase())
    if (!blank(p.firstName) && !blank(p.lastName))
        conditions.push(
            factory.makeCondition(
                [
                    factory.makeCondition("firstName", "like", likeText(String(p.firstName).trim())).ignoreCase(),
                    factory.makeCondition("lastName", "like", likeText(String(p.lastName).trim())).ignoreCase()
                ],
                "and"
            )
        )
    if (!blank(p.externalId)) conditions.push(factory.makeCondition("externalId", "equals", String(p.externalId).trim()))
    const found = new Set()
    if (conditions.length)
        for (const row of purchasing
            .supplierFind(userScope)
            .condition(factory.makeCondition(conditions, "or"))
            .selectField("partyId")
            .distinct(true)
            .limit(10)
            .list())
            found.add(row.partyId)
    if (!blank(p.emailAddress)) {
        const email = String(p.emailAddress).trim()
        const mechIds = Array.from(
            find("mantle.party.contact.ContactMech", {contactMechTypeEnumId: "CmtEmailAddress"})
                .condition(factory.makeCondition("infoString", "equals", email).ignoreCase())
                .limit(20)
                .list()
        ).map(row => row.contactMechId)
        if (mechIds.length)
            for (const row of find("mantle.party.contact.PartyContactMech").condition("contactMechId", "in", mechIds).list())
                if (found.size < 10 && purchasing.supplierOf(userScope, row.partyId)) found.add(row.partyId)
    }
    return {
        duplicateRows: Array.from(found)
            .slice(0, 10)
            .map(partyId => ({
                partyId,
                pseudoId: one("mantle.party.Party", {partyId})?.pseudoId || partyId,
                supplierName: partyName(partyId),
                emailText: contactValue(partyId, "CmtEmailAddress")
            }))
    }
}

// get#SupplierContext: Supplier360's Purchasing context of a supplier in scope: its contact (as Products' supplier detail),
// the organization's profile in effect and its rows newest first (history), the buyer in effect and the buyers before, the
// category, the supplier check against the buying policy, and what the user may change.
function supplierContext(p) {
    const userScope = listScope()
    const vendorPartyId = p.vendorPartyId
    purchasing.recordOf(userScope, "supplier", vendorPartyId)
    const party = one("mantle.party.Party", {partyId: vendorPartyId})
    const organizationPartyId = organizationOf(userScope, p.organizationPartyId)
    const at = ms(ec.user.nowTimestamp)
    const contacts =
        ec.service
            .sync()
            .name("ironstone.commons.ContactServices.get#ContactRecord")
            .parameters({partyId: vendorPartyId})
            .disableAuthz()
            .call() || {}
    const profileRows = rows(PROFILE, {organizationPartyId, supplierPartyId: vendorPartyId}).sort(
        (a, b) => ms(b.fromDate) - ms(a.fromDate)
    )
    const profile = profileRows.find(row => current(row, at)) || null
    const people = organizationPeople([organizationPartyId])
    const buyerRows = rows("mantle.party.PartyRelationship", {
        relationshipTypeEnumId: "PrtSupplier",
        fromRoleTypeId: "Buyer",
        toPartyId: vendorPartyId
    })
        .filter(row => people.has(row.fromPartyId))
        .sort((a, b) => ms(b.fromDate) - ms(a.fromDate))
        .map(row => ({
            buyerPartyId: row.fromPartyId,
            buyerName: partyName(row.fromPartyId),
            fromDateText: lib.dateText(row.fromDate),
            thruDateText: lib.dateText(row.thruDate),
            inEffect: current(row, at)
        }))
    const buyer = buyerRows.find(row => row.inEffect) || null
    const category = categoriesOf([vendorPartyId], at).get(vendorPartyId) || null
    const check = organizationPartyId ? policy.supplierUsable(organizationPartyId, vendorPartyId, null) : null
    const capabilities = userScope.capabilities
    return {
        vendorPartyId,
        organizationPartyId,
        organizationName: partyName(organizationPartyId),
        supplier: {
            partyId: vendorPartyId,
            pseudoId: party.pseudoId || vendorPartyId,
            supplierName: partyName(vendorPartyId),
            ownerText: party.ownerPartyId === "_NA_" ? "Shared with every organization" : "",
            canEditContact: !!contacts.access?.canEdit
        },
        contactRows: contacts.contactMechList || [],
        addressRows: contacts.addressList || [],
        roleRows: rows("mantle.party.PartyRole", {partyId: vendorPartyId}).map(role => ({roleTypeId: role.roleTypeId})),
        profile: Object.assign(profile ? lib.map(profile) : {}, profileDisplay(profile, at), {
            expectedFromDate: profile?.fromDate || null
        }),
        profileRows: profileRows.map(row =>
            Object.assign(lib.map(row), profileDisplay(row, ms(row.fromDate)), {
                fromDateText: lib.dateText(row.fromDate),
                thruDateText: lib.dateText(row.thruDate),
                changedByText: row.changedByUserId
                    ? one("moqui.security.UserAccount", {userId: row.changedByUserId})?.userFullName || row.changedByUserId
                    : "",
                inEffect: current(row, at)
            })
        ),
        buyer,
        buyerRows,
        category,
        supplierCheck: check
            ? {
                  result: check.result,
                  message: check.message || "",
                  color: {OK: "positive", WARN: "warning", STOP: "negative"}[check.result]
              }
            : null,
        purchasingCapabilities: {
            profileEdit: !!capabilities.profileEdit,
            approve: !!capabilities.approve,
            termsEdit: !!capabilities.termsEdit,
            financeRead: !!(capabilities.payableRead || capabilities.financialRead)
        }
    }
}

// bulk#SupplierChanges: the buyer or the category of several suppliers, each on its own in its own transaction: a supplier
// out of scope or refused by Mantle is named in the results and the others are changed.
function bulkChange(p) {
    const userScope = listScope()
    if (!userScope.capabilities.profileEdit) denied("PERMISSION_DENIED", "SUPPLIER_PROFILE_EDIT is required")
    const organizationPartyId = organizationOf(userScope, p.organizationPartyId)
    const change = p.change
    if (!["buyer", "category"].includes(change)) throw new Error("Unknown supplier change " + change)
    const ids = Array.from(
        new Set(
            (Array.isArray(p.partyIds) ? p.partyIds : String(p.partyIds || "").split(","))
                .map(id => String(id).trim())
                .filter(Boolean)
        )
    )
    if (!ids.length) denied("SUPPLIER_INVALID", "Choose at least one supplier")
    const results = []
    for (const partyId of ids) {
        try {
            if (!purchasing.supplierOf(userScope, partyId)) denied("RECORD_UNAVAILABLE", "Supplier is not available")
            const service =
                change === "buyer"
                    ? "mantle.party.SupplierServices.store#SupplierBuyer"
                    : "mantle.party.SupplierServices.set#SupplierCategory"
            const parameters =
                change === "buyer"
                    ? {organizationPartyId, supplierPartyId: partyId, buyerPartyId: p.buyerPartyId || null, fromDate: p.fromDate}
                    : {organizationPartyId, supplierPartyId: partyId, partyClassificationId: p.partyClassificationId || null}
            const out = lib.probe(service, parameters)
            results.push({partyId, supplierName: partyName(partyId), resultCode: out.changed ? "CHANGED" : "UNCHANGED"})
        } catch (error) {
            ec.logger.warn("Supplier " + partyId + " " + change + " change refused: " + error.message)
            results.push({
                partyId,
                supplierName: partyName(partyId),
                resultCode: "REFUSED",
                errorCode: lib.reasonCode(error) || "REFUSED",
                message: String(error.message || error)
            })
        }
    }
    const refused = results.filter(row => row.resultCode === "REFUSED")
    return {
        results,
        summary:
            String(results.length - refused.length) +
            " of " +
            results.length +
            " suppliers updated" +
            (refused.length ? "; refused: " + refused.map(row => row.supplierName + " (" + row.message + ")").join("; ") : "")
    }
}

const operations = {findSuppliers, duplicates, supplierContext, bulkChange}
;({
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Purchasing supplier operation " + op)
        return operations[op](parameters)
    }
})
