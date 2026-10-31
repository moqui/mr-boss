// The Tax screens' reads (design-accounting §11): authorities with the organization's nexus and account, rate versions
// with their state, statements, and a statement's detail. Mantle's TaxServices own the writes, the calculation and the
// statement lines; these check the tax capability and shape rows for the screens.
const lib = ec.resource.script("component://mr-boss/service/ironstone/accounting/AccountingLib.js")
const policy = lib.policy
const {find, rows, one} = policy
const salesTaxForm = "LocalSalesTaxReturn"
const vendorForm = "UsaIrs1099Misc"
// The taxpayer numbers of a 1099's payer and recipient show only their last four digits; the export has them in full.
const taxpayerNumberFields = ["1099m_b", "1099m_c"]
const masked = value => (value ? "•••-••-" + String(value).replace(/\D/g, "").slice(-4) : "")

// The tax screens are for tax users and finance administrators.
function access(p) {
    return lib.access(p, ["taxEdit", "admin"], "Tax authority is required")
}
function searched(query, fields, text) {
    if (!text) return query
    const conditions = ec.entity.conditionFactory
    return query.condition(
        conditions.makeCondition(
            fields.map(field => conditions.makeCondition(field, "like", "%" + text + "%").ignoreCase()),
            "or"
        )
    )
}
function byId(entity, field, ids) {
    const unique = [...new Set(ids.filter(Boolean))]
    if (!unique.length) return {}
    return Object.fromEntries(Array.from(find(entity).condition(field, "in", unique).list()).map(row => [row[field], row]))
}
function geoNames(ids) {
    const geos = byId("moqui.basic.Geo", "geoId", ids)
    return Object.fromEntries(Object.entries(geos).map(([id, row]) => [id, row.geoName || id]))
}
function authorityNames(ids) {
    const found = byId("mantle.other.tax.TaxAuthority", "taxAuthorityId", ids)
    return Object.fromEntries(Object.entries(found).map(([id, row]) => [id, row.description || id]))
}
// A dated row's state on a day: Current, Scheduled or Ended, with its chip color.
function datedState(row, now = ec.user.nowTimestamp) {
    if (policy.ms(row.fromDate) > policy.ms(now)) return {stateText: "Scheduled", stateColor: "info"}
    if (row.thruDate != null && policy.ms(row.thruDate) <= policy.ms(now)) return {stateText: "Ended", stateColor: "grey"}
    return {stateText: "Current", stateColor: "positive"}
}

function authorities(p) {
    const scope = access(p)
    const organizationPartyId = scope.organizationPartyId
    const query = () => searched(find("mantle.other.tax.TaxAuthority"), ["taxAuthorityId", "description"], p.text)
    const page = policy.lib.page(query().orderBy("description"), p, "records", query().count())
    const ids = page.rows.map(row => row.taxAuthorityId)
    const geos = geoNames(page.rows.map(row => row.taxAuthGeoId))
    const parties = policy.lib.partyNames(page.rows.map(row => row.taxAuthPartyId))
    const nexus = {},
        accounts = {},
        rateCounts = {}
    if (organizationPartyId && ids.length) {
        for (const row of find("mantle.other.tax.TaxAuthorityParty", {partyId: organizationPartyId})
            .condition("taxAuthorityId", "in", ids)
            .list())
            if (policy.active(row)) nexus[row.taxAuthorityId] = row
        for (const row of find("mantle.ledger.config.TaxAuthorityGlAccount", {organizationPartyId})
            .condition("taxAuthorityId", "in", ids)
            .list())
            accounts[row.taxAuthorityId] = row.glAccountId
        for (const row of find("mantle.other.tax.TaxAuthorityRate").condition("taxAuthorityId", "in", ids).list())
            if (datedState(row).stateText === "Current")
                rateCounts[row.taxAuthorityId] = (rateCounts[row.taxAuthorityId] || 0) + 1
    }
    const glAccounts = byId("mantle.ledger.account.GlAccount", "glAccountId", Object.values(accounts))
    const records = page.rows.map(row => {
        const glAccount = glAccounts[accounts[row.taxAuthorityId]]
        const registration = nexus[row.taxAuthorityId]
        return Object.assign(lib.plain(row), {
            geoName: geos[row.taxAuthGeoId] || "",
            partyName: parties[row.taxAuthPartyId] || "",
            isNexus: registration?.isNexus === "Y" ? "Y" : "N",
            partyTaxId: registration?.partyTaxId || "",
            glAccountId: glAccount?.glAccountId || "",
            glAccountText: glAccount ? (glAccount.accountCode || glAccount.glAccountId) + " — " + glAccount.accountName : "",
            currentRateCount: rateCounts[row.taxAuthorityId] || 0
        })
    })
    return Object.assign(lib.paging(page), {records, canEdit: !!scope.capabilities.admin})
}

