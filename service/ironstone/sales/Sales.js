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
    // impl-marketing P3 (F64): Accounts at Marketing/Leads/Accounts, for Marketing's bulk "Add to list (evidenced)"; P19: an account opens
    // Marketing's Customer360 (its engagement, in Marketing's context) and a contact Marketing's ContactDetail
    Marketing: {
        linkBase: "//Marketing",
        paths: {
            "Pipeline/Leads": "Leads",
            "Accounts/Accounts": "Leads/Accounts",
            "Settings/LeadSources": "Settings/LeadSources",
            "Accounts/Customer360": "Customers/Customer360",
            "Accounts/ContactDetail": "Contacts/ContactDetail"
        },
        // P19 review: Marketing's Customers and Contacts are its audience readers' (design-marketing §2: U); for anyone else an account
        // and a contact show unlinked, as before P19, rather than opening a refused page
        pathPermissions: {
            "Accounts/Customer360": "MARKETING_AUDIENCE_VIEW",
            "Accounts/ContactDetail": "MARKETING_AUDIENCE_VIEW"
        }
    }
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
    "Pipeline/WorkItemDetail",
    // P6: Home's counters' lists above, the import wizard's mount, and the shell's quick create and Assist answer actions
    "Pipeline/OpportunityImport",
    "QuickCreate",
    "LogNote",
    "SendMessage",
    // P7: quotes (design §5), the one OrderDetail route, and Products' screens in Sales' context (F67)
    "Quotes",
    "Quotes/Quotes",
    "Orders/OrderDetail",
    "Products/Product360",
    "Products/InventoryAvailability",
    "Products/PriceExplain",
    // P8: requests for quote (design §5 QuoteRequests, QuoteRequestDetail)
    "Quotes/QuoteRequests",
    "Quotes/QuoteRequestDetail",
    // P9: the approvals list and the defaults and approval rules
    "Quotes/Approvals",
    "Settings/SalesDefaults",
    "Settings/ApprovalPolicies",
    // P11: the order list (design §6 Orders)
    "Orders",
    "Orders/Orders"
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
        ? Object.fromEntries(
              Object.entries(mount.paths)
                  .filter(([path]) => !mount.pathPermissions?.[path] || access.has(mount.pathPermissions[path]))
                  .map(([path, own]) => [path, linkBase + "/" + own])
          )
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
// P3, an opportunity P4, a quote P7, an order P11, an agreement P15; a forecast has no record panel, P18).
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
    // P7: a quote the user sees (SalesAccess.js quoteOf: of a seller of the scope, assigned to them or a team of theirs, or the
    // organization's every quote for SALES_TEAM_VIEW), the one OrderDetail route
    quote: {
        name: "Quote",
        icon: "sym_o_request_quote",
        destination: "Orders/OrderDetail",
        parameter: "orderId",
        read: (userScope, orderId) => {
            const found = salesAccess.quoteOf(userScope.mantle, orderId)
            if (!found) return null
            return {
                organizationPartyId: found.organizationPartyId,
                label: found.order.orderName || "Quote " + orderId,
                detail: "Quote"
            }
        }
    },
    // P8: a request for quote the user sees (SalesAccess.js quoteRequestOf: of an organization of the scope, assigned to them or a
    // team of theirs, or the organization's every one for SALES_TEAM_VIEW), QuoteRequestDetail
    quoteRequest: {
        name: "Request for quote",
        icon: "sym_o_contract_edit",
        destination: "Quotes/QuoteRequestDetail",
        parameter: "requestId",
        read: (userScope, requestId) => {
            const found = salesAccess.quoteRequestOf(userScope.mantle, requestId)
            if (!found) return null
            return {
                organizationPartyId: found.organizationPartyId,
                label: found.request.requestName || "Request for quote " + requestId,
                detail: "Request for quote"
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
// ===== P9: a commercial order change (impl-sales P9, F58) =====
// P9 opened a commercial-kind change from Approvals for its approver; P14's recordKinds.orderChange (below) replaced it with
// OrderChangeDetail under Sales (the one definition since P20's review).
// ===== end of P9 =====
// ===== P11: a sales order (impl-sales P11; design §6) =====
// A sales order the user sees (SalesAccess.js orderOf: a direct order, an accepted quote or another sales order of a seller of the scope,
// assigned to them or a team of theirs, the organization's for SALES_TEAM_VIEW, or awaiting approval or held for an order approver),
// the one OrderDetail route; and the order document of the root's record panels, a quote the user sees or such an order.
recordKinds.order = {
    name: "Order",
    icon: "sym_o_receipt_long",
    destination: "Orders/OrderDetail",
    parameter: "orderId",
    read: (userScope, orderId) => {
        const found = salesAccess.orderOf(userScope.mantle, orderId)
        if (!found) return null
        return {
            organizationPartyId: found.organizationPartyId,
            label: found.order.orderName || "Order " + orderId,
            detail: "Order"
        }
    }
}
recordKinds.orderDocument = {
    name: "Order",
    icon: "sym_o_receipt_long",
    destination: "Orders/OrderDetail",
    parameter: "orderId",
    read: (userScope, orderId) => recordKinds.quote.read(userScope, orderId) || recordKinds.order.read(userScope, orderId)
}
// ===== end of P11 =====
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
// withSelected for a source whose every option the user may choose: the selected value is added, with its label, when it is one
// of all the options (read only when it is not on the page).
function withSelectedOf(options, selected, allOptions) {
    if (!selected || options.some(option => option.value === selected)) return options
    const found = allOptions().find(option => option.value === selected)
    return withSelected(options, selected, () => !!found, () => found.label)
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
// P6: a deal to put an activity on (QuickCreate's Activity): the open leads and opportunities the user sees, by name or id, in
// Mantle's scoped find (add#OpportunityActivity checks the deal and the edit permission again)
choiceSources.deals = (userScope, term, selected) =>
    withSelected(
        Array.from(
            lib.probe("mantle.sales.OpportunityServices.find#Opportunities", {
                text: term || null,
                statusId: "SalesOppOpen",
                pageSize: choiceLimit
            }).opportunityList || []
        ).map(row => ({value: row.salesOpportunityId, label: row.opportunityName + " · " + row.typeText})),
        selected,
        salesOpportunityId => !!salesAccess.opportunityOf(userScope.mantle, salesOpportunityId),
        salesOpportunityId => {
            const row = one("mantle.sales.opportunity.SalesOpportunity", {salesOpportunityId})
            return row?.opportunityName || salesOpportunityId
        }
    )
// ===== P7: a quote's choices (impl-sales P7) =====
Object.assign(choiceSources, {
    // a quote line's product: the catalogue products of the seller (its own, of an organization of the scope when none is named, and
    // the shared catalogue's), not virtual and not barred from sale, by name or id (store#QuoteLine checks the product again)
    products: (userScope, term, selected, p) => {
        const organizationPartyId = choiceOrganization(userScope, p)
        const owners = (organizationPartyId ? [organizationPartyId] : organizationIds(userScope)).concat(["_NA_"])
        const readable = productId => {
            const product = productId ? one("mantle.product.Product", {productId}) : null
            return !!product && owners.includes(product.ownerPartyId || "_NA_") && product.productTypeEnumId !== "PtVirtual"
        }
        const factory = ec.entity.conditionFactory
        let query = find("mantle.product.Product")
            .condition("ownerPartyId", "in", owners)
            .condition("productTypeEnumId", "not-equals", "PtVirtual")
            .condition(
                factory.makeCondition(
                    [
                        factory.makeCondition("salesAllowed", "is-null", null),
                        factory.makeCondition("salesAllowed", "not-equals", "N")
                    ],
                    "or"
                )
            )
            .orderBy("^productName")
            .limit(choiceLimit)
        if (term)
            query = query.condition(
                factory.makeCondition(
                    ["productId", "productName"].map(field => factory.makeCondition(field, "like", likeText(term)).ignoreCase()),
                    "or"
                )
            )
        const label = row => (row.productName ? row.productName + " · " + row.productId : row.productId)
        return withSelected(
            Array.from(query.list()).map(row => ({value: row.productId, label: label(row)})),
            selected,
            readable,
            productId => label(one("mantle.product.Product", {productId}))
        )
    },
    // a quote's currency: the currencies
    currencies: (userScope, term) =>
        byTerm(
            Array.from(find("moqui.basic.Uom").condition("uomTypeEnumId", "UT_CURRENCY_MEASURE").orderBy("uomId").list()).map(
                row => ({
                    value: row.uomId,
                    label: row.uomId + (row.description ? " · " + row.description : "")
                })
            ),
            term
        ),
    // a quote's store: the stores of the selling organization (none: a storeless quote)
    stores: (userScope, term, selected, p) => {
        const organizationPartyId = choiceOrganization(userScope, p)
        if (!organizationPartyId) return []
        return byTerm(
            Array.from(
                find("mantle.product.store.ProductStore").condition("organizationPartyId", organizationPartyId).list()
            ).map(row => ({
                value: row.productStoreId,
                label: row.storeName || row.productStoreId
            })),
            term
        )
    }
})
// ===== P9: the approvers' groups (impl-sales P9) =====
// an approval rule's approver role: the user groups that hold SALES_APPROVE now (store#SalesApprovalPolicy checks the group again)
choiceSources.approverGroups = (userScope, term) => {
    const groupIds = Array.from(
        new Set(
            Array.from(find("moqui.security.UserGroupPermission").condition("userPermissionId", "SALES_APPROVE").list())
                .filter(row => lib.active(row))
                .map(row => row.userGroupId)
        )
    )
    if (!groupIds.length || !userScope.capabilities.configure) return []
    return byTerm(
        Array.from(find("moqui.security.UserGroup").condition("userGroupId", "in", groupIds).orderBy("description").list()).map(
            row => ({value: row.userGroupId, label: row.description || row.userGroupId})
        ),
        term
    )
}
// ===== end of P9 =====
// ===== P12: quote templates (impl-sales P12; design-sales §5 QuoteTemplates, QuoteTemplateDetail) =====
linkPaths.push("Quotes/QuoteTemplates", "Quotes/QuoteTemplateDetail")
// NewQuote's template: the current templates of the selling organization (Mantle's find#QuoteTemplates, scoped and searched there)
choiceSources.quoteTemplates = (userScope, term, selected, p) => {
    const organizationPartyId = choiceOrganization(userScope, p)
    if (!organizationPartyId) return []
    const found =
        ec.service
            .sync()
            .name("mantle.order.SalesQuoteServices.find#QuoteTemplates")
            .parameters({organizationPartyId, state: "current", text: term || null, pageSize: choiceLimit})
            .call() || {}
    const options = Array.from(found.templateList || []).map(row => ({
        value: row.orderId,
        label: row.orderName + " · " + row.currencyUomId
    }))
    return withSelected(
        options,
        selected,
        orderId => salesAccess.templateOf(userScope.mantle, orderId)?.state === "current",
        orderId => one("mantle.order.OrderHeader", {orderId})?.orderName || orderId
    )
}
// ===== end of P12 =====
// ===== P14: commercial changes and the fulfillment and billing handoffs (impl-sales P14; design-sales §6) =====
linkPaths.push("Orders/OrderChanges", "Orders/OrderChangeDetail", "Orders/ShipmentDetail", "Orders/InvoiceDetail")
const orderChanges = () => ec.resource.script("component://mr-mantle/service/mantle/order/SalesOrderChanges.js")
// Changes (Sales/Orders/OrderChanges, BOSS_SAL_CHANGES): the change operator's, the approver's and the manager's (design §2 C, A, M),
// each holding a permission find#OrderChanges reads by (SALES_ORDER_CHANGE, SALES_APPROVE, SALES_TEAM_VIEW)
areas.changes = "Orders/OrderChanges"
areaReads.changes = caps => !!(caps.orderChange || caps.approve || caps.teamView)
// A commercial order change now opens its OrderChangeDetail under Sales (F58: OrderChangeApproval's one link, resolved per recipient
// by Commons' get#RecordLink): a commercial-kind change of a sales order of the scope, for its approver (SALES_APPROVE), its change
// operator (SALES_ORDER_CHANGE) or a Sales reader who sees the order (its owner, its team, the organization's manager); Mantle's
// OrderChangeServices checks the permission of each verb and the organization again.
recordKinds.orderChange = {
    name: "Order change",
    icon: "sym_o_edit_note",
    destination: "Orders/OrderChangeDetail",
    parameter: "requestId",
    read: (userScope, requestId) => {
        const request = one("mantle.request.Request", {requestId})
        if (!request || request.requestTypeEnumId !== "RqtOrderChange" || !request.orderId) return null
        if (["OckCancel", "OckSubstitute"].includes(request.orderChangeKindEnumId)) return null
        const part = Array.from(
            find("mantle.order.OrderPart").condition("orderId", request.orderId).orderBy("orderPartSeqId").list()
        )[0]
        if (!part || !covers(userScope, part.vendorPartyId)) return null
        const caps = userScope.capabilities
        if (!caps.approve && !caps.orderChange && !salesAccess.orderOf(userScope.mantle, request.orderId)) return null
        return {
            organizationPartyId: part.vendorPartyId,
            label: request.requestName || "Order change " + requestId,
            detail: "Order change"
        }
    }
}
// A shipment of a sales order the user sees (ShipmentDetail's Sales row; Mantle's get#SalesShipment answers the rest).
recordKinds.shipment = {
    name: "Shipment",
    icon: "sym_o_local_shipping",
    destination: "Orders/ShipmentDetail",
    parameter: "shipmentId",
    read: (userScope, shipmentId) => {
        const found = orderChanges().getShipment({shipmentId})
        if (!found.shipmentFound) return null
        const part = Array.from(
            find("mantle.order.OrderPart").condition("orderId", found.orderIds[0]).orderBy("orderPartSeqId").list()
        )[0]
        return {
            organizationPartyId: part?.vendorPartyId || null,
            label: "Shipment " + shipmentId,
            detail: found.shipment.statusText
        }
    }
}
// An invoice of a sales order the user sees, for a receivable reader (InvoiceDetail's Sales row; Mantle's check#SalesInvoice).
recordKinds.invoice = {
    name: "Invoice",
    icon: "sym_o_receipt",
    destination: "Orders/InvoiceDetail",
    parameter: "invoiceId",
    read: (userScope, invoiceId) => {
        const found = orderChanges().checkInvoice({invoiceId})
        return {organizationPartyId: found.organizationPartyId, label: "Invoice " + invoiceId, detail: "Invoice"}
    }
}
// NewChange's order: the scope's placed, approved and held orders (Mantle's find#SalesOrders, the change operator's reach included)
choiceSources.changeOrders = (userScope, term, selected) => {
    const found =
        ec.service
            .sync()
            .name("mantle.sales.SalesWorkspaceServices.find#SalesOrders")
            .parameters({list: "recent", text: term || null, pageSize: choiceLimit})
            .call() || {}
    const changeable = salesAccess.changeStatuses
    const options = Array.from(found.orderList || [])
        .filter(row => changeable.includes(row.statusId))
        .map(row => ({value: row.orderId, label: [row.orderId, row.customerName, row.statusText].filter(Boolean).join(" · ")}))
    return withSelected(
        options,
        selected,
        orderId => !!salesAccess.orderOf(userScope.mantle, orderId),
        orderId => one("mantle.order.OrderHeader", {orderId})?.orderName || orderId
    )
}
// A change's order line: the product lines of an order the user sees
choiceSources.orderLines = (userScope, term, selected, p) => {
    const so = p.orderId ? salesAccess.orderOf(userScope.mantle, p.orderId) : null
    if (!so) return []
    const lower = String(term || "").toLowerCase()
    return Array.from(find("mantle.order.OrderItem").condition("orderId", p.orderId).orderBy("orderItemSeqId").list())
        .filter(row => row.productId && row.itemTypeEnumId !== "ItemSalesTax")
        .map(row => ({
            value: row.orderItemSeqId,
            label:
                row.orderItemSeqId +
                " · " +
                (row.itemDescription || row.productId) +
                " · " +
                ec.l10n.format(row.quantity ?? 0, "#,##0.###")
        }))
        .filter(option => !lower || option.label.toLowerCase().includes(lower))
}
// An address change's address: the postal addresses of the order's customer
choiceSources.customerAddresses = (userScope, term, selected, p) => {
    const so = p.orderId ? salesAccess.orderOf(userScope.mantle, p.orderId) : null
    if (!so) return []
    const ids = Array.from(
        find("mantle.party.contact.PartyContactMech")
            .condition("partyId", so.customerPartyId)
            .conditionDate("fromDate", "thruDate", ec.user.nowTimestamp)
            .list()
    ).map(row => row.contactMechId)
    if (!ids.length) return []
    const lower = String(term || "").toLowerCase()
    return Array.from(find("mantle.party.contact.PostalAddress").condition("contactMechId", "in", ids).list())
        .map(row => ({
            value: row.contactMechId,
            label: [row.toName, row.address1, row.city, row.postalCode].filter(Boolean).join(", ")
        }))
        .filter(option => !lower || option.label.toLowerCase().includes(lower))
}
// A carrier change's carrier: the parties with the Carrier role
choiceSources.carriers = (userScope, term) => {
    const ids = Array.from(find("mantle.party.PartyRole").condition("roleTypeId", "Carrier").selectField("partyId").list()).map(
        row => row.partyId
    )
    const lower = String(term || "").toLowerCase()
    return ids
        .map(partyId => ({value: partyId, label: partyLabel(one("mantle.party.Party", {partyId}))}))
        .filter(option => !lower || option.label.toLowerCase().includes(lower))
        .slice(0, choiceLimit)
}
// ===== end of P14 =====
// ===== P15: customer agreements and prices (impl-sales P15; design-sales §7 Agreements, AgreementDetail, CustomerPrices, PriceLists) =====
linkPaths.push(
    "Agreements",
    "Agreements/Agreements",
    "Agreements/AgreementDetail",
    "Agreements/CustomerPrices",
    "Agreements/PriceLists",
    "Agreements/PriceLists/PriceListDetail"
)
// An agreement the user sees (SalesAccess.js agreementOf: of an organization of the scope, for a Sales reader), the shared
// AgreementDetail under Agreements; a record panel host of the root
recordKinds.agreement = {
    name: "Agreement",
    icon: "sym_o_contract",
    destination: "Agreements/AgreementDetail",
    parameter: "agreementId",
    read: (userScope, agreementId) => {
        const found = salesAccess.agreementOf(userScope.mantle, agreementId)
        if (!found) return null
        return {
            organizationPartyId: found.organizationPartyId,
            label: found.agreement.description || "Agreement " + agreementId,
            detail: found.agreement.isTemplate === "Y" ? "Agreement template" : "Agreement",
            accountPartyId: found.agreement.otherPartyId || null
        }
    }
}
// NewAgreement's template: the agreement templates of the selling organization (Mantle's scoped find#SalesAgreements)
choiceSources.agreementTemplates = (userScope, term, selected, p) => {
    const organizationPartyId = choiceOrganization(userScope, p)
    if (!organizationPartyId) return []
    const found = lib.probe("mantle.party.SalesAgreementServices.find#SalesAgreements", {
        organizationPartyId,
        state: "templates",
        text: term || null,
        pageSize: choiceLimit
    })
    return Array.from(found.agreementList || [])
        .filter(row => row.statusId !== "AgmStCancelled")
        .map(row => ({value: row.agreementId, label: row.description + " · " + row.currencyUomId}))
}
// AgreementParties' party: the customer (accountPartyId) and its current contacts, and the people working for the organization
// (store#AgreementParty checks the party again)
choiceSources.agreementParties = (userScope, term, selected, p) => {
    const organizationPartyId = choiceOrganization(userScope, p)
    const account = p.accountPartyId ? salesAccess.accountOf(userScope.mantle, p.accountPartyId) : null
    const ids = (account ? [p.accountPartyId].concat(accountContactIds(p.accountPartyId) || []) : []).concat(
        organizationPartyId ? memberIds([organizationPartyId]) : []
    )
    const options = peopleOptions(ids, term, userScope)
    if (account && (!term || partyLabel(account.party).toLowerCase().includes(term.toLowerCase())))
        options.unshift({value: p.accountPartyId, label: partyLabel(account.party)})
    return options
}
// ===== end of P15 =====
// ===== P16: recurring orders and subscriptions (impl-sales P16; design-sales §7 RecurringOrders, Subscriptions) =====
linkPaths.push("Agreements/RecurringOrders", "Agreements/Subscriptions")
const recurrence = () => ec.resource.script("component://mr-mantle/service/mantle/order/SalesRecurrence.js")
// RecurrenceSettings' order: the approved sales orders a keeper of recurrence may repeat (SalesRecurrence.js, Mantle's check)
choiceSources.recurrenceSources = (userScope, term, selected) => recurrence().recurrenceSourceOptions(term, selected)
// A base's agreement and Subscriptions' agreement filter: the active customer agreements of the scope (Mantle's find#SalesAgreements),
// of the organization and the customer when given
choiceSources.agreements = (userScope, term, selected, p) => {
    const found = lib.probe("mantle.party.SalesAgreementServices.find#SalesAgreements", {
        organizationPartyId: p.organizationPartyId && covers(userScope, p.organizationPartyId) ? p.organizationPartyId : null,
        customerPartyId: p.accountPartyId || null,
        state: "active",
        text: term || null,
        pageSize: choiceLimit
    })
    return withSelected(
        Array.from(found.agreementList || []).map(row => ({
            value: row.agreementId,
            label: [row.description, row.customerName].filter(Boolean).join(" · ")
        })),
        selected,
        agreementId => !!salesAccess.agreementOf(userScope.mantle, agreementId),
        agreementId => one("mantle.party.agreement.Agreement", {agreementId})?.description || agreementId
    )
}
// RecurrenceSettings' zone: the known time zones, searched by name
choiceSources.timeZones = (userScope, term, selected) => {
    const lower = String(term || "").toLowerCase()
    const zones = Array.from(ec.l10n.getAvailableTimeZones() || []).map(String)
    const options = zones
        .filter(zone => !lower || zone.toLowerCase().includes(lower))
        .slice(0, choiceLimit)
        .map(zone => ({value: zone, label: zone}))
    return withSelected(
        options,
        selected,
        zone => zones.includes(zone),
        zone => zone
    )
}
// ===== end of P16 =====

// ===== P18: forecasts and targets (impl-sales P18; design-sales §8 Forecast, TargetAttainment, §9 Targets) =====
linkPaths.push("Pipeline/Forecast", "Settings/Targets", "Reports/TargetAttainment")
const forecasts = () => ec.resource.script("component://mr-mantle/service/mantle/sales/SalesForecasts.js")
Object.assign(choiceSources, {
    // a forecast's or target's period: the sales and fiscal periods of the organization, the latest first
    salesPeriods: (userScope, term, selected, p) => {
        const organizationPartyId = choiceOrganization(userScope, p)
        if (!organizationPartyId) return []
        const options = forecasts().periodOptions(organizationPartyId, term, choiceLimit)
        return withSelectedOf(options, selected, () => forecasts().periodOptions(organizationPartyId, "", 200))
    },
    // whose forecast: the parties whose forecasts the user sees in the organization (SalesAccess.js forecastSees): the organization,
    // its teams and their members for a reader of its whole pipeline, else the user and the teams they manage with their members
    forecastSubjects: (userScope, term, selected, p) => {
        const organizationPartyId = choiceOrganization(userScope, p)
        if (!organizationPartyId) return []
        const options = forecasts().subjectOptions(userScope.mantle, organizationPartyId, term, choiceLimit)
        return withSelectedOf(options, selected, () => forecasts().subjectOptions(userScope.mantle, organizationPartyId, "", 1000))
    },
    // a target's parent: the forecasts of the organization and period the user sees (store#Target checks the parent again)
    forecastParents: (userScope, term, selected, p) => {
        const organizationPartyId = choiceOrganization(userScope, p)
        return organizationPartyId
            ? forecasts().parentOptions(userScope.mantle, organizationPartyId, p.timePeriodId || null, term, choiceLimit)
            : []
    },
    // a forecast allocation's category: the product categories of the organization and the shared ones, by name or id
    productCategories: (userScope, term, selected, p) => {
        const organizationPartyId = choiceOrganization(userScope, p)
        const owners = (organizationPartyId ? [organizationPartyId] : organizationIds(userScope)).concat(["_NA_"])
        const factory = ec.entity.conditionFactory
        let query = find("mantle.product.category.ProductCategory")
            .condition(
                factory.makeCondition(
                    [factory.makeCondition("ownerPartyId", "in", owners), factory.makeCondition("ownerPartyId", "is-null", null)],
                    "or"
                )
            )
            .orderBy("^categoryName")
            .limit(choiceLimit)
        if (term)
            query = query.condition(
                factory.makeCondition(
                    ["productCategoryId", "categoryName"].map(field =>
                        factory.makeCondition(field, "like", likeText(term)).ignoreCase()
                    ),
                    "or"
                )
            )
        return Array.from(query.list()).map(row => ({
            value: row.productCategoryId,
            label: row.categoryName || row.productCategoryId
        }))
    }
})
// ===== end of P18 =====
// ===== P19: reports (impl-sales P19; design-sales §8 Reports, PipelineAnalysis, WinLoss) =====
linkPaths.push("Reports/Catalogue", "Reports/PipelineAnalysis", "Reports/WinLoss")
// ===== end of P19 =====
// ===== impl-marketing P13: a lead's campaign and tracking code (owner contract; impl-sales §7) =====
// Marketing's campaigns and their tracking codes as a lead's choices, from Mantle's CampaignServices.find#Campaigns and
// TrackingServices.find#TrackingLinks under the user's own Marketing scope (open campaigns of the lead's organization): a user who reads
// no Marketing gets none, and the lead form shows the stored value only. Nothing here grants a campaign: create#Opportunity and
// update#Opportunity check it against the deal's organization.
const marketingProbe = (service, parameters) => {
    try {
        return lib.probe(service, parameters)
    } catch (error) {
        return null
    }
}
Object.assign(choiceSources, {
    campaigns: (userScope, term, selected, p) => {
        if (!ec.user.hasPermission("MARKETING_VIEW")) return []
        const organizationPartyId = choiceOrganization(userScope, p)
        if (!organizationPartyId) return []
        const found = marketingProbe("mantle.marketing.CampaignServices.find#Campaigns", {
            organizationPartyId,
            text: term || null,
            statusId: "open",
            pageSize: choiceLimit
        })
        const options = Array.from(found?.campaignList || []).map(row => ({
            value: row.marketingCampaignId,
            label: row.campaignName || row.marketingCampaignId
        }))
        if (selected && !options.some(option => option.value === selected)) {
            const campaign = one("mantle.marketing.campaign.MarketingCampaign", {marketingCampaignId: selected})
            if (campaign && campaign.organizationPartyId === organizationPartyId)
                options.push({value: selected, label: campaign.campaignName || selected})
        }
        return options
    },
    trackingCodes: (userScope, term, selected, p) => {
        if (!ec.user.hasPermission("MARKETING_VIEW") || !p.marketingCampaignId) return []
        const found = marketingProbe("mantle.marketing.TrackingServices.find#TrackingLinks", {
            marketingCampaignId: p.marketingCampaignId
        })
        return byTerm(
            Array.from(found?.trackingLinkList || []).map(row => ({value: row.trackingCodeId, label: row.label})),
            term
        )
    }
})
// ===== end of impl-marketing P13 =====
// ===== impl-sales follow-up 5: the facility a Sales order part ships from =====
// The warehouses, stores and plants an organization of the scope owns (Mantle's SalesApprovals.js facilityOptions, the same rule as
// store#SalesPolicy's default and update#SalesOrderFacility), for one who sets the defaults or changes a quote or an order.
const salesPolicies = () => ec.resource.script("component://mr-mantle/service/mantle/order/SalesApprovals.js")
Object.assign(choiceSources, {
    facilities: (userScope, term, selected, p) => {
        const organizationPartyId = choiceOrganization(userScope, p)
        const caps = userScope.capabilities
        if (!organizationPartyId || !(caps.configure || caps.orderEdit || caps.quoteEdit)) return []
        const options = Array.from(salesPolicies().facilityOptions(organizationPartyId, term, choiceLimit))
        return withSelected(
            options,
            selected,
            facilityId => !salesPolicies().facilityRefusal(organizationPartyId, facilityId),
            facilityId => salesPolicies().facilityName(facilityId)
        )
    }
})
// ===== end of impl-sales follow-up 5 =====
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
// P7: quotes, through Mantle's scoped find (find#Quotes' text: name or id), open ones
searchFinds.push({
    kind: "quote",
    rows: (userScope, text, limit) => {
        if (!userScope.capabilities.anyRead) return []
        const found = lib.probe("mantle.order.SalesQuoteServices.find#Quotes", {text, pageSize: limit})
        return Array.from(found.quoteList || []).map(row => ({
            title: row.orderName,
            subtitle: ["Quote " + row.orderId, row.customerName, row.statusText, row.totalText].filter(Boolean).join(" · "),
            icon: recordKinds.quote.icon,
            recordEntity: "mantle.order.OrderHeader",
            recordId: row.orderId,
            url: recordUrl("quote", row.orderId)
        }))
    }
})
// P8: requests for quote, through Mantle's scoped find (find#QuoteRequests' text: name or id), open ones
searchFinds.push({
    kind: "quoteRequest",
    rows: (userScope, text, limit) => {
        if (!userScope.capabilities.anyRead) return []
        const found = lib.probe("mantle.order.SalesQuoteServices.find#QuoteRequests", {text, pageSize: limit})
        return Array.from(found.quoteRequestList || []).map(row => ({
            title: row.requestName,
            subtitle: ["RFQ " + row.requestId, row.customerName, row.statusText].filter(Boolean).join(" · "),
            icon: recordKinds.quoteRequest.icon,
            recordEntity: "mantle.request.Request",
            recordId: row.requestId,
            url: recordUrl("quoteRequest", row.requestId)
        }))
    }
})
// P11: sales orders, through Mantle's scoped find (find#SalesOrders' text: id, name or the customer's reference), recent ones
searchFinds.push({
    kind: "order",
    rows: (userScope, text, limit) => {
        if (!userScope.capabilities.anyRead) return []
        const found = lib.probe("mantle.sales.SalesWorkspaceServices.find#SalesOrders", {text, pageSize: limit})
        return Array.from(found.orderList || []).map(row => ({
            title: row.orderName,
            subtitle: ["Order " + row.orderId, row.customerName, row.statusText, row.totalText].filter(Boolean).join(" · "),
            icon: recordKinds.order.icon,
            recordEntity: "mantle.order.OrderHeader",
            recordId: row.orderId,
            url: recordUrl("order", row.orderId)
        }))
    }
})
// ===== P15: the palette's agreements, through Mantle's scoped find (find#SalesAgreements' text: name or id), open ones
searchFinds.push({
    kind: "agreement",
    rows: (userScope, text, limit) => {
        if (!userScope.capabilities.anyRead) return []
        const found = lib.probe("mantle.party.SalesAgreementServices.find#SalesAgreements", {text, pageSize: limit})
        return Array.from(found.agreementList || []).map(row => ({
            title: row.description,
            subtitle: ["Agreement " + row.agreementId, row.customerName, row.statusText].filter(Boolean).join(" · "),
            icon: recordKinds.agreement.icon,
            recordEntity: "mantle.party.agreement.Agreement",
            recordId: row.agreementId,
            url: recordUrl("agreement", row.agreementId)
        }))
    }
})
// ===== end of P15 =====
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

// ===== P6: Today =====
// The Sales today-source (Commons' get#UserTodayItems calls it): the user's own open leads and opportunities whose expected close
// falls by thruDate (Mantle's find#Opportunities, mine), each opening OpportunityDetail with the deal as the record and no Mark
// done; the activities on deals are Commons' tasks and already in Today. Another user's Today, and a user who reads nothing of Sales,
// get none.
function today(p) {
    const label = "Sales"
    if (p.userId && p.userId !== ec.user.userId) return {items: [], label}
    const userScope = scope()
    if (!userScope.read || !userScope.capabilities.anyRead) return {items: [], label}
    const thru = p.thruDate ? lib.ms(p.thruDate) : null
    const found = lib.probe("mantle.sales.OpportunityServices.find#Opportunities", {
        mine: "Y",
        statusId: "SalesOppOpen",
        closeThru: thru != null ? ec.l10n.format(new Date(thru), "yyyy-MM-dd") : null,
        orderByField: "estimatedCloseDate",
        pageSize: 50
    })
    const items = []
    for (const row of Array.from(found.opportunityList || [])) {
        const due = lib.ms(row.estimatedCloseDate)
        if (due == null || (thru != null && due >= thru)) continue
        items.push({
            kind: "salesDeal",
            workEffortId: null,
            requestId: null,
            title:
                (row.typeText ? row.typeText + " " : "") + row.opportunityName + (row.accountName ? " · " + row.accountName : ""),
            dueDate: new Date(due),
            startDate: null,
            endDate: null,
            allDay: true,
            priority: null,
            statusId: row.statusId,
            assignees: [],
            canUpdate: false,
            hasCallLink: false,
            url: recordUrl("opportunity", row.salesOpportunityId),
            record: {
                recordEntityName: "mantle.sales.opportunity.SalesOpportunity",
                recordId: row.salesOpportunityId,
                recordName: row.opportunityName
            }
        })
    }
    return {items, label}
}

const operations = {sharedContext, checkRecord, choices, search, workItemContext, today}
function run(op, p) {
    if (!Object.hasOwn(operations, op)) throw new Error("Unknown Sales operation " + op)
    return operations[op](p || {})
}
;({execute: run, recordLink})
