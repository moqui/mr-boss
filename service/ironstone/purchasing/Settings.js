// Purchasing's settings forms (design-purchasing Settings and PurchasePolicy's PolicyDependencies; impl-purchasing P2): the
// settings links with the policy in effect of each, the policies Purchasing depends on and does not own (Accounting's match
// and budget control, Warehouse's receiving) read only with their owners' links, the purchase request purposes
// (RequestCategory) and the supplier categories (PartyClassification of PcltSupplierCategory). The buying policy itself is
// Mantle's mantle.order.PurchaseServices; a write here needs PURCHASE_POLICY_EDIT and the Settings area.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const purchasing = ec.resource.script("component://mr-boss/service/ironstone/purchasing/Purchasing.js")
const policy = ec.resource.script("component://mr-mantle/service/mantle/order/PurchasePolicy.js")
const sharedContext = ec.resource.script("component://mr-boss/service/ironstone/products/SharedContext.js")
const {find, one, rows, ms, call, denied} = lib

const blank = value => value == null || String(value).trim() === ""
const current = (row, at) => (ms(row.fromDate) ?? -Infinity) <= at && (ms(row.thruDate) ?? Infinity) > at
const yesNo = value => (value === "Y" ? "Yes" : value === "N" ? "No" : "")
const enumText = enumId => (enumId ? one("moqui.basic.Enumeration", {enumId})?.description || enumId : "")
const number = value => (value == null ? "" : String(Number(String(value))))
function partyName(partyId) {
    if (!partyId) return ""
    const organization = one("mantle.party.Organization", {partyId})
    if (organization?.organizationName) return organization.organizationName
    const person = one("mantle.party.Person", {partyId})
    return (person ? [person.firstName, person.lastName].filter(Boolean).join(" ") : "") || partyId
}
function settingsScope(write = false) {
    const userScope = purchasing.required()
    if (!userScope.capabilities.settings) denied("PERMISSION_DENIED", ec.l10n.localize("Purchasing settings are not available"))
    if (write && !userScope.capabilities.policyEdit) denied("PERMISSION_DENIED", ec.l10n.localize("PURCHASE_POLICY_EDIT is required"))
    return userScope
}
function organizationOf(userScope, organizationPartyId) {
    const ids = userScope.ownerIds || rows("mantle.party.PartyRole", {roleTypeId: "OrgInternal"}).map(row => row.partyId)
    if (!blank(organizationPartyId)) {
        if (!ids.includes(organizationPartyId)) denied("RECORD_UNAVAILABLE", ec.l10n.localize("Organization is not available"))
        return organizationPartyId
    }
    return userScope.activeOrganizationPartyId || userScope.organizationPartyIds[0] || ids[0] || null
}
// The newest row of an entity in effect now among those matching.
function inEffect(entity, conditions, at) {
    return (
        rows(entity, conditions)
            .filter(row => current(row, at))
            .sort((a, b) => ms(b.fromDate) - ms(a.fromDate))[0] || null
    )
}

// The policies Purchasing reads but does not own, read only (design PolicyDependencies): the organization's default match
// policy, its budget control at the purchase order stage, and its warehouses' receiving steps.
function dependencies(organizationPartyId, at) {
    const mayOpen = app => {
        try {
            return sharedContext.mayOpen(app)
        } catch (error) {
            return false
        }
    }
    const accounting = mayOpen("Accounting"),
        warehouse = mayOpen("Warehouse")
    const match = inEffect(
        "mantle.account.invoice.InvoiceMatchPolicy",
        {organizationPartyId, productId: null, productCategoryId: null},
        at
    )
    const rowsOut = []
    const add = (area, setting, valueText, owner, url) => rowsOut.push({area, setting, valueText, owner, url: url || null})
    const matchUrl = accounting ? "/qapps/Accounting/Settings/MatchPolicies" : null
    if (match) {
        add(ec.l10n.localize("Bill matching"), ec.l10n.localize("Bill basis"), enumText(match.billBasisEnumId) || ec.l10n.localize("Received"), ec.l10n.localize("Accounting"), matchUrl)
        add(ec.l10n.localize("Bill matching"), ec.l10n.localize("Receipt required"), yesNo(match.receiptRequired || "Y"), ec.l10n.localize("Accounting"), matchUrl)
        add(
            ec.l10n.localize("Bill matching"),
            ec.l10n.localize("Tolerance"),
            ec.resource.expand("Quantity ${quantity}%, price ${price}%", "", {
                quantity: number(match.quantityTolerancePercent) || "0",
                price: number(match.priceTolerancePercent) || "0"
            }),
            ec.l10n.localize("Accounting"),
            matchUrl
        )
        add(ec.l10n.localize("Bill matching"), ec.l10n.localize("Variance"), enumText(match.varianceActionEnumId) || ec.l10n.localize("Hold"), ec.l10n.localize("Accounting"), matchUrl)
        add(ec.l10n.localize("Bill matching"), ec.l10n.localize("Self-billing default"), yesNo(match.selfBillingDefault || "N"), ec.l10n.localize("Accounting"), matchUrl)
    } else add(ec.l10n.localize("Bill matching"), ec.l10n.localize("Match policy"), ec.l10n.localize("Accounting's defaults (no policy set)"), ec.l10n.localize("Accounting"), matchUrl)
    const budgets = rows("mantle.other.budget.BudgetControlPolicy", {organizationPartyId}).filter(
        row => current(row, at) && (!row.stageEnumId || row.stageEnumId === "BcsOrder")
    )
    add(
        ec.l10n.localize("Budget control"),
        ec.l10n.localize("At purchase order"),
        budgets.length
            ? Array.from(new Set(budgets.map(row => enumText(row.actionEnumId)))).join(", ") +
                  " (" +
                  budgets.length +
                  " policies)"
            : ec.l10n.localize("Not controlled"),
        ec.l10n.localize("Accounting"),
        accounting ? "/qapps/Accounting/Settings" : null
    )
    const receiving = inEffect(
        "mantle.facility.WarehousePolicy",
        {organizationPartyId, facilityId: "_NA_", productId: "_NA_"},
        at
    )
    add(
        ec.l10n.localize("Receiving"),
        ec.l10n.localize("Receipt steps"),
        receiving?.receiptSteps != null ? number(receiving.receiptSteps) : ec.l10n.localize("Warehouse's default"),
        ec.l10n.localize("Warehouse"),
        warehouse ? "/qapps/Warehouse/Settings" : null
    )
    return rowsOut
}

