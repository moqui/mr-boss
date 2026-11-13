// People P21's "usable when" (impl-people P21; design-people §4 Grievances, §13 RequestDetail, §14.3 "Confidentiality across every
// path", its case half), as an acceptance walk with artifact authorization on: Tomas (people.employee) raises a concern from
// Grievances (as a self-service employee opens it, by its own grant); only the intake handler (people.case) sees it: in Grievances'
// list and the case's RequestDetail, its files and its notes; his manager (people.manager), the HR officer (people.hr), the People
// administrator (people.admin) and the instance administrator see nothing of it in Grievances, RequestDetail, the record panels,
// Commons' requests and request detail, the id lookup, the palette, universal search and an agent's screen render (Assist). Then
// the handler asks IT (people.reader stands in for IT) for work on the case: the IT person reads the task, never the case, its
// files or its notes, the task is out of their CalDAV Tasks, and nobody else lists it. The rules themselves are Mantle's
// PeopleCases and mr-boss's PeopleAccessLater.
// Run: ./moq accept mr-boss --spec PeopleCasesUsable
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {users, asUser, system, invoke, page} = lib
const webroot = "component://webroot/screen/webroot.xml"
const grievancesPath = "apps/People/Employees/Grievances/"
const detailPath = "apps/People/Employees/RequestDetail/"
const R = "mantle.request.RequestServices."
const subject = "Acceptance: comments about my accent at the till"
const noteText = "Acceptance: a note on the case"
// a request under the web root as the user (a transition's post, a page), its JSON when it answers one
function request(user, path, parameters, method) {
    return asUser(user, () => {
        const result = ec.screen
            .makeTest()
            .rootScreen(webroot)
            .render(path, parameters || {}, method || null)
        const errors = Array.from(result.errorMessages || []).join(" | ")
        ec.message.clearAll()
        let json = null
        try {
            json = JSON.parse(String(result.output || ""))
        } catch (error) {
            json = null
        }
        return {status: result.status, output: String(result.output || ""), json, errors}
    })
}
const read = (user, service, parameters) => asUser(user, () => system(() => invoke(service, parameters)))
const sees = (user, recordEntityName, recordId) =>
    read(user, "mantle.party.CommunicationServices.get#RecordLinkInfo", {recordEntityName, recordId, checkOnly: true})
        .recordVisible === true
const outsiders = [users.manager, users.hr, users.admin, users.system]
const state = {}

spec({
    stepwise: true,
    setupSpec() {
        login("john.doe")
    }
})

feature("Tomas raises a concern from Grievances and reads his case there", {
    when() {
        const opened = asUser(users.employee, () => page("Employees/Grievances"))
        const filed = request(
            users.employee,
            grievancesPath + "fileCase",
            {
                subject,
                details: "It has happened three times this month.",
                incidentDate: "2026-11-03",
                contactPreference: "By phone"
            },
            "post"
        )
        const mine = read(users.employee, R + "find#PeopleCases", {}).cases || []
        state.requestId = mine.find(row => row.subject === subject)?.requestId
        const detail = asUser(users.employee, () => page("Employees/RequestDetail", {requestId: state.requestId}))
        return {opened, filed, requestId: state.requestId, detail}
    },
    then({opened, filed, requestId, detail}) {
        opened.errors.length == 0 && opened.output.includes("Raise a concern")
        filed.errors == ""
        requestId != null
        detail.errors.length == 0 && detail.output.includes(subject)
    }
})

feature("only the intake handler sees it: the list, the detail, its notes and files; everyone else sees nothing of it", {
    when() {
        const handlerList = (read(users.caseHandler, R + "find#PeopleCases", {}).cases || []).map(row => row.requestId)
        const handlerDetail = asUser(users.caseHandler, () => page("Employees/RequestDetail", {requestId: state.requestId}))
        // the handler's note, and a file of Tomas's
        const note = read(users.caseHandler, R + "add#RequestComment", {requestId: state.requestId, body: noteText})
        state.eventId = note.communicationEventId
        const file = system(() =>
            invoke("create#mantle.request.RequestContent", {requestId: state.requestId, description: "Acceptance file"})
        )
        state.requestContentId = file.requestContentId
        const outside = outsiders.map(user => ({
            user,
            list: (read(user, R + "find#PeopleCases", {}).cases || []).some(row => row.requestId === state.requestId),
            detail: asUser(user, () => page("Employees/RequestDetail", {requestId: state.requestId}, "html")).output.includes(
                subject
            ),
            record: sees(user, "mantle.request.Request", state.requestId),
            note: sees(user, "mantle.party.communication.CommunicationEvent", state.eventId),
            file: sees(user, "mantle.request.RequestContent", state.requestContentId),
            commons: (read(user, "ironstone.commons.RequestServices.find#RequestRows", {list: "all"}).rowList || []).some(
                row => row.requestId === state.requestId
            ),
            commonsDetail: asUser(user, () =>
                page("Requests/RequestDetail", {requestId: state.requestId}, "html", "Commons")
            ).output.includes(subject),
            lookup: !!read(user, "mantle.GeneralServices.lookup#ById", {lookupId: state.requestId}).requestId,
            search: (read(user, "mantle.search.UniversalSearchServices.search#Universal", {q: "accent"}).results || []).some(
                result => String(result.id || "").includes(state.requestId) || String(result.title || "").includes("accent")
            )
        }))
        const seen = outside.filter(one => Object.entries(one).some(([key, value]) => key !== "user" && value === true))
        // an agent's render of the handler's detail (Assist reads the screen): the case's text is not shared with AI
        const agent = asUser(users.caseHandler, () =>
            ec.screen
                .makeTest()
                .rootScreen("component://mr-boss/screen/People.xml")
                .agent()
                .renderMode("tui")
                .render("Employees/RequestDetail", {requestId: state.requestId, lastStandalone: "-2"}, null)
        )
        return {handlerList, handlerDetail, seen, agentOutput: String(agent.output || "")}
    },
    then({handlerList, handlerDetail, seen, agentOutput}) {
        handlerList.includes(state.requestId)
        handlerDetail.errors.length == 0 && handlerDetail.output.includes(subject)
        seen == []
        !agentOutput.includes(subject)
    }
})

feature("the handler asks IT for work on the case: IT reads the task and nothing of the case", {
    when() {
        const asked = read(users.caseHandler, R + "add#PeopleCaseTask", {
            requestId: state.requestId,
            workEffortName: "Acceptance: pull the till camera footage",
            assigneePartyId: "BOSS_PPL_READER"
        })
        state.taskId = asked.workEffortId
        const it = users.reader
        const tags = (read(it, "mantle.work.CalendarDavServices.get#TaskObjectTags").objectList || []).map(
            row => row.workEffortId
        )
        return {
            asked,
            itTask: sees(it, "mantle.work.effort.WorkEffort", state.taskId),
            itCase: [
                sees(it, "mantle.request.Request", state.requestId),
                sees(it, "mantle.party.communication.CommunicationEvent", state.eventId),
                sees(it, "mantle.request.RequestContent", state.requestContentId)
            ],
            itDetail: asUser(it, () => page("Employees/RequestDetail", {requestId: state.requestId}, "html")).output.includes(
                subject
            ),
            inCalDav: tags.includes(state.taskId),
            othersTask: outsiders.map(user => sees(user, "mantle.work.effort.WorkEffort", state.taskId))
        }
    },
    then({asked, itTask, itCase, itDetail, inCalDav, othersTask}) {
        asked.workEffortId != null
        itTask == true
        itCase == [false, false, false]
        itDetail == false
        inCalDav == false
        othersTask == [false, false, false, false]
    }
})
