// The public page of a published calendar (screen/PublishedCalendar.xml and PublishedCalendar.qvue at /cal/<token>, the
// token-route "cal" of MoquiConf.xml). The route's token check (ironstone.commons.CalendarServices.check#PublishedCalendarToken),
// then the page's events transition (get#PublishedCalendar) as a visitor who is not signed in: a good token, a bad one, an
// ended link, a share that also names a user, a password (missing, wrong, right), and a free/busy link that shows Busy.
// The demo Family calendar (CalendarDemoServices.load#CalendarDemo) is published here and unshared again at the end.
// The token route itself (the 404 page, the public shell) is the framework's: crates/moqui-host/tests/gate3.rs.
// Run: ./moq test mr-boss --spec PublishedCalendar
const page = "component://mr-boss/screen/PublishedCalendar.xml"
const CHECK = "ironstone.commons.CalendarServices.check#PublishedCalendarToken"
const SHARE = "mantle.work.CalendarServices.share#Calendar"
const UNSHARE = "mantle.work.CalendarServices.unshare#Calendar"
const FAMILY = "BOSS_DEMO_CAL_FAMILY"
const USER_TOKEN = "NotAPublishLinkToken0000000000000000"

// the page's request: a POST with the session token, as PublishedCalendar.qvue sends it (or as asked, a GET)
function visit(name, token, parameters, method = "post") {
    const asked = Object.assign({ token }, parameters || {}, method === "post" ? { moquiSessionToken: ec.web.sessionToken } : {})
    const str = ec.screen.makeTest().rootScreen(page).render(name, asked, method)
    let json = null
    try { json = JSON.parse(str.output) } catch (err) { json = null }
    const errors = (json && !Array.isArray(json) && json.errors) || str.errorMessages.join(" | ")
    ec.message.clearErrors()
    return { status: str.status, errors: errors || "", json: json || {}, output: String(str.output || "") }
}
function sys(run) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try { return run() } finally { if (!wasDisabled) ec.artifactExecution.enableAuthz() }
}
function range() {
    const today = ec.l10n.format(String(Date.now()), "yyyy-MM-dd")
    const [y, m, d] = today.split("-").map(Number)
    const shift = (offset) => new Date(Date.UTC(y, m - 1, d + offset)).toISOString().slice(0, 10)
    return { start: shift(-2), end: shift(12) }
}
// john.doe has no artifact grant for the Mantle share service; the calendar screen calls it. The spec sets the link up
// the same way the demo load writes rows: authorization off, the service's own manage check still runs as john.doe.
function publish(permission, password) {
    return sys(() => call(SHARE, { calendarId: FAMILY, publish: true, permissionEnumId: permission, password: password == null ? null : password }))
}
const titles = (answer) => (answer.json.eventList || []).map((event) => event.title)

spec({
    setupSpec() {
        login("john.doe")
        sys(() => call("ironstone.commons.CalendarDemoServices.load#CalendarDemo", {}))
        logout()
    },
    cleanupSpec() {
        login("john.doe")
        sys(() => call(UNSHARE, { calendarId: FAMILY, publish: true }))
        sys(() => {
            const row = ec.entity.find("mantle.work.calendar.CalendarShare").condition("publishToken", USER_TOKEN).one()
            if (row != null) row.delete()
        })
    },
})

feature("the route's token check: a publish link tells the page the name; a bad token, and a share that names a user, nothing", {
    when() {
        login("john.doe")
        const shared = publish("CalpView", "")
        sys(() => ec.service.sync().name("create#mantle.work.calendar.CalendarShare").parameters({ calendarId: "BOSS_DEMO_CAL_JD",
            userId: "ORG_ZIZI_JD", permissionEnumId: "CalpView", publishToken: USER_TOKEN, fromDate: ec.user.nowTimestamp }).call())
        logout()
        return { shared, good: call(CHECK, { token: shared.publishToken, routeName: "cal" }),
            bad: call(CHECK, { token: "NoSuchCalendarToken00", routeName: "cal" }),
            named: call(CHECK, { token: USER_TOKEN, routeName: "cal" }), short: call(CHECK, { token: "short", routeName: "cal" }),
            user: ec.user.userId }
    },
    then({ shared, good, bad, named, short, user }) {
        user == null
        shared.publishToken.length >= 16
        good.valid
        !good.routeContext.expired
        good.routeContext.calendarName == "Family"
        good.routeContext.color == "#43a047"
        !good.routeContext.needsPassword
        !bad.valid
        bad.routeContext == null
        !named.valid
        !short.valid
    },
})

feature("a publish link with no password shows that calendar's events and no other calendar's", {
    when() {
        login("john.doe")
        const shared = publish("CalpView", "")
        logout()
        const events = visit("events", shared.publishToken, range())
        return { events }
    },
    then({ events }) {
        events.status == 200
        !events.json.needsPassword
        events.json.calendarName == "Family"
        titles(events).includes("Mary's birthday")
        !titles(events).includes("Team sync")
        !titles(events).includes("Dentist")
        events.json.eventList.find((event) => event.title === "Mary's birthday").allDay
    },
})

feature("a link with a password: nothing until the right one, and a wrong one is its own error", {
    allowMessageErrors: true,
    when() {
        login("john.doe")
        const shared = publish("CalpView", "family")
        logout()
        const token = shared.publishToken
        return { check: call(CHECK, { token, routeName: "cal" }), none: visit("events", token, range()),
            wrong: visit("events", token, Object.assign({ password: "not it" }, range())),
            right: visit("events", token, Object.assign({ password: "family" }, range())),
            // the password never rides in an address: a GET of the events is refused (SEC-BOS-05)
            byGet: visit("events", token, Object.assign({ password: "family" }, range()), null) }
    },
    then({ check, none, wrong, right, byGet }) {
        byGet.status != 200
        !byGet.output.includes("Mary")
        check.valid
        check.routeContext.needsPassword
        none.status == 200
        none.json.needsPassword
        none.json.eventList.length == 0
        !none.output.includes("Mary")
        wrong.status == 500
        wrong.errors.includes("The password is not right")
        !wrong.output.includes("Mary")
        right.status == 200
        titles(right).includes("Mary's birthday")
    },
})

feature("a free/busy link shows Busy, and an ended link reaches the page only to say so", {
    allowMessageErrors: true,
    when() {
        login("john.doe")
        const shared = publish("CalpFreeBusy", "")
        logout()
        const busy = visit("events", shared.publishToken, range())
        login("john.doe")
        sys(() => call(UNSHARE, { calendarId: FAMILY, publish: true }))
        logout()
        const ended = call(CHECK, { token: shared.publishToken, routeName: "cal" })
        const after = visit("events", shared.publishToken, range())
        const component = ec.screen.makeTest().rootScreen(page).renderMode("qvue").render("", { token: shared.publishToken }, null)
        ec.message.clearErrors()
        return { busy, ended, after, component }
    },
    then({ busy, ended, after, component }) {
        busy.status == 200
        titles(busy).includes("Busy")
        !titles(busy).includes("Mary's birthday")
        busy.json.eventList.every((event) => !event.location)
        ended.valid
        ended.routeContext.expired
        ended.routeContext.calendarName == null
        after.status == 500
        after.errors.includes("This calendar link is not valid")
        !after.output.includes("Mary")
        component.status == 200
        component.output.includes("module.exports")
        component.output.includes("BossPublishedCalendar")
        component.output.includes("method: 'POST'")
    },
})
