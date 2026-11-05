// Customer Service assignment reads (impl-customer-service P5, CS-ASSIGNMENT; design-customer-service §9 AgentTeams
// TeamParticipation, AssignmentRules AssignmentRuleList, AssignmentRuleEdit; AssignmentServices.xml): the rules of one of the
// user's organizations with their typed conditions as text, their state and last result, the team members' participation,
// and the choices of the rule and participation forms (each condition field's operators and values). The saves and the
// evaluator are Mantle's mantle.request.SupportCaseServices (save#AssignmentRule, preview#Assignment, save#ServiceTeamMember),
// which the screens call after the shared context.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const cs = ec.resource.script("component://mr-boss/service/ironstone/customerservice/CustomerService.js")
const facilityScope = ec.resource.script("component://mr-mantle/service/mantle/facility/FacilityScope.js")
const mantle = ec.resource.script("component://mr-mantle/service/mantle/request/Assignment.js")
const {find, one, rows, denied, ms} = lib

const RULE = "mantle.request.support.ServiceAssignmentRule"
const dayText = value => (value == null ? "" : ec.l10n.format(new Date(ms(value)), "d MMM yyyy"))
const stampText = value => (value == null ? "" : ec.l10n.format(new Date(ms(value)), "d MMM yyyy HH:mm"))
const listOf = value =>
    value == null
        ? []
        : String(value)
              .split(",")
              .map(s => s.trim())
              .filter(Boolean)
const nowMs = () => Number(ms(ec.user.nowTimestamp))

// The organizations whose settings the user works on (as Configuration.js: those Mantle's saves take), and the one chosen.
function organizationOf(userScope, organizationPartyId) {
    const mantleScope = facilityScope.scope()
    const ids = cs.vendorIds(userScope).filter(partyId => facilityScope.owns(mantleScope, partyId))
    const active = ids.includes(userScope.activeOrganizationPartyId) ? userScope.activeOrganizationPartyId : null
    const chosen = organizationPartyId || active || ids[0] || null
    if (!chosen || !ids.includes(chosen)) denied("RECORD_UNAVAILABLE", "Organization " + (chosen || "") + " is not available")
    return {organizationPartyId: chosen, organizations: ids.map(partyId => ({value: partyId, label: cs.partyName(partyId)}))}
}
const queuesOf = organizationPartyId =>
    cs
        .currentQueues()
        .filter(row => cs.queueOwner(row.requestCategoryId) === organizationPartyId)
        .map(row => ({
            value: row.requestCategoryId,
            label: cs.queueName(row.requestCategoryId),
            team: row.responsibleTeamPartyId
        }))
        .sort((a, b) => a.label.localeCompare(b.label))
const teamsOf = organizationPartyId =>
    Array.from(find("mantle.party.PartyDetailAndRole", {roleTypeId: "OrgTeam", ownerPartyId: organizationPartyId}).list())
        .map(row => ({value: row.partyId, label: row.organizationName || row.partyId}))
        .sort((a, b) => a.label.localeCompare(b.label))

