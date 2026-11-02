// Mailboxes in the Comms Inbox (screen/Comms/Inbox/Mail.xml, mantle.marketing.ContactListServices, design-drawers-commons.md §12
// Mailboxes): the MailboxHeader, BrowseMailboxes, NewMailbox, MailboxSettings and MailboxMembers through the Inbox's JSON
// transitions, on the mail demo's Office announcements (public, members' Inboxes) and Leadership (private, Joe Developer
// asked to join). A private mailbox shows a pending requester its header only, until an owner accepts; a member who leaves
// stops getting its posts and joins a public one again at once; the delivery Mailbox only keeps posts out of the Inbox; an
// owner closes a thread and it takes no more replies in the mailbox, while Reply to sender still works; a request is
// declined; a new mailbox is made, changed and archived (out of the rail); another user browses only what may be seen.
// Run: ./moq test mr-boss --spec InboxMailboxes
const comms = "component://mr-boss/screen/Comms.xml"

function transition(path, parameters, method) {
    const str = ec.screen.makeTest().rootScreen(comms).render(`Inbox/${path}`, parameters || {}, method || null)
    let json = null
    try { json = JSON.parse(str.output) } catch (err) { json = null }
    const errors = (json && !Array.isArray(json) && json.errors) || str.errorMessages.join(" | ")
    ec.message.clearErrors()
    return { status: str.status, errors: errors || "", json: json || {} }
}
const get = (name, parameters) => transition("Mail/" + name, parameters, null)
const post = (name, parameters) => transition("Mail/" + name, parameters, "post")
const compose = (name, parameters, method) => transition("Compose/" + name, parameters, method)
const keys = (answer) => (answer.json.threadList || []).map((row) => row.rowKey)
function as(username, run) {
    login(username)
    try { return run() } finally { login("john.doe") }
}
function sys(run) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try { return run() } finally { if (!wasDisabled) ec.artifactExecution.enableAuthz() }
}
let newMailboxId

spec({
    setupSpec() {
        sys(() => call("ironstone.comms.MailDemoServices.load#MailDemo", {}))
        login("john.doe")
    },
    cleanupSpec() { login("john.doe") },
})

feature("the owner's header has the members, the pending request and what the owner may do", {
    when() { return { office: get("mailbox", { contactListId: "BOSS_DEMO_MBX_OFFICE" }), lead: get("mailbox", { contactListId: "BOSS_DEMO_MBX_LEAD" }) } },
    then({ office, lead }) {
        office.status == 200
        office.json.mailbox.contactListName == "Office announcements"
        office.json.mailbox.isPublic
        office.json.mailbox.isOwner
        office.json.mailbox.canModerate
        office.json.mailbox.memberCount == 3
        office.json.mailbox.memberList[0].roleTypeId == "ListOwner"
        office.json.mailbox.deliveryEnumId == "CldInbox"
        lead.json.mailbox.isPublic == false
        lead.json.mailbox.pendingList.map((member) => member.partyId) == ["ORG_ZIZI_JD"]
    },
})

feature("a pending requester sees a private mailbox's header only, until an owner accepts; then its posts", {
    when() {
        // (the post's thread is not found to him: test/Comms/Inbox.spec.js)
        const before = as("joe.developer", () => ({ header: get("mailbox", { contactListId: "BOSS_DEMO_MBX_LEAD" }), threads: get("threads", { mailbox: "BOSS_DEMO_MBX_LEAD" }) }))
        const accepted = post("mailboxAddMember", { contactListId: "BOSS_DEMO_MBX_LEAD", partyId: "ORG_ZIZI_JD" })
        const after = as("joe.developer", () => ({ header: get("mailbox", { contactListId: "BOSS_DEMO_MBX_LEAD" }), threads: get("threads", { mailbox: "BOSS_DEMO_MBX_LEAD" }) }))
        // and a stranger does not see it at all
        const stranger = as("bob.developer", () => ({ header: get("mailbox", { contactListId: "BOSS_DEMO_MBX_LEAD" }) }))
        return { before, accepted, after, stranger }
    },
    then({ before, accepted, after, stranger }) {
        before.header.json.mailbox.membershipStatusId == "CLPT_PENDING"
        before.header.json.mailbox.canReadOwn == false
        before.header.json.mailbox.memberList == []
        keys(before.threads) == []
        accepted.status == 200
        accepted.json.statusId == "CLPT_ACCEPTED"
        after.header.json.mailbox.isMember
        keys(after.threads) == ["internal:BOSS_DEMO_MAIL_POST3"]
        stranger.header.errors.includes("not found")
    },
})

feature("a member leaves and stops getting posts, joins a public mailbox again at once, and Mailbox only keeps posts out of the Inbox", {
    when() {
        const left = as("bob.developer", () => post("mailboxLeave", { contactListId: "BOSS_DEMO_MBX_OFFICE" }))
        const notMember = get("mailbox", { contactListId: "BOSS_DEMO_MBX_OFFICE" }).json.mailbox.memberCount
        const joined = as("bob.developer", () => post("mailboxJoin", { contactListId: "BOSS_DEMO_MBX_OFFICE" }))
        const delivery = post("mailboxDelivery", { contactListId: "BOSS_DEMO_MBX_OFFICE", deliveryEnumId: "CldMailboxOnly" })
        const unified = get("threads", {})
        const inMailbox = get("threads", { mailbox: "BOSS_DEMO_MBX_OFFICE" })
        post("mailboxDelivery", { contactListId: "BOSS_DEMO_MBX_OFFICE", deliveryEnumId: "CldInbox" })
        const back = get("threads", {})
        return { left, notMember, joined, delivery, unified, inMailbox, back }
    },
    then(v) {
        v.left.json.left == true
        v.notMember == 2
        v.joined.json.statusId == "CLPT_ACCEPTED"
        v.delivery.json.effectiveDeliveryEnumId == "CldMailboxOnly"
        !keys(v.unified).includes("internal:BOSS_DEMO_MAIL_POST1")
        keys(v.inMailbox).includes("internal:BOSS_DEMO_MAIL_POST1")
        keys(v.back).includes("internal:BOSS_DEMO_MAIL_POST1")
    },
})

