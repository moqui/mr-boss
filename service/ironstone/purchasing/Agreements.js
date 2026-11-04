// Purchasing's agreement reads (design-purchasing §7 Agreements and AgreementDetail; impl-purchasing P13, §2): AgreementFind and
// AgreementList (the purchase agreements and templates of the user's organizations by view, with their limit, released and
// remaining value), Supplier360's Agreements (the same list for one supplier), AgreementDetail's context (header, terms, items
// with their balance, releases, signers, approval, history from the audit log, files and the actions by capability and
// status), OrderDetail's Agreements (the releases on an order) and the drop-downs of the agreement forms and the release
// dialog. The writes are Mantle's (mantle.party.AgreementServices store#PurchaseAgreement, store#AgreementItem,
// submit#PurchaseAgreement, release#PurchaseAgreement, create#AgreementContent; mantle.order.PurchaseServices
// decide#PurchaseApproval with the agreementId), which the screens call after AccessServices.check#Record. Amounts show to a
// buyer, an approver, a supplier-price reader or a finance reader, "Withheld" to anyone else, never zero (§2).
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const purchasing = ec.resource.script("component://mr-boss/service/ironstone/purchasing/Purchasing.js")
const agreements = () => ec.resource.script("component://mr-mantle/service/mantle/party/PurchaseAgreements.js")
const {find, one, rows, denied} = lib

const AGREEMENT = "mantle.party.agreement.Agreement"
const choiceLimit = 30
const withheld = "Withheld"
const closedStatuses = ["AgmStExpired", "AgmStClosed", "AgmStCancelled"]
const expiringDays = 30
const views = {
    active: {label: "Active", statuses: ["AgmStActive"], templates: false},
    expiring: {label: "Expiring in 30 days", statuses: ["AgmStActive"], templates: false, expiring: true},
    exhausted: {label: "Exhausted", statuses: ["AgmStActive"], templates: false, exhausted: true},
    approval: {label: "Draft and awaiting approval", statuses: ["AgmStDraft", "AgmStActive"], templates: false, pending: true},
    templates: {label: "Templates", statuses: null, templates: true},
    closed: {label: "Expired, closed and cancelled", statuses: closedStatuses, templates: false}
}
const statusColors = {
    AgmStDraft: "grey-8",
    AgmStActive: "positive",
    AgmStExpired: "warning",
    AgmStClosed: "grey-8",
    AgmStCancelled: "grey-8"
}
const blank = value => value == null || String(value).trim() === ""
const dec = value => toDecimal(value ?? 0)
const likeText = text => "%" + String(text).replace(/[\\%_]/g, character => "\\" + character) + "%"
const money = (value, currencyUomId) =>
    value == null ? "" : ec.l10n.formatCurrency(lib.money(value, currencyUomId), currencyUomId)
const quantityText = value => (value == null || value === "" ? "" : ec.l10n.format(toDecimal(value), "#,##0.###"))
const amountsVisible = can => !!(can.buy || can.approve || can.orderApprove || can.supplierPriceRead || can.financialRead)
const internalIds = () => rows("mantle.party.PartyRole", {roleTypeId: "OrgInternal"}).map(row => row.partyId)
const statusText = statusId => (statusId ? one("moqui.basic.StatusItem", {statusId})?.description || statusId : "")
function buyersFor(userScope, organizationPartyId) {
    if (blank(organizationPartyId)) return userScope.ownerIds || internalIds()
    if (!purchasing.owns(userScope, organizationPartyId)) denied("RECORD_UNAVAILABLE", "The organization is not available")
    return [String(organizationPartyId)]
}
function listScope() {
    const userScope = purchasing.required()
    if (!userScope.capabilities.listRead) denied("PERMISSION_DENIED", "Agreements are not available")
    return userScope
}
const validityText = agreement =>
    [agreement.fromDate ? lib.dateText(agreement.fromDate) : "", agreement.thruDate ? lib.dateText(agreement.thruDate) : "open"]
        .filter(Boolean)
        .join(" – ")
