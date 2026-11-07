// Commerce P9's "usable when" (impl-commerce P9; design-commerce §12.2 scenario 10, design-shop §18.1 "Reviews and support", its
// review half), as an acceptance scenario through the Shop operations and pages and the Commerce Reviews screen's transitions
// with artifact authorization on: a buyer reviews a delivered item of the demo store with a photo; the merchandiser approves it
// and replies on Reviews; the public product page shows the reply and the photo and no private identity, and the photo is
// served by its digest; deciding another buyer's review leaves this one alone; the buyer's edit returns it to pending and out
// of the average, its photo no longer served. The rules are Mantle's StoreReviews and CommerceReviews'.
// Run: ./moq accept mr-boss --spec CommerceReviewsScenario
const lib = ec.resource.script("component://mr-boss/test/Commerce/CommerceSpecLib.js")
const {ids, users, asUser, system} = lib
const stamp = String(Date.now()).slice(-6)
const SITE = "BOSS_REV_SITE_" + stamp,
    HOST = "reviews" + stamp + ".zizi.example.test"
const productId = "DEMO_1_1"
const R = "mantle.product.ProductReview"
// a 1x1 PNG
const PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
const walk = {}
const make = (entity, values) =>
    system(
        () =>
            ec.service
                .sync()
                .name("create#" + entity)
                .parameters(values)
                .requireNewTransaction(true)
                .call() || {}
    )
const one = (entity, conditions) => system(() => ec.entity.find(entity).condition(conditions).useCache(false).one())
// a Commerce transition posted as the user, as its form submits it: the messages it leaves
function post(user, path, parameters) {
    return asUser(user, () => {
        const result = ec.screen.makeTest().rootScreen("component://mr-boss/screen/Commerce.xml").render(path, parameters, "post")
        const errors = Array.from(result.errorMessages || [])
        const messages = Array.from(ec.message.getMessages?.() || [])
        ec.message.clearErrors()
        return {status: result.status, errors, messages}
    })
}
// a Shop operation as the visitor (a username, or null for a visitor), through the facade as a page calls it
function shop(username, operation, input) {
    if (username) login(username)
    else logout()
    try {
        const out = ec.resource
            .script("component://mr-pass/screen/Shared/Portal.js")
            .attempt(operation, Object.assign({siteId: SITE}, input), {newTransaction: true})
        return out.error ? {error: out.error} : {result: out.result}
    } finally {
        login("john.doe")
    }
}
// the photo as the Review page's next call adds it (a FileItem keeps its methods only in process)
function addPhoto(username, review) {
    login(username)
    try {
        return ec.resource.script("component://mr-mantle/service/mantle/product/StoreReviews.js").execute("submitReview", {
            siteId: SITE,
            productId,
            productReviewId: review.id,
            expectedRevision: review.revision,
            rating: "5",
            body: "The mug I wanted, and it arrived well packed.",
            displayChoice: "name",
            file: {
                name: "mug.png",
                size: 68,
                contentType: "image/png",
                write(location) {
                    ec.resource.getLocationReference(location).putBytes(StringUtilities.base64Decode(PNG))
                }
            }
        })
    } finally {
        login("john.doe")
    }
}
// the public product page, as a visitor's browser gets it (the PASS shell: the spec's site has no published theme)
function productPage() {
    logout()
    try {
        const rendered = ec.screen
            .makeTest()
            .rootScreen("component://mr-pass/screen/Pass.xml")
            .render(
                "Shop/Products/ProductDetail",
                {resolvedSiteId: SITE, publicHost: HOST, publicPath: walk.productUrl, productId},
                null
            )
        return {html: String(rendered.output || ""), errors: Array.from(rendered.errorMessages || [])}
    } finally {
        login("john.doe")
    }
}
const photo = digest =>
    system(() => {
        try {
            return ec.resource
                .script("component://mr-mantle/service/mantle/product/StoreReviews.js")
                .execute("getReviewImage", {siteId: SITE, reviewImage: digest})
        } catch (error) {
            return {refused: error.moquiErrorKind || "Error"}
        }
    })
