// People P5's "usable when" (impl-people P5; design-people §12 ApprovalPolicies, §13 Approvals, §5 PositionDetail's
// Requisition), as an acceptance walk with artifact authorization on: people.admin sets a rule through Approval rules that a
// Retail position needs the head of its department, and ResolvePreview explains the route (Store Operations' head, Hannah, and
// no one when Hannah herself asks); people.hr asks for the seasonal seat's activation through PositionDetail and cannot approve
// it; Hannah (people.manager) approves it from People's Approvals, which activates it, and a second seat HR plans and asks for
// from the notification tray (Commons' panel); the reader sees neither request. The rules themselves are Mantle's
// PeopleApprovals and mr-boss's PeopleApprovals and PeopleAccess.
// Run: ./moq accept mr-boss --spec PeopleApprovalsUsable
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const S = "mantle.humanres.PositionServices."
const A = "mantle.humanres.PeopleApprovalServices."
const webroot = "component://webroot/screen/webroot.xml"
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0
// a request under the web root as the user (a transition's post), with its errors
function request(user, path, parameters, method) {
    return asUser(user, () => {
        const result = ec.screen.makeTest().rootScreen(webroot).render(path, parameters, method)
        const errors = Array.from(result.errorMessages || []).join(" | ")
        ec.message.clearErrors()
        return {status: result.status, output: String(result.output || ""), errors}
    })
}
// a Mantle read as the user, for the walk's checks (the screens show the same answer)
const read = (user, service, parameters) => asUser(user, () => system(() => invoke(service, parameters)))
// the user's waiting People position approvals, as their notification list gives them
const waiting = user =>
    asUser(user, () =>
        system(() =>
            Array.from(
                invoke("org.moqui.ui.NotificationServices.get#UserNotifications", {
                    approvals: true,
                    topicList: ["PeoplePositionApproval"],
                    pageSize: 50
                }).notificationList || []
            )
        )
    )
const state = {}