feature("an owner closes a thread: no more replies in the mailbox, Reply to sender still works, and it opens again", {
    when() {
        const closed = post("state", { targetsJson: JSON.stringify([{ store: "internal", threadId: "BOSS_DEMO_MAIL_POST1" }]), action: "close" })
        const row = get("threads", { mailbox: "BOSS_DEMO_MBX_OFFICE" }).json.threadList.find((item) => item.rowKey == "internal:BOSS_DEMO_MAIL_POST1")
        const notOwner = as("joe.developer", () => post("state", { targetsJson: JSON.stringify([{ store: "internal", threadId: "BOSS_DEMO_MAIL_POST1" }]), action: "reopen" }))
        const send = as("joe.developer", () => compose("send", { fromValue: "internal", parentCommEventId: "BOSS_DEMO_MAIL_POST2",
            toJson: JSON.stringify([{ value: "list:BOSS_DEMO_MBX_OFFICE", label: "Office" }]), subject: "Re: x", body: "<p>x</p>" }, "post"))
        const toSender = as("joe.developer", () => compose("send", { fromValue: "internal", parentCommEventId: "BOSS_DEMO_MAIL_POST1", replyToSenderOnly: "true",
            toJson: JSON.stringify([{ value: "party:ORG_ZIZI_BD", label: "Bob" }]), subject: "Re: x", body: "<p>Thanks</p>" }, "post"))
        const reopened = post("state", { targetsJson: JSON.stringify([{ store: "internal", threadId: "BOSS_DEMO_MAIL_POST1" }]), action: "reopen" })
        const thread = get("thread", { store: "internal", threadId: "BOSS_DEMO_MAIL_POST1" })
        return { closed, row, notOwner, send, toSender, reopened, thread }
    },
    then(v) {
        v.closed.json.updatedCount == 1
        v.row.isClosed == true
        v.notOwner.json.updatedCount == 0
        v.notOwner.json.failedList[0].message.includes("Only an owner or moderator")
        v.send.errors.includes("closed")
        v.toSender.status == 200
        v.toSender.json.communicationEventIdList.length == 1
        v.reopened.json.updatedCount == 1
        v.thread.json.thread.isClosed == false
    },
})

feature("a request to join is declined, a new mailbox is made, changed, archived and leaves the rail, and browsing shows what may be seen", {
    when() {
        const asked = as("bob.developer", () => post("mailboxJoin", { contactListId: "BOSS_DEMO_MBX_LEAD" }))
        const declined = post("mailboxDecline", { contactListId: "BOSS_DEMO_MBX_LEAD", partyId: "ORG_ZIZI_BD" })
        const status = sys(() => ec.entity.find("mantle.marketing.contact.ContactListParty").condition({ contactListId: "BOSS_DEMO_MBX_LEAD", partyId: "ORG_ZIZI_BD" })
            .orderBy("-fromDate").list()[0].statusId)
        const created = post("mailboxCreate", { contactListName: "Ask IT", description: "Questions about laptops and accounts", isPublic: "Y", postingEnumId: "ClpAnyUser",
            defaultDeliveryEnumId: "CldMailboxOnly", memberPartyIds: "ORG_ZIZI_JD" })
        newMailboxId = created.json.contactListId
        const header = get("mailbox", { contactListId: newMailboxId })
        const renamed = post("mailboxUpdate", { contactListId: newMailboxId, contactListName: "Ask IT (help)" })
        const railBefore = get("inboxData").json.mailboxList.some((box) => box.contactListId == newMailboxId)
        post("mailboxUpdate", { contactListId: newMailboxId, archived: "true" })
        const railAfter = get("inboxData").json.mailboxList.some((box) => box.contactListId == newMailboxId)
        const notOwnerChange = as("joe.developer", () => post("mailboxUpdate", { contactListId: "BOSS_DEMO_MBX_OFFICE", contactListName: "Mine now" }))
        const browse = as("bob.developer", () => get("mailboxes", {}))
        return { asked, declined, status, created, header, renamed, railBefore, railAfter, notOwnerChange, browse }
    },
    then(v) {
        v.asked.json.statusId == "CLPT_PENDING"
        v.declined.status == 200
        v.status == "CLPT_REJECTED"
        v.created.status == 200
        newMailboxId != null
        v.header.json.mailbox.postingEnumId == "ClpAnyUser"
        v.header.json.mailbox.memberCount == 2
        v.renamed.status == 200
        v.railBefore == true
        v.railAfter == false
        v.notOwnerChange.errors.includes("Only an owner")
        v.browse.json.contactListList.some((list) => list.contactListId == "BOSS_DEMO_MBX_OFFICE")
        !v.browse.json.contactListList.some((list) => list.contactListId == "BOSS_DEMO_MBX_LEAD")
    },
})
