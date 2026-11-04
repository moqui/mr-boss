// Purchasing P2's "usable when" (impl-purchasing P2), through the screens' transitions with artifact authorization on: a buyer
// creates a supplier organization, and a duplicate candidate brings back the existing supplier instead; the buyer is assigned
// to the supplier from a date and sets its currency and Incoterm, and is refused its payment term and self-billing flag; a
// dated purchase block shows on Supplier360 and cancels no order; PriceExplain explains Ziddleman's tier for Retail, and a
// user without supplier-price read sees none; an administrator starts a buying policy row from a date and the earlier row
// stays with its history. The rules themselves are Mantle's PurchasePolicy spec and PurchasingAccess's.
// Run: ./moq accept mr-boss --spec PurchasingSuppliersWalk
const lib = ec.resource.script("component://mr-boss/test/Purchasing/PurchasingSpecLib.js")
const {ids, users, asUser, system, refusal} = lib
const webroot = "component://webroot/screen/webroot.xml"
const one = (entity, key) => system(() => ec.entity.find(entity).condition(key).one())
const rows = (entity, key) => system(() => Array.from(ec.entity.find(entity).condition(key).list()))
// a transition of a Purchasing screen as the user posts it: its status, errors and redirect
function post(user, path, parameters) {
    return asUser(user, () => {
        const rendered = ec.screen
            .makeTest()
            .rootScreen(webroot)
            .render("apps/Purchasing/" + path, parameters, "post")
        const result = {status: rendered.status, errors: Array.from(rendered.errorMessages || []).join(" | ")}
        ec.message.clearErrors()
        return result
    })
}
const minutesFromNow = count => new Date(Number(ec.user.nowTimestamp) + count * 60000)

