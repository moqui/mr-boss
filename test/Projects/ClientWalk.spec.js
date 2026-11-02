// Client access, the client's walk (impl-projects.md P10b; design-projects.md §1.1, §3 Home for clients, §6 RequestDetail, §4
// MilestoneDetail's gate): with authorization on, a client contact (sheldon.acme of Acme on ACME) signs in, sees its project and its
// Home, raises a request with a file, writes to the team in Chatter and answers the team's message, approves a milestone gate and the
// project's estimate, and reads an invoice to Acme. Every write goes through ironstone.client.ClientServices; what it changes of the
// demo data is put back in cleanupSpec (the gate of ACME-MS-1, the estimate milestone, the request and the messages).
// Run: ./moq test mr-boss --spec ClientWalk
const webroot = "component://webroot/screen/webroot.xml"
const SHELDON = "sheldon.acme"
const made = { requestIds: [], eventIds: [] }

function render(path, parameters, mode, standalone) {
    const str = ec.screen.makeTest().rootScreen(webroot).renderMode(mode || "qvt").withStaticData().render("apps/Projects/" + path,
        Object.assign({ lastStandalone: standalone === false ? "-2" : "true" }, parameters || {}), null)
    const output = String(str.output || "")
    const errors = str.errorMessages.join(" | ")
    ec.message.clearErrors()
    return { status: str.status, errors, output, refused: str.status == 401 || str.status == 403 || /not authorized/i.test(errors + output) }
}
function hit(path, parameters, method) {
    const str = ec.screen.makeTest().rootScreen(webroot).render("apps/" + path, parameters || {}, method || null)
    const output = String(str.output || "")
    const errors = str.errorMessages.join(" | ")
    const messages = (str.messages || []).join(" | ")
    ec.message.clearErrors()
    let json = null
    try { json = JSON.parse(output) } catch (err) { json = null }
    return { status: str.status, errors, messages, output, json, refused: str.status == 401 || str.status == 403 || /not authorized/i.test(errors) }
}
function sys(run) {
    const wasDisabled = ec.artifactExecution.disableAuthz()
    try { return run() } finally { if (!wasDisabled) ec.artifactExecution.enableAuthz() }
}
function as(username, run) {
    login(username)
    const wasDisabled = ec.artifactExecution.authzDisabled()
    if (wasDisabled) ec.artifactExecution.enableAuthz()
    try { return run() } finally {
        if (wasDisabled) ec.artifactExecution.disableAuthz()
        login("john.doe")
    }
}
const one = (entityName, fields) => sys(() => { const row = ec.entity.find(entityName).condition(fields).one(); return row ? row.getMap() : null })
const rows = (entityName, fields) => sys(() => Array.from(ec.entity.find(entityName).condition(fields).list()).map((row) => row.getMap()))

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
        made.gate = one("mantle.work.effort.WorkEffortApproval", { workEffortApprovalId: "BOSS_DEMO_ACME_AP1" })
        made.milestoneStatus = one("mantle.work.effort.WorkEffort", { workEffortId: "ACME-MS-1" }).statusId
        made.estimateSetting = one("mantle.work.effort.WorkEffortSetting", { workEffortId: "ACME", settingTypeEnumId: "WstEstimateMilestone" })
        // an invoice to Acme on ACME, sent, to read (the test skips the invoice flow to its status)
        sys(() => {
            ec.service.sync().name("create#mantle.account.invoice.Invoice").parameters({ invoiceId: "CWALK_INV", invoiceTypeEnumId: "InvoiceSales",
                fromPartyId: "ORG_ZIZI_SERVICES", toPartyId: "ORG_ACME", statusId: "InvoiceInProcess", invoiceDate: "2026-10-12 00:00:00", currencyUomId: "USD",
                description: "Client walk invoice" }).call()
            ec.service.sync().name("create#mantle.account.invoice.InvoiceItem").parameters({ invoiceId: "CWALK_INV", invoiceItemSeqId: "01",
                itemTypeEnumId: "ItemTimeEntry", quantity: 4, amount: "123.45", description: "Portal sign-in work" }).call()
            ec.entity.find("mantle.account.invoice.Invoice").condition("invoiceId", "CWALK_INV").updateAll({ statusId: "InvoiceSent" })
            ec.service.sync().name("create#mantle.work.effort.WorkEffortInvoice").parameters({ workEffortId: "ACME", invoiceId: "CWALK_INV" }).call()
        })
        made.lastEventId = sys(() => Array.from(ec.entity.find("mantle.party.communication.CommunicationEvent").orderBy("-communicationEventId").limit(1).list())[0]?.communicationEventId)
    },
    cleanupSpec() {
        sys(() => {
            // the gate of ACME-MS-1 waits again, the milestone as it was
            ec.entity.find("mantle.work.effort.WorkEffortApproval").condition("workEffortApprovalId", "BOSS_DEMO_ACME_AP1").updateAll({ statusId: made.gate.statusId,
                decidedByUserId: made.gate.decidedByUserId || null, decidedDate: made.gate.decidedDate || null, decisionComments: made.gate.decisionComments || null,
                recordedFor: made.gate.recordedFor || null })
            ec.entity.find("mantle.work.effort.WorkEffort").condition("workEffortId", "ACME-MS-1").updateAll({ statusId: made.milestoneStatus, actualCompletionDate: null })
            // the estimate milestone and its rows
            if (made.estimateMilestoneId) {
                for (const entityName of ["mantle.work.effort.WorkEffortApproval", "mantle.work.effort.WorkEffortContent", "mantle.work.effort.WorkEffortSetting",
                        "mantle.work.effort.WorkEffortParty", "mantle.work.effort.WorkEffortAssoc", "mantle.work.effort.WorkEffortCommEvent"])
                    ec.entity.find(entityName).condition("workEffortId", made.estimateMilestoneId).deleteAll()
                ec.entity.find("mantle.work.effort.WorkEffort").condition("workEffortId", made.estimateMilestoneId).deleteAll()
            }
            ec.entity.find("mantle.work.effort.WorkEffortSetting").condition({ workEffortId: "ACME", settingTypeEnumId: "WstEstimateMilestone" }).deleteAll()
            if (made.estimateSetting) ec.entity.makeValue("mantle.work.effort.WorkEffortSetting").setAll(made.estimateSetting).create()
            ec.entity.find("mantle.work.effort.WorkEffortInvoice").condition("invoiceId", "CWALK_INV").deleteAll()
            ec.entity.find("mantle.account.invoice.Invoice").condition("invoiceId", "CWALK_INV").updateAll({ statusId: "InvoiceCancelled" })
            // the request and the messages the walk made
            for (const requestId of made.requestIds) {
                for (const entityName of ["mantle.request.RequestParty", "mantle.request.RequestContent", "mantle.request.RequestCommEvent", "mantle.request.RequestWorkEffort"])
                    ec.entity.find(entityName).condition("requestId", requestId).deleteAll()
                ec.entity.find("mantle.party.communication.CommunicationEventRecord").condition({ recordEntityName: "mantle.request.Request", recordId: requestId }).deleteAll()
                ec.entity.find("mantle.request.Request").condition("requestId", requestId).updateAll({ statusId: "ReqCancelled" })
            }
            for (const id of made.eventIds) {
                ec.entity.find("mantle.party.communication.CommunicationEventRecord").condition("communicationEventId", id).deleteAll()
                ec.entity.find("mantle.party.communication.CommunicationEventParty").condition("communicationEventId", id).deleteAll()
                ec.entity.find("mantle.work.effort.WorkEffortCommEvent").condition("communicationEventId", id).deleteAll()
                ec.entity.find("mantle.request.RequestCommEvent").condition("communicationEventId", id).deleteAll()
                ec.entity.find("mantle.party.communication.CommunicationEvent").condition("communicationEventId", id).updateAll({ statusId: "CeCancelled" })
            }
        })
    },
})

