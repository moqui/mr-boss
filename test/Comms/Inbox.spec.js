// The Comms Inbox (screen/Comms/Inbox/Mail.xml and Mail.qvue, service/ironstone/comms/InboxServices.xml, impl-drawers-commons.md M5b):
// the JSON transitions the client calls under the Comms app root, as john.doe, on the mail demo (data/BossMailDemoData.xml,
// MailDemoServices.load#MailDemo, loaded again here so this spec sees it as loaded whatever ran before). The rail data; each
// view over both stores (Unified, flagged, snoozed, scheduled, drafts, sent, archive, spam, outbox, the Internal account,
// comments, a folder, a label, a mailbox); the search line with its operators over both stores; the thread of the reading
// pane with its files, contacts, labels, invitation and unsubscribe; state changes by store, one at a time and in bulk with a
// target that fails; the view action; links to records, create from a message, the contact card, the palette's Messages
// group and MessageDetail. Another user (joe.developer) reaches none of john.doe's mail: threads, files, state changes and
// MessageDetail are "not found".
// Run: ./moq test mr-boss --spec Inbox
const comms = "component://mr-boss/screen/Comms.xml"
const MAIL = "org.moqui.impl.EmailClientServices"

function transition(name, parameters, method) {
    const str = ec.screen.makeTest().rootScreen(comms).render(`Inbox/Mail/${name}`, parameters || {}, method || null)
    let json = null
    try { json = JSON.parse(str.output) } catch (err) { json = null }
    const errors = (json && json.errors) || str.errorMessages.join(" | ")
    ec.message.clearErrors()
    return { status: str.status, errors: errors || "", json: json || {}, text: String(str.output || "").substring(0, 300) }
}
const get = (name, parameters) => transition(name, parameters, null)
const post = (name, parameters) => transition(name, parameters, "post")
function sys(run) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try { return run() } finally { if (!wasDisabled) ec.artifactExecution.enableAuthz() }
}
const one = (entityName, fields) => sys(() => ec.entity.find(entityName).condition(fields).one())
const keys = (answer) => (answer.json.threadList || []).map((row) => row.rowKey)
const subjects = (answer) => (answer.json.threadList || []).map((row) => row.subject)
const has = (answer, key) => keys(answer).includes(key)
const targets = (list) => JSON.stringify(list)

spec({
    setupSpec() {
        sys(() => call("ironstone.comms.MailDemoServices.load#MailDemo", {}))
        login("john.doe")
    },
    cleanupSpec() { login("john.doe") },
})

feature("the rail has the Internal account and the demo account with its folders, labels and counts, the mailboxes and the totals", {
    when() { return get("inboxData") },
    then({ status, errors, json }) {
        status == 200
        errors == ""
        json.accountList[0].isInternal
        json.accountList.some((account) => account.emailAccountId == "BOSS_DEMO_MAIL_ACCT")
        json.accountList.find((account) => account.emailAccountId == "BOSS_DEMO_MAIL_ACCT").folderList.map((folder) => folder.folderName).includes("Clients")
        json.accountList.find((account) => account.emailAccountId == "BOSS_DEMO_MAIL_ACCT").folderList[0].folderKindEnumId == "EfkInbox"
        json.accountList.find((account) => account.emailAccountId == "BOSS_DEMO_MAIL_ACCT").labelList.map((label) => label.labelName) == ["Customers", "Follow up", "Newsletters"]
        json.accountList.find((account) => account.emailAccountId == "BOSS_DEMO_MAIL_ACCT").unreadCount >= 4
        json.accountList.find((account) => account.emailAccountId == "BOSS_DEMO_MAIL_ACCT").warning == null
        json.accountList.find((account) => account.emailAccountId == "BOSS_DEMO_MAIL_ACCT").usedBytes > 0
        json.accountList.find((account) => account.emailAccountId == "BOSS_DEMO_MAIL_ACCT").storageText != null
        json.accountList.find((account) => account.isInternal).storageText == null
        json.mailboxList.map((box) => box.contactListId).includes("BOSS_DEMO_MBX_OFFICE")
        json.mailboxList.map((box) => box.contactListId).includes("BOSS_DEMO_MBX_LEAD")
        json.totals.draftCount >= 1
        json.totals.outboxCount >= 1
        json.totals.internalUnreadCount >= 2
        json.me.partyId == "EX_JOHN_DOE"
        json.me.addressList.includes("john.doe@moqui.org")
        ["right", "bottom", "off"].includes(json.prefs.readingPane)
        json.failedParts == []
    },
})

