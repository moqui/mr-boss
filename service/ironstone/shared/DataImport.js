// The import wizard's projections, ironstone.shared.DataImportServices (design-admin §11.1 and DataImport; impl-admin P15,
// F12): what Shared/DataImport shows and posts for any registered import target, generalized from Products' catalog import.
// The work is the framework's org.moqui.admin.DataTransferServices, which dispatches by the target's registration and calls
// its owner as the user; nothing here runs with authorization off, and a mount adds no field or right the target does not
// have.
//
// A mount is the app the wizard is opened under (the root sets appRoot, never the request). Under a catalog app (Products)
// the target is the catalog and nothing else, with the app's own catalog context; under Admin it is the target the request
// names, for a holder of ADMIN_TRANSFER_RUN (ADMIN_TRANSFER_VIEW reads an import there). Any other root is refused.
const T = "org.moqui.admin.DataTransferServices."
const text = value => String(value ?? "").trim()
function call(name, parameters = {}) {
    const out = ec.service.sync().name(name).parameters(parameters).call() || {}
    if (ec.message.hasError()) throw new Error(ec.message.getErrorsString())
    return out
}
// The owners' own places for an import (a registration's ownerRoute is one of these keys, never a URL), under /qapps.
const ownerRoutes = {
    productsImport: "Products/ProductImport",
    adminInvitations: "Admin/Users/Invitations",
    adminLocalization: "Admin/Settings/Localization",
    commerceChannelImport: "Commerce/Integrations/ChannelImport",
    accountingStatementImport: "Accounting/Banking/StatementImport",
    accountingOpenItems: "Accounting/Settings/Setup/OpenItems",
    commonsContactImport: "Commons/Contacts/Import",
    projectsWorkItemImport: "Projects/WorkItems/Import"
}
function ownerUrl(ownerRoute, parameters = {}) {
    if (!Object.hasOwn(ownerRoutes, text(ownerRoute))) return ""
    const query = Object.entries(parameters || {})
        .filter(([name, value]) => /^[A-Za-z][A-Za-z0-9]*$/.test(name) && value != null && value !== "")
        .map(([name, value]) => encodeURIComponent(name) + "=" + encodeURIComponent(String(value)))
        .join("&")
    return "/qapps/" + ownerRoutes[ownerRoute] + (query ? "?" + query : "")
}

// ===== the mount =====
function mount(p) {
    const appRoot = text(p.appRoot)
    if (appRoot === "Admin") {
        const admin = call("ironstone.admin.ContextServices.get#SharedContext", {appRoot})
        if (!admin.capabilities?.transferView && !admin.capabilities?.transferRun)
            throw new Error("ADMIN_TRANSFER_VIEW is required")
        return {
            appRoot,
            targetId: text(p.targetId),
            canRun: !!admin.capabilities.transferRun,
            downloadBase: "/apps/Admin/Data/DataImport",
            selfLink: admin.sharedLinks["Data/DataImport"],
            listLink: admin.sharedLinks["Data/Imports"],
            detailLink: admin.sharedLinks["Data/ImportDetail"],
            activeOrganizationPartyId: admin.activeOrganizationPartyId || null
        }
    }
    // a catalog app's mount: the catalog target only, whatever the request names
    const catalog = call("ironstone.products.CatalogServices.get#SharedContext", {appRoot})
    if (!catalog.capabilities?.read) throw new Error("Catalog read access is required")
    return {
        appRoot: catalog.appRoot,
        targetId: "catalog",
        canRun: true,
        downloadBase: catalog.printBase + "/ProductImport/Index",
        selfLink: catalog.sharedLinks["ProductImport"],
        listLink: null,
        detailLink: null,
        activeOrganizationPartyId: catalog.activeOrganizationPartyId || catalog.organizationPartyIds?.[0] || null
    }
}
// The organizations an import may be for: the target's own scopes where it has them; the catalog's owners for the catalog.
function scopeOptions(target) {
    if (target.scoped) return Array.from(target.scopeList || []).map(scope => ({value: scope.scopeKey, label: scope.title}))
    // the catalog's owners, for a user its owner gives a kind to (asking without catalog authority is an error)
    if (target.targetId !== "catalog" || target.importAllowed !== true) return []
    try {
        return Array.from(
            call("ironstone.products.CatalogServices.get#CatalogOptions", {optionNames: ["owners"]}).options?.owners || []
        )
    } catch (error) {
        ec.message.clearErrors()
        return []
    }
}