feature("the client signs in and sees its Home: its project, its open requests, the team's message and the gate it approves", {
    when() {
        return as(SHELDON, () => ({ home: render("Home"), json: hit("Projects/Home", { renderMode: "json" }).output }))
    },
    then({ home }) {
        home.refused == false
        home.output.includes("Your projects")
        home.output.includes("Acme customer portal")
        home.output.includes("Waiting for your approval")
        home.output.includes("Go live")
        home.output.includes("Open requests")
        home.output.includes("Recent replies")
        home.output.includes("Could you send us two test accounts")
        !home.output.includes("Bluth")
        !home.output.includes("My open work items")
    },
})

feature("the client opens its project: the overview without the team's members or the refused controls", {
    when() {
        return as(SHELDON, () => ({ detail: render("Projects/ProjectDetail", { workEffortId: "ACME" }, "tui", false), overview: render("Projects/ProjectDetail/Overview", { workEffortId: "ACME" }) }))
    },
    then({ detail, overview }) {
        detail.refused == false
        detail.output.includes("Acme customer portal")
        !detail.output.includes("Post update")
        !detail.output.includes("Clone")
        !detail.output.includes("Print status report")
        !detail.output.includes("Unfollow")
        overview.refused == false
        !overview.output.includes("Members ·")
        !overview.output.includes("Leave holidays")
    },
})

