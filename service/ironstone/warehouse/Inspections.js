// The Warehouse inspection screens' reads and shapes (impl-warehouse P8, design-warehouse §5, design-crosscut §3.19): the
// Inspections list and board, one inspection for Shared/QualityInspection with what the user may do now, the templates for
// Shared/InspectionTemplates, the choices, the inspections assigned to the user (the Warehouse Today source) and Home's
// inspection queue. Every read runs the app's facility scope (Warehouse.js) and passes the user's facilities to Mantle's
// mantle.product.QualityServices, which checks its permissions; the writes are the Mantle services, called by the screens'
// transitions after AccessServices.check#Record.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const warehouse = ec.resource.script("component://mr-boss/service/ironstone/warehouse/Warehouse.js")
const {find, one, call} = lib

const Q = "mantle.product.QualityServices."
const choiceLimit = 30
const openStatuses = ["QiDraft", "QiSubmitted", "QiVerified"]
const statusColors = {
    QiDraft: "grey-8",
    QiSubmitted: "warning",
    QiVerified: "primary",
    QiDisposed: "positive",
    QiCancelled: "grey",
    QtDraft: "grey-8",
    QtPublished: "positive",
    QtRetired: "grey"
}
const blank = value => value == null || String(value).trim() === ""
const scopeOf = () => warehouse.required(warehouse.scope())
const like = (field, term) =>
    ec.entity.conditionFactory.makeCondition(field, "like", "%" + term.replace(/[\\%_]/g, c => "\\" + c) + "%").ignoreCase()
const anyOf = conditions => ec.entity.conditionFactory.makeCondition(conditions, "or")
// the Inspection area's groups: inspect and quality manager (P1)
const qualityCapable = can => !!(can.inspect || can.qualityVerify || can.qualityDispose || can.qualityTemplateEdit)

function facilityOf(userScope, facilityId) {
    if (blank(facilityId)) return null
    const facility = one("mantle.facility.Facility", {facilityId})
    if (!warehouse.inScope(userScope, facility))
        lib.denied("FACILITY_UNAVAILABLE", "Facility " + facilityId + " is not available")
    return facility
}
const facilityIdsFor = (userScope, facility) => (facility ? [facility.facilityId] : warehouse.facilityIds(userScope))
const shape = row =>
    Object.assign({}, row, {
        statusColor: statusColors[row.statusId] || "grey",
        dueText: row.dueDateText ? row.dueDateText + (row.overdue ? " (overdue)" : "") : "",
        quantityText:
            row.heldQuantity && row.heldQuantity !== "0" ? row.quantity + " (" + row.heldQuantity + " held)" : row.quantity
    })

// ===== Inspections =====
// The inspections of the user's facilities (or the given one), open by default, by status, product, inspector and source;
// with assignedOnly those whose inspector the user is. Empty for a user outside the Inspection area's groups.
function inspectionList(p) {
    const userScope = scopeOf()
    const can = userScope.capabilities
    const facility = facilityOf(userScope, p.facilityId)
    const answer = {canAssign: qualityCapable(can), inspections: [], inspectionsCount: 0}
    if (!qualityCapable(can)) return answer
    const myPartyId = ec.user.userAccount?.partyId || "_NA_"
    const found = call(Q + "find#Inspections", {
        facilityIds: facilityIdsFor(userScope, facility),
        qualityInspectionId: p.qualityInspectionId || null,
        statusId: p.statusId || null,
        openOnly: blank(p.statusId) && p.openOnly !== "N",
        productId: p.productId || null,
        inspectorPartyId: p.assignedOnly === "Y" ? myPartyId : p.inspectorPartyId || null,
        sourceTypeEnumId: p.sourceTypeEnumId || null,
        shipmentId: p.shipmentId || null,
        pageIndex: p.pageIndex,
        pageSize: p.pageSize,
        pageNoLimit: p.pageNoLimit
    })
    return Object.assign(answer, found, {inspections: Array.from(found.inspections || []).map(shape)})
}

// ReceiptDetail's Inspection part: the inspections of a receipt the user may work with (check#Record of the shipment), for
// every Warehouse user, since each opens the shared QualityInspection.
function receiptInspections(p) {
    const userScope = scopeOf()
    warehouse.execute("checkRecord", {recordType: "shipment", recordId: p.shipmentId})
    const found = call(Q + "find#Inspections", {
        facilityIds: warehouse.facilityIds(userScope),
        shipmentId: p.shipmentId,
        pageSize: 100
    })
    return {inspections: Array.from(found.inspections || []).map(shape)}
}