spec({
    stepwise: true,
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("a buyer creates a supplier organization, and a duplicate candidate brings back the existing supplier instead", {
    when() {
        const duplicate = post(users.buyer, "Suppliers/SupplierList/createSupplier", {organizationName: "Brightline Components"})
        const brightlines = rows("mantle.party.Organization", {organizationName: "Brightline Components"}).length
        const candidates = asUser(users.buyer, () =>
            lib.page("Suppliers/SupplierList", {newOrganizationName: "Brightline Components"}, "html")
        )
        const created = post(users.buyer, "Suppliers/SupplierList/createSupplier", {
            organizationName: "Walkthrough Plastics",
            emailAddress: "sales@walkthrough-plastics.example.com",
            partyClassificationId: "BOSS_PUR_CAT_PACKAGING"
        })
        const organization = rows("mantle.party.Organization", {organizationName: "Walkthrough Plastics"})[0]
        const party = organization ? one("mantle.party.Party", {partyId: organization.partyId}) : null
        const profile = organization
            ? rows("mantle.party.supplier.SupplierProfile", {
                  organizationPartyId: ids.organizationId,
                  supplierPartyId: organization.partyId
              })[0]
            : null
        return {duplicate, brightlines, candidates, created, party, profile}
    },
    then({duplicate, brightlines, candidates, created, party, profile}) {
        duplicate.errors == ""
        brightlines == 1
        candidates.output.includes("Is Brightline Components one of these suppliers?")
        candidates.output.includes("vendorPartyId=" + ids.supplierId)
        created.errors == ""
        party.ownerPartyId == ids.organizationId
        // Retail's buying policy requires supplier approval
        profile.approvalStatusId == "SupaPending"
    }
})

feature("the buyer is assigned to the supplier from a date and sets its currency and Incoterm, and is refused its terms", {
    when() {
        const vendorPartyId = ids.pendingSupplierId
        const buyer = post(users.buyer, "Suppliers/Supplier360/Buying/storeBuyer", {
            vendorPartyId,
            organizationPartyId: ids.organizationId,
            buyerPartyId: "BOSS_PUR_BUYER",
            fromDate: minutesFromNow(1)
        })
        const profile = post(users.buyer, "Suppliers/Supplier360/Buying/storeProfile", {
            vendorPartyId,
            organizationPartyId: ids.organizationId,
            currencyUomId: "EUR",
            incotermEnumId: "TtCIF",
            approvalStatusId: "SupaPending",
            changeReason: "Quoted in euros"
        })
        // the service's own check, past the screens (which offer the buyer no terms field)
        const terms = asUser(users.buyer, () =>
            system(() =>
                refusal("mantle.party.SupplierServices.store#SupplierProfile", {
                    organizationPartyId: ids.organizationId,
                    supplierPartyId: vendorPartyId,
                    settlementTermId: "Net30",
                    selfBillingIndicator: "Y"
                })
            )
        )
        const relationship = rows("mantle.party.PartyRelationship", {
            relationshipTypeEnumId: "PrtSupplier",
            toPartyId: vendorPartyId,
            fromPartyId: "BOSS_PUR_BUYER"
        })[0]
        const profiles = rows("mantle.party.supplier.SupplierProfile", {
            organizationPartyId: ids.organizationId,
            supplierPartyId: vendorPartyId
        })
        const current = profiles.find(row => row.thruDate == null)
        return {buyer, profile, terms, relationship, profiles: profiles.length, current}
    },
    then({buyer, profile, terms, relationship, profiles, current}) {
        buyer.errors == ""
        relationship.fromRoleTypeId == "Buyer"
        profile.errors == ""
        current.currencyUomId == "EUR"
        current.incotermEnumId == "TtCIF"
        // the earlier row stays, ended
        profiles == 2
        terms.includes("PERMISSION_DENIED")
    }
})

feature("a dated purchase block shows on Supplier360 and cancels no order", {
    when() {
        const blocked = post(users.buyer, "Suppliers/Supplier360/Buying/storeProfile", {
            vendorPartyId: ids.supplierId,
            organizationPartyId: ids.organizationId,
            currencyUomId: "USD",
            incotermEnumId: "TtEXW",
            approvalStatusId: "SupaApproved",
            purchaseBlockFromDate: minutesFromNow(-1),
            purchaseBlockReason: "Walkthrough credit hold",
            changeReason: "Credit hold"
        })
        const page = asUser(users.read, () => lib.page("Suppliers/Supplier360/Buying", {vendorPartyId: ids.supplierId}, "html"))
        const order = one("mantle.order.OrderHeader", {orderId: ids.orderId})
        return {blocked, page, orderStatus: order.statusId}
    },
    then({blocked, page, orderStatus}) {
        blocked.errors == ""
        page.errors == []
        page.output.includes("Purchasing from Brightline Components is blocked: Walkthrough credit hold")
        orderStatus == "OrderOpen"
    }
})

feature("PriceExplain explains Ziddleman's tier for Retail, and a user without supplier-price read sees none", {
    when() {
        const parameters = {productId: "DEMO_1_1", vendorPartyId: ids.sharedSupplierId, quantity: "100", priceUomId: "USD"}
        return {
            buyer: asUser(users.buyer, () => lib.page("Suppliers/PriceExplain", parameters, "html")),
            reader: asUser(users.read, () => lib.page("Suppliers/PriceExplain", parameters, "html"))
        }
    },
    then({buyer, reader}) {
        buyer.errors == []
        // the 100-unit tier (8.00) selected over the single-unit offer (9.00)
        buyer.output.includes("Selected dated base price")
        buyer.output.includes("DEMO_1_1_CS100")
        reader.errors == []
        reader.output.includes("Supplier prices are not available to you.")
        !reader.output.includes("DEMO_1_1_CS100")
    }
})

feature("an administrator starts a buying policy row from a date, and the earlier row stays with its history", {
    when() {
        const policy = () =>
            asUser(users.admin, () =>
                ec.service
                    .sync()
                    .name("mantle.order.PurchaseServices.get#PurchasePolicy")
                    .parameters({organizationPartyId: ids.organizationId})
                    .disableAuthz()
                    .call()
            )
        const before = policy()
        const stored = post(users.admin, "Settings/PurchasePolicy/storePolicy", {
            organizationPartyId: ids.organizationId,
            expectedFromDate: before.expectedFromDate,
            policyGroup: "controls",
            effectiveFromDate: minutesFromNow(30),
            unapprovedSupplierEnumId: "PusStop",
            changeReason: "Stop unapproved suppliers from next month"
        })
        const after = policy()
        const page = asUser(users.admin, () => lib.page("Settings/PurchasePolicy", {}, "html"))
        return {before, stored, after, page}
    },
    then({before, stored, after, page}) {
        stored.errors == ""
        after.history.length == before.history.length + 1
        // the row in effect now is unchanged until the new one starts
        after.policy.unapprovedSupplierEnumId == "PusWarn"
        after.history[1].thruDate != null
        page.output.includes("Stop unapproved suppliers from next month")
    }
})
