// Record maps (design-crosscut §3.32; screen/Shared/LocalMap.xml, the framework's local-map dialog under a BOSS app root by the
// thin-wrapper rule; service/ironstone/shared/MapLinks.js): what BOSS adds, with artifact authorization on, on the demo data
// (MaintenanceSpecLib). Services' resource administrator saves the site's location through Maintenance/LocalMap's storeLocation,
// which calls Mantle's facility adapter, and its reader sees the place in View map's dialog (the one render of the dialog, html)
// with no Choose location and no Open in Maps; the mount offers no archive source of its own. BOSS's grant of PARTY_LOCATION_EDIT:
// a contact admin may choose a customer's address location, a Sales account editor of the same organization may not. The van's
// map (no point of its own: where its facility is) links its facility to Maintenance's FacilityDetail, and not the van itself.
// Mantle's rules of who reads and writes a place (another organization, a reader's save, a stale version) are mr-mantle's
// MapPlaces spec. The site's location is put back afterwards; the contact admin is a spec user made once.
// Run: ./moq test mr-boss --spec RecordMap
const lib = ec.resource.script("component://mr-boss/test/Maintenance/MaintenanceSpecLib.js")
const {ids, users, asUser, system, page} = lib
const maintenance = "component://mr-boss/screen/Maintenance.xml"
const facilityKey = JSON.stringify({facilityId: ids.siteId})

// the record of the map as the user (the framework's get#EffectiveConfig, which asks the adapter as the user): {record, error}
function mapRecord(adapterKey, recordKey) {
    const out = ec.service
        .sync()
        .name("org.moqui.maps.MapServices.get#EffectiveConfig")
        .parameters({adapterKey, recordKey, recordLayers: false})
        .requireNewTransaction(true)
        .call()
    ec.message.clearErrors()
    const config = out?.config || {}
    return {
        record: config.record || null,
        error: Array.from(config.layerErrors || []).find(error => error.id === "record") || null
    }
}
// Save location as the dialog posts it, under Maintenance's mount: the errors ("" when saved)
function storeLocation(recordVersion, latitude, longitude) {
    const out = ec.screen
        .makeTest()
        .rootScreen(maintenance)
        .render(
            "LocalMap/storeLocation",
            {adapterKey: "facility", recordKey: facilityKey, recordVersion: recordVersion || "", latitude, longitude},
            "post"
        )
    const errors = Array.from(out.errorMessages || []).join(" | ")
    ec.message.clearErrors()
    return errors
}
const siteRow = () => system(() => ec.entity.find("mantle.facility.Facility").condition("facilityId", ids.siteId).one())
// a contact admin of Ziziwork Retail (BOSS_CONTACT_ADMIN, which holds PARTY_LOCATION_EDIT), made once
const CONTACT_ADMIN = "boss.map.contacts"
function contactAdmin() {
    system(() => {
        if (ec.entity.find("moqui.security.UserAccount").condition("username", CONTACT_ADMIN).one()) return
        const partyId = "BOSS_MAP_CONTACTS"
        const since = "2026-01-01 00:00:00"
        call("create#mantle.party.Party", {partyId, partyTypeEnumId: "PtyPerson"})
        call("create#mantle.party.Person", {partyId, firstName: "Map", lastName: "Contacts"})
        call("create#mantle.party.PartyRelationship", {
            relationshipTypeEnumId: "PrtEmployee",
            fromPartyId: partyId,
            toPartyId: ids.otherOrganizationId,
            toRoleTypeId: "OrgInternal",
            fromDate: since
        })
        call("create#moqui.security.UserAccount", {
            userId: partyId,
            username: CONTACT_ADMIN,
            partyId,
            currentPassword: "16ac58bbfa332c1c55bd98b53e60720bfa90d394",
            passwordHashType: "SHA"
        })
        for (const userGroupId of ["BOSS_USERS", "BOSS_CONTACT_ADMIN"])
            call("create#moqui.security.UserGroupMember", {userGroupId, userId: partyId, fromDate: since})
    })
}

