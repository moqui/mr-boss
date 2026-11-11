// Insights' business flow maps (impl-insights P9; design-insights §9, §13.3 "Editable map copies"; INS-08): the shipped
// templates and the registered flow targets hold together; a flow editor's copy keeps its provenance and its organization, a
// reader of that organization reads it and another organization's does not, and only a flow editor copies; a stale version is
// refused, and a step is saved only with a registered worklist and the parameters it takes; a map saved through the report
// engine (as Tools saves one) with an unregistered target, a stored URL, an expression and markup in its text renders that
// step as information, with no link, nothing run and the markup as text (FlowMap's one qvt render, its XML widgets); a link and a count are answered only
// to a viewer who reads their owner's list; and a step's procedure is a Knowledge page its viewer reads, ProcessStory serving
// Knowledge only to a user whose own grants open it (on the demo's Returns policy page). The
// "usable when" scenario is the acceptance InsightsFlowMapsUsable.
// Run: ./moq test mr-boss --spec InsightsFlowMaps
const lib = ec.resource.script("component://mr-boss/test/Insights/InsightsSpecLib.js")
const {ids, users, asUser, system, refusal, invoke, page, screenRefusal} = lib
const F = "ironstone.insights.FlowMapServices."
const R = "org.moqui.report.ReportServices."
const templates = ["insights-flowmap-customer", "insights-flowmap-internal", "insights-flowmap-supplier"]
const toolsMapId = "insflowspec-tools"
const outsiderId = "INS_FLOW_SPEC_OUTSIDER"
const outsider = "insights.flowspec.outsider"
let copyId = null

const stored = definitionId =>
    system(() => {
        const row = ec.entity.find("moqui.report.Definition").condition("definitionId", definitionId).useCache(false).one()
        return row
            ? {
                  body: JSON.parse(String(row.bodyJson)),
                  version: Number(row.versionNumber),
                  ownerId: row.ownerId,
                  group: row.userGroupId
              }
            : null
    })
function removeSpecData() {
    system(() => {
        const definitions = ec.entity
            .find("moqui.report.Definition")
            .condition("definitionId", "like", "ins-flowmap-bossinsflow-%")
            .list()
        for (const definitionId of Array.from(definitions)
            .map(row => row.definitionId)
            .concat([toolsMapId])) {
            for (const entityName of [
                "moqui.report.DefinitionVersion",
                "moqui.report.DefinitionReference",
                "moqui.report.Definition"
            ])
                ec.entity.find(entityName).condition("definitionId", definitionId).deleteAll()
        }
        ec.entity.find("moqui.security.UserPreference").condition("preferenceKey", "InsightsFlowMap").deleteAll()
        ec.entity.find("moqui.security.UserGroupMember").condition("userId", outsiderId).deleteAll()
        ec.entity.find("moqui.security.UserAccount").condition("userId", outsiderId).deleteAll()
        ec.entity.find("mantle.party.PartyRelationship").condition("fromPartyId", outsiderId).deleteAll()
        // the forum's tracking mode, made for a party at its first sign-in
        ec.entity.find("mantle.forum.ForumTrackingMode").condition("partyId", outsiderId).deleteAll()
        ec.entity.find("mantle.party.Party").condition("partyId", outsiderId).deleteAll()
    })
}
// Whether a route names a screen: its file, or a subscreens-item of its parent screen.
function screenExists(route) {
    const base = "component://mr-boss/screen/"
    if (ec.resource.getLocationReference(base + route + ".xml").getExists()) return true
    const parts = route.split("/")
    const parent = ec.resource.getLocationReference(base + parts.slice(0, -1).join("/") + ".xml")
    return parent.getExists() && String(parent.getText()).includes('subscreens-item name="' + parts[parts.length - 1] + '"')
}
const stepOf = (map, stepId) => Array.from(map.steps || []).find(step => step.stepId === stepId) || {}

