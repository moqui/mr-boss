// Commerce P4's "usable when" (impl-commerce P4), as an acceptance walk through the screens' transitions with artifact
// authorization on: a designer drafts a new version of ZIZI_SHOP's returns policy page in PageContent, a publisher
// publishes it from a date in PagePublication and the publication job shows it then, and the Forum's guidelines page of the
// same site reads as before; a menu item of a draft product is refused in Navigation, and so are a redirect onto /api and
// one into a loop; a scheduled delivery page whose publisher lost COMMERCE_PUBLISH stays unpublished at its date, with a
// readiness finding on the store. And each Website screen opens for its users in qvt and html. The rules themselves are
// Mantle's SitePages; access is CommerceAccess's. The site is published for the walk and put back after.
// Run: ./moq accept mr-boss --spec CommerceSitePagesWalk
const lib = ec.resource.script("component://mr-boss/test/Commerce/CommerceSpecLib.js")
const {ids, users, asUser, system, invoke} = lib
const T = "mantle.public.ThemeServices."
const SS = "mantle.public.SiteServices."
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0
// a transition posted as the user, as its form or the editor submits it: its errors and output
function post(user, path, parameters) {
    return asUser(user, () => {
        const result = ec.screen.makeTest().rootScreen("component://mr-boss/screen/Commerce.xml").render(path, parameters, "post")
        const errors = Array.from(result.errorMessages || [])
        ec.message.clearErrors()
        return {status: result.status, errors, output: String(result.output || "")}
    })
}
const json = result => {
    try {
        return JSON.parse(result.output)
    } catch (error) {
        return {}
    }
}
const row = conditions =>
    system(() => ec.entity.find("mantle.public.PublicSitePage").condition(conditions).disableAuthz().one()?.getMap() || null)
// the page as a visitor reads it (no one signed in)
function live(input) {
    const previous = ec.user.username
    ec.user.logoutUser()
    ec.message.pushErrors()
    try {
        const out = ec.service
            .sync()
            .name(SS + "get#SitePage")
            .parameters({input: Object.assign({siteId: ids.siteId}, input)})
            .call()
        return ec.message.hasError() ? {error: ec.message.getErrorsString()} : out.result
    } catch (error) {
        return {error: String(error.message)}
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
        if (previous) login(previous)
    }
}
const runJob = () => asUser("john.doe", () => invoke(T + "run#ScheduledSitePublications", {}), false)
const dueNow = sitePageId =>
    system(() => call("update#mantle.public.PublicSitePage", {sitePageId, scheduledFromDate: Date.now() - 1000}))
const publisherMembership = thruDate =>
    system(() =>
        call("update#moqui.security.UserGroupMember", {
            userGroupId: "BOSS_COMMERCE_PUBLISHER",
            userId: "BOSS_COM_PUBLISHER",
            fromDate: 0,
            thruDate
        })
    )
