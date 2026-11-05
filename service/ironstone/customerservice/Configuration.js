// Customer Service settings reads (impl-customer-service P2, CS-SETTINGS; design-customer-service §9 Settings, Queues,
// AgentTeams, CaseTypes, StatusCategories, ServiceDefaults; ConfigurationServices.xml): what the settings forms show for one
// of the user's organizations, with each row's display text. The saves are Mantle's mantle.request.SupportCaseServices
// (SUPPORT_POLICY_EDIT, SUPPORT_CASE_MANAGE), which the screens call after the shared context.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const cs = ec.resource.script("component://mr-boss/service/ironstone/customerservice/CustomerService.js")
const facilityScope = ec.resource.script("component://mr-mantle/service/mantle/facility/FacilityScope.js")
const {find, one, rows, denied, ms} = lib

const dayText = value => (value == null ? "" : ec.l10n.format(new Date(ms(value)), "d MMM yyyy"))
const listOf = value =>
    value == null
        ? []
        : String(value)
              .split(",")
              .map(s => s.trim())
              .filter(Boolean)
// The current row and the drafts (no from date) of a dated setting.
function datedRows(entity, conditions) {
    const all = rows(entity, conditions)
    const current =
        all.filter(row => row.fromDate && lib.active(row)).sort((a, b) => Number(ms(b.fromDate)) - Number(ms(a.fromDate)))[0] ||
        null
    return {current, drafts: all.filter(row => !row.fromDate && !row.thruDate)}
}

// The organizations whose settings the user works on: of the user's service organizations, those Mantle's saves take
// (FacilityScope, as mantle.request.SupportCaseServices and SlaServices check them), so the choice never offers one whose
// saves are refused (F-P4-6: the administrator's every internal organization).
function settingsIds(userScope) {
    if (!userScope.settingsIds) {
        const mantleScope = facilityScope.scope()
        userScope.settingsIds = cs.vendorIds(userScope).filter(partyId => facilityScope.owns(mantleScope, partyId))
    }
    return userScope.settingsIds
}
// The organization the settings are of: the one asked for, else the active one, else the user's first.
function organizationOf(userScope, organizationPartyId) {
    const ids = settingsIds(userScope)
    const active = ids.includes(userScope.activeOrganizationPartyId) ? userScope.activeOrganizationPartyId : null
    const chosen = organizationPartyId || active || ids[0] || null
    if (!chosen || !ids.includes(chosen)) denied("RECORD_UNAVAILABLE", "Organization " + (chosen || "") + " is not available")
    return chosen
}
const organizationOptions = userScope => settingsIds(userScope).map(partyId => ({value: partyId, label: cs.partyName(partyId)}))

// ===== find#ServiceQueues =====
// The organization's queues as a tree (parents first, each with its depth) with their current service row: visibility,
// team, offered types, fallback assignee, since when; a draft row and an ended queue say so.
function serviceQueues(p) {
    const userScope = cs.required()
    const organizationPartyId = organizationOf(userScope, p.organizationPartyId)
    const categories = rows("mantle.request.RequestCategory", {ownerPartyId: organizationPartyId})
    const byParent = new Map()
    for (const category of categories) {
        const parent = categories.some(row => row.requestCategoryId === category.parentCategoryId)
            ? category.parentCategoryId
            : null
        if (!byParent.has(parent)) byParent.set(parent, [])
        byParent.get(parent).push(category)
    }
    const queues = []
    const walk = (parentId, depth) => {
        for (const category of (byParent.get(parentId) || []).sort((a, b) =>
            String(a.description).localeCompare(String(b.description))
        )) {
            const {current, drafts} = datedRows("mantle.request.support.ServiceQueue", {
                requestCategoryId: category.requestCategoryId
            })
            const offered = listOf(current?.offeredTypeEnumIds)
            queues.push({
                requestCategoryId: category.requestCategoryId,
                description: category.description || category.requestCategoryId,
                treeText: "· ".repeat(depth) + (category.description || category.requestCategoryId),
                depth,
                parentCategoryId: category.parentCategoryId || null,
                responsiblePartyId: category.responsiblePartyId || null,
                active: !!current,
                serviceQueueId: current?.serviceQueueId || null,
                visibilityEnumId: current?.visibilityEnumId || null,
                visibilityText: current ? cs.enumText(current.visibilityEnumId) : "Not a service queue now",
                responsibleTeamPartyId: current?.responsibleTeamPartyId || null,
                teamName: current?.responsibleTeamPartyId ? cs.partyName(current.responsibleTeamPartyId) : "",
                offeredTypeEnumIds: offered.join(","),
                offeredText: offered.length ? offered.map(cs.enumText).join(", ") : "Every service-enabled type",
                fallbackAssigneePartyId: current?.fallbackAssigneePartyId || null,
                fallbackName: current?.fallbackAssigneePartyId ? cs.partyName(current.fallbackAssigneePartyId) : "",
                fromText: dayText(current?.fromDate),
                draftCount: drafts.length
            })
            walk(category.requestCategoryId, depth + 1)
        }
    }
    walk(null, 0)
    return {organizationPartyId, organizations: organizationOptions(userScope), queues}
}