spec({
    stepwise: true,
    setupSpec() {
        login(users.system)
        removeSpecData()
        // an Insights reader of Ziziwork Retail who is not a BOSS user: no grant of theirs opens Commons
        system(() => {
            ec.service
                .sync()
                .name("create#mantle.party.Party")
                .parameters({partyId: outsiderId, partyTypeEnumId: "PtyPerson"})
                .call()
            ec.service
                .sync()
                .name("create#mantle.party.PartyRelationship")
                .parameters({
                    partyRelationshipId: outsiderId,
                    relationshipTypeEnumId: "PrtAgent",
                    fromPartyId: outsiderId,
                    toPartyId: ids.organizationId,
                    toRoleTypeId: "OrgInternal",
                    fromDate: 0
                })
                .call()
            ec.service
                .sync()
                .name("create#moqui.security.UserAccount")
                .parameters({
                    userId: outsiderId,
                    username: outsider,
                    userFullName: "Flow Spec Outsider",
                    partyId: outsiderId,
                    // the demo users' password, so the spec can sign in as them
                    currentPassword: "16ac58bbfa332c1c55bd98b53e60720bfa90d394",
                    passwordHashType: "SHA"
                })
                .call()
            for (const userGroupId of ["BOSS_INSIGHTS", "BOSS_INSIGHTS_READ"])
                ec.service
                    .sync()
                    .name("create#moqui.security.UserGroupMember")
                    .parameters({userGroupId, userId: outsiderId, fromDate: 0})
                    .call()
        })
    },
    cleanupSpec() {
        ec.message.clearErrors()
        login(users.system)
        removeSpecData()
    }
})

feature("the shipped templates are valid against the registrations, and every flow target names an owner's screen", {
    when() {
        const problems = []
        for (const definitionId of templates) {
            const checked = invoke(F + "validate#Map", {definitionId})
            if (!checked.valid || checked.stepCount < 10)
                problems.push(definitionId + ": " + checked.stepCount + " steps, " + JSON.stringify(checked.problems))
        }
        const targets = system(() => Array.from(ec.entity.find("ironstone.insights.FlowTarget").list()))
        for (const target of targets) {
            if (!screenExists(target.routePath)) problems.push(target.targetId + " names no screen: " + target.routePath)
            try {
                const contract = target.parameterContract ? JSON.parse(String(target.parameterContract)) : {}
                for (const [name, rule] of Object.entries(contract))
                    if (rule.type !== "organization" && !(rule.type === "choice" && rule.values.length))
                        problems.push(target.targetId + " parameter " + name + " has no type")
            } catch (error) {
                problems.push(target.targetId + " contract: " + error.message)
            }
        }
        return {problems, targetCount: targets.length}
    },
    then({problems, targetCount}) {
        problems.join("\n") == ""
        targetCount >= 30
    }
})

