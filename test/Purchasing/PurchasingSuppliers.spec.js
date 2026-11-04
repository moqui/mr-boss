// Purchasing's suppliers (impl-purchasing P2; design-purchasing Suppliers and Supplier360): the supplier list's buying
// profile columns and finds (find#Suppliers), the duplicate candidates a new supplier is checked against
// (find#SupplierDuplicates), and Supplier360's Purchasing branch in its one render (html: the supplier check of a blocked
// supplier, the buying profile with the finance fields read only, the category and the profile's history). The rules of the
// profile, policy and supplier check are Mantle's (mr-mantle test/order/PurchasePolicy); the access cases are PurchasingAccess's.
// Run: ./moq test mr-boss --spec PurchasingSuppliers
const lib = ec.resource.script("component://mr-boss/test/Purchasing/PurchasingSpecLib.js")
const {ids, users, asUser, invoke} = lib
const supplierService = "ironstone.purchasing.SupplierServices."
const partyIds = result => Array.from(result.supplierRows || result.duplicateRows || []).map(row => row.partyId)

spec({
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("the supplier list shows each supplier's buying profile and finds by approval, block, category and name", {
    when() {
        return asUser(users.read, () => {
            const find = parameters => invoke(supplierService + "find#Suppliers", parameters)
            const all = find({pageSize: 50})
            return {
                pending: partyIds(find({approvalStatusId: "SupaPending"})),
                blocked: partyIds(find({blocked: "Y"})),
                packaging: partyIds(find({partyClassificationId: "BOSS_PUR_CAT_PACKAGING"})),
                named: partyIds(find({text: "halvorsen"})),
                blockedRow: all.supplierRows.find(row => row.partyId === ids.blockedSupplierId),
                pendingRow: all.supplierRows.find(row => row.partyId === ids.pendingSupplierId),
                organizationName: all.organizationName
            }
        })
    },
    then({pending, blocked, packaging, named, blockedRow, pendingRow, organizationName}) {
        // other specs add suppliers in the same database (a duplicate created anyway), so each find names the demo's
        pending.includes(ids.pendingSupplierId) && !pending.includes(ids.blockedSupplierId)
        blocked.includes(ids.blockedSupplierId) && !blocked.includes(ids.pendingSupplierId)
        packaging.includes(ids.pendingSupplierId) && !packaging.includes(ids.blockedSupplierId)
        named.includes(ids.blockedSupplierId) && !named.includes(ids.pendingSupplierId)
        blockedRow.blockText.includes("Quality hold")
        blockedRow.approvalText == "Approved"
        pendingRow.approvalText == "Pending approval"
        pendingRow.approvalColor == "warning"
        organizationName.includes("Ziziwork Retail")
    }
})

feature("a new supplier's duplicates are the suppliers in scope by name or email, never another organization's", {
    when() {
        const duplicates = (user, parameters) =>
            asUser(user, () => partyIds(invoke(supplierService + "find#SupplierDuplicates", parameters)))
        return {
            byName: duplicates(users.buyer, {organizationName: "brightline"}),
            byEmail: duplicates(users.buyer, {emailAddress: "ORDERS@ziddleman.example.com"}),
            none: duplicates(users.buyer, {organizationName: "No Such Supplier Name"}),
            otherOrganization: duplicates(users.services, {organizationName: "brightline"})
        }
    },
    then({byName, byEmail, none, otherOrganization}) {
        byName == [ids.supplierId]
        byEmail == [ids.sharedSupplierId]
        none == []
        otherOrganization == []
    }
})

feature(
    "Supplier360 in Purchasing shows a blocked supplier's check, its buying profile with the terms read only, and its history",
    {
        when() {
            return asUser(users.buyer, () =>
                lib.page("Suppliers/Supplier360/Buying", {vendorPartyId: ids.blockedSupplierId}, "html")
            )
        },
        then({status, errors, output}) {
            status == 200
            errors == []
            output.includes("Purchasing from Halvorsen Metals is blocked: Quality hold")
            output.includes("Buying profile of Ziziwork Retail")
            output.includes("Change profile")
            // P4: the header's Approval menu offers a buyer the suspension of a supplier not suspended
            output.includes("Suspend")
            output.includes("(set by finance)")
            output.includes("Raw metals")
            output.includes("Purchasing demo: blocked supplier")
        }
    }
)
