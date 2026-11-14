// Sales P16's "usable when" (impl-sales P16; design-sales §14.3 scenario 10, its recurrence half; §7 RecurringOrders and
// Subscriptions): sales.agreement makes an approved order of Wingtip Traders a monthly recurring base through Recurring orders' New
// recurring order; the job (create#RecurringOrders) places the due month's order once, a second run and the keeper's retry adding none;
// the keeper pauses the base, the job skips its due month, and after it is resumed the paused month is not made late; Sales'
// Subscriptions shows a storeless subscription of the generated order beside a store contract of Retail's store, which offers only
// Follow up (no cancel or retry, which stay Commerce's). Each keeper step through Recurring orders' transitions; the rules are Mantle's
// SalesRecurrence.
// Run: ./moq accept mr-boss --spec SalesRecurrenceScenarios
const lib = ec.resource.script("component://mr-boss/test/Sales/SalesSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const run = String(Date.now()).slice(-6)
const dayMs = 24 * 60 * 60 * 1000
const one = (entity, values) => ec.entity.find(entity).condition(values).disableAuthz().one()
const header = orderId => one("mantle.order.OrderHeader", {orderId})
const children = baseOrderId =>
    system(() => Array.from(ec.entity.find("mantle.order.OrderHeader").condition("parentOrderId", baseOrderId).list()))
// a screen transition as the user: the render's errors
function post(user, path, parameters) {
    return asUser(user, () => {
        const result = ec.screen.makeTest().rootScreen("component://mr-boss/screen/Sales.xml").render(path, parameters, "POST")
        const errors = Array.from(result.errorMessages || [])
        ec.message.clearErrors()
        return errors
    })
}
const job = () => system(() => invoke("mantle.order.OrderServices.create#RecurringOrders", {}))
const shared = {}

spec({
    stepwise: true,
    setupSpec() {
        // an approved order of Retail for Wingtip Traders (approved in place)
        shared.sourceOrderId = system(() => {
            const created = invoke("mantle.order.OrderServices.create#Order", {
                vendorPartyId: ids.organizationId,
                customerPartyId: ids.accounts.wingtip,
                currencyUomId: "USD",
                orderName: "Monthly supplies " + run
            })
            invoke("mantle.order.OrderServices.create#OrderItem", {
                orderId: created.orderId,
                orderPartSeqId: created.orderPartSeqId,
                productId: "DEMO_1_1",
                itemTypeEnumId: "ItemProduct",
                quantity: 3,
                unitAmount: 20,
                requireInventory: false
            })
            for (const value of [
                ec.entity.find("mantle.order.OrderHeader").condition("orderId", created.orderId).one(),
                ec.entity.find("mantle.order.OrderPart").condition("orderId", created.orderId).one()
            ]) {
                value.set("statusId", "OrderApproved")
                value.update()
            }
            return created.orderId
        })
    }
})

feature("an agreement keeper makes an approved order a monthly base in Recurring orders", {
    when() {
        const errors = post(users.agreement, "Agreements/RecurringOrders/salesStoreRecurrence", {
            sourceOrderId: shared.sourceOrderId,
            frequency: "monthly",
            dayOfMonth: "1",
            hourOfDay: "6",
            recurTimeZone: "America/Denver",
            recurFromDate: ec.l10n.format(new Date(Date.now() - 60 * dayMs), "yyyy-MM-dd")
        })
        shared.baseOrderId = system(
            () =>
                Array.from(
                    ec.entity
                        .find("mantle.order.OrderHeader")
                        .condition("orderName", "like", "Monthly supplies " + run + "%")
                        .condition("orderPurposeEnumId", "OrpRecurringTemplate")
                        .list()
                )[0]?.orderId
        )
        const list = asUser(users.agreement, () =>
            page("Agreements/RecurringOrders", {text: shared.baseOrderId, state: "all"}, "html")
        )
        return {errors, list}
    },
    then({errors, list}) {
        errors.length == 0
        shared.baseOrderId != null
        header(shared.baseOrderId).statusId == "OrderApproved"
        header(shared.sourceOrderId).recurCronExpression == null
        list.errors.length == 0
        list.output.includes("Monthly supplies " + run)
        list.output.includes("America/Denver")
    }
})

feature("the job places the month's order once; a second run and a retry add none", {
    when() {
        job()
        job()
        const retry = post(users.agreement, "Agreements/RecurringOrders/salesChangeRecurrence", {
            baseOrderId: shared.baseOrderId,
            recurRevision: String(header(shared.baseOrderId).recurRevision ?? 1),
            operation: "retry",
            operationKey: "retry-" + run
        })
        return {made: children(shared.baseOrderId), retry}
    },
    then({made, retry}) {
        made.length == 1
        made[0].statusId == "OrderPlaced"
        retry.join(" ").includes("NOTHING_DUE")
    }
})

feature("a paused base skips its month, and resuming does not make it late", {
    when() {
        // the next month due: the last order a month and a half ago
        system(() =>
            invoke("update#mantle.order.OrderHeader", {
                orderId: shared.baseOrderId,
                lastOrderedDate: new Date(Date.now() - 45 * dayMs)
            })
        )
        const paused = post(users.agreement, "Agreements/RecurringOrders/salesChangeRecurrence", {
            baseOrderId: shared.baseOrderId,
            recurRevision: String(header(shared.baseOrderId).recurRevision ?? 1),
            operation: "pause",
            reason: "Store closed for refit"
        })
        job()
        const whilePaused = children(shared.baseOrderId).length
        const resumed = post(users.agreement, "Agreements/RecurringOrders/salesChangeRecurrence", {
            baseOrderId: shared.baseOrderId,
            recurRevision: String(header(shared.baseOrderId).recurRevision ?? 1),
            operation: "resume"
        })
        job()
        return {paused, whilePaused, resumed, afterResume: children(shared.baseOrderId).length}
    },
    then({paused, whilePaused, resumed, afterResume}) {
        paused.length == 0
        whilePaused == 1
        resumed.length == 0
        afterResume == 1
    }
})

feature("Sales' Subscriptions shows a storeless subscription beside a store contract it can only follow up", {
    when() {
        const child = children(shared.baseOrderId)[0]
        const store = system(() =>
            Array.from(
                ec.entity.find("mantle.product.store.ProductStore").condition("organizationPartyId", ids.organizationId).list()
            )
        )[0]
        system(() => {
            invoke("create#mantle.product.subscription.Subscription", {
                subscriptionId: "SAL_ACC_SUB_" + run,
                subscriberPartyId: ids.accounts.wingtip,
                orderId: child.orderId,
                orderItemSeqId: "01",
                productId: "DEMO_1_1",
                fromDate: new Date(Date.now() - dayMs),
                thruDate: new Date(Date.now() + 30 * dayMs)
            })
            invoke("create#mantle.product.subscription.StoreRecurringContract", {
                contractId: "SAL_ACC_CON_" + run,
                productStoreId: store.productStoreId,
                customerPartyId: ids.accounts.wingtip,
                productId: "DEMO_1_1",
                priceAmount: 15,
                currencyUomId: "USD",
                autoRenew: "N",
                stateEnumId: "ScsActive",
                createdDate: ec.user.nowTimestamp
            })
        })
        const listed = asUser(users.rep, () => page("Agreements/Subscriptions", {customerPartyId: ids.accounts.wingtip}, "html"))
        const followed = post(users.rep, "Agreements/Subscriptions/salesSubscriptionFollowUp", {contractId: "SAL_ACC_CON_" + run})
        return {listed, followed, storeName: store.storeName || store.productStoreId}
    },
    then({listed, followed, storeName}) {
        listed.errors.length == 0
        listed.output.includes("SAL_ACC_SUB_" + run)
        listed.output.includes("SAL_ACC_CON_" + run)
        listed.output.includes(storeName)
        listed.output.includes("Follow up")
        !listed.output.includes("Cancel renewal")
        !listed.output.includes("Retry")
        followed.length == 0
    }
})
