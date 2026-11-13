// The Sales app's access and context (impl-sales §2, P1; design-sales §1.1, §1.2, §12.1): who may open Sales, their capabilities
// and organizations, the record check every Sales screen and shared mount runs before a Mantle service, the drop-downs, the
// palette and the canonical links. The scope itself is Mantle's (mantle/sales/SalesAccess.js: the SALES_* permissions and the
// user's organizations), read once per call here; the Mantle services check it again, and nothing here grants what Mantle
// refuses.
//
// Opening Sales needs the root grant of one of the user's groups (BOSS_SALES, the root user group, or BOSS_SALES_ADMIN), read
// directly so an inherited or disabled authorization cannot widen it (impl-admin F35, as People.js and Maintenance.js); the root
// grant opens navigation only. A system administrator (ADMIN) opens everything. A Projects client contact (PROJECT_CLIENT) never
// opens Sales, and a PASS public account holds no BOSS group.
//
// Later phases extend the tables below rather than the functions: mountRoots (the app roots that mount Sales' shared screens:
// Marketing's since P4), areas (menu areas whose authorization is a capability), recordKinds (a kind of record: its check and,
// once built, its screen), searchFinds (the palette), choiceSources (the drop-downs) and linkPaths (sharedLinks).
const lib = ec.resource.script("component://mr-mantle/service/mantle/ledger/EntityLib.js")
const salesAccess = ec.resource.script("component://mr-mantle/service/mantle/sales/SalesAccess.js")
const {find, one, denied} = lib
const access = lib.access

const rootLocation = "component://mr-boss/screen/Sales.xml"
const areaLocation = area => "component://mr-boss/screen/Sales/" + area + ".xml"
const choiceLimit = 30
const organizationOptionLimit = 100

// The app roots whose screens take Sales' context, each with its link base and the Sales screens it mounts (paths: every Sales path
// under the same name when null, else Sales' path to the root's own). Sales' own; Marketing's (P4, impl-sales §2, F86;
// design-marketing §2: Marketing/Leads and Marketing/Settings/LeadSources, impl-marketing P13), whose sharedLinks hold only what it
// mounts, so a lead's OpportunityDetail, which Marketing does not mount, shows without a link there. Any other root is refused
// (SALES_CONTEXT); a mount adds no right: the user's own Sales grant and scope decide.
const mountRoots = {
    Sales: {linkBase: "//Sales", paths: null},
    Marketing: {linkBase: "//Marketing", paths: {"Pipeline/Leads": "Leads", "Settings/LeadSources": "Settings/LeadSources"}}
}
// The menu areas whose authorization is a capability (data/BossSetupSalesData.xml BOSS_SAL_<Area>): Reports the report readers'
// (P1). Home is every Sales user's; later phases add theirs (Settings P2, Approvals P9, Changes P14, Agreements P15).
const areas = {
    reports: "Reports",
    // P3: MergeAccounts, the manager's and the administrator's (BOSS_SAL_MERGE), who also hold the merge capability below
    mergeAccounts: "Accounts/MergeAccounts",
    // P2: Settings (BOSS_SAL_SETTINGS), the administrator's and, for Teams, the manager's
    settings: "Settings"
}

// ===== scope =====
// The user's screen authorizations, read directly (as People.js): screenAuthz reads the groups' rows once, and screenGrants
// picks a screen's from them (ALWAYS over DENY over ALLOW).
function screenAuthz(groupIds) {
    return Array.from(
        find("moqui.security.ArtifactAuthzCheckView")
            .condition("userGroupId", "in", groupIds)
            .condition("artifactTypeEnumId", "AT_XML_SCREEN")
            .condition("authzActionEnumId", "in", ["AUTHZA_ALL", "AUTHZA_VIEW"])
            .list()
    )
}
function screenGrants(location, authzRows) {
    const grants = authzRows.filter(row =>
        row.nameIsPattern === "Y" ? new RegExp("^(?:" + row.artifactName + ")$").test(location) : row.artifactName === location
    )
    const always = grants.filter(row => row.authzTypeEnumId === "AUTHZT_ALWAYS")
    const allowed = always.length
        ? always
        : grants.some(row => row.authzTypeEnumId === "AUTHZT_DENY")
          ? []
          : grants.filter(row => row.authzTypeEnumId === "AUTHZT_ALLOW")
    return {found: grants.length > 0, allowed, always: always.length > 0}
}
function rootGrants() {
    const none = {read: false, authzRows: []}
    if (!ec.user.userId || ec.user.hasPermission("PROJECT_CLIENT")) return none
    if (access.systemAdmin()) return {read: true, authzRows: [], systemAdmin: true}
    const groupIds = Array.from(ec.user.getUserGroupIdSet() || [])
    if (!groupIds.length) return none
    const authzRows = screenAuthz(groupIds)
    const root = screenGrants(rootLocation, authzRows)
    return {read: root.allowed.length > 0, rootAlways: root.always, authzRows}
}
// An area's grant: the root's ALWAYS (the Sales administrator's, ADMIN's) passes every area below it; otherwise the area's own
// rows decide when it has any, else the root's.
function areaGrant(grants, area) {
    if (!grants.read) return false
    if (grants.systemAdmin || grants.rootAlways) return true
    const found = screenGrants(areaLocation(area), grants.authzRows)
    return found.found ? found.allowed.length > 0 : true
}

