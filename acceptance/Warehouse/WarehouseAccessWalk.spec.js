// The Warehouse access and isolation walk (design-warehouse §19 and crosscut §6 standalone operation, impl-warehouse P18),
// an acceptance test: an organization with no ProductStore, BOSS_P18_ORG, runs receive to ship with Warehouse users of one
// capability each and no other launcher (WarehouseStandaloneLib); each of those users and Retail's demo Warehouse users
// opens Warehouse and no other app root; Retail's users never see the organization's records on the routes that show them
// to its own users (URLs, the shared and Handheld mounts, the record panels, html and terminal); no notice of its records
// reaches a Retail user. Then the other way: the organization's users never see Retail's records on any Warehouse route;
// exports and prints of each side hold only its rows; the palette, scans, record links, search and drop-downs keep each
// side to its records; no cost or price shows without financial read, and Accounting's settlement, invoice release and
// revaluation refuse both sides' Warehouse users. The isolation features use the receive-to-ship feature's records.
// Run: ./moq accept mr-boss --spec WarehouseAccessWalk
const lib = ec.resource.script("component://mr-boss/test/Warehouse/WarehouseSpecLib.js")
const {asUser, page} = lib
const w = ec.resource.script("component://mr-boss/test/Warehouse/WarehouseStandaloneLib.js")
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

feature("the other organization's Warehouse users see nothing of Retail's records on any Warehouse route", {
    when() {
        const problems = []
        if (!p18.shipmentId) problems.push("the receive-to-ship records are missing")
        const routes = Object.entries(lib.routeFixtures().routes).filter(([, fixture]) => fixture.parameters)
        for (const username of ["p18.read", "p18.receive", "p18.pick", "p18.quality"])
            asUser(username, () => {
                const renders = routes.map(([path, fixture]) => [path, page(path, fixture.parameters, "html")])
                problems.push(...leaks(username, renders, retailPattern))
                // and their own records show, so a page that fails is not taken for a refusal
                const own = page("Inventory/AssetDetail", {assetId: p18.assetId}, "html")
                if (!SECRET.test(own.output)) problems.push(`${username} does not see its own asset`)
            })
        if (problems.length) log.warn("Warehouse access walk problems:\n" + problems.join("\n"))
        return {problems, count: routes.length}
    },
    then({problems, count}) {
        count > 60
        problems.join("\n") == ""
    }
})

feature("exports and prints of each side hold only its organization's rows", {
    when() {
        const problems = []
        if (!p18.shipmentId) problems.push("the receive-to-ship records are missing")
        const exported = Object.entries(lib.routeFixtures().routes).filter(([path]) => {
            const location = `component://mr-boss/screen/Warehouse/${path}.xml`
            const reference = ec.resource.getLocationReference(location)
            return reference.getExists() && /show-csv-button="true"/.test(reference.getText())
        })
        const sides = [["warehouse.read", FACILITY, SECRET], ["warehouse.receive", FACILITY, SECRET],
            ["p18.read", "ZIRET_WH", retailPattern], ["p18.receive", "ZIRET_WH", retailPattern]]
        for (const [username, facilityId, pattern] of sides)
            asUser(username, () => {
                const renders = []
                for (const [path, fixture] of exported)
                    for (const parameters of [fixture.parameters || {}, {facilityId}])
                        renders.push([`${path} csv ${JSON.stringify(parameters)}`, page(path, parameters, "csv")])
                for (const [path, parameters] of [["Shipping/PackingSlip", {shipmentId: p18.shipmentId}],
                    ["Receiving/ReceiptDocument", {shipmentId: p18.receiptId}], ["Shipping/Manifest", {facilityId: FACILITY}],
                    ["Receiving/PutawaySheet", {facilityId: FACILITY}], ["Picking/PickSheet", {workEffortId: "BOSS_WH_LOAD"}],
                    ["Shipping/PackingSlip", {shipmentId: "BOSS_WH_SHIP_PACK"}], ["Shipping/Manifest", {facilityId: "ZIRET_WH"}]])
                    renders.push([`${path} print ${JSON.stringify(parameters)}`, page(path, parameters, "html-print")])
                problems.push(...leaks(username, renders, pattern))
            })
        // each side's own CSV and print hold its rows, so an empty export is not taken for a refusal
        const own = {
            p18Csv: asUser("p18.read", () => page("Inventory/Movements", {facilityId: FACILITY}, "csv")).output,
            p18Print: asUser("p18.read", () => page("Shipping/PackingSlip", {shipmentId: p18.shipmentId}, "html-print")).output,
            // every row, as the list's CSV link asks (pageNoLimit): the suite's other specs page the demo asset off the first page
            retailCsv: asUser("warehouse.read", () => page("Inventory/Assets", {facilityId: "ZIRET_WH", pageNoLimit: "true"}, "csv"))
                .output
        }
        if (problems.length) log.warn("Warehouse access walk problems:\n" + problems.join("\n"))
        return {problems, count: exported.length, own}
    },
    then({problems, count, own}) {
        count >= 8
        problems.join("\n") == ""
        SECRET.test(own.p18Csv)
        SECRET.test(own.p18Print)
        own.retailCsv.includes("BOSS_WH_PACK_STOCK")
    }
})

