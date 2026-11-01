// The Warehouse Counts screens' reads and shapes (impl-warehouse P10, design-warehouse §7, §13 HandheldCount, §14
// CountVariance and the StockPolicies count schedule): the count list and the Due saved find, one count with what the
// user may do to it now, the count choices, the variance report, the count schedule, Home's count queue and the user's
// assigned counts (MyWork and the Warehouse Today source). Every read runs the app's facility scope (Warehouse.js) and
// passes the user's facilities to Mantle's mantle.product.InventoryCountServices, which checks its permissions and
// withholds a blind count's expected quantities itself; nothing here adds what Mantle leaves out.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const warehouse = ec.resource.script("component://mr-boss/service/ironstone/warehouse/Warehouse.js")
const {find, one, denied, call} = lib

const C = "mantle.product.InventoryCountServices."
const choiceLimit = 30
const statusColors = {
    PIInPlanning: "grey-8",
    PIInProgress: "primary",
    PIInValidation: "warning",
    PIComplete: "positive",
    PICancelled: "grey",
    PicOpen: "grey-8",
    PicCounted: "primary",
    PicSkipped: "grey",
    PicConflict: "negative",
    PicApproved: "warning",
    PicPosted: "positive",
    PicFailed: "negative"
}
const kindTexts = {
    periodic: "Count every few days",
    annual: "Annual count",
    zero: "Stock reached zero",
    request: "Count requested",
    shortPick: "Short pick recount"
}
const blank = value => value == null || String(value).trim() === ""
const scopeOf = () => warehouse.required(warehouse.scope())
const like = (field, term) =>
    ec.entity.conditionFactory.makeCondition(field, "like", "%" + term.replace(/[\\%_]/g, c => "\\" + c) + "%").ignoreCase()
const anyOf = conditions => ec.entity.conditionFactory.makeCondition(conditions, "or")

// The facility of a list: the one given (refused outside the scope), else none (every facility of the user's).
function facilityOf(userScope, facilityId) {
    if (blank(facilityId)) return null
    const facility = one("mantle.facility.Facility", {facilityId})
    if (!warehouse.inScope(userScope, facility)) denied("FACILITY_UNAVAILABLE", "Facility " + facilityId + " is not available")
    return facility
}
const facilityIdsFor = (userScope, facility) => (facility ? [facility.facilityId] : warehouse.facilityIds(userScope))
const countCapable = can => !!(can.count || can.countReview || can.adjust)

