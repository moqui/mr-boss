// NotificationsPanel and the Notifications center (screen/Commons/Panel/Notifications.xml, screen/Commons/Notifications.xml;
// impl-drawers-commons.md M2 as changed Oct 19): john.doe's demo notifications (service/ironstone/commons/DemoServices.xml) in the
// Notifications inbox with the approval waiting, and in the automatic Updates inbox; the reason chips; opening a row marks it
// read and answers its record's screen; mark all read leaves the approval waiting; approve and refuse (with the reason the
// demo topic requires) go through the framework's services to the demo topic's, which note the decision on the record. An app's
// empty Approvals (Purchasing's) names the approval waiting in another app and links to the center.
// Run: ./moq test mr-boss --spec Notifications
const webroot = "component://webroot/screen/webroot.xml"
const commons = "component://mr-boss/screen/Commons.xml"
// the Updates toggle with its unread count
const updatesToggle = new RegExp("Updates \u00b7 [0-9]+")

function render(path, parameters) {
    const str = ec.screen.makeTest().rootScreen(webroot).renderMode("qvt").withStaticData().render(`apps/Commons/${path}`, Object.assign({ lastStandalone: "true" }, parameters || {}), null)
    const output = String(str.output || "")
    return { status: str.status, errors: str.errorMessages.join(" | "), output, broken: /Error rendering|Exception in render/.test(output) }
}
function post(path, parameters) {
    const str = ec.screen.makeTest().rootScreen(commons).render(path, parameters || {}, "post")
    let json = null
    try { json = JSON.parse(str.output) } catch (err) { json = null }
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), json: json || {}, text: String(str.output || "").substring(0, 300) }
}
function sys(run) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try { return run() } finally { if (!wasDisabled) ec.artifactExecution.enableAuthz() }
}
const viewedOf = (id) => sys(() => ec.entity.find("moqui.security.user.NotificationMessageUser").condition({ notificationMessageId: id, userId: "EX_JOHN_DOE" }).one()).viewedDate
const notes = () => sys(() => ec.entity.find("mantle.request.RequestCommEvent").condition("requestId", "BOSS_DEMO_REQUEST").list())
    .map((row) => sys(() => ec.entity.find("mantle.party.communication.CommunicationEvent").condition("communicationEventId", row.communicationEventId).one()).body)

spec({
    setupSpec() {
        login("john.doe")
        sys(() => call("ironstone.commons.DemoServices.load#CommonsDemo", {}))
    },
})

feature("the Notifications tab lists the approval waiting, the unread and the earlier, without the Updates", {
    when() { return render("Panel/Notifications") },
    then({ status, errors, output, broken }) {
        status == 200
        errors == ""
        !broken
        output.includes("Approvals waiting")
        output.includes("Approve the shared calendar subscription: USD 120.00 a year")
        output.indexOf("Approvals waiting") < output.indexOf("Unread")
        output.includes("Joe Developer mentioned you on Request BOSS_DEMO_REQUEST")
        output.includes("Reminder: Compare the calendar options for the team")
        // read yesterday: under Earlier
        output.indexOf("Earlier") < output.indexOf("Joe Developer invited you to Weekly team meeting")
        // the reason chips and the Updates count on the toggle
        output.includes("Mention \u00b7 2")
        updatesToggle.test(output)
        // an update is not in the Notifications inbox
        !output.includes("added the meeting room calendar")
        output.includes("Notification settings")
    },
})