// The totals of an agreement's balance: its value limit (the items' caps), what was released and what remains.
function totalsOf(balance) {
    const items = balance?.itemBalances || []
    const capped = items.filter(item => item.amountCap != null)
    const limit = capped.reduce((sum, item) => sum.add(dec(item.amountCap)), toDecimal(0))
    const released = items.reduce((sum, item) => sum.add(dec(item.releasedAmount)), toDecimal(0))
    const exhausted = items.some(
        item =>
            item.inEffect &&
            ((item.remainingQuantity != null && dec(item.remainingQuantity).compare(0) <= 0) ||
                (item.remainingAmount != null && dec(item.remainingAmount).compare(0) <= 0))
    )
    return {limit: capped.length ? limit : null, released, remaining: capped.length ? limit.subtract(released) : null, exhausted}
}
// A row of the list: the agreement with its supplier, status, validity, limit, released and remaining value.
function rowOf(agreement, can, names) {
    const showAmounts = amountsVisible(can)
    const template = agreement.isTemplate === "Y"
    const balance = template ? null : agreements().balanceOf(agreement.agreementId)
    const totals = totalsOf(balance)
    const currency = agreement.currencyUomId
    const pending = agreements().pending(agreement)
    return {
        agreementId: agreement.agreementId,
        description: agreement.description || "",
        supplierPartyId: agreement.otherPartyId,
        supplierName: names[agreement.otherPartyId] || agreement.otherPartyId,
        organizationName: names[agreement.organizationPartyId] || agreement.organizationPartyId,
        statusId: agreement.statusId,
        statusText: template
            ? "Template"
            : statusText(agreement.statusId) + (pending && agreement.statusId === "AgmStActive" ? ", change waiting" : ""),
        statusColor: template ? "info" : statusColors[agreement.statusId] || "grey-8",
        validityText: validityText(agreement),
        currencyUomId: currency,
        limitText: template
            ? ""
            : !showAmounts
              ? withheld
              : totals.limit == null
                ? "No value cap"
                : money(totals.limit, currency),
        releasedText: template ? "" : showAmounts ? money(totals.released, currency) : withheld,
        remainingText: template || totals.remaining == null ? "" : showAmounts ? money(totals.remaining, currency) : withheld,
        releasable: !!balance?.releasable,
        exhausted: totals.exhausted
    }
}
// find#Agreements: one page of the purchase agreements and templates of the user's organizations, by view, supplier,
// organization, status and text (the agreement or its description, ignoring case).
function findAgreements(p) {
    const userScope = listScope()
    const can = userScope.capabilities
    if (!blank(p.vendorPartyId) && !purchasing.supplierOf(userScope, String(p.vendorPartyId)))
        denied("RECORD_UNAVAILABLE", "Supplier " + p.vendorPartyId + " is not available")
    const buyers = buyersFor(userScope, p.organizationPartyId)
    const view = Object.hasOwn(views, p.view || "") ? views[p.view] : null
    const factory = ec.entity.conditionFactory
    const build = () => {
        let query = find(AGREEMENT, {agreementTypeEnumId: "AgrPurchase"}).condition(
            "organizationPartyId",
            "in",
            buyers.length ? buyers : ["_NA_"]
        )
        if (view?.statuses) query = query.condition("statusId", "in", view.statuses)
        if (view && view.templates) query = query.condition("isTemplate", "Y")
        if (view && !view.templates)
            query = query.condition(
                factory.makeCondition(
                    [factory.makeCondition("isTemplate", "is-null", null), factory.makeCondition("isTemplate", "equals", "N")],
                    "or"
                )
            )
        if (view?.expiring)
            query = query
                .condition("thruDate", "is-not-null", null)
                .condition("thruDate", "less-equals", Number(ec.user.nowTimestamp) + expiringDays * 24 * 60 * 60 * 1000)
        if (!blank(p.statusId)) query = query.condition("statusId", String(p.statusId))
        if (!blank(p.vendorPartyId)) query = query.condition("otherPartyId", String(p.vendorPartyId))
        if (!blank(p.text))
            query = query.condition(
                factory.makeCondition(
                    ["agreementId", "description"].map(field =>
                        factory.makeCondition(field, "like", likeText(String(p.text).trim())).ignoreCase()
                    ),
                    "or"
                )
            )
        return query.orderBy("-agreementDate").orderBy("-agreementId")
    }
    const inScope = row => !row.otherPartyId || !!purchasing.supplierOf(userScope, row.otherPartyId)
    let paged, found
    if (view?.exhausted || view?.pending) {
        // computed views: the matching agreements (bounded) filtered in memory, then paged
        const all = Array.from(build().limit(500).list())
            .filter(inScope)
            .filter(row =>
                view.pending ? agreements().pending(row) : totalsOf(agreements().balanceOf(row.agreementId)).exhausted
            )
        paged = lib.pageList(all, p, "agreementRows")
        found = paged.agreementRows
    } else {
        const result = lib.page(build(), p, "agreementRows", build().count())
        found = Array.from(result.rows).filter(inScope)
        paged = Object.assign({}, result)
        delete paged.rows
    }
    const names = lib.partyNames(found.flatMap(row => [row.otherPartyId, row.organizationPartyId]))
    const agreementRows = found.map(row => rowOf(row, can, names))
    return Object.assign(paged, {agreementRows, viewLabel: view ? view.label : "All"})
}