feature("each view lists what it should over both stores", {
    when() {
        return {
            unified: get("threads", {}), flagged: get("threads", { view: "flagged" }), snoozed: get("threads", { view: "snoozed" }),
            scheduled: get("threads", { view: "scheduled" }), drafts: get("threads", { view: "drafts" }), sent: get("threads", { view: "sent" }),
            archive: get("threads", { view: "archive" }), junk: get("threads", { view: "junk" }), outbox: get("threads", { view: "outbox" }),
            internal: get("threads", { view: "internal" }), internalSent: get("threads", { view: "internalSent" }), comments: get("threads", { view: "comments" }),
            folder: get("threads", { account: "BOSS_DEMO_MAIL_ACCT", folder: "BOSS_DEMO_MAIL_F_CLIENTS" }),
            label: get("threads", { account: "BOSS_DEMO_MAIL_ACCT", label: "BOSS_DEMO_MAIL_L_NEWS" }),
            office: get("threads", { mailbox: "BOSS_DEMO_MBX_OFFICE" }), leadership: get("threads", { mailbox: "BOSS_DEMO_MBX_LEAD" }),
            unread: get("threads", { unreadOnly: "true" }), page: get("threads", { pageSize: "3" }),
        }
    },
    then(v) {
        v.unified.status == 200
        v.unified.json.storeList == ["email", "internal"]
        has(v.unified, "email:BOSS_DEMO_MAIL_ACME1")
        has(v.unified, "email:BOSS_DEMO_MAIL_NEWS")
        has(v.unified, "email:BOSS_DEMO_MAIL_INVITE")
        has(v.unified, "internal:BOSS_DEMO_MAIL_IM1")
        has(v.unified, "internal:BOSS_DEMO_MAIL_POST1")
        !has(v.unified, "email:BOSS_DEMO_MAIL_DOMAIN")
        !has(v.unified, "email:BOSS_DEMO_MAIL_RECEIPT")
        !has(v.unified, "email:BOSS_DEMO_MAIL_SPAM")
        // newest first
        v.unified.json.threadList.every((row, index, list) => index == 0 || list[index - 1].sortDate >= row.sortDate)
        v.unified.json.threadList.find((row) => row.rowKey == "email:BOSS_DEMO_MAIL_ACME1").isUnread
        v.unified.json.threadList.find((row) => row.rowKey == "email:BOSS_DEMO_MAIL_ACME1").labelList.map((label) => label.labelName) == ["Customers"]
        has(v.flagged, "email:BOSS_DEMO_MAIL_CONTRACT")
        has(v.snoozed, "email:BOSS_DEMO_MAIL_DOMAIN")
        has(v.scheduled, "email:BOSS_DEMO_MAIL_SCHEDULED")
        has(v.drafts, "email:BOSS_DEMO_MAIL_DRAFT")
        has(v.sent, "email:BOSS_DEMO_MAIL_ACME1")
        has(v.sent, "internal:BOSS_DEMO_MAIL_IM1")
        has(v.archive, "email:BOSS_DEMO_MAIL_RECEIPT")
        has(v.junk, "email:BOSS_DEMO_MAIL_SPAM")
        v.junk.json.storeList == ["email"]
        has(v.outbox, "email:BOSS_DEMO_MAIL_SCHEDULED")
        v.internal.json.storeList == ["internal"]
        has(v.internal, "internal:BOSS_DEMO_MAIL_IM1")
        has(v.internal, "internal:BOSS_DEMO_MAIL_IM4")
        !has(v.internal, "email:BOSS_DEMO_MAIL_ACME1")
        has(v.internalSent, "internal:BOSS_DEMO_MAIL_IM1")
        has(v.comments, "internal:BOSS_DEMO_MAIL_NOTE")
        !has(v.comments, "internal:BOSS_DEMO_MAIL_IM1")
        keys(v.folder) == ["email:BOSS_DEMO_MAIL_CLIENT"]
        keys(v.label) == ["email:BOSS_DEMO_MAIL_NEWS"]
        // the demo's own threads (other specs may post in its mailboxes too)
        has(v.office, "internal:BOSS_DEMO_MAIL_POST1")
        !has(v.office, "internal:BOSS_DEMO_MAIL_POST3")
        v.office.json.threadList.find((row) => row.rowKey == "internal:BOSS_DEMO_MAIL_POST1").contactListName == "Office announcements"
        has(v.leadership, "internal:BOSS_DEMO_MAIL_POST3")
        !has(v.leadership, "internal:BOSS_DEMO_MAIL_POST1")
        v.unread.json.threadList.every((row) => row.isUnread)
        has(v.unread, "email:BOSS_DEMO_MAIL_LUNCH")
        !has(v.unread, "email:BOSS_DEMO_MAIL_CONTRACT")
        v.page.json.threadList.length == 3
        v.page.json.hasMore
        v.page.json.nextCursor != null
    },
})

