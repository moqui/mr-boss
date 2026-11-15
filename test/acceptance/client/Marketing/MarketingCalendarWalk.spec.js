// Marketing P21's campaign calendar in the live client (impl-marketing P21 "usable when"; design-marketing §3 Calendar, §1.3 CX-SYNC,
// §14.3 palette), an acceptance walk as marketing.events, the webinar's organizer: the calendar shows the running campaign's window, its
// scheduled December newsletter and the spring planting webinar; dragging the webinar to another day moves it (Commons'
// update#EventOccurrence), while dragging the send moves nothing; the send is unlinked for the events manager, who may not open SendDetail
// (follow-up 9: Sends is not the events manager's area, design §1.2), in the calendar and Home's Upcoming; a phone given an app password
// lists the "Campaign calendar" collection over CalDAV with the same items, and its write is refused; the palette finds the campaign by
// name and no send. The demo's own records
// (data/BossZZMarketingDemoData.xml), dated from the load (follow-up 6: the campaign 14 days before the load day to 77 after, the send
// 16 days after; follow-up 3: the webinar ten weeks or more after), so the days are read from the calendar itself and the projected
// collection (30 days back, 180 ahead) holds them on any day; the rules are mr-mantle's MarketingCalendar and mr-boss's MarketingShell.
// The webinar is moved back at the end.
// Run: ./moq accept mr-boss --spec MarketingCalendarWalk
const user = "marketing.events"
const ids = {
    campaign: "BOSS_MKT_CMP_SPRING",
    campaignName: "Spring garden launch",
    send: "BOSS_MKT_SEND_DEC",
    sendName: "Garden newsletter, December",
    webinar: "BOSS_MKT_EV_WEBINAR",
    webinarName: "Spring planting webinar"
}
const dayMs = 24 * 60 * 60 * 1000
let page = null
let admin = null
const state = {}
// a record's field through the REST API as the instance administrator
const field = (entity, id, name) => {
    const found = admin.get("/rest/e1/" + entity + "/" + id, {accept: "json"})
    return found.ok ? found.json()[name] : null
}
// a record's date as epoch milliseconds (entity REST answers a timestamp so), or null
const msOf = value => (value == null || value === "" ? null : /^\d+$/.test(String(value)) ? Number(value) : Date.parse(value))
// the day a record lands on in the calendar's month view: the cell of the smallest chip whose text holds the title (the calendar's
// own zone decides the day, which need not be the browser's)
const shownDay = title =>
    page.evaluate(title => {
        const chip = Array.from(document.querySelectorAll(".boss-calendar [data-day] *"))
            .filter(element => (element.innerText || "").includes(title))
            .sort((x, y) => x.offsetWidth * x.offsetHeight - y.offsetWidth * y.offsetHeight)[0]
        return chip?.closest("[data-day]")?.getAttribute("data-day") || null
    }, title)
// the first day of a record's month, in UTC: the month view of a day a few days into it holds the record whatever the zone
const nearDay = ms => new Date(ms).toISOString().substring(0, 10)
const addDays = (day, days) => new Date(Date.parse(day + "T12:00:00Z") + days * dayMs).toISOString().substring(0, 10)
function waitForText(text) {
    page.waitFor(text => (document.body.innerText || "").includes(text), {arg: text})
}
// a drag in the month view, as a mouse makes it: pointer down on the chip whose text holds title, moves to the day's cell, up there
function drag(title, toDay) {
    return page.evaluate(
        ({title, toDay}) => {
            // the smallest element whose text starts with the title: the chip (a pointer down on its text reaches its handler)
            const chip = Array.from(document.querySelectorAll(".boss-calendar div"))
                .filter(element => (element.innerText || "").includes(title))
                .sort((x, y) => x.offsetWidth * x.offsetHeight - y.offsetWidth * y.offsetHeight)[0]
            const cell = document.querySelector(".boss-calendar [data-day='" + toDay + "']")
            if (!chip || !cell) return {found: false, chip: !!chip, cell: !!cell}
            const from = chip.getBoundingClientRect()
            const to = cell.getBoundingClientRect()
            const at = (x, y) => ({
                bubbles: true,
                cancelable: true,
                button: 0,
                buttons: 1,
                pointerType: "mouse",
                clientX: x,
                clientY: y
            })
            const fromX = from.left + 6,
                fromY = from.top + from.height / 2
            const toX = to.left + to.width / 2,
                toY = to.top + to.height / 2
            chip.dispatchEvent(new PointerEvent("pointerdown", at(fromX, fromY)))
            window.dispatchEvent(new PointerEvent("pointermove", at(fromX + 10, fromY + 10)))
            window.dispatchEvent(new PointerEvent("pointermove", at(toX, toY)))
            window.dispatchEvent(new PointerEvent("pointerup", Object.assign(at(toX, toY), {buttons: 0})))
            return {found: true}
        },
        {title, toDay}
    )
}
const monthOf = day => "/qapps/Marketing/Calendar?view=month&date=" + day