spec({
    setupSpec() {
        login("john.doe")
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("people.admin sets a rule that a Retail position needs its department head, and the preview explains the route", {
    when() {
        const problems = []
        const stored = request(
            users.admin,
            "apps/People/Settings/ApprovalPolicies/storePolicy",
            {
                organizationPartyId: ids.organizationId,
                approvalKindEnumId: "PakPosition",
                sequenceNum: "1",
                approverRoleEnumId: "ParDepartmentHead",
                description: "A new seat needs its department head"
            },
            "post"
        )
        if (stored.errors) problems.push(`the rule: ${stored.errors}`)
        const rules = read(users.admin, A + "find#Policies", {organizationPartyId: ids.organizationId}).policies
        if (!rules.some(row => row.roleText === "Department head" && row.scopeText === "Whole employer"))
            problems.push(`the rules: ${JSON.stringify(rules.map(row => [row.scopeText, row.roleText]))}`)
        const preview = asUser(users.admin, () =>
            page(
                "Settings/ApprovalPolicies",
                {
                    organizationPartyId: ids.organizationId,
                    approvalKindEnumId: "PakPosition",
                    departmentPartyId: ids.departmentId,
                    preview: "Y"
                },
                "html"
            )
        )
        if (!opened(preview) || !preview.output.includes("Department head of Store Operations: Hannah Okafor"))
            problems.push(`the preview: ${preview.status} ${preview.errors}`)
        if (!preview.output.includes("The employer&#39;s rule") && !preview.output.includes("The employer's rule"))
            problems.push("the preview names no rule")
        // when Hannah herself asks, she may not decide it, and no one else may: the request would wait
        const own = read(users.admin, A + "resolve#Approvers", {
            organizationPartyId: ids.organizationId,
            departmentPartyId: ids.departmentId,
            requesterPartyId: ids.managerPartyId
        })
        if (!own.unresolved || !own.steps[0].explanation.includes("may not decide their own request"))
            problems.push(`Hannah's own request: ${JSON.stringify(own.steps)}`)
        const tui = asUser(users.admin, () =>
            page("Settings/ApprovalPolicies", {organizationPartyId: ids.organizationId, preview: "Y"}, "tui")
        )
        if (!opened(tui)) problems.push(`Approval rules in the terminal: ${tui.status} ${tui.errors}`)
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})

feature(
    "people.hr asks for the seasonal seat's activation and cannot approve it; Hannah approves it from Approvals, which activates it",
    {
        when() {
            const problems = []
            const seat = read(users.hr, S + "get#Position", {emplPositionId: ids.plannedPositionId})
            if (!seat.position.canRequestApproval) problems.push("HR is not offered the request")
            const detail = asUser(users.hr, () => page("Staffing/PositionDetail", {emplPositionId: ids.plannedPositionId}))
            if (!opened(detail) || !detail.output.includes("Request activation"))
                problems.push("PositionDetail offers no request")
            const asked = request(
                users.hr,
                "apps/People/Staffing/PositionDetail/requestApproval",
                {
                    emplPositionId: ids.plannedPositionId,
                    expectedRevision: seat.position.revision,
                    justification: "Holiday season cover on the floor"
                },
                "post"
            )
            if (asked.errors) problems.push(`the request: ${asked.errors}`)
            // HR may not decide its own request, whether from the record or a forged decision
            const hrDecides = request(
                users.hr,
                "apps/People/Staffing/PositionDetail/decideApproval",
                {emplPositionId: ids.plannedPositionId, decision: "approve"},
                "post"
            )
            if (!/SELF_APPROVAL/.test(hrDecides.errors)) problems.push(`HR's own decision: ${hrDecides.errors}`)
            if (waiting(users.hr).length) problems.push("HR has the approval in its list")
            if (waiting(users.reader).length) problems.push("the reader has the approval in its list")
            // Hannah's Approvals list has it, with its title
            const approvals = asUser(users.manager, () => page("Approvals", {}, "html"))
            if (!opened(approvals) || !approvals.output.includes("Sales associate (season)"))
                problems.push(`Hannah's Approvals: ${approvals.status} ${approvals.errors}`)
            const notice = waiting(users.manager).find(row => row.recordId === ids.plannedPositionId)
            if (!notice) problems.push("Hannah has no notice")
            const approved = notice
                ? request(
                      users.manager,
                      "apps/People/Approvals/Notifications/approve",
                      {notificationMessageId: notice.notificationMessageId},
                      "post"
                  )
                : {errors: "no notice"}
            if (approved.errors) problems.push(`Hannah's approval: ${approved.errors}`)
            const after = read(users.hr, S + "get#Position", {emplPositionId: ids.plannedPositionId})
            if (after.position.statusId !== "EmpsActive") problems.push(`the seat is ${after.position.statusId}`)
            if (after.approval?.statusId !== "PapApproved" || after.approval.decisions[0]?.decidedByName !== "Hannah Okafor")
                problems.push(`the approval: ${JSON.stringify(after.approval)}`)
            if (waiting(users.manager).some(row => row.recordId === ids.plannedPositionId))
                problems.push("the approval still waits for Hannah")
            const record = asUser(users.manager, () =>
                page("Staffing/PositionDetail", {emplPositionId: ids.plannedPositionId}, "tui")
            )
            if (!opened(record) || !record.output.includes("Approved")) problems.push("PositionDetail in the terminal")
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)

feature("people.hr plans a second seat and asks for it; Hannah approves it from the notification tray", {
    when() {
        const problems = []
        const planned = read(users.hr, S + "store#Position", {
            organizationPartyId: ids.organizationId,
            departmentPartyId: ids.departmentId,
            emplPositionClassId: ids.jobClassId,
            description: "Fitting room attendant"
        })
        const asked = request(
            users.hr,
            "apps/People/Staffing/PositionDetail/requestApproval",
            {emplPositionId: planned.emplPositionId, expectedRevision: planned.revision, justification: "Weekend fitting rooms"},
            "post"
        )
        if (asked.errors) problems.push(`the request: ${asked.errors}`)
        const notice = waiting(users.manager).find(row => row.recordId === planned.emplPositionId)
        if (!notice) problems.push("Hannah has no notice")
        const approved = notice
            ? request(
                  users.manager,
                  "apps/Commons/Panel/Notifications/approve",
                  {notificationMessageId: notice.notificationMessageId},
                  "post"
              )
            : {errors: "no notice"}
        if (approved.errors) problems.push(`the tray's approval: ${approved.errors}`)
        // the same decision again from the tray answers the first
        const again = notice
            ? request(
                  users.manager,
                  "apps/Commons/Panel/Notifications/approve",
                  {notificationMessageId: notice.notificationMessageId},
                  "post"
              )
            : {errors: ""}
        if (again.errors) problems.push(`the tray's second approval: ${again.errors}`)
        const after = read(users.hr, S + "get#Position", {emplPositionId: planned.emplPositionId})
        if (after.position.statusId !== "EmpsActive" || after.approval.decisions.length !== 1)
            problems.push(`the seat: ${after.position.statusId} ${after.approval.decisions.length}`)
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})
