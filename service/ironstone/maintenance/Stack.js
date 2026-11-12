// Maintenance's stack providers in BOSS (design-maintenance §1.4 Comms hooks; impl-maintenance P19), declared on the Maintenance root
// (screen/Maintenance.xml shell-providers) and answered by ironstone.maintenance.StackServices as the user under the root's
// authorization:
//
// - record-lookup (maintenance.records): Comms' record cards of work orders, equipment and facilities, each through Maintenance's
//   record check (Maintenance.js recordOf: Mantle's scope, a technician their assigned work) and opening its Maintenance screen;
//   a record Maintenance does not admit is left to the other providers. search finds them through the palette's scoped finds,
//   links the Maintenance links a message names. A card names the record, its organization, target and state: no cost.
// - call-context (maintenance.work): for a ringing call, the caller organization's open work orders (those it is the service
//   organization of, for a caller of one of the user's organizations, and those on equipment it owns, for a customer) and its
//   equipment under repair (an asset of an open work order in progress), only what the user's Maintenance scope reads (Mantle's
//   find#MaintenanceWorkOrders as the user). No cost: the rows carry none.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const maintenance = ec.resource.script("component://mr-boss/service/ironstone/maintenance/Maintenance.js")
const {find, one} = lib

const WORK = "mantle.work.effort.WorkEffort"
const ASSET = "mantle.product.asset.Asset"
const FACILITY = "mantle.facility.Facility"
const kindOfEntity = {[WORK]: "workOrder", [ASSET]: "asset", [FACILITY]: "facility"}
const typeLabels = {workOrder: "Work order", asset: "Equipment", facility: "Facility"}
const icons = {workOrder: "sym_o_handyman", asset: "sym_o_build", facility: "sym_o_domain"}
const linkPatterns = [
    {
        entity: WORK,
        pattern: /\/qapps\/Maintenance\/WorkOrders\/WorkOrderDetail\?(?:[^"'\s<>]*&(?:amp;)?)?workEffortId=([A-Za-z0-9_.-]+)/g
    },
    {
        entity: ASSET,
        pattern: /\/qapps\/Maintenance\/Equipment\/EquipmentDetail\?(?:[^"'\s<>]*&(?:amp;)?)?assetId=([A-Za-z0-9_.-]+)/g
    },
    {
        entity: FACILITY,
        pattern: /\/qapps\/Maintenance\/Facilities\/FacilityDetail\?(?:[^"'\s<>]*&(?:amp;)?)?facilityId=([A-Za-z0-9_.-]+)/g
    }
]
const callRecordLimit = 20
const callWorkLimit = 10
const callAssetLimit = 10
const L = words => ec.l10n.localize(words)

// A record of a lookup kind Maintenance admits the user to, as {kind, recordId, label, detail, url, status}; null otherwise.
function admitted(userScope, entityName, recordId) {
    let name = String(entityName || "")
    try {
        name = ec.entity.makeValue(name).getEntityName()
    } catch (error) {
        return null
    }
    const kind = kindOfEntity[name]
    if (!kind || !recordId) return null
    let found
    try {
        found = maintenance.recordOf(userScope, kind, String(recordId))
    } catch (error) {
        return null
    }
    let status = null
    if (kind === "workOrder") {
        const root = one(WORK, {workEffortId: found.rootWorkEffortId || recordId})
        status = root ? one("moqui.basic.StatusItem", {statusId: root.statusId})?.description || root.statusId : null
    }
    return {
        kind,
        entityName: name,
        recordId: String(recordId),
        label: found.label,
        detail: found.detail,
        url: maintenance.recordUrl(kind, found.rootWorkEffortId || recordId),
        status
    }
}
function lookup(p) {
    const empty = {recordList: [], card: null, optionList: []}
    if (!ec.user.userId) return empty
    const userScope = maintenance.scope()
    if (!userScope.read) return empty
    if (p.operation === "search") {
        const text = String(p.text || "").trim()
        if (!text) return empty
        const limit = Math.max(1, Math.min(20, Number(p.limit || 10)))
        const optionList = []
        for (const definition of maintenance.searchFinds.filter(item => ["workOrder", "asset", "facility"].includes(item.kind))) {
            let rows = []
            try {
                rows = definition.rows(userScope, text, limit)
            } catch (error) {
                ec.logger.error("Maintenance record lookup " + definition.kind + " search failed: " + error.message)
            }
            for (const row of rows)
                if (optionList.length < limit)
                    optionList.push({
                        value: row.recordEntity + "|" + row.recordId,
                        label: [row.title, row.subtitle].filter(Boolean).join(" · ")
                    })
        }
        return Object.assign(empty, {optionList})
    }
    if (p.operation === "info") {
        const recordList = []
        for (const wanted of Array.from(p.records || [])) {
            const record = admitted(userScope, wanted.recordEntityName, wanted.recordId)
            if (!record) continue
            recordList.push({
                recordEntityName: wanted.recordEntityName,
                recordId: wanted.recordId,
                entity: record.entityName,
                visible: true,
                title: record.label,
                typeLabel: L(typeLabels[record.kind]),
                url: record.url,
                icon: icons[record.kind]
            })
        }
        return Object.assign(empty, {recordList})
    }
    if (p.operation === "card") {
        const record = admitted(userScope, p.recordEntityName, p.recordId)
        if (!record) return empty
        return Object.assign(empty, {
            card: {
                entityName: record.entityName,
                id: record.recordId,
                title: L(typeLabels[record.kind]) + " " + record.recordId + ": " + record.label,
                status: record.status,
                url: record.url,
                lines: [record.detail].filter(Boolean)
            }
        })
    }
    if (p.operation === "links") {
        const body = String(p.body || "")
        const seen = new Set()
        const recordList = []
        for (const {entity, pattern} of linkPatterns)
            for (const match of body.matchAll(pattern)) {
                const key = entity + "|" + match[1]
                if (seen.has(key) || recordList.length >= 5) continue
                seen.add(key)
                recordList.push({entity, id: match[1]})
            }
        return Object.assign(empty, {recordList})
    }
    throw new Error("Unknown record lookup " + p.operation)
}

// ===== call-context =====
// The parties a number belongs to (the last seven digits, then the whole number), as Customer Service's call context finds them.
function partiesOfNumber(number) {
    const wanted = String(number || "").replace(/[^0-9+]/g, "")
    const digits = wanted.replace(/\D/g, "")
    if (digits.length < 7) return []
    const factory = ec.entity.conditionFactory
    const last7 = digits.slice(-7)
    const written = [last7, ...["-", " ", "."].map(separator => last7.slice(0, 3) + separator + last7.slice(3))]
    const partyIds = new Set()
    for (const row of find("mantle.party.contact.PartyContactMechTelecomNumber")
        .condition(
            factory.makeCondition(
                written.map(form => factory.makeCondition("contactNumber", "like", "%" + form + "%")),
                "or"
            )
        )
        .conditionDate("fromDate", "thruDate", ec.user.nowTimestamp)
        .limit(60)
        .list()) {
        const local = String(row.areaCode || "") + String(row.contactNumber || "")
        const countryCode = String(row.countryCode || "").replace(/\D/g, "")
        const e164 = countryCode ? "+" + countryCode + local.replace(/\D/g, "") : null
        if (!e164 || e164 === wanted || e164.replace(/\D/g, "").endsWith(digits.slice(-10))) partyIds.add(row.partyId)
    }
    return Array.from(partyIds)
}
// The organizations of the caller's parties: an organization itself, and the organizations a person works for or is a contact of.
function organizationsOf(partyIds) {
    const found = new Set()
    for (const partyId of partyIds) {
        if (one("mantle.party.Organization", {partyId})) found.add(partyId)
        for (const row of find("mantle.party.PartyRelationship", {fromPartyId: partyId})
            .condition("relationshipTypeEnumId", "in", ["PrtEmployee", "PrtAgent", "PrtContact"])
            .conditionDate("fromDate", "thruDate", ec.user.nowTimestamp)
            .limit(20)
            .list())
            if (one("mantle.party.Organization", {partyId: row.toPartyId})) found.add(row.toPartyId)
    }
    return Array.from(found).slice(0, 5)
}
// Mantle's work order list as the user (their scope and permissions), or none when it refuses.
function workOrders(parameters) {
    try {
        return Array.from(lib.probe("mantle.work.MaintenanceServices.find#MaintenanceWorkOrders", parameters).workOrderList || [])
    } catch (error) {
        return []
    }
}
function callContext(p) {
    const empty = {contactList: [], recordList: []}
    if (!ec.user.userId) return empty
    const userScope = maintenance.scope()
    if (!userScope.read || !userScope.mantle.capabilities.workRead) return empty
    const organizations = organizationsOf(partiesOfNumber(p.number))
    if (!organizations.length) return empty
    const rows = new Map()
    // the caller's own organization's work, when it is one Maintenance serves for the user
    for (const organizationPartyId of organizations)
        if (one("mantle.party.PartyRole", {partyId: organizationPartyId, roleTypeId: "OrgInternal"}))
            for (const row of workOrders({organizationPartyId, pageSize: callWorkLimit})) rows.set(row.workEffortId, row)
    // the work on the equipment the caller's organization owns (a customer's)
    const assetIds = Array.from(
        find(ASSET)
            .condition("ownerPartyId", "in", organizations)
            .condition("assetTypeEnumId", "not-in", ["AstTpInventory", "AstTpSupplies"])
            .selectField("assetId")
            .limit(callAssetLimit)
            .list()
    ).map(row => row.assetId)
    for (const assetId of assetIds) for (const row of workOrders({assetId, pageSize: 5})) rows.set(row.workEffortId, row)
    const recordList = []
    const repaired = new Map()
    for (const row of rows.values()) {
        if (recordList.length >= callRecordLimit) break
        recordList.push({
            title: [L("Work order") + " " + row.workEffortId + ": " + row.workEffortName, row.targetName]
                .filter(Boolean)
                .join(" · "),
            status: row.statusText,
            url: maintenance.recordUrl("workOrder", row.workEffortId)
        })
        if (row.assetId && row.statusId === "WeInProgress" && !repaired.has(row.assetId)) repaired.set(row.assetId, row)
    }
    for (const row of repaired.values()) {
        if (recordList.length >= callRecordLimit) break
        recordList.push({
            title: L("Equipment under repair") + ": " + (row.targetName || row.assetId),
            status: L("Work order") + " " + row.workEffortId,
            url: maintenance.recordUrl("asset", row.assetId)
        })
    }
    return {contactList: [], recordList}
}

const operations = {lookup, callContext}
;({
    execute: (op, parameters) => {
        if (!Object.hasOwn(operations, op)) throw new Error("Unknown Maintenance stack operation " + op)
        return operations[op](parameters || {})
    }
})
