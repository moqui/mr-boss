// Server-static qvt for the Projects screens (impl-projects.md P11; README "Significant redesigns" 3): ServerStaticLib's full
// check of each plain XML Projects screen with the demo record AppStructure and ProjectsTui use, as john.doe. A screen marked
// server-static="qvt" must come back clean; the others and why are logged. Apart from ServerStatic so each stays well under 30 s.
// Run: ./moq test mr-boss --spec ProjectsServerStatic
const lib = ec.resource.script("component://mr-boss/test/ServerStaticLib.js")
let screens

const demoParameters = {
    "Projects/Reports/Sprints": {rootWorkEffortId: "IRON"},
    "Projects/Reports/Progress": {rootWorkEffortId: "IRON"},
    "Projects/Projects/List": {list: "all"},
    "Projects/Projects/ProjectDetail": {workEffortId: "IRON"},
    "Projects/Projects/ProjectDetail/Overview": {workEffortId: "IRON"},
    "Projects/Projects/ProjectDetail/Team": {workEffortId: "IRON"},
    "Projects/Projects/ProjectDetail/Files": {workEffortId: "IRON"},
    "Projects/Projects/ProjectDetail/Settings": {workEffortId: "IRON"},
    "Projects/Projects/ProjectDetail/Code": {workEffortId: "IRON"},
    "Projects/Projects/ProjectDetail/Plan": {workEffortId: "IRON"},
    "Projects/Projects/ProjectDetail/Plan/CalendarTui": {workEffortId: "IRON", date: "2026-10-26"},
    "Projects/Projects/ProjectDetail/Money": {workEffortId: "ACME"},
    "Projects/Projects/StatusReport": {workEffortId: "IRON"},
    "Projects/Projects/EstimatePrint": {workEffortId: "ACME"},
    "Projects/Projects/MilestoneDetail": {workEffortId: "IRON-MS-1"},
    "Projects/Projects/ReleaseDetail": {workEffortId: "IRON-REL-2"},
    "Projects/WorkItems/List": {rootWorkEffortId: "IRON", list: "all"},
    "Projects/QuickCreate": {kind: "workItem"},
    "Projects/Requests": {list: "all"},
    "Projects/Requests/List": {list: "all"},
    "Projects/Requests/RequestDetail": {requestId: "BOSS_DEMO_PREQ_ACME1"},
    "Projects/Code/Repositories": {list: "all"},
    "Projects/Code/RepositoryDetail": {repositoryId: "iron"},
    "Projects/Code/RepositoryDetail/Files": {repositoryId: "iron"},
    "Projects/Code/RepositoryDetail/Commits": {repositoryId: "iron"},
    "Projects/Code/RepositoryDetail/Branches": {repositoryId: "iron"},
    "Projects/Code/RepositoryDetail/Tags": {repositoryId: "iron"},
    "Projects/Code/RepositoryDetail/MergeRequests": {repositoryId: "iron", list: "all"},
    "Projects/Code/RepositoryDetail/Activity": {repositoryId: "iron"},
    "Projects/Code/RepositoryDetail/Settings": {repositoryId: "iron"},
    "Projects/Code/Compare": {repositoryId: "iron", head: "IRON-3-expand-collapse"},
    "Projects/Code/CommitDetail": {repositoryId: "iron", commitId: "main"},
    "Projects/Code/MergeRequests": {list: "all"},
    "Projects/WorkItems/BacklogTui": {rootWorkEffortId: "IRON"},
    "Projects/WorkItems/SprintDetail": {workEffortId: "IRON-SP-2"},
    "Projects/WorkItems/SprintReport": {workEffortId: "IRON-SP-1"},
    "Projects/WorkItems/TimelineTui": {rootWorkEffortId: "IRON"},
    "Projects/Time/Timesheets": {list: "toApprove"},
    "Projects/Time/TeamTimesheet": {itemId: "SUPP-1"},
    "Projects/Time/TimeEntries": {list: "all"},
    "Projects/Resources/Allocations": {list: "all"},
    "Projects/Resources/PersonDetail": {partyId: "ORG_ZIZI_JD"},
    "Projects/Resources/PersonDetail/Overview": {partyId: "ORG_ZIZI_JD"},
    "Projects/Resources/PersonDetail/Allocations": {partyId: "ORG_ZIZI_JD"},
    "Projects/Resources/PersonDetail/WorkItems": {partyId: "ORG_ZIZI_JD"},
    "Projects/Resources/PersonDetail/Time": {partyId: "ORG_ZIZI_JD"},
    "Projects/Resources/PersonDetail/Capacity": {partyId: "ORG_ZIZI_JD"},
    "Projects/Billing/Unbilled/CreateInvoice": {workEffortId: "SUPP"},
    "Projects/Billing/Invoices": {list: "all"}
}

spec({
    setupSpec() {
        login("john.doe")
        screens = lib.screens(["Projects"])
    }
})

feature("the full check of every Projects XML screen; each one marked server-static is clean", {
    when() {
        return {rows: lib.check(screens, (app, path) => demoParameters[`${app}/${path}`])}
    },
    then({rows}) {
        rows.length > 40
        lib.unclean(rows) == ""
    }
})