feature("a flow editor's copy keeps its provenance and organization; its organization's reader reads it, others do not", {
    when() {
        const copyInput = extra =>
            Object.assign(
                {
                    sourceDefinitionId: templates[0],
                    sourceVersion: 1,
                    organizationPartyId: ids.organizationId,
                    title: "Retail customer flow",
                    userGroupId: "BOSS_INSIGHTS"
                },
                extra
            )
        const copied = asUser(users.flow, () => invoke(F + "copy#Map", copyInput()))
        copyId = copied.definitionId
        return {
            copied,
            saved: copied.applied ? stored(copyId) : null,
            own: copied.applied ? asUser(users.flow, () => invoke(F + "get#Map", {definitionId: copyId})) : {},
            reader: copied.applied ? asUser(users.reader, () => invoke(F + "get#Map", {definitionId: copyId})) : {},
            // the same call by a reader of another organization, in a group the map is shared with
            services: asUser(users.services, () => refusal(F + "get#Map", {definitionId: copyId})),
            listed: asUser(users.services, () => invoke(F + "find#Maps", {})).maps.map(row => row.definitionId),
            readerCopy: asUser(users.reader, () => invoke(F + "copy#Map", copyInput())),
            otherOrganization: asUser(users.flow, () =>
                invoke(F + "copy#Map", copyInput({organizationPartyId: ids.otherOrganizationId}))
            ),
            staleSource: asUser(users.flow, () => invoke(F + "copy#Map", copyInput({sourceVersion: 0}))),
            notOwnGroup: asUser(users.flow, () => invoke(F + "copy#Map", copyInput({userGroupId: "BOSS_ACCOUNTING_READ"})))
        }
    },
    then({copied, saved, own, reader, services, listed, readerCopy, otherOrganization, staleSource, notOwnGroup}) {
        copied.applied == true
        saved.body.kind == "flowmap"
        saved.body.sourceDefinitionId == "insights-flowmap-customer"
        saved.body.sourceVersion == 1
        saved.body.organizationPartyId == "ORG_ZIZI_RETAIL"
        saved.ownerId == "BOSS_INS_FLOW"
        saved.body.steps.length == 14
        own.map.sourceText == "Copied from Customer flow, version 1"
        own.map.canEdit == true
        reader.map.title == "Retail customer flow"
        reader.map.canEdit == false
        reader.map.canCopy == false
        services.includes("MAP_UNAVAILABLE")
        listed.includes("insights-flowmap-customer")
        !listed.includes(copyId)
        readerCopy.applied == false
        readerCopy.reasonCode == "FLOW_EDIT_REQUIRED"
        otherOrganization.reasonCode == "ORGANIZATION_UNAVAILABLE"
        staleSource.reasonCode == "SOURCE_CHANGED"
        notOwnGroup.reasonCode == "SHARE_GROUP_UNAVAILABLE"
    }
})

feature("a stale version is refused; a step is saved only with a registered worklist and the parameters it takes", {
    when() {
        const step = extra =>
            Object.assign(
                {
                    definitionId: copyId,
                    stepId: "approve",
                    laneId: "selling",
                    title: "Order approved",
                    targetRegistrationId: "Commerce.Orders"
                },
                extra
            )
        const save = extra => asUser(users.flow, () => invoke(F + "store#MapStep", step(extra)))
        const renamed = save({expectedVersion: 1, title: "Manager approves", targetParametersText: "statusId=OrderPlaced"})
        return {
            renamed,
            stale: save({expectedVersion: 1, title: "Second editor"}),
            unregistered: save({targetRegistrationId: "Tools.Anything"}),
            badValue: save({targetParametersText: "statusId=Bogus"}),
            unknownParameter: save({targetParametersText: "redirect=//evil.example"}),
            fixedOrganization: save({
                targetRegistrationId: "Accounting.Bills",
                targetParametersText: "organizationPartyId=ORG_ZIZI_SERVICES"
            }),
            expression: save({title: "${ec.user.userId}"}),
            missingPage: save({wikiPageId: "INS_FLOW_SPEC_NO_PAGE"}),
            template: asUser(users.flow, () => invoke(F + "store#Map", {definitionId: templates[0], title: "Mine now"})),
            // the report engine's own save by a reader, who holds no grant of it
            readerStore: asUser(users.reader, () => invoke(F + "store#Map", {definitionId: copyId, title: "Reader's"})),
            saved: stored(copyId)
        }
    },
    then({
        renamed,
        stale,
        unregistered,
        badValue,
        unknownParameter,
        fixedOrganization,
        expression,
        missingPage,
        template,
        readerStore,
        saved
    }) {
        renamed.applied == true
        renamed.version == 2
        stale.applied == false
        stale.reasonCode == "MAP_CHANGED"
        unregistered.reasonCode == "TARGET_UNREGISTERED"
        badValue.reasonCode == "PARAMETER_INVALID"
        unknownParameter.reasonCode == "PARAMETER_UNKNOWN"
        fixedOrganization.reasonCode == "PARAMETER_FIXED"
        expression.reasonCode == "TEXT_INVALID"
        missingPage.reasonCode == "PAGE_UNAVAILABLE"
        template.reasonCode == "MAP_READ_ONLY"
        readerStore.reasonCode == "FLOW_EDIT_REQUIRED"
        saved.version == 2
        saved.body.steps.find(step => step.stepId === "approve").title == "Manager approves"
        saved.body.steps.find(step => step.stepId === "approve").targetParameters.statusId == "OrderPlaced"
        saved.body.sourceVersion == 1
    }
})

