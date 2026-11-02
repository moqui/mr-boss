// Commons Calendar/Schedules and Schedules/ResourceDetail (screen/Commons/Calendar/Schedules.xml and Schedules.qvue,
// ResourceDetail.xml, service/ironstone/commons/ScheduleServices.xml; impl-drawers-commons.md M7, design-drawers-commons.md §7): the
// meeting rooms and equipment john.doe may book, on the calendar demo (data/BossCalendarDemoData.xml, loaded again here). The
// resources with their policy (Bob Developer approves the Board room and the video kit) and the type, text and seats filters, not the
// manufacturing equipment; the bookings of a week with their status; a booking made at once, one waiting for approval, a clash
// refused with no event left behind, a booking cancelled with the event made for it; ResourceDetail with its policy, the user's
// bookings and Book. Joe Developer may not cancel john.doe's booking.
// Run: ./moq test mr-boss --spec Schedules
const webroot = "component://webroot/screen/webroot.xml"
const commons = "component://mr-boss/screen/Commons.xml"
let D

function call_(name, parameters, method) {
    const str = ec.screen.makeTest().rootScreen(commons).render(name, parameters || {}, method || null)
    let json = null
    try { json = JSON.parse(str.output) } catch (err) { json = null }
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), json: json || {}, output: String(str.output || "") }
}
const get = (name, parameters) => call_(`Calendar/Schedules/${name}`, parameters, null)
const post = (name, parameters) => call_(`Calendar/Schedules/${name}`, parameters, "post")
function render(path, parameters) {
    const str = ec.screen.makeTest().rootScreen(webroot).renderMode("qvt").withStaticData().render(path, Object.assign({ lastStandalone: "true" }, parameters || {}), null)
    const output = String(str.output || "")
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), output, broken: /Error rendering|Exception in render/.test(output) }
}
function sys(run) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try { return run() } finally { if (!wasDisabled) ec.artifactExecution.enableAuthz() }
}
function as(username, run) {
    login(username)
    try { return run() } finally { login("john.doe") }
}
const one = (entityName, fields) => sys(() => ec.entity.find(entityName).condition(fields).one())
const all = (entityName, fields) => sys(() => Array.from(ec.entity.find(entityName).condition(fields).list()))
const addDays = (text, days) => { const [y, m, d] = text.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d + days)).toISOString().substring(0, 10) }
const day = (offset) => addDays(D, offset)
const keys = "room|BOSS_DEMO_ROOM_MAPLE,room|BOSS_DEMO_ROOM_BOARD,equipment|BOSS_DEMO_PROJECTOR,equipment|BOSS_DEMO_VC_KIT"
const of = (answer, key) => (answer.json.bookingList || []).filter((booking) => booking.resourceKey === key)
const made = {}

spec({
    setupSpec() {
        login("john.doe")
        sys(() => call("ironstone.commons.CalendarDemoServices.load#CalendarDemo", {}))
        D = ec.l10n.format(ec.user.nowTimestamp, "yyyy-MM-dd")
    },
    cleanup() { login("john.doe") },
})

feature("the bookable rooms and equipment with their policies; the type, text and seats filters; no manufacturing equipment", {
    when() {
        // a room or piece of equipment is listed only when bookable is Y; type alone does not make it bookable, and a closed room stays out
        sys(() => {
            const store = (entityName, fields) => {
                const row = ec.entity.makeValue(entityName)
                row.setFields(fields, true, null, null)
                row.createOrUpdate()
            }
            store("mantle.facility.Facility", { facilityId: "BOSS_TEST_ROOM_PLAIN", facilityTypeEnumId: "FcTpRoom", facilityName: "Storeroom", ownerPartyId: "ORG_ZIZI_SERVICES" })
            store("mantle.facility.Facility", { facilityId: "BOSS_TEST_ROOM_CLOSED", facilityTypeEnumId: "FcTpRoom", facilityName: "Old room", bookable: "Y",
                closedDate: ec.user.nowTimestamp, ownerPartyId: "ORG_ZIZI_SERVICES" })
            store("mantle.product.asset.Asset", { assetId: "BOSS_TEST_EQUIP_PLAIN", assetTypeEnumId: "AstTpEquipment", classEnumId: "AsClsComputerHard",
                assetName: "Spare monitor", ownerPartyId: "ORG_ZIZI_SERVICES" })
        })
        const everything = get("resources")
        const rooms = get("resources", { type: "room" })
        const kit = get("resources", { text: "video" })
        // seats at least 10: the Board room (16) and not Maple (8) or a room without a capacity; equipment is not narrowed
        const seats = get("resources", { minCapacity: "10" })
        const list = everything.json.resourceList || []
        return { everything, list, rooms: rooms.json.resourceList || [], kit: kit.json.resourceList || [], seats: seats.json.resourceList || [],
            board: list.find((item) => item.key === "room|BOSS_DEMO_ROOM_BOARD") || {}, maple: list.find((item) => item.key === "room|BOSS_DEMO_ROOM_MAPLE") || {} }
    },
    then({ everything, list, rooms, kit, seats, board, maple }) {
        everything.status == 200
        everything.json.timeZone == "US/Central"
        list.some((item) => item.key === "equipment|BOSS_DEMO_PROJECTOR")
        !list.some((item) => item.resourceId === "EQUIP_AB4_1")
        !list.some((item) => item.resourceId === "BOSS_TEST_ROOM_PLAIN" || item.resourceId === "BOSS_TEST_ROOM_CLOSED" || item.resourceId === "BOSS_TEST_EQUIP_PLAIN")
        board.requiresApproval
        board.approverNames == ["Bob Developer"]
        board.site == "Main office"
        board.url == "/qapps/Commons/Calendar/Schedules/ResourceDetail?resourceType=room&resourceId=BOSS_DEMO_ROOM_BOARD"
        Number(board.capacity) == 16
        !maple.requiresApproval
        maple.policyText.startsWith("Booked at once")
        Number(maple.capacity) == 8
        rooms.every((item) => item.resourceType === "room")
        kit.map((item) => item.resourceId) == ["BOSS_DEMO_VC_KIT"]
        Number(kit[0].capacity) == 1
        seats.filter((item) => item.resourceType === "room").map((item) => item.resourceId) == ["BOSS_DEMO_ROOM_BOARD"]
        seats.some((item) => item.key === "equipment|BOSS_DEMO_PROJECTOR")
    },
})

