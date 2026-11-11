// Insights' business flow maps, ironstone.insights.FlowMapServices (impl-insights P9; design-insights §9, FlowMaps, FlowMap,
// FlowMapEditor, ProcessStory; INS-08).
//
// A flow map is clickable documentation: lanes of steps, each step a description that may name a registered worklist, a
// registered count, a registered measure or report, and a Knowledge page. It is stored as a report engine definition of type
// report whose body.kind is flowmap (review Z11), so its versions, diff, restore, sharing and the read-only shipped templates
// (report/insights-flowmap-*.json) are the engine's. This module is Insights' side of it:
// - a step's references are checked against the registrations (ironstone.insights.FlowTarget with its typed parameters,
//   AttentionProvider, MetricRegistration, ReportCatalogEntry) when a map is saved and again each time it is read, so a
//   definition saved outside these services (Tools' definition editor, an import, a git pull) cannot add a target: a step
//   whose reference is not registered is shown as information, with no link and no count;
// - a map's text is an editor's and is only ever shown as text: nothing of a step is expanded or run, a link is built here
//   from a registration's route and its checked parameters, never from a stored URL, and a stored key this module does not
//   know is ignored;
// - nothing here grants what an owner refuses: a worklist link is answered only when its route opens to the viewer's own
//   groups (and they hold its permission), a count is its owner's count service called as the viewer through the attention
//   board (Registry.js attention), a report link is its owner's catalogue's answer, and a Knowledge page only when the
//   viewer's own grants open Commons Knowledge and the wiki lets them read the page. What a viewer may not read is left out
//   without a name; the step keeps its neutral explanation;
// - an organization's map is read by those who see its organization (and whom the engine lets read the definition: its
//   owner and the group it is shared with); it is changed by its owner, a flow editor (INSIGHTS_FLOW_EDIT), with the version
//   read. A copy records its source and the source's version; a later change of the source leaves the copy alone.
// A write answers a refusal as applied false with reasonCode and reason, so a screen shows it.
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const insights = ec.resource.script("component://mr-boss/service/ironstone/insights/Insights.js")
const registry = ec.resource.script("component://mr-boss/service/ironstone/insights/Registry.js")
const admin = ec.resource.script("component://mr-boss/service/ironstone/admin/Admin.js")
const {one, denied, reasonCode} = lib

const R = "org.moqui.report.ReportServices."
const KIND = "flowmap"
const defaultKey = "InsightsFlowMap"
const mapUrl = "/qapps/Insights/Flows/FlowMap"
const storyUrl = "/qapps/Insights/Flows/ProcessStory/Knowledge"
const knowledgePath = "Commons/Knowledge"
const limits = {lanes: 12, steps: 100, title: 80, description: 1000, next: 8, parameters: 8}
const idPattern = /^[A-Za-z0-9][A-Za-z0-9_-]{0,39}$/
const pagePattern = /^[A-Za-z0-9_.:-]{1,60}$/
const blank = value => value == null || value === ""
const truthy = value => value === true || value === "true" || value === "Y"

// ===== access =====
function viewer() {
    const userScope = insights.required()
    if (!userScope.capabilities.view) denied("INSIGHTS_VIEW_REQUIRED", "Business flows need Insights read")
    return userScope
}
function editor() {
    const userScope = viewer()
    if (!userScope.capabilities.flowEdit)
        denied("FLOW_EDIT_REQUIRED", "Copying and changing flow maps needs the flow editor's permission")
    return userScope
}
// A write's answer: applied with what it returns, or the refusal as a code and a reason to show. A refusal without a code (an
// authorization, a fault) is logged and shown as the fallback, so nothing internal reaches the page.
function attempt(action, fallback) {
    try {
        return Object.assign({applied: true, reasonCode: "", reason: ""}, action())
    } catch (error) {
        const code = reasonCode(error)
        const message = String(error?.message ?? error)
        if (!code) {
            ec.logger.error("Insights flow map: " + message)
            return {applied: false, reasonCode: "NOT_AVAILABLE", reason: fallback}
        }
        return {applied: false, reasonCode: code, reason: message.replace(/^[A-Z][A-Z0-9_]+:\s*/, "")}
    }
}
// An owner's or the wiki's service as the viewer, in its own transaction and error frame: a refusal is the caller's to read.
function apart(serviceName, parameters) {
    ec.message.pushErrors()
    try {
        const result = ec.service.sync().name(serviceName).parameters(parameters).requireNewTransaction(true).call() || {}
        if (ec.message.hasError()) throw new Error(ec.message.getErrorsString())
        return result
    } finally {
        ec.message.clearErrors()
        ec.message.popErrors()
    }
}

// ===== registrations =====
// The registrations a step may name, each by its key, read once a call. A flow target's parameter contract is a JSON map of
// parameter name to {type: "choice", values: [...]} or {type: "organization"} (the organization in the map's scope, set
// here, never stored on a step); an unreadable contract leaves the target without parameters.
function registrations() {
    const byKey = (list, field) => new Map(list.map(row => [String(row[field]), row]))
    const targets = registry.registered("ironstone.insights.FlowTarget", "targetId", [])
    const contracts = new Map()
    for (const target of targets) {
        const parsed = blank(target.parameterContract) ? {} : lib.json(target.parameterContract, null)
        const contract = new Map()
        if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed))
            ec.logger.error("Insights flow target " + target.targetId + " has an unreadable parameter contract")
        else
            for (const name of Object.keys(parsed)) {
                const rule = parsed[name] || {}
                if (rule.type === "organization") contract.set(name, {type: "organization"})
                else if (rule.type === "choice" && Array.isArray(rule.values))
                    contract.set(name, {type: "choice", values: rule.values.map(String)})
                else ec.logger.error("Insights flow target " + target.targetId + " parameter " + name + " has no known type")
            }
        contracts.set(String(target.targetId), contract)
    }
    return {
        targets: byKey(targets, "targetId"),
        contracts,
        providers: byKey(registry.attentionProviders(), "providerKey"),
        metrics: byKey(registry.metricRegistrations(), "metricId"),
        entries: byKey(registry.catalogEntries(), "entryId")
    }
}
const ownerName = ownerApp => registry.ownerNames[ownerApp] || ownerApp || ""

