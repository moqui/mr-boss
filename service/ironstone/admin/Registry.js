// Admin's part of the readiness registry (impl-admin P2; design-admin §3, §10, §14; mr-moqui plans/Admin-Screens-Down.md A6).
// The registries are the framework's (moqui.server ReadinessProvider, RefreshOperation and SettingsEntry, read by
// org.moqui.admin.ReadinessServices, which calls each registered service as the viewer and holds the framework's own checks).
// What stays here is BOSS's:
//
// check#OwnerReadiness: the readiness contract over the owners whose services keep their own shapes (Accounting's setup,
// Products' catalog checks, Commerce's stores, Mantle's organization Constitution), by the provider key its registration
// names. It answers for the organizations the viewer administers (Admin's scope: none for a caller without the Admin root),
// one of them when the request names it (refused outside the scope, RECORD_UNAVAILABLE, which leaves the provider out), each
// check with the organization as its subject and scope. An organization the owner refuses the viewer is left out; one that
// fails is shown unavailable, by name, and the others go on. Accounting's and Products' registrations name no permission:
// the adapter asks it as the owners read theirs (an instance administrator holds every one, a client contact none).
//
// get#OpenPaths: which of the places a registration's key resolves to under Admin's mount open to the viewer's own groups
// (Admin.js destinationOpens), for the links Admin's own screens show (template/AdminRegistry.js): a fix link, a card's link
// and Health's link are shown only where they open.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const {find, one, rows, denied} = lib
const admin = ec.resource.script("component://mr-boss/service/ironstone/admin/Admin.js")

// the refusals an owner answers for an organization or a record the viewer may not read, as its reason codes or wording
const refusalCodes = ["PERMISSION_DENIED", "ORGANIZATION_DENIED", "ACCESS_DENIED", "RECORD_UNAVAILABLE", "STORE_UNAVAILABLE"]
const refusalText = /authority is required|is not available|may not read|is not authorized/
// a registration's permission as the owners read theirs (ProductAccess.has): an instance administrator (ADMIN) holds every one
const has = permission => !permission || lib.access.has(permission)
const isRefusal = error => refusalCodes.includes(lib.reasonCode(error)) || refusalText.test(String(error?.message || ""))
const requirePermission = permission => {
    if (!has(permission)) denied("PERMISSION_DENIED", permission + " is required")
}

