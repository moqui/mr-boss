// The Purchasing shell (impl-purchasing P1): the menu and providers per group from the area authorizations, the launcher,
// and Home's one render (qvt) with its checks. Later phases add their quick creates, Today sources and notification topics to
// the menu feature's rows. Access rules are PurchasingAccess's.
// Run: ./moq test mr-boss --spec PurchasingShell
const lib = ec.resource.script("component://mr-boss/test/Purchasing/PurchasingSpecLib.js")
const {ids, users, asUser, shell} = lib
// the menu of design §1; Home and Requests open to every Purchasing user, the others by group (BOSS_PUR_<Area>)
const order = [
    "Home",
    "Suppliers",
    "Requests",
    "Sourcing",
    "Orders",
    "Approvals",
    "Agreements",
    "Replenishment",
    "Receiving",
    "Returns",
    "Bills",
    "Performance",
    "Settings"
]
const lists = ["Suppliers", "Sourcing", "Orders", "Agreements", "Receiving", "Returns", "Bills", "Performance"]
const menuOf = extra => order.filter(name => ["Home", "Requests"].includes(name) || extra.includes(name))

// no area of P1 creates a record, so quick create offers nothing yet: P3 adds the purchase order, P10 the request, P11 the RFQ
feature("the Purchasing menu and providers follow each group's areas", {
    when() {
        const rows = [
            {user: users.requester, extra: []},
            {user: users.read, extra: lists.concat(["Replenishment"])},
            {user: users.buyer, extra: lists.concat(["Replenishment"])},
            {user: users.planner, extra: lists.concat(["Replenishment"])},
            {user: users.approve, extra: lists.concat(["Approvals"])},
            {user: users.admin, extra: order}
        ]
        const problems = []
        for (const {user, extra} of rows) {
            const found = shell(user)
            const quickKinds = (found.providers?.quickCreate || []).map(item => item.kind)
            if (found.status != 200) problems.push(`${user}'s menu: ${found.status}`)
            if (JSON.stringify(found.names) !== JSON.stringify(menuOf(extra)))
                problems.push(`${user}'s menu is ${found.names}, not ${menuOf(extra)}`)
            if (quickKinds.length) problems.push(`${user} is offered quick create ${quickKinds}`)
            if (!(found.providers?.paletteSources || []).some(source => source.group === "Purchasing"))
                problems.push(`${user} has no Purchasing palette source`)
            if (!(found.providers?.keymaps || []).some(keymap => keymap.scope === "purchasing"))
                problems.push(`${user} has no purchasing key scope`)
        }
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature("the Purchasing reader has Purchasing and no other business launcher; Manufacturing's buyer has no Purchasing", {
    when() {
        return {reader: shell(users.read).apps, manufacturingBuyer: shell("manufacturing.buyer").apps}
    },
    then({reader, manufacturingBuyer}) {
        reader.includes("Purchasing")
        !reader.some(app => ["Products", "Accounting", "Manufacturing", "Warehouse", "Projects", "Sales"].includes(app))
        // Purchasing's buyer group alone, without the root user group, opens no Purchasing
        !manufacturingBuyer.includes("Purchasing")
    }
})

feature("Home shows the reader's counters as unavailable, no work yet, spend unavailable and the lookup of their order", {
    when() {
        return asUser(users.read, () => lib.page("Home", {lookupType: "order", lookupId: ids.orderId}))
    },
    then({status, errors, output}) {
        status == 200
        errors == []
        output.includes("Unacknowledged orders")
        output.includes("Unavailable")
        output.includes("Nothing is waiting for you.")
        output.includes("Committed and billed spend is unavailable.")
        output.includes("Purchase order " + ids.orderId)
        output.includes("Brightline restock")
        // the approver's card is not the reader's
        !output.includes("Approvals waiting")
    }
})