feature("the search line's operators find mail and internal messages alike", {
    when() {
        const search = (q, extra) => get("threads", Object.assign({ q }, extra || {}))
        return {
            from: search("from:bob"), subject: search("subject:onboarding"), attachment: search("has:attachment"), label: search("label:newsletters"),
            unreadFromJoe: search("is:unread from:joe"), words: search("first shipment"), excluded: search("onboarding -guide"),
            inSent: search("in:sent quarterly"), internalOnly: search("guide", { view: "internal" }), inMailbox: search("parking", { mailbox: "BOSS_DEMO_MBX_OFFICE" }),
            bad: search("before:someday"),
        }
    },
    then(v) {
        v.from.status == 200
        has(v.from, "email:BOSS_DEMO_MAIL_ACME1")
        has(v.from, "email:BOSS_DEMO_MAIL_CLIENT")
        !has(v.from, "email:BOSS_DEMO_MAIL_NEWS")
        // Bob Developer's internal message matches from:bob too
        has(v.from, "internal:BOSS_DEMO_MAIL_IM4")
        has(v.subject, "internal:BOSS_DEMO_MAIL_IM1")
        !has(v.subject, "internal:BOSS_DEMO_MAIL_IM4")
        has(v.attachment, "email:BOSS_DEMO_MAIL_ACME1")
        has(v.attachment, "email:BOSS_DEMO_MAIL_INVITE")
        !has(v.attachment, "email:BOSS_DEMO_MAIL_NEWS")
        keys(v.label) == ["email:BOSS_DEMO_MAIL_NEWS"]
        keys(v.unreadFromJoe).includes("internal:BOSS_DEMO_MAIL_IM1")
        keys(v.unreadFromJoe).every((key) => key.startsWith("internal:"))
        has(v.words, "email:BOSS_DEMO_MAIL_ACME1")
        !has(v.words, "email:BOSS_DEMO_MAIL_NEWS")
        keys(v.excluded) == []
        v.inSent.json.termList == [{ operator: "in", value: "sent", negate: false }]
        has(v.inSent, "email:BOSS_DEMO_MAIL_ACME1")
        v.internalOnly.json.storeList == ["internal"]
        has(v.internalOnly, "internal:BOSS_DEMO_MAIL_IM1")
        has(v.inMailbox, "internal:BOSS_DEMO_MAIL_POST1")
        keys(v.inMailbox).every((key) => key.startsWith("internal:"))
        v.bad.status != 200
        v.bad.errors.includes("before:someday needs a date")
    },
})

