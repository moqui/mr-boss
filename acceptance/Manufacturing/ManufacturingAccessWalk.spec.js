// The Manufacturing access and isolation walk (design-manufacturing §10.3 "Unauthorized action and standalone app", crosscut
// §6 standalone operation, impl-manufacturing P17), an acceptance test: an organization of its own, BOSS_P17_ORG, plans, makes
// and receives through the Manufacturing screens and shared mounts with Manufacturing users of one capability each and no
// other launcher (ManufacturingStandaloneLib); each of those users and Retail's demo Manufacturing users opens Manufacturing and
// no other app root; Retail's users never see the organization's records on the routes that show them to its own users (URLs,
// the shared mounts, the shop floor, the record panels, html and terminal). Then the isolation over the same records: its users
// never see Retail's records on any Manufacturing route; exports and prints of each side hold only its rows; the palette,
// record links, scans, the station's board, search and the drop-downs keep each side to its records; no component cost or
// issue value shows without financial read; the cost close and Accounting's production cost queue refuse both sides'
// Manufacturing users; and the other apps' mounts of the shared screens show the organization's records to none of Retail's
// users. The later features read the records the first (flow) feature makes.
// Run: ./moq accept mr-boss --spec ManufacturingAccessWalk
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
    retailUsers,
    sweepUsers,
    otherRoots,
    key,
    run,
    page,
    read,
    render,
    refusedFor,
    leaks,
    p17Routes,
    requiredShown,
    routeName,
    show
} = m
// the organization's records, set by the flow feature, and its method
const p17 = {}
let method = {}
let startedAt