// The scope of the current user: the root grant, Mantle's sales scope and the areas. Without the root grant nothing of Mantle's
// scope is read. An area needs its grant and, for Reports, the permission its screens' services check (SALES_REPORT_VIEW), so a
// custom group given Sales in Admin, which is no member of BOSS_SALES and not reached by the area's deny, is shown no area its
// services refuse (impl-maintenance F346's lesson).
// P2: Settings needs SALES_CONFIGURE or, for Teams alone, SALES_TEAM_MANAGE (the Mantle setup services' checks)
const areaReads = {reports: "reportRead", settings: caps => !!(caps.configure || caps.teamManage)}
function scope() {
    const grants = rootGrants()
    const mantle = grants.read ? salesAccess.scope() : null
    const capabilities = Object.assign({read: grants.read}, mantle?.capabilities || {})
    for (const [name, area] of Object.entries(areas))
        capabilities[name] =
            areaGrant(grants, area) &&
            (!areaReads[name] ||
                (typeof areaReads[name] === "function" ? areaReads[name](capabilities) : !!capabilities[areaReads[name]]))
    // whether the sales reports answer the user with costs (SalesAnalysis.js organizations: withheld from a Sales report reader
    // without PRODUCT_COST_VIEW, kept for report read), so a report leaves out what the services withhold rather than show it as
    // zero; borrowed authority, never a Sales permission (impl-sales §2)
    capabilities.reportCosts = grants.read && (access.has("ACCOUNTING_VIEW") || access.has("PRODUCT_COST_VIEW"))
    // P3: the merge of accounts is a Sales manager's or administrator's (Mantle's merge guards, PartyMerge.js: SALES_ACCOUNT_EDIT with
    // SALES_TEAM_MANAGE or SALES_CONFIGURE, for an account of their organization), and an invoice of an account a finance reader's
    // (borrowed authority, ACCOUNTING_VIEW or RECEIVABLE_VIEW)
    capabilities.mergeAccounts =
        !!capabilities.mergeAccounts && !!capabilities.accountEdit && !!(capabilities.teamManage || capabilities.configure)
    capabilities.financeRead = grants.read && (access.has("ACCOUNTING_VIEW") || access.has("RECEIVABLE_VIEW"))
    return {read: grants.read, mantle: mantle || {organizationPartyIds: [], capabilities: {}}, capabilities}
}
function required(userScope = scope()) {
    if (!userScope.read) denied("SALES_UNAVAILABLE", "Sales is not available")
    return userScope
}
const likeText = text => "%" + String(text).replace(/[\\%_]/g, character => "\\" + character) + "%"
function organizationName(partyId) {
    const organization = partyId ? one("mantle.party.Organization", {partyId}) : null
    return organization?.organizationName || partyId || ""
}
// The organizations of the scope: its list, or every internal organization when it is every one (null).
function organizationIds(userScope) {
    const ids = userScope.mantle.organizationPartyIds
    if (ids != null) return Array.from(ids)
    return Array.from(find("mantle.party.PartyRole").condition("roleTypeId", "OrgInternal").selectField("partyId").list()).map(
        row => row.partyId
    )
}
const covers = (userScope, partyId) => salesAccess.covers(userScope.mantle, partyId)
// Organizations as options, by name, searched in the query ignoring case.
function organizationOptions(partyIds, term, limit) {
    if (!partyIds.length) return []
    let query = find("mantle.party.Organization").condition("partyId", "in", partyIds).orderBy("^organizationName").limit(limit)
    if (term) {
        const factory = ec.entity.conditionFactory
        query = query.condition(
            factory.makeCondition(
                ["partyId", "organizationName"].map(field => factory.makeCondition(field, "like", likeText(term)).ignoreCase()),
                "or"
            )
        )
    }
    return Array.from(query.list()).map(row => ({value: row.partyId, label: row.organizationName || row.partyId}))
}