// ===== get#ServiceTeam =====
// The organization's service teams, each with its current members (agent or manager, since when) and their open assigned
// cases; with teamPartyId, that team only.
function serviceTeam(p) {
    const userScope = cs.required()
    const organizationPartyId = organizationOf(userScope, p.organizationPartyId)
    let teams = Array.from(
        find("mantle.party.PartyDetailAndRole", {roleTypeId: "OrgTeam", ownerPartyId: organizationPartyId}).list()
    )
    if (p.teamPartyId) teams = teams.filter(row => row.partyId === p.teamPartyId)
    const openStatuses = ["ReqSubmitted", "ReqReviewed", "ReqInProgress", "ReqWaitingCustomer", "ReqOnHold"]
    const result = teams.map(team => {
        const members = rows("mantle.party.PartyRelationship", {
            toPartyId: team.partyId,
            relationshipTypeEnumId: "PrtServiceTeam"
        })
            .filter(row => lib.active(row))
            .map(row => ({
                partyRelationshipId: row.partyRelationshipId,
                teamPartyId: team.partyId,
                partyId: row.fromPartyId,
                name: cs.partyName(row.fromPartyId),
                roleTypeId: row.fromRoleTypeId,
                roleText: row.fromRoleTypeId === "Manager" ? "Manager" : "Agent",
                fromText: dayText(row.fromDate),
                openCaseCount: find("mantle.request.support.CaseRequestParty", {partyId: row.fromPartyId, roleTypeId: "Assignee"})
                    .condition("thruDate", null)
                    .condition("statusId", "in", openStatuses)
                    .count()
            }))
            .sort((a, b) => a.name.localeCompare(b.name))
        const managed = userScope.managedTeamIds.includes(team.partyId)
        // P4: the team's working hours (its schedule calendar, mantle.work.CalendarServices), which its clocks count on
        const hours = lib.call("mantle.work.CalendarServices.get#WorkingHours", {partyId: team.partyId})
        return {
            teamPartyId: team.partyId,
            teamName: team.organizationName || team.partyId,
            hoursText: hours.configured ? hours.text : "Not set: its cases' clocks run around the clock",
            hoursValues: {
                teamPartyId: team.partyId,
                workDays: (hours.workDays || [1, 2, 3, 4, 5]).map(String),
                workStart: hours.workStart || "09:00",
                workEnd: hours.workEnd || "17:00",
                timeZone: hours.timeZone || ec.user.timeZone || ""
            },
            members,
            memberCount: members.length,
            canChange: !!userScope.capabilities.policyEdit || (!!userScope.capabilities.caseManage && managed)
        }
    })
    return {
        organizationPartyId,
        organizations: organizationOptions(userScope),
        teams: result.sort((a, b) => a.teamName.localeCompare(b.teamName))
    }
}

