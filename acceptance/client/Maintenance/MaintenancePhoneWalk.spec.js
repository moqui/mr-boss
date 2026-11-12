// Maintenance at phone width (impl-maintenance P20, P0's phone check; design-maintenance §11.2 "Phones and CalDAV", crosscut
// §3.27), an acceptance walk in the live client at 390 px: the technician's WorkOrderDetail (the air handler's leak in progress)
// and its Procedure, Time and Parts tabs fit the phone with the work order's status and actions; a requester reports a problem
// from Commons' Report a problem on a phone; the resource administrator records a reading of the van's odometer from
// EquipmentDetail's Meters on a phone; and the resource approver approves a booking of Room 101 (asked by the planner at 1280)
// from Maintenance's BookingRequests on a phone. No page scrolls sideways. The flows themselves are the phases' walks
// (MaintenanceCorrectiveWalk, MaintenanceChecklistWalk, MaintenanceBookingWalk) and regression specs.
// Run: ./moq accept mr-boss --spec MaintenancePhoneWalk
let pages = {}
const run = String(Date.now()).slice(-6)
const problemSummary = "Walk: compressor guard rattles " + run
spec({
    setupSpec() {
        for (const [user, width] of [
            ["maint.tech", 390],
            ["maint.requester", 390],
            ["maint.resources", 390],
            ["maint.booking", 390],
            ["maint.planner", 1280]
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
// a message an action answered (a notification), or the page's text
function waitForMessage(page, text) {
    page.waitFor(
        text => Array.from(document.querySelectorAll(".q-notification, .q-page")).some(node => node.innerText.includes(text)),
        {arg: text}
    )
}
// the page fits the phone: nothing scrolls sideways, and nothing failed to render
function fits(page) {
    page.settle()
    return (
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth) === true &&
        !/Error rendering|Exception in render/.test(page.text())
    )
}
function choose(page, scope, label, typed, option) {
    scope.getByLabel(label, {exact: true}).click()
    if (typed) page.keyboard.type(typed)
    page.getByRole("option", {name: option}).first().click()
    page.keyboard.press("Tab")
}
const detail = tab => "/qapps/Maintenance/WorkOrders/WorkOrderDetail" + (tab ? "/" + tab : "") + "?workEffortId=BOSS_MNT_WO_AHU"

feature("the technician's work order and its Procedure, Time and Parts tabs fit a phone, with its status and actions", {
    expect() {
        const tech = pages["maint.tech"]
        tech.goto(detail()).status == 200
        waitForText(tech, "Air handler coil leak")
        tech.evaluate(() => (document.querySelector(".m-record-status")?.innerText || "").trim().length > 0) == true
        fits(tech) == true
        for (const [tab, text] of [
            ["Procedure", "Procedure"],
            ["Time", "Time"],
            ["Parts", "Parts"]
        ]) {
            tech.goto(detail(tab)).status == 200
            waitForText(tech, text)
            fits(tech) == true
        }
    }
})

feature("a requester reports a problem from Commons' Report a problem on a phone", {
    expect() {
        const requester = pages["maint.requester"]
        requester.goto("/qapps/Commons/ReportProblem").status == 200
        waitForText(requester, "What is wrong")
        fits(requester) == true
        const form = requester.locator(".q-page")
        choose(requester, form, "Equipment or facility", "Compressor", /Compressor C-1/)
        form.getByLabel("What is wrong", {exact: true}).fill(problemSummary)
        fits(requester) == true
        form.getByRole("button", {name: "Report problem", exact: true}).click()
        requester.waitFor(() => (document.body.innerText || "").includes("Problem reported as request"))
    }
})

feature("the resource administrator records a reading of the van's odometer on a phone", {
    expect() {
        const resources = pages["maint.resources"]
        resources.goto("/qapps/Maintenance/Equipment/EquipmentDetail/Meters?assetId=BOSS_MNT_VAN").status == 200
        waitForText(resources, "Meters")
        fits(resources) == true
        resources.getByRole("button", {name: "Record a reading", exact: true}).click()
        const dialog = resources.getByRole("dialog")
        // the van has no model meter, so the choice lists every meter type by name: its odometer reading is the Distance Meter's
        dialog.getByLabel("Meter", {exact: true}).click()
        resources.getByRole("option", {name: "Distance Meter", exact: true}).click()
        resources.keyboard.press("Tab")
        // above the demo's last reading (48,210 on October 15) and every earlier run's: minutes since November 1, 2026
        const reading = String(60000 + Math.floor((Date.now() - Date.parse("2026-11-01T00:00:00Z")) / 60000))
        dialog.getByLabel("Reading", {exact: true}).fill(reading)
        resources.evaluate(() => document.documentElement.scrollWidth <= innerWidth) == true
        dialog.getByRole("button", {name: "Record reading", exact: true}).click()
        resources.waitFor(() => (document.body.innerText || "").includes("Reading recorded"))
    }
})

// a weekday four weeks ahead (within Room 101's 90-day horizon, away from the demo's blackout and MaintenanceBookingWalk's day), as
// yyyy-MM-dd in the browser, and the day after it
function bookingDays(page) {
    return page.evaluate(() => {
        const at = new Date(Date.now() + 28 * 86400000)
        while (at.getDay() === 0 || at.getDay() === 6) at.setDate(at.getDate() + 1)
        const two = n => String(n).padStart(2, "0")
        const text = day => day.getFullYear() + "-" + two(day.getMonth() + 1) + "-" + two(day.getDate())
        const next = new Date(at.getTime() + 86400000)
        return {day: text(at), next: text(next)}
    })
}

feature("the resource approver approves a booking of Room 101 from BookingRequests on a phone", {
    expect() {
        const planner = pages["maint.planner"]
        const {day, next} = bookingDays(planner)
        planner.goto("/qapps/Commons/Calendar/Schedules?view=day&date=" + day + "&type=room").status == 200
        waitForText(planner, "Room 101 Huddle")
        planner.getByRole("button", {name: "Book", exact: true}).click()
        const dialog = planner.getByRole("dialog")
        dialog.getByLabel("Room or equipment", {exact: true}).click()
        planner
            .getByRole("option", {name: /^Room 101 Huddle/})
            .first()
            .click()
        dialog.locator("input[name=date]").fill(day)
        dialog.locator("input[name=from]").fill("09:00")
        dialog.locator("input[name=to]").fill("10:00")
        dialog.getByLabel("What for", {exact: true}).fill("Walk: phone review " + run)
        dialog.getByRole("button", {name: "Book", exact: true}).click()
        planner.waitFor(() => (document.body.innerText || "").includes("waits for approval"))

        const approver = pages["maint.booking"]
        approver.goto("/qapps/Maintenance/Scheduling/BookingRequests?fromDate=" + day + "&thruDate=" + next).status == 200
        waitForText(approver, "Room 101 Huddle")
        waitForText(approver, "09:00")
        fits(approver) == true
        approver.getByRole("button", {name: "Approve", exact: true}).first().click()
        waitForMessage(approver, "booking approved")
        fits(approver) == true
    }
})
