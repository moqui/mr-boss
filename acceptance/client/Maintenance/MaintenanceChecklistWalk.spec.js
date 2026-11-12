// Maintenance P7's "usable when" in the live client (impl-maintenance P7; design-maintenance §11.2 "Nested and concurrent steps",
// "Evidence/checks", and "Publication and amendment" in its amendment half), an acceptance walk: a planner makes the compressor's
// service from the AC-200 procedure and the supervisor approves it; the technician works it on a phone (390 px) from the Procedure
// tab's next step: the Prepare group's two steps (the group completes by them), the oil change with a photo once Prepare is done,
// the filter; the pressure reading fails, and a recheck with a photo fails again; the supervisor amends the filter step to need a
// photo (it reopens, and the technician answers it again), waives the pressure step with a reason (the failures stay), completes
// and closes the work; the checks and the waiver stay on the Procedure tab and the printed checklist is a PDF. The rules are
// mr-mantle's ProcessChecks and mr-boss's MaintenanceChecklists.
let pages = {}
const run = String(Date.now()).slice(-6)
const serviceWork = "Walk: AC-200 service " + run
spec({
    setupSpec() {
        for (const [user, width] of [
            ["maint.planner", 1280],
            ["maint.tech", 390],
            ["maint.supervisor", 1280]
        ]) {
            const page = browser.newPage({user, viewport: {width, height: width < 600 ? 844 : 1000}, timeout: 30})
            page.allowProblems(/userPhoto\?userId=/)
            pages[user] = page
        }
    }
})
function waitForText(page, text) {
    page.waitFor(text => (document.querySelector(".q-page")?.innerText || "").includes(text), {arg: text})
}
// a message an action answered (a notification) or a dialog shows, or the page's text
function waitForMessage(page, text) {
    page.waitFor(
        text =>
            Array.from(document.querySelectorAll(".q-notification, .q-dialog, .q-page")).some(node =>
                node.innerText.includes(text)
            ),
        {arg: text}
    )
}
function waitForStatus(page, text) {
    page.waitFor(text => (document.querySelector(".m-record-status")?.innerText || "").trim() === text, {arg: text})
}
function confirmAction(page) {
    page.locator(".q-dialog-plugin").getByRole("button", {name: "Confirm", exact: true}).click()
}
function choose(page, scope, label, typed, option) {
    scope.getByLabel(label, {exact: true}).click()
    if (typed) page.keyboard.type(typed)
    page.getByRole("option", {name: option}).first().click()
    page.keyboard.press("Tab")
}
// a small PNG put on the file input named in the scope (a phone's camera picks one the same way)
function attachPhoto(page, inputName, fileName) {
    page.evaluate(
        ({inputName, fileName}) => {
            const inputs = Array.from(document.querySelectorAll("input[type=file][name=" + inputName + "]")).filter(
                input => input.offsetParent !== null || input.closest(".q-dialog")
            )
            const input = inputs[inputs.length - 1]
            const bytes = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="), c =>
                c.charCodeAt(0)
            )
            const transfer = new DataTransfer()
            transfer.items.add(new File([bytes], fileName, {type: "image/png"}))
            input.files = transfer.files
            input.dispatchEvent(new Event("change", {bubbles: true}))
            return true
        },
        {inputName, fileName}
    )
}
const ids = {}
const detail = (workEffortId, tab) =>
    "/qapps/Maintenance/WorkOrders/WorkOrderDetail" + (tab ? "/" + tab : "") + "?workEffortId=" + workEffortId
// the next step's card on the Procedure tab: its title, then Start (when shown) and Record
function respondNext(page, name, fill) {
    waitForText(page, "Next: " + name)
    const start = page.getByRole("button", {name: "Start this step", exact: true})
    if (start.count()) {
        start.click()
        waitForMessage(page, "Step started")
    }
    if (fill) fill(page)
    page.getByRole("button", {name: "Record", exact: true}).first().click()
}

feature("the planner makes the compressor's service from the AC-200 procedure; the supervisor approves it", {
    expect() {
        const planner = pages["maint.planner"]
        planner.goto("/qapps/Maintenance/WorkOrders/NewWorkOrder?assetId=BOSS_MNT_COMPRESSOR&templateWorkEffortId=BOSS_MNT_PROC_COMP")
            .status == 200
        waitForText(planner, "New work order")
        planner.getByLabel("What needs doing", {exact: true}).fill(serviceWork)
        planner.getByRole("button", {name: "Create work order", exact: true}).click()
        planner.waitForURL(/WorkOrderDetail/)
        waitForText(planner, serviceWork)
        ids.work = planner.evaluate(() => new URLSearchParams(location.search).get("workEffortId"))
        !!ids.work
        // procedure work waits for a supervisor
        planner.text().includes("supervisor")
        planner.getByRole("button", {name: "Assign and schedule", exact: true}).click()
        const dialog = planner.getByRole("dialog")
        choose(planner, dialog, "Technicians", "Techn", /^Maintenance Technician( ·|$)/)
        dialog.getByRole("button", {name: "Save", exact: true}).click()
        waitForText(planner, "Maintenance Technician")
        const supervisor = pages["maint.supervisor"]
        supervisor.goto(detail(ids.work)).status == 200
        supervisor.getByRole("button", {name: "Approve", exact: true}).first().click()
        supervisor.getByRole("dialog").getByRole("button", {name: "Approve", exact: true}).click()
        waitForStatus(supervisor, "Approved")
    }
})