feature("the reading pane has the thread with its files, contacts, labels, links, invitation and unsubscribe", {
    when() {
        return {
            acme: get("thread", { store: "email", threadId: "BOSS_DEMO_MAIL_ACME1" }), invite: get("thread", { store: "email", threadId: "BOSS_DEMO_MAIL_INVITE" }),
            news: get("thread", { store: "email", threadId: "BOSS_DEMO_MAIL_NEWS" }), internal: get("thread", { store: "internal", threadId: "BOSS_DEMO_MAIL_IM1" }),
            post: get("thread", { store: "internal", threadId: "BOSS_DEMO_MAIL_POST1" }),
        }
    },
    then({ acme, invite, news, internal, post }) {
        acme.status == 200
        // the demo's messages, oldest first (a spec's replies in the thread come after them)
        acme.json.thread.messageList.map((message) => message.emailMessageId).filter((id) => id.startsWith("BOSS_DEMO_")) == ["BOSS_DEMO_MAIL_ACME1", "BOSS_DEMO_MAIL_ACME2", "BOSS_DEMO_MAIL_ACME3"]
        acme.json.thread.messageList[0].from.partyId == "ORG_ACME_BA"
        acme.json.thread.messageList[0].from.name == "Bob Acme"
        acme.json.thread.messageList[1].from.isMe
        acme.json.thread.messageList[0].attachmentList.map((file) => file.name) == ["purchase-order-Q4.txt"]
        acme.json.thread.labelList.map((label) => label.labelName) == ["Customers"]
        // the owner may send from the demo account (it has no server, so a send there says so)
        acme.json.thread.canSend == true
        acme.json.thread.messageList.find((message) => message.emailMessageId == "BOSS_DEMO_MAIL_ACME3").isUnread
        invite.json.thread.messageList[0].invitation.summary == "Partner planning session"
        invite.json.thread.messageList[0].invitation.method == "REQUEST"
        invite.json.thread.messageList[0].invitation.myStatus == "needsAction"
        invite.json.thread.messageList[0].invitation.organizer.email == "carol@partner.example"
        news.json.thread.messageList[0].unsubscribeMethod == "mailto"
        news.json.thread.messageList[0].html.includes("https://images.ironstone.example/banner-calendars.png")
        internal.json.thread.messageList.length >= 3
        internal.json.thread.messageList[0].from.name == "Joe Developer"
        internal.json.thread.messageList[1].from.isMe
        internal.json.thread.canReply
        post.json.thread.contactListName == "Office announcements"
        post.json.thread.canModerate
        post.json.thread.messageList.length >= 2
    },
})