// ===== one inspection =====
// An inspection of the user's facilities (check#Record; every Warehouse user reads it), Mantle's read of it with the user's
// facilities, what the user may do now, the links of its source and stock, and the disposition defaults.
function inspectionDetail(p) {
    const userScope = scopeOf()
    warehouse.execute("checkRecord", {recordType: "inspection", recordId: p.qualityInspectionId})
    const found = call(Q + "get#Inspection", {
        qualityInspectionId: p.qualityInspectionId,
        facilityIds: warehouse.facilityIds(userScope)
    })
    const inspection = shape(found.inspection)
    const links = {}
    if (inspection.assetId) links.asset = warehouse.recordUrl("asset", inspection.assetId, inspection.facilityId, userScope)
    if (inspection.shipmentId)
        links.shipment = warehouse.recordUrl("shipment", inspection.shipmentId, inspection.facilityId, userScope)
    if (inspection.productId) links.product = warehouse.recordUrl("product", inspection.productId, null, userScope)
    const can = userScope.capabilities
    const mantleCan = found.capabilities || {}
    return Object.assign({}, found, {
        recordFound: true,
        inspection,
        links,
        items: Array.from(found.items || []).map(item =>
            Object.assign({}, item, {
                readingStateText: item.missing
                    ? "Reading needed"
                    : item.failCount
                      ? item.failCount + " failed"
                      : item.readingCount
                        ? "Read"
                        : "Optional",
                readingStateColor: item.missing
                    ? "warning"
                    : item.failCount
                      ? "negative"
                      : item.readingCount
                        ? "positive"
                        : "grey"
            })
        ),
        actions: {
            canSaveReadings: !!can.inspect && !!mantleCan.canSaveReadings,
            canSubmit: !!can.inspect && !!mantleCan.canSubmit,
            canVerify: !!can.qualityVerify && !!mantleCan.canVerify,
            canDispose: !!can.qualityDispose && !!mantleCan.canDispose,
            canAssign: qualityCapable(can) && !!mantleCan.canAssign,
            canReinspect: !!can.inspect && !!mantleCan.canReinspect,
            canCancel: !!(can.inspect || can.qualityVerify) && !!mantleCan.canCancel
        },
        submitDefaults: {quantityAccepted: inspection.quantity, quantityRejected: "0"},
        disposeDefaults: {
            dispositionEnumId: found.acceptedLeft && found.acceptedLeft !== "0" ? "QdRelease" : "QdScrap",
            quantity: found.acceptedLeft && found.acceptedLeft !== "0" ? found.acceptedLeft : found.rejectedLeft
        }
    })
}

// ===== templates =====
function templateList(p) {
    const userScope = scopeOf()
    const found = call(Q + "find#InspectionTemplates", {
        statusId: p.statusId || null,
        inspectionContextEnumId: p.inspectionContextEnumId || null,
        productId: p.productId || null,
        templateName: p.templateName || null,
        pageIndex: p.pageIndex,
        pageSize: p.pageSize
    })
    return Object.assign({}, found, {
        canEdit: !!userScope.capabilities.qualityTemplateEdit,
        templates: Array.from(found.templates || []).map(row =>
            Object.assign({}, row, {statusColor: statusColors[row.statusId] || "grey"})
        )
    })
}
function templateDetail(p) {
    const userScope = scopeOf()
    const found = call(Q + "get#InspectionTemplate", {inspectionTemplateId: p.inspectionTemplateId, asOfDate: p.asOfDate || null})
    const template = Object.assign({}, found.template, {statusColor: statusColors[found.template.statusId] || "grey"})
    const editable = !!userScope.capabilities.qualityTemplateEdit && template.statusId !== "QtRetired"
    return Object.assign({}, found, {
        recordFound: true,
        template,
        canEdit: editable,
        canPublish: editable && template.statusId === "QtDraft",
        canRetire: editable && template.statusId === "QtPublished",
        published: template.statusId === "QtPublished",
        editItems: Array.from(found.draftItems || []).concat(Array.from(found.items || []))
    })
}

