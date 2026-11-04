// Manufacturing's quality screens (impl-manufacturing P8; design-manufacturing QualityGates, Inspections, QualityInspection and
// InspectionTemplates, crosscut §3.19's Manufacturing row): WorkOrderDetail's Quality tab (the run's gates from Mantle's
// get#SourceInspectionStatus), the Quality area's Inspections, the shared QualityInspection and InspectionTemplates with the
// Manufacturing context (and the operator mode's sequential steps), the quality checklist and certificate prints, the
// inspection scan and the drop-downs. Every read runs the Manufacturing scope (Manufacturing.js) and its record check; the
// writes are mantle.product.QualityServices and mantle.work.ProductionServices.create#ProductionInspection, called by the
// screens' transitions after AccessServices.check#Record, which check their permission and organization again.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const manufacturing = ec.resource.script("component://mr-boss/service/ironstone/manufacturing/Manufacturing.js")
const {find, one, call, denied} = lib
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
const stateColors = {required: "grey-8", pending: "warning", failed: "negative", passed: "positive"}
const blank = value => value == null || String(value).trim() === ""
const like = (field, term) =>
    ec.entity.conditionFactory.makeCondition(field, "like", "%" + term.replace(/[\\%_]/g, c => "\\" + c) + "%").ignoreCase()
const anyOf = conditions => ec.entity.conditionFactory.makeCondition(conditions, "or")
const scopeOf = () => manufacturing.required(manufacturing.scope())
const qualityCapable = can => !!(can.inspect || can.qualityVerify || can.qualityDispose || can.qualityTemplateEdit)
const base = "/qapps/Manufacturing/"
const inspectionUrl = id => base + "Quality/QualityInspection?qualityInspectionId=" + encodeURIComponent(id)
const enumText = enumId => (enumId ? one("moqui.basic.Enumeration", {enumId})?.description || enumId : "")
const opName = workEffortId => {
    const op = workEffortId ? one("mantle.work.effort.WorkEffort", {workEffortId}) : null
    return op ? op.workEffortName || op.workEffortId : ""
}
const shape = row =>
    Object.assign({}, row, {
        statusColor: statusColors[row.statusId] || "grey",
        dueText: row.dueDateText ? row.dueDateText + (row.overdue ? " (overdue)" : "") : "",
        quantityText:
            row.heldQuantity && row.heldQuantity !== "0" ? row.quantity + " (" + row.heldQuantity + " held)" : row.quantity,
        operationName: opName(row.operationWorkEffortId),
        runText: row.workEffortId ? "Work order " + row.workEffortId : "",
        inspectionUrl: inspectionUrl(row.qualityInspectionId)
    })
// The facilities of a plant: the plant and its lines (a run on a line is inspected at the line).
function plantFacilityIds(userScope, plantId) {
    if (blank(plantId)) return null
    const plant = one("mantle.facility.Facility", {facilityId: plantId})
    if (!manufacturing.isPlant(userScope, plant)) denied("PLANT_UNAVAILABLE", "Plant " + plantId + " is not available")
    const lines = Array.from(find("mantle.facility.Facility", {parentFacilityId: plantId}).selectField("facilityId").list())
    return [plantId, ...lines.map(row => row.facilityId)]
}

// ===== WorkOrderDetail's Quality tab =====
// The run's gates with their state and the inspection that decides each, every inspection of the run, and what the user may
// do: create an in-process gate's inspection (inspect), print a gate's checklist.
function gates(p) {
    const userScope = scopeOf()
    manufacturing.recordOf(userScope, "run", p.workEffortId)
    const status = call(Q + "get#SourceInspectionStatus", {workEffortId: p.workEffortId})
    const can = userScope.capabilities
    const gateRows = Array.from(status.gateRows || []).map(row =>
        Object.assign({}, row, {
            stateColor: stateColors[row.state] || "grey",
            whereText: row.productionStageEnumId === "QpsFinal" ? row.productName : row.operationName,
            canCreate: !!can.inspect && !!row.canCreate,
            inspectionUrl: row.qualityInspectionId ? inspectionUrl(row.qualityInspectionId) : null
        })
    )
    const found = call(Q + "find#Inspections", {workEffortId: p.workEffortId, pageSize: 100})
    return {
        gated: !!status.gated,
        gateRows,
        gateStatus: status.gateStatus,
        gateStatusText: status.gateStatusText,
        gateStatusColor: stateColors[status.gateStatus] || "grey",
        blockingText: status.blockingText || "",
        blockingInspectionId: status.blockingInspectionId || null,
        heldQuantity: status.heldQuantity == null ? "0" : String(Number(String(status.heldQuantity))),
        inspections: Array.from(found.inspections || []).map(shape),
        canInspect: !!can.inspect
    }
}

