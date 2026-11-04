// The Manufacturing cost and other-app isolation walk (design-manufacturing §10.3 "Unauthorized action and standalone app",
// crosscut §6, impl-manufacturing P17), over ManufacturingAccessWalk's organization of its own and its plan-to-stock records
// (ManufacturingStandaloneLib, run again in setupSpec): no component cost or issue value shows without financial read while
// john.doe sees it; the cost close and Accounting's production cost queue refuse both sides' Manufacturing users; and the
// other apps' mounts of the shared screens show the organization's records to none of Retail's users. Apart from
// ManufacturingIsolationWalk so each spec stays well under 30 s.
// Run: ./moq test mr-boss --spec ManufacturingCostIsolationWalk
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
