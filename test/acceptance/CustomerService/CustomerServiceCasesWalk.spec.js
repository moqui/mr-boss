// Customer Service P2's "usable when" (impl-customer-service P2), as an acceptance walk through the screens' transitions with
// artifact authorization on: an agent creates a case for Joe Q Public in the Support queue from NewCase, after seeing his
// other open case as a possible duplicate, and opens it in CaseDetail with the customer, queue and priority band; a request
// a customer contact files as Chat files one becomes a case in the Support queue, and an employee's Commons request stays a
// request; a manager moves a case to Waiting for customer on the board and back by the row action, the customer's label
// differing from the agent's; a bulk assignment of three cases, one of another organization, names it Forbidden and assigns
// the other two; completing a case's work tells its assignee and leaves it open; Commons' Resolve and Cancel of a case are
// hidden from a user without SUPPORT_CASE_EDIT; and a privacy request lands in the Privacy queue, which a general agent sees
// neither the case nor the count of. The rules are Mantle's SupportCases and CustomerServiceCases' specs.
// Run: ./moq accept mr-boss --spec CustomerServiceCasesWalk
const lib = ec.resource.script("component://mr-boss/test/CustomerService/CustomerServiceSpecLib.js")
const {ids, users, asUser, system, invoke} = lib
const webroot = "component://webroot/screen/webroot.xml"
const cases = "ironstone.customerservice.CaseServices."
const state = {}
const one = (entity, conditions) => system(() => ec.entity.find(entity).condition(conditions).one())
const current = (entity, conditions) =>
    system(() => Array.from(ec.entity.find(entity).condition(conditions).conditionDate("fromDate", "thruDate", null).list()))
// a transition of a Customer Service screen as the user posts it
function post(user, path, parameters) {
    return asUser(user, () => {
        const rendered = ec.screen
            .makeTest()
            .rootScreen(webroot)
            .render("apps/CustomerService/" + path, parameters, "post")
        const result = {status: rendered.status, errors: Array.from(rendered.errorMessages || []).join(" | ")}
        ec.message.clearErrors()
        return result
    })
}
// wait for the case rule, which runs after the commit
function profileOf(requestId) {
    const end = Date.now() + 4000
    let profile = one("mantle.request.support.CaseProfile", {requestId})
    while (!profile && Date.now() < end) profile = one("mantle.request.support.CaseProfile", {requestId})
    return profile
}

feature("the agent creates a case for Joe from NewCase after its duplicate warning, and opens it in CaseDetail", {
    when() {
        const warning = asUser(users.agent, () => lib.page("Cases/NewCase", {customerPartyId: ids.customerId}))
        const created = post(users.agent, "Cases/NewCase/createCase", {
            organizationPartyId: ids.organizationId,
            customerPartyId: ids.customerId,
            requestTypeEnumId: "RqtSupport",
            requestCategoryId: ids.supportQueueId,
            requestName: "Thermostat display flickers",
            description: "Joe says the display flickers at night.",
            priority: "2",
            salesChannelEnumId: "ScPhone"
        })
        const request = one("mantle.request.Request", {requestName: "Thermostat display flickers"})
        state.newCaseId = request?.requestId
        const detail = asUser(users.agent, () => lib.page("Cases/CaseDetail", {requestId: state.newCaseId}))
        return {
            warning,
            created,
            request,
            detail,
            profile: one("mantle.request.support.CaseProfile", {requestId: state.newCaseId})
        }
    },
    then({warning, created, request, detail, profile}) {
        warning.output.includes("open case(s)")
        warning.output.includes(ids.filtersCaseId)
        created.errors == ""
        request.requestCategoryId == ids.supportQueueId
        profile != null
        detail.errors == []
        detail.output.includes("Joe Q Public")
        detail.output.includes("Support")
        detail.output.includes("Urgent (2)")
    }
})

feature("a customer contact's request (as Chat files it) is a case in the Support queue; an employee's Commons request is not", {
    when() {
        const chat = asUser(
            "joe@public.com",
            () =>
                invoke("mantle.request.RequestServices.create#Request", {
                    requestName: "Chat: where is my order",
                    statusId: "ReqSubmitted"
                }),
            false
        ).requestId
        const employee = asUser(
            users.read,
            () => invoke("ironstone.commons.RequestServices.raise#Request", {requestName: "Order more printer paper"}),
            false
        ).requestId
        return {
            chatProfile: profileOf(chat),
            chat: one("mantle.request.Request", {requestId: chat}),
            employeeProfile: (() => {
                const end = Date.now() + 500
                let found = null
                while (!found && Date.now() < end) found = one("mantle.request.support.CaseProfile", {requestId: employee})
                return found
            })()
        }
    },
    then({chatProfile, chat, employeeProfile}) {
        chatProfile != null
        chat.requestCategoryId == ids.supportQueueId
        employeeProfile == null
    }
})