// ===== find#Rules =====
// The organization's assignment rules (design AssignmentRuleList): in effect, starting later and drafts, by queue and order,
// each with its conditions (as rows and as text), distribution, team and members, hours, load and fallback, its state and
// period, and its last result (the cursor's); and the queues and teams the forms choose from.
function findRules(p) {
    const userScope = cs.required()
    const {organizationPartyId, organizations} = organizationOf(userScope, p.organizationPartyId)
    const at = nowMs()
    let query = find(RULE, {organizationPartyId})
    if (p.requestCategoryId) query = query.condition("requestCategoryId", p.requestCategoryId)
    const all = Array.from(query.list()).filter(row => !row.thruDate || Number(ms(row.thruDate)) > at)
    const canEdit = !!userScope.capabilities.policyEdit
    const rules = all
        .map(row => {
            const draft = !row.fromDate
            const future = !draft && Number(ms(row.fromDate)) > at
            const cursor = one("mantle.request.support.ServiceAssignmentCursor", {
                rootRuleId: row.rootRuleId || row.assignmentRuleId
            })
            const conditions = mantle.conditionsOf(row.assignmentRuleId).map(condition =>
                Object.assign(lib.map(condition), {
                    text: mantle.conditionText(condition),
                    assignmentRuleId: row.assignmentRuleId,
                    organizationPartyId
                })
            )
            const queueTeam = cs
                .currentQueues()
                .find(queue => queue.requestCategoryId === row.requestCategoryId)?.responsibleTeamPartyId
            const teamPartyId = row.eligibleTeamPartyId || queueTeam || null
            const only = listOf(row.eligiblePartyIds)
            return {
                assignmentRuleId: row.assignmentRuleId,
                organizationPartyId,
                requestCategoryId: row.requestCategoryId,
                queueName: cs.queueName(row.requestCategoryId),
                ruleName: row.ruleName || row.assignmentRuleId,
                sequenceNum: row.sequenceNum != null ? String(row.sequenceNum) : "",
                distributionEnumId: row.distributionEnumId,
                distributionText: cs.enumText(row.distributionEnumId),
                eligibleTeamPartyId: row.eligibleTeamPartyId || "",
                teamName: teamPartyId ? cs.partyName(teamPartyId) : "No team",
                teamPartyId,
                eligiblePartyIds: only,
                eligibleText: only.length ? only.map(cs.partyName).join(", ") : "Every agent of the team",
                respectSchedule: row.respectSchedule === "N" ? "N" : "Y",
                scheduleText: row.respectSchedule === "N" ? "Any time" : "In their working hours",
                maxOpenCases: row.maxOpenCases != null ? String(row.maxOpenCases) : "",
                maxText: row.maxOpenCases != null ? "At most " + row.maxOpenCases + " open" : "No limit",
                fallbackPartyId: row.fallbackPartyId || "",
                fallbackName: row.fallbackPartyId ? cs.partyName(row.fallbackPartyId) : "The queue's fallback",
                conditions,
                conditionsText: conditions.length ? conditions.map(condition => condition.text).join("; ") : "Every case",
                draft,
                stateText: draft ? "Draft" : future ? "Starts " + dayText(row.fromDate) : "In effect",
                stateColor: draft ? "grey" : future ? "info" : "positive",
                periodText: draft
                    ? "Not started"
                    : "Since " + dayText(row.fromDate) + (row.thruDate ? " until " + dayText(row.thruDate) : ""),
                lastResultText: cursor?.lastResultText
                    ? cursor.lastResultText + (cursor.lastAssignedDate ? " · " + stampText(cursor.lastAssignedDate) : "")
                    : "Not run yet",
                assignedCount: cursor?.assignedCount != null ? Number(cursor.assignedCount) : 0,
                canEdit
            }
        })
        .sort(
            (a, b) =>
                a.queueName.localeCompare(b.queueName) ||
                Number(a.sequenceNum || 99) - Number(b.sequenceNum || 99) ||
                a.ruleName.localeCompare(b.ruleName)
        )
    return {
        organizationPartyId,
        organizations,
        rules,
        queueOptions: queuesOf(organizationPartyId).map(({value, label}) => ({value, label})),
        teamOptions: teamsOf(organizationPartyId),
        distributionOptions: rows("moqui.basic.Enumeration", {enumTypeId: "AssignmentDistribution"})
            .sort((a, b) => (a.sequenceNum ?? 99) - (b.sequenceNum ?? 99))
            .map(row => ({value: row.enumId, label: row.description || row.enumId})),
        fieldOptions: rows("moqui.basic.Enumeration", {enumTypeId: "AssignmentConditionField"})
            .sort((a, b) => (a.sequenceNum ?? 99) - (b.sequenceNum ?? 99))
            .map(row => ({value: row.enumId, label: row.description || row.enumId}))
    }
}