// the terminal's rows (the titles' tui twins, ACC-UI-040; DC-UI-042): in the tray's panel and in the center (an app's Approvals
// mounts it), a title is a post to openRead, which reads the row and opens its record; the center's is its rows' open link,
// which Enter posts (row-open-field), and the panel's (a link of its own there) reads the row as the center's does
feature("in the terminal a notification's and an approval's title reads it and opens its record, in the panel and the center", {
    when() {
        // a node and what it holds: its children, and a list's rows' cells
        const walk = (node) => !node || typeof node !== "object" ? [] : [node].concat(...(Array.isArray(node) ? node
            : (node.c || []).concat(...(node.rows || []).map((row) => row.cells || []))).map(walk))
        const titles = (path, parameters) => {
            const str = ec.screen.makeTest().rootScreen(commons).renderMode("tui").render(path, Object.assign({ lastStandalone: "-2" }, parameters), null)
            const output = String(str.output || "")
            const links = walk(JSON.parse(output)).filter((node) => node.t === "link")
            const linkOf = (text) => links.find((node) => String(node.text || "").startsWith(text)) || {}
            ec.message.clearErrors()
            return {
                status: str.status, broken: /Error rendering|Exception in render/.test(output),
                mention: linkOf("Joe Developer mentioned you on Request BOSS_DEMO_REQUEST"),
                approval: linkOf("Approve the shared calendar subscription"),
                posts: links.filter((node) => String(node.url || "").includes("openNotification")).length
            }
        }
        const mention = sys(() =>
            Array.from(ec.entity.find("moqui.security.user.NotificationMessageByUser").condition("userId", "EX_JOHN_DOE").list()).find(row =>
                String(row.titleText || "").startsWith("Joe Developer mentioned you on Request BOSS_DEMO_REQUEST")
            )
        )
        const id = mention.notificationMessageId
        sys(() => {
            const row = ec.entity.find("moqui.security.user.NotificationMessageUser").condition({notificationMessageId: id, userId: "EX_JOHN_DOE"}).one()
            row.viewedDate = null
            row.update()
        })
        const panel = titles("Panel/Notifications", {})
        const center = titles("Notifications", { appName: "Commons" })
        // the panel's title as the terminal posts it
        const opened = ec.screen.makeTest().rootScreen(webroot).render("apps/Commons/Panel/Notifications/openRead", {notificationMessageId: id}, "post")
        const location = String(opened.header("Location") || "")
        const errors = opened.errorMessages.join(" | ")
        ec.message.clearErrors()
        return { panel, center, location, errors, viewed: viewedOf(id) }
    },
    then({ panel, center, location, errors, viewed }) {
        panel.status == 200
        !panel.broken
        panel.mention.url.includes("/Panel/Notifications/openRead")
        panel.mention.method == "post"
        panel.approval.url.includes("/openRead")
        panel.approval.method == "post"
        panel.posts == 0
        center.status == 200
        !center.broken
        center.mention.url.includes("/Notifications/openRead")
        center.mention.method == "post"
        center.mention.open == true
        center.approval.url.includes("/openRead")
        center.approval.open == true
        center.posts == 0
        errors == ""
        location.includes("/apps/Commons/Requests/RequestDetail?requestId=BOSS_DEMO_REQUEST")
        viewed != null
    },
})

// Standard's center (DC-UI-042): the title posts openRead, as the browser's title posts openNotification, which reads the row
// and opens its record under /apps
feature("in Standard a notification's title opens its record and reads it", {
    when() {
        const mention = sys(() =>
            Array.from(ec.entity.find("moqui.security.user.NotificationMessageByUser").condition("userId", "EX_JOHN_DOE").list()).find(row =>
                String(row.titleText || "").startsWith("Joe Developer mentioned you on Request BOSS_DEMO_REQUEST")
            )
        )
        const id = mention.notificationMessageId
        sys(() => {
            const row = ec.entity.find("moqui.security.user.NotificationMessageUser").condition({notificationMessageId: id, userId: "EX_JOHN_DOE"}).one()
            row.viewedDate = null
            row.update()
        })
        const page = ec.screen.makeTest().rootScreen(commons).renderMode("html").render("Notifications", {appName: "Commons", lastStandalone: "-2"}, null)
        const output = String(page.output || "")
        ec.message.clearErrors()
        const opened = ec.screen.makeTest().rootScreen(webroot).render("apps/Commons/Notifications/openRead", {notificationMessageId: id}, "post")
        const location = String(opened.header("Location") || "")
        const errors = opened.errorMessages.join(" | ")
        ec.message.clearErrors()
        return {id, output, location, errors, viewed: viewedOf(id)}
    },
    then({id, output, location, errors, viewed}) {
        !/Error rendering|Exception in render/.test(output)
        output.includes("/Notifications/openRead")
        output.includes('name="notificationMessageId" value="' + id + '"')
        errors == ""
        location.includes("/apps/Commons/Requests/RequestDetail?requestId=BOSS_DEMO_REQUEST")
        !location.includes("/qapps/")
        viewed != null
    }
})

