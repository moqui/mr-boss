// Maintenance's golden path in the live client (impl-maintenance P3, the app's one regression walk): a planner creates a corrective
// work order for Room 101 with New work order (approved on create) and assigns the technician with Assign and schedule; the
// technician starts it from its primary action, records an hour of their time and completes it with its outcome; the supervisor
// closes it. The rules (the lifecycle's gates, the threshold, time on assigned work in progress, the generic paths refused) are
// mr-mantle's MaintenanceWorkOrders and MaintenanceManagedWork and mr-boss's MaintenanceWorkOrders; the "usable when" is the
// acceptance MaintenanceCorrectiveWalk.
let pages = {}
const name = "Walk: Room 101 display flickers " + String(Date.now()).slice(-6)
spec({
    setupSpec() {
        for (const user of ["maint.planner", "maint.tech", "maint.supervisor"]) {
            const page = browser.newPage({user, viewport: {width: 1280, height: 1000}, timeout: 30})
            page.allowProblems(/userPhoto\?userId=/)
            pages[user] = page
        }
    }
})
function waitForText(page, text) {
    page.waitFor(text => (document.querySelector(".q-page")?.innerText || "").includes(text), {arg: text})
}
// the work order's status, in the record header
function waitForStatus(page, text) {
    page.waitFor(text => (document.querySelector(".m-record-status")?.innerText || "").trim() === text, {arg: text})
}
// the in-app confirmation (moqui.confirmAction): only its Confirm button approves the action
function confirmAction(page) {
    page.locator(".q-dialog-plugin").getByRole("button", {name: "Confirm", exact: true}).click()
}
// a drop-down of the open dialog: open it, type, choose the option, and leave the field (a multiple choice keeps its menu open)
function choose(page, scope, label, typed, option) {
    scope.getByLabel(label, {exact: true}).click()
    if (typed) page.keyboard.type(typed)
    page.getByRole("option", {name: option}).first().click()
    page.keyboard.press("Tab")
}
// a day and time an hour or two ago in the browser's zone, as a date-time field takes it
function hoursAgo(page, hours) {
    return page.evaluate(hours => {
        const at = new Date(Date.now() - hours * 3600000)
        const two = n => String(n).padStart(2, "0")
        return (
            at.getFullYear() +
            "-" +
            two(at.getMonth() + 1) +
            "-" +
            two(at.getDate()) +
            " " +
            two(at.getHours()) +
            ":" +
            two(at.getMinutes())
        )
    }, hours)
}
let workEffortId = null
const detail = () => "/qapps/Maintenance/WorkOrders/WorkOrderDetail?workEffortId=" + workEffortId

feature(
    "a planner creates and assigns a work order, the technician starts it, records time and completes it, the supervisor closes it",
    {
        expect() {
            const planner = pages["maint.planner"]
            planner.goto("/qapps/Maintenance/WorkOrders/NewWorkOrder?facilityId=BOSS_MNT_ROOM_101").status == 200
            waitForText(planner, "New work order")
            planner.getByLabel("What needs doing", {exact: true}).fill(name)
            planner.getByRole("button", {name: "Create work order", exact: true}).click()
            planner.waitForURL(/WorkOrderDetail/)
            waitForText(planner, name)
            workEffortId = planner.evaluate(() => new URLSearchParams(location.search).get("workEffortId"))
            !!workEffortId
            waitForStatus(planner, "Approved")
            planner.getByRole("button", {name: "Assign and schedule", exact: true}).click()
            const dialog = planner.getByRole("dialog")
            // P8: each technician is offered with their free hours and team ("Maintenance Technician · 8 h free · team")
            choose(planner, dialog, "Technicians", "Techn", /^Maintenance Technician( ·|$)/)
            dialog.getByRole("button", {name: "Save", exact: true}).click()
            waitForText(planner, "Maintenance Technician")

            const tech = pages["maint.tech"]
            tech.goto(detail()).status == 200
            waitForText(tech, name)
            tech.getByRole("button", {name: "Start", exact: true}).first().click()
            tech.getByRole("dialog").getByRole("button", {name: "Start", exact: true}).click()
            waitForStatus(tech, "In Progress")
            // the Time tab in the page (no reload)
            tech.getByRole("tab", {name: "Time", exact: true}).click()
            waitForText(tech, "Your time:")
            tech.getByRole("button", {name: "Record time", exact: true}).click()
            const time = tech.getByRole("dialog")
            time.locator("input[name=fromDate]").fill(hoursAgo(tech, 2))
            time.getByLabel("Hours", {exact: true}).fill("1")
            time.getByLabel("What was done", {exact: true}).fill("Reseated the display cable")
            time.getByRole("button", {name: "Record", exact: true}).click()
            waitForText(tech, "Reseated the display cable")
            waitForText(tech, "Your time: 1 h")
            tech.getByRole("button", {name: "Complete", exact: true}).first().click()
            const complete = tech.getByRole("dialog")
            choose(tech, complete, "Outcome", "Rep", /^Repaired$/)
            complete.getByRole("button", {name: "Complete", exact: true}).click()
            confirmAction(tech)
            waitForStatus(tech, "Complete")

            const supervisor = pages["maint.supervisor"]
            supervisor.goto(detail()).status == 200
            waitForText(supervisor, name)
            supervisor.getByRole("button", {name: "Close", exact: true}).first().click()
            supervisor.getByRole("dialog").getByRole("button", {name: "Close", exact: true}).click()
            waitForStatus(supervisor, "Closed")
            !/Error rendering|Exception in render/.test(supervisor.text())
        }
    }
)