// get#PurchasingSettings: the settings landing and PurchasePolicy's PolicyDependencies for an organization.
function settings(p) {
    const userScope = settingsScope()
    const organizationPartyId = organizationOf(userScope, p.organizationPartyId)
    const at = ms(ec.user.nowTimestamp)
    const effective = policy.effective(organizationPartyId, at)
    const settingsRows = [
        {
            area: ec.l10n.localize("Buying policy"),
            description: ec.l10n.localize("Buying defaults and purchase controls, among them the approval gate"),
            effectiveText: effective.row
                ? ec.resource.expand("Since ${date}", "", {date: lib.dateText(effective.row.fromDate)})
                : ec.l10n.localize("Built-in defaults"),
            owner: ec.l10n.localize("Purchasing"),
            url: "/qapps/Purchasing/Settings/PurchasePolicy"
        },
        {
            area: ec.l10n.localize("Approval policies"),
            description: ec.l10n.localize("Who approves purchase orders and suppliers, in which steps, by amount"),
            effectiveText: ec.resource.expand("${count} steps in effect", "", {
                count: String(
                    rows("mantle.order.purchase.PurchaseApprovalPolicy", {organizationPartyId}).filter(row => current(row, at))
                        .length
                )
            }),
            owner: ec.l10n.localize("Purchasing"),
            url: "/qapps/Purchasing/Settings/ApprovalPolicies"
        },
        // P15: the supplier scorecard basis, measures and response rules
        {
            area: ec.l10n.localize("Scorecard policies"),
            description:
                ec.l10n.localize("How suppliers are evaluated: the period, minimum sample, measures and the response to a low score or a risk"),
            effectiveText: ec.resource.expand("${count} response rules in effect", "", {
                count: String(
                    rows("mantle.party.supplier.SupplierScorecardAction", {organizationPartyId}).filter(row => current(row, at))
                        .length
                )
            }),
            owner: ec.l10n.localize("Purchasing"),
            url: "/qapps/Purchasing/Settings/ScorecardPolicies"
        },
        {
            area: ec.l10n.localize("Request purposes"),
            description: ec.l10n.localize("The purposes a purchase request is filed under, with who handles them"),
            effectiveText: ec.resource.expand("${count} purposes", "", {
                count: String(find("mantle.request.RequestCategory").count())
            }),
            owner: ec.l10n.localize("Purchasing"),
            url: null
        },
        {
            area: ec.l10n.localize("Supplier categories"),
            description: ec.l10n.localize("The categories buyers group suppliers by"),
            effectiveText: ec.resource.expand("${count} categories", "", {
                count: String(find("mantle.party.PartyClassification", {classificationTypeEnumId: "PcltSupplierCategory"}).count())
            }),
            owner: ec.l10n.localize("Purchasing"),
            url: null
        },
        // P5: the receipt inspection templates, at Receiving/InspectionTemplates (design §1), Warehouse's shared screen
        {
            area: ec.l10n.localize("Inspection templates"),
            description: ec.l10n.localize("The checks a purchase receipt is inspected against before its stock is released"),
            effectiveText: ec.resource.expand("${count} published", "", {
                count: String(
                    find("mantle.product.quality.InspectionTemplate", {
                        inspectionContextEnumId: "QicReceipt",
                        statusId: "QtPublished"
                    })
                        .condition("organizationPartyId", organizationPartyId)
                        .count()
                )
            }),
            owner: ec.l10n.localize("Warehouse"),
            url: "/qapps/Purchasing/Receiving/InspectionTemplates"
        }
    ]
    return {
        organizationPartyId,
        organizationName: partyName(organizationPartyId),
        settingsRows,
        dependencyRows: dependencies(organizationPartyId, at),
        purposeRows: Array.from(find("mantle.request.RequestCategory").orderBy("description").limit(200).list()).map(row =>
            Object.assign(lib.map(row), {
                parentText: row.parentCategoryId
                    ? one("mantle.request.RequestCategory", {requestCategoryId: row.parentCategoryId})?.description ||
                      row.parentCategoryId
                    : "",
                responsibleText: partyName(row.responsiblePartyId)
            })
        ),
        categoryRows: Array.from(
            find("mantle.party.PartyClassification", {classificationTypeEnumId: "PcltSupplierCategory"})
                .orderBy("description")
                .limit(200)
                .list()
        ).map(row =>
            Object.assign(lib.map(row), {
                parentText: row.parentClassificationId
                    ? one("mantle.party.PartyClassification", {partyClassificationId: row.parentClassificationId})?.description ||
                      row.parentClassificationId
                    : ""
            })
        ),
        canEdit: !!userScope.capabilities.policyEdit
    }
}