// ===== choices =====
function enumOptions(enumTypeId) {
    return Array.from(find("moqui.basic.Enumeration", {enumTypeId}).orderBy("sequenceNum,description").list()).map(row => ({
        value: row.enumId,
        label: row.description || row.enumId
    }))
}
function choices(p) {
    const userScope = scopeOf()
    const term = String(p.term || "").trim()
    const orgIds = userScope.organizationPartyIds.length ? userScope.organizationPartyIds : ["_NA_"]
    const sources = {
        // the people of the user's organizations whose user may inspect (QUALITY_INSPECT in a group)
        inspectors: () => {
            const groupIds = Array.from(find("moqui.security.UserGroupPermission", {userPermissionId: "QUALITY_INSPECT"}).list())
                .filter(row => lib.active(row))
                .map(row => row.userGroupId)
            const userIds = groupIds.length
                ? Array.from(find("moqui.security.UserGroupMember").condition("userGroupId", "in", groupIds).list())
                      .filter(row => lib.active(row))
                      .map(row => row.userId)
                : []
            const accountParties = userIds.length
                ? Array.from(find("moqui.security.UserAccount").condition("userId", "in", userIds).list())
                      .map(row => row.partyId)
                      .filter(Boolean)
                : []
            const partyIds = accountParties.length
                ? Array.from(
                      find("mantle.party.PartyRelationship")
                          .condition("toPartyId", "in", orgIds)
                          .condition("fromPartyId", "in", accountParties)
                          .condition("relationshipTypeEnumId", "in", ["PrtAgent", "PrtEmployee"])
                          .selectField("fromPartyId")
                          .distinct(true)
                          .list()
                  ).map(row => row.fromPartyId)
                : []
            let query = find("mantle.party.PartyDetail")
                .condition("partyId", "in", partyIds.length ? partyIds : ["_NA_"])
                .orderBy("firstName,lastName")
                .limit(choiceLimit)
            if (term) query = query.condition(anyOf(["firstName", "lastName", "partyId"].map(field => like(field, term))))
            const name = row => [row.firstName, row.lastName].filter(Boolean).join(" ") || row.partyId
            const options = Array.from(query.list()).map(row => ({value: row.partyId, label: name(row)}))
            if (p.selected && !options.some(row => row.value === p.selected) && partyIds.includes(p.selected)) {
                const selected = one("mantle.party.PartyDetail", {partyId: p.selected})
                if (selected) options.push({value: selected.partyId, label: name(selected)})
            }
            return options
        },
        // the user's organizations, by name: a new template's organization
        organizations: () => {
            const ids = userScope.organizationPartyIds
            const names = lib.partyNames(ids)
            return ids
                .map(id => ({value: id, label: names[id] || id}))
                .filter(row => !term || row.label.toLowerCase().includes(term.toLowerCase()))
        },
        // the published templates of the user's organizations
        templates: () => {
            let query = find("mantle.product.quality.InspectionTemplate", {statusId: "QtPublished"})
                .condition("organizationPartyId", "in", orgIds)
                .orderBy("templateName")
                .limit(choiceLimit)
            if (term) query = query.condition(like("templateName", term))
            return Array.from(query.list()).map(row => ({value: row.inspectionTemplateId, label: row.templateName}))
        },
        products: () => {
            let query = find("mantle.product.Product")
                .condition(
                    anyOf([
                        ec.entity.conditionFactory.makeCondition("ownerPartyId", "in", orgIds.concat(["_NA_"])),
                        ec.entity.conditionFactory.makeCondition("ownerPartyId", "is-null", null)
                    ])
                )
                .orderBy("productName")
                .limit(choiceLimit)
            if (term) query = query.condition(anyOf(["productId", "productName", "pseudoId"].map(field => like(field, term))))
            const options = Array.from(query.list()).map(row => ({value: row.productId, label: row.productName || row.productId}))
            if (p.selected && !options.some(row => row.value === p.selected)) {
                const selected = one("mantle.product.Product", {productId: p.selected})
                if (selected) options.push({value: selected.productId, label: selected.productName || selected.productId})
            }
            return options
        },
        categories: () => {
            let query = find("mantle.product.category.ProductCategory").orderBy("categoryName").limit(choiceLimit)
            if (term) query = query.condition(anyOf(["productCategoryId", "categoryName"].map(field => like(field, term))))
            const options = Array.from(query.list()).map(row => ({
                value: row.productCategoryId,
                label: row.categoryName || row.productCategoryId
            }))
            if (p.selected && !options.some(row => row.value === p.selected)) {
                const selected = one("mantle.product.category.ProductCategory", {productCategoryId: p.selected})
                if (selected) options.push({value: selected.productCategoryId, label: selected.categoryName || p.selected})
            }
            return options
        },
        // a location of the inspection's facility for a disposition: quarantine (stays held), morgue (scrap) or any other
        locations: () => {
            const facility = facilityOf(userScope, p.facilityId)
            if (!facility) return []
            let query = find("mantle.facility.FacilityLocation", {facilityId: facility.facilityId})
                .condition("thruDate", "is-null", null)
                .orderBy("locationSeqId")
                .limit(choiceLimit)
            if (term) query = query.condition(anyOf(["locationSeqId", "description"].map(field => like(field, term))))
            const types = Object.fromEntries(
                Array.from(find("moqui.basic.Enumeration", {enumTypeId: "FacilityLocationType"}).list()).map(row => [
                    row.enumId,
                    row.description
                ])
            )
            return Array.from(query.list()).map(row => ({
                value: row.locationSeqId,
                label: row.locationSeqId + (row.locationTypeEnumId ? " · " + (types[row.locationTypeEnumId] || "") : "")
            }))
        },
        statuses: () =>
            Array.from(find("moqui.basic.StatusItem", {statusTypeId: "QualityInspection"}).orderBy("sequenceNum").list()).map(
                row => ({value: row.statusId, label: row.description})
            ),
        templateStatuses: () =>
            Array.from(find("moqui.basic.StatusItem", {statusTypeId: "InspectionTemplate"}).orderBy("sequenceNum").list()).map(
                row => ({value: row.statusId, label: row.description})
            ),
        dispositions: () => enumOptions("InspectionDisposition"),
        contexts: () => enumOptions("InspectionContext"),
        sourceTypes: () => enumOptions("InspectionSourceType"),
        samplePolicies: () => enumOptions("InspectionSamplePolicy"),
        readingTypes: () => enumOptions("InspectionReadingType"),
        // the scrap reasons (Adjustments' Scrap): scrap, expired and damaged
        scrapReasons: () =>
            Array.from(find("moqui.basic.Enumeration", {enumTypeId: "InventoryVarianceReason"}).orderBy("sequenceNum").list())
                .filter(row => row.enumCode === "scrap" || row.enumId === "InVrDamaged")
                .map(row => ({value: row.enumId, label: row.description}))
    }
    if (!Object.hasOwn(sources, p.choice)) throw new Error("Unknown Warehouse inspection choice " + p.choice)
    return {options: sources[p.choice]()}
}