// ===== shared context =====
// The Sales routes other screens link to (sharedLinks), by path under the root; each phase adds its screens.
const linkPaths = [
    // P1: Home and the two reports ported in the first port (design §1.2, §8)
    "Home",
    "Reports",
    "Reports/SalesSummary",
    "Reports/SalesAnalysis",
    // P3: accounts and contacts (design §4)
    "Accounts",
    "Accounts/Accounts",
    "Accounts/Contacts",
    "Accounts/Customer360",
    "Accounts/ContactDetail",
    "Accounts/MergeAccounts",
    "Accounts/MergeCompare",
    // P2: Settings (design §9), LeadSources built for a second mount (impl-sales §2)
    "Settings",
    "Settings/Readiness",
    "Settings/Stages",
    "Settings/Teams",
    "Settings/LeadSources",
    "Settings/TypesAndReasons",
    // P4: leads and opportunities (design §3), Leads built for a second mount (impl-sales §2)
    "Pipeline",
    "Pipeline/Opportunities",
    "Pipeline/Leads",
    "Pipeline/OpportunityDetail",
    "Pipeline/WorkItemDetail"
]
function sharedContext(p) {
    const appRoot = p.appRoot || "Sales"
    if (!Object.hasOwn(mountRoots, appRoot)) denied("SALES_CONTEXT", "Sales context is not available")
    const userScope = required()
    const mantle = userScope.mantle
    const ids = organizationIds(userScope)
    const mount = mountRoots[appRoot]
    const linkBase = mount.linkBase
    const sharedLinks = mount.paths
        ? Object.fromEntries(Object.entries(mount.paths).map(([path, own]) => [path, linkBase + "/" + own]))
        : Object.fromEntries(linkPaths.map(path => [path, linkBase + "/" + path]))
    return {
        capabilities: userScope.capabilities,
        organizationPartyIds: ids,
        activeOrganizationPartyId: mantle.activeOrganizationPartyId || null,
        // a new record's organization when none is chosen: the active one, the scope's only one, or the only one of it the user
        // works for (a representative of Retail whose scope also holds Retail's rollup children; P4 review)
        defaultOrganizationPartyId: salesAccess.defaultOrganization(mantle),
        allOrganizations: !!mantle.allOrganizations,
        organizationOptions: organizationOptions(ids, null, organizationOptionLimit),
        partyId: mantle.partyId || null,
        appRoot,
        linkBase,
        webBase: "/qapps/" + appRoot,
        sharedLinks
    }
}

// ===== record kinds =====
// Each kind a Sales screen or mount may be given: its name, icon, screen (once built) and its check, which refuses a record that
// does not exist and one outside the scope alike (RECORD_UNAVAILABLE). P1: an organization; later phases add theirs (an account
// P3, an opportunity P4, a quote P7, an order P11, an agreement P15, a forecast P18).
const recordKinds = {
    organization: {
        name: "Organization",
        icon: "sym_o_corporate_fare",
        destination: null,
        read: (userScope, partyId) => {
            if (!userScope.capabilities.anyRead || !covers(userScope, partyId)) return null
            return {organizationPartyId: partyId, label: organizationName(partyId), detail: "Organization"}
        }
    },
    // P3: an account of the scope (SalesAccess.js accountOf: its organization's or shared) and a person seen through one (an
    // account itself, or a current contact of an account of the scope), Customer360 and ContactDetail
    account: {
        name: "Account",
        icon: "sym_o_storefront",
        destination: "Accounts/Customer360",
        parameter: "customerPartyId",
        read: (userScope, partyId) => {
            const account = salesAccess.accountOf(userScope.mantle, partyId)
            if (!account) return null
            return {organizationPartyId: account.organizationPartyId, label: partyLabel(account.party), detail: "Account"}
        }
    },
    // P4: a lead or opportunity the user sees (SalesAccess.js opportunityOf: an organization of the scope, assigned to them or a team
    // of theirs, or the organization's whole pipeline for SALES_TEAM_VIEW), OpportunityDetail
    opportunity: {
        name: "Opportunity",
        icon: "sym_o_trending_up",
        destination: "Pipeline/OpportunityDetail",
        parameter: "salesOpportunityId",
        read: (userScope, salesOpportunityId) => {
            const found = salesAccess.opportunityOf(userScope.mantle, salesOpportunityId)
            if (!found) return null
            const row = found.opportunity
            return {
                organizationPartyId: found.organizationPartyId,
                label: row.opportunityName || row.salesOpportunityId,
                detail: row.typeEnumId === "SotLead" ? "Lead" : "Opportunity"
            }
        }
    },
    contact: {
        name: "Contact",
        icon: "sym_o_contact_page",
        destination: "Accounts/ContactDetail",
        read: (userScope, partyId) => {
            const account = salesAccess.accountOf(userScope.mantle, partyId)
            if (account)
                return {organizationPartyId: account.organizationPartyId, label: partyLabel(account.party), detail: "Account"}
            const accounts = salesAccess.contactAccounts(userScope.mantle, partyId)
            if (!accounts.length) return null
            return {
                organizationPartyId: accounts[0].organizationPartyId,
                label: partyLabel(one("mantle.party.Party", {partyId})),
                detail: "Contact of " + accounts.map(found => partyLabel(found.party)).join(", "),
                accountPartyId: accounts[0].party.partyId
            }
        }
    }
}
// A party's name for a label: the organization's name or the person's.
function partyLabel(party) {
    if (!party) return ""
    const detail = one("mantle.party.PartyDetail", {partyId: party.partyId})
    return (
        detail?.organizationName ||
        [detail?.firstName, detail?.lastName].filter(Boolean).join(" ") ||
        party.pseudoId ||
        party.partyId
    )
}
const recordUrl = (kind, recordId, linkBase = mountRoots.Sales.linkBase) =>
    "/qapps" +
    linkBase.slice(1) +
    "/" +
    recordKinds[kind].destination +
    "?" +
    (recordKinds[kind].parameter || "partyId") +
    "=" +
    encodeURIComponent(recordId)