// ===== get#ImportContext =====
function context(p) {
    const mounted = mount(p)
    const out = {
        appRoot: mounted.appRoot,
        targetId: mounted.targetId,
        importMount: mounted,
        hasTarget: false,
        operationKey: text(p.operationKey) || null,
        canStage: false,
        hasImport: false,
        importRows: [],
        mappingRows: [],
        targetOptions: [],
        clearOptions: [],
        previewRows: [],
        optionRows: [],
        valueMappingRows: [],
        defaultRows: [],
        kindOptions: [],
        ownerOptions: []
    }
    if (!mounted.targetId) return out
    const target = call(T + "get#ImportTarget", {
        targetId: mounted.targetId,
        organizationPartyId: text(p.organizationPartyId) || null
    }).target
    if (target.targetMode === "wizard")
        return Object.assign(out, {importTarget: target, ownerUrl: ownerUrl(target.ownerRoute), wizardElsewhere: true})
    const ownerOptions = scopeOptions(target)
    Object.assign(out, {
        hasTarget: true,
        importTarget: target,
        features: target.features,
        kindOptions: target.kindOptions,
        ownerOptions,
        canStage: mounted.canRun && target.importAllowed === true,
        hasImport: !!out.operationKey,
        maxKiB: target.maxBytes ? Math.floor(target.maxBytes / 1024) : 2048,
        maxRows: target.maxRows || 5000,
        fieldNames: Array.from(target.columnList || [])
            .map(column => column.label + (column.required ? " (required)" : ""))
            .join(", "),
        uploadForm: {
            organizationPartyId:
                text(p.organizationPartyId) ||
                (ownerOptions.some(option => option.value === mounted.activeOrganizationPartyId)
                    ? mounted.activeOrganizationPartyId
                    : ownerOptions[0]?.value) ||
                null,
            kindId: text(p.kindId) || target.kindOptions[0]?.value || null,
            delimiter: ",",
            updateMode: "upsert",
            forceNew: "false"
        }
    })
    if (!out.operationKey) return out
    const found = call(T + "get#Transfer", {
        targetId: mounted.targetId,
        operationKey: out.operationKey,
        pageIndex: p.pageIndex,
        errorsOnly: p.errorsOnly === true
    })
    // the server's time zone, in which Imports and ImportDetail show an import's times
    Object.assign(out, found, {targetId: mounted.targetId, timeZone: text(System.getProperty("default_time_zone")) || "UTC"})
    const columns = Array.from(found.columns || [])
    const labelOf = name => columns.find(column => column.name === name)?.label || name
    out.organizationName =
        ownerOptions.find(option => option.value === found.organizationPartyId)?.label || found.organizationPartyId || ""
    out.canEdit = mounted.canRun && found.canEdit === true
    out.mappingRows = Array.from(found.headers || []).map(sourceColumn => ({
        sourceColumn,
        targetField: found.mapping?.[sourceColumn] || "",
        mappingRevision: found.mappingRevision,
        operationKey: out.operationKey
    }))
    out.targetOptions = columns.map(column => ({value: column.name, label: column.label}))
    out.clearOptions = columns
        .filter(column => Array.from(target.clearableFields || []).includes(column.name))
        .map(column => ({value: column.name, label: column.label}))
    out.formatForm = {
        operationKey: out.operationKey,
        mappingRevision: found.mappingRevision,
        updateMode: found.updateMode,
        dateFormat: found.dateFormat,
        decimalSeparator: found.numberFormat?.decimal,
        groupSeparator: found.numberFormat?.group,
        clearFields: found.clearFields
    }
    for (const [field, values] of Object.entries(found.valueMappings || {}))
        for (const [sourceValue, targetValue] of Object.entries(values || {}))
            out.valueMappingRows.push({field: labelOf(field), sourceValue, targetValue})
    out.defaultRows = Object.entries(found.defaults || {}).map(([field, value]) => ({field: labelOf(field), value}))
    // the batch's options, each as the target registers it
    out.optionRows = Array.from(target.optionList || []).map(option => ({
        operationKey: out.operationKey,
        mappingRevision: found.mappingRevision,
        optionName: option.name,
        optionLabel: option.label,
        optionValue: found.batchOptions?.[option.name] ?? "",
        optionHint:
            option.type === "integer"
                ? "A whole number" + (option.min != null && option.max != null ? " from " + option.min + " to " + option.max : "")
                : option.type === "option"
                  ? "One of: " +
                    Array.from(option.options || [])
                        .map(choice => choice.value + " (" + choice.label + ")")
                        .join(", ")
                  : "Text, at most " + option.maxLength + " characters"
    }))
    out.previewRows = Array.from(found.importRows || []).map(row =>
        Object.assign({}, row, {
            sourceText: Object.entries(row.sourceValues || {})
                .map(([name, value]) => name + ": " + value)
                .join("; "),
            proposedText: columns
                .filter(column => row.values && Object.hasOwn(row.values, column.name))
                .map(column => column.label + ": " + (row.values[column.name] ?? "(clear)"))
                .join("; "),
            changeText: Array.from(row.changes || [])
                .filter(change => columns.some(column => column.name === change.field))
                .map(change => labelOf(change.field) + ": " + (change.before ?? "(empty)") + " → " + (change.after ?? "(clear)"))
                .join("; "),
            warningText: Array.from(row.warnings || []).join("; ")
        })
    )
    out.failedCount =
        found.failedCount ?? Array.from(found.importRows || []).filter(row => ["failed", "stale"].includes(row.result)).length
    return out
}

