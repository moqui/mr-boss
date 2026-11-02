// Commons Requests and RequestDetail (screen/Commons/Requests/List.xml and RequestDetail.xml, service/ironstone/commons/RequestServices.xml;
// impl-drawers-commons.md M6, design-drawers-commons.md §8): john.doe's lists on the demo (data/BossDemoData.xml,
// DemoServices.load#TasksDemo): All open, Raised by me, Assigned to me, Watching and Closed, the find, New request (submitted
// or a draft); RequestDetail with its stage chips and the requester's actions: submit a draft, cancel one's own, edit a
// draft, comment (add#RequestComment, shown in Chatter's timeline as a note), reassign when one is the assignee, add a task.
// A request Joe Developer is not on is "not available" to him and his changes of it are refused (IronStone R5, R28). The
// changes are made on the spec's own requests (BOSS_TEST_* names), so the demo stays for the specs after it.
// Run: ./moq test mr-boss --spec Requests
const webroot = "component://webroot/screen/webroot.xml"
const commons = "component://mr-boss/screen/Commons.xml"
const made = {}

function render(path, parameters) {
    const str = ec.screen.makeTest().rootScreen(webroot).renderMode("qvt").withStaticData().render(path, Object.assign({ lastStandalone: "true" }, parameters || {}), null)
    const output = String(str.output || "")
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), output, broken: /Error rendering|Exception in render/.test(output) }
}
function post(path, parameters) {
    const str = ec.screen.makeTest().rootScreen(commons).render(path, parameters || {}, "post")
    const output = String(str.output || "")
    let json = null
    try { json = JSON.parse(output) } catch (err) { json = null }
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), json: json || {}, output }
}
// the stages of the framework's status-bar (m-status-bar :bar, as get#StatusBar answered it): statusId to "state color"
const stagesOf = (output) => Object.fromEntries(Array.from(output.matchAll(/\{'statusId':'([^']+)','label':'(?:[^'\\]|\\.)*','color':'([^']*)','state':'(\w+)'\}/g))
        .map((match) => [match[1], match[3] + " " + match[2]]))
// the transitions of the status-bar: label to "next", "danger" or "other"
const transitionsOf = (output) => Object.fromEntries(Array.from(output.matchAll(/'label':'((?:[^'\\]|\\.)*)','color':'[^']*','isNext':(true|false),'isDanger':(true|false)/g))
        .map((match) => [match[1], match[2] === "true" ? "next" : match[3] === "true" ? "danger" : "other"]))
