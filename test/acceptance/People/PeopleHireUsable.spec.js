// People P6's "usable when" (impl-people P6; design-people §4 HireEmployee and EmploymentChange, §14.3 "Hire, complete a legacy
// relationship and rehire" and "Transfer, manager change and separation", without the tasks and access requests of P7), as an
// acceptance walk with artifact authorization on: people.hr hires the demo contractor (Nadia Kowal) beside her contractor
// relationship, completes an orphan employee relationship without a second one and rehires a leaver (Walter Pruitt) beside his
// ended employment, no login made by any of them; people.hr asks for Tomas Lindqvist's transfer to Merchandising, may not decide it,
// and his manager Hannah Okafor (people.manager) approves it from her notice, after which his assignment, department and line move
// from its date; people.hr separates Priya Natarajan from Retail (decided by the employer's HR fallback, Hannah) while her Services
// employment stays. The calls are the Mantle services the wizards call (mantle.humanres.PeopleServices), as each user; the screens
// are rendered for what they show. The rules are Mantle's PeopleEmployment and mr-boss's PeopleHire and PeopleAccess; the browser's
// golden path is the client walk PeopleHireWalk.
// Run: ./moq accept mr-boss --spec PeopleHireUsable
const lib = ec.resource.script("component://mr-boss/test/People/PeopleSpecLib.js")
const {ids, users, asUser, system, invoke, page} = lib
const P = "mantle.humanres.PeopleServices."
const opened = rendered => rendered.status === 200 && rendered.errors.length === 0
const day = 24 * 60 * 60 * 1000
const state = {}
// a Mantle call as the user (the screen's grant opens it; the service checks the user), with its refusal's code ("" when it passes)
function as(user, service, parameters) {
    return asUser(user, () =>
        system(() => {
            ec.message.pushErrors()
            try {
                const out = ec.service.sync().name(service).parameters(parameters).requireNewTransaction(true).call() || {}
                return Object.assign({}, out, {code: ec.message.hasError() ? codeOf(ec.message.getErrorsString()) : ""})
            } catch (error) {
                return {code: codeOf(String(error.message))}
            } finally {
                ec.message.clearErrors()
                ec.message.popErrors()
            }
        })
    )
}
const codeOf = message => /[A-Z][A-Z0-9_]{3,}(?=:)/.exec(message)?.[0] || message
const rows = (entity, conditions) => system(() => Array.from(ec.entity.find(entity).condition(conditions).disableAuthz().list()))
const employments = (partyId, organizationPartyId) =>
    rows("mantle.party.PartyRelationship", {
        relationshipTypeEnumId: "PrtEmployee",
        fromPartyId: partyId,
        toPartyId: organizationPartyId
    })
const revisionOf = partyRelationshipId =>
    system(() =>
        ec.resource.script("component://mr-mantle/service/mantle/humanres/People.js").employmentRevision(partyRelationshipId)
    )