spec({
    setupSpec() {
        login("john.doe")
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "a facility's map under Maintenance: the resource administrator's Save location goes through Mantle's adapter, and the reader sees the place with neither Choose location nor Open in Maps",
    {
        when() {
            const original = siteRow().geoPointId || null
            try {
                const editor = asUser(users.resources, () => {
                    const read = mapRecord("facility", {facilityId: ids.siteId})
                    return {
                        actions: Array.from(read.record?.permittedActions || []),
                        saved: storeLocation(read.record?.recordVersion, "41.881900", "-87.627800")
                    }
                })
                const savedPointId = siteRow().geoPointId || null
                const savedPoint = savedPointId
                    ? system(() => ec.entity.find("moqui.basic.GeoPoint").condition("geoPointId", savedPointId).one())
                    : null
                const dialog = asUser(users.reader, () =>
                    page("LocalMap", {adapterKey: "facility", recordKey: facilityKey}, "html")
                )
                // the archive source stays the framework's route: none under the mount
                const source = asUser(users.reader, () => {
                    const out = ec.screen
                        .makeTest()
                        .rootScreen(maintenance)
                        .render("LocalMap/source", {layerId: "X", revision: "1"}, null)
                    const errors = Array.from(out.errorMessages || []).join(" | ")
                    ec.message.clearErrors()
                    return errors
                })
                return {editor, savedPointId, savedPoint, dialog, source}
            } finally {
                // the site's location as it was: the point Mantle made and its provenance removed
                system(() => {
                    const made = siteRow().geoPointId || null
                    call("update#mantle.facility.Facility", {facilityId: ids.siteId, geoPointId: original})
                    if (made && made !== original) {
                        ec.entity.find("mantle.party.contact.GeoPointProvenance").condition("geoPointId", made).deleteAll()
                        ec.entity.find("moqui.basic.GeoPoint").condition("geoPointId", made).deleteAll()
                    }
                })
            }
        },
        then({editor, savedPointId, savedPoint, dialog, source}) {
            editor.actions.includes("chooseLocation")
            editor.saved == ""
            savedPointId != null
            Number(savedPoint.latitude).toFixed(4) == "41.8819"
            Number(savedPoint.longitude).toFixed(4) == "-87.6278"
            dialog.status == 200
            dialog.errors.length == 0
            dialog.output.includes("41.8819")
            !dialog.output.includes("Save location")
            !dialog.output.includes("Open in Maps")
            source.includes("screen path not found")
        }
    }
)

feature("a contact admin may choose a customer's address location; a Sales account editor of the same organization may not", {
    when() {
        contactAdmin()
        const address = {contactMechId: "BOSS_SAL_WINGTIP_ADDR"}
        const actions = username =>
            asUser(username, () => Array.from(mapRecord("postalAddress", address).record?.permittedActions || []))
        return {admin: actions(CONTACT_ADMIN), salesRep: actions("sales.rep")}
    },
    then({admin, salesRep}) {
        admin.includes("chooseLocation")
        salesRep.includes("view")
        !salesRep.includes("chooseLocation")
    }
})

feature(
    "an equipment map's links go to the BOSS screens the user may open: the van's facility to Maintenance's FacilityDetail, not the van itself",
    {
        when() {
            return asUser(users.reader, () => {
                const read = mapRecord("asset", {assetId: ids.vanId})
                const links = ec.resource
                    .script("component://mr-boss/service/ironstone/shared/MapLinks.js")
                    .recordLinks(read.record, JSON.stringify({assetId: ids.vanId}), "Maintenance")
                return {routes: Array.from(read.record?.links || []).map(link => link.route), links}
            })
        },
        then({routes, links}) {
            routes.includes("assetDetail")
            routes.includes("facilityDetail")
            links.length == 1
            links[0].url == "/qapps/Maintenance/Facilities/FacilityDetail?facilityId=" + ids.siteId
        }
    }
)