function recordOf(userScope, kind, recordId) {
    const definition = Object.hasOwn(recordKinds, kind) ? recordKinds[kind] : null
    const unavailable = () => denied("RECORD_UNAVAILABLE", (definition?.name || "Record") + " " + recordId + " is not available")
    if (!recordId || !definition) unavailable()
    let found
    try {
        found = definition.read(userScope, recordId)
    } catch (error) {
        // Mantle's refusals of a record (missing, outside the scope, no read) are one answer here
        if (["RECORD_UNAVAILABLE", "PERMISSION_DENIED", "ORGANIZATION_DENIED"].includes(lib.reasonCode(error))) unavailable()
        throw error
    }
    if (!found) unavailable()
    return {
        recordType: kind,
        recordId,
        kindName: definition.name,
        organizationPartyId: found.organizationPartyId,
        accountPartyId: found.accountPartyId || null,
        label: found.label,
        detail: found.detail
    }
}
// check#Record: a record a Sales screen or mount was given, refused unless the user may see it and, when a capability is named,
// holds it.
function checkRecord(p) {
    const userScope = required()
    if (p.capability) {
        if (!Object.hasOwn(userScope.capabilities, p.capability)) throw new Error("Unknown Sales capability " + p.capability)
        if (!userScope.capabilities[p.capability]) denied("PERMISSION_DENIED", "Sales " + p.capability + " is required")
    }
    return recordOf(userScope, p.recordType, p.recordId)
}