// ===== AgreementDetail =====
const enumText = enumId => (enumId ? one("moqui.basic.Enumeration", {enumId})?.description || enumId : "")
function decisionRows(agreementId) {
    return rows("mantle.order.purchase.PurchaseApprovalDecision", {sourceEntityName: AGREEMENT, sourceId: agreementId})
        .sort((a, b) => lib.ms(b.decisionDate) - lib.ms(a.decisionDate))
        .map(row => ({
            revisionText: "Revision " + row.sourceRevision,
            decisionText: enumText(row.decisionEnumId),
            byText: row.decidedByUserId
                ? one("moqui.security.UserAccount", {userId: row.decidedByUserId})?.userFullName || row.decidedByUserId
                : "",
            dateText: lib.dateText(row.decisionDate),
            reason: row.reason || "",
            supersededText: row.supersededDate ? "Superseded " + lib.dateText(row.supersededDate) : ""
        }))
}
// The approval preview of the agreement for a user who may read it (a probe: a user who may not gets none).
function approvalOf(agreementId, can) {
    if (!(can.buy || can.approve || can.policyEdit)) return null
    try {
        return lib.probe("mantle.order.PurchaseServices.preview#PurchaseApproval", {agreementId}).preview || null
    } catch (error) {
        ec.logger.warn("Approval of agreement " + agreementId + " not shown: " + error.message)
        return null
    }
}
// get#AgreementDetail: AgreementDetail's context of an agreement of the user's organizations and supplier scope.
function agreementDetail(p) {
    const userScope = listScope()
    const can = userScope.capabilities
    purchasing.recordOf(userScope, "agreement", String(p.agreementId || ""))
    const pa = agreements().agreementRow(p.agreementId)
    if (!pa) denied("RECORD_UNAVAILABLE", "Agreement " + p.agreementId + " is not available")
    const agreement = pa.agreement
    const showAmounts = amountsVisible(can)
    const currency = agreement.currencyUomId
    const names = lib.partyNames([agreement.otherPartyId, agreement.organizationPartyId])
    const balance = agreements().balanceOf(pa.agreementId)
    const totals = totalsOf(balance)
    const pending = agreements().pending(agreement)
    const revision = Number(agreement.agreementRevision ?? 1)
    const open = ["AgmStDraft", "AgmStActive"].includes(agreement.statusId)
    const amount = text => (showAmounts ? text : withheld)
    const itemRows = rows("mantle.party.agreement.AgreementItem", {agreementId: pa.agreementId})
        .sort((a, b) => String(a.agreementItemSeqId).localeCompare(b.agreementItemSeqId))
        .map(item => {
            const itemBalance = balance.itemBalances.find(row => row.agreementItemSeqId === item.agreementItemSeqId) || {}
            return {
                agreementItemSeqId: item.agreementItemSeqId,
                productId: item.productId,
                productText: itemBalance.productText || item.productId || "",
                itemText: item.itemText || "",
                quantity: item.quantity,
                quantityUomId: item.quantityUomId,
                amountCap: showAmounts ? item.amountCap : null,
                releaseTolerancePercent: item.releaseTolerancePercent,
                price: showAmounts ? itemBalance.price : null,
                fromDate: item.fromDate,
                thruDate: item.thruDate,
                datesText: [item.fromDate ? lib.dateText(item.fromDate) : "", item.thruDate ? lib.dateText(item.thruDate) : ""]
                    .filter(Boolean)
                    .join(" – "),
                inEffect: lib.active(item),
                stateText: lib.active(item) ? "" : lib.ms(item.fromDate) > Number(ec.user.nowTimestamp) ? "Not started" : "Ended",
                quantityText: itemBalance.quantityText || "",
                priceText: amount(itemBalance.priceText || ""),
                amountCapText: pa.template ? "" : amount(itemBalance.amountCapText || ""),
                toleranceText: itemBalance.toleranceText || "",
                releasedText: pa.template
                    ? ""
                    : quantityText(itemBalance.releasedQuantity) +
                      (showAmounts ? " · " + (itemBalance.releasedAmountText || "") : ""),
                remainingText: pa.template
                    ? ""
                    : [itemBalance.remainingQuantityText, showAmounts ? itemBalance.remainingAmountText : ""]
                          .filter(Boolean)
                          .join(" · ")
            }
        })
    const termRows = rows("mantle.party.agreement.AgreementTerm", {agreementId: pa.agreementId})
        .sort((a, b) => String(a.agreementTermId).localeCompare(b.agreementTermId))
        .map(term => ({
            agreementTermId: term.agreementTermId,
            termTypeEnumId: term.termTypeEnumId,
            settlementTermId: term.settlementTermId,
            termText: term.termText || "",
            termNumber: term.termNumber,
            agreementItemSeqId: term.agreementItemSeqId,
            fromDate: term.fromDate,
            thruDate: term.thruDate,
            typeText: enumText(term.termTypeEnumId) || (term.settlementTermId ? "Payment term" : "Term"),
            settlementText: term.settlementTermId
                ? one("mantle.account.invoice.SettlementTerm", {settlementTermId: term.settlementTermId})?.description ||
                  term.settlementTermId
                : "",
            numberText: quantityText(term.termNumber),
            itemText: term.agreementItemSeqId ? "Item " + term.agreementItemSeqId : "All items",
            datesText: [term.fromDate ? lib.dateText(term.fromDate) : "", term.thruDate ? lib.dateText(term.thruDate) : ""]
                .filter(Boolean)
                .join(" – "),
            inEffect: lib.active(term)
        }))
    const releaseRows = balance.releaseRows.map(row =>
        Object.assign({}, row, {amountText: amount(row.amountText), unitAmountText: amount(row.unitAmountText)})
    )
    const partyRows = rows("mantle.party.agreement.AgreementParty", {agreementId: pa.agreementId}).map(row => ({
        partyId: row.partyId,
        roleTypeId: row.roleTypeId,
        partyName: lib.partyNames([row.partyId])[row.partyId] || row.partyId,
        roleText: one("mantle.party.RoleType", {roleTypeId: row.roleTypeId})?.description || row.roleTypeId
    }))
    const historyRows = agreements()
        .historyOf(pa.agreementId)
        .map(row =>
            ["Value cap", "Price"].includes(row.fieldText) && !showAmounts
                ? Object.assign({}, row, {fromText: withheld, toText: withheld})
                : row
        )
    const contentRows = rows("mantle.party.agreement.AgreementContent", {agreementId: pa.agreementId})
        .sort((a, b) => lib.ms(b.contentDate) - lib.ms(a.contentDate))
        .map(row => ({
            agreementContentId: row.agreementContentId,
            description: row.description || (row.contentLocation || "").split("/").pop() || row.agreementContentId,
            typeText: enumText(row.contentTypeEnumId),
            dateText: lib.dateText(row.contentDate),
            // the approved PDF shows the prices: only to a user who sees the amounts (§2)
            canOpen: !!row.contentLocation && (showAmounts || row.contentTypeEnumId !== "AcntApprovedVersion")
        }))
    const approval = approvalOf(pa.agreementId, can)
    const actions = {
        edit: !!can.buy && open,
        submit: !!can.buy && pending && !pa.template,
        approve: !!can.approve && pending && !pa.template && !!approval?.canDecide,
        release: !!can.buy && !!balance.releasable,
        close: !!can.buy && ["AgmStActive", "AgmStExpired"].includes(agreement.statusId) && !pa.template,
        cancel: !!can.buy && open,
        fromTemplate: !!can.buy && pa.template,
        print: !!(can.buy || can.approve || can.orderApprove),
        upload: !!can.buy
    }
    return {
        agreementFound: true,
        agreement: {
            agreementId: pa.agreementId,
            description: agreement.description || "",
            textData: agreement.textData || "",
            statusId: agreement.statusId,
            statusText: pa.template ? "Template" : statusText(agreement.statusId),
            statusColor: pa.template ? "info" : statusColors[agreement.statusId] || "grey-8",
            template: pa.template,
            templateAgreementId: agreement.templateAgreementId || "",
            organizationPartyId: agreement.organizationPartyId,
            organizationName: names[agreement.organizationPartyId] || agreement.organizationPartyId,
            supplierPartyId: agreement.otherPartyId,
            supplierName: names[agreement.otherPartyId] || agreement.otherPartyId,
            fromDate: agreement.fromDate,
            thruDate: agreement.thruDate,
            validityText: validityText(agreement),
            currencyUomId: currency,
            agreementRevision: revision,
            revisionText:
                "Revision " +
                revision +
                (agreement.approvedRevision == null
                    ? pa.template
                        ? ""
                        : ", not approved yet"
                    : Number(agreement.approvedRevision) === revision
                      ? ", approved " + lib.dateText(agreement.approvedDate)
                      : ", revision " + agreement.approvedRevision + " approved; this one waits"),
            limitText: pa.template
                ? ""
                : !showAmounts
                  ? withheld
                  : totals.limit == null
                    ? "No value cap"
                    : money(totals.limit, currency),
            releasedText: pa.template ? "" : amount(money(totals.released, currency)),
            remainingText: pa.template || totals.remaining == null ? "" : amount(money(totals.remaining, currency)),
            releaseRefusalText: balance.releaseRefusalText || "",
            pending
        },
        itemRows,
        termRows,
        releaseRows,
        partyRows,
        historyRows,
        contentRows,
        decisionRows: decisionRows(pa.agreementId),
        approval,
        actions
    }
}

