// Maintenance requests in BOSS (impl-maintenance P4; design-maintenance §3 Requests, the RequestDetail mount row, §1.2 quick create):
// Requests' one qvt render (the planner's untriaged and triaged requests and the adoption queue), RequestDetail's one qvt render
// under Maintenance (the planner's Maintenance box with the reported fault and the triage dialogs; Retail's planner refused),
// Commons' RequestDetail of a maintenance request rendered once for its reporter (the owner contract with Commons: the safe
// summary, no time, no technician, no other report of the fault), and Report a problem: in the requester's + menu only, its one
// qvt render and a report through it. The intake rules (one target, own requests, triage once, mail, the production handoff)
// are Mantle's MaintenanceIntake; the "usable when" is the acceptance MaintenanceIntakeWalk.
// Run: ./moq test mr-boss --spec MaintenanceRequests
const lib = ec.resource.script("component://mr-boss/test/Maintenance/MaintenanceSpecLib.js")
const {ids, users, asUser, system, page, shell} = lib

spec({
    setupSpec() {
        login("john.doe")
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
    }
})

feature("Requests lists the planner's open maintenance requests, triaged and not, with the adoption queue", {
    when() {
        const rendered = asUser(users.planner, () => page("Requests/Find", {}))
        const retail = asUser(users.retailPlanner, () => page("Requests/Find", {}))
        return {rendered, retail}
    },
    then({rendered, retail}) {
        rendered.errors.length == 0
        rendered.output.includes("Compressor leaking oil")
        rendered.output.includes("Air handler dripping water")
        // the triaged one shows its work order, the reporter's name is the planner's to see
        rendered.output.includes("Air handler coil leak")
        rendered.output.includes("Maintenance Requester")
        rendered.output.includes("Untriaged")
        retail.errors.length == 0
        !retail.output.includes("Compressor leaking oil")
    }
})

feature("RequestDetail under Maintenance shows the planner the reported fault and its triage; Retail's planner is refused", {
    when() {
        const rendered = asUser(users.planner, () => page("Requests/RequestDetail", {requestId: ids.openRequestId}))
        const retail = asUser(users.retailPlanner, () => page("Requests/RequestDetail", {requestId: ids.openRequestId}, "html"))
        return {rendered, retail}
    },
    then({rendered, retail}) {
        rendered.errors.length == 0
        rendered.output.includes("Compressor leaking oil")
        rendered.output.includes("Compressor C-1")
        rendered.output.includes("Not triaged yet")
        rendered.output.includes("Create work order")
        rendered.output.includes("Add to a work order")
        rendered.output.includes("Reject")
        retail.output.includes("not available in Maintenance")
        !retail.output.includes("Create work order")
    }
})

feature(
    "the reporter follows a maintenance request in Commons: its work order's name and status, never its time, people or another report",
    {
        when() {
            const rendered = asUser(users.requester, () =>
                page("Requests/RequestDetail", {requestId: ids.triagedRequestId}, "qvt", "Commons")
            )
            return {rendered}
        },
        then({rendered}) {
            rendered.errors.length == 0
            rendered.output.includes("Air handler dripping water")
            rendered.output.includes("Your report")
            rendered.output.includes("Air handler coil leak · In Progress")
            // nothing of the work beyond that: no technician, no time, no other report of the same fault
            !rendered.output.includes("Traced the leak to the coil header")
            !rendered.output.includes("Maintenance Technician")
            !rendered.output.includes("Air handler rattles")
            !rendered.output.includes(ids.otherReportId)
        }
    }
)

feature("Report a problem is in the requester's + menu, not another user's, and makes their request", {
    when() {
        const quickCreate = user =>
            JSON.stringify(
                asUser(user, () =>
                    JSON.parse(
                        ec.screen.makeTest().rootScreen("component://webroot/screen/webroot.xml").render("shellData", {}, null)
                            .output
                    )
                )
            ).includes("maintenanceReportProblem")
        const rendered = asUser(users.requester, () =>
            page("ReportProblem", {recordEntity: "mantle.product.asset.Asset", recordId: ids.compressorId}, "qvt", "Commons")
        )
        const reported = asUser(users.requester, () =>
            page(
                "ReportProblem/reportProblem",
                {
                    targetKey: "asset:" + ids.compressorId,
                    summary: "Compressor guard rattles",
                    priority: "5",
                    operationKey: "spec-mnt-report"
                },
                "json",
                "Commons"
            )
        )
        const made = system(
            () =>
                Array.from(
                    ec.entity
                        .find("mantle.request.Request")
                        .condition("requestName", "Compressor guard rattles")
                        .condition("filedByPartyId", "BOSS_MNT_REQUESTER")
                        .list()
                ).length
        )
        return {requester: quickCreate(users.requester), planner: quickCreate(users.planner), rendered, reported, made}
    },
    then({requester, planner, rendered, reported, made}) {
        requester == true
        planner == false
        rendered.errors.length == 0
        rendered.output.includes("What is wrong")
        rendered.output.includes("Or scan its tag")
        reported.output.includes("Problem reported as request")
        made == 1
    }
})
