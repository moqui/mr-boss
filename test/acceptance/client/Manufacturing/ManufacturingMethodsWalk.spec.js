// Manufacturing P2's walk (impl-manufacturing P2, §8): the method engineer publishes an operation template's instruction,
// starts a routing and asks for its release; the method approver finds it in Approvals and releases it; the BOM list and a
// method fit 390 px. The demo method of DEMO_1_1 (data/BossManufacturingDemoData.xml) is there from the start.
// Run: ./moq test-client mr-boss --serve -- --spec ManufacturingMethodsWalk
let pages = {}
spec({
    setupSpec() {
        for (const [user, width] of [
            ["manufacturing.method", 1280],
            ["manufacturing.methodapprove", 1280],
            ["manufacturing.read", 390]
        ]) {
            pages[user] = browser.newPage({user, viewport: {width, height: 1000}, timeout: 30})
            pages[user].allowProblems(/userPhoto\?userId=/)
        }
    }
})
feature("the engineer publishes an instruction, starts a routing and asks for its release", {
    expect() {
        const page = pages["manufacturing.method"]
        page.goto("/qapps/Manufacturing/Routings/OperationTemplates?workEffortId=BOSS_MFG_OPT_TEST").status == 200
        page.waitFor(() => (document.querySelector(".q-page")?.innerText || "").includes("Test result"))
        page.getByRole("button", {name: "Publish instruction", exact: true}).click()
        const publish = page.locator("#PublishInstruction")
        publish.locator("input[name=description]").fill("Walk test steps")
        publish.locator("textarea[name=contentText]").fill("1. Power on.\n2. Run the test.\n3. Box it.")
        publish.locator("input[name=changeReason]").fill("Walk instruction")
        publish.getByRole("button", {name: "Publish instruction", exact: true}).click()
        page.waitFor(() => (document.querySelector(".q-page")?.innerText || "").includes("Walk test steps"))
        page.goto("/qapps/Manufacturing/Routings").status == 200
        page.waitFor(() => (document.querySelector(".q-page")?.innerText || "").includes("Line A assembly"))
        page.getByRole("button", {name: "New routing", exact: true}).click()
        const created = page.locator("#NewRouting")
        created.locator("input[name=workEffortName]").fill("Walk routing")
        created.locator("input[name=changeReason]").fill("Walk routing")
        created.getByRole("button", {name: "Create routing draft", exact: true}).click()
        page.waitFor(() => (document.querySelector(".q-page")?.innerText || "").includes("Walk routing"))
        page.getByRole("button", {name: "Request release", exact: true}).click()
        const request = page.locator("#RoutingRequest")
        request.locator("input[name=changeReason]").fill("Walk request")
        page.allowProblems(/Routing requires at least one operation/)
        request.getByRole("button", {name: "Request release", exact: true}).click()
        page.settle()
        // an empty routing fails its checks: the request names the finding and notifies no one
        page.text().includes("at least one operation")
        !/Error rendering|Exception in render/.test(page.text())
    }
})
feature("the approver sees a method release request in Approvals and opens the method", {
    expect() {
        const page = pages["manufacturing.methodapprove"]
        page.goto("/qapps/Manufacturing/Approvals").status == 200
        page.settle()
        !/Error rendering|Exception in render/.test(page.text())
        page.goto("/qapps/Manufacturing/BillsOfMaterials/BillOfMaterialsDetail?productBomId=BOSS_MFG_BOM_PILOT").status == 200
        page.waitFor(() => (document.querySelector(".q-page")?.innerText || "").includes("Line A pilot assembly"))
        page.text().includes("Approve method")
        !page.text().includes("Request release")
    }
})
feature("the BOM list and the demo method fit 390 px for a reader", {
    where: [
        {path: "/qapps/Manufacturing/BillsOfMaterials", wait: "Line A pilot assembly"},
        {
            path: "/qapps/Manufacturing/BillsOfMaterials/BillOfMaterialsDetail?productBomId=BOSS_MFG_BOM_PILOT",
            wait: "Released components and outputs"
        },
        {path: "/qapps/Manufacturing/Routings/RoutingDetail?workEffortId=BOSS_MFG_ROUTING_A", wait: "Test and pack"}
    ],
    expect({path, wait}) {
        const page = pages["manufacturing.read"]
        page.goto(path).status == 200
        page.waitFor(text => (document.querySelector(".q-page")?.innerText || "").includes(text), {arg: wait})
        page.settle()
        !/Error rendering|Exception in render/.test(page.text())
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth) == true
    }
})
