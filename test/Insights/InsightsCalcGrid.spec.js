// CalcGrid under Insights (screen/Insights.xml, mounted by location; mr-moqui docs/tools/Database.md, CalcGrid and access
// profiles): a Sales administrator who is an Insights user holds the sales profile (data/BossSetupData.xml), authors, and reads
// the orders of the organization they work in on a data sheet; an Insights reader who holds no profile is offered none and
// reads nothing; and the Tools app's own access is not offered under the mount. The profile's own rules (the entities offered,
// another organization's rows, an entity no filter applies to) are Mantle's spec's, mr-mantle test/order/CalcGridSales.spec.js.
// Run: ./moq test mr-boss --spec InsightsCalcGrid
const {ids, users, system, transition} = ec.resource.script("component://mr-boss/test/Insights/InsightsSpecLib.js")
const ROOT = "component://mr-boss/screen/Insights.xml"
const ORDERS = "mantle.order.OrderHeaderAndPart"
const json = (answer) => { try { return JSON.parse(answer.output) } catch (e) { return {} } }
const ask = (user, name, parameters, method) => {
    const answer = transition(user, ROOT, "CalcGrid/" + name, parameters || {}, method === undefined ? null : method)
    return {status: answer.status, json: json(answer)}
}

spec({
    setupSpec() {
        login("john.doe")
        // the author of the demo is made a Sales administrator for the spec, and one order is sold by each organization
        system(() => {
            const author = ec.entity.find("moqui.security.UserAccount").condition("username", users.author).one()
            ec.entity.makeValue("moqui.security.UserGroupMember").setAll({userGroupId: "BOSS_SALES_ADMIN", userId: author.userId, fromDate: ec.user.nowTimestamp}).createOrUpdate()
            for (const [orderId, vendorPartyId] of [["INSCG-O1", ids.organizationId], ["INSCG-O2", ids.otherOrganizationId]]) {
                ec.entity.makeValue("mantle.order.OrderHeader").setAll({orderId, orderName: "CalcGrid " + vendorPartyId, statusId: "OrderPlaced", currencyUomId: "USD"}).createOrUpdate()
                ec.entity.makeValue("mantle.order.OrderPart").setAll({orderId, orderPartSeqId: "01", vendorPartyId, statusId: "OrderPlaced"}).createOrUpdate()
            }
        })
    },
    cleanupSpec() {
        system(() => {
            const author = ec.entity.find("moqui.security.UserAccount").condition("username", users.author).one()
            ec.entity.find("moqui.security.UserGroupMember").condition("userGroupId", "BOSS_SALES_ADMIN").condition("userId", author.userId).deleteAll()
            for (const orderId of ["INSCG-O1", "INSCG-O2"]) {
                ec.entity.find("mantle.order.OrderPart").condition("orderId", orderId).deleteAll()
                ec.entity.find("mantle.order.OrderHeader").condition("orderId", orderId).deleteAll()
            }
        })
    }
})

feature("a Sales administrator holds the sales profile under Insights and reads their own organization's orders; a reader with no profile reads nothing", {
    when() {
        const access = ask(users.author, "calcAccess")
        const offered = Array.from(ask(users.author, "calcEntities", {profileId: "sales", term: "mantle.order"}).json.entityNames || [])
        const opened = ask(users.author, "calcOpen", {profileId: "sales", entityName: ORDERS, conditionsJson: JSON.stringify({orderId: "INSCG-O", orderId_op: "begins"})}, "post")
        const cells = ask(users.author, "calcCells", {profileId: "sales", roomId: opened.json.roomId, sheet: 0, row: 1, column: 1, width: 40, height: 20})
        const texts = Array.from(cells.json.texts || []).map((text) => String(text.text))
        ask(users.author, "calcClose", {roomId: opened.json.roomId}, "post")
        // the Tools app's own access (no profile) is not this user's, and not offered under a mount
        const noProfile = ask(users.author, "calcOpen", {entityName: ORDERS}, "post")
        const reader = ask(users.reader, "calcAccess")
        const readerOpen = ask(users.reader, "calcOpen", {profileId: "sales", entityName: ORDERS}, "post")
        const system = ask(users.system, "calcAccess")
        return {access, profileIds: Array.from(access.json.profiles || []).map((profile) => profile.profileId), offered, opened, texts, noProfile, reader,
            readerProfiles: Array.from(reader.json.profiles || []).length, readerOpen, system}
    },
    then({access, profileIds, offered, opened, texts, noProfile, reader, readerProfiles, readerOpen, system}) {
        access.status == 200
        profileIds.join(",") == "sales"
        access.json.tools === false
        access.json.canAuthor === true
        offered.includes(ORDERS)
        !opened.json.errors
        opened.json.sheets[0].dataRows == 1
        texts.includes("INSCG-O1")
        !texts.includes("INSCG-O2")
        !!noProfile.json.errors
        !noProfile.json.roomId
        reader.status == 200
        readerProfiles == 0
        reader.json.canAuthor === false
        String(readerOpen.json.errors).includes("Not available")
        !readerOpen.json.roomId
        // an instance administrator has the Tools app, which a mount does not offer
        system.json.tools === false
    },
})