// store#RequestPurpose: a new purchase request purpose or a change of one (RequestCategory), with its parent and the party
// responsible for its requests.
function storeRequestPurpose(p) {
    settingsScope(true)
    const description = String(p.description || "").trim()
    if (!description) denied("PURPOSE_INVALID", ec.l10n.localize("Give the purpose a name"))
    if (!blank(p.parentCategoryId)) {
        if (
            !one("mantle.request.RequestCategory", {requestCategoryId: p.parentCategoryId}) ||
            p.parentCategoryId === p.requestCategoryId
        )
            denied("PURPOSE_INVALID", ec.l10n.localize("Choose another purpose as the parent"))
    }
    if (!blank(p.responsiblePartyId) && !one("mantle.party.Party", {partyId: p.responsiblePartyId}))
        denied("PURPOSE_INVALID", ec.l10n.localize("Choose an existing responsible party"))
    const values = {
        description,
        parentCategoryId: blank(p.parentCategoryId) ? null : p.parentCategoryId,
        responsiblePartyId: blank(p.responsiblePartyId) ? null : p.responsiblePartyId
    }
    if (blank(p.requestCategoryId))
        return {requestCategoryId: call("create#mantle.request.RequestCategory", values).requestCategoryId}
    if (!one("mantle.request.RequestCategory", {requestCategoryId: p.requestCategoryId}))
        denied("PURPOSE_INVALID", "Purpose " + p.requestCategoryId + " is not available")
    call("update#mantle.request.RequestCategory", Object.assign({requestCategoryId: p.requestCategoryId}, values))
    return {requestCategoryId: p.requestCategoryId}
}

// store#SupplierCategory: a new supplier category or a change of one (a PartyClassification of PcltSupplierCategory).
function storeSupplierCategory(p) {
    settingsScope(true)
    const description = String(p.description || "").trim()
    if (!description) denied("CATEGORY_INVALID", ec.l10n.localize("Give the category a name"))
    const ofType = id =>
        one("mantle.party.PartyClassification", {partyClassificationId: id})?.classificationTypeEnumId === "PcltSupplierCategory"
    if (
        !blank(p.parentClassificationId) &&
        (!ofType(p.parentClassificationId) || p.parentClassificationId === p.partyClassificationId)
    )
        denied("CATEGORY_INVALID", ec.l10n.localize("Choose another supplier category as the parent"))
    const values = {
        description,
        parentClassificationId: blank(p.parentClassificationId) ? null : p.parentClassificationId,
        standardCode: blank(p.standardCode) ? null : String(p.standardCode).trim()
    }
    if (blank(p.partyClassificationId))
        return {
            partyClassificationId: call(
                "create#mantle.party.PartyClassification",
                Object.assign({classificationTypeEnumId: "PcltSupplierCategory"}, values)
            ).partyClassificationId
        }
    if (!ofType(p.partyClassificationId)) denied("CATEGORY_INVALID", "Category " + p.partyClassificationId + " is not available")
    call("update#mantle.party.PartyClassification", Object.assign({partyClassificationId: p.partyClassificationId}, values))
    return {partyClassificationId: p.partyClassificationId}
}

const operations = {settings, storeRequestPurpose, storeSupplierCategory}
;({
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Purchasing settings operation " + op)
        return operations[op](parameters)
    }
})