feature("a map saved through Tools with an unregistered target renders that step as information, and nothing in it is run", {
    when() {
        // the system administrator saves a definition directly, as Tools' definition editor does: no Insights check runs
        const body = {
            kind: "flowmap",
            organizationPartyId: ids.organizationId,
            description: "Saved outside ${ec.user.username} Insights",
            lanes: [{laneId: "lane", title: "Spec lane", sequenceNum: 1}],
            steps: [
                {
                    stepId: "rogue",
                    laneId: "lane",
                    title: "Pay ${1+1} now",
                    sequenceNum: 1,
                    targetRegistrationId: "Tools.Anything",
                    url: "https://evil.example/pay",
                    countProviderKey: "Tools.NoSuchCount"
                },
                {
                    stepId: "extra",
                    laneId: "lane",
                    title: "Extra parameter",
                    sequenceNum: 2,
                    targetRegistrationId: "Commerce.Orders",
                    targetParameters: {statusId: "OrderPlaced", next: "https://evil.example/next"}
                },
                {
                    stepId: "cases",
                    laneId: "lane",
                    // markup and a template of the browser's in a name: shown as text
                    title: "Spec cases <img src=x onerror=alert(1)> {{7*7}}",
                    sequenceNum: 3,
                    targetRegistrationId: "CustomerService.Cases",
                    targetParameters: {view: "unassigned"}
                }
            ]
        }
        system(() =>
            invoke(R + "save#Definition", {
                definition: {id: toolsMapId, type: "report", title: "Spec tools map", body, userGroupId: "BOSS_INSIGHTS"}
            })
        )
        // the owner, a system administrator who opens every app: FlowMap's one render (qvt, its XML widgets)
        const rendered = page("Flows/FlowMap", {definitionId: toolsMapId, stepId: "cases"})
        const owner = invoke(F + "get#Map", {definitionId: toolsMapId})
        const reader = asUser(users.reader, () => invoke(F + "get#Map", {definitionId: toolsMapId}))
        return {
            rendered,
            owner,
            reader,
            rogue: stepOf(owner, "rogue"),
            extra: stepOf(owner, "extra"),
            cases: stepOf(owner, "cases"),
            readerCases: stepOf(reader, "cases"),
            answer: JSON.stringify(owner)
        }
    },
    then({rendered, owner, reader, rogue, extra, cases, readerCases, answer}) {
        rendered.status == 200
        rendered.errors.join(" | ") == ""
        rendered.output.includes("Spec tools map")
        rendered.output.includes("Spec lane")
        rendered.output.includes("Steps in order")
        rendered.output.includes("/qapps/CustomerService/Cases/Cases?view=unassigned")
        rendered.output.includes("Information")
        rendered.output.includes("not registered")
        !rendered.output.includes("evil.example")
        !rendered.output.includes("Pay 2 now")
        !rendered.output.includes("Saved outside john.doe")
        // a name's markup is escaped wherever it is drawn, and its braces where the browser would read a template
        !rendered.output.includes("<img src=x")
        rendered.output.includes("Spec cases &lt;img src=x")
        !/>[^<]*\{\{7\*7\}\}/.test(rendered.output)
        rogue.live == false
        rogue.stateText == "Information"
        rogue.url == null
        rogue.countText == ""
        rogue.title == "Pay $ {1+1} now"
        // one parameter the worklist does not take leaves the step without its link
        extra.url == null
        cases.url == "/qapps/CustomerService/Cases/Cases?view=unassigned"
        // the unregistered worklist and count, the parameter and the expression in a name
        owner.problemCount == 4
        !answer.includes("evil.example")
        // a reader is told nothing of what does not hold, and is given no link to an app they do not open
        reader.problemCount == 0
        reader.map.title == "Spec tools map"
        readerCases.url == null
        readerCases.stateText == "Information"
    }
})

