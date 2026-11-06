// Commerce P7's "usable when" (impl-commerce P7), as an acceptance walk through the screens' transitions with artifact
// authorization on: a promotion manager makes a 10% promotion of the demo store that needs a code, a code limited to one use
// per customer and 50 generated codes with a prefix (previewed first); the same customer's second placed order with the code
// is refused the discount (placement refused until repriced, then placed without it) and a later cart cannot take the code;
// the expired code stays readable with its usage; the reader reads and cannot start a promotion, another organization's
// manager is refused the promotion; and each Promotions screen opens for the manager. The rules themselves are Mantle's
// StorePromotions and CommercePromotions'.
// Run: ./moq accept mr-boss --spec CommercePromotionsWalk
const lib = ec.resource.script("component://mr-boss/test/Commerce/CommerceSpecLib.js")
const {ids, users, asUser, system} = lib
const P = "mantle.product.StorePromotionServices."
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0
// a transition posted as the user, as its form submits it: the messages it leaves
function post(user, path, parameters) {
    return asUser(user, () => {
        const result = ec.screen.makeTest().rootScreen("component://mr-boss/screen/Commerce.xml").render(path, parameters, "post")
        const errors = Array.from(result.errorMessages || [])
        const messages = Array.from(ec.message.getMessages?.() || [])
        ec.message.clearErrors()
        return {status: result.status, errors, messages, output: String(result.output || "")}
    })
}
const list = (entity, conditions) =>
    system(() => Array.from(ec.entity.find(entity).condition(conditions).useCache(false).list()).map(row => row.getMap()))
const call = (service, parameters) => system(() => ec.service.sync().name(service).parameters(parameters).call() || {})
// a call as the customer's shop or an order screen makes it, its refusal message or ""
function attempt(service, parameters) {
    return system(() => {
        ec.message.pushErrors()
        try {
            ec.service.sync().name(service).parameters(parameters).requireNewTransaction(true).call()
            return ec.message.hasError() ? ec.message.getErrorsString() : ""
        } finally {
            ec.message.clearErrors()
            ec.message.popErrors()
        }
    })
}
const walk = {stamp: String(Date.now()).slice(-6)}
// a cart of the demo store for the walk's customer with two units of DEMO_1_1, without reserving stock
function cart() {
    const created = call("mantle.order.OrderServices.create#Order", {
        customerPartyId: walk.customerId,
        productStoreId: ids.storeId
    })
    call("mantle.order.OrderServices.add#OrderProductQuantity", {
        orderId: created.orderId,
        orderPartSeqId: created.orderPartSeqId,
        productId: "DEMO_1_1",
        quantity: 2,
        unitAmount: 20,
        requireInventory: false
    })
    return created.orderId
}
const discounts = orderId =>
    list("mantle.order.OrderItem", {orderId, isPromo: "Y"}).filter(item => item.storePromotionId === walk.storePromotionId)