feature("state changes go to each message's store, one at a time and in bulk, and a target that fails does not stop the others", {
    when() {
        const archived = post("state", { targetsJson: targets([{ store: "email", threadId: "BOSS_DEMO_MAIL_LUNCH" }]), action: "archive" })
        const afterArchive = { inbox: has(get("threads", {}), "email:BOSS_DEMO_MAIL_LUNCH"), archive: has(get("threads", { view: "archive" }), "email:BOSS_DEMO_MAIL_LUNCH") }
        post("state", { targetsJson: targets([{ store: "email", threadId: "BOSS_DEMO_MAIL_LUNCH" }]), action: "unarchive" })
        const afterUndo = has(get("threads", {}), "email:BOSS_DEMO_MAIL_LUNCH")
        const flagged = post("state", { targetsJson: targets([{ store: "internal", threadId: "BOSS_DEMO_MAIL_IM4", lastCommEventId: "BOSS_DEMO_MAIL_IM4" }]), action: "flag" })
        const flaggedView = has(get("threads", { view: "flagged" }), "internal:BOSS_DEMO_MAIL_IM4")
        const until = String(Date.now() + 2 * 86400000)
        post("state", { targetsJson: targets([{ store: "internal", threadId: "BOSS_DEMO_MAIL_IM4" }]), action: "snooze", snoozedThruDate: until })
        const snoozed = { inbox: has(get("threads", {}), "internal:BOSS_DEMO_MAIL_IM4"), snoozed: has(get("threads", { view: "snoozed" }), "internal:BOSS_DEMO_MAIL_IM4") }
        post("state", { targetsJson: targets([{ store: "internal", threadId: "BOSS_DEMO_MAIL_IM4" }]), action: "unsnooze" })
        // bulk: read on mail and internal at once, with one that is not the user's
        const bulk = post("state", { targetsJson: targets([{ store: "email", threadId: "BOSS_DEMO_MAIL_ACME1" }, { store: "internal", threadId: "BOSS_DEMO_MAIL_IM1" },
            { store: "email", threadId: "BOSS_NO_SUCH_MAIL" }]), action: "read" })
        const read = { acme: one("moqui.basic.email.EmailMessage", { emailMessageId: "BOSS_DEMO_MAIL_ACME3" }).isRead,
            internal: one("mantle.party.communication.CommunicationEventParty", { communicationEventId: "BOSS_DEMO_MAIL_IM3", partyId: "EX_JOHN_DOE", roleTypeId: "MessageTo" }).readDate }
        post("state", { targetsJson: targets([{ store: "email", threadId: "BOSS_DEMO_MAIL_ACME1" }, { store: "internal", threadId: "BOSS_DEMO_MAIL_IM1" }]), action: "unread" })
        // labels and a move, mail only; an internal one says why not
        const labeled = post("state", { targetsJson: targets([{ store: "email", threadId: "BOSS_DEMO_MAIL_LUNCH" }]), action: "labels", addLabelIds: "BOSS_DEMO_MAIL_L_FOLLOWUP" })
        const labelView = has(get("threads", { account: "BOSS_DEMO_MAIL_ACCT", label: "BOSS_DEMO_MAIL_L_FOLLOWUP" }), "email:BOSS_DEMO_MAIL_LUNCH")
        post("state", { targetsJson: targets([{ store: "email", threadId: "BOSS_DEMO_MAIL_LUNCH" }]), action: "labels", removeLabelIds: "BOSS_DEMO_MAIL_L_FOLLOWUP" })
        const moved = post("state", { targetsJson: targets([{ store: "email", threadId: "BOSS_DEMO_MAIL_INVOICE" }]), action: "move", emailFolderId: "BOSS_DEMO_MAIL_F_RECEIPTS" })
        const inReceipts = has(get("threads", { account: "BOSS_DEMO_MAIL_ACCT", folder: "BOSS_DEMO_MAIL_F_RECEIPTS" }), "email:BOSS_DEMO_MAIL_INVOICE")
        post("state", { targetsJson: targets([{ store: "email", threadId: "BOSS_DEMO_MAIL_INVOICE" }]), action: "move", emailFolderId: "BOSS_DEMO_MAIL_F_INBOX" })
        const internalMove = post("state", { targetsJson: targets([{ store: "internal", threadId: "BOSS_DEMO_MAIL_IM4" }]), action: "move", emailFolderId: "BOSS_DEMO_MAIL_F_RECEIPTS" })
        const spam = post("state", { targetsJson: targets([{ store: "email", threadId: "BOSS_DEMO_MAIL_WELCOME" }]), action: "spam" })
        const inJunk = has(get("threads", { view: "junk" }), "email:BOSS_DEMO_MAIL_WELCOME")
        post("state", { targetsJson: targets([{ store: "email", threadId: "BOSS_DEMO_MAIL_WELCOME" }]), action: "notSpam" })
        return { archived, afterArchive, afterUndo, flagged, flaggedView, snoozed, bulk, read, labeled, labelView, moved, inReceipts, internalMove, spam, inJunk }
    },
    then(v) {
        v.archived.status == 200
        v.archived.json.updatedCount == 1
        v.afterArchive.inbox == false
        v.afterArchive.archive == true
        v.afterUndo == true
        v.flagged.json.updatedCount == 1
        v.flaggedView == true
        v.snoozed.inbox == false
        v.snoozed.snoozed == true
        v.bulk.json.updatedCount == 2
        v.bulk.json.failedList.length == 1
        v.bulk.json.failedList[0].key == "email:BOSS_NO_SUCH_MAIL"
        v.read.acme == "Y"
        v.read.internal != null
        v.labeled.json.updatedCount == 1
        v.labelView == true
        v.moved.json.updatedCount == 1
        v.inReceipts == true
        v.internalMove.json.updatedCount == 0
        v.internalMove.json.failedList[0].message.includes("no folders")
        v.spam.json.updatedCount == 1
        v.inJunk == true
    },
})

