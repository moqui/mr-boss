// CalcGrid under Insights (screen/Insights.xml, mounted by location; mr-moqui docs/tools/Database.md, CalcGrid and access
// profiles): a Sales administrator who is an Insights user holds the sales profile (data/BossSetupData01GroupsAndLaunchers.xml), authors, and reads
// the orders of the organization they work in on a data sheet; an Insights reader who holds no profile is offered none and
// reads nothing; and the Tools app's own access is not offered under the mount. The profile's own rules (the entities offered,
// another organization's rows, an entity no filter applies to) are Mantle's spec's, mr-mantle test/order/CalcGridSales.spec.js.
// A saved document's range is read as a panel over the framework's dataset calcgrid (data/BossSetupData09DatasetAccess.xml),
// and a saved document is scheduled on Insights' schedules screen.
// Run: ./moq test mr-boss --spec InsightsCalcGrid
const {ids, users, asUser, system, transition} = ec.resource.script("component://mr-boss/test/Insights/InsightsSpecLib.js")
const ROOT = "component://mr-boss/screen/Insights.xml"
const ORDERS = "mantle.order.OrderHeaderAndPart"
// the Insights users made sales users for the spec
const SALES_MEMBERS = [["BOSS_SALES_ADMIN", users.author], ["BOSS_SALES_MANAGER", users.distributor], ["BOSS_SALES_READ", users.flow]]
// a panel's query over the dataset calcgrid as the user: the frame's fields by name, and the refusal
const panel = (user, parameters) => asUser(user, () => {
    let out = {}
    let errors = ""
    try {
        out = ec.service.sync().name("org.moqui.report.ReportServices.run#Query").parameters({query: {datasetId: "calcgrid", parameters}}).call() || {}
    } catch (error) {
        errors = String(error.message || error)
    }
    if (ec.message.hasError()) errors += ec.message.getErrorsString()
    const fields = Array.from((Array.from(out.frames || [])[0] || {}).fields || [])
    return {errors, names: fields.map((field) => field.name), values: fields.map((field) => Array.from(field.values || []))}
})
const json = (answer) => { try { return JSON.parse(answer.output) } catch (e) { return {} } }
const ask = (user, name, parameters, method) => {
    const answer = transition(user, ROOT, "CalcGrid/" + name, parameters || {}, method === undefined ? null : method)
    return {status: answer.status, json: json(answer)}
}
// a saved document of the author's over the spec's orders, with a Summary sheet counting them: its id
function saveOrders(title) {
    const opened = ask(users.author, "calcOpen", {profileId: "sales", entityName: ORDERS, conditionsJson: JSON.stringify({orderId: "INSCG-O", orderId_op: "begins"})}, "post")
    ask(users.author, "calcEdit", {profileId: "sales", roomId: opened.json.roomId, opsJson: JSON.stringify([{op: "addSheet"},
        {op: "renameSheet", sheet: 1, name: "Summary"}, {op: "input", sheet: 1, row: 1, column: 1, value: "Label"},
        {op: "input", sheet: 1, row: 1, column: 2, value: "Orders"}, {op: "input", sheet: 1, row: 2, column: 1, value: "Placed"},
        {op: "input", sheet: 1, row: 2, column: 2, value: "=COUNTA(OrderHeaderAndPart[orderId])"}])}, "post")
    const saved = ask(users.author, "calcSave", {profileId: "sales", roomId: opened.json.roomId, title}, "post")
    ask(users.author, "calcClose", {roomId: saved.json.roomId || opened.json.roomId}, "post")
    if (saved.json.definitionId) made.push(String(saved.json.definitionId))
    return {definitionId: saved.json.definitionId, errors: saved.json.errors}
}
// the documents a feature saved, removed in its cleanup with any schedule of them, whatever happened before
const made = []
function removeMade() {
    for (const definitionId of made.splice(0)) {
        system(() => {
            for (const schedule of ec.entity.find("moqui.screen.ScreenScheduled").condition("reportDefinitionId", definitionId).useCache(false).list()) {
                const key = {screenScheduledId: schedule.screenScheduledId}
                for (const occurrence of ec.entity.find("moqui.report.ReportOccurrence").condition(key).list())
                    ec.entity.find("moqui.report.ReportRecipientDelivery").condition("occurrenceId", occurrence.occurrenceId).deleteAll()
                for (const entity of ["moqui.report.ReportOccurrence", "moqui.report.ReportScheduleRecipient", "moqui.screen.ScreenScheduledLock", "moqui.screen.ScreenScheduled"])
                    ec.entity.find(entity).condition(key).deleteAll()
            }
        })
        // the engine holds a definition's deletion to its owner
        ask(users.author, "calcDelete", {definitionId}, "post")
    }
}
// the report template's mail server for the spec (captured, never connected), and what it was
const MAIL = {serverId: "INS_CG_MAIL", templateId: "BOSS_INSIGHTS_REPORT"}
const capture = ec.factory.getTool("MailCapture")

