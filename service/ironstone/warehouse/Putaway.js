// The Warehouse putaway screens' reads (impl-warehouse P9; design-warehouse §4 Putaway, §12 PutawayRules, §13
// HandheldPutaway): the putaway queue of one of the user's facilities (stock waiting in a receiving or staging location, and
// stock a disposition released in quarantine) by age and the suggested destination's pick sequence, the stock chosen with
// its destination explained, Home's queue counts, the facility's putaway rules with a rule test, and the choices of the
// rule forms. Every read is limited to the user's Warehouse facilities in the query; the destinations are Mantle's
// mantle.facility.PutawayServices.resolve#Destination, and the putaway itself the guarded
// mantle.shipment.WarehouseTaskServices.putaway#Stock, which the screens call after AccessServices.check#Record.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const warehouse = ec.resource.script("component://mr-boss/service/ironstone/warehouse/Warehouse.js")
const {find, one, denied} = lib

const queueTypes = ["FltReceiving", "FltStaging"]
const putawayStatuses = ["AstAvailable", "AstOnHold"]
const stockTypes = ["AstTpInventory", "AstTpSupplies"]
const statusColors = {AstAvailable: "positive", AstOnHold: "warning", AstQuarantine: "negative", AstMorgue: "grey-8"}
const choiceLimit = 50
const cf = () => ec.entity.conditionFactory
const number = value => (value == null || value === "" ? null : Number(String(value)))
const blank = value => value == null || String(value).trim() === ""
const unique = values => [...new Set(values.filter(value => value != null && value !== ""))]
const todayText = () => ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd")

function namesOf(entity, field, nameField, values) {
    const ids = unique(values)
    if (!ids.length) return new Map()
    return new Map(Array.from(find(entity).condition(field, "in", ids).list()).map(row => [row[field], row[nameField]]))
}
function facilityOf(userScope, facilityId) {
    if (!facilityId) return null
    const facility = one("mantle.facility.Facility", {facilityId})
    if (!warehouse.inScope(userScope, facility)) denied("FACILITY_UNAVAILABLE", "Facility " + facilityId + " is not available")
    return facility
}
// The facility's queue locations: receiving and staging, and quarantine (only the stock a disposition released there).
function queueLocations(facilityId) {
    const rows = Array.from(
        find("mantle.facility.FacilityLocation", {facilityId})
            .condition("locationTypeEnumId", "in", queueTypes.concat(["FltQuarantine"]))
            .selectField("locationSeqId,locationTypeEnumId")
            .list()
    )
    return {
        waiting: rows.filter(row => queueTypes.includes(row.locationTypeEnumId)).map(row => row.locationSeqId),
        quarantine: rows.filter(row => row.locationTypeEnumId === "FltQuarantine").map(row => row.locationSeqId)
    }
}
// The queue's stock at a facility: on hand, of a stock type, in a waiting location or released in quarantine.
function queueFind(facilityId, p = {}) {
    const places = queueLocations(facilityId)
    const where = [cf().makeCondition("locationSeqId", "in", places.waiting.length ? places.waiting : ["_none_"])]
    if (places.quarantine.length)
        where.push(
            cf().makeCondition(
                [
                    cf().makeCondition("locationSeqId", "in", places.quarantine),
                    cf().makeCondition("statusId", "in", putawayStatuses)
                ],
                "and"
            )
        )
    let query = find("mantle.product.asset.AssetFindView", {facilityId})
        .condition("quantityOnHandTotal", "greater", 0)
        .condition(
            cf().makeCondition(
                [cf().makeCondition("assetTypeEnumId", "in", stockTypes), cf().makeCondition("assetTypeEnumId", "is-null", null)],
                "or"
            )
        )
        .condition(cf().makeCondition(where, "or"))
        // only stock putaway takes: available or on hold (damaged, defective or morgue stock is not put away)
        .condition("statusId", "in", putawayStatuses)
    if (!blank(p.productId)) query = query.condition("productId", p.productId)
    if (!blank(p.locationSeqId)) query = query.condition("locationSeqId", p.locationSeqId)
    return query
}
// The destination Mantle resolves for the stock (a refusal is named, never thrown: one row's failure is its own).
function resolveFor(parameters) {
    try {
        return lib.probe("mantle.facility.PutawayServices.resolve#Destination", parameters)
    } catch (error) {
        const message = String(error?.message || error).replace(/^(Error: )+/, "")
        ec.logger.warn("Putaway destination of " + JSON.stringify(parameters) + " failed: " + message)
        return {locationSeqId: null, reasonCode: "FAILED", reasonText: message, candidates: []}
    }
}
function stockRow(row, statuses, today) {
    const received = row.receivedDate ? ec.l10n.format(row.receivedDate, "yyyy-MM-dd") : ""
    const days = received ? Math.max(0, Math.round((Date.parse(today) - Date.parse(received)) / 86400000)) : null
    return {
        assetId: row.assetId,
        productId: row.productId,
        productName: row.productName || row.productId || "",
        identityText: [row.serialNumber ? "Serial " + row.serialNumber : "", row.lotNumber ? "Lot " + row.lotNumber : ""]
            .filter(Boolean)
            .join(" · "),
        locationSeqId: row.locationSeqId || "",
        sourceText: [row.locationSeqId, row.containerId ? "in " + row.containerId : ""].filter(Boolean).join(" "),
        quantityOnHand: number(row.quantityOnHandTotal) || 0,
        statusId: row.statusId,
        statusText: statuses.get(row.statusId) || row.statusId || "",
        statusColor: statusColors[row.statusId] || "grey",
        held: row.statusId === "AstQuarantine",
        receivedText: received,
        ageText: days == null ? "" : days === 0 ? "Today" : days === 1 ? "1 day" : days + " days",
        late: received !== "" && received < today
    }
}
function withDestination(row, resolved) {
    const chosen = (resolved.candidates || []).find(candidate => candidate.chosen)
    return Object.assign(row, {
        suggestedLocationSeqId: resolved.locationSeqId || null,
        suggestionText: resolved.locationSeqId
            ? chosen?.locationText + " · " + (chosen?.sourceText || "")
            : resolved.reasonText || "No location fits",
        suggestionOk: !!resolved.locationSeqId,
        suggestionColor: resolved.locationSeqId ? "positive" : "warning",
        sequenceNum: chosen?.sequenceNum ?? null
    })
}

