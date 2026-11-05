// Customer Service cases (impl-customer-service P2; CaseServices, ConfigurationServices, CaseGuard.js; the case rules are
// Mantle's, tested in mr-mantle test/request/SupportCases): the demo cases made by the rule; find#Cases by view, the Recent
// cases read and the queue counts in the user's scope; apply#CaseBatch naming each case's outcome (another organization's
// Forbidden, the others done); the Today source in place of Commons' request row; the paths around a case in Commons and
// Projects (a requester's cancel, a non-holder's resolve and a due date refused, a raise that would be a case refused its
// due date); the settings reads; and the one render of CaseDetail's Customer Service section and of NewCase's duplicate
// warning (qvt). Run: ./moq test mr-boss --spec CustomerService/CustomerServiceCases
const lib = ec.resource.script("component://mr-boss/test/CustomerService/CustomerServiceSpecLib.js")
const {ids, users, asUser, system, refusal, invoke} = lib
const cases = "ironstone.customerservice.CaseServices."
const caseIds = result => Array.from(result.cases || []).map(row => row.requestId)

spec({
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature("the demo requests are cases: their profiles, the Privacy request in the restricted Privacy queue", {
    when() {
        return system(() => ({
            profiles: [ids.thermostatCaseId, ids.filtersCaseId, ids.pickCaseId, ids.privacyCaseId, ids.otherCaseId].filter(
                requestId => ec.entity.find("mantle.request.support.CaseProfile").condition("requestId", requestId).count() > 0
            ),
            privacy: ec.entity.find("mantle.request.Request").condition("requestId", ids.privacyCaseId).one().requestCategoryId,
            org: ec.entity
                .find("mantle.request.RequestParty")
                .condition({requestId: ids.thermostatCaseId, roleTypeId: "OrgInternal"})
                .one()
        }))
    },
    then({profiles, privacy, org}) {
        profiles.length == 5
        privacy == ids.privacyQueueId
        org.partyId == ids.organizationId
    }
})

feature(
    "find#Cases by the user's queues: the agent's own and the team's, none for the reader, the Privacy case for its team only",
    {
        when() {
            const find = (user, parameters) => asUser(user, () => caseIds(invoke(cases + "find#Cases", parameters)))
            return {
                mine: find(users.agent, {}),
                all: find(users.agent, {view: "all"}),
                waiting: find(users.manager, {view: "waiting"}),
                unassigned: find(users.manager, {view: "unassigned"}),
                reader: find(users.read, {view: "all"}),
                services: find(users.services, {view: "all"}),
                admin: find(users.admin, {view: "all", requestCategoryId: ids.privacyQueueId}),
                recent: find(users.agent, {recentFor: ids.customerId, excludeRequestId: ids.thermostatCaseId}),
                recentOther: find(users.agent, {recentFor: ids.otherCustomerId}),
                counts: asUser(users.agent, () => invoke(cases + "get#QueueCounts", {}))
            }
        },
        then(r) {
            r.mine.includes(ids.thermostatCaseId)
            !r.mine.includes(ids.filtersCaseId)
            r.all.includes(ids.filtersCaseId)
            !r.all.includes(ids.privacyCaseId)
            !r.all.includes(ids.otherCaseId)
            r.waiting.includes(ids.pickCaseId)
            r.unassigned.includes(ids.filtersCaseId)
            !r.unassigned.includes(ids.thermostatCaseId)
            r.reader == []
            r.services == [ids.otherCaseId]
            r.admin == [ids.privacyCaseId]
            r.recent.includes(ids.filtersCaseId)
            r.recentOther == []
            r.counts.queueRows.map(row => row.requestCategoryId) == [ids.supportQueueId]
            r.counts.openCount >= 3
        }
    }
)

feature(
    "apply#CaseBatch assigns the manager's selected cases and names another organization's Forbidden; a retry answers the first",
    {
        when() {
            const parameters = {
                requestIds: [ids.filtersCaseId, ids.pickCaseId, ids.otherCaseId],
                operation: "assign",
                assigneePartyId: "BOSS_CS_AGENT",
                operationKey: "cs-p2-batch-1"
            }
            const first = asUser(users.manager, () => invoke(cases + "apply#CaseBatch", parameters))
            const again = asUser(users.manager, () => invoke(cases + "apply#CaseBatch", parameters))
            const outsider = asUser(users.manager, () =>
                invoke(cases + "apply#CaseBatch", {
                    requestIds: [ids.filtersCaseId],
                    operation: "assign",
                    assigneePartyId: "BOSS_CS_READ"
                })
            )
            const assignee = system(
                () =>
                    ec.entity
                        .find("mantle.request.RequestParty")
                        .condition({requestId: ids.filtersCaseId, roleTypeId: "Assignee"})
                        .conditionDate("fromDate", "thruDate", null)
                        .one()?.partyId
            )
            return {first, again, outsider, assignee}
        },
        then({first, again, outsider, assignee}) {
            first.results.map(row => row.requestId + ":" + row.outcome) ==
                [ids.filtersCaseId + ":Done", ids.pickCaseId + ":Done", ids.otherCaseId + ":Forbidden"]
            first.doneCount == 2
            again.alreadyApplied == true
            outsider.results[0].outcome == "AssigneeUnavailable"
            assignee == "BOSS_CS_AGENT"
        }
    }
)

feature("Today: the agent's due case in Customer Service's source, not in Commons' request rows", {
    when() {
        system(() =>
            ec.service
                .sync()
                .name("update#mantle.request.Request")
                .parameters({requestId: ids.thermostatCaseId, responseRequiredDate: new Date(Date.now() - 3600000)})
                .call()
        )
        const ours = asUser(users.agent, () => invoke(cases + "get#TodayItems", {}).items.map(item => item.requestId))
        const commons = asUser(
            users.agent,
            () => invoke("mantle.request.RequestServices.get#UserTodayRequests", {}).items.map(item => item.requestId),
            false
        )
        const reader = asUser(users.read, () => invoke(cases + "get#TodayItems", {}).items)
        return {ours, commons, reader}
    },
    then({ours, commons, reader}) {
        ours.includes(ids.thermostatCaseId)
        !commons.includes(ids.thermostatCaseId)
        reader == []
    }
})

feature(
    "the paths around a case: a requester's cancel, a resolve without SUPPORT_CASE_EDIT and a due date refused, a holder's routed",
    {
        when() {
            const joe = "joe@public.com"
            return {
                // Commons: Joe raised the filters case; his cancel is Customer Service's
                cancel: asUser(
                    joe,
                    () =>
                        refusal("ironstone.commons.RequestServices.set#RequestStatus", {
                            requestId: ids.filtersCaseId,
                            toStatusId: "ReqCancelled"
                        }),
                    false
                ),
                // Commons' raise of a request that would be a case takes no due date; without one it is made
                raiseDue: asUser(
                    joe,
                    () =>
                        refusal("ironstone.commons.RequestServices.raise#Request", {
                            requestName: "My order is late",
                            responseRequiredDate: new Date(Date.now() + 86400000)
                        }),
                    false
                ),
                // a non-holder's resolve and a due date through Projects' triage (with artifact authorization off, its own check
                // is the triager's)
                resolve: asUser(
                    joe,
                    () =>
                        system(() => {
                            const guard = ec.resource.script("component://mr-boss/service/ironstone/customerservice/CaseGuard.js")
                            try {
                                guard.resolve(ids.filtersCaseId, "ReqCompleted", "RrCompleted", null)
                                return ""
                            } catch (error) {
                                return error.message
                            }
                        }),
                    false
                ),
                due: system(() => {
                    const guard = ec.resource.script("component://mr-boss/service/ironstone/customerservice/CaseGuard.js")
                    try {
                        guard.refuseDue(ids.filtersCaseId)
                        return ""
                    } catch (error) {
                        return error.message
                    }
                }),
                plainDue: system(() => {
                    const guard = ec.resource.script("component://mr-boss/service/ironstone/customerservice/CaseGuard.js")
                    try {
                        guard.refuseDue("BOSS_DEMO_PREQ_ACME1")
                        return ""
                    } catch (error) {
                        return error.message
                    }
                }),
                // a holder (the agent) has the cancel routed through transition#Case, which needs its reason
                routed: asUser(users.agent, () =>
                    system(() => {
                        const guard = ec.resource.script("component://mr-boss/service/ironstone/customerservice/CaseGuard.js")
                        ec.message.pushErrors()
                        try {
                            guard.resolve(ids.pickCaseId, "ReqInProgress", null, null)
                            return ec.message.getErrorsString() || ""
                        } catch (error) {
                            return error.message
                        } finally {
                            ec.message.clearErrors()
                            ec.message.popErrors()
                        }
                    })
                ),
                status: system(
                    () => ec.entity.find("mantle.request.Request").condition("requestId", ids.filtersCaseId).one().statusId
                )
            }
        },
        then(r) {
            r.cancel.includes("CASE_IN_CUSTOMER_SERVICE")
            r.raiseDue.includes("CASE_DUE_DATE")
            r.resolve.includes("CASE_IN_CUSTOMER_SERVICE")
            r.due.includes("CASE_DUE_DATE")
            r.plainDue == ""
            r.routed == ""
            r.status == "ReqSubmitted"
        }
    }
)

feature("the settings reads: readiness, the queue tree and the teams, a team's change for its manager", {
    when() {
        const settings = asUser(
            users.admin,
            () =>
                invoke("ironstone.customerservice.ConfigurationServices.get#ServiceSettings", {
                    organizationPartyId: ids.organizationId
                }).settings
        )
        const queues = asUser(
            users.admin,
            () =>
                invoke("ironstone.customerservice.ConfigurationServices.find#ServiceQueues", {
                    organizationPartyId: ids.organizationId
                }).queues
        )
        const teams = asUser(
            users.manager,
            () => invoke("ironstone.customerservice.ConfigurationServices.get#ServiceTeam", {}).teams
        )
        return {settings, queues, teams}
    },
    then({settings, queues, teams}) {
        settings.readiness.every(row => row.ready)
        settings.types.find(row => row.requestTypeEnumId == "RqtSupport").serviceEnabled == "Y"
        settings.mappings.find(row => row.statusId == "ReqWaitingCustomer").statusCategoryEnumId == "CscPaused"
        queues.map(row => row.requestCategoryId).includes(ids.privacyQueueId)
        teams.find(row => row.teamPartyId == ids.supportTeamId).canChange == true
        teams.find(row => row.teamPartyId == "BOSS_CS_TEAM_PRIVACY").canChange == false
        // P4: the Support team's working hours, which its queue's clocks count on
        teams.find(row => row.teamPartyId == ids.supportTeamId).hoursText == "Mon-Fri 09:00-17:00 (America/Chicago)"
        settings.readiness.find(row => row.key == "levels").ready
    }
})

feature("CaseDetail's Customer Service section and NewCase's duplicate warning render for the agent (qvt)", {
    when() {
        const detail = asUser(users.agent, () => lib.page("Cases/CaseDetail", {requestId: ids.thermostatCaseId}))
        const newCase = asUser(users.agent, () => lib.page("Cases/NewCase", {customerPartyId: ids.customerId}))
        return {detail, newCase}
    },
    then({detail, newCase}) {
        detail.status == 200
        detail.errors == []
        detail.output.includes("Thermostat shows the wrong temperature")
        detail.output.includes("Joe Q Public")
        detail.output.includes("High (3)")
        detail.output.includes("The customer sees: Received")
        detail.output.includes("Recent cases of")
        // P4: the clocks beside the header and the Service level tab
        detail.output.includes("First response:")
        detail.output.includes("Service level")
        newCase.status == 200
        newCase.errors == []
        newCase.output.includes("open case(s)")
        newCase.output.includes(ids.filtersCaseId)
        newCase.output.includes("Create case")
    }
})