function get(path, parameters) {
    const str = ec.screen.makeTest().rootScreen(commons).render(path, parameters || {}, null)
    let json = null
    try { json = JSON.parse(String(str.output || "")) } catch (err) { json = null }
    ec.message.clearErrors()
    return { status: str.status, json: json || {} }
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
const current = (entityName, fields) => sys(() => Array.from(ec.entity.find(entityName).condition(fields)
        .condition(ec.entity.conditionFactory.makeConditionDate("fromDate", "thruDate", null)).list()))
const rows = (list, parameters) => sys(() => call("ironstone.commons.RequestServices.find#RequestRows", Object.assign({ list, pageSize: 200 }, parameters || {})))
const idsOf = (out) => (out.rowList || []).map((row) => row.requestId)
// a request john.doe raises through New request, by its name
function raise(name, parameters) {
    const created = post("Requests/List/createRequest", Object.assign({ requestName: name, requestTypeEnumId: "RqtSupport", priority: "5" }, parameters || {}))
    const request = all("mantle.request.Request", { requestName: name })[0] || null
    return { created, request, id: request ? request.requestId : null }
}

spec({
    setupSpec() {
        login("john.doe")
        sys(() => call("ironstone.commons.DemoServices.load#TasksDemo", {}))
    },
})

feature("each list has john.doe's requests of the demo, with the counts", {
    when() {
        const lists = {}
        for (const list of ["all", "raised", "assigned", "watching", "closed"]) lists[list] = rows(list)
        return { lists, ids: Object.fromEntries(Object.entries(lists).map(([key, out]) => [key, idsOf(out)])), counts: lists.all.counts }
    },
    then({ lists, ids, counts }) {
        ids.all.includes("BOSS_DEMO_REQUEST")
        ids.all.includes("BOSS_DEMO_REQ_DRAFT")
        ids.all.includes("BOSS_DEMO_REQ_ASSIGNED")
        ids.all.includes("BOSS_DEMO_REQ_WATCH")
        !ids.all.includes("BOSS_DEMO_REQ_DONE")
        ids.raised.includes("BOSS_DEMO_REQ_DRAFT")
        ids.raised.includes("BOSS_DEMO_REQUEST")
        !ids.raised.includes("BOSS_DEMO_REQ_ASSIGNED")
        ids.assigned.includes("BOSS_DEMO_REQ_ASSIGNED")
        ids.assigned.includes("BOSS_DEMO_REQUEST")
        !ids.assigned.includes("BOSS_DEMO_REQ_DRAFT")
        ids.watching.includes("BOSS_DEMO_REQ_WATCH")
        !ids.watching.includes("BOSS_DEMO_REQ_ASSIGNED")
        ids.closed.includes("BOSS_DEMO_REQ_DONE")
        !ids.closed.includes("BOSS_DEMO_REQUEST")
        counts.watching == ids.watching.length
        counts.closed == ids.closed.length
        const assigned = lists.all.rowList.find((row) => row.requestId === "BOSS_DEMO_REQ_ASSIGNED")
        assigned.statusLabel == "In Progress"
        assigned.statusColor == "primary"
        assigned.assigneeName == "John Doe"
        assigned.isMine
        assigned.typeLabel == "Support"
        assigned.priorityText == "2"
        const demo = lists.all.rowList.find((row) => row.requestId === "BOSS_DEMO_REQUEST")
        demo.customerName == "Bob Acme"
        demo.statusColor == "info"
        lists.closed.rowList.find((row) => row.requestId === "BOSS_DEMO_REQ_DONE").statusColor == "positive"
    },
})

feature("the find narrows a list: text, type, status, priority band", {
    when() {
        return { text: idsOf(rows("all", { text: "printer" })), type: idsOf(rows("all", { requestTypeEnumId: "RqtPurchase" })),
            status: idsOf(rows("raised", { statusId: "ReqCompleted" })), high: idsOf(rows("all", { priority: "high" })),
            low: idsOf(rows("all", { priority: "low" })) }
    },
    then({ text, type, status, high, low }) {
        text == ["BOSS_DEMO_REQ_ASSIGNED"]
        type.includes("BOSS_DEMO_REQ_DRAFT")
        !type.includes("BOSS_DEMO_REQUEST")
        status.includes("BOSS_DEMO_REQ_DONE")
        high.includes("BOSS_DEMO_REQ_ASSIGNED")
        !high.includes("BOSS_DEMO_REQ_DRAFT")
        !low.includes("BOSS_DEMO_REQ_ASSIGNED")
    },
})

feature("the list renders in qvt with the chips and counts, the find, the status chips and New request", {
    when() { return { shown: render("apps/Commons/Requests", {}), closed: render("apps/Commons/Requests", { list: "closed" }) } },
    then({ shown, closed }) {
        shown.status == 200
        shown.errors == ""
        !shown.broken
        shown.output.includes("All open · ")
        shown.output.includes("Raised by me · ")
        shown.output.includes("Assigned to me · ")
        shown.output.includes("Watching · ")
        shown.output.includes("Closed · ")
        shown.output.includes("Set up the shared team calendar")
        shown.output.includes("Printer on the second floor jams")
        shown.output.includes('data-status="ReqInProgress"')
        shown.output.includes('id="NewRequestContainer"')
        shown.output.includes("Keep as a draft")
        !shown.output.includes("Reset the guest wifi password")
        closed.output.includes("Reset the guest wifi password")
    },
})

feature("New request: submitted, or kept as a draft, filed by john.doe", {
    when() {
        const submitted = raise("BOSS_TEST Fix the door bell", { customerPartyId: "ORG_ACME_BA", description: "It rings twice." })
        const draft = raise("BOSS_TEST Buy a coffee machine", { draft: "Y", requestTypeEnumId: "RqtPurchase" })
        made.submitted = submitted.id
        made.draft = draft.id
        return { submitted, draft, customer: current("mantle.request.RequestParty", { requestId: submitted.id, roleTypeId: "Customer" }),
            reporter: current("mantle.request.RequestParty", { requestId: draft.id, roleTypeId: "Reporter" }), raised: idsOf(rows("raised")) }
    },
    then({ submitted, draft, customer, reporter, raised }) {
        submitted.created.errors == ""
        submitted.request.statusId == "ReqSubmitted"
        submitted.request.filedByPartyId == "EX_JOHN_DOE"
        customer.length == 1
        customer[0].partyId == "ORG_ACME_BA"
        draft.created.errors == ""
        draft.request.statusId == "ReqDraft"
        draft.request.requestTypeEnumId == "RqtPurchase"
        reporter[0].partyId == "EX_JOHN_DOE"
        raised.includes(submitted.id)
        raised.includes(draft.id)
    },
})

feature("RequestDetail renders the request with its stage chips, the requester's actions, the tabs and the conversation", {
    when() {
        return { draft: render("apps/Commons/Requests/RequestDetail", { requestId: "BOSS_DEMO_REQ_DRAFT" }),
            assigned: render("apps/Commons/Requests/RequestDetail", { requestId: "BOSS_DEMO_REQ_ASSIGNED" }),
            demo: render("apps/Commons/Requests/RequestDetail", { requestId: "BOSS_DEMO_REQUEST" }),
            tasks: render("apps/Commons/Requests/RequestDetail", { requestId: "BOSS_DEMO_REQUEST", tab: "tasks" }),
            files: render("apps/Commons/Requests/RequestDetail", { requestId: "BOSS_DEMO_REQUEST", tab: "files" }),
            conversation: render("apps/Commons/Requests/RequestDetail", { requestId: "BOSS_DEMO_REQUEST", tab: "conversation" }) }
    },
    then({ draft, assigned, demo, tasks, files, conversation }) {
        draft.status == 200
        draft.errors == ""
        !draft.broken
        draft.output.includes("Order a second monitor")
        stagesOf(draft.output).ReqDraft == "current grey-7"
        transitionsOf(draft.output).Submit == "next"
        transitionsOf(draft.output).Cancel == "danger"
        draft.output.includes("RequestEditDialog")
        // john.doe is the assignee of Joe's request: reassign, no submit or cancel (it is not his)
        stagesOf(assigned.output) == { ReqDraft: "done grey-7", ReqSubmitted: "done info", ReqReviewed: "done info", ReqInProgress: "current primary", ReqCompleted: "todo positive" }
        assigned.output.includes("RequestReassignDialog")
        !assigned.output.includes("changeStatus")
        !assigned.output.includes("RequestEditDialog")
        demo.output.includes("Set up the shared team calendar")
        demo.output.includes("Bob Acme")
        demo.output.includes("changeStatus")
        demo.output.includes('<m-chatter id="RequestChatter" record-entity="mantle.request.Request" record-id="BOSS_DEMO_REQUEST" default-tab="log">')
        demo.output.includes('<m-screen-context record-entity="mantle.request.Request" record-id="BOSS_DEMO_REQUEST"')
        tasks.output.includes("Call Bob Acme about who may see the shared calendar")
        tasks.output.includes("Add a task")
        files.output.includes('<m-record-files id="RequestFiles" record-entity="mantle.request.Request" record-id="BOSS_DEMO_REQUEST"')
        conversation.output.includes('<m-chatter id="RequestChatterTab"')
    },
})

feature("RequestDetail: john.doe edits and submits his draft, and cancels his own request", {
    when() {
        const edited = post("Requests/RequestDetail/updateRequest", { requestId: made.draft, requestName: "BOSS_TEST Buy a coffee machine", priority: "3",
            description: "For the second floor kitchen.", responseRequiredDate: "2026-12-01" })
        const afterEdit = one("mantle.request.Request", { requestId: made.draft })
        const submitted = post("Requests/RequestDetail/changeStatus", { requestId: made.draft, toStatusId: "ReqSubmitted" })
        const afterSubmit = one("mantle.request.Request", { requestId: made.draft })
        const editSubmitted = post("Requests/RequestDetail/updateRequest", { requestId: made.draft, requestName: "Changed" })
        const cancelled = post("Requests/RequestDetail/changeStatus", { requestId: made.submitted, toStatusId: "ReqCancelled" })
        const afterCancel = one("mantle.request.Request", { requestId: made.submitted })
        // Joe's request john.doe is assigned to is not his to cancel
        const notMine = post("Requests/RequestDetail/changeStatus", { requestId: "BOSS_DEMO_REQ_ASSIGNED", toStatusId: "ReqCancelled" })
        return { edited, afterEdit, submitted, afterSubmit, editSubmitted, cancelled, afterCancel, notMine,
            closed: idsOf(rows("closed")), assigned: one("mantle.request.Request", { requestId: "BOSS_DEMO_REQ_ASSIGNED" }) }
    },
    allowMessageErrors: true,
    then({ edited, afterEdit, submitted, afterSubmit, editSubmitted, cancelled, afterCancel, notMine, closed, assigned }) {
        edited.errors == ""
        afterEdit.priority == 3
        afterEdit.description == "For the second floor kitchen."
        // the fields not given stay
        afterEdit.requestTypeEnumId == "RqtPurchase"
        submitted.errors == ""
        afterSubmit.statusId == "ReqSubmitted"
        editSubmitted.errors.includes("Only a draft you raised can be edited here")
        cancelled.errors == ""
        afterCancel.statusId == "ReqCancelled"
        afterCancel.requestResolutionEnumId == "RrRejected"
        closed.includes(made.submitted)
        notMine.errors.includes("Only an open request you raised can be cancelled here")
        assigned.statusId == "ReqInProgress"
    },
})

feature("RequestDetail: a comment through add#RequestComment shows in Chatter's timeline as a note; a task on the request", {
    when() {
        const commented = post("Requests/RequestDetail/addComment", { requestId: "BOSS_DEMO_REQ_ASSIGNED", body: "BOSS_TEST Ordered the new drum unit." })
        const join = all("mantle.request.RequestCommEvent", { requestId: "BOSS_DEMO_REQ_ASSIGNED" })
        const comment = join.map((row) => one("mantle.party.communication.CommunicationEvent", { communicationEventId: row.communicationEventId }))
                .find((event) => event && event.body === "BOSS_TEST Ordered the new drum unit.")
        const timeline = get("Chatter/timeline", { recordEntity: "mantle.request.Request", recordId: "BOSS_DEMO_REQ_ASSIGNED" })
        const entry = (timeline.json.entryList || []).find((item) => item.key === "ce-" + (comment ? comment.communicationEventId : ""))
        const task = post("Requests/RequestDetail/addTask", { requestId: "BOSS_DEMO_REQ_ASSIGNED", workEffortName: "BOSS_TEST Replace the drum", dueDate: "" })
        const made_ = all("mantle.work.effort.WorkEffort", { workEffortName: "BOSS_TEST Replace the drum" })[0]
        const closedTask = post("Requests/RequestDetail/addTask", { requestId: made.submitted, workEffortName: "BOSS_TEST Too late" })
        return { commented, comment, entry, task, made_, closedTask,
            linked: made_ ? all("mantle.request.RequestWorkEffort", { requestId: "BOSS_DEMO_REQ_ASSIGNED", workEffortId: made_.workEffortId }).length : 0,
            shown: render("apps/Commons/Requests/RequestDetail", { requestId: "BOSS_DEMO_REQ_ASSIGNED", tab: "tasks" }).output }
    },
    allowMessageErrors: true,
    then({ commented, comment, entry, task, made_, closedTask, linked, shown }) {
        commented.errors == ""
        comment != null
        comment.communicationEventTypeId == "Comment"
        comment.fromPartyId == "EX_JOHN_DOE"
        entry != null
        entry.kindLabel == "Note"
        entry.authorName == "John Doe"
        task.errors == ""
        made_ != null
        linked == 1
        closedTask.errors.includes("This request is closed")
        shown.includes("BOSS_TEST Replace the drum")
    },
})

feature("RequestDetail links a party through RequestRecord; a task stays on RequestWorkEffort", {
    when() {
        const linked = post("Requests/RequestDetail/linkRecord", { requestId: "BOSS_DEMO_REQ_ASSIGNED", record: "mantle.party.Party|ORG_ACME_BA" })
        const again = post("Requests/RequestDetail/linkRecord", { requestId: "BOSS_DEMO_REQ_ASSIGNED", record: "mantle.party.Party|ORG_ACME_BA" })
        const task = post("Requests/RequestDetail/linkRecord", { requestId: "BOSS_DEMO_REQ_ASSIGNED", record: "mantle.work.effort.WorkEffort|BOSS_DEMO_TODAY_CALL" })
        const party = one("mantle.request.RequestRecord", { requestId: "BOSS_DEMO_REQ_ASSIGNED", recordEntityName: "mantle.party.Party", recordId: "ORG_ACME_BA" })
        const shown = render("apps/Commons/Requests/RequestDetail", { requestId: "BOSS_DEMO_REQ_ASSIGNED" })
        const off = post("Requests/RequestDetail/unlinkRecord", { requestId: "BOSS_DEMO_REQ_ASSIGNED", recordEntityName: "mantle.party.Party", recordId: "ORG_ACME_BA" })
        const gone = one("mantle.request.RequestRecord", { requestId: "BOSS_DEMO_REQ_ASSIGNED", recordEntityName: "mantle.party.Party", recordId: "ORG_ACME_BA" })
        return { linked, again, task, shown, off, gone, party,
            effort: one("mantle.request.RequestWorkEffort", { requestId: "BOSS_DEMO_REQ_ASSIGNED", workEffortId: "BOSS_DEMO_TODAY_CALL" }),
            effortGeneric: one("mantle.request.RequestRecord", { requestId: "BOSS_DEMO_REQ_ASSIGNED", recordEntityName: "mantle.work.effort.WorkEffort", recordId: "BOSS_DEMO_TODAY_CALL" }) }
    },
    then({ linked, again, task, shown, off, gone, party, effort, effortGeneric }) {
        linked.errors == ""
        again.errors == ""
        task.errors == ""
        party != null
        effort != null
        effortGeneric == null
        shown.output.includes("Linked records")
        shown.output.includes("m-record-card")
        off.errors == ""
        gone == null
    },
})

feature("RequestDetail: the assignee reassigns; someone not the assignee cannot", {
    when() {
        const notAssignee = post("Requests/RequestDetail/reassign", { requestId: "BOSS_DEMO_REQ_DRAFT", assignToPartyId: "ORG_ZIZI_JD" })
        const reassigned = post("Requests/RequestDetail/reassign", { requestId: "BOSS_DEMO_REQ_ASSIGNED", assignToPartyId: "ORG_ZIZI_BD" })
        const assignees = current("mantle.request.RequestParty", { requestId: "BOSS_DEMO_REQ_ASSIGNED", roleTypeId: "Assignee" }).map((row) => row.partyId)
        // back to john.doe for the specs after this one, as Bob Developer
        const back = as("bob.developer", () => post("Requests/RequestDetail/reassign", { requestId: "BOSS_DEMO_REQ_ASSIGNED", assignToPartyId: "EX_JOHN_DOE" }))
        return { notAssignee, reassigned, assignees, back,
            after: current("mantle.request.RequestParty", { requestId: "BOSS_DEMO_REQ_ASSIGNED", roleTypeId: "Assignee" }).map((row) => row.partyId),
            assigned: idsOf(rows("assigned")) }
    },
    allowMessageErrors: true,
    then({ notAssignee, reassigned, assignees, back, after, assigned }) {
        notAssignee.errors.includes("Only the request's assignee may reassign it")
        reassigned.errors == ""
        assignees == ["ORG_ZIZI_BD"]
        back.errors == ""
        after == ["EX_JOHN_DOE"]
        assigned.includes("BOSS_DEMO_REQ_ASSIGNED")
    },
})

feature("a request Joe Developer is not on is not available to him, and his changes of it are refused; his own shows", {
    allowMessageErrors: true,
    when() {
        return as("joe.developer", () => ({
            hidden: render("apps/Commons/Requests/RequestDetail", { requestId: "BOSS_DEMO_REQUEST" }),
            comment: post("Requests/RequestDetail/addComment", { requestId: "BOSS_DEMO_REQUEST", body: "Let me in" }),
            own: render("apps/Commons/Requests/RequestDetail", { requestId: "BOSS_DEMO_REQ_WATCH" }),
            list: render("apps/Commons/Requests", {}),
        }))
    },
    then({ hidden, comment, own, list }) {
        hidden.status == 200
        hidden.output.includes("is not available")
        !hidden.output.includes("Set up the shared team calendar")
        !hidden.output.includes("<m-chatter")
        comment.errors.includes("Request BOSS_DEMO_REQUEST is not available")
        // Joe raised the parking request: he may cancel it, and sees it in his list
        own.output.includes("Add a parking spot for visitors")
        own.output.includes("changeStatus")
        !list.output.includes("Set up the shared team calendar")
        list.output.includes("Printer on the second floor jams")
    },
})