// ===== the list and the Due saved find =====
function countList(p) {
    const userScope = scopeOf()
    const can = userScope.capabilities
    const facility = facilityOf(userScope, p.facilityId)
    const answer = {canCreate: !!can.count, canReview: !!can.countReview, counts: [], dueRows: [], countsCount: 0}
    if (!countCapable(can)) return answer
    const facilityIds = facilityIdsFor(userScope, facility)
    if (p.view === "due") {
        const dueQuery = pageIndex =>
            call(C + "find#DueCounts", {
                facilityIds,
                horizonDays: p.horizonDays || 0,
                assignedOnly: p.assignedOnly === "Y" || p.assignedOnly === true,
                pageIndex,
                pageSize: p.rowKeys ? 100 : p.pageSize
            })
        let due = dueQuery(p.rowKeys ? 0 : p.pageIndex)
        // Count now's selected rows, by key, from every page (a key is the row's facility, kind and location or product)
        if (p.rowKeys) {
            const wanted = new Set(Array.from(p.rowKeys).map(String))
            const keyOf = row =>
                [row.facilityId, row.itemType, row.locationSeqId || row.productId || row.physicalInventoryId].join(":")
            let chosen = Array.from(due.dueRows || []).filter(row => wanted.has(keyOf(row)))
            for (let pageIndex = 1; pageIndex <= Number(due.dueRowsPageMaxIndex || 0); pageIndex++)
                chosen = chosen.concat(Array.from(dueQuery(pageIndex).dueRows || []).filter(row => wanted.has(keyOf(row))))
            due = Object.assign({}, due, {dueRows: chosen})
        }
        const productIds = Array.from(due.dueRows || []).map(row => row.productId)
        return Object.assign(answer, due, {
            dueRows: Array.from(due.dueRows || []).map(row =>
                Object.assign({}, row, {
                    itemText:
                        row.itemType === "count"
                            ? "Count " + row.physicalInventoryId
                            : row.itemType === "product"
                              ? row.productName || row.productId
                              : "Location " + row.locationSeqId,
                    kindText: kindTexts[row.kind] || row.kind,
                    dueText: row.nextDate + (row.overdue ? " (overdue)" : ""),
                    dueColor: row.overdue ? "negative" : "warning",
                    lastText: row.lastCountDay || (row.itemType === "count" ? "" : "Never counted"),
                    rowKey: [row.facilityId, row.itemType, row.locationSeqId || row.productId || row.physicalInventoryId].join(
                        ":"
                    )
                })
            ),
            productCount: productIds.length
        })
    }
    const found = call(C + "find#Counts", {
        facilityIds,
        statusId: p.statusId || null,
        openOnly: p.openOnly === "Y" || p.openOnly === true,
        countModeEnumId: p.countModeEnumId || null,
        assigneePartyId: p.assigneePartyId || null,
        physicalInventoryId: p.physicalInventoryId || null,
        pageIndex: p.pageIndex,
        pageSize: p.pageSize,
        pageNoLimit: p.pageNoLimit
    })
    return Object.assign(answer, found, {
        counts: Array.from(found.counts || []).map(row =>
            Object.assign({}, row, {
                statusColor: statusColors[row.statusId] || "grey",
                progressText:
                    row.countedCount + " of " + row.lineCount + (row.failedCount ? ", " + row.failedCount + " failed" : ""),
                scopeText: scopeText(row.scope),
                blindText: row.blind ? "Blind" : ""
            })
        )
    })
}
function scopeText(scope) {
    if (!scope) return ""
    return (
        [
            scope.scopeLocationSeqId ? "location " + scope.scopeLocationSeqId : null,
            scope.scopeAreaId ? "area " + scope.scopeAreaId : null,
            scope.scopeLocationTypeEnumId
                ? (one("moqui.basic.Enumeration", {enumId: scope.scopeLocationTypeEnumId})?.description ||
                      scope.scopeLocationTypeEnumId) + " locations"
                : null,
            scope.scopeProductId ? "product " + scope.scopeProductId : null,
            scope.scopeProductCategoryId ? "category " + scope.scopeProductCategoryId : null,
            scope.scopeLotId ? "lot " + scope.scopeLotId : null,
            scope.scopeAbcClassEnumId ? "class " + scope.scopeAbcClassEnumId.replace(/^Abc/, "") : null
        ]
            .filter(Boolean)
            .join(", ") || "Selected stock or the whole facility"
    )
}

// ===== one count =====
// A count the user may work with (check#Record), Mantle's read of it with the user's facilities, and what they may do now.
function countDetail(p) {
    const userScope = scopeOf()
    const can = userScope.capabilities
    warehouse.execute("checkRecord", {recordType: "count", recordId: p.physicalInventoryId})
    if (!countCapable(can)) denied("PERMISSION_DENIED", "Counting needs the count, count review or adjust permission")
    const found = call(C + "get#Count", {
        physicalInventoryId: p.physicalInventoryId,
        facilityIds: warehouse.facilityIds(userScope),
        locationSeqId: p.locationSeqId || null,
        productId: p.productId || null,
        assetId: p.assetId || null,
        lineStatusId: p.lineStatusId || null,
        remainingOnly: p.remainingOnly === "Y" || p.remainingOnly === true,
        pageIndex: p.pageIndex,
        pageSize: p.pageSize,
        pageNoLimit: p.pageNoLimit
    })
    const count = found.count
    const status = count.statusId
    const totals = found.lineTotals || {}
    const myPartyId = ec.user.userAccount?.partyId
    const actions = {
        canEdit: !!can.count && status === "PIInPlanning",
        canStart: !!can.count && status === "PIInPlanning",
        canEnter: !!can.count && status === "PIInProgress",
        canSubmit: !!can.count && status === "PIInProgress",
        canReview: !!can.countReview && status === "PIInValidation",
        canRecount: !!can.countReview && status === "PIInValidation" && !!((totals.PicConflict || 0) + (totals.PicFailed || 0)),
        canPost:
            !!can.adjust &&
            status === "PIInValidation" &&
            !!count.reviewedDateText &&
            !!((totals.PicApproved || 0) + (totals.PicFailed || 0)),
        canCancel: !!can.count && ["PIInPlanning", "PIInProgress", "PIInValidation"].includes(status) && !totals.PicPosted,
        assignedToMe: !!myPartyId && count.assigneePartyId === myPartyId
    }
    const lines = Array.from(found.lines || []).map(line =>
        Object.assign({}, line, {
            statusColor: statusColors[line.statusId] || "grey",
            placeText: [line.locationSeqId || "no location", line.containerId ? "in " + line.containerId : ""]
                .filter(Boolean)
                .join(" "),
            identityText: [
                line.extra ? "Found" : line.assetId,
                line.serialNumber ? "serial " + line.serialNumber : null,
                line.lotNumber ? "lot " + line.lotNumber : line.lotId ? "lot " + line.lotId : null
            ]
                .filter(Boolean)
                .join(" · "),
            countedText: line.counted ? line.quantityOnHand : line.statusId === "PicSkipped" ? "Skipped" : "",
            resultText: line.postMessage || line.conflictText || line.skipReasonText || "",
            movementText: Array.from(line.movements || [])
                .map(row => row.effectiveDateText + " " + row.quantity + " " + row.source)
                .join("; ")
        })
    )
    return Object.assign({}, found, {
        count: Object.assign({}, count, {statusColor: statusColors[status] || "grey", scopeText: scopeText(count.scope)}),
        lines,
        actions,
        capabilities: {financialRead: !!can.financialRead}
    })
}

