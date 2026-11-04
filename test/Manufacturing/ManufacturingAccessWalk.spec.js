// The Manufacturing access walk (design-manufacturing §10.3 "Unauthorized action and standalone app", crosscut §6 standalone
// operation, impl-manufacturing P17): an organization of its own, BOSS_P17_ORG, plans, makes and receives through the
// Manufacturing screens and shared mounts with Manufacturing users of one capability each and no other launcher
// (ManufacturingStandaloneLib); each of those users and Retail's demo Manufacturing users opens Manufacturing and no other app
// root; Retail's users never see the organization's records on the routes that show them to its own users (URLs, the shared
// mounts, the shop floor, the record panels, html and terminal). Exports, the palette, search, cost and finance are
// ManufacturingIsolationWalk's.
// Run: ./moq test mr-boss --spec ManufacturingAccessWalk
const m = ec.resource.script("component://mr-boss/test/Manufacturing/ManufacturingStandaloneLib.js")
const {
    asUser,
    PLANT,
    SECRET,
    p17Users,
    retailUsers,
    sweepUsers,
    otherRoots,
    page,
    render,
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
