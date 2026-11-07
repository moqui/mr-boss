// Commerce reviews (impl-commerce P9; design-commerce §4 Reviews): a merchandiser's bulk decision as the Reviews list posts it
// (the selected rows' productReviewId@revision) answers a result per review: the one at its revision approved, one changed
// since it was shown refused as stale, another organization's store's refused as unavailable, each left as it was; and the
// Reviews screen's one qvt render under Commerce (the list, its bulk action and the row's decision and reply). The review
// rules are Mantle's (StoreReviews); the walk is the acceptance CommerceReviewsScenario.
// Run: ./moq test mr-boss --spec Commerce/CommerceReviews
const lib = ec.resource.script("component://mr-boss/test/Commerce/CommerceSpecLib.js")
const {ids, users, asUser, system, invoke} = lib
const M = "mantle.product.StoreMerchandisingServices."
const R = "mantle.product.ProductReview"
const state = {}
const review = (productStoreId, text) =>
    system(
        () =>
            ec.service
                .sync()
                .name("create#" + R)
                .requireNewTransaction(true)
                .parameters({
                    productStoreId,
                    productId: "DEMO_1_2",
                    statusId: "PrvwPending",
                    productRating: 4,
                    productReview: text,
                    displayName: "Spec R.",
                    postedDateTime: ec.user.nowTimestamp
                })
                .call().productReviewId
    )
const row = productReviewId => system(() => ec.entity.find(R).condition({productReviewId}).useCache(false).one())
// a revision as the list's selection key carries it, in milliseconds (a row's stamp reads as a number, its text or a date)
const stampOf = value => (/^\d+$/.test(String(value)) ? Number(value) : new Date(value).getTime())
const keyOf = productReviewId => productReviewId + "@" + stampOf(row(productReviewId).lastUpdatedStamp)

spec({
    setupSpec() {
        login("john.doe")
        state.fresh = review(ids.storeId, "Commerce reviews spec: decided")
        state.stale = review(ids.storeId, "Commerce reviews spec: changed since shown")
        state.foreign = review(ids.otherStoreId, "Commerce reviews spec: another organization's")
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("a bulk decision answers a result per review: approved, stale, another organization's store", {
    when() {
        const keys = [keyOf(state.fresh), state.stale + "@1000", keyOf(state.foreign)]
        const decided = asUser(
            users.merchandiser,
            () => invoke(M + "moderate#Review", {decision: "approve", selectionKeys: keys.join(","), changeReason: "Spec"}),
            false
        )
        return {decided, statuses: [state.fresh, state.stale, state.foreign].map(id => row(id).statusId)}
    },
    then(r) {
        r.decided.results.length == 3
        r.decided.decidedCount == 1
        r.decided.results[0].ok == true
        r.decided.results[1].reasonCode == "STALE_REVISION"
        r.decided.results[2].reasonCode == "RECORD_UNAVAILABLE"
        r.statuses == ["PrvwApproved", "PrvwPending", "PrvwPending"]
    }
})

// Reviews under Commerce, rendered once (qvt): the pending review's row with its decision and the bulk action
feature("Reviews shows the store's pending reviews with the bulk decision and the row's decision", {
    when() {
        return asUser(users.merchandiser, () => lib.page("Merchandising/Reviews", {productStoreId: ids.storeId}))
    },
    then(result) {
        result.status == 200
        result.errors == []
        result.output.includes("Commerce reviews spec: changed since shown")
        !result.output.includes("Commerce reviews spec: decided")
        !result.output.includes("another organization's")
        result.output.includes("Approve or delete")
        result.output.includes("ReviewDecision_" + state.stale)
        result.output.includes("Spec R.")
    }
})