// ===== map#Import =====
// One change of the mapping form: a column's field, a default, a value mapping, the formats, or a batch option. The current
// mapping is read from the import, changed and saved at the revision the form read.
function mapping(p) {
    const mounted = mount(p)
    if (!mounted.targetId) throw new Error("Choose an import target")
    const targetId = mounted.targetId
    const current = call(T + "get#Transfer", {targetId, operationKey: p.operationKey})
    const own = (object, name) => Object.hasOwn(object || {}, name)
    const fields = Array.from(current.columns || []).map(column => column.name)
    const parameters = {targetId, operationKey: p.operationKey, mappingRevision: p.mappingRevision}
    const field = text(p.targetField)
    if (p.mappingAction === "column") {
        if (!Array.from(current.headers || []).includes(p.sourceColumn)) throw new Error("Choose a source column")
        parameters.mapping = Object.assign({}, current.mapping, {[p.sourceColumn]: field || null})
    } else if (p.mappingAction === "default") {
        if (!fields.includes(field)) throw new Error("Choose a field of this import")
        parameters.defaults = Object.assign({}, current.defaults)
        if (p.removeValue) delete parameters.defaults[field]
        else parameters.defaults[field] = p.defaultValue
    } else if (p.mappingAction === "value") {
        if (!fields.includes(field)) throw new Error("Choose a field of this import")
        parameters.valueMappings = Object.fromEntries(
            Object.entries(current.valueMappings || {}).map(([name, values]) => [name, Object.assign({}, values)])
        )
        const values = own(parameters.valueMappings, field) ? parameters.valueMappings[field] : {}
        if (p.removeValue) delete values[p.sourceValue]
        else values[p.sourceValue] = p.targetValue
        parameters.valueMappings[field] = values
    } else if (p.mappingAction === "formats") {
        parameters.updateMode = p.updateMode
        parameters.dateFormat = p.dateFormat
        parameters.numberFormat = {decimal: p.decimalSeparator, group: p.groupSeparator || ""}
        parameters.clearFields = Array.isArray(p.clearFields)
            ? p.clearFields
            : String(p.clearFields || "")
                  .split(/[\s,]+/)
                  .filter(Boolean)
    } else if (p.mappingAction === "option") {
        const name = text(p.optionName)
        if (!/^[A-Za-z][A-Za-z0-9]*$/.test(name)) throw new Error("Choose an option of this import")
        parameters.batchOptions = Object.assign({}, current.batchOptions, {[name]: p.optionValue ?? ""})
    } else throw new Error("Choose a mapping action")
    return call(T + "configure#Import", parameters)
}

// ===== find#ImportRuns =====
// Admin's Imports: the runs of every target the user may view and the targets an import may start from, each with its
// owner's place as a link. Summaries from the framework's find#Transfers; nothing of a row.
function runs(p) {
    const mounted = mount(Object.assign({}, p, {appRoot: "Admin"}))
    const targets = call(T + "find#ImportTargets")
    const found = call(T + "find#Transfers", {
        targetId: text(p.targetId) || null,
        scopeKey: text(p.organizationPartyId) || null,
        state: text(p.state) || null,
        fromDate: p.fromDate || null,
        thruDate: p.thruDate || null,
        pageIndex: p.pageIndex || 0,
        pageSize: 50
    })
    return Object.assign({}, found, {
        canRun: mounted.canRun,
        targetList: Array.from(targets.targetList || []).map(target =>
            Object.assign({}, target, {ownerUrl: ownerUrl(target.ownerRoute)})
        ),
        transferList: Array.from(found.transferList || []).map(run =>
            Object.assign({}, run, {
                ownerUrl: run.detail ? "" : ownerUrl(run.ownerRoute, run.ownerParameters),
                countText: [
                    run.rowCount != null ? run.rowCount + " rows" : null,
                    run.appliedCount != null ? run.appliedCount + " applied" : null,
                    run.errorCount ? run.errorCount + " need attention" : null,
                    run.skippedCount ? run.skippedCount + " skipped" : null
                ]
                    .filter(Boolean)
                    .join(" · ")
            })
        )
    })
}

const operations = {context, mapping, runs, mount: p => ({importMount: mount(p)})}
;({
    ownerUrl,
    execute: (op, parameters) => {
        if (!Object.hasOwn(operations, op)) throw new Error("Unknown import operation " + op)
        return operations[op](parameters)
    }
})