feature("the technician works the checklist on a phone: the group's steps, the oil change once Prepare is done, the filter", {
    expect() {
        const tech = pages["maint.tech"]
        tech.goto(detail(ids.work)).status == 200
        tech.getByRole("button", {name: "Start", exact: true}).first().click()
        tech.getByRole("dialog").getByRole("button", {name: "Start", exact: true}).click()
        waitForStatus(tech, "In Progress")
        tech.goto(detail(ids.work, "Procedure")).status == 200
        // the oil change waits for the Prepare group
        waitForText(tech, "Waits for Prepare")
        respondNext(tech, "Isolate and lock out the compressor")
        waitForMessage(tech, "Step done")
        respondNext(tech, "Drain the receiver")
        waitForMessage(tech, "Step done")
        // the group is complete by its two steps; the oil change is open now and needs a photo
        !tech.text().includes("Waits for Prepare")
        respondNext(tech, "Change the oil", page => attachPhoto(page, "contentFile", "oil.png"))
        waitForMessage(tech, "Step done")
        respondNext(tech, "Replace the intake filter")
        waitForMessage(tech, "Step done")
    }
})

feature("the pressure reading fails; a recheck with a photo fails again, and both stay on the step", {
    expect() {
        const tech = pages["maint.tech"]
        respondNext(tech, "Read the discharge pressure", page => {
            page.getByLabel("Reading", {exact: true}).last().fill("11")
            page.getByLabel("Notes", {exact: true}).last().fill("Relief valve sticks")
        })
        waitForMessage(tech, "the step stays open")
        tech.text().includes("is outside 7–9")
        respondNext(tech, "Read the discharge pressure", page => {
            page.getByLabel("Reading", {exact: true}).last().fill("10.2")
            page.getByLabel("Notes", {exact: true}).last().fill("After bleeding the line")
            attachPhoto(page, "contentFile", "gauge.png")
        })
        waitForMessage(tech, "the step stays open")
        tech.text().includes("Failures: 2") || tech.text().includes("Unresolved")
        // a technician neither waives nor amends
        tech.getByRole("button", {name: "Waive", exact: true}).count() == 0
        tech.getByRole("button", {name: "Amend", exact: true}).count() == 0
        // the work order cannot be completed with a required step open
        tech.goto(detail(ids.work)).status == 200
        tech.getByRole("button", {name: "Lifecycle", exact: true}).click()
        waitForMessage(tech, "Required steps are open")
    }
})

feature("the supervisor amends the filter step to need a photo; it reopens and the technician answers it again", {
    expect() {
        const supervisor = pages["maint.supervisor"]
        supervisor.goto(detail(ids.work, "Procedure")).status == 200
        waitForText(supervisor, "Checklist")
        supervisor.getByRole("button", {name: "Amend", exact: true}).click()
        const dialog = supervisor.getByRole("dialog")
        choose(supervisor, dialog, "Step", "filter", /Replace the intake filter/)
        choose(supervisor, dialog, "Evidence required", null, /^Yes$/)
        dialog.getByRole("button", {name: "Preview", exact: true}).click()
        waitForText(supervisor, "Amendment preview")
        supervisor.text().includes("Reopened: Replace the intake filter")
        supervisor.getByLabel("Why", {exact: true}).fill("Photograph every new filter from now on")
        supervisor.getByRole("button", {name: "Amend", exact: true}).last().click()
        waitForMessage(supervisor, "Execution amended")
        const tech = pages["maint.tech"]
        tech.goto(detail(ids.work, "Procedure")).status == 200
        waitForText(tech, "This step needs a file")
        tech.getByRole("button", {name: "Respond", exact: true}).first().click()
        const respond = tech.getByRole("dialog")
        attachPhoto(tech, "contentFile", "filter.png")
        respond.getByRole("button", {name: "Record", exact: true}).click()
        waitForMessage(tech, "Step done")
    }
})

feature("the supervisor waives the pressure step with a reason, completes and closes the work; the checks, the waiver and the printed checklist stay", {
    expect() {
        const supervisor = pages["maint.supervisor"]
        supervisor.goto(detail(ids.work, "Procedure")).status == 200
        waitForText(supervisor, "Read the discharge pressure")
        supervisor.getByRole("button", {name: "Waive", exact: true}).first().click()
        const waive = supervisor.getByRole("dialog")
        waive.getByLabel("Why it is waived", {exact: true}).fill("Relief valve on order; within tolerance for a week")
        waive.getByRole("button", {name: "Waive", exact: true}).click()
        waitForMessage(supervisor, "Step waived")
        supervisor.text().includes("Waived")
        supervisor.goto(detail(ids.work)).status == 200
        supervisor.getByRole("button", {name: "Complete", exact: true}).first().click()
        const complete = supervisor.getByRole("dialog")
        choose(supervisor, complete, "Outcome", "Rep", /^Repaired$/)
        choose(supervisor, complete, "Equipment after the work", "Avail", /^Available for use$/)
        complete.getByRole("button", {name: "Complete", exact: true}).click()
        confirmAction(supervisor)
        waitForStatus(supervisor, "Complete")
        supervisor.getByRole("button", {name: "Close", exact: true}).first().click()
        supervisor.getByRole("dialog").getByRole("button", {name: "Close", exact: true}).click()
        waitForStatus(supervisor, "Closed")
        supervisor.goto(detail(ids.work, "Procedure")).status == 200
        waitForText(supervisor, "Waivers and amendments")
        const text = supervisor.text()
        text.includes("Relief valve sticks") && text.includes("After bleeding the line")
        text.includes("Relief valve on order")
        text.includes("Photograph every new filter")
        // the completed checklist stored at close, as a PDF
        supervisor.evaluate(async workEffortId => {
            const response = await fetch("/apps/Maintenance/WorkOrders/WorkOrderDetail/Procedure/printChecklist?workEffortId=" + workEffortId)
            const bytes = new Uint8Array(await response.arrayBuffer())
            return response.status === 200 && String.fromCharCode(...bytes.slice(0, 4)) === "%PDF"
        }, ids.work) == true
    }
})