feature("a bulk action on every thread of a view", {
    when() {
        const out = post("viewAction", { account: "BOSS_DEMO_MAIL_ACCT", label: "BOSS_DEMO_MAIL_L_CLIENTS", action: "read" })
        const unread = get("threads", { account: "BOSS_DEMO_MAIL_ACCT", label: "BOSS_DEMO_MAIL_L_CLIENTS", unreadOnly: "true" })
        post("state", { targetsJson: targets([{ store: "email", threadId: "BOSS_DEMO_MAIL_ACME1" }]), action: "unread" })
        return { out, unread }
    },
    then({ out, unread }) {
        out.status == 200
        out.json.threadCount >= 1
        out.json.updatedCount == out.json.threadCount
        keys(unread) == []
    },
})

feature("a message is linked to a record and taken off it, a task starts from a message, and the contact card knows the sender", {
    when() {
        const linked = post("linkRecord", { emailMessageId: "BOSS_DEMO_MAIL_ACME3", recordEntityName: "mantle.request.Request", recordId: "BOSS_DEMO_REQUEST" })
        const thread = get("thread", { store: "email", threadId: "BOSS_DEMO_MAIL_ACME1" })
        const searched = post("searchRecords", { term: "BOSS_DEMO_REQUEST" })
        const unlinked = post("unlinkRecord", { emailMessageId: "BOSS_DEMO_MAIL_ACME3", recordEntityName: "mantle.request.Request", recordId: "BOSS_DEMO_REQUEST" })
        const after = get("thread", { store: "email", threadId: "BOSS_DEMO_MAIL_ACME1" })
        const created = post("createFrom", { kind: "task", emailMessageId: "BOSS_DEMO_MAIL_ACME3" })
        const internalCreated = post("createFrom", { kind: "request", communicationEventId: "BOSS_DEMO_MAIL_IM1" })
        const card = get("contactCard", { emailAddress: "bob.acme@test.com" })
        const stranger = get("contactCard", { emailAddress: "carol@partner.example", name: "Carol Partner" })
        return { linked, thread, searched, unlinked, after, created, internalCreated, card, stranger }
    },
    then({ linked, thread, searched, unlinked, after, created, internalCreated, card, stranger }) {
        linked.status == 200
        linked.json.communicationEventId != null
        linked.json.link.title == "Set up the shared team calendar"
        thread.json.thread.linkList.some((link) => link.recordId == "BOSS_DEMO_REQUEST")
        thread.json.thread.messageList.find((message) => message.emailMessageId == "BOSS_DEMO_MAIL_ACME3").linkList.length == 1
        Array.isArray(searched.json)
        searched.json.some((option) => option.value == "mantle.request.Request|BOSS_DEMO_REQUEST")
        unlinked.json.unlinked == true
        !after.json.thread.linkList.some((link) => link.recordId == "BOSS_DEMO_REQUEST")
        created.json.url.startsWith("/qapps/Commons/QuickCreate?kind=task")
        created.json.url.includes("recordEntity=mantle.party.communication.CommunicationEvent")
        created.json.url.includes("workEffortName=Quarterly%20order%20for%20the%20Ziziwork%20parts")
        internalCreated.json.url.includes("requestName=Can%20you%20review%20the%20onboarding%20guide%3F")
        internalCreated.json.url.includes("recordId=BOSS_DEMO_MAIL_IM1")
        card.json.card.partyId == "ORG_ACME_BA"
        card.json.card.name == "Bob Acme"
        card.json.card.url == "/qapps/Commons/Contacts/ContactDetail?partyId=ORG_ACME_BA"
        card.json.card.recentList.length >= 1
        stranger.json.card.partyId == null
        stranger.json.card.name == "Carol Partner"
    },
})