// ===== choices =====
// Each Sales drop-down: its options for the user, searched in the query ignoring case, with the selected value's label when it is
// in scope but not on the page. An unknown choice throws. Later phases add sources (teams, stages, accounts, products).
function withSelected(options, selected, admits, label) {
    if (selected && !options.some(option => option.value === selected) && admits(selected))
        options.push({value: selected, label: label(selected)})
    return options
}
const choiceSources = {
    // the organizations of the user's sales scope
    organizations: (userScope, term, selected) =>
        withSelected(
            organizationOptions(organizationIds(userScope), term, choiceLimit),
            selected,
            partyId => userScope.capabilities.anyRead && covers(userScope, partyId),
            organizationName
        ),
    // P3: the accounts of the scope (Mantle's find#Accounts, searched in the query)
    accounts: (userScope, term, selected) =>
        withSelected(
            accountOptions(term),
            selected,
            partyId => !!salesAccess.accountOf(userScope.mantle, partyId),
            partyId => partyLabel(one("mantle.party.Party", {partyId}))
        ),
    // P3: the people who may manage an account: those who work for an organization of the scope now (an employee, agent or member)
    managers: (userScope, term, selected) =>
        withSelected(
            peopleOptions(memberIds(organizationIds(userScope)), term),
            selected,
            partyId => memberIds(organizationIds(userScope)).includes(partyId),
            partyId => partyLabel(one("mantle.party.Party", {partyId}))
        ),
    // P3: a person to add to an account as its contact: a person of the scope or shared, not an internal party, never someone
    // else's personal contact (add#Contact checks again)
    people: (userScope, term, selected) =>
        withSelected(
            peopleOptions(null, term, userScope),
            selected,
            partyId => !!salesAccess.visibleParty(userScope.mantle, partyId),
            partyId => partyLabel(one("mantle.party.Party", {partyId}))
        ),
    // ===== P2: the pipeline setup's choices (impl-sales P2) =====
    // the current sales teams of an organization of the scope (a pipeline's team)
    teams: (userScope, term, selected, p) => {
        const organizationPartyId = p.organizationPartyId || null
        if (!organizationPartyId || !covers(userScope, organizationPartyId)) return []
        const lower = term.toLowerCase()
        return Array.from(salesSettings().teamsOf(organizationPartyId))
            .filter(
                team => !term || team.teamName.toLowerCase().includes(lower) || team.teamPartyId.toLowerCase().includes(lower)
            )
            .slice(0, choiceLimit)
            .map(team => ({value: team.teamPartyId, label: team.teamName}))
    },
    // TeamMembers' lookup: the people who work for the team's organization (an agent or employee in effect, the rule
    // store#SalesTeamMember checks), by name; for a reader of People's directory (PEOPLE_DIRECTORY_VIEW, F53) each employee's work
    // identity from mantle.humanres.PeopleServices.find#Employees labels them with their job title. A caller without it picks
    // by party; no People record is read for them.
    teamMembers: (userScope, term, selected, p) => {
        const organizationPartyId = p.organizationPartyId || null
        if (!organizationPartyId || !covers(userScope, organizationPartyId)) return []
        if (!userScope.capabilities.configure && !userScope.capabilities.teamManage) return []
        const workerIds = Array.from(
            find("mantle.party.PartyRelationship")
                .condition("toPartyId", organizationPartyId)
                .condition("relationshipTypeEnumId", "in", ["PrtAgent", "PrtEmployee"])
                .conditionDate("fromDate", "thruDate", ec.user.nowTimestamp)
                .selectField("fromPartyId")
                .list()
        ).map(row => row.fromPartyId)
        if (!workerIds.length) return []
        let query = find("mantle.party.PartyDetail")
            .condition("partyId", "in", Array.from(new Set(workerIds)))
            .condition("partyTypeEnumId", "PtyPerson")
            .orderBy(["firstName", "lastName"])
            .limit(choiceLimit)
        if (term) {
            const factory = ec.entity.conditionFactory
            query = query.condition(
                factory.makeCondition(
                    ["partyId", "firstName", "lastName"].map(field =>
                        factory.makeCondition(field, "like", likeText(term)).ignoreCase()
                    ),
                    "or"
                )
            )
        }
        const people = Array.from(query.list())
        const titles = {}
        // People's own scope first (impl-sales P2 review): an organization People does not cover for the caller is not asked, as
        // find#Employees would refuse it and the refused call is logged as an error
        if (access.has("PEOPLE_DIRECTORY_VIEW") && peopleCovers(organizationPartyId)) {
            try {
                const found = lib.probe("mantle.humanres.PeopleServices.find#Employees", {
                    organizationPartyId,
                    term: term || null,
                    pageSize: choiceLimit * 2
                })
                for (const row of Array.from(found.employees || [])) if (row.jobTitle) titles[row.partyId] = row.jobTitle
            } catch (error) {
                // People's directory is optional here: without it the people are picked by party
                ec.logger.info("Sales team lookup without People's directory: " + error.message)
            }
        }
        return people.map(row => {
            const name = [row.firstName, row.lastName].filter(Boolean).join(" ") || row.partyId
            return {value: row.partyId, label: titles[row.partyId] ? name + ", " + titles[row.partyId] : name}
        })
    }
}
// ===== P4: the deal's choices (impl-sales P4) =====
// The organization a deal's choice is for: the one given (in the scope), else the default one (SalesAccess.js defaultOrganization).
function choiceOrganization(userScope, p) {
    if (p.organizationPartyId) return covers(userScope, p.organizationPartyId) ? p.organizationPartyId : null
    return salesAccess.defaultOrganization(userScope.mantle)
}
const byTerm = (options, term) => {
    const lower = term.toLowerCase()
    return options.filter(option => !term || String(option.label).toLowerCase().includes(lower)).slice(0, choiceLimit)
}
Object.assign(choiceSources, {
    // the pipelines the organization uses now (its own and the shared one)
    pipelines: (userScope, term, selected, p) => {
        const organizationPartyId = choiceOrganization(userScope, p)
        if (!organizationPartyId) return []
        return byTerm(
            salesSettings()
                .pipelinesOf(organizationPartyId)
                .filter(row => salesSettings().inEffect(row))
                .map(row => ({value: row.salesPipelineId, label: row.pipelineName || row.salesPipelineId})),
            term
        )
    },
    // the current stages of a pipeline the organization uses (salesPipelineId), else of its default pipeline, in order
    stages: (userScope, term, selected, p) => {
        const organizationPartyId = choiceOrganization(userScope, p)
        if (!organizationPartyId) return []
        const pipelines = salesSettings()
            .pipelinesOf(organizationPartyId)
            .filter(row => salesSettings().inEffect(row))
        const pipeline = p.salesPipelineId
            ? pipelines.find(row => row.salesPipelineId === p.salesPipelineId)
            : salesSettings().defaultPipeline(organizationPartyId)
        if (!pipeline) return []
        return byTerm(
            salesSettings()
                .stagesOf(pipeline.salesPipelineId)
                .map(row => ({value: row.opportunityStageId, label: row.description || row.opportunityStageId})),
            term
        )
    },
    // a deal's owner or an activity's assignee: the people who work for the organization (create#Opportunity checks the team rule)
    owners: (userScope, term, selected, p) => {
        const organizationPartyId = choiceOrganization(userScope, p)
        const ids = organizationPartyId ? memberIds([organizationPartyId]) : memberIds(organizationIds(userScope))
        return withSelected(
            peopleOptions(ids, term),
            selected,
            partyId => ids.includes(partyId),
            partyId => partyLabel(one("mantle.party.Party", {partyId}))
        )
    },
    // the lead sources offered to the organization
    sources: (userScope, term, selected, p) => {
        const organizationPartyId = choiceOrganization(userScope, p)
        if (!organizationPartyId) return []
        return byTerm(
            salesSettings()
                .sourcesOffered(organizationPartyId)
                .map(row => ({value: row.dataSourceId, label: row.description})),
            term
        )
    },
    // the instance's current lost reasons and recurring plans
    lostReasons: (userScope, term) =>
        byTerm(
            salesSettings()
                .reasonsOf()
                .map(row => ({value: row.enumId, label: row.description || row.enumId})),
            term
        ),
    recurringPlans: (userScope, term) =>
        byTerm(
            Array.from(
                find("moqui.basic.Enumeration").condition("enumTypeId", "SalesRecurringPlan").orderBy("sequenceNum").list()
            )
                .filter(row => !salesSettings().ended(row))
                .map(row => ({value: row.enumId, label: row.description || row.enumId})),
            term
        ),
    // a competitor: an organization the scope may see, not internal (store#Competitor checks again)
    competitors: (userScope, term, selected) => {
        const factory = ec.entity.conditionFactory
        let query = find("mantle.party.PartyDetail")
            .condition("partyTypeEnumId", "PtyOrganization")
            .condition(
                factory.makeCondition(
                    [factory.makeCondition("disabled", "is-null", null), factory.makeCondition("disabled", "equals", "N")],
                    "or"
                )
            )
            .condition(
                factory.makeCondition(
                    [
                        factory.makeCondition("privateOwnerUserId", "is-null", null),
                        factory.makeCondition("privateOwnerUserId", "equals", ec.user.userId || "_NA_")
                    ],
                    "or"
                )
            )
            .orderBy("^organizationName")
            .limit(choiceLimit)
        if (userScope.mantle.organizationPartyIds != null)
            query = query.condition("ownerPartyId", "in", ["_NA_"].concat(userScope.mantle.organizationPartyIds))
        const internal = Array.from(
            find("mantle.party.PartyRole").condition("roleTypeId", "OrgInternal").selectField("partyId").list()
        ).map(row => row.partyId)
        if (internal.length) query = query.condition("partyId", "not-in", internal)
        if (term)
            query = query.condition(
                factory.makeCondition(
                    ["partyId", "organizationName"].map(field =>
                        factory.makeCondition(field, "like", likeText(term)).ignoreCase()
                    ),
                    "or"
                )
            )
        return withSelected(
            Array.from(query.list()).map(row => ({value: row.partyId, label: row.organizationName || row.partyId})),
            selected,
            partyId => {
                const party = salesAccess.visibleParty(userScope.mantle, partyId)
                return !!party && party.partyTypeEnumId === "PtyOrganization" && !salesAccess.isInternal(partyId)
            },
            partyId => partyLabel(one("mantle.party.Party", {partyId}))
        )
    },
    // P4: a person to make a deal's contact: the contacts of the deal's account first, else the people of the scope
    dealContacts: (userScope, term, selected, p) =>
        withSelected(
            peopleOptions(
                p.accountPartyId && salesAccess.accountOf(userScope.mantle, p.accountPartyId)
                    ? accountContactIds(p.accountPartyId)
                    : null,
                term,
                userScope
            ),
            selected,
            partyId => !!salesAccess.visibleParty(userScope.mantle, partyId),
            partyId => partyLabel(one("mantle.party.Party", {partyId}))
        )
})
// The current contacts of an account (PrtContact to it); null (any person of the scope) when it has none.
function accountContactIds(accountPartyId) {
    const ids = Array.from(
        find("mantle.party.PartyRelationship")
            .condition("toPartyId", accountPartyId)
            .condition("relationshipTypeEnumId", "PrtContact")
            .conditionDate("fromDate", "thruDate", ec.user.nowTimestamp)
            .selectField("fromPartyId")
            .list()
    ).map(row => row.fromPartyId)
    return ids.length ? ids : null
}
function accountOptions(term) {
    const found = lib.probe("mantle.sales.SalesWorkspaceServices.find#Accounts", {text: term || null, pageSize: choiceLimit})
    return Array.from(found.accountList || []).map(row => ({value: row.partyId, label: row.name + " · " + row.ownerText}))
}
function memberIds(organizationPartyIds) {
    if (!organizationPartyIds.length) return []
    return Array.from(
        find("mantle.party.PartyRelationship")
            .condition("toPartyId", "in", organizationPartyIds)
            .condition("relationshipTypeEnumId", "in", ["PrtEmployee", "PrtAgent", "PrtMember"])
            .condition(ec.entity.conditionFactory.makeConditionDate("fromDate", "thruDate", null))
            .selectField("fromPartyId")
            .distinct(true)
            .limit(2000)
            .list()
    ).map(row => row.fromPartyId)
}
// People by name, among the ids given, else among those the scope may see (owned by an organization of it or shared).
function peopleOptions(partyIds, term, userScope) {
    if (partyIds && !partyIds.length) return []
    const factory = ec.entity.conditionFactory
    let query = find("mantle.party.PartyDetail")
        .condition("partyTypeEnumId", "PtyPerson")
        .condition(
            factory.makeCondition(
                [factory.makeCondition("disabled", "is-null", null), factory.makeCondition("disabled", "equals", "N")],
                "or"
            )
        )
        .condition(
            factory.makeCondition(
                [
                    factory.makeCondition("privateOwnerUserId", "is-null", null),
                    factory.makeCondition("privateOwnerUserId", "equals", ec.user.userId || "_NA_")
                ],
                "or"
            )
        )
        .orderBy(["^firstName", "^lastName"])
        .limit(choiceLimit)
    if (partyIds) query = query.condition("partyId", "in", partyIds)
    else if (userScope.mantle.organizationPartyIds != null)
        query = query.condition("ownerPartyId", "in", ["_NA_"].concat(userScope.mantle.organizationPartyIds))
    if (term)
        query = query.condition(
            factory.makeCondition(
                ["partyId", "pseudoId", "firstName", "lastName"].map(field =>
                    factory.makeCondition(field, "like", likeText(term)).ignoreCase()
                ),
                "or"
            )
        )
    return Array.from(query.list()).map(row => ({
        value: row.partyId,
        label: [row.firstName, row.lastName].filter(Boolean).join(" ") || row.pseudoId || row.partyId
    }))
}
// P2: whether People's directory scope reaches an organization for the caller (People.js scopeOf: a staff reader's employers)
function peopleCovers(organizationPartyId) {
    const peopleScope = ec.resource.script("component://mr-mantle/service/mantle/humanres/People.js").scopeOf()
    return !!peopleScope.capabilities?.staff && Array.from(peopleScope.organizationPartyIds || []).includes(organizationPartyId)
}
// P2: Mantle's setup module (the teams of an organization), read once per call
let settingsModule = null
const salesSettings = () =>
    settingsModule || (settingsModule = ec.resource.script("component://mr-mantle/service/mantle/sales/SalesSettings.js"))
