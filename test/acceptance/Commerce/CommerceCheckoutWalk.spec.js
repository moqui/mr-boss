// Commerce P6's "usable when" (impl-commerce P6), as an acceptance walk through CheckoutSettings' transitions with artifact
// authorization on: readiness lists what blocks the demo store's checkout (its local gateway with no rate; its site's Terms
// page is the demo's, P6 review); the manager gives it local rates for two zones (continental US and Canada), and the simulator quotes a sample
// cart for each and none for a third country (Japan), while the local rates' finding is then ready; binding the
// organization's disabled gateway is refused and the store keeps its gateway; the other organization's manager finds the
// store not available; and CheckoutSettings opens in qvt and html. The walk's rates are ended at its end, so POPC_DEFAULT's
// orders ship on the local gateway's default again. The rules themselves are Mantle's StoreShippingRates and StoreCheckout.
// Run: ./moq accept mr-boss --spec CommerceCheckoutWalk
const lib = ec.resource.script("component://mr-boss/test/Commerce/CommerceSpecLib.js")
const {ids, users, asUser, system} = lib
const A = "mantle.product.StoreAdminServices."
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0
// a transition posted as the user, as its form submits it: the messages it leaves
function post(user, path, parameters) {
    return asUser(user, () => {
        const result = ec.screen.makeTest().rootScreen("component://mr-boss/screen/Commerce.xml").render(path, parameters, "post")
        const errors = Array.from(result.errorMessages || [])
        ec.message.clearErrors()
        return {status: result.status, errors, output: String(result.output || "")}
    })
}
const call = (service, parameters) => system(() => ec.service.sync().name(service).parameters(parameters).call() || {})
const finding = key =>
    asUser(users.manager, () =>
        ec.service
            .sync()
            .name(A + "check#StoreReadiness")
            .parameters({productStoreId: ids.storeId})
            .call()
    ).findings.find(row => row.key == key)
const quotes = (countryGeoId, stateProvinceGeoId) =>
    asUser(
        users.manager,
        () =>
            ec.service
                .sync()
                .name(A + "simulate#StoreShipping")
                .parameters({
                    productStoreId: ids.storeId,
                    countryGeoId,
                    stateProvinceGeoId,
                    amount: "60",
                    weight: "4",
                    weightUomId: "WT_lb"
                })
                .call(),
        // as CheckoutSettings calls it (its authorization inherited from the screen)
        false
    ).quotes
const walk = {stamp: String(Date.now()).slice(-6), rateIds: []}

spec({
    stepwise: true,
    cleanupSpec() {
        // the walk's rates end, so the demo store is rated by the local gateway's default again
        for (const shippingRateId of walk.rateIds)
            try {
                call(A + "store#StoreShippingRate", {
                    productStoreId: ids.storeId,
                    shippingRateId,
                    end: true,
                    changeReason: "Walk done"
                })
            } catch (error) {
                ec.logger.error("CommerceCheckoutWalk could not end rate " + shippingRateId + ": " + error.message)
            }
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("readiness lists what blocks the demo store's checkout: the local gateway with no rate; the demo's Terms page holds", {
    when() {
        return {
            localRates: finding("localRates"),
            terms: finding("terms"),
            payments: finding("payments"),
            queue: finding("supportQueue")
        }
    },
    then(r) {
        r.localRates.ready == false
        r.localRates.severity == "blocking"
        r.terms.ready == true
        r.payments.ready == true
        r.queue.ready == true
    }
})

feature("the manager adds local rates for two zones; the simulator quotes each and none for a third country", {
    when() {
        const add = (geoId, shippingAmount) =>
            post(users.manager, "Settings/CheckoutSettings/saveRate", {
                productStoreId: ids.storeId,
                geoId,
                shippingAmount,
                currencyUomId: "USD",
                priority: "10",
                description: "Walk " + geoId + " " + walk.stamp
            })
        const us = add("USCN", "6.00")
        const canada = add("CAN", "14.00")
        const rows = system(() =>
            Array.from(
                ec.entity
                    .find("mantle.product.store.ProductStoreShippingRate")
                    .condition({productStoreId: ids.storeId})
                    .useCache(false)
                    .list()
            )
                .map(row => row.getMap())
                .filter(row => String(row.description || "").endsWith(walk.stamp))
        )
        walk.rateIds = rows.map(row => row.shippingRateId)
        const page = asUser(users.manager, () =>
            lib.page("Settings/CheckoutSettings", {
                productStoreId: ids.storeId,
                simCountryGeoId: "USA",
                simStateGeoId: "USA_TX",
                simAmount: "60",
                simWeight: "4"
            })
        )
        return {
            us,
            canada,
            rows,
            texas: quotes("USA", "USA_TX"),
            ontario: quotes("CAN", "CAN_ON"),
            japan: quotes("JPN"),
            page,
            ready: finding("localRates")
        }
    },
    then(r) {
        r.us.errors == []
        r.canada.errors == []
        r.rows.length == 2
        r.texas.length == 3
        r.texas.every(row => row.available && row.amountText.includes("6.00"))
        r.ontario.every(row => row.available && row.amountText.includes("14.00"))
        r.japan.every(row => !row.available)
        opened(r.page)
        r.page.output.includes("Walk USCN " + walk.stamp)
        r.ready.ready == true
    }
})

feature(
    "binding the organization's disabled gateway is refused and the store keeps its gateway; another organization is refused",
    {
        when() {
            const refused = post(users.manager, "Settings/CheckoutSettings/savePayment", {
                productStoreId: ids.storeId,
                paymentInstrumentEnumId: "PiCreditCard",
                paymentGatewayConfigId: "TEST_DECLINE",
                changeReason: "Walk"
            })
            const binding = system(() =>
                ec.entity
                    .find("mantle.product.store.ProductStorePaymentGateway")
                    .condition({productStoreId: ids.storeId, paymentInstrumentEnumId: "PiCreditCard"})
                    .useCache(false)
                    .one()
            )
            const other = asUser(users.services, () => lib.page("Settings/CheckoutSettings", {productStoreId: ids.storeId}))
            return {refused, gateway: binding?.paymentGatewayConfigId, other}
        },
        then(r) {
            r.refused.errors.join(" ").includes("GATEWAY_NOT_ENABLED")
            r.gateway == "BOSS_COM_HOSTED"
            r.other.output.includes("Not available")
        }
    }
)

feature("CheckoutSettings opens for the manager in qvt and html with its readiness strip", {
    when() {
        return {
            qvt: asUser(users.manager, () => lib.page("Settings/CheckoutSettings", {productStoreId: ids.storeId})),
            html: asUser(users.manager, () => lib.page("Settings/CheckoutSettings", {productStoreId: ids.storeId}, "html"))
        }
    },
    then({qvt, html}) {
        opened(qvt)
        opened(html)
        qvt.output.includes("Readiness for purchase")
        qvt.output.includes("Terms page")
        html.output.includes("Local rates")
    }
})