// ===== choices =====
function enumOptions(enumTypeId, keep = () => true) {
    return Array.from(find("moqui.basic.Enumeration", {enumTypeId}).orderBy("sequenceNum,description").list())
        .filter(keep)
        .map(row => ({value: row.enumId, label: row.description || row.enumId}))
}
function choices(p) {
    const userScope = scopeOf()
    const term = String(p.term || "").trim()
    const sources = {
        // the people of the user's organizations with a user account, by name
        assignees: () => {
            const orgIds = userScope.organizationPartyIds.length ? userScope.organizationPartyIds : ["_NA_"]
            const partyIds = Array.from(
                find("mantle.party.PartyRelationship")
                    .condition("toPartyId", "in", orgIds)
                    .condition("relationshipTypeEnumId", "in", ["PrtAgent", "PrtEmployee"])
                    .selectField("fromPartyId")
                    .distinct(true)
                    .limit(2000)
                    .list()
            ).map(row => row.fromPartyId)
            let query = find("mantle.party.PartyDetail")
                .condition("partyId", "in", partyIds.length ? partyIds : ["_NA_"])
                .orderBy("firstName,lastName")
                .limit(choiceLimit)
            if (term) query = query.condition(anyOf(["firstName", "lastName", "partyId"].map(field => like(field, term))))
            const names = row => [row.firstName, row.lastName].filter(Boolean).join(" ") || row.organizationName || row.partyId
            const options = Array.from(query.list()).map(row => ({value: row.partyId, label: names(row)}))
            if (p.selected && !options.some(row => row.value === p.selected) && partyIds.includes(p.selected)) {
                const selected = one("mantle.party.PartyDetail", {partyId: p.selected})
                if (selected) options.push({value: selected.partyId, label: names(selected)})
            }
            return options
        },
        categories: () => {
            let query = find("mantle.product.category.ProductCategory").orderBy("categoryName").limit(choiceLimit)
            if (term) query = query.condition(anyOf(["productCategoryId", "categoryName"].map(field => like(field, term))))
            const options = Array.from(query.list()).map(row => ({
                value: row.productCategoryId,
                label: (row.categoryName || row.productCategoryId) + " · " + row.productCategoryId
            }))
            if (p.selected && !options.some(row => row.value === p.selected)) {
                const selected = one("mantle.product.category.ProductCategory", {productCategoryId: p.selected})
                if (selected)
                    options.push({value: selected.productCategoryId, label: selected.categoryName || selected.productCategoryId})
            }
            return options
        },
        countModes: () => enumOptions("CountMode"),
        countStatuses: () =>
            Array.from(find("moqui.basic.StatusItem", {statusTypeId: "PhysicalInventory"}).orderBy("sequenceNum").list()).map(
                row => ({
                    value: row.statusId,
                    label: row.description
                })
            ),
        lineStatuses: () =>
            Array.from(
                find("moqui.basic.StatusItem", {statusTypeId: "PhysicalInventoryCount"}).orderBy("sequenceNum").list()
            ).map(row => ({value: row.statusId, label: row.description})),
        skipReasons: () => enumOptions("CountSkipReason"),
        // a count's variance reasons: not scrap, which is recorded as scrap
        varianceReasons: () => enumOptions("InventoryVarianceReason", row => row.enumCode !== "scrap"),
        locationTypes: () => enumOptions("FacilityLocationType"),
        abcClasses: () => enumOptions("AbcClass"),
        scheduleKinds: () => enumOptions("CountScheduleKind"),
        months: () =>
            [
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December"
            ].map((label, index) => ({value: String(index + 1), label}))
    }
    if (!Object.hasOwn(sources, p.choice)) throw new Error("Unknown count choice " + p.choice)
    return {options: sources[p.choice]()}
}