spec({
    setupSpec() {
        login("john.doe")
        // the author of the demo is made a Sales administrator for the spec, the distributor a sales manager and the flow
        // editor a sales reader, and one order is sold by each organization
        system(() => {
            for (const [userGroupId, username] of SALES_MEMBERS) {
                const user = ec.entity.find("moqui.security.UserAccount").condition("username", username).one()
                ec.entity.makeValue("moqui.security.UserGroupMember").setAll({userGroupId, userId: user.userId, fromDate: ec.user.nowTimestamp}).createOrUpdate()
            }
            for (const [orderId, vendorPartyId] of [["INSCG-O1", ids.organizationId], ["INSCG-O2", ids.otherOrganizationId]]) {
                ec.entity.makeValue("mantle.order.OrderHeader").setAll({orderId, orderName: "CalcGrid " + vendorPartyId, statusId: "OrderPlaced", currencyUomId: "USD"}).createOrUpdate()
                ec.entity.makeValue("mantle.order.OrderPart").setAll({orderId, orderPartSeqId: "01", vendorPartyId, statusId: "OrderPlaced"}).createOrUpdate()
            }
            ec.entity.makeValue("moqui.basic.email.EmailServer").setAll({emailServerId: MAIL.serverId, smtpHost: "127.0.0.1", smtpPort: 25}).createOrUpdate()
            const template = ec.entity.find("moqui.basic.email.EmailTemplate").condition("emailTemplateId", MAIL.templateId).useCache(false).one()
            MAIL.wasServerId = template.emailServerId
            MAIL.wasFrom = template.fromAddress
            template.setAll({emailServerId: MAIL.serverId, fromAddress: "insights@ziziwork.example"}).update()
        })
        capture.enable()
    },
    cleanupSpec() {
        capture.reset()
        // the users' memberships and the orders first, so a failed restore of the template leaves no sales member
        system(() => {
            for (const [userGroupId, username] of SALES_MEMBERS) {
                const user = ec.entity.find("moqui.security.UserAccount").condition("username", username).one()
                if (user) ec.entity.find("moqui.security.UserGroupMember").condition("userGroupId", userGroupId).condition("userId", user.userId).deleteAll()
            }
            for (const orderId of ["INSCG-O1", "INSCG-O2"]) {
                ec.entity.find("mantle.order.OrderPart").condition("orderId", orderId).deleteAll()
                ec.entity.find("mantle.order.OrderHeader").condition("orderId", orderId).deleteAll()
            }
        })
        system(() => {
            // only when setupSpec read what the template had: else it is as the data left it
            if ("wasServerId" in MAIL) {
                ec.entity.find("moqui.basic.email.EmailTemplate").condition("emailTemplateId", MAIL.templateId).useCache(false).one()
                    .setAll({emailServerId: MAIL.wasServerId, fromAddress: MAIL.wasFrom}).update()
            }
            ec.entity.find("moqui.basic.email.EmailServer").condition("emailServerId", MAIL.serverId).deleteAll()
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

feature("a Sales administrator reads a saved document's range as a panel over the dataset calcgrid, past the report engine's deny, and schedules it; a reader with no profile reads none", {
    when() {
        const saved = saveOrders("Insights CalcGrid orders")
        const definitionId = saved.definitionId
        // the saved document opens again and is read: each call asks again whether its reader may still read it
        const again = ask(users.author, "calcOpen", {profileId: "sales", definitionId}, "post")
        const againCells = ask(users.author, "calcCells", {profileId: "sales", roomId: again.json.roomId, sheet: 1, row: 1, column: 1, width: 2, height: 2})
        ask(users.author, "calcClose", {roomId: again.json.roomId}, "post")
        // the author is in the Insights root group, which BOSS_INS_REPORT_ENGINE denies every ReportServices operation; the
        // dataset's artifact and get#CalcFrame are not among them, and run#Query is the readers' ALWAYS
        const author = panel(users.author, {definitionId, range: "Summary!A1:B2", profileId: "sales"})
        // every Insights group holds the dataset, and get#CalcFrame decides: a reader with no profile is refused the access,
        // and a sales reader who holds the profile the document, which is not shared with them
        const reader = panel(users.reader, {definitionId, range: "Summary!A1:B2"})
        const salesReader = panel(users.flow, {definitionId, range: "Summary!A1:B2", profileId: "sales"})
        // a saved document is scheduled on Insights' Scheduled reports (the mount's schedules link), which preselects it: a
        // link from the request's root, asked here through webroot's apps as the browser does
        const access = {json: json(transition(users.author, "component://webroot/screen/webroot.xml", "apps/Insights/CalcGrid/calcAccess", {}, null))}
        return {saved, againCells, author, reader, salesReader, access}
    },
    then({saved, againCells, author, reader, salesReader, access}) {
        !saved.errors
        !!saved.definitionId
        !againCells.json.errors
        Array.from(againCells.json.texts || []).map((text) => String(text.text)).includes("Placed")
        author.errors == ""
        author.names.join(",") == "Label,Orders"
        author.values[0].join(",") == "Placed"
        // the author's own organization's order alone
        Number(String(author.values[1][0])) == 1
        // refused by get#CalcFrame itself, not by the dataset's grant
        reader.errors.includes("Not available")
        !reader.errors.includes("not authorized")
        reader.values.length == 0
        salesReader.errors.includes("may not read")
        !salesReader.errors.includes("not authorized")
        salesReader.values.length == 0
        access.json.canSchedule === true
        access.json.schedulesPath == "/apps/Insights/ScheduledReports/Schedules"
    },
    cleanup() {
        removeMade()
    },
})

// The panel editor offers the dataset calcgrid's parameters with their choices, each read by the viewer's own grant of its
// service (mr-moqui plans/IronCalc-DB2.md CG4.1): the documents through list#Definitions (BOSS_INS_REPORT_READ) and the
// access profiles the viewer holds through get#CalcProfiles (BOSS_INS_CALC_DATASET), so neither falls back to a text field.
feature("a Sales administrator's dataset listing under Insights offers calcgrid's documents and the sales profile as choices", {
    when() {
        const saved = saveOrders("Insights CalcGrid choices")
        const listed = asUser(users.author, () => Array.from(ec.service.sync().name("org.moqui.report.ReportServices.list#Datasets")
            .parameters({parameterChoices: true}).call().datasets || []))
        ec.message.clearErrors()
        const calcgrid = listed.find((dataset) => dataset.id == "calcgrid") || {}
        const choices = (name) => Array.from((Array.from(calcgrid.parameters || []).find((parameter) => parameter.name == name) || {}).choices || [])
        return {saved, profiles: choices("profileId").map((choice) => choice.value), documents: choices("definitionId").map((choice) => choice.value)}
    },
    then({saved, profiles, documents}) {
        !saved.errors
        profiles.join(",") == "sales"
        documents.includes(saved.definitionId)
    },
    cleanup() {
        removeMade()
    },
})

feature("a sales manager and a sales reader who are Insights users hold the sales profile to read, and do not author", {
    when() {
        const manager = ask(users.distributor, "calcAccess")
        const reader = ask(users.flow, "calcAccess")
        const managerNew = ask(users.distributor, "calcOpen", {profileId: "sales", entityName: ORDERS}, "post")
        return {manager, reader, managerNew,
            profiles: [manager, reader].map((access) => Array.from(access.json.profiles || []).map((profile) => profile.profileId).join(","))}
    },
    then({manager, reader, managerNew, profiles}) {
        profiles.join(";") == "sales;sales"
        manager.json.canAuthor === false
        reader.json.canAuthor === false
        String(managerNew.json.errors).includes("Not available")
        !managerNew.json.roomId
    },
})

feature("a saved document an Insights author schedules for themselves is run and sent as its workbook, with their own organization's rows alone", {
    when() {
        const saved = saveOrders("Insights CalcGrid scheduled")
        const definitionId = saved.definitionId
        // the schedule through Insights' route, as CalcGrid's Schedule opens it; the run renders in a context of its own,
        // signed in as the owner, outside any Insights screen
        const created = transition(users.author, ROOT, "ScheduledReports/Schedules/createSchedule",
            {newDefinitionId: definitionId, cronSelected: "0 0 6 ? * MON", renderMode: "xlsx", audienceKind: "personal"})
        const screenScheduledId = (/screenScheduledId=([^&]+)/.exec(created.location) || [])[1] || ""
        capture.clear()
        const sent = transition(users.author, ROOT, "ScheduledReports/ScheduledReportDetail/sendNow", {screenScheduledId})
        const messages = Array.from(capture.getMessages())
        const authorId = system(() => ec.entity.find("moqui.security.UserAccount").condition("username", users.author).one().userId)
        const delivery = system(() => {
            const occurrence = ec.entity.find("moqui.report.ReportOccurrence").condition("screenScheduledId", screenScheduledId).useCache(false).one()
            const row = occurrence ? ec.entity.find("moqui.report.ReportRecipientDelivery").condition({occurrenceId: occurrence.occurrenceId, userId: authorId})
                .useCache(false).one() : null
            return {occurrence: occurrence ? occurrence.getMap() : null, deliveryId: row ? row.deliveryId : null, status: row ? row.statusId : null}
        })
        // the author's own report again, rendered as themselves in a context of its own: the workbook, read back
        const report = asUser(users.author, () => ec.service.sync().name("org.moqui.report.ReportServices.get#RecipientReport")
            .parameters({deliveryId: delivery.deliveryId}).call() || {})
        const bytes = report.contentBase64 ? StringUtilities.base64Decode(String(report.contentBase64)) : null
        const sheet = bytes ? system(() => ec.service.sync().name("org.moqui.resource.SpreadsheetServices.read#Spreadsheet")
            .parameters({contentBytes: bytes, sheetName: "OrderHeaderAndPart"}).call() || {}) : {}
        const orderIds = Array.from(sheet.rowList || []).map((row) => String(row.orderId))
        return {saved, created, screenScheduledId, sent, messages, delivery, report, orderIds}
    },
    then({saved, created, screenScheduledId, sent, messages, delivery, report, orderIds}) {
        !saved.errors
        created.errors == ""
        screenScheduledId != ""
        sent.errors == ""
        // the author was sent the workbook
        messages.length == 1
        Array.from(messages[0].attachmentNames || []).some((name) => String(name).endsWith(".xlsx"))
        !!delivery.deliveryId
        report.available === true
        report.contentType == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        orderIds.join(",") == "INSCG-O1"
    },
    // the schedule (its runs, recipients and lock) and the document, whatever happened: a schedule left behind would send
    // real mail once the template's server is put back
    cleanup() {
        removeMade()
    },
})
