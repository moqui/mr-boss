// Admin's export and backup projections, ironstone.admin.DataServices (design-admin §11 Exports, DataExport and Backups;
// impl-admin P16): what Admin › Data's Exports and DataExport show and post. The work is the framework's
// org.moqui.admin.DataTransferServices, which exports only a registered target, calls its owner as the user and leaves out a
// field the user may not read; nothing here runs with authorization off, and nothing here adds a field, an option or a right
// a registration does not have. What these add is BOSS's own: the owners' places as routes (a registration names a key, never
// a URL) and the wizard's form values. The backups screen reads the framework's org.moqui.admin.BackupServices itself.
const T = "org.moqui.admin.DataTransferServices."
const text = value => String(value ?? "").trim()
function call(name, parameters = {}) {
    const out = ec.service.sync().name(name).parameters(parameters).call() || {}
    if (ec.message.hasError()) throw new Error(ec.message.getErrorsString())
    return out
}
// The owners' own places for an export (a registration's ownerRoute is one of these keys), under /qapps.
const ownerRoutes = {
    adminLocalization: "Admin/Settings/Localization",
    commonsContacts: "Commons/Contacts/List",
    insightsDatasets: "Insights/ReportBuilder/Datasets",
    insightsReports: "Insights/Reports",
    accountingTaxStatements: "Accounting/Tax/TaxStatements",
    accountingInvoiceBatch: "Accounting/Receivables/InvoiceBatch",
    projectsWorkItems: "Projects/WorkItems/List"
}
const ownerUrl = ownerRoute => (Object.hasOwn(ownerRoutes, text(ownerRoute)) ? "/qapps/" + ownerRoutes[ownerRoute] : "")
// Admin's mount: the transfer capabilities of the user, as the import wizard's.
function mount() {
    const admin = call("ironstone.admin.ContextServices.get#SharedContext", {appRoot: "Admin"})
    if (!admin.capabilities?.transferView && !admin.capabilities?.transferRun) throw new Error("ADMIN_TRANSFER_VIEW is required")
    return {canRun: !!admin.capabilities.transferRun, canView: !!admin.capabilities.transferView}
}
// The option slots a wizard form shows (three: no registered target has more; a further option keeps its default).
const optionSlots = 3
// The selection a request carries, by the target's registered options: option1 to option3 are their values in order.
function selectionOf(target, p) {
    const selection = {}
    Array.from(target.optionList || [])
        .slice(0, optionSlots)
        .forEach((option, index) => {
            const value = p["option" + (index + 1)]
            if (value != null && value !== "") selection[option.name] = String(value)
        })
    return selection
}
const fieldNames = value =>
    (value == null || value === ""
        ? []
        : Array.isArray(value) || value.toArray
          ? Array.from(value.toArray ? value.toArray() : value)
          : [value]
    )
        .flatMap(found => String(found).split(","))
        .map(text)
        .filter(Boolean)

// find#ExportRuns: Admin's Exports: the exports made and the deliveries of scheduled reports and alerts as status, and the
// registered export targets, each with its owner's place as a link.
function runs(p) {
    const mounted = mount()
    const targets = call(T + "find#ExportTargets")
    const found = call(T + "find#Transfers", {
        direction: "export",
        kind: text(p.kind) || null,
        targetId: text(p.targetId) || null,
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
                countText:
                    run.kind === "export"
                        ? [
                              run.rowCount != null ? run.rowCount + " rows" : null,
                              run.fieldCount ? run.fieldCount + " fields" : null
                          ]
                              .filter(Boolean)
                              .join(" · ")
                        : [
                              run.recipientCount != null ? run.recipientCount + " recipients" : null,
                              run.sentCount + " sent",
                              run.failedCount ? run.failedCount + " failed" : null,
                              run.uncertainCount ? run.uncertainCount + " unknown" : null,
                              run.skippedCount ? run.skippedCount + " skipped" : null
                          ]
                              .filter(Boolean)
                              .join(" · ")
            })
        )
    })
}