spec({
    stepwise: true,
    setupSpec() {
        admin = session({user: "john.doe"})
        state.sendDate = field("mantle.marketing.campaign.CampaignSend", ids.send, "scheduledDate")
        state.webinarStart = field("mantle.work.effort.WorkEffort", ids.webinar, "estimatedStartDate")
        if (!state.sendDate || !state.webinarStart) skip("the demo's December newsletter and webinar are not loaded")
        page = browser.newPage({user, viewport: {width: 1440, height: 1000}, timeout: 30})
        page.allowProblems(/userPhoto\?userId=/)
    },
    cleanupSpec() {
        // the webinar back on its own day, as its organizer moves it
        if (!state.movedTo || !page) return
        page.goto(monthOf(state.movedTo))
        waitForText(ids.webinarName)
        drag(ids.webinarName, state.webinarDay)
        const save = page.getByRole("button", {name: "Save"})
        if (save.isVisible()) save.click()
    }
})

feature("the calendar shows the campaign's window, its scheduled send and its event", {
    expect() {
        page.goto("/qapps/Marketing/Home").status == 200
        page.getByRole("link", {name: "Calendar"}).first().click()
        page.waitForURL(/\/qapps\/Marketing\/Calendar/)
        page.goto(monthOf(nearDay(msOf(state.sendDate)))).status == 200
        waitForText(ids.sendName)
        state.sendDay = shownDay("Send: " + ids.sendName)
        page.text().includes("Campaign: " + ids.campaignName)
        page.text().includes("Send: " + ids.sendName)
        page.goto(monthOf(nearDay(msOf(state.webinarStart)))).status == 200
        waitForText(ids.webinarName)
        state.webinarDay = shownDay(ids.webinarName)
        !!state.sendDay && !!state.webinarDay
        !/Error rendering|Exception in render/.test(page.text())
    }
})

feature("dragging the event moves it; dragging the send moves nothing, and the send is unlinked for the events manager", {
    expect() {
        // the webinar to the next day
        state.movedTo = addDays(state.webinarDay, 1)
        page.goto(monthOf(state.webinarDay))
        waitForText(ids.webinarName)
        drag(ids.webinarName, state.movedTo).found == true
        const save = page.getByRole("button", {name: "Save"})
        if (save.isVisible()) save.click()
        // a day later at the same time
        waitUntil(
            () =>
                msOf(field("mantle.work.effort.WorkEffort", ids.webinar, "estimatedStartDate")) ===
                msOf(state.webinarStart) + dayMs
        )
        // the send stays where its approval put it
        page.goto(monthOf(state.sendDay))
        waitForText(ids.sendName)
        drag("Send: " + ids.sendName, addDays(state.sendDay, 2)).found == true
        sleep(500)
        msOf(field("mantle.marketing.campaign.CampaignSend", ids.send, "scheduledDate")) == msOf(state.sendDate)
        // follow-up 9: the send is unlinked for the events manager (no SendDetail, which refuses them): a click stays on the calendar,
        // and Home's Upcoming shows it as text
        page.goto(monthOf(state.sendDay))
        waitForText(ids.sendName)
        page.getByText("Send: " + ids.sendName)
            .first()
            .click()
        sleep(500)
        page.url().includes("/qapps/Marketing/Calendar")
        !page.text().includes("View not permitted")
        page.goto("/qapps/Marketing/Home").status == 200
        waitForText(ids.sendName)
        page.locator("a[href*='SendDetail']").count() == 0
    }
})

feature("a phone with an app password lists the Campaign calendar's items read only", {
    expect() {
        page.goto("/qapps/Commons/Settings/Sync").status == 200
        page.getByRole("button", {name: "New app password"}).click()
        page.getByRole("dialog").getByLabel("Device or app").fill("Calendar walk phone")
        page.getByRole("dialog").getByRole("button", {name: "Make the password"}).click()
        waitForText("App password for Calendar walk phone")
        const password = page.locator("pre").first().text().trim()
        const phone = session({})
        const basic = [user, password]
        const home = phone.request("PROPFIND", "/dav/calendars/" + user + "/", {basic, headers: {Depth: "1"}})
        const collection = "/dav/calendars/" + user + "/projected-MarketingCampaigns/"
        const listed = phone.request("PROPFIND", collection, {basic, headers: {Depth: "1"}})
        const sendObject = phone.get(collection + "marketing-send-" + ids.send + ".ics", {basic})
        const put = phone.put(collection + "marketing-send-" + ids.send + ".ics", {
            basic,
            body: "BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n",
            headers: {"Content-Type": "text/calendar"}
        })
        home.status == 207 && home.text.includes("projected-MarketingCampaigns")
        listed.status == 207
        listed.text.includes("marketing-campaign-" + ids.campaign + ".ics")
        listed.text.includes("marketing-send-" + ids.send + ".ics")
        // the object's text unfolded and unescaped (RFC 5545 escapes a comma in a SUMMARY)
        const ics = sendObject.text.replace(/\r\n[ \t]/g, "").replace(/\\([,;\\])/g, "$1")
        sendObject.status == 200 && ics.includes("Send: " + ids.sendName)
        put.status == 403
    }
})

feature("the palette finds the campaign by name, and no send for the events manager", {
    expect() {
        page.goto("/qapps/Marketing/Home").status == 200
        page.click("#m-search")
        // the palette's own input, filled once it is open (keys typed before it takes the focus are lost)
        const query = page.locator("input[placeholder^='Search screens']")
        query.fill("Spring garden")
        waitForText("Campaign · ")
        page.text().includes(ids.campaignName)
        // follow-up 9: no send for the events manager, who may not open SendDetail (the palette's results settle on the campaign's)
        query.fill("Garden")
        waitForText("Campaign · ")
        !page.text().includes("Send · ")
        page.press("Escape")
    }
})