feature("a worklist link and a count are answered only to a viewer who reads their owner's list", {
    when() {
        const system = invoke(F + "get#Map", {definitionId: templates[0], organizationPartyId: ids.organizationId})
        const internal = invoke(F + "get#Map", {definitionId: templates[1], organizationPartyId: ids.organizationId, counts: "N"})
        const reader = asUser(users.reader, () => invoke(F + "get#Map", {definitionId: templates[0]}))
        return {
            approve: stepOf(system, "approve"),
            quote: stepOf(system, "quote"),
            edge: Array.from(system.edges).find(edge => edge.source === "approve") || {},
            books: stepOf(internal, "books"),
            readerLinks: Array.from(reader.steps).filter(step => step.url || step.countText || step.countUrl || step.reportUrl)
                .length,
            readerApprove: stepOf(reader, "approve"),
            readerLanes: reader.lanes.length,
            // another organization's counts are not asked for
            forged: asUser(users.reader, () =>
                refusal(F + "get#Map", {definitionId: templates[0], organizationPartyId: ids.otherOrganizationId})
            )
        }
    },
    then({approve, quote, edge, books, readerLinks, readerApprove, readerLanes, forged}) {
        approve.url == "/qapps/Commerce/Orders/Orders?statusId=OrderPlaced"
        approve.countTitle == "To approve"
        approve.countText != ""
        approve.countUrl.includes("Commerce/Orders/Orders?statusId=OrderPlaced")
        edge.target == "pick"
        edge.sourceGroup == "Sales and stores"
        edge.targetGroup == "Warehouse"
        // a step of an app that is not built
        quote.live == false
        quote.stateText == "Information"
        // the organization of the map's scope is set here, and counts off asks no owner
        books.url == "/qapps/Accounting/GeneralLedger/JournalEntries?isPosted=N&organizationPartyId=ORG_ZIZI_RETAIL"
        books.countText == ""
        readerLanes == 5
        readerLinks == 0
        readerApprove.title == "Order approved"
        readerApprove.stateText == "Information"
        forged.includes("ORGANIZATION_UNAVAILABLE")
    }
})

feature(
    "a step's procedure is a Knowledge page its viewer reads; ProcessStory serves Knowledge only to one whose own grants open it",
    {
        when() {
            const pages = asUser(users.flow, () => invoke(F + "find#MapPages", {term: "Returns policy"})).pages
            const pageId = pages.length ? pages[0].value : null
            const linked = asUser(users.flow, () =>
                invoke(F + "store#MapStep", {
                    definitionId: copyId,
                    expectedVersion: 2,
                    stepId: "return",
                    laneId: "care",
                    title: "Return or exchange",
                    targetRegistrationId: "CustomerService.Returns",
                    wikiPageId: pageId
                })
            )
            return {
                pageId,
                linked,
                own: stepOf(
                    asUser(users.flow, () => invoke(F + "get#Map", {definitionId: copyId})),
                    "return"
                ),
                reader: asUser(users.reader, () => invoke(F + "get#StoryAccess", {})).opens,
                outsiderAccess: asUser(outsider, () => invoke(F + "get#StoryAccess", {})).opens,
                // the map is the outsider's to read; its procedure and the Knowledge mount are not
                outsiderStep: stepOf(
                    asUser(outsider, () => invoke(F + "get#Map", {definitionId: copyId})),
                    "return"
                ),
                outsiderStory: screenRefusal(outsider, "Flows/ProcessStory/Knowledge/setup")
            }
        },
        then({pageId, linked, own, reader, outsiderAccess, outsiderStep, outsiderStory}) {
            pageId != null
            linked.applied == true
            own.articleTitle == "Returns policy"
            own.articleUrl.startsWith("/qapps/Insights/Flows/ProcessStory/Knowledge?wikiPageId=" + pageId + "&definitionId=")
            reader == true
            outsiderAccess == false
            outsiderStep.title == "Return or exchange"
            outsiderStep.articleUrl == null
            outsiderStep.articleTitle == ""
            outsiderStory.includes("PROCESS_STORY_UNAVAILABLE")
        }
    }
)
