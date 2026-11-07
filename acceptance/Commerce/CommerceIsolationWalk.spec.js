// Commerce's end-to-end access review (impl-commerce P15; design-commerce §12.2 scenario 1, §8 "P15's walk"), with artifact
// authorization on: a Commerce user with no other launcher (commerce.read, Ziziwork Retail's reader) is refused costs, supplier
// prices and credentials, and another organization's store (Ziziwork Services' BOSS_COM_DIGITAL); a store-limited staff
// member (commerce.storestaff, of both organizations, limited to POPC_DEFAULT) is refused the other store of their own
// organization alike: through URLs, the shared contexts, exports, previews, the palette, search and choices. The rules are
// the services' own (CommerceAccess and the Mantle specs); this walks them end to end on the demo.
// Run: ./moq accept mr-boss --spec CommerceIsolationWalk
const lib = ec.resource.script("component://mr-boss/test/Commerce/CommerceSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, shell} = lib
const context = "ironstone.commerce.ContextServices."
const other = ids.otherStoreId
const state = {}
// a Commerce screen as html, or a transition's answer: {status, output, errors}
const render = (user, path, parameters = {}) => asUser(user, () => lib.page(path, parameters, "html"))
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0
const unavailable = rendered =>
    !opened(rendered) || /is not available|not one of your stores|not available to you/.test(rendered.output)
// a service as the screens call it: the screen's authorization inherited (artifact authorization off for the call), so the
// service's own permission and store scope checks are what answer
const asScreen = (user, action) => asUser(user, action, false)
// who the review is for: the reader with no other launcher and the store-limited member
const reviewed = [users.read, users.storeStaff]

spec({
    setupSpec() {
        login("john.doe")
        system(() => {
            // a theme of the other store for its preview, and a credential on the marketplace binding that must never show
            state.themeId = ec.service
                .sync()
                .name("mantle.public.ThemeServices.create#ThemeDraft")
                .parameters({productStoreId: other, starter: "mr-pass/starter", name: "Isolation walk theme"})
                .call().themeId
            state.secret = ec.entity
                .find("moqui.service.message.SystemMessageRemote")
                .condition({systemMessageRemoteId: "BOSS_COM_MARKETPLACE"})
                .disableAuthz()
                .one()?.sharedSecret
            ec.service
                .sync()
                .name("update#moqui.service.message.SystemMessageRemote")
                .parameters({systemMessageRemoteId: "BOSS_COM_MARKETPLACE", sharedSecret: "isolation-walk-secret"})
                .call()
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        // the demo binding's secret as it was, so the walk leaves no credential behind for the runs after it
        system(() =>
            ec.service
                .sync()
                .name("update#moqui.service.message.SystemMessageRemote")
                .parameters({systemMessageRemoteId: "BOSS_COM_MARKETPLACE", sharedSecret: state.secret || null})
                .call()
        )
        ec.artifactExecution.enableAuthz()
    }
})

feature("the reader's launcher has Commerce alone; the shared catalog context gives no cost, supplier price or margin", {
    when() {
        const apps = shell(users.read).apps
        const catalog = asScreen(users.read, () =>
            invoke("ironstone.products.CatalogServices.get#SharedContext", {appRoot: "Commerce"})
        )
        // the cost and supplier tabs by URL: their condition keeps them out of Commerce's Product360
        const tabs = ["Costs", "Suppliers", "PurchaseHistory"].map(tab => [
            tab,
            render(users.read, "Merchandising/Product360/" + tab, {productId: "DEMO_1_1"})
        ])
        return {apps, catalog, tabs}
    },
    then({apps, catalog, tabs}) {
        apps.includes("Commerce")
        apps.filter(app =>
            [
                "Products",
                "Accounting",
                "Warehouse",
                "Purchasing",
                "Sales",
                "CustomerService",
                "Manufacturing",
                "Projects"
            ].includes(app)
        ).length == 0
        catalog.capabilities.read == true
        catalog.capabilities.costRead == false
        catalog.capabilities.supplierPriceRead == false
        catalog.capabilities.marginRead == false
        !catalog.productTabs.includes("Costs") && !catalog.productTabs.includes("Suppliers")
        tabs.every(([, rendered]) => !/Standard cost|Supplier price|Last purchase price/i.test(rendered.output))
    }
})

feature("credentials stay on the server: the configuration summary, checkout settings and an integration show none", {
    when() {
        const csv = render(users.read, "Stores/StoreDetail/exportSummary", {productStoreId: ids.storeId})
        const print = render(users.read, "Stores/StoreDetail/printSummary", {productStoreId: ids.storeId})
        const checkout = asScreen(users.read, () =>
            invoke("mantle.product.StoreAdminServices.get#CheckoutSettings", {productStoreId: ids.storeId})
        )
        const readerIntegration = asScreen(users.read, () =>
            refusal("mantle.product.StoreChannelServices.get#StoreIntegration", {systemMessageRemoteId: "BOSS_COM_MARKETPLACE"})
        )
        const operator = asScreen(users.channel, () =>
            invoke("mantle.product.StoreChannelServices.get#StoreIntegration", {systemMessageRemoteId: "BOSS_COM_MARKETPLACE"})
        )
        return {csv, print, checkout, readerIntegration, operator}
    },
    then({csv, print, checkout, readerIntegration, operator}) {
        csv.output.startsWith("Store configuration summary,")
        csv.output.includes("Payment gateway")
        print.output.includes("<h1>")
        !/PaymentTestServices|authorizeServiceName|isolation-walk-secret/.test(csv.output + print.output)
        !JSON.stringify(checkout.paymentGateways || []).includes("ServiceName")
        readerIntegration.includes("COMMERCE_CHANNEL_OPERATE")
        !JSON.stringify(operator).includes("isolation-walk-secret")
        !Object.keys(operator.integration || {}).some(key => /password|secret|privateKey/i.test(key))
    }
})

feature(
    "another organization's store, and another store for a store-limited member, are refused by URL, shared context and export",
    {
        when() {
            const problems = []
            for (const user of reviewed) {
                for (const [path, parameters] of [
                    ["Stores/StoreDetail", {productStoreId: other}],
                    ["Stores/StoreDetail/General", {productStoreId: other}],
                    ["Settings/CheckoutSettings", {productStoreId: other}],
                    ["Merchandising/Assortment", {productStoreId: other}],
                    ["Merchandising/StoreCategories", {productStoreId: other}],
                    ["Website/ThemeDetail", {themeId: state.themeId}],
                    ["Customers/Customer360", {customerPartyId: ids.otherCustomerId, partyId: ids.otherCustomerId}]
                ]) {
                    const rendered = render(user, path, parameters)
                    if (!unavailable(rendered)) problems.push(`${user} opens ${path} of ${JSON.stringify(parameters)}`)
                    if (rendered.output.includes("Ziziwork Digital Store"))
                        problems.push(`${user}'s ${path} names the other store`)
                }
                // the control: their own store opens on the same screens
                for (const path of ["Stores/StoreDetail", "Stores/StoreDetail/General", "Merchandising/Assortment"]) {
                    const own = render(user, path, {productStoreId: ids.storeId})
                    if (unavailable(own))
                        problems.push(`${user} is refused ${path} of their own ${ids.storeId}: ${own.status} ${own.errors}`)
                }
                // the shared catalog context's stores
                const catalog = asScreen(user, () =>
                    invoke("ironstone.products.CatalogServices.get#SharedContext", {appRoot: "Commerce"})
                )
                if ((catalog.storeIds || []).includes(other)) problems.push(`${user}'s catalog context has ${other}`)
                // exports: the configuration summary and a report's CSV
                for (const [path, parameters] of [
                    ["Stores/StoreDetail/exportSummary", {productStoreId: other}],
                    ["Stores/StoreDetail/printSummary", {productStoreId: other}],
                    ["Reports/OnlineSales/exportCsv", {productStoreId: other}]
                ]) {
                    const rendered = render(user, path, parameters)
                    if (rendered.status === 200 && !rendered.errors.length && rendered.output.includes(other))
                        problems.push(`${user} exports ${path} of ${other}`)
                }
                const summary = asScreen(user, () =>
                    refusal("mantle.product.StoreAdminServices.get#StoreSummary", {productStoreId: other})
                )
                if (!/RECORD_UNAVAILABLE|PERMISSION_DENIED/.test(summary))
                    problems.push(`${user}'s summary of ${other}: ${summary || "given"}`)
            }
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)

feature("the other store is refused by preview, the palette, search and choices", {
    when() {
        const problems = []
        for (const user of reviewed) {
            const preview = asScreen(user, () =>
                refusal("mantle.public.ThemeServices.create#ThemePreview", {themeId: state.themeId, siteId: ids.otherSiteId})
            )
            if (!preview) problems.push(`${user} previews the other store's theme`)
            for (const text of [other, "Digital", "Ziziwork"]) {
                const rows = asUser(user, () => invoke(context + "search#Records", {text, limit: 20}).rows || [])
                if (rows.some(row => String(row.url).includes(other)))
                    problems.push(`${user}'s palette finds ${other} by ${text}`)
            }
            const orders = asScreen(user, () =>
                refusal("mantle.order.StoreOperationsServices.find#StoreOrders", {productStoreId: other})
            )
            if (!/RECORD_UNAVAILABLE|PERMISSION_DENIED/.test(orders))
                problems.push(`${user} searches ${other}'s orders: ${orders || "allowed"}`)
            const stores = asScreen(user, () => invoke("mantle.product.StoreAdminServices.find#Stores", {term: "Ziziwork"}))
            if (JSON.stringify(stores).includes(other)) problems.push(`${user}'s store search lists ${other}`)
            const choices = asUser(user, () => invoke(context + "get#Choices", {choice: "stores"}).options || [])
            if (choices.some(option => option.value === other)) problems.push(`${user}'s store choices offer ${other}`)
            if (!choices.some(option => option.value === ids.storeId))
                problems.push(`${user}'s store choices miss ${ids.storeId}`)
            const record = asUser(user, () => refusal(context + "check#Record", {recordType: "store", recordId: other}))
            if (!record.includes("RECORD_UNAVAILABLE")) problems.push(`${user}'s check#Record of ${other}: ${record || "given"}`)
        }
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})