feature("the bookings of the week: the sync, the planning and Bob's interview (busy) in Maple; the workshop waiting for the Board room, its projector booked", {
    when() {
        const week = get("bookings", { start: D, end: day(6), keys })
        return { week, maple: of(week, "room|BOSS_DEMO_ROOM_MAPLE"), board: of(week, "room|BOSS_DEMO_ROOM_BOARD"), projector: of(week, "equipment|BOSS_DEMO_PROJECTOR") }
    },
    then({ week, maple, board, projector }) {
        week.status == 200
        maple.some((booking) => booking.workEffortId === "BOSS_DEMO_EV_SYNC" && booking.start === D + " 10:00" && booking.mine)
        maple.some((booking) => booking.workEffortId === "BOSS_DEMO_EV_PLANNING" && booking.title === "Release planning" && !booking.mine)
        maple.find((booking) => booking.workEffortId === "BOSS_DEMO_EV_INTERVIEW").title == "Busy"
        board.length == 1
        board[0].workEffortId == "BOSS_DEMO_EV_WORKSHOP"
        board[0].statusLabel == "Pending approval"
        board[0].statusColor == "warning"
        board[0].canCancel
        projector[0].bookingStatusId == "WeaaAssigned"
    },
})

feature("booking: Maple at once, the Board room and the video kit waiting for Bob, a clash refused and no event left; cancel takes the event made for it", {
    when() {
        const maple = post("bookSlot", { resource: "room|BOSS_DEMO_ROOM_MAPLE", date: day(4), from: "13:00", to: "14:00", purpose: "BOSS_TEST supplier call" })
        made.maple = maple.json.workEffortId
        const board = post("bookSlot", { resourceType: "room", resourceId: "BOSS_DEMO_ROOM_BOARD", start: day(4) + " 15:00", end: day(4) + " 16:00", notes: "Quarterly review" })
        const kit = post("bookSlot", { resource: "equipment|BOSS_DEMO_VC_KIT", date: day(4), from: "15:00", to: "16:00", purpose: "BOSS_TEST remote review" })
        const before = all("mantle.work.effort.WorkEffort", { workEffortName: "BOSS_TEST clash booking" }).length
        const clash = post("bookSlot", { resource: "room|BOSS_DEMO_ROOM_MAPLE", date: D, from: "10:00", to: "10:30", purpose: "BOSS_TEST clash booking" })
        const after = all("mantle.work.effort.WorkEffort", { workEffortName: "BOSS_TEST clash booking" }).length
        const event = one("mantle.work.effort.WorkEffort", { workEffortId: made.maple }) || {}
        const cancel = post("cancelBooking", { workEffortId: made.maple, resourceType: "room", resourceId: "BOSS_DEMO_ROOM_MAPLE" })
        const workshop = post("cancelBooking", { workEffortId: "BOSS_DEMO_EV_WORKSHOP", resourceType: "equipment", resourceId: "BOSS_DEMO_PROJECTOR" })
        return { maple, board, kit, clash, before, after, event, cancel, workshop,
            mapleRow: one("mantle.work.effort.WorkEffortFacility", { workEffortId: made.maple, facilityId: "BOSS_DEMO_ROOM_MAPLE" }),
            boardRow: one("mantle.work.effort.WorkEffortFacility", { workEffortId: board.json.workEffortId, facilityId: "BOSS_DEMO_ROOM_BOARD" }) || {},
            inCalendar: one("mantle.work.calendar.CalendarWorkEffort", { calendarId: "BOSS_DEMO_CAL_JD", workEffortId: made.maple }),
            cancelledEvent: one("mantle.work.effort.WorkEffort", { workEffortId: made.maple }), workshopEvent: one("mantle.work.effort.WorkEffort", { workEffortId: "BOSS_DEMO_EV_WORKSHOP" }) }
    },
    then({ maple, board, kit, clash, before, after, event, cancel, workshop, mapleRow, boardRow, inCalendar, cancelledEvent, workshopEvent }) {
        maple.errors == ""
        maple.json.statusId == "WefAssigned"
        !maple.json.requiresApproval
        event.workEffortName == "BOSS_TEST supplier call"
        event.sourceReferenceId == "BossBooking"
        inCalendar != null
        board.json.requiresApproval
        board.json.statusId == "WefRequested"
        boardRow.comments == "Quarterly review"
        kit.json.statusId == "WeaaRequested"
        clash.errors.includes("is booked then")
        after == before
        cancel.errors == ""
        cancel.json.eventCancelled
        mapleRow == null
        cancelledEvent.statusId == "WeCancelled"
        // the workshop has the Board room still: its event stays
        workshop.errors == ""
        !workshop.json.eventCancelled
        workshopEvent.statusId != "WeCancelled"
    },
})