const walk = {}

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        walk.siteState = system(() => ec.entity.find("mantle.public.PublicSite").condition("siteId", ids.siteId).one().state)
        system(() => call("update#mantle.public.PublicSite", {siteId: ids.siteId, state: "published"}))
        walk.returns = row({siteId: ids.siteId, pageRole: "returns"})
        // the Forum's guidelines page of the same site, bound by an operator as PASS Sites does
        let guidelines = row({siteId: ids.siteId, pageRole: "guidelines"})
        if (!guidelines)
            system(() => {
                const wiki = (verb, input) => call("org.moqui.resource.WikiServices." + verb, input)
                if (!ec.entity.find("moqui.resource.wiki.WikiSpace").condition("wikiSpaceId", "COMWALKG").one())
                    wiki("create#WikiSpace", {wikiSpaceId: "COMWALKG", description: "Walk guidelines"})
                const wikiPageId = wiki("update#WikiPage", {
                    wikiSpaceId: "COMWALKG",
                    pageName: "Guidelines",
                    pageText: "Be kind to each other\n"
                }).wikiPageId
                const versionName = wiki("get#WikiPageHistory", {wikiPageId}).versionList[0].versionName
                wiki("set#PublishedVersion", {wikiPageId, publishedVersionName: versionName})
                invoke(SS + "publish#SitePage", {
                    input: {siteId: ids.siteId, pageRole: "guidelines", wikiPageId, versionName, expectedRevision: 0}
                })
            })
        walk.guidelinesBefore = live({pageRole: "guidelines"})
    },
    cleanupSpec() {
        publisherMembership(null)
        system(() => call("update#mantle.public.PublicSite", {siteId: ids.siteId, state: walk.siteState || "disabled"}))
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("a designer drafts the returns policy, a publisher publishes it from a date, and the Forum's guidelines read as before", {
    when() {
        const sitePageId = walk.returns.sitePageId
        const text = "# Returns policy\n\nReturn an item within 45 days of delivery. Walk " + Date.now() + "\n"
        const saved = post(users.designer, "Website/PageDetail/PageContent/savePage", {
            sitePageId,
            pageText: text,
            versionNote: "Longer window"
        })
        const draftNotLive = live({pageRole: "returns"})
        const fromDate = Date.now() + 3600000
        const scheduled = post(users.publisher, "Website/PageDetail/PagePublication/publishPage", {
            sitePageId,
            publishAction: "publish",
            versionName: json(saved).versionName,
            fromDate,
            expectedRevision: row({sitePageId}).publicationRevision,
            changeReason: "Longer returns window",
            operationKey: "walk-returns-" + Date.now()
        })
        const waiting = row({sitePageId})
        const stillOld = live({pageRole: "returns"})
        dueNow(sitePageId)
        const job = runJob()
        return {
            saved: json(saved),
            text,
            draftNotLive,
            scheduled,
            waiting,
            stillOld,
            job,
            after: live({pageRole: "returns"}),
            byRoute: live({appMountId: "shop", routePath: "returns", locale: "en_US"}),
            guidelines: live({pageRole: "guidelines"})
        }
    },
    then(r) {
        !!r.saved.versionName
        !r.draftNotLive.page.body.includes("45 days")
        r.scheduled.errors == []
        r.waiting.scheduledVersionName == r.saved.versionName
        !r.stillOld.page.body.includes("45 days")
        r.job.activatedCount >= 1
        r.after.page.body.includes("45 days")
        r.after.page.version == r.saved.versionName
        r.byRoute.page.sitePageId == walk.returns.sitePageId
        r.guidelines.page.body == walk.guidelinesBefore.page.body
        r.guidelines.page.body.includes("Be kind")
    }
})

feature("a menu item of a draft product is refused, and so are a redirect onto /api and one into a loop", {
    when() {
        const menu = system(() =>
            ec.entity
                .find("mantle.public.PublicSiteNavigation")
                .condition({siteId: ids.siteId, menuKey: "main"})
                .disableAuthz()
                .one()
        )
        const base = {siteId: ids.siteId, navigationId: menu.navigationId, expectedRevision: menu.draftRevision}
        const draftItem = post(
            users.merchandiser,
            "Website/Navigation/saveItem",
            Object.assign({label: "Variants", destinationTypeEnumId: "SdtProduct", destinationValue: "DEMO_VAR"}, base)
        )
        const toApi = post(users.merchandiser, "Website/Navigation/saveRedirect", {
            siteId: ids.siteId,
            oldPath: "/walk-old-api",
            destinationTypeEnumId: "SdtPath",
            destinationText: "/api/products"
        })
        const first = post(users.merchandiser, "Website/Navigation/saveRedirect", {
            siteId: ids.siteId,
            oldPath: "/walk-old-a",
            destinationTypeEnumId: "SdtPath",
            destinationText: "/walk-old-b"
        })
        const loop = post(users.merchandiser, "Website/Navigation/saveRedirect", {
            siteId: ids.siteId,
            oldPath: "/walk-old-b",
            destinationTypeEnumId: "SdtPath",
            destinationText: "/walk-old-a"
        })
        const unchanged = system(
            () =>
                ec.entity
                    .find("mantle.public.PublicSiteNavigation")
                    .condition("navigationId", menu.navigationId)
                    .disableAuthz()
                    .one().draftRevision
        )
        // the first redirect is a draft of the walk's; remove it so a rerun starts clean
        const firstRow = system(() =>
            ec.entity
                .find("mantle.public.PublicSiteRedirect")
                .condition({siteId: ids.siteId, oldPath: "/walk-old-a"})
                .disableAuthz()
                .one()
        )
        if (firstRow)
            post(users.merchandiser, "Website/Navigation/removeRedirect", {siteId: ids.siteId, redirectId: firstRow.redirectId})
        return {draftItem, toApi, first, loop, unchanged, revision: menu.draftRevision}
    },
    then(r) {
        r.draftItem.errors.join(" ").includes("DESTINATION_NOT_PUBLIC")
        r.unchanged == r.revision
        r.toApi.errors.join(" ").includes("PATH_RESERVED")
        r.first.errors == []
        r.loop.errors.join(" ").includes("REDIRECT_LOOP")
    }
})

feature("a scheduled page whose publisher lost the publish grant stays unpublished at its date, with a readiness finding", {
    when() {
        let delivery = row({siteId: ids.siteId, pageRole: "delivery"})
        if (!delivery) {
            const created = post(users.designer, "Website/Pages/createPage", {
                siteId: ids.siteId,
                title: "Delivery",
                routePath: "delivery",
                pageRole: "delivery"
            })
            delivery = row({siteId: ids.siteId, pageRole: "delivery"})
            walk.created = created
        }
        const sitePageId = delivery.sitePageId
        const versionName = asUser(
            users.designer,
            () => invoke(T + "get#SitePageHistory", {sitePageId}).currentVersionName,
            false
        )
        const scheduled = post(users.publisher, "Website/PageDetail/PagePublication/publishPage", {
            sitePageId,
            publishAction: "publish",
            versionName,
            fromDate: Date.now() + 3600000,
            expectedRevision: row({sitePageId}).publicationRevision,
            operationKey: "walk-delivery-" + Date.now()
        })
        publisherMembership(Date.now() - 1000)
        dueNow(sitePageId)
        runJob()
        publisherMembership(null)
        const after = row({sitePageId})
        const readiness = asUser(
            users.manager,
            () => invoke("mantle.product.StoreAdminServices.check#StoreReadiness", {productStoreId: ids.storeId}),
            false
        )
        const finding = Array.from(readiness.findings || []).find(f => f.key === "sitePublication")
        // clear it for a rerun: the publisher cancels what failed
        post(users.publisher, "Website/PageDetail/PagePublication/publishPage", {
            sitePageId,
            publishAction: "cancel",
            expectedRevision: after.publicationRevision,
            operationKey: "walk-cancel-" + Date.now()
        })
        return {scheduled, after, notLive: live({pageRole: "delivery"}), finding, cleared: row({sitePageId})}
    },
    then(r) {
        r.scheduled.errors == []
        r.after.failureCode == "PERMISSION_DENIED"
        r.after.versionName == null
        !!r.notLive.error
        r.finding.ready == false
        r.finding.message.includes("Delivery")
        r.cleared.failureCode == null
    }
})

feature("each Website screen opens for its users in qvt and html", {
    when() {
        const sitePageId = walk.returns.sitePageId
        const screens = [
            [users.designer, "Website/Pages", {}],
            [users.designer, "Website/PageDetail", {sitePageId}],
            [users.designer, "Website/PageDetail/PageText", {sitePageId, lastStandalone: "1"}],
            [users.designer, "Website/PageDetail/PageRoute", {sitePageId, lastStandalone: "1"}],
            [users.publisher, "Website/PageDetail/PagePublication", {sitePageId, lastStandalone: "1"}],
            [users.designer, "Website/PageDetail/PageHistory", {sitePageId, lastStandalone: "1"}],
            [users.merchandiser, "Website/Navigation", {siteId: ids.siteId}]
        ]
        const problems = []
        for (const [user, path, parameters] of screens)
            for (const mode of ["qvt", "html"]) {
                const rendered = asUser(user, () => lib.page(path, parameters, mode))
                if (!opened(rendered))
                    problems.push(mode + " " + path + ": " + rendered.status + " " + rendered.errors.join("; "))
            }
        const navigation = asUser(users.merchandiser, () => lib.page("Website/Navigation", {siteId: ids.siteId}, "html"))
        return {problems, navigation}
    },
    then({problems, navigation}) {
        problems == []
        navigation.output.includes("Main menu")
        navigation.output.includes("Returns")
    }
})