// PutawayQueue and Destination: the facility's queue a page at a time, oldest first and then by the suggestion's pick
// sequence, each row with its suggested destination; the chosen asset with every destination explained.
function putawayContext(p) {
    const userScope = warehouse.required(warehouse.scope())
    const facility = facilityOf(userScope, p.facilityId)
    const answer = {
        canMove: !!userScope.capabilities.move,
        facilityId: facility?.facilityId || null,
        facilityName: facility ? facility.facilityName || facility.facilityId : "",
        queueRows: [],
        selectedAsset: null,
        destination: null
    }
    if (!facility) return answer
    if (!blank(p.locationSeqId))
        warehouse.execute("checkRecord", {recordType: "location", recordId: p.locationSeqId, facilityId: facility.facilityId})
    const query = queueFind(facility.facilityId, p)
    const paged = lib.page(query.orderBy("receivedDate,assetId"), p, "queueRows", queueFind(facility.facilityId, p).count())
    const statuses = namesOf(
        "moqui.basic.StatusItem",
        "statusId",
        "description",
        paged.rows.map(row => row.statusId)
    )
    const today = todayText()
    const rows = paged.rows.map(row =>
        withDestination(stockRow(row, statuses, today), resolveFor({assetId: row.assetId, explain: false}))
    )
    rows.sort(
        (a, b) =>
            String(a.receivedText).localeCompare(String(b.receivedText)) ||
            (a.sequenceNum ?? 1e9) - (b.sequenceNum ?? 1e9) ||
            String(a.assetId).localeCompare(String(b.assetId))
    )
    Object.assign(answer, paged, {queueRows: rows})
    delete answer.rows
    if (!blank(p.assetId)) {
        const record = warehouse.execute("checkRecord", {recordType: "asset", recordId: p.assetId})
        if (record.facilityId !== facility.facilityId)
            denied("OTHER_FACILITY", "Asset " + p.assetId + " is in " + record.facilityName + "; choose that facility")
        const found = Array.from(find("mantle.product.asset.AssetFindView", {assetId: p.assetId}).list())
        const selectedStatuses = namesOf(
            "moqui.basic.StatusItem",
            "statusId",
            "description",
            found.map(row => row.statusId)
        )
        if (found.length) {
            const resolved = resolveFor({assetId: p.assetId})
            answer.selectedAsset = withDestination(stockRow(found[0], selectedStatuses, today), resolved)
            answer.destination = {
                locationSeqId: resolved.locationSeqId || null,
                explanation: resolved.explanation || null,
                reasonText: resolved.reasonText || null,
                candidates: (resolved.candidates || []).map(row =>
                    Object.assign({}, row, {
                        resultText: row.chosen ? "Suggested" : row.ok ? "Fits" : "Refused",
                        resultColor: row.chosen ? "positive" : row.ok ? "info" : "negative"
                    })
                )
            }
        }
    }
    return answer
}

// Home's putaway queue at the facility: ready (all of it) and late (received before today).
function queueCounts(p) {
    const userScope = warehouse.required(warehouse.scope())
    const facility = facilityOf(userScope, p.facilityId)
    if (!facility) return {readyCount: null, lateCount: null}
    const startOfToday = ec.l10n.parseTimestamp(todayText() + " 00:00:00", "yyyy-MM-dd HH:mm:ss")
    return {
        readyCount: queueFind(facility.facilityId).count(),
        lateCount: queueFind(facility.facilityId).condition("receivedDate", "less", startOfToday).count()
    }
}

