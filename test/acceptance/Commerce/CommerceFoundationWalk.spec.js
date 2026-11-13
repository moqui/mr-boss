// Commerce P1's "usable when" (impl-commerce P1), as an acceptance walk with artifact authorization on: the menu renders for
// each group, and each area of it opens while the others are refused; the reader finds POPC_DEFAULT through the palette and
// not BOSS_COM_DIGITAL; the store-limited staff member sees only POPC_DEFAULT; a forged store id is refused by check#Record
// and the palette; a Projects client and a PASS public account are refused the root and every ironstone.commerce service.
// And the demo the later phases build on: POPC_DEFAULT completed and the two disabled sites with their mounts, ZIZI_DIGITAL's
// with its Forum and the members' paid category the monthly membership's access opens (P15, Shop F107). The rules
// themselves are CommerceAccess's.
// Run: ./moq accept mr-boss --spec CommerceFoundationWalk
const lib = ec.resource.script("component://mr-boss/test/Commerce/CommerceSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, shell} = lib
const context = "ironstone.commerce.ContextServices."
const areas = [
    "Home",
    "Stores",
    "Merchandising",
    "Website",
    "Orders",
    "Customers",
    "Promotions",
    "Integrations",
    "Reports",
    "Settings"
]
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0

feature("the menu renders for each group, its areas open and the others are refused", {
    when() {
        const problems = []
        for (const user of Object.values(users)) {
            const found = shell(user)
            if (found.status != 200 || !found.names.length) problems.push(`${user}'s menu: ${found.status} ${found.names}`)
            for (const area of areas) {
                const expected = found.names.includes(area)
                const rendered = asUser(user, () => lib.page(area, {}, "html"))
                if (opened(rendered) !== expected)
                    problems.push(`${user} ${area}: ${expected ? "refused" : "opened"} ${rendered.status} ${rendered.errors}`)
            }
        }
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("the reader finds POPC_DEFAULT in the palette, not BOSS_COM_DIGITAL; the store-limited member sees only POPC_DEFAULT", {
    when() {
        const problems = []
        const palette = (user, text) =>
            asUser(user, () => invoke(context + "search#Records", {text, limit: 20}).rows.map(row => row.url))
        const home = id => "/qapps/Commerce/Stores/StoreDetail?productStoreId=" + id
        const reader = palette(users.read, "Ziziwork")
        if (!reader.includes(home(ids.storeId))) problems.push(`the reader's palette misses ${ids.storeId}: ${reader}`)
        if (reader.includes(home(ids.otherStoreId)) || palette(users.read, ids.otherStoreId).length)
            problems.push("the reader's palette has the digital store")
        const staff = palette(users.storeStaff, "Ziziwork")
        if (JSON.stringify(staff) !== JSON.stringify([home(ids.storeId)])) problems.push(`the staff member's palette: ${staff}`)
        const services = palette(users.services, "Ziziwork")
        if (JSON.stringify(services) !== JSON.stringify([home(ids.otherStoreId)])) problems.push(`services' palette: ${services}`)
        // the staff member's Home: their store's scope, the unassigned one refused
        asUser(users.storeStaff, () => {
            const own = lib.page("Home", {productStoreId: ids.storeId})
            if (!opened(own) || !own.output.includes("Ziziwork Retail Store,")) problems.push("the staff member's Home")
            const other = lib.page("Home", {productStoreId: ids.otherStoreId})
            if (!other.output.includes("Store " + ids.otherStoreId + " is not available to you."))
                problems.push("the staff member's Home shows the unassigned store")
        })
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("a forged store id is refused by check#Record and the palette, like another organization's", {
    when() {
        const problems = []
        asUser(users.read, () => {
            for (const recordId of ["BOSS_COM_FORGED", ids.otherStoreId]) {
                const message = refusal(context + "check#Record", {recordType: "store", recordId})
                if (!message.includes("RECORD_UNAVAILABLE")) problems.push(`store ${recordId}: ${message || "accepted"}`)
                if (invoke(context + "search#Records", {text: recordId, limit: 5}).rows.length)
                    problems.push(`the palette finds ${recordId}`)
            }
        })
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("a Projects client and a PASS public account are refused the root and every ironstone.commerce service", {
    when() {
        const problems = []
        for (const outsider of ["sheldon.acme", "dana@joesdist.example.com"]) {
            const home = asUser(outsider, () => lib.page("Home", {}, "html"))
            if (opened(home)) problems.push(`${outsider} opens Home`)
            if (shell(outsider).apps.includes("Commerce")) problems.push(`${outsider}'s launcher has Commerce`)
            const root = "component://mr-boss/service/ironstone/commerce"
            for (const ref of ec.resource.getLocationReference(root).getDirectoryEntries()) {
                const name = ref.location.substring(ref.location.lastIndexOf("/") + 1)
                if (!name.endsWith(".xml")) continue
                for (const match of String(ref.getText()).matchAll(/<service verb="([A-Za-z]+)" noun="([A-Za-z]+)"([^>]*)>/g)) {
                    if (/type="interface"/.test(match[3])) continue
                    const service = "ironstone.commerce." + name.replace(/\.xml$/, "") + "." + match[1] + "#" + match[2]
                    const message = asUser(outsider, () =>
                        refusal(service, {
                            recordType: "store",
                            recordId: ids.storeId,
                            text: "ziziwork",
                            choice: "stores",
                            step: "shop"
                        })
                    )
                    if (!/is not authorized|COMMERCE_UNAVAILABLE|requires system administration/.test(message))
                        problems.push(`${outsider} reaches ${service}: ${message || "accepted"}`)
                }
            }
        }
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("the demo: POPC_DEFAULT completed, the digital store, and two disabled sites with Account, Billing and Support", {
    when() {
        return system(() => {
            const list = (entity, fields) => Array.from(ec.entity.find(entity).condition(fields).list())
            const one = (entity, fields) => ec.entity.find(entity).condition(fields).one()
            const site = siteId => ({
                state: one("mantle.public.PublicSite", {siteId})?.state,
                hosts: list("mantle.public.PublicSiteHost", {siteId})
                    .map(row => row.hostname)
                    .sort(),
                mounts: list("mantle.public.PublicSiteApp", {siteId})
                    .map(row => row.app + ":" + (row.targetId || ""))
                    .sort()
            })
            return {
                facilities: list("mantle.product.store.ProductStoreFacility", {productStoreId: ids.storeId}).map(
                    row => row.facilityId
                ),
                emails: list("mantle.product.store.ProductStoreEmail", {productStoreId: ids.storeId}).length,
                shipOptions: list("mantle.product.store.ProductStoreShipOption", {productStoreId: ids.storeId}).length,
                staff: list("mantle.product.store.ProductStoreParty", {
                    productStoreId: ids.storeId,
                    roleTypeId: "StoreStaff"
                }).map(row => row.partyId),
                digital: one("mantle.product.store.ProductStore", {productStoreId: ids.otherStoreId})?.organizationPartyId,
                shop: site(ids.siteId),
                digitalSite: site(ids.otherSiteId),
                // P15 (Shop F107): the paid access bound to ZIZI_DIGITAL's members' Forum category
                members: one("mantle.forum.ForumCategory", {siteId: ids.otherSiteId, slug: "members"}),
                binding: one("mantle.public.PublicSubscriptionBinding", {subscriptionResourceId: "BOSS_COM_PAID_ACCESS"})
            }
        })
    },
    then({facilities, emails, shipOptions, staff, digital, shop, digitalSite, members, binding}) {
        facilities == ["ZIRET_WH"]
        emails == 6 // Commerce P10 added PsetCartRecovery
        shipOptions == 3
        staff == ["BOSS_COM_STAFF"]
        digital == ids.otherOrganizationId
        shop.state == "disabled"
        // Commerce P5 added ZIZI_SHOP's theme preview host
        shop.hosts == ["preview.shop.zizi.localhost", "shop.zizi.localhost"]
        shop.mounts == ["account:", "billing:ORG_ZIZI_RETAIL", "shop:POPC_DEFAULT", "support:ORG_ZIZI_RETAIL"]
        digitalSite.state == "disabled"
        digitalSite.hosts == ["digital.zizi.localhost"]
        // P15 (Shop F107): its Forum, whose members' category the monthly membership opens
        digitalSite.mounts ==
            ["account:", "billing:ORG_ZIZI_SERVICES", "forum:", "shop:BOSS_COM_DIGITAL", "support:ORG_ZIZI_SERVICES"]
        members.publicationState == "published"
        members.visibility == "category"
        members.qualifyingSources == "subscription,manual"
        binding.siteId == ids.otherSiteId
        binding.targetType == "category"
        binding.targetId == members.contactListId
    }
})
