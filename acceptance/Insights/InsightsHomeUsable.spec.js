// Insights P5's "usable when" (impl-insights P5; design-insights §3 Home, §13.3 "Same metric on many surfaces" and "Source
// quality"), server side through the screens on the demo data: insights.reader opens Home and sees ORG_ZIZI_RETAIL's orders and
// order value by currency on the suite dashboard's panels, and no count from an app they cannot read; a Warehouse user sees the
// receipts waiting at their facility as a count equal to the receipts list's own and opening it; an administrator's counts each
// open their owner's worklist with its filter; a provider that fails names itself on its own card while the others show. The
// rules are the regression InsightsHome; Mantle's sales datasets are admitted by InsightsDatasetsUsable first. Written with P5,
// not run as part of it.
// Run: ./moq accept mr-boss --spec InsightsHomeUsable
const lib = ec.resource.script("component://mr-boss/test/Insights/InsightsSpecLib.js")
const {users, asUser, system, invoke} = lib
const G = "ironstone.insights.RegistryServices."
const webroot = "component://webroot/screen/webroot.xml"
const userIds = ["BOSS_INS_READER", "BOSS_INS_WAREHOUSE"]

function render(user, path, parameters = {}, mode = "qvt") {
    return asUser(user, () => {
        const test = ec.screen.makeTest().rootScreen(webroot).renderMode(mode)
        if (mode === "qvt") test.withStaticData()
        const result = test.render(path, Object.assign(mode === "qvt" ? {lastStandalone: "true"} : {}, parameters), null)
        const output = String(result.output || "")
        const failed = output.match(/(Error rendering|Exception in render)[^\n<]*/g) || []
        return {
            status: result.status,
            output,
            errors: Array.from(result.errorMessages || [])
                .concat(failed)
                .join(" | ")
        }
    })
}
function removeSpecData() {
    system(() => {
        ec.entity.find("ironstone.insights.AttentionProvider").condition("ownerApp", "InsightsUsable").deleteAll()
        ec.entity
            .find("moqui.security.UserPreference")
            .condition("userId", "in", userIds)
            .condition("preferenceKey", "in", ["InsightsHome", "FacilityActive"])
            .deleteAll()
    })
}

spec({
    stepwise: true,
    // the sales datasets admitted by the steward (P3's "usable when")
    dependsOn: ["InsightsDatasetsUsable"],
    setupSpec() {
        login(users.system)
        removeSpecData()
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login(users.system)
        removeSpecData()
    }
})

feature("insights.reader opens Home and sees ORG_ZIZI_RETAIL's orders and order value by currency, no app they cannot read", {
    when() {
        return {home: render(users.reader, "apps/Insights/Home", {organizationPartyId: "ORG_ZIZI_RETAIL"})}
    },
    then({home}) {
        home.status == 200
        home.errors == ""
        home.output.includes("Scope: Ziziwork Retail")
        home.output.includes("Orders by currency")
        home.output.includes("Order value by currency")
        home.output.includes("USD")
        !home.output.includes("Ziziwork Services")
        home.output.includes("Nothing is waiting in the apps you use.")
        !home.output.includes("Draft orders")
        !home.output.includes("Receiving")
    }
})

feature("a Warehouse user sees the receipts waiting at their facility, the receipts list's own count, opening it", {
    when() {
        return asUser(users.warehouse, () => {
            ec.user.setPreference("FacilityActive", "BOSS_WH_EAST")
            const board = invoke(G + "get#Attention", {})
            const receipts = invoke("ironstone.warehouse.ReceiptServices.get#Receipts", {
                facilityId: "BOSS_WH_EAST",
                sourceType: "purchase",
                pageSize: 1
            })
            const cards = Array.from(board.groups || []).flatMap(group => group.cards)
            return {
                owners: Array.from(board.groups || []).map(group => group.ownerApp),
                receiving: cards.find(card => card.providerKey === "Warehouse.Receiving") || {},
                expected: Number(receipts.receiptRowsCount),
                list: render(users.warehouse, "apps/Warehouse/Receiving/Receipts", {facilityId: "BOSS_WH_EAST"}, "html")
            }
        })
    },
    then({owners, receiving, expected, list}) {
        owners == ["Warehouse"]
        receiving.state == "available"
        receiving.count == expected
        receiving.url == "/qapps/Warehouse/Receiving/Receipts?facilityId=BOSS_WH_EAST"
        list.status == 200
    }
})

feature("an administrator's counts each open their owner's worklist with its filter", {
    when() {
        const board = asUser(users.system, () => invoke(G + "get#Attention", {organizationPartyId: "ORG_ZIZI_RETAIL"}))
        const problems = []
        for (const card of Array.from(board.groups || []).flatMap(group => group.cards)) {
            if (card.state !== "available") {
                problems.push(card.providerKey + " " + card.state + " " + card.message)
                continue
            }
            const [path, query] = card.url.replace("/qapps/", "apps/").split("?")
            const parameters = Object.fromEntries(
                String(query || "")
                    .split("&")
                    .filter(Boolean)
                    .map(pair => pair.split("=").map(decodeURIComponent))
            )
            const opened = render(users.system, path, parameters, "html")
            if (opened.status != 200 || opened.errors)
                problems.push(card.providerKey + " opens " + opened.status + " " + opened.errors)
        }
        return {keys: Array.from(board.groups || []).length, problems}
    },
    then({keys, problems}) {
        keys > 5
        problems == []
    }
})

feature("a provider that fails names itself on its own card while the others show", {
    when() {
        system(() =>
            ec.service
                .sync()
                .name("create#ironstone.insights.AttentionProvider")
                .parameters({
                    providerKey: "InsightsUsable.Broken",
                    ownerApp: "InsightsUsable",
                    title: "Broken count",
                    countService: G + "get#Home",
                    countField: "noSuchCount",
                    routePath: "Insights/Reports",
                    sequenceNum: 9999
                })
                .call()
        )
        return {home: render(users.reader, "apps/Insights/Home")}
    },
    then({home}) {
        home.status == 200
        home.output.includes("Broken count: InsightsUsable did not answer this count just now")
        home.output.includes("Orders by currency")
    }
})