feature("the palette, scans, record links, search and drop-downs keep each side to its records", {
    when() {
        const problems = []
        if (!p18.shipmentId) problems.push("the receive-to-ship records are missing")
        const p18Ids = [[ "MantleShipment", p18.receiptId], ["MantleShipment", p18.shipmentId], ["MantleAsset", p18.assetId],
            ["MantleFacility", FACILITY]]
        const retailIds = [["MantleShipment", "BOSS_WH_SHIP_IN"], ["MantleAsset", "BOSS_WH_LOT_AVAIL"],
            ["MantleFacility", "ZIRET_WH"]]
        const found = {}
        // each document type's kind among the Warehouse records, and the parameter its link names the id by
        const recordKinds = {MantleShipment: ["shipment", "shipmentId"], MantleAsset: ["asset", "assetId"],
            MantleFacility: ["facility", "facilityId"]}
        for (const [username, foreign, own] of [["warehouse.read", p18Ids, retailIds], ["warehouse.pick", p18Ids, retailIds],
            ["p18.read", retailIds, p18Ids], ["p18.ship", retailIds, p18Ids]])
            asUser(username, () => {
                for (const [docType, id] of foreign) {
                    // sequenced ids are shared across kinds (the other side's asset 100053 beside this shipment 100053), so
                    // a match is the record's own kind: its id in the row's link, or the id anywhere in a row with no link
                    const [kind, idParam] = recordKinds[docType]
                    const ownKind = new RegExp(`[?&](${idParam}=|lookupType=${kind}&lookupId=)${id}(&|$)`)
                    const palette = read("ironstone.warehouse.AccessServices.search#Records", {text: id, limit: 20})
                    if ((palette.rows || []).some(row => row.url ? ownKind.test(row.url) : JSON.stringify(row).includes(id)))
                        problems.push(`${username} finds ${id} in the palette`)
                    const scanned = read("ironstone.warehouse.AccessServices.get#ScannedRecord", {scanText: id, recordType: kind})
                    if ((scanned.matches || []).some(match => match.recordId === id)) problems.push(`${username} scans ${id}`)
                    const link = read("ironstone.commons.PaletteServices.get#RecordLink", {docType, id})
                    if (link.url) problems.push(`${username} has a link to ${id}`)
                    // the palette's search runs with the user's authorization and organization filters
                    const universal = asUser(username, () => {
                        try {
                            return ec.service.sync().name("mantle.search.UniversalSearchServices.search#Universal")
                                .parameters({q: id, entityType: docType}).call() || {}
                        } catch (error) {
                            return {}
                        }
                    })
                    if (Array.from(universal.results || []).length) problems.push(`${username} finds ${id} in search`)
                }
                // the user's own facility is found and linked, so an empty answer is not taken for a refusal
                const [, ownFacility] = own.find(([docType]) => docType === "MantleFacility")
                found[username] = {
                    palette: (read("ironstone.warehouse.AccessServices.search#Records", {text: ownFacility, limit: 20}).rows || [])
                        .length,
                    link: read("ironstone.commons.PaletteServices.get#RecordLink", {docType: "MantleFacility", id: ownFacility}).url
                }
                for (const extra of [{term: "P18"}, {term: "Retail"}, {selected: FACILITY}, {selected: "ZIRET_WH"}]) {
                    const options = read("ironstone.warehouse.AccessServices.get#Choices",
                        Object.assign({choice: "facilities"}, extra)).options || []
                    const text = JSON.stringify(Array.from(options))
                    const pattern = username.startsWith("p18.") ? RETAIL : SECRET
                    if (pattern.test(text)) problems.push(`${username} gets facilities ${JSON.stringify(extra)}: ${text.substring(0, 120)}`)
                }
            })
        if (problems.length) log.warn("Warehouse access walk problems:\n" + problems.join("\n"))
        return {problems, found}
    },
    then({problems, found}) {
        problems.join("\n") == ""
        found["warehouse.read"].palette > 0
        found["p18.read"].palette > 0
        !!found["warehouse.read"].link
        !!found["p18.read"].link
    }
})

