// The links of a record on a map (design-crosscut §3.32; mr-moqui docs/tools/Maps.md "Record adapters"): an adapter's answer names
// where its record's links go by route key, never a URL, and the application showing the map resolves them. BOSS's resolution of
// Mantle's keys (mr-mantle docs/MapAdapters.md: partyDetail, facilityDetail, assetDetail), read by screen/Shared/LocalMap.xml under
// the dialog: each to the BOSS screen of the record the user may open, the host app's own first (Maintenance's facility and
// equipment, Maintenance.js recordLink, which checks its scope), else the suite's record-link resolver
// (ironstone.commons.PaletteServices.get#RecordLink: a party to Customer Service's customer or Commons' contact, a facility or an
// asset to Warehouse's, each for a user that app admits). A key with no BOSS screen, a link to the record the map itself shows and
// a record no app opens to the user are left out. A link is data, never authority: the screen it opens checks the user again.
// placeShown (below) tells a host whether a record's map has anything to show the user.
const routes = {
    partyDetail: {entity: "mantle.party.Party", field: "partyId"},
    facilityDetail: {entity: "mantle.facility.Facility", field: "facilityId", maintenance: "facility"},
    assetDetail: {entity: "mantle.product.asset.Asset", field: "assetId", maintenance: "asset"}
}
// at most this many of an answer's links are resolved
const MAX_LINKS = 5

function linkUrl(route, id, appRoot) {
    if (appRoot === "Maintenance" && route.maintenance) {
        const found = ec.resource
            .script("component://mr-boss/service/ironstone/maintenance/Maintenance.js")
            .execute("recordLink", {recordType: route.maintenance, recordId: id})
        if (found?.url) return found.url
    }
    return (
        ec.service
            .sync()
            .name("ironstone.commons.PaletteServices.get#RecordLink")
            .parameters({recordEntityName: route.entity, id})
            .call()?.url || null
    )
}

// recordLinks(record, recordKey, appRoot): [{label, url}] for the record of the map's effective configuration (its links of
// {label, route, parameters}), the record's key the map was opened with (a Map or its JSON) and the app root showing it. A failure
// is logged and answers none.
function recordLinks(record, recordKey, appRoot) {
    let shownKey = {}
    try {
        shownKey = (typeof recordKey === "string" ? JSON.parse(recordKey) : recordKey) || {}
    } catch (error) {
        shownKey = {}
    }
    const out = []
    ec.message.pushErrors()
    try {
        for (const link of Array.from(record?.links || []).slice(0, MAX_LINKS)) {
            const route = routes[link?.route]
            const id = route ? String(link.parameters?.[route.field] ?? "") : ""
            if (!id || String(shownKey[route.field] ?? "") === id) continue
            const url = linkUrl(route, id, appRoot)
            if (url) out.push({label: String(link.label || id), url})
        }
        return out
    } catch (error) {
        ec.logger.warn("Map record links not resolved: " + String(error?.message || error))
        return []
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
}
// placeShown(adapterKey, recordKey, addressPurpose): whether a record's map has something to show the user, as its registered
// adapter answers the user (a point, or an address's postal code for the approximate position), so a host offers View map only
// then (a person customer with no readable address opens no empty dialog). The adapter checks the caller itself; a refusal, a
// missing or disabled adapter and a failure (logged) answer false.
function placeShown(adapterKey, recordKey, addressPurpose) {
    ec.message.pushErrors()
    try {
        const adapter = ec.entity
            .find("moqui.maps.MapAdapter")
            .condition("adapterKey", String(adapterKey || ""))
            .useCache(true)
            .disableAuthz()
            .one()
        if (!adapter?.contextServiceName || adapter.disabled === "Y") return false
        const out =
            ec.service
                .sync()
                .name(adapter.contextServiceName)
                .parameters({recordKey: recordKey || {}, addressPurpose: addressPurpose || null})
                .call() || {}
        return !ec.message.hasError() && !out.reasonCode && (!!out.geometry || !!out.postalCode)
    } catch (error) {
        ec.logger.warn("Map place of " + adapterKey + " not read: " + String(error?.message || error))
        return false
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
}
;({routes, recordLinks, placeShown})