// ===== Today and Home =====
// The open inspections whose inspector the user is, in their facilities: Today items (F42).
function todayInspections() {
    const userScope = scopeOf()
    const partyId = ec.user.userAccount?.partyId
    if (!partyId) return []
    const ids = warehouse.facilityIds(userScope)
    let query = find("mantle.product.quality.QualityInspection", {inspectorPartyId: partyId})
        .condition("statusId", "in", ["QiDraft"])
        .orderBy("dueDate")
        .limit(100)
    if (ids) query = query.condition("facilityId", "in", ids.length ? ids : ["_NA_"])
    const rows = Array.from(query.list())
    const products = Object.fromEntries(
        rows.length
            ? Array.from(
                  find("mantle.product.Product")
                      .condition(
                          "productId",
                          "in",
                          rows.map(row => row.productId)
                      )
                      .list()
              ).map(row => [row.productId, row.productName || row.productId])
            : []
    )
    return rows.map(row => ({
        kind: "warehouseInspection",
        title: "Inspect " + (products[row.productId] || row.productId) + " (inspection " + row.qualityInspectionId + ")",
        url: "/qapps/Warehouse/QualityInspection?qualityInspectionId=" + encodeURIComponent(row.qualityInspectionId),
        dueDate: row.dueDate || null
    }))
}
// Home's inspection queue for a facility: ready (drafts), waiting (submitted or verified, waiting for a decision) and late
// (open past their due date).
function homeQueue(p) {
    const userScope = scopeOf()
    const facility = facilityOf(userScope, p.facilityId)
    if (!facility || !qualityCapable(userScope.capabilities)) return {queue: null}
    const base = () =>
        find("mantle.product.quality.QualityInspection", {facilityId: facility.facilityId}).condition(
            "statusId",
            "in",
            openStatuses
        )
    return {
        queue: {
            readyCount: base().condition("statusId", "QiDraft").count(),
            waitingCount: base().condition("statusId", "in", ["QiSubmitted", "QiVerified"]).count(),
            lateCount: base().condition("dueDate", "less", ec.user.nowTimestamp).count(),
            backorderCount: null
        }
    }
}

const operations = {
    inspectionList,
    receiptInspections,
    inspectionDetail,
    templateList,
    templateDetail,
    choices,
    todayInspections,
    homeQueue
}
;({
    execute(op, parameters) {
        if (!operations[op]) throw new Error("Unknown Warehouse inspection operation " + op)
        return operations[op](parameters)
    }
})