function rates(p) {
    const scope = access(p)
    const organizationPartyId = scope.organizationPartyId
    const conditions = ec.entity.conditionFactory
    const now = ec.user.nowTimestamp
    const query = () => {
        let query = find("mantle.other.tax.TaxAuthorityRate")
        if (organizationPartyId)
            query = query.condition(
                conditions.makeCondition(
                    [
                        conditions.makeCondition("organizationPartyId", "equals", organizationPartyId),
                        conditions.makeCondition("organizationPartyId", "is-null", null)
                    ],
                    "or"
                )
            )
        else query = query.condition("organizationPartyId", "in", scope.allowedOrganizationPartyIds)
        if (p.taxAuthorityId) query = query.condition("taxAuthorityId", p.taxAuthorityId)
        if (p.state === "current")
            query = query
                .condition("fromDate", "less-equals", now)
                .condition(
                    conditions.makeCondition(
                        [
                            conditions.makeCondition("thruDate", "is-null", null),
                            conditions.makeCondition("thruDate", "greater", now)
                        ],
                        "or"
                    )
                )
        return query
    }
    const page = policy.lib.page(query().orderBy("taxAuthorityId,-fromDate"), p, "records", query().count())
    const names = authorityNames(page.rows.map(row => row.taxAuthorityId))
    const stores = byId(
        "mantle.product.store.ProductStore",
        "productStoreId",
        page.rows.map(row => row.productStoreId)
    )
    const categories = byId(
        "mantle.product.category.ProductCategory",
        "productCategoryId",
        page.rows.map(row => row.productCategoryId)
    )
    const records = page.rows.map(row => {
        const scopeText = [
            row.productStoreId ? "Store " + (stores[row.productStoreId]?.storeName || row.productStoreId) : null,
            row.productCategoryId
                ? "Category " + (categories[row.productCategoryId]?.categoryName || row.productCategoryId)
                : null
        ]
            .filter(Boolean)
            .join(", ")
        return Object.assign(lib.plain(row), datedState(row, now), {
            authorityName: names[row.taxAuthorityId] || row.taxAuthorityId,
            scopeText: scopeText || "All sales",
            percentText: row.taxPercentage == null ? "" : ec.l10n.format(row.taxPercentage, "#,##0.####") + "%",
            shippingText: row.taxShipping === "Y" ? "Taxed" : "Not taxed",
            canChange:
                !!scope.capabilities.admin &&
                row.organizationPartyId === organizationPartyId &&
                datedState(row, now).stateText !== "Ended"
        })
    })
    return Object.assign(lib.paging(page), {records, canEdit: !!scope.capabilities.admin})
}

// A statement's kind for the screens.
function kindOf(statement) {
    return statement.formId === salesTaxForm
        ? "Sales tax"
        : statement.formId === vendorForm
          ? "1099-MISC"
          : statement.formId || ""
}
function statementRows(found) {
    const periods = byId(
        "mantle.party.time.TimePeriod",
        "timePeriodId",
        found.map(row => row.timePeriodId)
    )
    const names = policy.lib.partyNames(found.map(row => row.partyId))
    const authorityNamesById = authorityNames(found.map(row => row.taxAuthorityId))
    return found.map(row =>
        Object.assign(lib.plain(row), {
            kindText: kindOf(row),
            periodName: periods[row.timePeriodId]?.periodName || row.timePeriodId,
            partyName: names[row.partyId] || row.partyId,
            authorityName: authorityNamesById[row.taxAuthorityId] || row.taxAuthorityId || "",
            exportedText: row.exportedDate ? "Exported" : "Not exported",
            exportedColor: row.exportedDate ? "positive" : "grey",
            title: kindOf(row) + " · " + (periods[row.timePeriodId]?.periodName || row.timePeriodId)
        })
    )
}