// OrderDetail's Agreements: the releases on a purchase order, each with its agreement and item.
function orderAgreements(p) {
    const userScope = listScope()
    purchasing.recordOf(userScope, "order", String(p.orderId || ""))
    const showAmounts = amountsVisible(userScope.capabilities)
    const releases = rows("mantle.party.agreement.AgreementRelease", {orderId: String(p.orderId)}).sort(
        (a, b) => lib.ms(a.releaseDate) - lib.ms(b.releaseDate)
    )
    return {
        releaseRows: releases.map(row => {
            const agreement = one(AGREEMENT, {agreementId: row.agreementId})
            return {
                agreementId: row.agreementId,
                agreementText: agreement?.description || row.agreementId,
                agreementItemSeqId: row.agreementItemSeqId,
                orderItemSeqId: row.orderItemSeqId,
                revisionText: row.agreementRevision == null ? "" : "Revision " + row.agreementRevision,
                quantityText: quantityText(row.quantity),
                amountText: showAmounts ? money(row.amount, row.currencyUomId) : withheld,
                dateText: lib.dateText(row.releaseDate),
                statusText: statusText(agreement?.statusId)
            }
        })
    }
}

// ===== choices =====
function agreementQuery(userScope, term) {
    const factory = ec.entity.conditionFactory
    let query = find(AGREEMENT, {agreementTypeEnumId: "AgrPurchase"})
        .condition("organizationPartyId", "in", userScope.ownerIds || internalIds())
        .orderBy("-agreementDate")
        .limit(choiceLimit)
    if (term)
        query = query.condition(
            factory.makeCondition(
                ["agreementId", "description"].map(field => factory.makeCondition(field, "like", likeText(term)).ignoreCase()),
                "or"
            )
        )
    return query
}
const agreementLabel = (row, names) =>
    [row.agreementId, row.description, names[row.otherPartyId] || row.otherPartyId].filter(Boolean).join(" · ")