spec({
    setupSpec() {
        login("john.doe")
        startedAt = ec.user.nowTimestamp
        method = m.setup()
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("an organization of its own plans, makes and receives, each step by a Manufacturing user of its capability alone", {
    when() {
        const flow = m.planToStock()
        Object.assign(p17, flow.p17)
        if (Object.values(flow.steps).some(step => typeof step === "string" && step))
            log.warn("P17 flow steps:\n" + JSON.stringify(flow.steps, (k, v) => (v && v.output ? {errors: v.errors} : v), 1))
        return flow
    },
    then({steps, run, issued, received}) {
        !!method.productBomId
        steps.planPage.errors == []
        steps.planPage.output.includes("P17 secret widget")
        steps.runPlan == ""
        !!p17.suggestionId
        steps.convert == ""
        !!p17.runId
        steps.release == ""
        steps.start == ""
        steps.materialsPage.errors == []
        steps.materialsPage.output.includes("P17 secret part")
        // the operator holds PRODUCTION_OPERATE and no STOCK_ISSUE: the same posting is refused
        steps.issueRefused.includes("PERMISSION_DENIED")
        steps.issue == ""
        // the count of the component's stock open during the issue: its review finds the issue, a conflict to recount
        steps.countStart == ""
        steps.countLine == ""
        steps.countSubmit == ""
        steps.countReview == ""
        steps.countConflicts == 1
        steps.countMovements >= 1
        issued == 3
        steps.executionPage.errors == []
        steps.executionPage.output.includes("P17 secret assemble")
        steps.startOperation == ""
        // receiving the output on the shop floor is a stock action: refused without STOCK_ISSUE
        steps.completeRefused.includes("STOCK_ISSUE_REQUIRED")
        steps.completeOperation == ""
        steps.receive == ""
        received == 3
        steps.complete == ""
        run.statusId == "WeComplete"
    }
})

feature("each Manufacturing user opens Manufacturing and no other app root", {
    when() {
        const problems = []
        for (const username of Object.keys(p17Users).concat(retailUsers)) {
            const home = page(username, "Home", {})
            if (home.status != 200 || home.errors.length) problems.push(`${username} cannot open Manufacturing: ${home.errors}`)
            asUser(username, () => {
                for (const root of otherRoots) {
                    const other = render(root, "", {})
                    if (other.status == 200 && !other.errors) problems.push(`${username} opens the ${root} app`)
                }
            })
        }
        // the roots open for a user granted them, so a refusal above is not a broken render
        const opened = asUser("john.doe", () =>
            otherRoots.filter(root => {
                const got = render(root, "", {})
                return got.status == 200 && !got.errors
            })
        )
        if (problems.length) log.warn("Manufacturing access walk problems:\n" + problems.join("\n"))
        return {problems, opened}
    },
    then({problems, opened}) {
        problems.join("\n") == ""
        opened == otherRoots
    }
})

feature(
    "Retail's Manufacturing users see nothing of the other organization by URL, shared mounts, shop floor, html and terminal",
    {
        when() {
            const problems = []
            if (!p17.runId) problems.push("the plan-to-stock records are missing")
            // which routes show the organization's records to its own user who may open them
            const routes = p17Routes(p17, method)
            const shown = routes.filter(route => SECRET.test(show(route.owner, route).output))
            const notShown = routes.filter(route => !shown.includes(route)).map(routeName)
            // a Retail leak counts on those routes, for every swept capability, and also in the terminal for the reader
            for (const username of sweepUsers) {
                const renders = []
                for (const route of shown) {
                    renders.push([routeName(route), show(username, route)])
                    if (username === "manufacturing.read" && route.mode === "html")
                        renders.push([routeName(route) + " (tui)", page(username, route.path, route.parameters, "tui")])
                }
                problems.push(...leaks(username, renders, SECRET))
            }
            if (problems.length) log.warn("Manufacturing access walk problems:\n" + problems.join("\n"))
            if (notShown.length) log.warn("Routes that show no P17 record to their owner:\n" + notShown.join("\n"))
            return {problems, shownPaths: [...new Set(shown.map(route => route.path))], count: shown.length, notShown}
        },
        then({problems, shownPaths, count}) {
            problems.join("\n") == ""
            requiredShown.filter(path => !shownPaths.includes(path)) == []
            count > 25
        }
    }
)

feature("Retail's users are refused every action on the other organization's records, by screen transition and by service", {
    when() {
        const order = {workEffortId: p17.runId}
        const operation = {operationWorkEffortId: p17.operationId}
        const lineKey = m
            .rows("mantle.work.production.ProductionRunLine", {workEffortId: p17.runId || "_NA_"})
            .find(line => line.lineRoleEnumId === "PrlrMaterial")?.productionRunLineId
        const transitions = [
            ["manufacturing.plan", "Planning/SupplyPlanning/runPlan", {plantId: PLANT}],
            [
                "manufacturing.plan",
                "Planning/SupplyPlanning/convertSuggestions",
                {plantId: PLANT, planningSuggestionIdList: [p17.suggestionId], operationKey: m.key()}
            ],
            [
                "manufacturing.supervise",
                "WorkOrders/WorkOrderDetail/lifecycleAction",
                Object.assign({lifecycleAction: "hold", expectedRevision: 0, operationKey: m.key()}, order)
            ],
            [
                "manufacturing.supervise",
                "WorkOrders/WorkOrderDetail/Quantities/completeRun",
                Object.assign({expectedRevision: 0, operationKey: m.key()}, order)
            ],
            [
                "manufacturing.plan",
                "WorkOrders/WorkOrderDetail/Overview/storeHeader",
                Object.assign({workEffortName: "Taken", operationKey: m.key()}, order)
            ],
            [
                "manufacturing.material",
                "WorkOrders/WorkOrderDetail/MaterialIssueReceipt/materialAction",
                Object.assign({sourceId: p17.runId, lineKey, assetId: p17.assetId, quantity: 1, operationKey: m.key()}, order)
            ],
            [
                "manufacturing.operate",
                "ShopFloor/OperationExecution/startOperation",
                Object.assign({operationKey: m.key()}, operation)
            ],
            ["manufacturing.operate", "ShopFloor/Station/startOperation", Object.assign({operationKey: m.key()}, operation)],
            [
                "manufacturing.operate",
                "ShopFloor/OperationExecution/completeOperation",
                Object.assign({good: 1, operationKey: m.key()}, operation)
            ]
        ]
        const answers = transitions.map(([username, path, parameters]) => [
            `${username} ${path}`,
            m.post(username, path, parameters)
        ])
        // the Mantle verbs the screens call, as a forged request would reach them
        const services = [
            [
                "manufacturing.supervise",
                m.P + "transition#ProductionOrder",
                Object.assign({action: "hold", expectedRevision: 0, operationKey: m.key()}, order)
            ],
            [
                "manufacturing.material",
                m.P + "issue#ProductionMaterial",
                Object.assign({productionRunLineId: lineKey, assetId: p17.assetId, quantity: 1, operationKey: m.key()}, order)
            ],
            ["manufacturing.operate", m.P + "start#ProductionOperation", Object.assign({operationKey: m.key()}, operation)],
            ["manufacturing.read", m.P + "get#ProductionOrder", order]
        ]
        for (const [username, service, parameters] of services)
            answers.push([`${username} ${service}`, m.run(username, service, parameters).error])
        const unrefused = answers
            .filter(([, error]) => !/RECORD_UNAVAILABLE|not available|PLANT_UNAVAILABLE/.test(error))
            .map(([name, error]) => `${name}: ${error || "accepted"}`)
        if (unrefused.length) log.warn("Manufacturing access walk problems:\n" + unrefused.join("\n"))
        return {unrefused, count: answers.length, run: m.one("mantle.work.effort.WorkEffort", order)}
    },
    then({unrefused, count, run}) {
        count == 13
        unrefused == []
        run.statusId == "WeComplete"
        run.workEffortName != "Taken"
    }
})

feature("the organization's notices reach its own users only: none of Retail's users got one about its records", {
    when() {
        const problems = []
        if (!p17.runId) problems.push("the plan-to-stock records are missing")
        const userIdOf = username => m.one("moqui.security.UserAccount", {username})?.userId
        const recordIds = [p17.runId, p17.operationId, method.productBomId, method.routingId].filter(Boolean)
        const notices = Array.from(
            ec.entity
                .find("moqui.security.user.NotificationMessage")
                .condition("sentDate", "greater-equals", startedAt)
                .disableAuthz()
                .list()
        ).filter(
            notice =>
                SECRET.test([notice.titleText, notice.messageJson, notice.linkText].join(" ")) ||
                recordIds.some(id => new RegExp(`\\b${id}\\b`).test([notice.messageJson, notice.linkText].join(" ")))
        )
        const recipients = new Set()
        for (const notice of notices)
            for (const row of Array.from(
                ec.entity
                    .find("moqui.security.user.NotificationMessageUser")
                    .condition("notificationMessageId", notice.notificationMessageId)
                    .disableAuthz()
                    .list()
            ))
                recipients.add(row.userId)
        for (const username of retailUsers.concat([
            "manufacturing.material",
            "manufacturing.finance",
            "manufacturing.buyer",
            "manufacturing.costclose",
            "manufacturing.services"
        ]))
            if (recipients.has(userIdOf(username))) problems.push(`${username} got a notice of the P17 records`)
        if (problems.length) log.warn("Manufacturing access walk problems:\n" + problems.join("\n"))
        return {problems, topics: [...new Set(notices.map(notice => notice.topic))], recipients: [...recipients]}
    },
    then({problems, topics, recipients}) {
        problems.join("\n") == ""
        // the release notice reached the organization's own supervisor
        topics.includes("ProductionRelease")
        recipients.includes("BOSS_P17_SUPERVISE")
    }
})

// ===== isolation over the same records =====
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
                // the user's own run is found and linked and its plant offered, and Retail's station shows Retail's queue, so an
                // empty answer is not taken for a refusal (universal search has no index in a test runtime: it answers nothing
                // for either side, so the palette's own search#Records above is the one that counts)
                found[username] = {
                    plants: own.pattern.test(
                        JSON.stringify(
                            Array.from(
                                read("ironstone.manufacturing.AccessServices.get#Choices", {choice: "plants"}).options || []
                            )
                        )
                    ),
                    station: own.pattern.test(
                        JSON.stringify(
                            (
                                read("ironstone.manufacturing.ShopFloorServices.get#Station", {
                                    appRoot: "Manufacturing",
                                    facilityId: foreign === p17Records ? ids.plantId : PLANT
                                }).station || {}
                            ).rows || []
                        )
                    ),
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
        found["manufacturing.read"].plants && found["p17.read"].plants && found["p17.operate"].plants
        found["manufacturing.operate"].station
        found["manufacturing.read"].palette > 0
        found["p17.read"].palette > 0
        found["p17.operate"].scan > 0
    }
})

// ===== cost and the other apps' contexts =====
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
        // the work order's cost tab, its Materials tab and the cost report show the issue's cost to john.doe
        const costRoutes = [
            "WorkOrders/WorkOrderDetail/ProductionCosts",
            "WorkOrders/WorkOrderDetail/MaterialIssueReceipt",
            "Reports/ProductionCostReport"
        ]
        problems.join("\n") == ""
        costRoutes.filter(path => !costShown.includes(path)) == []
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
            // Commons' EventDetail shows no production run, and Accounting's cost close only an organization of the user's
            // (john.doe is not BOSS_P17_ORG's agent): those two are checked as refusals only
            const controls = [
                "Warehouse/Inventory/MaterialIssueReceipt",
                "Commons/Tasks/TaskDetail",
                "Products/Products/Product360/BOM"
            ]
            problems.join("\n") == ""
            controls.filter(mount => !opened.includes(mount)) == []
        }
    }
)
