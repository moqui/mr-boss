// The Manufacturing method lists (impl-manufacturing P2, design §5): BillsOfMaterials, Routings and OperationTemplates. Each
// checks the user's Manufacturing scope (Manufacturing.js) and then reads Mantle's method verbs, which check METHOD_VIEW and
// the organization again; this adds the rows' display text, the page and the drop-down options. Writes are the screens'
// calls of the Mantle verbs (store#Bom, clone#Bom, import#BomCsv, store#Routing, import#RoutingCsv, store#OperationTemplate,
// store#OperationInstruction), after the same check.
const manufacturing = ec.resource.script("component://mr-boss/service/ironstone/manufacturing/Manufacturing.js")
const lib = ec.resource.script("component://mr-boss/service/ironstone/products/ProductsLib.js")
const {rowsIn, dateText, page} = lib
const call = (name, parameters) => {
    const out = ec.service.sync().name(name).parameters(parameters).call() || {}
    if (ec.message.hasError()) throw new Error(ec.message.getErrorsString())
    return out
}

// The organization a list is of: the one asked for when it is the user's, else their active one, else their first.
function organization(userScope, p) {
    const ids = userScope.organizationPartyIds
    if (p.organizationPartyId && (ids.includes(p.organizationPartyId) || !userScope.ownerIds)) return p.organizationPartyId
    return userScope.activeOrganizationPartyId || ids[0] || null
}
function organizationOptions(userScope) {
    return rowsIn("mantle.party.Organization", "partyId", userScope.organizationPartyIds).map(row => ({
        value: row.partyId,
        label: row.organizationName || row.partyId
    }))
}
// The units a method form offers: the quantity and time units of the organization's methods and the usual ones, by name.
function unitOptions(extra = []) {
    const units = rowsIn("moqui.basic.Uom", "uomId", ["OTH_ea", "TF_hr", "TF_min", "TF_s", "LEN_m", "WT_kg", ...extra])
    return units
        .map(row => ({value: row.uomId, label: row.description || row.uomId, type: row.uomTypeEnumId}))
        .sort((a, b) => a.label.localeCompare(b.label))
}
function pageFields(name, paged) {
    const maxIndex = Math.max(0, Math.ceil(paged.count / paged.pageSize) - 1)
    return {
        [name + "Count"]: paged.count,
        [name + "PageIndex"]: paged.pageIndex,
        [name + "PageSize"]: paged.pageSize,
        [name + "PageMaxIndex"]: maxIndex,
        [name + "PageRangeLow"]: paged.count ? paged.pageIndex * paged.pageSize + 1 : 0,
        [name + "PageRangeHigh"]: Math.min(paged.count, (paged.pageIndex + 1) * paged.pageSize)
    }
}
const state = (text, color) => ({text, color})

// BillsOfMaterials: the organization's methods (find#Boms leaves pick kits out, D15), with their product, release and
// routing as text and a state chip.
function bomList(p) {
    const userScope = manufacturing.required()
    const organizationPartyId = organization(userScope, p)
    const out = {organizationPartyId, organizationOptions: organizationOptions(userScope), unitOptions: unitOptions()}
    if (!organizationPartyId || !userScope.capabilities.methodRead)
        return Object.assign(
            out,
            {bomRows: [], methodMessage: "Method access is required to see BOMs."},
            pageFields("bomRows", page([], p))
        )
    const found = call("mantle.product.BomServices.find#Boms", {organizationPartyId, text: p.text})
    const paged = page(found.bomRows || [], p)
    const products = new Map(
        rowsIn(
            "mantle.product.Product",
            "productId",
            paged.rows.map(row => row.productId)
        ).map(row => [row.productId, row])
    )
    const routings = new Map(
        rowsIn(
            "mantle.work.effort.WorkEffort",
            "workEffortId",
            paged.rows.map(row => row.routingWorkEffortId)
        ).map(row => [row.workEffortId, row.workEffortName || row.workEffortId])
    )
    const units = new Map(
        rowsIn(
            "moqui.basic.Uom",
            "uomId",
            paged.rows.map(row => row.quantityUomId)
        ).map(row => [row.uomId, row.description || row.uomId])
    )
    out.bomRows = paged.rows.map(row => {
        const product = products.get(row.productId)
        return {
            productBomId: row.productBomId,
            productId: row.productId,
            productText: [product?.pseudoId || row.productId, product?.productName].filter(Boolean).join(" · "),
            methodCode: row.methodCode,
            bomName: row.bomName || product?.productName || row.productBomId,
            baseText: String(row.baseQuantity ?? 1) + " " + (units.get(row.quantityUomId) || row.quantityUomId || ""),
            routingText: row.routingWorkEffortId ? routings.get(row.routingWorkEffortId) || row.routingWorkEffortId : "",
            lastReleaseText: row.lastReleaseDate ? dateText(row.lastReleaseDate, "yyyy-MM-dd") : "",
            draftCount: row.draftCount,
            state: row.draftCount
                ? state(row.draftCount + (row.draftCount === 1 ? " draft change" : " draft changes"), "warning")
                : row.lastReleaseDate
                  ? state("Released", "positive")
                  : state("Not released", "grey")
        }
    })
    return Object.assign(out, pageFields("bomRows", paged))
}