feature("without financial read no cost or price shows, and settlement, release and revaluation are refused", {
    when() {
        const problems = []
        if (!p18.shipmentId) problems.push("the receive-to-ship records are missing")
        const money = new RegExp([COST, PRICE, "43.86", "77.88"].map(value => value.replace(".", "\\.")).join("|"))
        const routes = [["Inventory/AssetDetail", {assetId: p18.assetId}], ["Inventory/AssetDetail/Ledger",
            {assetId: p18.assetId, lastStandalone: "true"}], ["Inventory/Movements", {facilityId: FACILITY}],
            ["Receiving/ReceiptDetail", {shipmentId: p18.receiptId}], ["Receiving/ReceiptDocument", {shipmentId: p18.receiptId}],
            ["Orders/OrderDetail", {orderId: p18.salesOrderId}], ["Orders/OrderDetail", {orderId: p18.purchaseOrderId}],
            ["Orders/InvoiceDetail", {invoiceId: p18.invoiceId}], ["Shipping/ShipmentDetail", {shipmentId: p18.shipmentId}],
            ["Shipping/PackingSlip", {shipmentId: p18.shipmentId}], ["Reports/StockAtDate", {facilityId: FACILITY}],
            ["Reports/InventoryValuation", {facilityId: FACILITY, productId: PRODUCT}],
            ["Inventory/Traceability", {rootType: "asset", rootId: p18.assetId}]]
        const refusals = {}
        for (const username of Object.keys(p18Users))
            asUser(username, () => {
                const renders = []
                for (const [path, parameters] of routes)
                    for (const mode of username === "p18.read" ? ["html", "csv"] : ["html"])
                        renders.push([`${path} (${mode}) money`, page(path, parameters, mode)])
                problems.push(...leaks(username, renders, money))
            })
        for (const username of ["p18.read", "p18.ship", "p18.quality", "warehouse.read", "warehouse.ship"]) {
            refusals[username] = [
                run(username, "mantle.order.ReturnServices.settle#Return", {returnId: "BOSS_WH_RMA", previewVersion: "x",
                    operationKey: key()}).error,
                run(username, "mantle.account.InvoiceServices.release#ShipmentDraftInvoice", {shipmentId: p18.shipmentId,
                    reason: "P18 walk", operationKey: key()}).error,
                run(username, "mantle.ledger.AssetBookServices.preview#Revaluation", {productId: PRODUCT,
                    organizationPartyId: ORG, facilityId: FACILITY, changeReason: "P18 walk"}).error
            ]
            refusals[username].forEach((message, index) => {
                if (!refusedFor(message)) problems.push(`${username} is not refused settlement call ${index}: ${message}`)
            })
        }
        // a user with financial read sees the receipt's cost on the same routes
        const costShown = asUser("john.doe", () =>
            routes.filter(([path, parameters]) => money.test(page(path, parameters, "html").output)).length)
        if (problems.length) log.warn("Warehouse access walk problems:\n" + problems.join("\n"))
        return {problems, refusals, costShown}
    },
    then({problems, costShown}) {
        problems.join("\n") == ""
        costShown > 0
    }
})