feature("ResourceDetail: what the Board room is, its policy, john.doe's booking of it and Book; a bad id is not available", {
    when() {
        const board = render("apps/Commons/Calendar/Schedules/ResourceDetail", { resourceType: "room", resourceId: "BOSS_DEMO_ROOM_BOARD" })
        const bad = render("apps/Commons/Calendar/Schedules/ResourceDetail", { resourceType: "room", resourceId: "BOSS_DEMO_PROJECTOR" })
        const detail = sys(() => call("ironstone.commons.ScheduleServices.get#ResourceDetail", { resourceType: "room", resourceId: "BOSS_DEMO_ROOM_BOARD" }))
        const booked = call_("Calendar/Schedules/ResourceDetail/book", { resourceType: "equipment", resourceId: "BOSS_DEMO_PROJECTOR", date: day(5), from: "09:00",
            to: "10:00", purpose: "BOSS_TEST projector" }, "post")
        return { board, bad, detail, booked, projectorEvent: all("mantle.work.effort.WorkEffort", { workEffortName: "BOSS_TEST projector" })[0] || {} }
    },
    then({ board, bad, detail, booked, projectorEvent }) {
        board.status == 200
        !board.broken
        board.output.includes("Board room")
        board.output.includes("A booking waits for approval by Bob Developer")
        board.output.includes("Client workshop: Acme rollout")
        bad.output.includes("is not a room or equipment to book")
        detail.found
        detail.myBookingList.some((booking) => booking.workEffortId === "BOSS_DEMO_EV_WORKSHOP")
        detail.facts.some((fact) => fact.label === "Where" && fact.value === "Main office")
        detail.facts.some((fact) => fact.label === "Capacity" && String(fact.value).includes("16"))
        Number(detail.resource.capacity) == 16
        booked.errors == ""
        projectorEvent.sourceReferenceId == "BossBooking"
    },
})

feature("Schedules renders in qvue; Joe Developer may not cancel john.doe's booking, and Bob's own bookings of the Board room need no approval", {
    when() {
        const qvue = ec.screen.makeTest().rootScreen(commons).renderMode("qvue").render("Calendar/Schedules", { lastStandalone: "-2" }, null)
        const joe = as("joe.developer", () => post("cancelBooking", { workEffortId: "BOSS_DEMO_EV_WORKSHOP", resourceType: "room", resourceId: "BOSS_DEMO_ROOM_BOARD" }))
        const bob = as("bob.developer", () => post("bookSlot", { resource: "room|BOSS_DEMO_ROOM_BOARD", date: day(5), from: "14:00", to: "15:00", purpose: "BOSS_TEST Bob's review" }))
        return { qvue: String(qvue.output || ""), joe, bob, board: one("mantle.work.effort.WorkEffortFacility", { workEffortId: "BOSS_DEMO_EV_WORKSHOP", facilityId: "BOSS_DEMO_ROOM_BOARD" }) }
    },
    then({ qvue, joe, bob, board }) {
        qvue.includes("module.exports")
        joe.errors.includes("not found")
        board != null
        bob.errors == ""
        bob.json.statusId == "WefAssigned"
    },
})