// An owner's service as the viewer, in its own transaction and error frame: its own checks apply, and a failure is an error
// the caller names, not a rollback of the page.
function ownerCall(serviceName, parameters) {
    ec.message.pushErrors()
    try {
        const result = ec.service.sync().name(serviceName).parameters(parameters).requireNewTransaction(true).call() || {}
        if (ec.message.hasError()) throw new Error(ec.message.getErrorsString())
        return result
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
}

// ===== scope =====
// The organizations a readiness read covers: the one asked for, refused unless the viewer administers it, else every one the
// viewer administers (an Admin user's scope; none for a caller without the Admin root, whose organization providers answer
// nothing).
function organizationsOf(userScope, organizationPartyId) {
    if (organizationPartyId) {
        if (
            !admin.administers(userScope, organizationPartyId) ||
            !one("mantle.party.PartyRole", {partyId: organizationPartyId, roleTypeId: "OrgInternal"})
        )
            denied("RECORD_UNAVAILABLE", "Organization " + organizationPartyId + " is not available")
        return [organizationPartyId]
    }
    if (userScope.ownerIds) return userScope.ownerIds
    return rows("mantle.party.PartyRole", {roleTypeId: "OrgInternal"}).map(row => row.partyId)
}
function organizationName(partyId) {
    const organization = partyId ? one("mantle.party.Organization", {partyId}) : null
    return organization?.organizationName || partyId || ""
}

// ===== checks =====
function check(checkKey, title, state, reasonCode, message, extra = {}) {
    return Object.assign({checkKey, title, state, reasonCode: reasonCode || null, message}, extra)
}
const ready = (checkKey, title, message, extra) => check(checkKey, title, "ready", null, message, extra)
// Each organization's checks of an organization-scoped provider: an organization the owner refuses the viewer is left out; one
// that fails is shown unavailable, by name, and the others go on.
function perOrganization(run, provider, checksOf) {
    const found = []
    for (const organizationPartyId of run.organizationIds) {
        const subject = organizationName(organizationPartyId)
        try {
            for (const row of checksOf(organizationPartyId)) found.push(Object.assign({subject, scope: {organizationPartyId}}, row))
        } catch (error) {
            if (isRefusal(error)) continue
            ec.logger.error(
                "Readiness provider " + provider.providerKey + " for " + organizationPartyId + " failed: " + error.message
            )
            found.push(
                check(
                    provider.providerKey,
                    provider.title,
                    "unavailable",
                    "PROVIDER_FAILED",
                    provider.title + " could not be checked",
                    {subject, scope: {organizationPartyId}}
                )
            )
        }
    }
    return found
}

// ===== adapters =====
// How each owner's service is called and its answer read, by the provider key a registration names; each answers the
// framework's readiness contract: checks [{checkKey, title, state: ready, warning, failed or unavailable, reasonCode,
// message, subject, scope, fixRoute, fixId, fixParameters}], a fix place as a key Admin's mount resolves.
const titles = {
    "accounting.setup": "Accounting setup",
    "products.catalogChecks": "Catalog quality",
    "commerce.storeReadiness": "Store readiness",
    "constitution.organization": "Organization Constitution"
}
const accountingCodes = {PREFERENCES: "Accounting preferences", PERIODS: "Fiscal periods", CHART: "Chart of accounts"}
const adapters = {
    // Accounting's setup readiness for finance readers (impl-admin F16): its findings, and where setup stands
    "accounting.setup": (provider, run) => {
        requirePermission("ACCOUNTING_VIEW")
        return perOrganization(run, provider, organizationPartyId => {
            const out = ownerCall("mantle.ledger.SetupServices.get#Readiness", {organizationPartyId})
            const findings = Array.from(out.findings || [])
            if (out.setupStatus === "unconfigured")
                return [
                    check("accounting.setup", "Accounting setup", "warning", "SETUP_UNCONFIGURED", "Accounting is not set up")
                ]
            if (findings.length)
                return findings.map(finding =>
                    check(
                        "accounting." + String(finding.code).toLowerCase(),
                        accountingCodes[finding.code] || "Accounting setup",
                        "failed",
                        finding.code,
                        finding.message
                    )
                )
            return out.setupStatus === "inSetup"
                ? [
                      check(
                          "accounting.setup",
                          "Accounting setup",
                          "warning",
                          "SETUP_NOT_ACTIVATED",
                          "Accounting setup is not activated yet"
                      )
                  ]
                : [ready("accounting.setup", "Accounting setup", "Accounting setup is complete")]
        })
    },
    // Products' catalog checks (CatalogChecks; impl-admin F16): the counts, not the products
    "products.catalogChecks": (provider, run) => {
        requirePermission("PRODUCT_CATALOG_VIEW")
        return perOrganization(run, provider, organizationPartyId => {
            const out = ownerCall("mantle.product.CatalogCheckServices.validate#Catalog", {organizationPartyId})
            const issues = Array.from(out.issueRows || [])
            const checked = Number(out.checkedCount || 0)
            if (out.valid || !issues.length)
                return [ready("products.catalog", "Catalog quality", checked + " products checked, no issue")]
            const failing = issues.some(row => row.severity === "error")
            return [
                check(
                    "products.catalog",
                    "Catalog quality",
                    failing ? "failed" : "warning",
                    "CATALOG_ISSUES",
                    issues.length + " catalog issues in " + checked + " products checked"
                )
            ]
        })
    },
    // Commerce's store readiness (impl-commerce §7): each store of the organizations the viewer administers. A Commerce reader
    // (COMMERCE_VIEW in the store's organization) gets the findings with their messages; an administrative reader the store's
    // summary Commerce answers without messages (its PASS readiness shape), so it sees a store it does not open
    "commerce.storeReadiness": (provider, run) => {
        const storeService = "mantle.product.StoreAdminServices.check#StoreReadiness"
        const found = []
        if (!run.organizationIds.length) return found
        const stores = find("mantle.product.store.ProductStore").condition("organizationPartyId", "in", run.organizationIds)
        for (const store of Array.from(stores.orderBy("storeName").limit(50).list())) {
            const storeId = store.productStoreId
            const extra = {
                subject: store.storeName || storeId,
                scope: {organizationPartyId: store.organizationPartyId},
                fixRoute: "commerceStore",
                fixId: storeId
            }
            try {
                let findings = null
                if (has("COMMERCE_VIEW")) {
                    try {
                        findings = Array.from(ownerCall(storeService, {productStoreId: storeId}).findings || [])
                    } catch (error) {
                        if (!isRefusal(error)) throw error
                    }
                }
                if (findings) {
                    const open = findings.filter(row => !row.ready)
                    if (!open.length) found.push(ready("commerce.store", "Store readiness", "The store is ready", extra))
                    for (const row of open)
                        found.push(
                            check(
                                "commerce.store." + row.key,
                                row.label || "Store readiness",
                                row.severity === "warning" ? "warning" : "failed",
                                "STORE_" + String(row.key).toUpperCase(),
                                row.message || "Not ready",
                                extra
                            )
                        )
                } else {
                    const result = ownerCall(storeService, {input: {targetId: storeId}}).result || {}
                    const open = Array.from(result.checks || [])
                        .filter(row => !row.ready)
                        .map(row => row.name)
                    found.push(
                        open.length
                            ? check(
                                  "commerce.store",
                                  "Store readiness",
                                  "failed",
                                  "STORE_NOT_READY",
                                  "Not ready: " + open.join(", "),
                                  extra
                              )
                            : ready("commerce.store", "Store readiness", "The store is ready", extra)
                    )
                }
            } catch (error) {
                ec.logger.error(
                    "Readiness provider " + provider.providerKey + " for store " + storeId + " failed: " + error.message
                )
                found.push(
                    check(
                        "commerce.store",
                        provider.title,
                        "unavailable",
                        "PROVIDER_FAILED",
                        provider.title + " could not be checked",
                        extra
                    )
                )
            }
        }
        return found
    },
    // Mantle's organization Constitution: whether its own document is valid; its fix is Admin › Settings › Constitution in that
    // organization's scope (P7), shown when the viewer opens it. Mantle reads it for an organization the call's organization filters
    // find (impl-admin §4, F52 and F-P7-3 settled), so under an Admin screen's grant every organization the viewer administers
    "constitution.organization": (provider, run) =>
        perOrganization(run, provider, organizationPartyId => {
            const out = ownerCall("mantle.party.ConstitutionServices.get#OrganizationConstitution", {organizationPartyId})
            if (out.customized && out.contentHash === "invalid")
                return [
                    check(
                        "constitution.organization",
                        "Organization Constitution",
                        "failed",
                        "CONSTITUTION_INVALID",
                        "Its own Constitution is not valid",
                        {fixRoute: "adminConstitution", fixParameters: {scope: organizationPartyId}}
                    )
                ]
            return [
                ready(
                    "constitution.organization",
                    "Organization Constitution",
                    out.customized ? "Its own Constitution applies" : "The instance Constitution applies"
                )
            ]
        })
}
// check#OwnerReadiness: one of the adapters above, by its registration's key
function ownerReadiness(p) {
    if (!Object.hasOwn(adapters, p.providerKey)) throw new Error("Unknown owner readiness " + p.providerKey)
    const userScope = admin.scope()
    const run = {organizationIds: organizationsOf(userScope, p.organizationPartyId), userScope}
    return {checks: adapters[p.providerKey]({providerKey: p.providerKey, title: titles[p.providerKey]}, run)}
}

// get#OpenPaths: for each path under /qapps (with or without a query), whether it opens to the viewer's own groups
function openPaths(p) {
    const userScope = admin.scope()
    return {open: Array.from(p.paths || []).map(path => !!path && admin.destinationOpens(userScope.grants, String(path)))}
}

const operations = {ownerReadiness, openPaths}
;({
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Admin registry operation " + op)
        return operations[op](parameters)
    }
})