// ===== validation (validate#Map; at save and at render) =====
// Stored text as it is shown: trimmed, cut to its limit, and with no template opening left in it, so no renderer that expands
// a text can be handed an expression (the screens show it as plain text in any case).
const shown = (value, max) =>
    String(value ?? "")
        .replace(/\$\{/g, "$ {")
        .trim()
        .slice(0, max)
// A map body checked against the registrations. Answers the lanes and steps as this module reads them (known fields only,
// ordered, each reference that does not hold cleared) and the problems, each with its reason code, the step and the field:
// a save is refused while there is one; a render shows the cleaned map, so a step with a bad reference reads as information.
function checkBody(body, reg) {
    const problems = []
    const problem = (code, message, stepId, field) =>
        problems.push({reasonCode: code, message, stepId: stepId || null, field: field || null})
    if (!body || typeof body !== "object" || body.kind !== KIND) problem("MAP_KIND_INVALID", "This is not a flow map")
    const laneInput = Array.isArray(body?.lanes) ? body.lanes : []
    const stepInput = Array.isArray(body?.steps) ? body.steps : []
    if (laneInput.length > limits.lanes) problem("MAP_TOO_LARGE", "A map has at most " + limits.lanes + " lanes")
    if (stepInput.length > limits.steps) problem("MAP_TOO_LARGE", "A map has at most " + limits.steps + " steps")
    const textOf = (value, max, what, stepId, field) => {
        const text = String(value ?? "").trim()
        if (text.includes("${")) problem("TEXT_INVALID", what + " cannot contain ${", stepId, field)
        if (text.length > max) problem("TEXT_TOO_LONG", what + " is longer than " + max + " characters", stepId, field)
        return shown(text, max)
    }
    const order = (value, fallback) => (Number.isFinite(Number(value)) && !blank(value) ? Number(value) : fallback)

    const lanes = []
    const laneIds = new Set()
    laneInput.slice(0, limits.lanes).forEach((lane, index) => {
        const laneId = String(lane?.laneId ?? "").trim()
        if (!idPattern.test(laneId)) return problem("LANE_ID_INVALID", "Lane " + (index + 1) + " has no usable id")
        if (laneIds.has(laneId)) return problem("LANE_ID_DUPLICATE", "Lane " + laneId + " is in the map twice")
        laneIds.add(laneId)
        const title = textOf(lane.title, limits.title, "A lane's name", null, "title")
        if (!title) problem("LANE_TITLE_REQUIRED", "Lane " + laneId + " needs a name")
        lanes.push({
            laneId,
            title: title || laneId,
            description: textOf(lane.description, limits.description, "A lane's description", null, "description"),
            sequenceNum: order(lane.sequenceNum, index + 1)
        })
    })
    lanes.sort((a, b) => a.sequenceNum - b.sequenceNum)
    const laneOrder = new Map(lanes.map((lane, index) => [lane.laneId, index]))

    const steps = []
    const stepIds = new Set()
    stepInput.slice(0, limits.steps).forEach((step, index) => {
        const stepId = String(step?.stepId ?? "").trim()
        if (!idPattern.test(stepId)) return problem("STEP_ID_INVALID", "Step " + (index + 1) + " has no usable id")
        if (stepIds.has(stepId)) return problem("STEP_ID_DUPLICATE", "Step " + stepId + " is in the map twice", stepId)
        const laneId = String(step.laneId ?? "").trim()
        if (!laneOrder.has(laneId))
            return problem("STEP_LANE_UNKNOWN", "Step " + stepId + " is in no lane of the map", stepId, "laneId")
        stepIds.add(stepId)
        const title = textOf(step.title, limits.title, "A step's name", stepId, "title")
        if (!title) problem("STEP_TITLE_REQUIRED", "Step " + stepId + " needs a name", stepId, "title")
        const row = {
            stepId,
            laneId,
            title: title || stepId,
            description: textOf(step.description, limits.description, "A step's description", stepId, "description"),
            sequenceNum: order(step.sequenceNum, index + 1),
            targetRegistrationId: null,
            targetParameters: {},
            countProviderKey: null,
            countMetricId: null,
            catalogEntryId: null,
            wikiPageId: null,
            next: Array.isArray(step.next) ? step.next.map(String) : []
        }
        // the worklist and its typed parameters
        const targetId = blank(step.targetRegistrationId) ? null : String(step.targetRegistrationId)
        const supplied =
            step.targetParameters && typeof step.targetParameters === "object" && !Array.isArray(step.targetParameters)
                ? step.targetParameters
                : {}
        if (!targetId) {
            if (Object.keys(supplied).length)
                problem("PARAMETER_UNKNOWN", title + " has link parameters and no worklist", stepId, "targetParameters")
        } else if (!reg.targets.has(targetId)) {
            problem(
                "TARGET_UNREGISTERED",
                title + " names a worklist that is not registered: " + shown(targetId, 60),
                stepId,
                "targetRegistrationId"
            )
        } else {
            const contract = reg.contracts.get(targetId)
            const parameters = {}
            let valid = true
            const names = Object.keys(supplied)
            if (names.length > limits.parameters) {
                valid = false
                problem("PARAMETER_UNKNOWN", title + " has too many link parameters", stepId, "targetParameters")
            }
            for (const name of names.slice(0, limits.parameters)) {
                const rule = contract.get(name)
                const value = supplied[name]
                if (blank(value)) continue
                if (!rule) {
                    valid = false
                    problem(
                        "PARAMETER_UNKNOWN",
                        reg.targets.get(targetId).title + " takes no parameter " + shown(name, 40),
                        stepId,
                        "targetParameters"
                    )
                } else if (rule.type === "organization") {
                    valid = false
                    problem(
                        "PARAMETER_FIXED",
                        shown(name, 40) + " is the map's organization and is not set on a step",
                        stepId,
                        "targetParameters"
                    )
                } else if (typeof value === "object" || !rule.values.includes(String(value))) {
                    valid = false
                    problem(
                        "PARAMETER_INVALID",
                        shown(name, 40) + " of " + reg.targets.get(targetId).title + " is one of: " + rule.values.join(", "),
                        stepId,
                        "targetParameters"
                    )
                } else parameters[name] = String(value)
            }
            // one bad parameter leaves the step without its link: a link is the registered one or none
            if (valid) Object.assign(row, {targetRegistrationId: targetId, targetParameters: parameters})
        }
        const reference = (field, registered, code, what) => {
            if (blank(step[field])) return
            const key = String(step[field])
            if (registered.has(key)) row[field] = key
            else problem(code, title + " names " + what + " that is not registered: " + shown(key, 60), stepId, field)
        }
        reference("countProviderKey", reg.providers, "COUNT_UNREGISTERED", "a count")
        reference("countMetricId", reg.metrics, "METRIC_UNREGISTERED", "a measure")
        reference("catalogEntryId", reg.entries, "REPORT_UNREGISTERED", "a report")
        if (!blank(step.wikiPageId)) {
            if (pagePattern.test(String(step.wikiPageId))) row.wikiPageId = String(step.wikiPageId)
            else problem("PAGE_INVALID", title + " names a Knowledge page by an id that is not one", stepId, "wikiPageId")
        }
        steps.push(row)
    })
    steps.sort(
        (a, b) =>
            laneOrder.get(a.laneId) - laneOrder.get(b.laneId) || a.sequenceNum - b.sequenceNum || a.stepId.localeCompare(b.stepId)
    )
    for (const step of steps) {
        if (step.next.length > limits.next)
            problem("STEP_NEXT_INVALID", step.title + " leads to too many steps", step.stepId, "next")
        const next = []
        for (const stepId of step.next.slice(0, limits.next)) {
            if (stepId === step.stepId || !stepIds.has(stepId))
                problem("STEP_NEXT_INVALID", step.title + " leads to a step that is not in the map", step.stepId, "next")
            else if (!next.includes(stepId)) next.push(stepId)
        }
        step.next = next
    }
    return {lanes, steps, problems}
}
// The body a save stores: the checked lanes and steps renumbered in their order, known fields only, and the map's own facts.
function bodyOf(facts, checked) {
    const counters = new Map()
    return {
        kind: KIND,
        description: facts.description || "",
        organizationPartyId: facts.organizationPartyId || null,
        sourceDefinitionId: facts.sourceDefinitionId || null,
        sourceVersion: facts.sourceVersion ?? null,
        lanes: checked.lanes.map((lane, index) => Object.assign({}, lane, {sequenceNum: index + 1})),
        steps: checked.steps.map(step => {
            counters.set(step.laneId, (counters.get(step.laneId) || 0) + 1)
            const stored = {stepId: step.stepId, laneId: step.laneId, title: step.title, sequenceNum: counters.get(step.laneId)}
            if (step.description) stored.description = step.description
            if (step.targetRegistrationId) stored.targetRegistrationId = step.targetRegistrationId
            if (Object.keys(step.targetParameters).length) stored.targetParameters = step.targetParameters
            for (const field of ["countProviderKey", "countMetricId", "catalogEntryId", "wikiPageId"])
                if (step[field]) stored[field] = step[field]
            if (step.next.length) stored.next = step.next
            return stored
        })
    }
}

// ===== reading a map =====
const isMap = definition => definition?.type === "report" && definition.body?.kind === KIND
// The version a copy records of its source: a saved map's own version; a shipped template's templateVersion, since the
// engine gives every shipped definition version 0.
const sourceVersionOf = definition =>
    definition.readOnly ? Number(definition.body?.templateVersion || 0) : Number(definition.version || 0)
// A flow map the viewer reads: the engine answers the definition to its owner, the group it is shared with and, a shipped
// one, to everyone; an organization's map only to one who sees its organization. Anything else is one refusal, so an id
// learns nothing.
function readMap(userScope, definitionId) {
    const unavailable = () => denied("MAP_UNAVAILABLE", "This flow map is not available")
    if (blank(definitionId)) unavailable()
    let definition = null
    try {
        definition = insights.asViewerApart(R + "get#Definition", {definitionId: String(definitionId)}).definition
    } catch (error) {
        unavailable()
    }
    if (!isMap(definition)) unavailable()
    const organizationPartyId = definition.body.organizationPartyId || null
    if (!definition.readOnly && !insights.sees(userScope, organizationPartyId)) unavailable()
    return definition
}
const canEdit = (userScope, definition) =>
    !!userScope.capabilities.flowEdit && !definition.readOnly && definition.ownerId === ec.user.userId
function organizationName(partyId) {
    if (!partyId) return ""
    return one("mantle.party.Organization", {partyId})?.organizationName || partyId
}
function groupName(userGroupId) {
    if (!userGroupId) return "Private"
    return one("moqui.security.UserGroup", {userGroupId})?.description || userGroupId
}
// What a map is a copy of, in words, and whether that source has changed since; the source's title only when the viewer
// reads it.
function provenance(userScope, body) {
    if (blank(body.sourceDefinitionId)) return {sourceText: "", sourceChangedText: ""}
    let source = null
    try {
        source = readMap(userScope, body.sourceDefinitionId)
    } catch (error) {
        // the source was removed, or is not the viewer's to read
    }
    const version = Number(body.sourceVersion || 0)
    const sourceText =
        "Copied from " + (source ? source.title || source.id : "a map that is no longer available") + ", version " + version
    const current = source ? sourceVersionOf(source) : version
    return {
        sourceText,
        sourceChangedText:
            current !== version
                ? "Its source is now version " + current + ". This map was left as it is; compare the two and copy what you want."
                : ""
    }
}
const defaultMapId = () => {
    const stored = ec.user.getPreference(defaultKey)
    return blank(stored) ? null : String(stored)
}
function mapFacts(userScope, definition) {
    const body = definition.body
    const template = !!definition.readOnly
    return Object.assign(
        {
            definitionId: definition.id,
            title: shown(definition.title || definition.id, limits.title),
            description: shown(body.description, limits.description),
            template,
            kindText: template ? "Suite template" : "Organization map",
            organizationPartyId: template ? null : body.organizationPartyId || null,
            organizationName: template ? "Every organization" : organizationName(body.organizationPartyId),
            version: template ? sourceVersionOf(definition) : Number(definition.version || 0),
            ownerText: template ? "IronStone" : definition.ownerId === ec.user.userId ? "You" : "Shared",
            sharing: template ? "Everyone" : groupName(definition.userGroupId),
            userGroupId: definition.userGroupId || null,
            canEdit: canEdit(userScope, definition),
            canCopy: !!userScope.capabilities.flowEdit,
            isDefault: defaultMapId() === definition.id,
            url: mapUrl + "?definitionId=" + encodeURIComponent(definition.id)
        },
        template ? {sourceText: "", sourceChangedText: ""} : provenance(userScope, body)
    )
}

// The maps the viewer reads: the engine's report definitions of kind flowmap, the suite templates and the organizations'
// maps whose organization the viewer sees.
function readableMaps(userScope) {
    return Array.from(insights.asViewer(R + "list#Definitions", {definitionType: "report"}).definitions || []).filter(
        definition => isMap(definition) && (definition.readOnly || insights.sees(userScope, definition.body.organizationPartyId))
    )
}
// find#Maps: the list (design §9 FlowMaps), an organization's maps before the templates, filtered by organization (its maps
// and the templates), kind (template or copy) and text; with the choices its find and CopyMap need.
function findMaps(p) {
    const userScope = viewer()
    const context = insights.context({appRoot: "Insights", organizationPartyId: p.organizationPartyId || null})
    const text = String(p.text || "")
        .trim()
        .toLowerCase()
    const chosen = blank(p.organizationPartyId) ? null : String(p.organizationPartyId)
    const maps = readableMaps(userScope)
        .filter(definition => blank(p.kind) || (p.kind === "template") === !!definition.readOnly)
        .filter(definition => !chosen || definition.readOnly || definition.body.organizationPartyId === chosen)
        .filter(
            definition =>
                !text ||
                [definition.title, definition.body.description].some(value =>
                    String(value || "")
                        .toLowerCase()
                        .includes(text)
                )
        )
        .map(definition => mapFacts(userScope, definition))
        .sort((a, b) => Number(a.template) - Number(b.template) || a.title.localeCompare(b.title))
    return {
        maps,
        canCopy: !!userScope.capabilities.flowEdit,
        organizations: context.organizations,
        organizationPartyId: chosen,
        groups: userScope.capabilities.flowEdit ? insights.execute("shareGroups", {}).groups : [],
        kindOptions: [
            {value: "copy", label: "Organization maps"},
            {value: "template", label: "Suite templates"}
        ]
    }
}
// The map FlowMap opens without one named: the viewer's default if they still read it, else a map of the organization in
// scope, else the suite's customer flow, else the first.
function openingMapId(userScope, organizationPartyId) {
    const maps = readableMaps(userScope)
    const chosen = defaultMapId()
    const pick =
        maps.find(definition => definition.id === chosen) ||
        maps.find(
            definition =>
                !definition.readOnly && organizationPartyId && definition.body.organizationPartyId === organizationPartyId
        ) ||
        maps.find(definition => definition.id === "insights-flowmap-customer") ||
        maps[0]
    return pick ? pick.id : null
}

// ===== get#Map =====
// The viewer's link to a step's worklist: the registered route with the step's checked parameters and, where the target
// takes it, the organization in the map's scope; null when the route does not open to the viewer's own groups or they lack
// its permission.
function worklist(step, reg, grants, organizationPartyId) {
    const target = step.targetRegistrationId ? reg.targets.get(step.targetRegistrationId) : null
    if (!target) return null
    try {
        if (blank(target.routePath) || !admin.destinationOpens(grants, target.routePath)) return null
        if (target.requiredPermission && !lib.access.has(target.requiredPermission)) return null
    } catch (error) {
        ec.logger.error("Insights flow target " + target.targetId + " was not checked: " + error.message)
        return null
    }
    const query = Object.entries(step.targetParameters).map(
        ([name, value]) => encodeURIComponent(name) + "=" + encodeURIComponent(value)
    )
    if (organizationPartyId)
        for (const [name, rule] of reg.contracts.get(String(target.targetId)))
            if (rule.type === "organization") query.push(encodeURIComponent(name) + "=" + encodeURIComponent(organizationPartyId))
    return {
        title: target.title,
        meaning: target.description || "",
        ownerApp: target.ownerApp,
        url: "/qapps/" + target.routePath + (query.length ? "?" + query.join("&") : "")
    }
}
// A page's title as Knowledge shows it: its first heading, else its name.
function pageTitle(page) {
    let text = ""
    try {
        text = page.exists && page.pageReference ? String(page.pageReference.getText() ?? "") : ""
    } catch (error) {
        text = ""
    }
    const heading = text.match(/^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/m)
    return shown(heading ? heading[1].replace(/[*_`]/g, "").trim() : page.pageName || "Procedure", limits.title)
}
// The Knowledge page of a step, for a viewer whose own grants open Commons Knowledge and whom the wiki lets read the page
// (map read grants no page); null otherwise, naming nothing.
function article(step, mapId, knowledgeOpens) {
    if (!step.wikiPageId || !knowledgeOpens) return null
    try {
        const page = apart("ironstone.commons.KnowledgeServices.get#PageRef", {wikiPageId: step.wikiPageId, need: "view"})
        if (!page.found) return null
        return {
            title: pageTitle(page),
            url:
                storyUrl +
                "?wikiPageId=" +
                encodeURIComponent(page.wikiPageId) +
                "&definitionId=" +
                encodeURIComponent(mapId) +
                "&stepId=" +
                encodeURIComponent(step.stepId)
        }
    } catch (error) {
        return null
    }
}
// get#Map: a map as the viewer reads it (design §9 FlowMap): its lanes with their steps, the same steps as one ordered list,
// the handoffs as edge rows (source, target, their names and lanes, the source's count: the node-graph frame of
// impl-insights F26) and the selected step. Validated again here, whatever saved it. Each step answers only what the viewer
// may read; a count that fails is that step's alone.
function getMap(p) {
    const userScope = viewer()
    const requested = blank(p.definitionId) ? null : String(p.definitionId)
    let opening = requested
    if (!opening) {
        const scope = insights.context({appRoot: "Insights"})
        opening = openingMapId(userScope, scope.organizationPartyId)
        if (!opening) return {map: null, lanes: [], steps: [], edges: [], selectedStep: null, problems: [], organizations: []}
    }
    const definition = readMap(userScope, opening)
    const body = definition.body
    const fixedOrganization = definition.readOnly ? null : body.organizationPartyId || null
    // a template's counts are for the organization the viewer chooses (one of theirs); a copy's for its own
    const context = insights.context({
        appRoot: "Insights",
        organizationPartyId: fixedOrganization || p.organizationPartyId || null
    })
    const organizationPartyId = context.organizationPartyId || null
    const reg = registrations()
    const checked = checkBody(body, reg)
    const grants = insights.grants()
    const showCounts = !(p.counts === false || p.counts === "false" || p.counts === "N")

    // the counts, each provider called as the viewer by the attention board's own rules; a board that fails leaves every
    // step without its count and says so
    const cards = new Map()
    let countsFailed = false
    let asOfText = ""
    const providerKeys = Array.from(new Set(checked.steps.map(step => step.countProviderKey).filter(Boolean)))
    if (showCounts && providerKeys.length) {
        try {
            const board = registry.attention({organizationPartyId, providerKeys})
            asOfText = board.asOfText
            for (const group of board.groups) for (const card of group.cards) cards.set(card.providerKey, card)
        } catch (error) {
            ec.logger.error("Insights flow map " + definition.id + " counts failed: " + error.message)
            countsFailed = true
        }
    }
    let knowledgeOpens = false
    try {
        knowledgeOpens = checked.steps.some(step => step.wikiPageId) && admin.destinationOpens(grants, knowledgePath)
    } catch (error) {
        ec.logger.error("Insights flow map: Knowledge was not checked: " + error.message)
    }
    const catalog = checked.steps.some(step => step.catalogEntryId) ? registry.reader() : null
    const laneTitles = new Map(checked.lanes.map(lane => [lane.laneId, lane.title]))
    const titles = new Map(checked.steps.map(step => [step.stepId, step.title]))
    // a step with no explicit handoff leads to the step after it in its lane
    const following = new Map()
    checked.steps.forEach((step, index) => {
        const after = checked.steps[index + 1]
        following.set(step.stepId, step.next.length ? step.next : after && after.laneId === step.laneId ? [after.stepId] : [])
    })

    const steps = checked.steps.map((step, index) => {
        const link = worklist(step, reg, grants, organizationPartyId)
        const card = step.countProviderKey ? cards.get(step.countProviderKey) : null
        const failed = !!card && card.state === "failed"
        const measure = step.countMetricId ? reg.metrics.get(step.countMetricId) : null
        const measureShown =
            measure && (!measure.requiredPermission || lib.access.has(measure.requiredPermission)) ? measure : null
        const entry = step.catalogEntryId ? reg.entries.get(step.catalogEntryId) : null
        const report = entry && catalog.reads(entry) ? entry : null
        const page = article(step, definition.id, knowledgeOpens)
        const ownerApp = link?.ownerApp || card?.ownerApp || report?.ownerApp || ""
        const live = !!(link || (card && !failed) || report || page)
        return {
            stepId: step.stepId,
            laneId: step.laneId,
            laneTitle: laneTitles.get(step.laneId),
            position: index + 1,
            title: step.title,
            description: step.description,
            live,
            // a step with nothing to open says so; one whose links the viewer may not use reads the same
            stateText: live ? "" : "Information",
            ownerName: ownerName(ownerApp),
            targetTitle: link ? link.title : "",
            targetMeaning: link ? link.meaning : "",
            url: link ? link.url : null,
            countText: card ? (failed ? "Unavailable" : card.countText + (card.overdueText ? " · " + card.overdueText : "")) : "",
            countTitle: card ? card.title : "",
            countMeaning: card ? card.description : "",
            countFailed: failed,
            countMessage: failed ? card.message : "",
            countUrl: card && !failed ? card.url : null,
            countScope: card ? card.scopeText : "",
            measureText: measureShown ? measureShown.title + " (" + ownerName(measureShown.ownerApp) + ")" : "",
            reportTitle: report ? report.title : "",
            reportUrl: report && report.routePath ? "/qapps/" + report.routePath : null,
            articleTitle: page ? page.title : "",
            articleUrl: page ? page.url : null,
            nextText: following
                .get(step.stepId)
                .map(stepId => titles.get(stepId))
                .join(", "),
            selectUrl:
                mapUrl + "?definitionId=" + encodeURIComponent(definition.id) + "&stepId=" + encodeURIComponent(step.stepId)
        }
    })
    const byId = new Map(steps.map(step => [step.stepId, step]))
    const edges = []
    for (const step of checked.steps)
        for (const targetId of following.get(step.stepId)) {
            const source = byId.get(step.stepId)
            const target = byId.get(targetId)
            edges.push({
                source: source.stepId,
                target: target.stepId,
                sourceLabel: source.title,
                targetLabel: target.title,
                sourceGroup: source.laneTitle,
                targetGroup: target.laneTitle,
                count: step.countProviderKey && cards.has(step.countProviderKey) ? cards.get(step.countProviderKey).count : null,
                order: edges.length + 1
            })
        }
    const facts = mapFacts(userScope, definition)
    return {
        map: facts,
        organizationPartyId,
        // a template is read for one of the viewer's organizations; an organization's map is its own
        organizations: fixedOrganization ? [] : context.organizations,
        lanes: checked.lanes.map(lane =>
            Object.assign({}, lane, {
                steps: steps.filter(step => step.laneId === lane.laneId)
            })
        ),
        steps,
        edges,
        selectedStep: (blank(p.stepId) ? null : byId.get(String(p.stepId))) || null,
        countsShown: showCounts,
        countsText: countsFailed ? "The counts could not be read just now." : asOfText ? "Counts as of " + asOfText + "." : "",
        // what the map's editors fix; a reader is told nothing of a reference that does not hold
        problems: userScope.capabilities.flowEdit ? checked.problems : [],
        problemCount: userScope.capabilities.flowEdit ? checked.problems.length : 0
    }
}

// validate#Map: a body, or a map the caller reads, against the registrations; for the editor and for a check before an import.
function validateMap(p) {
    const userScope = editor()
    const body = blank(p.definitionId) ? p.map : readMap(userScope, p.definitionId).body
    const checked = checkBody(body, registrations())
    return {
        valid: checked.problems.length === 0,
        problems: checked.problems,
        laneCount: checked.lanes.length,
        stepCount: checked.steps.length
    }
}

// ===== writing =====
// The caller's own map, for a change: a flow editor's, not a template, theirs, at the version they read.
function ownMap(userScope, p) {
    const definition = readMap(userScope, p.definitionId)
    if (definition.readOnly) denied("MAP_READ_ONLY", "A suite template is not changed; copy it for your organization")
    if (definition.ownerId !== ec.user.userId) denied("MAP_NOT_OWNED", "Only its owner changes a map; copy it to make your own")
    if (!blank(p.expectedVersion) && Number(p.expectedVersion) !== Number(definition.version))
        denied("MAP_CHANGED", "The map changed since you read it; reload and try again")
    return definition
}
function shareGroup(userGroupId) {
    const group = blank(userGroupId) ? null : String(userGroupId)
    if (group && !insights.shareGroupIds().includes(group))
        denied("SHARE_GROUP_UNAVAILABLE", "Share only with a group you belong to")
    return group
}
// A page a map newly names must be one its editor reads in Knowledge (referenced content is checked, never shared by the map).
function checkPages(steps, before) {
    const known = new Set(before.map(step => step.wikiPageId).filter(Boolean))
    for (const step of steps) {
        if (!step.wikiPageId || known.has(step.wikiPageId)) continue
        let found = false
        try {
            const page = apart("ironstone.commons.KnowledgeServices.get#PageRef", {wikiPageId: step.wikiPageId, need: "view"})
            found = !!page.found && !page.isNotes
        } catch (error) {
            found = false
        }
        if (!found) denied("PAGE_UNAVAILABLE", step.title + " names a Knowledge page that is not available to you")
    }
}
// Save a map's body as the caller through the engine (its owner and version checks, and a new version): refused while the
// body has a problem, each named.
function saveMap(definitionId, title, userGroupId, version, facts, lanes, steps, before, note) {
    const cleanTitle = String(title ?? "").trim()
    if (!cleanTitle) denied("TITLE_REQUIRED", "Name the map")
    if (cleanTitle.includes("${")) denied("TEXT_INVALID", "The map's name cannot contain ${")
    if (cleanTitle.length > limits.title) denied("TEXT_TOO_LONG", "The map's name is longer than " + limits.title + " characters")
    const description = String(facts.description ?? "").trim()
    if (description.includes("${")) denied("TEXT_INVALID", "The map's description cannot contain ${")
    if (description.length > limits.description)
        denied("TEXT_TOO_LONG", "The map's description is longer than " + limits.description + " characters")
    const checked = checkBody({kind: KIND, lanes, steps}, registrations())
    if (checked.problems.length) {
        const first = checked.problems[0]
        const more = checked.problems.length - 1
        denied(first.reasonCode, first.message + (more ? " (and " + more + " more)" : ""))
    }
    if (!checked.lanes.length) denied("LANE_REQUIRED", "A map has at least one lane")
    checkPages(checked.steps, before)
    const definition = {
        id: definitionId,
        type: "report",
        title: cleanTitle,
        body: bodyOf(Object.assign({}, facts, {description}), checked),
        userGroupId
    }
    if (version != null) definition.version = version
    const saved = insights.asViewer(R + "save#Definition", {definition, note: shown(note, 200)}).definition
    return {definitionId: saved.id, version: Number(saved.version)}
}
const factsOf = body => ({
    description: body.description || "",
    organizationPartyId: body.organizationPartyId || null,
    sourceDefinitionId: body.sourceDefinitionId || null,
    sourceVersion: body.sourceVersion ?? null
})
// copy#Map: a flow editor's copy of a map they read, for one of their organizations, under its own name, private or shared
// with one of their own groups; the source and its version are recorded. A reference of the source that no longer holds is
// left out of the copy. The copy is the caller's; nothing of the source's sharing goes with it.
function copyMap(p) {
    return attempt(() => {
        const userScope = editor()
        const source = readMap(userScope, p.sourceDefinitionId)
        const sourceVersion = sourceVersionOf(source)
        if (!blank(p.sourceVersion) && Number(p.sourceVersion) !== sourceVersion)
            denied("SOURCE_CHANGED", "The map changed since you read it; reload and try again")
        if (blank(p.organizationPartyId)) denied("ORGANIZATION_REQUIRED", "Choose the organization the map is for")
        insights.context({appRoot: "Insights", organizationPartyId: String(p.organizationPartyId)})
        const group = shareGroup(p.userGroupId)
        const checked = checkBody(source.body, registrations())
        const newId =
            "ins-flowmap-" +
            String(ec.user.userId)
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "") +
            "-" +
            Date.now()
        const facts = {
            description: source.body.description || "",
            organizationPartyId: String(p.organizationPartyId),
            sourceDefinitionId: source.id,
            sourceVersion
        }
        const title = blank(p.title) ? source.title : p.title
        return saveMap(
            newId,
            title,
            group,
            null,
            facts,
            checked.lanes,
            checked.steps,
            checked.steps,
            "Copied from " + source.id + " version " + sourceVersion
        )
    }, "The map could not be copied")
}
// store#Map: the typed input of design §9 FlowMapEditor. The name, description and sharing are set together when a title is
// given; lanes and steps each replace the map's when given. The organization is the copy's and is not changed here.
function storeMap(p) {
    return attempt(() => {
        const userScope = editor()
        const definition = ownMap(userScope, p)
        const current = checkBody(definition.body, registrations())
        const facts = factsOf(definition.body)
        if (!blank(p.organizationPartyId) && String(p.organizationPartyId) !== facts.organizationPartyId)
            denied("ORGANIZATION_FIXED", "A map stays with its organization; copy it for another")
        const identity = p.title != null
        if (identity) facts.description = p.description
        return saveMap(
            definition.id,
            identity ? p.title : definition.title,
            identity ? shareGroup(p.userGroupId) : definition.userGroupId || null,
            Number(definition.version),
            facts,
            Array.isArray(p.lanes) ? p.lanes : current.lanes,
            Array.isArray(p.steps) ? p.steps : current.steps,
            current.steps,
            blank(p.versionNote) ? "Map changed" : p.versionNote
        )
    }, "The map could not be saved")
}
// A new id for a lane or a step: its name in lower case, unique in the map; ids never change afterwards.
function newId(title, taken, fallback) {
    const base =
        String(title || "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 30) || fallback
    let id = base
    for (let suffix = 2; taken.has(id); suffix++) id = base + "-" + suffix
    return id
}
// Move the row at index one place among the rows that share its group (a step's lane), swapping their order.
function move(list, index, direction, sameGroup) {
    const step = direction === "up" ? -1 : 1
    for (let other = index + step; other >= 0 && other < list.length; other += step) {
        if (!sameGroup(list[other], list[index])) continue
        const moved = list[index]
        list[index] = list[other]
        list[other] = moved
        return
    }
}
const renumber = list => list.forEach((row, index) => (row.sequenceNum = index + 1))
// A step's link parameters as an editor types them (view=draft&late=Y), as a map; a stored map is taken as it is.
function parametersOf(p) {
    if (p.targetParameters && typeof p.targetParameters === "object") return p.targetParameters
    const parameters = {}
    for (const pair of String(p.targetParametersText || "")
        .split(/[&\n,]/)
        .map(text => text.trim())
        .filter(Boolean)) {
        const at = pair.indexOf("=")
        if (at <= 0) denied("PARAMETER_INVALID", "Write a link parameter as name=value")
        parameters[pair.slice(0, at).trim()] = pair.slice(at + 1).trim()
    }
    return parameters
}
// store#MapLane: add a lane (no laneId), rename it, move it up or down, or remove it once it holds no step.
function storeMapLane(p) {
    return attempt(() => {
        const userScope = editor()
        const definition = ownMap(userScope, p)
        const current = checkBody(definition.body, registrations())
        const lanes = current.lanes.map(lane => Object.assign({}, lane))
        let note
        if (blank(p.laneId)) {
            const laneId = newId(p.title, new Set(lanes.map(lane => lane.laneId)), "lane")
            lanes.push({laneId, title: p.title, description: p.description, sequenceNum: lanes.length + 1})
            note = "Lane added: " + laneId
        } else {
            const index = lanes.findIndex(lane => lane.laneId === String(p.laneId))
            if (index < 0) denied("LANE_UNAVAILABLE", "That lane is not in the map")
            if (truthy(p.remove)) {
                const held = current.steps.filter(step => step.laneId === lanes[index].laneId).length
                if (held)
                    denied(
                        "LANE_IN_USE",
                        lanes[index].title + " holds " + held + (held === 1 ? " step" : " steps") + "; move or remove them first"
                    )
                note = "Lane removed: " + lanes[index].laneId
                lanes.splice(index, 1)
            } else if (p.move === "up" || p.move === "down") {
                move(lanes, index, p.move, () => true)
                note = "Lane moved: " + String(p.laneId)
            } else {
                Object.assign(lanes[index], {title: p.title, description: p.description})
                note = "Lane changed: " + lanes[index].laneId
            }
        }
        renumber(lanes)
        return saveMap(
            definition.id,
            definition.title,
            definition.userGroupId || null,
            Number(definition.version),
            factsOf(definition.body),
            lanes,
            current.steps,
            current.steps,
            note
        )
    }, "The lane could not be saved")
}
// store#MapStep: add a step (no stepId) at the end of its lane, change it, move it within its lane, or remove it (the steps
// that led to it no longer do).
function storeMapStep(p) {
    return attempt(() => {
        const userScope = editor()
        const definition = ownMap(userScope, p)
        const current = checkBody(definition.body, registrations())
        let steps = current.steps.map(step => Object.assign({}, step))
        const fields = () => ({
            laneId: p.laneId,
            title: p.title,
            description: p.description,
            targetRegistrationId: p.targetRegistrationId,
            targetParameters: parametersOf(p),
            countProviderKey: p.countProviderKey,
            countMetricId: p.countMetricId,
            catalogEntryId: p.catalogEntryId,
            wikiPageId: p.wikiPageId,
            next: Array.isArray(p.nextStepIds)
                ? p.nextStepIds
                : String(p.nextStepIds || "")
                      .split(",")
                      .map(text => text.trim())
                      .filter(Boolean)
        })
        let note
        if (blank(p.stepId)) {
            const stepId = newId(p.title, new Set(steps.map(step => step.stepId)), "step")
            steps.push(Object.assign({stepId, sequenceNum: steps.length + 1000}, fields()))
            note = "Step added: " + stepId
        } else {
            const index = steps.findIndex(step => step.stepId === String(p.stepId))
            if (index < 0) denied("STEP_UNAVAILABLE", "That step is not in the map")
            const stepId = steps[index].stepId
            if (truthy(p.remove)) {
                steps.splice(index, 1)
                steps.forEach(step => (step.next = step.next.filter(next => next !== stepId)))
                note = "Step removed: " + stepId
            } else if (p.move === "up" || p.move === "down") {
                move(steps, index, p.move, (a, b) => a.laneId === b.laneId)
                renumber(steps)
                note = "Step moved: " + stepId
            } else {
                // a step moved to another lane goes to that lane's end
                const moved = String(p.laneId) !== steps[index].laneId
                Object.assign(steps[index], fields(), moved ? {sequenceNum: steps.length + 1000} : {})
                note = "Step changed: " + stepId
            }
        }
        return saveMap(
            definition.id,
            definition.title,
            definition.userGroupId || null,
            Number(definition.version),
            factsOf(definition.body),
            current.lanes,
            steps,
            current.steps,
            note
        )
    }, "The step could not be saved")
}
// restore#Map: an earlier version of the caller's map as a new current version (the engine's restore), at the version read.
function restoreMap(p) {
    return attempt(() => {
        const userScope = editor()
        const definition = ownMap(userScope, p)
        const version = Number(p.version)
        if (!Number.isInteger(version) || version < 1 || version >= Number(definition.version))
            denied("VERSION_UNAVAILABLE", "Choose an earlier version of the map")
        const restored = insights.asViewer(R + "restore#Definition", {
            definitionId: definition.id,
            version,
            note: "Restored version " + version
        }).definition
        return {definitionId: restored.id, version: Number(restored.version)}
    }, "The version could not be restored")
}
// delete#Map: retire the caller's own map with its versions (the engine refuses one still referenced); a default that
// pointed to it is the caller's to choose again.
function deleteMap(p) {
    return attempt(() => {
        const userScope = editor()
        const definition = ownMap(userScope, p)
        insights.asViewer(R + "delete#Definition", {definitionId: definition.id})
        if (defaultMapId() === definition.id) ec.user.setPreference(defaultKey, "")
        return {definitionId: definition.id, title: shown(definition.title, limits.title)}
    }, "The map could not be removed")
}
// store#DefaultMap: the map FlowMap opens for the caller, one they read; none clears it. The preference grants nothing.
function storeDefaultMap(p) {
    return attempt(() => {
        const userScope = viewer()
        const definitionId = blank(p.definitionId) ? "" : readMap(userScope, p.definitionId).id
        ec.user.setPreference(defaultKey, definitionId)
        return {definitionId: definitionId || null}
    }, "Your default map could not be saved")
}

// ===== the editor =====
const dateText = value => {
    const millis = lib.ms(value)
    return millis == null || Number.isNaN(millis) ? "" : ec.l10n.format(new Date(millis), "yyyy-MM-dd HH:mm")
}
const valueText = value => (value == null ? "" : shown(typeof value === "object" ? JSON.stringify(value) : value, 200))
const fieldWords = {
    title: "name",
    description: "description",
    laneId: "lane",
    sequenceNum: "order",
    targetRegistrationId: "worklist",
    targetParameters: "opened with",
    countProviderKey: "count",
    countMetricId: "measure",
    catalogEntryId: "report",
    wikiPageId: "procedure",
    next: "leads to"
}
// What one version changed, in the map's own terms: its name, sharing and description, and each lane and step added, removed
// or changed, field by field (the engine's diff answers a list as one value). At most a hundred rows.
function mapChanges(from, to) {
    const changes = []
    const add = (op, where, oldValue, newValue) =>
        changes.push({op, path: shown(where, 200), oldText: valueText(oldValue), newText: valueText(newValue)})
    const field = (where, oldValue, newValue) => {
        if (JSON.stringify(oldValue ?? null) === JSON.stringify(newValue ?? null)) return
        add(
            oldValue == null || oldValue === "" ? "Added" : newValue == null || newValue === "" ? "Removed" : "Changed",
            where,
            oldValue,
            newValue
        )
    }
    const before = from?.body || {}
    const after = to?.body || {}
    field("Name", from?.title, to?.title)
    field(
        "Shared with",
        from?.userGroupId ? groupName(from.userGroupId) : null,
        to?.userGroupId ? groupName(to.userGroupId) : null
    )
    field("Description", before.description, after.description)
    const rowsOf = (what, key, oldList, newList) => {
        const byId = list => new Map((Array.isArray(list) ? list : []).map(row => [String(row?.[key]), row || {}]))
        const old = byId(oldList)
        const now = byId(newList)
        for (const [id, row] of now) {
            const was = old.get(id)
            if (!was) add("Added", what + " " + (row.title || id), "", row.title || id)
            else
                for (const name of Object.keys(fieldWords))
                    field(what + " " + (row.title || id) + ": " + fieldWords[name], was[name], row[name])
        }
        for (const [id, row] of old) if (!now.has(id)) add("Removed", what + " " + (row.title || id), row.title || id, "")
    }
    rowsOf("Lane", "laneId", before.lanes, after.lanes)
    rowsOf("Step", "stepId", before.steps, after.steps)
    return changes.slice(0, 100)
}
// get#MapEditor: a map as its editor works on it (design §9 FlowMapEditor): its identity, lanes and steps with each stored
// reference and what is wrong with it, the registrations to choose from, its versions and, for one of them, what it changed.
function getMapEditor(p) {
    const userScope = editor()
    const definition = readMap(userScope, p.definitionId)
    const reg = registrations()
    const checked = checkBody(definition.body, reg)
    const facts = mapFacts(userScope, definition)
    const problemsOf = stepId =>
        checked.problems
            .filter(problem => problem.stepId === stepId)
            .map(problem => problem.message)
            .join(". ")
    // the stored steps, so a reference that does not hold is still shown to be fixed
    const stored = new Map(
        (Array.isArray(definition.body.steps) ? definition.body.steps : []).map(step => [String(step?.stepId), step || {}])
    )
    const laneTitles = new Map(checked.lanes.map(lane => [lane.laneId, lane.title]))
    const steps = checked.steps.map(step => {
        const raw = stored.get(step.stepId) || {}
        const parameters = raw.targetParameters && typeof raw.targetParameters === "object" ? raw.targetParameters : {}
        const target = reg.targets.get(String(raw.targetRegistrationId || ""))
        const targetParametersText = Object.keys(parameters)
            .slice(0, limits.parameters)
            .map(name => shown(name, 40) + "=" + shown(parameters[name], 60))
            .join("&")
        return Object.assign({}, step, {
            laneTitle: laneTitles.get(step.laneId),
            targetRegistrationId: blank(raw.targetRegistrationId) ? null : shown(raw.targetRegistrationId, 60),
            targetParametersText,
            // what the step opens and counts, by the registrations' names
            referenceText: [
                target
                    ? ownerName(target.ownerApp) +
                      " · " +
                      target.title +
                      (targetParametersText ? " (" + targetParametersText + ")" : "")
                    : blank(raw.targetRegistrationId)
                      ? ""
                      : "A worklist that is not registered",
                step.countProviderKey ? "Count: " + reg.providers.get(step.countProviderKey).title : "",
                step.countMetricId ? "Measure: " + reg.metrics.get(step.countMetricId).title : "",
                step.catalogEntryId ? "Report: " + reg.entries.get(step.catalogEntryId).title : "",
                step.wikiPageId ? "Procedure" : ""
            ]
                .filter(Boolean)
                .join(" · "),
            countProviderKey: blank(raw.countProviderKey) ? null : shown(raw.countProviderKey, 60),
            countMetricId: blank(raw.countMetricId) ? null : shown(raw.countMetricId, 60),
            catalogEntryId: blank(raw.catalogEntryId) ? null : shown(raw.catalogEntryId, 60),
            nextStepIds: step.next,
            problemText: problemsOf(step.stepId)
        })
    })
    const option = (value, label) => ({value: String(value), label})
    const contractText = targetId => {
        const names = Array.from(reg.contracts.get(targetId))
            .filter(([, rule]) => rule.type === "choice")
            .map(([name, rule]) => name + " = " + rule.values.join(" | "))
        return names.length ? names.join("; ") : ""
    }
    const names = new Map([[ec.user.userId, "You"]])
    const nameOf = userId => {
        if (!names.has(userId)) names.set(userId, one("moqui.security.UserAccount", {userId})?.userFullName || "")
        return names.get(userId)
    }
    // the newest fifty versions
    const versions = Array.from(insights.asViewer(R + "versions#Definition", {definitionId: definition.id}).versions || [])
        .sort((a, b) => Number(b.version) - Number(a.version))
        .slice(0, 50)
        .map(row => ({
            version: Number(row.version),
            note: shown(row.note, 200),
            changedBy: nameOf(row.changedBy),
            changedText: dateText(row.changedDate),
            current: Number(row.version) === Number(definition.version)
        }))
    let changes = []
    let diffVersion = null
    if (!blank(p.diffVersion) && versions.some(row => row.version === Number(p.diffVersion))) {
        diffVersion = Number(p.diffVersion)
        const diff = insights.asViewer(R + "get#DefinitionDiff", {
            definitionId: definition.id,
            fromVersion: diffVersion - 1,
            toVersion: diffVersion
        })
        changes = mapChanges(diff.from, diff.to)
    }
    return {
        map: facts,
        canEdit: facts.canEdit,
        lanes: checked.lanes.map(lane =>
            Object.assign({}, lane, {stepCount: checked.steps.filter(step => step.laneId === lane.laneId).length})
        ),
        steps,
        problems: checked.problems,
        options: {
            lanes: checked.lanes.map(lane => option(lane.laneId, lane.title)),
            steps: checked.steps.map(step => option(step.stepId, laneTitles.get(step.laneId) + " · " + step.title)),
            targets: Array.from(reg.targets.values()).map(target =>
                option(target.targetId, ownerName(target.ownerApp) + " · " + target.title)
            ),
            providers: Array.from(reg.providers.values()).map(provider =>
                option(provider.providerKey, ownerName(provider.ownerApp) + " · " + provider.title)
            ),
            metrics: Array.from(reg.metrics.values())
                .filter(metric => !metric.requiredPermission || lib.access.has(metric.requiredPermission))
                .map(metric => option(metric.metricId, ownerName(metric.ownerApp) + " · " + metric.title)),
            entries: Array.from(reg.entries.values()).map(entry =>
                option(entry.entryId, ownerName(entry.ownerApp) + " · " + entry.title)
            ),
            groups: insights.execute("shareGroups", {}).groups
        },
        // the parameters each worklist takes, for the step form's help
        targetParameters: Array.from(reg.targets.values())
            .map(target => ({
                title: ownerName(target.ownerApp) + " · " + target.title,
                parametersText: contractText(String(target.targetId))
            }))
            .filter(row => row.parametersText),
        versions,
        diffVersion,
        changes
    }
}
// find#MapPages: the Knowledge pages an editor may link a step to, by text: the wiki's own search as the caller, for one whose
// own grants open Commons Knowledge; a selected page outside the answer is read on its own.
function findMapPages(p) {
    editor()
    let knowledgeOpens = false
    try {
        knowledgeOpens = admin.destinationOpens(insights.grants(), knowledgePath)
    } catch (error) {
        knowledgeOpens = false
    }
    if (!knowledgeOpens) return {pages: []}
    const pages = []
    try {
        if (!blank(p.selected) && pagePattern.test(String(p.selected))) {
            const page = apart("ironstone.commons.KnowledgeServices.get#PageRef", {wikiPageId: String(p.selected), need: "view"})
            if (page.found) pages.push({value: page.wikiPageId, label: pageTitle(page)})
        }
        if (!blank(p.term)) {
            const found = apart("ironstone.commons.KnowledgeServices.search#Pages", {
                text: String(p.term),
                scope: "knowledge",
                limit: 15
            })
            for (const hit of Array.from(found.pageList || []))
                if (hit.wikiPageId && !pages.some(page => page.value === hit.wikiPageId))
                    pages.push({
                        value: hit.wikiPageId,
                        label: shown(
                            (hit.title || hit.pagePath || hit.wikiPageId) + " · " + (hit.spaceDescription || hit.wikiSpaceId),
                            120
                        )
                    })
        }
    } catch (error) {
        ec.logger.warn("Insights flow map page search: " + error.message)
    }
    return {pages}
}
// The viewer's own grants open Commons Knowledge: what ProcessStory's mount asks before it serves anything below it.
function storyAccess() {
    try {
        viewer()
        return {opens: admin.destinationOpens(insights.grants(), knowledgePath)}
    } catch (error) {
        return {opens: false}
    }
}

const operations = {
    findMaps,
    getMap,
    validateMap,
    copyMap,
    storeMap,
    storeMapLane,
    storeMapStep,
    restoreMap,
    deleteMap,
    storeDefaultMap,
    getMapEditor,
    findMapPages,
    storyAccess
}
;({
    execute: (op, parameters) => {
        if (!Object.hasOwn(operations, op)) throw new Error("Unknown Insights flow map operation " + op)
        return operations[op](parameters || {})
    }
})