function choices(p) {
    const userScope = required()
    if (!Object.hasOwn(choiceSources, p.choice)) throw new Error("Unknown Sales choice " + p.choice)
    if (!userScope.capabilities.anyRead) return {options: []}
    return {options: choiceSources[p.choice](userScope, String(p.term || "").trim(), p.selected || null, p)}
}

// ===== palette =====
// The palette's Sales records, each opening its Sales screen, with recordEntity and recordId for Assist's search. None yet:
// accounts join with their screens (P3), opportunities and leads (P4), quotes and orders (P7, P11), agreements (P15).
const searchFinds = [
    // P3: accounts, through Mantle's scoped find (a Sales reader)
    {
        kind: "account",
        rows: (userScope, text, limit) => {
            if (!userScope.capabilities.anyRead) return []
            const found = lib.probe("mantle.sales.SalesWorkspaceServices.find#Accounts", {text, pageSize: limit})
            return Array.from(found.accountList || []).map(row => ({
                title: row.name,
                subtitle: ["Account " + row.pseudoId, row.roleText, row.ownerText].filter(Boolean).join(" · "),
                icon: recordKinds.account.icon,
                recordEntity: "mantle.party.Party",
                recordId: row.partyId,
                url: recordUrl("account", row.partyId)
            }))
        }
    }
]
// P4: leads and opportunities, through Mantle's scoped find (find#Opportunities' text: name or id), open ones
searchFinds.push({
    kind: "opportunity",
    rows: (userScope, text, limit) => {
        if (!userScope.capabilities.anyRead) return []
        const found = lib.probe("mantle.sales.OpportunityServices.find#Opportunities", {
            text,
            statusId: "SalesOppOpen",
            pageSize: limit
        })
        return Array.from(found.opportunityList || []).map(row => ({
            title: row.opportunityName,
            subtitle: [row.typeText + " " + row.salesOpportunityId, row.accountName, row.stageText].filter(Boolean).join(" · "),
            icon: recordKinds.opportunity.icon,
            recordEntity: "mantle.sales.opportunity.SalesOpportunity",
            recordId: row.salesOpportunityId,
            url: recordUrl("opportunity", row.salesOpportunityId)
        }))
    }
})
function search(p) {
    const userScope = scope()
    if (!userScope.read || !String(p.text || "").trim()) return {rows: []}
    const text = String(p.text).trim()
    const limit = Math.max(1, Math.min(20, Number(p.limit || 5)))
    const found = new Map()
    for (const definition of searchFinds) {
        let rowsFound = []
        try {
            rowsFound = definition.rows(userScope, text, limit)
        } catch (error) {
            ec.logger.error("Sales palette " + definition.kind + " search failed: " + error.message)
        }
        for (const row of rowsFound) if (!found.has(row.url)) found.set(row.url, row)
    }
    return {rows: Array.from(found.values()).slice(0, limit)}
}

