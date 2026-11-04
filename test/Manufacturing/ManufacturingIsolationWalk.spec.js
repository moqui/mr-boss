// The Manufacturing isolation walk (design-manufacturing §10.3 "Unauthorized action and standalone app", crosscut §6,
// impl-manufacturing P17), over ManufacturingAccessWalk's organization of its own and its plan-to-stock records
// (ManufacturingStandaloneLib, run again in setupSpec): its users never see Retail's records on any Manufacturing route;
// exports and prints of each side hold only its rows; the palette, record links, scans, the station's board, search and the
// drop-downs keep each side to its records; no cost shows without financial read, and the cost close and Accounting's
// production verbs refuse both sides' Manufacturing users.
// Run: ./moq test mr-boss --spec ManufacturingIsolationWalk
const lib = ec.resource.script("component://mr-boss/test/Manufacturing/ManufacturingSpecLib.js")
const m = ec.resource.script("component://mr-boss/test/Manufacturing/ManufacturingStandaloneLib.js")
const {
    asUser,
    ids,
    PLANT,
    LINE,
    at,
    ORG,
    SECRET,
    RETAIL,
    COST,
    ISSUED_VALUE,
    p17Users,
    key,
    run,
    page,
    read,
    refusedFor,
    leaks,
    show
} = m
// the organization's records of this spec's plan to stock, and its method
const p17 = {}
let method = {}