feature("the palette's Messages group finds threads and mailboxes, and MessageDetail shows a message with its source", {
    when() {
        const rows = sys(() => call("ironstone.comms.InboxServices.search#Messages", { text: "onboarding", limit: 5 })).rows
        const boxes = sys(() => call("ironstone.comms.InboxServices.search#Messages", { text: "Office", limit: 5 })).rows
        const detail = ec.screen.makeTest().rootScreen(comms).renderMode("qvt").withStaticData().render("Inbox/MessageDetail", { emailMessageId: "BOSS_DEMO_MAIL_ACME1", lastStandalone: "-2" }, null)
        const internal = ec.screen.makeTest().rootScreen(comms).renderMode("qvt").withStaticData().render("Inbox/MessageDetail", { communicationEventId: "BOSS_DEMO_MAIL_IM1", lastStandalone: "-2" }, null)
        ec.message.clearErrors()
        return { rows, boxes, detail: String(detail.output || ""), detailErrors: detail.errorMessages.join(" | "), internal: String(internal.output || "") }
    },
    then({ rows, boxes, detail, detailErrors, internal }) {
        rows.some((row) => row.title == "Can you review the onboarding guide?" && row.url.includes("thread=internal%3ABOSS_DEMO_MAIL_IM1"))
        boxes.some((row) => row.title == "Office announcements" && row.url == "/qapps/Comms/Inbox?mailbox=BOSS_DEMO_MBX_OFFICE")
        detailErrors == ""
        detail.includes("Quarterly order for the Ziziwork parts")
        detail.includes("purchase-order-Q4.txt")
        detail.includes("Headers and source")
        internal.includes("Can you review the onboarding guide?")
    },
})

feature("a message downloads as an .eml file, with its files", {
    requires: ["imap"],
    when() {
        // Download .eml: the framework's export of the message (org.moqui.impl.EmailClientServices.export#EmailMessage), with its files
        const download = (id) => {
            const str = ec.screen.makeTest().rootScreen(comms).render("Inbox/MessageDetail/downloadEml", { emailMessageId: id }, null)
            ec.message.clearErrors()
            return { status: str.status, errors: str.errorMessages.join(" | "), text: String(str.output || "") }
        }
        return { eml: download("BOSS_DEMO_MAIL_NEWS"), withFile: download("BOSS_DEMO_MAIL_ACME1") }
    },
    then({ eml, withFile }) {
        eml.status == 200
        eml.errors == ""
        eml.text.includes("Message-ID: <boss_demo_mail_news@demo.ironstone.example>")
        eml.text.includes("multipart/alternative")
        eml.text.includes("IronStone Weekly")
        withFile.errors == ""
        withFile.text.includes("Subject: Quarterly order for the Ziziwork parts")
        withFile.text.includes("purchase-order-Q4.txt")
    },
})

feature("another user reaches none of john.doe's mail: threads, files, state changes and MessageDetail are not found", {
    when() {
        login("joe.developer")
        try {
            const data = get("inboxData")
            const thread = get("thread", { store: "email", threadId: "BOSS_DEMO_MAIL_ACME1" })
            const attachment = get("attachment", { store: "email", id: "BOSS_DEMO_MAIL_ACME1_A1" })
            const state = post("state", { targetsJson: targets([{ store: "email", threadId: "BOSS_DEMO_MAIL_ACME1" }]), action: "trash" })
            const internalThread = get("thread", { store: "internal", threadId: "BOSS_DEMO_MAIL_IM4" })
            const notMine = get("thread", { store: "internal", threadId: "BOSS_DEMO_MAIL_POST3" })
            const detail = ec.screen.makeTest().rootScreen(comms).renderMode("qvt").withStaticData().render("Inbox/MessageDetail", { emailMessageId: "BOSS_DEMO_MAIL_ACME1", lastStandalone: "-2" }, null)
            ec.message.clearErrors()
            return { data, thread, attachment, state, internalThread, notMine, detail: String(detail.output || "") }
        } finally { login("john.doe") }
    },
    then(v) {
        !v.data.json.accountList.some((account) => account.emailAccountId == "BOSS_DEMO_MAIL_ACCT")
        v.thread.errors.includes("not found")
        v.attachment.errors.includes("not found")
        v.state.json.updatedCount == 0
        v.state.json.failedList[0].message.includes("not found")
        // Joe is a cc of Bob's message, so he reads it; a post of the private Leadership mailbox, where Joe only asked to join, he does not
        v.internalThread.status == 200
        v.notMine.errors.includes("not found")
        v.detail.includes("Message not found")
        !v.detail.includes("Quarterly order for the Ziziwork parts")
        one("moqui.basic.email.EmailMessage", { emailMessageId: "BOSS_DEMO_MAIL_ACME1" }).emailFolderId == "BOSS_DEMO_MAIL_F_INBOX"
    },
})