// Routings: the organization's routings with their operations, drafts and last release.
function routingList(p) {
    const userScope = manufacturing.required()
    const organizationPartyId = organization(userScope, p)
    const out = {organizationPartyId, organizationOptions: organizationOptions(userScope), unitOptions: unitOptions()}
    if (!organizationPartyId || !userScope.capabilities.methodRead)
        return Object.assign(
            out,
            {routingRows: [], methodMessage: "Method access is required to see routings."},
            pageFields("routingRows", page([], p))
        )
    const found = call("mantle.work.RoutingServices.find#Routings", {organizationPartyId, text: p.text})
    const paged = page(found.routingRows || [], p)
    out.routingRows = paged.rows.map(row => ({
        workEffortId: row.workEffortId,
        workEffortName: row.workEffortName || row.workEffortId,
        description: row.description || "",
        operationCount: row.operationCount,
        draftOperationCount: row.draftOperationCount,
        lastReleaseText: row.lastReleaseDate ? dateText(row.lastReleaseDate, "yyyy-MM-dd") : "",
        state: row.draftOperationCount
            ? state(row.draftOperationCount + (row.draftOperationCount === 1 ? " draft change" : " draft changes"), "warning")
            : row.lastReleaseDate
              ? state("Released", "positive")
              : state("Not released", "grey")
    }))
    return Object.assign(out, pageFields("routingRows", paged))
}

// OperationTemplates: the organization's templates, and the one selected with its instruction history.
function templateList(p) {
    const userScope = manufacturing.required()
    const organizationPartyId = organization(userScope, p)
    const out = {
        organizationPartyId,
        organizationOptions: organizationOptions(userScope),
        unitOptions: unitOptions(),
        timeUnitOptions: unitOptions().filter(unit => unit.type === "UT_TIME_FREQ_MEASURE"),
        templateRows: [],
        selectedTemplate: null,
        instructionRows: []
    }
    if (!organizationPartyId || !userScope.capabilities.methodRead)
        return Object.assign(
            out,
            {methodMessage: "Method access is required to see operation templates."},
            pageFields("templateRows", page([], p))
        )
    const found = call("mantle.work.RoutingServices.find#OperationTemplates", {
        organizationPartyId,
        text: p.text,
        includeArchived: p.includeArchived === "Y" || p.includeArchived === true,
        pageIndex: p.pageIndex,
        pageSize: p.pageSize || 25
    })
    out.methodAccess = {edit: userScope.capabilities.methodEdit}
    const rows = found.templateRows || []
    const centers = new Map(
        rowsIn(
            "mantle.facility.Facility",
            "facilityId",
            rows.map(row => row.methodWorkCenterId)
        ).map(row => [row.facilityId, row.facilityName || row.facilityId])
    )
    const shown = row =>
        Object.assign({}, row, {
            centerText: row.methodWorkCenterId ? centers.get(row.methodWorkCenterId) || row.methodWorkCenterId : "",
            instructionText: row.instruction
                ? (row.instruction.description || "Instruction") +
                  " · from " +
                  dateText(row.instruction.fromDate, "yyyy-MM-dd HH:mm")
                : "",
            state: row.archived
                ? state("Archived", "grey")
                : row.instruction
                  ? state("Published", "positive")
                  : state("No instruction", "warning")
        })
    out.templateRows = rows.map(shown)
    Object.assign(
        out,
        pageFields("templateRows", {
            count: Number(found.templateCount || 0),
            pageIndex: found.pageIndex || 0,
            pageSize: found.pageSize || 25
        })
    )
    if (p.workEffortId) {
        // the selected template: its check, then Mantle's detail of it
        manufacturing.recordOf(userScope, "routing", p.workEffortId)
        const detail = call("mantle.work.RoutingServices.find#OperationTemplates", {workEffortId: p.workEffortId})
        if (detail.template?.methodWorkCenterId && !centers.has(detail.template.methodWorkCenterId)) {
            const center = rowsIn("mantle.facility.Facility", "facilityId", [detail.template.methodWorkCenterId])[0]
            if (center) centers.set(center.facilityId, center.facilityName || center.facilityId)
        }
        out.selectedTemplate = Object.assign(shown(detail.template), {
            expectedRevision: detail.expectedRevision,
            changeReason: ""
        })
        out.instructionRows = (detail.instructionRows || []).map(row =>
            Object.assign({}, row, {
                fromText: dateText(row.fromDate, "yyyy-MM-dd HH:mm"),
                thruText: row.thruDate ? dateText(row.thruDate, "yyyy-MM-dd HH:mm") : "",
                checksumText: String(row.contentChecksum || "").slice(0, 12)
            })
        )
    }
    return out
}

const operations = {bomList, routingList, templateList}
;({
    execute: (op, p) => {
        if (!operations[op]) throw new Error("Unknown Manufacturing method operation " + op)
        return operations[op](p)
    }
})