// a buyer account (verified) and its completed, delivered order of the product
function buyer(name) {
    const partyId = "BOSS_REV_" + name.toUpperCase() + "_" + stamp
    make("mantle.party.Party", {partyId, partyTypeEnumId: "PtyPerson"})
    make("mantle.party.Person", {partyId, firstName: name, lastName: "Shopper"})
    make("mantle.party.PartyRole", {partyId, roleTypeId: "Customer"})
    const email = partyId.toLowerCase() + "@reviews.example.test"
    make("moqui.security.UserAccount", {
        userId: partyId,
        username: partyId,
        partyId,
        emailAddress: email,
        currentPassword: "16ac58bbfa332c1c55bd98b53e60720bfa90d394",
        passwordHashType: "SHA",
        timeZone: "UTC"
    })
    make("moqui.security.public.VerifiedAddress", {userId: partyId, emailAddress: email, verifiedAt: ec.user.nowTimestamp})
    const orderId = make("mantle.order.OrderHeader", {
        productStoreId: ids.storeId,
        statusId: "OrderOpen",
        currencyUomId: "USD",
        placedDate: ec.user.nowTimestamp
    }).orderId
    make("mantle.order.OrderPart", {
        orderId,
        orderPartSeqId: "01",
        customerPartyId: partyId,
        vendorPartyId: ids.organizationId,
        statusId: "OrderOpen"
    })
    make("mantle.order.OrderItem", {
        orderId,
        orderItemSeqId: "01",
        orderPartSeqId: "01",
        itemTypeEnumId: "ItemProduct",
        productId,
        quantity: 1,
        unitAmount: "16.99"
    })
    // delivered: the order completed as a record (the order's own flow is Mantle's and the walks' of Warehouse)
    system(() => {
        for (const entity of ["mantle.order.OrderHeader", "mantle.order.OrderPart"])
            for (const row of ec.entity.find(entity).condition({orderId}).list()) {
                row.statusId = "OrderCompleted"
                row.update()
            }
    })
    return partyId
}

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        make("mantle.public.PublicSite", {siteId: SITE, name: "Reviews walk", state: "published", locale: "en", generation: 1})
        make("mantle.public.PublicSiteHost", {hostname: HOST, siteId: SITE, canonical: "Y"})
        make("mantle.public.PublicSiteApp", {
            siteId: SITE,
            appMountId: "shop",
            app: "shop",
            pathPrefix: "/shop",
            enabled: "Y",
            targetId: ids.storeId
        })
        // the product page's canonical address (an old slug is redirected)
        walk.productUrl = shop(null, "getProductReviews", {productId}).result.product.url
        walk.buyer = buyer("Rhea")
        walk.other = buyer("Olaf")
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("a buyer reviews a delivered item with a photo; it waits for approval", {
    when() {
        const written = shop(walk.buyer, "submitProductReview", {
            productId,
            rating: "5",
            body: "The mug I wanted, and it arrived well packed.",
            displayChoice: "name"
        })
        const withPhoto = addPhoto(walk.buyer, written.result.review)
        walk.reviewId = written.result.review.id
        walk.digest = one("mantle.product.ProductReviewImage", {productReviewId: walk.reviewId})?.digest
        const other = shop(walk.other, "submitProductReview", {
            productId,
            rating: "1",
            body: "Not for me.",
            displayChoice: "anonymous"
        })
        walk.otherId = other.result?.review.id
        return {written, withPhoto, other, pendingPhoto: photo(walk.digest), page: productPage()}
    },
    then(r) {
        r.written.result.review.statusText == "Waiting for approval"
        r.withPhoto.imageRefused == null
        r.withPhoto.review.imageCount == 1
        r.other.result.review.statusText == "Waiting for approval"
        r.pendingPhoto.refused == "NotFound"
        r.page.errors.length == 0
        r.page.html.includes('id="ProductReviews"')
        !r.page.html.includes("The mug I wanted")
    }
})

feature("the merchandiser approves and replies; the product page shows the reply and the photo and no private identity", {
    when() {
        const reviews = post(users.merchandiser, "Merchandising/Reviews/moderate", {
            decision: "approve",
            productReviewId: walk.reviewId,
            expectedLastUpdatedStamp: one(R, {productReviewId: walk.reviewId}).lastUpdatedStamp,
            changeReason: "Looks genuine"
        })
        const replied = post(users.merchandiser, "Merchandising/Reviews/reply", {
            productReviewId: walk.reviewId,
            replyText: "Thank you, Rhea. Enjoy your coffee!",
            expectedLastUpdatedStamp: one(R, {productReviewId: walk.reviewId}).lastUpdatedStamp
        })
        // the reader sees the queue and cannot decide
        const reader = post(users.read, "Merchandising/Reviews/moderate", {decision: "approve", productReviewId: walk.otherId})
        return {reviews, replied, reader, page: productPage(), served: photo(walk.digest)}
    },
    then(r) {
        r.reviews.errors.length == 0
        r.replied.errors.length == 0
        r.reader.errors.join(" ").includes("COMMERCE_MERCHANDISE")
        one(R, {productReviewId: walk.otherId}).statusId == "PrvwPending"
        r.page.errors.length == 0
        r.page.html.includes("The mug I wanted, and it arrived well packed.")
        r.page.html.includes("Rhea S.")
        r.page.html.includes("Thank you, Rhea. Enjoy your coffee!")
        r.page.html.includes("reviewImage=" + walk.digest)
        r.page.html.includes("5.0 of 5")
        !r.page.html.includes(walk.buyer)
        !r.page.html.includes("reviews.example.test")
        r.served.location != null
    }
})

feature("deciding another review leaves this one alone; the buyer's edit returns it to pending and out of the average", {
    when() {
        const deleted = post(users.merchandiser, "Merchandising/Reviews/moderate", {
            decision: "delete",
            productReviewId: walk.otherId,
            expectedLastUpdatedStamp: one(R, {productReviewId: walk.otherId}).lastUpdatedStamp,
            changeReason: "Not about the product"
        })
        const after = one(R, {productReviewId: walk.reviewId})
        const mine = shop(walk.buyer, "getProductReviews", {productId}).result.own
        const edited = shop(walk.buyer, "submitProductReview", {
            productId,
            productReviewId: walk.reviewId,
            expectedRevision: mine.revision,
            rating: "3",
            body: "The handle came loose after a week.",
            displayChoice: "name"
        })
        return {deleted, after, edited, page: productPage(), served: photo(walk.digest)}
    },
    then(r) {
        r.deleted.errors.length == 0
        one(R, {productReviewId: walk.otherId}).statusId == "PrvwDeleted"
        r.after.statusId == "PrvwApproved"
        r.edited.result.review.statusText == "Waiting for approval"
        one(R, {productReviewId: walk.reviewId}).statusId == "PrvwPending"
        r.page.html.includes("No reviews yet.")
        !r.page.html.includes("handle came loose")
        r.served.refused == "NotFound"
    }
})