// ===== Inspections =====
// The production inspections of the user's organizations (or a plant's facilities), open by default, by status, run,
// product, lot, inspector and due date; with assignedOnly those whose inspector the user is. Empty for a user outside the
// quality groups and the supervisors.
function inspectionList(p) {
    const userScope = scopeOf()
    const can = userScope.capabilities
    const answer = {canAssign: qualityCapable(can), inspections: [], inspectionsCount: 0}
    if (!qualityCapable(can) && !can.supervise) return answer
    const myPartyId = ec.user.userAccount?.partyId || "_NA_"
    const found = call(Q + "find#Inspections", {
        facilityIds: plantFacilityIds(userScope, p.plantId),
        inspectionContextEnumId: "QicProduction",
        qualityInspectionId: p.qualityInspectionId || null,
        statusId: p.statusId || null,
        openOnly: blank(p.statusId) && p.openOnly !== "N",
        workEffortId: p.workEffortId || null,
        productId: p.productId || null,
        lotId: p.lotId || null,
        inspectorPartyId: p.assignedOnly === "Y" ? myPartyId : p.inspectorPartyId || null,
        dueBefore: p.dueBefore || null,
        pageIndex: p.pageIndex,
        pageSize: p.pageSize,
        pageNoLimit: p.pageNoLimit
    })
    return Object.assign(answer, found, {inspections: Array.from(found.inspections || []).map(shape)})
}

// ===== one inspection =====
// The operator mode's steps: each characteristic for each sample, in order; the next one without a reading.
function operatorSteps(found) {
    const items = Array.from(found.items || [])
    const samples = Math.max(1, Math.min(50, Math.ceil(Number(String(found.inspection.sampleSize || 1)))))
    const read = new Set(Array.from(found.readings || []).map(row => row.inspectionTemplateItemId + "/" + row.sampleNumber))
    const steps = []
    for (const item of items)
        for (let sample = 1; sample <= samples; sample++)
            steps.push({
                inspectionTemplateItemId: item.inspectionTemplateItemId,
                characteristicName: item.characteristicName,
                readingTypeEnumId: item.readingTypeEnumId,
                limitsText: item.limitsText || "",
                sampleNumber: String(sample),
                done: read.has(item.inspectionTemplateItemId + "/" + sample)
            })
    const index = steps.findIndex(step => !step.done)
    return {
        stepCount: steps.length,
        doneCount: steps.filter(step => step.done).length,
        next: index < 0 ? null : Object.assign({stepNumber: index + 1}, steps[index])
    }
}
// A production inspection of the user's organizations (check#Record), Mantle's read of it, what the user may do now, the
// links of its run, operation and stock, the disposition defaults and the operator mode's next step.
function inspectionDetail(p) {
    const userScope = scopeOf()
    manufacturing.recordOf(userScope, "inspection", p.qualityInspectionId)
    const found = call(Q + "get#Inspection", {qualityInspectionId: p.qualityInspectionId})
    const inspection = shape(found.inspection)
    const links = {}
    if (inspection.workEffortId)
        links.run = base + "WorkOrders/WorkOrderDetail/Quality?workEffortId=" + encodeURIComponent(inspection.workEffortId)
    if (inspection.operationWorkEffortId) links.operation = manufacturing.recordUrl("operation", inspection.operationWorkEffortId)
    const gate = inspection.productionQualityGateId
        ? one("mantle.work.production.ProductionQualityGate", {productionQualityGateId: inspection.productionQualityGateId})
        : null
    if (gate)
        inspection.gateText = [
            enumText(gate.productionStageEnumId) + " gate",
            gate.operationWorkEffortId ? opName(gate.operationWorkEffortId) : "",
            "template as of the release " + lib.dateText(gate.templateAsOfDate)
        ]
            .filter(Boolean)
            .join(" · ")
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
        },
        operator: operatorSteps(found)
    })
}