// get#ExportContext: the export wizard's state for a request: the targets exported here, the chosen target's scopes,
// options and fields as the framework answers them for this user, and, when asked, the preview.
function context(p) {
    const mounted = mount()
    const targets = Array.from(call(T + "find#ExportTargets").targetList || []).map(target =>
        Object.assign({}, target, {ownerUrl: ownerUrl(target.ownerRoute)})
    )
    const out = {
        canRun: mounted.canRun,
        targetOptions: targets.filter(target => target.exportHere).map(target => ({value: target.targetId, label: target.title})),
        elsewhereList: targets.filter(target => !target.exportHere),
        hasTarget: false,
        exportTarget: null,
        scopeOptions: [],
        slotList: [],
        fieldOptions: [],
        deniedFieldText: "",
        selectedFields: [],
        preview: null,
        previewRefusal: null,
        operationKey: null
    }
    const targetId = text(p.targetId)
    if (!targetId) return out
    // an id that is no export target exported here is no target: the list is the catalog
    if (!out.targetOptions.some(option => option.value === targetId)) return out
    const target = call(T + "get#ExportFields", {targetId}).target || {}
    const selection = selectionOf(target, p)
    const fields = Array.from(target.fieldList || [])
    const asked = fieldNames(p.fields)
    Object.assign(out, {
        hasTarget: true,
        exportTarget: target,
        scopeOptions: Array.from(target.scopeList || []).map(scope => ({value: scope.scopeKey, label: scope.title})),
        slotList: Array.from(target.optionList || [])
            .slice(0, optionSlots)
            .map((option, index) => ({
                slot: index + 1,
                label: option.label,
                isChoice: option.type === "option",
                choices: Array.from(option.options || []).map(choice => ({
                    value: choice.value,
                    label: choice.label || choice.value
                })),
                value: selection[option.name] ?? option.defaultValue ?? ""
            })),
        fieldOptions: fields
            .filter(field => field.allowed)
            .map(field => ({value: field.name, label: field.label + (field.required ? " (always)" : "")})),
        deniedFieldText: fields
            .filter(field => !field.allowed)
            .map(field => field.label)
            .join(", "),
        selectedFields: asked.length
            ? fields.filter(field => field.allowed && (field.required || asked.includes(field.name))).map(field => field.name)
            : fields.filter(field => field.selected).map(field => field.name)
    })
    if (!(p.review === true || p.review === "true") || !target.exportAllowed || !mounted.canRun) return out
    const preview = call(T + "preview#Export", {
        targetId,
        scopeKey: text(p.scopeKey) || null,
        selection,
        // only names the form offered: a field this user may not read is not asked for
        fieldList: out.selectedFields
    })
    if (preview.refused) out.previewRefusal = preview.reason
    else {
        out.preview = preview
        // one key for this review: a second press of Export makes the file again and keeps no second record
        out.operationKey = "x-" + ec.user.randomString(24)
    }
    return out
}

// run#AdminExport: the export of a wizard's request: the registered target's file for this user, or the reason it was refused.
function exportFile(p) {
    const mounted = mount()
    // the mount's own rule, besides the target's and its owner's: under Admin an export is run with ADMIN_TRANSFER_RUN
    if (!mounted.canRun) throw new Error("ADMIN_TRANSFER_RUN is required")
    const targetId = text(p.targetId)
    const target = call(T + "get#ExportFields", {targetId}).target || {}
    return call(T + "run#Export", {
        targetId,
        scopeKey: text(p.scopeKey) || null,
        selection: selectionOf(target, p),
        fieldList: fieldNames(p.fields),
        operationKey: text(p.operationKey) || null
    })
}

const operations = {runs, context, exportFile}
;({
    execute: (op, parameters) => {
        if (!Object.hasOwn(operations, op)) throw new Error("Unknown Admin data operation " + op)
        return operations[op](parameters)
    }
})