spec({
    setupSpec() {
        login("john.doe")
        const today = ec.user.timestampMillis(ec.user.nowTimestamp)
        state.today = ec.l10n.format(new Date(today), "yyyy-MM-dd")
        state.nextWeek = ec.l10n.format(new Date(today + 7 * day), "yyyy-MM-dd")
        // an orphan: an employee relationship of Retail with no Employment row, as data loaded before People leaves it
        system(() => {
            call("create#mantle.party.Party", {partyId: "PPL_USABLE_ORPHAN", partyTypeEnumId: "PtyPerson"})
            call("create#mantle.party.Person", {partyId: "PPL_USABLE_ORPHAN", firstName: "Olga", lastName: "Orphan"})
            state.orphanRelationship = call("create#mantle.party.PartyRelationship", {
                relationshipTypeEnumId: "PrtEmployee",
                fromPartyId: "PPL_USABLE_ORPHAN",
                fromRoleTypeId: "Employee",
                toPartyId: ids.organizationId,
                toRoleTypeId: "OrgEmployer",
                fromDate: "2024-03-01 09:00:00"
            }).partyRelationshipId
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login("john.doe")
        ec.artifactExecution.enableAuthz()
    }
})

feature(
    "people.hr hires the contractor, completes an orphan relationship without a second one and rehires a leaver, no login made",
    {
        when() {
            const problems = []
            const accountsBefore = rows("moqui.security.UserAccount", {partyId: ids.contractorPartyId}).length
            // the contractor: found by name, her contractor relationship named, hired into the vacant sales associate seat
            const preview = as(users.hr, P + "preview#Hire", {
                organizationPartyId: ids.organizationId,
                partyId: ids.contractorPartyId,
                fromDate: state.today,
                emplPositionId: ids.vacantPositionId,
                managerPartyId: ids.managerPartyId
            })
            if (preview.code || !preview.canHire)
                problems.push(`the contractor's preview: ${preview.code} ${JSON.stringify(preview.findings)}`)
            if (!(preview.findings || []).some(row => row.code === "OTHER_RELATIONSHIP"))
                problems.push("the preview does not name the contractor relationship")
            const terms = {
                organizationPartyId: ids.organizationId,
                partyId: ids.contractorPartyId,
                fromDate: state.today,
                emplPositionId: ids.vacantPositionId,
                managerPartyId: ids.managerPartyId,
                operationKey: "USABLE-HIRE-NADIA"
            }
            const hired = as(users.hr, P + "hire#Employee", terms)
            if (hired.code) problems.push(`the contractor's hire: ${hired.code}`)
            const again = as(users.hr, P + "hire#Employee", terms)
            if (!again.repeated || again.partyRelationshipId !== hired.partyRelationshipId)
                problems.push(`a second Hire made another: ${JSON.stringify(again)}`)
            if (employments(ids.contractorPartyId, ids.organizationId).length !== 1)
                problems.push("the contractor has more than one employment")
            if (
                !rows("mantle.party.PartyRelationship", {
                    relationshipTypeEnumId: "PrtAgent",
                    fromPartyId: ids.contractorPartyId
                }).some(row => !row.thruDate)
            )
                problems.push("the contractor relationship ended")
            if (rows("moqui.security.UserAccount", {partyId: ids.contractorPartyId}).length !== accountsBefore)
                problems.push("a login was made for the hire")
            // her record: the department of the seat, the manager, Change employment for HR
            const record = asUser(users.hr, () =>
                page(
                    "Employees/Employee360",
                    {partyId: ids.contractorPartyId, partyRelationshipId: hired.partyRelationshipId},
                    "html"
                )
            )
            if (!opened(record)) problems.push(`Nadia's record: ${record.status} ${record.errors}`)
            for (const text of ["Nadia Kowal", "Store Operations", "Sales associate 3", "Hannah Okafor", "Hire"])
                if (!record.output.includes(text)) problems.push(`Nadia's record does not show ${text}`)
            // the orphan relationship: completed, not duplicated
            const orphanPlan = as(users.hr, P + "preview#Hire", {
                organizationPartyId: ids.organizationId,
                partyId: "PPL_USABLE_ORPHAN"
            })
            if (orphanPlan.plan !== "complete") problems.push(`the orphan's plan: ${orphanPlan.plan}`)
            const completed = as(users.hr, P + "hire#Employee", {
                organizationPartyId: ids.organizationId,
                partyId: "PPL_USABLE_ORPHAN",
                departmentPartyId: ids.departmentId
            })
            if (completed.code || completed.partyRelationshipId !== state.orphanRelationship)
                problems.push(`the orphan's completion: ${completed.code} ${completed.partyRelationshipId}`)
            if (employments("PPL_USABLE_ORPHAN", ids.organizationId).length !== 1)
                problems.push("the orphan has a second relationship")
            // the leaver: rehired beside the ended employment, which stays as it was
            const before = employments(ids.endedPartyId, ids.organizationId)
            const rehired = as(users.hr, P + "hire#Employee", {
                organizationPartyId: ids.organizationId,
                partyId: ids.endedPartyId,
                fromDate: state.today,
                departmentPartyId: "BOSS_PPL_D_MERCH",
                reason: "Rehired for the season"
            })
            if (rehired.code || rehired.plan !== "rehire") problems.push(`the rehire: ${rehired.code} ${rehired.plan}`)
            const after = employments(ids.endedPartyId, ids.organizationId)
            if (after.length !== before.length + 1)
                problems.push(`the leaver's employments: ${before.length} then ${after.length}`)
            if (!after.some(row => row.partyRelationshipId === before[0]?.partyRelationshipId && row.thruDate))
                problems.push("the ended employment changed")
            // an overlapping hire of the contractor is refused
            const overlap = as(users.hr, P + "hire#Employee", {
                organizationPartyId: ids.organizationId,
                partyId: ids.contractorPartyId
            })
            if (overlap.code !== "EMPLOYMENT_OVERLAP") problems.push(`an overlapping hire: ${overlap.code || "accepted"}`)
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)

feature(
    "people.hr asks for Tomas's transfer, may not decide it, and Hannah approves it from her notice; it applies from its date",
    {
        when() {
            const problems = []
            const transfer = {
                partyRelationshipId: ids.employmentId,
                changeKind: "transfer",
                effectiveDate: state.nextWeek,
                departmentPartyId: "BOSS_PPL_D_MERCH",
                emplPositionId: "",
                reason: "Joins merchandising"
            }
            // the wizard's last step as HR reads it, then the request at the revision read
            const step = asUser(users.hr, () =>
                page("Employees/EmploymentChange/Change", {
                    partyRelationshipId: ids.employmentId,
                    changeKind: "transfer",
                    lastStandalone: "true"
                })
            )
            if (!opened(step) || !step.output.includes("Now: Store Operations"))
                problems.push(`the Change step: ${step.status} ${step.errors}`)
            const stale = as(users.hr, P + "apply#EmploymentChange", Object.assign({}, transfer, {expectedRevision: "0"}))
            if (stale.code !== "REVISION_CHANGED") problems.push(`a stale request: ${stale.code || "accepted"}`)
            const asked = as(
                users.hr,
                P + "apply#EmploymentChange",
                Object.assign({}, transfer, {expectedRevision: revisionOf(ids.employmentId)})
            )
            if (asked.code || asked.statusId !== "EchRequested") problems.push(`the request: ${asked.code} ${asked.statusId}`)
            const hrDecides = as(users.hr, P + "decide#EmploymentChange", {employmentChangeId: asked.employmentChangeId})
            if (hrDecides.code !== "SELF_APPROVAL") problems.push(`HR's own decision: ${hrDecides.code || "accepted"}`)
            // Hannah: her Approvals list, Tomas's record with Approve, then her notice approved
            const approvals = asUser(users.manager, () => page("Approvals", {}, "html"))
            if (!approvals.output.includes("Tomas Lindqvist")) problems.push("Hannah's Approvals do not list the transfer")
            const record = asUser(users.manager, () => page("Employees/Employee360", {partyId: ids.employeePartyId}, "html"))
            for (const text of ["Employment changes", "Waiting for approval", "Approve"])
                if (!record.output.includes(text)) problems.push(`Tomas's record for Hannah does not show ${text}`)
            const notice = rows("moqui.security.user.NotificationMessage", {
                topic: "PeopleEmploymentChangeApproval",
                recordId: asked.employmentChangeId
            })[0]
            const approved = as(users.manager, "org.moqui.ui.NotificationServices.approve#NotificationMessage", {
                notificationMessageId: notice?.notificationMessageId
            })
            if (approved.code) problems.push(`Hannah's approval: ${approved.code}`)
            const change = rows("mantle.humanres.employment.EmploymentChange", {employmentChangeId: asked.employmentChangeId})[0]
            if (change?.statusId !== "EchApplied") problems.push(`the transfer: ${change?.statusId}`)
            // from next week: Merchandising, the seat left, the line kept (Hannah stays his manager)
            const assignments = rows("mantle.humanres.employment.EmploymentAssignment", {partyRelationshipId: ids.employmentId})
            if (!assignments.some(row => row.departmentPartyId === "BOSS_PPL_D_MERCH" && !row.emplPositionId))
                problems.push("no assignment in Merchandising")
            if (
                !rows("mantle.party.PartyRelationship", {
                    relationshipTypeEnumId: "PrtMember",
                    fromPartyId: ids.employeePartyId,
                    toPartyId: "BOSS_PPL_D_MERCH"
                }).length
            )
                problems.push("no membership of Merchandising")
            // a manager change that would loop is refused
            const loop = as(users.hr, P + "apply#EmploymentChange", {
                partyRelationshipId: "BOSS_PPL_HANNAH_EMP",
                changeKind: "manager",
                effectiveDate: state.today,
                managerPartyId: ids.employeePartyId,
                expectedRevision: revisionOf("BOSS_PPL_HANNAH_EMP")
            })
            if (loop.code !== "REPORTING_CYCLE") problems.push(`a looping manager change: ${loop.code || "accepted"}`)
            return {problems}
        },
        then({problems}) {
            problems.join("\n") == ""
        }
    }
)

feature("people.hr separates Priya from Retail, decided by the HR fallback; her Services employment stays", {
    when() {
        const problems = []
        // Priya's manager at Retail (Greta) has no login: the employer's HR fallback for employment changes is Hannah
        const rule = as(users.admin, "mantle.humanres.PeopleApprovalServices.store#Policy", {
            organizationPartyId: ids.organizationId,
            approvalKindEnumId: "PakEmploymentChange",
            approverRoleEnumId: "ParHrFallback",
            approverPartyId: ids.managerPartyId,
            fromDate: state.today
        })
        if (rule.code) problems.push(`the HR fallback rule: ${rule.code}`)
        const retail = employments(ids.dualPartyId, ids.organizationId)[0]
        const preview = as(users.hr, P + "preview#EmploymentChange", {
            partyRelationshipId: retail.partyRelationshipId,
            changeKind: "separation",
            effectiveDate: state.today,
            terminationTypeEnumId: "TtResigned",
            reason: "Moves to Services full time"
        })
        if (!(preview.impact || []).some(row => row.kind === "otherEmployment"))
            problems.push("the impact does not keep her other employment")
        if (!(preview.impact || []).some(row => row.kind === "units"))
            problems.push("the impact does not name the unit she leads")
        const asked = as(users.hr, P + "apply#EmploymentChange", {
            partyRelationshipId: retail.partyRelationshipId,
            changeKind: "separation",
            effectiveDate: state.today,
            terminationTypeEnumId: "TtResigned",
            reason: "Moves to Services full time",
            expectedRevision: revisionOf(retail.partyRelationshipId)
        })
        if (asked.code || asked.statusId !== "EchRequested") problems.push(`the separation: ${asked.code} ${asked.statusId}`)
        const decided = as(users.manager, P + "decide#EmploymentChange", {employmentChangeId: asked.employmentChangeId})
        if (decided.code || !decided.applied) problems.push(`the fallback's decision: ${decided.code} ${decided.applied}`)
        if (!employments(ids.dualPartyId, ids.organizationId)[0]?.thruDate) problems.push("the Retail employment did not end")
        if (employments(ids.dualPartyId, ids.otherOrganizationId).some(row => row.thruDate))
            problems.push("the Services employment ended")
        // her lead of Merchandising ended; her line at Services (Amara) stays
        if (
            rows("mantle.party.PartyRelationship", {
                relationshipTypeEnumId: "PrtMember",
                fromPartyId: ids.dualPartyId,
                toPartyId: "BOSS_PPL_D_MERCH"
            }).some(row => !row.thruDate)
        )
            problems.push("she still leads Merchandising")
        const lines = system(() =>
            ec.resource
                .script("component://mr-mantle/service/mantle/humanres/People.js")
                .linesOf({reportPartyIds: [ids.dualPartyId]}, null)
                .filter(line => line.organizationPartyIds.includes(ids.otherOrganizationId))
                .map(line => line.managerPartyId)
        )
        if (!lines.includes("BOSS_PPL_AMARA")) problems.push(`her Services line: ${lines}`)
        // her record for Retail's HR in the terminal: the Retail employment ended, the separation applied
        const record = asUser(users.hr, () => page("Employees/Employee360", {partyId: ids.dualPartyId}, "tui"))
        if (!opened(record)) problems.push(`Priya's record in the terminal: ${record.status} ${record.errors}`)
        for (const text of ["Ended", "Separation"])
            if (!record.output.includes(text)) problems.push(`Priya's record in the terminal does not show ${text}`)
        return {problems}
    },
    then({problems}) {
        problems.join("\n") == ""
    }
})