// ===== P4: record links and the work item context =====
// A Sales record's screen under Sales for a user who may open it there (Commons' get#RecordLink, the palette, Today), else null.
function recordLink(kind, recordId) {
    try {
        const userScope = scope()
        if (!userScope.read) return null
        recordOf(userScope, kind, recordId)
        return recordUrl(kind, recordId)
    } catch (error) {
        return null
    }
}
// WorkItemDetail's Sales context (crosscut §3.12 Sales row; design §3 WorkItemDetail): a task linked to deals the user sees
// (SalesOpportunityWorkEffort), with those deals; a task of no such deal is not available. The task stays Commons': its actions are
// Commons' task rule; completing it neither qualifies nor closes a deal.
function workItemContext(p) {
    const userScope = required()
    const links = Array.from(
        find("mantle.sales.opportunity.SalesOpportunityWorkEffort")
            .condition("workEffortId", p.workEffortId || "")
            .list()
    )
    const opportunityRows = []
    for (const link of links) {
        const found = salesAccess.opportunityOf(userScope.mantle, link.salesOpportunityId)
        if (!found) continue
        const row = found.opportunity
        const status = row.statusId ? one("moqui.basic.StatusItem", {statusId: row.statusId}) : null
        opportunityRows.push({
            salesOpportunityId: row.salesOpportunityId,
            opportunityName: row.opportunityName || row.salesOpportunityId,
            typeText: row.typeEnumId === "SotLead" ? "Lead" : "Opportunity",
            statusText: status?.description || "Open",
            url: recordUrl("opportunity", row.salesOpportunityId)
        })
    }
    return {available: opportunityRows.length > 0, opportunityRows}
}

const operations = {sharedContext, checkRecord, choices, search, workItemContext}
function run(op, p) {
    if (!Object.hasOwn(operations, op)) throw new Error("Unknown Sales operation " + op)
    return operations[op](p || {})
}
;({execute: run, recordLink})