spec({
    setupSpec() {
        login("john.doe")
        method = m.setup()
        Object.assign(p17, m.planToStock().p17)
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("the other organization's Manufacturing users see nothing of Retail's records on any Manufacturing route", {
    when() {
        const problems = []
        if (!p17.runId) problems.push("the plan-to-stock records are missing")
        const routes = Object.entries(lib.routeFixtures().routes).filter(([, fixture]) => fixture.parameters)
        for (const username of ["p17.read", "p17.plan", "p17.supervise"]) {
            const renders = routes.map(([path, fixture]) => [path, page(username, path, fixture.parameters, "html")])
            // the terminal too, for the reader
            if (username === "p17.read")
                for (const [path, fixture] of routes)
                    renders.push([path + " (tui)", page(username, path, fixture.parameters, "tui")])
            problems.push(...leaks(username, renders, RETAIL))
            // and their own work order shows, so a page that fails is not taken for a refusal
            const own = page(username, "WorkOrders/WorkOrderDetail", {workEffortId: p17.runId})
            if (!SECRET.test(own.output)) problems.push(`${username} does not see its own work order`)
        }
        if (problems.length) log.warn("Manufacturing isolation walk problems:\n" + problems.join("\n"))
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
        if (!p17.runId) problems.push("the plan-to-stock records are missing")
        const fixtures = lib.routeFixtures().routes
        // every Manufacturing screen with a CSV export, on its fixture's parameters and on the other side's plant
        const exported = Object.entries(fixtures).filter(([path]) => {
            const reference = ec.resource.getLocationReference(`component://mr-boss/screen/Manufacturing/${path}.xml`)
            return reference.getExists() && /show-csv-button="true"/.test(reference.getText())
        })
        const prints = (runId, operationId, plantId) => [
            ["WorkOrders/WorkOrderDetail/Traveler", {workEffortId: runId}],
            ["WorkOrders/WorkOrderDetail/PickSheet", {workEffortId: runId}],
            ["WorkOrders/WorkOrderDetail/OutputLabels", {workEffortId: runId}],
            ["ShopFloor/InstructionsPrint", {operationWorkEffortId: operationId}],
            ["Planning/ScheduleSnapshot", {plantId}],
            ["Planning/PlanSnapshot", {plantId}],
            ["Reports/WorkOrderStatusReport", {facilityId: plantId}]
        ]
        const sides = [
            ["manufacturing.read", PLANT, SECRET, prints(p17.runId, p17.operationId, PLANT)],
            ["manufacturing.schedule", PLANT, SECRET, prints(p17.runId, p17.operationId, PLANT)],
            ["p17.read", ids.plantId, RETAIL, prints(ids.qualityRunId, ids.qualityOperationIds[1], ids.plantId)],
            ["p17.schedule", ids.plantId, RETAIL, prints(ids.releasedRunId, ids.operationId, ids.plantId)]
        ]
        for (const [username, plantId, pattern, printRoutes] of sides) {
            const renders = []
            for (const [path, fixture] of exported)
                for (const parameters of [fixture.parameters || {}, {plantId, facilityId: plantId}])
                    renders.push([`${path} csv ${JSON.stringify(parameters)}`, page(username, path, parameters, "csv")])
            for (const [path, parameters] of printRoutes)
                for (const mode of ["html-print", "csv"])
                    renders.push([`${path} ${mode} ${JSON.stringify(parameters)}`, page(username, path, parameters, mode)])
            problems.push(...leaks(username, renders, pattern))
        }
        // each side's own export and print hold its rows, so an empty one is not taken for a refusal
        const own = {
            p17Csv: page("p17.read", "WorkOrders/Find", {facilityId: PLANT, statusId: "WeComplete", pageNoLimit: "true"}, "csv")
                .output,
            p17Print: page("p17.read", "WorkOrders/WorkOrderDetail/Traveler", {workEffortId: p17.runId}, "html-print").output,
            retailCsv: page("manufacturing.read", "WorkOrders/Find", {facilityId: ids.plantId, pageNoLimit: "true"}, "csv").output
        }
        if (problems.length) log.warn("Manufacturing isolation walk problems:\n" + problems.join("\n"))
        return {problems, count: exported.length, own}
    },
    then({problems, count, own}) {
        count >= 8
        problems.join("\n") == ""
        SECRET.test(own.p17Csv)
        SECRET.test(own.p17Print)
        RETAIL.test(own.retailCsv)
    }
})

feature("the palette, record links, scans, the station, search and drop-downs keep each side to its records", {
    when() {
        const problems = []
        if (!p17.runId) problems.push("the plan-to-stock records are missing")
        const p17Records = {
            runs: [p17.runId],
            boms: [method.productBomId],
            routings: [method.routingId],
            centers: [LINE],
            operations: [p17.operationId],
            text: "P17 secret",
            pattern: SECRET
        }
        const retailRecords = {
            runs: [ids.runId, ids.qualityRunId, ids.releasedRunId],
            boms: [ids.methodId],
            routings: [ids.routingId],
            centers: [ids.lineId],
            operations: [ids.qualityOperationIds[1], ids.operationId],
            text: "Demo assemblies",
            pattern: RETAIL
        }
        const W = "mantle.work.effort.WorkEffort"
        const found = {}
        for (const [username, foreign, own] of [
            ["manufacturing.read", p17Records, retailRecords],
            ["manufacturing.operate", p17Records, retailRecords],
            ["p17.read", retailRecords, p17Records],
            ["p17.operate", retailRecords, p17Records]
        ])
            asUser(username, () => {
                const linkOf = (recordEntityName, id) =>
                    read("ironstone.commons.PaletteServices.get#RecordLink", {recordEntityName, id}).url
                for (const id of foreign.runs.concat(foreign.routings, foreign.operations))
                    if (linkOf(W, id)) problems.push(`${username} has a link to ${id}`)
                for (const id of foreign.boms)
                    if (linkOf("mantle.product.bom.ProductBom", id)) problems.push(`${username} has a link to method ${id}`)
                for (const id of foreign.centers)
                    if (linkOf("mantle.work.production.WorkCenter", id)) problems.push(`${username} has a link to center ${id}`)
                // the palette's rows: by the other side's ids and its text
                for (const text of foreign.runs.concat(foreign.boms, foreign.routings, foreign.centers, [foreign.text])) {
                    const palette = read("ironstone.manufacturing.AccessServices.search#Records", {text, limit: 20})
                    const hit = Array.from(palette.rows || []).filter(
                        row =>
                            foreign.pattern.test(JSON.stringify(row)) ||
                            []
                                .concat(foreign.runs, foreign.boms, foreign.routings, foreign.centers)
                                .some(id =>
                                    new RegExp(`[?&](workEffortId|productBomId|facilityId)=${id}(&|$)`).test(row.url || "")
                                )
                    )
                    if (hit.length) problems.push(`${username} finds ${text} in the palette`)
                }
                // a scan of the other side's operation or work order on the shop floor answers nothing
                for (const id of foreign.operations.concat(foreign.runs)) {
                    const scanned = read("ironstone.manufacturing.ShopFloorServices.resolve#OperationScan", {scanText: id})
                    if (Array.from(scanned.matches || []).length) problems.push(`${username} scans ${id}`)
                }
                // the station's board at the other side's plant, and the user's own
                const station =
                    read("ironstone.manufacturing.ShopFloorServices.get#Station", {
                        appRoot: "Manufacturing",
                        facilityId: foreign === p17Records ? PLANT : ids.plantId
                    }).station || {}
                if (foreign.pattern.test(JSON.stringify(station.rows || []))) problems.push(`${username} sees the other station`)
                // the palette's universal search runs with the user's authorization and organization filters
                let universal = {}
                try {
                    universal =
                        ec.service
                            .sync()
                            .name("mantle.search.UniversalSearchServices.search#Universal")
                            .parameters({q: foreign.text})
                            .call() || {}
                } catch (error) {
                    universal = {}
                }
                ec.message.clearErrors()
                if (foreign.pattern.test(JSON.stringify(Array.from(universal.results || []))))
                    problems.push(`${username} finds ${foreign.text} in search`)
                // the drop-downs: plants, work centers, products and released methods
                for (const [choice, extra] of [
                    ["plants", {}],
                    ["workCenters", {}],
                    ["products", {term: "P17"}],
                    ["products", {term: "Demo"}],
                    ["releasedBoms", {productId: at.product}],
                    ["releasedBoms", {productId: ids.productId}],
                    ["plants", {selected: PLANT}],
                    ["plants", {selected: ids.plantId}]
                ]) {
                    const options = read(
                        "ironstone.manufacturing.AccessServices.get#Choices",
                        Object.assign({choice}, extra)
                    ).options
                    const text = JSON.stringify(Array.from(options || []))
                    if (foreign.pattern.test(text))
                        problems.push(`${username} gets ${choice} ${JSON.stringify(extra)}: ${text.substring(0, 120)}`)
                }
                // the user's own run is found and linked, so an empty answer is not taken for a refusal
                found[username] = {
                    link: linkOf(W, own.runs[0]),
                    palette: Array.from(
                        read("ironstone.manufacturing.AccessServices.search#Records", {text: own.boms[0], limit: 20}).rows || []
                    ).length,
                    scan: Array.from(
                        read("ironstone.manufacturing.ShopFloorServices.resolve#OperationScan", {scanText: own.operations[0]})
                            .matches || []
                    ).length
                }
            })
        if (problems.length) log.warn("Manufacturing isolation walk problems:\n" + problems.join("\n"))
        return {problems, found}
    },
    then({problems, found}) {
        problems.join("\n") == ""
        !!found["manufacturing.read"].link
        !!found["p17.read"].link
        found["manufacturing.read"].palette > 0
        found["p17.read"].palette > 0
        found["p17.operate"].scan > 0
    }
})

feature("without financial read no cost shows, and the cost close and Accounting's production verbs are refused", {
    when() {
        const problems = []
        if (!p17.runId) problems.push("the plan-to-stock records are missing")
        const money = new RegExp([COST, ISSUED_VALUE].map(value => value.replace(".", "\\.")).join("|"))
        const order = {workEffortId: p17.runId}
        const routes = [
            ["WorkOrders/WorkOrderDetail", order],
            ["WorkOrders/WorkOrderDetail/ProductionCosts", order],
            ["WorkOrders/WorkOrderDetail/ProductionCostClose", order],
            ["WorkOrders/WorkOrderDetail/MaterialIssueReceipt", Object.assign({lastStandalone: "true"}, order)],
            ["WorkOrders/WorkOrderDetail/Components", order],
            ["WorkOrders/WorkOrderDetail/Traveler", order],
            ["Reports/ProductionCostReport", {facilityId: PLANT}],
            ["Reports/MaterialReport", {facilityId: PLANT}],
            ["Reports/BillOfMaterialsVarianceReport", {facilityId: PLANT}],
            ["Home", {plantId: PLANT}]
        ]
        for (const username of Object.keys(p17Users)) {
            const renders = []
            for (const [path, parameters] of routes)
                for (const mode of username === "p17.read" ? ["html", "tui", "csv"] : ["html"])
                    renders.push([`${path} (${mode}) money`, page(username, path, parameters, mode)])
            problems.push(...leaks(username, renders, money))
        }
        // the cost close and Accounting's production cost queue refuse every Manufacturing user of either side
        const refusals = {}
        for (const username of ["p17.read", "p17.cost", "p17.supervise", "manufacturing.read", "manufacturing.cost"]) {
            refusals[username] = [
                run(username, "mantle.ledger.ProductionCostServices.preview#CostClose", order).error,
                run(username, "mantle.ledger.ProductionCostServices.post#CostClose", {
                    operationKey: key(),
                    workEffortId: p17.runId,
                    inputFingerprint: "x"
                }).error,
                run(username, "ironstone.accounting.ProductionCostServices.find#CostCloseQueue", {organizationPartyId: ORG}).error
            ]
            refusals[username].forEach((message, index) => {
                if (!refusedFor(message) && !/ORGANIZATION|organization/.test(message))
                    problems.push(`${username} is not refused cost close call ${index}: ${message}`)
            })
        }
        // a user with financial read sees the issue's cost on the same routes
        const costShown = routes
            .filter(([path, parameters]) => money.test(page("john.doe", path, parameters, "html").output))
            .map(([path]) => path)
        if (problems.length) log.warn("Manufacturing isolation walk problems:\n" + problems.join("\n"))
        return {problems, refusals, costShown}
    },
    then({problems, costShown}) {
        problems.join("\n") == ""
        costShown.length > 0
    }
})

feature(
    "the other apps' contexts of the shared screens show the organization's run, operation and method to none of Retail's users",
    {
        when() {
            const problems = []
            if (!p17.runId) problems.push("the plan-to-stock records are missing")
            // each other root's mount of a shared screen, or its own screen, on the organization's records
            const mounts = [
                [
                    "Warehouse",
                    "Inventory/MaterialIssueReceipt",
                    {sourceType: "productionRun", sourceId: p17.runId},
                    ["warehouse.read", "warehouse.issue", "manufacturing.material"]
                ],
                ["Commons", "Tasks/TaskDetail", {workEffortId: p17.operationId}, ["manufacturing.read", "warehouse.read"]],
                ["Commons", "Calendar/EventDetail", {workEffortId: p17.runId}, ["manufacturing.read", "warehouse.read"]],
                [
                    "Products",
                    "Products/Product360/BOM",
                    {productId: at.product, productBomId: method.productBomId},
                    ["catalog.method.read", "catalog.reader"]
                ],
                ["Accounting", "Inventory/ProductionCostClose", {workEffortId: p17.runId}, ["finance.approve", "finance.read"]]
            ]
            const opened = []
            for (const [root, path, parameters, usernames] of mounts) {
                for (const username of usernames) {
                    const got = asUser(username, () => m.render(root, path, parameters))
                    if (SECRET.test(got.output)) problems.push(`${username} sees ${root}/${path} ${JSON.stringify(parameters)}`)
                }
                // the administrator, who works in every organization, opens the same mount on the record
                if (SECRET.test(asUser("john.doe", () => m.render(root, path, parameters)).output)) opened.push(`${root}/${path}`)
            }
            if (problems.length) log.warn("Manufacturing isolation walk problems:\n" + problems.join("\n"))
            return {problems, opened}
        },
        then({problems, opened}) {
            problems.join("\n") == ""
            opened.length >= 2
        }
    }
)
