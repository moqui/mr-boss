// IronStone Projects' requests (impl-projects.md P5; design-projects.md §6 Requests, RequestDetail, RequestIntake, §4
// ProjectRequests, §12 IntakeSettings) through the screens, with authorization on, on the demo of
// data/BossProjectsDemoDataRequests.xml: the triage list (its lists and counts, the find, the board), the project's Requests tab
// (ProjectDetail tab 6, mounted from Requests/List, so AppStructure does not walk it, impl-projects.md F52) with its Intake box
// for the managers, the shared RequestDetail in the Projects context (triage moves, edit, assign, set project, make and link a
// work item, the Work tab), the bulk changes, who sees a project's request (its members; one not on a members-only project
// does not), IntakeSettings and the project's Intake box, and the public form at /r/<token> as a visitor with no session user.
// The changes are made on the spec's own requests (BOSS_TEST_* names), so the demo stays for the specs after it.
// Run: ./moq test mr-boss --spec ProjectRequests
const webroot = "component://webroot/screen/webroot.xml"
const intakePage = "component://mr-boss/screen/RequestIntake.xml"
const TOKEN = "BossDemoIronIntakeForm1"
const made = {}

function render(path, parameters, mode) {
    const str = ec.screen.makeTest().rootScreen(webroot).renderMode(mode || "qvt").withStaticData().render(path,
            Object.assign({ lastStandalone: "true" }, parameters || {}), null)
    const output = String(str.output || "")
    ec.message.clearErrors()
    return { status: str.status, errors: str.errorMessages.join(" | "), output, broken: /Error rendering|Exception in render/.test(output) }
}
function post(path, parameters) {
    const str = ec.screen.makeTest().rootScreen(webroot).render("apps/Projects/" + path, parameters || {}, "post")
    const output = String(str.output || "")
    ec.message.clearErrors()
    let parsed = null
    try { parsed = JSON.parse(output) } catch (err) { parsed = null }
    return { status: str.status, errors: str.errorMessages.join(" | "), output, json: parsed || {} }
}
function visit(name, parameters) {
    const str = ec.screen.makeTest().rootScreen(intakePage).render(name, parameters || {}, "post")
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
function as(username, run) {
    login(username)
    try { return run() } finally { login("john.doe") }
}
const one = (entityName, fields) => sys(() => ec.entity.find(entityName).condition(fields).one())
const all = (entityName, fields) => sys(() => Array.from(ec.entity.find(entityName).condition(fields).list()))
const current = (entityName, fields) => sys(() => Array.from(ec.entity.find(entityName).condition(fields)
        .condition(ec.entity.conditionFactory.makeConditionDate("fromDate", "thruDate", null)).list()))
const rows = (parameters) => sys(() => call("ironstone.projects.ProjectRequestServices.find#ProjectRequests", Object.assign({ pageSize: 200 }, parameters || {})))
const ids = (out) => (out.rowList || []).map((row) => row.requestId)
const byName = (name) => all("mantle.request.Request", { requestName: name })[0] || null

spec({
    setupSpec() { login("john.doe") },
})

feature("the demo's requests: by email through IRON's rule, from IRON's form, and in the app", {
    when() {
        const email = byName("Timesheet export drops the last day of the month")
        const form = byName("Add a dark theme to the request form")
        return { email, form, emailLink: email ? all("mantle.request.RequestEmailMessage", { requestId: email.requestId }) : [],
            formNote: form ? all("mantle.request.RequestNote", { requestId: form.requestId }) : [],
            rule: one("moqui.basic.email.EmailRule", { emailRuleId: "BOSS_DEMO_MAIL_R_INTAKE_IRON" }) }
    },
    then({ email, form, emailLink, formNote, rule }) {
        email.rootWorkEffortId == "IRON"
        email.salesChannelEnumId == "ScEmail"
        email.requestTypeEnumId == "RqtBugFix"
        emailLink.some((link) => link.emailMessageId == "BOSS_DEMO_MAIL_S_INTAKE1")
        rule.matchedCount >= 1
        form.rootWorkEffortId == "IRON"
        form.salesChannelEnumId == "ScWeb"
        form.requestTypeEnumId == "RqtNewFeature"
        formNote[0].noteText.includes("Patel Design")
    },
})

feature("the triage lists: john.doe's New, Assigned, All with their counts; the find by project, no project, channel and text", {
    when() {
        return { all: rows({ list: "all" }), fresh: rows({ list: "new" }), assigned: rows({ list: "assigned" }), progress: rows({ list: "progress" }),
            iron: ids(rows({ list: "all", rootWorkEffortId: "IRON" })), none: ids(rows({ list: "all", noProject: true })),
            email: ids(rows({ list: "all", channel: "email" })), text: ids(rows({ list: "all", text: "sign-in page" })) }
    },
    then({ all, fresh, assigned, progress, iron, none, email, text }) {
        const allIds = ids(all)
        allIds.includes("BOSS_DEMO_PREQ_ACME1")
        allIds.includes("BOSS_DEMO_PREQ_TRIAGE")
        all.counts.all == allIds.length
        ids(fresh).includes("BOSS_DEMO_PREQ_ACME2")
        !ids(fresh).includes("BOSS_DEMO_PREQ_ACME1")
        ids(assigned).includes("BOSS_DEMO_PREQ_ACME1")
        ids(progress).includes("BOSS_DEMO_PREQ_IRON1")
        iron.includes("BOSS_DEMO_PREQ_IRON1")
        !iron.includes("BOSS_DEMO_PREQ_ACME1")
        none.includes("BOSS_DEMO_PREQ_TRIAGE")
        !none.includes("BOSS_DEMO_PREQ_ACME1")
        email.length >= 1
        text == ["BOSS_DEMO_PREQ_ACME2"]
        const accepted = all.rowList.find((row) => row.requestId === "BOSS_DEMO_PREQ_ACME1")
        accepted.statusLabel == "Reviewed"
        accepted.projectName == "Acme customer portal"
        accepted.workText == "0/1"
        accepted.assigneeName == "John Doe"
        accepted.channel == "app"
        all.rowList.find((row) => row.requestId === "BOSS_DEMO_PREQ_IRON1").workText == "0/1"
    },
})

feature("Requests renders in qvt with the chips, New request, the bulk changes and the board", {
    when() { return { shown: render("apps/Projects/Requests", { list: "all" }), board: render("apps/Projects/Requests", { list: "all", view: "board", pageNoLimit: "true" }) } },
    then({ shown, board }) {
        shown.status == 200
        shown.errors == ""
        !shown.broken
        shown.output.includes("New · ")
        shown.output.includes("Assigned to me · ")
        shown.output.includes("To review · ")
        shown.output.includes("Bring over the tickets of the old tracker")
        shown.output.includes('data-status="ReqReviewed"')
        shown.output.includes('id="NewProjectRequestContainer"')
        shown.output.includes("Make work items")
        board.errors == ""
        !board.broken
    },
})

feature("the project's Requests tab (ProjectDetail tab 6): IRON's requests only, and for its manager the Intake box", {
    when() {
        return { tab: render("apps/Projects/Projects/ProjectDetail/Requests", { workEffortId: "IRON" }),
            joeTab: as("joe.developer", () => render("apps/Projects/Projects/ProjectDetail/Requests", { workEffortId: "IRON" })),
            detail: render("apps/Projects/Projects/ProjectDetail", { workEffortId: "IRON" }) }
    },
    then({ tab, joeTab, detail }) {
        tab.status == 200
        tab.errors == ""
        !tab.broken
        tab.output.includes("Leave holidays out of the burndown")
        !tab.output.includes("The sign-in page is slow on phones")
        tab.output.includes("support+iron@ziziwork.example")
        tab.output.includes("/r/" + TOKEN)
        tab.output.includes("Rotate")
        // the team sees the requests, not the Intake box
        joeTab.errors == ""
        joeTab.output.includes("Leave holidays out of the burndown")
        !joeTab.output.includes("support+iron@ziziwork.example")
        detail.errors == ""
    },
})

feature("RequestDetail in Projects: the facts, the triage moves, the Work tab with its item, Chatter on Send message for an outside customer", {
    when() {
        return { detail: render("apps/Projects/Requests/RequestDetail", { requestId: "BOSS_DEMO_PREQ_ACME1" }),
            work: render("apps/Projects/Requests/RequestDetail", { requestId: "BOSS_DEMO_PREQ_IRON1", tab: "work" }),
            email: render("apps/Projects/Requests/RequestDetail", { requestId: byName("Timesheet export drops the last day of the month").requestId }),
            commons: render("apps/Commons/Requests/RequestDetail", { requestId: "BOSS_DEMO_PREQ_ACME1" }) }
    },
    then({ detail, work, email, commons }) {
        detail.status == 200
        detail.errors == ""
        !detail.broken
        detail.output.includes("Export the portal")
        detail.output.includes("RequestStatusBar")
        detail.output.includes("Acme customer portal")
        detail.output.includes("MakeWorkItemDialog")
        detail.output.includes("ResolveRequestDialog")
        detail.output.includes("ConvertToProjectDialog")
        work.output.includes("IRON-7")
        work.output.includes("Leave holidays out of the burndown")
        email.output.includes('default-tab="message"')
        email.output.includes("Email")
        // Commons shows the same request in its own context
        commons.errors == ""
        !commons.output.includes("MakeWorkItemDialog")
        commons.output.includes("Export the portal")
    },
})

feature("New request in a project, then the triage moves: accept, assign, set the priority and due, start, back, complete", {
    when() {
        const created = post("Requests/List/createRequest", { newProjectId: "IRON", requestName: "BOSS_TEST The board loses its scroll", requestTypeEnumId: "RqtBugFix",
            priority: "5", description: "After a drag the board scrolls to the top." })
        const row = byName("BOSS_TEST The board loses its scroll")
        made.request = row?.requestId
        const triager = current("mantle.request.RequestParty", { requestId: made.request, roleTypeId: "Assignee" }).map((rp) => rp.partyId)
        const accept = post("Requests/RequestDetail/changeStatus", { requestId: made.request, toStatusId: "ReqReviewed" })
        const accepted = one("mantle.request.Request", { requestId: made.request }).statusId
        const assign = post("Requests/RequestDetail/triage", { requestId: made.request, triageAction: "assign", value: "ORG_ZIZI_JD" })
        const priority = post("Requests/RequestDetail/triage", { requestId: made.request, triageAction: "priority", value: "2" })
        const due = post("Requests/RequestDetail/triage", { requestId: made.request, triageAction: "due", value: "2026-12-01" })
        const draftMove = post("Requests/RequestDetail/changeStatus", { requestId: made.request, toStatusId: "ReqDraft" })
        return { created, row, triager, accept, accepted, assign, priority, due, draftMove, after: one("mantle.request.Request", { requestId: made.request }),
            assignee: current("mantle.request.RequestParty", { requestId: made.request, roleTypeId: "Assignee" }).map((rp) => rp.partyId) }
    },
    then({ created, row, triager, accept, accepted, assign, priority, due, draftMove, after, assignee }) {
        created.errors == ""
        row.rootWorkEffortId == "IRON"
        row.statusId == "ReqSubmitted"
        row.filedByPartyId == "EX_JOHN_DOE"
        // IRON's triage assignee takes a request made with no assignee
        triager == ["EX_JOHN_DOE"]
        accept.errors == ""
        accepted == "ReqReviewed"
        assign.errors == ""
        assignee == ["ORG_ZIZI_JD"]
        priority.errors == ""
        after.priority == 2
        due.errors == ""
        after.responseRequiredDate != null
        draftMove.errors.includes("does not move to ReqDraft")
    },
})

feature("make a work item from the request: a Bug Fix in IRON, linked, on the Work tab; link and unlink another", {
    when() {
        const madeItem = post("Requests/RequestDetail/makeWorkItem", { requestId: made.request, rootWorkEffortId: "IRON", workEffortName: "BOSS_TEST Keep the board's scroll",
            purposeEnumId: "WepFix", priority: "2" })
        const link = all("mantle.request.RequestWorkEffort", { requestId: made.request })
        const item = link.length ? one("mantle.work.effort.WorkEffort", { workEffortId: link[0].workEffortId }) : null
        made.item = item?.workEffortId
        const linked = post("Requests/RequestDetail/linkWorkItem", { requestId: made.request, workEffortId: "IRON-13" })
        const afterLink = all("mantle.request.RequestWorkEffort", { requestId: made.request }).map((row) => row.workEffortId).sort()
        const unlinked = post("Requests/RequestDetail/unlinkWorkItem", { requestId: made.request, workEffortId: "IRON-13" })
        return { madeItem, item, linked, afterLink, unlinked, work: render("apps/Projects/Requests/RequestDetail", { requestId: made.request, tab: "work" }),
            after: all("mantle.request.RequestWorkEffort", { requestId: made.request }).map((row) => row.workEffortId) }
    },
    then({ madeItem, item, linked, afterLink, unlinked, work, after }) {
        madeItem.errors == ""
        item.rootWorkEffortId == "IRON"
        item.purposeEnumId == "WepFix"
        item.workEffortName == "BOSS_TEST Keep the board's scroll"
        linked.errors == ""
        afterLink.includes("IRON-13")
        unlinked.errors == ""
        after == [made.item]
        work.output.includes(made.item)
    },
})

feature("the bulk changes on selected requests, each on its own: set the priority of two, one of them not seen", {
    when() {
        const out = post("Requests/List/bulkAction", { bulk: "priority", value: "4", selectedIds: made.request + ",NO_SUCH_REQUEST", keep: "{}" })
        return { out, after: one("mantle.request.Request", { requestId: made.request }) }
    },
    then({ out, after }) {
        out.errors == ""
        after.priority == 4
    },
})

feature("who sees a project's request: the project's team triages it; one not on a members-only project does not see it", {
    when() {
        const hidden = sys(() => call("mantle.request.RequestServices.create#Request", { requestName: "BOSS_TEST Hiring plan question", rootWorkEffortId: "HIRE",
            statusId: "ReqSubmitted", filedByPartyId: "EX_JOHN_DOE" })).requestId
        made.hidden = hidden
        return as("joe.developer", () => ({
            seen: render("apps/Projects/Requests/RequestDetail", { requestId: made.request }),
            triage: post("Requests/RequestDetail/triage", { requestId: made.request, triageAction: "priority", value: "3" }),
            notSeen: render("apps/Projects/Requests/RequestDetail", { requestId: hidden }),
            list: ids(rows({ list: "all" })),
        }))
    },
    then({ seen, triage, notSeen, list }) {
        seen.output.includes("BOSS_TEST The board loses its scroll")
        triage.errors == ""
        notSeen.output.includes("is not available")
        !notSeen.output.includes("Hiring plan question")
        list.includes(made.request)
        !list.includes(made.hidden)
        one("mantle.request.Request", { requestId: made.hidden }).priority == 5
    },
})

feature("the request follows its work: the item started puts it In Progress, completed it Completed and Fixed", {
    when() {
        const start = post("WorkItems/WorkItemDetail/changeStatus", { workEffortId: made.item, toStatusId: "WeInProgress" })
        const started = one("mantle.request.Request", { requestId: made.request }).statusId
        const done = post("WorkItems/WorkItemDetail/changeStatus", { workEffortId: made.item, toStatusId: "WeComplete" })
        return { start, started, done, after: one("mantle.request.Request", { requestId: made.request }) }
    },
    then({ start, started, done, after }) {
        start.errors == ""
        started == "ReqInProgress"
        done.errors == ""
        after.statusId == "ReqCompleted"
        after.requestResolutionEnumId == "RrFixed"
    },
})

feature("Resolve cancels with a reason and a note on the conversation; Set project moves one with no project", {
    when() {
        const created = post("Requests/List/createRequest", { requestName: "BOSS_TEST No project yet", requestTypeEnumId: "RqtProposal" })
        const row = byName("BOSS_TEST No project yet")
        const moved = post("Requests/RequestDetail/triage", { requestId: row.requestId, triageAction: "project", value: "IRON" })
        const resolved = post("Requests/RequestDetail/resolve", { requestId: row.requestId, toStatusId: "ReqCancelled", resolutionEnumId: "RrDuplicate",
            comment: "BOSS_TEST Same as the import request." })
        const after = one("mantle.request.Request", { requestId: row.requestId })
        const notes = all("mantle.request.RequestCommEvent", { requestId: row.requestId }).map((link) => one("mantle.party.communication.CommunicationEvent",
            { communicationEventId: link.communicationEventId })?.body)
        return { created, row, moved, resolved, after, notes }
    },
    then({ created, row, moved, resolved, after, notes }) {
        created.errors == ""
        row.rootWorkEffortId == null
        moved.errors == ""
        after.rootWorkEffortId == "IRON"
        resolved.errors == ""
        after.statusId == "ReqCancelled"
        after.requestResolutionEnumId == "RrDuplicate"
        notes.includes("BOSS_TEST Same as the import request.")
    },
})

feature("IntakeSettings: the types, the addresses and the public form; a plus tag another project has is refused", {
    when() {
        const page = render("apps/Projects/Settings/Intake", {})
        const types = post("Settings/Intake/saveTypes", { offered: ["RqtBugFix", "RqtNewFeature", "RqtSupport", "RqtInformation", "RqtProposal"],
            triaged: ["RqtBugFix", "RqtNewFeature", "RqtProposal"], defaultType: "RqtSupport", triagePartyId: "EX_JOHN_DOE" })
        const form = post("Settings/Intake/saveForm", { files: "Y", maxFiles: "5", maxMb: "10", confirm: "N", captcha: "N" })
        const taken = post("Settings/Intake/saveAddress", { addressProjectId: "ACME", emailAccountId: "BOSS_DEMO_MAIL_SUPPORT", plusTag: "iron" })
        const teamPage = as("joe.developer", () => render("apps/Projects/Settings/Intake", {}))
        return { page, types, form, taken, teamPage,
            setting: one("mantle.party.PartySetting", { partyId: "ORG_ZIZI_SERVICES", partySettingTypeId: "ProjIntake" }) }
    },
    then({ page, types, form, taken, teamPage, setting }) {
        page.errors == ""
        !page.broken
        page.output.includes("Request types")
        page.output.includes("support+iron@ziziwork.example")
        page.output.includes("Public form")
        types.errors == ""
        JSON.parse(setting.settingValue).triaged == "RqtBugFix,RqtNewFeature,RqtProposal"
        form.errors == ""
        taken.errors.includes("The plus tag iron is project IRON")
        // the team is denied the managers' settings
        teamPage.status != 200 || teamPage.errors != "" || !teamPage.output.includes("Request types")
    },
})

feature("the public form: the route's token check, a request sent with no session user, the checks, a rotated link refused", {
    when() {
        logout()
        try {
            const checked = call("mantle.request.RequestServices.check#IntakeToken", { token: TOKEN, routeName: "r" })
            const page = ec.screen.makeTest().rootScreen(intakePage).renderMode("qvue").render("", { token: TOKEN }, null)
            const sent = visit("submit", { token: TOKEN, firstName: "Tess", lastName: "Tester", emailAddress: "tess.tester@example.org", organizationName: "Test Co",
                requestTypeEnumId: "RqtBugFix", requestName: "BOSS_TEST The form sends twice", description: "Pressing Send twice made two requests." })
            const wrong = visit("submit", { token: "NotTheTokenOfAnyForm000", firstName: "Tess", lastName: "Tester", emailAddress: "tess.tester@example.org",
                requestName: "BOSS_TEST wrong", description: "x" })
            return { checked, page: String(page.output || ""), sent, wrong }
        } finally { login("john.doe") }
    },
    then({ checked, page, sent, wrong }) {
        checked.valid
        checked.routeContext.projectName == "IronStone Projects"
        checked.routeContext.typeList.length >= 1
        Object.keys(checked.routeContext).every((key) => ["projectName", "typeList", "defaultType", "filesAllowed", "maxFiles", "maxMb", "captchaSiteKey"].includes(key))
        page.includes("module.exports")
        sent.errors == ""
        sent.json.received
        const row = byName("BOSS_TEST The form sends twice")
        sent.json.requestId == row.requestId
        // nothing but the number and the public thank-you
        Object.keys(sent.json).every((key) => ["received", "requestId", "messages"].includes(key))
        !sent.json.messages || String(sent.json.messages).startsWith("Thank you")
        row.rootWorkEffortId == "IRON"
        row.salesChannelEnumId == "ScWeb"
        wrong.errors.includes("This form is not available")
        byName("BOSS_TEST wrong") == null
    },
})