// ===== the variance report =====
function variance(p) {
    const userScope = scopeOf()
    const can = userScope.capabilities
    const facility = facilityOf(userScope, p.facilityId)
    if (!can.countReview && !can.adjust) return {available: false, varianceRows: [], varianceRowsCount: 0}
    const found = call(C + "find#CountVariance", {
        facilityIds: facilityIdsFor(userScope, facility),
        physicalInventoryId: p.physicalInventoryId || null,
        productId: p.productId || null,
        varianceReasonEnumId: p.varianceReasonEnumId || null,
        varianceOnly: p.varianceOnly === "Y" || p.varianceOnly === true,
        fromDate: p.fromDate || null,
        thruDate: p.thruDate || null,
        pageIndex: p.pageIndex,
        pageSize: p.pageSize,
        pageNoLimit: p.pageNoLimit
    })
    return Object.assign({available: true}, found, {
        varianceRows: Array.from(found.varianceRows || []).map(row =>
            Object.assign({}, row, {
                statusColor: statusColors[row.statusId] || "grey",
                placeText: row.locationSeqId || "no location",
                identityText: [row.extra ? "Found" : row.assetId, row.lotNumber ? "lot " + row.lotNumber : null]
                    .filter(Boolean)
                    .join(" · ")
            })
        )
    })
}

// ===== the count schedule =====
function schedules(p) {
    const userScope = scopeOf()
    const facility = facilityOf(userScope, p.facilityId)
    try {
        const found = call("mantle.facility.WarehousePolicyServices.find#CountSchedules", {
            organizationPartyId: facility ? null : p.organizationPartyId || null,
            facilityId: facility?.facilityId || null,
            includeHistory: p.includeHistory === "Y" || p.includeHistory === true
        })
        return Object.assign({available: true}, found, {
            canManage: !!found.canManage && !!userScope.capabilities.policyManage,
            scopeText: facility ? facility.facilityName || facility.facilityId : "the organization"
        })
    } catch (error) {
        ec.logger.warn("Count schedules: " + error.message)
        return {available: false, schedules: [], canManage: false, message: "The count schedule is not available to you."}
    }
}

// ===== Home, MyWork and Today =====
// Home's count queue at a facility: counts planned or being counted (ready), submitted for review (waiting), and late (due
// items overdue and planned counts past their date).
function homeQueue(p) {
    const userScope = scopeOf()
    if (!countCapable(userScope.capabilities)) return null
    const facility = facilityOf(userScope, p.facilityId)
    const facilityIds = facilityIdsFor(userScope, facility)
    const open = Array.from(call(C + "find#Counts", {facilityIds, openOnly: true, pageNoLimit: "true"}).counts || [])
    const due = call(C + "find#DueCounts", {facilityIds, summaryOnly: true})
    const today = ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd")
    // the planned requests and short-pick recounts past their date are among the overdue dues already
    const adHoc = ["CntSrcRequest", "CntSrcShortPick"]
    return {
        readyCount: open.filter(row => ["PIInPlanning", "PIInProgress"].includes(row.statusId)).length,
        waitingCount: open.filter(row => row.statusId === "PIInValidation").length,
        lateCount:
            due.overdueCount +
            open.filter(
                row =>
                    row.statusId === "PIInPlanning" &&
                    !adHoc.includes(row.countSourceEnumId) &&
                    row.plannedDateText &&
                    row.plannedDateText.slice(0, 10) < today
            ).length,
        dueCount: due.dueCount
    }
}
// The open counts assigned to the user in their facilities, as MyWork and Today items.
function assignedCounts(userScope) {
    const partyId = ec.user.userAccount?.partyId
    if (!partyId || !countCapable(userScope.capabilities)) return []
    const facilityIds = warehouse.facilityIds(userScope)
    return Array.from(call(C + "find#Counts", {facilityIds, openOnly: true, assigneePartyId: partyId, pageSize: 20}).counts || [])
}
// The user's assigned open counts as items of the Warehouse Today source (Today.js).
function todayCounts() {
    return assignedCounts(scopeOf()).map(row => ({
        kind: "warehouseCount",
        title: "Count " + row.physicalInventoryId + " at " + row.facilityName,
        step: row.statusText,
        url: "/qapps/Warehouse/Counts/CountDetail?physicalInventoryId=" + encodeURIComponent(row.physicalInventoryId),
        dueDate: row.plannedDate || null
    }))
}

const operations = {countList, countDetail, choices, variance, schedules, homeQueue, todayCounts}
;({
    execute(op, parameters) {
        if (!operations[op]) throw new Error("Unknown Warehouse count operation " + op)
        return operations[op](parameters)
    }
})