spec({
    stepwise: true,
    setupSpec() {
        walk.customerId = call("mantle.party.PartyServices.create#Person", {
            firstName: "Walk",
            lastName: "Shopper " + walk.stamp,
            roleTypeId: "Customer"
        }).partyId
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("a promotion manager makes a 10% promotion that needs a code and a code limited to one use per customer", {
    when() {
        const description = "Walk ten percent " + walk.stamp
        const created = post(users.manager, "Promotions/Promotions/createPromotion", {
            itemDescription: description,
            newProductStoreId: ids.storeId,
            newServiceRegisterId: "BuyGetDiscount",
            requireCode: "Y"
        })
        const promotion = list("mantle.product.store.ProductStorePromotion", {itemDescription: description})[0]
        walk.storePromotionId = promotion?.storePromotionId
        const values = [
            ["buyQuantity", "0"],
            ["getQuantity", "1"],
            ["discountPercent", "10"]
        ].map(([parameterName, parameterValue]) =>
            post(users.manager, "Promotions/PromotionDetail/saveParameter", {
                storePromotionId: walk.storePromotionId,
                parameterName,
                parameterValue
            })
        )
        // first in the store's order, before the new-customer discount takes the units
        const saved = post(users.manager, "Promotions/PromotionDetail/savePromotion", {
            storePromotionId: walk.storePromotionId,
            itemDescription: description,
            sequenceNum: "1",
            requireCode: "Y",
            changeReason: "Walk"
        })
        walk.promoCode = "WALK" + walk.stamp
        const code = post(users.manager, "Promotions/PromoCodes/createCode", {
            newStorePromotionId: walk.storePromotionId,
            promoCode: walk.promoCode,
            useLimitPerCustomer: "1"
        })
        walk.promoCodeId = list("mantle.product.store.ProductStorePromoCode", {promoCode: walk.promoCode})[0]?.promoCodeId
        return {
            created,
            promotion,
            values,
            saved,
            code,
            parameters: list("mantle.product.store.ProductStorePromoParameter", {storePromotionId: walk.storePromotionId})
        }
    },
    then({created, promotion, values, saved, code, parameters}) {
        created.errors == []
        saved.errors == []
        promotion.productStoreId == ids.storeId
        promotion.requireCode == "Y"
        values.every(value => value.errors.length == 0)
        parameters.length == 3
        code.errors == []
        walk.promoCodeId != null
    }
})

feature("the manager previews 50 codes with a prefix, then generates them, each its own code of the promotion", {
    when() {
        const batch = {
            genPromotionId: walk.storePromotionId,
            genCount: "50",
            genPrefix: "W" + walk.stamp + "-",
            genSuffixLength: "8",
            genUseLimitPerCustomer: "1"
        }
        const preview = asUser(users.manager, () =>
            lib.page(
                "Promotions/PromoCodes",
                Object.assign({generatePreview: "Y", _openDialog: "GenerateCodes", lastStandalone: "1"}, batch),
                "html"
            )
        )
        const generated = post(
            users.manager,
            "Promotions/PromoCodes/generateCodes",
            Object.assign({operationKey: "walk-codes-" + walk.stamp}, batch)
        )
        const codes = list("mantle.product.store.ProductStorePromoCode", {storePromotionId: walk.storePromotionId})
        return {preview, generated, codes}
    },
    then({preview, generated, codes}) {
        preview.errors == []
        preview.output.includes("Makes 50 codes")
        generated.errors == []
        codes.length == 51
        codes.filter(row => row.promoCode.startsWith("W" + walk.stamp + "-")).length == 50
        codes.every(row => row.promoCode == walk.promoCode || Number(row.useLimitPerCustomer) == 1)
    }
})

feature("the same customer's second placed order with the code is refused the discount; a later cart cannot take the code", {
    when() {
        // both carts take the code before either is placed, as two open checkouts of one customer would
        const first = cart(),
            second = cart()
        call("mantle.product.PromotionServices.add#OrderPromoCode", {orderId: first, promoCode: walk.promoCode})
        call("mantle.product.PromotionServices.add#OrderPromoCode", {orderId: second, promoCode: walk.promoCode})
        const discountedBefore = [discounts(first).length, discounts(second).length]
        const firstPlaced = attempt("mantle.order.OrderServices.place#Order", {orderId: first, requireInventory: false})
        const secondPlaced = attempt("mantle.order.OrderServices.place#Order", {orderId: second, requireInventory: false})
        const partSeqId = list("mantle.order.OrderPart", {orderId: second})[0].orderPartSeqId
        call("mantle.order.OrderServices.handle#OrderMajorChange", {orderId: second, orderPartSeqId: partSeqId})
        const repriced = attempt("mantle.order.OrderServices.place#Order", {orderId: second, requireInventory: false})
        const third = cart()
        call("mantle.product.PromotionServices.add#OrderPromoCode", {orderId: third, promoCode: walk.promoCode})
        walk.firstOrderId = first
        return {
            discountedBefore,
            firstPlaced,
            secondPlaced,
            repriced,
            secondDiscounts: discounts(second).length,
            statuses: [first, second].map(orderId => list("mantle.order.OrderHeader", {orderId})[0].statusId),
            thirdCodes: list("mantle.order.OrderPromoCode", {orderId: third}).length,
            firstDiscount: discounts(first)[0]
        }
    },
    then(r) {
        r.discountedBefore == [1, 1]
        r.firstPlaced == ""
        r.secondPlaced.includes("PROMOTION_LIMIT_REACHED")
        r.repriced == ""
        r.secondDiscounts == 0
        r.statuses == ["OrderPlaced", "OrderPlaced"]
        r.thirdCodes == 0
        // 10% of a 20 unit, on one unit (one use per customer)
        dec(r.firstDiscount.quantity) == 1
        dec(r.firstDiscount.unitAmount) == -2
    }
})

feature("the expired code stays readable with its usage", {
    when() {
        const expired = post(users.manager, "Promotions/PromoCodeDetail/expireCode", {
            promoCodeId: walk.promoCodeId,
            changeReason: "Walk ended"
        })
        const detail = asUser(users.manager, () =>
            lib.page("Promotions/PromoCodeDetail", {promoCodeId: walk.promoCodeId, lastStandalone: "1"}, "html")
        )
        // as the screen calls it (its authorization inherited from the screen)
        const uses = asUser(
            users.read,
            () =>
                ec.service
                    .sync()
                    .name(P + "find#PromotionUses")
                    .parameters({promoCodeId: walk.promoCodeId})
                    .call(),
            false
        )
        return {
            expired,
            detail,
            uses,
            code: list("mantle.product.store.ProductStorePromoCode", {promoCodeId: walk.promoCodeId})[0]
        }
    },
    then({expired, detail, uses, code}) {
        expired.errors == []
        code.thruDate != null
        detail.errors == []
        detail.output.includes("Ended")
        detail.output.includes(walk.firstOrderId)
        uses.uses.map(row => row.orderId) == [walk.firstOrderId]
        uses.useCount == 1
    }
})

feature("the reader reads the promotion and cannot start one; another organization's manager is refused it", {
    when() {
        const readerCreate = post(users.read, "Promotions/Promotions/createPromotion", {
            itemDescription: "Reader promotion",
            newProductStoreId: ids.storeId,
            newServiceRegisterId: "BuyGetDiscount"
        })
        const readerDetail = asUser(users.read, () =>
            lib.page("Promotions/PromotionDetail", {storePromotionId: walk.storePromotionId, lastStandalone: "1"}, "html")
        )
        const otherDetail = asUser(users.services, () =>
            lib.page("Promotions/PromotionDetail", {storePromotionId: walk.storePromotionId, lastStandalone: "1"}, "html")
        )
        return {
            readerCreate,
            readerDetail,
            otherDetail,
            made: list("mantle.product.store.ProductStorePromotion", {itemDescription: "Reader promotion"}).length
        }
    },
    then({readerCreate, readerDetail, otherDetail, made}) {
        readerCreate.errors.join(" ").includes("PERMISSION_DENIED")
        made == 0
        readerDetail.output.includes("Walk ten percent")
        !readerDetail.output.includes("Reason for a change")
        otherDetail.output.includes("Not available")
    }
})

feature("each Promotions screen opens for the manager", {
    when() {
        const problems = []
        const screens = [
            ["Promotions/Promotions", {}],
            ["Promotions/PromoCodes", {storePromotionId: walk.storePromotionId}],
            ["Promotions/PromotionDetail", {storePromotionId: walk.storePromotionId}],
            ["Promotions/PromoCodeDetail", {promoCodeId: walk.promoCodeId}]
        ]
        for (const [path, parameters] of screens)
            for (const mode of ["qvt", "html"]) {
                const rendered = asUser(users.manager, () =>
                    lib.page(path, Object.assign({lastStandalone: "1"}, parameters), mode)
                )
                if (!opened(rendered)) problems.push(`${path} ${mode}: ${rendered.status} ${rendered.errors.join(" | ")}`)
            }
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})