feature("the client raises a request in its project with a file, and adds another file", {
    when() {
        return as(SHELDON, () => {
            const raised = hit("Projects/Requests/List/raiseClientRequest", { newProjectId: "ACME", requestName: "ZQW walk: export the audit log",
                description: "We need the audit log as a spreadsheet each month.", contentFile: uploadedFile("audit-sample.csv", "date,who,what\n") }, "post")
            const request = one("mantle.request.Request", { requestName: "ZQW walk: export the audit log" })
            if (request) made.requestIds.push(request.requestId)
            const more = request ? hit("Projects/RecordFiles/upload", { recordEntity: "mantle.request.Request", recordId: request.requestId,
                contentFile: uploadedFile("screenshot.png", "not really a png") }, "post") : null
            const files = request ? hit("Projects/RecordFiles/filesData", { recordEntity: "mantle.request.Request", recordId: request.requestId }) : null
            const detail = request ? render("Requests/RequestDetail", { requestId: request.requestId }, "tui", false) : null
            return { raised, request, more, files, detail,
                parties: request ? rows("mantle.request.RequestParty", { requestId: request.requestId }).map((row) => row.partyId + ":" + row.roleTypeId) : [],
                contents: request ? rows("mantle.request.RequestContent", { requestId: request.requestId }).map((row) => String(row.contentLocation).split("/").pop()) : [] }
        })
    },
    then({ raised, request, more, files, detail, parties, contents }) {
        raised.refused == false
        request != null
        request.statusId == "ReqSubmitted"
        request.rootWorkEffortId == "ACME"
        request.filedByPartyId == "ORG_ACME_SA"
        parties.includes("ORG_ACME_SA:Reporter")
        parties.includes("ORG_ACME:Customer")
        contents.includes("audit-sample.csv")
        contents.includes("screenshot.png")
        files.json?.canUpload == true
        files.json?.fileList?.length >= 2
        files.json?.fileList?.every((file) => file.canRemove === false)
        files.json?.recordsDriveId == null
        detail.output.includes("ZQW walk: export the audit log")
        !detail.output.includes("Comment (a note")
    },
})

feature("the client writes to the team on its request and answers the team's message on a work item", {
    when() {
        return as(SHELDON, () => {
            const requestId = made.requestIds[0]
            const data = hit("Projects/Chatter/chatterData", { recordEntity: "mantle.request.Request", recordId: requestId })
            const sent = hit("Projects/Chatter/sendMessage", { recordEntity: "mantle.request.Request", recordId: requestId, subject: "",
                body: "<p>ZQW the monthly file is enough.</p>", recordUrl: "/qapps/Projects/Requests/RequestDetail?requestId=" + requestId }, "post")
            const replied = hit("Projects/Chatter/reply", { recordEntity: "mantle.work.effort.WorkEffort", recordId: "ACME-1", parentCommEventId: "BOSS_DEMO_ACME_MSG1",
                body: "<p>ZQW two test accounts are ready: test1 and test2.</p>" }, "post")
            const timeline = hit("Projects/Chatter/timeline", { recordEntity: "mantle.work.effort.WorkEffort", recordId: "ACME-1" })
            const itemData = hit("Projects/Chatter/chatterData", { recordEntity: "mantle.work.effort.WorkEffort", recordId: "ACME-1" })
            for (const out of [sent, replied]) if (out.json?.communicationEventId) made.eventIds.push(out.json.communicationEventId)
            return { data, sent, replied, timeline, itemData }
        })
    },
    then({ data, sent, replied, timeline, itemData }) {
        data.json?.forClient == true
        data.json?.canMessage == true
        sent.json?.communicationEventId != null
        replied.json?.communicationEventId != null
        one("mantle.party.communication.CommunicationEvent", { communicationEventId: sent.json.communicationEventId }).fromPartyId == "ORG_ACME_SA"
        one("mantle.party.communication.CommunicationEvent", { communicationEventId: sent.json.communicationEventId }).communicationEventTypeId == "Message"
        rows("mantle.party.communication.CommunicationEventParty", { communicationEventId: sent.json.communicationEventId }).map((row) => row.partyId).includes("EX_JOHN_DOE")
        rows("mantle.party.communication.CommunicationEventParty", { communicationEventId: sent.json.communicationEventId }).every((row) => !["ORG_ACME_SA", "ORG_ACME_BA", "ORG_BLUTH_GOB"].includes(row.partyId))
        rows("mantle.request.RequestCommEvent", { communicationEventId: sent.json.communicationEventId }).map((row) => row.requestId) == [made.requestIds[0]]
        one("mantle.party.communication.CommunicationEvent", { communicationEventId: replied.json.communicationEventId }).parentCommEventId == "BOSS_DEMO_ACME_MSG1"
        rows("mantle.party.communication.CommunicationEventParty", { communicationEventId: replied.json.communicationEventId }).map((row) => row.partyId).includes("EX_JOHN_DOE")
        timeline.output.includes("two test accounts are ready")
        timeline.json?.entryList?.every((entry) => entry.canUnlink !== true && entry.canEdit !== true && entry.threadUrl == null)
        timeline.json?.entryList?.some((entry) => entry.canReply === true)
        !(itemData.json?.followerList?.length > 0)
    },
})

