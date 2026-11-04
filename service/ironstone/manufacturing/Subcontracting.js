// The Manufacturing context of the shared Supplier360 (impl-manufacturing P14; design-manufacturing Supplier360, crosscut
// §3.3 Manufacturing row): a supplier of the user's organizations' outside processing, with its contact record, and its
// subcontract orders, the outside-processing operations whose service it does
// (mantle.work.ProductionServices.find#SubcontractOperations, which checks its own permission and leaves out the price for a
// user who may not read it). Prices, agreements and money stay with their grants; nothing here writes.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const {one, rows, denied} = lib
const manufacturing = ec.resource.script("component://mr-boss/service/ironstone/manufacturing/Manufacturing.js")

// A supplier the user may read here: a party in the Supplier role, not an organization of the user's, not disabled or
// another user's private contact.
function supplierOf(partyId) {
    const party = partyId ? one("mantle.party.Party", {partyId}) : null
    const visible =
        party &&
        party.disabled !== "Y" &&
        (!party.privateOwnerUserId || party.privateOwnerUserId === ec.user.userId) &&
        !!one("mantle.party.PartyRole", {partyId, roleTypeId: "Supplier"}) &&
        !one("mantle.party.PartyRole", {partyId, roleTypeId: "OrgInternal"})
    if (!visible) denied("SUPPLIER_UNAVAILABLE", "Supplier " + (partyId || "") + " is not available")
    return party
}
function supplierContext(p) {
    manufacturing.required()
    const party = supplierOf(p.vendorPartyId)
    let contacts = {}
    try {
        contacts = lib.call("ironstone.commons.ContactServices.get#ContactRecord", {partyId: party.partyId})
    } catch (error) {
        ec.logger.warn("Supplier " + party.partyId + " contact record: " + error.message)
    }
    let found = {operationList: []}
    try {
        found = lib.call("mantle.work.ProductionServices.find#SubcontractOperations", {
            supplierPartyId: party.partyId,
            includeClosed: true,
            pageSize: 100
        })
    } catch (error) {
        ec.logger.warn("Supplier " + party.partyId + " subcontract orders: " + error.message)
    }
    return {
        supplier: {
            partyId: party.partyId,
            supplierName: lib.partyNames([party.partyId])[party.partyId] || party.partyId,
            canEditContact: false
        },
        contactRows: contacts.contactMechList || [],
        addressRows: contacts.addressList || [],
        roleRows: rows("mantle.party.PartyRole", {partyId: party.partyId}).map(role => ({roleTypeId: role.roleTypeId})),
        subcontractRows: Array.from(found.operationList || [])
    }
}

const operations = {supplierContext}
;({
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Manufacturing subcontracting operation " + op)
        return operations[op](parameters || {})
    }
})