// The agreements a release may come from: active, not templates, of a supplier when partyId is given.
function releaseChoices(userScope, term, selected, p) {
    let query = agreementQuery(userScope, term)
        .condition("statusId", "AgmStActive")
        .condition(
            ec.entity.conditionFactory.makeCondition(
                [
                    ec.entity.conditionFactory.makeCondition("isTemplate", "is-null", null),
                    ec.entity.conditionFactory.makeCondition("isTemplate", "equals", "N")
                ],
                "or"
            )
        )
    if (!blank(p?.partyId)) query = query.condition("otherPartyId", String(p.partyId))
    const found = Array.from(query.list()).filter(row => purchasing.supplierOf(userScope, row.otherPartyId))
    const names = lib.partyNames(found.map(row => row.otherPartyId))
    const options = found.map(row => ({value: row.agreementId, label: agreementLabel(row, names)}))
    if (selected && !options.some(option => option.value === selected)) {
        try {
            purchasing.recordOf(userScope, "agreement", selected)
            const row = one(AGREEMENT, {agreementId: selected})
            options.push({value: selected, label: agreementLabel(row, lib.partyNames([row.otherPartyId]))})
        } catch (_) {
            // not the user's: left out
        }
    }
    return options
}
// The templates a new agreement may start from.
function templateChoices(userScope, term, selected) {
    const found = Array.from(agreementQuery(userScope, term).condition("isTemplate", "Y").list()).filter(
        row => !row.otherPartyId || purchasing.supplierOf(userScope, row.otherPartyId)
    )
    const names = lib.partyNames(found.map(row => row.otherPartyId))
    const options = found.map(row => ({value: row.agreementId, label: agreementLabel(row, names)}))
    if (selected && !options.some(option => option.value === selected)) {
        const row = one(AGREEMENT, {agreementId: selected})
        if (row?.isTemplate === "Y" && purchasing.owns(userScope, row.organizationPartyId))
            options.push({value: selected, label: agreementLabel(row, lib.partyNames([row.otherPartyId]))})
    }
    return options
}
// The items of an agreement (agreementId) in effect, with what remains.
function itemChoices(userScope, term, selected, p) {
    if (blank(p?.agreementId)) return []
    try {
        purchasing.recordOf(userScope, "agreement", String(p.agreementId))
    } catch (_) {
        return []
    }
    const balance = agreements().balanceOf(String(p.agreementId))
    return (balance?.itemBalances || [])
        .filter(item => item.inEffect)
        .map(item => ({
            value: item.agreementItemSeqId,
            label: [
                item.agreementItemSeqId,
                item.productText,
                item.remainingQuantityText ? item.remainingQuantityText + " left" : ""
            ]
                .filter(Boolean)
                .join(" · ")
        }))
}
// The term types (TermType) and the payment terms (SettlementTerm), closed lists.
function termTypeChoices(term) {
    let query = find("moqui.basic.Enumeration", {enumTypeId: "TermType"}).orderBy("description").limit(100)
    if (term)
        query = query.condition(ec.entity.conditionFactory.makeCondition("description", "like", likeText(term)).ignoreCase())
    return Array.from(query.list()).map(row => ({value: row.enumId, label: row.description || row.enumId}))
}
function settlementTermChoices() {
    return rows("mantle.account.invoice.SettlementTerm", {})
        .sort((a, b) => String(a.description || "").localeCompare(String(b.description || "")))
        .map(row => ({value: row.settlementTermId, label: row.description || row.settlementTermId}))
}
// The signers of an agreement (agreementId): the people of its organization and the supplier's contacts.
function signerChoices(userScope, term, selected, p) {
    if (blank(p?.agreementId)) return []
    try {
        purchasing.recordOf(userScope, "agreement", String(p.agreementId))
    } catch (_) {
        return []
    }
    const agreement = one(AGREEMENT, {agreementId: String(p.agreementId)})
    const peopleIds = [
        ...new Set(
            Array.from(
                find("mantle.party.PartyRelationship")
                    .condition("toPartyId", "in", [agreement.organizationPartyId, agreement.otherPartyId].filter(Boolean))
                    .list()
            )
                .filter(row => lib.active(row))
                .map(row => row.fromPartyId)
        )
    ]
    if (!peopleIds.length) return []
    const factory = ec.entity.conditionFactory
    let query = find("mantle.party.Person").condition("partyId", "in", peopleIds).orderBy("firstName").limit(choiceLimit)
    if (term)
        query = query.condition(
            factory.makeCondition(
                ["firstName", "lastName", "partyId"].map(field =>
                    factory.makeCondition(field, "like", likeText(term)).ignoreCase()
                ),
                "or"
            )
        )
    const names = row => [row.firstName, row.lastName].filter(Boolean).join(" ") || row.partyId
    return Array.from(query.list()).map(row => ({value: row.partyId, label: names(row)}))
}
// The currencies an agreement may be in.
function currencyChoices(term, selected) {
    let query = find("moqui.basic.Uom", {uomTypeEnumId: "UT_CURRENCY_MEASURE"}).orderBy("uomId").limit(choiceLimit)
    if (term)
        query = query.condition(
            ec.entity.conditionFactory.makeCondition(
                ["uomId", "description"].map(field =>
                    ec.entity.conditionFactory.makeCondition(field, "like", likeText(term)).ignoreCase()
                ),
                "or"
            )
        )
    const options = Array.from(query.list()).map(row => ({value: row.uomId, label: row.uomId + " · " + (row.description || "")}))
    if (selected && !options.some(option => option.value === selected)) options.push({value: selected, label: selected})
    return options
}

const operations = {findAgreements, agreementDetail, orderAgreements}
;({
    releaseChoices,
    templateChoices,
    itemChoices,
    termTypeChoices,
    settlementTermChoices,
    signerChoices,
    currencyChoices,
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown agreement operation " + op)
        return operations[op](parameters)
    }
})