// ===== the prints =====
// The quality checklist of a run's gate: the template's characteristics as of the release, with a blank reading for each
// sample to fill on the floor.
function checklist(p) {
    const userScope = scopeOf()
    manufacturing.recordOf(userScope, "run", p.workEffortId)
    const gate = blank(p.productionQualityGateId)
        ? null
        : one("mantle.work.production.ProductionQualityGate", {productionQualityGateId: p.productionQualityGateId})
    if (!gate || gate.workEffortId !== p.workEffortId)
        denied("RECORD_UNAVAILABLE", "Quality gate " + (p.productionQualityGateId || "") + " is not available")
    const run = call("mantle.work.ProductionServices.get#ProductionQuantities", {workEffortId: p.workEffortId}).run || {}
    const template = call(Q + "get#InspectionTemplate", {
        inspectionTemplateId: gate.inspectionTemplateId,
        asOfDate: gate.templateAsOfDate
    })
    const samples = gate.samplePolicyEnumId === "QspFixed" ? Math.max(1, Number(String(gate.sampleSize || 1))) : 5
    const sampleNumbers = Array.from({length: Math.min(samples, 10)}, (_, index) => String(index + 1))
    return {
        run,
        gate: Object.assign(lib.display(gate), {
            stageText: enumText(gate.productionStageEnumId),
            operationName: opName(gate.operationWorkEffortId),
            sampleText:
                gate.samplePolicyEnumId === "QspFixed"
                    ? Number(String(gate.sampleSize)) + " units"
                    : gate.samplePolicyEnumId === "QspPercent"
                      ? Number(String(gate.samplePercent)) + "%"
                      : "every unit"
        }),
        templateName: template.template?.templateName || gate.templateName,
        asOfText: template.asOfText,
        itemRows: Array.from(template.items || []).map(item =>
            Object.assign({}, item, {blanks: sampleNumbers.map(number => "#" + number + " ______").join("   ")})
        )
    }
}
// The quality certificate of a production inspection: its verified result, the template as of the inspection, its readings
// and dispositions.
function certificate(p) {
    const detail = inspectionDetail(p)
    return {
        inspection: detail.inspection,
        items: detail.items,
        readings: detail.readings,
        dispositions: detail.dispositions,
        verified: ["QiVerified", "QiDisposed"].includes(detail.inspection.statusId)
    }
}