// ===== get#TeamParticipation =====
// Each current member's participation in the organization's teams (design AgentTeams TeamParticipation), by team and member:
// whether rules may give them cases, the most open cases, the substitute and the calendar, since when.
function teamParticipation(p) {
    const userScope = cs.required()
    const {organizationPartyId} = organizationOf(userScope, p.organizationPartyId)
    const byMember = {}
    for (const team of teamsOf(organizationPartyId))
        for (const member of rows("mantle.party.PartyRelationship", {
            toPartyId: team.value,
            relationshipTypeEnumId: "PrtServiceTeam"
        }).filter(row => lib.active(row))) {
            const row = mantle.participationOf(team.value, member.fromPartyId)
            const calendar = row?.calendarId ? one("mantle.work.calendar.Calendar", {calendarId: row.calendarId}) : null
            byMember[team.value + "|" + member.fromPartyId] = {
                assignmentEligible: row?.assignmentEligible === "N" ? "N" : "Y",
                eligibleText: row?.assignmentEligible === "N" ? "Not taking cases" : "Takes cases",
                maxActiveCases: row?.maxActiveCases != null ? String(row.maxActiveCases) : "",
                maxText: row?.maxActiveCases != null ? "At most " + row.maxActiveCases : "No limit",
                substitutePartyId: row?.substitutePartyId || "",
                substituteName: row?.substitutePartyId ? cs.partyName(row.substitutePartyId) : "",
                calendarId: row?.calendarId || "",
                calendarName: calendar ? calendar.calendarName || calendar.calendarId : "Their own, else the team's",
                participationText:
                    (row?.assignmentEligible === "N" ? "Not taking cases" : "Takes cases") +
                    (row?.maxActiveCases != null ? " · at most " + row.maxActiveCases + " open" : "") +
                    (row?.substitutePartyId ? " · substitute " + cs.partyName(row.substitutePartyId) : "")
            }
        }
    return {organizationPartyId, participation: byMember}
}

// ===== get#RuleChoices =====
// The options of the rule and participation forms: a condition field's operators and values (dependent on the field), the
// members of a team (eligible members, a substitute), the fallback agents of a queue's team, and the calendars of the
// organization and its teams.
const choiceSources = {
    operators: p => (mantle.operatorsOf[p.fieldEnumId] || []).map(enumId => ({value: enumId, label: cs.enumText(enumId)})),
    values: (p, term, organizationPartyId, userScope) => {
        const enumTypeId = mantle.enumTypeOf[p.fieldEnumId]
        if (enumTypeId)
            return rows("moqui.basic.Enumeration", {enumTypeId})
                .sort(
                    (a, b) =>
                        (a.sequenceNum ?? 99) - (b.sequenceNum ?? 99) ||
                        String(a.description).localeCompare(String(b.description))
                )
                .map(row => ({value: row.enumId, label: row.description || row.enumId}))
                .filter(option => !term || option.label.toLowerCase().includes(term.toLowerCase()))
        if (p.fieldEnumId === "AcfPriority")
            return ["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(value => ({value, label: value}))
        if (p.fieldEnumId === "AcfCustomer") {
            return cs.execute("choices", {choice: "customers", term, selected: p.selected || null}).options
        }
        return []
    },
    members: p => {
        if (!p.teamPartyId) return []
        return rows("mantle.party.PartyRelationship", {toPartyId: p.teamPartyId, relationshipTypeEnumId: "PrtServiceTeam"})
            .filter(row => lib.active(row))
            .map(row => ({value: row.fromPartyId, label: cs.partyName(row.fromPartyId)}))
            .filter((option, index, all) => all.findIndex(other => other.value === option.value) === index)
            .sort((a, b) => a.label.localeCompare(b.label))
    },
    calendars: (p, term, organizationPartyId) => {
        const owners = [organizationPartyId].concat(teamsOf(organizationPartyId).map(row => row.value))
        if (p.partyId) owners.push(p.partyId)
        return Array.from(
            find("mantle.work.calendar.Calendar")
                .condition("ownerPartyId", "in", owners)
                .orderBy("calendarName")
                .limit(200)
                .list()
        ).map(row => {
            const hours = lib.call("mantle.work.CalendarServices.get#WorkingHours", {calendarId: row.calendarId})
            return {
                value: row.calendarId,
                label: (row.calendarName || row.calendarId) + (hours.configured ? " · " + hours.text : "")
            }
        })
    }
}
function ruleChoices(p) {
    const userScope = cs.required()
    if (!Object.hasOwn(choiceSources, p.choice)) throw new Error("Unknown assignment choice " + p.choice)
    const {organizationPartyId} = organizationOf(userScope, p.organizationPartyId)
    if (p.teamPartyId && one("mantle.party.Party", {partyId: p.teamPartyId})?.ownerPartyId !== organizationPartyId)
        denied("TEAM_UNAVAILABLE", "Team " + p.teamPartyId + " is not available")
    return {options: choiceSources[p.choice](p, String(p.term || "").trim(), organizationPartyId, userScope)}
}

const operations = {findRules, teamParticipation, ruleChoices}
;({
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Customer Service assignment operation " + op)
        return operations[op](parameters || {})
    }
})
