// Commerce promotions (impl-commerce P7; design-commerce §7, crosscut §3.28): the shared promotion screens' services in
// Commerce's context by store scope (the manager reads and changes the demo store's promotions, the reader reads them, the
// other organization's manager is refused them, the customers a code may be limited to), and PromotionDetail's one qvt render
// under Commerce (the header, the rule's values, the limits form, the codes link). The promotion and limit rules themselves
// are Mantle's (StorePromotions). The walk is the acceptance CommercePromotionsWalk.
// Run: ./moq test mr-boss --spec Commerce/CommercePromotions
const lib = ec.resource.script("component://mr-boss/test/Commerce/CommerceSpecLib.js")
const {ids, users, asUser, refusal, invoke} = lib
const P = "mantle.product.StorePromotionServices."
// a Mantle call as the user, as a Commerce screen makes it (its authorization inherited from the screen)
const as = (user, service, parameters = {}) => asUser(user, () => invoke(P + service, parameters), false)
const refused = (user, service, parameters = {}) => asUser(user, () => refusal(P + service, parameters), false)
const code = message => (/([A-Z][A-Z0-9_]+):/.exec(message || "") || [])[1] || (message ? "ERROR" : "")

spec({
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "the demo store's promotions by store scope: the manager changes them, the reader reads them, the other organization is refused",
    {
        when() {
            // the same unchanged save for each user, so a refusal is the permission's or the scope's, not a value's
            const save = {storePromotionId: "PopcBuyGet", sequenceNum: 10}
            const managerFind = as(users.manager, "find#Promotions", {pageSize: 100}).promotions || []
            const otherFind = as(users.services, "find#Promotions", {pageSize: 100}).promotions || []
            return {
                managerIds: managerFind.map(row => row.storePromotionId),
                managerStores: Array.from(new Set(managerFind.map(row => row.productStoreId))),
                otherIds: otherFind.map(row => row.storePromotionId),
                readerRead: as(users.read, "get#Promotion", {storePromotionId: "PopcBuyGet"}),
                managerSave: refused(users.manager, "store#Promotion", save),
                readerSave: refused(users.read, "store#Promotion", save),
                otherSave: refused(users.services, "store#Promotion", save),
                otherRead: refused(users.services, "get#Promotion", {storePromotionId: "PopcBuyGet"}),
                otherCodes: refused(users.services, "find#PromoCodes", {storePromotionId: "PopcBuyGet"}),
                customers: asUser(users.manager, () =>
                    invoke("ironstone.commerce.ContextServices.get#Choices", {
                        choice: "customers",
                        term: "",
                        selected: ids.customerId
                    })
                ).options
            }
        },
        then(r) {
            r.managerIds.includes("PopcBuyGet")
            r.managerIds.includes("PopcNewCustomer")
            !r.managerStores.includes(ids.otherStoreId)
            !r.otherIds.includes("PopcBuyGet")
            r.readerRead.canEdit == false
            r.readerRead.promotion.storeName == "Ziziwork Retail Store"
            r.managerSave == ""
            code(r.readerSave) == "PERMISSION_DENIED"
            code(r.otherSave) == "RECORD_UNAVAILABLE"
            code(r.otherRead) == "RECORD_UNAVAILABLE"
            code(r.otherCodes) == "RECORD_UNAVAILABLE"
            r.customers.some(option => option.value == ids.customerId)
        }
    }
)

// PromotionDetail under Commerce, rendered once (qvt): the header with its state, the rule's values, the limits form for the
// manager and the link to the promotion's codes
feature("PromotionDetail under Commerce shows the promotion's header, rule values, limits and codes", {
    when() {
        return asUser(users.manager, () => lib.page("Promotions/PromotionDetail", {storePromotionId: "PopcBuyGet"}))
    },
    then(result) {
        result.status == 200
        result.errors == []
        result.output.includes("Buy 1 Get 1 Half Off")
        result.output.includes("Buy X Get Y at Z% Discount")
        result.output.includes("discountPercent")
        result.output.includes("Uses per customer")
        result.output.includes("Reason for a change")
        result.output.includes("Promotion codes (2)")
        result.output.includes("Redemptions")
        !result.output.includes("Not available")
    }
})