// PutawayRules: the facility's rules (Mantle's find#PutawayRules), and RuleTest's resolution of a product and quantity from
// a source, as of a date (a rule to come can be tried); a refusal of the test is its message.
function ruleContext(p) {
    const userScope = warehouse.required(warehouse.scope())
    const facility = facilityOf(userScope, p.facilityId)
    const answer = {
        facilityId: facility?.facilityId || null,
        facilityName: facility?.facilityName || "",
        rules: [],
        canEdit: false
    }
    if (!facility) return answer
    const found = lib.call("mantle.facility.PutawayServices.find#PutawayRules", {
        facilityId: facility.facilityId,
        includeHistory: p.includeHistory === true || p.includeHistory === "Y"
    })
    answer.canEdit = !!userScope.capabilities.facilityEdit
    answer.rules = Array.from(found.rules || []).map(rule =>
        Object.assign({}, rule, {
            stateText: rule.current ? "In effect" : rule.future ? "From " + rule.fromDateText : "Ended " + rule.thruDateText,
            stateColor: rule.current ? "positive" : rule.future ? "info" : "grey-8",
            priorityText: rule.priority == null ? "" : String(rule.priority)
        })
    )
    if (!blank(p.testProductId)) {
        const parameters = {
            facilityId: facility.facilityId,
            productId: p.testProductId,
            quantity: blank(p.testQuantity) ? 1 : p.testQuantity,
            fromLocationSeqId: p.testFromLocationSeqId || null,
            lotId: p.testLotId || null,
            asOfDate: p.testAsOfDate || null
        }
        ec.message.pushErrors()
        try {
            const resolved = ec.service
                .sync()
                .name("mantle.facility.PutawayServices.resolve#Destination")
                .parameters(parameters)
                .requireNewTransaction(true)
                .call()
            if (ec.message.hasError()) answer.testError = ec.message.getErrorsString()
            else
                answer.test = {
                    locationSeqId: resolved.locationSeqId || null,
                    summaryText: resolved.locationSeqId
                        ? "Put away at " + resolved.explanation
                        : resolved.reasonText + "; the stock stays where it is",
                    candidates: Array.from(resolved.candidates || []).map(row =>
                        Object.assign({}, row, {
                            resultText: row.chosen ? "Suggested" : row.ok ? "Fits" : "Refused",
                            resultColor: row.chosen ? "positive" : row.ok ? "info" : "negative"
                        })
                    )
                }
        } catch (error) {
            answer.testError = String(error?.message || error).replace(/^(Error: )+/, "")
        } finally {
            ec.message.clearErrors()
            ec.message.popErrors()
        }
    }
    return answer
}

// The rule forms' options: product categories and the facility's areas, searched by term ignoring case, with the selected
// value's label. Refuses an unknown choice.
function choices(p) {
    const userScope = warehouse.required(warehouse.scope())
    const term = String(p.term || "").trim()
    const like = (field, value) =>
        cf()
            .makeCondition(field, "like", "%" + value.replace(/[\\%_]/g, "\\$&") + "%")
            .ignoreCase()
    const sources = {
        // the categories of the user's organizations, and those of none
        categories: () => {
            const owners = userScope.facilityOwnerIds
            const ownCategory = row =>
                !owners || !row.ownerPartyId || row.ownerPartyId === "_NA_" || owners.includes(row.ownerPartyId)
            let query = find("mantle.product.category.ProductCategory").orderBy("categoryName").limit(choiceLimit)
            if (owners)
                query = query.condition(
                    cf().makeCondition(
                        [
                            cf().makeCondition("ownerPartyId", "is-null", null),
                            cf().makeCondition("ownerPartyId", "in", owners.concat(["_NA_"]))
                        ],
                        "or"
                    )
                )
            if (term)
                query = query.condition(cf().makeCondition([like("categoryName", term), like("productCategoryId", term)], "or"))
            const options = Array.from(query.list()).map(row => ({
                value: row.productCategoryId,
                label: row.categoryName || row.productCategoryId
            }))
            if (!blank(p.selected) && !options.some(row => row.value === p.selected)) {
                const row = one("mantle.product.category.ProductCategory", {productCategoryId: p.selected})
                if (row && ownCategory(row))
                    options.push({value: row.productCategoryId, label: row.categoryName || row.productCategoryId})
            }
            return options
        },
        areas: () => {
            const facility = facilityOf(userScope, p.facilityId)
            if (!facility) return []
            let query = find("mantle.facility.FacilityLocation", {facilityId: facility.facilityId})
                .condition("areaId", "is-not-null", null)
                .selectField("areaId")
                .distinct(true)
                .orderBy("areaId")
                .limit(choiceLimit)
            if (term) query = query.condition(like("areaId", term))
            return Array.from(query.list()).map(row => ({value: row.areaId, label: "Area " + row.areaId}))
        }
    }
    if (!sources[p.choice]) throw new Error("Unknown putaway choice " + p.choice)
    return {options: sources[p.choice]()}
}

const operations = {putawayContext, queueCounts, ruleContext, choices}
;({
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Warehouse putaway operation " + op)
        return operations[op](parameters)
    }
})