function statements(p) {
    const scope = access(p)
    const organizations = scope.organizationPartyId ? [scope.organizationPartyId] : scope.allowedOrganizationPartyIds
    const query = () => {
        let query = find("mantle.other.tax.TaxStatementPeriodAuthority")
            .condition("periodPartyId", "in", organizations.length ? organizations : ["_DENIED_"])
            .condition("formId", "in", [salesTaxForm, vendorForm])
        if (p.formId) query = query.condition("formId", p.formId)
        if (p.timePeriodId) query = query.condition("timePeriodId", p.timePeriodId)
        return query
    }
    const page = policy.lib.page(query().orderBy("-createdDate,-taxStatementId"), p, "records", query().count())
    const records = statementRows(page.rows)
    return Object.assign(lib.paging(page), {records, canEdit: !!scope.capabilities.taxEdit})
}

// A statement for TaxStatementDetail: its header, its sales tax lines (find#SalesTaxLines) or its 1099 form fields.
// A statement the user may not see is recordFound false.
function statementDetail(p) {
    const scope = access(p)
    const empty = {recordFound: false, statement: {}, lines: [], formFields: []}
    const statement = p.taxStatementId ? one("mantle.other.tax.TaxStatement", {taxStatementId: p.taxStatementId}) : null
    const timePeriod = statement?.timePeriodId
        ? one("mantle.party.time.TimePeriod", {timePeriodId: statement.timePeriodId})
        : null
    if (!statement || !timePeriod || !scope.allowedOrganizationPartyIds.includes(timePeriod.partyId)) return empty
    const header = statementRows([statement])[0]
    const currencyUomId = policy.preference(timePeriod.partyId).baseCurrencyUomId
    header.currencyUomId = currencyUomId
    header.reportedLabel = statement.formId === vendorForm ? "Payments reported" : "Taxable sales"
    header.captionText = [header.authorityName, header.partyName, header.createdDateText ? "made " + header.createdDateText : ""]
        .filter(Boolean)
        .join(" · ")
    let lines = [],
        formFields = []
    if (statement.formId === salesTaxForm) {
        const found = policy.call("mantle.other.TaxServices.find#SalesTaxLines", {taxStatementId: statement.taxStatementId})
        lines = Array.from(found.lines || []).map(line => Object.assign({}, line, {currencyUomId}))
        header.currentTaxAmount = found.taxAmount
        header.changedSince = statement.taxAmount != null && !toDecimal(found.taxAmount).eq(toDecimal(statement.taxAmount))
    }
    if (statement.formResponseId) {
        const response = policy.call("org.moqui.impl.ScreenServices.get#FormResponse", {formResponseId: statement.formResponseId})
        const answers = response.responseMap || {}
        formFields = Array.from(response.dbFormFieldList || []).map(field => {
            const value = answers[field.fieldName] == null ? "" : String(answers[field.fieldName])
            return {title: field.title, value: taxpayerNumberFields.includes(field.fieldName) ? masked(value) : value}
        })
    }
    header.canExport = !!scope.capabilities.taxEdit && [salesTaxForm, vendorForm].includes(statement.formId)
    header.canDelete = !!scope.capabilities.taxEdit && !statement.exportedDate
    return {recordFound: true, statement: header, lines, formFields, organizationPartyId: timePeriod.partyId}
}

const operations = {authorities, rates, statements, statementDetail}
;({
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown tax screen operation " + op)
        return operations[op](parameters)
    }
})