// ===== templates =====
function templateList(p) {
    const userScope = scopeOf()
    const found = call(Q + "find#InspectionTemplates", {
        statusId: p.statusId || null,
        inspectionContextEnumId: "QicProduction",
        productId: p.productId || null,
        templateName: p.templateName || null,
        pageIndex: p.pageIndex,
        pageSize: p.pageSize
    })
    return Object.assign({}, found, {
        canEdit: !!userScope.capabilities.qualityTemplateEdit,
        templates: Array.from(found.templates || []).map(row => {
            const stored = one("mantle.product.quality.InspectionTemplate", {inspectionTemplateId: row.inspectionTemplateId})
            return Object.assign({}, row, {
                statusColor: statusColors[row.statusId] || "grey",
                stageText: enumText(stored?.productionStageEnumId)
            })
        })
    })
}
function templateDetail(p) {
    const userScope = scopeOf()
    manufacturing.recordOf(userScope, "inspectionTemplate", p.inspectionTemplateId)
    const found = call(Q + "get#InspectionTemplate", {inspectionTemplateId: p.inspectionTemplateId, asOfDate: p.asOfDate || null})
    const stored = one("mantle.product.quality.InspectionTemplate", {inspectionTemplateId: p.inspectionTemplateId})
    const bom = stored.productBomId ? one("mantle.product.bom.ProductBom", {productBomId: stored.productBomId}) : null
    const template = Object.assign({}, found.template, {
        statusColor: statusColors[found.template.statusId] || "grey",
        productionStageEnumId: stored.productionStageEnumId,
        sampleBasisEnumId: stored.sampleBasisEnumId,
        productBomId: stored.productBomId,
        operationWorkEffortId: stored.operationWorkEffortId,
        stageText: enumText(stored.productionStageEnumId) || "Final",
        sampleBasisText: enumText(stored.sampleBasisEnumId) || "Each receipt",
        attachedText: bom
            ? "method " + (bom.bomName || bom.productBomId)
            : stored.operationWorkEffortId
              ? "operation " + opName(stored.operationWorkEffortId)
              : ""
    })
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

// ===== the scan =====
// The operator mode's scan: an inspection id, the held stock of an open inspection, or a lot with one, among the user's
// production inspections; answers scan-input matches.
function scan(p) {
    const userScope = scopeOf()
    const text = String(p.scanText || "").trim()
    if (!text) return {matches: []}
    const candidates = []
    const byId = one("mantle.product.quality.QualityInspection", {qualityInspectionId: text})
    if (byId) candidates.push(byId)
    for (const field of ["assetId", "lotId"])
        for (const row of Array.from(
            find("mantle.product.quality.QualityInspection", {[field]: text})
                .condition("statusId", "in", openStatuses)
                .limit(10)
                .list()
        ))
            candidates.push(row)
    const lots = Array.from(find("mantle.product.asset.Lot", {lotNumber: text}).selectField("lotId").limit(5).list())
    for (const lot of lots)
        for (const row of Array.from(
            find("mantle.product.quality.QualityInspection", {lotId: lot.lotId})
                .condition("statusId", "in", openStatuses)
                .limit(10)
                .list()
        ))
            candidates.push(row)
    const seen = new Set(),
        matches = []
    for (const row of candidates) {
        if (seen.has(row.qualityInspectionId)) continue
        seen.add(row.qualityInspectionId)
        try {
            const checked = manufacturing.recordOf(userScope, "inspection", row.qualityInspectionId)
            matches.push({
                identityType: "inspection",
                id: row.qualityInspectionId,
                label: checked.label,
                detail: checked.detail
            })
        } catch (error) {
            if (lib.reasonCode(error) !== "RECORD_UNAVAILABLE") throw error
        }
    }
    return {matches}
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
    const orgIds = userScope.ownerIds || userScope.organizationPartyIds
    const inOrgs = query =>
        userScope.ownerIds ? query.condition("ownerPartyId", "in", orgIds.length ? orgIds : ["_NA_"]) : query
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
            const parties = userIds.length
                ? Array.from(find("moqui.security.UserAccount").condition("userId", "in", userIds).list())
                      .map(row => row.partyId)
                      .filter(Boolean)
                : []
            let relations = find("mantle.party.PartyRelationship")
                .condition("fromPartyId", "in", parties.length ? parties : ["_NA_"])
                .condition("relationshipTypeEnumId", "in", ["PrtAgent", "PrtEmployee"])
                .selectField("fromPartyId")
                .distinct(true)
            if (userScope.ownerIds) relations = relations.condition("toPartyId", "in", orgIds.length ? orgIds : ["_NA_"])
            const partyIds = Array.from(relations.list()).map(row => row.fromPartyId)
            let query = find("mantle.party.PartyDetail")
                .condition("partyId", "in", partyIds.length ? partyIds : ["_NA_"])
                .orderBy("firstName,lastName")
                .limit(choiceLimit)
            if (term) query = query.condition(anyOf(["firstName", "lastName", "partyId"].map(field => like(field, term))))
            const name = row => [row.firstName, row.lastName].filter(Boolean).join(" ") || row.partyId
            return Array.from(query.list()).map(row => ({value: row.partyId, label: name(row)}))
        },
        organizations: () => {
            const ids = userScope.organizationPartyIds
            const names = lib.partyNames(ids)
            return ids
                .map(id => ({value: id, label: names[id] || id}))
                .filter(row => !term || row.label.toLowerCase().includes(term.toLowerCase()))
        },
        products: () => {
            let query = find("mantle.product.Product", {productTypeEnumId: "PtAsset"}).orderBy("productName").limit(choiceLimit)
            if (userScope.ownerIds)
                query = query.condition(
                    anyOf([
                        ec.entity.conditionFactory.makeCondition("ownerPartyId", "in", orgIds.concat(["_NA_"])),
                        ec.entity.conditionFactory.makeCondition("ownerPartyId", "is-null", null)
                    ])
                )
            if (term) query = query.condition(anyOf(["productId", "productName", "pseudoId"].map(field => like(field, term))))
            const options = Array.from(query.list()).map(row => ({value: row.productId, label: row.productName || row.productId}))
            if (p.selected && !options.some(row => row.value === p.selected)) {
                const selected = one("mantle.product.Product", {productId: p.selected})
                if (selected) options.push({value: selected.productId, label: selected.productName || selected.productId})
            }
            return options
        },
        // the facilities of the user's organizations: a template's applicability
        facilities: () => {
            let query = inOrgs(find("mantle.facility.Facility")).orderBy("facilityName").limit(choiceLimit)
            if (term) query = query.condition(anyOf(["facilityId", "facilityName"].map(field => like(field, term))))
            return Array.from(query.list()).map(row => ({value: row.facilityId, label: row.facilityName || row.facilityId}))
        },
        // the methods (BOMs) and operations (templates and routing operations) a production template attaches to
        methods: () => {
            let query = find("mantle.product.bom.ProductBom").orderBy("bomName").limit(choiceLimit)
            if (userScope.ownerIds) query = query.condition("organizationPartyId", "in", orgIds.length ? orgIds : ["_NA_"])
            if (term) query = query.condition(anyOf(["productBomId", "bomName", "productId"].map(field => like(field, term))))
            return Array.from(query.list()).map(row => ({
                value: row.productBomId,
                label: [row.bomName || row.productBomId, row.productId].filter(Boolean).join(" · ")
            }))
        },
        operations: () => {
            let query = inOrgs(find("mantle.work.effort.WorkEffort", {purposeEnumId: "WepRoutingTask"}))
                .orderBy("workEffortName")
                .limit(choiceLimit)
            if (term) query = query.condition(anyOf(["workEffortId", "workEffortName"].map(field => like(field, term))))
            return Array.from(query.list()).map(row => ({
                value: row.workEffortId,
                label: (row.workEffortName || row.workEffortId) + (row.parentWorkEffortId ? "" : " (template)")
            }))
        },
        // a location of the inspection's facility for a disposition
        locations: () => {
            const facility = blank(p.facilityId) ? null : one("mantle.facility.Facility", {facilityId: p.facilityId})
            if (!facility || !manufacturing.inScope(userScope, facility)) return []
            let query = find("mantle.facility.FacilityLocation", {facilityId: facility.facilityId})
                .condition("thruDate", "is-null", null)
                .orderBy("locationSeqId")
                .limit(choiceLimit)
            if (term) query = query.condition(anyOf(["locationSeqId", "description"].map(field => like(field, term))))
            return Array.from(query.list()).map(row => ({
                value: row.locationSeqId,
                label: row.locationSeqId + (row.locationTypeEnumId ? " · " + enumText(row.locationTypeEnumId) : "")
            }))
        },
        stages: () => enumOptions("ProductionInspectionStage"),
        sampleBases: () => enumOptions("InspectionSampleBasis"),
        contexts: () => enumOptions("InspectionContext").filter(row => row.value === "QicProduction")
    }
    // the shared lists: the same options as Warehouse's (enumerations and statuses)
    const shared = [
        "statuses",
        "templateStatuses",
        "dispositions",
        "samplePolicies",
        "readingTypes",
        "scrapReasons",
        "categories",
        "sourceTypes"
    ]
    if (shared.includes(p.choice)) {
        const enums = {
            statuses: () =>
                Array.from(find("moqui.basic.StatusItem", {statusTypeId: "QualityInspection"}).orderBy("sequenceNum").list()).map(
                    row => ({value: row.statusId, label: row.description})
                ),
            templateStatuses: () =>
                Array.from(
                    find("moqui.basic.StatusItem", {statusTypeId: "InspectionTemplate"}).orderBy("sequenceNum").list()
                ).map(row => ({value: row.statusId, label: row.description})),
            dispositions: () => enumOptions("InspectionDisposition"),
            samplePolicies: () => enumOptions("InspectionSamplePolicy"),
            readingTypes: () => enumOptions("InspectionReadingType"),
            sourceTypes: () => enumOptions("InspectionSourceType"),
            scrapReasons: () =>
                Array.from(find("moqui.basic.Enumeration", {enumTypeId: "InventoryVarianceReason"}).orderBy("sequenceNum").list())
                    .filter(row => row.enumCode === "scrap" || row.enumId === "InVrDamaged")
                    .map(row => ({value: row.enumId, label: row.description})),
            categories: () => {
                let query = find("mantle.product.category.ProductCategory").orderBy("categoryName").limit(choiceLimit)
                if (term) query = query.condition(anyOf(["productCategoryId", "categoryName"].map(field => like(field, term))))
                return Array.from(query.list()).map(row => ({
                    value: row.productCategoryId,
                    label: row.categoryName || row.productCategoryId
                }))
            }
        }
        return {options: enums[p.choice]()}
    }
    if (!Object.hasOwn(sources, p.choice)) throw new Error("Unknown Manufacturing inspection choice " + p.choice)
    return {options: sources[p.choice]()}
}

const operations = {gates, inspectionList, inspectionDetail, checklist, certificate, templateList, templateDetail, scan, choices}
;({
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Manufacturing quality operation " + op)
        return operations[op](parameters)
    }
})