// ===== get#ServiceSettings =====
// The organization's case types (each request type with its current service row), the workflow's status mappings and
// moves, its service policy, and the readiness of the settings landing (a policy, a queue, a team, a service-enabled type).
function serviceSettings(p) {
    const userScope = cs.required()
    const organizationPartyId = organizationOf(userScope, p.organizationPartyId)
    const policy = datedRows("mantle.request.support.ServicePolicy", {organizationPartyId}).current
    const types = rows("moqui.basic.Enumeration", {enumTypeId: "RequestType"})
        .sort((a, b) => String(a.description).localeCompare(String(b.description)))
        .map(type => {
            const current = datedRows("mantle.request.support.ServiceRequestType", {
                organizationPartyId,
                requestTypeEnumId: type.enumId
            }).current
            return {
                requestTypeEnumId: type.enumId,
                typeText: type.description || type.enumId,
                serviceEnabled: current?.serviceEnabled === "Y" ? "Y" : "N",
                serviceText: current?.serviceEnabled === "Y" ? "Service-enabled" : "Not offered for cases",
                customerLabel: current?.customerLabel || "",
                defaultCategoryId: current?.defaultCategoryId || null,
                defaultQueueName: current?.defaultCategoryId ? cs.queueName(current.defaultCategoryId) : "",
                defaultPriority: current?.defaultPriority != null ? String(current.defaultPriority) : "",
                publicAvailable: current?.publicAvailable === "Y" ? "Y" : "N",
                fromText: dayText(current?.fromDate)
            }
        })
    const caseWorkflowId = p.caseWorkflowId || policy?.caseWorkflowId || "CwfDefault"
    const mapped = lib.call("mantle.request.SupportCaseServices.get#CaseStatusMappings", {caseWorkflowId})
    const mappings = Array.from(mapped.mappingList || []).map(row =>
        Object.assign({}, row, {
            statusText: cs.statusText(row.statusId),
            categoryText: cs.enumText(row.statusCategoryEnumId),
            fromText: dayText(row.fromDate),
            sequenceNum: row.sequenceNum != null ? String(row.sequenceNum) : ""
        })
    )
    const transitions = Array.from(mapped.transitionList || []).map(row =>
        Object.assign({}, row, {
            fromText: cs.statusText(row.statusId),
            toText: cs.statusText(row.toStatusId),
            needsText:
                [
                    row.resolutionRequired === "Y" ? "resolution" : "",
                    row.reasonRequired === "Y" ? "reason" : "",
                    row.manageRequired === "Y" ? "a manager" : ""
                ]
                    .filter(Boolean)
                    .join(", ") || "—"
        })
    )
    const queueCount = rows("mantle.request.RequestCategory", {ownerPartyId: organizationPartyId}).filter(
        category => datedRows("mantle.request.support.ServiceQueue", {requestCategoryId: category.requestCategoryId}).current
    ).length
    const teamCount = find("mantle.party.PartyDetailAndRole", {roleTypeId: "OrgTeam", ownerPartyId: organizationPartyId}).count()
    const enabledCount = types.filter(type => type.serviceEnabled === "Y").length
    const readiness = [
        {
            key: "queues",
            label: "Queues",
            ready: queueCount > 0,
            text: queueCount ? queueCount + " service queues" : "No service queue yet"
        },
        {key: "teams", label: "Agent teams", ready: teamCount > 0, text: teamCount ? teamCount + " teams" : "No team yet"},
        {
            key: "types",
            label: "Case types",
            ready: enabledCount > 0,
            text: enabledCount ? enabledCount + " types service-enabled" : "No type service-enabled"
        },
        {
            key: "defaults",
            label: "Service defaults",
            ready: !!policy,
            text: policy ? "Cases on since " + dayText(policy.fromDate) : "Not set: no request becomes a case"
        },
        {key: "statuses", label: "Status categories", ready: mappings.length > 0, text: mappings.length + " statuses mapped"}
    ]
    // P4: the service level policies in effect
    const levelCount = find("mantle.request.support.ServiceLevelPolicy", {organizationPartyId})
        .condition("fromDate", "is-not-null", null)
        .conditionDate("fromDate", "thruDate", ec.user.nowTimestamp)
        .count()
    readiness.push({
        key: "levels",
        label: "Service levels",
        ready: levelCount > 0,
        text: levelCount ? levelCount + " policies in effect" : "No policy: cases have no clocks"
    })
    return {
        organizationPartyId,
        organizations: organizationOptions(userScope),
        policy: policy
            ? Object.assign(lib.map(policy), {
                  reopenWindowDays: String(policy.reopenWindowDays ?? 14),
                  autoCloseDays: policy.autoCloseDays != null ? String(policy.autoCloseDays) : "",
                  defaultQueueName: cs.queueName(policy.defaultCategoryId),
                  fromText: dayText(policy.fromDate)
              })
            : null,
        caseWorkflowId,
        types,
        mappings,
        transitions,
        readiness,
        workflows: rows("moqui.basic.Enumeration", {enumTypeId: "CaseWorkflow"}).map(row => ({
            value: row.enumId,
            label: row.description || row.enumId
        })),
        queueOptions: cs
            .currentQueues()
            .filter(row => cs.queueOwner(row.requestCategoryId) === organizationPartyId)
            .map(row => ({value: row.requestCategoryId, label: cs.queueName(row.requestCategoryId)}))
    }
}