feature("an invitation from outside is answered: the event goes on the calendar with the answer, and the card says so", {
    when() {
        const answered = post("respondInvite", { emailMessageId: "BOSS_DEMO_MAIL_INVITE", response: "accept" })
        const thread = get("thread", { store: "email", threadId: "BOSS_DEMO_MAIL_INVITE" })
        const card = thread.json.thread.messageList[0].invitation
        const event = sys(() => ec.entity.find("mantle.work.effort.WorkEffort").condition("universalId", "boss-demo-partner-planning@partner.example").list()[0])
        const party = event ? sys(() => ec.entity.find("mantle.work.effort.WorkEffortParty").condition({ workEffortId: event.workEffortId, partyId: "EX_JOHN_DOE" }).list()[0]) : null
        const again = post("respondInvite", { emailMessageId: "BOSS_DEMO_MAIL_INVITE", response: "decline" })
        const status = event ? sys(() => ec.entity.find("mantle.work.effort.WorkEffortParty").condition({ workEffortId: event.workEffortId, partyId: "EX_JOHN_DOE" })
            .list()[0].statusId) : null
        const bad = post("respondInvite", { emailMessageId: "BOSS_DEMO_MAIL_LUNCH", response: "accept" })
        return { answered, card, event, party, again, status, bad }
    },
    then({ answered, card, event, party, again, status, bad }) {
        answered.status == 200
        answered.json.workEffortId != null
        answered.json.statusId == "WeptAssigned"
        event.workEffortName == "Partner planning session"
        event.location == "Partner office, 2nd floor"
        party.statusId == "WeptAssigned"
        card.myStatus == "accepted"
        card.workEffortId == answered.json.workEffortId
        again.json.workEffortId == answered.json.workEffortId
        status == "WeptDeclined"
        bad.errors.includes("This message has no invitation")
    },
})

feature("Save to Files copies a message's attachment into a drive folder and the message keeps its copy", {
    when() {
        const drives = sys(() => call("org.moqui.impl.FileServices.get#UserDrives", {}))
        const personal = drives.personalDriveId
        const folder = sys(() => call("org.moqui.impl.FileServices.create#Folder", { driveId: personal, name: "Saved from mail" })).newPath
        const saved = post("saveFiles", { store: "email", id: "BOSS_DEMO_MAIL_ACME1_A1", driveId: personal, path: folder })
        const info = sys(() => call("org.moqui.impl.FileServices.get#ResourceInfo", { driveId: personal, path: folder + "/purchase-order-Q4.txt" }))
        const still = one("moqui.basic.email.EmailMessageAttachment", { emailMessageAttachmentId: "BOSS_DEMO_MAIL_ACME1_A1" })
        const text = sys(() => ec.resource.getLocationReference(still.attachmentLocation).getText())
        const again = post("saveFiles", { store: "email", id: "BOSS_DEMO_MAIL_ACME1_A1", driveId: personal, path: folder })
        const none = post("saveFiles", { emailMessageId: "BOSS_DEMO_MAIL_ACME2", driveId: personal, path: folder })
        login("joe.developer")
        let refused
        try { refused = post("saveFiles", { store: "email", id: "BOSS_DEMO_MAIL_ACME1_A1", driveId: personal, path: folder }) }
        finally { login("john.doe") }
        return { saved, info, still, text, again, none, refused }
    },
    then({ saved, info, still, text, again, none, refused }) {
        saved.errors == ""
        saved.json.savedList[0].path == "Saved from mail/purchase-order-Q4.txt"
        saved.json.savedList[0].outcome == "created"
        info.resource.size > 0
        still.attachmentLocation.includes("dbresource://email/")
        text.includes("Purchase order Q4")
        again.json.savedList[0].outcome == "renamed"
        again.json.savedList[0].name.includes("(2)")
        none.errors.includes("no files")
        refused.errors.includes("not found")
    },
})