feature("the client approves the gate of a milestone it is the approver of", {
    when() {
        return as(SHELDON, () => {
            const page = render("Projects/MilestoneDetail", { workEffortId: "ACME-MS-1" })
            const approved = hit("Projects/Projects/MilestoneDetail/decideGate", { workEffortId: "ACME-MS-1", action: "approve", comments: "Looks good" }, "post")
            return { page, approved }
        })
    },
    then({ page, approved }) {
        page.output.includes("Approve")
        page.output.includes("Refuse")
        !page.output.includes("Set the gate")
        !page.output.includes("Add deliverable")
        !page.output.includes("Ask for approval")
        approved.refused == false
        approved.errors == ""
        one("mantle.work.effort.WorkEffortApproval", { workEffortApprovalId: "BOSS_DEMO_ACME_AP1" }).statusId == "WeaApproved"
        one("mantle.work.effort.WorkEffortApproval", { workEffortApprovalId: "BOSS_DEMO_ACME_AP1" }).recordedFor == "N"
        one("mantle.work.effort.WorkEffortApproval", { workEffortApprovalId: "BOSS_DEMO_ACME_AP1" }).decidedByUserId == "ORG_ACME_SA"
        one("mantle.work.effort.WorkEffort", { workEffortId: "ACME-MS-1" }).statusId == "WeComplete"
    },
})

feature("the team sends the estimate and the client opens it and approves it", {
    when() {
        const sent = sys(() => ec.service.sync().name("mantle.work.ProjectServices.send#EstimateForApproval").parameters({ workEffortId: "ACME", depth: 2,
            comments: "ZQW the estimate for the portal" }).call() || {})
        ec.message.clearErrors()
        made.estimateMilestoneId = sent.milestoneId
        const client = as(SHELDON, () => {
            const page = render("Projects/MilestoneDetail", { workEffortId: sent.milestoneId })
            const file = hit("Projects/Projects/MilestoneDetail/estimateFile", { workEffortId: sent.milestoneId, workEffortContentId: sent.workEffortContentId })
            const approved = hit("Projects/Projects/MilestoneDetail/decideGate", { workEffortId: sent.milestoneId, action: "approve" }, "post")
            return { page, file, approved }
        })
        return Object.assign({ sent }, client)
    },
    then({ sent, page, file, approved }) {
        sent.milestoneId != null
        sent.workEffortApprovalId != null
        page.output.includes("This milestone is the project's Estimate")
        file.output.includes("Estimate") || file.status == 200
        approved.errors == ""
        one("mantle.work.effort.WorkEffortApproval", { workEffortApprovalId: sent.workEffortApprovalId }).statusId == "WeaApproved"
        one("mantle.work.effort.WorkEffortApproval", { workEffortApprovalId: sent.workEffortApprovalId }).recordedFor == "N"
    },
})

feature("the client reads the invoice to its organization, read only", {
    when() {
        // (a move of it is refused: test/Projects/ClientBilling.spec.js)
        return as(SHELDON, () => ({ list: render("Billing/Invoices", {}), detail: render("Billing/InvoiceDetail", { invoiceId: "CWALK_INV" }) }))
    },
    then({ list, detail }) {
        list.refused == false
        list.output.includes("CWALK_INV")
        detail.refused == false
        detail.output.includes("Portal sign-in work")
        detail.output.includes("493.80")
        !detail.output.includes("Send")
    },
})
