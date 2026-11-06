// Commerce paid access and subscriptions (impl-commerce P12; design-commerce §4 Product360 paid access, §6 Subscriptions and
// SubscriptionDetail): the store operations in Commerce's context by store scope (the subscription operator reads the demo
// store's contract; the reader without the order read, and the other organization's contract, refused), a retry refused
// while a renewal payment is unresolved, and the Paid access pane's handler names read only (the Services manager reads
// them with no editor; the Retail operator may not edit another organization's product), with SubscriptionDetail and
// Product360's Paid access each rendered once (qvt; Subscriptions renders in the acceptance). The coordinator's rules
// themselves are Mantle's (ShopSubscriptions). The usable-when is the acceptance mr-pass ShopSubscriptionsInCommerce.
// Run: ./moq test mr-boss --spec CommerceSubscriptions
const lib = ec.resource.script("component://mr-boss/test/Commerce/CommerceSpecLib.js")
const {ids, users, asUser, system, refusal, invoke} = lib
const R = "mantle.product.ShopSubscriptionServices."
const prefix = "BOSS_COM12"
const as = (user, service, parameters = {}) => asUser(user, () => invoke(R + service, parameters), false)
const refused = (user, service, parameters = {}) => asUser(user, () => refusal(R + service, parameters), false)
const code = message => (/([A-Z][A-Z0-9_]+):/.exec(message || "") || [])[1] || (message ? "ERROR" : "")
const make = (entity, values) =>
    ec.service
        .sync()
        .name("create#" + entity)
        .parameters(values)
        .call()
const contractId = prefix + "_RETAIL",
    otherContractId = prefix + "_DIGITAL"

// a Product360 tab rendered in qvt as its own fragment, with a render error counted among the errors
function tab(path, parameters) {
    const result = ec.screen
        .makeTest()
        .rootScreen("component://mr-boss/screen/Commerce.xml")
        .renderMode("qvt")
        .withStaticData()
        .render(path, Object.assign({lastStandalone: "true"}, parameters), null)
    const output = String(result.output || "")
    ec.message.clearErrors()
    return {
        status: result.status,
        output,
        errors: Array.from(result.errorMessages || []).concat(output.match(/(Error rendering|Exception in render)[^\n<]*/g) || [])
    }
}
function contract(id, productStoreId, productId) {
    const paidThrough = new Date(Number(ec.user.nowTimestamp) + 10 * 86400000)
    make("mantle.product.subscription.StoreRecurringContract", {
        contractId: id,
        productStoreId,
        customerPartyId: ids.customerId,
        productId,
        priceAmount: "9.00",
        currencyUomId: "USD",
        autoRenew: "Y",
        stateEnumId: "ScsPastDue",
        paidThroughDate: new Date(Number(ec.user.nowTimestamp) - 86400000),
        nextRenewalDate: paidThrough,
        revision: 3,
        createdDate: ec.user.nowTimestamp
    })
    make("mantle.product.subscription.Subscription", {
        subscriptionId: id + "_S",
        subscriptionResourceId: "BOSS_COM_PAID_ACCESS",
        subscriberPartyId: ids.customerId,
        productId,
        resourceInstanceId: id,
        fromDate: new Date(Number(ec.user.nowTimestamp) - 30 * 86400000),
        thruDate: new Date(Number(ec.user.nowTimestamp) - 86400000)
    })
}

spec({
    setupSpec() {
        login("john.doe")
        system(() => {
            contract(contractId, ids.storeId, "BOSS_CS_FILTER")
            // its renewal's payment is with the provider: nothing may charge it again
            make("mantle.account.payment.Payment", {
                paymentId: prefix + "_PAY",
                statusId: "PmntPromised",
                amount: "9.00",
                amountUomId: "USD",
                fromPartyId: ids.customerId,
                toPartyId: ids.organizationId,
                effectiveDate: ec.user.nowTimestamp
            })
            make("mantle.product.subscription.StoreRenewalOccurrence", {
                occurrenceId: prefix + "_OCC",
                contractId,
                periodStartDate: new Date(Number(ec.user.nowTimestamp) - 86400000),
                stateEnumId: "SrsCharging",
                paymentId: prefix + "_PAY",
                attemptCount: 1,
                createdDate: ec.user.nowTimestamp
            })
            contract(otherContractId, ids.otherStoreId, "BOSS_COM_PAID_MONTH")
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("subscriptions by store scope; a retry refused while a renewal payment is unresolved", {
    when() {
        return {
            listed: as(users.subscriptions, "find#StoreSubscriptions", {}).subscriptions || [],
            detail: as(users.subscriptions, "get#StoreSubscription", {contractId}),
            unresolved: refused(users.subscriptions, "retry#Renewal", {contractId, operationKey: prefix + "-RETRY"}),
            cancelInFlight: refused(users.subscriptions, "cancel#RecurringContract", {contractId, expectedRevision: "3"}),
            reader: refused(users.read, "find#StoreSubscriptions", {}),
            other: refused(users.subscriptions, "get#StoreSubscription", {contractId: otherContractId}),
            // the Services manager reads the store's offers but has no subscription grant
            servicesRetry: refused(users.services, "retry#Renewal", {contractId: otherContractId, operationKey: prefix + "-S"})
        }
    },
    then(r) {
        r.listed.some(row => row.contractId == contractId && row.billingState == "ScsPastDue" && row.hasAccess == false)
        !r.listed.some(row => row.contractId == otherContractId)
        r.detail.subscription.inFlight == true
        r.detail.subscription.canRetry == false && r.detail.subscription.canCancel == false
        r.detail.renewals.length == 1
        code(r.unresolved) == "PAYMENT_UNRESOLVED"
        code(r.cancelInFlight) == "RENEWAL_IN_PROGRESS"
        code(r.reader) == "PERMISSION_DENIED"
        code(r.other) == "RECORD_UNAVAILABLE"
        code(r.servicesRetry) == "PERMISSION_DENIED"
    }
})

feature("Paid access shows its handler names read only; SubscriptionDetail and the pane each render once", {
    when() {
        const pane = as(users.services, "get#ProductPaidAccess", {productId: "BOSS_COM_PAID_MONTH"})
        return {
            pane,
            edit: refused(users.subscriptions, "store#ProductSubscriptionResource", {
                productId: "BOSS_COM_PAID_MONTH",
                subscriptionResourceId: "BOSS_COM_PAID_ACCESS",
                fromDate: "1265184000000",
                change: "Y",
                availableTime: 2
            }),
            // the tab as the shell fetches it (its own fragment)
            paneRender: asUser(users.services, () =>
                tab("Merchandising/Product360/PaidAccess", {productId: "BOSS_COM_PAID_MONTH"})
            ),
            detailRender: asUser(users.subscriptions, () => lib.page("Customers/SubscriptionDetail", {contractId}))
        }
    },
    then(r) {
        r.pane.canEdit == false
        r.pane.terms.length == 1
        r.pane.terms[0].handlersText.includes("Revoke: mantle.forum.EntitlementServices.revoke#ForumAccess")
        r.pane.resourceOptions == []
        code(r.edit) == "RECORD_UNAVAILABLE"
        r.paneRender.status == 200
        r.paneRender.errors == []
        r.paneRender.output.includes("mantle.forum.EntitlementServices.init#ForumAccess")
        !r.paneRender.output.includes("Add access")
        r.detailRender.status == 200
        r.detailRender.errors == []
        r.detailRender.output.includes("A renewal payment is being processed")
        !r.detailRender.output.includes("Retry renewal")
    }
})