// with the Commons app chip: in a run of every component the Mantle specs before this one leave many newer record updates
feature("the Updates toggle lists the automatic inbox, with no approvals", {
    when() { return render("Panel/Notifications", { inboxEnumId: "NinUpdates", appName: "Commons" }) },
    then({ status, errors, output }) {
        status == 200
        errors == ""
        output.includes("Joe Developer on Request BOSS_DEMO_REQUEST: added the meeting room calendar to the list")
        output.includes("Bob Developer accepted Weekly team meeting")
        !output.includes("Approvals waiting")
        !output.includes("Joe Developer mentioned you on Request")
    },
})

feature("a reason chip narrows the tab to its reason", {
    when() { return render("Panel/Notifications", { reasonEnumId: "NrReminder" }) },
    then({ status, output }) {
        status == 200
        output.includes("Reminder: Compare the calendar options for the team")
        !output.includes("Joe Developer mentioned you on Request")
    },
})

// with the Commons app chip, as the Updates toggle: the Mantle specs before this one leave newer notices past the first page
feature("the center lists both inboxes in its rail, the approvals first, and renders the Updates inbox", {
    when() { return { notifications: render("Notifications", { appName: "Commons" }), updates: render("Notifications", { inboxEnumId: "NinUpdates", appName: "Commons" }) } },
    then({ notifications, updates }) {
        notifications.status == 200
        notifications.errors == ""
        !notifications.broken
        notifications.output.includes("Inboxes")
        notifications.output.includes("Approve the shared calendar subscription")
        notifications.output.indexOf("Approvals waiting") < notifications.output.indexOf("Joe Developer mentioned you on Request")
        notifications.output.includes("Unread by reason")
        updates.status == 200
        updates.errors == ""
        updates.output.includes("added the meeting room calendar")
        !updates.output.includes("Approvals waiting")
    },
})

// an app's Approvals (the center mounted with the app's topics) with none of its own while the demo approval waits in Commons says
// so and links to all approvals (TUI review 2026-11-16: it said only "Nothing waiting on you")
feature("an app's empty Approvals says an approval waits in other apps and links to the Notifications center", {
    when() {
        const str = ec.screen.makeTest().rootScreen(webroot).renderMode("qvt").withStaticData().render("apps/Purchasing/Approvals", { lastStandalone: "true" }, null)
        const output = String(str.output || "")
        ec.message.clearErrors()
        return { status: str.status, errors: str.errorMessages.join(" | "), output }
    },
    then({ status, errors, output }) {
        status == 200
        errors == ""
        /Nothing waiting on you here; (one approval waits|[0-9]+ approvals wait) in other apps\./.test(output)
        output.includes('<m-link href="/apps/Commons/Notifications')
        output.includes("Open all approvals")
    },
})

feature("opening a notification marks it read and answers its record's screen", {
    when() {
        const opened = post("Panel/Notifications/openNotification", { notificationMessageId: "BOSS_DEMO_NM_MENTION" })
        return { opened, viewed: viewedOf("BOSS_DEMO_NM_MENTION") }
    },
    then({ opened, viewed }) {
        opened.errors == ""
        opened.json.screenUrl == "/qapps/Commons/Requests/RequestDetail?requestId=BOSS_DEMO_REQUEST"
        viewed != null
    },
})

