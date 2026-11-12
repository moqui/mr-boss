// Maintenance P3's "usable when" in the live client (impl-maintenance P3; design-maintenance §11.2 "Facility/equipment identity",
// "Phones and CalDAV", "Device/access paths" in part), an acceptance walk: a planner creates a corrective work order on the
// compressor and one on Room 102, which has no equipment, and assigns the technician; Manufacturing's equipment page shows the
// compressor available while its order is only planned; the technician starts the compressor's order on a phone (390 px),
// records their time and completes it with an explicit finish, and Commons' Today lists it with no Mark done; the supervisor
// closes it; offboarding the technician in Admin lists their open work orders under Maintenance's participant for reassignment
// (as the administrator: the Retail identity operator does not see a Services user). The rules are mr-mantle's
// MaintenanceWorkOrders and MaintenanceManagedWork and mr-boss's MaintenanceWorkOrders; the golden path is test/client's
// MaintenanceWorkOrdersWalk.
let pages = {}
const run = String(Date.now()).slice(-6)
const compressorWork = "Walk: compressor knocks " + run
const roomWork = "Walk: Room 102 vent rattles " + run
spec({
    setupSpec() {
        for (const [user, width] of [
            ["maint.planner", 1280],
            ["maint.tech", 390],
            ["maint.supervisor", 1280],
            ["manufacturing.services", 1280],
            ["admin.admin", 1280]
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
// a day and time some hours before now (after it when negative) in the user's zone, as a date-time field takes it
function hoursAgo(page, hours) {
    return page.evaluate(
        hours => window.moqui.l10n.formatTimestamp(new Date(Date.now() - hours * 3600000), "yyyy-MM-dd HH:mm"),
        hours
    )
}
// the last minute of the user's day: Maintenance's Today lists dated work only (F106)
function endOfToday(page) {
    return page.evaluate(() => window.moqui.l10n.formatTimestamp(new Date(), "yyyy-MM-dd") + " 23:59")
}
const ids = {}
const detail = workEffortId => "/qapps/Maintenance/WorkOrders/WorkOrderDetail?workEffortId=" + workEffortId
// New work order for a target, as the planner: the work order's id
function create(page, query, name) {
    page.goto("/qapps/Maintenance/WorkOrders/NewWorkOrder?" + query).status == 200
    waitForText(page, "New work order")
    page.getByLabel("What needs doing", {exact: true}).fill(name)
    page.getByRole("button", {name: "Create work order", exact: true}).click()
    page.waitForURL(/WorkOrderDetail/)
    waitForText(page, name)
    return page.evaluate(() => new URLSearchParams(location.search).get("workEffortId"))
}

feature("a planner creates corrective work on the compressor and on a room with no equipment, and assigns the technician", {
    expect() {
        const planner = pages["maint.planner"]
        ids.compressor = create(planner, "assetId=BOSS_MNT_COMPRESSOR", compressorWork)
        !!ids.compressor
        waitForStatus(planner, "Approved")
        planner.text().includes("Compressor C-1")
        planner.getByRole("button", {name: "Assign and schedule", exact: true}).click()
        const dialog = planner.getByRole("dialog")
        // the due day first: the technicians are ranked again for a changed window
        dialog.locator("input[name=estimatedCompletionDate]").fill(endOfToday(planner))
        choose(planner, dialog, "Technicians", "Techn", /^Maintenance Technician( ·|$)/)
        dialog.getByRole("button", {name: "Save", exact: true}).click()
        waitForText(planner, "Maintenance Technician")
        ids.room = create(planner, "facilityId=BOSS_MNT_ROOM_102", roomWork)
        !!ids.room
        planner.text().includes("Room 102 Mechanical")
        !planner.text().includes("Equipment after the work")
    }
})

feature("Manufacturing's equipment page shows the compressor available while its work order is only planned", {
    expect() {
        const reader = pages["manufacturing.services"]
        reader.goto("/qapps/Manufacturing/WorkCenters/EquipmentDetail?assetId=BOSS_MNT_COMPRESSOR").status == 200
        waitForText(reader, "Compressor C-1")
        !reader.text().includes("In maintenance")
    }
})

feature("the technician starts the compressor's work on a phone, records time, and Today lists it with no Mark done", {
    expect() {
        const tech = pages["maint.tech"]
        tech.goto(detail(ids.compressor)).status == 200
        waitForText(tech, compressorWork)
        tech.getByRole("button", {name: "Start", exact: true}).first().click()
        tech.getByRole("dialog").getByRole("button", {name: "Start", exact: true}).click()
        waitForStatus(tech, "In Progress")
        tech.goto(detail(ids.compressor).replace("WorkOrderDetail?", "WorkOrderDetail/Time?")).status == 200
        tech.getByRole("button", {name: "Record time", exact: true}).click()
        const time = tech.getByRole("dialog")
        time.locator("input[name=fromDate]").fill(hoursAgo(tech, 1))
        time.getByLabel("Hours", {exact: true}).fill("0.5")
        time.getByLabel("What was done", {exact: true}).fill("Tightened the motor mounts")
        time.getByRole("button", {name: "Record", exact: true}).click()
        // a phone's time list has no What was done column: the technician's total shows the entry
        waitForText(tech, "Your time: 0.5 h")
        // Commons' Today: the work order is there, opening its work order, with no Mark done
        tech.goto("/qapps/Commons/Panel/Today").status == 200
        waitForText(tech, compressorWork)
        tech.evaluate(name => {
            const row = Array.from(document.querySelectorAll(".q-item")).find(item => item.innerText.includes(name))
            return !!row && !row.innerText.includes("Mark done")
        }, compressorWork) == true
    }
})

feature("the technician completes the work with an explicit finish and the supervisor closes it", {
    expect() {
        const tech = pages["maint.tech"]
        tech.goto(detail(ids.compressor)).status == 200
        tech.getByRole("button", {name: "Complete", exact: true}).first().click()
        const complete = tech.getByRole("dialog")
        choose(tech, complete, "Outcome", "Rep", /^Repaired$/)
        choose(tech, complete, "Equipment after the work", "Avail", /^Available for use$/)
        // the finish in the minute after now: the work started seconds ago, and a field's minute before it is refused
        complete.locator("input[name=actualCompletionDate]").fill(hoursAgo(tech, -1 / 60))
        complete.getByRole("button", {name: "Complete", exact: true}).click()
        confirmAction(tech)
        waitForStatus(tech, "Complete")
        const supervisor = pages["maint.supervisor"]
        supervisor.goto(detail(ids.compressor)).status == 200
        supervisor.getByRole("button", {name: "Close", exact: true}).first().click()
        supervisor.getByRole("dialog").getByRole("button", {name: "Close", exact: true}).click()
        waitForStatus(supervisor, "Closed")
        supervisor.goto(detail(ids.compressor).replace("WorkOrderDetail?", "WorkOrderDetail/History?")).status == 200
        waitForText(supervisor, "Closed")
    }
})

feature("offboarding the technician in Admin lists their open work orders under Maintenance for reassignment", {
    expect() {
        const admin = pages["admin.admin"]
        admin.goto("/qapps/Admin/Users/UserDetail?userId=BOSS_MNT_TECH").status == 200
        waitForText(admin, "Lifecycle")
        admin.getByRole("button", {name: "Disable", exact: true}).click()
        const dialog = admin.getByRole("dialog")
        dialog.getByLabel("Reason", {exact: true}).fill("Walk: review only")
        dialog.getByRole("button", {name: "Review", exact: true}).click()
        waitForText(admin, "Maintenance work and equipment")
        waitForText(admin, "Open work orders")
        !/Error rendering|Exception in render/.test(admin.text())
    }
})
