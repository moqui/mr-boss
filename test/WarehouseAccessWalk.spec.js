// The Warehouse access walk (design-warehouse §19 and crosscut §6 standalone operation, impl-warehouse P18): an organization
// with no ProductStore, BOSS_P18_ORG, runs receive to ship with Warehouse users of one capability each and no other launcher
// (WarehouseStandaloneLib); each of those users and Retail's demo Warehouse users opens Warehouse and no other app root;
// Retail's users never see the organization's records on the routes that show them to its own users (URLs, the shared and
// Handheld mounts, the record panels, html and terminal); no notice of its records reaches a Retail user. Exports, the
// palette, search, cost and settlement are WarehouseIsolationWalk's.
// Run: ./moq test mr-boss --spec WarehouseAccessWalk
const lib = ec.resource.script("component://mr-boss/test/WarehouseSpecLib.js")
const {asUser, page} = lib
const w = ec.resource.script("component://mr-boss/test/WarehouseStandaloneLib.js")
const {FACILITY, SUPPLIER, ORG, PRODUCT, SECRET, RETAIL, COST, PRICE, p18Users, retailUsers, sweepUsers, otherRoots, T, key,
    one, rows, run, render, read, refusedFor, leaks, retailPattern, p18Routes, requiredShown, routeName} = w
// the organization's records, set by the receive-to-ship feature, and when the spec began
const p18 = {}
let startedAt

spec({
    setupSpec() {
        login("john.doe")
        startedAt = ec.user.nowTimestamp
        w.setup()
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("an organization with no ProductStore runs receive to ship, each step by a user of its capability alone", {
    when() {
        const flow = w.receiveToShip()
        Object.assign(p18, flow.p18)
        return flow
    },
    then({steps, stores, inspection, shipment, onHand}) {
        stores == 0
        steps.ensure == ""
        steps.receivePage.errors == []
        steps.receive == ""
        steps.quarantined == "AstQuarantine"
        steps.receiptPage.errors == []
        steps.receiptPage.output.includes("P18 secret gasket")
        steps.queue.errors == []
        steps.queue.output.includes(p18.inspectionId)
        steps.submit == ""
        steps.verify == ""
        steps.release == ""
        inspection.statusId == "QiDisposed"
        steps.putawayPage.errors == []
        steps.putaway == ""
        steps.putawayTo == "PICK1"
        steps.reserved == 4
        steps.shipment == ""
        steps.pick == ""
        steps.finishPick == ""
        steps.packPage.errors == []
        steps.packPage.output.includes("P18 secret gasket")
        steps.pack == ""
        steps.weigh == ""
        steps.complete == ""
        steps.shipPage.errors == []
        steps.shipPage.output.includes("P18 secret gasket")
        steps.tracking == ""
        steps.ship == ""
        shipment.statusId == "ShipShipped"
        onHand == 1
        !!p18.invoiceId
        steps.count == ""
        !!p18.countId
        steps.startCount == ""
    }
})

feature("each Warehouse user opens Warehouse and no other app root", {
    when() {
        const problems = []
        for (const username of Object.keys(p18Users).concat(retailUsers))
            asUser(username, () => {
                const home = page("Home", {}, "html")
                if (home.status != 200 || home.errors.length) problems.push(`${username} cannot open Warehouse: ${home.errors}`)
                for (const root of otherRoots) {
                    const other = render(root, "", {})
                    if (other.status == 200 && !other.errors) problems.push(`${username} opens the ${root} app`)
                }
            })
        // the roots open for a user granted them, so a refusal above is not a broken render
        const opened = asUser("john.doe", () => otherRoots.filter(root => {
            const page = render(root, "", {})
            return page.status == 200 && !page.errors
        }))
        if (problems.length) log.warn("Warehouse access walk problems:\n" + problems.join("\n"))
        return {problems, opened}
    },
    then({problems, opened}) {
        problems.join("\n") == ""
        opened == otherRoots
    }
})

feature("Retail's Warehouse users see nothing of the other organization by URL, shared and Handheld mounts, html and terminal", {
    when() {
        const problems = []
        if (!p18.shipmentId) problems.push("the receive-to-ship records are missing")
        // which routes show the organization's records to its own user who may open them
        const shown = p18Routes(p18).filter(route =>
            asUser(route.owner, () => SECRET.test(page(route.path, route.parameters, route.mode).output)))
        const notShown = p18Routes(p18).filter(route => !shown.some(other => routeName(other) === routeName(route)))
            .map(routeName)
        // a Retail leak counts on those routes, in html for every swept capability and also in the terminal for the reader
        for (const username of sweepUsers)
            asUser(username, () => {
                const renders = []
                for (const route of shown) {
                    renders.push([routeName(route), page(route.path, route.parameters, route.mode)])
                    if (username === "warehouse.read" && route.mode === "html")
                        renders.push([routeName(route) + " (tui)", page(route.path, route.parameters, "tui")])
                }
                problems.push(...leaks(username, renders, SECRET))
            })
        if (problems.length) log.warn("Warehouse access walk problems:\n" + problems.join("\n"))
        if (notShown.length) log.info("Routes that show no P18 record to their owner:\n" + notShown.join("\n"))
        return {problems, shownPaths: [...new Set(shown.map(route => route.path))], count: shown.length}
    },
    then({problems, shownPaths, count}) {
        problems.join("\n") == ""
        requiredShown.filter(path => !shownPaths.includes(path)) == []
        count > 30
    }
})

feature("the organization's notices reach its own users only: none of Retail's users got one about its records", {
    when() {
        const problems = []
        if (!p18.shipmentId) problems.push("the receive-to-ship records are missing")
        const userIdOf = username => one("moqui.security.UserAccount", {username})?.userId
        // the notices sent since the spec began that name the organization's records
        const ids = [p18.receiptId, p18.shipmentId, p18.inspectionId, p18.assetId, FACILITY, PRODUCT].filter(Boolean)
        const notices = Array.from(ec.entity.find("moqui.security.user.NotificationMessage")
            .condition("sentDate", "greater-equals", startedAt).disableAuthz().list())
            .filter(notice => SECRET.test([notice.titleText, notice.messageJson, notice.linkText].join(" ")) ||
                ids.some(id => [notice.messageJson, notice.linkText, notice.recordId].join(" ").includes(id)))
        const recipients = new Set()
        for (const notice of notices)
            for (const row of Array.from(ec.entity.find("moqui.security.user.NotificationMessageUser")
                .condition("notificationMessageId", notice.notificationMessageId).disableAuthz().list()))
                recipients.add(row.userId)
        const retailIds = retailUsers.concat(["warehouse.manager", "warehouse.admin"]).map(userIdOf)
        for (const userId of retailIds) if (recipients.has(userId)) problems.push(`${userId} got a notice of the P18 records`)
        if (problems.length) log.warn("Warehouse access walk problems:\n" + problems.join("\n"))
        return {problems, topics: [...new Set(notices.map(notice => notice.topic))], recipients: [...recipients],
            manager: userIdOf("p18.manager"), verifier: userIdOf("p18.quality")}
    },
    then({problems, topics, recipients, manager, verifier}) {
        problems.join("\n") == ""
        // the organization's own users got theirs: the rejected unit to its stock policy manager, the submitted inspection
        // to its quality manager (QUALITY_VERIFY)
        topics.includes("WarehouseReceiptException")
        recipients.includes(manager)
        recipients.includes(verifier)
    }
})