feature(
    "the manager moves a case to Waiting for customer on the board and back by the row action; the customer's label differs",
    {
        when() {
            const board = post(users.manager, "Cases/Cases/changeCaseStatus", {
                requestId: state.newCaseId,
                statusId: "ReqWaitingCustomer"
            })
            const waiting = one("mantle.request.Request", {requestId: state.newCaseId}).statusId
            const detail = asUser(
                users.manager,
                () => invoke(cases + "get#CaseDetail", {requestId: state.newCaseId}).detail.theCase
            )
            const row = post(users.manager, "Cases/Cases/changeCaseStatus", {
                requestId: state.newCaseId,
                toStatusId: "ReqInProgress"
            })
            return {board, waiting, detail, row, after: one("mantle.request.Request", {requestId: state.newCaseId}).statusId}
        },
        then({board, waiting, detail, row, after}) {
            board.errors == ""
            waiting == "ReqWaitingCustomer"
            detail.statusLabel == "Waiting for customer"
            detail.customerStatusLabel == "Waiting for your reply"
            row.errors == ""
            after == "ReqInProgress"
        }
    }
)

feature("a bulk assignment of three cases, one of another organization, names it Forbidden and assigns the other two", {
    when() {
        const bulk = asUser(users.manager, () =>
            invoke(cases + "apply#CaseBatch", {
                requestIds: [state.newCaseId, ids.filtersCaseId, ids.otherCaseId],
                operation: "assign",
                assigneePartyId: "BOSS_CS_AGENT_WH"
            })
        )
        const assignee = requestId =>
            current("mantle.request.RequestParty", {requestId, roleTypeId: "Assignee"})[0]?.partyId || null
        return {bulk, first: assignee(state.newCaseId), second: assignee(ids.filtersCaseId), other: assignee(ids.otherCaseId)}
    },
    then({bulk, first, second, other}) {
        bulk.results.find(row => row.requestId == ids.otherCaseId).outcome == "Forbidden"
        bulk.doneCount == 2
        first == "BOSS_CS_AGENT_WH"
        second == "BOSS_CS_AGENT_WH"
        other == null
    }
})

feature("completing a case's work tells its assignee and leaves the case open", {
    when() {
        const added = post(users.agentWarehouse, "Cases/CaseDetail/addTask", {
            requestId: state.newCaseId,
            workEffortName: "Check the display unit"
        })
        const link = system(
            () => Array.from(ec.entity.find("mantle.request.RequestWorkEffort").condition("requestId", state.newCaseId).list())[0]
        )
        system(() => invoke("mantle.work.TaskServices.set#TaskStatus", {workEffortId: link.workEffortId, statusId: "WeComplete"}))
        const notices = system(() =>
            Array.from(
                ec.entity
                    .find("moqui.security.user.NotificationMessage")
                    .condition("topic", "RequestUpdate")
                    .condition("messageJson", "like", "%" + state.newCaseId + "%")
                    .list()
            )
        )
        return {added, link, notices, status: one("mantle.request.Request", {requestId: state.newCaseId}).statusId}
    },
    then({added, link, notices, status}) {
        added.errors == ""
        link != null
        notices.length >= 1
        status == "ReqInProgress"
    }
})

feature("Commons' Resolve and Cancel of a case are hidden from a user without SUPPORT_CASE_EDIT, who is sent to the case", {
    when() {
        return asUser(users.read, () => {
            const rendered = ec.screen
                .makeTest()
                .rootScreen("component://mr-boss/screen/Commons.xml")
                .renderMode("qvt")
                .withStaticData()
                .render("Requests/RequestDetail", {requestId: ids.filtersCaseId, lastStandalone: "-2"}, null)
            return {status: rendered.status, output: String(rendered.output || "")}
        })
    },
    then({status, output}) {
        status == 200
        output.includes("This request is a support case: it is resolved or cancelled in Customer Service.")
        !output.includes("ReqCancelled")
    }
})

feature("a privacy request lands in the Privacy queue; a general agent sees neither the case nor its count", {
    when() {
        const requestId = asUser(
            "joe@public.com",
            () =>
                invoke("mantle.request.RequestServices.create#Request", {
                    requestName: "Send me a copy of my data",
                    requestTypeEnumId: "RqtPrivacy",
                    statusId: "ReqSubmitted"
                }),
            false
        ).requestId
        const profile = profileOf(requestId)
        const agentAll = asUser(users.agent, () =>
            Array.from(invoke(cases + "find#Cases", {view: "all"}).cases).map(row => row.requestId)
        )
        const agentQueues = asUser(users.agent, () =>
            Array.from(invoke(cases + "get#QueueCounts", {}).queueRows).map(row => row.requestCategoryId)
        )
        const team = asUser(users.admin, () =>
            Array.from(invoke(cases + "find#Cases", {view: "all", requestCategoryId: ids.privacyQueueId}).cases).map(
                row => row.requestId
            )
        )
        return {requestId, profile, agentAll, agentQueues, team}
    },
    then({requestId, profile, agentAll, agentQueues, team}) {
        profile.intakeCategoryId == ids.privacyQueueId
        !agentAll.includes(requestId)
        !agentQueues.includes(ids.privacyQueueId)
        team.includes(requestId)
    }
})
