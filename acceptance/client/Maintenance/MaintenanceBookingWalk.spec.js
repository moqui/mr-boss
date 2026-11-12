// Maintenance P16's "usable when" in the live client (impl-maintenance P16, gate 5; design-maintenance §11.2 "Booking concurrency",
// §7.1, BookingRequests), an acceptance walk: two people ask for the managed Room 101 at overlapping times in Commons' Rooms and
// equipment: the first waits for approval, the second is answered the conflict (a request holds the room provisionally, its title
// Busy); the resource approver approves the first from Commons' approvals inbox on a phone (390 px), and its organizer is told;
// the organizer moves the approved meeting and it waits for approval again, back in the approver's BookingRequests, where they
// approve the new time; the approver's resource calendar in Maintenance shows the room booked and the carpet blackout blocked, with
// nothing to drag. The rules are mr-mantle's ResourceBookingDecisions and ResourceBookingPolicy and mr-boss's MaintenanceScheduling.
// Not run by the phase (acceptance).
let pages = {}
const run = String(Date.now()).slice(-6)
const firstMeeting = "Walk: budget review " + run
const secondMeeting = "Walk: vendor call " + run
spec({
    setupSpec() {
        for (const [user, width] of [
            ["maint.planner", 1280],
            ["maint.reader", 1280],
            ["maint.booking", 390]
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
// a weekday three weeks ahead (within Room 101's 90-day horizon and away from the demo's blackout), as yyyy-MM-dd in the browser
function bookingDay(page) {
    return page.evaluate(() => {
        const at = new Date(Date.now() + 21 * 86400000)
        while (at.getDay() === 0 || at.getDay() === 6) at.setDate(at.getDate() + 1)
        const two = n => String(n).padStart(2, "0")
        return at.getFullYear() + "-" + two(at.getMonth() + 1) + "-" + two(at.getDate())
    })
}
const ids = {}
// Book Room 101 from Commons' Rooms and equipment on the day from to to, named what: the message shown
function book(page, day, from, to, what) {
    page.goto("/qapps/Commons/Calendar/Schedules?view=day&date=" + day + "&type=room").status == 200
    waitForText(page, "Room 101 Huddle")
    page.getByRole("button", {name: "Book", exact: true}).click()
    const dialog = page.getByRole("dialog")
    dialog.getByLabel("Room or equipment", {exact: true}).click()
    page.getByRole("option", {name: /^Room 101 Huddle/}).first().click()
    dialog.locator("input[name=date]").fill(day)
    dialog.locator("input[name=from]").fill(from)
    dialog.locator("input[name=to]").fill(to)
    dialog.getByLabel("What for", {exact: true}).fill(what)
    dialog.getByRole("button", {name: "Book", exact: true}).click()
    page.waitFor(() => !!document.querySelector(".q-notification"))
    return page.evaluate(() => Array.from(document.querySelectorAll(".q-notification")).map(node => node.innerText).join(" | "))
}

feature("two people ask for Room 101 at overlapping times: the first waits for approval, the second is answered the conflict", {
    expect() {
        const planner = pages["maint.planner"]
        const reader = pages["maint.reader"]
        ids.day = bookingDay(planner)
        const first = book(planner, ids.day, "14:00", "15:00", firstMeeting)
        first.includes("waits for approval")
        // the conflict is the transition's refusal: its warning, and the error status of its answer
        reader.allowProblems(/booked then: Busy|500 Internal Server Error .*bookSlot/)
        const second = book(reader, ids.day, "14:30", "15:30", secondMeeting)
        second.includes("Room 101 Huddle is booked then: Busy")
        !second.includes(firstMeeting)
    }
})

feature("the resource approver approves it from Commons' approvals inbox on a phone, and its organizer is told", {
    expect() {
        const approver = pages["maint.booking"]
        approver.goto("/qapps/Commons/Notifications").status == 200
        waitForText(approver, "Approvals waiting")
        waitForText(approver, "Approve booking of Room 101 Huddle")
        // the card names the room, the time and the requester, never the meeting's title
        !approver.text().includes(firstMeeting)
        approver.getByRole("button", {name: "Approve", exact: true}).first().click()
        waitForText(approver, "Nothing waiting on you")
        const planner = pages["maint.planner"]
        planner.goto("/qapps/Commons/Notifications").status == 200
        waitForText(planner, "Room 101 Huddle: booking approved")
    }
})

feature("the organizer moves the approved meeting and it waits for approval again; the approver approves the new time", {
    expect() {
        const planner = pages["maint.planner"]
        planner.goto("/qapps/Commons/Calendar/Schedules?view=day&date=" + ids.day + "&type=room").status == 200
        waitForText(planner, firstMeeting)
        planner.getByText(firstMeeting).first().click()
        planner.getByRole("button", {name: "Open the event", exact: true}).click()
        planner.waitForURL(/EventDetail/)
        waitForText(planner, "Booked")
        const when = planner.locator("form[name=EventWhen]")
        when.locator("input[name=startTime]").fill("16:00")
        when.locator("input[name=endTime]").fill("17:00")
        when.getByRole("button", {name: "Save", exact: true}).click()
        waitForText(planner, "Pending approval")
        // the approver finds it waiting again in Maintenance's BookingRequests, at its new time, and approves it there
        const approver = pages["maint.booking"]
        // the walk's day only: the demo's handover request waits too, and stays waiting for the walks after this one
        const next = planner.evaluate(
            day => new Date(Date.parse(day + "T00:00:00Z") + 86400000).toISOString().substring(0, 10),
            ids.day
        )
        approver.goto("/qapps/Maintenance/Scheduling/BookingRequests?fromDate=" + ids.day + "&thruDate=" + next).status == 200
        waitForText(approver, "Room 101 Huddle")
        waitForText(approver, "16:00")
        approver.getByRole("button", {name: "Approve", exact: true}).first().click()
        waitForMessage(approver, "booking approved")
        // the event again, from the server
        planner.goto(planner.url().replace(/^[a-z]+:\/\/[^/]+/i, "")).status == 200
        waitForText(planner, "Booked")
    }
})

feature("the approver's resource calendar shows the room booked and the demo blackout blocked, with nothing to drag", {
    expect() {
        const approver = pages["maint.booking"]
        approver.goto("/qapps/Maintenance/Scheduling/ResourceCalendar?view=day&date=" + ids.day + "&type=room").status == 200
        waitForText(approver, "Room 101 Huddle")
        // the meeting the approver may not open is Busy
        waitForText(approver, "Busy")
        !approver.text().includes(firstMeeting)
        // Commons' way back to the calendar is not shown under Maintenance, nor its Scheduling admin link
        !approver.text().includes("Scheduling admin")
        approver.goto("/qapps/Maintenance/Scheduling/ResourceCalendar?view=day&date=2026-11-17&type=room").status == 200
        waitForText(approver, "Not available: closed (blackout)")
    }
})