feature("another user's notification is not listed, opened or approved", {
    allowMessageErrors: true,
    when() {
        sys(() => {
            call("store#moqui.security.user.NotificationMessage", { notificationMessageId: "BOSS_TEST_NM_OTHER", topic: "BossDemoApproval",
                reasonEnumId: "NrApproval", titleText: "Approve Joe's own purchase", sentDate: ec.user.nowTimestamp,
                recordEntityName: "mantle.request.Request", recordId: "BOSS_DEMO_REQUEST", messageJson: '{"summary": "Joe only"}' })
            call("store#moqui.security.user.NotificationMessageUser", { notificationMessageId: "BOSS_TEST_NM_OTHER", userId: "ORG_ZIZI_JD",
                sentDate: ec.user.nowTimestamp })
        })
        return { opened: post("Panel/Notifications/openNotification", { notificationMessageId: "BOSS_TEST_NM_OTHER" }),
            approved: post("Panel/Notifications/approve", { notificationMessageId: "BOSS_TEST_NM_OTHER" }),
            panel: render("Panel/Notifications"), center: render("Notifications"),
            viewed: sys(() => ec.entity.find("moqui.security.user.NotificationMessageUser").condition({ notificationMessageId: "BOSS_TEST_NM_OTHER", userId: "ORG_ZIZI_JD" }).one()).viewedDate }
    },
    then({ opened, approved, panel, center, viewed }) {
        opened.status == 500
        opened.text.includes("not found")
        approved.status == 500
        approved.text.includes("not addressed to you")
        !panel.output.includes("Approve Joe's own purchase")
        !center.output.includes("Approve Joe's own purchase")
        viewed == null
    },
})

feature("Mark all read of the Notifications inbox leaves the approval waiting and the Updates unread", {
    when() {
        const marked = post("Panel/Notifications/markAllRead", { inboxEnumId: "NinNotifications" })
        return { marked, reminder: viewedOf("BOSS_DEMO_NM_REMINDER"), approval: viewedOf("BOSS_DEMO_NM_APPROVAL"), update: viewedOf("BOSS_DEMO_NM_FOLLOW") }
    },
    then({ marked, reminder, approval, update }) {
        marked.errors == ""
        marked.json.viewedCount >= 1
        reminder != null
        approval == null
        update == null
    },
})

feature("Refuse without a reason is refused, as the demo topic requires one", {
    allowMessageErrors: true,
    when() { return { refused: post("Panel/Notifications/refuse", { notificationMessageId: "BOSS_DEMO_NM_APPROVAL" }), approval: viewedOf("BOSS_DEMO_NM_APPROVAL") } },
    then({ refused, approval }) {
        refused.status == 500
        refused.text.includes("reason")
        approval == null
    },
})

feature("Approve in the tab calls the demo topic's approve service, which notes it on the request", {
    when() {
        const approved = post("Panel/Notifications/approve", { notificationMessageId: "BOSS_DEMO_NM_APPROVAL" })
        return { approved, approval: viewedOf("BOSS_DEMO_NM_APPROVAL"), notes: notes(), panel: render("Panel/Notifications", { appName: "Commons" }) }
    },
    then({ approved, approval, notes, panel }) {
        approved.errors == ""
        approved.json.messageInfos[0].message == "Approved"
        approval != null
        notes.some((body) => body == "Approved: Shared calendar subscription for the team")
        !panel.output.includes("Approvals waiting")
    },
})

feature("Refuse with a reason in the center notes the decision and its reason", {
    when() {
        // a second approval, from the demo again
        sys(() => call("ironstone.commons.DemoServices.load#CommonsDemo", {}))
        const refused = post("Notifications/refuse", { notificationMessageId: "BOSS_DEMO_NM_APPROVAL", reason: "Not this year" })
        return { refused, notes: notes() }
    },
    then({ refused, notes }) {
        refused.errors == ""
        notes.some((body) => body == "Refused: Shared calendar subscription for the team (Not this year)")
    },
})