// ===== get#ServiceLevelSettings (P4) =====
// What ServiceLevelPolicies' forms choose from for the organization: its calendars and its teams' working hours calendars
// (each with its hours), its service agreements, the priority bands and the reopen policies. The policies themselves are
// Mantle's mantle.request.SlaServices.find#Policies, which the screen calls.
function serviceLevelSettings(p) {
    const userScope = cs.required()
    const organizationPartyId = organizationOf(userScope, p.organizationPartyId)
    const teamIds = Array.from(
        find("mantle.party.PartyDetailAndRole", {roleTypeId: "OrgTeam", ownerPartyId: organizationPartyId}).list()
    ).map(row => row.partyId)
    const calendarOptions = Array.from(
        find("mantle.work.calendar.Calendar")
            .condition("ownerPartyId", "in", [organizationPartyId].concat(teamIds))
            .condition("calendarKindEnumId", "in", ["CalkShared", "CalkResource"])
            .list()
    ).map(row => {
        const hours = lib.call("mantle.work.CalendarServices.get#WorkingHours", {calendarId: row.calendarId})
        return {value: row.calendarId, label: (row.calendarName || row.calendarId) + (hours.configured ? " · " + hours.text : "")}
    })
    const agreementOptions = rows("mantle.party.agreement.Agreement", {
        agreementTypeEnumId: "AgrService",
        organizationPartyId
    }).map(row => ({
        value: row.agreementId,
        label: (row.description || row.agreementId) + " · " + cs.partyName(row.otherPartyId)
    }))
    const enumOptions = enumTypeId =>
        rows("moqui.basic.Enumeration", {enumTypeId})
            .sort((a, b) => Number(a.sequenceNum || 0) - Number(b.sequenceNum || 0))
            .map(row => ({value: row.enumId, label: row.description || row.enumId}))
    return {
        organizationPartyId,
        organizations: organizationOptions(userScope),
        calendarOptions,
        agreementOptions,
        bandOptions: enumOptions("CasePriorityBand"),
        reopenOptions: enumOptions("SlaReopen")
    }
}

const operations = {serviceQueues, serviceTeam, serviceSettings, serviceLevelSettings}
;({
    // the settings organization of TemplateServices (Templates.js, P7) and ChannelRouting (Channels.js, P6)
    organizationOf,
    organizationOptions,
    execute: (op, parameters) => {
        if (!operations[op]) throw new Error("Unknown Customer Service settings operation " + op)
        return operations[op](parameters || {})
    }
})
